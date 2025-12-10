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
    GOOGLE_AUTH: '/auth/google',
    GOOGLE_CALLBACK: '/auth/google/callback',
    ME: '/auth/me',
    PROFILE: '/auth/profile',
    PROFILE_BASIC: '/auth/profile/basic',
    PROFILE_ACADEMICS: '/auth/profile/academics',
    PROFILE_SUBJECTS: '/auth/profile/subjects',
    PROFILE_TOPICS: '/auth/profile/topics',
    PROFILE_CAREER_GOALS: '/auth/profile/career-goals',
    PROFILE_COMPLETION: '/auth/profile/completion',
    PROFILE_UPLOAD_PHOTO: '/auth/profile/upload-photo',
  },
  
  // Public endpoints
  PUBLIC: {
    SUBJECTS: '/subjects',
    STREAMS: '/streams',
    CAREERS: '/careers',
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
    BLOGS: '/admin/blogs',
    CAREER_GOALS: '/admin/career-goals',
    EXAMS: '/admin/exams',
    SUBJECTS: '/admin/subjects',
    STREAMS: '/admin/streams',
    CAREERS: '/admin/careers',
    TOPICS: '/admin/topics',
    SUBTOPICS: '/admin/subtopics',
    LECTURES: '/admin/lectures',
    PURPOSES: '/admin/purposes',
  },
} as const;

