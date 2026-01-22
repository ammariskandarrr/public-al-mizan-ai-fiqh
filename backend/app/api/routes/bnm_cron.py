"""
BNM Cron Routes

Endpoints for BNM announcements scraping and processing.
"""

from fastapi import APIRouter, HTTPException, BackgroundTasks
from datetime import datetime
import asyncio

from app.models.responses import CronResponse, StatusResponse
from app.services.scraper import scrape_bnm_announcements
from app.services.storage import check_document_exists, store_document_pages
from app.services.ocr import extract_text_from_pdf
from app.services.embeddings import generate_embeddings_batch
from app.utils.pdf_handler import download_pdf
from app.config import BATCH_EMBEDDING_SIZE


router = APIRouter()


# Global state for cron job status
cron_status = {
    "last_run": None,
    "status": "idle",
    "new_documents": 0,
    "processed": 0,
    "failed": 0,
    "message": "Not run yet"
}


async def process_new_document(date: str, title: str, doc_type: str, pdf_url: str) -> bool:
    """
    Process a new document through the full pipeline.
    
    Args:
        date: Document date
        title: Document title
        doc_type: Document type
        pdf_url: PDF URL
        
    Returns:
        True if successful, False otherwise
    """
    try:
        # Download PDF
        pdf_path = await download_pdf(pdf_url)
        if not pdf_path:
            return False
        
        # Extract text via OCR
        ocr_data = extract_text_from_pdf(pdf_path)
        if not ocr_data:
            pdf_path.unlink()
            return False
        
        # Prepare page data
        pages = ocr_data.get('pages', [])
        page_data_list = []
        
        for page in pages:
            page_number = page.get('index', 0) + 1
            markdown_content = page.get('markdown', '')
            
            if not markdown_content or len(markdown_content.strip()) < 50:
                continue
            
            page_data_list.append({
                'page_number': page_number,
                'content': markdown_content,
                'original_text': ocr_data.get('extractedText', ''),
                'page_info': page
            })
        
        if not page_data_list:
            pdf_path.unlink()
            return False
        
        # Generate embeddings in batches
        all_embeddings = []
        
        for i in range(0, len(page_data_list), BATCH_EMBEDDING_SIZE):
            batch = page_data_list[i:i + BATCH_EMBEDDING_SIZE]
            texts = [p['content'] for p in batch]
            embeddings = generate_embeddings_batch(texts)
            all_embeddings.extend(embeddings)
        
        # Store in Supabase
        pages_stored = store_document_pages(
            date=date,
            title=title,
            doc_type=doc_type,
            pdf_url=pdf_url,
            pages_data=page_data_list,
            embeddings=all_embeddings,
            ocr_data=ocr_data
        )
        
        # Clean up
        pdf_path.unlink()
        
        return pages_stored > 0
        
    except Exception as e:
        print(f"[ERROR] Processing failed: {str(e)}")
        return False


async def run_daily_scrape():
    """Main cron job function."""
    global cron_status
    
    cron_status["status"] = "running"
    cron_status["last_run"] = datetime.now().isoformat()
    cron_status["new_documents"] = 0
    cron_status["processed"] = 0
    cron_status["failed"] = 0
    
    try:
        # Scrape BNM website
        df = await scrape_bnm_announcements()
        
        if df.empty:
            cron_status["status"] = "completed"
            cron_status["message"] = "No data scraped from BNM website"
            return
        
        # Check for new documents
        new_docs = []
        
        for idx, row in df.iterrows():
            date = row['date']
            title = row['title']
            doc_type = row['type']
            links = row['links']
            
            # Check if already exists
            if check_document_exists(title, date):
                continue
            
            # New document found
            cron_status["new_documents"] += 1
            
            # Get PDF links
            pdf_links = [link for link in links if link.endswith('.pdf')]
            
            for pdf_url in pdf_links:
                new_docs.append((date, title, doc_type, pdf_url))
        
        # Process new documents
        for date, title, doc_type, pdf_url in new_docs:
            try:
                success = await process_new_document(date, title, doc_type, pdf_url)
                if success:
                    cron_status["processed"] += 1
                else:
                    cron_status["failed"] += 1
                    
                # Small delay
                await asyncio.sleep(2)
                
            except Exception as e:
                print(f"[ERROR] {str(e)}")
                cron_status["failed"] += 1
        
        # Update status
        cron_status["status"] = "completed"
        cron_status["message"] = f"Processed {cron_status['processed']} new documents, {cron_status['failed']} failed"
        
    except Exception as e:
        cron_status["status"] = "error"
        cron_status["message"] = f"Error: {str(e)}"


@router.post("/cron/bnm-announcements", response_model=CronResponse)
async def trigger_bnm_scrape(background_tasks: BackgroundTasks):
    """
    Trigger BNM announcements scraping and processing.
    
    This endpoint can be called by external cron services.
    """
    global cron_status
    
    # Check if already running
    if cron_status["status"] == "running":
        raise HTTPException(status_code=409, detail="Cron job already running")
    
    # Start background task
    background_tasks.add_task(run_daily_scrape)
    
    return CronResponse(
        status="started",
        message="BNM scraping job started in background",
        job_id=datetime.now().isoformat()
    )


@router.get("/cron/status", response_model=StatusResponse)
async def get_cron_status():
    """Get the status of the last cron job run."""
    return StatusResponse(**cron_status)
