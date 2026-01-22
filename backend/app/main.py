"""
FastAPI Main Application

Entry point for the BNM announcements cron service.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import APP_NAME, APP_VERSION
from app.api.routes import health, bnm_cron


# Initialize FastAPI app
app = FastAPI(
    title=APP_NAME,
    description="Daily scraping and processing of BNM announcements",
    version=APP_VERSION
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health.router, prefix="/api", tags=["Health"])
app.include_router(bnm_cron.router, prefix="/api", tags=["BNM Cron"])


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "service": APP_NAME,
        "version": APP_VERSION,
        "endpoints": {
            "health": "/api/health",
            "cron_trigger": "/api/cron/bnm-announcements",
            "cron_status": "/api/cron/status"
        }
    }
