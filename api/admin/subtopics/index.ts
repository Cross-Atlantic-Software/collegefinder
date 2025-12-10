import { apiRequest } from '../../client';
import { API_ENDPOINTS } from '../../constants';
import { ApiResponse } from '../../types';

export interface Subtopic {
  id: number;
  topic_id: number;
  name: string;
  status: boolean;
  description: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

/**
 * Get all subtopics (for admin)
 */
export async function getAllSubtopics(): Promise<ApiResponse<{
  subtopics: Subtopic[];
}>> {
  return apiRequest(API_ENDPOINTS.ADMIN.SUBTOPICS, {
    method: 'GET',
  });
}

/**
 * Get subtopics by topic ID
 */
export async function getSubtopicsByTopicId(topicId: number): Promise<ApiResponse<{
  subtopics: Subtopic[];
}>> {
  return apiRequest(`${API_ENDPOINTS.ADMIN.SUBTOPICS}/topic/${topicId}`, {
    method: 'GET',
  });
}

/**
 * Get subtopic by ID
 */
export async function getSubtopicById(id: number): Promise<ApiResponse<{
  subtopic: Subtopic;
}>> {
  return apiRequest(`${API_ENDPOINTS.ADMIN.SUBTOPICS}/${id}`, {
    method: 'GET',
  });
}

/**
 * Create new subtopic
 */
export async function createSubtopic(data: {
  topic_id: number;
  name: string;
  status?: boolean;
  description?: string;
  sort_order?: number;
}): Promise<ApiResponse<{
  subtopic: Subtopic;
}>> {
  return apiRequest(API_ENDPOINTS.ADMIN.SUBTOPICS, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Update subtopic
 */
export async function updateSubtopic(
  id: number,
  data: {
    topic_id?: number;
    name?: string;
    status?: boolean;
    description?: string;
    sort_order?: number;
  }
): Promise<ApiResponse<{
  subtopic: Subtopic;
}>> {
  return apiRequest(`${API_ENDPOINTS.ADMIN.SUBTOPICS}/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

/**
 * Delete subtopic
 */
export async function deleteSubtopic(id: number): Promise<ApiResponse<null>> {
  return apiRequest(`${API_ENDPOINTS.ADMIN.SUBTOPICS}/${id}`, {
    method: 'DELETE',
  });
}

