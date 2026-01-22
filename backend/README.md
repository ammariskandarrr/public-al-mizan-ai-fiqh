# BNM Announcements Backend Service

FastAPI backend for daily BNM announcements scraping, OCR processing, and vector storage.

## Quick Start

```bash
# Install dependencies
cd backend
pip install -r requirements.txt
playwright install chromium

# Configure environment
# Edit .env file with your API keys

# Run the server
uvicorn app.main:app --reload --port 8000
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Service info |
| `/api/health` | GET | Health check |
| `/api/cron/bnm-announcements` | POST | Trigger scraping |
| `/api/cron/status` | GET | Check job status |

## Project Structure

```
backend/
├── app/
│   ├── main.py              # FastAPI application
│   ├── config.py            # Configuration
│   ├── api/routes/          # API endpoints
│   ├── services/            # Business logic
│   ├── models/              # Pydantic models
│   └── utils/               # Utilities
├── .env                     # Environment variables
└── requirements.txt         # Dependencies
```

## Environment Variables

```env
OPENAI_API_KEY=your_key
SUPABASE_URL=your_url
SUPABASE_SERVICE_ROLE_KEY=your_key
OCR_WEBHOOK_URL=your_webhook
BNM_URL=https://www.bnm.gov.my/banking-islamic-banking
```

## Cron Setup

Use external cron services to call `/api/cron/bnm-announcements` daily.
