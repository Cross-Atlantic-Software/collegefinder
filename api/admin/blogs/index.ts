/**
 * Admin API - Blogs Management endpoints
 */

import { apiRequest } from '../../client';
import type { ApiResponse } from '../../types';
import { API_ENDPOINTS } from '../../constants';

export interface Blog {
  id: number;
  slug: string;
  is_featured: boolean;
  title: string;
  blog_image: string | null;
  teaser: string | null;
  summary: string | null;
  content_type: 'TEXT' | 'VIDEO';
  first_part: string | null;
  second_part: string | null;
  video_file: string | null;
  streams: number[] | null;
  careers: number[] | null;
  url: string | null;
  source_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface GetAllBlogsResponse {
  blogs: Blog[];
  total: number;
}

/**
 * Get all blogs
 */
export async function getAllBlogs(): Promise<ApiResponse<GetAllBlogsResponse>> {
  return apiRequest<GetAllBlogsResponse>(API_ENDPOINTS.ADMIN.BLOGS, {
    method: 'GET',
  });
}

/**
 * Get blog by ID
 */
export async function getBlogById(id: number): Promise<ApiResponse<{ blog: Blog }>> {
  return apiRequest<{ blog: Blog }>(`${API_ENDPOINTS.ADMIN.BLOGS}/${id}`, {
    method: 'GET',
  });
}

/**
 * Create blog
 */
export async function createBlog(data: {
  slug: string;
  is_featured?: boolean;
  title: string;
  blog_image?: File;
  teaser?: string;
  summary?: string;
  content_type: 'TEXT' | 'VIDEO';
  first_part?: string;
  second_part?: string;
  video_file?: File;
  streams?: number[];
  careers?: number[];
  url?: string;
  source_name?: string;
}): Promise<ApiResponse<{ blog: Blog }>> {
  const formData = new FormData();
  
  formData.append('slug', data.slug);
  formData.append('title', data.title);
  formData.append('content_type', data.content_type);
  
  if (data.is_featured !== undefined) {
    formData.append('is_featured', String(data.is_featured));
  }
  if (data.teaser) {
    formData.append('teaser', data.teaser);
  }
  if (data.summary) {
    formData.append('summary', data.summary);
  }
  if (data.first_part) {
    formData.append('first_part', data.first_part);
  }
  if (data.second_part) {
    formData.append('second_part', data.second_part);
  }
  if (data.blog_image) {
    formData.append('blog_image', data.blog_image);
  }
  if (data.video_file) {
    formData.append('video_file', data.video_file);
  }
  if (data.streams && Array.isArray(data.streams)) {
    formData.append('streams', JSON.stringify(data.streams));
  }
  if (data.careers && Array.isArray(data.careers)) {
    formData.append('careers', JSON.stringify(data.careers));
  }
  if (data.url !== undefined) {
    formData.append('url', data.url || '');
  }
  if (data.source_name !== undefined) {
    formData.append('source_name', data.source_name || '');
  }

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';
  const url = `${apiUrl}${API_ENDPOINTS.ADMIN.BLOGS}`;
  
  const token = localStorage.getItem('admin_token');
  if (!token) {
    throw new Error('No authentication token found');
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  });

  const result = await response.json();
  
  if (!response.ok) {
    throw new Error(result.message || 'Failed to create blog');
  }

  return result;
}

/**
 * Update blog
 */
export async function updateBlog(
  id: number,
  data: {
    slug?: string;
    is_featured?: boolean;
    title?: string;
    blog_image?: File | null;
    teaser?: string;
    summary?: string;
    content_type?: 'TEXT' | 'VIDEO';
    first_part?: string;
    second_part?: string;
    video_file?: File | null;
    streams?: number[];
    careers?: number[];
    url?: string;
    source_name?: string;
  }
): Promise<ApiResponse<{ blog: Blog }>> {
  const formData = new FormData();
  
  if (data.slug !== undefined) {
    formData.append('slug', data.slug);
  }
  if (data.title !== undefined) {
    formData.append('title', data.title);
  }
  if (data.content_type !== undefined) {
    formData.append('content_type', data.content_type);
  }
  if (data.is_featured !== undefined) {
    formData.append('is_featured', String(data.is_featured));
  }
  if (data.teaser !== undefined) {
    formData.append('teaser', data.teaser || '');
  }
  if (data.summary !== undefined) {
    formData.append('summary', data.summary || '');
  }
  if (data.first_part !== undefined) {
    formData.append('first_part', data.first_part || '');
  }
  if (data.second_part !== undefined) {
    formData.append('second_part', data.second_part || '');
  }
  if (data.blog_image !== undefined && data.blog_image !== null) {
    formData.append('blog_image', data.blog_image);
  }
  if (data.video_file !== undefined && data.video_file !== null) {
    formData.append('video_file', data.video_file);
  }
  if (data.streams !== undefined) {
    formData.append('streams', JSON.stringify(Array.isArray(data.streams) ? data.streams : []));
  }
  if (data.careers !== undefined) {
    formData.append('careers', JSON.stringify(Array.isArray(data.careers) ? data.careers : []));
  }
  if (data.url !== undefined) {
    formData.append('url', data.url || '');
  }
  if (data.source_name !== undefined) {
    formData.append('source_name', data.source_name || '');
  }

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';
  const url = `${apiUrl}${API_ENDPOINTS.ADMIN.BLOGS}/${id}`;
  
  const token = localStorage.getItem('admin_token');
  if (!token) {
    throw new Error('No authentication token found');
  }

  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  });

  const result = await response.json();
  
  if (!response.ok) {
    throw new Error(result.message || 'Failed to update blog');
  }

  return result;
}

/**
 * Delete blog
 */
export async function deleteBlog(id: number): Promise<ApiResponse<void>> {
  return apiRequest<void>(`${API_ENDPOINTS.ADMIN.BLOGS}/${id}`, {
    method: 'DELETE',
  });
}


