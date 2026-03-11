const db = require('../../config/database');

class CollegeExpectedCutoff {
  static async findByCollegeProgramId(collegeProgramId) {
    const result = await db.query(
      'SELECT * FROM college_expected_cutoff WHERE college_program_id = $1 ORDER BY year DESC, id',
      [collegeProgramId]
    );
    return result.rows;
  }

  static async create(data) {
    const { college_program_id, exam_id, category, expected_rank, year } = data;
    const result = await db.query(
      `INSERT INTO college_expected_cutoff (college_program_id, exam_id, category, expected_rank, year)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [college_program_id, exam_id, category || null, expected_rank || null, year || null]
    );
    return result.rows[0];
  }

  static async deleteByCollegeProgramId(collegeProgramId) {
    await db.query('DELETE FROM college_expected_cutoff WHERE college_program_id = $1', [collegeProgramId]);
  }
}

module.exports = CollegeExpectedCutoff;
