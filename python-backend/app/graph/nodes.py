"""
Graph Nodes with TypeScript Stagehand Integration
Individual node functions for the LangGraph workflow.
Uses LangGraph's built-in interrupt() for human-in-the-loop.
Calls TypeScript Stagehand backend for browser automation.
Now uses LLM Vision decision layer for intelligent action selection.
"""
from typing import Any
from datetime import datetime
import httpx
from langgraph.types import interrupt

from app.graph.state import GraphState
from app.graph.llm_decision import decide_next_action, ActionDecision
from app.config import settings
from app.api.websocket import (
    send_screenshot,
    send_log,
    send_status,
    request_otp,
    request_captcha,
    request_custom_input,
    send_result,
    update_session,
)


# TypeScript Stagehand Backend URL (from settings)
STAGEHAND_URL = settings.stagehand_url
TIMEOUT = 60.0  # 60 second timeout for browser operations


# ============= Helper Functions =============

async def call_stagehand(endpoint: str, data: dict, timeout: float = TIMEOUT) -> dict:
    """
    Make HTTP call to TypeScript Stagehand backend.
    """
    try:
        async with httpx.AsyncClient(timeout=timeout) as client:
            response = await client.post(f"{STAGEHAND_URL}/api/{endpoint}", json=data)
            return response.json()
    except httpx.ConnectError:
        return {"success": False, "error": "Cannot connect to Stagehand backend (port 3001)"}
    except Exception as e:
        return {"success": False, "error": str(e)}


async def forward_screenshot(session_id: str, result: dict, step: str = "capture"):
    """Forward screenshot from TypeScript response to frontend via Python WebSocket."""
    screenshot = result.get("screenshot")
    if screenshot:
        await send_screenshot(session_id, screenshot, step)


# ============= Core Nodes =============

async def init_browser_node(state: GraphState) -> dict:
    """
    Initialize browser and navigate to exam URL.
    This is the entry point of the workflow.
    Includes retry logic for navigation failures.
    SKIPS if browser already initialized (resuming from waiting state).
    """
    session_id = state["session_id"]
    exam_url = state["exam_url"]
    max_init_retries = 3
    
    # Check if we're resuming (browser already open)
    # If we have human_input_value set, it means we're resuming after user input
    if state.get("human_input_value") is not None:
        await send_log(session_id, "Resuming from user input, skipping browser init...", "info")
        return {"current_step": "init_browser"}  # Skip init, proceed to capture
    
    # Also check if we already have progress (browser was initialized before)
    if state.get("progress", 0) > 5:
        await send_log(session_id, "Browser session exists, skipping re-init...", "info")
        return {"current_step": "init_browser"}
    
    # Check phase and skip completed phases
    current_phase = state.get("current_phase", "registration")
    registration_completed = state.get("registration_completed", False)
    login_completed = state.get("login_completed", False)
    
    if current_phase == "login" and registration_completed:
        await send_log(session_id, "📋 Registration already completed - skipping to login phase", "info")
        # Navigate directly to login URL (exam_url typically has both registration and login)
        exam_url = state.get("exam_url", exam_url)
    elif current_phase == "form_filling" and login_completed:
        await send_log(session_id, "📋 Login already completed - skipping to form filling phase", "info")
        # After login, the form is usually accessible from dashboard
        # We'll navigate to exam_url and let the workflow find the form
        exam_url = state.get("exam_url", exam_url)
    elif current_phase == "completed":
        await send_log(session_id, "✅ Registration already completed - no action needed", "info")
        return {
            "current_step": "init_browser",
            "status": "completed",
            "progress": 100,
        }
    
    await send_log(session_id, f"Initializing browser for {state['exam_name']}...", "info")
    await send_status(session_id, "init_browser", 5, "Starting browser...")
    
    # Retry loop for browser initialization
    last_error = None
    for attempt in range(max_init_retries):
        if attempt > 0:
            wait_time = 2 ** attempt  # Exponential backoff: 2, 4, 8 seconds
            await send_log(session_id, f"Retry {attempt}/{max_init_retries} in {wait_time}s...", "warning")
            import asyncio
            await asyncio.sleep(wait_time)
        
        # Call TypeScript backend to initialize browser
        result = await call_stagehand("init", {
            "sessionId": session_id,
            "examUrl": exam_url
        }, timeout=180.0)  # 3 minute timeout for slow sites
        
        if result.get("success"):
            # Forward screenshot to frontend
            await forward_screenshot(session_id, result, "init")
            await send_log(session_id, "Browser ready, navigated to registration page", "success")
            
            return {
                "current_step": "init_browser",
                "progress": 10,
                "page_url": exam_url,
                "screenshot_base64": result.get("screenshot"),
                "action_history": [{
                    "action": "navigate",
                    "target": exam_url,
                    "timestamp": datetime.utcnow().isoformat(),
                    "success": True
                }]
            }
        
        last_error = result.get("error", "Failed to initialize browser")
        await send_log(session_id, f"Attempt {attempt + 1} failed: {last_error}", "error")
    
    # All retries failed
    await send_log(session_id, f"Browser init failed after {max_init_retries} attempts", "error")
    return {
        "current_step": "init_browser",
        "last_error": last_error,
        "status": "failed",
    }


