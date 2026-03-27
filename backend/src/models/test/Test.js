const db = require('../../config/database');

class Test {
  /**
   * Find all active tests
   */
  static async findAll() {
    const result = await db.query(
      'SELECT * FROM tests WHERE is_active = true ORDER BY created_at DESC'
    );
    return result.rows;
  }

  /**
   * Find test by ID
   */
  static async findById(id) {
    const result = await db.query(
      'SELECT * FROM tests WHERE id = $1',
      [id]
    );
    return result.rows[0];
  }

  /**
   * Find tests by exam ID
   */
  static async findByExamId(examId) {
    const result = await db.query(
      'SELECT * FROM tests WHERE exam_id = $1 AND is_active = true ORDER BY created_at DESC',
      [examId]
    );
    return result.rows;
  }

  /**
   * Find tests by type
   */
  static async findByType(testType) {
    const result = await db.query(
      'SELECT * FROM tests WHERE test_type = $1 AND is_active = true ORDER BY created_at DESC',
      [testType]
    );
    return result.rows;
  }

  /**
   * Create a new test
   */
  static async create(data) {
    const { exam_id, format_id, title, test_type, duration_minutes, total_marks = 0, sections } = data;
    const result = await db.query(
      'INSERT INTO tests (exam_id, format_id, title, test_type, duration_minutes, total_marks, sections) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [exam_id, format_id || null, title, test_type, duration_minutes, total_marks, sections ? JSON.stringify(sections) : '{}']
    );
    return result.rows[0];
  }

  /**
   * Update test question IDs and related counts
   */
  static async updateQuestionIds(testId, questionIds) {
    const result = await db.query(
      'UPDATE tests SET question_ids = $1, total_questions = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *',
      [questionIds, questionIds.length, testId]
    );
    return result.rows[0];
  }

  /**
   * Update test
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

    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    const query = `
      UPDATE tests 
      SET ${fields.join(', ')} 
      WHERE id = $${paramIndex} 
      RETURNING *
    `;

    const result = await db.query(query, values);
    return result.rows[0];
  }

  /**
   * Delete test (soft delete by setting is_active to false)
   */
  static async delete(id) {
    const result = await db.query(
      'UPDATE tests SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *',
      [id]
    );
    return result.rows[0];
  }

  /**
   * Hard delete test
   */
  static async hardDelete(id) {
    const result = await db.query(
      'DELETE FROM tests WHERE id = $1 RETURNING *',
      [id]
    );
    return result.rows[0];
  }

  /**
   * Get test statistics
   */
  static async getStatistics(testId) {
    const result = await db.query(`
      SELECT 
        t.*,
        COUNT(ta.id) as total_attempts,
        AVG(ta.total_score) as avg_score,
        MAX(ta.total_score) as max_score,
        MIN(ta.total_score) as min_score
      FROM tests t
      LEFT JOIN user_exam_attempts ta ON t.id = ta.test_id
      WHERE t.id = $1
      GROUP BY t.id
    `, [testId]);
    return result.rows[0];
  }
}

module.exports = Test;