import { apiRequest } from '../../client';
import { API_ENDPOINTS } from '../../constants';
import { ApiResponse } from '../../types';

export interface CareerGoal {
  id: number;
  label: string;
  logo: string; // Changed from image to logo
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

