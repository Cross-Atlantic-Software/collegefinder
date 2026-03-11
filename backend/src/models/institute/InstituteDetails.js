const db = require('../../config/database');

class InstituteDetails {
  static async findByInstituteId(instituteId) {
    const result = await db.query(
      'SELECT * FROM institute_details WHERE institute_id = $1',
      [instituteId]
    );
    return result.rows[0] || null;
  }

  static async create(data) {
    const { institute_id, institute_description, demo_available, scholarship_available } = data;
    const result = await db.query(
      `INSERT INTO institute_details (institute_id, institute_description, demo_available, scholarship_available)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (institute_id) DO UPDATE SET
         institute_description = EXCLUDED.institute_description,
         demo_available = EXCLUDED.demo_available,
         scholarship_available = EXCLUDED.scholarship_available,
         updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [institute_id, institute_description || null, !!demo_available, !!scholarship_available]
    );
    return result.rows[0];
  }

  static async deleteByInstituteId(instituteId) {
    await db.query('DELETE FROM institute_details WHERE institute_id = $1', [instituteId]);
  }
}

module.exports = InstituteDetails;
