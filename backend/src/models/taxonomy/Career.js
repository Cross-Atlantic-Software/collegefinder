const db = require('../../config/database');

class Career {
  /**
   * Find all careers
   */
  static async findAll() {
    const result = await db.query(
      'SELECT * FROM careers ORDER BY name ASC'
    );
    return result.rows;
  }

  /**
   * Find career by ID
   */
  static async findById(id) {
    const result = await db.query(
      'SELECT * FROM careers WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  /**
   * Find career by name
   */
  static async findByName(name) {
    const result = await db.query(
      'SELECT * FROM careers WHERE LOWER(name) = LOWER($1)',
      [name]
    );
    return result.rows[0] || null;
  }

  /**
   * Find active careers only
   */
  static async findActive() {
    const result = await db.query(
      'SELECT * FROM careers WHERE status = true ORDER BY name ASC'
    );
    return result.rows;
  }

  /**
   * Create a new career
   */
  static async create(data) {
    const { name, status } = data;
    const result = await db.query(
      'INSERT INTO careers (name, status) VALUES ($1, $2) RETURNING *',
      [name, status !== undefined ? status : true]
    );
    return result.rows[0];
  }

  /**
   * Update a career
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
      return null;
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const query = `
      UPDATE careers 
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await db.query(query, values);
    return result.rows[0] || null;
  }

  /**
   * Delete a career
   */
  static async delete(id) {
    const result = await db.query(
      'DELETE FROM careers WHERE id = $1 RETURNING *',
      [id]
    );
    return result.rows[0] || null;
  }
}

module.exports = Career;


