const db = require('../../config/database');

class CollegePreviousCutoff {
  static async findByCollegeProgramIds(collegeProgramIds) {
    if (!collegeProgramIds?.length) return [];
    const result = await db.query(
      `SELECT cpc.*, e.name AS exam_name, e.code AS exam_code
       FROM college_previous_cutoff cpc
       LEFT JOIN exams_taxonomies e ON e.id = cpc.exam_id
       WHERE cpc.college_program_id = ANY($1::int[])
       ORDER BY cpc.college_program_id, cpc.year DESC NULLS LAST, cpc.id`,
      [collegeProgramIds]
    );
    return result.rows;
  }

  static async findByCollegeProgramId(collegeProgramId) {
    const result = await db.query(
      'SELECT * FROM college_previous_cutoff WHERE college_program_id = $1 ORDER BY year DESC, id',
      [collegeProgramId]
    );
    return result.rows;
  }

  static async create(data) {
    const { college_program_id, exam_id, branch, category, cutoff_rank, year } = data;
    const result = await db.query(
      `INSERT INTO college_previous_cutoff (college_program_id, exam_id, branch, category, cutoff_rank, year)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [college_program_id, exam_id, branch || null, category || null, cutoff_rank || null, year || null]
    );
    return result.rows[0];
  }

  static async deleteByCollegeProgramId(collegeProgramId) {
    await db.query('DELETE FROM college_previous_cutoff WHERE college_program_id = $1', [collegeProgramId]);
  }
}

module.exports = CollegePreviousCutoff;
