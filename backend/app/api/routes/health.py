"""
Health Check Routes

Simple health check endpoints.
"""

from fastapi import APIRouter
from datetime import datetime

from app.models.responses import HealthResponse
from app.config import APP_NAME


router = APIRouter()


@router.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint."""
    return HealthResponse(
        status="healthy",
        timestamp=datetime.now().isoformat(),
        service=APP_NAME
    )
