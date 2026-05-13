const db = require('../../config/database');

class ScholarshipExam {
  static async getExamIdsByScholarshipId(scholarshipId) {
    const result = await db.query(
      'SELECT exam_id FROM scholarship_exams WHERE scholarship_id = $1 ORDER BY exam_id',
      [scholarshipId]
    );
    return result.rows.map(r => r.exam_id);
  }

  static async getScholarshipIdsByExamIds(examIds) {
    if (!examIds || !Array.isArray(examIds) || examIds.length === 0) return [];
    const ids = examIds.map((id) => parseInt(id, 10)).filter((n) => !isNaN(n));
    if (ids.length === 0) return [];
    const result = await db.query(
      'SELECT DISTINCT scholarship_id AS id FROM scholarship_exams WHERE exam_id = ANY($1::int[]) ORDER BY id',
      [ids]
    );
    return result.rows.map((r) => r.id);
  }

  static async getExamLinksForScholarshipIds(scholarshipIds) {
    if (!scholarshipIds || !Array.isArray(scholarshipIds) || scholarshipIds.length === 0) return [];
    const ids = scholarshipIds.map((id) => parseInt(id, 10)).filter((n) => !isNaN(n));
    if (ids.length === 0) return [];
    const result = await db.query(
      `SELECT se.scholarship_id, e.id AS exam_id, e.name AS exam_name, e.code AS exam_code
       FROM scholarship_exams se
       JOIN exams_taxonomies e ON e.id = se.exam_id
       WHERE se.scholarship_id = ANY($1::int[])
       ORDER BY se.scholarship_id, e.name ASC`,
      [ids]
    );
    return result.rows;
  }

  static async setExamsForScholarship(scholarshipId, examIds) {
    await db.query('DELETE FROM scholarship_exams WHERE scholarship_id = $1', [scholarshipId]);
    if (!examIds || !Array.isArray(examIds) || examIds.length === 0) return [];
    const ids = [
      ...new Set(
        examIds.map((id) => parseInt(id, 10)).filter((n) => !Number.isNaN(n) && n > 0)
      ),
    ];
    if (ids.length === 0) return [];
    const result = await db.query(
      `INSERT INTO scholarship_exams (scholarship_id, exam_id)
       SELECT $1, x FROM unnest($2::int[]) AS x
       ON CONFLICT (scholarship_id, exam_id) DO NOTHING
       RETURNING *`,
      [scholarshipId, ids]
    );
    return result.rows;
  }

  static async deleteByScholarshipId(scholarshipId) {
    await db.query('DELETE FROM scholarship_exams WHERE scholarship_id = $1', [scholarshipId]);
  }
}

module.exports = ScholarshipExam;
