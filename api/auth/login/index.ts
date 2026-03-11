/**
 * Authentication API - Login & OTP endpoints
 */

import { apiRequest } from '../../client';
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
  code: string
): Promise<ApiResponse<VerifyOTPResponse>> {
  return apiRequest<VerifyOTPResponse>(API_ENDPOINTS.AUTH.VERIFY_OTP, {
    method: 'POST',
    body: JSON.stringify({ email, code }),
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
export function initiateGoogleAuth() {
  const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';
  window.location.href = `${backendUrl}${API_ENDPOINTS.AUTH.GOOGLE_AUTH}`;
}

/**
 * Initiate Facebook OAuth (redirects to Facebook)
 */
export function initiateFacebookAuth() {
  const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';
  window.location.href = `${backendUrl}${API_ENDPOINTS.AUTH.FACEBOOK_AUTH}`;
}

