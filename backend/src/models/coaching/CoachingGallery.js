const db = require('../../config/database');

class CoachingGallery {
  /**
   * Find all coaching gallery images
   */
  static async findAll() {
    const result = await db.query(
      `SELECT cg.*, c.name as coaching_name
       FROM coaching_gallery cg
       LEFT JOIN coachings c ON cg.coaching_id = c.id
       ORDER BY c.name ASC, cg.sort_order ASC, cg.id ASC`
    );
    return result.rows;
  }

  /**
   * Find gallery images by coaching ID
   */
  static async findByCoachingId(coachingId) {
    const result = await db.query(
      `SELECT cg.*, c.name as coaching_name
       FROM coaching_gallery cg
       LEFT JOIN coachings c ON cg.coaching_id = c.id
       WHERE cg.coaching_id = $1
       ORDER BY cg.sort_order ASC, cg.id ASC`,
      [coachingId]
    );
    return result.rows;
  }

  /**
   * Find gallery image by ID
   */
  static async findById(id) {
    const result = await db.query(
      `SELECT cg.*, c.name as coaching_name
       FROM coaching_gallery cg
       LEFT JOIN coachings c ON cg.coaching_id = c.id
       WHERE cg.id = $1`,
      [id]
    );
    return result.rows[0] || null;
  }

  /**
   * Create a new coaching gallery image
   */
  static async create(data) {
    const { coaching_id, image_url, caption, sort_order } = data;

    const result = await db.query(
      `INSERT INTO coaching_gallery (coaching_id, image_url, caption, sort_order)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [coaching_id, image_url, caption || null, sort_order || 0]
    );
    return result.rows[0];
  }

  /**
   * Update a coaching gallery image
   */
  static async update(id, data) {
    const { coaching_id, image_url, caption, sort_order } = data;

    const updates = [];
    const values = [];
    let paramCount = 1;

    if (coaching_id !== undefined) {
      updates.push(`coaching_id = $${paramCount++}`);
      values.push(coaching_id);
    }
    if (image_url !== undefined) {
      updates.push(`image_url = $${paramCount++}`);
      values.push(image_url);
    }
    if (caption !== undefined) {
      updates.push(`caption = $${paramCount++}`);
      values.push(caption);
    }
    if (sort_order !== undefined) {
      updates.push(`sort_order = $${paramCount++}`);
      values.push(sort_order);
    }

    if (updates.length === 0) {
      return await this.findById(id);
    }

    values.push(id);
    const result = await db.query(
      `UPDATE coaching_gallery SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
       WHERE id = $${paramCount} RETURNING *`,
      values
    );
    return result.rows[0] || null;
  }

  /**
   * Delete a coaching gallery image
   */
  static async delete(id) {
    const result = await db.query('DELETE FROM coaching_gallery WHERE id = $1 RETURNING *', [id]);
    return result.rows[0] || null;
  }
}

module.exports = CoachingGallery;
