import { apiRequest, getApiBaseUrl, postAdminMultipartForm } from '../../client';
import { API_ENDPOINTS } from '../../constants';
import { ApiResponse } from '../../types';

const BASE = API_ENDPOINTS.ADMIN.COACHING_EXAMS_MAPPINGS;

export interface CoachingExamsMappingRow {
  id: number;
  institute_cityname: string;
  exam_names: string | null;
  specialization_exam_names: string | null;
}

export async function getAllCoachingExamsMappings(): Promise<ApiResponse<{ mappings: CoachingExamsMappingRow[] }>> {
  return apiRequest(BASE, { method: 'GET' });
}

export async function downloadCoachingExamsMappingTemplate(): Promise<void> {
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
  a.download = 'coaching-exams-mapping-template.xlsx';
  a.click();
  URL.revokeObjectURL(a.href);
}

export async function downloadCoachingExamsMappingsExcel(): Promise<void> {
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
  a.download = 'coaching-exams-mapping.xlsx';
  a.click();
  URL.revokeObjectURL(a.href);
}

export async function bulkUploadCoachingExamsMappings(
  file: File
): Promise<
  ApiResponse<{
    upserted: number;
    rows: {
      id: number;
      institute_cityname: string;
      examCount: number;
      specializationExamCount: number;
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
      institute_cityname: string;
      examCount: number;
      specializationExamCount: number;
    }[];
    errors: number;
    errorDetails: { row: number; message: string }[];
  }>(`${BASE}/bulk-upload`, formData);
}

export async function deleteCoachingExamsMapping(id: number): Promise<ApiResponse<Record<string, never>>> {
  return apiRequest(`${BASE}/${id}`, { method: 'DELETE' });
}

export async function deleteAllCoachingExamsMappings(): Promise<ApiResponse<{ deletedLinks: number }>> {
  return apiRequest<{ deletedLinks: number }>(`${BASE}/all`, { method: 'DELETE' });
}
