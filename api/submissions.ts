import { apiRequest } from './client';

/**
 * Submissions API — the student-facing view of the audit trail (fill_reports).
 * Reuses the existing extension endpoints; apiRequest attaches the user's
 * auth_token automatically for non-/admin routes.
 */

export interface FillReportSummary {
  id: number;
  exam_id: string;
  section_name: string;
  total_fields: number;
  filled_count: number;
  check_count: number;
  failed_count: number;
  adapter_version: number;
  confirmed_at: string | null;   // ISO; set when the student clicked Confirm & Fill
  has_changes: boolean;          // true when the student edited any value on review
  created_at: string;            // ISO
}

export type FillStatus = 'filled' | 'check' | 'failed' | 'not_found' | 'skipped';

export interface FillReportFieldResult {
  field_id: string;
  label: string;
  status: FillStatus;
  value: string | null;          // the information submitted into this field
  note: string | null;
}

export interface FillReportChange {
  from: string;
  to: string;
}

export interface FillReportDetail extends FillReportSummary {
  field_results: FillReportFieldResult[];
  /** dotted-path -> { from, to }; null when the student made no edits */
  student_changes: Record<string, FillReportChange> | null;
}

/** GET /api/extension/fill-reports — the current user's recent submissions. */
export async function getFillReports() {
  return apiRequest<FillReportSummary[]>('/extension/fill-reports');
}

/** GET /api/extension/fill-reports/:id — full detail for one submission. */
export async function getFillReportDetail(id: number) {
  return apiRequest<FillReportDetail>(`/extension/fill-reports/${id}`);
}
