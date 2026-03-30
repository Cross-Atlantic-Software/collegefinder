import { apiRequest } from '../client';
import type { ApiResponse, ReferralCodeResponse, ReferralUsesResponse } from '../types';
import { API_ENDPOINTS } from '../constants';

/** Get the authenticated user's referral code, QR data URL, and share URL. */
export async function getMyReferralCode(): Promise<ApiResponse<ReferralCodeResponse>> {
  return apiRequest<ReferralCodeResponse>(
    API_ENDPOINTS.REFERRAL.MY_CODE,
    { method: 'GET' },
    { timeout: 60000 }
  );
}

/** Send referral invite email(s) via nodemailer. Max 10 recipients. */
export async function sendReferralInvite(
  recipients: string[]
): Promise<ApiResponse<{ sent: string[]; failed: string[] }>> {
  return apiRequest<{ sent: string[]; failed: string[] }>(
    API_ENDPOINTS.REFERRAL.SEND_INVITE,
    {
      method: 'POST',
      body: JSON.stringify({ recipients }),
    },
    { timeout: 120000 }
  );
}

/** Get the list of users who have signed up using the authenticated user's referral code. */
export async function getMyReferralUses(): Promise<ApiResponse<ReferralUsesResponse>> {
  return apiRequest<ReferralUsesResponse>(API_ENDPOINTS.REFERRAL.MY_USES, {
    method: 'GET',
  });
}
