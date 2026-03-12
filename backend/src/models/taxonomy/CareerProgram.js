const db = require('../../config/database');

class CareerProgram {
  static async getProgramIdsByCareerId(careerId) {
    const result = await db.query(
      'SELECT program_id FROM career_programs WHERE career_id = $1 ORDER BY program_id',
      [careerId]
    );
    return result.rows.map(r => r.program_id);
  }

  static async setProgramsForCareer(careerId, programIds) {
    await db.query('DELETE FROM career_programs WHERE career_id = $1', [careerId]);
    if (!programIds || !Array.isArray(programIds) || programIds.length === 0) return [];
    const created = [];
    for (const programId of programIds) {
      const row = await db.query(
        `INSERT INTO career_programs (career_id, program_id) VALUES ($1, $2) ON CONFLICT (career_id, program_id) DO NOTHING RETURNING *`,
        [careerId, programId]
      );
      if (row.rows[0]) created.push(row.rows[0]);
    }
    return created;
  }

  static async deleteByCareerId(careerId) {
    await db.query('DELETE FROM career_programs WHERE career_id = $1', [careerId]);
  }
}

module.exports = CareerProgram;
