const db = require('../../config/database');

class MockTest {
  /**
   * Find a mock test by exam ID and mock number
   */
  static async findByExamAndNumber(examId, mockNumber) {
    const result = await db.query(
      'SELECT * FROM mock_tests WHERE exam_id = $1 AND mock_number = $2',
      [examId, mockNumber]
    );
    return result.rows[0] || null;
  }

  /**
   * Find all mock tests for an exam ordered by mock_number
   */
  static async findByExamId(examId) {
    const result = await db.query(
      'SELECT * FROM mock_tests WHERE exam_id = $1 ORDER BY mock_number ASC',
      [examId]
    );
    return result.rows;
  }

  /**
   * Find the highest ready mock number for an exam
   */
  static async findLatestReady(examId) {
    const result = await db.query(
      "SELECT * FROM mock_tests WHERE exam_id = $1 AND status = 'ready' ORDER BY mock_number DESC LIMIT 1",
      [examId]
    );
    return result.rows[0] || null;
  }

  /**
   * Create a mock_tests row with status='generating'.
   * Uses INSERT ... ON CONFLICT DO NOTHING so the UNIQUE(exam_id, mock_number)
   * constraint acts as a generation lock — safe to call concurrently.
   *
   * @returns {object|null} The new row, or null if it already existed.
   */
  static async createGenerating(examId, mockNumber, createdBy = 'system') {
    const result = await db.query(`
      INSERT INTO mock_tests (exam_id, mock_number, status, created_by)
      VALUES ($1, $2, 'generating', $3)
      ON CONFLICT (exam_id, mock_number) DO NOTHING
      RETURNING *
    `, [examId, mockNumber, createdBy]);
    return result.rows[0] || null;
  }

  /**
   * Create a mock_tests row with status='ready' (used for manually seeded mocks).
   */
  static async createReady(examId, mockNumber, createdBy = 'manual') {
    const result = await db.query(`
      INSERT INTO mock_tests (exam_id, mock_number, status, created_by)
      VALUES ($1, $2, 'ready', $3)
      ON CONFLICT (exam_id, mock_number) DO NOTHING
      RETURNING *
    `, [examId, mockNumber, createdBy]);
    return result.rows[0] || null;
  }

  /**
   * Update the status of a mock test
   */
  static async setStatus(id, status) {
    const result = await db.query(
      'UPDATE mock_tests SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );
    return result.rows[0] || null;
  }

  /**
   * Update total_questions count on a mock test
   */
  static async setTotalQuestions(id, totalQuestions) {
    const result = await db.query(
      'UPDATE mock_tests SET total_questions = $1 WHERE id = $2 RETURNING *',
      [totalQuestions, id]
    );
    return result.rows[0] || null;
  }

  /**
   * Find mock test by primary key
   */
  static async findById(id) {
    const result = await db.query('SELECT * FROM mock_tests WHERE id = $1', [id]);
    return result.rows[0] || null;
  }
}

module.exports = MockTest;
