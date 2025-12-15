const db = require('../../config/database');

class CollegeGallery {
  /**
   * Find all college gallery images
   */
  static async findAll() {
    const result = await db.query(
      `SELECT cg.*, c.name as college_name 
       FROM college_gallery cg
       LEFT JOIN colleges c ON cg.college_id = c.id
       ORDER BY c.name ASC, cg.sort_order ASC, cg.created_at DESC`
    );
    return result.rows;
  }

  /**
   * Find gallery images by college ID
   */
  static async findByCollegeId(collegeId) {
    const result = await db.query(
      'SELECT * FROM college_gallery WHERE college_id = $1 ORDER BY sort_order ASC, created_at DESC',
      [collegeId]
    );
    return result.rows;
  }

  /**
   * Find gallery image by ID
   */
  static async findById(id) {
    const result = await db.query(
      `SELECT cg.*, c.name as college_name 
       FROM college_gallery cg
       LEFT JOIN colleges c ON cg.college_id = c.id
       WHERE cg.id = $1`,
      [id]
    );
    return result.rows[0] || null;
  }

  /**
   * Create a new gallery image
   */
  static async create(data) {
    const { college_id, image_url, caption, sort_order } = data;

    const result = await db.query(
      `INSERT INTO college_gallery (college_id, image_url, caption, sort_order)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [college_id, image_url, caption || null, sort_order || 0]
    );
    return result.rows[0];
  }

  /**
   * Update a gallery image
   */
  static async update(id, data) {
    const { college_id, image_url, caption, sort_order } = data;

    const updates = [];
    const values = [];
    let paramCount = 1;

    if (college_id !== undefined) {
      updates.push(`college_id = $${paramCount++}`);
      values.push(college_id);
    }
    if (image_url !== undefined) {
      updates.push(`image_url = $${paramCount++}`);
      values.push(image_url);
    }
    if (caption !== undefined) {
      updates.push(`caption = $${paramCount++}`);
      values.push(caption || null);
    }
    if (sort_order !== undefined) {
      updates.push(`sort_order = $${paramCount++}`);
      values.push(sort_order || 0);
    }

    if (updates.length === 0) {
      return await this.findById(id);
    }

    values.push(id);
    const result = await db.query(
      `UPDATE college_gallery SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
       WHERE id = $${paramCount} RETURNING *`,
      values
    );
    return result.rows[0] || null;
  }

  /**
   * Delete a gallery image
   */
  static async delete(id) {
    const result = await db.query('DELETE FROM college_gallery WHERE id = $1 RETURNING *', [id]);
    return result.rows[0] || null;
  }
}

module.exports = CollegeGallery;

