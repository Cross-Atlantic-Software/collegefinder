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
  application_fees: string | number | null;
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
  attempt_limit: string | null;
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
  number_of_questions: string | number | null;
  total_marks: string | number | null;
  negative_marking: string | null;
  weightage_of_subjects: string | null;
  /** Hours as entered in admin/Excel; column name is legacy (`duration_minutes`). */
  duration_minutes: string | number | null;
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

/** College row linked via college_recommended_exams (dashboard shape). */
export interface ExamLinkedCollege {
  id: number;
  college_name: string;
  college_location: string | null;
  college_type: string | null;
  college_logo: string | null;
  logo_url?: string | null;
  city?: string | null;
  state?: string | null;
  parent_university?: string | null;
  linkedExams?: Array<{ id: number; name: string; code: string | null }>;
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
  number_of_papers?: string | number | null;
  website?: string | null;
  /** Lower = more popular for All Exams tab ordering; optional. */
  exam_popularity_rank?: number | null;
  created_at: string;
  updated_at: string;
  examDates?: ExamDatesPublic | null;
  eligibilityCriteria?: ExamEligibilityPublic | null;
  examPattern?: ExamPatternPublic | null;
  examCutoff?: ExamCutoffPublic | null;
  linkedCareerGoals?: ExamCareerGoalLink[];
  linkedPrograms?: ExamProgramLink[];
  linkedColleges?: ExamLinkedCollege[];
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

/** Lightweight count for sidebar / badges (no enrichment). */
export async function getExamsCount(): Promise<ApiResponse<{ count: number }>> {
  return apiRequest<{ count: number }>('/exams/count', { method: 'GET' });
}

/**
 * Single enriched exam for detail pages (id, code, name, or slug).
 */
export async function getExamById(
  idOrSlug: string | number
): Promise<ApiResponse<{ exam: Exam; linkedColleges?: ExamLinkedCollege[] }>> {
  const segment = encodeURIComponent(String(idOrSlug).trim());
  return apiRequest<{ exam: Exam; linkedColleges?: ExamLinkedCollege[] }>(
    `/exams/${segment}`,
    { method: 'GET' }
  );
}

/** Enriched exam for dashboard detail (logged-in users; same payload as shortlist cards). */
export async function getDashboardExamById(
  idOrSlug: string | number
): Promise<ApiResponse<{ exam: Exam; linkedColleges?: ExamLinkedCollege[] }>> {
  const segment = encodeURIComponent(String(idOrSlug).trim());
  return apiRequest<{ exam: Exam }>(
    `/auth/profile/dashboard-exams/exam/${segment}`,
    { method: 'GET' }
  );
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

export type DashboardExamTabId = 'recommended' | 'shortlisted' | 'all';

export interface DashboardExamsPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/** Lightweight meta for sidebar badge + React Query deduplication (no enriched exams). */
export async function getDashboardExamsMeta(): Promise<ApiResponse<{
  streamId: number | null;
  shortlistedExamIds: number[];
  recommendedExamIds: number[];
  message?: string;
}>> {
  return apiRequest<{
    streamId: number | null;
    shortlistedExamIds: number[];
    recommendedExamIds: number[];
    message?: string;
  }>('/auth/profile/dashboard-exams/meta', { method: 'GET' });
}

/** Single tab page; server enriches only rows for this page. */
export async function getDashboardExamsTab(
  tab: DashboardExamTabId,
  params: { page?: number; limit?: number; search?: string } = {}
): Promise<ApiResponse<{
  streamId: number | null;
  tab: DashboardExamTabId;
  exams: Exam[];
  shortlistedExamIds: number[];
  recommendedExamIds: number[];
  pagination: DashboardExamsPagination;
  message?: string;
}>> {
  const sp = new URLSearchParams();
  sp.set('tab', tab);
  if (params.page != null) sp.set('page', String(params.page));
  if (params.limit != null) sp.set('limit', String(params.limit));
  if (params.search?.trim()) sp.set('search', params.search.trim());
  return apiRequest<{
    streamId: number | null;
    tab: DashboardExamTabId;
    exams: Exam[];
    shortlistedExamIds: number[];
    recommendedExamIds: number[];
    pagination: DashboardExamsPagination;
    message?: string;
  }>(`/auth/profile/dashboard-exams/tab?${sp.toString()}`, { method: 'GET' });
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
