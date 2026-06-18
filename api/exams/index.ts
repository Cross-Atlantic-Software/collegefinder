import type { DashboardCollege } from '@/api/auth/profile';
import { apiRequest } from '../client';
import { ApiResponse } from '../types';

/** Exam dates (same shape as admin). */
export interface ExamDatesPublic {
  id: number;
  exam_id: number;
  application_start_date: string | null;
  application_close_date: string | null;
  admit_card_date: string | null;
  exam_date: string | null;
  result_date: string | null;
  counselling_date: string | null;
  counselling_start_date: string | null;
  counselling_end_date: string | null;
  application_fees: number | null;
  ut_service_fee: number | null;
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
  /** Free text in admin; legacy rows may still be numeric from DB. */
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
  number_of_questions: number | null;
  total_marks: number | null;
  negative_marking: string | null;
  weightage_of_subjects: string | null;
  /** Hours as entered in admin/Excel; column name is legacy (`duration_minutes`). */
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
  registration_link?: string | null;
  abbreviation?: string | null;
  category?: string | null;
  exam_frequency?: string | null;
  /** Free-text exam pattern overview on main exam row (distinct from examPattern relation). */
  exam_pattern?: string | null;
  avg_applicant_2023?: number | null;
  avg_applicant_2024?: number | null;
  avg_applicant_2025?: number | null;
  avg_applicant_prev_three?: number | null;
  /** Free-text eligibility summary on main exam row (distinct from eligibilityCriteria relation). */
  eligibility?: string | null;
  qualified_candidate?: number | null;
  success_rate?: string | null;
  /** Lower = more popular for All Exams tab ordering; optional. */
  exam_popularity_rank?: number | null;
  difficulty_level?: string | null;
  total_mocks_generated?: number | null;
  created_at: string;
  updated_at: string;
  examDates?: ExamDatesPublic | null;
  eligibilityCriteria?: ExamEligibilityPublic | null;
  examPattern?: ExamPatternPublic | null;
  examCutoff?: ExamCutoffPublic | null;
  linkedCareerGoals?: ExamCareerGoalLink[];
  linkedPrograms?: ExamProgramLink[];
  /** Up to 3 linked colleges for dashboard exam cards. */
  linkedColleges?: { id: number; name: string; abbreviation?: string | null }[];
  /** Total linked colleges (may exceed linkedColleges preview length). */
  linkedCollegeCount?: number;
  /** @deprecated Prefer linkedColleges — names only. */
  linkedCollegeNames?: string[];
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
): Promise<ApiResponse<{ exam: Exam }>> {
  const segment = encodeURIComponent(String(idOrSlug).trim());
  return apiRequest<{ exam: Exam }>(`/exams/${segment}`, { method: 'GET' });
}

/** Dashboard detail: same enriched exam payload as shortlist tab cards (requires auth). */
export type ExamLinkedScholarshipPreview = {
  id: number;
  scholarship_name: string;
  scholarship_type?: string | null;
  conducting_authority?: string | null;
  scholarship_amount?: string | null;
};

export type ExamTaggedLecturePreview = {
  id: number;
  title: string;
  channel?: string | null;
  subjectName?: string | null;
  topicName?: string | null;
  hookSummary?: string | null;
};

export type DashboardExamByIdData = {
  exam: Exam;
  shortlistedExamIds: number[];
  linkedColleges: DashboardCollege[];
  linkedCollegesTotal: number;
  linkedScholarships?: ExamLinkedScholarshipPreview[];
  linkedScholarshipTotal?: number;
  taggedLectureCount?: number;
  taggedLecturePreviews?: ExamTaggedLecturePreview[];
};

