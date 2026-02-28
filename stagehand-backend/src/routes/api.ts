/**
 * API Routes for Stagehand Browser Automation
 * 
 * These endpoints are called by the Python LangGraph backend
 * to execute browser actions.
 * 
 * Stagehand v3 API - uses simple string parameters
 */
import { Router, Request, Response } from "express";
import { z } from "zod";
import { sessionManager } from "../sessions.js";
import { wsManager } from "../websocket.js";
import {
    buildFillPrompt,
    buildClickButtonPrompt,
    buildCheckboxPrompt,
    buildOtpPrompt,
    buildCaptchaPrompt,
    buildSubmitPrompt,
    buildSelectPrompt,
    normalizeFieldLabel,
} from "../prompts.js";

const router = Router();

// ==================== Request Schemas ====================

const InitRequestSchema = z.object({
    sessionId: z.string(),
    examUrl: z.string().url(),
});

const ReloadRequestSchema = z.object({
    sessionId: z.string(),
});

const CachedActionSchema = z.object({
    selector: z.string(),
    description: z.string(),
    method: z.string(),
    arguments: z.array(z.union([z.string(), z.number(), z.boolean()])).default([]),
});

const ExecuteRequestSchema = z.object({
    sessionId: z.string(),
    action: z.enum(["act", "observe", "extract", "actCached"]),
    prompt: z.string().optional(),
    actions: z.array(CachedActionSchema).optional(),
    /** For actCached: override arguments (e.g. new field value) for the first action */
    argumentsOverride: z.array(z.union([z.string(), z.number(), z.boolean()])).optional(),
});

const FillFormRequestSchema = z.object({
    sessionId: z.string(),
    fields: z.array(z.object({
        key: z.string(),
        label: z.string().optional(),
        value: z.string(),
        type: z.enum(["text", "select", "checkbox", "date"]).optional(),
    })),
});

const ClickRequestSchema = z.object({
    sessionId: z.string(),
    target: z.string(),
    type: z.enum(["button", "checkbox", "link"]).optional(),
});

const InputRequestSchema = z.object({
    sessionId: z.string(),
    inputType: z.enum(["otp", "captcha"]),
    value: z.string(),
});

const CloseRequestSchema = z.object({
    sessionId: z.string(),
});

const ScrollRequestSchema = z.object({
    sessionId: z.string(),
    direction: z.enum(["down", "up"]).optional().default("down"),
    pixels: z.number().optional().default(800),
});

// ==================== Helper Functions ====================

async function captureAndBroadcast(sessionId: string, step: string, page?: { screenshot(): Promise<Buffer> }): Promise<string | null> {
    const stagehand = sessionManager.get(sessionId);
    const targetPage = page ?? stagehand?.context?.pages()[0];
    if (!targetPage) return null;

    try {
        const buffer = await targetPage.screenshot();
        const screenshot = buffer.toString("base64");
        wsManager.broadcastScreenshot(sessionId, screenshot, step);
        return screenshot;
    } catch (error) {
        console.error(`[${sessionId}] Failed to capture screenshot:`, error);
        return null;
    }
}

/**
 * If the action opened a new tab, wait for it, switch to it (close old tab)
 * so future actions run on the new page. Polls up to 8 seconds for the new tab.
 */
