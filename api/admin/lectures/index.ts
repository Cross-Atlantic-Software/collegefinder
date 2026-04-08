import { apiRequest, getApiBaseUrl } from '../../client';
import { API_ENDPOINTS } from '../../constants';
import { ApiResponse } from '../../types';

export interface LectureTaxonomyRef {
  id: number;
  name: string;
  code?: string;
}

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
  /** Filename for Excel/ZIP bulk thumbnail matching (optional). */
  thumbnail_filename?: string | null;
  description: string | null;
  status: boolean;
  sort_order: number;
  purposes?: Array<{ id: number; name: string; status: boolean }>;
  streams?: LectureTaxonomyRef[];
  subjects?: LectureTaxonomyRef[];
  exams?: Array<LectureTaxonomyRef & { code?: string }>;
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

export async function deleteAllLectures(): Promise<ApiResponse<{ message: string }>> {
  return apiRequest(`${API_ENDPOINTS.ADMIN.LECTURES}/all`, {
    method: 'DELETE',
  });
}

export interface YoutubeLectureMetadata {
  videoId: string;
  title: string;
  description: string;
}

/**
 * Resolve YouTube snippet from iframe HTML or watch/embed URL (server uses Data API v3).
 */
export async function fetchYoutubeLectureMetadata(
  iframeCode: string
): Promise<ApiResponse<YoutubeLectureMetadata>> {
  return apiRequest<YoutubeLectureMetadata>(`${API_ENDPOINTS.ADMIN.LECTURES}/youtube-metadata`, {
    method: 'POST',
    body: JSON.stringify({ iframe_code: iframeCode }),
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

export interface LecturesBulkUploadResult {
  created: number;
  createdItems: { id: number; name: string }[];
  errors: number;
  errorDetails: { row: number; message: string }[];
}

export async function downloadLecturesBulkTemplate(): Promise<void> {
  const adminToken = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
  const base = getApiBaseUrl();
  const url = `${base}${API_ENDPOINTS.ADMIN.LECTURES}/bulk-upload-template`;
  const res = await fetch(url, {
    method: 'GET',
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  if (!res.ok) throw new Error('Failed to download template');
  const blob = await res.blob();
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'self-study-material-bulk-template.xlsx';
  a.click();
  URL.revokeObjectURL(a.href);
}

export async function downloadLecturesAllExcel(): Promise<void> {
  const adminToken = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
  const base = getApiBaseUrl();
  const url = `${base}${API_ENDPOINTS.ADMIN.LECTURES}/download-excel`;
  const res = await fetch(url, {
    method: 'GET',
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  if (!res.ok) throw new Error('Failed to download Excel');
  const blob = await res.blob();
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'self-study-material-all.xlsx';
  a.click();
  URL.revokeObjectURL(a.href);
}

export async function bulkUploadLectures(
  excelFile: File,
  thumbnailFiles: File[] = [],
  thumbnailsZipFile: File | null = null
): Promise<ApiResponse<LecturesBulkUploadResult>> {
  const formData = new FormData();
  formData.append('excel', excelFile);
  if (thumbnailsZipFile) {
    formData.append('thumbnails_zip', thumbnailsZipFile);
  } else {
    thumbnailFiles.forEach((file) => formData.append('thumbnails', file));
  }
  const adminToken = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
  const base = getApiBaseUrl();
  const url = `${base}${API_ENDPOINTS.ADMIN.LECTURES}/bulk-upload`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: formData,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Bulk upload failed');
  return data;
}

export interface UploadMissingLectureThumbnailsResult {
  updated: { id: number; name: string; thumbnail_filename?: string | null }[];
  skipped: string[];
  errors: { file: string; message: string }[];
  summary: { logosAdded: number; filesSkipped: number; uploadErrors: number };
}

export async function uploadMissingLectureThumbnails(
  zipFile: File
): Promise<ApiResponse<UploadMissingLectureThumbnailsResult>> {
  const formData = new FormData();
  formData.append('thumbnails_zip', zipFile);
  const adminToken = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
  const base = getApiBaseUrl();
  const url = `${base}${API_ENDPOINTS.ADMIN.LECTURES}/upload-missing-thumbnails`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: formData,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to upload thumbnails');
  return data;
}

