import { apiRequest } from '../client';
import { ApiResponse } from '../types';

export interface CareerGoal {
  id: number;
  label: string;
  logo?: string | null;
  description?: string | null;
  status?: boolean;
  stream_id?: number | null;
  stream_name?: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Get all career goals (public endpoint for users).
 * Pass streamId to only return active interests tagged for that stream (onboarding / profile).
 */
export async function getAllCareerGoals(streamId?: number): Promise<ApiResponse<{
  careerGoals: CareerGoal[];
}>> {
  const q =
    streamId != null && Number.isFinite(streamId) && streamId > 0
      ? `?stream_id=${encodeURIComponent(String(streamId))}`
      : '';
  return apiRequest(`/career-goals${q}`, {
    method: 'GET',
  });
}

