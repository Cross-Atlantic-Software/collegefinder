const db = require('../../config/database');

class Module {
  static async findAll() {
    const result = await db.query(
      'SELECT * FROM modules ORDER BY name ASC'
    );
    return result.rows;
  }

  static async findById(id) {
    const result = await db.query(
      'SELECT * FROM modules WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  static async findByCode(code) {
    const result = await db.query(
      'SELECT * FROM modules WHERE code = $1',
      [code]
    );
    return result.rows[0] || null;
  }

  static async findByName(name) {
    const result = await db.query(
      'SELECT * FROM modules WHERE LOWER(name) = LOWER($1)',
      [name]
    );
    return result.rows[0] || null;
  }

  static async create(data) {
    const { name, code } = data;
    const result = await db.query(
      'INSERT INTO modules (name, code) VALUES ($1, $2) RETURNING *',
      [name || null, (code || '').trim().toLowerCase().replace(/\s+/g, '_') || null]
    );
    return result.rows[0];
  }

  static async update(id, data) {
    const { name, code } = data;
    const updates = [];
    const values = [];
    let paramCount = 1;
    if (name !== undefined) { updates.push(`name = $${paramCount++}`); values.push(name); }
    if (code !== undefined) { updates.push(`code = $${paramCount++}`); values.push((code || '').trim().toLowerCase().replace(/\s+/g, '_')); }
    if (updates.length === 0) return await this.findById(id);
    values.push(id);
    const result = await db.query(
      `UPDATE modules SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${paramCount} RETURNING *`,
      values
    );
    return result.rows[0] || null;
  }

  static async delete(id) {
    const result = await db.query(
      'DELETE FROM modules WHERE id = $1 RETURNING *',
      [id]
    );
    return result.rows[0] || null;
  }
}

module.exports = Module;
