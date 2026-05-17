const db = require('../../config/database');

class ScholarshipExam {
  static async getExamIdsByScholarshipId(scholarshipId) {
    const result = await db.query(
      'SELECT exam_id FROM scholarship_exams WHERE scholarship_id = $1 ORDER BY exam_id',
      [scholarshipId]
    );
    return result.rows.map(r => r.exam_id);
  }

  static async setExamsForScholarship(scholarshipId, examIds) {
    await db.query('DELETE FROM scholarship_exams WHERE scholarship_id = $1', [scholarshipId]);
    if (!examIds || !Array.isArray(examIds) || examIds.length === 0) return [];
    const created = [];
    for (const examId of examIds) {
      const row = await db.query(
        `INSERT INTO scholarship_exams (scholarship_id, exam_id) VALUES ($1, $2) ON CONFLICT (scholarship_id, exam_id) DO NOTHING RETURNING *`,
        [scholarshipId, examId]
      );
      if (row.rows[0]) created.push(row.rows[0]);
    }
    return created;
  }

  static async deleteByScholarshipId(scholarshipId) {
    await db.query('DELETE FROM scholarship_exams WHERE scholarship_id = $1', [scholarshipId]);
  }
}

module.exports = ScholarshipExam;
