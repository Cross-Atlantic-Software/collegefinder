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
    FACEBOOK_AUTH: '/auth/facebook',
    FACEBOOK_CALLBACK: '/auth/facebook/callback',
    ME: '/auth/me',
    PROFILE: '/auth/profile',
    PROFILE_BASIC: '/auth/profile/basic',
    PROFILE_ACADEMICS: '/auth/profile/academics',
    PROFILE_SUBJECTS: '/auth/profile/subjects',
    PROFILE_TOPICS: '/auth/profile/topics',
    PROFILE_CAREER_GOALS: '/auth/profile/career-goals',
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
    COACHINGS: '/admin/coachings',
    COACHING_LOCATIONS: '/admin/coaching-locations',
    COACHING_GALLERY: '/admin/coaching-gallery',
    COACHING_COURSES: '/admin/coaching-courses',
    AUTOMATION_EXAMS: '/admin/automation-exams',
    AUTOMATION_EXAMS_FULL: '/admin/automation-exams-full',
  },

  // Automation endpoints (python-backend at port 8000)
  AUTOMATION: {
    SYNC_USER: '/sync/user',
    START_WORKFLOW: '/workflow/start',
    WORKFLOW_STATUS: '/workflow/status',
    EXAMS: '/exams',
    USERS: '/users',
  },
} as const;

