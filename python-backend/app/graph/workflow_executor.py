"""
Workflow Executor
Executes pre-recorded workflow steps without LLM calls.
Falls back to LLM on step failure.
"""
import asyncio
from typing import Any
from datetime import datetime

from app.graph.state import GraphState
from app.graph.workflow_schema import WorkflowStep
from app.api.websocket import (
    send_screenshot,
    send_log,
    send_status,
    request_otp,
    request_captcha,
)


# Stagehand URL (imported from nodes.py at runtime to avoid circular)
STAGEHAND_URL = None
TIMEOUT = 60.0


def _get_stagehand_url():
    """Lazy import to avoid circular dependency."""
    global STAGEHAND_URL
    if STAGEHAND_URL is None:
        from app.config import settings
        STAGEHAND_URL = settings.stagehand_url
    return STAGEHAND_URL


async def call_stagehand(endpoint: str, data: dict, timeout: float = TIMEOUT) -> dict:
    """Make HTTP call to TypeScript Stagehand backend."""
    import httpx
    try:
        async with httpx.AsyncClient(timeout=timeout) as client:
            response = await client.post(f"{_get_stagehand_url()}/api/{endpoint}", json=data)
            return response.json()
    except Exception as e:
        return {"success": False, "error": str(e)}


async def execute_workflow_step_node(state: GraphState) -> dict:
    """
    Execute a single pre-recorded workflow step.
    Returns to this node repeatedly until all steps complete.
    Falls back to LLM if step fails.
    """
    workflow_steps = state.get("workflow_steps", [])
    current_idx = state.get("current_workflow_step", 0)
    session_id = state["session_id"]
    
    # Check if workflow complete
    if current_idx >= len(workflow_steps):
        await send_log(session_id, "✅ Workflow complete!", "success")
        return {
            "status": "completed",
            "current_step": "workflow_complete",
            "progress": 100
        }
    
    step_data = workflow_steps[current_idx]
    step = WorkflowStep(**step_data) if isinstance(step_data, dict) else step_data
    
    await send_log(
        session_id, 
        f"📋 Step {step.step_number}/{len(workflow_steps)}: {step.action_type}", 
        "info"
    )
    progress = int((current_idx / len(workflow_steps)) * 90) + 10
    await send_status(session_id, f"step_{current_idx}", progress, f"Executing step {step.step_number}...")
    
    # Add delay before action (smooth execution)
    delay_seconds = step.delay_after_ms / 1000
    if delay_seconds > 0:
        await asyncio.sleep(delay_seconds)
    
    # Handle different action types
    if step.action_type == "wait_human":
        return await _handle_human_wait(state, step, current_idx)
    
    if step.action_type == "scroll":
        return await _handle_scroll(state, step, current_idx)
    
    if step.action_type == "screenshot":
        result = await call_stagehand("screenshot", {"sessionId": session_id})
        await send_screenshot(session_id, result.get("screenshot", ""), "capture")
        return {
            "current_workflow_step": current_idx + 1,
            "screenshot_base64": result.get("screenshot")
        }
    
    # For fill_field, click_button, click_checkbox - execute via Stagehand
    prompt = step.stagehand_prompt
    
    # Substitute value from user_data if needed
    if step.value_key and "{value}" in prompt:
        user_data = state.get("user_data", {})
        value = user_data.get(step.value_key, "")
        prompt = prompt.replace("{value}", str(value))
    
    await send_log(session_id, f"🎬 {prompt[:60]}...", "info")
    
    # Execute via Stagehand
    result = await call_stagehand("execute", {
        "sessionId": session_id,
        "action": "act",
        "prompt": prompt
    }, timeout=90.0)
    
    # Forward screenshot
    if result.get("screenshot"):
        await send_screenshot(session_id, result["screenshot"], "execute")
    
    if not result.get("success"):
        await send_log(session_id, f"⚠️ Step failed, using LLM fallback...", "warning")
        # Return with flag to trigger LLM fallback
        return {
            "current_workflow_step": current_idx,
            "workflow_step_failed": True,
            "last_error": result.get("error", "Step execution failed")
        }
    
    await send_log(session_id, f"✓ Step {step.step_number} complete", "success")
    
    # Add another delay after action to let page settle
    await asyncio.sleep(1.0)
    
    return {
        "current_workflow_step": current_idx + 1,
        "screenshot_base64": result.get("screenshot"),
        "progress": progress
    }


