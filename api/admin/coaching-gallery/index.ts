import { apiRequest } from '../../client';
import { API_ENDPOINTS } from '../../constants';
import { ApiResponse } from '../../types';

export interface CoachingGalleryItem {
  id: number;
  coaching_id: number;
  coaching_name?: string;
  image_url: string;
  caption: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

/**
 * Get all coaching gallery images (for admin)
 */
export async function getAllCoachingGallery(): Promise<ApiResponse<{
  gallery: CoachingGalleryItem[];
}>> {
  return apiRequest(API_ENDPOINTS.ADMIN.COACHING_GALLERY, {
    method: 'GET',
  });
}

/**
 * Get gallery images by coaching ID
 */
export async function getGalleryByCoachingId(coachingId: number): Promise<ApiResponse<{
  gallery: CoachingGalleryItem[];
}>> {
  return apiRequest(`${API_ENDPOINTS.ADMIN.COACHING_GALLERY}/coaching/${coachingId}`, {
    method: 'GET',
  });
}

/**
 * Get gallery image by ID
 */
export async function getCoachingGalleryById(id: number): Promise<ApiResponse<{
  galleryItem: CoachingGalleryItem;
}>> {
  return apiRequest(`${API_ENDPOINTS.ADMIN.COACHING_GALLERY}/${id}`, {
    method: 'GET',
  });
}

/**
 * Create new gallery image
 */
export async function createCoachingGallery(data: FormData): Promise<ApiResponse<{
  galleryItem: CoachingGalleryItem;
}>> {
  return apiRequest(API_ENDPOINTS.ADMIN.COACHING_GALLERY, {
    method: 'POST',
    body: data,
    headers: {}, // Let browser set Content-Type with boundary for FormData
  });
}

/**
 * Update gallery image
 */
export async function updateCoachingGallery(
  id: number,
  data: FormData
): Promise<ApiResponse<{
  galleryItem: CoachingGalleryItem;
}>> {
  return apiRequest(`${API_ENDPOINTS.ADMIN.COACHING_GALLERY}/${id}`, {
    method: 'PUT',
    body: data,
    headers: {}, // Let browser set Content-Type with boundary for FormData
  });
}

/**
 * Delete gallery image
 */
export async function deleteCoachingGallery(id: number): Promise<ApiResponse<null>> {
  return apiRequest(`${API_ENDPOINTS.ADMIN.COACHING_GALLERY}/${id}`, {
    method: 'DELETE',
  });
}
