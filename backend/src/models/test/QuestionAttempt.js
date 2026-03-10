const db = require('../../config/database');

class QuestionAttempt {
  /**
   * Find question attempt by ID
   */
  static async findById(id) {
    const result = await db.query('SELECT * FROM user_attempt_answers WHERE id = $1', [id]);
    return result.rows[0];
  }

  /**
   * Find question attempts by test attempt ID
   */
  static async findByTestAttemptId(testAttemptId) {
    const result = await db.query(`
      SELECT qa.*, q.question_text, q.correct_option, q.solution_text, q.options, q.marks, q.subject, q.difficulty
      FROM user_attempt_answers qa
      JOIN questions q ON qa.question_id = q.id
      WHERE qa.user_exam_attempt_id = $1
      ORDER BY qa.attempt_order ASC
    `, [testAttemptId]);
    return result.rows;
  }

  /**
   * Find question attempts by user ID
   */
  static async findByUserId(userId, limit = 100, offset = 0) {
    const result = await db.query(`
      SELECT qa.*, q.question_text, q.subject, q.difficulty, q.marks
      FROM user_attempt_answers qa
      JOIN questions q ON qa.question_id = q.id
      WHERE qa.user_id = $1
      ORDER BY qa.created_at DESC
      LIMIT $2 OFFSET $3
    `, [userId, limit, offset]);
    return result.rows;
  }

  /**
   * Find question attempts by question ID
   */
  static async findByQuestionId(questionId, limit = 100, offset = 0) {
    const result = await db.query(`
      SELECT qa.*, u.name as user_name
      FROM user_attempt_answers qa
      JOIN users u ON qa.user_id = u.id
      WHERE qa.question_id = $1
      ORDER BY qa.created_at DESC
      LIMIT $2 OFFSET $3
    `, [questionId, limit, offset]);
    return result.rows;
  }

  /**
   * Create a new question attempt
   */
  static async create(data) {
    const {
      user_id,
      question_id,
      test_attempt_id,
      exam_id,
      mock_id,
      selected_option,
      is_correct,
      time_spent_seconds,
      attempt_order
    } = data;

    const result = await db.query(`
      INSERT INTO user_attempt_answers (
        user_id, question_id, user_exam_attempt_id, exam_id, exam_mock_id,
        selected_option, is_correct, time_spent_seconds, attempt_order
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `, [
      user_id,
      question_id,
      test_attempt_id,
      exam_id,
      mock_id || null,
      selected_option,
      is_correct,
      time_spent_seconds,
      attempt_order
    ]);

    return result.rows[0];
  }

  /**
   * Update question attempt
   */
  static async update(id, data) {
    const fields = [];
    const values = [];
    let paramIndex = 1;

    // Build dynamic update query
    Object.keys(data).forEach(key => {
      if (data[key] !== undefined) {
        fields.push(`${key} = $${paramIndex}`);
        values.push(data[key]);
        paramIndex++;
      }
    });

    if (fields.length === 0) {
      throw new Error('No fields to update');
    }

    values.push(id);

    const query = `
      UPDATE user_attempt_answers 
      SET ${fields.join(', ')} 
      WHERE id = $${paramIndex} 
      RETURNING *
    `;

    const result = await db.query(query, values);
    return result.rows[0];
  }

  /**
   * Delete question attempt
   */
  static async delete(id) {
    const result = await db.query(
      'DELETE FROM user_attempt_answers WHERE id = $1 RETURNING *',
      [id]
    );
    return result.rows[0];
  }

