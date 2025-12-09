import { apiRequest } from '../client';
import { API_ENDPOINTS } from '../constants';
import { ApiResponse } from '../types';

export interface Career {
  id: number;
  name: string;
  status: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Get all active careers (public endpoint)
 */
export async function getAllCareers(): Promise<ApiResponse<{
  careers: Career[];
}>> {
  return apiRequest(API_ENDPOINTS.PUBLIC.CAREERS, {
    method: 'GET',
  });
}

// Export with Public suffix for consistency with other public APIs
export const getAllCareersPublic = getAllCareers;
export type CareerPublic = Career;

