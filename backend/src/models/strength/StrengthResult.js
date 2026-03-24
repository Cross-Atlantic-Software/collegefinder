const db = require('../../config/database');

class StrengthResult {
  static async findByUserId(userId) {
    const result = await db.query(
      `SELECT sr.*, au.email as counsellor_email
       FROM strength_results sr
       LEFT JOIN admin_users au ON sr.counsellor_admin_id = au.id
       WHERE sr.user_id = $1`,
      [userId]
    );
    const row = result.rows[0] || null;
    if (row) {
      if (typeof row.strengths === 'string') row.strengths = JSON.parse(row.strengths);
      if (typeof row.career_recommendations === 'string') row.career_recommendations = JSON.parse(row.career_recommendations);
      if (row.assigned_expert_ids && !Array.isArray(row.assigned_expert_ids)) {
        row.assigned_expert_ids = row.assigned_expert_ids.length ? Array.from(row.assigned_expert_ids) : [];
      }
      if (!row.assigned_expert_ids) row.assigned_expert_ids = [];
    }
    return row;
  }

  static async create(data) {
    const { user_id, counsellor_admin_id, strengths, career_recommendations, report_url, assigned_expert_ids, report_file_name } = data;
    const ids = Array.isArray(assigned_expert_ids) ? assigned_expert_ids.filter(Boolean) : [];
    const result = await db.query(
      `INSERT INTO strength_results (user_id, counsellor_admin_id, strengths, career_recommendations, report_url, assigned_expert_ids, report_file_name)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        user_id,
        counsellor_admin_id,
        JSON.stringify(strengths || []),
        JSON.stringify(career_recommendations || []),
        report_url || null,
        ids.length ? ids : [],
        report_file_name && String(report_file_name).trim() ? String(report_file_name).trim() : null
      ]
    );
    return result.rows[0];
  }

  static async update(userId, data) {
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (data.strengths !== undefined) {
      updates.push(`strengths = $${paramCount++}`);
      values.push(JSON.stringify(data.strengths));
    }
    if (data.career_recommendations !== undefined) {
      updates.push(`career_recommendations = $${paramCount++}`);
      values.push(JSON.stringify(data.career_recommendations));
    }
    if (data.report_url !== undefined) {
      updates.push(`report_url = $${paramCount++}`);
      values.push(data.report_url);
    }
    if (data.counsellor_admin_id !== undefined) {
      updates.push(`counsellor_admin_id = $${paramCount++}`);
      values.push(data.counsellor_admin_id);
    }
    if (data.assigned_expert_ids !== undefined) {
      updates.push(`assigned_expert_ids = $${paramCount++}`);
      const ids = Array.isArray(data.assigned_expert_ids) ? data.assigned_expert_ids.filter(Boolean) : [];
      values.push(ids.length ? ids : []);
    }
    if (data.report_file_name !== undefined) {
      updates.push(`report_file_name = $${paramCount++}`);
      values.push(data.report_file_name && String(data.report_file_name).trim() ? String(data.report_file_name).trim() : null);
    }

    if (updates.length === 0) return null;

    values.push(userId);
    const result = await db.query(
      `UPDATE strength_results SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $${paramCount}
       RETURNING *`,
      values
    );
    return result.rows[0] || null;
  }

  static async upsert(data) {
    const existing = await this.findByUserId(data.user_id);
    if (existing) {
      return this.update(data.user_id, data);
    }
    return this.create(data);
  }

  /**
   * Find strength result(s) by report_file_name for matching when uploading PDFs from ZIP.
   * Returns array (one row per match; filename should be unique per result).
   */
  static async findByReportFileName(filename) {
    if (!filename || !String(filename).trim()) return [];
    const name = String(filename).trim();
    const result = await db.query(
      'SELECT * FROM strength_results WHERE report_file_name = $1',
      [name]
    );
    return result.rows || [];
  }
}

module.exports = StrengthResult;
