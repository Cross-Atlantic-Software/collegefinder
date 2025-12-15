import { apiRequest } from '../../client';
import { API_ENDPOINTS } from '../../constants';
import { ApiResponse } from '../../types';

export interface College {
  id: number;
  name: string;
  ranking: number | null;
  description: string | null;
  logo_url: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Get all colleges (for admin)
 */
export async function getAllColleges(): Promise<ApiResponse<{
  colleges: College[];
}>> {
  return apiRequest(API_ENDPOINTS.ADMIN.COLLEGES, {
    method: 'GET',
  });
}

/**
 * Get college by ID
 */
export async function getCollegeById(id: number): Promise<ApiResponse<{
  college: College;
}>> {
  return apiRequest(`${API_ENDPOINTS.ADMIN.COLLEGES}/${id}`, {
    method: 'GET',
  });
}

/**
 * Create new college
 */
export async function createCollege(data: {
  name: string;
  ranking?: number | null;
  description?: string | null;
  logo_url?: string | null;
  logo?: File;
}): Promise<ApiResponse<{
  college: College;
}>> {
  const formData = new FormData();
  
  formData.append('name', data.name);
  if (data.ranking !== undefined && data.ranking !== null) {
    formData.append('ranking', data.ranking.toString());
  }
  if (data.description) {
    formData.append('description', data.description);
  }
  if (data.logo_url) {
    formData.append('logo_url', data.logo_url);
  }
  if (data.logo) {
    formData.append('logo', data.logo);
  }

  return apiRequest(API_ENDPOINTS.ADMIN.COLLEGES, {
    method: 'POST',
    body: formData,
  });
}

/**
 * Update college
 */
export async function updateCollege(
  id: number,
  data: {
    name?: string;
    ranking?: number | null;
    description?: string | null;
    logo_url?: string | null;
    logo?: File;
  }
): Promise<ApiResponse<{
  college: College;
}>> {
  const formData = new FormData();
  
  if (data.name !== undefined) {
    formData.append('name', data.name);
  }
  if (data.ranking !== undefined) {
    formData.append('ranking', data.ranking !== null ? data.ranking.toString() : '');
  }
  if (data.description !== undefined) {
    formData.append('description', data.description || '');
  }
  if (data.logo_url !== undefined) {
    formData.append('logo_url', data.logo_url || '');
  }
  if (data.logo) {
    formData.append('logo', data.logo);
  }

  return apiRequest(`${API_ENDPOINTS.ADMIN.COLLEGES}/${id}`, {
    method: 'PUT',
    body: formData,
  });
}

/**
 * Delete college
 */
export async function deleteCollege(id: number): Promise<ApiResponse<null>> {
  return apiRequest(`${API_ENDPOINTS.ADMIN.COLLEGES}/${id}`, {
    method: 'DELETE',
  });
}

