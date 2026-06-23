import { apiRequest } from '../../client';
import { API_ENDPOINTS } from '../../constants';
import { ApiResponse } from '../../types';

export interface Chapter {
  id: number;
  sub_id: number;
  name: string;
  status: boolean;
  description: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
  subject_name?: string;
}

export async function getAllChapters(): Promise<ApiResponse<{ chapters: Chapter[] }>> {
  return apiRequest(API_ENDPOINTS.ADMIN.CHAPTERS, { method: 'GET' });
}

export async function getChaptersBySubjectId(subjectId: number): Promise<ApiResponse<{ chapters: Chapter[] }>> {
  return apiRequest(`${API_ENDPOINTS.ADMIN.CHAPTERS}/subject/${subjectId}`, { method: 'GET' });
}

export async function getChapterById(id: number): Promise<ApiResponse<{ chapter: Chapter }>> {
  return apiRequest(`${API_ENDPOINTS.ADMIN.CHAPTERS}/${id}`, { method: 'GET' });
}

export async function createChapter(data: {
  sub_id: number;
  name: string;
  status?: boolean;
  description?: string;
  sort_order?: number;
}): Promise<ApiResponse<{ chapter: Chapter }>> {
  return apiRequest(API_ENDPOINTS.ADMIN.CHAPTERS, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateChapter(
  id: number,
  data: Partial<{
    sub_id: number;
    name: string;
    status: boolean;
    description: string;
    sort_order: number;
  }>
): Promise<ApiResponse<{ chapter: Chapter }>> {
  return apiRequest(`${API_ENDPOINTS.ADMIN.CHAPTERS}/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteChapter(id: number): Promise<ApiResponse<null>> {
  return apiRequest(`${API_ENDPOINTS.ADMIN.CHAPTERS}/${id}`, { method: 'DELETE' });
}

export async function deleteAllChapters(): Promise<ApiResponse<{ message: string }>> {
  return apiRequest(`${API_ENDPOINTS.ADMIN.CHAPTERS}/all`, { method: 'DELETE' });
}
