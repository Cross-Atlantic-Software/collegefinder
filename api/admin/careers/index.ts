import { apiRequest } from '../../client';
import { API_ENDPOINTS } from '../../constants';
import { ApiResponse } from '../../types';

export interface Career {
  id: number;
  name: string;
  status: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Get all careers (for admin)
 */
export async function getAllCareers(): Promise<ApiResponse<{
  careers: Career[];
}>> {
  return apiRequest(API_ENDPOINTS.ADMIN.CAREERS, {
    method: 'GET',
  });
}

/**
 * Get career by ID
 */
export async function getCareerById(id: number): Promise<ApiResponse<{
  career: Career;
}>> {
  return apiRequest(`${API_ENDPOINTS.ADMIN.CAREERS}/${id}`, {
    method: 'GET',
  });
}

/**
 * Create new career
 */
export async function createCareer(data: {
  name: string;
  status?: boolean;
}): Promise<ApiResponse<{
  career: Career;
}>> {
  return apiRequest(API_ENDPOINTS.ADMIN.CAREERS, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Update career
 */
export async function updateCareer(
  id: number,
  data: {
    name?: string;
    status?: boolean;
  }
): Promise<ApiResponse<{
  career: Career;
}>> {
  return apiRequest(`${API_ENDPOINTS.ADMIN.CAREERS}/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

/**
 * Delete career
 */
export async function deleteCareer(id: number): Promise<ApiResponse<null>> {
  return apiRequest(`${API_ENDPOINTS.ADMIN.CAREERS}/${id}`, {
    method: 'DELETE',
  });
}

