"""
Analytics API Endpoints
Provides workflow analytics and statistics using PostgreSQL.
"""
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

from app.services.database import fetch_one, fetch_all


router = APIRouter()


class AnalyticsResponse(BaseModel):
    """Response schema for analytics data."""
    exam_id: int
    total_runs: int
    successful_runs: int
    failed_runs: int
    success_rate: float
    avg_duration_seconds: float
    otp_requests: int
    captcha_requests: int
    last_run_at: Optional[datetime]


class GlobalAnalytics(BaseModel):
    """Global analytics across all exams."""
    total_workflows: int
    successful_workflows: int
    failed_workflows: int
    active_sessions: int
    success_rate: float


@router.get("/global", response_model=GlobalAnalytics)
async def get_global_analytics():
    """Get global analytics across all exams."""
    # Count sessions by status
    stats = await fetch_one("""
        SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as successful,
            SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
            SUM(CASE WHEN status IN ('running', 'waiting_input', 'pending') THEN 1 ELSE 0 END) as active
        FROM automation_sessions
    """)
    
    total = stats.get("total", 0) or 0
    successful = stats.get("successful", 0) or 0
    failed = stats.get("failed", 0) or 0
    active = stats.get("active", 0) or 0
    
    return GlobalAnalytics(
        total_workflows=total,
        successful_workflows=successful,
        failed_workflows=failed,
        active_sessions=active,
        success_rate=successful / total if total > 0 else 0.0,
    )


@router.get("/exam/{exam_id}", response_model=AnalyticsResponse)
async def get_exam_analytics(exam_id: int):
    """Get analytics for a specific exam."""
    stats = await fetch_one("""
        SELECT 
            COUNT(*) as total_runs,
            SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as successful_runs,
            SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed_runs,
            MAX(completed_at) as last_run_at,
            AVG(EXTRACT(EPOCH FROM (COALESCE(completed_at, CURRENT_TIMESTAMP) - started_at))) as avg_duration
        FROM automation_sessions
        WHERE exam_id = $1
    """, exam_id)
    
    if not stats or stats.get("total_runs", 0) == 0:
        return AnalyticsResponse(
            exam_id=exam_id,
            total_runs=0,
            successful_runs=0,
            failed_runs=0,
            success_rate=0.0,
            avg_duration_seconds=0.0,
            otp_requests=0,
            captcha_requests=0,
            last_run_at=None
        )
    
    total = stats.get("total_runs", 0) or 0
    successful = stats.get("successful_runs", 0) or 0
    failed = stats.get("failed_runs", 0) or 0
    avg_duration = stats.get("avg_duration", 0) or 0
    
    return AnalyticsResponse(
        exam_id=exam_id,
        total_runs=total,
        successful_runs=successful,
        failed_runs=failed,
        success_rate=successful / total if total > 0 else 0.0,
        avg_duration_seconds=avg_duration,
        otp_requests=0,  # Would need to parse logs JSONB for this
        captcha_requests=0,
        last_run_at=stats.get("last_run_at")
    )


@router.get("/recent-sessions")
async def get_recent_sessions(limit: int = 10):
    """Get recent workflow sessions."""
    sessions = await fetch_all("""
        SELECT 
            s.id, s.exam_id, s.user_id, s.status, s.progress,
            s.created_at, s.completed_at, s.result_message,
            e.name as exam_name,
            u.name as user_name, u.email as user_email
        FROM automation_sessions s
        LEFT JOIN automation_exams e ON s.exam_id = e.id
        LEFT JOIN users u ON s.user_id = u.id
        ORDER BY s.created_at DESC
        LIMIT $1
    """, limit)
    
    return [
        {
            "id": str(s["id"]),
            "exam_id": s["exam_id"],
            "exam_name": s.get("exam_name"),
            "user_id": s["user_id"],
            "user_name": s.get("user_name"),
            "user_email": s.get("user_email"),
            "status": s["status"],
            "progress": s["progress"],
            "created_at": s["created_at"].isoformat() if s.get("created_at") else None,
            "completed_at": s["completed_at"].isoformat() if s.get("completed_at") else None,
            "result_message": s.get("result_message")
        }
        for s in sessions
    ]


@router.get("/exam/{exam_id}/sessions")
async def get_exam_sessions(exam_id: int, limit: int = 20):
    """Get recent sessions for a specific exam."""
    sessions = await fetch_all("""
        SELECT 
            s.id, s.user_id, s.status, s.progress,
            s.created_at, s.completed_at, s.result_message,
            u.name as user_name, u.email as user_email
        FROM automation_sessions s
        LEFT JOIN users u ON s.user_id = u.id
        WHERE s.exam_id = $1
        ORDER BY s.created_at DESC
        LIMIT $2
    """, exam_id, limit)
    
    return [
        {
            "id": str(s["id"]),
            "user_id": s["user_id"],
            "user_name": s.get("user_name"),
            "user_email": s.get("user_email"),
            "status": s["status"],
            "progress": s["progress"],
            "created_at": s["created_at"].isoformat() if s.get("created_at") else None,
            "completed_at": s["completed_at"].isoformat() if s.get("completed_at") else None,
            "result_message": s.get("result_message")
        }
        for s in sessions
    ]
