const db = require('../../config/database');

class CollegeNews {
  /**
   * Find all college news
   */
  static async findAll() {
    const result = await db.query(
      `SELECT cn.*, c.name as college_name 
       FROM college_news cn
       LEFT JOIN colleges c ON cn.college_id = c.id
       ORDER BY cn.created_at DESC`
    );
    return result.rows;
  }

  /**
   * Find news by college ID
   */
  static async findByCollegeId(collegeId) {
    const result = await db.query(
      'SELECT * FROM college_news WHERE college_id = $1 ORDER BY created_at DESC',
      [collegeId]
    );
    return result.rows;
  }

  /**
   * Find news by ID
   */
  static async findById(id) {
    const result = await db.query(
      `SELECT cn.*, c.name as college_name 
       FROM college_news cn
       LEFT JOIN colleges c ON cn.college_id = c.id
       WHERE cn.id = $1`,
      [id]
    );
    return result.rows[0] || null;
  }

  /**
   * Create a new news article
   */
  static async create(data) {
    const { college_id, title, teaser, url, source_name } = data;

    const result = await db.query(
      `INSERT INTO college_news (college_id, title, teaser, url, source_name)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [college_id, title, teaser, url, source_name || null]
    );
    return result.rows[0];
  }

  /**
   * Update a news article
   */
  static async update(id, data) {
    const { college_id, title, teaser, url, source_name } = data;

    const updates = [];
    const values = [];
    let paramCount = 1;

    if (college_id !== undefined) {
      updates.push(`college_id = $${paramCount++}`);
      values.push(college_id);
    }
    if (title !== undefined) {
      updates.push(`title = $${paramCount++}`);
      values.push(title);
    }
    if (teaser !== undefined) {
      updates.push(`teaser = $${paramCount++}`);
      values.push(teaser);
    }
    if (url !== undefined) {
      updates.push(`url = $${paramCount++}`);
      values.push(url);
    }
    if (source_name !== undefined) {
      updates.push(`source_name = $${paramCount++}`);
      values.push(source_name || null);
    }

    if (updates.length === 0) {
      return await this.findById(id);
    }

    values.push(id);
    const result = await db.query(
      `UPDATE college_news SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
       WHERE id = $${paramCount} RETURNING *`,
      values
    );
    return result.rows[0] || null;
  }

  /**
   * Delete a news article
   */
  static async delete(id) {
    const result = await db.query('DELETE FROM college_news WHERE id = $1 RETURNING *', [id]);
    return result.rows[0] || null;
  }
}

module.exports = CollegeNews;

