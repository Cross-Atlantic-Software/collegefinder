import { apiRequest, getApiBaseUrl } from '../../client';
import { API_ENDPOINTS } from '../../constants';
import { ApiResponse } from '../../types';

// Same as client: in browser use relative /api so requests go through Next proxy; on server use env or localhost
const getApiBase = () =>
  getApiBaseUrl();

export interface Branch {
  id: number;
  name: string;
  description: string | null;
  status: boolean;
  stream_id?: number | null;
  interest_ids?: number[] | null;
  stream_name?: string | null;
  interest_labels?: string | null;
  created_at: string;
  updated_at: string;
  /** Linked taxonomy programs (admin list/detail). */
  program_ids?: number[];
  program_names?: string;
  programs?: { id: number; name: string }[];
}

export async function getAllBranches(): Promise<ApiResponse<{ branches: Branch[] }>> {
  return apiRequest(API_ENDPOINTS.ADMIN.BRANCHES, { method: 'GET' });
}

export async function getBranchById(id: number): Promise<ApiResponse<{ branch: Branch }>> {
  return apiRequest(`${API_ENDPOINTS.ADMIN.BRANCHES}/${id}`, { method: 'GET' });
}

export async function createBranch(data: {
  name: string;
  description?: string | null;
  status?: boolean;
  stream_id?: number | null;
  interest_ids?: number[];
  program_ids?: number[];
}): Promise<ApiResponse<{ branch: Branch }>> {
  return apiRequest(API_ENDPOINTS.ADMIN.BRANCHES, { method: 'POST', body: JSON.stringify(data) });
}

export async function updateBranch(
  id: number,
  data: {
    name?: string;
    description?: string | null;
    status?: boolean;
    stream_id?: number | null;
    interest_ids?: number[];
    program_ids?: number[];
  }
): Promise<ApiResponse<{ branch: Branch }>> {
  return apiRequest(`${API_ENDPOINTS.ADMIN.BRANCHES}/${id}`, { method: 'PUT', body: JSON.stringify(data) });
}

export async function deleteBranch(id: number): Promise<ApiResponse<null>> {
  return apiRequest(`${API_ENDPOINTS.ADMIN.BRANCHES}/${id}`, { method: 'DELETE' });
}

export async function downloadBranchesBulkTemplate(): Promise<void> {
  const adminToken = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
  const base = getApiBase();
  const res = await fetch(`${base}${API_ENDPOINTS.ADMIN.BRANCHES}/bulk-upload-template`, {
    method: 'GET', headers: { Authorization: `Bearer ${adminToken}` },
  });
  if (!res.ok) throw new Error('Failed to download template');
  const blob = await res.blob();
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'branches-bulk-template.xlsx';
  a.click();
  URL.revokeObjectURL(a.href);
}

export async function downloadAllBranchesExcel(): Promise<void> {
  const adminToken = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
  const base = getApiBase();
  const res = await fetch(`${base}${API_ENDPOINTS.ADMIN.BRANCHES}/download-excel`, {
    method: 'GET', headers: { Authorization: `Bearer ${adminToken}` },
  });
  if (!res.ok) throw new Error('Failed to download Excel');
  const blob = await res.blob();
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'branches-all-data.xlsx';
  a.click();
  URL.revokeObjectURL(a.href);
}

export async function bulkUploadBranches(file: File): Promise<ApiResponse<{
  created: number;
  createdBranches: { id: number; name: string }[];
  errors: number;
  errorDetails: { row: number; message: string }[];
}>> {
  const formData = new FormData();
  formData.append('excel', file);
  const adminToken = localStorage.getItem('admin_token');
  if (!adminToken) throw new Error('Admin token not found');
  const base = getApiBase();
  const response = await fetch(`${base}${API_ENDPOINTS.ADMIN.BRANCHES}/bulk-upload`, {
    method: 'POST', headers: { Authorization: `Bearer ${adminToken}` }, body: formData,
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || `Failed to bulk upload (${response.status})`);
  return data;
}
