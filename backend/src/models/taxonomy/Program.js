const db = require('../../config/database');

class Program {
  /**
   * Find all programs
   */
  static async findAll() {
    const result = await db.query(
      'SELECT * FROM programs ORDER BY name ASC'
    );
    return result.rows;
  }

  /**
   * Find active programs only
   */
  static async findActive() {
    const result = await db.query(
      'SELECT * FROM programs WHERE status = TRUE ORDER BY name ASC'
    );
    return result.rows;
  }

  /**
   * Find program by ID
   */
  static async findById(id) {
    const result = await db.query('SELECT * FROM programs WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  /**
   * Find program by name
   */
  static async findByName(name) {
    const result = await db.query('SELECT * FROM programs WHERE name = $1', [name]);
    return result.rows[0] || null;
  }

  /**
   * Create a new program
   */
  static async create(data) {
    const { name, status = true } = data;

    const result = await db.query(
      `INSERT INTO programs (name, status)
       VALUES ($1, $2)
       RETURNING *`,
      [name, status]
    );
    return result.rows[0];
  }

  /**
   * Update a program
   */
  static async update(id, data) {
    const { name, status } = data;

    const updates = [];
    const values = [];
    let paramCount = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(name);
    }
    if (status !== undefined) {
      updates.push(`status = $${paramCount++}`);
      values.push(status);
    }

    if (updates.length === 0) {
      return await this.findById(id);
    }

    values.push(id);
    const result = await db.query(
      `UPDATE programs SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
       WHERE id = $${paramCount} RETURNING *`,
      values
    );
    return result.rows[0] || null;
  }

  /**
   * Delete a program
   */
  static async delete(id) {
    const result = await db.query('DELETE FROM programs WHERE id = $1 RETURNING *', [id]);
    return result.rows[0] || null;
  }
}

module.exports = Program;

