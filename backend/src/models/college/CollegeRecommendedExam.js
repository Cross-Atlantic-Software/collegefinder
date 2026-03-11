const db = require('../../config/database');

class CollegeRecommendedExam {
  static async getExamIdsByCollegeId(collegeId) {
    const result = await db.query(
      'SELECT exam_id FROM college_recommended_exams WHERE college_id = $1 ORDER BY exam_id',
      [collegeId]
    );
    return result.rows.map(r => r.exam_id);
  }

  /**
   * Get distinct college IDs that have at least one of the given exam IDs in college_recommended_exams.
   * Used for recommended colleges: user's recommended exam IDs -> colleges that accept those exams.
   */
  static async getCollegeIdsByExamIds(examIds) {
    if (!examIds || !Array.isArray(examIds) || examIds.length === 0) return [];
    const ids = examIds.map(id => parseInt(id, 10)).filter(n => !isNaN(n));
    if (ids.length === 0) return [];
    const result = await db.query(
      'SELECT DISTINCT college_id FROM college_recommended_exams WHERE exam_id = ANY($1::int[]) ORDER BY college_id',
      [ids]
    );
    return result.rows.map(r => r.college_id);
  }

  static async setExamsForCollege(collegeId, examIds) {
    await db.query('DELETE FROM college_recommended_exams WHERE college_id = $1', [collegeId]);
    if (!examIds || !Array.isArray(examIds) || examIds.length === 0) return [];
    const created = [];
    for (const examId of examIds) {
      const row = await db.query(
        `INSERT INTO college_recommended_exams (college_id, exam_id) VALUES ($1, $2) ON CONFLICT (college_id, exam_id) DO NOTHING RETURNING *`,
        [collegeId, examId]
      );
      if (row.rows[0]) created.push(row.rows[0]);
    }
    return created;
  }

  static async deleteByCollegeId(collegeId) {
    await db.query('DELETE FROM college_recommended_exams WHERE college_id = $1', [collegeId]);
  }
}

module.exports = CollegeRecommendedExam;
