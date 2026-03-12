import { apiRequest } from '../../client';
import { API_ENDPOINTS } from '../../constants';
import { ApiResponse } from '../../types';

export interface Exam {
  id: number;
  name: string;
  code: string;
  description: string | null;
  exam_logo?: string | null;
  exam_type?: 'National' | 'State' | 'Institute' | null;
  conducting_authority?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ExamDates {
  id: number;
  exam_id: number;
  application_start_date: string | null;
  application_close_date: string | null;
  exam_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface ExamEligibilityCriteria {
  id: number;
  exam_id: number;
  stream_ids: number[];
  subject_ids: number[];
  age_limit_min: number | null;
  age_limit_max: number | null;
  attempt_limit: number | null;
  created_at: string;
  updated_at: string;
}

export interface ExamPattern {
  id: number;
  exam_id: number;
  mode: 'Offline' | 'Online' | 'Hybrid' | null;
  number_of_questions: number | null;
  marking_scheme: string | null;
  duration_minutes: number | null;
  created_at: string;
  updated_at: string;
}

export interface ExamCutoff {
  id: number;
  exam_id: number;
  previous_year_cutoff: string | null;
  ranks_percentiles: string | null;
  category_wise_cutoff: string | null;
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

/**
 * Get all exams (for admin)
 */
export async function getAllExamsAdmin(): Promise<ApiResponse<{
  exams: Exam[];
}>> {
  return apiRequest(API_ENDPOINTS.ADMIN.EXAMS, {
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

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';
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
  code: string;
  description?: string;
  exam_logo?: string | null;
  exam_type?: 'National' | 'State' | 'Institute' | null;
  conducting_authority?: string | null;
  examDates?: Partial<ExamDates>;
  eligibilityCriteria?: Partial<ExamEligibilityCriteria>;
  examPattern?: Partial<ExamPattern>;
  examCutoff?: Partial<ExamCutoff>;
  careerGoalIds?: number[];
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
    code?: string;
    description?: string;
    exam_logo?: string | null;
    exam_type?: 'National' | 'State' | 'Institute' | null;
    conducting_authority?: string | null;
    examDates?: Partial<ExamDates>;
    eligibilityCriteria?: Partial<ExamEligibilityCriteria>;
    examPattern?: Partial<ExamPattern>;
    examCutoff?: Partial<ExamCutoff>;
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
  const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';
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
  const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';
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
  const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';
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
  const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';
  const url = `${base}${API_ENDPOINTS.ADMIN.EXAMS}/bulk-upload`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: formData,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Bulk upload failed');
  return data;
}






