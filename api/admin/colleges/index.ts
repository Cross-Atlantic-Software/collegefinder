import { apiRequest } from '../../client';
import { API_ENDPOINTS } from '../../constants';
import { ApiResponse } from '../../types';

export interface College {
  id: number;
  college_name: string;
  college_location: string | null;
  college_type: 'Central' | 'State' | 'Private' | 'Deemed' | null;
  college_logo: string | null;
  created_at: string;
  updated_at: string;
}

export interface CollegeDetails {
  id: number;
  college_id: number;
  college_description: string | null;
  created_at: string;
  updated_at: string;
}

export interface CollegeProgram {
  id?: number;
  college_id?: number;
  program_id: number;
  program_name?: string;
  intake_capacity: number | null;
  duration_years?: number | null;
  created_at?: string;
  previousCutoffs?: { exam_id?: number; exam_name?: string; branch?: string; category?: string; cutoff_rank?: number; year?: number }[];
  expectedCutoffs?: { exam_id?: number; exam_name?: string; branch?: string; category?: string; expected_rank?: number; year?: number }[];
  seatMatrix?: { branch?: string; category?: string; seat_count?: number; year?: number }[];
}

export interface CollegeKeyDate {
  id: number;
  college_id: number;
  event_name: string | null;
  event_date: string | null;
  created_at: string;
}

export interface CollegeDocumentRequired {
  id: number;
  college_id: number;
  document_name: string | null;
  created_at: string;
}

export interface CollegeCounsellingStep {
  id: number;
  college_id: number;
  step_number: number | null;
  description: string | null;
  created_at: string;
}

export interface CollegeWithDetails extends College {
  collegeDetails: CollegeDetails | null;
  collegePrograms: CollegeProgram[];
  collegeKeyDates: CollegeKeyDate[];
  collegeDocumentsRequired: CollegeDocumentRequired[];
  collegeCounsellingProcess: CollegeCounsellingStep[];
  recommendedExamIds: number[];
}

export async function getAllCollegesAdmin(): Promise<ApiResponse<{ colleges: College[] }>> {
  return apiRequest(API_ENDPOINTS.ADMIN.COLLEGES, { method: 'GET' });
}

export async function getCollegeById(id: number): Promise<ApiResponse<{
  college: College;
  collegeDetails: CollegeDetails | null;
  collegePrograms: CollegeProgram[];
  collegeKeyDates: CollegeKeyDate[];
  collegeDocumentsRequired: CollegeDocumentRequired[];
  collegeCounsellingProcess: CollegeCounsellingStep[];
  recommendedExamIds: number[];
}>> {
  return apiRequest(`${API_ENDPOINTS.ADMIN.COLLEGES}/${id}`, { method: 'GET' });
}

export async function uploadCollegeLogo(file: File): Promise<ApiResponse<{ logoUrl: string }>> {
  const formData = new FormData();
  formData.append('image', file);
  const adminToken = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
  const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';
  const url = `${base}${API_ENDPOINTS.ADMIN.COLLEGES}/upload-logo`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: formData,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to upload logo');
  return data;
}

export async function createCollege(data: {
  college_name: string;
  college_location?: string | null;
  college_type?: 'Central' | 'State' | 'Private' | 'Deemed' | null;
  college_logo?: string | null;
  college_description?: string | null;
  collegePrograms?: CollegeProgram[];
  collegeKeyDates?: { event_name?: string; event_date?: string }[];
  collegeDocumentsRequired?: { document_name?: string }[];
  collegeCounsellingProcess?: { step_number?: number; description?: string }[];
  recommendedExamIds?: number[];
  recommendedExamNames?: string[];
}): Promise<ApiResponse<{ college: College }>> {
  return apiRequest(API_ENDPOINTS.ADMIN.COLLEGES, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateCollege(
  id: number,
  data: {
    college_name?: string;
    college_location?: string | null;
    college_type?: 'Central' | 'State' | 'Private' | 'Deemed' | null;
    college_logo?: string | null;
    college_description?: string | null;
    collegePrograms?: CollegeProgram[];
    collegeKeyDates?: { event_name?: string; event_date?: string }[];
    collegeDocumentsRequired?: { document_name?: string }[];
    collegeCounsellingProcess?: { step_number?: number; description?: string }[];
    recommendedExamIds?: number[];
    recommendedExamNames?: string[];
  }
): Promise<ApiResponse<{ college: College }>> {
  return apiRequest(`${API_ENDPOINTS.ADMIN.COLLEGES}/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteCollege(id: number): Promise<ApiResponse<null>> {
  return apiRequest(`${API_ENDPOINTS.ADMIN.COLLEGES}/${id}`, { method: 'DELETE' });
}

export async function deleteAllColleges(): Promise<ApiResponse<{ message: string }>> {
  return apiRequest(`${API_ENDPOINTS.ADMIN.COLLEGES}/all`, { method: 'DELETE' });
}

export interface BulkUploadResult {
  created: number;
  createdColleges: { id: number; name: string }[];
  errors: number;
  errorDetails: { row: number; message: string }[];
}

export async function downloadCollegesBulkTemplate(): Promise<void> {
  const adminToken = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
  const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';
  const url = `${base}${API_ENDPOINTS.ADMIN.COLLEGES}/bulk-upload-template`;
  const res = await fetch(url, {
    method: 'GET',
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  if (!res.ok) throw new Error('Failed to download template');
  const blob = await res.blob();
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'colleges-bulk-template.xlsx';
  a.click();
  URL.revokeObjectURL(a.href);
}

/** Download all colleges data as Excel (Super Admin only) */
export async function downloadAllDataExcel(): Promise<void> {
  const adminToken = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
  const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';
  const url = `${base}${API_ENDPOINTS.ADMIN.COLLEGES}/download-excel`;
  const res = await fetch(url, {
    method: 'GET',
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  if (!res.ok) throw new Error('Failed to download Excel');
  const blob = await res.blob();
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'colleges-all-data.xlsx';
  a.click();
  URL.revokeObjectURL(a.href);
}

export interface UploadMissingLogosResult {
  updated: { id: number; college_name: string; logo_filename?: string }[];
  skipped: string[];
  errors: { file: string; message: string }[];
  summary: { logosAdded: number; filesSkipped: number; uploadErrors: number };
}

export async function uploadMissingLogosColleges(logosZipFile: File): Promise<ApiResponse<UploadMissingLogosResult>> {
  const formData = new FormData();
  formData.append('logos_zip', logosZipFile);
  const adminToken = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
  const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';
  const url = `${base}${API_ENDPOINTS.ADMIN.COLLEGES}/upload-missing-logos`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: formData,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to upload missing logos');
  return data;
}

export async function bulkUploadColleges(
  excelFile: File,
  logoFiles: File[] = [],
  logosZipFile: File | null = null
): Promise<ApiResponse<BulkUploadResult>> {
  const formData = new FormData();
  formData.append('excel', excelFile);
  if (logosZipFile) {
    formData.append('logos_zip', logosZipFile);
  } else {
    logoFiles.forEach((file) => formData.append('logos', file));
  }
  const adminToken = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
  const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';
  const url = `${base}${API_ENDPOINTS.ADMIN.COLLEGES}/bulk-upload`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: formData,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Bulk upload failed');
  return data;
}
