import { apiRequest } from '../../client';
import { API_ENDPOINTS } from '../../constants';
import { ApiResponse } from '../../types';

export interface CollegeFAQ {
  id: number;
  college_id: number;
  college_name?: string;
  question: string;
  answer: string;
  created_at: string;
  updated_at: string;
}

/**
 * Get all college FAQs
 */
export async function getAllCollegeFAQs(): Promise<ApiResponse<{
  faqs: CollegeFAQ[];
}>> {
  return apiRequest(API_ENDPOINTS.ADMIN.COLLEGE_FAQS, {
    method: 'GET',
  });
}

/**
 * Get FAQ by ID
 */
export async function getCollegeFAQById(id: number): Promise<ApiResponse<{
  faq: CollegeFAQ;
}>> {
  return apiRequest(`${API_ENDPOINTS.ADMIN.COLLEGE_FAQS}/${id}`, {
    method: 'GET',
  });
}

/**
 * Create new FAQ
 */
export async function createCollegeFAQ(data: {
  college_id: number;
  question: string;
  answer: string;
}): Promise<ApiResponse<{
  faq: CollegeFAQ;
}>> {
  return apiRequest(API_ENDPOINTS.ADMIN.COLLEGE_FAQS, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Update FAQ
 */
export async function updateCollegeFAQ(
  id: number,
  data: {
    college_id?: number;
    question?: string;
    answer?: string;
  }
): Promise<ApiResponse<{
  faq: CollegeFAQ;
}>> {
  return apiRequest(`${API_ENDPOINTS.ADMIN.COLLEGE_FAQS}/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

/**
 * Delete FAQ
 */
export async function deleteCollegeFAQ(id: number): Promise<ApiResponse<null>> {
  return apiRequest(`${API_ENDPOINTS.ADMIN.COLLEGE_FAQS}/${id}`, {
    method: 'DELETE',
  });
}

