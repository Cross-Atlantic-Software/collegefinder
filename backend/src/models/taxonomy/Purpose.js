const db = require('../../config/database');

class Purpose {
  /**
   * Find all purposes
   */
  static async findAll() {
    const result = await db.query(
      'SELECT * FROM purposes ORDER BY name ASC'
    );
    return result.rows;
  }

  /**
   * Find active purposes only
   */
  static async findActive() {
    const result = await db.query(
      'SELECT * FROM purposes WHERE status = TRUE ORDER BY name ASC'
    );
    return result.rows;
  }

  /**
   * Find purpose by ID
   */
  static async findById(id) {
    const result = await db.query('SELECT * FROM purposes WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  /**
   * Find purpose by name
   */
  static async findByName(name) {
    const result = await db.query('SELECT * FROM purposes WHERE name = $1', [name]);
    return result.rows[0] || null;
  }

  /**
   * Create a new purpose
   */
  static async create(data) {
    const { name, status = true } = data;

    const result = await db.query(
      `INSERT INTO purposes (name, status)
       VALUES ($1, $2)
       RETURNING *`,
      [name, status]
    );
    return result.rows[0];
  }

  /**
   * Update a purpose
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
      `UPDATE purposes SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
       WHERE id = $${paramCount} RETURNING *`,
      values
    );
    return result.rows[0] || null;
  }

  /**
   * Delete a purpose
   */
  static async delete(id) {
    const result = await db.query('DELETE FROM purposes WHERE id = $1 RETURNING *', [id]);
    return result.rows[0] || null;
  }

  /**
   * Get purposes for a lecture
   */
  static async findByLectureId(lectureId) {
    const result = await db.query(
      `SELECT p.* FROM purposes p
       INNER JOIN lecture_purposes lp ON p.id = lp.purpose_id
       WHERE lp.lecture_id = $1
       ORDER BY p.name ASC`,
      [lectureId]
    );
    return result.rows;
  }

  /**
   * Set purposes for a lecture (replaces existing)
   */
  static async setLecturePurposes(lectureId, purposeIds) {
    // Delete existing associations
    await db.query('DELETE FROM lecture_purposes WHERE lecture_id = $1', [lectureId]);

    // Insert new associations
    if (purposeIds && purposeIds.length > 0) {
      const values = [];
      const placeholders = [];
      purposeIds.forEach((purposeId, index) => {
        values.push(lectureId, purposeId);
        placeholders.push(`($${index * 2 + 1}, $${index * 2 + 2})`);
      });

      await db.query(
        `INSERT INTO lecture_purposes (lecture_id, purpose_id)
         VALUES ${placeholders.join(', ')}`,
        values
      );
    }
  }
}

module.exports = Purpose;

