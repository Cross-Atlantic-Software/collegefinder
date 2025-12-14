import { apiRequest } from '../../client';
import { API_ENDPOINTS } from '../../constants';
import { ApiResponse } from '../../types';

export interface CourseSubject {
  id: number;
  course_id: number;
  course_title?: string;
  college_name?: string;
  subject_id: number;
  subject_name?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Get all course subjects
 */
export async function getAllCourseSubjects(): Promise<ApiResponse<{
  subjects: CourseSubject[];
}>> {
  return apiRequest(API_ENDPOINTS.ADMIN.COURSE_SUBJECTS, {
    method: 'GET',
  });
}

/**
 * Get subject by ID
 */
export async function getCourseSubjectById(id: number): Promise<ApiResponse<{
  subject: CourseSubject;
}>> {
  return apiRequest(`${API_ENDPOINTS.ADMIN.COURSE_SUBJECTS}/${id}`, {
    method: 'GET',
  });
}

/**
 * Create new course subject
 */
export async function createCourseSubject(data: {
  course_id: number;
  subject_id: number;
}): Promise<ApiResponse<{
  subject: CourseSubject;
}>> {
  return apiRequest(API_ENDPOINTS.ADMIN.COURSE_SUBJECTS, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Update course subject
 */
export async function updateCourseSubject(
  id: number,
  data: {
    course_id?: number;
    subject_id?: number;
  }
): Promise<ApiResponse<{
  subject: CourseSubject;
}>> {
  return apiRequest(`${API_ENDPOINTS.ADMIN.COURSE_SUBJECTS}/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

/**
 * Delete course subject
 */
export async function deleteCourseSubject(id: number): Promise<ApiResponse<null>> {
  return apiRequest(`${API_ENDPOINTS.ADMIN.COURSE_SUBJECTS}/${id}`, {
    method: 'DELETE',
  });
}

