const db = require('../../config/database');

class StrengthPayment {
  static async findByUserId(userId) {
    const result = await db.query(
      'SELECT * FROM strength_payments WHERE user_id = $1',
      [userId]
    );
    return result.rows[0] || null;
  }

  static async createOrUpdate(userId, data) {
    const { payment_status, amount } = data;
    const result = await db.query(
      `INSERT INTO strength_payments (user_id, payment_status, amount, paid_at)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id)
       DO UPDATE SET payment_status = $2, amount = $3, paid_at = $4
       RETURNING *`,
      [
        userId,
        payment_status || 'paid',
        amount || null,
        payment_status === 'paid' ? new Date() : null
      ]
    );
    return result.rows[0];
  }

  static async markPaid(userId, amount) {
    return this.createOrUpdate(userId, { payment_status: 'paid', amount });
  }

  static async isPaid(userId) {
    const record = await this.findByUserId(userId);
    return record?.payment_status === 'paid';
  }
}

module.exports = StrengthPayment;
