import { apiRequest } from '../../client';
import { API_ENDPOINTS } from '../../constants';
import { ApiResponse } from '../../types';

export interface Stream {
  id: number;
  name: string;
  status: boolean;
  created_at: string;
  updated_at: string;
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

