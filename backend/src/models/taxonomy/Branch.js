const db = require('../../config/database');

class Branch {
  static async findAll() {
    const result = await db.query('SELECT * FROM branches ORDER BY name ASC');
    return result.rows;
  }

  static async findActive() {
    const result = await db.query('SELECT * FROM branches WHERE status = TRUE ORDER BY name ASC');
    return result.rows;
  }

  static async findById(id) {
    const result = await db.query('SELECT * FROM branches WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  static async findByName(name) {
    const result = await db.query('SELECT * FROM branches WHERE name = $1', [name]);
    return result.rows[0] || null;
  }

  static async findByNameCaseInsensitive(name) {
    const result = await db.query('SELECT * FROM branches WHERE LOWER(TRIM(name)) = LOWER(TRIM($1))', [name]);
    return result.rows[0] || null;
  }

  static async create(data) {
    const { name, description, status = true } = data;
    const result = await db.query(
      `INSERT INTO branches (name, description, status) VALUES ($1, $2, $3) RETURNING *`,
      [name, description || null, status]
    );
    return result.rows[0];
  }

  static async update(id, data) {
    const { name, description, status } = data;
    const updates = [];
    const values = [];
    let paramCount = 1;
    if (name !== undefined) { updates.push(`name = $${paramCount++}`); values.push(name); }
    if (description !== undefined) { updates.push(`description = $${paramCount++}`); values.push(description); }
    if (status !== undefined) { updates.push(`status = $${paramCount++}`); values.push(status); }
    if (updates.length === 0) return await this.findById(id);
    values.push(id);
    const result = await db.query(
      `UPDATE branches SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${paramCount} RETURNING *`,
      values
    );
    return result.rows[0] || null;
  }

  static async delete(id) {
    const result = await db.query('DELETE FROM branches WHERE id = $1 RETURNING *', [id]);
    return result.rows[0] || null;
  }
}

module.exports = Branch;
