const db = require('../../config/database');

class Lecture {
  static normalizeJsonAgg(arr) {
    if (!arr || !Array.isArray(arr) || arr.length === 0) return [];
    if (arr[0] != null && arr[0].id != null) return arr;
    return [];
  }

  /**
   * Find all lectures (with purposes, streams, subjects, exams)
   */
  static async findAll() {
    const result = await db.query(
      `SELECT l.*,
       COALESCE(
         json_agg(DISTINCT jsonb_build_object('id', p.id, 'name', p.name, 'status', p.status))
         FILTER (WHERE p.id IS NOT NULL),
         '[]'
       ) as purposes,
       COALESCE(
         json_agg(DISTINCT jsonb_build_object('id', st.id, 'name', st.name))
         FILTER (WHERE st.id IS NOT NULL),
         '[]'
       ) as streams,
       COALESCE(
         json_agg(DISTINCT jsonb_build_object('id', subj.id, 'name', subj.name))
         FILTER (WHERE subj.id IS NOT NULL),
         '[]'
       ) as subjects,
       COALESCE(
         json_agg(DISTINCT jsonb_build_object('id', ex.id, 'name', ex.name, 'code', ex.code))
         FILTER (WHERE ex.id IS NOT NULL),
         '[]'
       ) as exams
       FROM lectures l
       LEFT JOIN lecture_purposes lp ON l.id = lp.lecture_id
       LEFT JOIN purposes p ON lp.purpose_id = p.id
       LEFT JOIN lecture_streams ls ON l.id = ls.lecture_id
       LEFT JOIN streams st ON ls.stream_id = st.id
       LEFT JOIN lecture_subjects lsub ON l.id = lsub.lecture_id
       LEFT JOIN subjects subj ON lsub.subject_id = subj.id
       LEFT JOIN lecture_exams le ON l.id = le.lecture_id
       LEFT JOIN exams_taxonomies ex ON le.exam_id = ex.id
       GROUP BY l.id
       ORDER BY l.sort_order ASC, l.name ASC`
    );
    return result.rows.map((row) => ({
      ...row,
      purposes: Lecture.normalizeJsonAgg(row.purposes),
      streams: Lecture.normalizeJsonAgg(row.streams),
      subjects: Lecture.normalizeJsonAgg(row.subjects),
      exams: Lecture.normalizeJsonAgg(row.exams),
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
       ) as purposes,
       COALESCE(
         json_agg(DISTINCT jsonb_build_object('id', st.id, 'name', st.name))
         FILTER (WHERE st.id IS NOT NULL),
         '[]'
       ) as streams,
       COALESCE(
         json_agg(DISTINCT jsonb_build_object('id', subj.id, 'name', subj.name))
         FILTER (WHERE subj.id IS NOT NULL),
         '[]'
       ) as subjects,
       COALESCE(
         json_agg(DISTINCT jsonb_build_object('id', ex.id, 'name', ex.name, 'code', ex.code))
         FILTER (WHERE ex.id IS NOT NULL),
         '[]'
       ) as exams
       FROM lectures l
       LEFT JOIN lecture_purposes lp ON l.id = lp.lecture_id
       LEFT JOIN purposes p ON lp.purpose_id = p.id
       LEFT JOIN lecture_streams ls ON l.id = ls.lecture_id
       LEFT JOIN streams st ON ls.stream_id = st.id
       LEFT JOIN lecture_subjects lsub ON l.id = lsub.lecture_id
       LEFT JOIN subjects subj ON lsub.subject_id = subj.id
       LEFT JOIN lecture_exams le ON l.id = le.lecture_id
       LEFT JOIN exams_taxonomies ex ON le.exam_id = ex.id
       WHERE l.id = $1
       GROUP BY l.id`,
      [id]
    );
    if (result.rows[0]) {
      const row = result.rows[0];
      return {
        ...row,
        purposes: Lecture.normalizeJsonAgg(row.purposes),
        streams: Lecture.normalizeJsonAgg(row.streams),
        subjects: Lecture.normalizeJsonAgg(row.subjects),
        exams: Lecture.normalizeJsonAgg(row.exams),
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
      topic_id,
      subtopic_id,
      name,
      content_type = 'VIDEO',
      video_file,
      iframe_code,
      article_content,
      thumbnail,
      thumbnail_filename,
      status = true,
      description,
      sort_order = 0
    } = data;

    const result = await db.query(
      `INSERT INTO lectures (topic_id, subtopic_id, name, content_type, video_file, iframe_code, article_content, thumbnail, thumbnail_filename, status, description, sort_order)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [
        topic_id,
        subtopic_id,
        name,
        content_type,
        content_type === 'VIDEO' ? (video_file || null) : null,
        content_type === 'VIDEO' ? (iframe_code || null) : null,
        content_type === 'ARTICLE' ? (article_content || null) : null,
        thumbnail || null,
        thumbnail_filename != null ? String(thumbnail_filename).trim() || null : null,
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
      topic_id,
      subtopic_id,
      name,
      content_type,
      video_file,
      iframe_code,
      article_content,
      thumbnail,
      thumbnail_filename,
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
        updates.push(`iframe_code = $${paramCount++}`);
        values.push(null);
      }
    }
    if (video_file !== undefined) {
      updates.push(`video_file = $${paramCount++}`);
      values.push(video_file);
    }
    if (iframe_code !== undefined) {
      updates.push(`iframe_code = $${paramCount++}`);
      values.push(iframe_code);
    }
    if (article_content !== undefined) {
      updates.push(`article_content = $${paramCount++}`);
      values.push(article_content);
    }
    if (thumbnail !== undefined) {
      updates.push(`thumbnail = $${paramCount++}`);
      values.push(thumbnail);
    }
    if (thumbnail_filename !== undefined) {
      updates.push(`thumbnail_filename = $${paramCount++}`);
      values.push(thumbnail_filename != null ? String(thumbnail_filename).trim() || null : null);
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

  static async setStreams(lectureId, streamIds) {
    await db.query('DELETE FROM lecture_streams WHERE lecture_id = $1', [lectureId]);
    if (streamIds && streamIds.length > 0) {
      const values = [];
      const placeholders = [];
      streamIds.forEach((sid, index) => {
        values.push(lectureId, sid);
        placeholders.push(`($${index * 2 + 1}, $${index * 2 + 2})`);
      });
      await db.query(
        `INSERT INTO lecture_streams (lecture_id, stream_id) VALUES ${placeholders.join(', ')}`,
        values
      );
    }
  }

  static async setSubjects(lectureId, subjectIds) {
    await db.query('DELETE FROM lecture_subjects WHERE lecture_id = $1', [lectureId]);
    if (subjectIds && subjectIds.length > 0) {
      const values = [];
      const placeholders = [];
      subjectIds.forEach((sid, index) => {
        values.push(lectureId, sid);
        placeholders.push(`($${index * 2 + 1}, $${index * 2 + 2})`);
      });
      await db.query(
        `INSERT INTO lecture_subjects (lecture_id, subject_id) VALUES ${placeholders.join(', ')}`,
        values
      );
    }
  }

  static async setExams(lectureId, examIds) {
    await db.query('DELETE FROM lecture_exams WHERE lecture_id = $1', [lectureId]);
    if (examIds && examIds.length > 0) {
      const values = [];
      const placeholders = [];
      examIds.forEach((eid, index) => {
        values.push(lectureId, eid);
        placeholders.push(`($${index * 2 + 1}, $${index * 2 + 2})`);
      });
      await db.query(
        `INSERT INTO lecture_exams (lecture_id, exam_id) VALUES ${placeholders.join(', ')}`,
        values
      );
    }
  }

  static async findMissingThumbnailsByFilename(filename) {
    if (!filename || !String(filename).trim()) return [];
    const result = await db.query(
      `SELECT * FROM lectures
       WHERE LOWER(TRIM(thumbnail_filename)) = LOWER(TRIM($1))
       AND (thumbnail IS NULL OR thumbnail = '')`,
      [String(filename).trim()]
    );
    return result.rows;
  }
}

module.exports = Lecture;

