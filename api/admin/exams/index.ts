import { apiRequest, getApiBaseUrl } from '../../client';
import { API_ENDPOINTS } from '../../constants';
import { ApiResponse } from '../../types';

export interface Exam {
  id: number;
  name: string;
  code: string | null;
  description: string | null;
  generation_prompt?: string | null;
  exam_logo?: string | null;
  exam_type?: 'National' | 'State' | 'Institute' | null;
  conducting_authority?: string | null;
  documents_required?: string | null;
  counselling?: string | null;
  number_of_papers?: number;
  website?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ExamDates {
  id: number;
  exam_id: number;
  application_start_date: string | null;
  application_close_date: string | null;
  exam_date: string | null;
  result_date: string | null;
  application_fees: number | null;
  created_at: string;
  updated_at: string;
}

export interface ExamEligibilityCriteria {
  id: number;
  exam_id: number;
  stream_ids: number[];
  subject_ids: number[];
  age_limit: string | null;
  attempt_limit: number | null;
  domicile?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ExamPattern {
  id: number;
  exam_id: number;
  mode: 'Offline' | 'Online' | 'Hybrid' | null;
  number_of_questions: number | null;
  total_marks: number | null;
  negative_marking: string | null;
  weightage_of_subjects: string | null;
  duration_minutes: number | null;
  created_at: string;
  updated_at: string;
}

export interface ExamCutoff {
  id: number;
  exam_id: number;
  ranks_percentiles: string | null;
  cutoff_general: string | null;
  cutoff_obc: string | null;
  cutoff_sc: string | null;
  cutoff_st: string | null;
  target_rank_range: string | null;
  created_at: string;
  updated_at: string;
}

export interface ExamWithDetails extends Exam {
  examDates: ExamDates | null;
  eligibilityCriteria: ExamEligibilityCriteria | null;
  examPattern: ExamPattern | null;
  examCutoff: ExamCutoff | null;
  careerGoalIds: number[];
}

/** Included on GET /admin/exams (full list and paginated responses). */
export interface AdminListPagination {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
}

export type ExamsAdminListPayload = {
  exams: Exam[];
  pagination: AdminListPagination;
};

/**
 * Get exams for admin. Omit params for the full list (dropdowns). Pass page/perPage for server-side pagination.
 */
export async function getAllExamsAdmin(
  params?: { page?: number; perPage?: number; q?: string }
): Promise<ApiResponse<ExamsAdminListPayload>> {
  const searchParams = new URLSearchParams();
  if (params?.page != null) searchParams.set('page', String(params.page));
  if (params?.perPage != null) searchParams.set('perPage', String(params.perPage));
  if (params?.q != null && params.q.trim() !== '') searchParams.set('q', params.q.trim());
  const qs = searchParams.toString();
  return apiRequest(`${API_ENDPOINTS.ADMIN.EXAMS}${qs ? `?${qs}` : ''}`, {
    method: 'GET',
  });
}

/**
 * Get exam by ID (includes all related data)
 */
export async function getExamById(id: number): Promise<ApiResponse<{
  exam: Exam;
  examDates: ExamDates | null;
  eligibilityCriteria: ExamEligibilityCriteria | null;
  examPattern: ExamPattern | null;
  examCutoff: ExamCutoff | null;
  careerGoalIds: number[];
  programIds: number[];
}>> {
  return apiRequest(`${API_ENDPOINTS.ADMIN.EXAMS}/${id}`, {
    method: 'GET',
  });
}

/**
 * Upload exam logo to S3
 */
export async function uploadExamLogo(file: File): Promise<ApiResponse<{
  logoUrl: string;
}>> {
  const formData = new FormData();
  formData.append('image', file);

  const adminToken = localStorage.getItem('admin_token');
  if (!adminToken) {
    throw new Error('Admin token not found');
  }

  const API_BASE_URL = getApiBaseUrl();
  const apiUrl = `${API_BASE_URL}${API_ENDPOINTS.ADMIN.EXAMS}/upload-logo`;
  
  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${adminToken}`,
    },
    body: formData,
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || `Failed to upload logo (${response.status})`);
  }
  return data;
}

/**
 * Create new exam
 */
export async function createExam(data: {
  name: string;
  code?: string | null;
  description?: string;
  exam_logo?: string | null;
  exam_type?: 'National' | 'State' | 'Institute' | null;
  conducting_authority?: string | null;
  documents_required?: string | null;
  counselling?: string | null;
  number_of_papers?: number;
  website?: string | null;
  examDates?: Partial<ExamDates>;
  eligibilityCriteria?: Partial<ExamEligibilityCriteria>;
  examPattern?: Partial<ExamPattern>;
  examCutoff?: Partial<ExamCutoff>;
  careerGoalIds?: number[];
  programIds?: number[];
}): Promise<ApiResponse<{
  exam: Exam;
  examDates: ExamDates | null;
  eligibilityCriteria: ExamEligibilityCriteria | null;
  examPattern: ExamPattern | null;
  examCutoff: ExamCutoff | null;
  careerGoalIds: number[];
}>> {
  return apiRequest(API_ENDPOINTS.ADMIN.EXAMS, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Update exam
 */
export async function updateExam(
  id: number,
  data: {
    name?: string;
    code?: string | null;
    description?: string;
    exam_logo?: string | null;
    exam_type?: 'National' | 'State' | 'Institute' | null;
    conducting_authority?: string | null;
    documents_required?: string | null;
    counselling?: string | null;
    number_of_papers?: number;
    website?: string | null;
    examDates?: Partial<ExamDates>;
    eligibilityCriteria?: Partial<ExamEligibilityCriteria>;
    examPattern?: Partial<ExamPattern>;
    examCutoff?: Partial<ExamCutoff>;
    careerGoalIds?: number[];
    programIds?: number[];
  }
): Promise<ApiResponse<{
  exam: Exam;
  examDates: ExamDates | null;
  eligibilityCriteria: ExamEligibilityCriteria | null;
  examPattern: ExamPattern | null;
  examCutoff: ExamCutoff | null;
}>> {
  return apiRequest(`${API_ENDPOINTS.ADMIN.EXAMS}/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

/**
 * Delete exam
 */
export async function deleteExam(id: number): Promise<ApiResponse<null>> {
  return apiRequest(`${API_ENDPOINTS.ADMIN.EXAMS}/${id}`, {
    method: 'DELETE',
  });
}

/**
 * Delete all exams (Super Admin only)
 */
export async function deleteAllExams(): Promise<ApiResponse<{ message: string }>> {
  return apiRequest(`${API_ENDPOINTS.ADMIN.EXAMS}/all`, { method: 'DELETE' });
}

export interface BulkUploadResult {
  created: number;
  createdExams: { id: number; name: string; code: string }[];
  errors: number;
  errorDetails: { row: number; message: string }[];
}

/**
 * Download Excel template for bulk exam upload
 */
export async function downloadBulkTemplate(): Promise<void> {
  const adminToken = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
  const base = getApiBaseUrl();
  const url = `${base}${API_ENDPOINTS.ADMIN.EXAMS}/bulk-upload-template`;
  const res = await fetch(url, {
    method: 'GET',
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  if (!res.ok) throw new Error('Failed to download template');
  const blob = await res.blob();
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'exams-bulk-template.xlsx';
  a.click();
  URL.revokeObjectURL(a.href);
}

/**
 * Download all exams data as Excel (Super Admin only)
 */
export async function downloadAllDataExcel(): Promise<void> {
  const adminToken = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
  const base = getApiBaseUrl();
  const url = `${base}${API_ENDPOINTS.ADMIN.EXAMS}/download-excel`;
  const res = await fetch(url, {
    method: 'GET',
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  if (!res.ok) throw new Error('Failed to download Excel');
  const blob = await res.blob();
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'exams-all-data.xlsx';
  a.click();
  URL.revokeObjectURL(a.href);
}

export interface UploadMissingLogosResult {
  updated: { id: number; name: string; code: string; logo_file_name?: string }[];
  skipped: string[];
  errors: { file: string; message: string }[];
  summary: { logosAdded: number; filesSkipped: number; uploadErrors: number };
}

/**
 * Upload missing logos from a ZIP file.
 * Matches files by logo_file_name; updates exams where exam_logo is null.
 */
export async function uploadMissingLogos(logosZipFile: File): Promise<ApiResponse<UploadMissingLogosResult>> {
  const formData = new FormData();
  formData.append('logos_zip', logosZipFile);

  const adminToken = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
  const base = getApiBaseUrl();
  const url = `${base}${API_ENDPOINTS.ADMIN.EXAMS}/upload-missing-logos`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: formData,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to upload missing logos');
  return data;
}

/**
 * Bulk create exams from Excel; optional logos as multiple files or one ZIP of images.
 * Match Excel logo_filename column to image file names (or names inside the ZIP).
 */
export async function bulkUploadExams(
  excelFile: File,
  logoFiles: File[] = [],
  logosZipFile: File | null = null
): Promise<ApiResponse<BulkUploadResult>> {
  const formData = new FormData();
  formData.append('excel', excelFile);
  if (logosZipFile) {
    formData.append('logos_zip', logosZipFile);
  } else {
    logoFiles.forEach((file) => formData.append('logos', file));
  }

  const adminToken = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
  const base = getApiBaseUrl();
  const url = `${base}${API_ENDPOINTS.ADMIN.EXAMS}/bulk-upload`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: formData,
  });
  const data = await res.json();
  if (!res.ok) {
    const err = new Error(data.message || 'Bulk upload failed') as Error & { data?: BulkUploadResult };
    if (data.data) err.data = data.data;
    throw err;
  }
  return data;
}

/**
 * Get exam generation prompt (for mock question generation)
 */
export async function getExamPrompt(id: number): Promise<ApiResponse<{
  prompt: string;
  hasCustomPrompt: boolean;
}>> {
  return apiRequest(`${API_ENDPOINTS.ADMIN.EXAMS}/${id}/prompt`, {
    method: 'GET',
  });
}

/**
 * Update exam generation prompt
 */
export async function updateExamPrompt(
  id: number,
  prompt: string
): Promise<ApiResponse<{ exam: Exam; prompt: string }>> {
  return apiRequest(`${API_ENDPOINTS.ADMIN.EXAMS}/${id}/prompt`, {
    method: 'PUT',
    body: JSON.stringify({ prompt }),
  });
}






