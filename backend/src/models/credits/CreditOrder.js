const db = require('../../config/database');

// CreditOrder — a Razorpay purchase. Created at 'created', flipped to 'paid' (idempotently)
// once a valid signature is verified. The UNIQUE(razorpay_payment_id) DB constraint is the
// ultimate double-credit guard; status checks here are the fast path.
class CreditOrder {
  static async create(fields) {
    const {
      user_id, pack_id, credits, gst_mode, gst_percent,
      base_amount, gst_amount, total_amount, amount_paise,
      currency = 'INR', razorpay_order_id
    } = fields;
    const result = await db.query(
      `INSERT INTO credit_orders
         (user_id, pack_id, credits, gst_mode, gst_percent, base_amount, gst_amount,
          total_amount, amount_paise, currency, razorpay_order_id, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'created')
       RETURNING *`,
      [user_id, pack_id, credits, gst_mode, gst_percent, base_amount, gst_amount,
        total_amount, amount_paise, currency, razorpay_order_id]
    );
    return result.rows[0];
  }

  static async findById(id) {
    const result = await db.query('SELECT * FROM credit_orders WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  static async findByRazorpayOrderId(razorpayOrderId, client = db) {
    const result = await client.query(
      'SELECT * FROM credit_orders WHERE razorpay_order_id = $1',
      [razorpayOrderId]
    );
    return result.rows[0] || null;
  }

  // Lock the order row inside a transaction (used by the idempotent credit path).
  static async findByRazorpayOrderIdForUpdate(client, razorpayOrderId) {
    const result = await client.query(
      'SELECT * FROM credit_orders WHERE razorpay_order_id = $1 FOR UPDATE',
      [razorpayOrderId]
    );
    return result.rows[0] || null;
  }

  // Mark an order paid within an existing transaction. Returns the updated row.
  static async markPaid(client, { id, razorpay_payment_id, razorpay_signature, invoice_number }) {
    const result = await client.query(
      `UPDATE credit_orders
          SET status = 'paid',
              razorpay_payment_id = $1,
              razorpay_signature = $2,
              invoice_number = $3,
              paid_at = CURRENT_TIMESTAMP
        WHERE id = $4
        RETURNING *`,
      [razorpay_payment_id, razorpay_signature, invoice_number, id]
    );
    return result.rows[0];
  }

  static async markFailed(id) {
    const result = await db.query(
      `UPDATE credit_orders SET status = 'failed' WHERE id = $1 AND status = 'created' RETURNING *`,
      [id]
    );
    return result.rows[0] || null;
  }

  // Admin reconciliation list (joins user identity).
  static async listForAdmin({ user_id, status, limit = 50, offset = 0 }) {
    const where = [];
    const params = [];
    let i = 1;
    if (user_id) { where.push(`co.user_id = $${i++}`); params.push(user_id); }
    if (status) { where.push(`co.status = $${i++}`); params.push(status); }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    params.push(limit, offset);
    const result = await db.query(
      `SELECT co.*, u.name AS user_name, u.email AS user_email
         FROM credit_orders co
         LEFT JOIN users u ON u.id = co.user_id
         ${whereSql}
        ORDER BY co.created_at DESC
        LIMIT $${i++} OFFSET $${i}`,
      params
    );
    return result.rows;
  }
}

module.exports = CreditOrder;
