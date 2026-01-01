import { apiRequest } from '../../client';
import { API_ENDPOINTS } from '../../constants';
import { ApiResponse } from '../../types';

export interface Exam {
  id: number;
  name: string;
  code: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Get all exams (for admin)
 */
export async function getAllExamsAdmin(): Promise<ApiResponse<{
  exams: Exam[];
}>> {
  return apiRequest(API_ENDPOINTS.ADMIN.EXAMS, {
    method: 'GET',
  });
}

/**
 * Get exam by ID
 */
export async function getExamById(id: number): Promise<ApiResponse<{
  exam: Exam;
}>> {
  return apiRequest(`${API_ENDPOINTS.ADMIN.EXAMS}/${id}`, {
    method: 'GET',
  });
}

/**
 * Create new exam
 */
export async function createExam(data: {
  name: string;
  code: string;
  description?: string;
}): Promise<ApiResponse<{
  exam: Exam;
}>> {
  return apiRequest(API_ENDPOINTS.ADMIN.EXAMS, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Update exam
 */
export async function updateExam(
  id: number,
  data: {
    name?: string;
    code?: string;
    description?: string;
  }
): Promise<ApiResponse<{
  exam: Exam;
}>> {
  return apiRequest(`${API_ENDPOINTS.ADMIN.EXAMS}/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

/**
 * Delete exam
 */
export async function deleteExam(id: number): Promise<ApiResponse<null>> {
  return apiRequest(`${API_ENDPOINTS.ADMIN.EXAMS}/${id}`, {
    method: 'DELETE',
  });
}






