import { apiRequest } from '../../client';
import { API_ENDPOINTS } from '../../constants';
import { ApiResponse } from '../../types';

export interface CollegeLocation {
  id: number;
  college_id: number;
  college_name?: string;
  state: string;
  city: string;
  google_map_url: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Get all college locations (for admin)
 */
export async function getAllCollegeLocations(): Promise<ApiResponse<{
  locations: CollegeLocation[];
}>> {
  return apiRequest(API_ENDPOINTS.ADMIN.COLLEGE_LOCATIONS, {
    method: 'GET',
  });
}

/**
 * Get location by ID
 */
export async function getCollegeLocationById(id: number): Promise<ApiResponse<{
  location: CollegeLocation;
}>> {
  return apiRequest(`${API_ENDPOINTS.ADMIN.COLLEGE_LOCATIONS}/${id}`, {
    method: 'GET',
  });
}

/**
 * Create new location
 */
export async function createCollegeLocation(data: {
  college_id: number;
  state: string;
  city: string;
  google_map_url?: string | null;
}): Promise<ApiResponse<{
  location: CollegeLocation;
}>> {
  return apiRequest(API_ENDPOINTS.ADMIN.COLLEGE_LOCATIONS, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Update location
 */
export async function updateCollegeLocation(
  id: number,
  data: {
    college_id?: number;
    state?: string;
    city?: string;
    google_map_url?: string | null;
  }
): Promise<ApiResponse<{
  location: CollegeLocation;
}>> {
  return apiRequest(`${API_ENDPOINTS.ADMIN.COLLEGE_LOCATIONS}/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

/**
 * Delete location
 */
export async function deleteCollegeLocation(id: number): Promise<ApiResponse<null>> {
  return apiRequest(`${API_ENDPOINTS.ADMIN.COLLEGE_LOCATIONS}/${id}`, {
    method: 'DELETE',
  });
}

