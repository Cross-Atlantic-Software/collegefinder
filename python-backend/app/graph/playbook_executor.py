"""
Playbook Executor

Runs exam-specific playbooks: a deterministic list of steps that drives the
browser through Stagehand. LLM is only used for captcha reading and success
verification — everything else is hardcoded per exam, so it never gets
confused or loops.

Usage:
    playbook = load_playbook("cuet-ug")
    result   = await run_playbook(session_id, playbook, user_data)
"""

import asyncio
import base64
import io
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Optional

import httpx

from app.config import settings
from app.api.websocket import (
    send_screenshot,
    send_log,
    send_status,
    send_result,
    request_otp,
    request_captcha,
    update_session,
    is_session_cancelled,
)

STAGEHAND_URL = settings.stagehand_url
TIMEOUT = 60.0
PLAYBOOKS_DIR = Path(__file__).parent.parent / "playbooks"
CACHE_DIR = PLAYBOOKS_DIR / "cache"

# Per-session human-input synchronisation
_pending_inputs: dict[str, dict] = {}


# ── Prompt cache (save successful LLM instructions per step for cost optimization) ──

def _load_prompt_cache(exam_slug: str) -> dict:
    """Load cached prompts for this exam. Run once with LLM, then reuse saved instructions."""
    path = CACHE_DIR / f"{exam_slug.replace('-', '_')}.json"
    if not path.exists():
        return {}
    try:
        with open(path) as f:
            return json.load(f)
    except Exception:
        return {}


def _save_prompt_cache(exam_slug: str, cache: dict) -> None:
    """Persist prompt cache to JSON."""
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    path = CACHE_DIR / f"{exam_slug.replace('-', '_')}.json"
    try:
        with open(path, "w") as f:
            json.dump(cache, f, indent=2)
    except Exception:
        pass


def _cache_key(step_name: str, field_label: str = None) -> str:
    if field_label:
        return f"{step_name}::{field_label}"
    return step_name


def _extract_actions_from_result(response: dict) -> list:
    """Get actions array from Stagehand execute response (selector + method = no LLM next time)."""
    inner = response.get("result") or {}
    actions = inner.get("actions")
    if not actions or not isinstance(actions, list):
        return []
    # Normalize for re-send: selector, description, method, arguments
    out = []
    for a in actions:
        if isinstance(a, dict) and a.get("selector"):
            out.append({
                "selector": str(a["selector"]),
                "description": str(a.get("description", "")),
                "method": str(a.get("method", "click")),
                "arguments": list(a.get("arguments") or []),
            })
    return out


# ── Stagehand helpers ────────────────────────────────────────────────

async def _stagehand(endpoint: str, data: dict, timeout: float = TIMEOUT) -> dict:
    try:
        async with httpx.AsyncClient(timeout=timeout) as client:
            resp = await client.post(f"{STAGEHAND_URL}/api/{endpoint}", json=data)
            return resp.json()
    except httpx.ConnectError:
        return {"success": False, "error": "Cannot connect to Stagehand (port 3001)"}
    except Exception as e:
        return {"success": False, "error": str(e)}


async def _screenshot(session_id: str, step: str = "playbook") -> Optional[str]:
    result = await _stagehand("screenshot", {"sessionId": session_id})
    ss = result.get("screenshot")
    if ss:
        await send_screenshot(session_id, ss, step)
    return ss


# ── Playbook loader ─────────────────────────────────────────────────

def load_playbook(exam_slug: str) -> Optional[dict]:
    """Return the playbook dict for *exam_slug*, or None."""
    fname = exam_slug.replace("-", "_") + ".json"
    path = PLAYBOOKS_DIR / fname
    if not path.exists():
        return None
    with open(path) as f:
        return json.load(f)


# ── Human-input wait / resolve ───────────────────────────────────────

async def wait_for_human_input(
    session_id: str,
    input_type: str,
    wait_reason: str,
    timeout_seconds: int = 300,
    **kw,
) -> str:
    """Pause until the user provides OTP / captcha / custom input."""
    event = asyncio.Event()
    _pending_inputs[session_id] = {"event": event, "value": None}

    if input_type == "otp":
        await request_otp(session_id)
    elif input_type == "captcha":
        await request_captcha(session_id, kw.get("captcha_image", ""))
    else:
        from app.api.websocket import request_custom_input
        await request_custom_input(
            session_id,
            field_id=kw.get("field_id", input_type),
            label=wait_reason,
            field_type="text",
        )

    await send_log(session_id, f"⏳ {wait_reason}", "warning")

    try:
        await asyncio.wait_for(event.wait(), timeout=timeout_seconds)
    except asyncio.TimeoutError:
        _pending_inputs.pop(session_id, None)
        raise RuntimeError(f"Timeout ({timeout_seconds}s) waiting for {input_type}")

    value = _pending_inputs.pop(session_id, {}).get("value", "")
    return value


