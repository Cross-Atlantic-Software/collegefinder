const db = require('../../config/database');

// CreditPack — purchasable credit packs. price_inr is the all-in displayed price.
class CreditPack {
  static async listActive() {
    const result = await db.query(
      'SELECT * FROM credit_packs WHERE is_active = TRUE ORDER BY sort_order ASC, id ASC'
    );
    return result.rows;
  }

  static async listAll() {
    const result = await db.query('SELECT * FROM credit_packs ORDER BY sort_order ASC, id ASC');
    return result.rows;
  }

  static async findById(id) {
    const result = await db.query('SELECT * FROM credit_packs WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  static async create({ name, credits, price_inr, is_active = true, sort_order = 0 }) {
    const result = await db.query(
      `INSERT INTO credit_packs (name, credits, price_inr, is_active, sort_order)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [name, credits, price_inr, is_active, sort_order]
    );
    return result.rows[0];
  }

  static async update(id, fields) {
    const allowed = ['name', 'credits', 'price_inr', 'is_active', 'sort_order'];
    const sets = [];
    const params = [];
    let i = 1;
    for (const key of allowed) {
      if (fields[key] !== undefined) {
        sets.push(`${key} = $${i++}`);
        params.push(fields[key]);
      }
    }
    if (sets.length === 0) return this.findById(id);
    sets.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);
    const result = await db.query(
      `UPDATE credit_packs SET ${sets.join(', ')} WHERE id = $${i} RETURNING *`,
      params
    );
    return result.rows[0] || null;
  }

  static async remove(id) {
    const result = await db.query('DELETE FROM credit_packs WHERE id = $1 RETURNING id', [id]);
    return result.rowCount > 0;
  }
}

module.exports = CreditPack;
