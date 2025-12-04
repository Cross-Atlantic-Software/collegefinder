import { apiRequest } from '../client';
import { ApiResponse } from '../types';

export interface CareerGoal {
  id: number;
  label: string;
  logo: string; // Changed from image to logo
  created_at: string;
  updated_at: string;
}

/**
 * Get all career goals (public endpoint for users)
 */
export async function getAllCareerGoals(): Promise<ApiResponse<{
  careerGoals: CareerGoal[];
}>> {
  return apiRequest('/career-goals', {
    method: 'GET',
  });
}

