const db = require('../../config/database');

class MockQuestion {
  /**
   * Find all questions for a mock test, ordered by order_index.
   * Joins with questions table to return full question data.
   */
  static async findByMockTestId(mockId) {
    const result = await db.query(`
      SELECT
        mq.id AS mock_question_id,
        mq.exam_mock_id,
        mq.exam_id,
        mq.order_index,
        q.*
      FROM exam_mock_questions mq
      JOIN questions q ON mq.question_id = q.id
      WHERE mq.exam_mock_id = $1
      ORDER BY mq.order_index ASC
    `, [mockId]);
    return result.rows;
  }

  /**
   * Find only the question IDs for a mock test (lightweight, ordered).
   */
  static async findQuestionIdsByMockTestId(mockId) {
    const result = await db.query(
      'SELECT question_id, order_index, exam_id FROM exam_mock_questions WHERE exam_mock_id = $1 ORDER BY order_index ASC',
      [mockId]
    );
    return result.rows;
  }

  /**
   * Bulk insert mock_question mappings.
   *
   * @param {Array<{ exam_mock_id, question_id, exam_id, order_index }>} rows
   */
  static async bulkInsert(rows) {
    if (!rows || rows.length === 0) return [];

    const values = rows.map((r, i) => {
      const base = i * 4;
      return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4})`;
    }).join(', ');

    const params = rows.flatMap(r => [r.exam_mock_id, r.question_id, r.exam_id, r.order_index]);

    const result = await db.query(`
      INSERT INTO exam_mock_questions (exam_mock_id, question_id, exam_id, order_index)
      VALUES ${values}
      ON CONFLICT (exam_mock_id, question_id) DO NOTHING
      RETURNING *
    `, params);

    return result.rows;
  }

  /**
   * Count questions in a mock test
   */
  static async countByMockTestId(mockId) {
    const result = await db.query(
      'SELECT COUNT(*) as count FROM exam_mock_questions WHERE exam_mock_id = $1',
      [mockId]
    );
    return parseInt(result.rows[0].count, 10);
  }
}

module.exports = MockQuestion;
