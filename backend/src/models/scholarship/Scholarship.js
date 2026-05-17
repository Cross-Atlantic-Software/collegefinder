const db = require('../../config/database');

class Scholarship {
  static async findAll() {
    const result = await db.query(
      'SELECT * FROM scholarships ORDER BY scholarship_name ASC'
    );
    return result.rows;
  }

  static async findById(id) {
    const result = await db.query(
      'SELECT * FROM scholarships WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  static async findByName(name) {
    const result = await db.query(
      'SELECT * FROM scholarships WHERE LOWER(scholarship_name) = LOWER($1)',
      [name]
    );
    return result.rows[0] || null;
  }

  static async create(data) {
    const {
      scholarship_name,
      conducting_authority,
      scholarship_type,
      description,
      stream_id,
      income_limit,
      minimum_marks_required,
      scholarship_amount,
      selection_process,
      application_start_date,
      application_end_date,
      mode,
      official_website
    } = data;
    const result = await db.query(
      `INSERT INTO scholarships (
        scholarship_name, conducting_authority, scholarship_type, description,
        stream_id, income_limit, minimum_marks_required, scholarship_amount,
        selection_process, application_start_date, application_end_date, mode, official_website
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *`,
      [
        scholarship_name || null,
        conducting_authority || null,
        scholarship_type || null,
        description || null,
        stream_id ?? null,
        income_limit || null,
        minimum_marks_required || null,
        scholarship_amount || null,
        selection_process || null,
        application_start_date || null,
        application_end_date || null,
        mode || null,
        official_website || null
      ]
    );
    return result.rows[0];
  }

  static async update(id, data) {
    const fields = [
      'scholarship_name', 'conducting_authority', 'scholarship_type', 'description',
      'stream_id', 'income_limit', 'minimum_marks_required', 'scholarship_amount',
      'selection_process', 'application_start_date', 'application_end_date', 'mode', 'official_website'
    ];
    const updates = [];
    const values = [];
    let paramCount = 1;
    for (const key of fields) {
      if (data[key] !== undefined) {
        updates.push(`${key} = $${paramCount++}`);
        values.push(data[key] === '' ? null : data[key]);
      }
    }
    if (updates.length === 0) return await this.findById(id);
    values.push(id);
    const result = await db.query(
      `UPDATE scholarships SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${paramCount} RETURNING *`,
      values
    );
    return result.rows[0] || null;
  }

  static async delete(id) {
    const result = await db.query(
      'DELETE FROM scholarships WHERE id = $1 RETURNING *',
      [id]
    );
    return result.rows[0] || null;
  }
}

module.exports = Scholarship;
