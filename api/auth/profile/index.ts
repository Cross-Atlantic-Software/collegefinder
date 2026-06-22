/**
 * Authentication API - User Profile endpoints
 */

import { apiRequest, getApiBaseUrl } from '../../client';
import type {
  ApiResponse,
  User,
} from '../../types';

import { API_ENDPOINTS } from '../../constants';

/**
 * Get current authenticated user
 */
export async function getCurrentUser(): Promise<ApiResponse<{ user: User }>> {
  return apiRequest<{ user: User }>(API_ENDPOINTS.AUTH.ME, {
    method: 'GET',
  });
}

/**
 * Update user profile (name)
 * Note: User is identified from authentication token
 */
export async function updateProfile(
  name: string
): Promise<ApiResponse<{ user: User }>> {
  return apiRequest<{ user: User }>(API_ENDPOINTS.AUTH.PROFILE, {
    method: 'PUT',
    body: JSON.stringify({ name }),
  });
}

/**
 * Get user basic info
 */
export async function getBasicInfo(): Promise<ApiResponse<{
  id: number;
  user_code?: string | null;
  email: string | null;
  name: string | null;
  first_name: string | null;
  last_name: string | null;
  date_of_birth: string | null;
  gender: string | null;
  phone_number: string | null;
  email_verified: boolean;
  latitude: number | null;
  profile_photo?: string | null;
  longitude: number | null;
  nationality: string | null;
  marital_status: string | null;
  father_full_name: string | null;
  mother_full_name: string | null;
  guardian_name: string | null;
  alternate_mobile_number: string | null;
  automation_password: string | null;
  /** Code this user entered (someone else's share code), not their own Refer & Earn code. */
  referred_by_code: string | null;
}>> {
  return apiRequest(API_ENDPOINTS.AUTH.PROFILE_BASIC, {
    method: 'GET',
  });
}

/**
 * Update user basic info
 */
/**
 * Mark onboarding complete after landing contact / Map my admission flow.
 */
export async function markLandingOnboardingComplete(): Promise<
  ApiResponse<{ onboarding_completed: boolean }>
> {
  return apiRequest<{ onboarding_completed: boolean }>(
    '/auth/profile/complete-landing-onboarding',
    { method: 'POST' }
  );
}

