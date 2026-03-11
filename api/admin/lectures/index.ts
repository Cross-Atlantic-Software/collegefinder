import { apiRequest } from '../../client';
import { API_ENDPOINTS } from '../../constants';
import { ApiResponse } from '../../types';

export interface Lecture {
  id: number;
  topic_id: number;
  subtopic_id: number;
  name: string;
  content_type: 'VIDEO' | 'ARTICLE';
  video_file: string | null;
  iframe_code: string | null;
  article_content: string | null;
  thumbnail: string | null;
  description: string | null;
  status: boolean;
  sort_order: number;
  purposes?: Array<{ id: number; name: string; status: boolean }>;
  created_at: string;
  updated_at: string;
}

/**
 * Get all lectures (for admin)
 */
export async function getAllLectures(): Promise<ApiResponse<{
  lectures: Lecture[];
}>> {
  return apiRequest(API_ENDPOINTS.ADMIN.LECTURES, {
    method: 'GET',
  });
}

/**
 * Get lectures by subtopic ID
 */
export async function getLecturesBySubtopicId(subtopicId: number): Promise<ApiResponse<{
  lectures: Lecture[];
}>> {
  return apiRequest(`${API_ENDPOINTS.ADMIN.LECTURES}/subtopic/${subtopicId}`, {
    method: 'GET',
  });
}

/**
 * Get lecture by ID
 */
export async function getLectureById(id: number): Promise<ApiResponse<{
  lecture: Lecture;
}>> {
  return apiRequest(`${API_ENDPOINTS.ADMIN.LECTURES}/${id}`, {
    method: 'GET',
  });
}

/**
 * Create new lecture
 */
export async function createLecture(data: FormData): Promise<ApiResponse<{
  lecture: Lecture;
}>> {
  return apiRequest(API_ENDPOINTS.ADMIN.LECTURES, {
    method: 'POST',
    body: data,
    headers: {}, // Let browser set Content-Type with boundary for FormData
  });
}

/**
 * Update lecture
 */
export async function updateLecture(
  id: number,
  data: FormData
): Promise<ApiResponse<{
  lecture: Lecture;
}>> {
  return apiRequest(`${API_ENDPOINTS.ADMIN.LECTURES}/${id}`, {
    method: 'PUT',
    body: data,
    headers: {}, // Let browser set Content-Type with boundary for FormData
  });
}

/**
 * Delete lecture
 */
export async function deleteLecture(id: number): Promise<ApiResponse<null>> {
  return apiRequest(`${API_ENDPOINTS.ADMIN.LECTURES}/${id}`, {
    method: 'DELETE',
  });
}

/**
 * Upload lecture video
 */
export async function uploadLectureVideo(file: File): Promise<ApiResponse<{
  videoUrl: string;
}>> {
  const formData = new FormData();
  formData.append('video_file', file);
  
  return apiRequest(`${API_ENDPOINTS.ADMIN.LECTURES}/upload-video`, {
    method: 'POST',
    body: formData,
    headers: {}, // Let browser set Content-Type with boundary for FormData
  });
}

/**
 * Upload lecture thumbnail
 */
export async function uploadLectureThumbnail(file: File): Promise<ApiResponse<{
  imageUrl: string;
}>> {
  const formData = new FormData();
  formData.append('thumbnail', file);
  
  return apiRequest(`${API_ENDPOINTS.ADMIN.LECTURES}/upload-thumbnail`, {
    method: 'POST',
    body: formData,
    headers: {}, // Let browser set Content-Type with boundary for FormData
  });
}

