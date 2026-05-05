const db = require('../config/database');

class UserQuery {
  static async create({ user_id, name, email, phone, query_type, description }) {
    const result = await db.query(
      `INSERT INTO user_queries (user_id, name, email, phone, query_type, description)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, user_id, name, email, phone, query_type, description, status, created_at`,
      [user_id, name, email, phone || null, query_type, description]
    );
    return result.rows[0];
  }

  static async getAllForAdmin() {
    const result = await db.query(
      `SELECT
         q.id,
         q.user_id,
         q.name,
         q.email,
         q.phone,
         q.query_type,
         q.description,
         q.status,
         q.admin_answer,
         q.resolved_at,
         q.resolved_by_admin_id,
         q.created_at,
         q.updated_at,
         a.email AS resolved_by_admin_email
       FROM user_queries q
       LEFT JOIN admin_users a ON a.id = q.resolved_by_admin_id
       ORDER BY
         CASE WHEN q.status = 'open' THEN 0 ELSE 1 END,
         q.created_at DESC`
    );
    return result.rows;
  }

  static async resolve({ id, admin_answer, resolved_by_admin_id }) {
    const result = await db.query(
      `UPDATE user_queries
       SET
         status = 'resolved',
         admin_answer = $2,
         resolved_by_admin_id = $3,
         resolved_at = CURRENT_TIMESTAMP,
         updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING
         id,
         user_id,
         name,
         email,
         phone,
         query_type,
         description,
         status,
         admin_answer,
         resolved_at,
         resolved_by_admin_id,
         created_at,
         updated_at`,
      [id, admin_answer, resolved_by_admin_id]
    );
    return result.rows[0] || null;
  }
}

module.exports = UserQuery;
