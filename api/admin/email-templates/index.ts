/**
 * Admin API - Email Templates Management endpoints
 */

import { apiRequest } from '../../client';
import type {
  ApiResponse,
  EmailTemplate,
  GetAllEmailTemplatesResponse,
} from '../../types';

import { API_ENDPOINTS } from '../../constants';

/**
 * Get all email templates
 */
export async function getAllEmailTemplates(): Promise<ApiResponse<GetAllEmailTemplatesResponse>> {
  return apiRequest<GetAllEmailTemplatesResponse>(API_ENDPOINTS.ADMIN.EMAIL_TEMPLATES, {
    method: 'GET',
  });
}

/**
 * Get email template by ID
 */
export async function getEmailTemplateById(id: number): Promise<ApiResponse<{ template: EmailTemplate }>> {
  return apiRequest<{ template: EmailTemplate }>(`${API_ENDPOINTS.ADMIN.EMAIL_TEMPLATES}/${id}`, {
    method: 'GET',
  });
}

/**
 * Create email template (Super Admin only)
 */
export async function createEmailTemplate(
  type: string,
  subject: string,
  body_html: string
): Promise<ApiResponse<{ template: EmailTemplate }>> {
  return apiRequest<{ template: EmailTemplate }>(API_ENDPOINTS.ADMIN.EMAIL_TEMPLATES, {
    method: 'POST',
    body: JSON.stringify({ type, subject, body_html }),
  });
}

/**
 * Update email template (Super Admin only)
 */
export async function updateEmailTemplate(
  id: number,
  subject: string,
  body_html: string
): Promise<ApiResponse<{ template: EmailTemplate }>> {
  return apiRequest<{ template: EmailTemplate }>(`${API_ENDPOINTS.ADMIN.EMAIL_TEMPLATES}/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ subject, body_html }),
  });
}

/**
 * Delete email template (Super Admin only)
 */
export async function deleteEmailTemplate(id: number): Promise<ApiResponse<void>> {
  return apiRequest<void>(`${API_ENDPOINTS.ADMIN.EMAIL_TEMPLATES}/${id}`, {
    method: 'DELETE',
  });
}

