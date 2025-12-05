/**
 * Admin API - Site Users Management endpoints
 */

import { apiRequest } from '../../client';
import type {
  ApiResponse,
  GetAllUsersResponse,
} from '../../types';

import { API_ENDPOINTS } from '../../constants';

/**
 * Get all registered users (Admin only)
 */
export async function getAllUsers(): Promise<ApiResponse<GetAllUsersResponse>> {
  return apiRequest<GetAllUsersResponse>(API_ENDPOINTS.ADMIN.USERS, {
    method: 'GET',
  });
}

/**
 * Get all users with basic info (Admin only)
 */
export async function getAllUsersBasicInfo(): Promise<ApiResponse<GetAllUsersResponse>> {
  return apiRequest<GetAllUsersResponse>(API_ENDPOINTS.ADMIN.USERS_BASIC_INFO, {
    method: 'GET',
  });
}

/**
 * Get all users with academics (Admin only)
 */
export async function getAllUsersAcademics(): Promise<ApiResponse<{
  users: Array<{
    user: {
      id: number;
      email: string;
      name: string | null;
    };
    academics: {
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
      subjects: Array<{ name: string; percent: number }>;
    } | null;
  }>;
  total: number;
}>> {
  return apiRequest(API_ENDPOINTS.ADMIN.USERS_ACADEMICS, {
    method: 'GET',
  });
}

/**
 * Get all users with career goals (Admin only)
 */
export async function getAllUsersCareerGoals(): Promise<ApiResponse<{
  users: Array<{
    user: {
      id: number;
      email: string;
      name: string | null;
    };
    careerGoals: {
      interests: string[];
    } | null;
  }>;
  total: number;
}>> {
  return apiRequest(API_ENDPOINTS.ADMIN.USERS_CAREER_GOALS, {
    method: 'GET',
  });
}

/**
 * Get single user with complete details (Admin only)
 */
export async function getUserDetails(userId: number): Promise<ApiResponse<{
  user: import('../../types').SiteUser;
  academics: {
    matric_board: string | null;
    matric_school_name: string | null;
    matric_passing_year: number | null;
    matric_roll_number: string | null;
    matric_total_marks: number | null;
    matric_obtained_marks: number | null;
    matric_percentage: number | null;
    matric_subjects: Array<{ name: string; percent: number; obtainedMarks?: number; totalMarks?: number }>;
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
    created_at?: string | null;
    updated_at?: string | null;
  } | null;
  careerGoals: {
    interests: string[];
    created_at?: string | null;
    updated_at?: string | null;
  } | null;
  examPreferences: {
    target_exams: string[];
    previous_attempts: Array<{
      exam_name: string;
      year: number;
      rank: number | null;
    }>;
    created_at?: string | null;
    updated_at?: string | null;
  } | null;
}>> {
  return apiRequest(`${API_ENDPOINTS.ADMIN.USERS}/${userId}`, {
    method: 'GET',
  });
}

