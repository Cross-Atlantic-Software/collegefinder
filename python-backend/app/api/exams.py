"""
Exam API Endpoints
CRUD operations for automation exam configurations using PostgreSQL.
"""
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from typing import Optional, Any
from datetime import datetime
import json

from app.services.database import fetch_one, fetch_all, execute, Database


router = APIRouter()


# ============= Request/Response Schemas =============

class FieldConfig(BaseModel):
    """Configuration for a single form field."""
    type: str = "text"  # text, phone, email, select, date, otp, captcha
    required: bool = True
    options: Optional[list[str]] = None
    stagehand_action: Optional[str] = None


class AgentConfig(BaseModel):
    """LangGraph agent configuration."""
    max_retries: int = 3
    screenshot_interval_ms: int = 1000
    human_intervention_timeout_seconds: int = 300
    success_patterns: list[str] = []
    error_patterns: list[str] = []
    captcha: dict = {"auto_solve_enabled": False, "provider": "manual", "timeout_seconds": 30}


class ExamCreate(BaseModel):
    """Schema for creating a new exam."""
    name: str
    slug: str
    url: str
    is_active: bool = True
    field_mappings: dict[str, Any] = {}
    agent_config: Optional[AgentConfig] = None
    notify_on_complete: bool = True
    notify_on_failure: bool = True
    notification_emails: list[str] = []


class ExamUpdate(BaseModel):
    """Schema for updating an exam."""
    name: Optional[str] = None
    url: Optional[str] = None
    is_active: Optional[bool] = None
    field_mappings: Optional[dict[str, Any]] = None
    agent_config: Optional[AgentConfig] = None
    notify_on_complete: Optional[bool] = None
    notify_on_failure: Optional[bool] = None
    notification_emails: Optional[list[str]] = None


class ExamResponse(BaseModel):
    """Schema for exam response."""
    id: int
    name: str
    slug: str
    url: str
    is_active: bool
    field_mappings: dict[str, Any]
    agent_config: dict[str, Any]
    notify_on_complete: bool
    notify_on_failure: bool
    notification_emails: list[str]
    created_at: datetime
    updated_at: datetime


def row_to_exam_response(row: dict) -> ExamResponse:
    """Convert database row to ExamResponse."""
    return ExamResponse(
        id=row["id"],
        name=row["name"],
        slug=row["slug"],
        url=row["url"],
        is_active=row["is_active"],
        field_mappings=row["field_mappings"] or {},
        agent_config=row["agent_config"] or {},
        notify_on_complete=row["notify_on_complete"],
        notify_on_failure=row["notify_on_failure"],
        notification_emails=row["notification_emails"] or [],
        created_at=row["created_at"],
        updated_at=row["updated_at"],
    )


# ============= Endpoints =============

@router.get("/", response_model=list[ExamResponse])
async def list_exams(active_only: bool = False):
    """List all exams."""
    if active_only:
        query = "SELECT * FROM automation_exams WHERE is_active = TRUE ORDER BY created_at DESC"
    else:
        query = "SELECT * FROM automation_exams ORDER BY created_at DESC"
    
    rows = await fetch_all(query)
    return [row_to_exam_response(row) for row in rows]


@router.get("/{exam_id}", response_model=ExamResponse)
async def get_exam(exam_id: int):
    """Get a specific exam by ID."""
    row = await fetch_one("SELECT * FROM automation_exams WHERE id = $1", exam_id)
    if not row:
        raise HTTPException(status_code=404, detail="Exam not found")
    return row_to_exam_response(row)


@router.get("/slug/{slug}", response_model=ExamResponse)
async def get_exam_by_slug(slug: str):
    """Get a specific exam by slug."""
    row = await fetch_one("SELECT * FROM automation_exams WHERE slug = $1", slug)
    if not row:
        raise HTTPException(status_code=404, detail="Exam not found")
    return row_to_exam_response(row)