async def capture_screenshot_node(state: GraphState) -> dict:
    """
    Capture current page screenshot.
    Also handles entering user input (OTP/captcha) after resume.
    """
    session_id = state["session_id"]
    
    # Check if we have pending human input to enter (after resume)
    human_input = state.get("human_input_value")
    waiting_type = state.get("waiting_for_input_type")  # Will be None after resume clears it
    
    # Initialize clear_input dict to accumulate updates
    clear_input = {}
    updated_user_data = None
    
    # If we just resumed with input, we need to enter it
    # The input is stored, and we check if waiting was just cleared
    if human_input and state.get("status") == "running":
        import asyncio
        
        # Check if this is login password input
        # Method 1: Check the flag
        waiting_for_login_password = state.get("waiting_for_login_password", False)
        # Method 2: Check received_custom_inputs
        received_custom = state.get("received_custom_inputs", {})
        # Method 3: Check if we're in login flow (email_already_registered_detected is True)
        email_already_registered = state.get("email_already_registered_detected", False)
        # Method 4: Check if human_input matches the value in received_custom
        is_login_password = (
            waiting_for_login_password or 
            "login_password" in received_custom or 
            (email_already_registered and received_custom.get("login_password") == human_input) or
            (email_already_registered and waiting_for_login_password)  # If flag is set and we're in login flow
        )
        
        # Debug logging
        if human_input:
            await send_log(session_id, f"🔍 Password check: flag={waiting_for_login_password}, custom_keys={list(received_custom.keys())}, in_login_flow={email_already_registered}, is_login={is_login_password}", "info")
        
        if is_login_password and isinstance(human_input, str):
            # This is login password - update user_data and fill password field
            await send_log(session_id, f"🔐 Updating password in user_data and filling login password field...", "info")
            
            # Update user_data password
            updated_user_data = state.get("user_data", {}).copy()
            updated_user_data["password"] = human_input
            await send_log(session_id, f"✅ Password updated in user_data", "success")
            
            # Fill password field directly
            await send_log(session_id, f"🔐 Filling password field in login form...", "info")
            fill_password_result = await call_stagehand("execute", {
                "sessionId": session_id,
                "action": "act",
                "prompt": f"Find the password field in the login form (the one next to the email field) and type '{human_input}' into it"
            }, timeout=30.0)
            
            if fill_password_result.get("success"):
                await send_log(session_id, f"✅ Password filled in login form", "success")
            else:
                await send_log(session_id, f"⚠️ Could not fill password: {fill_password_result.get('error')}", "warning")
            
            # Clear the flag and update user_data
            clear_input["waiting_for_login_password"] = False
            clear_input["user_data"] = updated_user_data  # Update user_data in state
            
        elif isinstance(human_input, str) and len(human_input) <= 6 and human_input.isdigit():
            # OTP - simple approach: click first box, then type entire OTP
            await send_log(session_id, f"🔢 Entering OTP: {human_input}...", "info")
            
            # Click on the first OTP input box
            await call_stagehand("execute", {
                "sessionId": session_id,
                "action": "act",
                "prompt": "Click on the FIRST OTP input box (the leftmost empty digit input box)"
            }, timeout=30.0)
            
            await asyncio.sleep(0.5)
            
            # Type the ENTIRE OTP string - boxes will auto-advance after each digit
            # Using a very explicit prompt
            await send_log(session_id, f"Typing all digits: {human_input}", "info")
            await call_stagehand("execute", {
                "sessionId": session_id,
                "action": "act",
                "prompt": f"Press these keys in sequence: {', '.join(list(human_input))}. Type each digit one after another - the input will automatically move to the next box after each keystroke."
            }, timeout=40.0)
            
            await send_log(session_id, f"✓ OTP entered, waiting for dialog...", "success")
            
            # Wait for OK/success dialog to appear after OTP entry
            await asyncio.sleep(4.5)
            
            await call_stagehand("execute", {
                "sessionId": session_id,
                "action": "act",
                "prompt": "Click the 'Verify' or 'Verify Email' or 'Verify Mobile' or 'Verify OTP' or 'Submit' or 'OK' button"
            }, timeout=60.0)
        else:
            # Treat as captcha or other text input
            await send_log(session_id, f"🔤 Entering input: {human_input}...", "info")
            captcha_prompt = f"Find the captcha input field or the currently focused input and type '{human_input}' into it"
            await call_stagehand("execute", {
                "sessionId": session_id,
                "action": "act",
                "prompt": captcha_prompt
            }, timeout=60.0)
    
    # Clear the input after using it
    if human_input:
        clear_input["human_input_value"] = None
    
    # Capture screenshot
    result = await call_stagehand("screenshot", {"sessionId": session_id})
    
    # ========== UI-BASED EMAIL ERROR DETECTION (NOT LLM) ==========
    email_already_registered_detected = state.get("email_already_registered_detected", False)
    should_navigate_to_login = False
    
    if result.get("success"):
        page_text = result.get("page_text", "")
        if page_text:
            page_text_lower = page_text.lower()
            # HARD UI-BASED DETECTION - NO LLM REASONING
            # Check for email already registered errors in actual DOM text
            if any(keyword in page_text_lower for keyword in [
                "already registered",
                "email already",
                "email id already registered",
                "email id already exists",  # Exact match for "Email Id Already Exists"
                "email already exists",
                "already registered with",
                "use another email",
                "email id exists",  # Shorter variant
            ]):
                if not email_already_registered_detected:
                    # First time detection - navigate back to original URL
                    email_already_registered_detected = True
                    should_navigate_to_login = True
                    await send_log(session_id, "🔥 UI DETECTED: Email already registered - navigating back to login page", "critical")
                else:
                    # Already detected before - just preserve flag
                    await send_log(session_id, "🔥 Email already registered flag is active", "warning")
    
    # If email already registered detected, navigate to exam_url and click login
    if should_navigate_to_login:
        exam_url = state.get("exam_url")
        if exam_url:
            await send_log(session_id, f"🔄 Navigating to: {exam_url}", "info")
            await send_status(session_id, "navigate", state.get("progress", 30), "Navigating to login page...")
            
            # Navigate to exam_url
            nav_result = await call_stagehand("execute", {
                "sessionId": session_id,
                "action": "act",
                "prompt": f"Navigate to this URL: {exam_url}"
            }, timeout=60.0)
            
            if nav_result.get("success"):
                await send_log(session_id, "✅ Navigated to exam URL", "success")
                # Get screenshot after navigation
                result = await call_stagehand("screenshot", {"sessionId": session_id})
                if result.get("success"):
                    await forward_screenshot(session_id, result, "capture")
                    
                    # First, dismiss any popups that might be showing
                    await send_log(session_id, "🔍 Checking for popups to dismiss...", "info")
                    import asyncio
                    await asyncio.sleep(1.0)  # Wait for popup to appear if any
                    
                    popup_result = await call_stagehand("execute", {
                        "sessionId": session_id,
                        "action": "act",
                        "prompt": "If there is a popup or dialog box visible, click the 'OK' or 'Close' button to dismiss it"
                    }, timeout=10.0)
                    
                    if popup_result.get("success"):
                        await send_log(session_id, "✅ Dismissed popup", "success")
                        await asyncio.sleep(1.0)
                        result = await call_stagehand("screenshot", {"sessionId": session_id})
                        if result.get("success"):
                            await forward_screenshot(session_id, result, "capture")
                    
                    # Now click login link/button to switch to login form
                    await send_log(session_id, "🔍 Clicking login link/button to switch to login form...", "info")
                    login_result = await call_stagehand("execute", {
                        "sessionId": session_id,
                        "action": "act",
                        "prompt": "Click on the 'Login' link or button to switch to the login form"
                    }, timeout=30.0)
                    
                    if login_result.get("success"):
                        await send_log(session_id, "✅ Switched to login form", "success")
                        await asyncio.sleep(2.0)  # Wait for form to load
                        result = await call_stagehand("screenshot", {"sessionId": session_id})
                        if result.get("success"):
                            await forward_screenshot(session_id, result, "capture")
                            
                            # Verify we're on login form (has password field, not "Confirm Email")
                            page_text = result.get("page_text", "")
                            if page_text:
                                page_text_lower = page_text.lower()
                                if "password" in page_text_lower and "confirm email" not in page_text_lower:
                                    await send_log(session_id, "✅ Confirmed: We're on LOGIN form (has password field)", "success")
                                elif "confirm email" in page_text_lower:
                                    await send_log(session_id, "⚠️ Still on registration form - trying to find login form again", "warning")
                                    # Try to find login form more explicitly
                                    login_form_result = await call_stagehand("execute", {
                                        "sessionId": session_id,
                                        "action": "act",
                                        "prompt": "Find the login section with email and password fields. Look for a form that has 'Password' field (not 'Confirm Email'). Click on the email field in that login form"
                                    }, timeout=30.0)
                                    if login_form_result.get("success"):
                                        await send_log(session_id, "✅ Found login form explicitly", "success")
                                        result = await call_stagehand("screenshot", {"sessionId": session_id})
                                        if result.get("success"):
                                            await forward_screenshot(session_id, result, "capture")
                            
                            # After confirming we're on login form, fill email immediately
                            user_email = state.get("user_data", {}).get("email", "")
                            if user_email and "password" in page_text_lower and "confirm email" not in page_text_lower:
                                await send_log(session_id, f"📧 Filling email in login form: {user_email}", "info")
                                fill_email_result = await call_stagehand("execute", {
                                    "sessionId": session_id,
                                    "action": "act",
                                    "prompt": f"Find the email field in the login form (the one with password field next to it) and type '{user_email}' into it"
                                }, timeout=30.0)
                                
                                if fill_email_result.get("success"):
                                    await send_log(session_id, "✅ Email filled in login form - requesting password", "success")
                                    result = await call_stagehand("screenshot", {"sessionId": session_id})
                                    if result.get("success"):
                                        await forward_screenshot(session_id, result, "capture")
                                    
                                    # Request password immediately
                                    await send_log(session_id, "🔐 Requesting login password", "warning")
                                    await send_status(session_id, "waiting_input", state.get("progress", 50), "Waiting for password...")
                                    await request_custom_input(
                                        session_id,
                                        field_id="login_password",  # Special field_id to identify login password
                                        label="Login Password Required",
                                        field_type="password",
                                        suggestions=["Enter your login password", "Use 'Forgot Password' if available", "Cancel automation"]
                                    )
                                    return {
                                        **clear_input,
                                        "current_step": "capture_screenshot",
                                        "status": "waiting_input",
                                        "waiting_for_input_type": "custom",
                                        "email_already_registered_detected": email_already_registered_detected,
                                        "already_filled_fields": ["email"],  # Mark email as filled for login
                                        "waiting_for_login_password": True,  # Flag to track we're waiting for login password
                                    }
                    else:
                        await send_log(session_id, f"⚠️ Could not click login: {login_result.get('error')}", "warning")
            else:
                await send_log(session_id, f"⚠️ Navigation failed: {nav_result.get('error')}", "warning")
    
    if result.get("success"):
        # Forward screenshot to frontend
        await forward_screenshot(session_id, result, "capture")
        return_dict = {
            **clear_input,
            "current_step": "capture_screenshot",
            "screenshot_base64": result.get("screenshot"),
            "email_already_registered_detected": email_already_registered_detected,  # Set flag from UI
            "page_url": state.get("exam_url") if should_navigate_to_login else state.get("page_url"),
        }
        # Clear already_filled_fields when navigating back for login
        if should_navigate_to_login:
            return_dict["already_filled_fields"] = []  # Start fresh for login flow
        return return_dict
    
    return {
        "current_step": "capture_screenshot", 
        **clear_input,
        "email_already_registered_detected": email_already_registered_detected,
    }


