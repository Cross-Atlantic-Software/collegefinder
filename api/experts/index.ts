import { apiRequest } from '../client';
import type { ApiResponse } from '../types';
import { API_ENDPOINTS } from '../constants';

export interface AdmissionExpert {
  id: number;
  name: string;
  photo_url: string | null;
  contact: string | null;
  phone: string | null;
  email: string | null;
  description: string | null;
  type: string;
  is_active?: boolean;
  linkedin_url?: string | null;
  website?: string | null;
  photo_file_name?: string | null;
  created_at: string;
}

export type ExpertsGrouped = Record<string, AdmissionExpert[]>;

export async function getAllExperts(): Promise<ApiResponse<{ experts: ExpertsGrouped }>> {
  return apiRequest(API_ENDPOINTS.EXPERTS, { method: 'GET' });
}
