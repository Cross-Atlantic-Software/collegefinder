/**
 * Admin API - Login endpoints
 */

import { apiRequest } from '../../client';
import type {
  ApiResponse,
  AdminLoginResponse,
} from '../../types';

import { API_ENDPOINTS } from '../../constants';

/**
 * Admin login
 */
export async function adminLogin(
  email: string,
  password: string
): Promise<ApiResponse<AdminLoginResponse>> {
  return apiRequest<AdminLoginResponse>(API_ENDPOINTS.ADMIN.LOGIN, {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

/**
 * Get current admin
 */
export async function getCurrentAdmin(): Promise<ApiResponse<{ admin: import('../../types').AdminUser }>> {
  return apiRequest<{ admin: import('../../types').AdminUser }>(API_ENDPOINTS.ADMIN.ME, {
    method: 'GET',
  });
}

