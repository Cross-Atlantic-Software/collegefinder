import { apiRequest } from '../client';
import { API_ENDPOINTS } from '../constants';
import type { ApiResponse } from '../types';

export type PublicTestimonial = {
  id: number;
  name: string;
  body: string;
  rating: number;
  sort_order: number;
  profile_image_url?: string | null;
  created_at: string;
};

export async function getPublicTestimonials(): Promise<
  ApiResponse<{ testimonials: PublicTestimonial[] }>
> {
  return apiRequest(API_ENDPOINTS.SITE.TESTIMONIALS, { method: 'GET' });
}
