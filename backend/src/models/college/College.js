const db = require('../../config/database');

class College {
  /**
   * Find all colleges
   */
  static async findAll() {
    const result = await db.query(
      'SELECT * FROM colleges ORDER BY ranking ASC NULLS LAST, name ASC'
    );
    return result.rows;
  }

  /**
   * Find college by ID
   */
  static async findById(id) {
    const result = await db.query('SELECT * FROM colleges WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  /**
   * Find college by name
   */
  static async findByName(name) {
    const result = await db.query('SELECT * FROM colleges WHERE name = $1', [name]);
    return result.rows[0] || null;
  }

  /**
   * Create a new college
   */
  static async create(data) {
    const { name, ranking, description, logo_url } = data;

    const result = await db.query(
      `INSERT INTO colleges (name, ranking, description, logo_url)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [name, ranking || null, description || null, logo_url || null]
    );
    return result.rows[0];
  }

  /**
   * Update a college
   */
  static async update(id, data) {
    const { name, ranking, description, logo_url } = data;

    const updates = [];
    const values = [];
    let paramCount = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(name);
    }
    if (ranking !== undefined) {
      updates.push(`ranking = $${paramCount++}`);
      values.push(ranking || null);
    }
    if (description !== undefined) {
      updates.push(`description = $${paramCount++}`);
      values.push(description || null);
    }
    if (logo_url !== undefined) {
      updates.push(`logo_url = $${paramCount++}`);
      values.push(logo_url || null);
    }

    if (updates.length === 0) {
      return await this.findById(id);
    }

    values.push(id);
    const result = await db.query(
      `UPDATE colleges SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
       WHERE id = $${paramCount} RETURNING *`,
      values
    );
    return result.rows[0] || null;
  }

  /**
   * Delete a college
   */
  static async delete(id) {
    const result = await db.query('DELETE FROM colleges WHERE id = $1 RETURNING *', [id]);
    return result.rows[0] || null;
  }
}

module.exports = College;

