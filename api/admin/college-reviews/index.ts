import { apiRequest } from '../../client';
import { API_ENDPOINTS } from '../../constants';
import { ApiResponse } from '../../types';

export interface CollegeReview {
  id: number;
  college_id: number;
  college_name?: string;
  user_id: number;
  user_name?: string;
  user_email?: string;
  rating: number;
  review_text: string | null;
  is_approved: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Get all college reviews (for admin)
 */
export async function getAllCollegeReviews(): Promise<ApiResponse<{
  reviews: CollegeReview[];
}>> {
  return apiRequest(API_ENDPOINTS.ADMIN.COLLEGE_REVIEWS, {
    method: 'GET',
  });
}

/**
 * Get review by ID
 */
export async function getCollegeReviewById(id: number): Promise<ApiResponse<{
  review: CollegeReview;
}>> {
  return apiRequest(`${API_ENDPOINTS.ADMIN.COLLEGE_REVIEWS}/${id}`, {
    method: 'GET',
  });
}

/**
 * Create new review
 */
export async function createCollegeReview(data: {
  college_id: number;
  user_id: number;
  rating: number;
  review_text?: string | null;
  is_approved?: boolean;
}): Promise<ApiResponse<{
  review: CollegeReview;
}>> {
  return apiRequest(API_ENDPOINTS.ADMIN.COLLEGE_REVIEWS, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Update review
 */
export async function updateCollegeReview(
  id: number,
  data: {
    college_id?: number;
    user_id?: number;
    rating?: number;
    review_text?: string | null;
    is_approved?: boolean;
  }
): Promise<ApiResponse<{
  review: CollegeReview;
}>> {
  return apiRequest(`${API_ENDPOINTS.ADMIN.COLLEGE_REVIEWS}/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

/**
 * Delete review
 */
export async function deleteCollegeReview(id: number): Promise<ApiResponse<null>> {
  return apiRequest(`${API_ENDPOINTS.ADMIN.COLLEGE_REVIEWS}/${id}`, {
    method: 'DELETE',
  });
}