def resolve_human_input(session_id: str, value: str, _field_id: str = None):
    """Called by websocket OTP/captcha/custom handlers to unblock the executor."""
    pending = _pending_inputs.get(session_id)
    if pending:
        pending["value"] = value
        pending["event"].set()


def has_pending_playbook_input(session_id: str) -> bool:
    return session_id in _pending_inputs


# ── Value helpers ────────────────────────────────────────────────────

_MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
]


def _parse_dob(dob: str, part: str) -> str:
    """Extract day / month_name / year from DD/MM/YYYY."""
    bits = dob.replace("-", "/").split("/")
    if len(bits) != 3:
        return dob
    day, month, year = bits
    if part == "day":
        return str(int(day)).zfill(2)  # "05" not "5" for dropdowns that use 01-31
    if part == "month_name":
        return _MONTHS[int(month) - 1]
    if part == "year":
        return year
    return dob


def _strip_phone_code(phone: str) -> str:
    """Remove leading country code (91, +91, 091) from Indian phone numbers."""
    phone = phone.strip().replace(" ", "").replace("-", "")
    if phone.startswith("+91") and len(phone) > 10:
        phone = phone[3:]
    elif phone.startswith("91") and len(phone) > 10:
        phone = phone[2:]
    elif phone.startswith("091") and len(phone) > 10:
        phone = phone[3:]
    return phone


def _resolve_value(field: dict, user_data: dict) -> str:
    key = field.get("user_data_key", "")
    if key.startswith("_static:"):
        return key.split(":", 1)[1]
    if key == "_select_first":
        return "__select_first__"
    raw = str(user_data.get(key, ""))
    extract = field.get("extract")
    if extract and raw:
        if extract == "phone_without_code":
            raw = _strip_phone_code(raw)
        else:
            raw = _parse_dob(raw, extract)
    return raw


def _build_prompt(field: dict, value: str) -> str:
    """Return the Stagehand prompt for a single field."""
    custom = field.get("prompt")
    if custom:
        return custom.replace("{value}", value)

    label = field["label"]
    ftype = field.get("type", "text")

    if ftype == "select":
        if value == "__select_first__":
            return f"Click the '{label}' dropdown and select the first available option (not the default placeholder)"
        return f"Click the dropdown labeled '{label}' and select '{value}'"

    return f"Find the input field labeled '{label}' and type '{value}' into it. Clear any existing text first."


# ── LLM helpers (Gemini — only for captcha + success check) ──────────

async def _read_captcha_llm(screenshot_b64: str) -> str:
    from google import genai
    from app.graph.llm_decision import client as gemini_client

    image_data = base64.b64decode(screenshot_b64)

    # Resize for speed
    from PIL import Image
    img = Image.open(io.BytesIO(image_data))
    max_dim = 1280
    if max(img.width, img.height) > max_dim:
        ratio = max_dim / max(img.width, img.height)
        img = img.resize((int(img.width * ratio), int(img.height * ratio)), Image.Resampling.LANCZOS)
    buf = io.BytesIO()
    img.convert("RGB").save(buf, format="JPEG", quality=85)
    image_data = buf.getvalue()

    prompt = (
        "Look at this screenshot. There is a CAPTCHA image on the page. "
        "Read the CAPTCHA text EXACTLY as shown (case-sensitive). "
        "Return ONLY the captcha text — no quotes, no explanation."
    )
    contents = [prompt, genai.types.Part.from_bytes(data=image_data, mime_type="image/jpeg")]

    loop = asyncio.get_event_loop()
    resp = await asyncio.wait_for(
        loop.run_in_executor(
            None,
            lambda: gemini_client.models.generate_content(
                model="gemini-2.5-flash",
                contents=contents,
                config=genai.types.GenerateContentConfig(temperature=0.1),
            ),
        ),
        timeout=20.0,
    )
    return resp.text.strip()


async def _check_success_llm(screenshot_b64: str, patterns: list[str]) -> bool:
    from google import genai
    from app.graph.llm_decision import client as gemini_client

    image_data = base64.b64decode(screenshot_b64)

    from PIL import Image
    img = Image.open(io.BytesIO(image_data))
    max_dim = 1280
    if max(img.width, img.height) > max_dim:
        ratio = max_dim / max(img.width, img.height)
        img = img.resize((int(img.width * ratio), int(img.height * ratio)), Image.Resampling.LANCZOS)
    buf = io.BytesIO()
    img.convert("RGB").save(buf, format="JPEG", quality=85)
    image_data = buf.getvalue()

    patterns_str = ", ".join(f'"{p}"' for p in patterns)
    prompt = (
        f"Look at this screenshot. Does the page show a SUCCESS or confirmation message? "
        f"Look for patterns like: {patterns_str}. "
        f"Also look for any application number or 'registration complete' text. "
        f'Return ONLY "yes" or "no".'
    )
    contents = [prompt, genai.types.Part.from_bytes(data=image_data, mime_type="image/jpeg")]

    loop = asyncio.get_event_loop()
    resp = await asyncio.wait_for(
        loop.run_in_executor(
            None,
            lambda: gemini_client.models.generate_content(
                model="gemini-2.5-flash",
                contents=contents,
                config=genai.types.GenerateContentConfig(temperature=0.1),
            ),
        ),
        timeout=15.0,
    )
    return "yes" in resp.text.strip().lower()


