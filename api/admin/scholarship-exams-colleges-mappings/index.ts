import { apiRequest, getApiBaseUrl, postAdminMultipartForm } from '../../client';
import { API_ENDPOINTS } from '../../constants';
import { ApiResponse } from '../../types';

const BASE = API_ENDPOINTS.ADMIN.SCHOLARSHIP_EXAMS_COLLEGES_MAPPINGS;

export interface ScholarshipExamsCollegesMappingRow {
  id: number;
  scholarship_name: string;
  exam_names: string | null;
  college_names: string | null;
}

export async function getAllScholarshipExamsCollegesMappings(): Promise<
  ApiResponse<{ mappings: ScholarshipExamsCollegesMappingRow[] }>
> {
  return apiRequest(BASE, { method: 'GET' });
}

export async function downloadScholarshipExamsCollegesMappingTemplate(): Promise<void> {
  const adminToken = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
  const base = getApiBaseUrl();
  const url = `${base}${BASE}/bulk-upload-template`;
  const res = await fetch(url, {
    method: 'GET',
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  if (!res.ok) throw new Error('Failed to download template');
  const blob = await res.blob();
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'scholarship-exams-colleges-mapping-template.xlsx';
  a.click();
  URL.revokeObjectURL(a.href);
}

export async function downloadScholarshipExamsCollegesMappingsExcel(): Promise<void> {
  const adminToken = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
  const base = getApiBaseUrl();
  const url = `${base}${BASE}/download-excel`;
  const res = await fetch(url, {
    method: 'GET',
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  if (!res.ok) throw new Error('Failed to download mapping Excel');
  const blob = await res.blob();
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'scholarship-exams-colleges-mapping.xlsx';
  a.click();
  URL.revokeObjectURL(a.href);
}

export async function bulkUploadScholarshipExamsCollegesMappings(
  file: File
): Promise<
  ApiResponse<{
    upserted: number;
    rows: {
      id: number;
      scholarship_name: string;
      examCount: number;
      collegeCount: number;
    }[];
    errors: number;
    errorDetails: { row: number; message: string }[];
  }>
> {
  const formData = new FormData();
  formData.append('excel', file);
  return postAdminMultipartForm<{
    upserted: number;
    rows: {
      id: number;
      scholarship_name: string;
      examCount: number;
      collegeCount: number;
    }[];
    errors: number;
    errorDetails: { row: number; message: string }[];
  }>(`${BASE}/bulk-upload`, formData);
}

export async function deleteScholarshipExamsCollegesMapping(
  id: number
): Promise<ApiResponse<Record<string, never>>> {
  return apiRequest(`${BASE}/${id}`, { method: 'DELETE' });
}

export async function deleteAllScholarshipExamsCollegesMappings(): Promise<
  ApiResponse<{ deletedLinks: number }>
> {
  return apiRequest<{ deletedLinks: number }>(`${BASE}/all`, { method: 'DELETE' });
}
