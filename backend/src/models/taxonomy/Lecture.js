const db = require('../../config/database');

class Lecture {
  static displayNameExpr(alias = 'l') {
    return `COALESCE(NULLIF(TRIM(${alias}.youtube_title), ''), 'Untitled lecture')`;
  }

  static normalizeJsonAgg(arr) {
    if (!arr || !Array.isArray(arr) || arr.length === 0) return [];
    if (arr[0] != null && arr[0].id != null) return arr;
    return [];
  }

  /**
   * Find all lectures (with streams, subjects, exams)
   */
  static async findAll() {
    const result = await db.query(
      `SELECT l.*,
       ${Lecture.displayNameExpr('l')} AS name,
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
       LEFT JOIN lecture_streams ls ON l.id = ls.lecture_id
       LEFT JOIN streams st ON ls.stream_id = st.id
       LEFT JOIN lecture_subjects lsub ON l.id = lsub.lecture_id
       LEFT JOIN subjects subj ON lsub.subject_id = subj.id
       LEFT JOIN lecture_exams le ON l.id = le.lecture_id
       LEFT JOIN exams_taxonomies ex ON le.exam_id = ex.id
       GROUP BY l.id
       ORDER BY l.sort_order ASC, ${Lecture.displayNameExpr('l')} ASC`
    );
    return result.rows.map((row) => ({
      ...row,
      streams: Lecture.normalizeJsonAgg(row.streams),
      subjects: Lecture.normalizeJsonAgg(row.subjects),
      exams: Lecture.normalizeJsonAgg(row.exams),
    }));
  }