async def _detect_missing_fields_llm(screenshot_b64: str, field_value_pairs: list[dict]) -> list[dict]:
    """Analyze screenshot to find fields that are still empty/unfilled.

    Returns list of dicts: [{"label": "...", "value": "..."}, ...] for fields
    the LLM sees as empty on the page.
    """
    from google import genai
    from app.graph.llm_decision import client as gemini_client

    image_data = base64.b64decode(screenshot_b64)

    from PIL import Image
    img = Image.open(io.BytesIO(image_data))
    max_dim = 1600
    if max(img.width, img.height) > max_dim:
        ratio = max_dim / max(img.width, img.height)
        img = img.resize((int(img.width * ratio), int(img.height * ratio)), Image.Resampling.LANCZOS)
    buf = io.BytesIO()
    img.convert("RGB").save(buf, format="JPEG", quality=85)
    image_data = buf.getvalue()

    fields_desc = "\n".join(
        f'  - "{fv["label"]}" should contain "{fv["value"]}"'
        for fv in field_value_pairs
    )
    prompt = (
        "Look at this form screenshot carefully. These fields should be filled:\n"
        f"{fields_desc}\n\n"
        "Check each field on the page. Which ones are STILL EMPTY, have placeholder text, "
        "show '--Select--', or don't have the correct value filled in?\n\n"
        "Return ONLY a JSON array of objects with the empty/wrong fields, e.g.:\n"
        '[{"label": "Email Address", "value": "user@example.com"}, {"label": "Gender", "value": "Male"}]\n\n'
        "If ALL fields are correctly filled, return: []\n"
        "Return ONLY the JSON array, nothing else."
    )
    contents = [prompt, genai.types.Part.from_bytes(data=image_data, mime_type="image/jpeg")]

    loop = asyncio.get_event_loop()
    resp = await asyncio.wait_for(
        loop.run_in_executor(
            None,
            lambda: gemini_client.models.generate_content(
                model="gemini-2.5-flash",
                contents=contents,
                config=genai.types.GenerateContentConfig(temperature=0.1),
            ),
        ),
        timeout=20.0,
    )
    text = resp.text.strip()
    # Strip markdown code fences if present
    if text.startswith("```"):
        text = text.split("\n", 1)[1] if "\n" in text else text[3:]
    if text.endswith("```"):
        text = text[:-3].strip()
    if text.startswith("json"):
        text = text[4:].strip()
    try:
        result = json.loads(text)
        if isinstance(result, list):
            return result
    except Exception:
        pass
    return []


async def _check_errors_llm(screenshot_b64: str, error_patterns: list[str]) -> Optional[str]:
    """Return the matched error string, or None if no error on page."""
    from google import genai
    from app.graph.llm_decision import client as gemini_client

    image_data = base64.b64decode(screenshot_b64)

    from PIL import Image
    img = Image.open(io.BytesIO(image_data))
    max_dim = 1280
    if max(img.width, img.height) > max_dim:
        ratio = max_dim / max(img.width, img.height)
        img = img.resize((int(img.width * ratio), int(img.height * ratio)), Image.Resampling.LANCZOS)
    buf = io.BytesIO()
    img.convert("RGB").save(buf, format="JPEG", quality=85)
    image_data = buf.getvalue()

    patterns_str = ", ".join(f'"{p}"' for p in error_patterns)
    prompt = (
        f"Look at this screenshot. Is there any error message or alert on the page? "
        f"Check for these patterns: {patterns_str}. "
        f"If you see an error, return ONLY the matching pattern text (lowercase). "
        f'If there is no error, return ONLY "none".'
    )
    contents = [prompt, genai.types.Part.from_bytes(data=image_data, mime_type="image/jpeg")]

    loop = asyncio.get_event_loop()
    resp = await asyncio.wait_for(
        loop.run_in_executor(
            None,
            lambda: gemini_client.models.generate_content(
                model="gemini-2.5-flash",
                contents=contents,
                config=genai.types.GenerateContentConfig(temperature=0.1),
            ),
        ),
        timeout=15.0,
    )
    text = resp.text.strip().lower()
    if text == "none":
        return None
    return text


# ── Individual step executors ────────────────────────────────────────

