import { apiRequest } from '../../client';
import { API_ENDPOINTS } from '../../constants';
import type { ApiResponse } from '../../types';
import type { CreditTransaction, CreditTransactionType } from '../../credits';

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
  const qs = search.toString();
  return apiRequest<AdminCreditLedgerTransaction[]>(
    `${API_ENDPOINTS.ADMIN.CREDITS_LEDGER}${qs ? `?${qs}` : ''}`,
    { method: 'GET' }
  ) as Promise<AdminCreditLedgerResponse>;
}

export type { CreditTransactionType };
