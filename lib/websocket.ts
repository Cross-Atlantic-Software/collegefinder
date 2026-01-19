/**
 * WebSocket utility for real-time workflow updates
 * Connects to python-backend WebSocket for live automation status
 */

const WS_URL = process.env.NEXT_PUBLIC_AUTOMATION_WS_URL || 'ws://localhost:8000/ws';

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
    const ws = new WebSocket(`${WS_URL}/workflow`);

    ws.onopen = () => {
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

    ws.onerror = (error) => {
        console.error('[WebSocket] Error:', error);
        handlers.onError?.('WebSocket connection error');
    };

    ws.onclose = () => {
        console.log('[WebSocket] Disconnected');
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
    const ws = new WebSocket(`${WS_URL}/workflow/${sessionId}`);

    ws.onopen = () => {
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

    ws.onerror = (error) => {
        console.error('[WebSocket] Error:', error);
        handlers.onError?.('WebSocket connection error');
    };

    ws.onclose = () => {
        console.log('[WebSocket] Disconnected');
        handlers.onClose?.();
    };

    return ws;
}

/**
 * Handle incoming WebSocket messages
 */
function handleMessage(message: any, handlers: Partial<WorkflowHandlers>) {
    const { type, payload } = message;

    switch (type) {
        case 'SESSION_CREATED':
            handlers.onSessionCreated?.(payload.sessionId);
            break;

        case 'LOG':
            handlers.onLog?.(payload.message, payload.level || 'info');
            break;

        case 'SCREENSHOT':
            handlers.onScreenshot?.(payload.imageBase64, payload.step || 'capture');
            break;

        case 'STATUS':
            handlers.onStatus?.(payload.step, payload.progress || 0, payload.message || '');
            break;

        case 'REQUEST_OTP':
            handlers.onRequestOTP?.();
            break;

        case 'REQUEST_CAPTCHA':
            handlers.onRequestCaptcha?.(payload.imageBase64);
            break;

        case 'REQUEST_CUSTOM_INPUT':
            handlers.onRequestCustomInput?.(payload.fieldId, payload.label, payload.type || 'text');
            break;

        case 'RESULT':
            handlers.onResult?.(payload.success, payload.message);
            break;

        case 'ERROR':
            handlers.onError?.(payload.message);
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
