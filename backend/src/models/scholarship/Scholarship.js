const db = require('../../config/database');

function normalizeStreamIds(value) {
  if (value == null) return [];
  const raw = Array.isArray(value) ? value : [value];
  return [
    ...new Set(
      raw
        .map((id) => parseInt(id, 10))
        .filter((n) => Number.isInteger(n) && n > 0)
    ),
  ];
}

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

  /** Match dashboard route slug (`slugifyScholarshipName`). */
  static async findBySlug(slug) {
    const s = slug != null ? String(slug).trim().toLowerCase() : '';
    if (!s) return null;
    const result = await db.query(
      `SELECT * FROM scholarships
       WHERE regexp_replace(
         regexp_replace(lower(trim(scholarship_name)), '[^a-z0-9]+', '-', 'g'),
         '(^-+|-+$)', '', 'g'
       ) = $1
       LIMIT 1`,
      [s]
    );
    return result.rows[0] || null;
  }

  static async findByIds(ids) {
    if (!ids?.length) return [];
    const validIds = ids.map((id) => parseInt(id, 10)).filter((n) => Number.isInteger(n) && n > 0);
    if (!validIds.length) return [];
    const result = await db.query(
      `SELECT s.*
       FROM scholarships s
       INNER JOIN unnest($1::int[]) WITH ORDINALITY AS t(id, ord) ON s.id = t.id
       ORDER BY t.ord`,
      [validIds]
    );
    return result.rows;
  }

  static async create(data) {
    const {
      scholarship_name,
      conducting_authority,
      scholarship_type,
      description,
      stream_ids,
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
        stream_ids, income_limit, minimum_marks_required, scholarship_amount,
        selection_process, application_start_date, application_end_date, mode, official_website
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *`,
      [
        scholarship_name || null,
        conducting_authority || null,
        scholarship_type || null,
        description || null,
        normalizeStreamIds(stream_ids),
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
      'stream_ids', 'income_limit', 'minimum_marks_required', 'scholarship_amount',
      'selection_process', 'application_start_date', 'application_end_date', 'mode', 'official_website'
    ];
    const updates = [];
    const values = [];
    let paramCount = 1;
    for (const key of fields) {
      if (data[key] !== undefined) {
        updates.push(`${key} = $${paramCount++}`);
        if (key === 'stream_ids') {
          values.push(normalizeStreamIds(data[key]));
        } else {
          values.push(data[key] === '' ? null : data[key]);
        }
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
