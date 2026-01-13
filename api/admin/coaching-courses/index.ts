import { apiRequest } from '../../client';
import { API_ENDPOINTS } from '../../constants';
import { ApiResponse } from '../../types';

export interface CoachingCourse {
  id: number;
  coaching_id: number;
  coaching_name?: string;
  exam_ids: number[] | null;
  title: string;
  summary: string | null;
  duration: string | null;
  mode: 'Online' | 'Offline' | 'Hybrid';
  fee: number | null;
  contact_email: string | null;
  contact: string | null;
  rating: number | null;
  features: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Get all coaching courses (for admin)
 */
export async function getAllCoachingCourses(): Promise<ApiResponse<{
  courses: CoachingCourse[];
}>> {
  return apiRequest(API_ENDPOINTS.ADMIN.COACHING_COURSES, {
    method: 'GET',
  });
}

/**
 * Get courses by coaching ID
 */
export async function getCoursesByCoachingId(coachingId: number): Promise<ApiResponse<{
  courses: CoachingCourse[];
}>> {
  return apiRequest(`${API_ENDPOINTS.ADMIN.COACHING_COURSES}/coaching/${coachingId}`, {
    method: 'GET',
  });
}

/**
 * Get coaching course by ID
 */
export async function getCoachingCourseById(id: number): Promise<ApiResponse<{
  course: CoachingCourse;
}>> {
  return apiRequest(`${API_ENDPOINTS.ADMIN.COACHING_COURSES}/${id}`, {
    method: 'GET',
  });
}

/**
 * Create new coaching course
 */
export async function createCoachingCourse(data: {
  coaching_id: number;
  exam_ids?: number[];
  title: string;
  summary?: string;
  duration?: string;
  mode?: 'Online' | 'Offline' | 'Hybrid';
  fee?: number;
  contact_email?: string;
  contact?: string;
  rating?: number;
  features?: string;
}): Promise<ApiResponse<{
  course: CoachingCourse;
}>> {
  return apiRequest(API_ENDPOINTS.ADMIN.COACHING_COURSES, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Update coaching course
 */
export async function updateCoachingCourse(
  id: number,
  data: {
    coaching_id?: number;
    exam_ids?: number[];
    title?: string;
    summary?: string;
    duration?: string;
    mode?: 'Online' | 'Offline' | 'Hybrid';
    fee?: number;
    contact_email?: string;
    contact?: string;
    rating?: number;
    features?: string;
  }
): Promise<ApiResponse<{
  course: CoachingCourse;
}>> {
  return apiRequest(`${API_ENDPOINTS.ADMIN.COACHING_COURSES}/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

/**
 * Delete coaching course
 */
export async function deleteCoachingCourse(id: number): Promise<ApiResponse<null>> {
  return apiRequest(`${API_ENDPOINTS.ADMIN.COACHING_COURSES}/${id}`, {
    method: 'DELETE',
  });
}
