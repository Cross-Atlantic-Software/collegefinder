import { apiRequest } from '../../client';
import { API_ENDPOINTS } from '../../constants';
import { ApiResponse } from '../../types';

export interface CareerGoal {
  id: number;
  label: string;
  logo: string; // Changed from image to logo
  description?: string | null;
  status?: boolean;
  created_at: string;
  updated_at: string;
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
  logo: string; // Changed from image to logo
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
 */
export async function uploadCareerGoalLogo(file: File): Promise<ApiResponse<{
  logoUrl: string;
}>> {
  const formData = new FormData();
  formData.append('image', file);

  const adminToken = localStorage.getItem('admin_token');
  if (!adminToken) {
    throw new Error('Admin token not found');
  }

  // Use the same API_BASE_URL pattern as apiRequest in client.ts
  // This ensures consistency and prevents double /api/api
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';
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
  return data;
}

/**
 * Update career goal
 */
export async function updateCareerGoal(
  id: number,
  data: {
    label?: string;
    logo?: string; // Changed from image to logo
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
  const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';
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