@router.post("/", response_model=ExamResponse, status_code=status.HTTP_201_CREATED)
async def create_exam(data: ExamCreate):
    """Create a new exam configuration."""
    # Check if slug already exists
    existing = await fetch_one("SELECT id FROM automation_exams WHERE slug = $1", data.slug)
    if existing:
        raise HTTPException(
            status_code=400,
            detail=f"Exam with slug '{data.slug}' already exists"
        )
    
    # Prepare agent config
    agent_config = data.agent_config.model_dump() if data.agent_config else AgentConfig().model_dump()
    
    # Insert exam
    query = """
        INSERT INTO automation_exams (
            name, slug, url, is_active, field_mappings, agent_config,
            notify_on_complete, notify_on_failure, notification_emails
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
    """
    
    async with Database.connection() as conn:
        row = await conn.fetchrow(
            query,
            data.name,
            data.slug,
            data.url,
            data.is_active,
            json.dumps(data.field_mappings),
            json.dumps(agent_config),
            data.notify_on_complete,
            data.notify_on_failure,
            data.notification_emails,
        )
    
    return row_to_exam_response(dict(row))


@router.put("/{exam_id}", response_model=ExamResponse)
async def update_exam(exam_id: int, data: ExamUpdate):
    """Update an existing exam."""
    # Check if exam exists
    existing = await fetch_one("SELECT * FROM automation_exams WHERE id = $1", exam_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Exam not found")
    
    # Build update query dynamically
    update_fields = []
    values = []
    param_count = 1
    
    if data.name is not None:
        update_fields.append(f"name = ${param_count}")
        values.append(data.name)
        param_count += 1
    
    if data.url is not None:
        update_fields.append(f"url = ${param_count}")
        values.append(data.url)
        param_count += 1
    
    if data.is_active is not None:
        update_fields.append(f"is_active = ${param_count}")
        values.append(data.is_active)
        param_count += 1
    
    if data.field_mappings is not None:
        update_fields.append(f"field_mappings = ${param_count}")
        values.append(json.dumps(data.field_mappings))
        param_count += 1
    
    if data.agent_config is not None:
        update_fields.append(f"agent_config = ${param_count}")
        values.append(json.dumps(data.agent_config.model_dump()))
        param_count += 1
    
    if data.notify_on_complete is not None:
        update_fields.append(f"notify_on_complete = ${param_count}")
        values.append(data.notify_on_complete)
        param_count += 1
    
    if data.notify_on_failure is not None:
        update_fields.append(f"notify_on_failure = ${param_count}")
        values.append(data.notify_on_failure)
        param_count += 1
    
    if data.notification_emails is not None:
        update_fields.append(f"notification_emails = ${param_count}")
        values.append(data.notification_emails)
        param_count += 1
    
    if not update_fields:
        # No updates, return existing
        return row_to_exam_response(existing)
    
    # Add updated_at
    update_fields.append("updated_at = CURRENT_TIMESTAMP")
    
    # Add exam_id as last parameter
    values.append(exam_id)
    
    query = f"""
        UPDATE automation_exams 
        SET {', '.join(update_fields)}
        WHERE id = ${param_count}
        RETURNING *
    """
    
    async with Database.connection() as conn:
        row = await conn.fetchrow(query, *values)
    
    return row_to_exam_response(dict(row))


@router.delete("/{exam_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_exam(exam_id: int):
    """Delete an exam."""
    existing = await fetch_one("SELECT id FROM automation_exams WHERE id = $1", exam_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Exam not found")
    
    await execute("DELETE FROM automation_exams WHERE id = $1", exam_id)
    return None


@router.post("/{exam_id}/toggle", response_model=ExamResponse)
async def toggle_exam_status(exam_id: int):
    """Toggle exam active status."""
    existing = await fetch_one("SELECT * FROM automation_exams WHERE id = $1", exam_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Exam not found")
    
    query = """
        UPDATE automation_exams 
        SET is_active = NOT is_active, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING *
    """
    
    async with Database.connection() as conn:
        row = await conn.fetchrow(query, exam_id)
    
    return row_to_exam_response(dict(row))
