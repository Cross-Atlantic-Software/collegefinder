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
 * Get all categories (for admin)
 */
export async function getAllCategories(): Promise<ApiResponse<{
  categories: Category[];
}>> {
  return apiRequest(API_ENDPOINTS.ADMIN.CATEGORIES, {
    method: 'GET',
  });
}

/**
 * Get category by ID
 */
export async function getCategoryById(id: number): Promise<ApiResponse<{
  category: Category;
}>> {
  return apiRequest(`${API_ENDPOINTS.ADMIN.CATEGORIES}/${id}`, {
    method: 'GET',
  });
}

/**
 * Create new category
 */
export async function createCategory(data: {
  name: string;
}): Promise<ApiResponse<{
  category: Category;
}>> {
  return apiRequest(API_ENDPOINTS.ADMIN.CATEGORIES, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Update category
 */
export async function updateCategory(
  id: number,
  data: {
    name?: string;
  }
): Promise<ApiResponse<{
  category: Category;
}>> {
  return apiRequest(`${API_ENDPOINTS.ADMIN.CATEGORIES}/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

/**
 * Delete category
 */
export async function deleteCategory(id: number): Promise<ApiResponse<null>> {
  return apiRequest(`${API_ENDPOINTS.ADMIN.CATEGORIES}/${id}`, {
    method: 'DELETE',
  });
}
