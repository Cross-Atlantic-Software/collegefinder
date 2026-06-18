import { apiRequest } from '../../client';
import { API_ENDPOINTS } from '../../constants';
import { ApiResponse } from '../../types';

export type MappingStatus = 'mapped' | 'not_mapped';

export interface AutomationExamDetails {
  application_start_date: string | null;
  application_close_date: string | null;
  admit_card_date: string | null;
  exam_date: string | null;
  result_date: string | null;
  counselling_start_date: string | null;
  counselling_end_date: string | null;
  application_fees: number | null;
  ut_service_fee: number | null;
}

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
  taxonomy_exam_id: number | null;
  mapping_status: MappingStatus;
  exam_details?: AutomationExamDetails | null;
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
  taxonomy_exam_id?: number | null;
  exam_details?: Partial<AutomationExamDetails> | null;
}

export interface TaxonomyExamOption {
  id: number;
  name: string;
  code: string | null;
  website: string | null;
  registration_link?: string | null;
  exam_details?: AutomationExamDetails | null;
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
  taxonomy_exam_id?: number | null;
  exam_details?: Partial<AutomationExamDetails> | null;
}

export async function getAutomationTaxonomyExamOptions(): Promise<ApiResponse<TaxonomyExamOption[]>> {
  return apiRequest(API_ENDPOINTS.ADMIN.AUTOMATION_EXAMS_TAXONOMY_OPTIONS, {
    method: 'GET',
  });
}

export async function getAllAutomationExams(): Promise<ApiResponse<AutomationExam[]>> {
  return apiRequest(`${API_ENDPOINTS.ADMIN.AUTOMATION_EXAMS_FULL}`, {
    method: 'GET',
  });
}

export async function getAutomationExamById(id: number): Promise<ApiResponse<AutomationExam>> {
  return apiRequest(`${API_ENDPOINTS.ADMIN.AUTOMATION_EXAMS}/${id}`, {
    method: 'GET',
  });
}

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

export async function deleteAutomationExam(id: number): Promise<ApiResponse<void>> {
  return apiRequest(`${API_ENDPOINTS.ADMIN.AUTOMATION_EXAMS}/${id}`, {
    method: 'DELETE',
  });
}
