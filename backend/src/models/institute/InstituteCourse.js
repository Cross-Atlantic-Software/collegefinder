const db = require('../../config/database');

class InstituteCourse {
  static async findByInstituteId(instituteId) {
    const result = await db.query(
      'SELECT * FROM institute_courses WHERE institute_id = $1 ORDER BY id',
      [instituteId]
    );
    return result.rows;
  }

  static async create(data) {
    const { institute_id, course_name, target_class, duration_months, fees, batch_size, start_date } = data;
    const result = await db.query(
      `INSERT INTO institute_courses (institute_id, course_name, target_class, duration_months, fees, batch_size, start_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [institute_id, course_name || null, target_class || null, duration_months ?? null, fees ?? null, batch_size ?? null, start_date || null]
    );
    return result.rows[0];
  }

  static async deleteByInstituteId(instituteId) {
    await db.query('DELETE FROM institute_courses WHERE institute_id = $1', [instituteId]);
  }
}

module.exports = InstituteCourse;
