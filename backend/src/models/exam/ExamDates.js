const db = require('../../config/database');

class ExamDates {
  /**
   * Find exam dates by exam ID
   */
  static async findByExamId(examId) {
    const result = await db.query(
      'SELECT * FROM exam_dates WHERE exam_id = $1',
      [examId]
    );
    return result.rows[0] || null;
  }

  /**
   * Find exam dates by ID
   */
  static async findById(id) {
    const result = await db.query(
      'SELECT * FROM exam_dates WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  /**
   * Create exam dates
   */
  static async create(data) {
    const { exam_id, application_start_date, application_close_date, exam_date } = data;
    const result = await db.query(
      'INSERT INTO exam_dates (exam_id, application_start_date, application_close_date, exam_date) VALUES ($1, $2, $3, $4) RETURNING *',
      [exam_id, application_start_date || null, application_close_date || null, exam_date || null]
    );
    return result.rows[0];
  }

  /**
   * Update exam dates
   */
  static async update(examId, data) {
    const { application_start_date, application_close_date, exam_date } = data;
    
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (application_start_date !== undefined) {
      updates.push(`application_start_date = $${paramCount++}`);
      values.push(application_start_date);
    }
    if (application_close_date !== undefined) {
      updates.push(`application_close_date = $${paramCount++}`);
      values.push(application_close_date);
    }
    if (exam_date !== undefined) {
      updates.push(`exam_date = $${paramCount++}`);
      values.push(exam_date);
    }

    if (updates.length === 0) {
      return null;
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(examId);

    const query = `
      UPDATE exam_dates 
      SET ${updates.join(', ')}
      WHERE exam_id = $${paramCount}
      RETURNING *
    `;

    const result = await db.query(query, values);
    return result.rows[0] || null;
  }

  /**
   * Upsert exam dates (create or update)
   */
  static async upsert(data) {
    const { exam_id, application_start_date, application_close_date, exam_date } = data;
    const existing = await this.findByExamId(exam_id);
    
    if (existing) {
      return await this.update(exam_id, { application_start_date, application_close_date, exam_date });
    } else {
      return await this.create({ exam_id, application_start_date, application_close_date, exam_date });
    }
  }

  /**
   * Delete exam dates
   */
  static async delete(examId) {
    const result = await db.query(
      'DELETE FROM exam_dates WHERE exam_id = $1 RETURNING *',
      [examId]
    );
    return result.rows[0] || null;
  }
}

module.exports = ExamDates;
