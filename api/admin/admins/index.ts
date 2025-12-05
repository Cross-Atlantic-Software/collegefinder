/**
 * Admin API - Admin Users Management endpoints
 */

import { apiRequest } from '../../client';
import type {
  ApiResponse,
  AdminUser,
  GetAllAdminsResponse,
} from '../../types';

import { API_ENDPOINTS } from '../../constants';

/**
 * Get all admin users (Super Admin only)
 */
export async function getAllAdmins(): Promise<ApiResponse<GetAllAdminsResponse>> {
  return apiRequest<GetAllAdminsResponse>(API_ENDPOINTS.ADMIN.ADMINS, {
    method: 'GET',
  });
}

/**
 * Create admin user (Super Admin only)
 */
export async function createAdmin(
  email: string,
  password: string,
  type: 'user' | 'super_admin' = 'user'
): Promise<ApiResponse<{ admin: AdminUser }>> {
  return apiRequest<{ admin: AdminUser }>(API_ENDPOINTS.ADMIN.ADMINS, {
    method: 'POST',
    body: JSON.stringify({ email, password, type }),
  });
}

/**
 * Update admin user (Super Admin only)
 */
export async function updateAdmin(
  id: number,
  data: { 
    email?: string; 
    password?: string; 
    type?: 'user' | 'super_admin'; 
    is_active?: boolean 
  }
): Promise<ApiResponse<{ admin: AdminUser }>> {
  return apiRequest<{ admin: AdminUser }>(`${API_ENDPOINTS.ADMIN.ADMINS}/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

/**
 * Delete admin user (Super Admin only)
 */
export async function deleteAdmin(id: number): Promise<ApiResponse<void>> {
  return apiRequest<void>(`${API_ENDPOINTS.ADMIN.ADMINS}/${id}`, {
    method: 'DELETE',
  });
}

