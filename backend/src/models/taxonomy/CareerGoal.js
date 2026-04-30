const db = require('../../config/database');

class CareerGoal {
  /**
   * Find all career goals taxonomies (with updated_by admin email)
   */
  static async findAll() {
    const result = await db.query(
      `SELECT cg.*, a.email as updated_by_email, s.name AS stream_name
       FROM career_goals_taxonomies cg
       LEFT JOIN admin_users a ON cg.updated_by = a.id
       LEFT JOIN streams s ON cg.stream_id = s.id
       ORDER BY cg.label ASC`
    );
    return result.rows;
  }

  /**
   * Find all active career goals taxonomies (for public use, no stream filter)
   */
  static async findActive() {
    const result = await db.query(
      'SELECT * FROM career_goals_taxonomies WHERE status = TRUE ORDER BY label ASC'
    );
    return result.rows;
  }

  /**
   * Active interests for a given stream (onboarding / profile)
   */
  static async findActiveByStreamId(streamId) {
    const sid = typeof streamId === 'string' ? parseInt(streamId, 10) : streamId;
    if (sid == null || Number.isNaN(sid) || sid < 1) {
      return [];
    }
    const result = await db.query(
      `SELECT * FROM career_goals_taxonomies
       WHERE status = TRUE AND stream_id = $1
       ORDER BY label ASC`,
      [sid]
    );
    return result.rows;
  }

  /**
   * Find career goal taxonomy by ID (with updated_by admin email)
   */
  static async findById(id) {
    const result = await db.query(
      `SELECT cg.*, a.email as updated_by_email, s.name AS stream_name
       FROM career_goals_taxonomies cg
       LEFT JOIN admin_users a ON cg.updated_by = a.id
       LEFT JOIN streams s ON cg.stream_id = s.id
       WHERE cg.id = $1`,
      [id]
    );
    return result.rows[0] || null;
  }

  /**
   * Find career goal taxonomy by label
   */
  static async findByLabel(label) {
    const result = await db.query(
      'SELECT * FROM career_goals_taxonomies WHERE LOWER(label) = LOWER($1)',
      [label]
    );
    return result.rows[0] || null;
  }

  /**
   * Find interest by stream + label (for mappings where the same label may exist on another stream)
   */
  static async findByStreamIdAndLabel(streamId, label) {
    const result = await db.query(
      `SELECT * FROM career_goals_taxonomies
       WHERE stream_id = $1 AND LOWER(TRIM(label)) = LOWER(TRIM($2))`,
      [streamId, label]
    );
    return result.rows[0] || null;
  }

  /**
   * Create a new career goal taxonomy
   */
  static async create(data) {
    const { label, logo, logo_filename, description, status, updated_by, stream_id } = data;
    const result = await db.query(
      `INSERT INTO career_goals_taxonomies (label, logo, logo_filename, description, status, updated_by, stream_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [
        label,
        logo || null,
        logo_filename || null,
        description || null,
        status !== undefined ? status : true,
        updated_by || null,
        stream_id != null && stream_id !== '' ? parseInt(String(stream_id), 10) : null
      ]
    );
    return result.rows[0];
  }

  /**
   * Find career goals with given logo_filename and no logo (missing logos)
   */
  /**
   * Count how many of the given taxonomy IDs are active and tagged with stream_id
   */
  static async countActiveMatchingStream(ids, streamId) {
    if (!ids || ids.length === 0) return 0;
    const ints = ids
      .map((id) => (typeof id === 'string' ? parseInt(id, 10) : id))
      .filter((n) => Number.isInteger(n) && n > 0);
    if (ints.length === 0) return 0;
    const sid = typeof streamId === 'string' ? parseInt(streamId, 10) : streamId;
    if (sid == null || Number.isNaN(sid) || sid < 1) return 0;
    const result = await db.query(
      `SELECT COUNT(*)::int AS c FROM career_goals_taxonomies
       WHERE id = ANY($1::int[]) AND status = TRUE AND stream_id = $2`,
      [ints, sid]
    );
    return result.rows[0]?.c ?? 0;
  }

  static async findMissingLogosByFilename(filename) {
    if (!filename || !String(filename).trim()) return [];
    const result = await db.query(
      `SELECT * FROM career_goals_taxonomies
       WHERE LOWER(TRIM(logo_filename)) = LOWER(TRIM($1))
       AND (logo IS NULL OR logo = '')`,
      [String(filename).trim()]
    );
    return result.rows;
  }

  /**
   * Update a career goal taxonomy
   */
  static async update(id, data) {
    const { label, logo, logo_filename, description, status, updated_by, stream_id } = data;

    const updates = [];
    const values = [];
    let paramCount = 1;

    if (label !== undefined) {
      updates.push(`label = $${paramCount++}`);
      values.push(label);
    }
    if (logo !== undefined) {
      updates.push(`logo = $${paramCount++}`);
      values.push(logo);
    }
    if (logo_filename !== undefined) {
      updates.push(`logo_filename = $${paramCount++}`);
      values.push(logo_filename);
    }
    if (description !== undefined) {
      updates.push(`description = $${paramCount++}`);
      values.push(description);
    }
    if (status !== undefined) {
      updates.push(`status = $${paramCount++}`);
      values.push(status);
    }
    if (updated_by !== undefined) {
      updates.push(`updated_by = $${paramCount++}`);
      values.push(updated_by);
    }
    if (stream_id !== undefined) {
      updates.push(`stream_id = $${paramCount++}`);
      const sid =
        stream_id === null || stream_id === ''
          ? null
          : parseInt(String(stream_id), 10);
      values.push(Number.isNaN(sid) ? null : sid);
    }

    if (updates.length === 0) {
      return null;
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const query = `
      UPDATE career_goals_taxonomies 
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await db.query(query, values);
    return result.rows[0] || null;
  }

  /**
   * Delete a career goal taxonomy
   */
  static async delete(id) {
    const result = await db.query(
      'DELETE FROM career_goals_taxonomies WHERE id = $1 RETURNING *',
      [id]
    );
    return result.rows[0] || null;
  }
}

module.exports = CareerGoal;

