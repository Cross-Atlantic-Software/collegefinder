import { apiRequest } from '../../client';
import { API_ENDPOINTS } from '../../constants';
import { ApiResponse } from '../../types';

export interface CollegeCourse {
  id: number;
  title: string;
  [key: string]: unknown;
}

/**
 * Get all college courses (for admin)
 */
export async function getAllCollegeCourses(): Promise<ApiResponse<{
  courses: CollegeCourse[];
}>> {
  return apiRequest(API_ENDPOINTS.ADMIN.COLLEGE_COURSES, {
    method: 'GET',
  });
}
