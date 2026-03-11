/**
 * Automation API - Connects to python-backend for workflow automation
 * Used by admin panel to trigger exam registration automation
 */

import type { ApiResponse } from '../types';

// Python backend URL (separate from collegefinder backend)
const AUTOMATION_API_URL = process.env.NEXT_PUBLIC_AUTOMATION_URL || 'http://localhost:8000/api';

/**
 * Generic automation API request function
 */
async function automationRequest<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<ApiResponse<T>> {
    const url = `${AUTOMATION_API_URL}${endpoint}`;

    try {
        const response = await fetch(url, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
        });

        const data = await response.json();

        if (!response.ok) {
            return {
                success: false,
                message: data.detail || data.message || 'Automation API error',
            };
        }

        return {
            success: true,
            ...data,
        };
    } catch (error) {
        console.error('Automation API request error:', error);
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Network error',
        };
    }
}


// ============= Types =============

export interface AutomationExam {
    id: string;
    name: string;
    slug: string;
    url: string;
    status: 'active' | 'inactive';
}

export interface AutomationUser {
    id: string;
    profile: {
        full_name: string;
        email: string;
        phone: string;
    };
    collegefinder_user_id?: number;
}

export interface WorkflowSession {
    id: string;
    exam_id: string;
    user_id: string;
    status: 'pending' | 'running' | 'waiting' | 'success' | 'failed';
    current_step?: string;
    progress?: number;
    started_at?: string;
    completed_at?: string;
}


// ============= Sync Functions =============

/**
 * Sync a user from collegefinder to python-backend
 */
export async function syncUserForAutomation(
    collegefinderUserId: number,
    adminToken: string
): Promise<ApiResponse<{ python_user_id: string; message: string }>> {
    return automationRequest('/sync/user', {
        method: 'POST',
        body: JSON.stringify({
            collegefinder_user_id: collegefinderUserId,
            admin_token: adminToken,
        }),
    });
}

/**
 * Get a synced user by collegefinder ID
 */
export async function getSyncedUser(
    collegefinderUserId: number
): Promise<ApiResponse<AutomationUser>> {
    return automationRequest(`/sync/user/${collegefinderUserId}`, {
        method: 'GET',
    });
}


// ============= Exam Functions =============

/**
 * Get all exams available for automation
 */
export async function getAutomationExams(): Promise<ApiResponse<{ exams: AutomationExam[] }>> {
    return automationRequest('/exams', {
        method: 'GET',
    });
}

/**
 * Get a specific exam by ID
 */
export async function getAutomationExam(examId: string): Promise<ApiResponse<{ exam: AutomationExam }>> {
    return automationRequest(`/exams/${examId}`, {
        method: 'GET',
    });
}


// ============= Workflow Functions =============

/**
 * Start a workflow for a user and exam
 * This is called via WebSocket, but we can also have a REST version
 */
export async function startWorkflow(
    examId: string,
    userId: string
): Promise<ApiResponse<{ session_id: string }>> {
    return automationRequest('/workflow/start', {
        method: 'POST',
        body: JSON.stringify({ exam_id: examId, user_id: userId }),
    });
}

/**
 * Get workflow session status
 */
export async function getWorkflowStatus(
    sessionId: string
): Promise<ApiResponse<WorkflowSession>> {
    return automationRequest(`/workflow/status/${sessionId}`, {
        method: 'GET',
    });
}

/**
 * Get all workflow sessions for a user
 */
export async function getUserWorkflows(
    userId: string
): Promise<ApiResponse<{ sessions: WorkflowSession[] }>> {
    return automationRequest(`/workflow/user/${userId}`, {
        method: 'GET',
    });
}
