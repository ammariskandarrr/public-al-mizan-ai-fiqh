"""
Response Models

Pydantic models for API responses.
"""

from pydantic import BaseModel
from typing import Optional


class CronResponse(BaseModel):
    """Response for cron job trigger."""
    status: str
    message: str
    job_id: Optional[str] = None


class StatusResponse(BaseModel):
    """Response for cron job status."""
    last_run: Optional[str]
    status: str
    new_documents: int
    processed: int
    failed: int
    message: str


class HealthResponse(BaseModel):
    """Response for health check."""
    status: str
    timestamp: str
    service: str
