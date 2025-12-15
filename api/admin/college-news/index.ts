import { apiRequest } from '../../client';
import { API_ENDPOINTS } from '../../constants';
import { ApiResponse } from '../../types';

export interface CollegeNews {
  id: number;
  college_id: number;
  college_name?: string;
  title: string;
  teaser: string;
  url: string;
  source_name: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Get all college news (for admin)
 */
export async function getAllCollegeNews(): Promise<ApiResponse<{
  news: CollegeNews[];
}>> {
  return apiRequest(API_ENDPOINTS.ADMIN.COLLEGE_NEWS, {
    method: 'GET',
  });
}

/**
 * Get news by ID
 */
export async function getCollegeNewsById(id: number): Promise<ApiResponse<{
  news: CollegeNews;
}>> {
  return apiRequest(`${API_ENDPOINTS.ADMIN.COLLEGE_NEWS}/${id}`, {
    method: 'GET',
  });
}

/**
 * Create new news article
 */
export async function createCollegeNews(data: {
  college_id: number;
  title: string;
  teaser: string;
  url: string;
  source_name?: string | null;
}): Promise<ApiResponse<{
  news: CollegeNews;
}>> {
  return apiRequest(API_ENDPOINTS.ADMIN.COLLEGE_NEWS, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Update news article
 */
export async function updateCollegeNews(
  id: number,
  data: {
    college_id?: number;
    title?: string;
    teaser?: string;
    url?: string;
    source_name?: string | null;
  }
): Promise<ApiResponse<{
  news: CollegeNews;
}>> {
  return apiRequest(`${API_ENDPOINTS.ADMIN.COLLEGE_NEWS}/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

/**
 * Delete news article
 */
export async function deleteCollegeNews(id: number): Promise<ApiResponse<null>> {
  return apiRequest(`${API_ENDPOINTS.ADMIN.COLLEGE_NEWS}/${id}`, {
    method: 'DELETE',
  });
}

