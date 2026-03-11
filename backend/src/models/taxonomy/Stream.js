const db = require('../../config/database');

class Stream {
  /**
   * Find all streams
   */
  static async findAll() {
    const result = await db.query(
      'SELECT * FROM streams ORDER BY name ASC'
    );
    return result.rows;
  }

  /**
   * Find stream by ID
   */
  static async findById(id) {
    const result = await db.query(
      'SELECT * FROM streams WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  /**
   * Find stream by name
   */
  static async findByName(name) {
    const result = await db.query(
      'SELECT * FROM streams WHERE LOWER(name) = LOWER($1)',
      [name]
    );
    return result.rows[0] || null;
  }

  /**
   * Find active streams only
   */
  static async findActive() {
    const result = await db.query(
      'SELECT * FROM streams WHERE status = true ORDER BY name ASC'
    );
    return result.rows;
  }

  /**
   * Create a new stream
   */
  static async create(data) {
    const { name, status } = data;
    const result = await db.query(
      'INSERT INTO streams (name, status) VALUES ($1, $2) RETURNING *',
      [name, status !== undefined ? status : true]
    );
    return result.rows[0];
  }

  /**
   * Update a stream
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
      UPDATE streams 
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await db.query(query, values);
    return result.rows[0] || null;
  }

  /**
   * Delete a stream
   */
  static async delete(id) {
    const result = await db.query(
      'DELETE FROM streams WHERE id = $1 RETURNING *',
      [id]
    );
    return result.rows[0] || null;
  }
}

module.exports = Stream;


