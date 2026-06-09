const db = require('../../config/database');

class ExamEligibilityCriteria {
  /**
   * Find eligibility criteria by exam ID
   */
  static async findByExamId(examId) {
    const result = await db.query(
      'SELECT * FROM exam_eligibility_criteria WHERE exam_id = $1',
      [examId]
    );
    return result.rows[0] || null;
  }

  /**
   * Find eligibility criteria for multiple exam IDs (for batch filtering by stream).
   * Returns array of rows keyed by exam_id for easy lookup.
   */
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

  /**
   * Find eligibility criteria by ID
   */
  static async findById(id) {
    const result = await db.query(
      'SELECT * FROM exam_eligibility_criteria WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  /**
   * Create eligibility criteria
   */
  static normalizeAgeLimit(data) {
    if (data.age_limit != null && String(data.age_limit).trim() !== '') {
      return String(data.age_limit).trim();
    }
    const { age_limit_min, age_limit_max } = data;
    const parts = [age_limit_min, age_limit_max].filter(
      (x) => x != null && String(x).trim() !== ''
    );
    return parts.length > 0 ? parts.join(' – ') : null;
  }

  static async create(data) {
    const { exam_id, stream_ids, subject_ids, attempt_limit, domicile } = data;
    const age_limit = this.normalizeAgeLimit(data);
    const result = await db.query(
      'INSERT INTO exam_eligibility_criteria (exam_id, stream_ids, subject_ids, age_limit, attempt_limit, domicile) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [
        exam_id,
        stream_ids && Array.isArray(stream_ids) ? stream_ids : [],
        subject_ids && Array.isArray(subject_ids) ? subject_ids : [],
        age_limit,
        attempt_limit || null,
        domicile || null
      ]
    );
    return result.rows[0];
  }

  /**
   * Update eligibility criteria
   */
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
    if (
      age_limit !== undefined ||
      data.age_limit_min !== undefined ||
      data.age_limit_max !== undefined
    ) {
      updates.push(`age_limit = $${paramCount++}`);
      values.push(this.normalizeAgeLimit(data));
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

  /**
   * Upsert eligibility criteria (create or update)
   */
  static async upsert(data) {
    const { exam_id, stream_ids, subject_ids, attempt_limit, domicile } = data;
    const existing = await this.findByExamId(exam_id);
    
    if (existing) {
      return await this.update(exam_id, data);
    } else {
      return await this.create({ exam_id, stream_ids, subject_ids, ...data, attempt_limit, domicile });
    }
  }

  /**
   * Delete eligibility criteria
   */
  static async delete(examId) {
    const result = await db.query(
      'DELETE FROM exam_eligibility_criteria WHERE exam_id = $1 RETURNING *',
      [examId]
    );
    return result.rows[0] || null;
  }
}

module.exports = ExamEligibilityCriteria;
