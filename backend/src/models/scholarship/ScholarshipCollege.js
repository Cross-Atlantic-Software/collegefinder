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
}

module.exports = ScholarshipCollege;
