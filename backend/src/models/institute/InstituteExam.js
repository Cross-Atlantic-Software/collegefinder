const db = require('../../config/database');

class InstituteExam {
  static async getExamIdsByInstituteId(instituteId) {
    const result = await db.query(
      'SELECT exam_id FROM institute_exams WHERE institute_id = $1 ORDER BY exam_id',
      [instituteId]
    );
    return result.rows.map(r => r.exam_id);
  }

  /** Institutes linked to any of the given exams (main + specialization exams). */
  static async getInstituteIdsByExamIds(examIds) {
    if (!examIds || !Array.isArray(examIds) || examIds.length === 0) return [];
    const ids = examIds.map((id) => parseInt(id, 10)).filter((n) => !isNaN(n));
    if (ids.length === 0) return [];
    const result = await db.query(
      `SELECT DISTINCT institute_id AS id FROM (
         SELECT institute_id FROM institute_exams WHERE exam_id = ANY($1::int[])
         UNION
         SELECT institute_id FROM institute_exam_specialization WHERE exam_id = ANY($1::int[])
       ) t ORDER BY id`,
      [ids]
    );
    return result.rows.map((r) => r.id);
  }

  static async getExamLinksForInstituteIds(instituteIds) {
    if (!instituteIds || !Array.isArray(instituteIds) || instituteIds.length === 0) return [];
    const ids = instituteIds.map((id) => parseInt(id, 10)).filter((n) => !isNaN(n));
    if (ids.length === 0) return [];
    const result = await db.query(
      `SELECT DISTINCT t.institute_id, e.id AS exam_id, e.name AS exam_name, e.code AS exam_code
       FROM (
         SELECT institute_id, exam_id FROM institute_exams WHERE institute_id = ANY($1::int[])
         UNION
         SELECT institute_id, exam_id FROM institute_exam_specialization WHERE institute_id = ANY($1::int[])
       ) t
       JOIN exams_taxonomies e ON e.id = t.exam_id
       ORDER BY t.institute_id, e.name ASC`,
      [ids]
    );
    return result.rows;
  }

  static async setExamsForInstitute(instituteId, examIds) {
    await db.query('DELETE FROM institute_exams WHERE institute_id = $1', [instituteId]);
    if (!examIds || !Array.isArray(examIds) || examIds.length === 0) return [];
    const created = [];
    for (const examId of examIds) {
      const row = await db.query(
        `INSERT INTO institute_exams (institute_id, exam_id) VALUES ($1, $2) ON CONFLICT (institute_id, exam_id) DO NOTHING RETURNING *`,
        [instituteId, examId]
      );
      if (row.rows[0]) created.push(row.rows[0]);
    }
    return created;
  }

  static async deleteByInstituteId(instituteId) {
    await db.query('DELETE FROM institute_exams WHERE institute_id = $1', [instituteId]);
  }
}

module.exports = InstituteExam;
