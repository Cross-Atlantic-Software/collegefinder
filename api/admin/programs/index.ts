import { apiRequest } from '../../client';
import { API_ENDPOINTS } from '../../constants';
import { ApiResponse } from '../../types';

export interface Program {
  id: number;
  name: string;
  status: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Get all programs (for admin)
 */
export async function getAllPrograms(): Promise<ApiResponse<{
  programs: Program[];
}>> {
  return apiRequest(API_ENDPOINTS.ADMIN.PROGRAMS, {
    method: 'GET',
  });
}

/**
 * Get program by ID
 */
export async function getProgramById(id: number): Promise<ApiResponse<{
  program: Program;
}>> {
  return apiRequest(`${API_ENDPOINTS.ADMIN.PROGRAMS}/${id}`, {
    method: 'GET',
  });
}

/**
 * Create new program
 */
export async function createProgram(data: {
  name: string;
  status?: boolean;
}): Promise<ApiResponse<{
  program: Program;
}>> {
  return apiRequest(API_ENDPOINTS.ADMIN.PROGRAMS, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Update program
 */
export async function updateProgram(
  id: number,
  data: {
    name?: string;
    status?: boolean;
  }
): Promise<ApiResponse<{
  program: Program;
}>> {
  return apiRequest(`${API_ENDPOINTS.ADMIN.PROGRAMS}/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

/**
 * Delete program
 */
export async function deleteProgram(id: number): Promise<ApiResponse<null>> {
  return apiRequest(`${API_ENDPOINTS.ADMIN.PROGRAMS}/${id}`, {
    method: 'DELETE',
  });
}

/**
 * Download programs bulk upload template
 */
export async function downloadProgramsBulkTemplate(): Promise<void> {
  const adminToken = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
  const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';
  const url = `${base}${API_ENDPOINTS.ADMIN.PROGRAMS}/bulk-upload-template`;
  const res = await fetch(url, {
    method: 'GET',
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  if (!res.ok) throw new Error('Failed to download template');
  const blob = await res.blob();
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'programs-bulk-template.xlsx';
  a.click();
  URL.revokeObjectURL(a.href);
}

/**
 * Download all programs as Excel
 */
export async function downloadAllProgramsExcel(): Promise<void> {
  const adminToken = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
  const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';
  const url = `${base}${API_ENDPOINTS.ADMIN.PROGRAMS}/download-excel`;
  const res = await fetch(url, {
    method: 'GET',
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  if (!res.ok) throw new Error('Failed to download Excel');
  const blob = await res.blob();
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'programs-all-data.xlsx';
  a.click();
  URL.revokeObjectURL(a.href);
}

/**
 * Bulk upload programs from Excel
 */
export async function bulkUploadPrograms(file: File): Promise<ApiResponse<{
  created: number;
  createdPrograms: { id: number; name: string }[];
  errors: number;
  errorDetails: { row: number; message: string }[];
}>> {
  const formData = new FormData();
  formData.append('excel', file);

  const adminToken = localStorage.getItem('admin_token');
  if (!adminToken) throw new Error('Admin token not found');

  const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';
  const url = `${base}${API_ENDPOINTS.ADMIN.PROGRAMS}/bulk-upload`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: formData,
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.message || `Failed to bulk upload (${response.status})`);
  return data;
}

