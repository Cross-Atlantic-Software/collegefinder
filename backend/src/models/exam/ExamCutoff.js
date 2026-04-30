const db = require('../../config/database');

function toCutoffText(val) {
  if (val == null || val === '') return null;
  if (typeof val === 'string') return val;
  if (typeof val === 'object') return JSON.stringify(val);
  return String(val);
}

class ExamCutoff {
  static async findByExamId(examId) {
    const result = await db.query(
      'SELECT * FROM exam_cutoff WHERE exam_id = $1',
      [examId]
    );
    return result.rows[0] || null;
  }

  static async findById(id) {
    const result = await db.query(
      'SELECT * FROM exam_cutoff WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  static async create(data) {
    const { exam_id, ranks_percentiles, cutoff_general, cutoff_obc, cutoff_sc, cutoff_st, target_rank_range } = data;
    const result = await db.query(
      `INSERT INTO exam_cutoff (exam_id, ranks_percentiles, cutoff_general, cutoff_obc, cutoff_sc, cutoff_st, target_rank_range)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [
        exam_id,
        toCutoffText(ranks_percentiles),
        toCutoffText(cutoff_general),
        toCutoffText(cutoff_obc),
        toCutoffText(cutoff_sc),
        toCutoffText(cutoff_st),
        toCutoffText(target_rank_range)
      ]
    );
    return result.rows[0];
  }

  static async update(examId, data) {
    const { ranks_percentiles, cutoff_general, cutoff_obc, cutoff_sc, cutoff_st, target_rank_range } = data;

    const updates = [];
    const values = [];
    let paramCount = 1;

    if (ranks_percentiles !== undefined) {
      updates.push(`ranks_percentiles = $${paramCount++}`);
      values.push(toCutoffText(ranks_percentiles));
    }
    if (cutoff_general !== undefined) {
      updates.push(`cutoff_general = $${paramCount++}`);
      values.push(toCutoffText(cutoff_general));
    }
    if (cutoff_obc !== undefined) {
      updates.push(`cutoff_obc = $${paramCount++}`);
      values.push(toCutoffText(cutoff_obc));
    }
    if (cutoff_sc !== undefined) {
      updates.push(`cutoff_sc = $${paramCount++}`);
      values.push(toCutoffText(cutoff_sc));
    }
    if (cutoff_st !== undefined) {
      updates.push(`cutoff_st = $${paramCount++}`);
      values.push(toCutoffText(cutoff_st));
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

  static async upsert(data) {
    const { exam_id, ranks_percentiles, cutoff_general, cutoff_obc, cutoff_sc, cutoff_st, target_rank_range } = data;
    const existing = await this.findByExamId(exam_id);

    if (existing) {
      return await this.update(exam_id, { ranks_percentiles, cutoff_general, cutoff_obc, cutoff_sc, cutoff_st, target_rank_range });
    }
    return await this.create({ exam_id, ranks_percentiles, cutoff_general, cutoff_obc, cutoff_sc, cutoff_st, target_rank_range });
  }

  static async delete(examId) {
    const result = await db.query(
      'DELETE FROM exam_cutoff WHERE exam_id = $1 RETURNING *',
      [examId]
    );
    return result.rows[0] || null;
  }
}

module.exports = ExamCutoff;
