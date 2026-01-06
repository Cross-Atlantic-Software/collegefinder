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
  email: string | null;
  name: string | null;
  first_name: string | null;
  last_name: string | null;
  date_of_birth: string | null;
  gender: string | null;
  phone_number: string | null;
  email_verified: boolean;
  latitude: number | null;
  profile_photo?: string | null;
  longitude: number | null;
  nationality: string | null;
  marital_status: string | null;
  father_full_name: string | null;
  mother_full_name: string | null;
  guardian_name: string | null;
  alternate_mobile_number: string | null;
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
  phone_number?: string;
  latitude?: number;
  longitude?: number;
  nationality?: string;
  marital_status?: string;
  father_full_name?: string;
  mother_full_name?: string;
  guardian_name?: string;
  alternate_mobile_number?: string;
}): Promise<ApiResponse<{
  id: number;
  email: string;
  name: string | null;
  first_name: string | null;
  last_name: string | null;
  date_of_birth: string | null;
  gender: string | null;
  phone_number: string | null;
  latitude: number | null;
  longitude: number | null;
  profile_photo?: string | null;
  nationality: string | null;
  marital_status: string | null;
  father_full_name: string | null;
  mother_full_name: string | null;
  guardian_name: string | null;
  alternate_mobile_number: string | null;
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
  matric_state: string | null;
  matric_city: string | null;
  matric_marks_type: string | null;
  matric_cgpa: number | null;
  matric_result_status: string | null;
  matric_subjects: Array<{ subject_id?: number; name: string; percent: number; obtainedMarks?: number; totalMarks?: number }>;
  // Post-Matric (12th) fields
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
  subjects: Array<{ subject_id?: number; name: string; percent: number; obtainedMarks?: number; totalMarks?: number }>;
  is_pursuing_12th: boolean;
} | null>> {
  return apiRequest(API_ENDPOINTS.AUTH.PROFILE_ACADEMICS, {
    method: 'GET',
  });
}

/**
 * Get subjects filtered by user's stream_id with topics
 */
export async function getSubjectsByStream(): Promise<ApiResponse<{
  subjects: Array<{
    id: string;
    name: string;
    topics: Array<{
      id: number;
      name: string;
      thumbnail: string | null;
      description: string | null;
      home_display: boolean;
      sort_order: number;
    }>;
    allTopics: Array<{
      id: number;
      name: string;
      thumbnail: string | null;
      description: string | null;
      home_display: boolean;
      sort_order: number;
    }>;
  }>;
  requiresStreamSelection: boolean;
  message?: string;
  stream_id?: number;
}>> {
  return apiRequest(API_ENDPOINTS.AUTH.PROFILE_SUBJECTS, {
    method: 'GET',
  });
}

/**
 * Get topic by name with subtopics and lectures
 */
