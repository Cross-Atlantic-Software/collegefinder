const db = require('../../config/database');

class CollegeDetails {
  static async findByCollegeId(collegeId) {
    const result = await db.query(
      'SELECT * FROM college_details WHERE college_id = $1',
      [collegeId]
    );
    return result.rows[0] || null;
  }

  static async create(data) {
    const { college_id, college_description, major_program_ids } = data;
    const result = await db.query(
      `INSERT INTO college_details (college_id, college_description, major_program_ids)
       VALUES ($1, $2, $3) ON CONFLICT (college_id) DO UPDATE SET college_description = $2, major_program_ids = $3, updated_at = CURRENT_TIMESTAMP RETURNING *`,
      [college_id, college_description || null, major_program_ids || null]
    );
    return result.rows[0];
  }

  static async upsert(data) {
    return this.create(data);
  }

  static async deleteByCollegeId(collegeId) {
    await db.query('DELETE FROM college_details WHERE college_id = $1', [collegeId]);
  }
}

module.exports = CollegeDetails;
