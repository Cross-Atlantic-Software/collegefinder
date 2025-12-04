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
    PROFILE_BASIC: '/auth/profile/basic',
    PROFILE_ACADEMICS: '/auth/profile/academics',
    PROFILE_CAREER_GOALS: '/auth/profile/career-goals',
    PROFILE_COMPLETION: '/auth/profile/completion',
  },
  
  // Admin endpoints
  ADMIN: {
    LOGIN: '/admin/login',
    ME: '/admin/me',
    ADMINS: '/admin/admins',
    USERS: '/admin/users',
    USERS_BASIC_INFO: '/admin/users/basic-info',
    USERS_ACADEMICS: '/admin/users/academics',
    USERS_CAREER_GOALS: '/admin/users/career-goals',
    EMAIL_TEMPLATES: '/admin/email-templates',
    CAREER_GOALS: '/admin/career-goals',
  },
} as const;

