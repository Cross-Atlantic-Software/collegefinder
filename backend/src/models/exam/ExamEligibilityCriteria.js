const db = require('../../config/database');

class ExamEligibilityCriteria {
  static async findByExamId(examId) {
    const result = await db.query(
      'SELECT * FROM exam_eligibility_criteria WHERE exam_id = $1',
      [examId]
    );
    return result.rows[0] || null;
  }

  static async findByExamIds(examIds) {
    if (!examIds || examIds.length === 0) {
      return [];
    }
    const result = await db.query(
      'SELECT * FROM exam_eligibility_criteria WHERE exam_id = ANY($1::int[])',
      [examIds]
    );
    return result.rows;
  }

  static async findById(id) {
    const result = await db.query(
      'SELECT * FROM exam_eligibility_criteria WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  static async create(data) {
    const { exam_id, stream_ids, subject_ids, age_limit, attempt_limit, domicile } = data;
    const result = await db.query(
      'INSERT INTO exam_eligibility_criteria (exam_id, stream_ids, subject_ids, age_limit, attempt_limit, domicile) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [
        exam_id,
        stream_ids && Array.isArray(stream_ids) ? stream_ids : [],
        subject_ids && Array.isArray(subject_ids) ? subject_ids : [],
        age_limit != null && String(age_limit).trim() ? String(age_limit).trim() : null,
        attempt_limit || null,
        domicile || null
      ]
    );
    return result.rows[0];
  }

  static async update(examId, data) {
    const { stream_ids, subject_ids, age_limit, attempt_limit, domicile } = data;

    const updates = [];
    const values = [];
    let paramCount = 1;

    if (stream_ids !== undefined) {
      updates.push(`stream_ids = $${paramCount++}`);
      values.push(Array.isArray(stream_ids) ? stream_ids : []);
    }
    if (subject_ids !== undefined) {
      updates.push(`subject_ids = $${paramCount++}`);
      values.push(Array.isArray(subject_ids) ? subject_ids : []);
    }
    if (age_limit !== undefined) {
      const v = age_limit != null && String(age_limit).trim() ? String(age_limit).trim() : null;
      updates.push(`age_limit = $${paramCount++}`);
      values.push(v);
    }
    if (attempt_limit !== undefined) {
      updates.push(`attempt_limit = $${paramCount++}`);
      values.push(attempt_limit);
    }
    if (domicile !== undefined) {
      updates.push(`domicile = $${paramCount++}`);
      values.push(domicile || null);
    }

    if (updates.length === 0) {
      return null;
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(examId);

    const query = `
      UPDATE exam_eligibility_criteria
      SET ${updates.join(', ')}
      WHERE exam_id = $${paramCount}
      RETURNING *
    `;

    const result = await db.query(query, values);
    return result.rows[0] || null;
  }

  static async upsert(data) {
    const { exam_id, stream_ids, subject_ids, age_limit, attempt_limit, domicile } = data;
    const existing = await this.findByExamId(exam_id);

    if (existing) {
      return await this.update(exam_id, { stream_ids, subject_ids, age_limit, attempt_limit, domicile });
    }
    return await this.create({ exam_id, stream_ids, subject_ids, age_limit, attempt_limit, domicile });
  }

  static async delete(examId) {
    const result = await db.query(
      'DELETE FROM exam_eligibility_criteria WHERE exam_id = $1 RETURNING *',
      [examId]
    );
    return result.rows[0] || null;
  }
}

module.exports = ExamEligibilityCriteria;