async def _exec_click(session_id: str, step: dict, exam_slug: str = None, prompt_cache: dict = None) -> dict:
    target = step.get("target", "")
    step_name = step.get("name", "")
    custom_prompt = step.get("prompt")
    cached_actions = []
    if prompt_cache and exam_slug:
        cached = (prompt_cache.get("steps") or {}).get(step_name, {})
        if cached.get("actions"):
            cached_actions = cached["actions"]
            await send_log(session_id, f"  📦 Using cached selector for step '{step_name}' (no LLM)", "info")
        elif cached.get("prompt"):
            custom_prompt = cached["prompt"]
            await send_log(session_id, f"  📦 Using cached prompt for step '{step_name}'", "info")

    if step.get("scroll_first"):
        await _stagehand("scroll", {
            "sessionId": session_id,
            "direction": step.get("scroll_direction", "down"),
            "pixels": step.get("scroll_pixels", 600),
        })
        await asyncio.sleep(0.5)

    used_cached = False
    if cached_actions:
        result = await _stagehand("execute", {
            "sessionId": session_id,
            "action": "actCached",
            "actions": cached_actions,
        })
        used_cached = True
        if not result.get("success") and custom_prompt:
            await send_log(session_id, f"  ⚠️ Cached selector failed, falling back to LLM prompt", "warning")
            result = await _stagehand("execute", {
                "sessionId": session_id,
                "action": "act",
                "prompt": custom_prompt,
            })
            used_cached = False

    if not used_cached:
        if custom_prompt:
            result = await _stagehand("execute", {
                "sessionId": session_id,
                "action": "act",
                "prompt": custom_prompt,
            })
        else:
            result = await _stagehand("click", {
                "sessionId": session_id,
                "target": target,
                "type": step.get("click_type", "button"),
            })
            if not result.get("success"):
                fallback = f"Click the button or link labeled '{target}'"
                result = await _stagehand("execute", {
                    "sessionId": session_id,
                    "action": "act",
                    "prompt": fallback,
                })
                custom_prompt = fallback

    if result.get("success") and exam_slug and prompt_cache is not None:
        actions = _extract_actions_from_result(result)
        entry = {
            "action": "execute",
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }
        if actions:
            entry["actions"] = actions
        if custom_prompt:
            entry["prompt"] = custom_prompt
        if actions or custom_prompt:
            prompt_cache.setdefault("steps", {})[step_name] = entry
            _save_prompt_cache(exam_slug, prompt_cache)
    elif not result.get("success") and exam_slug and prompt_cache is not None and step_name in (prompt_cache.get("steps") or {}):
        prompt_cache.setdefault("steps", {}).pop(step_name, None)
        _save_prompt_cache(exam_slug, prompt_cache)
        await send_log(session_id, f"  🔄 Cache invalidated for '{step_name}' — will re-learn on next run", "warning")
    return result


async def _exec_click_checkbox(session_id: str, step: dict, exam_slug: str = None, prompt_cache: dict = None) -> dict:
    target = step["target"]
    step_name = step.get("name", "")
    fallback_prompt = step.get("prompt") or f"Click the checkbox next to '{target}'"
    disable_cache = bool(step.get("disable_cache"))
    cached_actions = []
    if (not disable_cache) and prompt_cache and exam_slug:
        cached = (prompt_cache.get("steps") or {}).get(step_name, {})
        if cached.get("actions"):
            cached_actions = cached["actions"]
            await send_log(session_id, f"  📦 Using cached selector for step '{step_name}' (no LLM)", "info")
        elif cached.get("prompt"):
            fallback_prompt = cached["prompt"]

    if step.get("scroll_first"):
        await _stagehand("scroll", {
            "sessionId": session_id,
            "direction": step.get("scroll_direction", "down"),
            "pixels": step.get("scroll_pixels", 600),
        })
        await asyncio.sleep(0.5)

    used_cached = False
    if cached_actions:
        result = await _stagehand("execute", {
            "sessionId": session_id,
            "action": "actCached",
            "actions": cached_actions,
        })
        used_cached = True
        if not result.get("success"):
            await send_log(session_id, f"  ⚠️ Cached selector failed, falling back to LLM prompt", "warning")
            result = await _stagehand("execute", {
                "sessionId": session_id,
                "action": "act",
                "prompt": fallback_prompt,
            })
            used_cached = False

    if not used_cached:
        # Prefer deterministic checkbox click endpoint first, then fallback to LLM prompt.
        result = await _stagehand("click", {
            "sessionId": session_id,
            "target": target,
            "type": "checkbox",
        })
        if not result.get("success"):
            await send_log(session_id, f"  ⚠️ Checkbox click failed, trying prompt fallback...", "warning")
            result = await _stagehand("execute", {
                "sessionId": session_id,
                "action": "act",
                "prompt": fallback_prompt,
            })

    if (not disable_cache) and result.get("success") and exam_slug and prompt_cache is not None:
        actions = _extract_actions_from_result(result)
        entry = {
            "action": "execute",
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }
        if actions:
            entry["actions"] = actions
        if fallback_prompt:
            entry["prompt"] = fallback_prompt
        prompt_cache.setdefault("steps", {})[step_name] = entry
        _save_prompt_cache(exam_slug, prompt_cache)
    elif (not disable_cache) and (not result.get("success")) and exam_slug and prompt_cache is not None and step_name in (prompt_cache.get("steps") or {}):
        prompt_cache.setdefault("steps", {}).pop(step_name, None)
        _save_prompt_cache(exam_slug, prompt_cache)
        await send_log(session_id, f"  🔄 Cache invalidated for '{step_name}' — will re-learn on next run", "warning")
    return result


