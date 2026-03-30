import { apiRequest } from '../../client';
import { API_ENDPOINTS } from '../../constants';
import { ApiResponse } from '../../types';

export interface Institute {
  id: number;
  institute_name: string;
  institute_location: string | null;
  type: 'offline' | 'online' | 'hybrid' | null;
  logo: string | null;
  website: string | null;
  contact_number: string | null;
  /** Comma/semicolon/space-separated emails for referral sends (admin). */
  referral_contact_email: string | null;
  referral_code: string | null;
  created_at: string;
  updated_at: string;
}

export interface InstituteDetails {
  id: number;
  institute_id: number;
  institute_description: string | null;
  demo_available: boolean;
  scholarship_available: boolean;
  created_at: string;
  updated_at: string;
}

export interface InstituteStatistics {
  id: number;
  institute_id: number;
  ranking_score: number | null;
  success_rate: number | null;
  student_rating: number | null;
  updated_at: string;
}

export interface InstituteCourse {
  id: number;
  institute_id: number;
  course_name: string | null;
  target_class: string | null;
  duration_months: number | null;
  fees: number | null;
  batch_size: number | null;
  start_date: string | null;
  created_at: string;
}

export interface InstituteWithDetails extends Institute {
  instituteDetails: InstituteDetails | null;
  examIds: number[];
  specializationExamIds: number[];
  instituteStatistics: InstituteStatistics | null;
  instituteCourses: InstituteCourse[];
}

export async function getAllInstitutesAdmin(): Promise<ApiResponse<{ institutes: Institute[] }>> {
  return apiRequest(API_ENDPOINTS.ADMIN.INSTITUTES, { method: 'GET' });
}

export interface ReferralEmailPreview {
  subject: string;
  defaultRecipients: string[];
}

export async function getInstituteById(id: number): Promise<ApiResponse<{
  institute: Institute;
  instituteDetails: InstituteDetails | null;
  examIds: number[];
  examNames?: string[];
  specializationExamIds: number[];
  specializationExamNames?: string[];
  instituteStatistics: InstituteStatistics | null;
  instituteCourses: InstituteCourse[];
  referralEmailPreview: ReferralEmailPreview | null;
}>> {
  return apiRequest(`${API_ENDPOINTS.ADMIN.INSTITUTES}/${id}`, { method: 'GET' });
}

export async function sendInstituteReferralEmail(
  id: number,
  body?: { recipients?: string[] }
): Promise<ApiResponse<{ sent: string[]; failed: string[] }>> {
  return apiRequest(`${API_ENDPOINTS.ADMIN.INSTITUTES}/${id}/send-referral-email`, {
    method: 'POST',
    body: JSON.stringify(body ?? {}),
  });
}

export async function uploadInstituteLogo(file: File): Promise<ApiResponse<{ logoUrl: string }>> {
  const formData = new FormData();
  formData.append('image', file);
  const adminToken = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
  const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';
  const url = `${base}${API_ENDPOINTS.ADMIN.INSTITUTES}/upload-logo`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: formData,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to upload logo');
  return data;
}

export async function createInstitute(data: {
  institute_name: string;
  institute_location?: string | null;
  type?: 'offline' | 'online' | 'hybrid' | null;
  logo?: string | null;
  website?: string | null;
  contact_number?: string | null;
  referral_contact_email?: string | null;
  institute_description?: string | null;
  demo_available?: boolean;
  scholarship_available?: boolean;
  examIds?: number[];
  specializationExamIds?: number[];
  ranking_score?: number | null;
  success_rate?: number | null;
  student_rating?: number | null;
  instituteCourses?: Partial<InstituteCourse>[];
}): Promise<ApiResponse<{ institute: Institute }>> {
  return apiRequest(API_ENDPOINTS.ADMIN.INSTITUTES, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateInstitute(
  id: number,
  data: {
    institute_name?: string;
    institute_location?: string | null;
    type?: 'offline' | 'online' | 'hybrid' | null;
    logo?: string | null;
    website?: string | null;
    contact_number?: string | null;
    referral_contact_email?: string | null;
    institute_description?: string | null;
    demo_available?: boolean;
    scholarship_available?: boolean;
    examIds?: number[];
    specializationExamIds?: number[];
    ranking_score?: number | null;
    success_rate?: number | null;
    student_rating?: number | null;
    instituteCourses?: Partial<InstituteCourse>[];
  }
): Promise<ApiResponse<{ institute: Institute }>> {
  return apiRequest(`${API_ENDPOINTS.ADMIN.INSTITUTES}/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteInstitute(id: number): Promise<ApiResponse<null>> {
  return apiRequest(`${API_ENDPOINTS.ADMIN.INSTITUTES}/${id}`, { method: 'DELETE' });
}

export async function deleteAllInstitutes(): Promise<ApiResponse<{ message: string }>> {
  return apiRequest(`${API_ENDPOINTS.ADMIN.INSTITUTES}/all`, { method: 'DELETE' });
}

export interface InstitutesBulkUploadResult {
  created: number;
  createdInstitutes: { id: number; name: string }[];
  errors: number;
  errorDetails: { row: number; message: string }[];
}

export interface UploadMissingLogosResult {
  updated: { id: number; institute_name: string; logo_filename?: string }[];
  skipped: string[];
  errors: { file: string; message: string }[];
  summary: { logosAdded: number; filesSkipped: number; uploadErrors: number };
}

export async function uploadMissingLogosInstitutes(logosZipFile: File): Promise<ApiResponse<UploadMissingLogosResult>> {
  const formData = new FormData();
  formData.append('logos_zip', logosZipFile);
  const adminToken = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
  const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';
  const url = `${base}${API_ENDPOINTS.ADMIN.INSTITUTES}/upload-missing-logos`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: formData,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to upload missing logos');
  return data;
}

export async function downloadInstitutesBulkTemplate(): Promise<void> {
  const adminToken = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
  const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';
  const url = `${base}${API_ENDPOINTS.ADMIN.INSTITUTES}/bulk-upload-template`;
  const res = await fetch(url, {
    method: 'GET',
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  if (!res.ok) throw new Error('Failed to download template');
  const blob = await res.blob();
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'institutes-bulk-template.xlsx';
  a.click();
  URL.revokeObjectURL(a.href);
}

/** Download all institutes data as Excel (Super Admin only) */
export async function downloadAllDataExcel(): Promise<void> {
  const adminToken = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
  const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';
  const url = `${base}${API_ENDPOINTS.ADMIN.INSTITUTES}/download-excel`;
  const res = await fetch(url, {
    method: 'GET',
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  if (!res.ok) throw new Error('Failed to download Excel');
  const blob = await res.blob();
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'institutes-all-data.xlsx';
  a.click();
  URL.revokeObjectURL(a.href);
}

export async function bulkUploadInstitutes(
  excelFile: File,
  logoFiles: File[] = [],
  logosZipFile: File | null = null
): Promise<ApiResponse<InstitutesBulkUploadResult>> {
  const formData = new FormData();
  formData.append('excel', excelFile);
  if (logosZipFile) {
    formData.append('logos_zip', logosZipFile);
  } else {
    logoFiles.forEach((file) => formData.append('logos', file));
  }
  const adminToken = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
  const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';
  const url = `${base}${API_ENDPOINTS.ADMIN.INSTITUTES}/bulk-upload`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: formData,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Bulk upload failed');
  return data;
}
