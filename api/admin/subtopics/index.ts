import { apiRequest, getApiBaseUrl } from '../../client';
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
  exam_ids?: number[];
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

export interface SubtopicsBulkUploadResult {
  created: number;
  createdItems: { id: number; name: string; topic_id: number }[];
  errors: number;
  errorDetails: { row: number; message: string }[];
}

export async function downloadSubtopicsBulkTemplate(): Promise<void> {
  const adminToken = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
  const base = getApiBaseUrl();
  const url = `${base}${API_ENDPOINTS.ADMIN.SUBTOPICS}/bulk-upload-template`;
  const res = await fetch(url, {
    method: 'GET',
    headers: { Authorization: `Bearer ${adminToken}` },
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to download template');
  const blob = await res.blob();
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'subtopics-bulk-template.xlsx';
  a.click();
  URL.revokeObjectURL(a.href);
}

export async function bulkUploadSubtopics(file: File): Promise<ApiResponse<SubtopicsBulkUploadResult>> {
  const formData = new FormData();
  formData.append('excel', file);
  const adminToken = localStorage.getItem('admin_token');
  if (!adminToken) throw new Error('Admin token not found');
  const base = getApiBaseUrl();
  const url = `${base}${API_ENDPOINTS.ADMIN.SUBTOPICS}/bulk-upload`;
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

