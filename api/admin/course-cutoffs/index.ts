import { apiRequest } from '../../client';
import { API_ENDPOINTS } from '../../constants';
import { ApiResponse } from '../../types';

export interface CourseCutoff {
  id: number;
  course_id: number;
  course_title?: string;
  college_name?: string;
  exam_id: number;
  exam_name?: string;
  year: number;
  category_id: number | null;
  category_name?: string | null;
  cutoff_value: number;
  created_at: string;
  updated_at: string;
}

/**
 * Get all course cutoffs
 */
export async function getAllCourseCutoffs(): Promise<ApiResponse<{
  cutoffs: CourseCutoff[];
}>> {
  return apiRequest(API_ENDPOINTS.ADMIN.COURSE_CUTOFFS, {
    method: 'GET',
  });
}

/**
 * Get cutoff by ID
 */
export async function getCourseCutoffById(id: number): Promise<ApiResponse<{
  cutoff: CourseCutoff;
}>> {
  return apiRequest(`${API_ENDPOINTS.ADMIN.COURSE_CUTOFFS}/${id}`, {
    method: 'GET',
  });
}

/**
 * Create new cutoff
 */
export async function createCourseCutoff(data: {
  course_id: number;
  exam_id: number;
  year: number;
  category?: string | null;
  cutoff_value: number;
}): Promise<ApiResponse<{
  cutoff: CourseCutoff;
}>> {
  return apiRequest(API_ENDPOINTS.ADMIN.COURSE_CUTOFFS, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Update cutoff
 */
export async function updateCourseCutoff(
  id: number,
  data: {
    course_id?: number;
    exam_id?: number;
    year?: number;
    category_id?: number | null;
    cutoff_value?: number;
  }
): Promise<ApiResponse<{
  cutoff: CourseCutoff;
}>> {
  return apiRequest(`${API_ENDPOINTS.ADMIN.COURSE_CUTOFFS}/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

/**
 * Delete cutoff
 */
export async function deleteCourseCutoff(id: number): Promise<ApiResponse<null>> {
  return apiRequest(`${API_ENDPOINTS.ADMIN.COURSE_CUTOFFS}/${id}`, {
    method: 'DELETE',
  });
}

