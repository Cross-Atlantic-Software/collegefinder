import { apiRequest } from '../../client';
import { API_ENDPOINTS } from '../../constants';
import type { ApiResponse } from '../../types';

export interface AdminUserQuery {
  id: number;
  user_id: number;
  name: string;
  email: string;
  phone: string | null;
  query_type: string;
  description: string;
  status: 'open' | 'resolved';
  admin_answer: string | null;
  resolved_at: string | null;
  resolved_by_admin_id: number | null;
  resolved_by_admin_email?: string | null;
  created_at: string;
  updated_at: string;
}

export async function getAllUserQueriesAdmin(): Promise<ApiResponse<{ queries: AdminUserQuery[] }>> {
  return apiRequest(API_ENDPOINTS.ADMIN.QUERIES, { method: 'GET' });
}

export async function resolveUserQueryAdmin(
  id: number,
  answer: string
): Promise<ApiResponse<{ query: AdminUserQuery }>> {
  return apiRequest(`${API_ENDPOINTS.ADMIN.QUERIES}/${id}/resolve`, {
    method: 'PATCH',
    body: JSON.stringify({ answer }),
  });
}
