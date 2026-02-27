const db = require('../../config/database');

class Question {
  /**
   * Find question by ID
   */
  static async findById(id) {
    const result = await db.query('SELECT * FROM questions WHERE id = $1', [id]);
    return result.rows[0];
  }

  /**
   * Find questions by filters
   */
  static async findByFilters(filters) {
    const { exam_id, subject, difficulty, topic, question_type, section_name, section_type, limit = 10, offset = 0 } = filters;
    let query = 'SELECT * FROM questions WHERE exam_id = $1';
    let params = [exam_id];
    let paramIndex = 2;

    if (subject) {
      query += ` AND LOWER(subject) = LOWER($${paramIndex})`;
      params.push(subject);
      paramIndex++;
    }

    if (difficulty) {
      query += ` AND difficulty = $${paramIndex}`;
      params.push(difficulty);
      paramIndex++;
    }

    if (topic) {
      query += ` AND LOWER(topic) = LOWER($${paramIndex})`;
      params.push(topic);
      paramIndex++;
    }

    if (question_type) {
      query += ` AND question_type = $${paramIndex}`;
      params.push(question_type);
      paramIndex++;
    }

    if (section_name) {
      query += ` AND LOWER(TRIM(section_name)) = LOWER(TRIM($${paramIndex}))`;
      params.push(section_name);
      paramIndex++;
    }

    if (section_type) {
      query += ` AND section_type = $${paramIndex}`;
      params.push(section_type);
      paramIndex++;
    }

    // Order by usage count (ascending) and quality rating (descending) to prefer less used, high quality questions
    query += ` ORDER BY usage_count ASC, quality_rating DESC, RANDOM() LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await db.query(query, params);
    return result.rows;
  }

  /**
   * Find questions by IDs
   */
  static async findByIds(ids) {
    if (!ids || ids.length === 0) return [];
    
    const placeholders = ids.map((_, index) => `$${index + 1}`).join(',');
    const result = await db.query(
      `SELECT * FROM questions WHERE id IN (${placeholders}) ORDER BY id`,
      ids
    );
    return result.rows;
  }

  /**
   * Search questions by text
   */
  static async search(searchTerm, examId, limit = 20) {
    const result = await db.query(`
      SELECT * FROM questions 
      WHERE exam_id = $1 AND (
        question_text ILIKE $2 OR 
        subject ILIKE $2 OR 
        topic ILIKE $2 OR 
        sub_topic ILIKE $2
      )
      ORDER BY usage_count ASC, quality_rating DESC
      LIMIT $3
    `, [examId, `%${searchTerm}%`, limit]);
    return result.rows;
  }

  /**
   * Create a new question
   */
  static async create(data) {
    const {
      exam_id, subject, unit, topic, sub_topic, concept_tags, difficulty,
      question_type, question_text, options, correct_option, solution_text,
      marks, negative_marks, source, generation_prompt_version
    } = data;

    const result = await db.query(`
      INSERT INTO questions (
        exam_id, subject, unit, topic, sub_topic, concept_tags, difficulty,
        question_type, question_text, options, correct_option, solution_text,
        marks, negative_marks, source, generation_prompt_version
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING *
    `, [
      exam_id, subject, unit, topic, sub_topic, concept_tags, difficulty,
      question_type, question_text, JSON.stringify(options), correct_option,
      solution_text, marks, negative_marks, source, generation_prompt_version
    ]);

    return result.rows[0];
  }

  /**
   * Update question
   */
  static async update(id, data) {
    const fields = [];
    const values = [];
    let paramIndex = 1;

    // Build dynamic update query
    Object.keys(data).forEach(key => {
      if (data[key] !== undefined) {
        if (key === 'options' && typeof data[key] === 'object') {
          fields.push(`${key} = $${paramIndex}`);
          values.push(JSON.stringify(data[key]));
        } else {
          fields.push(`${key} = $${paramIndex}`);
          values.push(data[key]);
        }
        paramIndex++;
      }
    });

    if (fields.length === 0) {
      throw new Error('No fields to update');
    }

    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    const query = `
      UPDATE questions 
      SET ${fields.join(', ')} 
      WHERE id = $${paramIndex} 
      RETURNING *
    `;

    const result = await db.query(query, values);
    return result.rows[0];
  }

  /**
   * Increment usage count
   */
  static async incrementUsageCount(id) {
    await db.query(
      'UPDATE questions SET usage_count = usage_count + 1, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
      [id]
    );
  }

  /**
   * Update quality rating
   */
  static async updateQualityRating(id, rating) {
    const result = await db.query(
      'UPDATE questions SET quality_rating = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [rating, id]
    );
    return result.rows[0];
  }

  /**
   * Report issue with question
   */
  static async reportIssue(id) {
    await db.query(
      'UPDATE questions SET reported_issue_count = reported_issue_count + 1, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
      [id]
    );
  }

  /**
   * Delete question
   */
  static async delete(id) {
    const result = await db.query(
      'DELETE FROM questions WHERE id = $1 RETURNING *',
      [id]
    );
    return result.rows[0];
  }

  /**
   * Get question statistics
   */
  static async getStatistics(questionId) {
    const result = await db.query(`
      SELECT 
        q.*,
        COUNT(qa.id) as total_attempts,
        COUNT(CASE WHEN qa.is_correct = true THEN 1 END) as correct_attempts,
        ROUND(
          (COUNT(CASE WHEN qa.is_correct = true THEN 1 END)::DECIMAL / 
           NULLIF(COUNT(qa.id), 0)) * 100, 2
        ) as success_rate,
        AVG(qa.time_spent_seconds) as avg_time_spent
      FROM questions q
      LEFT JOIN question_attempts qa ON q.id = qa.question_id
      WHERE q.id = $1
      GROUP BY q.id
    `, [questionId]);
    return result.rows[0];
  }

  /**
   * Get questions by exam with statistics
   */
  static async getByExamWithStats(examId, limit = 50, offset = 0) {
    const result = await db.query(`
      SELECT 
        q.*,
        COUNT(qa.id) as total_attempts,
        COUNT(CASE WHEN qa.is_correct = true THEN 1 END) as correct_attempts,
        ROUND(
          (COUNT(CASE WHEN qa.is_correct = true THEN 1 END)::DECIMAL / 
           NULLIF(COUNT(qa.id), 0)) * 100, 2
        ) as success_rate
      FROM questions q
      LEFT JOIN question_attempts qa ON q.id = qa.question_id
      WHERE q.exam_id = $1
      GROUP BY q.id
      ORDER BY q.created_at DESC
      LIMIT $2 OFFSET $3
    `, [examId, limit, offset]);
    return result.rows;
  }
}

module.exports = Question;