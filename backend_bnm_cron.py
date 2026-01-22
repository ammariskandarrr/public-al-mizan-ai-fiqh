"""
FastAPI Backend - BNM Announcements Daily Cron Job

This FastAPI service provides:
1. Daily cron endpoint to scrape BNM announcements
2. Check for new documents (by title + date)
3. Process new PDFs through OCR pipeline
4. Generate embeddings and store in Supabase

Endpoints:
- POST /api/cron/bnm-announcements - Trigger daily scraping
- GET /api/cron/status - Check last run status
- GET /api/health - Health check

Usage:
    uvicorn backend_bnm_cron:app --reload --port 8000
    
    # Or with production settings
    uvicorn backend_bnm_cron:app --host 0.0.0.0 --port 8000 --workers 4
"""

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Optional
import asyncio
import os
import requests
from pathlib import Path
from datetime import datetime
from playwright.async_api import async_playwright
from bs4 import BeautifulSoup
import pandas as pd
from openai import OpenAI
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize FastAPI
app = FastAPI(
    title="BNM Announcements Cron Service",
    description="Daily scraping and processing of BNM announcements",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Constants
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_ACCESS_TOKEN")
OCR_WEBHOOK_URL = "https://n8n.ammariskandar-n8n.uk/webhook/b2f1db0b-ee85-4ca2-bfcd-313455373059"
EMBEDDING_MODEL = "text-embedding-3-large"
EMBEDDING_DIMENSIONS = 1536
BNM_URL = "https://www.bnm.gov.my/banking-islamic-banking"
TABLE_NAME = "bnm_announcements"
DOWNLOAD_DIR = Path("temp_bnm_downloads")

# Initialize clients
openai_client = OpenAI(api_key=OPENAI_API_KEY)
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Global state for cron job status
cron_status = {
    "last_run": None,
    "status": "idle",
    "new_documents": 0,
    "processed": 0,
    "failed": 0,
    "message": "Not run yet"
}


# Pydantic models
class CronResponse(BaseModel):
    status: str
    message: str
    job_id: Optional[str] = None


class StatusResponse(BaseModel):
    last_run: Optional[str]
    status: str
    new_documents: int
    processed: int
    failed: int
    message: str


# Helper functions
def check_if_exists(title: str, date: str) -> bool:
    """Check if document already exists in database."""
    try:
        result = supabase.table(TABLE_NAME).select("id").eq("title", title).eq("date", date).limit(1).execute()
        return len(result.data) > 0
    except:
        return False


async def scrape_bnm_announcements() -> pd.DataFrame:
    """Scrape BNM website for announcements."""
    try:
        async with async_playwright() as p:
            browser = await p.chromium.launch(
                headless=True,
                args=["--no-sandbox", "--disable-dev-shm-usage"]
            )
            
            page = await browser.new_page(
                user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            )
            
            await page.goto(BNM_URL, wait_until="networkidle", timeout=60000)
            await page.wait_for_selector("table#filta", timeout=60000)
            
            # Set table to show all entries
            await page.evaluate("""
                () => {
                    const table = $('#filta').DataTable();
                    table.page.len(149).draw();
                }
            """)
            
            await page.wait_for_timeout(3000)
            
            html = await page.content()
            await browser.close()
        
        # Parse HTML
        soup = BeautifulSoup(html, "html.parser")
        table = soup.find("table", id="filta")
        
        rows = []
        for tr in table.select("tbody tr"):
            tds = tr.find_all("td")
            rows.append({
                "date": tds[0].get_text(strip=True),
                "title": tds[1].get_text(" ", strip=True),
                "type": tds[2].get_text(strip=True),
                "links": [
                    a["href"] if a["href"].startswith("http")
                    else "https://www.bnm.gov.my" + a["href"]
                    for a in tds[1].find_all("a", href=True)
                ]
            })
        
        return pd.DataFrame(rows)
        
    except Exception as e:
        print(f"[ERROR] Scraping failed: {str(e)}")
        return pd.DataFrame()


async def download_pdf(url: str) -> Optional[Path]:
    """Download PDF using Playwright."""
    try:
        DOWNLOAD_DIR.mkdir(exist_ok=True)
        
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True, args=['--no-sandbox'])
            context = await browser.new_context(accept_downloads=True)
            page = await context.new_page()
            
            try:
                async with page.expect_download(timeout=30000) as download_info:
                    await page.goto(url, wait_until="networkidle", timeout=30000)
                
                download = await download_info.value
                filename = url.split('/')[-1]
                if not filename.endswith('.pdf'):
                    filename += '.pdf'
                
                filepath = DOWNLOAD_DIR / filename
                await download.save_as(filepath)
                
                if filepath.stat().st_size < 1000:
                    filepath.unlink()
                    await browser.close()
                    return None
                
                await browser.close()
                return filepath
                
            except:
                await browser.close()
                return None
                
    except:
        return None


