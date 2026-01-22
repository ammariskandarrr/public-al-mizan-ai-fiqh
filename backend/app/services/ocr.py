"""
OCR Service

Handles PDF text extraction via n8n webhook.
"""

import requests
from pathlib import Path
from typing import Optional, Dict

from app.config import OCR_WEBHOOK_URL


def extract_text_from_pdf(pdf_path: Path) -> Optional[Dict]:
    """
    Extract text from PDF using n8n OCR webhook.
    
    Args:
        pdf_path: Path to PDF file
        
    Returns:
        OCR data dictionary or None if failed
    """
    try:
        with open(pdf_path, 'rb') as f:
            files = {'data': (pdf_path.name, f, 'application/pdf')}
            response = requests.post(
                OCR_WEBHOOK_URL,
                files=files,
                timeout=180
            )
        
        response.raise_for_status()
        ocr_data = response.json()
        
        # Handle list response
        if isinstance(ocr_data, list) and len(ocr_data) > 0:
            ocr_data = ocr_data[0]
        
        return ocr_data
        
    except Exception as e:
        print(f"[ERROR] OCR extraction failed: {str(e)}")
        return None
