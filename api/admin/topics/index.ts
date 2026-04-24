import { apiRequest, getApiBaseUrl } from '../../client';
import { API_ENDPOINTS } from '../../constants';
import { ApiResponse } from '../../types';

export interface Topic {
  id: number;
  sub_id: number;
  name: string;
  thumbnail: string | null;
  home_display: boolean;
  status: boolean;
  description: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
  exam_ids?: number[];
}

/**
 * Get all topics (for admin)
 */
export async function getAllTopics(): Promise<ApiResponse<{
  topics: Topic[];
}>> {
  return apiRequest(API_ENDPOINTS.ADMIN.TOPICS, {
    method: 'GET',
  });
}

/**
 * Get topic by ID
 */
export async function getTopicById(id: number): Promise<ApiResponse<{
  topic: Topic;
}>> {
  return apiRequest(`${API_ENDPOINTS.ADMIN.TOPICS}/${id}`, {
    method: 'GET',
  });
}

/**
 * Create new topic (name + subject only; optional home_display, status, sort_order)
 */
export async function createTopic(data: {
  sub_id: number;
  name: string;
  home_display?: boolean;
  status?: boolean;
  sort_order?: number;
}): Promise<ApiResponse<{
  topic: Topic;
}>> {
  return apiRequest(API_ENDPOINTS.ADMIN.TOPICS, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Update topic
 */
export async function updateTopic(
  id: number,
  data: Partial<{
    sub_id: number;
    name: string;
    home_display: boolean;
    status: boolean;
    sort_order: number;
  }>
): Promise<ApiResponse<{
  topic: Topic;
}>> {
  return apiRequest(`${API_ENDPOINTS.ADMIN.TOPICS}/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export interface TopicsBulkUploadResult {
  created: number;
  createdItems: { id: number; name: string }[];
  errors: number;
  errorDetails: { row: number; message: string }[];
}

export async function downloadTopicsBulkTemplate(): Promise<void> {
  const adminToken = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
  const base = getApiBaseUrl();
  const url = `${base}${API_ENDPOINTS.ADMIN.TOPICS}/bulk-upload-template`;
  const res = await fetch(url, {
    method: 'GET',
    headers: { Authorization: `Bearer ${adminToken}` },
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to download template');
  const blob = await res.blob();
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'topics-bulk-template.xlsx';
  a.click();
  URL.revokeObjectURL(a.href);
}

export async function bulkUploadTopics(file: File): Promise<ApiResponse<TopicsBulkUploadResult>> {
  const formData = new FormData();
  formData.append('excel', file);
  const adminToken = localStorage.getItem('admin_token');
  if (!adminToken) throw new Error('Admin token not found');
  const base = getApiBaseUrl();
  const url = `${base}${API_ENDPOINTS.ADMIN.TOPICS}/bulk-upload`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: formData,
    credentials: 'include',
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || `Failed to bulk upload (${response.status})`);
  return data;
}

/**
 * Delete topic
 */
export async function deleteTopic(id: number): Promise<ApiResponse<null>> {
  return apiRequest(`${API_ENDPOINTS.ADMIN.TOPICS}/${id}`, {
    method: 'DELETE',
  });
}

/**
 * Upload topic thumbnail
 */
export async function uploadTopicThumbnail(file: File): Promise<ApiResponse<{
  imageUrl: string;
}>> {
  const formData = new FormData();
  formData.append('thumbnail', file);
  
  return apiRequest(`${API_ENDPOINTS.ADMIN.TOPICS}/upload-thumbnail`, {
    method: 'POST',
    body: formData,
    headers: {}, // Let browser set Content-Type with boundary for FormData
  });
}

