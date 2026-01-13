const db = require('../../config/database');

class CoachingLocation {
  /**
   * Find all coaching locations
   */
  static async findAll() {
    const result = await db.query(
      `SELECT cl.*, c.name as coaching_name
       FROM coaching_location cl
       LEFT JOIN coachings c ON cl.coaching_id = c.id
       ORDER BY c.name ASC, cl.branch_title ASC`
    );
    return result.rows;
  }

  /**
   * Find locations by coaching ID
   */
  static async findByCoachingId(coachingId) {
    const result = await db.query(
      `SELECT cl.*, c.name as coaching_name
       FROM coaching_location cl
       LEFT JOIN coachings c ON cl.coaching_id = c.id
       WHERE cl.coaching_id = $1
       ORDER BY cl.branch_title ASC`,
      [coachingId]
    );
    return result.rows;
  }

  /**
   * Find location by ID
   */
  static async findById(id) {
    const result = await db.query(
      `SELECT cl.*, c.name as coaching_name
       FROM coaching_location cl
       LEFT JOIN coachings c ON cl.coaching_id = c.id
       WHERE cl.id = $1`,
      [id]
    );
    return result.rows[0] || null;
  }

  /**
   * Create a new coaching location
   */
  static async create(data) {
    const { coaching_id, branch_title, address, state, city, google_map_url } = data;

    const result = await db.query(
      `INSERT INTO coaching_location (coaching_id, branch_title, address, state, city, google_map_url)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [coaching_id, branch_title, address, state, city, google_map_url || null]
    );
    return result.rows[0];
  }

  /**
   * Update a coaching location
   */
  static async update(id, data) {
    const { coaching_id, branch_title, address, state, city, google_map_url } = data;

    const updates = [];
    const values = [];
    let paramCount = 1;

    if (coaching_id !== undefined) {
      updates.push(`coaching_id = $${paramCount++}`);
      values.push(coaching_id);
    }
    if (branch_title !== undefined) {
      updates.push(`branch_title = $${paramCount++}`);
      values.push(branch_title);
    }
    if (address !== undefined) {
      updates.push(`address = $${paramCount++}`);
      values.push(address);
    }
    if (state !== undefined) {
      updates.push(`state = $${paramCount++}`);
      values.push(state);
    }
    if (city !== undefined) {
      updates.push(`city = $${paramCount++}`);
      values.push(city);
    }
    if (google_map_url !== undefined) {
      updates.push(`google_map_url = $${paramCount++}`);
      values.push(google_map_url);
    }

    if (updates.length === 0) {
      return await this.findById(id);
    }

    values.push(id);
    const result = await db.query(
      `UPDATE coaching_location SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
       WHERE id = $${paramCount} RETURNING *`,
      values
    );
    return result.rows[0] || null;
  }

  /**
   * Delete a coaching location
   */
  static async delete(id) {
    const result = await db.query('DELETE FROM coaching_location WHERE id = $1 RETURNING *', [id]);
    return result.rows[0] || null;
  }
}

module.exports = CoachingLocation;
