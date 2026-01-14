import { apiRequest } from '../../client';
import { API_ENDPOINTS } from '../../constants';
import { ApiResponse } from '../../types';

export interface Coaching {
  id: number;
  name: string;
  logo: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Get all coachings (for admin)
 */
export async function getAllCoachings(): Promise<ApiResponse<{
  coachings: Coaching[];
}>> {
  return apiRequest(API_ENDPOINTS.ADMIN.COACHINGS, {
    method: 'GET',
  });
}

/**
 * Get coaching by ID
 */
export async function getCoachingById(id: number): Promise<ApiResponse<{
  coaching: Coaching;
}>> {
  return apiRequest(`${API_ENDPOINTS.ADMIN.COACHINGS}/${id}`, {
    method: 'GET',
  });
}

/**
 * Create new coaching
 */
export async function createCoaching(data: FormData): Promise<ApiResponse<{
  coaching: Coaching;
}>> {
  return apiRequest(API_ENDPOINTS.ADMIN.COACHINGS, {
    method: 'POST',
    body: data,
    headers: {}, // Let browser set Content-Type with boundary for FormData
  });
}

/**
 * Update coaching
 */
export async function updateCoaching(
  id: number,
  data: FormData
): Promise<ApiResponse<{
  coaching: Coaching;
}>> {
  return apiRequest(`${API_ENDPOINTS.ADMIN.COACHINGS}/${id}`, {
    method: 'PUT',
    body: data,
    headers: {}, // Let browser set Content-Type with boundary for FormData
  });
}

/**
 * Delete coaching
 */
export async function deleteCoaching(id: number): Promise<ApiResponse<null>> {
  return apiRequest(`${API_ENDPOINTS.ADMIN.COACHINGS}/${id}`, {
    method: 'DELETE',
  });
}
