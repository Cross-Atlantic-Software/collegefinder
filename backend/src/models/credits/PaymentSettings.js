const db = require('../../config/database');

// PaymentSettings — single global config row (id=1). Holds the inclusive/exclusive GST
// toggle and the GST percent used by gstMath.
class PaymentSettings {
  static async get() {
    const result = await db.query('SELECT * FROM payment_settings WHERE id = 1');
    // The migration seeds id=1; fall back to defaults defensively.
    return result.rows[0] || { id: 1, gst_mode: 'inclusive', gst_percent: 18.0, currency: 'INR' };
  }

  static async update({ gst_mode, gst_percent }) {
    const sets = [];
    const params = [];
    let i = 1;
    if (gst_mode === 'inclusive' || gst_mode === 'exclusive') {
      sets.push(`gst_mode = $${i++}`);
      params.push(gst_mode);
    }
    if (typeof gst_percent === 'number' && !Number.isNaN(gst_percent)) {
      sets.push(`gst_percent = $${i++}`);
      params.push(gst_percent);
    }
    if (sets.length === 0) return this.get();
    sets.push('updated_at = CURRENT_TIMESTAMP');
    const result = await db.query(
      `UPDATE payment_settings SET ${sets.join(', ')} WHERE id = 1 RETURNING *`,
      params
    );
    return result.rows[0];
  }
}

module.exports = PaymentSettings;
