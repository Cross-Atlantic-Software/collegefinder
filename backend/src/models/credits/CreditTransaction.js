const { pool } = require('../../config/database');

class CreditTransaction {
  static formatRow(row) {
    if (!row) return null;
    return {
      id: row.id,
      user_id: row.user_id,
      type: row.type,
      amount: Number(row.amount),
      balance_after: Number(row.balance_after),
      reference_type: row.reference_type,
      reference_id: row.reference_id,
      description: row.description,
      idempotency_key: row.idempotency_key,
      metadata: row.metadata || {},
      created_at: row.created_at,
    };
  }

  static formatAdminRow(row) {
    const base = this.formatRow(row);
    if (!base) return null;
    const displayName =
      row.user_name?.trim() ||
      [row.first_name, row.last_name].filter(Boolean).join(' ').trim() ||
      null;
    return {
      ...base,
      user_email: row.user_email || null,
      user_name: displayName,
    };
  }

  static async findByIdempotencyKey(client, idempotencyKey) {
    const result = await client.query(
      `SELECT *
       FROM credit_transactions
       WHERE idempotency_key = $1`,
      [idempotencyKey]
    );
    return this.formatRow(result.rows[0]);
  }

  static async create(client, data) {
    const {
      user_id,
      type,
      amount,
      balance_after,
      reference_type = null,
      reference_id = null,
      description = null,
      idempotency_key,
      metadata = {},
    } = data;

    const result = await client.query(
      `INSERT INTO credit_transactions (
         user_id, type, amount, balance_after,
         reference_type, reference_id, description,
         idempotency_key, metadata
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb)
       RETURNING *`,
      [
        user_id,
        type,
        amount,
        balance_after,
        reference_type,
        reference_id,
        description,
        idempotency_key,
        JSON.stringify(metadata),
      ]
    );

    return this.formatRow(result.rows[0]);
  }

  static async listByUserId(userId, { page = 1, limit = 20 } = {}) {
    const safePage = Math.max(Number(page) || 1, 1);
    const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);
    const offset = (safePage - 1) * safeLimit;

    const [rowsResult, countResult] = await Promise.all([
      pool.query(
        `SELECT *
         FROM credit_transactions
         WHERE user_id = $1
         ORDER BY created_at DESC, id DESC
         LIMIT $2 OFFSET $3`,
        [userId, safeLimit, offset]
      ),
      pool.query(
        `SELECT COUNT(*)::int AS total
         FROM credit_transactions
         WHERE user_id = $1`,
        [userId]
      ),
    ]);

    const total = countResult.rows[0]?.total ?? 0;

    return {
      transactions: rowsResult.rows.map((row) => this.formatRow(row)),
      pagination: {
        page: safePage,
        limit: safeLimit,
        total,
        totalPages: total === 0 ? 0 : Math.ceil(total / safeLimit),
      },
    };
  }

  static async listAllAdmin({ userId = null, page = 1, limit = 10 } = {}) {
    const safePage = Math.max(Number(page) || 1, 1);
    const safeLimit = Math.min(Math.max(Number(limit) || 10, 1), 100);
    const offset = (safePage - 1) * safeLimit;

    const conditions = [];
    const params = [];
    let paramCount = 1;

    if (userId != null && userId !== '') {
      const uid = Number(userId);
      if (Number.isInteger(uid) && uid > 0) {
        conditions.push(`ct.user_id = $${paramCount++}`);
        params.push(uid);
      }
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const listParams = [...params, safeLimit, offset];
    const countParams = [...params];

    const [rowsResult, countResult] = await Promise.all([
      pool.query(
        `SELECT
           ct.*,
           u.email AS user_email,
           u.name AS user_name,
           u.first_name,
           u.last_name
         FROM credit_transactions ct
         LEFT JOIN users u ON u.id = ct.user_id
         ${whereClause}
         ORDER BY ct.created_at DESC, ct.id DESC
         LIMIT $${paramCount++} OFFSET $${paramCount}`,
        listParams
      ),
      pool.query(
        `SELECT COUNT(*)::int AS total
         FROM credit_transactions ct
         ${whereClause}`,
        countParams
      ),
    ]);

    const total = countResult.rows[0]?.total ?? 0;

    return {
      transactions: rowsResult.rows.map((row) => this.formatAdminRow(row)),
      pagination: {
        page: safePage,
        limit: safeLimit,
        total,
        totalPages: total === 0 ? 0 : Math.ceil(total / safeLimit),
      },
    };
  }

  static async findDeductionForApplication(client, applicationId) {
    const result = await client.query(
      `SELECT *
       FROM credit_transactions
       WHERE type = 'deduction'
         AND reference_type = 'automation_application'
         AND reference_id = $1
       ORDER BY id DESC
       LIMIT 1`,
      [applicationId]
    );
    return this.formatRow(result.rows[0]);
  }

  static async findRefundForApplication(client, applicationId) {
    const result = await client.query(
      `SELECT *
       FROM credit_transactions
       WHERE type = 'refund'
         AND reference_type = 'automation_application'
         AND reference_id = $1
       ORDER BY id DESC
       LIMIT 1`,
      [applicationId]
    );
    return this.formatRow(result.rows[0]);
  }
}

module.exports = CreditTransaction;