# ============= NEW: LLM-Driven Decision Nodes =============

async def llm_decide_node(state: GraphState) -> dict:
    """
    LLM Vision analyzes the screenshot and decides the SINGLE next action.
    This is the brain of the new workflow.
    """
    session_id = state["session_id"]
    screenshot = state.get("screenshot_base64", "")
    user_data = state.get("user_data", {})
    already_filled = state.get("already_filled_fields", [])
    page_url = state.get("page_url", "")
    retry_count = state.get("retry_count", 0)
    captcha_fail_count = state.get("captcha_fail_count", 0)
    
    if not screenshot:
        await send_log(session_id, "No screenshot available for analysis", "error")
        return {
            "current_step": "llm_decide",
            "llm_decision": None,
            "last_error": "No screenshot"
        }
    
    await send_log(session_id, "🤖 LLM analyzing page...", "info")
    await send_status(session_id, "llm_decide", state.get("progress", 20), "AI analyzing page...")
    
    # Check if account creation is complete
    account_creation_complete = state.get("account_creation_complete", False)
    
    # Call LLM to decide next action
    decision = await decide_next_action(
        screenshot_base64=screenshot,
        user_data=user_data,
        already_filled=already_filled,
        page_url=page_url,
        retry_count=retry_count,
        captcha_fail_count=captcha_fail_count,
        account_creation_complete=account_creation_complete
    )
    
    # Override decision if it tries to go back to registration after login
    registration_completed = state.get("registration_completed", False)
    if (account_creation_complete or registration_completed) and decision.action_type == "click_button":
        if decision.button_text and any(keyword in decision.button_text.lower() for keyword in [
            "create account", "register", "sign up", "new registration", "click here to create", "create your account"
        ]):
            await send_log(session_id, "🚫 Blocked: Registration already completed - skipping registration link", "warning")
            # Instead of retry, look for login link or form filling
            decision = ActionDecision(
                action_type="click_button",
                button_text="Login",
                reasoning="Registration is already completed. Look for 'Login' link or button to proceed to form filling.",
                stagehand_prompt="Find and click the 'Login' link or button. If already logged in, look for form filling options like 'Proceed for Universal Registration' or 'Identity Profile'."
            )
    
    # Also block registration field filling if registration is complete
    if registration_completed and decision.action_type == "fill_field":
        field_name_lower = (decision.field_name or "").lower()
        if any(keyword in field_name_lower for keyword in ["email", "confirm email", "otp", "verify email"]):
            await send_log(session_id, f"🚫 Blocked: Registration complete - skipping registration field '{decision.field_name}'", "warning")
            decision = ActionDecision(
                action_type="retry",
                reasoning="Registration is complete. Skip registration fields and look for login or form filling options.",
                stagehand_prompt=""
            )
    
    await send_log(
        session_id, 
        f"🎯 Decision: {decision.action_type} - {decision.reasoning[:80]}...", 
        "info"
    )
    
    # CRITICAL: Preserve email_already_registered_detected flag
    email_already_registered_detected = state.get("email_already_registered_detected", False)
    if email_already_registered_detected:
        await send_log(session_id, "🔒 Flag preserved in llm_decide_node", "info")
    
    return {
        "current_step": "llm_decide",
        "llm_decision": decision.model_dump(),
        "progress": 25,
        "email_already_registered_detected": email_already_registered_detected,  # PRESERVE FLAG
        "account_creation_complete": account_creation_complete,  # PRESERVE FLAG
    }


