const db = require('../../config/database');

class TestAttempt {
  /**
   * Find test attempt by ID
   */
  static async findById(id) {
    const result = await db.query('SELECT * FROM user_exam_attempts WHERE id = $1', [id]);
    return result.rows[0];
  }

  /**
   * Find test attempts by user ID
   */
  static async findByUserId(userId, limit = 20, offset = 0) {
    const result = await db.query(`
      SELECT
        ta.*,
        mt.order_index AS mock_order_index,
        COALESCE(t.title, CONCAT('Mock ', mt.order_index)) as test_title,
        e.name as exam_name,
        e.number_of_papers as exam_total_papers
      FROM user_exam_attempts ta
      LEFT JOIN tests t ON ta.test_id = t.id
      LEFT JOIN exam_mocks mt ON ta.exam_mock_id = mt.id
      JOIN exams_taxonomies e ON ta.exam_id = e.id
      WHERE ta.user_id = $1
      ORDER BY ta.created_at DESC
      LIMIT $2 OFFSET $3
    `, [userId, limit, offset]);
    return result.rows;
  }

  /**
   * Find test attempts by test ID
   */
  static async findByTestId(testId, limit = 100, offset = 0) {
    const result = await db.query(`
      SELECT ta.*, u.name as user_name, u.email as user_email
      FROM user_exam_attempts ta
      JOIN users u ON ta.user_id = u.id
      WHERE ta.test_id = $1
      ORDER BY ta.total_score DESC, ta.created_at ASC
      LIMIT $2 OFFSET $3
    `, [testId, limit, offset]);
    return result.rows;
  }

  /**
   * Find user's attempts for a specific test
   */
  static async findUserTestAttempts(userId, testId) {
    const result = await db.query(`
      SELECT * FROM user_exam_attempts 
      WHERE user_id = $1 AND test_id = $2
      ORDER BY created_at DESC
    `, [userId, testId]);
    return result.rows;
  }

  /**
   * Create a new test attempt
   */
  static async create(data) {
    const { user_id, test_id, exam_id, exam_mock_id, mock_test_id } = data;
    const result = await db.query(
      'INSERT INTO user_exam_attempts (user_id, test_id, exam_id, exam_mock_id) VALUES ($1, $2, $3, $4) RETURNING *',
      [user_id, test_id || null, exam_id, exam_mock_id ?? mock_test_id ?? null]
    );
    return result.rows[0];
  }

