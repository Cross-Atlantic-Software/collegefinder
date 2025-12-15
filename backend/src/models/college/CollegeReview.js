const db = require('../../config/database');

class CollegeReview {
  /**
   * Find all college reviews
   */
  static async findAll() {
    const result = await db.query(
      `SELECT cr.*, c.name as college_name, u.name as user_name, u.email as user_email
       FROM college_reviews cr
       LEFT JOIN colleges c ON cr.college_id = c.id
       LEFT JOIN users u ON cr.user_id = u.id
       ORDER BY cr.created_at DESC`
    );
    return result.rows;
  }

  /**
   * Find reviews by college ID
   */
  static async findByCollegeId(collegeId) {
    const result = await db.query(
      `SELECT cr.*, u.name as user_name, u.email as user_email
       FROM college_reviews cr
       LEFT JOIN users u ON cr.user_id = u.id
       WHERE cr.college_id = $1 
       ORDER BY cr.created_at DESC`,
      [collegeId]
    );
    return result.rows;
  }

  /**
   * Find reviews by user ID
   */
  static async findByUserId(userId) {
    const result = await db.query(
      `SELECT cr.*, c.name as college_name
       FROM college_reviews cr
       LEFT JOIN colleges c ON cr.college_id = c.id
       WHERE cr.user_id = $1 
       ORDER BY cr.created_at DESC`,
      [userId]
    );
    return result.rows;
  }

  /**
   * Find review by ID
   */
  static async findById(id) {
    const result = await db.query(
      `SELECT cr.*, c.name as college_name, u.name as user_name, u.email as user_email
       FROM college_reviews cr
       LEFT JOIN colleges c ON cr.college_id = c.id
       LEFT JOIN users u ON cr.user_id = u.id
       WHERE cr.id = $1`,
      [id]
    );
    return result.rows[0] || null;
  }

  /**
   * Create a new review
   */
  static async create(data) {
    const { college_id, user_id, rating, review_text, is_approved } = data;

    const result = await db.query(
      `INSERT INTO college_reviews (college_id, user_id, rating, review_text, is_approved)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [college_id, user_id, rating, review_text || null, is_approved !== undefined ? is_approved : false]
    );
    return result.rows[0];
  }

  /**
   * Update a review
   */
  static async update(id, data) {
    const { college_id, user_id, rating, review_text, is_approved } = data;

    const updates = [];
    const values = [];
    let paramCount = 1;

    if (college_id !== undefined) {
      updates.push(`college_id = $${paramCount++}`);
      values.push(college_id);
    }
    if (user_id !== undefined) {
      updates.push(`user_id = $${paramCount++}`);
      values.push(user_id);
    }
    if (rating !== undefined) {
      updates.push(`rating = $${paramCount++}`);
      values.push(rating);
    }
    if (review_text !== undefined) {
      updates.push(`review_text = $${paramCount++}`);
      values.push(review_text || null);
    }
    if (is_approved !== undefined) {
      updates.push(`is_approved = $${paramCount++}`);
      values.push(is_approved);
    }

    if (updates.length === 0) {
      return await this.findById(id);
    }

    values.push(id);
    const result = await db.query(
      `UPDATE college_reviews SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
       WHERE id = $${paramCount} RETURNING *`,
      values
    );
    return result.rows[0] || null;
  }

  /**
   * Delete a review
   */
  static async delete(id) {
    const result = await db.query('DELETE FROM college_reviews WHERE id = $1 RETURNING *', [id]);
    return result.rows[0] || null;
  }
}

module.exports = CollegeReview;