async def _handle_human_wait(state: GraphState, step: WorkflowStep, current_idx: int) -> dict:
    """Handle wait_human steps (OTP, captcha)."""
    session_id = state["session_id"]
    
    await send_log(session_id, f"⏸️ Waiting for user: {step.wait_reason or step.wait_type}", "warning")
    
    if step.wait_type == "otp":
        await request_otp(session_id)
    elif step.wait_type == "captcha":
        screenshot = state.get("screenshot_base64", "")
        await request_captcha(session_id, screenshot)
    
    return {
        "status": "waiting_input",
        "waiting_for_input_type": step.wait_type or "custom",
        "current_workflow_step": current_idx  # Stay on same step
    }


async def _handle_scroll(state: GraphState, step: WorkflowStep, current_idx: int) -> dict:
    """Handle scroll steps."""
    session_id = state["session_id"]
    direction = step.scroll_direction or "down"
    pixels = step.scroll_pixels or 300
    
    await send_log(session_id, f"📜 Scrolling {direction} {pixels}px", "info")
    
    # Execute scroll via Stagehand
    prompt = f"Scroll {direction} by approximately {pixels} pixels"
    result = await call_stagehand("execute", {
        "sessionId": session_id,
        "action": "act",
        "prompt": prompt
    })
    
    if result.get("screenshot"):
        await send_screenshot(session_id, result["screenshot"], "scroll")
    
    return {
        "current_workflow_step": current_idx + 1,
        "screenshot_base64": result.get("screenshot")
    }


def record_step_from_decision(
    state: GraphState,
    action_type: str,
    stagehand_prompt: str,
    field_name: str = None,
    value_key: str = None,
    wait_type: str = None,
    delay_ms: int = 1500
) -> list[dict]:
    """
    Record a workflow step during workflow creation.
    Returns updated recorded_steps list.
    """
    recorded_steps = list(state.get("recorded_steps", []))
    step_number = len(recorded_steps) + 1
    
    step = WorkflowStep(
        step_number=step_number,
        action_type=action_type,
        stagehand_prompt=stagehand_prompt,
        field_name=field_name,
        value_key=value_key or field_name,  # Default to field_name
        wait_type=wait_type,
        delay_after_ms=delay_ms,
        page_url=state.get("page_url", "")
    )
    
    recorded_steps.append(step.model_dump())
    return recorded_steps


async def save_workflow_to_exam(exam_id: int, recorded_steps: list[dict], admin_id: int = None) -> bool:
    """
    Save recorded workflow steps to the automation_exams table.
    """
    from app.services.database import Database
    import json
    
    try:
        workflow_data = {
            "version": 1,
            "steps": recorded_steps,
            "total_steps": len(recorded_steps),
            "created_at": datetime.utcnow().isoformat()
        }
        
        query = """
            UPDATE automation_exams 
            SET workflow_steps = $1::jsonb,
                workflow_status = 'active',
                workflow_version = COALESCE(workflow_version, 0) + 1,
                workflow_created_by = $2,
                workflow_created_at = CURRENT_TIMESTAMP,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $3
            RETURNING id
        """
        
        async with Database.connection() as conn:
            result = await conn.fetchrow(
                query, 
                json.dumps(workflow_data),
                admin_id,
                exam_id
            )
            return result is not None
            
    except Exception as e:
        print(f"Error saving workflow: {e}")
        return False
