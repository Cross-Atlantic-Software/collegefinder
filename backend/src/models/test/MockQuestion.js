const db = require('../../config/database');

class MockQuestion {
  /**
   * Find all questions for a mock test, ordered by order_index.
   * Joins with questions table to return full question data.
   */
  static async findByMockTestId(mockTestId) {
    const result = await db.query(`
      SELECT
        mq.id AS mock_question_id,
        mq.order_index,
        q.*
      FROM mock_questions mq
      JOIN questions q ON mq.question_id = q.id
      WHERE mq.mock_test_id = $1
      ORDER BY mq.order_index ASC
    `, [mockTestId]);
    return result.rows;
  }

  /**
   * Find only the question IDs for a mock test (lightweight, ordered).
   */
  static async findQuestionIdsByMockTestId(mockTestId) {
    const result = await db.query(
      'SELECT question_id, order_index FROM mock_questions WHERE mock_test_id = $1 ORDER BY order_index ASC',
      [mockTestId]
    );
    return result.rows;
  }

  /**
   * Bulk insert mock_question mappings.
   *
   * @param {Array<{ mock_test_id, question_id, order_index }>} rows
   */
  static async bulkInsert(rows) {
    if (!rows || rows.length === 0) return [];

    const values = rows.map((r, i) => {
      const base = i * 3;
      return `($${base + 1}, $${base + 2}, $${base + 3})`;
    }).join(', ');

    const params = rows.flatMap(r => [r.mock_test_id, r.question_id, r.order_index]);

    const result = await db.query(`
      INSERT INTO mock_questions (mock_test_id, question_id, order_index)
      VALUES ${values}
      ON CONFLICT (mock_test_id, question_id) DO NOTHING
      RETURNING *
    `, params);

    return result.rows;
  }

  /**
   * Count questions in a mock test
   */
  static async countByMockTestId(mockTestId) {
    const result = await db.query(
      'SELECT COUNT(*) as count FROM mock_questions WHERE mock_test_id = $1',
      [mockTestId]
    );
    return parseInt(result.rows[0].count, 10);
  }
}

module.exports = MockQuestion;
