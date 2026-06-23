import { apiRequest } from '../client';
import { API_ENDPOINTS } from '../constants';
import { ApiResponse } from '../types';

// ─── Types ────────────────────────────────────────────────────────────

export type AdapterStatus = 'draft' | 'published';

export type ApprovalStatus = 'not_submitted' | 'in_review' | 'approved';

export type FieldType =
  | 'text'
  | 'select'
  | 'date'
  | 'radio'
  | 'checkbox'
  | 'file'
  | 'select_or_text';

export interface AdapterPageIndicator {
  type: 'url_contains' | 'page_text_contains' | 'step_number';
  value: string | number;
}

export interface AdapterFieldSelectors {
  by_id?: string[];
  by_name?: string[];
  by_placeholder?: string[];
  by_label?: string[];
  by_index?: number;
}

export interface AdapterField {
  field_id: string;
  label: string;
  source: string | null;
  type: FieldType;
  required: boolean;
  selectors: AdapterFieldSelectors;
  format?: 'UPPERCASE' | 'TITLECASE' | 'PHONE' | 'digits_only';
  value_map?: Record<string, string[]>;
  date_config?: { variant: 'masked_text' | 'text'; format: string };
  accepted_types?: string[];
  cascade_dependency?: string;
  cascade_wait_ms?: number;
  /** Admin "Leave Blank" (Captcha/OTP/manual): the filler skips these. */
  leave_blank?: boolean;
}

export interface AdapterSection {
  section_id: string;
  section_name: string;
  page_indicator: AdapterPageIndicator | null;
  fields: AdapterField[];
}

export interface AdapterConfig {
  sections: AdapterSection[];
  [k: string]: unknown;
}

export interface ExamAdapter {
  exam_id: string;
  exam_name: string;
  portal_url_pattern: string;
  status: AdapterStatus;
  version: number;
  is_active: boolean;
  is_ai_generated?: boolean;
  last_verified_at?: string | null;
  created_by?: string | null;
  updated_by?: string | null;
  created_at?: string;
  updated_at?: string;
  section_count?: number;
  /** Credits charged to auto-fill this exam (defaults to 1 server-side). */
  credit_cost?: number | null;
  /** Application fee paid directly to the exam (₹); null when not set. */
  exam_fee?: number | null;
  /** Admin validation lifecycle (distinct from the Builder publish toggle). */
  approval_status?: ApprovalStatus;
  approved_at?: string | null;
  approved_by?: string | null;
}

export interface ExamAdapterDetail extends ExamAdapter {
  adapter_config: AdapterConfig;
  /** Catalog application URL (exams_taxonomies.registration_link), joined by slug. */
  registration_link?: string | null;
  /** Catalog fallback URL; portal link = registration_link || website (matches listCatalog). */
  website?: string | null;
}

/** One field's result inside a validation-run fill report. */
export interface ValidationFieldResult {
  field_id: string;
  label?: string;
  status: 'filled' | 'check' | 'failed' | 'not_found' | 'skipped' | 'unmapped';
  value?: string | null;
  note?: string | null;
  /** Present only on 'unmapped' entries: the page field detected but not in the adapter. */
  scanned?: {
    label?: string;
    id?: string;
    name?: string;
    type?: string;
    options?: string[];
  };
}

/** Latest validation-run fill report for one section. */
export interface ValidationSectionFeed {
  section_name: string;
  field_results: ValidationFieldResult[];
  adapter_version: number | null;
  created_at: string;
}

export interface ProfilePathEntry {
  path: string;
  type: string;
  label: string;
}

export type DiscoveredFieldStatus = 'pending' | 'approved' | 'rejected';

