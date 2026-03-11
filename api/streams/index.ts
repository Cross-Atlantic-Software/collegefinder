import { apiRequest } from '../client';
import { API_ENDPOINTS } from '../constants';
import { ApiResponse } from '../types';

export interface Stream {
  id: number;
  name: string;
  status: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Get all active streams (public endpoint)
 */
export async function getAllStreams(): Promise<ApiResponse<{
  streams: Stream[];
}>> {
  return apiRequest(API_ENDPOINTS.PUBLIC.STREAMS, {
    method: 'GET',
  });
}

// Export with Public suffix for consistency with other public APIs
export const getAllStreamsPublic = getAllStreams;
export type StreamPublic = Stream;