  /**
   * Get question attempt statistics for a test attempt
   */
  static async getTestAttemptStats(testAttemptId) {
    const result = await db.query(`
      SELECT 
        COUNT(*) as total_questions,
        COUNT(CASE WHEN selected_option IS NOT NULL THEN 1 END) as attempted_questions,
        COUNT(CASE WHEN is_correct = true THEN 1 END) as correct_answers,
        COUNT(CASE WHEN is_correct = false AND selected_option IS NOT NULL THEN 1 END) as incorrect_answers,
        COUNT(CASE WHEN selected_option IS NULL THEN 1 END) as skipped_questions,
        AVG(time_spent_seconds) as avg_time_per_question,
        SUM(time_spent_seconds) as total_time_seconds,
        ROUND(
          (COUNT(CASE WHEN is_correct = true THEN 1 END)::DECIMAL / 
           NULLIF(COUNT(CASE WHEN selected_option IS NOT NULL THEN 1 END), 0)) * 100, 2
        ) as accuracy_percentage
      FROM user_attempt_answers
      WHERE user_exam_attempt_id = $1
    `, [testAttemptId]);
    return result.rows[0];
  }

  /**
   * Get subject-wise statistics for a test attempt
   */
  static async getSubjectWiseStats(testAttemptId) {
    const result = await db.query(`
      SELECT 
        q.subject,
        COUNT(*) as total_questions,
        COUNT(CASE WHEN qa.selected_option IS NOT NULL THEN 1 END) as attempted_questions,
        COUNT(CASE WHEN qa.is_correct = true THEN 1 END) as correct_answers,
        COUNT(CASE WHEN qa.is_correct = false AND qa.selected_option IS NOT NULL THEN 1 END) as incorrect_answers,
        AVG(qa.time_spent_seconds) as avg_time_per_question,
        ROUND(
          (COUNT(CASE WHEN qa.is_correct = true THEN 1 END)::DECIMAL / 
           NULLIF(COUNT(CASE WHEN qa.selected_option IS NOT NULL THEN 1 END), 0)) * 100, 2
        ) as accuracy_percentage
      FROM user_attempt_answers qa
      JOIN questions q ON qa.question_id = q.id
      WHERE qa.user_exam_attempt_id = $1
      GROUP BY q.subject
      ORDER BY q.subject
    `, [testAttemptId]);
    return result.rows;
  }

  /**
   * Get difficulty-wise statistics for a test attempt
   */
  static async getDifficultyWiseStats(testAttemptId) {
    const result = await db.query(`
      SELECT 
        q.difficulty,
        COUNT(*) as total_questions,
        COUNT(CASE WHEN qa.selected_option IS NOT NULL THEN 1 END) as attempted_questions,
        COUNT(CASE WHEN qa.is_correct = true THEN 1 END) as correct_answers,
        COUNT(CASE WHEN qa.is_correct = false AND qa.selected_option IS NOT NULL THEN 1 END) as incorrect_answers,
        AVG(qa.time_spent_seconds) as avg_time_per_question,
        ROUND(
          (COUNT(CASE WHEN qa.is_correct = true THEN 1 END)::DECIMAL / 
           NULLIF(COUNT(CASE WHEN qa.selected_option IS NOT NULL THEN 1 END), 0)) * 100, 2
        ) as accuracy_percentage
      FROM user_attempt_answers qa
      JOIN questions q ON qa.question_id = q.id
      WHERE qa.user_exam_attempt_id = $1
      GROUP BY q.difficulty
      ORDER BY 
        CASE q.difficulty 
          WHEN 'easy' THEN 1 
          WHEN 'medium' THEN 2 
          WHEN 'hard' THEN 3 
        END
    `, [testAttemptId]);
    return result.rows;
  }

  /**
   * Get user's performance on a specific question across all attempts
   */
  static async getUserQuestionHistory(userId, questionId) {
    const result = await db.query(`
      SELECT 
        qa.*,
        ta.test_id,
        t.title as test_title
      FROM user_attempt_answers qa
      JOIN user_exam_attempts ta ON qa.user_exam_attempt_id = ta.id
      JOIN tests t ON ta.test_id = t.id
      WHERE qa.user_id = $1 AND qa.question_id = $2
      ORDER BY qa.created_at DESC
    `, [userId, questionId]);
    return result.rows;
  }

