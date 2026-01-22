"""
Storage Service

Handles Supabase database operations.
"""

from typing import Dict, List
from datetime import datetime
from supabase import create_client, Client

from app.config import SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, TABLE_NAME


# Initialize Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)


def check_document_exists(title: str, date: str) -> bool:
    """
    Check if document already exists in database.
    
    Args:
        title: Document title
        date: Document date
        
    Returns:
        True if exists, False otherwise
    """
    try:
        result = supabase.table(TABLE_NAME).select("id").eq("title", title).eq("date", date).limit(1).execute()
        return len(result.data) > 0
    except:
        return False


def store_document_pages(
    date: str,
    title: str,
    doc_type: str,
    pdf_url: str,
    pages_data: List[Dict],
    embeddings: List[List[float]],
    ocr_data: Dict
) -> int:
    """
    Store document pages in Supabase.
    
    Args:
        date: Document date
        title: Document title
        doc_type: Document type
        pdf_url: PDF URL
        pages_data: List of page data dictionaries
        embeddings: List of embedding vectors
        ocr_data: OCR metadata
        
    Returns:
        Number of pages successfully stored
    """
    pages_stored = 0
    
    for page_data, embedding in zip(pages_data, embeddings):
        try:
            source_metadata = {
                "scraped_date": date,
                "scraped_title": title,
                "scraped_type": doc_type,
                "source": "BNM Website - FastAPI Cron",
                "source_url": "https://www.bnm.gov.my/banking-islamic-banking",
                "scraped_at": datetime.utcnow().isoformat()
            }
            
            metadata = {
                "date": date,
                "title": title,
                "type": doc_type,
                "page_number": page_data['page_number'],
                "total_pages": len(pages_data),
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
            pages_stored += 1
            
        except Exception as e:
            print(f"[ERROR] Failed to store page {page_data['page_number']}: {str(e)}")
    
    return pages_stored
