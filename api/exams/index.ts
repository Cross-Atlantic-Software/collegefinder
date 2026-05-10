import { apiRequest } from '../client';
import { ApiResponse } from '../types';

/** Exam dates (same shape as admin). */
export interface ExamDatesPublic {
  id: number;
  exam_id: number;
  application_start_date: string | null;
  application_close_date: string | null;
  exam_date: string | null;
  result_date: string | null;
  application_fees: number | null;
  created_at?: string;
  updated_at?: string;
}

/** Eligibility + resolved stream/subject labels from admin. */
export interface ExamEligibilityPublic {
  id: number;
  exam_id: number;
  stream_ids: number[];
  subject_ids: number[];
  age_limit: string | null;
  attempt_limit: number | string | null;
  domicile?: string | null;
  stream_labels?: string[];
  subject_labels?: string[];
  created_at?: string;
  updated_at?: string;
}

export interface ExamPatternPublic {
  id: number;
  exam_id: number;
  mode: string | null;
  number_of_questions: number | null;
  total_marks: number | null;
  negative_marking: string | null;
  weightage_of_subjects: string | null;
  duration_minutes: number | null;
  created_at?: string;
  updated_at?: string;
}

export interface ExamCutoffPublic {
  id: number;
  exam_id: number;
  ranks_percentiles: string | null;
  cutoff_general: string | null;
  cutoff_obc: string | null;
  cutoff_sc: string | null;
  cutoff_st: string | null;
  target_rank_range: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface ExamCareerGoalLink {
  id: number;
  label: string;
  logo?: string | null;
}

export interface ExamProgramLink {
  id: number;
  name: string;
}

/**
 * Exam taxonomy row plus full admin-linked payload from GET /api/exams and dashboard-exams.
 */
export interface Exam {
  id: number;
  name: string;
  code: string | null;
  description: string | null;
  exam_logo?: string | null;
  logo_file_name?: string | null;
  exam_type?: string | null;
  conducting_authority?: string | null;
  documents_required?: string | null;
  counselling?: string | null;
  number_of_papers?: number;
  website?: string | null;
  created_at: string;
  updated_at: string;
  examDates?: ExamDatesPublic | null;
  eligibilityCriteria?: ExamEligibilityPublic | null;
  examPattern?: ExamPatternPublic | null;
  examCutoff?: ExamCutoffPublic | null;
  linkedCareerGoals?: ExamCareerGoalLink[];
  linkedPrograms?: ExamProgramLink[];
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

export async function getDashboardExams(): Promise<ApiResponse<{
  streamId: number | null;
  allExams: Exam[];
  recommendedExamIds: number[];
  shortlistedExamIds: number[];
  message?: string;
}>> {
  return apiRequest<{
    streamId: number | null;
    allExams: Exam[];
    recommendedExamIds: number[];
    shortlistedExamIds: number[];
    message?: string;
  }>('/auth/profile/dashboard-exams', { method: 'GET' });
}

export async function updateShortlistedExam(exam_id: number, shortlisted: boolean): Promise<ApiResponse<{
  shortlistedExamIds: number[];
}>> {
  return apiRequest<{ shortlistedExamIds: number[] }>(
    '/auth/profile/shortlisted-exams',
    {
      method: 'PUT',
      body: JSON.stringify({ exam_id, shortlisted }),
    }
  );
}