  /**
   * Get analytics for a specific question across all users
   */
  static async getQuestionAnalytics(questionId) {
    const result = await db.query(`
      SELECT 
        COUNT(*) as total_attempts,
        COUNT(CASE WHEN is_correct = true THEN 1 END) as correct_attempts,
        COUNT(CASE WHEN is_correct = false AND selected_option IS NOT NULL THEN 1 END) as incorrect_attempts,
        COUNT(CASE WHEN selected_option IS NULL THEN 1 END) as skipped_attempts,
        AVG(time_spent_seconds) as avg_time_spent,
        ROUND(
          (COUNT(CASE WHEN is_correct = true THEN 1 END)::DECIMAL / 
           NULLIF(COUNT(CASE WHEN selected_option IS NOT NULL THEN 1 END), 0)) * 100, 2
        ) as success_rate,
        selected_option,
        COUNT(*) as option_count
      FROM user_attempt_answers
      WHERE question_id = $1 AND selected_option IS NOT NULL
      GROUP BY ROLLUP(selected_option)
      ORDER BY selected_option NULLS FIRST
    `, [questionId]);
    return result.rows;
  }

  /**
   * Get topic-wise statistics for a test attempt
   */
  static async getTopicWiseStats(testAttemptId) {
    const result = await db.query(`
      SELECT 
        q.topic,
        q.subject,
        COUNT(*) as total_questions,
        COUNT(CASE WHEN qa.selected_option IS NOT NULL THEN 1 END) as attempted_questions,
        COUNT(CASE WHEN qa.is_correct = true THEN 1 END) as correct_answers,
        COUNT(CASE WHEN qa.is_correct = false AND qa.selected_option IS NOT NULL THEN 1 END) as incorrect_answers,
        COUNT(CASE WHEN qa.selected_option IS NULL THEN 1 END) as skipped_questions,
        COALESCE(SUM(qa.time_spent_seconds), 0) as total_time_seconds,
        COALESCE(AVG(qa.time_spent_seconds), 0) as avg_time_per_question,
        COALESCE(SUM(CASE WHEN qa.is_correct = false AND qa.selected_option IS NOT NULL THEN q.negative_marks ELSE 0 END), 0) as negative_marks_lost,
        ROUND(
          (COUNT(CASE WHEN qa.is_correct = true THEN 1 END)::DECIMAL / 
           NULLIF(COUNT(CASE WHEN qa.selected_option IS NOT NULL THEN 1 END), 0)) * 100, 2
        ) as accuracy_percentage
      FROM user_attempt_answers qa
      JOIN questions q ON qa.question_id = q.id
      WHERE qa.user_exam_attempt_id = $1 AND q.topic IS NOT NULL AND q.topic != ''
      GROUP BY q.topic, q.subject
      ORDER BY q.subject, q.topic
    `, [testAttemptId]);
    return result.rows;
  }

  /**
   * Get sub-topic-wise statistics for a test attempt
   */
  static async getSubTopicWiseStats(testAttemptId) {
    const result = await db.query(`
      SELECT 
        q.sub_topic,
        q.topic,
        q.subject,
        COUNT(*) as total_questions,
        COUNT(CASE WHEN qa.selected_option IS NOT NULL THEN 1 END) as attempted_questions,
        COUNT(CASE WHEN qa.is_correct = true THEN 1 END) as correct_answers,
        COUNT(CASE WHEN qa.is_correct = false AND qa.selected_option IS NOT NULL THEN 1 END) as incorrect_answers,
        COUNT(CASE WHEN qa.selected_option IS NULL THEN 1 END) as skipped_questions,
        COALESCE(SUM(qa.time_spent_seconds), 0) as total_time_seconds,
        COALESCE(AVG(qa.time_spent_seconds), 0) as avg_time_per_question,
        COALESCE(SUM(CASE WHEN qa.is_correct = false AND qa.selected_option IS NOT NULL THEN q.negative_marks ELSE 0 END), 0) as negative_marks_lost,
        ROUND(
          (COUNT(CASE WHEN qa.is_correct = true THEN 1 END)::DECIMAL / 
           NULLIF(COUNT(CASE WHEN qa.selected_option IS NOT NULL THEN 1 END), 0)) * 100, 2
        ) as accuracy_percentage
      FROM user_attempt_answers qa
      JOIN questions q ON qa.question_id = q.id
      WHERE qa.user_exam_attempt_id = $1 AND q.sub_topic IS NOT NULL AND q.sub_topic != ''
      GROUP BY q.sub_topic, q.topic, q.subject
      ORDER BY q.subject, q.topic, q.sub_topic
    `, [testAttemptId]);
    return result.rows;
  }

