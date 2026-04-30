import { apiRequest, getApiBaseUrl } from '../../client';
import { API_ENDPOINTS } from '../../constants';
import { ApiResponse } from '../../types';

const BASE = API_ENDPOINTS.ADMIN.RECOMMENDED_MAPPINGS;

export interface StreamInterestRecommendedMapping {
  id: number;
  stream_id: number;
  interest_id: number;
  program_ids: number[];
  exam_ids: number[];
  stream_name: string;
  interest_label: string;
  program_names: string | null;
  exam_names: string | null;
  created_at: string;
  updated_at: string;
}

export async function getAllRecommendedMappings(): Promise<ApiResponse<{
  mappings: StreamInterestRecommendedMapping[];
}>> {
  return apiRequest(BASE, { method: 'GET' });
}

export async function downloadRecommendedMappingTemplate(): Promise<void> {
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
  a.download = 'recommended-exams-mapping-template.xlsx';
  a.click();
  URL.revokeObjectURL(a.href);
}

export async function bulkUploadRecommendedMappings(
  file: File
): Promise<ApiResponse<{
  upserted: number;
  rows: {
    id: number;
    stream: string;
    interest: string;
    programCount: number;
    examCount: number;
  }[];
  errors: number;
  errorDetails: { row: number; message: string }[];
}>> {
  const formData = new FormData();
  formData.append('excel', file);

  const adminToken = localStorage.getItem('admin_token');
  if (!adminToken) throw new Error('Admin token not found');

  const base = getApiBaseUrl();
  const url = `${base}${BASE}/bulk-upload`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: formData,
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.message || `Failed to upload (${response.status})`);
  return data;
}
