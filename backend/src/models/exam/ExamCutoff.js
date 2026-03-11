const db = require('../../config/database');

/** Ensure TEXT columns get a string (allow JSON object from API to be stored as string) */
function toCutoffText(val) {
  if (val == null || val === '') return null;
  if (typeof val === 'string') return val;
  if (typeof val === 'object') return JSON.stringify(val);
  return String(val);
}

class ExamCutoff {
  /**
   * Find exam cutoff by exam ID
   */
  static async findByExamId(examId) {
    const result = await db.query(
      'SELECT * FROM exam_cutoff WHERE exam_id = $1',
      [examId]
    );
    return result.rows[0] || null;
  }

  /**
   * Find exam cutoff by ID
   */
  static async findById(id) {
    const result = await db.query(
      'SELECT * FROM exam_cutoff WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  /**
   * Create exam cutoff
   */
  static async create(data) {
    const { exam_id, previous_year_cutoff, ranks_percentiles, category_wise_cutoff, target_rank_range } = data;
    const result = await db.query(
      'INSERT INTO exam_cutoff (exam_id, previous_year_cutoff, ranks_percentiles, category_wise_cutoff, target_rank_range) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [
        exam_id,
        toCutoffText(previous_year_cutoff),
        toCutoffText(ranks_percentiles),
        toCutoffText(category_wise_cutoff),
        toCutoffText(target_rank_range)
      ]
    );
    return result.rows[0];
  }

  /**
   * Update exam cutoff
   */
  static async update(examId, data) {
    const { previous_year_cutoff, ranks_percentiles, category_wise_cutoff, target_rank_range } = data;
    
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (previous_year_cutoff !== undefined) {
      updates.push(`previous_year_cutoff = $${paramCount++}`);
      values.push(toCutoffText(previous_year_cutoff));
    }
    if (ranks_percentiles !== undefined) {
      updates.push(`ranks_percentiles = $${paramCount++}`);
      values.push(toCutoffText(ranks_percentiles));
    }
    if (category_wise_cutoff !== undefined) {
      updates.push(`category_wise_cutoff = $${paramCount++}`);
      values.push(toCutoffText(category_wise_cutoff));
    }
    if (target_rank_range !== undefined) {
      updates.push(`target_rank_range = $${paramCount++}`);
      values.push(toCutoffText(target_rank_range));
    }

    if (updates.length === 0) {
      return null;
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(examId);

    const query = `
      UPDATE exam_cutoff 
      SET ${updates.join(', ')}
      WHERE exam_id = $${paramCount}
      RETURNING *
    `;

    const result = await db.query(query, values);
    return result.rows[0] || null;
  }

  /**
   * Upsert exam cutoff (create or update)
   */
  static async upsert(data) {
    const { exam_id, previous_year_cutoff, ranks_percentiles, category_wise_cutoff, target_rank_range } = data;
    const existing = await this.findByExamId(exam_id);
    
    if (existing) {
      return await this.update(exam_id, { previous_year_cutoff, ranks_percentiles, category_wise_cutoff, target_rank_range });
    } else {
      return await this.create({ exam_id, previous_year_cutoff, ranks_percentiles, category_wise_cutoff, target_rank_range });
    }
  }

  /**
   * Delete exam cutoff
   */
  static async delete(examId) {
    const result = await db.query(
      'DELETE FROM exam_cutoff WHERE exam_id = $1 RETURNING *',
      [examId]
    );
    return result.rows[0] || null;
  }
}

module.exports = ExamCutoff;
