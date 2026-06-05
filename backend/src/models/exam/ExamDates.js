const db = require('../../config/database');

class ExamDates {
  static async findByExamId(examId) {
    const result = await db.query(
      'SELECT * FROM exam_dates WHERE exam_id = $1',
      [examId]
    );
    return result.rows[0] || null;
  }

  static async findByExamIds(examIds) {
    if (!examIds || examIds.length === 0) {
      return [];
    }
    const result = await db.query(
      'SELECT * FROM exam_dates WHERE exam_id = ANY($1::int[])',
      [examIds]
    );
    return result.rows;
  }

  static async findById(id) {
    const result = await db.query(
      'SELECT * FROM exam_dates WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  static async create(data) {
    const {
      exam_id,
      application_start_date,
      application_close_date,
      admit_card_date,
      exam_date,
      result_date,
      counselling_date,
      application_fees,
    } = data;
    const result = await db.query(
      `INSERT INTO exam_dates (
        exam_id, application_start_date, application_close_date, admit_card_date,
        exam_date, result_date, counselling_date, application_fees
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [
        exam_id,
        application_start_date || null,
        application_close_date || null,
        admit_card_date || null,
        exam_date || null,
        result_date || null,
        counselling_date || null,
        application_fees != null && application_fees !== '' ? parseFloat(String(application_fees)) : null,
      ]
    );
    return result.rows[0];
  }

  static async update(examId, data) {
    const {
      application_start_date,
      application_close_date,
      admit_card_date,
      exam_date,
      result_date,
      counselling_date,
      application_fees,
    } = data;

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
    if (admit_card_date !== undefined) {
      updates.push(`admit_card_date = $${paramCount++}`);
      values.push(admit_card_date);
    }
    if (exam_date !== undefined) {
      updates.push(`exam_date = $${paramCount++}`);
      values.push(exam_date);
    }
    if (result_date !== undefined) {
      updates.push(`result_date = $${paramCount++}`);
      values.push(result_date);
    }
    if (counselling_date !== undefined) {
      updates.push(`counselling_date = $${paramCount++}`);
      values.push(counselling_date);
    }
    if (application_fees !== undefined) {
      const v = application_fees == null || application_fees === '' ? null : parseFloat(String(application_fees));
      updates.push(`application_fees = $${paramCount++}`);
      values.push(v != null && !Number.isNaN(v) ? v : null);
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

  static async upsert(data) {
    const {
      exam_id,
      application_start_date,
      application_close_date,
      admit_card_date,
      exam_date,
      result_date,
      counselling_date,
      application_fees,
    } = data;
    const existing = await this.findByExamId(exam_id);

    if (existing) {
      return await this.update(exam_id, {
        application_start_date,
        application_close_date,
        admit_card_date,
        exam_date,
        result_date,
        counselling_date,
        application_fees,
      });
    }
    return await this.create({
      exam_id,
      application_start_date,
      application_close_date,
      admit_card_date,
      exam_date,
      result_date,
      counselling_date,
      application_fees,
    });
  }

  static async delete(examId) {
    const result = await db.query(
      'DELETE FROM exam_dates WHERE exam_id = $1 RETURNING *',
      [examId]
    );
    return result.rows[0] || null;
  }
}

module.exports = ExamDates;
