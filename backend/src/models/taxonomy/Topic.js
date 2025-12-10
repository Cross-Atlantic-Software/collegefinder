const db = require('../../config/database');

class Topic {
  /**
   * Find all topics
   */
  static async findAll() {
    const result = await db.query(
      'SELECT * FROM topics ORDER BY sort_order ASC, name ASC'
    );
    return result.rows;
  }

  /**
   * Find topic by ID
   */
  static async findById(id) {
    const result = await db.query('SELECT * FROM topics WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  /**
   * Find topics by subject ID
   */
  static async findBySubjectId(subjectId) {
    const result = await db.query(
      'SELECT * FROM topics WHERE sub_id = $1 ORDER BY sort_order ASC, name ASC',
      [subjectId]
    );
    return result.rows;
  }

  /**
   * Find active topics
   */
  static async findActive() {
    const result = await db.query(
      'SELECT * FROM topics WHERE status = TRUE ORDER BY sort_order ASC, name ASC'
    );
    return result.rows;
  }

  /**
   * Find topics for home display
   */
  static async findHomeDisplay() {
    const result = await db.query(
      'SELECT * FROM topics WHERE status = TRUE AND home_display = TRUE ORDER BY sort_order ASC, name ASC'
    );
    return result.rows;
  }

  /**
   * Find topic by name and subject ID
   */
  static async findByNameAndSubjectId(name, subjectId) {
    const result = await db.query(
      'SELECT * FROM topics WHERE name = $1 AND sub_id = $2',
      [name, subjectId]
    );
    return result.rows[0] || null;
  }

  /**
   * Create a new topic
   */
  static async create(data) {
    const {
      sub_id,
      name,
      thumbnail,
      home_display = false,
      status = true,
      description,
      sort_order = 0
    } = data;

    const result = await db.query(
      `INSERT INTO topics (sub_id, name, thumbnail, home_display, status, description, sort_order)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [sub_id, name, thumbnail || null, home_display, status, description || null, sort_order]
    );
    return result.rows[0];
  }

  /**
   * Update a topic
   */
  static async update(id, data) {
    const {
      sub_id,
      name,
      thumbnail,
      home_display,
      status,
      description,
      sort_order
    } = data;

    const updates = [];
    const values = [];
    let paramCount = 1;

    if (sub_id !== undefined) {
      updates.push(`sub_id = $${paramCount++}`);
      values.push(sub_id);
    }
    if (name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(name);
    }
    if (thumbnail !== undefined) {
      updates.push(`thumbnail = $${paramCount++}`);
      values.push(thumbnail);
    }
    if (home_display !== undefined) {
      updates.push(`home_display = $${paramCount++}`);
      values.push(home_display);
    }
    if (status !== undefined) {
      updates.push(`status = $${paramCount++}`);
      values.push(status);
    }
    if (description !== undefined) {
      updates.push(`description = $${paramCount++}`);
      values.push(description);
    }
    if (sort_order !== undefined) {
      updates.push(`sort_order = $${paramCount++}`);
      values.push(sort_order);
    }

    if (updates.length === 0) {
      return await this.findById(id);
    }

    values.push(id);
    const result = await db.query(
      `UPDATE topics SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
       WHERE id = $${paramCount} RETURNING *`,
      values
    );
    return result.rows[0] || null;
  }

  /**
   * Delete a topic
   */
  static async delete(id) {
    const result = await db.query('DELETE FROM topics WHERE id = $1 RETURNING *', [id]);
    return result.rows[0] || null;
  }
}

module.exports = Topic;