export async function getTopicByName(topicName: string): Promise<ApiResponse<{
  topic: {
    id: number;
    name: string;
    thumbnail: string | null;
    description: string | null;
    sub_id: number;
  };
  subtopics: Array<{
    id: number;
    name: string;
    description: string | null;
    sort_order: number;
    lectures: Array<{
      id: number;
      name: string;
      content_type: 'VIDEO' | 'ARTICLE';
      video_file: string | null;
      article_content: string | null;
      thumbnail: string | null;
      description: string | null;
      purposes: Array<{ id: number; name: string; status: boolean }>;
      sort_order: number;
    }>;
  }>;
}>> {
  return apiRequest(`${API_ENDPOINTS.AUTH.PROFILE_TOPICS}/${encodeURIComponent(topicName)}`, {
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
  stream_id?: number;
  subjects?: Array<{ subject_id?: number; name: string; percent: number; obtainedMarks?: number; totalMarks?: number }>;
  matric_subjects?: Array<{ subject_id?: number; name: string; percent: number; obtainedMarks?: number; totalMarks?: number }>;
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
  subjects: Array<{ subject_id?: number; name: string; percent: number; obtainedMarks?: number; totalMarks?: number }>;
  matric_subjects: Array<{ subject_id?: number; name: string; percent: number; obtainedMarks?: number; totalMarks?: number }>;
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

/**
 * Send OTP to email for verification (profile email update)
 */
export async function sendEmailOTP(email: string): Promise<ApiResponse<{
  email: string;
  expiresIn: number;
}>> {
  return apiRequest(API_ENDPOINTS.AUTH.PROFILE_EMAIL_SEND_OTP, {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

/**
 * Verify OTP and update email
 */
export async function verifyEmailOTP(email: string, code: string): Promise<ApiResponse<{
  id: number;
  email: string;
  email_verified: boolean;
}>> {
  return apiRequest(API_ENDPOINTS.AUTH.PROFILE_EMAIL_VERIFY, {
    method: 'POST',
    body: JSON.stringify({ email, code }),
  });
}

/**
 * Get user government identification
 */
export async function getGovernmentIdentification(): Promise<ApiResponse<{
  id: number;
  user_id: number;
  aadhar_number: string | null;
  apaar_id: string | null;
  created_at: string;
  updated_at: string;
} | null>> {
  return apiRequest(API_ENDPOINTS.AUTH.PROFILE_GOVERNMENT_IDENTIFICATION, {
    method: 'GET',
  });
}

/**
 * Create or update user government identification
 */
export async function upsertGovernmentIdentification(data: {
  aadhar_number?: string;
  apaar_id?: string;
}): Promise<ApiResponse<{
  id: number;
  user_id: number;
  aadhar_number: string | null;
  apaar_id: string | null;
  created_at: string;
  updated_at: string;
}>> {
  return apiRequest(API_ENDPOINTS.AUTH.PROFILE_GOVERNMENT_IDENTIFICATION, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

/**
 * Delete user government identification
 */
export async function deleteGovernmentIdentification(): Promise<ApiResponse<{
  message: string;
}>> {
  return apiRequest(API_ENDPOINTS.AUTH.PROFILE_GOVERNMENT_IDENTIFICATION, {
    method: 'DELETE',
  });
}

/**
 * Get user category and reservation
 */
export async function getCategoryAndReservation(): Promise<ApiResponse<{
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
} | null>> {
  return apiRequest(API_ENDPOINTS.AUTH.PROFILE_CATEGORY_AND_RESERVATION, {
    method: 'GET',
  });
}

/**
 * Create or update user category and reservation
 */
export async function upsertCategoryAndReservation(data: {
  category_id?: number;
  ews_status?: boolean;
  pwbd_status?: boolean;
  type_of_disability?: string;
  disability_percentage?: number;
  udid_number?: string;
  minority_status?: string;
  ex_serviceman_defence_quota?: boolean;
  kashmiri_migrant_regional_quota?: boolean;
  state_domicile?: boolean;
  home_state_for_quota?: string;
}): Promise<ApiResponse<{
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
}>> {
  return apiRequest(API_ENDPOINTS.AUTH.PROFILE_CATEGORY_AND_RESERVATION, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

/**
 * Delete user category and reservation
 */
export async function deleteCategoryAndReservation(): Promise<ApiResponse<{
  message: string;
}>> {
  return apiRequest(API_ENDPOINTS.AUTH.PROFILE_CATEGORY_AND_RESERVATION, {
    method: 'DELETE',
  });
}

/**
 * Get user other personal details
 */
export async function getOtherPersonalDetails(): Promise<ApiResponse<{
  id: number;
  user_id: number;
  religion: string | null;
  mother_tongue: string | null;
  annual_family_income: number | null;
  occupation_of_father: string | null;
  occupation_of_mother: string | null;
  created_at: string;
  updated_at: string;
} | null>> {
  return apiRequest(API_ENDPOINTS.AUTH.PROFILE_OTHER_PERSONAL_DETAILS, {
    method: 'GET',
  });
}

/**
 * Create or update user other personal details
 */
export async function upsertOtherPersonalDetails(data: {
  religion?: 'Hindu' | 'Muslim' | 'Christian' | 'Sikh' | 'Buddhist' | 'Jain' | 'Jewish' | 'Parsi (Zoroastrian)' | 'Other' | 'Prefer not to say';
  mother_tongue?: string;
  annual_family_income?: number;
  occupation_of_father?: string;
  occupation_of_mother?: string;
}): Promise<ApiResponse<{
  id: number;
  user_id: number;
  religion: string | null;
  mother_tongue: string | null;
  annual_family_income: number | null;
  occupation_of_father: string | null;
  occupation_of_mother: string | null;
  created_at: string;
  updated_at: string;
}>> {
  return apiRequest(API_ENDPOINTS.AUTH.PROFILE_OTHER_PERSONAL_DETAILS, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

/**
 * Delete user other personal details
 */
export async function deleteOtherPersonalDetails(): Promise<ApiResponse<{
  message: string;
}>> {
  return apiRequest(API_ENDPOINTS.AUTH.PROFILE_OTHER_PERSONAL_DETAILS, {
    method: 'DELETE',
  });
}

/**
 * Get user address
 */
export async function getUserAddress(): Promise<ApiResponse<{
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
} | null>> {
  return apiRequest(API_ENDPOINTS.AUTH.PROFILE_ADDRESS, {
    method: 'GET',
  });
}

/**
 * Create or update user address
 */
export async function upsertUserAddress(data: {
  correspondence_address_line1?: string;
  correspondence_address_line2?: string;
  city_town_village?: string;
  district?: string;
  state?: string;
  country?: string;
  pincode?: string;
  permanent_address_same_as_correspondence?: boolean;
  permanent_address?: string;
}): Promise<ApiResponse<{
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
}>> {
  return apiRequest(API_ENDPOINTS.AUTH.PROFILE_ADDRESS, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

/**
 * Delete user address
 */
export async function deleteUserAddress(): Promise<ApiResponse<{
  message: string;
}>> {
  return apiRequest(API_ENDPOINTS.AUTH.PROFILE_ADDRESS, {
    method: 'DELETE',
  });
}

/**
 * Get user document vault
 */
export async function getDocumentVault(): Promise<ApiResponse<{
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
} | null>> {
  return apiRequest(API_ENDPOINTS.AUTH.PROFILE_DOCUMENT_VAULT, {
    method: 'GET',
  });
}

/**
 * Upload a document to document vault
 */
export async function uploadDocument(
  file: File,
  fieldName: string
): Promise<ApiResponse<{
  fieldName: string;
  url: string;
  documentVault: {
    id: number;
    user_id: number;
    [key: string]: string | number | null;
  };
}>> {
  const formData = new FormData();
  formData.append('document', file);
  formData.append('fieldName', fieldName);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';
  const url = `${apiUrl}${API_ENDPOINTS.AUTH.PROFILE_DOCUMENT_VAULT_UPLOAD}`;
  
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
    throw new Error(data.message || 'Failed to upload document');
  }

  return data;
}

/**
 * Delete a document from document vault
 */
export async function deleteDocument(fieldName: string): Promise<ApiResponse<{
  message: string;
}>> {
  return apiRequest(`${API_ENDPOINTS.AUTH.PROFILE_DOCUMENT_VAULT}/${fieldName}`, {
    method: 'DELETE',
  });
}