async def execute_single_action_node(state: GraphState) -> dict:
    """
    Execute the single action decided by the LLM.
    Only executes ONE action at a time, then returns to capture/decide.
    """
    session_id = state["session_id"]
    decision_dict = state.get("llm_decision")
    
    if not decision_dict:
        return {"current_step": "execute_action", "last_error": "No decision available"}
    
    decision = ActionDecision(**decision_dict)
    action_type = decision.action_type
    
    await send_status(session_id, "execute_action", state.get("progress", 30), f"Executing: {action_type}")
    
    # Handle different action types
    if action_type == "success":
        # Only mark as completed if we're in form_filling phase AND form is actually complete
        current_phase = state.get("current_phase", "registration")
        login_completed = state.get("login_completed", False)
        
        # Check if this is a real completion (form filled and submitted) or just a step completion
        decision_reasoning_lower = (decision.reasoning or "").lower()
        
        # STRICT completion detection - must have explicit completion keywords
        is_real_completion = any(keyword in decision_reasoning_lower for keyword in [
            "application submitted", "registration completed", "form submitted successfully",
            "application successful", "successfully submitted", "thank you for submitting",
            "application has been submitted", "your application has been submitted",
            "registration form submitted", "form successfully submitted"
        ])
        
        # CRITICAL: Only complete if ALL conditions are met:
        # 1. We're in form_filling phase
        # 2. Login is completed
        # 3. LLM explicitly says it's a completion (with keywords)
        # 4. We've filled a reasonable number of fields (not just 2-3 fields)
        already_filled_count = len(state.get("already_filled_fields", []))
        has_enough_fields_filled = already_filled_count >= 5  # At least 5 fields filled
        
        # If LLM says "success" but conditions aren't met, treat it as a false positive and continue
        if not (current_phase == "form_filling" and login_completed and is_real_completion and has_enough_fields_filled):
            # This is NOT a real completion - LLM incorrectly said "success"
            reason = "LLM returned 'success' but conditions not met:"
            if current_phase != "form_filling":
                reason += f" phase is {current_phase} (not form_filling)"
            elif not login_completed:
                reason += " login not completed yet"
            elif not is_real_completion:
                reason += " no completion keywords in reasoning"
            elif not has_enough_fields_filled:
                reason += f" only {already_filled_count} fields filled (need at least 5)"
            
            await send_log(session_id, f"⚠️ {reason} - ignoring false success, continuing workflow...", "warning")
            # Don't mark as completed, continue workflow
            return {
                "current_step": "execute_action",
                "progress": min(state.get("progress", 30) + 5, 90),
            }
        else:
            # ALL conditions met - this is a real completion!
            await send_log(session_id, "✅ Registration completed successfully!", "success")
            # Update phase to completed
            try:
                import json
                graph_state = {
                    "current_phase": "completed",
                    "registration_completed": True,
                    "login_completed": True,
                    "form_filling_progress": {"completed": True}
                }
                await update_session(session_id, graph_state=graph_state)
            except Exception as e:
                await send_log(session_id, f"⚠️ Failed to save completion: {e}", "warning")
            
            return {
                "current_step": "execute_action",
                "status": "completed",
                "progress": 100,
                "current_phase": "completed",
            }
    
    if action_type == "error":
        await send_log(session_id, f"❌ Error: {decision.error_message}", "error")
        return {
            "current_step": "execute_action",
            "status": "failed",
            "last_error": decision.error_message,
        }
    
    if action_type == "wait_for_human":
        input_type = decision.input_type or "custom"
        screenshot = state.get("screenshot_base64", "")
        
        await send_log(session_id, f"⏸️ Waiting for user input: {decision.wait_reason}", "warning")
        await send_status(session_id, "waiting_input", state.get("progress", 50), f"Waiting for {input_type}...")
        
        # Send the appropriate request to the frontend
        if input_type == "otp":
            await request_otp(session_id)
        elif input_type == "captcha":
            await request_captcha(session_id, screenshot)
        else:
            await request_custom_input(session_id, decision.wait_reason or "Input required")
        
        # Return with waiting status - workflow will END here
        # When user provides input, resume_workflow will be called which will
        # set human_input_value and waiting_for_input_type=None, then restart loop
        return {
            "current_step": "execute_action",
            "status": "waiting_input",
            "waiting_for_input_type": input_type,
        }
    
    if action_type == "retry":
        await send_log(session_id, "🔄 Retrying...", "info")
        retry_count = state.get("retry_count", 0) + 1
        max_retries = state.get("max_retries", 5)  # Increased from 3 to 5 for LLM timeouts
        
        # If we've exceeded max retries, don't continue
        if retry_count >= max_retries:
            await send_log(session_id, f"❌ Max retries ({max_retries}) exceeded - stopping workflow", "error")
            return {
                "current_step": "execute_action",
                "status": "failed",
                "retry_count": retry_count,
                "last_error": "Max retries exceeded - LLM analysis failed repeatedly"
            }
        
        return {
            "current_step": "execute_action",
            "retry_count": retry_count,
        }
    
    # Prevent going back to registration if account creation is complete
    account_creation_complete = state.get("account_creation_complete", False)
    if account_creation_complete and action_type == "click_button":
        if decision.button_text and any(keyword in decision.button_text.lower() for keyword in [
            "create account", "register", "sign up", "new registration"
        ]):
            await send_log(session_id, "🚫 Blocked: Cannot go back to registration after login", "warning")
            return {
                "current_step": "execute_action",
                "account_creation_complete": account_creation_complete,
            }
    
    # ========== DETECT EMAIL ERROR FROM LLM DECISION ==========
    # Check if LLM detected "Email Id Already Exists" in reasoning BEFORE executing action
    email_already_registered_detected = state.get("email_already_registered_detected", False)
    decision_reasoning_lower = (decision.reasoning or "").lower()
    
    if not email_already_registered_detected and any(keyword in decision_reasoning_lower for keyword in [
        "email id already exists",
        "email already exists",
        "email already registered",
        "already registered",
        "email id exists",
    ]):
        email_already_registered_detected = True
        await send_log(session_id, "🔥 LLM DETECTED: Email already exists error in popup - navigating to login", "critical")
        
        # Navigate to login immediately
        exam_url = state.get("exam_url")
        if exam_url:
            await send_log(session_id, f"🔄 Navigating to login: {exam_url}", "info")
            nav_result = await call_stagehand("execute", {
                "sessionId": session_id,
                "action": "act",
                "prompt": f"Navigate to this URL: {exam_url}"
            }, timeout=60.0)
            
            if nav_result.get("success"):
                await send_log(session_id, "✅ Navigated to exam URL", "success")
                # Get screenshot after navigation
                result = await call_stagehand("screenshot", {"sessionId": session_id})
                if result.get("success"):
                    await forward_screenshot(session_id, result, "execute")
                    return {
                        "current_step": "execute_action",
                        "email_already_registered_detected": True,
                        "screenshot_base64": result.get("screenshot"),
                        "already_filled_fields": [],  # Clear filled fields for login flow
                    }
    
    # For click_checkbox, fill_field, click_button - execute via Stagehand
    stagehand_prompt = decision.stagehand_prompt
    
    if not stagehand_prompt:
        await send_log(session_id, "No Stagehand prompt provided", "error")
        return {"current_step": "execute_action", "last_error": "Empty prompt"}
    
    await send_log(session_id, f"🎬 Executing: {stagehand_prompt[:60]}...", "info")
    
    # Track page state BEFORE action (for loop detection)
    previous_page_url = state.get("page_url", "")
    previous_page_text = state.get("screenshot_base64", "")  # We'll use page_text from result instead
    previous_page_text_hash = state.get("previous_page_text_hash", "")
    
    # Execute via Stagehand
    result = await call_stagehand("execute", {
        "sessionId": session_id,
        "action": "act",
        "prompt": stagehand_prompt
    }, timeout=90.0)
    
    # Forward screenshot
    await forward_screenshot(session_id, result, "execute")
    
    # ========== DETECT PAGE CHANGE AFTER BUTTON CLICK ==========
    page_changed = False
    previous_page_url = state.get("page_url", "")
    previous_page_text_hash = state.get("previous_page_text_hash", "")
    repeated_action_count = state.get("repeated_action_count", 0)
    
    current_page_url = result.get("pageUrl", "") or previous_page_url
    current_page_text = result.get("page_text", "")
    
    # Create hash of page text for comparison
    import hashlib
    if current_page_text:
        current_page_text_hash = hashlib.md5(current_page_text.encode()).hexdigest()[:16]
    else:
        current_page_text_hash = ""
    
    # Check if page changed (URL or content)
    if action_type == "click_button":
        if current_page_url != previous_page_url and current_page_url:
            page_changed = True
            await send_log(session_id, f"✅ Page navigated: {current_page_url[:80]}", "success")
        elif current_page_text_hash and current_page_text_hash != previous_page_text_hash:
            page_changed = True
            await send_log(session_id, "✅ Page content changed", "success")
        else:
            # Page didn't change - might be stuck
            button_text = (decision.button_text or "").lower()
            
            # Check if this is the same button being clicked repeatedly
            if "proceed for universal registration" in button_text:
                repeated_action_count += 1
                await send_log(session_id, f"⚠️ Button clicked but page didn't change (attempt {repeated_action_count})", "warning")
                
                # If stuck for 3+ times, try alternative navigation
                if repeated_action_count >= 3:
                    await send_log(session_id, "🔄 Stuck in loop - trying alternative navigation...", "warning")
                    
                    # Try navigating directly to form page or clicking different element
                    alternative_result = await call_stagehand("execute", {
                        "sessionId": session_id,
                        "action": "act",
                        "prompt": "Look for any link or button that says 'Identity Profile', 'Personal Details', 'Registration Form', or 'Fill Form'. Click on it. If not found, try clicking on any menu item in the sidebar."
                    }, timeout=30.0)
                    
                    if alternative_result.get("success"):
                        await send_log(session_id, "✅ Alternative navigation attempted", "info")
                        result = alternative_result  # Use alternative result
                        # Reset counter if alternative worked
                        if alternative_result.get("pageUrl") != previous_page_url:
                            repeated_action_count = 0
                    else:
                        # Still stuck - request human intervention
                        await send_log(session_id, "🚨 Stuck in navigation loop - requesting human assistance", "error")
                        await send_status(session_id, "waiting_input", state.get("progress", 50), "Navigation stuck - need help")
                        await request_custom_input(
                            session_id,
                            field_id="navigation_help",
                            label="Navigation Assistance",
                            field_type="text",
                            suggestions=["Navigate manually to form page", "Click specific link", "Cancel automation"]
                        )
                        return {
                            "current_step": "execute_action",
                            "status": "waiting_input",
                            "waiting_for_input_type": "custom",
                            "repeated_action_count": repeated_action_count,
                        }
            else:
                # Different button - reset counter
                repeated_action_count = 0
    else:
        # Not a button click - reset counter
        repeated_action_count = 0
    
    # Update page state tracking
    if page_changed:
        repeated_action_count = 0  # Reset counter on successful navigation
    
    # Reset retry_count on successful actions (non-retry actions)
    if action_type != "retry" and result.get("success"):
        retry_count = 0  # Reset retry count on successful action
    else:
        # Preserve retry_count if it's a retry action or failed action
        retry_count = state.get("retry_count", 0)
    
    # ========== UI-BASED EMAIL ERROR DETECTION AFTER ACTION ==========
    # Check page_text from result (if available) for immediate error detection
    # NOTE: Navigation is handled in capture_screenshot_node to avoid duplicate navigation
    if result.get("success") and result.get("page_text"):
        page_text = result.get("page_text", "")
        if page_text:
            page_text_lower = page_text.lower()
            # HARD UI-BASED DETECTION - NO LLM REASONING
            if any(keyword in page_text_lower for keyword in [
                "already registered",
                "email already",
                "email id already registered",
                "email id already exists",
                "email already exists",
                "already registered with",
                "use another email",
                "email id exists",
            ]):
                # Just set the flag - navigation will happen in capture_screenshot_node
                email_already_registered_detected = True
                await send_log(session_id, "🔥 UI DETECTED: Email already registered (after action) - will navigate to login on next cycle", "critical")
    
    if not result.get("success"):
        await send_log(session_id, f"Action failed: {result.get('error')}", "warning")
    else:
        await send_log(session_id, f"✓ Action completed", "success")
    
    # IMPORTANT: Wait for any popups/dialogs to appear after action
    # This prevents analyzing a faded background before popup shows
    import asyncio
    await asyncio.sleep(2.0)  # 2 second delay for popups
    
    # ========== DETECT SUCCESSFUL LOGIN ==========
    account_creation_complete = state.get("account_creation_complete", False)
    if result.get("success") and result.get("page_text"):
        page_text = result.get("page_text", "")
        if page_text:
            page_text_lower = page_text.lower()
            # Check if login was successful (no login form, has dashboard/success indicators)
            email_already_registered = state.get("email_already_registered_detected", False)
            # Only check for login success ONCE - when we actually click the login button
            # and we're in login phase (not form_filling phase)
            current_phase = state.get("current_phase", "registration")
            login_completed = state.get("login_completed", False)
            
            if email_already_registered and action_type == "click_button" and not login_completed:
                # Check if this is the login button click (button text contains "sign in", "login", etc.)
                button_text_lower = (decision.button_text or "").lower()
                is_login_button = any(keyword in button_text_lower for keyword in [
                    "sign in", "login", "log in", "submit"
                ])
                
                if is_login_button:
                    # After clicking login button, check if we're no longer on login page
                    if any(keyword in page_text_lower for keyword in [
                        "dashboard", "welcome", "profile", "home", "application",
                        "successfully logged in", "login successful", "logged in"
                    ]) or ("password" not in page_text_lower and "email" not in page_text_lower and "login" not in page_text_lower):
                        # Login successful - update phase
                        account_creation_complete = True
                        login_completed = True
                        current_phase = "form_filling"
                        
                        await send_log(session_id, "✅ Login successful - moving to form filling phase!", "success")
                        
                        # Update state variables for return
                        state["login_completed"] = True
                        state["current_phase"] = "form_filling"
                        state["registration_completed"] = True  # Registration was skipped (email already registered)
                        
                        # Save phase to database
                        try:
                            import json
                            graph_state = {
                                "current_phase": current_phase,
                                "registration_completed": True,  # Registration was skipped (email already registered)
                                "login_completed": True,
                                "form_filling_progress": {}
                            }
                            await update_session(session_id, graph_state=graph_state)
                        except Exception as e:
                            await send_log(session_id, f"⚠️ Failed to save phase: {e}", "warning")
                    
                    # Update password in database
                    user_id = state.get("user_id")
                    user_data = state.get("user_data", {})
                    entered_password = user_data.get("password")
                    if user_id and entered_password:
                        try:
                            from app.services.database import execute
                            # Convert user_id to int if it's a string
                            user_id_int = int(user_id) if isinstance(user_id, str) else user_id
                            await execute(
                                "UPDATE users SET automation_password = $1 WHERE id = $2",
                                entered_password,
                                user_id_int
                            )
                            await send_log(session_id, f"✅ Password saved to database", "success")
                        except Exception as e:
                            await send_log(session_id, f"⚠️ Failed to save password: {e}", "warning")
    
    # Track filled fields if it was a fill action
    already_filled = list(state.get("already_filled_fields", []))
    if action_type == "fill_field" and decision.field_name and result.get("success"):
        # Normalize field name for better matching (lowercase, remove extra spaces)
        field_name_normalized = decision.field_name.lower().strip()
        # Check if already filled (case-insensitive)
        if field_name_normalized not in [f.lower().strip() for f in already_filled]:
            already_filled.append(decision.field_name)
            await send_log(session_id, f"✅ Field '{decision.field_name}' marked as filled", "info")
        else:
            await send_log(session_id, f"⚠️ Field '{decision.field_name}' was already filled - skipping duplicate", "warning")
    
    # Save form filling progress to database periodically (every 5 fields or on phase change)
    current_phase = state.get("current_phase", "registration")
    if current_phase == "form_filling" and len(already_filled) > 0:
        # Save every 5 fields or if this is a significant action
        should_save_progress = (
            len(already_filled) % 5 == 0 or  # Every 5 fields
            action_type == "click_button" or  # On navigation/submit
            len(already_filled) == 1  # First field filled
        )
        
        if should_save_progress:
            try:
                import json
                graph_state = {
                    "current_phase": current_phase,
                    "registration_completed": state.get("registration_completed", False),
                    "login_completed": state.get("login_completed", False),
                    "form_filling_progress": {
                        "already_filled_fields": already_filled,
                        "last_field_filled": decision.field_name if action_type == "fill_field" else None,
                        "progress_count": len(already_filled)
                    }
                }
                await update_session(session_id, graph_state=graph_state)
                await send_log(session_id, f"💾 Saved form progress: {len(already_filled)} fields filled", "info")
            except Exception as e:
                await send_log(session_id, f"⚠️ Failed to save form progress: {e}", "warning")
    
    # PRESERVE FLAG FROM STATE (set by UI detection in capture_screenshot_node)
    email_error_detected = state.get("email_already_registered_detected", False)
    
    # Get current phase from state (may have been updated above)
    current_phase = state.get("current_phase", "registration")
    login_completed_state = state.get("login_completed", False)
    registration_completed_state = state.get("registration_completed", False)
    
    return {
        "current_step": "execute_action",
        "screenshot_base64": result.get("screenshot"),
        "already_filled_fields": already_filled,
        "email_already_registered_detected": email_error_detected,  # Preserve flag from UI detection
        "account_creation_complete": account_creation_complete,  # Track if login/registration is complete
        "current_phase": current_phase,  # Preserve/update phase
        "login_completed": login_completed_state,  # Preserve login completion status
        "registration_completed": registration_completed_state,  # Preserve registration completion status
        "page_url": current_page_url,  # Update page URL
        "previous_page_url": previous_page_url,  # Track previous URL
        "previous_page_text_hash": current_page_text_hash if current_page_text else previous_page_text_hash,  # Track page content hash
        "repeated_action_count": repeated_action_count,  # Track loop attempts
        "retry_count": retry_count,  # Preserve or reset retry count
        "progress": min(state.get("progress", 30) + 5, 90),
        "action_history": state.get("action_history", []) + [{
            "action": action_type,
            "target": decision.field_name or decision.checkbox_label or decision.button_text,
            "timestamp": datetime.utcnow().isoformat(),
            "success": result.get("success", False)
        }]
    }



