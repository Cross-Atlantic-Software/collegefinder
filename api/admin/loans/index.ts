import { apiRequest } from '../../client';
import { API_ENDPOINTS } from '../../constants';
import { ApiResponse } from '../../types';

export interface LoanProvider {
  id: number;
  provider_name: string;
  provider_type: string | null;
  interest_rate_min: number | null;
  interest_rate_max: number | null;
  processing_fee: string | null;
  max_loan_amount: string | null;
  moratorium_period_months: number | null;
  repayment_duration_years: number | null;
  collateral_required: boolean;
  coapplicant_required: boolean;
  tax_benefit_available: boolean;
  official_website_link: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  description: string | null;
  logo: string | null;
  created_at: string;
  updated_at: string;
}

export interface LoanDisbursementStep {
  id: number;
  loan_provider_id: number;
  step_number: number | null;
  description: string | null;
  created_at?: string;
}

export interface LoanEligibleCountry {
  id: number;
  loan_provider_id: number;
  country_name: string | null;
  created_at?: string;
}

export interface LoanEligibleCourseType {
  id: number;
  loan_provider_id: number;
  course_type: string | null;
  created_at?: string;
}

export async function getAllLoanProvidersAdmin(): Promise<ApiResponse<{ loanProviders: LoanProvider[] }>> {
  return apiRequest(API_ENDPOINTS.ADMIN.LOANS, { method: 'GET' });
}

export async function getLoanProviderById(id: number): Promise<ApiResponse<{
  loanProvider: LoanProvider;
  disbursementProcess: LoanDisbursementStep[];
  eligibleCountries: LoanEligibleCountry[];
  eligibleCourseTypes: LoanEligibleCourseType[];
}>> {
  return apiRequest(`${API_ENDPOINTS.ADMIN.LOANS}/${id}`, { method: 'GET' });
}

export async function uploadLoanProviderLogo(file: File): Promise<ApiResponse<{ logoUrl: string }>> {
  const formData = new FormData();
  formData.append('image', file);
  const adminToken = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
  const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';
  const url = `${base}${API_ENDPOINTS.ADMIN.LOANS}/upload-logo`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: formData,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to upload logo');
  return data;
}

