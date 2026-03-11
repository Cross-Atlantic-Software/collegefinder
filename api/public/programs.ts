import { apiRequest } from '../client';
import { API_ENDPOINTS } from '../constants';
import { ApiResponse } from '../types';

export interface Program {
  id: number;
  name: string;
  status: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Get all active programs (public endpoint)
 */
export async function getAllPrograms(): Promise<ApiResponse<{
  programs: Program[];
}>> {
  return apiRequest(API_ENDPOINTS.PUBLIC.PROGRAMS, {
    method: 'GET',
  });
}

