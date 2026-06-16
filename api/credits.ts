import { apiRequest } from './client';

/**
 * Credits API — the student-facing wallet, credit packs, Razorpay checkout and
 * receipts. apiRequest attaches the user's auth_token automatically for
 * non-/admin routes. Field names mirror the Phase-1 backend contracts exactly
 * (backend/src/controllers/credits/creditController.js).
 */

export type GstMode = 'inclusive' | 'exclusive';

/** A single row from the credit_transactions ledger. */
export interface CreditTransaction {
  id: number;
  user_id: number;
  /** Signed: positive = credited (purchase/refund), negative = debited (fill). */
  delta: number;
  type: string;
  balance_after: number;
  ref_type: string | null;
  ref_id: number | null;
  note: string | null;
  created_at: string; // ISO
}

export interface Wallet {
  balance: number;
  recent_transactions: CreditTransaction[];
}

/** A purchasable credit pack with server-computed GST breakdown. */
export interface CreditPack {
  id: number;
  name: string;
  credits: number;
  price_inr: number;
  /** Pre-tax amount (₹). */
  base: number;
  /** GST amount (₹). */
  gst: number;
  /** All-in amount the student pays (₹). */
  total: number;
  gst_mode: GstMode;
  gst_percent: number;
}

export interface CreateOrderResponse {
  order_id: number;
  razorpay_order_id: string;
  /** Amount in paise — pass straight to Razorpay checkout. */
  amount_paise: number;
  currency: string;
  /** Public Razorpay key, returned by the server (no frontend env var needed). */
  key_id: string;
  pack: { id: number; name: string; credits: number };
}

export interface VerifyOrderPayload {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export interface VerifyOrderResponse {
  order_id: number;
  invoice_number: string;
  credits: number;
  balance: number;
}

export interface Receipt {
  invoice_number: string;
  order_id: number;
  paid_at: string; // ISO
  credits: number;
  pack_name: string;
  gst_mode: GstMode;
  gst_percent: number;
  base_amount: number;
  gst_amount: number;
  total_amount: number;
  currency: string;
  /** Legal fields — TODO_* placeholders until configured (see §6 of the plan). */
  legal: {
    legal_entity_name: string;
    gstin: string;
    hsn_sac: string;
  };
}

export interface TransactionsQuery {
  limit?: number;
  offset?: number;
  type?: string;
}

/** GET /api/credits/wallet — balance + last 10 transactions. */
export async function getWallet() {
  return apiRequest<Wallet>('/credits/wallet');
}

/** GET /api/credits/packs — purchasable packs with GST breakdown. */
export async function getPacks() {
  return apiRequest<CreditPack[]>('/credits/packs');
}

/** POST /api/credits/orders — create a Razorpay order for a pack. */
export async function createOrder(packId: number) {
  return apiRequest<CreateOrderResponse>('/credits/orders', {
    method: 'POST',
    body: JSON.stringify({ pack_id: packId }),
  });
}

/** POST /api/credits/orders/verify — verify the Razorpay signature and credit the wallet. */
export async function verifyOrder(payload: VerifyOrderPayload) {
  return apiRequest<VerifyOrderResponse>('/credits/orders/verify', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/** GET /api/credits/transactions — the full paginated ledger. */
export async function getTransactions(query: TransactionsQuery = {}) {
  const params = new URLSearchParams();
  if (query.limit != null) params.set('limit', String(query.limit));
  if (query.offset != null) params.set('offset', String(query.offset));
  if (query.type) params.set('type', query.type);
  const qs = params.toString();
  return apiRequest<CreditTransaction[]>(`/credits/transactions${qs ? `?${qs}` : ''}`);
}

/** GET /api/credits/orders/:id/receipt — on-screen receipt for one purchase. */
export async function getReceipt(orderId: number) {
  return apiRequest<Receipt>(`/credits/orders/${orderId}/receipt`);
}
