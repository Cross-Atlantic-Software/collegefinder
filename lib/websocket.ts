/**
 * WebSocket utility for real-time workflow updates
 * Connects to python-backend WebSocket for live automation status
 */

interface WebSocketMessage {
    type: string;
    payload?: {
        sessionId?: string;
        message?: string;
        level?: 'info' | 'success' | 'warning' | 'error';
        imageBase64?: string;
        step?: string;
        progress?: number;
        fieldId?: string;
        label?: string;
        type?: string;
        success?: boolean;
    };
}

// No trailing slash - we append /workflow or /workflow/:id
const WS_BASE = (process.env.NEXT_PUBLIC_AUTOMATION_WS_URL || 'ws://localhost:8000/ws').replace(/\/$/, '');

export interface WorkflowHandlers {
    onLog: (message: string, level: 'info' | 'success' | 'warning' | 'error') => void;
    onScreenshot: (imageBase64: string, step: string) => void;
    onStatus: (step: string, progress: number, message: string) => void;
    onRequestOTP: () => void;
    onRequestCaptcha: (imageBase64: string) => void;
    onRequestCustomInput: (fieldId: string, label: string, type: string) => void;
    onResult: (success: boolean, message: string) => void;
    onSessionCreated: (sessionId: string) => void;
    onError: (message: string) => void;
    onClose: () => void;
}

/**
 * Connect to workflow WebSocket and start automation
 */
export function connectToWorkflow(
    examId: string,
    userId: string,
    handlers: Partial<WorkflowHandlers>
): WebSocket {
    const url = `${WS_BASE}/workflow`;
    const ws = new WebSocket(url);
    let opened = false;

    ws.onopen = () => {
        opened = true;
        console.log('[WebSocket] Connected to workflow');

        // Send start workflow message
        ws.send(JSON.stringify({
            type: 'START_WORKFLOW',
            payload: { examId, userId }
        }));
    };

    ws.onmessage = (event) => {
        try {
            const message = JSON.parse(event.data);
            handleMessage(message, handlers);
        } catch (error) {
            console.error('[WebSocket] Error parsing message:', error);
        }
    };

    ws.onerror = () => {
        if (!opened) {
            handlers.onError?.(
                'Cannot reach automation server. Make sure the Python backend is running on port 8000 (e.g. cd python-backend && uvicorn app.main:app --host 0.0.0.0 --port 8000).'
            );
        }
    };

    ws.onclose = (event) => {
        console.log('[WebSocket] Disconnected', event.code, event.reason);
        if (!opened && event.code !== 1000) {
            handlers.onError?.(
                'Connection failed. Start the automation server: in python-backend run `uvicorn app.main:app --host 0.0.0.0 --port 8000`.'
            );
        }
        handlers.onClose?.();
    };

    return ws;
}

/**
 * Connect to existing workflow session
 */
export function connectToSession(
    sessionId: string,
    handlers: Partial<WorkflowHandlers>
): WebSocket {
    const ws = new WebSocket(`${WS_BASE}/workflow/${sessionId}`);
    let opened = false;

    ws.onopen = () => {
        opened = true;
        console.log(`[WebSocket] Connected to session: ${sessionId}`);
    };

    ws.onmessage = (event) => {
        try {
            const message = JSON.parse(event.data);
            handleMessage(message, handlers);
        } catch (error) {
            console.error('[WebSocket] Error parsing message:', error);
        }
    };

    ws.onerror = () => {
        if (!opened) handlers.onError?.('Cannot reach automation server. Is the Python backend running on port 8000?');
    };

    ws.onclose = (event) => {
        console.log('[WebSocket] Disconnected', event.code);
        if (!opened && event.code !== 1000) handlers.onError?.('Connection failed. Is the Python backend running on port 8000?');
        handlers.onClose?.();
    };

    return ws;
}

/**
 * Handle incoming WebSocket messages
 */
function handleMessage(message: WebSocketMessage, handlers: Partial<WorkflowHandlers>) {
    const { type, payload } = message;

    switch (type) {
        case 'SESSION_CREATED':
            handlers.onSessionCreated?.(payload?.sessionId || '');
            break;

        case 'LOG':
            handlers.onLog?.(payload?.message || '', payload?.level || 'info');
            break;

        case 'SCREENSHOT':
            handlers.onScreenshot?.(payload?.imageBase64 || '', payload?.step || 'capture');
            break;

        case 'STATUS':
            handlers.onStatus?.(payload?.step || '', payload?.progress || 0, payload?.message || '');
            break;

        case 'REQUEST_OTP':
            handlers.onRequestOTP?.();
            break;

        case 'REQUEST_CAPTCHA':
            handlers.onRequestCaptcha?.(payload?.imageBase64 || '');
            break;

        case 'REQUEST_CUSTOM_INPUT':
            handlers.onRequestCustomInput?.(payload?.fieldId || '', payload?.label || '', payload?.type || 'text');
            break;

        case 'RESULT':
            handlers.onResult?.(payload?.success || false, payload?.message || '');
            break;

        case 'ERROR':
            handlers.onError?.(payload?.message || ''   );
            break;

        default:
            console.log('[WebSocket] Unknown message type:', type);
    }
}

/**
 * Send OTP to workflow
 */
export function submitOTP(ws: WebSocket, otp: string) {
    ws.send(JSON.stringify({
        type: 'OTP_SUBMIT',
        payload: { otp }
    }));
}

/**
 * Send captcha solution to workflow
 */
export function submitCaptcha(ws: WebSocket, solution: string) {
    ws.send(JSON.stringify({
        type: 'CAPTCHA_SUBMIT',
        payload: { solution }
    }));
}

/**
 * Send custom input to workflow
 */
export function submitCustomInput(ws: WebSocket, fieldId: string, value: string) {
    ws.send(JSON.stringify({
        type: 'CUSTOM_INPUT_SUBMIT',
        payload: { fieldId, value }
    }));
}

/**
 * Pause workflow
 */
export function pauseWorkflow(ws: WebSocket) {
    ws.send(JSON.stringify({ type: 'PAUSE_WORKFLOW' }));
}

/**
 * Resume workflow
 */
export function resumeWorkflow(ws: WebSocket) {
    ws.send(JSON.stringify({ type: 'RESUME_WORKFLOW' }));
}

/**
 * Stop workflow - cancels the running automation
 */
export function stopWorkflow(ws: WebSocket) {
    ws.send(JSON.stringify({ type: 'STOP_WORKFLOW' }));
}
