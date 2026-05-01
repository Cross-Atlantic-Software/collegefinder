import { apiRequest, getApiBaseUrl } from '../../client';
import { API_ENDPOINTS } from '../../constants';
import { ApiResponse } from '../../types';

export interface College {
  id: number;
  college_name: string;
  college_location: string | null;
  state?: string | null;
  city?: string | null;
  college_type: string | null;
  college_logo: string | null;
  /** External / spreadsheet image URL; null when logo is S3-only */
  logo_url: string | null;
  website: string | null;
  parent_university?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CollegeDetails {
  id: number;
  college_id: number;
  college_description: string | null;
  major_program_ids: string | null;
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
  branch_course?: string | null;
  program_description?: string | null;
  duration_unit?: string | null;
  key_dates_summary?: string | null;
  fee_per_semester?: number | null;
  total_fee?: number | null;
  placement?: string | null;
  scholarship?: string | null;
  counselling_process?: string | null;
  documents_required?: string | null;
  recommended_exam_ids?: string | null;
  contact_email?: string | null;
  contact_number?: string | null;
  brochure_url?: string | null;
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

/** Included on GET /admin/colleges (full list and paginated responses). */
export interface AdminListPagination {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
}

export type CollegesAdminListPayload = {
  colleges: College[];
  pagination: AdminListPagination;
};

export async function getAllCollegesAdmin(
  params?: { page?: number; perPage?: number; q?: string }
): Promise<ApiResponse<CollegesAdminListPayload>> {
  const searchParams = new URLSearchParams();
  if (params?.page != null) searchParams.set('page', String(params.page));
  if (params?.perPage != null) searchParams.set('perPage', String(params.perPage));
  if (params?.q != null && params.q.trim() !== '') searchParams.set('q', params.q.trim());
  const qs = searchParams.toString();
  return apiRequest(`${API_ENDPOINTS.ADMIN.COLLEGES}${qs ? `?${qs}` : ''}`, { method: 'GET' });
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
  const base = getApiBaseUrl();
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

export async function createCollege(data: Record<string, unknown>): Promise<ApiResponse<{ college: College }>> {
  return apiRequest(API_ENDPOINTS.ADMIN.COLLEGES, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateCollege(
  id: number,
  data: Record<string, unknown>
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

/** @deprecated Sync bulk response; colleges bulk upload is now async — use {@link CollegesBulkUploadQueued}. */
export interface BulkUploadResult {
  /** Total data rows in the Excel sheet (excluding header). */
  totalRows: number;
  created: number;
  createdColleges: { id: number; name: string }[];
  errors: number;
  errorDetails: { row: number; message: string }[];
}

/** Response from POST /colleges/bulk-upload (202 Accepted). */
export interface CollegesBulkUploadQueued {
  jobId: string;
}

export interface CollegesBulkUploadJobStatus {
  total: number;
  processed: number;
  success: number;
  failed: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  hookSummariesQueued: number;
  errorMessage: string | null;
  originalFilename: string | null;
}

export async function downloadCollegesBulkTemplate(): Promise<void> {
  const adminToken = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
  const base = getApiBaseUrl();
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

/** Legacy: same workbook as bulk template (three sheets). Prefer downloadCollegesBulkTemplate. */
export async function downloadCollegesProgramsExcelTemplate(): Promise<void> {
  const adminToken = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
  const base = getApiBaseUrl();
  const url = `${base}${API_ENDPOINTS.ADMIN.COLLEGES}/programs-excel-template`;
  const res = await fetch(url, {
    method: 'GET',
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  if (!res.ok) throw new Error('Failed to download programs template');
  const blob = await res.blob();
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'colleges-programs-excel-template.xlsx';
  a.click();
  URL.revokeObjectURL(a.href);
}

/** Download all colleges data as Excel (Super Admin only) */
export async function downloadAllDataExcel(): Promise<void> {
  const adminToken = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
  const base = getApiBaseUrl();
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

/** Queue async bulk upload; poll {@link getCollegeBulkUploadJobStatus} with returned jobId. */
export async function bulkUploadColleges(
  excelFile: File
): Promise<ApiResponse<{ jobId: string }>> {
  const formData = new FormData();
  formData.append('excel', excelFile);
  const adminToken = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
  const base = getApiBaseUrl();
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

export async function getCollegeBulkUploadJobStatus(
  jobId: string | number
): Promise<ApiResponse<CollegesBulkUploadJobStatus>> {
  return apiRequest(`${API_ENDPOINTS.ADMIN.COLLEGES}/upload-jobs/${jobId}/status`, {
    method: 'GET',
  });
}

export async function downloadCollegeBulkUploadFailuresCsv(jobId: string | number): Promise<void> {
  const adminToken = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
  const base = getApiBaseUrl();
  const url = `${base}${API_ENDPOINTS.ADMIN.COLLEGES}/upload-jobs/${jobId}/failures.csv`;
  const res = await fetch(url, {
    method: 'GET',
    headers: { Authorization: `Bearer ${adminToken}` },
    credentials: 'include',
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data as { message?: string }).message || 'Failed to download failures CSV');
  }
  const blob = await res.blob();
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `college-bulk-job-${jobId}-failures.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
}
