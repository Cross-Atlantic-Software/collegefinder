const db = require('../../config/database');

class ScholarshipCollege {
  static async getCollegeIdsByScholarshipId(scholarshipId) {
    const result = await db.query(
      'SELECT college_id FROM scholarship_colleges WHERE scholarship_id = $1 ORDER BY college_id',
      [scholarshipId]
    );
    return result.rows.map((r) => r.college_id);
  }

  static async setCollegesForScholarship(scholarshipId, collegeIds) {
    await db.query('DELETE FROM scholarship_colleges WHERE scholarship_id = $1', [scholarshipId]);
    if (!collegeIds || !Array.isArray(collegeIds) || collegeIds.length === 0) return [];
    const created = [];
    for (const collegeId of collegeIds) {
      const row = await db.query(
        `INSERT INTO scholarship_colleges (scholarship_id, college_id) VALUES ($1, $2)
         ON CONFLICT (scholarship_id, college_id) DO NOTHING RETURNING *`,
        [scholarshipId, collegeId]
      );
      if (row.rows[0]) created.push(row.rows[0]);
    }
    return created;
  }

  static async deleteByScholarshipId(scholarshipId) {
    await db.query('DELETE FROM scholarship_colleges WHERE scholarship_id = $1', [scholarshipId]);
  }

  static async getScholarshipIdsByCollegeIds(collegeIds) {
    if (!collegeIds?.length) return [];
    const ids = collegeIds.map((id) => parseInt(id, 10)).filter((n) => Number.isInteger(n) && n > 0);
    if (!ids.length) return [];
    const result = await db.query(
      'SELECT DISTINCT scholarship_id FROM scholarship_colleges WHERE college_id = ANY($1::int[]) ORDER BY scholarship_id',
      [ids]
    );
    return result.rows.map((r) => r.scholarship_id);
  }

  static async getCollegeLinksForScholarshipIds(scholarshipIds) {
    if (!scholarshipIds?.length) return [];
    const ids = scholarshipIds.map((id) => parseInt(id, 10)).filter((n) => Number.isInteger(n) && n > 0);
    if (!ids.length) return [];
    const result = await db.query(
      `SELECT sc.scholarship_id, c.id AS college_id, c.college_name, c.city, c.state
       FROM scholarship_colleges sc
       INNER JOIN colleges c ON c.id = sc.college_id
       WHERE sc.scholarship_id = ANY($1::int[])
       ORDER BY sc.scholarship_id, c.college_name`,
      [ids]
    );
    return result.rows;
  }

  static async getCollegeIdsMapByScholarshipIds(scholarshipIds) {
    if (!scholarshipIds?.length) return new Map();
    const ids = scholarshipIds.map((id) => parseInt(id, 10)).filter((n) => Number.isInteger(n) && n > 0);
    if (!ids.length) return new Map();
    const result = await db.query(
      'SELECT scholarship_id, college_id FROM scholarship_colleges WHERE scholarship_id = ANY($1::int[])',
      [ids]
    );
    const map = new Map();
    for (const row of result.rows) {
      const sid = Number(row.scholarship_id);
      const cid = Number(row.college_id);
      if (!Number.isInteger(sid) || !Number.isInteger(cid)) continue;
      if (!map.has(sid)) map.set(sid, []);
      const arr = map.get(sid);
      if (!arr.includes(cid)) arr.push(cid);
    }
    return map;
  }
}

module.exports = ScholarshipCollege;