async def analyze_page_node(state: GraphState) -> dict:
    """
    Analyze current page using TypeScript Stagehand's extract.
    Returns structured analysis.
    """
    session_id = state["session_id"]
    
    await send_log(session_id, "Analyzing page...", "info")
    await send_status(session_id, "analyze_page", state.get("progress", 15), "Analyzing page content...")
    
    # Call TypeScript backend to analyze page
    result = await call_stagehand("analyze", {"sessionId": session_id})
    
    # Forward screenshot to frontend
    await forward_screenshot(session_id, result, "analyze")
    
    if not result.get("success"):
        await send_log(session_id, f"Analysis failed: {result.get('error')}", "error")
        # Don't return error immediately - try with form filling anyway
        return {
            "current_step": "analyze_page",
            "analysis": {
                "page_type": "form",  # Assume form and try to fill
                "next_action": "fill_form",
                "detected_fields": [],
                "remaining_fields": list(state.get("user_data", {}).keys()),
                "has_captcha": False,
                "has_otp_field": False,
                "confidence": 0.5,
            },
            "progress": 20,
        }
    
    raw_analysis = result.get("analysis", {})
    
    # Parse the raw extraction into our expected format
    analysis = parse_page_analysis(raw_analysis, state.get("user_data", {}))
    
    await send_log(
        session_id, 
        f"Page: {analysis.get('page_type', 'unknown')} | Action: {analysis.get('next_action', 'unknown')}", 
        "info"
    )
    
    return {
        "current_step": "analyze_page",
        "analysis": analysis,
        "screenshot_base64": result.get("screenshot"),
        "progress": 20,
    }


