const db = require('../../config/database');

const TOPIC_SELECT = `
  SELECT t.*, c.sub_id, c.name AS chapter_name
  FROM topics t
  LEFT JOIN chapters c ON c.id = t.chapter_id
`;

class Topic {
  static async findAll() {
    const result = await db.query(
      `${TOPIC_SELECT} ORDER BY t.sort_order ASC, t.name ASC`
    );
    return result.rows;
  }

  static async findById(id) {
    const result = await db.query(`${TOPIC_SELECT} WHERE t.id = $1`, [id]);
    return result.rows[0] || null;
  }

  static async findByName(name) {
    const result = await db.query(
      `${TOPIC_SELECT} WHERE LOWER(t.name) = LOWER($1) LIMIT 1`,
      [name]
    );
    return result.rows[0] || null;
  }

  static async findByNameAndSubjectId(name, subId) {
    const result = await db.query(
      `${TOPIC_SELECT}
       WHERE LOWER(t.name) = LOWER($1) AND c.sub_id = $2`,
      [name, subId]
    );
    return result.rows[0] || null;
  }

  static async findByNameAndChapterId(name, chapterId) {
    const result = await db.query(
      'SELECT * FROM topics WHERE LOWER(name) = LOWER($1) AND chapter_id = $2',
      [name, chapterId]
    );
    return result.rows[0] || null;
  }

  static async findByChapterIdAndNameInsensitive(chapterId, name) {
    const result = await db.query(
      `SELECT * FROM topics
       WHERE chapter_id = $1 AND LOWER(TRIM(name)) = LOWER(TRIM($2))
       LIMIT 1`,
      [chapterId, name]
    );
    return result.rows[0] || null;
  }

  /** @deprecated use findByChapterIdAndNameInsensitive */
  static async findBySubjectIdAndNameInsensitive(subId, name) {
    const result = await db.query(
      `${TOPIC_SELECT}
       WHERE c.sub_id = $1 AND LOWER(TRIM(t.name)) = LOWER(TRIM($2))
       LIMIT 1`,
      [subId, name]
    );
    return result.rows[0] || null;
  }

  static async findAllByTrimmedNameInsensitive(name) {
    const result = await db.query(
      `${TOPIC_SELECT}
       WHERE LOWER(TRIM(t.name)) = LOWER(TRIM($1))
       ORDER BY t.id ASC`,
      [name]
    );
    return result.rows;
  }

  static async create(data) {
    const { chapter_id, name, thumbnail, home_display, status, description, sort_order } = data;
    const result = await db.query(
      `INSERT INTO topics (chapter_id, name, thumbnail, home_display, status, description, sort_order)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [
        chapter_id,
        name,
        thumbnail || null,
        home_display === true || home_display === 'true',
        status !== false && status !== 'false',
        description || null,
        sort_order != null ? parseInt(sort_order, 10) : 0,
      ]
    );
    return this.findById(result.rows[0].id);
  }

  static async update(id, data) {
    const updates = [];
    const values = [];
    let paramCount = 1;

    const fields = ['chapter_id', 'name', 'thumbnail', 'home_display', 'status', 'description', 'sort_order'];
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
    const query = `UPDATE topics SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING id`;
    const result = await db.query(query, values);
    return result.rows[0] ? await this.findById(result.rows[0].id) : null;
  }

  static async findBySubjectIdWithHomeDisplay(subjectId, homeDisplayOnly = false, limitNum = null) {
    let query = `
      ${TOPIC_SELECT}
      WHERE c.sub_id = $1 AND t.status = true`;
    const values = [subjectId];
    if (homeDisplayOnly) {
      query += ' AND t.home_display = true';
    }
    query += ' ORDER BY t.sort_order ASC, t.name ASC';
    if (limitNum != null && !isNaN(limitNum) && limitNum > 0) {
      query += ` LIMIT $${values.length + 1}`;
      values.push(limitNum);
    }
    const result = await db.query(query, values);
    return result.rows;
  }

  static async findByChapterIdWithHomeDisplay(chapterId, homeDisplayOnly = false, limitNum = null) {
    let query = 'SELECT * FROM topics WHERE chapter_id = $1 AND status = true';
    const values = [chapterId];
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

  static async getExamIds(topicId) {
    const result = await db.query(
      'SELECT exam_id FROM topic_exams WHERE topic_id = $1 ORDER BY exam_id',
      [topicId]
    );
    return result.rows.map((r) => r.exam_id);
  }

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

  static async delete(id) {
    const result = await db.query('DELETE FROM topics WHERE id = $1 RETURNING *', [id]);
    return result.rows[0] || null;
  }

  static async deleteAll() {
    const result = await db.query('DELETE FROM topics');
    return result.rowCount || 0;
  }
}

module.exports = Topic;
