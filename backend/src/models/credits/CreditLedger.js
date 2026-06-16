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

// Apply a signed delta to a user's wallet and write the matching ledger row.
// MUST be called with a client that is already inside a transaction.
//   delta > 0 credits (purchase/refund/admin_adjust+), delta < 0 debits (fill_debit).
// Returns { balance_after, transaction }.
async function applyDelta(client, { userId, delta, type, refType = null, refId = null, note = null }) {
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

  const txnRes = await client.query(
    `INSERT INTO credit_transactions (user_id, delta, type, balance_after, ref_type, ref_id, note)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [userId, delta, type, newBalance, refType, refId, note]
  );

  return { balance_after: newBalance, transaction: txnRes.rows[0] };
}

module.exports = { withTransaction, applyDelta, InsufficientCreditsError };
