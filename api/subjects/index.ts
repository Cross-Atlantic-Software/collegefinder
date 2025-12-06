import { apiRequest } from '../client';
import { API_ENDPOINTS } from '../constants';
import { ApiResponse } from '../types';

export interface Subject {
  id: number;
  name: string;
  status: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Get all active subjects (public endpoint)
 */
export async function getAllSubjects(): Promise<ApiResponse<{
  subjects: Subject[];
}>> {
  return apiRequest(API_ENDPOINTS.PUBLIC.SUBJECTS, {
    method: 'GET',
  });
}

