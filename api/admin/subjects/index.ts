import { apiRequest } from '../../client';
import { API_ENDPOINTS } from '../../constants';
import { ApiResponse } from '../../types';

export interface Subject {
  id: number;
  name: string;
  status: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Get all subjects (for admin)
 */
export async function getAllSubjects(): Promise<ApiResponse<{
  subjects: Subject[];
}>> {
  return apiRequest(API_ENDPOINTS.ADMIN.SUBJECTS, {
    method: 'GET',
  });
}

/**
 * Get subject by ID
 */
export async function getSubjectById(id: number): Promise<ApiResponse<{
  subject: Subject;
}>> {
  return apiRequest(`${API_ENDPOINTS.ADMIN.SUBJECTS}/${id}`, {
    method: 'GET',
  });
}

/**
 * Create new subject
 */
export async function createSubject(data: {
  name: string;
  status?: boolean;
}): Promise<ApiResponse<{
  subject: Subject;
}>> {
  return apiRequest(API_ENDPOINTS.ADMIN.SUBJECTS, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Update subject
 */
export async function updateSubject(
  id: number,
  data: {
    name?: string;
    status?: boolean;
  }
): Promise<ApiResponse<{
  subject: Subject;
}>> {
  return apiRequest(`${API_ENDPOINTS.ADMIN.SUBJECTS}/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

/**
 * Delete subject
 */
export async function deleteSubject(id: number): Promise<ApiResponse<null>> {
  return apiRequest(`${API_ENDPOINTS.ADMIN.SUBJECTS}/${id}`, {
    method: 'DELETE',
  });
}