export interface DiscoveredField {
  id: number;
  field_path: string;
  type: string;
  label: string;
  status: DiscoveredFieldStatus;
  discovered_from_exam: string | null;
  discovered_label: string | null;
  discovered_page_url: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

// ─── API ──────────────────────────────────────────────────────────────

export async function listExamAdapters(): Promise<ApiResponse<ExamAdapter[]>> {
  return apiRequest(API_ENDPOINTS.ADMIN.EXAM_ADAPTERS, { method: 'GET' });
}

export async function getProfileSchema(): Promise<ApiResponse<ProfilePathEntry[]>> {
  return apiRequest(`${API_ENDPOINTS.ADMIN.EXAM_ADAPTERS}/profile-schema`, { method: 'GET' });
}

export async function getExamAdapter(examId: string): Promise<ApiResponse<ExamAdapterDetail>> {
  return apiRequest(`${API_ENDPOINTS.ADMIN.EXAM_ADAPTERS}/${encodeURIComponent(examId)}`, {
    method: 'GET'
  });
}

export async function createExamAdapter(payload: {
  exam_id: string;
  exam_name: string;
  portal_url_pattern: string;
}): Promise<ApiResponse<ExamAdapter>> {
  return apiRequest(API_ENDPOINTS.ADMIN.EXAM_ADAPTERS, {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function updateExamAdapter(
  examId: string,
  payload: Partial<{
    exam_name: string;
    portal_url_pattern: string;
    adapter_config: AdapterConfig;
    credit_cost: number | null;
    exam_fee: number | null;
  }>
): Promise<ApiResponse<ExamAdapterDetail>> {
  return apiRequest(`${API_ENDPOINTS.ADMIN.EXAM_ADAPTERS}/${encodeURIComponent(examId)}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  });
}

export async function patchExamAdapterSection(
  examId: string,
  sectionId: string,
  section: AdapterSection
): Promise<ApiResponse<ExamAdapterDetail>> {
  return apiRequest(
    `${API_ENDPOINTS.ADMIN.EXAM_ADAPTERS}/${encodeURIComponent(examId)}/sections/${encodeURIComponent(sectionId)}`,
    { method: 'PATCH', body: JSON.stringify({ section }) }
  );
}

export async function setExamAdapterStatus(
  examId: string,
  status: AdapterStatus
): Promise<ApiResponse<ExamAdapter>> {
  return apiRequest(
    `${API_ENDPOINTS.ADMIN.EXAM_ADAPTERS}/${encodeURIComponent(examId)}/status`,
    { method: 'PATCH', body: JSON.stringify({ status }) }
  );
}

export async function deleteExamAdapter(examId: string): Promise<ApiResponse<{ exam_id: string }>> {
  return apiRequest(`${API_ENDPOINTS.ADMIN.EXAM_ADAPTERS}/${encodeURIComponent(examId)}`, {
    method: 'DELETE'
  });
}

export async function listDiscoveredFields(
  status: DiscoveredFieldStatus = 'pending'
): Promise<ApiResponse<DiscoveredField[]>> {
  return apiRequest(
    `${API_ENDPOINTS.ADMIN.EXAM_ADAPTERS}/discovered-fields?status=${encodeURIComponent(status)}`,
    { method: 'GET' }
  );
}

export async function createDiscoveredField(payload: {
  label: string;
  type?: string;
  discovered_from_exam?: string;
  discovered_page_url?: string;
}): Promise<ApiResponse<DiscoveredField>> {
  return apiRequest(`${API_ENDPOINTS.ADMIN.EXAM_ADAPTERS}/discovered-fields`, {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function reviewDiscoveredField(
  id: number,
  action: 'approve' | 'reject'
): Promise<ApiResponse<DiscoveredField>> {
  return apiRequest(`${API_ENDPOINTS.ADMIN.EXAM_ADAPTERS}/discovered-fields/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ action })
  });
}

// ─── Admin validation & approval ──────────────────────────────────────

/** Latest validation-run fill report per section (the review-screen feed). */
export async function getValidationFeed(
  examId: string
): Promise<ApiResponse<ValidationSectionFeed[]>> {
  return apiRequest(
    `${API_ENDPOINTS.ADMIN.EXAM_ADAPTERS}/${encodeURIComponent(examId)}/validation`,
    { method: 'GET', cache: 'no-store' }
  );
}

/** Mark a validation run as started (approval_status -> in_review). */
export async function submitExamAdapterReview(
  examId: string
): Promise<ApiResponse<ExamAdapter>> {
  return apiRequest(
    `${API_ENDPOINTS.ADMIN.EXAM_ADAPTERS}/${encodeURIComponent(examId)}/submit-review`,
    { method: 'POST' }
  );
}

/** Approve the adapter — sets approval_status=approved AND publishes it. */
export async function approveExamAdapter(
  examId: string
): Promise<ApiResponse<ExamAdapter>> {
  return apiRequest(
    `${API_ENDPOINTS.ADMIN.EXAM_ADAPTERS}/${encodeURIComponent(examId)}/approve`,
    { method: 'POST' }
  );
}
