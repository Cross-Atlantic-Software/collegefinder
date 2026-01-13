const db = require('../../config/database');

class Coaching {
  /**
   * Find all coachings
   */
  static async findAll() {
    const result = await db.query(
      'SELECT * FROM coachings ORDER BY name ASC'
    );
    return result.rows;
  }

  /**
   * Find coaching by ID
   */
  static async findById(id) {
    const result = await db.query('SELECT * FROM coachings WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  /**
   * Find coaching by name
   */
  static async findByName(name) {
    const result = await db.query('SELECT * FROM coachings WHERE name = $1', [name]);
    return result.rows[0] || null;
  }

  /**
   * Create a new coaching
   */
  static async create(data) {
    const { name, logo, description } = data;

    const result = await db.query(
      'INSERT INTO coachings (name, logo, description) VALUES ($1, $2, $3) RETURNING *',
      [name, logo || null, description || null]
    );
    return result.rows[0];
  }

  /**
   * Update a coaching
   */
  static async update(id, data) {
    const { name, logo, description } = data;

    const updates = [];
    const values = [];
    let paramCount = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(name);
    }
    if (logo !== undefined) {
      updates.push(`logo = $${paramCount++}`);
      values.push(logo);
    }
    if (description !== undefined) {
      updates.push(`description = $${paramCount++}`);
      values.push(description);
    }

    if (updates.length === 0) {
      return await this.findById(id);
    }

    values.push(id);
    const result = await db.query(
      `UPDATE coachings SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${paramCount} RETURNING *`,
      values
    );
    return result.rows[0] || null;
  }

  /**
   * Delete a coaching
   */
  static async delete(id) {
    const result = await db.query('DELETE FROM coachings WHERE id = $1 RETURNING *', [id]);
    return result.rows[0] || null;
  }
}

module.exports = Coaching;
