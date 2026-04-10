import { apiRequest, getApiBaseUrl } from '../../client';
import type { ApiResponse } from '../../types';
import { API_ENDPOINTS } from '../../constants';
import type { StrengthResultData } from '../../strength';

export interface StudentSearchResult {
  student: {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    class_info: string | null;
    school: string | null;
    age: number | null;
    profile_photo: string | null;
  };
  payment_status: string;
  has_existing_results: boolean;
  existing_results: StrengthResultData | null;
}

export async function searchStudent(userId: number): Promise<ApiResponse<StudentSearchResult>> {
  return apiRequest(`${API_ENDPOINTS.ADMIN.COUNSELLOR_SEARCH}/${userId}`, { method: 'GET' });
}

export async function submitCounsellorResults(data: FormData): Promise<ApiResponse<{ result: StrengthResultData }>> {
  return apiRequest(API_ENDPOINTS.ADMIN.COUNSELLOR_RESULTS, {
    method: 'POST',
    body: data,
  });
}

export async function getCounsellorResults(userId: number): Promise<ApiResponse<{ results: StrengthResultData | null }>> {
  return apiRequest(`${API_ENDPOINTS.ADMIN.COUNSELLOR_RESULTS}/${userId}`, { method: 'GET' });
}

export async function updateCounsellorResults(userId: number, data: FormData): Promise<ApiResponse<{ result: StrengthResultData }>> {
  return apiRequest(`${API_ENDPOINTS.ADMIN.COUNSELLOR_RESULTS}/${userId}`, {
    method: 'PUT',
    body: data,
  });
}

/** Download bulk upload template (Excel) */
export async function downloadCounsellorBulkTemplate(): Promise<void> {
  const adminToken = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
  const base = getApiBaseUrl();
  const url = `${base}${API_ENDPOINTS.ADMIN.COUNSELLOR}/bulk-upload-template`;
  const res = await fetch(url, {
    method: 'GET',
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  if (!res.ok) throw new Error('Failed to download template');
  const blob = await res.blob();
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'strength-results-bulk-template.xlsx';
  a.click();
  URL.revokeObjectURL(a.href);
}

/** Download all strength results as Excel */
export async function downloadAllCounsellorExcel(): Promise<void> {
  const adminToken = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
  const base = getApiBaseUrl();
  const url = `${base}${API_ENDPOINTS.ADMIN.COUNSELLOR}/download-excel`;
  const res = await fetch(url, {
    method: 'GET',
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  if (!res.ok) throw new Error('Failed to download Excel');
  const blob = await res.blob();
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'strength-results-all-data.xlsx';
  a.click();
  URL.revokeObjectURL(a.href);
}

export interface CounsellorBulkUploadResult {
  created: number;
  createdResults: { id: number; user_id: number; student_name: string }[];
  errors: number;
  errorDetails: { row: number; message: string }[];
  reportsAdded?: number;
}

/** Bulk upload strength results from Excel; optionally attach report PDFs from a ZIP (filenames match report_file_name in Excel). */
export async function bulkUploadCounsellorResults(
  excelFile: File,
  reportsZip?: File | null
): Promise<ApiResponse<CounsellorBulkUploadResult>> {
  const formData = new FormData();
  formData.append('excel', excelFile);
  if (reportsZip) formData.append('reports_zip', reportsZip);
  return apiRequest(`${API_ENDPOINTS.ADMIN.COUNSELLOR}/bulk-upload`, {
    method: 'POST',
    body: formData,
  });
}

export interface UploadReportPdfsResult {
  summary: { reportsAdded: number; filesSkipped: number; uploadErrors: number };
  updated: { user_id: number; report_file_name: string }[];
  skipped: string[];
  errors: { file: string; message: string }[];
}

/** Upload a ZIP of report PDFs; filenames must match report_file_name on strength results. */
export async function uploadCounsellorReportPdfs(zipFile: File): Promise<ApiResponse<UploadReportPdfsResult>> {
  const formData = new FormData();
  formData.append('reports_zip', zipFile);
  return apiRequest(`${API_ENDPOINTS.ADMIN.COUNSELLOR}/upload-report-pdfs`, {
    method: 'POST',
    body: formData,
  });
}
