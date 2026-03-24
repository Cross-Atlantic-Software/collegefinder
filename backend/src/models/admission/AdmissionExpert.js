const db = require('../../config/database');

class AdmissionExpert {
  static async findAll() {
    const result = await db.query(
      'SELECT * FROM admission_experts ORDER BY type, created_at DESC'
    );
    return result.rows;
  }

  static async findAllActive() {
    const result = await db.query(
      'SELECT * FROM admission_experts WHERE is_active = true ORDER BY type, created_at DESC'
    );
    return result.rows;
  }

  static async findAllActiveGrouped() {
    const rows = await this.findAllActive();
    const grouped = {};
    for (const row of rows) {
      if (!grouped[row.type]) grouped[row.type] = [];
      grouped[row.type].push(row);
    }
    return grouped;
  }

  static async findById(id) {
    const result = await db.query(
      'SELECT * FROM admission_experts WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  static async create(data) {
    const { name, photo_url, contact, phone, email, description, type, created_by, photo_file_name } = data;
    const result = await db.query(
      `INSERT INTO admission_experts (name, photo_url, contact, phone, email, description, type, created_by, photo_file_name)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [name, photo_url || null, contact || null, phone || null, email || null, description || null, type, created_by || null, photo_file_name && String(photo_file_name).trim() ? String(photo_file_name).trim() : null]
    );
    return result.rows[0];
  }

  static async update(id, data) {
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (data.name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(data.name);
    }
    if (data.photo_url !== undefined) {
      updates.push(`photo_url = $${paramCount++}`);
      values.push(data.photo_url);
    }
    if (data.contact !== undefined) {
      updates.push(`contact = $${paramCount++}`);
      values.push(data.contact);
    }
    if (data.phone !== undefined) {
      updates.push(`phone = $${paramCount++}`);
      values.push(data.phone);
    }
    if (data.email !== undefined) {
      updates.push(`email = $${paramCount++}`);
      values.push(data.email);
    }
    if (data.description !== undefined) {
      updates.push(`description = $${paramCount++}`);
      values.push(data.description);
    }
    if (data.type !== undefined) {
      updates.push(`type = $${paramCount++}`);
      values.push(data.type);
    }
    if (data.is_active !== undefined) {
      updates.push(`is_active = $${paramCount++}`);
      values.push(data.is_active);
    }
    if (data.photo_file_name !== undefined) {
      updates.push(`photo_file_name = $${paramCount++}`);
      values.push(data.photo_file_name && String(data.photo_file_name).trim() ? String(data.photo_file_name).trim() : null);
    }

    if (updates.length === 0) return null;

    values.push(id);
    const result = await db.query(
      `UPDATE admission_experts SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
       WHERE id = $${paramCount}
       RETURNING *`,
      values
    );
    return result.rows[0] || null;
  }

  static async delete(id) {
    const result = await db.query(
      'DELETE FROM admission_experts WHERE id = $1 RETURNING *',
      [id]
    );
    return result.rows[0] || null;
  }

  static async count() {
    const result = await db.query(
      'SELECT COUNT(*) as total FROM admission_experts'
    );
    return parseInt(result.rows[0].total, 10);
  }

  /**
   * Find expert(s) by photo_file_name for matching when uploading photos from ZIP.
   */
  static async findByPhotoFileName(filename) {
    if (!filename || !String(filename).trim()) return [];
    const name = String(filename).trim();
    const result = await db.query(
      'SELECT * FROM admission_experts WHERE photo_file_name = $1',
      [name]
    );
    return result.rows || [];
  }
}

module.exports = AdmissionExpert;
