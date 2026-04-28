import { apiRequest, getApiBaseUrl } from '../../client';
import { API_ENDPOINTS } from '../../constants';
import { ApiResponse } from '../../types';

export interface Stream {
  id: number;
  name: string;
  status: boolean;
  created_at: string;
  updated_at: string;
  updated_by?: number | null;
  updated_by_email?: string | null;
}

/**
 * Get all streams (for admin)
 */
export async function getAllStreams(): Promise<ApiResponse<{
  streams: Stream[];
}>> {
  return apiRequest(API_ENDPOINTS.ADMIN.STREAMS, {
    method: 'GET',
  });
}

/**
 * Get stream by ID
 */
export async function getStreamById(id: number): Promise<ApiResponse<{
  stream: Stream;
}>> {
  return apiRequest(`${API_ENDPOINTS.ADMIN.STREAMS}/${id}`, {
    method: 'GET',
  });
}

/**
 * Create new stream
 */
export async function createStream(data: {
  name: string;
  status?: boolean;
}): Promise<ApiResponse<{
  stream: Stream;
}>> {
  return apiRequest(API_ENDPOINTS.ADMIN.STREAMS, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Update stream
 */
export async function updateStream(
  id: number,
  data: {
    name?: string;
    status?: boolean;
  }
): Promise<ApiResponse<{
  stream: Stream;
}>> {
  return apiRequest(`${API_ENDPOINTS.ADMIN.STREAMS}/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

/**
 * Delete stream
 */
export async function deleteStream(id: number): Promise<ApiResponse<null>> {
  return apiRequest(`${API_ENDPOINTS.ADMIN.STREAMS}/${id}`, {
    method: 'DELETE',
  });
}

/**
 * Delete all streams
 */
export async function deleteAllStreams(): Promise<ApiResponse<{ message: string }>> {
  return apiRequest(`${API_ENDPOINTS.ADMIN.STREAMS}/all`, {
    method: 'DELETE',
  });
}

/**
 * Download streams bulk upload template
 */
export async function downloadStreamsBulkTemplate(): Promise<void> {
  const adminToken = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
  const base = getApiBaseUrl();
  const url = `${base}${API_ENDPOINTS.ADMIN.STREAMS}/bulk-upload-template`;
  const res = await fetch(url, {
    method: 'GET',
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  if (!res.ok) throw new Error('Failed to download template');
  const blob = await res.blob();
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'streams-bulk-template.xlsx';
  a.click();
  URL.revokeObjectURL(a.href);
}

/**
 * Bulk upload streams from Excel
 */
export async function bulkUploadStreams(file: File): Promise<ApiResponse<{
  created: number;
  createdStreams: { id: number; name: string }[];
  errors: number;
  errorDetails: { row: number; message: string }[];
}>> {
  const formData = new FormData();
  formData.append('excel', file);

  const adminToken = localStorage.getItem('admin_token');
  if (!adminToken) throw new Error('Admin token not found');

  const base = getApiBaseUrl();
  const url = `${base}${API_ENDPOINTS.ADMIN.STREAMS}/bulk-upload`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: formData,
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || `Failed to bulk upload (${response.status})`);
  return data;
}

