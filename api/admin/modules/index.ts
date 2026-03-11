/**
 * Admin API - Modules taxonomy (Super Admin only)
 */

import { apiRequest } from '../../client';
import type { ApiResponse } from '../../types';
import { API_ENDPOINTS } from '../../constants';

export interface Module {
  id: number;
  name: string;
  code: string;
  created_at: string;
  updated_at: string;
}

export interface GetAllModulesResponse {
  modules: Module[];
}

export async function getAllModules(): Promise<ApiResponse<GetAllModulesResponse>> {
  return apiRequest<GetAllModulesResponse>(API_ENDPOINTS.ADMIN.MODULES, {
    method: 'GET',
  });
}

export async function getModuleById(id: number): Promise<ApiResponse<{ module: Module }>> {
  return apiRequest<{ module: Module }>(`${API_ENDPOINTS.ADMIN.MODULES}/${id}`, {
    method: 'GET',
  });
}

export async function createModule(data: { name: string; code?: string }): Promise<ApiResponse<{ module: Module }>> {
  return apiRequest<{ module: Module }>(API_ENDPOINTS.ADMIN.MODULES, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateModule(
  id: number,
  data: { name?: string; code?: string }
): Promise<ApiResponse<{ module: Module }>> {
  return apiRequest<{ module: Module }>(`${API_ENDPOINTS.ADMIN.MODULES}/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteModule(id: number): Promise<ApiResponse<void>> {
  return apiRequest<void>(`${API_ENDPOINTS.ADMIN.MODULES}/${id}`, {
    method: 'DELETE',
  });
}
