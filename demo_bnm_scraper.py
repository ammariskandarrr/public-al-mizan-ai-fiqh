"""
BNM Announcement Scraper Demo
==============================
Simulates the full pipeline for demo purposes:
1. Scrape BNM announcements using Playwright
2. Download PDF (first one found)
3. Extract text via OCR
4. Generate embeddings
5. Print results to console (NO database storage)

Usage:
    python demo_bnm_scraper.py
"""

import asyncio
import os
import requests
from pathlib import Path
from datetime import datetime
from playwright.async_api import async_playwright
from bs4 import BeautifulSoup
import pandas as pd
from openai import OpenAI
from dotenv import load_dotenv
from typing import Optional, Dict, List
import json

# Load environment variables
load_dotenv()

# Constants
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
OCR_WEBHOOK_URL = "https://n8n.ammariskandar-n8n.uk/webhook/b2f1db0b-ee85-4ca2-bfcd-313455373059"
EMBEDDING_MODEL = "text-embedding-3-large"
EMBEDDING_DIMENSIONS = 1536
BNM_URL = "https://www.bnm.gov.my/banking-islamic-banking"
DOWNLOAD_DIR = Path("demo_temp_downloads")

# Initialize OpenAI client
openai_client = OpenAI(api_key=OPENAI_API_KEY)


def print_header(text: str):
    """Print formatted header."""
    print("\n" + "=" * 80)
    print(f"  {text}")
    print("=" * 80)


def print_section(text: str):
    """Print formatted section."""
    print("\n" + "-" * 80)
    print(f"  {text}")
    print("-" * 80)


async def scrape_bnm_announcements() -> pd.DataFrame:
    """Scrape BNM website for announcements."""
    print_section("STEP 1: Scraping BNM Website")
    print(f"URL: {BNM_URL}")
    
    try:
        async with async_playwright() as p:
            print("  → Launching browser...")
            browser = await p.chromium.launch(
                headless=True,
                args=["--no-sandbox", "--disable-dev-shm-usage"]
            )
            
            page = await browser.new_page(
                user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
            )
            
            print("  → Navigating to BNM website...")
            await page.goto(BNM_URL, wait_until="networkidle", timeout=60000)
            await page.wait_for_selector("table#filta", timeout=60000)
            
            print("  → Setting table to show all entries...")
            await page.evaluate("""
                () => {
                    const table = $('#filta').DataTable();
                    table.page.len(149).draw();
                }
            """)
            
            await page.wait_for_timeout(3000)
            
            print("  → Extracting HTML content...")
            html = await page.content()
            await browser.close()
        
        # Parse HTML
        print("  → Parsing table data...")
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
        
        df = pd.DataFrame(rows)
        print(f"  ✓ Successfully scraped {len(df)} announcements")
        
        return df
        
    except Exception as e:
        print(f"  ✗ ERROR: Scraping failed - {str(e)}")
        return pd.DataFrame()


async def download_pdf(url: str) -> Optional[Path]:
    """Download PDF using Playwright."""
    print_section("STEP 2: Downloading PDF")
    print(f"URL: {url}")
    
    try:
        DOWNLOAD_DIR.mkdir(exist_ok=True)
        
        async with async_playwright() as p:
            print("  → Launching browser for download...")
            browser = await p.chromium.launch(headless=True, args=['--no-sandbox'])
            context = await browser.new_context(accept_downloads=True)
            page = await context.new_page()
            
            try:
                print("  → Initiating download...")
                async with page.expect_download(timeout=30000) as download_info:
                    await page.goto(url, wait_until="networkidle", timeout=30000)
                
                download = await download_info.value
                filename = url.split('/')[-1]
                if not filename.endswith('.pdf'):
                    filename += '.pdf'
                
                filepath = DOWNLOAD_DIR / filename
                await download.save_as(filepath)
                
                file_size = filepath.stat().st_size
                print(f"  ✓ Downloaded: {filename} ({file_size:,} bytes)")
                
                if file_size < 1000:
                    print("  ✗ File too small, likely invalid")
                    filepath.unlink()
                    await browser.close()
                    return None
                
                await browser.close()
                return filepath
                
            except Exception as e:
                print(f"  ✗ Download failed: {str(e)}")
                await browser.close()
                return None
                
    except Exception as e:
        print(f"  ✗ ERROR: {str(e)}")
        return None


def extract_text_from_pdf(pdf_path: Path) -> Optional[Dict]:
    """Extract text via n8n OCR webhook."""
    print_section("STEP 3: OCR Text Extraction")
    print(f"File: {pdf_path.name}")
    
    try:
        print("  → Sending PDF to OCR service...")
        with open(pdf_path, 'rb') as f:
            files = {'data': (pdf_path.name, f, 'application/pdf')}
            response = requests.post(OCR_WEBHOOK_URL, files=files, timeout=180)
        
        response.raise_for_status()
        ocr_data = response.json()
        
        if isinstance(ocr_data, list) and len(ocr_data) > 0:
            ocr_data = ocr_data[0]
        
        pages = ocr_data.get('pages', [])
        total_text = ocr_data.get('extractedText', '')
        
        print(f"  ✓ OCR completed:")
        print(f"    - Total pages: {len(pages)}")
        print(f"    - Total characters: {len(total_text):,}")
        print(f"    - Model: {ocr_data.get('model', 'unknown')}")
        
        return ocr_data
        
    except Exception as e:
        print(f"  ✗ ERROR: OCR failed - {str(e)}")
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


