import { apiRequest } from '../../client';
import { API_ENDPOINTS } from '../../constants';
import { ApiResponse } from '../../types';

export interface Level {
  id: number;
  name: string;
  status: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Get all levels (for admin)
 */
export async function getAllLevels(): Promise<ApiResponse<{
  levels: Level[];
}>> {
  return apiRequest(API_ENDPOINTS.ADMIN.LEVELS, {
    method: 'GET',
  });
}

/**
 * Get level by ID
 */
export async function getLevelById(id: number): Promise<ApiResponse<{
  level: Level;
}>> {
  return apiRequest(`${API_ENDPOINTS.ADMIN.LEVELS}/${id}`, {
    method: 'GET',
  });
}

/**
 * Create new level
 */
export async function createLevel(data: {
  name: string;
  status?: boolean;
}): Promise<ApiResponse<{
  level: Level;
}>> {
  return apiRequest(API_ENDPOINTS.ADMIN.LEVELS, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Update level
 */
export async function updateLevel(
  id: number,
  data: {
    name?: string;
    status?: boolean;
  }
): Promise<ApiResponse<{
  level: Level;
}>> {
  return apiRequest(`${API_ENDPOINTS.ADMIN.LEVELS}/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

/**
 * Delete level
 */
export async function deleteLevel(id: number): Promise<ApiResponse<null>> {
  return apiRequest(`${API_ENDPOINTS.ADMIN.LEVELS}/${id}`, {
    method: 'DELETE',
  });
}