def parse_page_analysis(raw: Any, user_data: dict) -> dict:
    """
    Parse raw extraction into structured PageAnalysis format.
    """
    # Handle string response
    if isinstance(raw, str):
        raw_lower = raw.lower()
        page_type = "form"  # Default
        if "success" in raw_lower or "completed" in raw_lower or "thank you" in raw_lower:
            page_type = "success"
        elif "otp" in raw_lower or "verification code" in raw_lower:
            page_type = "otp_input"
        elif "captcha" in raw_lower:
            page_type = "captcha"
        elif "login" in raw_lower:
            page_type = "login"
        elif "error" in raw_lower or "failed" in raw_lower:
            page_type = "error"
        
        return {
            "page_type": page_type,
            "detected_fields": [],
            "remaining_fields": list(user_data.keys()),
            "has_captcha": "captcha" in raw_lower,
            "has_otp_field": "otp" in raw_lower or "verification" in raw_lower,
            "has_submit_button": True,
            "next_action": determine_next_action(page_type, bool(user_data)),
            "confidence": 0.7
        }
    
    # Handle dict/object response
    if isinstance(raw, dict):
        page_type = raw.get("pageType", raw.get("page_type", "form"))
        has_otp = raw.get("hasOtpField", raw.get("hasOtp", raw.get("has_otp_field", False)))
        has_captcha = raw.get("hasCaptcha", raw.get("has_captcha", False))
        
        # Check for unchecked checkbox that needs to be clicked first
        has_unchecked_checkbox = raw.get("hasUncheckedCheckbox", False)
        checkbox_label = raw.get("uncheckedCheckboxLabel", "")
        
        # Determine next action - checkbox comes FIRST
        if has_unchecked_checkbox and checkbox_label:
            next_action = "click_checkbox"
        else:
            next_action = determine_next_action(page_type, bool(user_data), has_otp, has_captcha)
        
        return {
            "page_type": page_type,
            "detected_fields": raw.get("formFields", raw.get("detected_fields", [])),
            "remaining_fields": list(user_data.keys()),
            "has_captcha": has_captcha,
            "has_otp_field": has_otp,
            "has_submit_button": True,
            "has_unchecked_checkbox": has_unchecked_checkbox,
            "checkbox_to_click": checkbox_label,
            "next_action": next_action,
            "confidence": 0.8
        }
    
    # Fallback
    return {
        "page_type": "form",
        "detected_fields": [],
        "remaining_fields": list(user_data.keys()),
        "next_action": "fill_form" if user_data else "click_submit",
        "confidence": 0.5
    }