async function switchToNewTabIfOpened(stagehand: { context: { pages: () => unknown[] } | null }) {
    type PW = { url: () => string; close: () => Promise<void>; screenshot: () => Promise<Buffer>; evaluate: (fn: () => string) => Promise<string>; waitForLoadState: (s: string) => Promise<void> };

    if (!stagehand.context) {
        console.warn("[switchTab] stagehand.context is null — browser may have crashed");
        return { page: null, pageUrl: "" };
    }

    // Poll for a new tab (link may open it asynchronously after click)
    let pages = stagehand.context.pages() as PW[];
    for (let i = 0; i < 16 && pages.length <= 1; i++) {
        await new Promise((r) => setTimeout(r, 500));
        if (!stagehand.context) return { page: null, pageUrl: "" };
        pages = stagehand.context.pages() as PW[];
    }

    if (pages.length <= 1) {
        const p = pages[0];
        return { page: p, pageUrl: p.url() };
    }

    console.log(`[switchTab] Found ${pages.length} tabs — switching to newest`);
    const oldPage = pages[0];
    const newPage = pages[pages.length - 1];

    // Wait for the new page to finish loading
    try {
        await newPage.waitForLoadState("domcontentloaded");
    } catch (_) { /* ignore timeout */ }
    await new Promise((r) => setTimeout(r, 1000));

    const newUrl = newPage.url();
    console.log(`[switchTab] New tab URL: ${newUrl}`);

    await oldPage.close();
    return { page: newPage, pageUrl: newUrl };
}

// ==================== Endpoints ====================

/**
 * POST /api/init
 * Initialize a new browser session and navigate to URL
 */