  /**
   * Find lecture by ID (with streams, subjects, exams)
   */
  static async findById(id) {
    const result = await db.query(
      `SELECT l.*,
       ${Lecture.displayNameExpr('l')} AS name,
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
      `SELECT *, ${Lecture.displayNameExpr('lectures')} AS name
       FROM lectures
       WHERE subtopic_id = $1
       ORDER BY sort_order ASC, ${Lecture.displayNameExpr('lectures')} ASC`,
      [subtopicId]
    );
    return result.rows;
  }

  /**
   * Active lectures for a subtopic (used by topic detail / self-study)
   */
  static async findBySubtopicIdWithPurposes(subtopicId) {
    const result = await db.query(
      `SELECT *, ${Lecture.displayNameExpr('lectures')} AS name
       FROM lectures
       WHERE subtopic_id = $1 AND status = true
       ORDER BY sort_order ASC, ${Lecture.displayNameExpr('lectures')} ASC`,
      [subtopicId]
    );
    return result.rows;
  }

  /**
   * Find active lectures
   */
  static async findActive() {
    const result = await db.query(
      `SELECT *, ${Lecture.displayNameExpr('lectures')} AS name
       FROM lectures
       WHERE status = TRUE
       ORDER BY sort_order ASC, ${Lecture.displayNameExpr('lectures')} ASC`
    );
    return result.rows;
  }

  /**
   * Find lecture by youtube title and subtopic ID
   */
  static async findByYoutubeTitleAndSubtopicId(youtubeTitle, subtopicId) {
    const result = await db.query(
      `SELECT *, ${Lecture.displayNameExpr('lectures')} AS name
       FROM lectures
       WHERE LOWER(TRIM(youtube_title)) = LOWER(TRIM($1)) AND subtopic_id = $2`,
      [youtubeTitle, subtopicId]
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
      content_type = 'VIDEO',
      video_file,
      iframe_code,
      article_content,
      thumbnail,
      thumbnail_filename,
      status = true,
      description,
      key_topics_to_be_covered,
      youtube_title,
      youtube_channel_name,
      youtube_channel_id,
      youtube_channel_url,
      youtube_like_count,
      youtube_subscriber_count,
      sort_order = 0
    } = data;

    const result = await db.query(
      `INSERT INTO lectures (topic_id, subtopic_id, content_type, video_file, iframe_code, article_content, thumbnail, thumbnail_filename, status, description, key_topics_to_be_covered, youtube_title, youtube_channel_name, youtube_channel_id, youtube_channel_url, youtube_like_count, youtube_subscriber_count, sort_order)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
       RETURNING *`,
      [
        topic_id,
        subtopic_id,
        content_type,
        content_type === 'VIDEO' ? (video_file || null) : null,
        content_type === 'VIDEO' ? (iframe_code || null) : null,
        content_type === 'ARTICLE' ? (article_content || null) : null,
        thumbnail || null,
        thumbnail_filename != null ? String(thumbnail_filename).trim() || null : null,
        status,
        description || null,
        key_topics_to_be_covered != null && String(key_topics_to_be_covered).trim() !== ''
          ? String(key_topics_to_be_covered).trim()
          : null,
        youtube_title || null,
        youtube_channel_name || null,
        youtube_channel_id || null,
        youtube_channel_url || null,
        youtube_like_count != null ? Number(youtube_like_count) : null,
        youtube_subscriber_count != null ? Number(youtube_subscriber_count) : null,
        sort_order
      ]
    );
    return {
      ...result.rows[0],
      name: (result.rows[0]?.youtube_title || '').trim() || 'Untitled lecture',
    };
  }

  /**
   * Update a lecture
   */
  static async update(id, data) {
    const {
      topic_id,
      subtopic_id,
      content_type,
      video_file,
      iframe_code,
      article_content,
      thumbnail,
      thumbnail_filename,
      status,
      description,
      key_topics_to_be_covered,
      youtube_title,
      youtube_channel_name,
      youtube_channel_id,
      youtube_channel_url,
      youtube_like_count,
      youtube_subscriber_count,
      hook_summary,
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
    if (key_topics_to_be_covered !== undefined) {
      updates.push(`key_topics_to_be_covered = $${paramCount++}`);
      values.push(
        key_topics_to_be_covered != null && String(key_topics_to_be_covered).trim() !== ''
          ? String(key_topics_to_be_covered).trim()
          : null
      );
    }
    if (youtube_title !== undefined) {
      updates.push(`youtube_title = $${paramCount++}`);
      values.push(youtube_title);
    }
    if (youtube_channel_name !== undefined) {
      updates.push(`youtube_channel_name = $${paramCount++}`);
      values.push(youtube_channel_name);
    }
    if (youtube_channel_id !== undefined) {
      updates.push(`youtube_channel_id = $${paramCount++}`);
      values.push(youtube_channel_id);
    }
    if (youtube_channel_url !== undefined) {
      updates.push(`youtube_channel_url = $${paramCount++}`);
      values.push(youtube_channel_url);
    }
    if (youtube_like_count !== undefined) {
      updates.push(`youtube_like_count = $${paramCount++}`);
      values.push(youtube_like_count);
    }
    if (youtube_subscriber_count !== undefined) {
      updates.push(`youtube_subscriber_count = $${paramCount++}`);
      values.push(youtube_subscriber_count);
    }
    if (hook_summary !== undefined) {
      updates.push(`hook_summary = $${paramCount++}`);
      values.push(
        hook_summary != null && String(hook_summary).trim() !== '' ? String(hook_summary).trim() : null
      );
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
    if (!result.rows[0]) return null;
    return {
      ...result.rows[0],
      name: (result.rows[0]?.youtube_title || '').trim() || 'Untitled lecture',
    };
  }

  /**
   * Video lectures tagged with a stream (lecture_streams), grouped by taxonomy subject (topic.sub_id).
   * Used for dashboard Exam Prep self-study feed.
   */
  static async findVideoLecturesForExamPrepByStream(streamId) {
    const sid = parseInt(streamId, 10);
    if (Number.isNaN(sid) || sid <= 0) return [];

    const result = await db.query(
      `SELECT
         l.id,
         l.iframe_code,
         l.video_file,
         l.youtube_title,
         l.youtube_channel_name,
         l.youtube_like_count,
         l.youtube_subscriber_count,
         l.hook_summary,
         l.updated_at,
         t.id AS topic_id,
         t.name AS topic_name,
         subj.id AS subject_id,
         subj.name AS subject_name,
         (
           COALESCE(l.youtube_like_count, 0)::numeric
           + COALESCE(l.youtube_subscriber_count, 0)::numeric / 1000.0
         ) AS rank_score
       FROM lectures l
       INNER JOIN lecture_streams ls ON ls.lecture_id = l.id AND ls.stream_id = $1
       INNER JOIN topics t ON l.topic_id = t.id
       INNER JOIN subjects subj ON t.sub_id = subj.id
       WHERE l.status = TRUE
         AND l.content_type = 'VIDEO'
         AND (
           (l.iframe_code IS NOT NULL AND TRIM(l.iframe_code) <> '')
           OR (l.video_file IS NOT NULL AND TRIM(l.video_file) <> '')
         )
       ORDER BY subj.name ASC, t.name ASC, rank_score DESC NULLS LAST, l.updated_at DESC`,
      [sid]
    );
    return result.rows;
  }

  /**
   * Delete a lecture
   */
  static async delete(id) {
    const result = await db.query('DELETE FROM lectures WHERE id = $1 RETURNING *', [id]);
    if (!result.rows[0]) return null;
    return {
      ...result.rows[0],
      name: (result.rows[0]?.youtube_title || '').trim() || 'Untitled lecture',
    };
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
    return result.rows.map((row) => ({
      ...row,
      name: (row.youtube_title || '').trim() || 'Untitled lecture',
    }));
  }
}

module.exports = Lecture;

