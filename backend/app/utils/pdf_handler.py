"""
PDF Handler Utility

Handles PDF downloading using Playwright.
"""

from pathlib import Path
from typing import Optional
from playwright.async_api import async_playwright

from app.config import DOWNLOAD_DIR


async def download_pdf(url: str) -> Optional[Path]:
    """
    Download PDF using Playwright.
    
    Args:
        url: PDF URL to download
        
    Returns:
        Path to downloaded PDF or None if failed
    """
    try:
        # Ensure download directory exists
        DOWNLOAD_DIR.mkdir(exist_ok=True)
        
        async with async_playwright() as p:
            browser = await p.chromium.launch(
                headless=True,
                args=['--no-sandbox', '--disable-dev-shm-usage']
            )
            
            context = await browser.new_context(accept_downloads=True)
            page = await context.new_page()
            
            try:
                async with page.expect_download(timeout=30000) as download_info:
                    await page.goto(url, wait_until="networkidle", timeout=30000)
                
                download = await download_info.value
                
                # Generate filename
                filename = url.split('/')[-1]
                if not filename.endswith('.pdf'):
                    filename += '.pdf'
                
                filepath = DOWNLOAD_DIR / filename
                await download.save_as(filepath)
                
                # Validate file size
                if filepath.stat().st_size < 1000:
                    filepath.unlink()
                    await browser.close()
                    return None
                
                await browser.close()
                return filepath
                
            except Exception as e:
                print(f"[ERROR] Download failed: {str(e)}")
                await browser.close()
                return None
                
    except Exception as e:
        print(f"[ERROR] PDF handler error: {str(e)}")
        return None
