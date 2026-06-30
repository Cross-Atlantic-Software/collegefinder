import { apiRequest } from '../client';
import { API_ENDPOINTS } from '../constants';
import { ApiResponse } from '../types';

// ─── Types ────────────────────────────────────────────────────────────

export type AdapterStatus = 'draft' | 'published';

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
}

export interface ExamAdapterDetail extends ExamAdapter {
  adapter_config: AdapterConfig;
}

/** Shape of a full adapter JSON file (as authored in examfill-extension/adapters/*.json). */
export interface AdapterFile {
  exam_id: string;
  exam_name: string;
  portal_url_pattern: string;
  version?: number;
  sections: AdapterSection[];
  [k: string]: unknown;
}

/** A form field that can't be auto-filled from the user DB. */
export interface UnmatchedField {
  section: string;
  label: string;
  field_id: string;
  /** null = no source mapping; string = source not found in profile schema. */
  source: string | null;
  reason: 'no_source' | 'unknown_source';
}

export interface ImportAdapterResult extends ExamAdapter {
  section_count?: number;
  unmatched_fields?: UnmatchedField[];
}

export interface ProfilePathEntry {
  path: string;
  type: string;
  label: string;
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

/**
 * Upsert a complete adapter from a pasted/uploaded JSON file.
 * `publish` defaults to true on the backend (adapter goes live immediately).
 */
export async function importExamAdapter(payload: {
  adapter: AdapterFile;
  publish?: boolean;
}): Promise<ApiResponse<ImportAdapterResult>> {
  return apiRequest(`${API_ENDPOINTS.ADMIN.EXAM_ADAPTERS}/import`, {
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
