const db = require('../../config/database');

class MockTest {
  /**
   * Find a mock test by exam ID and order index
   */
  static async findByExamAndNumber(examId, orderIndex) {
    const result = await db.query(
      'SELECT * FROM exam_mocks WHERE exam_id = $1 AND order_index = $2',
      [examId, orderIndex]
    );
    return result.rows[0] || null;
  }

  /**
   * Count number of mock papers for an exam (for multi-paper analytics).
   */
  static async countByExamId(examId) {
    const result = await db.query(
      'SELECT COUNT(*)::int AS count FROM exam_mocks WHERE exam_id = $1',
      [examId]
    );
    return result.rows[0]?.count ?? 0;
  }

  /**
   * Find all mock tests for an exam ordered by order_index
   */
  static async findByExamId(examId) {
    const result = await db.query(
      'SELECT * FROM exam_mocks WHERE exam_id = $1 ORDER BY order_index ASC',
      [examId]
    );
    return result.rows;
  }

  /**
   * Find the highest ready mock by order_index for an exam
   */
  static async findLatestReady(examId) {
    const result = await db.query(
      "SELECT * FROM exam_mocks WHERE exam_id = $1 AND status = 'ready' ORDER BY order_index DESC LIMIT 1",
      [examId]
    );
    return result.rows[0] || null;
  }

  /**
   * Create a exam_mocks row with status='generating'.
   * Uses INSERT ... ON CONFLICT DO NOTHING so the UNIQUE(exam_id, order_index)
   * constraint acts as a generation lock — safe to call concurrently.
   *
   * @returns {object|null} The new row, or null if it already existed.
   */
  static async createGenerating(examId, orderIndex, createdBy = 'system') {
    const result = await db.query(`
      INSERT INTO exam_mocks (exam_id, order_index, status, created_by)
      VALUES ($1, $2, 'generating', $3)
      ON CONFLICT (exam_id, order_index) DO NOTHING
      RETURNING *
    `, [examId, orderIndex, createdBy]);
    return result.rows[0] || null;
  }

  /**
   * Create a exam_mocks row with status='ready' (used for manually seeded mocks).
   */
  static async createReady(examId, orderIndex, createdBy = 'manual') {
    const result = await db.query(`
      INSERT INTO exam_mocks (exam_id, order_index, status, created_by)
      VALUES ($1, $2, 'ready', $3)
      ON CONFLICT (exam_id, order_index) DO NOTHING
      RETURNING *
    `, [examId, orderIndex, createdBy]);
    return result.rows[0] || null;
  }

  /**
   * Update the status of a mock test
   */
  static async setStatus(id, status) {
    const result = await db.query(
      'UPDATE exam_mocks SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );
    return result.rows[0] || null;
  }

  /**
   * Update total_questions count on a mock test
   */
  static async setTotalQuestions(id, totalQuestions) {
    const result = await db.query(
      'UPDATE exam_mocks SET total_questions = $1 WHERE id = $2 RETURNING *',
      [totalQuestions, id]
    );
    return result.rows[0] || null;
  }

  /**
   * Find mock test by primary key
   */
  static async findById(id) {
    const result = await db.query('SELECT * FROM exam_mocks WHERE id = $1', [id]);
    return result.rows[0] || null;
  }
}

module.exports = MockTest;
