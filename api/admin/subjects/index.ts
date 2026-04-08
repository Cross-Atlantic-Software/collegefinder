import { apiRequest, getApiBaseUrl } from '../../client';
import { API_ENDPOINTS } from '../../constants';
import { ApiResponse } from '../../types';

export interface Subject {
  id: number;
  name: string;
  streams: number[]; // Array of stream IDs
  status: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Get all subjects (for admin)
 */
export async function getAllSubjects(): Promise<ApiResponse<{
  subjects: Subject[];
}>> {
  return apiRequest(API_ENDPOINTS.ADMIN.SUBJECTS, {
    method: 'GET',
  });
}

/**
 * Get subject by ID
 */
export async function getSubjectById(id: number): Promise<ApiResponse<{
  subject: Subject;
}>> {
  return apiRequest(`${API_ENDPOINTS.ADMIN.SUBJECTS}/${id}`, {
    method: 'GET',
  });
}

/**
 * Create new subject
 */
export async function createSubject(data: {
  name: string;
  streams?: number[];
  status?: boolean;
}): Promise<ApiResponse<{
  subject: Subject;
}>> {
  return apiRequest(API_ENDPOINTS.ADMIN.SUBJECTS, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Update subject
 */
export async function updateSubject(
  id: number,
  data: {
    name?: string;
    streams?: number[];
    status?: boolean;
  }
): Promise<ApiResponse<{
  subject: Subject;
}>> {
  return apiRequest(`${API_ENDPOINTS.ADMIN.SUBJECTS}/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

/**
 * Delete subject
 */
export async function deleteSubject(id: number): Promise<ApiResponse<null>> {
  return apiRequest(`${API_ENDPOINTS.ADMIN.SUBJECTS}/${id}`, {
    method: 'DELETE',
  });
}

/**
 * Download subjects bulk upload template
 */
export async function downloadSubjectsBulkTemplate(): Promise<void> {
  const adminToken = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
  const base = getApiBaseUrl();
  const url = `${base}${API_ENDPOINTS.ADMIN.SUBJECTS}/bulk-upload-template`;
  const res = await fetch(url, {
    method: 'GET',
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  if (!res.ok) throw new Error('Failed to download template');
  const blob = await res.blob();
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'subjects-bulk-template.xlsx';
  a.click();
  URL.revokeObjectURL(a.href);
}

/**
 * Download all subjects as Excel
 */
export async function downloadAllSubjectsExcel(): Promise<void> {
  const adminToken = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
  const base = getApiBaseUrl();
  const url = `${base}${API_ENDPOINTS.ADMIN.SUBJECTS}/download-excel`;
  const res = await fetch(url, {
    method: 'GET',
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  if (!res.ok) throw new Error('Failed to download Excel');
  const blob = await res.blob();
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'subjects-all-data.xlsx';
  a.click();
  URL.revokeObjectURL(a.href);
}

/**
 * Bulk upload subjects from Excel
 */
export async function bulkUploadSubjects(file: File): Promise<ApiResponse<{
  created: number;
  createdSubjects: { id: number; name: string }[];
  errors: number;
  errorDetails: { row: number; message: string }[];
}>> {
  const formData = new FormData();
  formData.append('excel', file);

  const adminToken = localStorage.getItem('admin_token');
  if (!adminToken) throw new Error('Admin token not found');

  const base = getApiBaseUrl();
  const url = `${base}${API_ENDPOINTS.ADMIN.SUBJECTS}/bulk-upload`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: formData,
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.message || `Failed to bulk upload (${response.status})`);
  return data;
}


