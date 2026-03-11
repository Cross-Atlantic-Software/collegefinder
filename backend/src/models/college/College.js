const db = require('../../config/database');

class College {
  static async findAll() {
    const result = await db.query(
      'SELECT * FROM colleges ORDER BY college_name ASC'
    );
    return result.rows;
  }

  static async findById(id) {
    const result = await db.query(
      'SELECT * FROM colleges WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  static async findByIds(ids) {
    if (!ids || !Array.isArray(ids) || ids.length === 0) return [];
    const validIds = ids.map(id => parseInt(id, 10)).filter(n => !isNaN(n));
    if (validIds.length === 0) return [];
    const result = await db.query(
      'SELECT * FROM colleges WHERE id = ANY($1::int[]) ORDER BY college_name ASC',
      [validIds]
    );
    return result.rows;
  }

  static async findByName(name) {
    const result = await db.query(
      'SELECT * FROM colleges WHERE LOWER(college_name) = LOWER($1)',
      [name]
    );
    return result.rows[0] || null;
  }

  static async create(data) {
    const { college_name, college_location, college_type, college_logo } = data;
    const result = await db.query(
      `INSERT INTO colleges (college_name, college_location, college_type, college_logo)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [college_name, college_location || null, college_type || null, college_logo || null]
    );
    return result.rows[0];
  }

  static async update(id, data) {
    const { college_name, college_location, college_type, college_logo } = data;
    const updates = [];
    const values = [];
    let paramCount = 1;
    if (college_name !== undefined) {
      updates.push(`college_name = $${paramCount++}`);
      values.push(college_name);
    }
    if (college_location !== undefined) {
      updates.push(`college_location = $${paramCount++}`);
      values.push(college_location);
    }
    if (college_type !== undefined) {
      updates.push(`college_type = $${paramCount++}`);
      values.push(college_type);
    }
    if (college_logo !== undefined) {
      updates.push(`college_logo = $${paramCount++}`);
      values.push(college_logo);
    }
    if (updates.length === 0) return await this.findById(id);
    values.push(id);
    const result = await db.query(
      `UPDATE colleges SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
       WHERE id = $${paramCount} RETURNING *`,
      values
    );
    return result.rows[0] || null;
  }

  static async delete(id) {
    const result = await db.query(
      'DELETE FROM colleges WHERE id = $1 RETURNING *',
      [id]
    );
    return result.rows[0] || null;
  }
}

module.exports = College;
