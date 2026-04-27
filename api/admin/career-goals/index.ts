import { apiRequest, getApiBaseUrl } from '../../client';
import { API_ENDPOINTS } from '../../constants';
import { ApiResponse } from '../../types';

export interface CareerGoal {
  id: number;
  label: string;
  logo?: string | null;
  logo_filename?: string | null;
  description?: string | null;
  status?: boolean;
  stream_id?: number | null;
  stream_name?: string | null;
  created_at: string;
  updated_at: string;
  updated_by?: number | null;
  updated_by_email?: string | null;
}

export interface UploadMissingLogosResult {
  updated: { id: number; label: string; logo_filename?: string }[];
  skipped: string[];
  errors: { file: string; message: string }[];
  summary: { logosAdded: number; filesSkipped: number; uploadErrors: number };
}

/**
 * Get all career goals (for admin)
 */
export async function getAllCareerGoals(): Promise<ApiResponse<{
  careerGoals: CareerGoal[];
}>> {
  return apiRequest(API_ENDPOINTS.ADMIN.CAREER_GOALS, {
    method: 'GET',
  });
}

/**
 * Get career goal by ID
 */
export async function getCareerGoalById(id: number): Promise<ApiResponse<{
  careerGoal: CareerGoal;
}>> {
  return apiRequest(`${API_ENDPOINTS.ADMIN.CAREER_GOALS}/${id}`, {
    method: 'GET',
  });
}

/**
 * Create new career goal
 */
export async function createCareerGoal(data: {
  label: string;
  stream_id?: number | null;
  logo?: string | null;
  logo_filename?: string | null;
  description?: string | null;
  status?: boolean;
}): Promise<ApiResponse<{
  careerGoal: CareerGoal;
}>> {
  return apiRequest(API_ENDPOINTS.ADMIN.CAREER_GOALS, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Upload logo to S3
 * Returns logoUrl and logoFilename (use logoFilename when creating/updating for later "upload missing logos" matching)
 */
export async function uploadCareerGoalLogo(file: File): Promise<ApiResponse<{
  logoUrl: string;
  logoFilename?: string;
}>> {
  const formData = new FormData();
  formData.append('image', file);

  const adminToken = localStorage.getItem('admin_token');
  if (!adminToken) {
    throw new Error('Admin token not found');
  }

  // Use the same API_BASE_URL pattern as apiRequest in client.ts
  // This ensures consistency and prevents double /api/api
  const API_BASE_URL = getApiBaseUrl();
  const apiUrl = `${API_BASE_URL}${API_ENDPOINTS.ADMIN.CAREER_GOALS}/upload-image`;
  
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
  // Map imageUrl to logoUrl for consistency
  if (data.data && data.data.imageUrl) {
    data.data.logoUrl = data.data.imageUrl;
    delete data.data.imageUrl;
  }
  // Map logoFilename from backend
  if (data.data && !data.data.logoFilename && file?.name) {
    data.data.logoFilename = file.name;
  }
  return data;
}

/**
 * Update career goal
 */
export async function updateCareerGoal(
  id: number,
  data: {
    label?: string;
    stream_id?: number;
    logo?: string;
    logo_filename?: string | null;
    description?: string | null;
    status?: boolean;
  }
): Promise<ApiResponse<{
  careerGoal: CareerGoal;
}>> {
  return apiRequest(`${API_ENDPOINTS.ADMIN.CAREER_GOALS}/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

/**
 * Delete career goal
 */
export async function deleteCareerGoal(id: number): Promise<ApiResponse<null>> {
  return apiRequest(`${API_ENDPOINTS.ADMIN.CAREER_GOALS}/${id}`, {
    method: 'DELETE',
  });
}

/**
 * Download all interests as Excel (Super Admin only)
 */
export async function downloadAllDataExcel(): Promise<void> {
  const adminToken = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
  const base = getApiBaseUrl();
  const url = `${base}${API_ENDPOINTS.ADMIN.CAREER_GOALS}/download-excel`;
  const res = await fetch(url, {
    method: 'GET',
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  if (!res.ok) throw new Error('Failed to download Excel');
  const blob = await res.blob();
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'interests-all-data.xlsx';
  a.click();
  URL.revokeObjectURL(a.href);
}

/**
 * Delete all interests (Super Admin only)
 */
export async function deleteAllCareerGoals(): Promise<ApiResponse<{ message: string }>> {
  return apiRequest(`${API_ENDPOINTS.ADMIN.CAREER_GOALS}/all`, {
    method: 'DELETE',
  });
}

/**
 * Download interests bulk upload template
 */
export async function downloadCareerGoalsBulkTemplate(): Promise<void> {
  const adminToken = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
  const base = getApiBaseUrl();
  const url = `${base}${API_ENDPOINTS.ADMIN.CAREER_GOALS}/bulk-upload-template`;
  const res = await fetch(url, {
    method: 'GET',
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  if (!res.ok) throw new Error('Failed to download template');
  const blob = await res.blob();
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'interests-bulk-template.xlsx';
  a.click();
  URL.revokeObjectURL(a.href);
}

/**
 * Bulk upload interests from Excel
 */
export async function bulkUploadCareerGoals(file: File): Promise<ApiResponse<{
  created: number;
  createdInterests: { id: number; label: string; stream: string }[];
  errors: number;
  errorDetails: { row: number; message: string }[];
}>> {
  const formData = new FormData();
  formData.append('excel', file);

  const adminToken = localStorage.getItem('admin_token');
  if (!adminToken) throw new Error('Admin token not found');

  const base = getApiBaseUrl();
  const url = `${base}${API_ENDPOINTS.ADMIN.CAREER_GOALS}/bulk-upload`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: formData,
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || `Failed to bulk upload (${response.status})`);
  return data;
}

/**
 * Upload missing logos from a ZIP file.
 * Matches files by logo_filename; updates interests where logo is null.
 */
export async function uploadMissingLogosCareerGoals(logosZipFile: File): Promise<ApiResponse<UploadMissingLogosResult>> {
  const formData = new FormData();
  formData.append('logos_zip', logosZipFile);

  const adminToken = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
  const base = getApiBaseUrl();
  const url = `${base}${API_ENDPOINTS.ADMIN.CAREER_GOALS}/upload-missing-logos`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: formData,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to upload missing logos');
  return data;
}