async def _exec_scroll(session_id: str, step: dict) -> dict:
    # Use deterministic scroll endpoint (Stagehand /api/scroll) so scroll always works
    direction = step.get("direction", "down")
    pixels = step.get("pixels", 800)
    repeat = step.get("repeat", 1)
    for _ in range(repeat):
        res = await _stagehand("scroll", {
            "sessionId": session_id,
            "direction": direction,
            "pixels": pixels,
        })
        if not res.get("success"):
            return res
        await asyncio.sleep(0.4)
    return res


async def _exec_fill_form(session_id: str, step: dict, user_data: dict, exam_slug: str = None, prompt_cache: dict = None) -> dict:
    if step.get("scroll_first"):
        await _stagehand("scroll", {
            "sessionId": session_id,
            "direction": "down",
            "pixels": step.get("scroll_pixels", 600),
        })
        await asyncio.sleep(0.3)

    step_name = step.get("name", "")
    fields = step.get("fields", [])
    filled = 0
    for field in fields:
        if is_session_cancelled(session_id):
            return {"success": False, "error": "Stopped by user"}

        value = _resolve_value(field, user_data)
        if not value:
            await send_log(session_id, f"  ⚠️ No data for '{field['label']}', skipping", "warning")
            continue

        prompt = _build_prompt(field, value)
        ckey = _cache_key(step_name, field["label"])
        disable_cache = bool(field.get("disable_cache")) or bool(step.get("disable_cache"))
        cached_actions = []
        if (not disable_cache) and prompt_cache and exam_slug:
            cached = (prompt_cache.get("steps") or {}).get(ckey, {})
            if cached.get("actions"):
                cached_actions = cached["actions"]
                await send_log(session_id, f"  ✏️ {field['label']} (cached selector, no LLM)", "info")
            elif cached.get("prompt"):
                prompt = cached["prompt"]
        if not cached_actions:
            await send_log(session_id, f"  ✏️ {field['label']}", "info")

        max_field_retries = field.get("max_retries", 1)
        field_success = False
        for attempt in range(max_field_retries):
            if cached_actions:
                # Only override arguments for fill/type (text inputs).
                # selectOptionFromDropdown and multi-action entries (click dropdown + click option)
                # need their original cached arguments to match the exact option text.
                first_method = cached_actions[0].get("method", "") if cached_actions else ""
                use_override = first_method in ("fill", "type") and len(cached_actions) == 1
                payload = {
                    "sessionId": session_id,
                    "action": "actCached",
                    "actions": cached_actions,
                }
                if use_override:
                    payload["argumentsOverride"] = [value]
                result = await _stagehand("execute", payload)
                if not result.get("success"):
                    await send_log(session_id, f"  ⚠️ Cached selector failed for '{field['label']}', falling back to LLM", "warning")
                    result = await _stagehand("execute", {
                        "sessionId": session_id,
                        "action": "act",
                        "prompt": prompt,
                    })
            else:
                result = await _stagehand("execute", {
                    "sessionId": session_id,
                    "action": "act",
                    "prompt": prompt,
                })
            if result.get("success"):
                field_success = True
                break
            if attempt < max_field_retries - 1:
                await send_log(session_id, f"  ⚠️ {field['label']} retry {attempt+1}...", "warning")
                await asyncio.sleep(1.0)

        if not field_success:
            await send_log(session_id, f"  ⚠️ {field['label']} failed: {result.get('error','')}", "warning")
            if (not disable_cache) and exam_slug and prompt_cache is not None and ckey in (prompt_cache.get("steps") or {}):
                prompt_cache.setdefault("steps", {}).pop(ckey, None)
                _save_prompt_cache(exam_slug, prompt_cache)
                await send_log(session_id, f"  🔄 Cache invalidated for '{field['label']}' — will re-learn on next run", "warning")
        else:
            filled += 1
            if (not disable_cache) and exam_slug and prompt_cache is not None:
                actions = _extract_actions_from_result(result)
                entry = {
                    "action": "execute",
                    "updated_at": datetime.now(timezone.utc).isoformat(),
                }
                if actions:
                    entry["actions"] = actions
                if prompt:
                    entry["prompt"] = prompt
                prompt_cache.setdefault("steps", {})[ckey] = entry
                _save_prompt_cache(exam_slug, prompt_cache)

        # Screenshot after each field for live preview
        field_name = field["label"].replace(" ", "_").replace("/", "_").lower()
        await _screenshot(session_id, f"field_{field_name}")

        # Delay after field — use delay_after_ms if set (e.g. for dropdowns that need time to open/filter)
        delay_after_ms = field.get("delay_after_ms")
        if delay_after_ms is not None:
            await asyncio.sleep(delay_after_ms / 1000.0)
        else:
            delay = 0.5 if field.get("type") == "select" else 0.15
            await asyncio.sleep(delay)

    await send_log(session_id, f"  ✅ Filled {filled}/{len(fields)} fields", "success")

    # Scroll down after completing a section for better screenshot view
    await _stagehand("scroll", {
        "sessionId": session_id,
        "direction": "down",
        "pixels": 300,
    })
    await asyncio.sleep(0.3)
    await _screenshot(session_id, f"section_{step.get('name', 'done')}")

    # ── Self-healing: if some fields were missed, use LLM screenshot analysis ──
    if filled < len(fields):
        await send_log(session_id, f"  🔍 {len(fields) - filled} field(s) may be missing — running screenshot self-heal...", "info")
        try:
            # Build expected field-value pairs for the ones that failed
            field_value_pairs = []
            for field in fields:
                val = _resolve_value(field, user_data)
                if val:
                    field_value_pairs.append({"label": field["label"], "value": val})

            # Scroll up to see the section, take screenshot
            await _stagehand("scroll", {"sessionId": session_id, "direction": "up", "pixels": 600})
            await asyncio.sleep(0.3)
            ss = await _screenshot(session_id, "self_heal_check")

            if ss:
                missing = await _detect_missing_fields_llm(ss, field_value_pairs)
                if missing:
                    await send_log(session_id, f"  🔧 LLM detected {len(missing)} unfilled field(s): {', '.join(m['label'] for m in missing)}", "warning")
                    healed = 0
                    for mf in missing:
                        label = mf.get("label", "")
                        value = mf.get("value", "")
                        if not label or not value:
                            continue
                        await send_log(session_id, f"  🩹 Self-healing: {label}", "info")
                        heal_prompt = f"Find the input or dropdown labeled '{label}' on this form and fill it with '{value}'. Clear any existing text first."
                        heal_result = await _stagehand("execute", {
                            "sessionId": session_id,
                            "action": "act",
                            "prompt": heal_prompt,
                        })
                        if heal_result.get("success"):
                            healed += 1
                            filled += 1
                            await send_log(session_id, f"  ✅ Self-healed: {label}", "success")
                        else:
                            await send_log(session_id, f"  ⚠️ Self-heal failed for: {label}", "warning")
                        await _screenshot(session_id, f"heal_{label.replace(' ', '_').lower()}")
                        await asyncio.sleep(0.3)
                    if healed > 0:
                        await send_log(session_id, f"  🩹 Self-heal recovered {healed} field(s) — now {filled}/{len(fields)}", "success")
                else:
                    await send_log(session_id, f"  ✅ LLM confirms all visible fields are filled", "success")
        except Exception as e:
            await send_log(session_id, f"  ⚠️ Self-heal error: {e}", "warning")

    return {"success": True, "filled": filled, "total": len(fields)}


