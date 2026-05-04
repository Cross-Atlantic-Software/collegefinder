const db = require('../../config/database');

class Stream {
  static async getNextSortOrder() {
    const result = await db.query(
      'SELECT COALESCE(MAX(sort_order), -1) + 1 AS n FROM streams'
    );
    return result.rows[0]?.n ?? 0;
  }

  /**
   * Find all streams (with updated_by admin email)
   */
  static async findAll() {
    const result = await db.query(
      `SELECT s.*, a.email as updated_by_email
       FROM streams s
       LEFT JOIN admin_users a ON s.updated_by = a.id
       ORDER BY s.sort_order ASC, s.name ASC, s.id ASC`
    );
    return result.rows;
  }

  /**
   * Find stream by ID (with updated_by admin email)
   */
  static async findById(id) {
    const result = await db.query(
      `SELECT s.*, a.email as updated_by_email
       FROM streams s
       LEFT JOIN admin_users a ON s.updated_by = a.id
       WHERE s.id = $1`,
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
      `SELECT * FROM streams WHERE status = true
       ORDER BY sort_order ASC, name ASC, id ASC`
    );
    return result.rows;
  }

  /**
   * Create a new stream
   */
  static async create(data) {
    const { name, status, updated_by, sort_order } = data;
    let order = sort_order;
    if (order === undefined || order === null) {
      order = await Stream.getNextSortOrder();
    }
    const result = await db.query(
      `INSERT INTO streams (name, status, updated_by, sort_order)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [name, status !== undefined ? status : true, updated_by || null, order]
    );
    return result.rows[0];
  }

  /**
   * Update a stream
   */
  static async update(id, data) {
    const { name, status, updated_by, sort_order } = data;

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
    if (updated_by !== undefined) {
      updates.push(`updated_by = $${paramCount++}`);
      values.push(updated_by);
    }
    if (sort_order !== undefined) {
      updates.push(`sort_order = $${paramCount++}`);
      values.push(sort_order);
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

  /**
   * Delete all streams
   */
  static async deleteAll() {
    const result = await db.query('DELETE FROM streams');
    return result.rowCount || 0;
  }
}

module.exports = Stream;
