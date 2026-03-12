const db = require('../../config/database');

class CollegeSeatMatrix {
  static async findByCollegeProgramId(collegeProgramId) {
    const result = await db.query(
      'SELECT * FROM college_seat_matrix WHERE college_program_id = $1 ORDER BY year DESC, id',
      [collegeProgramId]
    );
    return result.rows;
  }

  static async create(data) {
    const { college_program_id, branch, category, seat_count, year } = data;
    const result = await db.query(
      `INSERT INTO college_seat_matrix (college_program_id, branch, category, seat_count, year)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [college_program_id, branch || null, category || null, seat_count || null, year || null]
    );
    return result.rows[0];
  }

  static async deleteByCollegeProgramId(collegeProgramId) {
    await db.query('DELETE FROM college_seat_matrix WHERE college_program_id = $1', [collegeProgramId]);
  }
}

module.exports = CollegeSeatMatrix;
