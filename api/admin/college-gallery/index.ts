import { apiRequest } from '../../client';
import { API_ENDPOINTS } from '../../constants';
import { ApiResponse } from '../../types';

export interface CollegeGallery {
  id: number;
  college_id: number;
  college_name?: string;
  image_url: string;
  caption: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

/**
 * Get all college gallery images (for admin)
 */
export async function getAllCollegeGallery(): Promise<ApiResponse<{
  gallery: CollegeGallery[];
}>> {
  return apiRequest(API_ENDPOINTS.ADMIN.COLLEGE_GALLERY, {
    method: 'GET',
  });
}

/**
 * Get gallery image by ID
 */
export async function getCollegeGalleryById(id: number): Promise<ApiResponse<{
  image: CollegeGallery;
}>> {
  return apiRequest(`${API_ENDPOINTS.ADMIN.COLLEGE_GALLERY}/${id}`, {
    method: 'GET',
  });
}

/**
 * Create new gallery image
 */
export async function createCollegeGallery(data: {
  college_id: number;
  image_url?: string;
  caption?: string | null;
  sort_order?: number;
  image?: File;
}): Promise<ApiResponse<{
  image: CollegeGallery;
}>> {
  const formData = new FormData();
  
  formData.append('college_id', data.college_id.toString());
  if (data.image_url) {
    formData.append('image_url', data.image_url);
  }
  if (data.caption) {
    formData.append('caption', data.caption);
  }
  if (data.sort_order !== undefined) {
    formData.append('sort_order', data.sort_order.toString());
  }
  if (data.image) {
    formData.append('image', data.image);
  }

  return apiRequest(API_ENDPOINTS.ADMIN.COLLEGE_GALLERY, {
    method: 'POST',
    body: formData,
  });
}

/**
 * Update gallery image
 */
export async function updateCollegeGallery(
  id: number,
  data: {
    college_id?: number;
    image_url?: string;
    caption?: string | null;
    sort_order?: number;
    image?: File;
  }
): Promise<ApiResponse<{
  image: CollegeGallery;
}>> {
  const formData = new FormData();
  
  if (data.college_id !== undefined) {
    formData.append('college_id', data.college_id.toString());
  }
  if (data.image_url !== undefined) {
    formData.append('image_url', data.image_url || '');
  }
  if (data.caption !== undefined) {
    formData.append('caption', data.caption || '');
  }
  if (data.sort_order !== undefined) {
    formData.append('sort_order', data.sort_order.toString());
  }
  if (data.image) {
    formData.append('image', data.image);
  }

  return apiRequest(`${API_ENDPOINTS.ADMIN.COLLEGE_GALLERY}/${id}`, {
    method: 'PUT',
    body: formData,
  });
}

/**
 * Delete gallery image
 */
export async function deleteCollegeGallery(id: number): Promise<ApiResponse<null>> {
  return apiRequest(`${API_ENDPOINTS.ADMIN.COLLEGE_GALLERY}/${id}`, {
    method: 'DELETE',
  });
}

