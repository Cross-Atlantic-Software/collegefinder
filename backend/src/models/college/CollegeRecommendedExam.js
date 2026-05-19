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

  /**
   * Colleges linked to this exam via college_recommended_exams OR college_programs.recommended_exam_ids.
   */
  static async getCollegeIdsByRecommendedExamId(examId) {
    const id = parseInt(examId, 10);
    if (!Number.isInteger(id) || id < 1) return [];
    const result = await db.query(
      `SELECT DISTINCT college_id
       FROM (
         SELECT college_id FROM college_recommended_exams WHERE exam_id = $1
         UNION
         SELECT cp.college_id
         FROM college_programs cp
         WHERE cp.recommended_exam_ids IS NOT NULL
           AND btrim(cp.recommended_exam_ids) <> ''
           AND EXISTS (
             SELECT 1
             FROM unnest(string_to_array(cp.recommended_exam_ids, ',')) AS tok(raw)
             WHERE NULLIF(btrim(tok.raw), '') ~ '^[0-9]+$'
               AND btrim(tok.raw)::int = $1
           )
       ) AS matched
       ORDER BY college_id`,
      [id]
    );
    return result.rows.map((r) => r.college_id);
  }

  /** Join exam names/codes for dashboard college enrichment (college + program level links). */
  static async getExamLinksForCollegeIds(collegeIds) {
    if (!collegeIds || !Array.isArray(collegeIds) || collegeIds.length === 0) return [];
    const ids = collegeIds.map((id) => parseInt(id, 10)).filter((n) => !isNaN(n));
    if (ids.length === 0) return [];
    const result = await db.query(
      `SELECT DISTINCT ON (college_id, exam_id) college_id, exam_id, exam_name, exam_code
       FROM (
         SELECT cre.college_id, e.id AS exam_id, e.name AS exam_name, e.code AS exam_code
         FROM college_recommended_exams cre
         INNER JOIN exams_taxonomies e ON e.id = cre.exam_id
         WHERE cre.college_id = ANY($1::int[])
         UNION
         SELECT cp.college_id, e.id AS exam_id, e.name AS exam_name, e.code AS exam_code
         FROM college_programs cp
         CROSS JOIN LATERAL unnest(string_to_array(cp.recommended_exam_ids, ',')) AS tok(raw)
         INNER JOIN exams_taxonomies e ON e.id = btrim(tok.raw)::int
         WHERE cp.college_id = ANY($1::int[])
           AND cp.recommended_exam_ids IS NOT NULL
           AND btrim(cp.recommended_exam_ids) <> ''
           AND btrim(tok.raw) ~ '^[0-9]+$'
       ) AS links
       ORDER BY college_id, exam_id, exam_name`,
      [ids]
    );
    return result.rows;
  }

  /**
   * Up to `limitPerExam` college names per exam (college + program level links).
   * @returns {Map<number, string[]>}
   */
  static async getCollegeNamePreviewsByExamIds(examIds, limitPerExam = 3) {
    if (!examIds || !Array.isArray(examIds) || examIds.length === 0) {
      return new Map();
    }
    const ids = examIds.map((id) => parseInt(id, 10)).filter((n) => Number.isInteger(n) && n > 0);
    if (ids.length === 0) return new Map();

    const limit = Math.max(1, Math.min(parseInt(limitPerExam, 10) || 3, 10));
    const result = await db.query(
      `WITH matched AS (
         SELECT cre.exam_id, cre.college_id
         FROM college_recommended_exams cre
         WHERE cre.exam_id = ANY($1::int[])
         UNION
         SELECT btrim(tok.raw)::int AS exam_id, cp.college_id
         FROM college_programs cp
         CROSS JOIN LATERAL unnest(string_to_array(cp.recommended_exam_ids, ',')) AS tok(raw)
         WHERE cp.recommended_exam_ids IS NOT NULL
           AND btrim(cp.recommended_exam_ids) <> ''
           AND btrim(tok.raw) ~ '^[0-9]+$'
           AND btrim(tok.raw)::int = ANY($1::int[])
       ),
       ranked AS (
         SELECT m.exam_id, c.college_name,
           ROW_NUMBER() OVER (PARTITION BY m.exam_id ORDER BY c.college_name ASC) AS rn
         FROM matched m
         INNER JOIN colleges c ON c.id = m.college_id
         WHERE c.college_name IS NOT NULL AND btrim(c.college_name) <> ''
       )
       SELECT exam_id, college_name
       FROM ranked
       WHERE rn <= $2
       ORDER BY exam_id, rn`,
      [ids, limit]
    );

    const map = new Map();
    for (const row of result.rows) {
      const k = Number(row.exam_id);
      if (!Number.isInteger(k)) continue;
      if (!map.has(k)) map.set(k, []);
      map.get(k).push(String(row.college_name).trim());
    }
    return map;
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

  /**
   * Add colleges that accept/recommend this exam. Used during exam bulk upload.
   */
  static async addCollegesForExam(examId, collegeIds) {
    if (!collegeIds || !Array.isArray(collegeIds) || collegeIds.length === 0) return [];
    const created = [];
    for (const collegeId of collegeIds) {
      const row = await db.query(
        `INSERT INTO college_recommended_exams (college_id, exam_id) VALUES ($1, $2) ON CONFLICT (college_id, exam_id) DO NOTHING RETURNING *`,
        [collegeId, examId]
      );
      if (row.rows[0]) created.push(row.rows[0]);
    }
    return created;
  }
}

module.exports = CollegeRecommendedExam;
