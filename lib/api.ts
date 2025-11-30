const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: Array<{ msg: string; param: string }>;
}

export interface SendOTPResponse {
  email: string;
  expiresIn: number;
}

export interface VerifyOTPResponse {
  user: {
    id: number;
    email: string;
    createdAt: string;
  };
  token: string;
}

export interface User {
  id: number;
  email: string;
  createdAt: string;
  lastLogin?: string;
}

/**
 * Generic API fetch function with error handling
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json',
  };

  // Add auth token if available (check both user and admin tokens)
  if (typeof window !== 'undefined') {
    const userToken = localStorage.getItem('auth_token');
    const adminToken = localStorage.getItem('admin_token');
    const token = adminToken || userToken; // Admin token takes precedence for admin routes
    if (token) {
      defaultHeaders['Authorization'] = `Bearer ${token}`;
    }
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    });

    // Check if response is ok before trying to parse JSON
    let data;
    try {
      const text = await response.text();
      data = text ? JSON.parse(text) : {};
    } catch (parseError) {
      // If JSON parsing fails, return a more helpful error
      return {
        success: false,
        message: response.status === 0 
          ? 'Cannot connect to server. Please make sure the backend server is running on http://localhost:5001'
          : `Server error (${response.status}): Invalid response format`,
      };
    }

    if (!response.ok) {
      return {
        success: false,
        message: data.message || `Server error (${response.status})`,
        errors: data.errors,
      };
    }

    return {
      success: true,
      ...data,
    };
  } catch (error) {
    console.error('API request error:', error);
    
    // Provide more specific error messages
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return {
        success: false,
        message: 'Cannot connect to server. Please make sure the backend server is running on http://localhost:5001',
      };
    }
    
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Network error occurred',
    };
  }
}

/**
 * Send OTP to email
 */
export async function sendOTP(email: string): Promise<ApiResponse<SendOTPResponse>> {
  return apiRequest<SendOTPResponse>('/auth/send-otp', {
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
  return apiRequest<VerifyOTPResponse>('/auth/verify-otp', {
    method: 'POST',
    body: JSON.stringify({ email, code }),
  });
}

/**
 * Resend OTP
 */
export async function resendOTP(email: string): Promise<ApiResponse<SendOTPResponse>> {
  return apiRequest<SendOTPResponse>('/auth/resend-otp', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

/**
 * Get current authenticated user
 */
export async function getCurrentUser(): Promise<ApiResponse<{ user: User }>> {
  return apiRequest<{ user: User }>('/auth/me', {
    method: 'GET',
  });
}

/**
 * Site User (regular user) interface for admin panel
 */
export interface SiteUser {
  id: number;
  email: string;
  name?: string;
  email_verified: boolean;
  auth_provider: string;
  created_at: string;
  last_login?: string;
  is_active: boolean;
}

export interface GetAllUsersResponse {
  users: SiteUser[];
  total: number;
}

/**
 * Get all registered users (Admin only)
 */
export async function getAllUsers(): Promise<ApiResponse<GetAllUsersResponse>> {
  return apiRequest<GetAllUsersResponse>('/admin/users', {
    method: 'GET',
  });
}

/**
 * Get user by ID (Admin only)
 */
export async function getUserById(id: number): Promise<ApiResponse<{ user: SiteUser }>> {
  return apiRequest<{ user: SiteUser }>(`/admin/users/${id}`, {
    method: 'GET',
  });
}

/**
 * Create user (Admin only)
 */
export async function createUser(
  email: string,
  name?: string
): Promise<ApiResponse<{ user: SiteUser }>> {
  return apiRequest<{ user: SiteUser }>('/admin/users', {
    method: 'POST',
    body: JSON.stringify({ email, name }),
  });
}

/**
 * Update user (Admin only)
 */
export async function updateUser(
  id: number,
  data: { email?: string; name?: string; email_verified?: boolean; is_active?: boolean }
): Promise<ApiResponse<{ user: SiteUser }>> {
  return apiRequest<{ user: SiteUser }>(`/admin/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

/**
 * Delete user (Admin only)
 */
export async function deleteUser(id: number): Promise<ApiResponse<void>> {
  return apiRequest<void>(`/admin/users/${id}`, {
    method: 'DELETE',
  });
}

/**
 * Admin API functions
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
 * Admin login
 */
export async function adminLogin(
  email: string,
  password: string
): Promise<ApiResponse<AdminLoginResponse>> {
  return apiRequest<AdminLoginResponse>('/admin/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

/**
 * Get current admin
 */
export async function getCurrentAdmin(): Promise<ApiResponse<{ admin: AdminUser }>> {
  return apiRequest<{ admin: AdminUser }>('/admin/me', {
    method: 'GET',
  });
}

/**
 * Get all admin users (Super Admin only)
 */
export async function getAllAdmins(): Promise<ApiResponse<GetAllAdminsResponse>> {
  return apiRequest<GetAllAdminsResponse>('/admin/admins', {
    method: 'GET',
  });
}

/**
 * Create admin user (Super Admin only)
 */
export async function createAdmin(
  email: string,
  password: string,
  type: 'user' | 'super_admin' = 'user'
): Promise<ApiResponse<{ admin: AdminUser }>> {
  return apiRequest<{ admin: AdminUser }>('/admin/admins', {
    method: 'POST',
    body: JSON.stringify({ email, password, type }),
  });
}

/**
 * Update admin user (Super Admin only)
 */
export async function updateAdmin(
  id: number,
  data: { type?: 'user' | 'super_admin'; is_active?: boolean }
): Promise<ApiResponse<{ admin: AdminUser }>> {
  return apiRequest<{ admin: AdminUser }>(`/admin/admins/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

/**
 * Delete admin user (Super Admin only)
 */
export async function deleteAdmin(id: number): Promise<ApiResponse<void>> {
  return apiRequest<void>(`/admin/admins/${id}`, {
    method: 'DELETE',
  });
}

/**
 * Email Template API functions
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

/**
 * Get all email templates
 */
export async function getAllEmailTemplates(): Promise<ApiResponse<GetAllEmailTemplatesResponse>> {
  return apiRequest<GetAllEmailTemplatesResponse>('/admin/email-templates', {
    method: 'GET',
  });
}

/**
 * Get email template by ID
 */
export async function getEmailTemplateById(id: number): Promise<ApiResponse<{ template: EmailTemplate }>> {
  return apiRequest<{ template: EmailTemplate }>(`/admin/email-templates/${id}`, {
    method: 'GET',
  });
}

/**
 * Create email template (Super Admin only)
 */
export async function createEmailTemplate(
  type: string,
  subject: string,
  body_html: string
): Promise<ApiResponse<{ template: EmailTemplate }>> {
  return apiRequest<{ template: EmailTemplate }>('/admin/email-templates', {
    method: 'POST',
    body: JSON.stringify({ type, subject, body_html }),
  });
}

/**
 * Update email template (Super Admin only)
 */
export async function updateEmailTemplate(
  id: number,
  subject: string,
  body_html: string
): Promise<ApiResponse<{ template: EmailTemplate }>> {
  return apiRequest<{ template: EmailTemplate }>(`/admin/email-templates/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ subject, body_html }),
  });
}

/**
 * Delete email template (Super Admin only)
 */
export async function deleteEmailTemplate(id: number): Promise<ApiResponse<void>> {
  return apiRequest<void>(`/admin/email-templates/${id}`, {
    method: 'DELETE',
  });
}

