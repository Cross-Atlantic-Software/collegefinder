const db = require('../../config/database');

class Program {
  /**
   * Find all programs
   */
  static async findAll() {
    const result = await db.query(
      `SELECT p.*, st.name AS stream_name,
        (
          SELECT COALESCE(string_agg(cg.label, ', ' ORDER BY cg.label), '')
          FROM unnest(COALESCE(p.interest_ids, ARRAY[]::integer[])) AS t(interest_id)
          JOIN career_goals_taxonomies cg ON cg.id = t.interest_id
        ) AS interest_labels
       FROM programs p
       LEFT JOIN streams st ON st.id = p.stream_id
       ORDER BY p.name ASC`
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
   * Find program by name (case-insensitive, for bulk upload)
   */
  static async findByNameCaseInsensitive(name) {
    const result = await db.query('SELECT * FROM programs WHERE LOWER(TRIM(name)) = LOWER(TRIM($1))', [name]);
    return result.rows[0] || null;
  }

  /**
   * Create a new program
   */
  static async create(data) {
    const { name, status = true, stream_id = null, interest_ids = [] } = data;
    const ids = Array.isArray(interest_ids)
      ? [...new Set(interest_ids.map((x) => parseInt(x, 10)).filter((n) => Number.isInteger(n) && n > 0))]
      : [];

    const result = await db.query(
      `INSERT INTO programs (name, status, stream_id, interest_ids)
       VALUES ($1, $2, $3, $4::integer[])
       RETURNING *`,
      [name, status, stream_id != null ? stream_id : null, ids]
    );
    return result.rows[0];
  }

  /**
   * Update a program
   */
  static async update(id, data) {
    const { name, status, stream_id, interest_ids } = data;

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
    if (stream_id !== undefined) {
      updates.push(`stream_id = $${paramCount++}`);
      values.push(stream_id);
    }
    if (interest_ids !== undefined) {
      const ids = Array.isArray(interest_ids)
        ? [...new Set(interest_ids.map((x) => parseInt(x, 10)).filter((n) => Number.isInteger(n) && n > 0))]
        : [];
      updates.push(`interest_ids = $${paramCount++}`);
      values.push(ids);
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

  /**
   * Delete all programs (junction rows with ON DELETE CASCADE are cleared)
   */
  static async deleteAll() {
    const result = await db.query('DELETE FROM programs');
    return result.rowCount ?? 0;
  }
}

module.exports = Program;

