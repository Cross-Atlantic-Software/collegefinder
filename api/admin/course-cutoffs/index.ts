import { apiRequest } from '../../client';
import { API_ENDPOINTS } from '../../constants';
import { ApiResponse } from '../../types';

export interface CourseCutoff {
  id: number;
  course_id: number;
  exam_id: number;
  year: number;
  category_id: number | null;
  cutoff_value: number;
  exam_name?: string;
  course_title?: string;
  college_name?: string;
  category_name?: string;
}

/**
 * Get all course cutoffs (for admin)
 */
export async function getAllCourseCutoffs(): Promise<ApiResponse<{
  cutoffs: CourseCutoff[];
}>> {
  return apiRequest(API_ENDPOINTS.ADMIN.COURSE_CUTOFFS, {
    method: 'GET',
  });
}

/**
 * Create course cutoff
 */
export async function createCourseCutoff(data: {
  course_id: number;
  exam_id: number;
  year: number;
  category_id: number | null;
  cutoff_value: number;
}): Promise<ApiResponse<{ cutoff: CourseCutoff }>> {
  return apiRequest(API_ENDPOINTS.ADMIN.COURSE_CUTOFFS, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Update course cutoff
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
): Promise<ApiResponse<{ cutoff: CourseCutoff }>> {
  return apiRequest(`${API_ENDPOINTS.ADMIN.COURSE_CUTOFFS}/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

/**
 * Delete course cutoff
 */
export async function deleteCourseCutoff(id: number): Promise<ApiResponse<null>> {
  return apiRequest(`${API_ENDPOINTS.ADMIN.COURSE_CUTOFFS}/${id}`, {
    method: 'DELETE',
  });
}
