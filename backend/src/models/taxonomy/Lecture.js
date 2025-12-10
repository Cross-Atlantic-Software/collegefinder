const db = require('../../config/database');

class Lecture {
  /**
   * Find all lectures (with purposes)
   */
  static async findAll() {
    const result = await db.query(
      `SELECT l.*, 
       COALESCE(
         json_agg(DISTINCT jsonb_build_object('id', p.id, 'name', p.name, 'status', p.status))
         FILTER (WHERE p.id IS NOT NULL),
         '[]'
       ) as purposes
       FROM lectures l
       LEFT JOIN lecture_purposes lp ON l.id = lp.lecture_id
       LEFT JOIN purposes p ON lp.purpose_id = p.id
       GROUP BY l.id
       ORDER BY l.sort_order ASC, l.name ASC`
    );
    // Parse purposes JSON
    return result.rows.map(row => ({
      ...row,
      purposes: row.purposes && row.purposes.length > 0 && row.purposes[0].id ? row.purposes : []
    }));
  }

  /**
   * Find lecture by ID (with purposes)
   */
  static async findById(id) {
    const result = await db.query(
      `SELECT l.*, 
       COALESCE(
         json_agg(DISTINCT jsonb_build_object('id', p.id, 'name', p.name, 'status', p.status))
         FILTER (WHERE p.id IS NOT NULL),
         '[]'
       ) as purposes
       FROM lectures l
       LEFT JOIN lecture_purposes lp ON l.id = lp.lecture_id
       LEFT JOIN purposes p ON lp.purpose_id = p.id
       WHERE l.id = $1
       GROUP BY l.id`,
      [id]
    );
    if (result.rows[0]) {
      const row = result.rows[0];
      return {
        ...row,
        purposes: row.purposes && row.purposes.length > 0 && row.purposes[0].id ? row.purposes : []
      };
    }
    return null;
  }

  /**
   * Find lectures by subtopic ID
   */
  static async findBySubtopicId(subtopicId) {
    const result = await db.query(
      'SELECT * FROM lectures WHERE subtopic_id = $1 ORDER BY sort_order ASC, name ASC',
      [subtopicId]
    );
    return result.rows;
  }

  /**
   * Find lectures by subtopic ID with purposes
   */
  static async findBySubtopicIdWithPurposes(subtopicId) {
    const result = await db.query(
      `SELECT l.*, 
       COALESCE(
         json_agg(DISTINCT jsonb_build_object('id', p.id, 'name', p.name, 'status', p.status))
         FILTER (WHERE p.id IS NOT NULL),
         '[]'
       ) as purposes
       FROM lectures l
       LEFT JOIN lecture_purposes lp ON l.id = lp.lecture_id
       LEFT JOIN purposes p ON lp.purpose_id = p.id
       WHERE l.subtopic_id = $1 AND l.status = true
       GROUP BY l.id
       ORDER BY l.sort_order ASC, l.name ASC`,
      [subtopicId]
    );
    // Parse purposes JSON
    return result.rows.map(row => ({
      ...row,
      purposes: row.purposes && row.purposes.length > 0 && row.purposes[0].id ? row.purposes : []
    }));
  }

  /**
   * Find active lectures
   */
  static async findActive() {
    const result = await db.query(
      'SELECT * FROM lectures WHERE status = TRUE ORDER BY sort_order ASC, name ASC'
    );
    return result.rows;
  }

  /**
   * Find lecture by name and subtopic ID
   */
  static async findByNameAndSubtopicId(name, subtopicId) {
    const result = await db.query(
      'SELECT * FROM lectures WHERE name = $1 AND subtopic_id = $2',
      [name, subtopicId]
    );
    return result.rows[0] || null;
  }

  /**
   * Create a new lecture
   */
  static async create(data) {
    const {
      subtopic_id,
      name,
      content_type = 'VIDEO',
      video_file,
      article_content,
      thumbnail,
      status = true,
      description,
      sort_order = 0
    } = data;

    const result = await db.query(
      `INSERT INTO lectures (subtopic_id, name, content_type, video_file, article_content, thumbnail, status, description, sort_order)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        subtopic_id,
        name,
        content_type,
        content_type === 'VIDEO' ? (video_file || null) : null,
        content_type === 'ARTICLE' ? (article_content || null) : null,
        thumbnail || null,
        status,
        description || null,
        sort_order
      ]
    );
    return result.rows[0];
  }

  /**
   * Update a lecture
   */
  static async update(id, data) {
    const {
      subtopic_id,
      name,
      content_type,
      video_file,
      article_content,
      thumbnail,
      status,
      description,
      sort_order
    } = data;

    const updates = [];
    const values = [];
    let paramCount = 1;

    if (subtopic_id !== undefined) {
      updates.push(`subtopic_id = $${paramCount++}`);
      values.push(subtopic_id);
    }
    if (name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(name);
    }
    if (content_type !== undefined) {
      updates.push(`content_type = $${paramCount++}`);
      values.push(content_type);
      // Clear opposite content type when switching
      if (content_type === 'VIDEO') {
        updates.push(`article_content = $${paramCount++}`);
        values.push(null);
      } else if (content_type === 'ARTICLE') {
        updates.push(`video_file = $${paramCount++}`);
        values.push(null);
      }
    }
    if (video_file !== undefined) {
      updates.push(`video_file = $${paramCount++}`);
      values.push(video_file);
    }
    if (article_content !== undefined) {
      updates.push(`article_content = $${paramCount++}`);
      values.push(article_content);
    }
    if (thumbnail !== undefined) {
      updates.push(`thumbnail = $${paramCount++}`);
      values.push(thumbnail);
    }
    if (status !== undefined) {
      updates.push(`status = $${paramCount++}`);
      values.push(status);
    }
    if (description !== undefined) {
      updates.push(`description = $${paramCount++}`);
      values.push(description);
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
      `UPDATE lectures SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
       WHERE id = $${paramCount} RETURNING *`,
      values
    );
    return result.rows[0] || null;
  }

  /**
   * Delete a lecture
   */
  static async delete(id) {
    const result = await db.query('DELETE FROM lectures WHERE id = $1 RETURNING *', [id]);
    return result.rows[0] || null;
  }
}

module.exports = Lecture;

