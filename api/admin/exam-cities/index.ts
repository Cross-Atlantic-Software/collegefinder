import { apiRequest } from '../../client';
import { API_ENDPOINTS } from '../../constants';
import { ApiResponse } from '../../types';

export interface ExamCity {
  id: number;
  name: string;
  status: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Get all exam cities (for admin)
 */
export async function getAllExamCities(): Promise<ApiResponse<{
  examCities: ExamCity[];
}>> {
  return apiRequest(API_ENDPOINTS.ADMIN.EXAM_CITIES, {
    method: 'GET',
  });
}

/**
 * Get exam city by ID
 */
export async function getExamCityById(id: number): Promise<ApiResponse<{
  examCity: ExamCity;
}>> {
  return apiRequest(`${API_ENDPOINTS.ADMIN.EXAM_CITIES}/${id}`, {
    method: 'GET',
  });
}

/**
 * Create new exam city
 */
export async function createExamCity(data: {
  name: string;
  status?: boolean;
}): Promise<ApiResponse<{
  examCity: ExamCity;
}>> {
  return apiRequest(API_ENDPOINTS.ADMIN.EXAM_CITIES, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Update exam city
 */
export async function updateExamCity(
  id: number,
  data: {
    name?: string;
    status?: boolean;
  }
): Promise<ApiResponse<{
  examCity: ExamCity;
}>> {
  return apiRequest(`${API_ENDPOINTS.ADMIN.EXAM_CITIES}/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

/**
 * Delete exam city
 */
export async function deleteExamCity(id: number): Promise<ApiResponse<null>> {
  return apiRequest(`${API_ENDPOINTS.ADMIN.EXAM_CITIES}/${id}`, {
    method: 'DELETE',
  });
}
