import { apiRequest } from '../../client';
import { API_ENDPOINTS } from '../../constants';
import { ApiResponse } from '../../types';

export interface AutomationExam {
  id: number;
  name: string;
  slug: string;
  url: string;
  is_active: boolean;
  field_mappings: Record<string, unknown>;
  agent_config: Record<string, unknown>;
  notify_on_complete: boolean;
  notify_on_failure: boolean;
  notification_emails: string[];
  created_at: string;
  updated_at: string;
}

export interface CreateAutomationExamData {
  name: string;
  slug: string;
  url: string;
  is_active?: boolean;
  field_mappings?: Record<string, unknown>;
  agent_config?: Record<string, unknown>;
  notify_on_complete?: boolean;
  notify_on_failure?: boolean;
  notification_emails?: string[];
}

export interface TaxonomyExamOption {
  id: number;
  name: string;
  code: string | null;
  website: string | null;
}

export interface UpdateAutomationExamData {
  name?: string;
  slug?: string;
  url?: string;
  is_active?: boolean;
  field_mappings?: Record<string, unknown>;
  agent_config?: Record<string, unknown>;
  notify_on_complete?: boolean;
  notify_on_failure?: boolean;
  notification_emails?: string[];
}

/**
 * Exams catalog (exams_taxonomies) for create-form dropdown
 */
export async function getAutomationTaxonomyExamOptions(): Promise<ApiResponse<TaxonomyExamOption[]>> {
  return apiRequest(API_ENDPOINTS.ADMIN.AUTOMATION_EXAMS_TAXONOMY_OPTIONS, {
    method: 'GET',
  });
}

/**
 * Get all automation exams (full details)
 */
export async function getAllAutomationExams(): Promise<ApiResponse<AutomationExam[]>> {
  return apiRequest(`${API_ENDPOINTS.ADMIN.AUTOMATION_EXAMS_FULL}`, {
    method: 'GET',
  });
}

/**
 * Get automation exam by ID
 */
export async function getAutomationExamById(id: number): Promise<ApiResponse<AutomationExam>> {
  return apiRequest(`${API_ENDPOINTS.ADMIN.AUTOMATION_EXAMS}/${id}`, {
    method: 'GET',
  });
}

/**
 * Create new automation exam
 */
export async function createAutomationExam(
  data: CreateAutomationExamData
): Promise<ApiResponse<AutomationExam>> {
  return apiRequest(`${API_ENDPOINTS.ADMIN.AUTOMATION_EXAMS}`, {
    method: 'POST',
    body: JSON.stringify(data),
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

/**
 * Update automation exam
 */
export async function updateAutomationExam(
  id: number,
  data: UpdateAutomationExamData
): Promise<ApiResponse<AutomationExam>> {
  return apiRequest(`${API_ENDPOINTS.ADMIN.AUTOMATION_EXAMS}/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

/**
 * Delete automation exam
 */
export async function deleteAutomationExam(id: number): Promise<ApiResponse<void>> {
  return apiRequest(`${API_ENDPOINTS.ADMIN.AUTOMATION_EXAMS}/${id}`, {
    method: 'DELETE',
  });
}