  /**
   * Get overall negative marks lost for a test attempt
   */
  static async getNegativeMarksStats(testAttemptId) {
    const result = await db.query(`
      SELECT 
        COALESCE(SUM(q.negative_marks), 0) as total_negative_marks_lost,
        COUNT(CASE WHEN qa.is_correct = false AND qa.selected_option IS NOT NULL THEN 1 END) as wrong_answers
      FROM user_attempt_answers qa
      JOIN questions q ON qa.question_id = q.id
      WHERE qa.user_exam_attempt_id = $1
        AND qa.is_correct = false
        AND qa.selected_option IS NOT NULL
    `, [testAttemptId]);
    return result.rows[0];
  }

  /**
   * Upsert a question attempt.
   * If a row already exists for (user_exam_attempt_id, question_id), update it (handles pre-inserted empty rows).
   * Otherwise, insert a new row.
   */
  static async upsert(data) {
    const {
      user_id,
      question_id,
      test_attempt_id,
      exam_id,
      mock_id,
      selected_option,
      is_correct,
      time_spent_seconds,
      attempt_order
    } = data;

    const result = await db.query(`
      INSERT INTO user_attempt_answers (
        user_id, question_id, user_exam_attempt_id, exam_id, exam_mock_id,
        selected_option, is_correct, time_spent_seconds, attempt_order
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (user_exam_attempt_id, question_id) DO UPDATE SET
        selected_option = EXCLUDED.selected_option,
        is_correct = EXCLUDED.is_correct,
        time_spent_seconds = EXCLUDED.time_spent_seconds,
        attempt_order = EXCLUDED.attempt_order,
        exam_id = EXCLUDED.exam_id,
        exam_mock_id = EXCLUDED.exam_mock_id
      RETURNING *
    `, [
      user_id,
      question_id,
      test_attempt_id,
      exam_id,
      mock_id || null,
      selected_option,
      is_correct,
      time_spent_seconds,
      attempt_order
    ]);

    return result.rows[0];
  }

  /**
   * Bulk create question attempts for a test
   */
  static async bulkCreate(attempts) {
    if (!attempts || attempts.length === 0) {
      return [];
    }

    const values = [];
    const placeholders = [];
    
    attempts.forEach((attempt, index) => {
      const baseIndex = index * 9;
      placeholders.push(
        `($${baseIndex + 1}, $${baseIndex + 2}, $${baseIndex + 3}, $${baseIndex + 4}, $${baseIndex + 5}, $${baseIndex + 6}, $${baseIndex + 7}, $${baseIndex + 8}, $${baseIndex + 9})`
      );
      values.push(
        attempt.user_id,
        attempt.question_id,
        attempt.test_attempt_id,
        attempt.exam_id,
        attempt.mock_id || null,
        attempt.selected_option,
        attempt.is_correct,
        attempt.time_spent_seconds,
        attempt.attempt_order
      );
    });

    const query = `
      INSERT INTO user_attempt_answers (
        user_id, question_id, user_exam_attempt_id, exam_id, exam_mock_id,
        selected_option, is_correct, time_spent_seconds, attempt_order
      ) VALUES ${placeholders.join(', ')}
      RETURNING *
    `;

    const result = await db.query(query, values);
    return result.rows;
  }
}

module.exports = QuestionAttempt;