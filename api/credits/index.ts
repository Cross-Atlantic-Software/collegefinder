import { apiRequest } from '../client';
import { API_ENDPOINTS } from '../constants';
import type { ApiResponse } from '../types';

export type CreditTransactionType = 'purchase' | 'deduction' | 'refund';

export type CreditBalance = {
  user_id: number;
  balance: number;
  created_at: string | null;
  updated_at: string | null;
};

export type CreditTransaction = {
  id: number;
  user_id: number;
  type: CreditTransactionType;
  amount: number;
  balance_after: number;
  reference_type: string | null;
  reference_id: number | null;
  description: string | null;
  idempotency_key: string;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type CreditTransactionsResponse = ApiResponse<CreditTransaction[]> & {
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type DeductCreditsResult = {
  alreadyDeducted: boolean;
  amount: number;
  balance: number;
  transaction: CreditTransaction | null;
  exam_name?: string;
  skipped?: boolean;
};

export async function getCreditBalance(): Promise<ApiResponse<CreditBalance>> {
  return apiRequest<CreditBalance>(API_ENDPOINTS.CREDITS.BALANCE, { method: 'GET' });
}

export async function getCreditTransactions(params?: {
  page?: number;
  limit?: number;
}): Promise<CreditTransactionsResponse> {
  const search = new URLSearchParams();
  if (params?.page != null) search.set('page', String(params.page));
  if (params?.limit != null) search.set('limit', String(params.limit));
  const qs = search.toString();
  return apiRequest<CreditTransaction[]>(
    `${API_ENDPOINTS.CREDITS.TRANSACTIONS}${qs ? `?${qs}` : ''}`,
    { method: 'GET' }
  ) as Promise<CreditTransactionsResponse>;
}

export async function purchaseCredits(amount: number): Promise<
  ApiResponse<{
    balance: number;
    transaction: CreditTransaction;
  }>
> {
  return apiRequest(`${API_ENDPOINTS.CREDITS.PURCHASE}`, {
    method: 'POST',
    body: JSON.stringify({ amount }),
  });
}

export async function deductCreditsForRegistration(
  applicationId: number
): Promise<ApiResponse<DeductCreditsResult>> {
  return apiRequest(`${API_ENDPOINTS.CREDITS.DEDUCT_FOR_REGISTRATION}`, {
    method: 'POST',
    body: JSON.stringify({ application_id: applicationId }),
  });
}

export async function refundCreditsForRegistration(
  applicationId: number,
  reason?: string
): Promise<ApiResponse<DeductCreditsResult>> {
  return apiRequest(`${API_ENDPOINTS.CREDITS.REFUND_FOR_REGISTRATION}`, {
    method: 'POST',
    body: JSON.stringify({ application_id: applicationId, reason }),
  });
}
