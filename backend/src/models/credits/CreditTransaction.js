const db = require('../../config/database');

// CreditTransaction — read access to the append-only ledger. Writes happen only via
// CreditLedger.applyDelta (inside a transaction); this class never inserts.
class CreditTransaction {
  static async recentForUser(userId, limit = 10) {
    const result = await db.query(
      `SELECT * FROM credit_transactions WHERE user_id = $1 ORDER BY created_at DESC, id DESC LIMIT $2`,
      [userId, limit]
    );
    return result.rows;
  }

  static async listForUser(userId, { type, limit = 50, offset = 0 }) {
    const where = ['user_id = $1'];
    const params = [userId];
    let i = 2;
    if (type) { where.push(`type = $${i++}`); params.push(type); }
    params.push(limit, offset);
    const result = await db.query(
      `SELECT * FROM credit_transactions
        WHERE ${where.join(' AND ')}
        ORDER BY created_at DESC, id DESC
        LIMIT $${i++} OFFSET $${i}`,
      params
    );
    return result.rows;
  }

  static async listForAdmin({ user_id, type, limit = 50, offset = 0 }) {
    const where = [];
    const params = [];
    let i = 1;
    if (user_id) { where.push(`ct.user_id = $${i++}`); params.push(user_id); }
    if (type) { where.push(`ct.type = $${i++}`); params.push(type); }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    params.push(limit, offset);
    const result = await db.query(
      `SELECT ct.*, u.name AS user_name, u.email AS user_email
         FROM credit_transactions ct
         LEFT JOIN users u ON u.id = ct.user_id
         ${whereSql}
        ORDER BY ct.created_at DESC, ct.id DESC
        LIMIT $${i++} OFFSET $${i}`,
      params
    );
    return result.rows;
  }
}

module.exports = CreditTransaction;