router.post("/init", async (req: Request, res: Response) => {
    try {
        const { sessionId, examUrl } = InitRequestSchema.parse(req.body);

        wsManager.broadcastLog(sessionId, "Initializing browser...", "info");
        wsManager.broadcastStatus(sessionId, "init", 5, "Starting browser...");

        const stagehand = await sessionManager.create(sessionId);
        const page = stagehand.context.pages()[0];

        // Full-screen viewport before navigation (runs in background when headless)
        await page.setViewportSize({ width: 1920, height: 1080 });

        wsManager.broadcastLog(sessionId, `Navigating to ${examUrl}`, "info");
        // Use longer timeout for slow government sites
        await page.goto(examUrl, {
            waitUntil: "networkidle",
            timeoutMs: 120000  // 120 seconds for slow gov sites
        });

        // Wait a bit for page to stabilize
        await new Promise(resolve => setTimeout(resolve, 2000));

        const screenshot = await captureAndBroadcast(sessionId, "init");

        wsManager.broadcastLog(sessionId, "Browser ready", "success");
        wsManager.broadcastStatus(sessionId, "init", 10, "Browser ready");

        res.json({
            success: true,
            sessionId,
            screenshot,
            pageUrl: page.url(),
        });
    } catch (error) {
        console.error("[init] Error:", error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
});

/**
 * POST /api/reload
 * Reload the current page in an existing session (for retry from step N).
 */
router.post("/reload", async (req: Request, res: Response) => {
    try {
        const { sessionId } = ReloadRequestSchema.parse(req.body);
        const stagehand = sessionManager.get(sessionId);

        if (!stagehand) {
            return res.status(404).json({ success: false, error: "Session not found" });
        }

        if (!stagehand.context) {
            return res.status(400).json({ success: false, error: "Browser context not available" });
        }

        const pages = stagehand.context.pages();
        const page = pages[pages.length - 1];
        if (!page) {
            return res.status(400).json({ success: false, error: "No page to reload" });
        }

        wsManager.broadcastLog(sessionId, "Reloading current page...", "info");
        await page.reload({ waitUntil: "domcontentloaded", timeoutMs: 60000 });
        await new Promise((r) => setTimeout(r, 2000));

        const screenshot = await captureAndBroadcast(sessionId, "reload", page);

        res.json({
            success: true,
            sessionId,
            screenshot,
            pageUrl: page.url(),
        });
    } catch (error) {
        console.error("[reload] Error:", error);
        res.json({
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
});

/**
 * POST /api/execute
 * Execute a raw Stagehand action (act/observe/extract)
 * Used for custom prompts from LangGraph
 */
router.post("/execute", async (req: Request, res: Response) => {
    try {
        const body = ExecuteRequestSchema.parse(req.body);
        const { sessionId, action, prompt, actions: cachedActions } = body;
        const stagehand = sessionManager.get(sessionId);

        if (!stagehand) {
            return res.status(404).json({ success: false, error: "Session not found" });
        }

        let result: unknown;

        if (action === "actCached" && cachedActions?.length) {
            // Deterministic execution: no LLM call — use cached selector from previous run
            const first = { ...cachedActions[0] };
            if (body.argumentsOverride && body.argumentsOverride.length > 0) {
                first.arguments = body.argumentsOverride;
            }
            wsManager.broadcastLog(sessionId, "Executing cached action (no LLM)", "info");
            console.log(`[${sessionId}] actCached: ${first.method} on selector`);
            result = await stagehand.act(first);
        } else {
            const promptStr = prompt ?? "";
            wsManager.broadcastLog(sessionId, `Executing: ${action}`, "info");
            console.log(`[${sessionId}] Executing ${action}: ${promptStr.substring(0, 100)}...`);

            if (action === "act") {
                result = await stagehand.act(promptStr);
            } else if (action === "observe") {
                result = await stagehand.observe(promptStr);
            } else if (action === "extract") {
                result = await stagehand.extract(promptStr);
            } else {
                return res.status(400).json({ success: false, error: "Missing prompt or invalid action" });
            }
        }

        // If a new tab was opened (e.g. CUET registration link), switch to it
        const { page: activePage, pageUrl } = await switchToNewTabIfOpened(stagehand);

        const screenshot = await captureAndBroadcast(sessionId, action, activePage ?? undefined);

        // GET PAGE TEXT FROM DOM - UI-BASED DETECTION
        let page_text = "";
        if (activePage) {
            try {
                page_text = await (activePage as unknown as import("playwright").Page).evaluate(() => {
                    return document.body.innerText || document.body.textContent || "";
                });
            } catch (_) { /* page may not support evaluate after tab switch */ }
        }

        res.json({
            success: true,
            result,
            screenshot,
            page_text,
            pageUrl,
        });
    } catch (error) {
        console.error("[execute] Error:", error);
        const sessionId = req.body?.sessionId;
        if (sessionId) {
            wsManager.broadcastLog(sessionId, `Action failed: ${error instanceof Error ? error.message : "Unknown error"}`, "error");
        }
        res.json({
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
});

/**
 * POST /api/fill-form
 * Fill multiple form fields using robust prompts
 */
router.post("/fill-form", async (req: Request, res: Response) => {
    try {
        const { sessionId, fields } = FillFormRequestSchema.parse(req.body);
        const stagehand = sessionManager.get(sessionId);

        if (!stagehand) {
            return res.status(404).json({ success: false, error: "Session not found" });
        }

        wsManager.broadcastStatus(sessionId, "fill_form", 40, "Filling form fields...");

        const results: Array<{ key: string; success: boolean; error?: string }> = [];

        for (const field of fields) {
            const label = field.label || normalizeFieldLabel(field.key);
            wsManager.broadcastLog(sessionId, `Filling: ${label}`, "info");

            try {
                let prompt: string;

                if (field.type === "select") {
                    prompt = buildSelectPrompt(label, field.value);
                } else if (field.type === "checkbox") {
                    prompt = buildCheckboxPrompt(label);
                } else {
                    prompt = buildFillPrompt(label, field.value);
                }

                console.log(`[${sessionId}] Fill prompt: ${prompt}`);
                // Stagehand v3 - just pass string
                await stagehand.act(prompt);

                results.push({ key: field.key, success: true });
                await captureAndBroadcast(sessionId, `fill_${field.key}`);

                // Small delay between fields
                await new Promise(resolve => setTimeout(resolve, 300));

            } catch (error) {
                console.error(`[${sessionId}] Failed to fill ${field.key}:`, error);
                results.push({
                    key: field.key,
                    success: false,
                    error: error instanceof Error ? error.message : "Unknown error",
                });
            }
        }

        const successCount = results.filter(r => r.success).length;
        wsManager.broadcastLog(sessionId, `Filled ${successCount}/${fields.length} fields`, "success");

        const screenshot = await captureAndBroadcast(sessionId, "fill_form_complete");

        res.json({
            success: true,
            results,
            screenshot,
        });
    } catch (error) {
        console.error("[fill-form] Error:", error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
});

/**
 * POST /api/click
 * Click a button, checkbox, or link
 */
router.post("/click", async (req: Request, res: Response) => {
    try {
        const { sessionId, target, type = "button" } = ClickRequestSchema.parse(req.body);
        const stagehand = sessionManager.get(sessionId);

        if (!stagehand) {
            return res.status(404).json({ success: false, error: "Session not found" });
        }

        wsManager.broadcastLog(sessionId, `Clicking: ${target}`, "info");

        let prompt: string;
        if (type === "checkbox") {
            prompt = buildCheckboxPrompt(target);
        } else {
            prompt = buildClickButtonPrompt(target);
        }

        console.log(`[${sessionId}] Click prompt: ${prompt}`);
        // Stagehand v3 - just pass string
        await stagehand.act(prompt);

        let page: unknown = null;
        let pageUrl = "";

        // Only check for new tabs on links/buttons, never on checkboxes
        if (type !== "checkbox") {
            const tabResult = await switchToNewTabIfOpened(stagehand);
            page = tabResult.page;
            pageUrl = tabResult.pageUrl;
            await new Promise((resolve) => setTimeout(resolve, 1000));
        } else {
            await new Promise((resolve) => setTimeout(resolve, 500));
        }

        const screenshot = await captureAndBroadcast(sessionId, "click", (page as { screenshot(): Promise<Buffer> }) ?? undefined);

        wsManager.broadcastLog(sessionId, `Clicked: ${target}`, "success");

        res.json({
            success: true,
            screenshot,
            pageUrl,
        });
    } catch (error) {
        console.error("[click] Error:", error);
        res.json({
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
});

/**
 * POST /api/submit
 * Click the submit/continue button
 */
router.post("/submit", async (req: Request, res: Response) => {
    try {
        const { sessionId } = CloseRequestSchema.parse(req.body);
        const stagehand = sessionManager.get(sessionId);

        if (!stagehand) {
            return res.status(404).json({ success: false, error: "Session not found" });
        }

        wsManager.broadcastLog(sessionId, "Clicking submit button...", "info");
        wsManager.broadcastStatus(sessionId, "submit", 60, "Submitting form...");

        const prompt = buildSubmitPrompt();
        console.log(`[${sessionId}] Submit prompt: ${prompt}`);

        // Stagehand v3 - just pass string
        await stagehand.act(prompt);

        // Wait for navigation
        const page = await stagehand.context.awaitActivePage();
        await new Promise(resolve => setTimeout(resolve, 2000));

        const screenshot = await captureAndBroadcast(sessionId, "submit");

        wsManager.broadcastLog(sessionId, "Form submitted", "success");

        res.json({
            success: true,
            screenshot,
            pageUrl: page.url(),
        });
    } catch (error) {
        console.error("[submit] Error:", error);
        res.json({
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
});

/**
 * POST /api/input
 * Enter OTP or captcha solution
 */
router.post("/input", async (req: Request, res: Response) => {
    try {
        const { sessionId, inputType, value } = InputRequestSchema.parse(req.body);
        const stagehand = sessionManager.get(sessionId);

        if (!stagehand) {
            return res.status(404).json({ success: false, error: "Session not found" });
        }

        wsManager.broadcastLog(sessionId, `Entering ${inputType}...`, "info");

        let prompt: string;
        if (inputType === "otp") {
            prompt = buildOtpPrompt(value);
        } else {
            prompt = buildCaptchaPrompt(value);
        }

        console.log(`[${sessionId}] Input prompt: ${prompt}`);
        // Stagehand v3 - just pass string
        await stagehand.act(prompt);

        const screenshot = await captureAndBroadcast(sessionId, `input_${inputType}`);

        wsManager.broadcastLog(sessionId, `${inputType.toUpperCase()} entered`, "success");

        res.json({
            success: true,
            screenshot,
        });
    } catch (error) {
        console.error("[input] Error:", error);
        res.json({
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
});

/**
 * POST /api/analyze
 * Analyze current page state using extract
 */
router.post("/analyze", async (req: Request, res: Response) => {
    try {
        const { sessionId } = CloseRequestSchema.parse(req.body);
        const stagehand = sessionManager.get(sessionId);

        if (!stagehand) {
            return res.status(404).json({ success: false, error: "Session not found" });
        }

        wsManager.broadcastLog(sessionId, "Analyzing page...", "info");

        // Stagehand v3 - simple extract with string instruction
        // IMPORTANT: Detect unchecked required checkboxes FIRST
        const pageState = await stagehand.extract(
            `Analyze this page and return JSON with:
- pageType: "login" or "form" or "otp" or "captcha" or "success" or "error"
- formFields: list of visible input field labels
- hasUncheckedCheckbox: true if there's an unchecked checkbox (like "I hereby declare", "I agree", terms and conditions) that MUST be clicked first
- uncheckedCheckboxLabel: the label/text of the unchecked checkbox if any
- hasOtp: true if there's an OTP/verification code input
- hasCaptcha: true if there's a captcha
- buttons: list of button texts (especially submit/continue)
- errors: list of any error messages`
        );

        const screenshot = await captureAndBroadcast(sessionId, "analyze");

        res.json({
            success: true,
            analysis: pageState,
            screenshot,
        });
    } catch (error) {
        console.error("[analyze] Error:", error);
        res.json({
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
});

/**
 * POST /api/scroll
 * Scroll the page by a fixed number of pixels (deterministic, no AI)
 */
router.post("/scroll", async (req: Request, res: Response) => {
    try {
        const { sessionId, direction, pixels } = ScrollRequestSchema.parse(req.body);
        const stagehand = sessionManager.get(sessionId);

        if (!stagehand) {
            return res.status(404).json({ success: false, error: "Session not found" });
        }

        const page = stagehand.context.pages()[0];
        const delta = direction === "up" ? -pixels : pixels;
        await page.evaluate((dy) => {
            window.scrollBy({ top: dy, left: 0, behavior: "auto" });
        }, delta);

        await new Promise((r) => setTimeout(r, 300));

        const screenshot = await captureAndBroadcast(sessionId, "scroll");
        const pageUrl = page.url();

        res.json({
            success: true,
            screenshot,
            pageUrl,
        });
    } catch (error) {
        console.error("[scroll] Error:", error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
});

/**
 * POST /api/screenshot
 * Capture current page screenshot
 */
router.post("/screenshot", async (req: Request, res: Response) => {
    try {
        const { sessionId } = CloseRequestSchema.parse(req.body);
        const stagehand = sessionManager.get(sessionId);
        
        if (!stagehand) {
            return res.status(404).json({ success: false, error: "Session not found" });
        }
        
        const screenshot = await captureAndBroadcast(sessionId, "manual");

        if (!screenshot) {
            return res.status(404).json({ success: false, error: "Session not found" });
        }

        // GET PAGE TEXT FROM DOM - UI-BASED DETECTION
        const page = stagehand.context.pages()[0];
        const page_text = await page.evaluate(() => {
            return document.body.innerText || document.body.textContent || "";
        });

        res.json({
            success: true,
            screenshot,
            page_text,  // Return page text for UI-based error detection
        });
    } catch (error) {
        console.error("[screenshot] Error:", error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
});

/**
 * POST /api/close
 * Close browser session
 */
router.post("/close", async (req: Request, res: Response) => {
    try {
        const { sessionId } = CloseRequestSchema.parse(req.body);

        wsManager.broadcastLog(sessionId, "Closing browser...", "info");
        await sessionManager.close(sessionId);

        res.json({ success: true });
    } catch (error) {
        console.error("[close] Error:", error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
});

/**
 * GET /api/health
 * Health check endpoint
 */
router.get("/health", (_req: Request, res: Response) => {
    res.json({
        status: "ok",
        timestamp: new Date().toISOString(),
    });
});

export { router as apiRouter };