import { apiRequest } from '../../client';
import { API_ENDPOINTS } from '../../constants';
import { ApiResponse } from '../../types';

export interface CourseExam {
  id: number;
  course_id: number;
  course_title?: string;
  college_name?: string;
  exam_name: string;
  created_at: string;
  updated_at: string;
}

/**
 * Get all course exams
 */
export async function getAllCourseExams(): Promise<ApiResponse<{
  exams: CourseExam[];
}>> {
  return apiRequest(API_ENDPOINTS.ADMIN.COURSE_EXAMS, {
    method: 'GET',
  });
}

/**
 * Get exam by ID
 */
export async function getCourseExamById(id: number): Promise<ApiResponse<{
  exam: CourseExam;
}>> {
  return apiRequest(`${API_ENDPOINTS.ADMIN.COURSE_EXAMS}/${id}`, {
    method: 'GET',
  });
}

/**
 * Create new exam
 */
export async function createCourseExam(data: {
  course_id: number;
  exam_name: string;
}): Promise<ApiResponse<{
  exam: CourseExam;
}>> {
  return apiRequest(API_ENDPOINTS.ADMIN.COURSE_EXAMS, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Update exam
 */
export async function updateCourseExam(
  id: number,
  data: {
    course_id?: number;
    exam_name?: string;
  }
): Promise<ApiResponse<{
  exam: CourseExam;
}>> {
  return apiRequest(`${API_ENDPOINTS.ADMIN.COURSE_EXAMS}/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

/**
 * Delete exam
 */
export async function deleteCourseExam(id: number): Promise<ApiResponse<null>> {
  return apiRequest(`${API_ENDPOINTS.ADMIN.COURSE_EXAMS}/${id}`, {
    method: 'DELETE',
  });
}

