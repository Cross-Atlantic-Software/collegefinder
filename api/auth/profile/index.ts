/**
 * Authentication API - User Profile endpoints
 */

import { apiRequest } from '../../client';
import type {
  ApiResponse,
  User,
} from '../../types';

import { API_ENDPOINTS } from '../../constants';

/**
 * Get current authenticated user
 */
export async function getCurrentUser(): Promise<ApiResponse<{ user: User }>> {
  return apiRequest<{ user: User }>(API_ENDPOINTS.AUTH.ME, {
    method: 'GET',
  });
}

/**
 * Update user profile (name)
 * Note: User is identified from authentication token
 */
export async function updateProfile(
  name: string
): Promise<ApiResponse<{ user: User }>> {
  return apiRequest<{ user: User }>(API_ENDPOINTS.AUTH.PROFILE, {
    method: 'PUT',
    body: JSON.stringify({ name }),
  });
}

/**
 * Get user basic info
 */
export async function getBasicInfo(): Promise<ApiResponse<{
  id: number;
  email: string;
  name: string | null;
  first_name: string | null;
  last_name: string | null;
  date_of_birth: string | null;
  gender: string | null;
  phone_number: string | null;
  state: string | null;
  district: string | null;
  profile_photo: string | null;
  email_verified: boolean;
  latitude: number | null;
  longitude: number | null;
}>> {
  return apiRequest(API_ENDPOINTS.AUTH.PROFILE_BASIC, {
    method: 'GET',
  });
}

/**
 * Update user basic info
 */
export async function updateBasicInfo(data: {
  name?: string;
  first_name?: string;
  last_name?: string;
  date_of_birth?: string;
  gender?: string;
  state?: string;
  district?: string;
  phone_number?: string;
  latitude?: number;
  longitude?: number;
}): Promise<ApiResponse<{
  id: number;
  email: string;
  name: string | null;
  first_name: string | null;
  last_name: string | null;
  date_of_birth: string | null;
  gender: string | null;
  state: string | null;
  district: string | null;
  phone_number: string | null;
  latitude: number | null;
  longitude: number | null;
}>> {
  return apiRequest(API_ENDPOINTS.AUTH.PROFILE_BASIC, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

/**
 * Get user academics
 */
export async function getAcademics(): Promise<ApiResponse<{
  // Matric (10th) fields
  matric_board: string | null;
  matric_school_name: string | null;
  matric_passing_year: number | null;
  matric_roll_number: string | null;
  matric_total_marks: number | null;
  matric_obtained_marks: number | null;
  matric_percentage: number | null;
  matric_subjects: Array<{ name: string; percent: number; obtainedMarks?: number; totalMarks?: number }>;
  // Post-Matric (12th) fields
  postmatric_board: string | null;
  postmatric_school_name: string | null;
  postmatric_passing_year: number | null;
  postmatric_roll_number: string | null;
  postmatric_total_marks: number | null;
  postmatric_obtained_marks: number | null;
  postmatric_percentage: number | null;
  stream: string | null;
  subjects: Array<{ name: string; percent: number; obtainedMarks?: number; totalMarks?: number }>;
  is_pursuing_12th: boolean;
} | null>> {
  return apiRequest(API_ENDPOINTS.AUTH.PROFILE_ACADEMICS, {
    method: 'GET',
  });
}

/**
 * Update user academics
 */
export async function updateAcademics(data: {
  // Matric (10th) fields
  matric_board?: string;
  matric_school_name?: string;
  matric_passing_year?: number;
  matric_roll_number?: string;
  matric_total_marks?: number;
  matric_obtained_marks?: number;
  matric_percentage?: number;
  // Post-Matric (12th) fields
  postmatric_board?: string;
  postmatric_school_name?: string;
  postmatric_passing_year?: number;
  postmatric_roll_number?: string;
  postmatric_total_marks?: number;
  postmatric_obtained_marks?: number;
  postmatric_percentage?: number;
  stream?: string;
  subjects?: Array<{ name: string; percent: number; obtainedMarks?: number; totalMarks?: number }>;
  is_pursuing_12th?: boolean;
}): Promise<ApiResponse<{
  // Matric (10th) fields
  matric_board: string | null;
  matric_school_name: string | null;
  matric_passing_year: number | null;
  matric_roll_number: string | null;
  matric_total_marks: number | null;
  matric_obtained_marks: number | null;
  matric_percentage: number | null;
  // Post-Matric (12th) fields
  postmatric_board: string | null;
  postmatric_school_name: string | null;
  postmatric_passing_year: number | null;
  postmatric_roll_number: string | null;
  postmatric_total_marks: number | null;
  postmatric_obtained_marks: number | null;
  postmatric_percentage: number | null;
  stream: string | null;
  subjects: Array<{ name: string; percent: number; obtainedMarks?: number; totalMarks?: number }>;
  is_pursuing_12th: boolean;
}>> {
  return apiRequest(API_ENDPOINTS.AUTH.PROFILE_ACADEMICS, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

/**
 * Get user career goals
 */
export async function getCareerGoals(): Promise<ApiResponse<{
  interests: string[];
} | null>> {
  return apiRequest(API_ENDPOINTS.AUTH.PROFILE_CAREER_GOALS, {
    method: 'GET',
  });
}

/**
 * Update user career goals
 */
export async function updateCareerGoals(data: {
  interests?: string[];
}): Promise<ApiResponse<{
  interests: string[];
}>> {
  return apiRequest(API_ENDPOINTS.AUTH.PROFILE_CAREER_GOALS, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

/**
 * Get profile completion percentage
 */
export async function getProfileCompletion(): Promise<ApiResponse<{
  percentage: number;
  completedFields: number;
  totalFields: number;
  missingFields: Array<{ section: string; field: string }>;
}>> {
  return apiRequest(API_ENDPOINTS.AUTH.PROFILE_COMPLETION, {
    method: 'GET',
  });
}

/**
 * Upload profile photo
 */
export async function uploadProfilePhoto(
  file: File
): Promise<ApiResponse<{ profile_photo: string }>> {
  const formData = new FormData();
  formData.append('photo', file);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';
  const url = `${apiUrl}/auth/profile/upload-photo`;
  
  const token = localStorage.getItem('auth_token');
  if (!token) {
    throw new Error('No authentication token found');
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || 'Failed to upload profile photo');
  }

  return data;
}

/**
 * Delete profile photo
 */
export async function deleteProfilePhoto(): Promise<ApiResponse<{ profile_photo: null }>> {
  return apiRequest<{ profile_photo: null }>(API_ENDPOINTS.AUTH.PROFILE_UPLOAD_PHOTO, {
    method: 'DELETE',
  });
}

