/**
 * Authentication API - Login & OTP endpoints
 */

import { apiRequest, getApiBaseUrl } from '../../client';
import type {
  ApiResponse,
  SendOTPResponse,
  VerifyOTPResponse,
} from '../../types';

import { API_ENDPOINTS } from '../../constants';

/**
 * Send OTP to email
 */
export async function sendOTP(email: string): Promise<ApiResponse<SendOTPResponse>> {
  return apiRequest<SendOTPResponse>(API_ENDPOINTS.AUTH.SEND_OTP, {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

/**
 * Verify OTP code
 */
export async function verifyOTP(
  email: string,
  code: string,
  ref?: string
): Promise<ApiResponse<VerifyOTPResponse>> {
  return apiRequest<VerifyOTPResponse>(API_ENDPOINTS.AUTH.VERIFY_OTP, {
    method: 'POST',
    body: JSON.stringify({ email, code, ...(ref ? { ref } : {}) }),
  });
}

/**
 * Resend OTP
 */
export async function resendOTP(email: string): Promise<ApiResponse<SendOTPResponse>> {
  return apiRequest<SendOTPResponse>(API_ENDPOINTS.AUTH.RESEND_OTP, {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

/**
 * Initiate Google OAuth (redirects to Google)
 */
export function initiateGoogleAuth(ref?: string) {
  if (typeof window === 'undefined') return;
  const backendUrl = `${window.location.origin}${getApiBaseUrl()}`;
  const url = new URL(`${backendUrl}${API_ENDPOINTS.AUTH.GOOGLE_AUTH}`);
  if (ref) url.searchParams.set('ref', ref);
  window.location.href = url.toString();
}

/**
 * Initiate Facebook OAuth (redirects to Facebook)
 */
export function initiateFacebookAuth(ref?: string) {
  if (typeof window === 'undefined') return;
  const backendUrl = `${window.location.origin}${getApiBaseUrl()}`;
  const url = new URL(`${backendUrl}${API_ENDPOINTS.AUTH.FACEBOOK_AUTH}`);
  if (ref) url.searchParams.set('ref', ref);
  window.location.href = url.toString();
}

