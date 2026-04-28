/**
 * API Constants
 * Centralized API endpoint paths
 */

export const API_ENDPOINTS = {
  // Auth endpoints
  AUTH: {
    SEND_OTP: '/auth/send-otp',
    SIGNUP_START: '/auth/signup/start',
    LOGIN_PASSWORD: '/auth/login-password',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    VERIFY_OTP: '/auth/verify-otp',
    RESEND_OTP: '/auth/resend-otp',
    GOOGLE_AUTH: '/auth/google',
    GOOGLE_CALLBACK: '/auth/google/callback',
    FACEBOOK_AUTH: '/auth/facebook',
    FACEBOOK_CALLBACK: '/auth/facebook/callback',
    ME: '/auth/me',
    PROFILE: '/auth/profile',
    PROFILE_BASIC: '/auth/profile/basic',
    PROFILE_ACADEMICS: '/auth/profile/academics',
    PROFILE_SUBJECTS: '/auth/profile/subjects',
    PROFILE_EXAM_PREP_LECTURES: '/auth/profile/exam-prep-lectures',
    PROFILE_TOPICS: '/auth/profile/topics',
    PROFILE_CAREER_GOALS: '/auth/profile/career-goals',
    PROFILE_PASSWORD: '/auth/profile/password',
    PROFILE_RECOMMENDED_EXAMS: '/auth/profile/recommended-exams',
    PROFILE_RECOMMENDED_COLLEGES: '/auth/profile/recommended-colleges',
    PROFILE_COMPLETION: '/auth/profile/completion',
    PROFILE_UPLOAD_PHOTO: '/auth/profile/upload-photo',
    PROFILE_EMAIL_SEND_OTP: '/auth/profile/email/send-otp',
    PROFILE_EMAIL_VERIFY: '/auth/profile/email/verify',
    PROFILE_GOVERNMENT_IDENTIFICATION: '/auth/profile/government-identification',
    PROFILE_CATEGORY_AND_RESERVATION: '/auth/profile/category-and-reservation',
    PROFILE_OTHER_PERSONAL_DETAILS: '/auth/profile/other-personal-details',
    PROFILE_ADDRESS: '/auth/profile/address',
    PROFILE_OTHER_INFO: '/auth/profile/other-info',
    PROFILE_DOCUMENT_VAULT: '/auth/profile/document-vault',
    PROFILE_DOCUMENT_VAULT_UPLOAD: '/auth/profile/document-vault/upload',
  },

  /** Public site (no auth) */
  SITE: {
    LANDING_PAGE: '/site/landing-page',
    BLOGS: '/site/blogs',
  },

  // Public endpoints
  PUBLIC: {
    SUBJECTS: '/subjects',
    STREAMS: '/streams',
    CAREERS: '/careers',
    CATEGORIES: '/categories',
    PROGRAMS: '/programs',
    EXAM_CITIES: '/exam-cities',
  },

  // Admin endpoints
  ADMIN: {
    LOGIN: '/admin/login',
    ME: '/admin/me',
    ADMINS: '/admin/admins',
    MODULES: '/admin/modules',
    USERS: '/admin/users',
    USERS_BASIC_INFO: '/admin/users/basic-info',
    USERS_ACADEMICS: '/admin/users/academics',
    USERS_CAREER_GOALS: '/admin/users/career-goals',
    EMAIL_TEMPLATES: '/admin/email-templates',
    BLOGS: '/admin/blogs',
    LANDING_PAGE: '/admin/landing-page',
    CAREER_GOALS: '/admin/career-goals',
    EXAMS: '/admin/exams',
    MOCK_PROMPTS: '/admin/mock-prompts',
    SUBJECTS: '/admin/subjects',
    STREAMS: '/admin/streams',
    CAREERS: '/admin/careers',
    TOPICS: '/admin/topics',
    SUBTOPICS: '/admin/subtopics',
    LECTURES: '/admin/lectures',
    PURPOSES: '/admin/purposes',
    LEVELS: '/admin/levels',
    PROGRAMS: '/admin/programs',
    EXAM_CITIES: '/admin/exam-cities',
    CATEGORIES: '/admin/categories',
    COLLEGES: '/admin/colleges',
    COLLEGE_LOCATIONS: '/admin/college-locations',
    COLLEGE_GALLERY: '/admin/college-gallery',
    COLLEGE_REVIEWS: '/admin/college-reviews',
    COLLEGE_NEWS: '/admin/college-news',
    COLLEGE_COURSES: '/admin/college-courses',
    COURSE_EXAMS: '/admin/course-exams',
    COURSE_CUTOFFS: '/admin/course-cutoffs',
    COURSE_SUBJECTS: '/admin/course-subjects',
    COLLEGE_FAQS: '/admin/college-faqs',
    INSTITUTES: '/admin/institutes',
    SCHOLARSHIPS: '/admin/scholarships',
    LOANS: '/admin/loans',
    AUTOMATION_EXAMS: '/admin/automation-exams',
    AUTOMATION_EXAMS_FULL: '/admin/automation-exams-full',
    COUNSELLOR: '/admin/counsellor',
    COUNSELLOR_SEARCH: '/admin/counsellor/search',
    COUNSELLOR_RESULTS: '/admin/counsellor/results',
    EXPERTS: '/admin/experts',
    BRANCHES: '/admin/branches',
    REFERRAL_CODES: '/admin/referral-codes',
    /** Stream + interest → programs / exams recommendations (admin Excel) */
    RECOMMENDED_MAPPINGS: '/admin/recommended-mappings',
  },

  // Strength endpoints (user-facing)
  STRENGTH: {
    PAYMENT_STATUS: '/strength/payment-status',
    FORM_DATA: '/strength/form-data',
    PAY: '/strength/pay',
    RESULTS: '/strength/results',
  },

  // Referral endpoints (user-facing)
  REFERRAL: {
    MY_CODE: '/referral/my-code',
    GENERATE_MY_CODE: '/referral/generate-my-code',
    SEND_INVITE: '/referral/send-invite',
    MY_USES: '/referral/my-uses',
  },

  // Public experts endpoint
  EXPERTS: '/experts',

  // Automation endpoints (python-backend at port 8000)
  AUTOMATION: {
    SYNC_USER: '/sync/user',
    START_WORKFLOW: '/workflow/start',
    WORKFLOW_STATUS: '/workflow/status',
    EXAMS: '/exams',
    USERS: '/users',
  },
} as const;

