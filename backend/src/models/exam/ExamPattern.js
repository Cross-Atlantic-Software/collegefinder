const db = require('../../config/database');

class ExamPattern {
  static async findByExamId(examId) {
    const result = await db.query(
      'SELECT * FROM exam_pattern WHERE exam_id = $1',
      [examId]
    );
    return result.rows[0] || null;
  }

  static async findById(id) {
    const result = await db.query(
      'SELECT * FROM exam_pattern WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  static async create(data) {
    const { exam_id, mode, number_of_questions, negative_marking, duration_minutes, total_marks, weightage_of_subjects } = data;
    const result = await db.query(
      `INSERT INTO exam_pattern (exam_id, mode, number_of_questions, negative_marking, duration_minutes, total_marks, weightage_of_subjects)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [
        exam_id,
        mode || null,
        number_of_questions != null && number_of_questions !== '' && !Number.isNaN(parseInt(String(number_of_questions), 10)) ? parseInt(String(number_of_questions), 10) : null,
        negative_marking != null && String(negative_marking).trim() ? String(negative_marking).trim() : null,
        duration_minutes != null && duration_minutes !== '' && !Number.isNaN(parseInt(String(duration_minutes), 10)) ? parseInt(String(duration_minutes), 10) : null,
        total_marks != null && total_marks !== '' && !Number.isNaN(parseInt(String(total_marks), 10)) ? parseInt(String(total_marks), 10) : null,
        weightage_of_subjects != null && String(weightage_of_subjects).trim() ? String(weightage_of_subjects).trim() : null
      ]
    );
    return result.rows[0];
  }

  static async update(examId, data) {
    const { mode, number_of_questions, negative_marking, duration_minutes, total_marks, weightage_of_subjects } = data;

    const updates = [];
    const values = [];
    let paramCount = 1;

    if (mode !== undefined) {
      updates.push(`mode = $${paramCount++}`);
      values.push(mode);
    }
    if (number_of_questions !== undefined) {
      const n = number_of_questions != null && number_of_questions !== '' ? parseInt(String(number_of_questions), 10) : null;
      updates.push(`number_of_questions = $${paramCount++}`);
      values.push(n != null && !Number.isNaN(n) ? n : null);
    }
    if (negative_marking !== undefined) {
      const v = negative_marking != null && String(negative_marking).trim() ? String(negative_marking).trim() : null;
      updates.push(`negative_marking = $${paramCount++}`);
      values.push(v);
    }
    if (duration_minutes !== undefined) {
      const n = duration_minutes != null && duration_minutes !== '' ? parseInt(String(duration_minutes), 10) : null;
      updates.push(`duration_minutes = $${paramCount++}`);
      values.push(n != null && !Number.isNaN(n) ? n : null);
    }
    if (total_marks !== undefined) {
      const n = total_marks != null && total_marks !== '' ? parseInt(String(total_marks), 10) : null;
      updates.push(`total_marks = $${paramCount++}`);
      values.push(n != null && !Number.isNaN(n) ? n : null);
    }
    if (weightage_of_subjects !== undefined) {
      const v = weightage_of_subjects != null && String(weightage_of_subjects).trim() ? String(weightage_of_subjects).trim() : null;
      updates.push(`weightage_of_subjects = $${paramCount++}`);
      values.push(v);
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

  static async upsert(data) {
    const { exam_id, mode, number_of_questions, negative_marking, duration_minutes, total_marks, weightage_of_subjects } = data;
    const existing = await this.findByExamId(exam_id);

    if (existing) {
      return await this.update(exam_id, { mode, number_of_questions, negative_marking, duration_minutes, total_marks, weightage_of_subjects });
    }
    return await this.create({ exam_id, mode, number_of_questions, negative_marking, duration_minutes, total_marks, weightage_of_subjects });
  }

  static async delete(examId) {
    const result = await db.query(
      'DELETE FROM exam_pattern WHERE exam_id = $1 RETURNING *',
      [examId]
    );
    return result.rows[0] || null;
  }
}

module.exports = ExamPattern;
