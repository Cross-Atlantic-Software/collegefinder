import { apiRequest } from '../client';
import { API_ENDPOINTS } from '../constants';
import { ApiResponse } from '../types';

export interface ExamCity {
  id: number;
  name: string;
  status: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Get all active exam cities (public endpoint)
 */
export async function getAllExamCities(): Promise<ApiResponse<{
  examCities: ExamCity[];
}>> {
  return apiRequest(API_ENDPOINTS.PUBLIC.EXAM_CITIES, {
    method: 'GET',
  });
}

