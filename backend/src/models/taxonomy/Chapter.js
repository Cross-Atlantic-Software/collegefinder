const db = require('../../config/database');

class Chapter {
  static async findAll() {
    const result = await db.query(
      `SELECT c.*, s.name AS subject_name
       FROM chapters c
       LEFT JOIN subjects s ON s.id = c.sub_id
       ORDER BY c.sort_order ASC, c.name ASC`
    );
    return result.rows;
  }

  static async findById(id) {
    const result = await db.query(
      `SELECT c.*, s.name AS subject_name
       FROM chapters c
       LEFT JOIN subjects s ON s.id = c.sub_id
       WHERE c.id = $1`,
      [id]
    );
    return result.rows[0] || null;
  }

  static async findBySubjectId(subjectId) {
    const result = await db.query(
      `SELECT * FROM chapters
       WHERE sub_id = $1 AND status = TRUE
       ORDER BY sort_order ASC, name ASC`,
      [subjectId]
    );
    return result.rows;
  }

  static async findByNameAndSubjectId(name, subId) {
    const result = await db.query(
      'SELECT * FROM chapters WHERE LOWER(name) = LOWER($1) AND sub_id = $2',
      [name, subId]
    );
    return result.rows[0] || null;
  }

  static async findBySubjectIdAndNameInsensitive(subId, name) {
    const result = await db.query(
      `SELECT * FROM chapters
       WHERE sub_id = $1 AND LOWER(TRIM(name)) = LOWER(TRIM($2))
       LIMIT 1`,
      [subId, name]
    );
    return result.rows[0] || null;
  }

  static async findAllByTrimmedNameInsensitive(name) {
    const result = await db.query(
      `SELECT * FROM chapters
       WHERE LOWER(TRIM(name)) = LOWER(TRIM($1))
       ORDER BY id ASC`,
      [name]
    );
    return result.rows;
  }

  static async create(data) {
    const { sub_id, name, status = true, description, sort_order = 0 } = data;
    const result = await db.query(
      `INSERT INTO chapters (sub_id, name, status, description, sort_order)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [sub_id, name, status, description || null, sort_order]
    );
    return result.rows[0];
  }

  static async update(id, data) {
    const fields = ['sub_id', 'name', 'status', 'description', 'sort_order'];
    const updates = [];
    const values = [];
    let paramCount = 1;

    for (const field of fields) {
      if (data[field] !== undefined) {
        updates.push(`${field} = $${paramCount++}`);
        if (field === 'status') {
          values.push(data[field] === true || data[field] === 'true');
        } else if (field === 'sort_order') {
          values.push(parseInt(data[field], 10));
        } else {
          values.push(data[field]);
        }
      }
    }

    if (updates.length === 0) return await this.findById(id);

    values.push(id);
    const result = await db.query(
      `UPDATE chapters SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
       WHERE id = $${paramCount} RETURNING *`,
      values
    );
    return result.rows[0] || null;
  }

  static async delete(id) {
    const result = await db.query('DELETE FROM chapters WHERE id = $1 RETURNING *', [id]);
    return result.rows[0] || null;
  }

  static async deleteAll() {
    const result = await db.query('DELETE FROM chapters');
    return result.rowCount || 0;
  }
}

module.exports = Chapter;