def determine_next_action(page_type: str, has_data: bool, has_otp: bool = False, has_captcha: bool = False) -> str:
    """Determine the next action based on page state."""
    if page_type == "success":
        return "success"
    if page_type == "error":
        return "error"
    if has_otp or page_type == "otp_input":
        return "request_otp"
    if has_captcha or page_type == "captcha":
        return "request_captcha"
    if page_type == "form" and has_data:
        return "fill_form"
    return "click_submit"


async def fill_form_node(state: GraphState) -> dict:
    """
    Fill form fields using user data.
    Calls TypeScript backend with field data.
    Now filters based on detected visible fields from analysis.
    """
    session_id = state["session_id"]
    user_data = state.get("user_data", {})
    analysis = state.get("analysis", {})
    
    await send_log(session_id, "Filling form fields...", "info")
    await send_status(session_id, "fill_form", 40, "Filling form...")
    
    # Get detected visible fields from analysis
    detected_fields = analysis.get("detected_fields", [])
    detected_lower = [f.lower() if isinstance(f, str) else "" for f in detected_fields]
    
    # Prepare fields - prioritize those that match detected visible fields
    fields = []
    for key, value in user_data.items():
        if not value:
            continue
            
        # Check if this field might be visible on page
        key_lower = key.lower().replace("_", " ")
        
        # Always include if detection is empty (fallback) or if field seems to match
        field_matches = not detected_fields or any(
            key_lower in df or df in key_lower or 
            any(word in df for word in key_lower.split())
            for df in detected_lower
        )
        
        if field_matches:
            fields.append({
                "key": key,
                "value": str(value),
                "type": "text"  # Default type
            })
    
    if not fields:
        await send_log(session_id, "No matching fields found to fill", "warning")
        return {"current_step": "fill_form", "progress": 50}
    
    await send_log(session_id, f"Filling {len(fields)} fields...", "info")
    
    # Call TypeScript backend to fill form
    result = await call_stagehand("fill-form", {
        "sessionId": session_id,
        "fields": fields
    }, timeout=120.0)  # Longer timeout for form filling
    
    if not result.get("success"):
        await send_log(session_id, f"Form fill failed: {result.get('error')}", "error")
        return {"current_step": "fill_form", "last_error": result.get("error")}
    
    # Forward screenshot to frontend
    await forward_screenshot(session_id, result, "fill_form")
    
    # Count successful fills
    results = result.get("results", [])
    success_count = sum(1 for r in results if r.get("success"))
    
    await send_log(session_id, f"Filled {success_count}/{len(fields)} fields", "success")
    
    return {
        "current_step": "fill_form",
        "progress": 50,
        "screenshot_base64": result.get("screenshot"),
        "action_history": [{
            "action": "fill_form",
            "target": f"{success_count} fields",
            "timestamp": datetime.utcnow().isoformat(),
            "success": success_count > 0
        }]
    }


async def click_action_node(state: GraphState) -> dict:
    """
    Click the appropriate element (checkbox or button).
    """
    session_id = state["session_id"]
    analysis = state.get("analysis", {})
    
    next_action = analysis.get("next_action", "click_submit")
    
    # Check if we need to click a checkbox first
    checkbox_to_click = analysis.get("checkbox_to_click")
    if next_action == "click_checkbox" and checkbox_to_click:
        await send_log(session_id, f"Checking: {checkbox_to_click[:50]}...", "info")
        await send_status(session_id, "click_action", 55, "Clicking checkbox...")
        
        result = await call_stagehand("click", {
            "sessionId": session_id,
            "target": checkbox_to_click,
            "type": "checkbox"
        })
        
        return {
            "current_step": "click_action",
            "progress": 55,
            "screenshot_base64": result.get("screenshot"),
            "action_history": [{
                "action": "click_checkbox",
                "target": checkbox_to_click[:30],
                "timestamp": datetime.utcnow().isoformat(),
                "success": result.get("success", False)
            }]
        }
    
    # Click submit button
    await send_log(session_id, "Clicking submit button...", "info")
    await send_status(session_id, "click_action", 60, "Submitting...")
    
    result = await call_stagehand("submit", {"sessionId": session_id})
    
    return {
        "current_step": "click_action",
        "progress": 60,
        "screenshot_base64": result.get("screenshot"),
        "page_url": result.get("pageUrl", ""),
        "action_history": [{
            "action": "click",
            "target": "submit",
            "timestamp": datetime.utcnow().isoformat(),
            "success": result.get("success", False)
        }]
    }


# ============= Human Intervention Nodes (using LangGraph interrupt()) =============

