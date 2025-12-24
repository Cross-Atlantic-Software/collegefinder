import { apiRequest } from '../../client';
import { API_ENDPOINTS } from '../../constants';
import { ApiResponse } from '../../types';

export interface Category {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
}

/**
 * Get all categories (public endpoint)
 */
export async function getAllCategories(): Promise<ApiResponse<{
  categories: Category[];
}>> {
  return apiRequest(API_ENDPOINTS.PUBLIC.CATEGORIES, {
    method: 'GET',
  });
}

