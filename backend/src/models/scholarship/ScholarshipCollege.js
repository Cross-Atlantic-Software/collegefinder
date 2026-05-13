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
    const ids = [
      ...new Set(
        collegeIds.map((id) => parseInt(id, 10)).filter((n) => !Number.isNaN(n) && n > 0)
      ),
    ];
    if (ids.length === 0) return [];
    const result = await db.query(
      `INSERT INTO scholarship_colleges (scholarship_id, college_id)
       SELECT $1, x FROM unnest($2::int[]) AS x
       ON CONFLICT (scholarship_id, college_id) DO NOTHING
       RETURNING *`,
      [scholarshipId, ids]
    );
    return result.rows;
  }

  static async deleteByScholarshipId(scholarshipId) {
    await db.query('DELETE FROM scholarship_colleges WHERE scholarship_id = $1', [scholarshipId]);
  }
}

module.exports = ScholarshipCollege;
