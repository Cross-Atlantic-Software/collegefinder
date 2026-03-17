import { apiRequest } from '../client';
import type { ApiResponse } from '../types';
import { API_ENDPOINTS } from '../constants';

export interface StrengthFormData {
  name: string | null;
  email: string | null;
  phone: string | null;
  class_info: string | null;
  school: string | null;
  age: number | null;
  is_complete: boolean;
}

export interface StrengthPaymentStatus {
  payment_status: 'paid' | 'not_paid';
  paid_at: string | null;
}

export interface CareerRecommendation {
  career: string;
  details: string;
}

export interface StrengthResultData {
  id: number;
  user_id: number;
  counsellor_admin_id: number | null;
  strengths: string[];
  career_recommendations: CareerRecommendation[];
  report_url: string | null;
  /** Multiple assigned consultants (Strength Masters CRM) */
  assigned_expert_ids: number[];
  /** @deprecated Use assigned_expert_ids; first ID if any */
  assigned_expert_id?: number | null;
  assigned_expert_name?: string | null;
  assigned_expert_type?: string | null;
  created_at: string;
  updated_at: string;
}

export async function getStrengthPaymentStatus(): Promise<ApiResponse<StrengthPaymentStatus>> {
  return apiRequest<StrengthPaymentStatus>(API_ENDPOINTS.STRENGTH.PAYMENT_STATUS, { method: 'GET' });
}

export async function getStrengthFormData(): Promise<ApiResponse<StrengthFormData>> {
  return apiRequest<StrengthFormData>(API_ENDPOINTS.STRENGTH.FORM_DATA, { method: 'GET' });
}

export async function makeStrengthPayment(): Promise<ApiResponse<{ payment: unknown }>> {
  return apiRequest(API_ENDPOINTS.STRENGTH.PAY, { method: 'POST' });
}

export async function getStrengthResults(): Promise<ApiResponse<{ results: StrengthResultData | null; has_results: boolean }>> {
  return apiRequest(API_ENDPOINTS.STRENGTH.RESULTS, { method: 'GET' });
}
