const crypto = require('crypto');
const db = require('../../config/database');

// CreditLedger — the single chokepoint through which every balance change flows.
//
// Invariants this enforces:
//   1. A ledger row (credit_transactions) and the wallet balance update happen in the
//      SAME transaction. Callers MUST run applyDelta inside withTransaction.
//   2. balance_after on the ledger row always equals the post-update wallet balance.
//   3. balance never goes negative (the wallet CHECK also guards this; we fail early
//      with a typed error so callers can map it to HTTP 402).
//
// The wallet row is locked FOR UPDATE so concurrent debits/credits serialize correctly.

class InsufficientCreditsError extends Error {
  constructor(balance, needed) {
    super('Insufficient credits');
    this.name = 'InsufficientCreditsError';
    this.code = 'INSUFFICIENT_CREDITS';
    this.balance = balance;
    this.needed = needed;
    this.shortfall = Math.max(0, needed - balance);
  }
}

// Run fn(client) inside a BEGIN/COMMIT, rolling back on any throw. Returns fn's result.
async function withTransaction(fn) {
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    try {
      await client.query('ROLLBACK');
    } catch (_) {
      /* ignore rollback failure */
    }
    throw err;
  } finally {
    client.release();
  }
}

// Map our internal kinds to main's credit_transactions.type enum {purchase, deduction,
// refund}. Direction (credit-in vs credit-out) is carried by `type`; `amount` is always
// positive (main's CHECK (amount > 0)). Positive admin adjustments map to 'refund' (credits
// granted without payment); negative to 'deduction'. reference_type='admin' keeps the audit.
function toCanonicalType(type, delta) {
  switch (type) {
    case 'purchase':     return 'purchase';                          // delta > 0
    case 'refund':       return 'refund';                            // delta > 0
    case 'fill_debit':   return 'deduction';                         // delta < 0
    case 'admin_adjust': return delta >= 0 ? 'refund' : 'deduction';
    default:             return type; // unknown → main's CHECK rejects (fail loud)
  }
}

// Apply a signed delta to a user's wallet and write the matching ledger row.
// MUST be called with a client that is already inside a transaction.
//   delta > 0 credits (purchase/refund/admin_adjust+), delta < 0 debits (fill_debit).
// Returns { balance_after, transaction }.
async function applyDelta(client, { userId, delta, type, refType = null, refId = null, note = null, idempotencyKey = null }) {
  // Ensure the wallet exists, then lock it for the balance read-modify-write.
  await client.query(
    'INSERT INTO credit_wallets (user_id, balance) VALUES ($1, 0) ON CONFLICT (user_id) DO NOTHING',
    [userId]
  );
  const walletRes = await client.query(
    'SELECT balance FROM credit_wallets WHERE user_id = $1 FOR UPDATE',
    [userId]
  );
  const currentBalance = walletRes.rows[0].balance;
  const newBalance = currentBalance + delta;

  if (newBalance < 0) {
    throw new InsufficientCreditsError(currentBalance, -delta);
  }

  await client.query(
    'UPDATE credit_wallets SET balance = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2',
    [newBalance, userId]
  );

  // main's schema: signed delta→positive amount (direction carried by type),
  // ref_type→reference_type, ref_id→reference_id, note→description; idempotency_key is
  // NOT NULL UNIQUE (default to a generated UUID); metadata relies on its '{}' default.
  const txnRes = await client.query(
    `INSERT INTO credit_transactions
       (user_id, type, amount, balance_after, reference_type, reference_id, description, idempotency_key)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [userId, toCanonicalType(type, delta), Math.abs(delta), newBalance, refType, refId, note, idempotencyKey || crypto.randomUUID()]
  );

  return { balance_after: newBalance, transaction: txnRes.rows[0] };
}

module.exports = { withTransaction, applyDelta, InsufficientCreditsError };
