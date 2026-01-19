"""
Workflow Schema Definition
Defines the structure for recorded workflow steps.
"""
from pydantic import BaseModel, Field
from typing import Optional, Literal, List
from datetime import datetime


class WorkflowStep(BaseModel):
    """A single step in a recorded workflow."""
    step_number: int = Field(description="Sequential step number (1-indexed)")
    action_type: Literal[
        "fill_field",
        "click_button", 
        "click_checkbox",
        "scroll",
        "wait_human",
        "screenshot"
    ] = Field(description="Type of action to perform")
    
    stagehand_prompt: str = Field(
        description="The exact natural language prompt for Stagehand's act() function"
    )
    
    # Field filling details
    field_name: Optional[str] = Field(
        default=None,
        description="Name of the field being filled (for fill_field actions)"
    )
    value_key: Optional[str] = Field(
        default=None,
        description="Key from user_data dictionary to get the value. Use '{value}' placeholder in prompt."
    )
    
    # Human intervention
    wait_type: Optional[Literal["otp", "captcha", "custom"]] = Field(
        default=None,
        description="Type of human input required (for wait_human actions)"
    )
    wait_reason: Optional[str] = Field(
        default=None,
        description="Reason for waiting (shown to user)"
    )
    
    # Scroll details
    scroll_direction: Optional[Literal["up", "down"]] = Field(
        default=None,
        description="Direction to scroll"
    )
    scroll_pixels: Optional[int] = Field(
        default=300,
        description="Number of pixels to scroll"
    )
    
    # Timing
    delay_after_ms: int = Field(
        default=1500,
        description="Milliseconds to wait after this action completes"
    )
    
    # Metadata
    page_url: Optional[str] = Field(
        default=None,
        description="URL of the page where this step was recorded"
    )
    screenshot_before: Optional[str] = Field(
        default=None,
        description="Base64 screenshot before action (for debugging)"
    )


class ExamWorkflow(BaseModel):
    """Complete workflow for an exam registration process."""
    exam_id: int = Field(description="ID of the automation_exams record")
    exam_slug: str = Field(description="Slug of the exam (e.g., 'upsc-nda')")
    
    version: int = Field(
        default=1,
        description="Workflow version number (incremented on re-recording)"
    )
    status: Literal["draft", "active", "deprecated"] = Field(
        default="draft",
        description="Workflow status"
    )
    
    steps: List[WorkflowStep] = Field(
        default_factory=list,
        description="Ordered list of workflow steps"
    )
    
    # Metadata
    total_steps: int = Field(
        default=0,
        description="Total number of steps in workflow"
    )
    estimated_duration_seconds: int = Field(
        default=0,
        description="Estimated time to execute workflow"
    )
    
    created_by_admin_id: Optional[int] = Field(
        default=None,
        description="Admin user who created this workflow"
    )
    created_at: str = Field(
        default_factory=lambda: datetime.utcnow().isoformat(),
        description="ISO timestamp of creation"
    )
    updated_at: Optional[str] = Field(
        default=None,
        description="ISO timestamp of last update"
    )
    
    def calculate_duration(self) -> int:
        """Calculate estimated duration based on step delays."""
        total_ms = sum(step.delay_after_ms for step in self.steps)
        # Add extra time for human input steps
        for step in self.steps:
            if step.action_type == "wait_human":
                total_ms += 30000  # 30s average for human input
        return total_ms // 1000
    
    def to_db_json(self) -> dict:
        """Convert to JSON for database storage."""
        self.total_steps = len(self.steps)
        self.estimated_duration_seconds = self.calculate_duration()
        return self.model_dump()


def create_workflow_step(
    step_number: int,
    action_type: str,
    stagehand_prompt: str,
    field_name: str = None,
    value_key: str = None,
    wait_type: str = None,
    delay_ms: int = 1500
) -> WorkflowStep:
    """Factory function to create a workflow step."""
    return WorkflowStep(
        step_number=step_number,
        action_type=action_type,
        stagehand_prompt=stagehand_prompt,
        field_name=field_name,
        value_key=value_key,
        wait_type=wait_type,
        delay_after_ms=delay_ms
    )