async def _exec_solve_captcha(session_id: str, step: dict) -> dict:
    max_tries = step.get("max_retries", 3)

    for attempt in range(max_tries):
        if is_session_cancelled(session_id):
            return {"success": False, "error": "Stopped by user"}

        ss = await _screenshot(session_id, "captcha_read")
        if not ss:
            return {"success": False, "error": "Could not take screenshot for captcha"}

        try:
            captcha_text = await _read_captcha_llm(ss)
        except Exception as e:
            await send_log(session_id, f"  ⚠️ Captcha LLM error: {e}", "warning")
            if attempt == max_tries - 1 and step.get("fallback_to_human"):
                await send_log(session_id, "Asking user to solve captcha...", "warning")
                captcha_text = await wait_for_human_input(
                    session_id, "captcha", "Please solve the CAPTCHA", captcha_image=ss,
                )
            else:
                continue

        await send_log(session_id, f"  🔤 Captcha: {captcha_text}", "info")
        result = await _stagehand("execute", {
            "sessionId": session_id,
            "action": "act",
            "prompt": f"Find the CAPTCHA input field (the text box above or near the captcha image) and type '{captcha_text}' into it. Clear any existing text first.",
        })
        if result.get("success"):
            return {"success": True}

        await send_log(session_id, f"  ⚠️ Captcha fill failed (attempt {attempt+1})", "warning")

    if step.get("fallback_to_human"):
        ss = await _screenshot(session_id, "captcha_human")
        captcha_text = await wait_for_human_input(
            session_id, "captcha", "Please solve the CAPTCHA", captcha_image=ss or "",
        )
        result = await _stagehand("execute", {
            "sessionId": session_id,
            "action": "act",
            "prompt": f"Find the CAPTCHA input field and type '{captcha_text}' into it. Clear any existing text first.",
        })
        return result

    return {"success": False, "error": "Captcha solving failed"}


