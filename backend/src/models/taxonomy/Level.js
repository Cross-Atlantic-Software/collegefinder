const db = require('../../config/database');

class Level {
  /**
   * Find all levels
   */
  static async findAll() {
    const result = await db.query(
      'SELECT * FROM levels ORDER BY name ASC'
    );
    return result.rows;
  }

  /**
   * Find active levels only
   */
  static async findActive() {
    const result = await db.query(
      'SELECT * FROM levels WHERE status = TRUE ORDER BY name ASC'
    );
    return result.rows;
  }

  /**
   * Find level by ID
   */
  static async findById(id) {
    const result = await db.query('SELECT * FROM levels WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  /**
   * Find level by name
   */
  static async findByName(name) {
    const result = await db.query('SELECT * FROM levels WHERE name = $1', [name]);
    return result.rows[0] || null;
  }

  /**
   * Create a new level
   */
  static async create(data) {
    const { name, status = true } = data;

    const result = await db.query(
      `INSERT INTO levels (name, status)
       VALUES ($1, $2)
       RETURNING *`,
      [name, status]
    );
    return result.rows[0];
  }

  /**
   * Update a level
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
      `UPDATE levels SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
       WHERE id = $${paramCount} RETURNING *`,
      values
    );
    return result.rows[0] || null;
  }

  /**
   * Delete a level
   */
  static async delete(id) {
    const result = await db.query('DELETE FROM levels WHERE id = $1 RETURNING *', [id]);
    return result.rows[0] || null;
  }
}

module.exports = Level;

