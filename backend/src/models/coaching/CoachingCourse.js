const db = require('../../config/database');

class CoachingCourse {
  /**
   * Find all coaching courses
   */
  static async findAll() {
    const result = await db.query(
      `SELECT cc.*, c.name as coaching_name
       FROM coaching_courses cc
       LEFT JOIN coachings c ON cc.coaching_id = c.id
       ORDER BY c.name ASC, cc.title ASC`
    );
    return result.rows;
  }

  /**
   * Find courses by coaching ID
   */
  static async findByCoachingId(coachingId) {
    const result = await db.query(
      `SELECT cc.*, c.name as coaching_name
       FROM coaching_courses cc
       LEFT JOIN coachings c ON cc.coaching_id = c.id
       WHERE cc.coaching_id = $1
       ORDER BY cc.title ASC`,
      [coachingId]
    );
    return result.rows;
  }

  /**
   * Find course by ID
   */
  static async findById(id) {
    const result = await db.query(
      `SELECT cc.*, c.name as coaching_name
       FROM coaching_courses cc
       LEFT JOIN coachings c ON cc.coaching_id = c.id
       WHERE cc.id = $1`,
      [id]
    );
    return result.rows[0] || null;
  }

  /**
   * Create a new coaching course
   */
  static async create(data) {
    const { coaching_id, exam_ids, title, summary, duration, mode, fee, contact_email, contact, rating, features } = data;

    const result = await db.query(
      `INSERT INTO coaching_courses (coaching_id, exam_ids, title, summary, duration, mode, fee, contact_email, contact, rating, features)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
      [
        coaching_id,
        exam_ids && exam_ids.length > 0 ? exam_ids : null,
        title,
        summary || null,
        duration || null,
        mode || 'Online',
        fee ? parseFloat(fee) : null,
        contact_email || null,
        contact || null,
        rating ? parseFloat(rating) : null,
        features && features.length > 0 ? features : null
      ]
    );
    return result.rows[0];
  }

  /**
   * Update a coaching course
   */
  static async update(id, data) {
    const { coaching_id, exam_ids, title, summary, duration, mode, fee, contact_email, contact, rating, features } = data;

    const updates = [];
    const values = [];
    let paramCount = 1;

    if (coaching_id !== undefined) {
      updates.push(`coaching_id = $${paramCount++}`);
      values.push(coaching_id);
    }
    if (exam_ids !== undefined) {
      updates.push(`exam_ids = $${paramCount++}`);
      values.push(exam_ids && exam_ids.length > 0 ? exam_ids : null);
    }
    if (title !== undefined) {
      updates.push(`title = $${paramCount++}`);
      values.push(title);
    }
    if (summary !== undefined) {
      updates.push(`summary = $${paramCount++}`);
      values.push(summary);
    }
    if (duration !== undefined) {
      updates.push(`duration = $${paramCount++}`);
      values.push(duration);
    }
    if (mode !== undefined) {
      updates.push(`mode = $${paramCount++}`);
      values.push(mode);
    }
    if (fee !== undefined) {
      updates.push(`fee = $${paramCount++}`);
      values.push(fee ? parseFloat(fee) : null);
    }
    if (contact_email !== undefined) {
      updates.push(`contact_email = $${paramCount++}`);
      values.push(contact_email);
    }
    if (contact !== undefined) {
      updates.push(`contact = $${paramCount++}`);
      values.push(contact);
    }
    if (rating !== undefined) {
      updates.push(`rating = $${paramCount++}`);
      values.push(rating ? parseFloat(rating) : null);
    }
    if (features !== undefined) {
      updates.push(`features = $${paramCount++}`);
      values.push(features && features.length > 0 ? features : null);
    }

    if (updates.length === 0) {
      return await this.findById(id);
    }

    values.push(id);
    const result = await db.query(
      `UPDATE coaching_courses SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
       WHERE id = $${paramCount} RETURNING *`,
      values
    );
    return result.rows[0] || null;
  }

  /**
   * Delete a coaching course
   */
  static async delete(id) {
    const result = await db.query('DELETE FROM coaching_courses WHERE id = $1 RETURNING *', [id]);
    return result.rows[0] || null;
  }
}

module.exports = CoachingCourse;