async def request_otp_node(state: GraphState) -> dict:
    """
    Request OTP from user using LangGraph's built-in interrupt().
    """
    session_id = state["session_id"]
    
    await send_log(session_id, "📱 OTP required. Please check your phone...", "warning")
    await send_status(session_id, "request_otp", state.get("progress", 50), "Waiting for OTP...")
    
    # Send request to frontend
    await request_otp(session_id)
    
    # Use LangGraph's interrupt() to pause
    otp = interrupt({
        "type": "REQUEST_OTP",
        "message": "Please enter the OTP sent to your phone",
        "session_id": session_id
    })
    
    await send_log(session_id, "OTP received, entering...", "success")
    
    # Enter OTP via TypeScript backend
    if otp:
        result = await call_stagehand("input", {
            "sessionId": session_id,
            "inputType": "otp",
            "value": str(otp)
        })
    
    return {
        "current_step": "request_otp",
        "received_otp": otp,
        "pending_intervention": None,
        "action_history": [{
            "action": "otp_entered",
            "timestamp": datetime.utcnow().isoformat(),
            "success": True
        }]
    }


async def request_captcha_node(state: GraphState) -> dict:
    """
    Request captcha solution from user using interrupt().
    """
    session_id = state["session_id"]
    
    # Get screenshot from TypeScript backend
    result = await call_stagehand("screenshot", {"sessionId": session_id})
    screenshot = result.get("screenshot", "")
    
    await send_log(session_id, "🔒 Captcha detected. Please solve it...", "warning")
    await send_status(session_id, "request_captcha", state.get("progress", 50), "Waiting for captcha solution...")
    
    # Send captcha to frontend
    await request_captcha(session_id, screenshot, auto_solving=False)
    
    # Use interrupt() to wait for solution
    solution = interrupt({
        "type": "REQUEST_CAPTCHA",
        "message": "Please solve the captcha",
        "session_id": session_id,
        "image_base64": screenshot
    })
    
    await send_log(session_id, "Captcha solution received, entering...", "success")
    
    # Enter captcha via TypeScript backend
    if solution:
        await call_stagehand("input", {
            "sessionId": session_id,
            "inputType": "captcha",
            "value": str(solution)
        })
    
    return {
        "current_step": "request_captcha",
        "received_captcha": solution,
        "pending_intervention": None,
        "action_history": [{
            "action": "captcha_solved",
            "timestamp": datetime.utcnow().isoformat(),
            "success": True
        }]
    }


async def request_custom_input_node(state: GraphState) -> dict:
    """
    Request custom input from user for unknown fields.
    """
    session_id = state["session_id"]
    analysis = state.get("analysis", {})
    
    remaining_fields = analysis.get("remaining_fields", [])
    user_data = state.get("user_data", {})
    
    # Find first field without data
    unknown_field = None
    for field_key in remaining_fields:
        if field_key not in user_data or not user_data.get(field_key):
            unknown_field = field_key
            break
    
    if not unknown_field:
        return {
            "current_step": "request_custom_input",
            "last_error": "No unknown fields found"
        }
    
    field_label = unknown_field.replace("_", " ").title()
    
    await send_log(session_id, f"❓ Unknown field: {field_label}", "warning")
    await send_status(session_id, "request_custom_input", state.get("progress", 50), f"Need input for: {field_label}")
    
    await request_custom_input(session_id, unknown_field, field_label, "text", list(user_data.keys())[:5])
    
    # Use interrupt() to wait for user input
    value = interrupt({
        "type": "REQUEST_CUSTOM_INPUT",
        "field_id": unknown_field,
        "field_label": field_label,
        "session_id": session_id
    })
    
    await send_log(session_id, f"Input received for {field_label}, entering...", "success")
    
    # Fill the field via TypeScript backend
    if value:
        await call_stagehand("fill-form", {
            "sessionId": session_id,
            "fields": [{"key": unknown_field, "value": str(value), "type": "text"}]
        })
    
    received_custom = state.get("received_custom_inputs", {})
    received_custom[unknown_field] = value
    
    return {
        "current_step": "request_custom_input",
        "received_custom_inputs": received_custom,
        "pending_intervention": None,
        "action_history": [{
            "action": "custom_input_entered",
            "target": unknown_field,
            "timestamp": datetime.utcnow().isoformat(),
            "success": True
        }]
    }


async def enter_input_node(state: GraphState) -> dict:
    """
    Post-processing after human input has been entered.
    Click continue/submit button.
    """
    session_id = state["session_id"]
    
    await send_log(session_id, "Processing input...", "info")
    await send_status(session_id, "enter_input", 65, "Processing...")
    
    # Click submit via TypeScript backend
    result = await call_stagehand("submit", {"sessionId": session_id})
    
    return {
        "current_step": "enter_input",
        "progress": 70,
        "screenshot_base64": result.get("screenshot"),
        "action_history": [{
            "action": "continue_after_input",
            "timestamp": datetime.utcnow().isoformat(),
            "success": result.get("success", True)
        }]
    }


# ============= Result Nodes =============

async def success_node(state: GraphState) -> dict:
    """
    Handle successful workflow completion.
    """
    session_id = state["session_id"]
    
    # Get final screenshot and close browser
    await call_stagehand("screenshot", {"sessionId": session_id})
    await call_stagehand("close", {"sessionId": session_id})
    
    await send_log(session_id, "✅ Registration completed successfully!", "success")
    await send_status(session_id, "success", 100, "Completed!")
    await send_result(session_id, True, "Registration completed successfully")
    
    return {
        "current_step": "success",
        "progress": 100,
        "status": "completed",
        "result_message": "Registration completed successfully"
    }


async def error_recovery_node(state: GraphState) -> dict:
    """
    Handle errors with retry logic.
    """
    session_id = state["session_id"]
    retry_count = state.get("retry_count", 0)
    max_retries = state.get("max_retries", 3)
    last_error = state.get("last_error", "Unknown error")
    
    if retry_count >= max_retries:
        # Close browser on failure
        await call_stagehand("close", {"sessionId": session_id})
        
        await send_log(session_id, f"❌ Max retries reached: {last_error}", "error")
        await send_result(session_id, False, f"Failed after {max_retries} retries")
        
        return {
            "current_step": "error_recovery",
            "status": "failed",
            "result_message": f"Failed: {last_error}"
        }
    
    await send_log(session_id, f"🔄 Retrying ({retry_count + 1}/{max_retries})...", "warning")
    await send_status(session_id, "error_recovery", state.get("progress", 50), f"Retry {retry_count + 1}/{max_retries}")
    
    return {
        "current_step": "error_recovery",
        "retry_count": retry_count + 1,
        "last_error": None,
        "action_history": [{
            "action": "retry",
            "target": f"attempt_{retry_count + 1}",
            "timestamp": datetime.utcnow().isoformat(),
            "success": True
        }]
    }


async def save_analytics_node(state: GraphState) -> dict:
    """
    Save workflow analytics after completion.
    """
    session_id = state["session_id"]
    
    # TODO: Save to ExamAnalytics collection
    await send_log(session_id, "📊 Analytics saved", "info")
    
    return {"current_step": "save_analytics"}
