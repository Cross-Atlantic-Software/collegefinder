const db = require('../../config/database');

class CollegeCounsellingProcess {
  static async findByCollegeId(collegeId) {
    const result = await db.query(
      'SELECT * FROM college_counselling_process WHERE college_id = $1 ORDER BY step_number ASC, id',
      [collegeId]
    );
    return result.rows;
  }

  static async create(data) {
    const { college_id, step_number, description } = data;
    const result = await db.query(
      `INSERT INTO college_counselling_process (college_id, step_number, description)
       VALUES ($1, $2, $3) RETURNING *`,
      [college_id, step_number ?? null, description || null]
    );
    return result.rows[0];
  }

  static async deleteByCollegeId(collegeId) {
    await db.query('DELETE FROM college_counselling_process WHERE college_id = $1', [collegeId]);
  }
}

module.exports = CollegeCounsellingProcess;
