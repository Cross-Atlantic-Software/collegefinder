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

  static async getScholarshipIdsByExamIds(examIds) {
    if (!examIds?.length) return [];
    const ids = examIds.map((id) => parseInt(id, 10)).filter((n) => Number.isInteger(n) && n > 0);
    if (!ids.length) return [];
    const result = await db.query(
      'SELECT DISTINCT scholarship_id FROM scholarship_exams WHERE exam_id = ANY($1::int[]) ORDER BY scholarship_id',
      [ids]
    );
    return result.rows.map((r) => r.scholarship_id);
  }

  static async getScholarshipIdsByExamId(examId) {
    const id = parseInt(examId, 10);
    if (!Number.isInteger(id) || id < 1) return [];
    return ScholarshipExam.getScholarshipIdsByExamIds([id]);
  }

  static async getExamLinksForScholarshipIds(scholarshipIds) {
    if (!scholarshipIds?.length) return [];
    const ids = scholarshipIds.map((id) => parseInt(id, 10)).filter((n) => Number.isInteger(n) && n > 0);
    if (!ids.length) return [];
    const result = await db.query(
      `SELECT se.scholarship_id, e.id AS exam_id, e.name AS exam_name, e.code AS exam_code
       FROM scholarship_exams se
       INNER JOIN exams_taxonomies e ON e.id = se.exam_id
       WHERE se.scholarship_id = ANY($1::int[])
       ORDER BY se.scholarship_id, e.name`,
      [ids]
    );
    return result.rows;
  }

  static async getExamIdsMapByScholarshipIds(scholarshipIds) {
    if (!scholarshipIds?.length) return new Map();
    const ids = scholarshipIds.map((id) => parseInt(id, 10)).filter((n) => Number.isInteger(n) && n > 0);
    if (!ids.length) return new Map();
    const result = await db.query(
      'SELECT scholarship_id, exam_id FROM scholarship_exams WHERE scholarship_id = ANY($1::int[])',
      [ids]
    );
    const map = new Map();
    for (const row of result.rows) {
      const sid = Number(row.scholarship_id);
      const eid = Number(row.exam_id);
      if (!Number.isInteger(sid) || !Number.isInteger(eid)) continue;
      if (!map.has(sid)) map.set(sid, []);
      const arr = map.get(sid);
      if (!arr.includes(eid)) arr.push(eid);
    }
    return map;
  }
}

module.exports = ScholarshipExam;
