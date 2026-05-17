const db = require('../../config/database');

function optionalText(val) {
  if (val == null) return null;
  const t = String(val).trim();
  return t || null;
}

class ExamPattern {
  static async findByExamId(examId) {
    const result = await db.query(
      'SELECT * FROM exam_pattern WHERE exam_id = $1',
      [examId]
    );
    return result.rows[0] || null;
  }

  static async findByExamIds(examIds) {
    if (!examIds || examIds.length === 0) {
      return [];
    }
    const result = await db.query(
      'SELECT * FROM exam_pattern WHERE exam_id = ANY($1::int[])',
      [examIds]
    );
    return result.rows;
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
        optionalText(mode),
        optionalText(number_of_questions),
        optionalText(negative_marking),
        optionalText(duration_minutes),
        optionalText(total_marks),
        optionalText(weightage_of_subjects),
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
      values.push(optionalText(mode));
    }
    if (number_of_questions !== undefined) {
      updates.push(`number_of_questions = $${paramCount++}`);
      values.push(optionalText(number_of_questions));
    }
    if (negative_marking !== undefined) {
      updates.push(`negative_marking = $${paramCount++}`);
      values.push(optionalText(negative_marking));
    }
    if (duration_minutes !== undefined) {
      updates.push(`duration_minutes = $${paramCount++}`);
      values.push(optionalText(duration_minutes));
    }
    if (total_marks !== undefined) {
      updates.push(`total_marks = $${paramCount++}`);
      values.push(optionalText(total_marks));
    }
    if (weightage_of_subjects !== undefined) {
      updates.push(`weightage_of_subjects = $${paramCount++}`);
      values.push(optionalText(weightage_of_subjects));
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
