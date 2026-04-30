const db = require('../../config/database');

class Topic {
  /**
   * Find all topics
   */
  static async findAll() {
    const result = await db.query(
      'SELECT * FROM topics ORDER BY sort_order ASC, name ASC'
    );
    return result.rows;
  }

  /**
   * Find topic by ID
   */
  static async findById(id) {
    const result = await db.query(
      'SELECT * FROM topics WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  /**
   * Find topic by name (first match)
   */
  static async findByName(name) {
    const result = await db.query(
      'SELECT * FROM topics WHERE LOWER(name) = LOWER($1) LIMIT 1',
      [name]
    );
    return result.rows[0] || null;
  }

  /**
   * Find topic by name and subject ID
   */
  static async findByNameAndSubjectId(name, subId) {
    const result = await db.query(
      'SELECT * FROM topics WHERE LOWER(name) = LOWER($1) AND sub_id = $2',
      [name, subId]
    );
    return result.rows[0] || null;
  }

  /** All topics whose trimmed name matches case-insensitively (for global uniqueness / Excel linking). */
  static async findAllByTrimmedNameInsensitive(name) {
    const result = await db.query(
      `SELECT * FROM topics WHERE LOWER(TRIM(name)) = LOWER(TRIM($1)) ORDER BY id ASC`,
      [name]
    );
    return result.rows;
  }

  /**
   * Create a new topic
   */
  static async create(data) {
    const { sub_id, name, thumbnail, home_display, status, description, sort_order } = data;
    const result = await db.query(
      `INSERT INTO topics (sub_id, name, thumbnail, home_display, status, description, sort_order)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [
        sub_id,
        name,
        thumbnail || null,
        home_display === true || home_display === 'true',
        status !== false && status !== 'false',
        description || null,
        sort_order != null ? parseInt(sort_order, 10) : 0
      ]
    );
    return result.rows[0];
  }

  /**
   * Update a topic
   */
  static async update(id, data) {
    const updates = [];
    const values = [];
    let paramCount = 1;

    const fields = ['sub_id', 'name', 'thumbnail', 'home_display', 'status', 'description', 'sort_order'];
    for (const field of fields) {
      if (data[field] !== undefined) {
        if (field === 'home_display' || field === 'status') {
          updates.push(`${field} = $${paramCount++}`);
          values.push(data[field] === true || data[field] === 'true');
        } else if (field === 'sort_order') {
          updates.push(`${field} = $${paramCount++}`);
          values.push(parseInt(data[field], 10));
        } else {
          updates.push(`${field} = $${paramCount++}`);
          values.push(data[field]);
        }
      }
    }

    if (updates.length === 0) return await this.findById(id);

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);
    const query = `UPDATE topics SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`;
    const result = await db.query(query, values);
    return result.rows[0] || null;
  }

  /**
   * Find topics by subject ID, optionally filter by home_display and limit
   */
  static async findBySubjectIdWithHomeDisplay(subjectId, homeDisplayOnly = false, limitNum = null) {
    let query = 'SELECT * FROM topics WHERE sub_id = $1 AND status = true';
    const values = [subjectId];
    if (homeDisplayOnly) {
      query += ' AND home_display = true';
    }
    query += ' ORDER BY sort_order ASC, name ASC';
    if (limitNum != null && !isNaN(limitNum) && limitNum > 0) {
      query += ` LIMIT $${values.length + 1}`;
      values.push(limitNum);
    }
    const result = await db.query(query, values);
    return result.rows;
  }

  /**
   * Get exam IDs for a topic (max 10)
   */
  static async getExamIds(topicId) {
    const result = await db.query(
      'SELECT exam_id FROM topic_exams WHERE topic_id = $1 ORDER BY exam_id',
      [topicId]
    );
    return result.rows.map((r) => r.exam_id);
  }

  /**
   * Get exam IDs for multiple topics (returns Map of topicId -> exam_id array)
   */
  static async getExamIdsByTopicIds(topicIds) {
    if (!topicIds || topicIds.length === 0) return {};
    const result = await db.query(
      'SELECT topic_id, exam_id FROM topic_exams WHERE topic_id = ANY($1) ORDER BY topic_id, exam_id',
      [topicIds]
    );
    const map = {};
    topicIds.forEach((id) => { map[id] = []; });
    result.rows.forEach((r) => {
      if (!map[r.topic_id]) map[r.topic_id] = [];
      map[r.topic_id].push(r.exam_id);
    });
    return map;
  }

  /**
   * Set exam IDs for a topic (replaces existing; max 10)
   */
  static async setExamIds(topicId, examIds) {
    await db.query('DELETE FROM topic_exams WHERE topic_id = $1', [topicId]);
    const ids = Array.isArray(examIds) ? examIds.slice(0, 10).filter((id) => id != null && !isNaN(Number(id))) : [];
    if (ids.length > 0) {
      const values = ids.map((examId) => [topicId, parseInt(examId, 10)]);
      const placeholders = values.map((_, i) => `($${i * 2 + 1}, $${i * 2 + 2})`).join(', ');
      const flat = values.flat();
      await db.query(
        `INSERT INTO topic_exams (topic_id, exam_id) VALUES ${placeholders}`,
        flat
      );
    }
  }

  /**
   * Delete a topic
   */
  static async delete(id) {
    const result = await db.query(
      'DELETE FROM topics WHERE id = $1 RETURNING *',
      [id]
    );
    return result.rows[0] || null;
  }

  /**
   * Delete all topics
   */
  static async deleteAll() {
    const result = await db.query('DELETE FROM topics');
    return result.rowCount || 0;
  }
}

module.exports = Topic;
