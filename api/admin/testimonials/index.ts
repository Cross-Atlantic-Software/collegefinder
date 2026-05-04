import { apiRequest, getApiBaseUrl } from '../../client';
import { API_ENDPOINTS } from '../../constants';
import type { ApiResponse } from '../../types';

export type TestimonialAdmin = {
  id: number;
  name: string;
  body: string;
  rating: number;
  sort_order: number;
  is_active: boolean;
  profile_image_url?: string | null;
  created_at: string;
  updated_at: string;
};

/** Upload profile image to S3; returns public URL to store on the testimonial. */
export async function uploadTestimonialProfileImage(file: File): Promise<
  ApiResponse<{ imageUrl: string }>
> {
  const formData = new FormData();
  formData.append('image', file);
  const adminToken = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
  if (!adminToken) {
    throw new Error('Admin token not found');
  }
  const base = getApiBaseUrl();
  const url = `${base}${API_ENDPOINTS.ADMIN.TESTIMONIALS}/upload-image`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: formData,
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || `Upload failed (${res.status})`);
  }
  return data;
}

export async function getAllTestimonialsAdmin(): Promise<
  ApiResponse<{ testimonials: TestimonialAdmin[] }>
> {
  return apiRequest(API_ENDPOINTS.ADMIN.TESTIMONIALS, { method: 'GET' });
}

export async function createTestimonial(data: {
  name: string;
  body: string;
  rating: number;
  sort_order?: number;
  is_active?: boolean;
  profile_image_url?: string | null;
}): Promise<ApiResponse<{ testimonial: TestimonialAdmin }>> {
  return apiRequest(API_ENDPOINTS.ADMIN.TESTIMONIALS, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateTestimonial(
  id: number,
  data: Partial<{
    name: string;
    body: string;
    rating: number;
    sort_order: number;
    is_active: boolean;
    profile_image_url: string | null;
  }>,
): Promise<ApiResponse<{ testimonial: TestimonialAdmin }>> {
  return apiRequest(`${API_ENDPOINTS.ADMIN.TESTIMONIALS}/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteTestimonial(id: number): Promise<ApiResponse<{ message?: string }>> {
  return apiRequest(`${API_ENDPOINTS.ADMIN.TESTIMONIALS}/${id}`, { method: 'DELETE' });
}
