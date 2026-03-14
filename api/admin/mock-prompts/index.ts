import { apiRequest } from '../../client';
import { API_ENDPOINTS } from '../../constants';
import { ApiResponse } from '../../types';

export interface MockPromptItem {
  exam_id: number;
  exam_name: string;
  exam_code: string;
  prompt: string;
  prompt_updated_at: string | null;
}

/**
 * List all exams with their mock prompt (from exam_mock_prompts table)
 */
export async function getMockPromptsList(): Promise<ApiResponse<{
  items: MockPromptItem[];
}>> {
  return apiRequest(`${API_ENDPOINTS.ADMIN.MOCK_PROMPTS}`, {
    method: 'GET',
  });
}

/**
 * Get mock prompt for one exam
 */
export async function getMockPrompt(examId: number): Promise<ApiResponse<{
  exam_id: number;
  prompt: string;
  hasCustomPrompt: boolean;
}>> {
  return apiRequest(`${API_ENDPOINTS.ADMIN.MOCK_PROMPTS}/${examId}`, {
    method: 'GET',
  });
}

/**
 * Update mock prompt for an exam
 */
export async function updateMockPrompt(
  examId: number,
  prompt: string
): Promise<ApiResponse<{ exam_id: number; prompt: string }>> {
  return apiRequest(`${API_ENDPOINTS.ADMIN.MOCK_PROMPTS}/${examId}`, {
    method: 'PUT',
    body: JSON.stringify({ prompt }),
  });
}
