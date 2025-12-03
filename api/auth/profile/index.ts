/**
 * Authentication API - User Profile endpoints
 */

import { apiRequest } from '../../client';
import type {
  ApiResponse,
  User,
} from '../../types';

import { API_ENDPOINTS } from '../../constants';

/**
 * Get current authenticated user
 */
export async function getCurrentUser(): Promise<ApiResponse<{ user: User }>> {
  return apiRequest<{ user: User }>(API_ENDPOINTS.AUTH.ME, {
    method: 'GET',
  });
}

/**
 * Update user profile (name)
 * Note: User is identified from authentication token
 */
export async function updateProfile(
  name: string
): Promise<ApiResponse<{ user: User }>> {
  return apiRequest<{ user: User }>(API_ENDPOINTS.AUTH.PROFILE, {
    method: 'PUT',
    body: JSON.stringify({ name }),
  });
}