export async function updateBasicInfo(data: {
  name?: string;
  first_name?: string;
  last_name?: string;
  date_of_birth?: string;
  gender?: string;
  phone_number?: string;
  latitude?: number;
  longitude?: number;
  nationality?: string;
  marital_status?: string;
  father_full_name?: string;
  mother_full_name?: string;
  guardian_name?: string;
  alternate_mobile_number?: string;
  /** Someone else's referral code you used; omit to leave unchanged. Send null or "" to clear. */
  referred_by_code?: string | null;
}): Promise<ApiResponse<{
  id: number;
  user_code?: string | null;
  email: string;
  name: string | null;
  first_name: string | null;
  last_name: string | null;
  date_of_birth: string | null;
  gender: string | null;
  phone_number: string | null;
  latitude: number | null;
  longitude: number | null;
  profile_photo?: string | null;
  nationality: string | null;
  marital_status: string | null;
  father_full_name: string | null;
  mother_full_name: string | null;
  guardian_name: string | null;
  alternate_mobile_number: string | null;
  referred_by_code: string | null;
}>> {
  return apiRequest(API_ENDPOINTS.AUTH.PROFILE_BASIC, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

/**
 * Get user academics
 */
export async function getAcademics(): Promise<ApiResponse<{
  // Matric (10th) fields
  matric_board: string | null;
  matric_school_name: string | null;
  matric_passing_year: number | null;
  matric_roll_number: string | null;
  matric_total_marks: number | null;
  matric_obtained_marks: number | null;
  matric_percentage: number | null;
  matric_state: string | null;
  matric_city: string | null;
  matric_school_pincode: string | null;
  matric_marks_type: string | null;
  matric_cgpa: number | null;
  matric_result_status: string | null;
  matric_subjects: Array<{ subject_id?: number; name: string; percent: number; obtainedMarks?: number; totalMarks?: number }>;
  // Post-Matric (12th) fields
  postmatric_board: string | null;
  postmatric_school_name: string | null;
  postmatric_passing_year: number | null;
  postmatric_roll_number: string | null;
  postmatric_total_marks: number | null;
  postmatric_obtained_marks: number | null;
  postmatric_percentage: number | null;
  postmatric_state: string | null;
  postmatric_city: string | null;
  postmatric_school_pincode: string | null;
  postmatric_marks_type: string | null;
  postmatric_cgpa: number | null;
  postmatric_result_status: string | null;
  stream: string | null;
  stream_id: number | null;
  subjects: Array<{ subject_id?: number; name: string; percent: number; obtainedMarks?: number; totalMarks?: number }>;
  is_pursuing_12th: boolean;
  already_filled_form?: number[];
  user_shortlisted_exams?: number[];
} | null>> {
  return apiRequest(API_ENDPOINTS.AUTH.PROFILE_ACADEMICS, {
    method: 'GET',
  });
}

/**
 * Get subjects filtered by user's stream_id with topics
 */
export async function getSubjectsByStream(): Promise<ApiResponse<{
  subjects: Array<{
    id: string;
    name: string;
    topics: Array<{
      id: number;
      name: string;
      thumbnail: string | null;
      description: string | null;
      home_display: boolean;
      sort_order: number;
    }>;
    allTopics: Array<{
      id: number;
      name: string;
      thumbnail: string | null;
      description: string | null;
      home_display: boolean;
      sort_order: number;
    }>;
  }>;
  requiresStreamSelection: boolean;
  message?: string;
  stream_id?: number;
}>> {
  return apiRequest(API_ENDPOINTS.AUTH.PROFILE_SUBJECTS, {
    method: 'GET',
  });
}

export type ExamPrepLectureDto = {
  id: number;
  youtubeId: string;
  iframeCode?: string | null;
  videoFile?: string | null;
  title: string;
  channel: string;
  hookSummary: string | null;
  likes: number;
  subscribers: number;
  rankScore: number;
  /** 0 = shortlisted exam match, 1 = recommended exam match, 2 = other */
  examTier?: number;
  examIds?: number[];
  updatedAt: string;
  subjectId: string;
  subjectName: string;
  topicId: number;
  topicName: string;
  subtopicId?: number | null;
  subtopicName?: string | null;
  /** Full video length in seconds (YouTube Data API); null if unavailable. */
  durationSeconds?: number | null;
};

/**
 * Top recommended exam prep videos — one per subject (shortlisted + recommended exams, sorted).
 */
export async function getExamPrepRecommendedLecture(
  sort: 'latest' | 'popular' = 'latest'
): Promise<
  ApiResponse<{
    lecture: ExamPrepLectureDto | null;
    lectures: ExamPrepLectureDto[];
    requiresStreamSelection: boolean;
    message?: string;
    stream_id?: number;
  }>
> {
  const qs = sort === 'popular' ? '?sort=popular' : '';
  return apiRequest(`${API_ENDPOINTS.AUTH.PROFILE_EXAM_PREP_LECTURES_RECOMMENDED}${qs}`, {
    method: 'GET',
  });
}

/**
 * Exam prep videos for one subject (loaded when user selects a subject tab).
 */
export async function getExamPrepLecturesBySubject(
  subjectId: string,
  search?: string
): Promise<
  ApiResponse<{
    lectures: ExamPrepLectureDto[];
    subjectId: number;
    requiresStreamSelection: boolean;
    message?: string;
    stream_id?: number;
  }>
> {
  const params = new URLSearchParams();
  if (search?.trim()) params.set('search', search.trim());
  const qs = params.toString();
  const path = `${API_ENDPOINTS.AUTH.PROFILE_EXAM_PREP_LECTURES_SUBJECT}/${encodeURIComponent(subjectId)}${qs ? `?${qs}` : ''}`;
  return apiRequest(path, { method: 'GET' });
}

/**
 * Get topic by name with subtopics and lectures
 */
export async function getTopicByName(topicName: string): Promise<ApiResponse<{
  topic: {
    id: number;
    name: string;
    thumbnail: string | null;
    description: string | null;
    sub_id: number;
  };
  subtopics: Array<{
    id: number;
    name: string;
    description: string | null;
    sort_order: number;
    lectures: Array<{
      id: number;
      name: string;
      content_type: 'VIDEO' | 'ARTICLE';
      video_file: string | null;
      article_content: string | null;
      thumbnail: string | null;
      description: string | null;
      sort_order: number;
    }>;
  }>;
}>> {
  return apiRequest(`${API_ENDPOINTS.AUTH.PROFILE_TOPICS}/${encodeURIComponent(topicName)}`, {
    method: 'GET',
  });
}

/**
 * Update user academics
 */
export async function updateAcademics(data: {
  // Matric (10th) fields
  matric_board?: string;
  matric_school_name?: string;
  matric_passing_year?: number;
  matric_roll_number?: string;
  matric_total_marks?: number;
  matric_obtained_marks?: number;
  matric_percentage?: number;
  // Post-Matric (12th) fields
  postmatric_board?: string;
  postmatric_school_name?: string;
  postmatric_passing_year?: number;
  postmatric_roll_number?: string;
  postmatric_total_marks?: number;
  postmatric_obtained_marks?: number;
  postmatric_percentage?: number;
  stream?: string;
  stream_id?: number;
  subjects?: Array<{ subject_id?: number; name: string; percent: number; obtainedMarks?: number; totalMarks?: number }>;
  matric_subjects?: Array<{ subject_id?: number; name: string; percent: number; obtainedMarks?: number; totalMarks?: number }>;
  is_pursuing_12th?: boolean;
}): Promise<ApiResponse<{
  // Matric (10th) fields
  matric_board: string | null;
  matric_school_name: string | null;
  matric_passing_year: number | null;
  matric_roll_number: string | null;
  matric_total_marks: number | null;
  matric_obtained_marks: number | null;
  matric_percentage: number | null;
  // Post-Matric (12th) fields
  postmatric_board: string | null;
  postmatric_school_name: string | null;
  postmatric_passing_year: number | null;
  postmatric_roll_number: string | null;
  postmatric_total_marks: number | null;
  postmatric_obtained_marks: number | null;
  postmatric_percentage: number | null;
  stream: string | null;
  subjects: Array<{ subject_id?: number; name: string; percent: number; obtainedMarks?: number; totalMarks?: number }>;
  matric_subjects: Array<{ subject_id?: number; name: string; percent: number; obtainedMarks?: number; totalMarks?: number }>;
  is_pursuing_12th: boolean;
}>> {
  return apiRequest(API_ENDPOINTS.AUTH.PROFILE_ACADEMICS, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

/**
 * Get user career goals
 */
export async function getCareerGoals(): Promise<ApiResponse<{
  interests: string[];
} | null>> {
  return apiRequest(API_ENDPOINTS.AUTH.PROFILE_CAREER_GOALS, {
    method: 'GET',
  });
}

/**
 * Update user career goals
 */
export async function updateCareerGoals(data: {
  interests: string[];
}): Promise<ApiResponse<{
  interests: string[];
}>> {
  return apiRequest(API_ENDPOINTS.AUTH.PROFILE_CAREER_GOALS, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

/**
 * Get recommended colleges for the current user.
 * Colleges whose recommended exams match user's recommended exam IDs (career goals + stream).
 */
export async function getRecommendedColleges(): Promise<ApiResponse<{
  colleges: Array<{
    id: number;
    college_name: string;
    college_location: string | null;
    college_type: string | null;
    college_logo: string | null;
    created_at?: string;
    updated_at?: string;
  }>;
  message?: string;
}>> {
  return apiRequest(API_ENDPOINTS.AUTH.PROFILE_RECOMMENDED_COLLEGES, {
    method: 'GET',
  });
}

export interface DashboardCollegeCutoffRow {
  id?: number;
  college_program_id?: number;
  exam_id?: number;
  exam_name?: string | null;
  exam_code?: string | null;
  branch?: string | null;
  category?: string | null;
  cutoff_rank?: number | null;
  expected_rank?: number | null;
  year?: number | null;
}

export interface DashboardCollegeSeatRow {
  id?: number;
  college_program_id?: number;
  branch?: string | null;
  category?: string | null;
  seat_count?: number | null;
  year?: number | null;
}

/** Admin-linked college payload for dashboard shortlist tabs */
export interface DashboardCollegeProgram {
  id: number;
  college_id: number;
  program_id: number;
  program_name?: string | null;
  intake_capacity?: number | null;
  duration_years?: number | null;
  duration_unit?: string | null;
  branch_course?: string | null;
  program_description?: string | null;
  key_dates_summary?: string | null;
  fee_per_semester?: number | string | null;
  total_fee?: number | string | null;
  placement?: string | null;
  scholarship?: string | null;
  counselling_process?: string | null;
  documents_required?: string | null;
  contact_email?: string | null;
  contact_number?: string | null;
  brochure_url?: string | null;
  previousCutoffs?: DashboardCollegeCutoffRow[];
  expectedCutoffs?: DashboardCollegeCutoffRow[];
  seatMatrix?: DashboardCollegeSeatRow[];
  /** Resolved from recommended_exam_ids — display names only. */
  recommendedExamNames?: string[];
  [key: string]: unknown;
}

export interface DashboardCollege {
  id: number;
  college_name: string;
  college_location: string | null;
  college_type: string | null;
  college_logo: string | null;
  logo_url?: string | null;
  logo_filename?: string | null;
  website?: string | null;
  state?: string | null;
  city?: string | null;
  parent_university?: string | null;
  nirf_ranking?: number | null;
  admission_timeline?: string | null;
  abbreviation?: string | null;
  program_count?: number | null;
  placement_rate?: string | null;
  program_fee?: string | null;
  average_package?: string | null;
  linked_exam_count?: number;
  created_at?: string;
  updated_at?: string;
  collegeDetails?: { college_description?: string | null; major_program_ids?: unknown } | null;
  keyDates?: Array<{ id?: number; event_name?: string | null; event_date?: string | null }>;
  documentsRequired?: Array<{ id?: number; document_name?: string | null }>;
  counsellingSteps?: Array<{ step_number?: number | null; description?: string | null }>;
  programs?: DashboardCollegeProgram[];
  linkedExams?: Array<{
    id: number;
    name: string;
    code: string | null;
    abbreviation?: string | null;
  }>;
  majorProgramNames?: string[];
}

/**
 * Dashboard college shortlist: all / recommended (exam overlap with exam shortlist) / shortlisted IDs + rows
 */
/** Colleges that list this exam as a recommended exam (college or program level). */
export async function getCollegesForExam(
  examId: number
): Promise<ApiResponse<{
  examId: number;
  colleges: DashboardCollege[];
  totalCount: number;
}>> {
  return apiRequest(`/auth/profile/exams/${examId}/colleges`, {
    method: 'GET',
  });
}

/** Coaching institutes linked to this exam (institute_exams + institute_exam_specialization). */
export async function getInstitutesForExam(
  examId: number
): Promise<ApiResponse<{
  examId: number;
  institutes: DashboardInstitute[];
  totalCount: number;
}>> {
  return apiRequest(`/auth/profile/exams/${examId}/institutes`, {
    method: 'GET',
  });
}

export type DashboardCollegeTabId = 'recommended' | 'shortlisted' | 'all';

export interface DashboardCollegesPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface DashboardCollegesTabTotals {
  all: number;
  recommended: number;
  shortlisted: number;
}

/** Lightweight meta for sidebar + React Query (no enriched rows). */
export async function getDashboardCollegesMeta(): Promise<ApiResponse<{
  streamId: number | null;
  shortlistedCollegeIds: number[];
  tabTotals: DashboardCollegesTabTotals;
  message?: string;
}>> {
  return apiRequest(API_ENDPOINTS.AUTH.PROFILE_DASHBOARD_COLLEGES_META, {
    method: 'GET',
  });
}

/** Single tab page; server sorts then enriches only this page. */
export async function getDashboardCollegesTab(
  tab: DashboardCollegeTabId,
  params: { page?: number; limit?: number; search?: string } = {}
): Promise<ApiResponse<{
  streamId: number | null;
  tab: DashboardCollegeTabId;
  colleges: DashboardCollege[];
  shortlistedCollegeIds: number[];
  pagination: DashboardCollegesPagination;
  message?: string;
}>> {
  const sp = new URLSearchParams();
  sp.set('tab', tab);
  if (params.page != null) sp.set('page', String(params.page));
  if (params.limit != null) sp.set('limit', String(params.limit));
  if (params.search?.trim()) sp.set('search', params.search.trim());
  return apiRequest(
    `${API_ENDPOINTS.AUTH.PROFILE_DASHBOARD_COLLEGES_TAB}?${sp.toString()}`,
    { method: 'GET' }
  );
}

/** College detail by numeric id or URL slug. */
export async function getDashboardCollegeByRef(
  collegeRef: string
): Promise<ApiResponse<{
  college: DashboardCollege;
  shortlistedCollegeIds: number[];
  taggedLectureCount?: number;
  taggedLecturePreviews?: import("@/api/exams").ExamTaggedLecturePreview[];
}>> {
  const ref = encodeURIComponent(collegeRef.trim());
  return apiRequest(
    `${API_ENDPOINTS.AUTH.PROFILE_DASHBOARD_COLLEGE_DETAIL}/${ref}`,
    { method: 'GET' }
  );
}

/** @deprecated Use getDashboardCollegesMeta — legacy alias. */
export async function getDashboardColleges(): Promise<ApiResponse<{
  streamId: number | null;
  shortlistedCollegeIds: number[];
  tabTotals?: DashboardCollegesTabTotals;
  message?: string;
}>> {
  return apiRequest(API_ENDPOINTS.AUTH.PROFILE_DASHBOARD_COLLEGES, {
    method: 'GET',
  });
}

export async function updateShortlistedCollege(
  college_id: number,
  shortlisted: boolean
): Promise<ApiResponse<{ shortlistedCollegeIds: number[] }>> {
  return apiRequest(API_ENDPOINTS.AUTH.PROFILE_SHORTLISTED_COLLEGES, {
    method: 'PUT',
    body: JSON.stringify({ college_id, shortlisted }),
  });
}

export interface DashboardLinkedExam {
  id: number;
  name: string;
  code: string | null;
  abbreviation?: string | null;
}

export interface DashboardInstitute {
  id: number;
  institute_name: string;
  institute_location: string | null;
  city?: string | null;
  state?: string | null;
  institute_cityname?: string | null;
  type?: string | null;
  logo?: string | null;
  website?: string | null;
  contact_number?: string | null;
  google_maps_link?: string | null;
  institute_description?: string | null;
  linkedExams?: DashboardLinkedExam[];
  branches_number?: string | null;
  student_strength?: string | null;
  fee_type?: string | null;
  fee_band?: string | null;
  batch_category?: string | null;
  course_cycle?: string | null;
  parent_institute?: string | null;
  instituteDetails?: Pick<
    DashboardInstituteDetails,
    'demo_available' | 'scholarship_available'
  > | null;
  statistics?: DashboardInstituteStatistics | null;
}

export type DashboardInstituteDelivery = 'online' | 'offline' | 'shortlisted';

export interface DashboardInstitutesPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface DashboardInstitutesTabTotals {
  online: number;
  offline: number;
  shortlisted: number;
}

export async function getDashboardInstitutesMeta(): Promise<ApiResponse<{
  streamId: number | null;
  shortlistedInstituteIds: number[];
  tabTotals: DashboardInstitutesTabTotals;
  message?: string;
}>> {
  return apiRequest(API_ENDPOINTS.AUTH.PROFILE_DASHBOARD_INSTITUTES_META, { method: 'GET' });
}

export async function getDashboardInstitutesTab(
  delivery: DashboardInstituteDelivery,
  params: { page?: number; limit?: number; search?: string } = {}
): Promise<ApiResponse<{
  streamId: number | null;
  delivery: DashboardInstituteDelivery;
  institutes: DashboardInstitute[];
  shortlistedInstituteIds: number[];
  pagination: DashboardInstitutesPagination;
  message?: string;
}>> {
  const sp = new URLSearchParams();
  sp.set('delivery', delivery);
  if (params.page != null) sp.set('page', String(params.page));
  if (params.limit != null) sp.set('limit', String(params.limit));
  if (params.search?.trim()) sp.set('search', params.search.trim());
  return apiRequest(
    `${API_ENDPOINTS.AUTH.PROFILE_DASHBOARD_INSTITUTES_TAB}?${sp.toString()}`,
    { method: 'GET' }
  );
}

/** @deprecated Use getDashboardInstitutesMeta */
export async function getDashboardInstitutes(): Promise<ApiResponse<{
  streamId: number | null;
  shortlistedInstituteIds: number[];
  tabTotals?: DashboardInstitutesTabTotals;
  message?: string;
}>> {
  return apiRequest(API_ENDPOINTS.AUTH.PROFILE_DASHBOARD_INSTITUTES, { method: 'GET' });
}

export async function updateShortlistedInstitute(
  institute_id: number,
  shortlisted: boolean
): Promise<ApiResponse<{ shortlistedInstituteIds: number[] }>> {
  return apiRequest(API_ENDPOINTS.AUTH.PROFILE_SHORTLISTED_INSTITUTES, {
    method: 'PUT',
    body: JSON.stringify({ institute_id, shortlisted }),
  });
}

export interface DashboardInstituteDetails {
  institute_description?: string | null;
  demo_available?: boolean | null;
  scholarship_available?: boolean | null;
}

export interface DashboardInstituteStatistics {
  ranking_score?: string | number | null;
  success_rate?: string | number | null;
  student_rating?: string | number | null;
}

export interface DashboardInstituteCourse {
  id?: number;
  course_name?: string | null;
  target_class?: string | null;
  duration_months?: string | null;
  fees?: string | null;
  batch_size?: string | null;
  start_date?: string | null;
}

export interface DashboardInstituteDetail extends DashboardInstitute {
  instituteDetails?: DashboardInstituteDetails | null;
  statistics?: DashboardInstituteStatistics | null;
  courses?: DashboardInstituteCourse[];
}

export async function getDashboardInstituteByRef(
  instituteRef: string
): Promise<ApiResponse<{
  institute: DashboardInstituteDetail;
  shortlistedInstituteIds: number[];
  taggedLectureCount?: number;
  taggedLecturePreviews?: import("@/api/exams").ExamTaggedLecturePreview[];
}>> {
  const ref = encodeURIComponent(instituteRef.trim());
  return apiRequest(
    `${API_ENDPOINTS.AUTH.PROFILE_DASHBOARD_INSTITUTE_DETAIL}/${ref}`,
    { method: 'GET' }
  );
}

export interface DashboardScholarship {
  id: number;
  scholarship_name: string;
  conducting_authority: string | null;
  scholarship_type: string | null;
  description: string | null;
  scholarship_amount: string | null;
  official_website: string | null;
  application_link?: string | null;
  mode?: string | null;
  stream_name?: string | null;
  income_limit?: string | null;
  minimum_marks_required?: string | null;
  renewal_available?: boolean | null;
  linkedExams?: DashboardLinkedExam[];
  linkedColleges?: { id: number; name: string; city?: string | null; state?: string | null }[];
  applicableStates?: DashboardScholarshipApplicableState[];
  linkedExamCount?: number;
  linkedCollegeCount?: number;
}

export interface DashboardScholarshipEligibleCategory {
  category?: string | null;
}

export interface DashboardScholarshipApplicableState {
  state_name?: string | null;
}

export interface DashboardScholarshipDocument {
  document_name?: string | null;
}

export interface DashboardScholarshipDetail extends DashboardScholarship {
  stream_id?: number | null;
  stream_name?: string | null;
  income_limit?: string | null;
  minimum_marks_required?: string | null;
  selection_process?: string | null;
  application_start_date?: string | null;
  application_end_date?: string | null;
  mode?: string | null;
  official_notification_link?: string | null;
  active_status?: string | null;
  academic_year?: string | null;
  eligible_degree?: string | null;
  number_of_awards?: string | null;
  renewal_available?: boolean | null;
  renewal_conditions?: string | null;
  scope?: string | null;
  value_category?: string | null;
  education_level?: string | null;
  eligibleCategories?: DashboardScholarshipEligibleCategory[];
  applicableStates?: DashboardScholarshipApplicableState[];
  documentsRequired?: DashboardScholarshipDocument[];
}

export type DashboardScholarshipTabId = 'recommended' | 'shortlisted' | 'all';

export interface DashboardScholarshipsPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface DashboardScholarshipsTabTotals {
  all: number;
  recommended: number;
  shortlisted: number;
}

export async function getDashboardScholarshipsMeta(): Promise<ApiResponse<{
  streamId: number | null;
  shortlistedScholarshipIds: number[];
  tabTotals: DashboardScholarshipsTabTotals;
  message?: string;
}>> {
  return apiRequest(API_ENDPOINTS.AUTH.PROFILE_DASHBOARD_SCHOLARSHIPS_META, { method: 'GET' });
}

export async function getDashboardScholarshipsTab(
  tab: DashboardScholarshipTabId,
  params: { page?: number; limit?: number; search?: string } = {}
): Promise<ApiResponse<{
  streamId: number | null;
  tab: DashboardScholarshipTabId;
  scholarships: DashboardScholarship[];
  shortlistedScholarshipIds: number[];
  pagination: DashboardScholarshipsPagination;
  message?: string;
}>> {
  const sp = new URLSearchParams();
  sp.set('tab', tab);
  if (params.page != null) sp.set('page', String(params.page));
  if (params.limit != null) sp.set('limit', String(params.limit));
  if (params.search?.trim()) sp.set('search', params.search.trim());
  return apiRequest(
    `${API_ENDPOINTS.AUTH.PROFILE_DASHBOARD_SCHOLARSHIPS_TAB}?${sp.toString()}`,
    { method: 'GET' }
  );
}

/** @deprecated Use getDashboardScholarshipsMeta */
export async function getDashboardScholarships(): Promise<ApiResponse<{
  streamId: number | null;
  shortlistedScholarshipIds: number[];
  tabTotals?: DashboardScholarshipsTabTotals;
  message?: string;
}>> {
  return apiRequest(API_ENDPOINTS.AUTH.PROFILE_DASHBOARD_SCHOLARSHIPS, { method: 'GET' });
}

export async function updateShortlistedScholarship(
  scholarship_id: number,
  shortlisted: boolean
): Promise<ApiResponse<{ shortlistedScholarshipIds: number[] }>> {
  return apiRequest(API_ENDPOINTS.AUTH.PROFILE_SHORTLISTED_SCHOLARSHIPS, {
    method: 'PUT',
    body: JSON.stringify({ scholarship_id, shortlisted }),
  });
}

export async function getDashboardScholarshipByRef(
  scholarshipRef: string
): Promise<ApiResponse<{
  scholarship: DashboardScholarshipDetail;
  shortlistedScholarshipIds: number[];
  taggedLectureCount?: number;
  taggedLecturePreviews?: import("@/api/exams").ExamTaggedLecturePreview[];
}>> {
  const ref = encodeURIComponent(scholarshipRef.trim());
  return apiRequest(
    `${API_ENDPOINTS.AUTH.PROFILE_DASHBOARD_SCHOLARSHIP_DETAIL}/${ref}`,
    { method: 'GET' }
  );
}

/**
 * Get profile completion percentage
 */
export async function getProfileCompletion(): Promise<ApiResponse<{
  percentage: number;
  completedFields: number;
  totalFields: number;
  missingFields: Array<{ section: string; field: string }>;
}>> {
  return apiRequest(API_ENDPOINTS.AUTH.PROFILE_COMPLETION, {
    method: 'GET',
  });
}

/**
 * Upload profile photo
 */
export async function uploadProfilePhoto(
  file: File
): Promise<ApiResponse<{ profile_photo: string }>> {
  const formData = new FormData();
  formData.append('photo', file);

  const apiUrl = getApiBaseUrl();
  const url = `${apiUrl}/auth/profile/upload-photo`;

  const token = localStorage.getItem('auth_token');
  if (!token) {
    throw new Error('No authentication token found');
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to upload profile photo');
  }

  return data;
}

/**
 * Delete profile photo
 */
export async function deleteProfilePhoto(): Promise<ApiResponse<{ profile_photo: null }>> {
  return apiRequest<{ profile_photo: null }>(API_ENDPOINTS.AUTH.PROFILE_UPLOAD_PHOTO, {
    method: 'DELETE',
  });
}

/**
 * Send OTP to email for verification (profile email update)
 */
export async function sendEmailOTP(email: string): Promise<ApiResponse<{
  email: string;
  expiresIn: number;
}>> {
  return apiRequest(API_ENDPOINTS.AUTH.PROFILE_EMAIL_SEND_OTP, {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

/**
 * Verify OTP and update email
 */
export async function verifyEmailOTP(email: string, code: string): Promise<ApiResponse<{
  id: number;
  email: string;
  email_verified: boolean;
}>> {
  return apiRequest(API_ENDPOINTS.AUTH.PROFILE_EMAIL_VERIFY, {
    method: 'POST',
    body: JSON.stringify({ email, code }),
  });
}

/**
 * Get user government identification
 */
export async function getGovernmentIdentification(): Promise<ApiResponse<{
  id: number;
  user_id: number;
  aadhar_number: string | null;
  apaar_id: string | null;
  created_at: string;
  updated_at: string;
} | null>> {
  return apiRequest(API_ENDPOINTS.AUTH.PROFILE_GOVERNMENT_IDENTIFICATION, {
    method: 'GET',
  });
}

/**
 * Create or update user government identification
 */
export async function upsertGovernmentIdentification(data: {
  aadhar_number?: string;
  apaar_id?: string;
}): Promise<ApiResponse<{
  id: number;
  user_id: number;
  aadhar_number: string | null;
  apaar_id: string | null;
  created_at: string;
  updated_at: string;
}>> {
  return apiRequest(API_ENDPOINTS.AUTH.PROFILE_GOVERNMENT_IDENTIFICATION, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

/**
 * Delete user government identification
 */
export async function deleteGovernmentIdentification(): Promise<ApiResponse<{
  message: string;
}>> {
  return apiRequest(API_ENDPOINTS.AUTH.PROFILE_GOVERNMENT_IDENTIFICATION, {
    method: 'DELETE',
  });
}

/**
 * Get user category and reservation
 */
export async function getCategoryAndReservation(): Promise<ApiResponse<{
  id: number;
  user_id: number;
  category_id: number | null;
  category_name: string | null;
  ews_status: boolean;
  pwbd_status: boolean;
  type_of_disability: string | null;
  disability_percentage: number | null;
  udid_number: string | null;
  minority_status: string | null;
  ex_serviceman_defence_quota: boolean;
  kashmiri_migrant_regional_quota: boolean;
  state_domicile: boolean;
  home_state_for_quota: string | null;
  created_at: string;
  updated_at: string;
} | null>> {
  return apiRequest(API_ENDPOINTS.AUTH.PROFILE_CATEGORY_AND_RESERVATION, {
    method: 'GET',
  });
}

/**
 * Create or update user category and reservation
 */
export async function upsertCategoryAndReservation(data: {
  category_id?: number;
  ews_status?: boolean;
  pwbd_status?: boolean;
  type_of_disability?: string;
  disability_percentage?: number;
  udid_number?: string;
  minority_status?: string;
  ex_serviceman_defence_quota?: boolean;
  kashmiri_migrant_regional_quota?: boolean;
  state_domicile?: boolean;
  home_state_for_quota?: string;
}): Promise<ApiResponse<{
  id: number;
  user_id: number;
  category_id: number | null;
  category_name: string | null;
  ews_status: boolean;
  pwbd_status: boolean;
  type_of_disability: string | null;
  disability_percentage: number | null;
  udid_number: string | null;
  minority_status: string | null;
  ex_serviceman_defence_quota: boolean;
  kashmiri_migrant_regional_quota: boolean;
  state_domicile: boolean;
  home_state_for_quota: string | null;
  created_at: string;
  updated_at: string;
}>> {
  return apiRequest(API_ENDPOINTS.AUTH.PROFILE_CATEGORY_AND_RESERVATION, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

/**
 * Delete user category and reservation
 */
export async function deleteCategoryAndReservation(): Promise<ApiResponse<{
  message: string;
}>> {
  return apiRequest(API_ENDPOINTS.AUTH.PROFILE_CATEGORY_AND_RESERVATION, {
    method: 'DELETE',
  });
}

/**
 * Get user other personal details
 */
export async function getOtherPersonalDetails(): Promise<ApiResponse<{
  id: number;
  user_id: number;
  religion: string | null;
  mother_tongue: string | null;
  annual_family_income: number | null;
  occupation_of_father: string | null;
  occupation_of_mother: string | null;
  created_at: string;
  updated_at: string;
} | null>> {
  return apiRequest(API_ENDPOINTS.AUTH.PROFILE_OTHER_PERSONAL_DETAILS, {
    method: 'GET',
  });
}

/**
 * Create or update user other personal details
 */
export async function upsertOtherPersonalDetails(data: {
  religion?: 'Hindu' | 'Muslim' | 'Christian' | 'Sikh' | 'Buddhist' | 'Jain' | 'Jewish' | 'Parsi (Zoroastrian)' | 'Other' | 'Prefer not to say';
  mother_tongue?: string;
  annual_family_income?: number;
  occupation_of_father?: string;
  occupation_of_mother?: string;
}): Promise<ApiResponse<{
  id: number;
  user_id: number;
  religion: string | null;
  mother_tongue: string | null;
  annual_family_income: number | null;
  occupation_of_father: string | null;
  occupation_of_mother: string | null;
  created_at: string;
  updated_at: string;
}>> {
  return apiRequest(API_ENDPOINTS.AUTH.PROFILE_OTHER_PERSONAL_DETAILS, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

/**
 * Delete user other personal details
 */
export async function deleteOtherPersonalDetails(): Promise<ApiResponse<{
  message: string;
}>> {
  return apiRequest(API_ENDPOINTS.AUTH.PROFILE_OTHER_PERSONAL_DETAILS, {
    method: 'DELETE',
  });
}

/**
 * Get user address
 */
export async function getUserAddress(): Promise<ApiResponse<{
  id: number;
  user_id: number;
  correspondence_address_line1: string | null;
  correspondence_address_line2: string | null;
  city_town_village: string | null;
  district: string | null;
  state: string | null;
  country: string | null;
  pincode: string | null;
  permanent_address_same_as_correspondence: boolean;
  permanent_address: string | null;
  created_at: string;
  updated_at: string;
} | null>> {
  return apiRequest(API_ENDPOINTS.AUTH.PROFILE_ADDRESS, {
    method: 'GET',
  });
}

/**
 * Create or update user address
 */
export async function upsertUserAddress(data: {
  correspondence_address_line1?: string;
  correspondence_address_line2?: string;
  city_town_village?: string;
  district?: string;
  state?: string;
  country?: string;
  pincode?: string;
  permanent_address_same_as_correspondence?: boolean;
  permanent_address?: string;
}): Promise<ApiResponse<{
  id: number;
  user_id: number;
  correspondence_address_line1: string | null;
  correspondence_address_line2: string | null;
  city_town_village: string | null;
  district: string | null;
  state: string | null;
  country: string | null;
  pincode: string | null;
  permanent_address_same_as_correspondence: boolean;
  permanent_address: string | null;
  created_at: string;
  updated_at: string;
}>> {
  return apiRequest(API_ENDPOINTS.AUTH.PROFILE_ADDRESS, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

/**
 * Delete user address
 */
export async function deleteUserAddress(): Promise<ApiResponse<{
  message: string;
}>> {
  return apiRequest(API_ENDPOINTS.AUTH.PROFILE_ADDRESS, {
    method: 'DELETE',
  });
}

/**
 * Get user document vault
 */
export async function getDocumentVault(): Promise<ApiResponse<{
  id: number;
  user_id: number;
  passport_size_photograph: string | null;
  signature_image: string | null;
  matric_marksheet: string | null;
  matric_certificate: string | null;
  postmatric_marksheet: string | null;
  valid_photo_id_proof: string | null;
  sc_certificate: string | null;
  st_certificate: string | null;
  obc_ncl_certificate: string | null;
  ews_certificate: string | null;
  pwbd_disability_certificate: string | null;
  udid_card: string | null;
  domicile_certificate: string | null;
  citizenship_certificate: string | null;
  migration_certificate: string | null;
  created_at: string;
  updated_at: string;
} | null>> {
  return apiRequest(API_ENDPOINTS.AUTH.PROFILE_DOCUMENT_VAULT, {
    method: 'GET',
  });
}

/**
 * Upload a document to document vault
 */
export async function uploadDocument(
  file: File,
  fieldName: string
): Promise<ApiResponse<{
  fieldName: string;
  url: string;
  documentVault: {
    id: number;
    user_id: number;
    [key: string]: string | number | null;
  };
}>> {
  const formData = new FormData();
  formData.append('document', file);
  formData.append('fieldName', fieldName);

  const apiUrl = getApiBaseUrl();
  const url = `${apiUrl}${API_ENDPOINTS.AUTH.PROFILE_DOCUMENT_VAULT_UPLOAD}`;

  const token = localStorage.getItem('auth_token');
  if (!token) {
    throw new Error('No authentication token found');
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to upload document');
  }

  return data;
}

/**
 * Delete a document from document vault
 */
export async function deleteDocument(fieldName: string): Promise<ApiResponse<{
  message: string;
}>> {
  return apiRequest(`${API_ENDPOINTS.AUTH.PROFILE_DOCUMENT_VAULT}/${fieldName}`, {
    method: 'DELETE',
  });
}

/**
 * Change account password (requires current password; strong password rules apply)
 */
export async function changePassword(data: {
  old_password: string;
  new_password: string;
  new_password_confirm: string;
}): Promise<ApiResponse<Record<string, never>>> {
  return apiRequest(API_ENDPOINTS.AUTH.PROFILE_PASSWORD, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}