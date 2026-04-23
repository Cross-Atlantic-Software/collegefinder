const db = require('../../config/database');

class Subtopic {
  /**
   * Find all subtopics
   */
  static async findAll() {
    const result = await db.query(
      'SELECT * FROM subtopics ORDER BY sort_order ASC, name ASC'
    );
    return result.rows;
  }

  /**
   * Find subtopic by ID
   */
  static async findById(id) {
    const result = await db.query('SELECT * FROM subtopics WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  /**
   * Find subtopics by topic ID
   */
  static async findByTopicId(topicId) {
    const result = await db.query(
      'SELECT * FROM subtopics WHERE topic_id = $1 ORDER BY sort_order ASC, name ASC',
      [topicId]
    );
    return result.rows;
  }

  /**
   * Find active subtopics
   */
  static async findActive() {
    const result = await db.query(
      'SELECT * FROM subtopics WHERE status = TRUE ORDER BY sort_order ASC, name ASC'
    );
    return result.rows;
  }

  /**
   * Find subtopic by name and topic ID
   */
  static async findByNameAndTopicId(name, topicId) {
    const result = await db.query(
      'SELECT * FROM subtopics WHERE name = $1 AND topic_id = $2',
      [name, topicId]
    );
    return result.rows[0] || null;
  }

  /** Case-insensitive name match within topic (for bulk Excel). */
  static async findByTopicIdAndNameInsensitive(topicId, name) {
    const result = await db.query(
      `SELECT * FROM subtopics WHERE topic_id = $1 AND LOWER(TRIM(name)) = LOWER(TRIM($2)) LIMIT 1`,
      [topicId, name]
    );
    return result.rows[0] || null;
  }

  /** All subtopics whose trimmed name matches case-insensitively (global uniqueness / bulk checks). */
  static async findAllByTrimmedNameInsensitive(name) {
    const result = await db.query(
      `SELECT * FROM subtopics WHERE LOWER(TRIM(name)) = LOWER(TRIM($1)) ORDER BY id ASC`,
      [name]
    );
    return result.rows;
  }

  /**
   * Create a new subtopic
   */
  static async create(data) {
    const {
      topic_id,
      name,
      status = true,
      description,
      sort_order = 0
    } = data;

    const result = await db.query(
      `INSERT INTO subtopics (topic_id, name, status, description, sort_order)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [topic_id, name, status, description || null, sort_order]
    );
    return result.rows[0];
  }

  /**
   * Update a subtopic
   */
  static async update(id, data) {
    const {
      topic_id,
      name,
      status,
      description,
      sort_order
    } = data;

    const updates = [];
    const values = [];
    let paramCount = 1;

    if (topic_id !== undefined) {
      updates.push(`topic_id = $${paramCount++}`);
      values.push(topic_id);
    }
    if (name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(name);
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
      `UPDATE subtopics SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
       WHERE id = $${paramCount} RETURNING *`,
      values
    );
    return result.rows[0] || null;
  }

  /**
   * Get exam IDs for a subtopic (max 10)
   */
  static async getExamIds(subtopicId) {
    const result = await db.query(
      'SELECT exam_id FROM subtopic_exams WHERE subtopic_id = $1 ORDER BY exam_id',
      [subtopicId]
    );
    return result.rows.map((r) => r.exam_id);
  }

  /**
   * Get exam IDs for multiple subtopics (returns Map of subtopicId -> exam_id array)
   */
  static async getExamIdsBySubtopicIds(subtopicIds) {
    if (!subtopicIds || subtopicIds.length === 0) return {};
    const result = await db.query(
      'SELECT subtopic_id, exam_id FROM subtopic_exams WHERE subtopic_id = ANY($1) ORDER BY subtopic_id, exam_id',
      [subtopicIds]
    );
    const map = {};
    subtopicIds.forEach((id) => { map[id] = []; });
    result.rows.forEach((r) => {
      if (!map[r.subtopic_id]) map[r.subtopic_id] = [];
      map[r.subtopic_id].push(r.exam_id);
    });
    return map;
  }

  /**
   * Set exam IDs for a subtopic (replaces existing; max 10)
   */
  static async setExamIds(subtopicId, examIds) {
    await db.query('DELETE FROM subtopic_exams WHERE subtopic_id = $1', [subtopicId]);
    const ids = Array.isArray(examIds) ? examIds.slice(0, 10).filter((id) => id != null && !isNaN(Number(id))) : [];
    if (ids.length > 0) {
      const values = ids.map((examId) => [subtopicId, parseInt(examId, 10)]);
      const placeholders = values.map((_, i) => `($${i * 2 + 1}, $${i * 2 + 2})`).join(', ');
      const flat = values.flat();
      await db.query(
        `INSERT INTO subtopic_exams (subtopic_id, exam_id) VALUES ${placeholders}`,
        flat
      );
    }
  }

  /**
   * Delete a subtopic
   */
  static async delete(id) {
    const result = await db.query('DELETE FROM subtopics WHERE id = $1 RETURNING *', [id]);
    return result.rows[0] || null;
  }
}

module.exports = Subtopic;

