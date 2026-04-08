import { apiRequest } from '../client';
import { ApiResponse } from '../types';

export interface ExamShortlistMeta {
  subtitle?: string;
  fee_inr?: number;
  difficulty?: string;
  applicants_label?: string;
  colleges_label?: string;
  eligibility_label?: string;
  mode?: string;
}

export interface Exam {
  id: number;
  name: string;
  code: string;
  description: string | null;
  number_of_papers?: number;
  created_at: string;
  updated_at: string;
  exam_type?: string | null;
  conducting_authority?: string | null;
  exam_logo?: string | null;
  website?: string | null;
  shortlist_meta?: ExamShortlistMeta | null;
  dates_application_start?: string | null;
  dates_application_close?: string | null;
  dates_exam_date?: string | null;
  pattern_mode?: string | null;
  pattern_duration_minutes?: number | null;
  pattern_number_of_questions?: number | null;
  participating_colleges_count?: number;
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
 * Based on user's career goals and stream (from academics); returns exam IDs.
 * Frontend can fetch full exam details by ID for the recommended exams section.
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