async def _exec_wait_for_human(session_id: str, step: dict) -> dict:
    input_type = step.get("input_type", "custom")
    wait_reason = step.get("wait_reason", "Input needed")
    timeout = step.get("timeout_seconds", 300)

    value = await wait_for_human_input(session_id, input_type, wait_reason, timeout_seconds=timeout)

    if input_type == "otp" and value:
        await send_log(session_id, "🔢 Entering OTP...", "info")
        result = await _stagehand("input", {
            "sessionId": session_id,
            "inputType": "otp",
            "value": value,
        })
        if not result.get("success"):
            # Fallback: type OTP into the 6 boxes (one digit per box, in order)
            await _stagehand("execute", {
                "sessionId": session_id,
                "action": "act",
                "prompt": f"There are 6 separate OTP input boxes. Enter the 6-digit OTP '{value}' by typing each digit into each box in order from left to right.",
            })
    return {"success": True, "value": value}


async def _exec_check_success(session_id: str, step: dict) -> dict:
    ss = await _screenshot(session_id, "check_success")
    if not ss:
        return {"success": False, "error": "No screenshot"}

    patterns = step.get("success_patterns", [])
    try:
        is_success = await _check_success_llm(ss, patterns)
    except Exception as e:
        await send_log(session_id, f"⚠️ Success check failed: {e}", "warning")
        is_success = False

    return {"success": True, "completed": is_success}


# ── Main step dispatcher ────────────────────────────────────────────

async def _run_step(session_id: str, step: dict, user_data: dict, **kwargs) -> dict:
    """Execute one playbook step. Returns {success, error?, completed?}. kwargs may include exam_slug, prompt_cache for cost optimization."""
    action = step.get("action")
    name = step.get("name", f"step_{step.get('step')}")
    max_retries = step.get("max_retries", 1)
    wait_after = step.get("wait_after_ms", 1000)

    progress = min(int(step["step"] / step.get("_total", 15) * 95), 95)
    await send_log(session_id, f"📋 Step {step['step']}: {step.get('description', name)}", "info")
    await send_status(session_id, name, progress, step.get("description", ""))

    last_error = ""
    for attempt in range(max_retries):
        if is_session_cancelled(session_id):
            return {"success": False, "error": "Stopped by user"}

        try:
            if action == "click":
                res = await _exec_click(session_id, step, exam_slug=kwargs.get("exam_slug"), prompt_cache=kwargs.get("prompt_cache"))
            elif action == "click_checkbox":
                res = await _exec_click_checkbox(session_id, step, exam_slug=kwargs.get("exam_slug"), prompt_cache=kwargs.get("prompt_cache"))
            elif action == "scroll":
                res = await _exec_scroll(session_id, step)
            elif action == "fill_form":
                res = await _exec_fill_form(session_id, step, user_data, exam_slug=kwargs.get("exam_slug"), prompt_cache=kwargs.get("prompt_cache"))
            elif action == "solve_captcha":
                res = await _exec_solve_captcha(session_id, step)
            elif action == "wait_for_human":
                res = await _exec_wait_for_human(session_id, step)
            elif action == "check_success":
                res = await _exec_check_success(session_id, step)
            else:
                res = {"success": False, "error": f"Unknown action: {action}"}

            # Success indicator check (e.g. verify URL changed after click)
            success_indicator = step.get("success_indicator")
            if success_indicator and res.get("success"):
                page_url = (res.get("pageUrl") or "").lower()
                if success_indicator.startswith("url_contains:"):
                    required = success_indicator.split(":", 1)[1].strip().lower()
                    if required not in page_url:
                        res["success"] = False
                        res["error"] = f"Success check failed: page did not navigate (URL should contain '{required}')"
                        await send_log(session_id, f"❌ Step {step['step']} success check failed — still on {page_url[:60]}...", "warning")
                elif success_indicator.startswith("page_has:"):
                    required = success_indicator.split(":", 1)[1].strip().lower()
                    page_text = (res.get("page_text") or "").lower()
                    if required not in page_text:
                        res["success"] = False
                        res["error"] = f"Success check failed: page does not contain '{required}'"
                        await send_log(session_id, f"❌ Step {step['step']} success check failed", "warning")

            if not res.get("success", False) and action not in ("fill_form",):
                last_error = res.get("error", "Action failed")
                raise RuntimeError(last_error)

            # Post-step wait
            if wait_after > 0:
                await asyncio.sleep(wait_after / 1000)

            # Screenshot after step
            await _screenshot(session_id, name)

            # Error checking after click (e.g. submit)
            if step.get("check_for_errors"):
                ss = await _screenshot(session_id, f"{name}_error_check")
                if ss:
                    error_handlers = step.get("error_handlers", {})
                    if error_handlers:
                        detected = await _check_errors_llm(ss, list(error_handlers.keys()))
                        if detected:
                            handler = error_handlers.get(detected, "")
                            if handler.startswith("stop:"):
                                msg = handler.split(":", 1)[1]
                                return {"success": False, "error": msg, "stop": True}
                            if handler == "retry_captcha":
                                return {"success": False, "error": "invalid captcha", "retry_captcha": True}
                            if handler == "scroll_up_and_retry":
                                return {"success": False, "error": detected, "scroll_up_retry": True}

            return {**res, "success": True}

        except Exception as e:
            last_error = str(e)
            if attempt < max_retries - 1:
                await send_log(session_id, f"  ⚠️ Retry {attempt+1}/{max_retries}: {last_error}", "warning")
                await asyncio.sleep(2)

    return {"success": False, "error": last_error}