async def process_document(date: str, title: str, doc_type: str, pdf_url: str):
    """Process a document through the full pipeline."""
    print_header(f"PROCESSING DOCUMENT: {title}")
    print(f"Date: {date}")
    print(f"Type: {doc_type}")
    
    try:
        # Download PDF
        pdf_path = await download_pdf(pdf_url)
        if not pdf_path:
            print("\n✗ FAILED: Could not download PDF")
            return
        
        # Extract text via OCR
        ocr_data = extract_text_from_pdf(pdf_path)
        if not ocr_data:
            print("\n✗ FAILED: OCR extraction failed")
            pdf_path.unlink()
            return
        
        # Prepare page data
        print_section("STEP 4: Processing Pages")
        pages = ocr_data.get('pages', [])
        page_data_list = []
        
        for page in pages:
            page_number = page.get('index', 0) + 1
            markdown_content = page.get('markdown', '')
            
            if not markdown_content or len(markdown_content.strip()) < 50:
                print(f"  ⊘ Skipping page {page_number} (insufficient content)")
                continue
            
            page_data_list.append({
                'page_number': page_number,
                'content': markdown_content,
                'original_text': ocr_data.get('extractedText', ''),
                'page_info': page
            })
            
            print(f"  ✓ Page {page_number}: {len(markdown_content)} characters")
        
        if not page_data_list:
            print("\n✗ FAILED: No valid pages found")
            pdf_path.unlink()
            return
        
        print(f"\n  Total valid pages: {len(page_data_list)}")
        
        # Generate embeddings
        print_section("STEP 5: Generating Embeddings")
        all_embeddings = []
        batch_size = 10
        
        for i in range(0, len(page_data_list), batch_size):
            batch = page_data_list[i:i + batch_size]
            texts = [p['content'] for p in batch]
            
            print(f"  → Processing batch {i//batch_size + 1} ({len(texts)} pages)...")
            embeddings = get_embeddings_batch(texts)
            all_embeddings.extend(embeddings)
            
            print(f"    ✓ Generated {len(embeddings)} embeddings")
        
        print(f"\n  Total embeddings generated: {len(all_embeddings)}")
        
        # Display results (NO DATABASE STORAGE)
        print_section("STEP 6: Results Summary (NO DB STORAGE)")
        
        for idx, (page_data, embedding) in enumerate(zip(page_data_list, all_embeddings)):
            print(f"\n  Page {page_data['page_number']}:")
            print(f"    - Content length: {len(page_data['content'])} chars")
            print(f"    - Embedding dimensions: {len(embedding)}")
            print(f"    - Embedding sample: [{embedding[0]:.6f}, {embedding[1]:.6f}, ...]")
            
            # Show content preview
            content_preview = page_data['content'][:200].replace('\n', ' ')
            print(f"    - Content preview: {content_preview}...")
            
            # Metadata that would be stored
            metadata = {
                "date": date,
                "title": title,
                "type": doc_type,
                "page_number": page_data['page_number'],
                "total_pages": len(pages),
                "model": ocr_data.get('model', 'mistral-ocr'),
                "processed_at": datetime.utcnow().isoformat()
            }
            print(f"    - Metadata: {json.dumps(metadata, indent=6)}")
        
        # Clean up
        pdf_path.unlink()
        print(f"\n  ✓ Cleaned up temporary file: {pdf_path.name}")
        
        print_header("✓ PROCESSING COMPLETED SUCCESSFULLY")
        
    except Exception as e:
        print(f"\n✗ ERROR: Processing failed - {str(e)}")


async def main():
    """Main demo function."""
    print_header("BNM ANNOUNCEMENT SCRAPER DEMO")
    print(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Scrape BNM website
    df = await scrape_bnm_announcements()
    
    if df.empty:
        print("\n✗ No data scraped. Exiting.")
        return
    
    # Display scraped data
    print_section("Scraped Announcements Preview")
    print(f"\nTotal announcements: {len(df)}")
    print("\nFirst 5 announcements:")
    for idx, row in df.head(5).iterrows():
        print(f"\n  {idx + 1}. {row['title']}")
        print(f"     Date: {row['date']}")
        print(f"     Type: {row['type']}")
        print(f"     Links: {len(row['links'])} link(s)")
        if row['links']:
            for link in row['links']:
                print(f"       - {link}")
    
    # Find first PDF to process
    print_section("Selecting Document for Demo")
    
    selected_doc = None
    for idx, row in df.iterrows():
        pdf_links = [link for link in row['links'] if link.endswith('.pdf')]
        if pdf_links:
            selected_doc = {
                'date': row['date'],
                'title': row['title'],
                'type': row['type'],
                'pdf_url': pdf_links[0]
            }
            print(f"\n  Selected: {row['title']}")
            print(f"  PDF URL: {pdf_links[0]}")
            break
    
    if not selected_doc:
        print("\n✗ No PDF documents found in announcements")
        return
    
    # Process the selected document
    await process_document(
        selected_doc['date'],
        selected_doc['title'],
        selected_doc['type'],
        selected_doc['pdf_url']
    )
    
    print_header("DEMO COMPLETED")
    print(f"Finished at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("\nNote: No data was stored in the database (demo mode)")


if __name__ == "__main__":
    asyncio.run(main())
