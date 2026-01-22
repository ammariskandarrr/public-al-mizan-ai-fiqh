"""
BNM Website Scraper Service

Handles scraping of BNM announcements from the website.
"""

import pandas as pd
from playwright.async_api import async_playwright
from bs4 import BeautifulSoup
from typing import Optional

from app.config import BNM_URL


async def scrape_bnm_announcements() -> pd.DataFrame:
    """
    Scrape BNM website for announcements.
    
    Returns:
        DataFrame with columns: date, title, type, links
    """
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
