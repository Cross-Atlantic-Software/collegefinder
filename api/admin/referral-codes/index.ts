import { apiRequest } from '../../client';
import { API_ENDPOINTS } from '../../constants';
import { ApiResponse } from '../../types';

export interface ActiveReferralCode {
  id: number;
  user_id: number;
  user_email: string;
  user_name: string | null;
  active_code: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  deactivated_at: string | null;
  deactivated_by_admin_id: number | null;
}

export async function getAllActiveReferralCodes(): Promise<ApiResponse<{ referralCodes: ActiveReferralCode[] }>> {
  return apiRequest(API_ENDPOINTS.ADMIN.REFERRAL_CODES, { method: 'GET' });
}

export async function deactivateReferralCode(id: number): Promise<ApiResponse<{ referralCode: ActiveReferralCode }>> {
  return apiRequest(`${API_ENDPOINTS.ADMIN.REFERRAL_CODES}/${id}/deactivate`, {
    method: 'PATCH',
  });
}

export async function deleteReferralCode(id: number): Promise<ApiResponse<null>> {
  return apiRequest(`${API_ENDPOINTS.ADMIN.REFERRAL_CODES}/${id}`, {
    method: 'DELETE',
  });
}
