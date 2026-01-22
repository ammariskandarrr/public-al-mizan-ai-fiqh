"""
Configuration and Environment Variables

Centralized configuration for the BNM scraping service.
"""

import os
from pathlib import Path
from dotenv import load_dotenv

# Get the backend directory path
BACKEND_DIR = Path(__file__).parent.parent
ENV_PATH = BACKEND_DIR / ".env"

# Load environment variables from backend/.env
load_dotenv(dotenv_path=ENV_PATH)

# API Keys
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_ACCESS_TOKEN")

# External Services
OCR_WEBHOOK_URL = os.getenv("OCR_WEBHOOK_URL", "https://n8n.ammariskandar-n8n.uk/webhook/b2f1db0b-ee85-4ca2-bfcd-313455373059")

# BNM Settings
BNM_URL = os.getenv("BNM_URL", "https://www.bnm.gov.my/banking-islamic-banking")
TABLE_NAME = "bnm_announcements"

# OpenAI Settings
EMBEDDING_MODEL = "text-embedding-3-large"
EMBEDDING_DIMENSIONS = 1536
BATCH_EMBEDDING_SIZE = 10

# File Storage
DOWNLOAD_DIR = Path("temp_bnm_downloads")

# Application Settings
APP_NAME = "BNM Announcements Cron Service"
APP_VERSION = "1.0.0"
