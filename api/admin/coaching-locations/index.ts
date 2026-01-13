import { apiRequest } from '../../client';
import { API_ENDPOINTS } from '../../constants';
import { ApiResponse } from '../../types';

export interface CoachingLocation {
  id: number;
  coaching_id: number;
  coaching_name?: string;
  branch_title: string;
  address: string;
  state: string;
  city: string;
  google_map_url: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Get all coaching locations (for admin)
 */
export async function getAllCoachingLocations(): Promise<ApiResponse<{
  locations: CoachingLocation[];
}>> {
  return apiRequest(API_ENDPOINTS.ADMIN.COACHING_LOCATIONS, {
    method: 'GET',
  });
}

/**
 * Get locations by coaching ID
 */
export async function getLocationsByCoachingId(coachingId: number): Promise<ApiResponse<{
  locations: CoachingLocation[];
}>> {
  return apiRequest(`${API_ENDPOINTS.ADMIN.COACHING_LOCATIONS}/coaching/${coachingId}`, {
    method: 'GET',
  });
}

/**
 * Get coaching location by ID
 */
export async function getCoachingLocationById(id: number): Promise<ApiResponse<{
  location: CoachingLocation;
}>> {
  return apiRequest(`${API_ENDPOINTS.ADMIN.COACHING_LOCATIONS}/${id}`, {
    method: 'GET',
  });
}

/**
 * Create new coaching location
 */
export async function createCoachingLocation(data: {
  coaching_id: number;
  branch_title: string;
  address: string;
  state: string;
  city: string;
  google_map_url?: string;
}): Promise<ApiResponse<{
  location: CoachingLocation;
}>> {
  return apiRequest(API_ENDPOINTS.ADMIN.COACHING_LOCATIONS, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Update coaching location
 */
export async function updateCoachingLocation(
  id: number,
  data: {
    coaching_id?: number;
    branch_title?: string;
    address?: string;
    state?: string;
    city?: string;
    google_map_url?: string;
  }
): Promise<ApiResponse<{
  location: CoachingLocation;
}>> {
  return apiRequest(`${API_ENDPOINTS.ADMIN.COACHING_LOCATIONS}/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

/**
 * Delete coaching location
 */
export async function deleteCoachingLocation(id: number): Promise<ApiResponse<null>> {
  return apiRequest(`${API_ENDPOINTS.ADMIN.COACHING_LOCATIONS}/${id}`, {
    method: 'DELETE',
  });
}