def extract_text_from_pdf(pdf_path: Path) -> Optional[Dict]:
    """Extract text via n8n OCR webhook."""
    try:
        with open(pdf_path, 'rb') as f:
            files = {'data': (pdf_path.name, f, 'application/pdf')}
            response = requests.post(OCR_WEBHOOK_URL, files=files, timeout=180)
        
        response.raise_for_status()
        ocr_data = response.json()
        
        if isinstance(ocr_data, list) and len(ocr_data) > 0:
            ocr_data = ocr_data[0]
        
        return ocr_data
        
    except:
        return None


def get_embeddings_batch(texts: List[str]) -> List[List[float]]:
    """Generate embeddings in batch."""
    cleaned_texts = []
    for text in texts:
        cleaned = text.replace("\n", " ").strip()
        if len(cleaned) > 8000:
            cleaned = cleaned[:8000]
        cleaned_texts.append(cleaned)
    
    response = openai_client.embeddings.create(
        input=cleaned_texts,
        model=EMBEDDING_MODEL,
        dimensions=EMBEDDING_DIMENSIONS
    )
    
    return [item.embedding for item in response.data]


async def process_new_document(date: str, title: str, doc_type: str, pdf_url: str) -> bool:
    """Process a new document through the full pipeline."""
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
        batch_size = 10
        
        for i in range(0, len(page_data_list), batch_size):
            batch = page_data_list[i:i + batch_size]
            texts = [p['content'] for p in batch]
            embeddings = get_embeddings_batch(texts)
            all_embeddings.extend(embeddings)
        
        # Store in Supabase
        for page_data, embedding in zip(page_data_list, all_embeddings):
            try:
                source_metadata = {
                    "scraped_date": date,
                    "scraped_title": title,
                    "scraped_type": doc_type,
                    "source": "BNM Website - Daily Cron",
                    "source_url": BNM_URL,
                    "scraped_at": datetime.utcnow().isoformat()
                }
                
                metadata = {
                    "date": date,
                    "title": title,
                    "type": doc_type,
                    "page_number": page_data['page_number'],
                    "total_pages": len(pages),
                    "model": ocr_data.get('model', 'mistral-ocr'),
                    "header": page_data['page_info'].get('header', ''),
                    "footer": page_data['page_info'].get('footer', ''),
                    "dimensions": page_data['page_info'].get('dimensions', {}),
                    "tables_count": len(page_data['page_info'].get('tables', [])),
                    "images_count": len(page_data['page_info'].get('images', [])),
                    "hyperlinks_count": len(page_data['page_info'].get('hyperlinks', [])),
                    "processed_at": datetime.utcnow().isoformat()
                }
                
                data = {
                    "date": date,
                    "title": title,
                    "type": doc_type,
                    "pdf_url": pdf_url,
                    "page_number": page_data['page_number'],
                    "content": page_data['content'],
                    "original_text": page_data['original_text'],
                    "source_metadata": source_metadata,
                    "metadata": metadata,
                    "embedding": embedding
                }
                
                supabase.table(TABLE_NAME).insert(data).execute()
                
            except Exception as e:
                print(f"[ERROR] Failed to store page: {str(e)}")
        
        # Clean up
        pdf_path.unlink()
        
        return True
        
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
            if check_if_exists(title, date):
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


# API Endpoints
@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "service": "BNM Announcements Cron Service",
        "version": "1.0.0",
        "endpoints": {
            "cron": "/api/cron/bnm-announcements",
            "status": "/api/cron/status",
            "health": "/api/health"
        }
    }


@app.get("/api/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "service": "BNM Cron Service"
    }


@app.post("/api/cron/bnm-announcements", response_model=CronResponse)
async def trigger_bnm_scrape(background_tasks: BackgroundTasks):
    """
    Trigger BNM announcements scraping and processing.
    
    This endpoint can be called by:
    - External cron services (e.g., cron-job.org, EasyCron)
    - GitHub Actions
    - Vercel Cron
    - Manual trigger
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


@app.get("/api/cron/status", response_model=StatusResponse)
async def get_cron_status():
    """Get the status of the last cron job run."""
    return StatusResponse(**cron_status)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
