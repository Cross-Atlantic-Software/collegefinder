const db = require('../../config/database');

class InstituteExam {
  static async getExamIdsByInstituteId(instituteId) {
    const result = await db.query(
      'SELECT exam_id FROM institute_exams WHERE institute_id = $1 ORDER BY exam_id',
      [instituteId]
    );
    return result.rows.map(r => r.exam_id);
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

  static async getInstituteIdsByExamIds(examIds) {
    if (!examIds?.length) return [];
    const ids = examIds.map((id) => parseInt(id, 10)).filter((n) => Number.isInteger(n) && n > 0);
    if (!ids.length) return [];
    const result = await db.query(
      `SELECT DISTINCT institute_id
       FROM (
         SELECT institute_id FROM institute_exams WHERE exam_id = ANY($1::int[])
         UNION
         SELECT institute_id FROM institute_exam_specialization WHERE exam_id = ANY($1::int[])
       ) AS matched
       ORDER BY institute_id`,
      [ids]
    );
    return result.rows.map((r) => r.institute_id);
  }

  static async getExamLinksForInstituteIds(instituteIds) {
    if (!instituteIds?.length) return [];
    const ids = instituteIds.map((id) => parseInt(id, 10)).filter((n) => Number.isInteger(n) && n > 0);
    if (!ids.length) return [];
    const result = await db.query(
      `SELECT DISTINCT ON (institute_id, exam_id) institute_id, exam_id, exam_name, exam_code, exam_abbreviation
       FROM (
         SELECT ie.institute_id, e.id AS exam_id, e.name AS exam_name, e.code AS exam_code, e.abbreviation AS exam_abbreviation
         FROM institute_exams ie
         INNER JOIN exams_taxonomies e ON e.id = ie.exam_id
         WHERE ie.institute_id = ANY($1::int[])
         UNION
         SELECT ies.institute_id, e.id AS exam_id, e.name AS exam_name, e.code AS exam_code, e.abbreviation AS exam_abbreviation
         FROM institute_exam_specialization ies
         INNER JOIN exams_taxonomies e ON e.id = ies.exam_id
         WHERE ies.institute_id = ANY($1::int[])
       ) AS links
       ORDER BY institute_id, exam_id, exam_name`,
      [ids]
    );
    return result.rows;
  }

  static async getExamIdsMapByInstituteIds(instituteIds) {
    if (!instituteIds?.length) return new Map();
    const ids = instituteIds.map((id) => parseInt(id, 10)).filter((n) => Number.isInteger(n) && n > 0);
    if (!ids.length) return new Map();
    const result = await db.query(
      `SELECT institute_id, exam_id
       FROM (
         SELECT institute_id, exam_id FROM institute_exams WHERE institute_id = ANY($1::int[])
         UNION
         SELECT institute_id, exam_id FROM institute_exam_specialization WHERE institute_id = ANY($1::int[])
       ) AS links`,
      [ids]
    );
    const map = new Map();
    for (const row of result.rows) {
      const iid = Number(row.institute_id);
      const eid = Number(row.exam_id);
      if (!Number.isInteger(iid) || !Number.isInteger(eid)) continue;
      if (!map.has(iid)) map.set(iid, []);
      const arr = map.get(iid);
      if (!arr.includes(eid)) arr.push(eid);
    }
    return map;
  }
}

module.exports = InstituteExam;
