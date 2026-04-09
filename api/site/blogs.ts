import { apiRequest } from '../client';
import { API_ENDPOINTS } from '../constants';
import type { ApiResponse } from '../types';
import type { Blog } from '../admin/blogs';

export type PublicBlogsPayload = {
  blogs: Blog[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

const DEFAULT_PAGE_SIZE = 9;

export async function getPublicBlogs(params?: {
  page?: number;
  pageSize?: number;
}): Promise<ApiResponse<PublicBlogsPayload>> {
  const page = params?.page != null && params.page > 0 ? params.page : 1;
  const pageSize =
    params?.pageSize != null && params.pageSize > 0 ? params.pageSize : DEFAULT_PAGE_SIZE;
  const q = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
  });
  return apiRequest<PublicBlogsPayload>(`${API_ENDPOINTS.SITE.BLOGS}?${q}`, { method: 'GET' });
}

export async function getPublicBlogBySlug(
  slug: string
): Promise<ApiResponse<{ blog: Blog }>> {
  return apiRequest<{ blog: Blog }>(`${API_ENDPOINTS.SITE.BLOGS}/${encodeURIComponent(slug)}`, {
    method: 'GET',
  });
}
