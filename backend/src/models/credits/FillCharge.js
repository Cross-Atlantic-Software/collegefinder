const db = require('../../config/database');

// FillCharge — the "application" entity. One row per application attempt for an exam.
// Lifecycle: active -> completed (final submission) | refunded (cancelled). The partial
// unique index uniq_active_fill_charge guarantees at most one active charge per (user, exam).
class FillCharge {
  static async findActive(userId, examId, client = db) {
    const result = await client.query(
      `SELECT * FROM fill_charges WHERE user_id = $1 AND exam_id = $2 AND status = 'active'`,
      [userId, examId]
    );
    return result.rows[0] || null;
  }

  static async findById(id, client = db) {
    const result = await client.query('SELECT * FROM fill_charges WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  // Lock an active charge row inside a transaction (used by refund/complete paths).
  static async findActiveForUpdate(client, userId, examId) {
    const result = await client.query(
      `SELECT * FROM fill_charges WHERE user_id = $1 AND exam_id = $2 AND status = 'active' FOR UPDATE`,
      [userId, examId]
    );
    return result.rows[0] || null;
  }

  static async findByIdForUpdate(client, id) {
    const result = await client.query(
      `SELECT * FROM fill_charges WHERE id = $1 FOR UPDATE`,
      [id]
    );
    return result.rows[0] || null;
  }

  // Insert an active charge within an existing transaction.
  static async createActive(client, { userId, examId, creditsCharged, debitTxnId }) {
    const result = await client.query(
      `INSERT INTO fill_charges (user_id, exam_id, credits_charged, status, debit_txn_id)
       VALUES ($1, $2, $3, 'active', $4)
       RETURNING *`,
      [userId, examId, creditsCharged, debitTxnId]
    );
    return result.rows[0];
  }

  static async markCompleted(client, id) {
    const result = await client.query(
      `UPDATE fill_charges
          SET status = 'completed', completed_at = CURRENT_TIMESTAMP
        WHERE id = $1 AND status = 'active'
        RETURNING *`,
      [id]
    );
    return result.rows[0] || null;
  }

  static async markRefunded(client, id, refundTxnId) {
    const result = await client.query(
      `UPDATE fill_charges
          SET status = 'refunded', refund_txn_id = $1, refunded_at = CURRENT_TIMESTAMP
        WHERE id = $2 AND status = 'active'
        RETURNING *`,
      [refundTxnId, id]
    );
    return result.rows[0] || null;
  }
}

module.exports = FillCharge;
