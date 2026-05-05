import { apiRequest } from '../client';
import { API_ENDPOINTS } from '../constants';
import type { ApiResponse } from '../types';

export type CreateSiteQueryPayload = {
  name: string;
  email: string;
  phone?: string;
  query_type:
    | 'Choosing the right course'
    | 'College selection'
    | 'Exam planning'
    | 'Application process'
    | 'Scholarships / fees'
    | 'Others';
  description: string;
};

export async function createSiteQuery(
  payload: CreateSiteQueryPayload
): Promise<ApiResponse<{ query: { id: number } }>> {
  return apiRequest<{ query: { id: number } }>(API_ENDPOINTS.SITE.QUERIES, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
