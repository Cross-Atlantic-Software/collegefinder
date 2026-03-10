const db = require('../../config/database');

/**
 * Mock prompts are stored in exam_mock_prompts (one row per exam).
 * Mock generation uses the prompt from this table when present.
 */
class ExamMockPrompt {
  static async getByExamId(examId) {
    const result = await db.query(
      'SELECT prompt FROM exam_mock_prompts WHERE exam_id = $1',
      [examId]
    );
    const row = result.rows[0];
    if (!row || row.prompt == null || String(row.prompt).trim() === '') {
      return null;
    }
    return String(row.prompt).trim();
  }

  /**
   * Get all exams with their mock prompt (for admin list).
   * Returns array of { exam_id, exam_name, exam_code, prompt }.
   */
  static async getAllWithExams() {
    const result = await db.query(
      `SELECT e.id AS exam_id, e.name AS exam_name, e.code AS exam_code,
              p.prompt, p.updated_at AS prompt_updated_at
       FROM exams_taxonomies e
       LEFT JOIN exam_mock_prompts p ON p.exam_id = e.id
       ORDER BY e.name ASC`
    );
    return result.rows.map((r) => ({
      exam_id: r.exam_id,
      exam_name: r.exam_name,
      exam_code: r.exam_code,
      prompt: r.prompt != null ? String(r.prompt) : '',
      prompt_updated_at: r.prompt_updated_at,
    }));
  }

  /**
   * Upsert prompt for an exam (insert or update).
   */
  static async upsert(examId, prompt) {
    const value = (prompt != null && String(prompt).trim()) ? String(prompt).trim() : null;
    await db.query(
      `INSERT INTO exam_mock_prompts (exam_id, prompt, updated_at)
       VALUES ($1, $2, CURRENT_TIMESTAMP)
       ON CONFLICT (exam_id) DO UPDATE SET
         prompt = EXCLUDED.prompt,
         updated_at = CURRENT_TIMESTAMP`,
      [examId, value]
    );
    const row = await db.query(
      'SELECT prompt FROM exam_mock_prompts WHERE exam_id = $1',
      [examId]
    );
    return row.rows[0] ? row.rows[0].prompt : null;
  }
}

module.exports = ExamMockPrompt;
