import { apiRequest } from '../../client';
import { API_ENDPOINTS } from '../../constants';
import { ApiResponse } from '../../types';

export interface Scholarship {
  id: number;
  scholarship_name: string;
  conducting_authority: string | null;
  scholarship_type: string | null;
  description: string | null;
  stream_id: number | null;
  income_limit: string | null;
  minimum_marks_required: string | null;
  scholarship_amount: string | null;
  selection_process: string | null;
  application_start_date: string | null;
  application_end_date: string | null;
  mode: string | null;
  official_website: string | null;
  created_at: string;
  updated_at: string;
}

export interface ScholarshipEligibleCategory {
  id: number;
  scholarship_id: number;
  category: string | null;
  created_at?: string;
}

export interface ScholarshipApplicableState {
  id: number;
  scholarship_id: number;
  state_name: string | null;
  created_at?: string;
}

export interface ScholarshipDocumentRequired {
  id: number;
  scholarship_id: number;
  document_name: string | null;
  created_at?: string;
}

export async function getAllScholarshipsAdmin(): Promise<ApiResponse<{ scholarships: Scholarship[] }>> {
  return apiRequest(API_ENDPOINTS.ADMIN.SCHOLARSHIPS, { method: 'GET' });
}

export async function getScholarshipById(id: number): Promise<ApiResponse<{
  scholarship: Scholarship;
  streamName?: string | null;
  eligibleCategories: ScholarshipEligibleCategory[];
  applicableStates: ScholarshipApplicableState[];
  documentsRequired: ScholarshipDocumentRequired[];
  examIds: number[];
  examNames?: string[];
  collegeIds: number[];
  collegeNames?: string[];
}>> {
  return apiRequest(`${API_ENDPOINTS.ADMIN.SCHOLARSHIPS}/${id}`, { method: 'GET' });
}

export async function createScholarship(data: {
  scholarship_name: string;
  conducting_authority?: string | null;
  scholarship_type?: string | null;
  description?: string | null;
  stream_id?: number | null;
  income_limit?: string | null;
  minimum_marks_required?: string | null;
  scholarship_amount?: string | null;
  selection_process?: string | null;
  application_start_date?: string | null;
  application_end_date?: string | null;
  mode?: string | null;
  official_website?: string | null;
  eligibleCategories?: { category?: string }[];
  applicableStates?: { state_name?: string }[];
  documentsRequired?: { document_name?: string }[];
  examIds?: number[];
  collegeIds?: number[];
}): Promise<ApiResponse<{ scholarship: Scholarship }>> {
  return apiRequest(API_ENDPOINTS.ADMIN.SCHOLARSHIPS, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateScholarship(
  id: number,
  data: {
    scholarship_name?: string;
    conducting_authority?: string | null;
    scholarship_type?: string | null;
    description?: string | null;
    stream_id?: number | null;
    income_limit?: string | null;
    minimum_marks_required?: string | null;
    scholarship_amount?: string | null;
    selection_process?: string | null;
    application_start_date?: string | null;
    application_end_date?: string | null;
    mode?: string | null;
    official_website?: string | null;
    eligibleCategories?: { category?: string }[];
    applicableStates?: { state_name?: string }[];
    documentsRequired?: { document_name?: string }[];
    examIds?: number[];
    collegeIds?: number[];
  }
): Promise<ApiResponse<{ scholarship: Scholarship }>> {
  return apiRequest(`${API_ENDPOINTS.ADMIN.SCHOLARSHIPS}/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteScholarship(id: number): Promise<ApiResponse<null>> {
  return apiRequest(`${API_ENDPOINTS.ADMIN.SCHOLARSHIPS}/${id}`, { method: 'DELETE' });
}

export async function deleteAllScholarships(): Promise<ApiResponse<{ message: string }>> {
  return apiRequest(`${API_ENDPOINTS.ADMIN.SCHOLARSHIPS}/all`, { method: 'DELETE' });
}

export interface ScholarshipsBulkUploadResult {
  created: number;
  createdScholarships: { id: number; name: string }[];
  errors: number;
  errorDetails: { row: number; message: string }[];
}

export async function downloadScholarshipsBulkTemplate(): Promise<void> {
  const adminToken = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
  const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';
  const url = `${base}${API_ENDPOINTS.ADMIN.SCHOLARSHIPS}/bulk-upload-template`;
  const res = await fetch(url, {
    method: 'GET',
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  if (!res.ok) throw new Error('Failed to download template');
  const blob = await res.blob();
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'scholarships-bulk-template.xlsx';
  a.click();
  URL.revokeObjectURL(a.href);
}

/** Download all scholarships data as Excel (Super Admin only) */
export async function downloadAllDataExcel(): Promise<void> {
  const adminToken = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
  const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';
  const url = `${base}${API_ENDPOINTS.ADMIN.SCHOLARSHIPS}/download-excel`;
  const res = await fetch(url, {
    method: 'GET',
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  if (!res.ok) throw new Error('Failed to download Excel');
  const blob = await res.blob();
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'scholarships-all-data.xlsx';
  a.click();
  URL.revokeObjectURL(a.href);
}

export async function bulkUploadScholarships(excelFile: File): Promise<ApiResponse<ScholarshipsBulkUploadResult>> {
  const formData = new FormData();
  formData.append('excel', excelFile);
  const adminToken = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
  const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';
  const url = `${base}${API_ENDPOINTS.ADMIN.SCHOLARSHIPS}/bulk-upload`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: formData,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Bulk upload failed');
  return data;
}