  /**
   * Update test attempt
   */
  static async update(id, data) {
    const fields = [];
    const values = [];
    let paramIndex = 1;

    // Build dynamic update query
    Object.keys(data).forEach(key => {
      if (data[key] !== undefined) {
        if (['subject_wise_stats', 'difficulty_wise_stats'].includes(key) && typeof data[key] === 'object') {
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

    values.push(id);

    const query = `
      UPDATE user_exam_attempts 
      SET ${fields.join(', ')} 
      WHERE id = $${paramIndex} 
      RETURNING *
    `;

    const result = await db.query(query, values);
    return result.rows[0];
  }

  /**
   * Complete test attempt with final scores and statistics
   */
  static async complete(id, finalData) {
    const {
      total_score,
      attempted_count,
      correct_count,
      incorrect_count,
      skipped_count,
      accuracy_percentage,
      time_spent_minutes,
      subject_wise_stats = {},
      difficulty_wise_stats = {}
    } = finalData;

    const result = await db.query(`
      UPDATE user_exam_attempts 
      SET 
        total_score = $1,
        attempted_count = $2,
        correct_count = $3,
        incorrect_count = $4,
        skipped_count = $5,
        accuracy_percentage = $6,
        time_spent_minutes = $7,
        subject_wise_stats = $8,
        difficulty_wise_stats = $9,
        completed_at = CURRENT_TIMESTAMP
      WHERE id = $10 
      RETURNING *
    `, [
      total_score,
      attempted_count,
      correct_count,
      incorrect_count,
      skipped_count,
      accuracy_percentage,
      time_spent_minutes,
      JSON.stringify(subject_wise_stats),
      JSON.stringify(difficulty_wise_stats),
      id
    ]);

    return result.rows[0];
  }

  /**
   * Calculate and update percentile and rank
   */
  static async updateRankings(id) {
    const testAttempt = await this.findById(id);
    if (!testAttempt) {
      throw new Error('Test attempt not found');
    }

    // Calculate percentile
    const percentileResult = await db.query(`
      SELECT 
        COUNT(*) as total_attempts,
        COUNT(CASE WHEN total_score < $1 THEN 1 END) as lower_scores
      FROM user_exam_attempts 
      WHERE test_id = $2 AND completed_at IS NOT NULL
    `, [testAttempt.total_score, testAttempt.test_id]);

    const { total_attempts, lower_scores } = percentileResult.rows[0];
    const percentile = total_attempts > 0 ? (lower_scores / total_attempts) * 100 : 0;

    // Calculate rank
    const rankResult = await db.query(`
      SELECT COUNT(*) + 1 as rank_position
      FROM user_exam_attempts 
      WHERE test_id = $1 AND total_score > $2 AND completed_at IS NOT NULL
    `, [testAttempt.test_id, testAttempt.total_score]);

    const { rank_position } = rankResult.rows[0];

    // Update the test attempt
    const result = await db.query(`
      UPDATE user_exam_attempts 
      SET percentile = $1, rank_position = $2
      WHERE id = $3 
      RETURNING *
    `, [percentile, rank_position, id]);

    return result.rows[0];
  }

  /**
   * Count completed mock-based attempts for a user + exam combination.
   * Used for mock progression logic.
   */
  static async countCompletedMocks(userId, examId) {
    const result = await db.query(`
      SELECT COUNT(*) as count
      FROM user_exam_attempts ta
      JOIN exam_mocks mt ON ta.exam_mock_id = mt.id
      WHERE ta.user_id = $1
        AND ta.exam_id = $2
        AND ta.completed_at IS NOT NULL
    `, [userId, examId]);
    return parseInt(result.rows[0].count, 10);
  }

  /**
   * Delete test attempt
   */
  static async delete(id) {
    const result = await db.query(
      'DELETE FROM user_exam_attempts WHERE id = $1 RETURNING *',
      [id]
    );
    return result.rows[0];
  }

  /**
   * Get test attempt with detailed statistics
   */
  static async getWithDetails(id) {
    const result = await db.query(`
      SELECT 
        ta.*,
        t.title as test_title,
        t.test_type,
        t.duration_minutes,
        t.total_questions as test_total_questions,
        COALESCE(t.title, CONCAT('Mock ', mt.order_index)) as test_title,
        mt.order_index as mock_order_index,
        mt.total_questions as mock_total_questions,
        e.name as exam_name,
        u.name as user_name,
        u.email as user_email
      FROM user_exam_attempts ta
      LEFT JOIN tests t ON ta.test_id = t.id
      LEFT JOIN exam_mocks mt ON ta.exam_mock_id = mt.id
      JOIN exams_taxonomies e ON ta.exam_id = e.id
      JOIN users u ON ta.user_id = u.id
      WHERE ta.id = $1
    `, [id]);
    return result.rows[0];
  }

  /**
   * Get leaderboard for a test
   */
  static async getLeaderboard(testId, limit = 10) {
    const result = await db.query(`
      SELECT 
        ta.id,
        ta.total_score,
        ta.accuracy_percentage,
        ta.time_spent_minutes,
        ta.completed_at,
        ta.rank_position,
        ta.percentile,
        u.name as user_name
      FROM user_exam_attempts ta
      JOIN users u ON ta.user_id = u.id
      WHERE ta.test_id = $1 AND ta.completed_at IS NOT NULL
      ORDER BY ta.total_score DESC, ta.time_spent_minutes ASC
      LIMIT $2
    `, [testId, limit]);
    return result.rows;
  }

  /**
   * Get user's performance analytics
   */
  static async getUserAnalytics(userId, examId = null) {
    let query = `
      SELECT 
        COUNT(*) as total_attempts,
        AVG(total_score) as avg_score,
        MAX(total_score) as best_score,
        AVG(accuracy_percentage) as avg_accuracy,
        AVG(time_spent_minutes) as avg_time,
        COUNT(CASE WHEN completed_at IS NOT NULL THEN 1 END) as completed_attempts
      FROM user_exam_attempts 
      WHERE user_id = $1
    `;
    
    const params = [userId];
    
    if (examId) {
      query += ' AND exam_id = $2';
      params.push(examId);
    }

    const result = await db.query(query, params);
    return result.rows[0];
  }
}

module.exports = TestAttempt;