# ── Main entry point ─────────────────────────────────────────────────

async def run_playbook(session_id: str, playbook: dict, user_data: dict, start_from_step: int = None) -> dict:
    """
    Execute a full playbook from start to finish.
    
    Args:
        start_from_step: Optional step number to start from (for debugging). 
                        If set, browser will NOT be re-initialized - assumes session already exists.

    Returns {"status": "completed"|"failed"|"stopped", "result_message": str}
    """
    exam_name = playbook.get("exam_name", "Unknown")
    exam_slug = playbook.get("exam_slug", "")
    steps = playbook.get("workflow_steps", [])
    start_url = playbook.get("start_url", "")
    total = len(steps)
    prompt_cache = _load_prompt_cache(exam_slug) if exam_slug else {}

    steps_filtered = None
    if start_from_step is not None:
        await send_log(session_id, f"🔧 Retry from step {start_from_step} — reloading current page…", "warning")
        steps_filtered = [s for s in steps if s["step"] >= start_from_step]
        if not steps_filtered:
            return {"status": "failed", "result_message": f"No steps found from step {start_from_step}"}

    # ── Init or reload ──
    if is_session_cancelled(session_id):
        return {"status": "stopped", "result_message": "Stopped by user"}

    if start_from_step is not None:
        await send_status(session_id, "reload", 2, "Reloading current page…")
        await send_log(session_id, "🔄 Reloading current URL…", "info")
        init = await _stagehand("reload", {"sessionId": session_id})
        if not init.get("success") and "Session not found" in (init.get("error") or ""):
            await send_log(session_id, "⚠️ Previous session expired — starting fresh from exam URL…", "warning")
            init = await _stagehand("init", {"sessionId": session_id, "examUrl": start_url})
            if init.get("success"):
                steps = playbook.get("workflow_steps", [])
                steps_filtered = None
    else:
        await send_status(session_id, "init_browser", 2, "Starting browser...")
        await send_log(session_id, f"🌐 Navigating to {start_url}…", "info")
        init = await _stagehand("init", {"sessionId": session_id, "examUrl": start_url})

    if not init.get("success"):
        msg = init.get("error", "Browser init/reload failed")
        await send_log(session_id, f"❌ {msg}", "error")
        await send_result(session_id, False, msg)
        return {"status": "failed", "result_message": msg}

    if steps_filtered is not None:
        steps = steps_filtered

    await send_log(session_id, "✅ Ready", "success")
    await _screenshot(session_id, "init")
    await asyncio.sleep(2)

    # ── Walk through steps ──
    captcha_step = None  # track for retry_captcha handler

    for step in steps:
        step["_total"] = total  # so progress bar works

        if is_session_cancelled(session_id):
            return {"status": "stopped", "result_message": "Stopped by user"}

        if step["action"] == "solve_captcha":
            captcha_step = step

        result = await _run_step(session_id, step, user_data, exam_slug=exam_slug, prompt_cache=prompt_cache)

        # Handle special error flags
        if not result.get("success"):
            if result.get("stop"):
                await send_log(session_id, f"🛑 {result['error']}", "error")
                await send_result(session_id, False, result["error"])
                return {"status": "failed", "result_message": result["error"]}

            if result.get("retry_captcha") and captcha_step:
                await send_log(session_id, "🔄 Captcha was wrong — re-solving…", "warning")
                cap_res = await _run_step(session_id, captcha_step, user_data, exam_slug=exam_slug, prompt_cache=prompt_cache)
                if cap_res.get("success"):
                    result = await _run_step(session_id, step, user_data, exam_slug=exam_slug, prompt_cache=prompt_cache)
                    if result.get("success"):
                        continue
                # If still failing, fall through to generic error

            if result.get("scroll_up_retry"):
                await send_log(session_id, "🔄 Missing required field — scrolling up to check…", "warning")
                await _stagehand("execute", {
                    "sessionId": session_id,
                    "action": "act",
                    "prompt": "Scroll to the top of the page",
                })
                await _screenshot(session_id, "scroll_up")
                # Don't abort — let user see what happened
                continue

            # Generic failure
            await send_log(session_id, f"❌ Step {step['step']} failed: {result.get('error')}", "error")
            await send_result(session_id, False, f"Step {step.get('name')}: {result.get('error')}")
            return {"status": "failed", "result_message": f"Failed at step {step['step']}: {result.get('error')}"}

        # If check_success completed the workflow
        if result.get("completed"):
            await send_log(session_id, f"🎉 {exam_name} registration completed!", "success")
            await send_result(session_id, True, f"{exam_name} registration successful!")
            return {"status": "completed", "result_message": f"{exam_name} registration successful!"}

    await send_log(session_id, f"✅ All {total} steps completed", "success")
    await send_result(session_id, True, f"{exam_name} playbook completed")
    return {"status": "completed", "result_message": f"{exam_name} playbook completed"}
