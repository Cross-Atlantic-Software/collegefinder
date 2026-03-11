import { apiRequest } from '../../client';
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
 * Create new topic
 */
export async function createTopic(data: FormData): Promise<ApiResponse<{
  topic: Topic;
}>> {
  return apiRequest(API_ENDPOINTS.ADMIN.TOPICS, {
    method: 'POST',
    body: data,
    headers: {}, // Let browser set Content-Type with boundary for FormData
  });
}

/**
 * Update topic
 */
export async function updateTopic(
  id: number,
  data: FormData
): Promise<ApiResponse<{
  topic: Topic;
}>> {
  return apiRequest(`${API_ENDPOINTS.ADMIN.TOPICS}/${id}`, {
    method: 'PUT',
    body: data,
    headers: {}, // Let browser set Content-Type with boundary for FormData
  });
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

