import { apiRequest } from '../../client';
import { API_ENDPOINTS } from '../../constants';
import { ApiResponse } from '../../types';

export interface CourseSubject {
  id: number;
  course_id: number;
  subject_id: number;
  subject_name?: string;
  course_title?: string;
  college_name?: string;
}

export async function getAllCourseSubjects(): Promise<ApiResponse<{ subjects: CourseSubject[] }>> {
  return apiRequest(API_ENDPOINTS.ADMIN.COURSE_SUBJECTS, { method: 'GET' });
}

export async function createCourseSubject(data: { course_id: number; subject_id: number }): Promise<ApiResponse<{ subject: CourseSubject }>> {
  return apiRequest(API_ENDPOINTS.ADMIN.COURSE_SUBJECTS, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateCourseSubject(id: number, data: { course_id?: number; subject_id?: number }): Promise<ApiResponse<{ subject: CourseSubject }>> {
  return apiRequest(`${API_ENDPOINTS.ADMIN.COURSE_SUBJECTS}/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteCourseSubject(id: number): Promise<ApiResponse<null>> {
  return apiRequest(`${API_ENDPOINTS.ADMIN.COURSE_SUBJECTS}/${id}`, { method: 'DELETE' });
}
