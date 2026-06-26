import { apiRequest } from '../client';
import { API_ENDPOINTS } from '../constants';
import type { ApiResponse } from '../types';
import type { CreditTransaction, CreditTransactionType } from '../credits';

/**
 * Admin Credits API — credit packs CRUD, global payment (GST) settings, and the
 * orders/transactions reconciliation views, plus super-admin wallet-adjust and
 * fill-charge refund. apiRequest attaches the admin token for /admin routes.
 * Field names mirror backend/src/controllers/admin/adminCreditController.js.
 */

export type GstMode = 'inclusive' | 'exclusive';

export interface CreditPackAdmin {
  id: number;
  name: string;
  credits: number;
  price_inr: number;
  is_active: boolean;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
}

export interface PaymentSettings {
  id: number;
  gst_mode: GstMode;
  gst_percent: number;
  currency: string;
}

export interface CreditOrderAdmin {
  id: number;
  user_id: number;
  pack_id: number | null;
  credits: number;
  gst_mode: GstMode;
  gst_percent: number;
  base_amount: number;
  gst_amount: number;
  total_amount: number;
  amount_paise: number;
  currency: string;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  invoice_number: string | null;
  status: string;
  paid_at: string | null;
  created_at: string;
  user_name: string | null;
  user_email: string | null;
}

export interface CreditTransactionAdmin {
  id: number;
  user_id: number;
  delta: number;
  type: string;
  balance_after: number;
  ref_type: string | null;
  ref_id: number | null;
  note: string | null;
  created_at: string;
  user_name: string | null;
  user_email: string | null;
}

export interface CreditPackInput {
  name: string;
  credits: number;
  price_inr: number;
  is_active?: boolean;
  sort_order?: number;
}

function qs(params: Record<string, string | number | undefined | null>): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') sp.set(k, String(v));
  }
  const s = sp.toString();
  return s ? `?${s}` : '';
}

/* ── Packs ── */

export function listPacks(): Promise<ApiResponse<CreditPackAdmin[]>> {
  return apiRequest('/admin/credit-packs');
}

export function createPack(input: CreditPackInput): Promise<ApiResponse<CreditPackAdmin>> {
  return apiRequest('/admin/credit-packs', { method: 'POST', body: JSON.stringify(input) });
}

export function updatePack(
  id: number,
  input: Partial<CreditPackInput>
): Promise<ApiResponse<CreditPackAdmin>> {
  return apiRequest(`/admin/credit-packs/${id}`, { method: 'PUT', body: JSON.stringify(input) });
}

export function deletePack(id: number): Promise<ApiResponse<null>> {
  return apiRequest(`/admin/credit-packs/${id}`, { method: 'DELETE' });
}

/* ── Payment settings ── */

export function getPaymentSettings(): Promise<ApiResponse<PaymentSettings>> {
  return apiRequest('/admin/payment-settings');
}

export function updatePaymentSettings(
  input: Partial<Pick<PaymentSettings, 'gst_mode' | 'gst_percent'>>
): Promise<ApiResponse<PaymentSettings>> {
  return apiRequest('/admin/payment-settings', { method: 'PUT', body: JSON.stringify(input) });
}

/* ── Reconciliation ── */

export function listCreditOrders(
  params: { user_id?: number; status?: string; limit?: number; offset?: number } = {}
): Promise<ApiResponse<CreditOrderAdmin[]>> {
  return apiRequest(`/admin/credit-orders${qs(params)}`);
}

export function listCreditTransactions(
  params: { user_id?: number; type?: string; limit?: number; offset?: number } = {}
): Promise<ApiResponse<CreditTransactionAdmin[]>> {
  return apiRequest(`/admin/credit-transactions${qs(params)}`);
}

/* ── Super-admin actions ── */

export function adjustWallet(
  userId: number,
  delta: number,
  note?: string
): Promise<ApiResponse<{ user_id: number; delta: number; balance: number }>> {
  return apiRequest(`/admin/credit-wallets/${userId}/adjust`, {
    method: 'POST',
    body: JSON.stringify({ delta, note }),
  });
}

export function refundFillCharge(
  chargeId: number
): Promise<ApiResponse<{ charge_id: number; status: string }>> {
  return apiRequest(`/admin/fill-charges/${chargeId}/refund`, { method: 'POST' });
}

/* ── Credit ledger (admin reconciliation view) ── */

export type AdminCreditLedgerTransaction = CreditTransaction & {
  user_email: string | null;
  user_name: string | null;
};

export type AdminCreditLedgerResponse = ApiResponse<AdminCreditLedgerTransaction[]> & {
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export async function getAdminCreditLedger(params?: {
  page?: number;
  limit?: number;
  user_id?: number | string;
}): Promise<AdminCreditLedgerResponse> {
  const search = new URLSearchParams();
  if (params?.page != null) search.set('page', String(params.page));
  if (params?.limit != null) search.set('limit', String(params.limit));
  if (params?.user_id != null && String(params.user_id).trim() !== '') {
    search.set('user_id', String(params.user_id).trim());
  }
  const query = search.toString();
  return apiRequest<AdminCreditLedgerTransaction[]>(
    `${API_ENDPOINTS.ADMIN.CREDITS_LEDGER}${query ? `?${query}` : ''}`,
    { method: 'GET' }
  ) as Promise<AdminCreditLedgerResponse>;
}

export type { CreditTransactionType };
