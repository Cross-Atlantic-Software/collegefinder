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
    matric_state: string | null;
    matric_city: string | null;
    matric_marks_type: string | null;
    matric_cgpa: number | null;
    matric_result_status: string | null;
    matric_subjects: Array<{ name: string; percent: number; obtainedMarks?: number; totalMarks?: number }>;
    postmatric_board: string | null;
    postmatric_school_name: string | null;
    postmatric_passing_year: number | null;
    postmatric_roll_number: string | null;
    postmatric_total_marks: number | null;
    postmatric_obtained_marks: number | null;
    postmatric_percentage: number | null;
    postmatric_state: string | null;
    postmatric_city: string | null;
    postmatric_marks_type: string | null;
    postmatric_cgpa: number | null;
    postmatric_result_status: string | null;
    stream: string | null;
    stream_id: number | null;
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
  governmentIdentification: {
    id: number;
    user_id: number;
    aadhar_number: string | null;
    apaar_id: string | null;
    created_at: string;
    updated_at: string;
  } | null;
  categoryAndReservation: {
    id: number;
    user_id: number;
    category_id: number | null;
    category_name: string | null;
    ews_status: boolean;
    pwbd_status: boolean;
    type_of_disability: string | null;
    disability_percentage: number | null;
    udid_number: string | null;
    minority_status: string | null;
    ex_serviceman_defence_quota: boolean;
    kashmiri_migrant_regional_quota: boolean;
    state_domicile: boolean;
    home_state_for_quota: string | null;
    created_at: string;
    updated_at: string;
  } | null;
  otherPersonalDetails: {
    id: number;
    user_id: number;
    religion: string | null;
    mother_tongue: string | null;
    annual_family_income: number | null;
    occupation_of_father: string | null;
    occupation_of_mother: string | null;
    created_at: string;
    updated_at: string;
  } | null;
  userAddress: {
    id: number;
    user_id: number;
    correspondence_address_line1: string | null;
    correspondence_address_line2: string | null;
    city_town_village: string | null;
    district: string | null;
    state: string | null;
    country: string | null;
    pincode: string | null;
    permanent_address_same_as_correspondence: boolean;
    permanent_address: string | null;
    created_at: string;
    updated_at: string;
  } | null;
  otherInfo: {
    id: number;
    user_id: number;
    medium: string | null;
    language: string | null;
    program_ids: number[];
    program_names: string[];
    exam_city_ids: number[];
    exam_city_names: string[];
    created_at: string;
    updated_at: string;
  } | null;
  documentVault: {
    id: number;
    user_id: number;
    passport_size_photograph: string | null;
    signature_image: string | null;
    matric_marksheet: string | null;
    matric_certificate: string | null;
    postmatric_marksheet: string | null;
    valid_photo_id_proof: string | null;
    sc_certificate: string | null;
    st_certificate: string | null;
    obc_ncl_certificate: string | null;
    ews_certificate: string | null;
    pwbd_disability_certificate: string | null;
    udid_card: string | null;
    domicile_certificate: string | null;
    citizenship_certificate: string | null;
    migration_certificate: string | null;
    created_at: string;
    updated_at: string;
  } | null;
}>> {
  return apiRequest(`${API_ENDPOINTS.ADMIN.USERS}/${userId}`, {
    method: 'GET',
  });
}

