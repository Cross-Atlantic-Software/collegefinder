const db = require('../../config/database');

class ExamPattern {
  /**
   * Find exam pattern by exam ID
   */
  static async findByExamId(examId) {
    const result = await db.query(
      'SELECT * FROM exam_pattern WHERE exam_id = $1',
      [examId]
    );
    return result.rows[0] || null;
  }

  /**
   * Find exam pattern by ID
   */
  static async findById(id) {
    const result = await db.query(
      'SELECT * FROM exam_pattern WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  /**
   * Create exam pattern
   */
  static async create(data) {
    const { exam_id, mode, number_of_questions, marking_scheme, duration_minutes } = data;
    const result = await db.query(
      'INSERT INTO exam_pattern (exam_id, mode, number_of_questions, marking_scheme, duration_minutes) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [
        exam_id,
        mode || null,
        number_of_questions || null,
        marking_scheme || null,
        duration_minutes || null
      ]
    );
    return result.rows[0];
  }

  /**
   * Update exam pattern
   */
  static async update(examId, data) {
    const { mode, number_of_questions, marking_scheme, duration_minutes } = data;
    
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (mode !== undefined) {
      updates.push(`mode = $${paramCount++}`);
      values.push(mode);
    }
    if (number_of_questions !== undefined) {
      updates.push(`number_of_questions = $${paramCount++}`);
      values.push(number_of_questions);
    }
    if (marking_scheme !== undefined) {
      updates.push(`marking_scheme = $${paramCount++}`);
      values.push(marking_scheme);
    }
    if (duration_minutes !== undefined) {
      updates.push(`duration_minutes = $${paramCount++}`);
      values.push(duration_minutes);
    }

    if (updates.length === 0) {
      return null;
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(examId);

    const query = `
      UPDATE exam_pattern 
      SET ${updates.join(', ')}
      WHERE exam_id = $${paramCount}
      RETURNING *
    `;

    const result = await db.query(query, values);
    return result.rows[0] || null;
  }

  /**
   * Upsert exam pattern (create or update)
   */
  static async upsert(data) {
    const { exam_id, mode, number_of_questions, marking_scheme, duration_minutes } = data;
    const existing = await this.findByExamId(exam_id);
    
    if (existing) {
      return await this.update(exam_id, { mode, number_of_questions, marking_scheme, duration_minutes });
    } else {
      return await this.create({ exam_id, mode, number_of_questions, marking_scheme, duration_minutes });
    }
  }

  /**
   * Delete exam pattern
   */
  static async delete(examId) {
    const result = await db.query(
      'DELETE FROM exam_pattern WHERE exam_id = $1 RETURNING *',
      [examId]
    );
    return result.rows[0] || null;
  }
}

module.exports = ExamPattern;
