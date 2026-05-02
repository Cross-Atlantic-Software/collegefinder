import { apiRequest } from '../client';
import { ApiResponse } from '../types';

export interface Exam {
  id: number;
  name: string;
  code: string | null;
  description: string | null;
  number_of_papers?: number;
  created_at: string;
  updated_at: string;
}

export interface PreviousExamAttempt {
  exam_id: number;
  year: number;
  rank: number | null;
}

/**
 * Get all exams (public endpoint for users)
 */
export async function getAllExams(): Promise<ApiResponse<{
  exams: Exam[];
}>> {
  return apiRequest<{ exams: Exam[] }>('/exams', {
    method: 'GET',
  });
}

/**
 * Get user's exam preferences
 */
export async function getExamPreferences(): Promise<ApiResponse<{
  target_exams: string[];
  previous_attempts: PreviousExamAttempt[];
}>> {
  return apiRequest<{
    target_exams: string[];
    previous_attempts: PreviousExamAttempt[];
  }>('/auth/profile/exam-preferences', {
    method: 'GET',
  });
}

/**
 * Update user's exam preferences
 */
export async function updateExamPreferences(data: {
  target_exams?: string[];
  previous_attempts?: PreviousExamAttempt[];
}): Promise<ApiResponse<{
  target_exams: string[];
  previous_attempts: PreviousExamAttempt[];
}>> {
  return apiRequest<{
    target_exams: string[];
    previous_attempts: PreviousExamAttempt[];
  }>('/auth/profile/exam-preferences', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

/**
 * Get recommended exams for the current user.
 * Uses admin stream+interest mappings; returns exam IDs. Requires stream + interests on profile.
 */
export async function getRecommendedExams(): Promise<ApiResponse<{
  examIds: string[];
  message?: string;
}>> {
  return apiRequest<{ examIds: string[]; message?: string }>(
    '/auth/profile/recommended-exams',
    { method: 'GET' }
  );
}






