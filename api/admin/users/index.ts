/**
 * Admin API - Site Users Management endpoints
 */

import { apiRequest } from '../../client';
import type {
  ApiResponse,
  GetAllUsersResponse,
} from '../../types';

import { API_ENDPOINTS } from '../../constants';

/**
 * Get all registered users (Admin only)
 */
export async function getAllUsers(): Promise<ApiResponse<GetAllUsersResponse>> {
  return apiRequest<GetAllUsersResponse>(API_ENDPOINTS.ADMIN.USERS, {
    method: 'GET',
  });
}

