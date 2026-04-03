import { apiRequest } from '../client';
import { API_ENDPOINTS } from '../constants';
import type { ApiResponse } from '../types';
import type { Blog } from '../admin/blogs';

export type PublicBlogsPayload = { blogs: Blog[]; total: number };

export async function getPublicBlogs(): Promise<ApiResponse<PublicBlogsPayload>> {
  return apiRequest<PublicBlogsPayload>(API_ENDPOINTS.SITE.BLOGS, { method: 'GET' });
}

export async function getPublicBlogBySlug(
  slug: string
): Promise<ApiResponse<{ blog: Blog }>> {
  return apiRequest<{ blog: Blog }>(`${API_ENDPOINTS.SITE.BLOGS}/${encodeURIComponent(slug)}`, {
    method: 'GET',
  });
}
