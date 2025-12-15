import { apiRequest } from '../../client';
import { API_ENDPOINTS } from '../../constants';
import { ApiResponse } from '../../types';

export interface Program {
  id: number;
  name: string;
  status: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Get all programs (for admin)
 */
export async function getAllPrograms(): Promise<ApiResponse<{
  programs: Program[];
}>> {
  return apiRequest(API_ENDPOINTS.ADMIN.PROGRAMS, {
    method: 'GET',
  });
}

/**
 * Get program by ID
 */
export async function getProgramById(id: number): Promise<ApiResponse<{
  program: Program;
}>> {
  return apiRequest(`${API_ENDPOINTS.ADMIN.PROGRAMS}/${id}`, {
    method: 'GET',
  });
}

/**
 * Create new program
 */
export async function createProgram(data: {
  name: string;
  status?: boolean;
}): Promise<ApiResponse<{
  program: Program;
}>> {
  return apiRequest(API_ENDPOINTS.ADMIN.PROGRAMS, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Update program
 */
export async function updateProgram(
  id: number,
  data: {
    name?: string;
    status?: boolean;
  }
): Promise<ApiResponse<{
  program: Program;
}>> {
  return apiRequest(`${API_ENDPOINTS.ADMIN.PROGRAMS}/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

/**
 * Delete program
 */
export async function deleteProgram(id: number): Promise<ApiResponse<null>> {
  return apiRequest(`${API_ENDPOINTS.ADMIN.PROGRAMS}/${id}`, {
    method: 'DELETE',
  });
}

