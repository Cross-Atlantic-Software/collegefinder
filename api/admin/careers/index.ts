import { apiRequest, getApiBaseUrl } from '../../client';
import { API_ENDPOINTS } from '../../constants';
import { ApiResponse } from '../../types';

export interface Career {
  id: number;
  name: string;
  status: boolean;
  program_ids?: number[];
  created_at: string;
  updated_at: string;
}

/**
 * Get all careers (for admin)
 */
export async function getAllCareers(): Promise<ApiResponse<{
  careers: Career[];
}>> {
  return apiRequest(API_ENDPOINTS.ADMIN.CAREERS, {
    method: 'GET',
  });
}

/**
 * Get career by ID
 */
export async function getCareerById(id: number): Promise<ApiResponse<{
  career: Career;
}>> {
  return apiRequest(`${API_ENDPOINTS.ADMIN.CAREERS}/${id}`, {
    method: 'GET',
  });
}

/**
 * Create new career
 */
export async function createCareer(data: {
  name: string;
  status?: boolean;
  program_ids?: number[];
}): Promise<ApiResponse<{
  career: Career;
}>> {
  return apiRequest(API_ENDPOINTS.ADMIN.CAREERS, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Update career
 */
export async function updateCareer(
  id: number,
  data: {
    name?: string;
    status?: boolean;
    program_ids?: number[];
  }
): Promise<ApiResponse<{
  career: Career;
}>> {
  return apiRequest(`${API_ENDPOINTS.ADMIN.CAREERS}/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

/**
 * Delete career
 */
export async function deleteCareer(id: number): Promise<ApiResponse<null>> {
  return apiRequest(`${API_ENDPOINTS.ADMIN.CAREERS}/${id}`, {
    method: 'DELETE',
  });
}

/**
 * Download all careers as Excel (Super Admin only)
 */
export async function downloadAllCareersExcel(): Promise<void> {
  const adminToken = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
  const base = getApiBaseUrl();
  const url = `${base}${API_ENDPOINTS.ADMIN.CAREERS}/download-excel`;
  const res = await fetch(url, {
    method: 'GET',
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  if (!res.ok) throw new Error('Failed to download Excel');
  const blob = await res.blob();
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'careers-all-data.xlsx';
  a.click();
  URL.revokeObjectURL(a.href);
}

/**
 * Download careers bulk upload template (Excel with sample data)
 */
export async function downloadCareersBulkTemplate(): Promise<void> {
  const adminToken = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
  const base = getApiBaseUrl();
  const url = `${base}${API_ENDPOINTS.ADMIN.CAREERS}/bulk-upload-template`;
  const res = await fetch(url, {
    method: 'GET',
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  if (!res.ok) throw new Error('Failed to download template');
  const blob = await res.blob();
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'careers-bulk-template.xlsx';
  a.click();
  URL.revokeObjectURL(a.href);
}

/**
 * Bulk upload careers from Excel
 */
export async function bulkUploadCareers(file: File): Promise<ApiResponse<{
  created: number;
  createdCareers: { id: number; name: string }[];
  errors: number;
  errorDetails: { row: number; message: string }[];
}>> {
  const formData = new FormData();
  formData.append('excel', file);

  const adminToken = localStorage.getItem('admin_token');
  if (!adminToken) {
    throw new Error('Admin token not found');
  }

  const API_BASE_URL = getApiBaseUrl();
  const apiUrl = `${API_BASE_URL}${API_ENDPOINTS.ADMIN.CAREERS}/bulk-upload`;

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${adminToken}`,
    },
    body: formData,
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || `Failed to bulk upload (${response.status})`);
  }
  return data;
}

/**
 * Delete all careers (Super Admin only)
 */
export async function deleteAllCareers(): Promise<ApiResponse<{ message: string }>> {
  return apiRequest(`${API_ENDPOINTS.ADMIN.CAREERS}/all`, {
    method: 'DELETE',
  });
}

