import { apiRequest } from '../../client';
import { API_ENDPOINTS } from '../../constants';
import { ApiResponse } from '../../types';

export interface Purpose {
  id: number;
  name: string;
  status: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Get all purposes (for admin)
 */
export async function getAllPurposes(): Promise<ApiResponse<{
  purposes: Purpose[];
}>> {
  return apiRequest(API_ENDPOINTS.ADMIN.PURPOSES, {
    method: 'GET',
  });
}

/**
 * Get purpose by ID
 */
export async function getPurposeById(id: number): Promise<ApiResponse<{
  purpose: Purpose;
}>> {
  return apiRequest(`${API_ENDPOINTS.ADMIN.PURPOSES}/${id}`, {
    method: 'GET',
  });
}

/**
 * Create new purpose
 */
export async function createPurpose(data: {
  name: string;
  status?: boolean;
}): Promise<ApiResponse<{
  purpose: Purpose;
}>> {
  return apiRequest(API_ENDPOINTS.ADMIN.PURPOSES, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Update purpose
 */
export async function updatePurpose(
  id: number,
  data: {
    name?: string;
    status?: boolean;
  }
): Promise<ApiResponse<{
  purpose: Purpose;
}>> {
  return apiRequest(`${API_ENDPOINTS.ADMIN.PURPOSES}/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

/**
 * Delete purpose
 */
export async function deletePurpose(id: number): Promise<ApiResponse<null>> {
  return apiRequest(`${API_ENDPOINTS.ADMIN.PURPOSES}/${id}`, {
    method: 'DELETE',
  });
}