export async function getDashboardExamById(
  idOrSlug: string | number
): Promise<ApiResponse<DashboardExamByIdData>> {
  const segment = encodeURIComponent(String(idOrSlug).trim());
  return apiRequest<DashboardExamByIdData>(
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
  alreadyFilledFormExamIds: number[];
  automationFilledExamIds: number[];
  weeklyCompletedMockCount: number;
  performanceInsights: {
    percent: number;
    satisfiedWeeks: number;
    dueWeeks: number;
    hasDueWeeks: boolean;
  };
  rankPredictor: {
    attemptCount: number;
    isImproving: boolean;
    currentRank: number | null;
    previousRank: number | null;
  };
  counsellingReady: {
    percent: number;
    activeCount: number;
    totalCount: number;
    hasCounsellingDates: boolean;
    isReady: boolean;
  };
  recommendedExamIds: number[];
  phase1ApplicationStarts: Array<{
    examId: number;
    examName: string;
    applicationStartDate: string;
  }>;
  phase2ApplicationCloses: Array<{
    examId: number;
    examName: string;
    applicationCloseDate: string;
  }>;
  phase3AdmitCardDates: Array<{
    examId: number;
    examName: string;
    admitCardDate: string;
  }>;
  phase4MockTestReminders: Array<{
    examId: number;
    examName: string;
    examDate: string;
    mockTestDate: string;
  }>;
  phase4MockTestSummary: {
    completedInWindow: number;
    totalInWindow: number;
  };
  phase5ExamDates: Array<{
    examId: number;
    examName: string;
    examDate: string;
  }>;
  phase6ResultDates: Array<{
    examId: number;
    examName: string;
    resultDate: string;
  }>;
  phase7CounsellingDates: Array<{
    examId: number;
    examName: string;
    counsellingDate: string;
  }>;
  message?: string;
}>> {
  return apiRequest<{
    streamId: number | null;
    shortlistedExamIds: number[];
    alreadyFilledFormExamIds: number[];
    automationFilledExamIds: number[];
    weeklyCompletedMockCount: number;
    performanceInsights: {
      percent: number;
      satisfiedWeeks: number;
      dueWeeks: number;
      hasDueWeeks: boolean;
    };
    rankPredictor: {
      attemptCount: number;
      isImproving: boolean;
      currentRank: number | null;
      previousRank: number | null;
    };
    counsellingReady: {
      percent: number;
      activeCount: number;
      totalCount: number;
      hasCounsellingDates: boolean;
      isReady: boolean;
    };
    recommendedExamIds: number[];
    phase1ApplicationStarts: Array<{
      examId: number;
      examName: string;
      applicationStartDate: string;
    }>;
    phase2ApplicationCloses: Array<{
      examId: number;
      examName: string;
      applicationCloseDate: string;
    }>;
    phase3AdmitCardDates: Array<{
      examId: number;
      examName: string;
      admitCardDate: string;
    }>;
    phase4MockTestReminders: Array<{
      examId: number;
      examName: string;
      examDate: string;
      mockTestDate: string;
    }>;
    phase4MockTestSummary: {
      completedInWindow: number;
      totalInWindow: number;
    };
    phase5ExamDates: Array<{
      examId: number;
      examName: string;
      examDate: string;
    }>;
    phase6ResultDates: Array<{
      examId: number;
      examName: string;
      resultDate: string;
    }>;
    phase7CounsellingDates: Array<{
      examId: number;
      examName: string;
      counsellingDate: string;
    }>;
    message?: string;
  }>('/auth/profile/dashboard-exams/meta', { method: 'GET' });
}

/** Mock Test picker: form-filled → shortlisted → recommended (auth required). */
export async function getDashboardMockTestExams(): Promise<ApiResponse<{
  streamId: number | null;
  exams: Exam[];
  alreadyFilledFormExamIds: number[];
  shortlistedExamIds: number[];
  recommendedExamIds: number[];
  message?: string;
}>> {
  return apiRequest<{
    streamId: number | null;
    exams: Exam[];
    alreadyFilledFormExamIds: number[];
    shortlistedExamIds: number[];
    recommendedExamIds: number[];
    message?: string;
  }>('/auth/profile/dashboard-exams/mock-test', { method: 'GET' });
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

export async function updateAlreadyFilledForm(
  exam_id: number,
  filled: boolean
): Promise<ApiResponse<{
  alreadyFilledFormExamIds: number[];
  shortlistedExamIds: number[];
}>> {
  return apiRequest<{
    alreadyFilledFormExamIds: number[];
    shortlistedExamIds: number[];
  }>('/auth/profile/already-filled-form', {
    method: 'PUT',
    body: JSON.stringify({ exam_id, filled }),
  });
}
