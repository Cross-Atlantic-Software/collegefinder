import { apiRequest } from '../../client';
import { API_ENDPOINTS } from '../../constants';
import { ApiResponse } from '../../types';

export interface UserOtherInfo {
  id: number;
  user_id: number;
  medium: string | null;
  language: string | null;
  program_ids: number[] | null;
  exam_city_ids: number[] | null;
  created_at: string;
  updated_at: string;
}

/**
 * Get user other info
 */
export async function getOtherInfo(): Promise<ApiResponse<UserOtherInfo | null>> {
  return apiRequest(API_ENDPOINTS.AUTH.PROFILE_OTHER_INFO, {
    method: 'GET',
  });
}

/**
 * Update user other info
 */
export async function updateOtherInfo(data: {
  medium?: string;
  language?: string;
  program_ids?: number[];
  exam_city_ids?: number[];
}): Promise<ApiResponse<UserOtherInfo>> {
  return apiRequest(API_ENDPOINTS.AUTH.PROFILE_OTHER_INFO, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}


