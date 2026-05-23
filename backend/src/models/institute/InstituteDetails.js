const db = require('../../config/database');

class InstituteDetails {
  static async findByInstituteId(instituteId) {
    const result = await db.query(
      'SELECT * FROM institute_details WHERE institute_id = $1',
      [instituteId]
    );
    return result.rows[0] || null;
  }

  static async findDescriptionsByInstituteIds(instituteIds) {
    if (!instituteIds?.length) return new Map();
    const ids = instituteIds
      .map((id) => parseInt(id, 10))
      .filter((n) => Number.isInteger(n) && n > 0);
    if (!ids.length) return new Map();
    const result = await db.query(
      `SELECT institute_id, institute_description
       FROM institute_details
       WHERE institute_id = ANY($1::int[])`,
      [ids]
    );
    const map = new Map();
    for (const row of result.rows) {
      map.set(row.institute_id, row.institute_description);
    }
    return map;
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
