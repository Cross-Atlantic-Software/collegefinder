import { apiRequest, getApiBaseUrl } from '../../client';
import type { ApiResponse } from '../../types';
import { API_ENDPOINTS } from '../../constants';
import type { AdmissionExpert } from '../../experts';

export async function getAllExpertsAdmin(): Promise<ApiResponse<{ experts: AdmissionExpert[]; total: number }>> {
  return apiRequest(API_ENDPOINTS.ADMIN.EXPERTS, { method: 'GET' });
}

export async function createExpert(data: FormData): Promise<ApiResponse<{ expert: AdmissionExpert }>> {
  return apiRequest(API_ENDPOINTS.ADMIN.EXPERTS, {
    method: 'POST',
    body: data,
  });
}

export async function updateExpert(id: number, data: FormData): Promise<ApiResponse<{ expert: AdmissionExpert }>> {
  return apiRequest(`${API_ENDPOINTS.ADMIN.EXPERTS}/${id}`, {
    method: 'PUT',
    body: data,
  });
}

export async function deleteExpert(id: number): Promise<ApiResponse<{ expert: AdmissionExpert }>> {
  return apiRequest(`${API_ENDPOINTS.ADMIN.EXPERTS}/${id}`, {
    method: 'DELETE',
  });
}

/** Download bulk upload template (Excel) */
export async function downloadExpertsBulkTemplate(): Promise<void> {
  const adminToken = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
  const base = getApiBaseUrl();
  const url = `${base}${API_ENDPOINTS.ADMIN.EXPERTS}/bulk-upload-template`;
  const res = await fetch(url, {
    method: 'GET',
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  if (!res.ok) throw new Error('Failed to download template');
  const blob = await res.blob();
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'experts-bulk-template.xlsx';
  a.click();
  URL.revokeObjectURL(a.href);
}

/** Download all experts as Excel */
export async function downloadAllExpertsExcel(): Promise<void> {
  const adminToken = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
  const base = getApiBaseUrl();
  const url = `${base}${API_ENDPOINTS.ADMIN.EXPERTS}/download-excel`;
  const res = await fetch(url, {
    method: 'GET',
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  if (!res.ok) throw new Error('Failed to download Excel');
  const blob = await res.blob();
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'experts-all-data.xlsx';
  a.click();
  URL.revokeObjectURL(a.href);
}

export interface ExpertsBulkUploadResult {
  created: number;
  createdExperts: { id: number; name: string }[];
  errors: number;
  errorDetails: { row: number; message: string }[];
  photosAdded?: number;
}

/** Bulk upload experts from Excel; optionally attach photos from a ZIP (filenames match photo_file_name in Excel). */
export async function bulkUploadExperts(
  excelFile: File,
  photosZip?: File | null
): Promise<ApiResponse<ExpertsBulkUploadResult>> {
  const formData = new FormData();
  formData.append('excel', excelFile);
  if (photosZip) formData.append('photos_zip', photosZip);
  return apiRequest(`${API_ENDPOINTS.ADMIN.EXPERTS}/bulk-upload`, {
    method: 'POST',
    body: formData,
  });
}

export interface UploadExpertPhotosResult {
  summary: { photosAdded: number; filesSkipped: number; uploadErrors: number };
  updated: { id: number; name: string; photo_file_name: string }[];
  skipped: string[];
  errors: { file: string; message: string }[];
}

/** Upload a ZIP of expert photos; filenames must match photo_file_name on experts. */
export async function uploadExpertPhotos(zipFile: File): Promise<ApiResponse<UploadExpertPhotosResult>> {
  const formData = new FormData();
  formData.append('photos_zip', zipFile);
  return apiRequest(`${API_ENDPOINTS.ADMIN.EXPERTS}/upload-expert-photos`, {
    method: 'POST',
    body: formData,
  });
}
