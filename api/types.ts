/**
 * Shared API types and interfaces
 */

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: Array<{ msg: string; param: string }>;
}

/**
 * User (site user) types
 */
export interface User {
  id: number;
  email: string;
  name?: string;
  profile_photo?: string | null;
  onboarding_completed?: boolean;
  createdAt: string;
  lastLogin?: string;
}

export interface SendOTPResponse {
  email: string;
  expiresIn: number;
}

export interface VerifyOTPResponse {
  user: {
    id: number;
    email: string;
    name: string | null;
    onboarding_completed?: boolean;
    createdAt: string;
  };
  token: string;
}

/**
 * Site User (regular user) interface for admin panel
 */
export interface SiteUser {
  id: number;
  email: string;
  name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  date_of_birth?: string | null;
  gender?: string | null;
  phone_number?: string | null;
  state?: string | null;
  district?: string | null;
  profile_photo?: string | null;
  email_verified: boolean;
  auth_provider: string;
  created_at: string;
  last_login?: string | null;
  is_active: boolean;
}

export interface GetAllUsersResponse {
  users: SiteUser[];
  total: number;
}

/**
 * Admin types
 */
export interface AdminUser {
  id: number;
  email: string;
  type: 'super_admin' | 'user';
  is_active: boolean;
  created_at: string;
  last_login?: string;
  created_by?: number;
}

export interface AdminLoginResponse {
  admin: {
    id: number;
    email: string;
    type: string;
  };
  token: string;
}

export interface GetAllAdminsResponse {
  admins: AdminUser[];
  total: number;
}

/**
 * Email Template types
 */
export interface EmailTemplate {
  id: number;
  type: string;
  subject: string;
  body_html: string;
  created_at: string;
  updated_at: string;
}

export interface GetAllEmailTemplatesResponse {
  templates: EmailTemplate[];
  total: number;
}

