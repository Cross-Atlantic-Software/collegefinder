const db = require('../../config/database');

class CollegeProgram {
  static async findByCollegeId(collegeId) {
    const result = await db.query(
      'SELECT * FROM college_programs WHERE college_id = $1 ORDER BY id',
      [collegeId]
    );
    return result.rows;
  }

  static async findById(id) {
    const result = await db.query(
      'SELECT * FROM college_programs WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  static async create(data) {
    const { college_id, program_id, intake_capacity, duration_years } = data;
    const result = await db.query(
      `INSERT INTO college_programs (college_id, program_id, intake_capacity, duration_years)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [college_id, program_id, intake_capacity || null, duration_years ?? null]
    );
    return result.rows[0];
  }

  static async deleteByCollegeId(collegeId) {
    await db.query('DELETE FROM college_programs WHERE college_id = $1', [collegeId]);
  }
}

module.exports = CollegeProgram;
