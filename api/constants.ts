/**
 * API Constants
 * Centralized API endpoint paths
 */

export const API_ENDPOINTS = {
  // Auth endpoints
  AUTH: {
    SEND_OTP: '/auth/send-otp',
    VERIFY_OTP: '/auth/verify-otp',
    RESEND_OTP: '/auth/resend-otp',
    ME: '/auth/me',
    PROFILE: '/auth/profile',
  },
  
  // Admin endpoints
  ADMIN: {
    LOGIN: '/admin/login',
    ME: '/admin/me',
    ADMINS: '/admin/admins',
    USERS: '/admin/users',
    EMAIL_TEMPLATES: '/admin/email-templates',
  },
} as const;