export async function createLoanProvider(data: {
  provider_name: string;
  provider_type?: string | null;
  interest_rate_min?: number | null;
  interest_rate_max?: number | null;
  processing_fee?: string | null;
  max_loan_amount?: string | null;
  moratorium_period_months?: number | null;
  repayment_duration_years?: number | null;
  collateral_required?: boolean;
  coapplicant_required?: boolean;
  tax_benefit_available?: boolean;
  official_website_link?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  description?: string | null;
  logo?: string | null;
  disbursementProcess?: { step_number?: number; description?: string }[];
  eligibleCountries?: { country_name?: string }[];
  eligibleCourseTypes?: { course_type?: string }[];
}): Promise<ApiResponse<{ loanProvider: LoanProvider }>> {
  return apiRequest(API_ENDPOINTS.ADMIN.LOANS, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateLoanProvider(
  id: number,
  data: {
    provider_name?: string;
    provider_type?: string | null;
    interest_rate_min?: number | null;
    interest_rate_max?: number | null;
    processing_fee?: string | null;
    max_loan_amount?: string | null;
    moratorium_period_months?: number | null;
    repayment_duration_years?: number | null;
    collateral_required?: boolean;
    coapplicant_required?: boolean;
    tax_benefit_available?: boolean;
    official_website_link?: string | null;
    contact_email?: string | null;
    contact_phone?: string | null;
    description?: string | null;
    logo?: string | null;
    disbursementProcess?: { step_number?: number; description?: string }[];
    eligibleCountries?: { country_name?: string }[];
    eligibleCourseTypes?: { course_type?: string }[];
  }
): Promise<ApiResponse<{ loanProvider: LoanProvider }>> {
  return apiRequest(`${API_ENDPOINTS.ADMIN.LOANS}/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteLoanProvider(id: number): Promise<ApiResponse<null>> {
  return apiRequest(`${API_ENDPOINTS.ADMIN.LOANS}/${id}`, { method: 'DELETE' });
}

export async function deleteAllLoanProviders(): Promise<ApiResponse<{ message: string }>> {
  return apiRequest(`${API_ENDPOINTS.ADMIN.LOANS}/all`, { method: 'DELETE' });
}

export interface LoansBulkUploadResult {
  created: number;
  createdLoanProviders: { id: number; name: string }[];
  errors: number;
  errorDetails: { row: number; message: string }[];
}

export async function downloadLoanProvidersBulkTemplate(): Promise<void> {
  const adminToken = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
  const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';
  const url = `${base}${API_ENDPOINTS.ADMIN.LOANS}/bulk-upload-template`;
  const res = await fetch(url, {
    method: 'GET',
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  if (!res.ok) throw new Error('Failed to download template');
  const blob = await res.blob();
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'loan-providers-bulk-template.xlsx';
  a.click();
  URL.revokeObjectURL(a.href);
}

/** Download all loan providers data as Excel (Super Admin only) */
export async function downloadAllDataExcel(): Promise<void> {
  const adminToken = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
  const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';
  const url = `${base}${API_ENDPOINTS.ADMIN.LOANS}/download-excel`;
  const res = await fetch(url, {
    method: 'GET',
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  if (!res.ok) throw new Error('Failed to download Excel');
  const blob = await res.blob();
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'loan-providers-all-data.xlsx';
  a.click();
  URL.revokeObjectURL(a.href);
}

export interface UploadMissingLogosResult {
  updated: { id: number; provider_name: string; logo_filename?: string }[];
  skipped: string[];
  errors: { file: string; message: string }[];
  summary: { logosAdded: number; filesSkipped: number; uploadErrors: number };
}

export async function uploadMissingLogosLoanProviders(logosZipFile: File): Promise<ApiResponse<UploadMissingLogosResult>> {
  const formData = new FormData();
  formData.append('logos_zip', logosZipFile);
  const adminToken = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
  const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';
  const url = `${base}${API_ENDPOINTS.ADMIN.LOANS}/upload-missing-logos`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: formData,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to upload missing logos');
  return data;
}

export async function bulkUploadLoanProviders(
  excelFile: File,
  logoFiles: File[] = [],
  logosZipFile: File | null = null
): Promise<ApiResponse<LoansBulkUploadResult>> {
  const formData = new FormData();
  formData.append('excel', excelFile);
  if (logosZipFile) {
    formData.append('logos_zip', logosZipFile);
  } else {
    logoFiles.forEach((file) => formData.append('logos', file));
  }
  const adminToken = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
  const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';
  const url = `${base}${API_ENDPOINTS.ADMIN.LOANS}/bulk-upload`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: formData,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Bulk upload failed');
  return data;
}

/** All lenders in one call — slow; prefer getScrapedLoanBanks + getScrapedLoanBySlug. */
export async function getScrapedLoans(): Promise<any> {
  return apiRequest(
    `${API_ENDPOINTS.ADMIN.LOANS}/scraped`,
    { method: 'GET' },
    { timeout: 120000 }
  );
}

export interface ScrapedLoanBankMeta {
  name: string;
  slug: string;
}

export async function getScrapedLoanBanks(): Promise<any> {
  return apiRequest(`${API_ENDPOINTS.ADMIN.LOANS}/scraped/banks`, { method: 'GET' }, { timeout: 15000 });
}

export async function getScrapedLoanBySlug(slug: string): Promise<any> {
  const enc = encodeURIComponent(slug);
  return apiRequest(
    `${API_ENDPOINTS.ADMIN.LOANS}/scraped/bank/${enc}`,
    { method: 'GET' },
    { timeout: 60000 }
  );
}

export async function downloadScrapedLoansExcel(): Promise<void> {
  const adminToken = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
  const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';
  const url = `${base}${API_ENDPOINTS.ADMIN.LOANS}/scraped/download-excel`;
  const res = await fetch(url, {
    method: 'GET',
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  if (!res.ok) throw new Error('Failed to download scraped Excel');
  const blob = await res.blob();
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'loan-scraped-data.xlsx';
  a.click();
  URL.revokeObjectURL(a.href);
}
