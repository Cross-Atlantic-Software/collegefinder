const db = require('../../config/database');

class CollegeLocation {
  /**
   * Find all college locations
   */
  static async findAll() {
    const result = await db.query(
      `SELECT cl.*, c.name as college_name 
       FROM college_location cl
       LEFT JOIN colleges c ON cl.college_id = c.id
       ORDER BY c.name ASC, cl.state ASC, cl.city ASC`
    );
    return result.rows;
  }

  /**
   * Find locations by college ID
   */
  static async findByCollegeId(collegeId) {
    const result = await db.query(
      'SELECT * FROM college_location WHERE college_id = $1 ORDER BY state ASC, city ASC',
      [collegeId]
    );
    return result.rows;
  }

  /**
   * Find location by ID
   */
  static async findById(id) {
    const result = await db.query(
      `SELECT cl.*, c.name as college_name 
       FROM college_location cl
       LEFT JOIN colleges c ON cl.college_id = c.id
       WHERE cl.id = $1`,
      [id]
    );
    return result.rows[0] || null;
  }

  /**
   * Create a new college location
   */
  static async create(data) {
    const { college_id, state, city, google_map_url } = data;

    const result = await db.query(
      `INSERT INTO college_location (college_id, state, city, google_map_url)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [college_id, state, city, google_map_url || null]
    );
    return result.rows[0];
  }

  /**
   * Update a college location
   */
  static async update(id, data) {
    const { college_id, state, city, google_map_url } = data;

    const updates = [];
    const values = [];
    let paramCount = 1;

    if (college_id !== undefined) {
      updates.push(`college_id = $${paramCount++}`);
      values.push(college_id);
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
      values.push(google_map_url || null);
    }

    if (updates.length === 0) {
      return await this.findById(id);
    }

    values.push(id);
    const result = await db.query(
      `UPDATE college_location SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
       WHERE id = $${paramCount} RETURNING *`,
      values
    );
    return result.rows[0] || null;
  }

  /**
   * Delete a college location
   */
  static async delete(id) {
    const result = await db.query('DELETE FROM college_location WHERE id = $1 RETURNING *', [id]);
    return result.rows[0] || null;
  }
}

module.exports = CollegeLocation;

