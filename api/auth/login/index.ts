/**
 * Authentication API - Login & OTP endpoints
 */

import { apiRequest, getApiBaseUrl } from '../../client';
import type {
  ApiResponse,
  SendOTPResponse,
  VerifyOTPResponse,
  PasswordAuthResponse,
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

export async function startSignup(email: string, password: string): Promise<ApiResponse<SendOTPResponse>> {
  return apiRequest<SendOTPResponse>(API_ENDPOINTS.AUTH.SIGNUP_START, {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function loginWithPassword(
  email: string,
  password: string
): Promise<ApiResponse<PasswordAuthResponse>> {
  return apiRequest<PasswordAuthResponse>(API_ENDPOINTS.AUTH.LOGIN_PASSWORD, {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

/** Dev server may include resetLink when NODE_ENV=development (SMTP fallback). */
export type ForgotPasswordResponse = {
  resetLink?: string;
  emailDelivered?: boolean;
  devHint?: string;
  /** development only: no_user | email_not_verified */
  devSkipReason?: string;
};

/** Request a password reset link by email (public). */
export async function requestPasswordReset(email: string): Promise<ApiResponse<ForgotPasswordResponse>> {
  return apiRequest<ForgotPasswordResponse>(API_ENDPOINTS.AUTH.FORGOT_PASSWORD, {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

/** Complete password reset with token from email (public). */
export async function resetPasswordWithToken(
  token: string,
  new_password: string,
  new_password_confirm: string
): Promise<ApiResponse<{ message?: string }>> {
  return apiRequest(API_ENDPOINTS.AUTH.RESET_PASSWORD, {
    method: 'POST',
    body: JSON.stringify({ token, new_password, new_password_confirm }),
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
  const backendUrl = getApiBaseUrl();
  const url = new URL(`${backendUrl}${API_ENDPOINTS.AUTH.GOOGLE_AUTH}`);
  if (ref) url.searchParams.set('ref', ref);
  window.location.href = url.toString();
}

/**
 * Initiate Facebook OAuth (redirects to Facebook)
 */
export function initiateFacebookAuth(ref?: string) {
  const backendUrl = getApiBaseUrl();
  const url = new URL(`${backendUrl}${API_ENDPOINTS.AUTH.FACEBOOK_AUTH}`);
  if (ref) url.searchParams.set('ref', ref);
  window.location.href = url.toString();
}

