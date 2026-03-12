const db = require('../../config/database');

class InstituteStatistics {
  static async findByInstituteId(instituteId) {
    const result = await db.query(
      'SELECT * FROM institute_statistics WHERE institute_id = $1',
      [instituteId]
    );
    return result.rows[0] || null;
  }

  static async create(data) {
    const { institute_id, ranking_score, success_rate, student_rating } = data;
    const result = await db.query(
      `INSERT INTO institute_statistics (institute_id, ranking_score, success_rate, student_rating)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (institute_id) DO UPDATE SET
         ranking_score = EXCLUDED.ranking_score,
         success_rate = EXCLUDED.success_rate,
         student_rating = EXCLUDED.student_rating,
         updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [institute_id, ranking_score ?? null, success_rate ?? null, student_rating ?? null]
    );
    return result.rows[0];
  }

  static async deleteByInstituteId(instituteId) {
    await db.query('DELETE FROM institute_statistics WHERE institute_id = $1', [instituteId]);
  }
}

module.exports = InstituteStatistics;
