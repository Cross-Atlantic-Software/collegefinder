const db = require('../../config/database');

class CollegeKeyDates {
  static async findByCollegeId(collegeId) {
    const result = await db.query(
      'SELECT * FROM college_key_dates WHERE college_id = $1 ORDER BY event_date ASC NULLS LAST, id',
      [collegeId]
    );
    return result.rows;
  }

  static async findByCollegeIds(collegeIds) {
    if (!collegeIds || collegeIds.length === 0) return [];
    const result = await db.query(
      `SELECT * FROM college_key_dates WHERE college_id = ANY($1::int[])
       ORDER BY college_id, event_date ASC NULLS LAST, id`,
      [collegeIds]
    );
    return result.rows;
  }

  static async create(data) {
    const { college_id, event_name, event_date } = data;
    const result = await db.query(
      `INSERT INTO college_key_dates (college_id, event_name, event_date)
       VALUES ($1, $2, $3) RETURNING *`,
      [college_id, event_name || null, event_date || null]
    );
    return result.rows[0];
  }

  static async deleteByCollegeId(collegeId) {
    await db.query('DELETE FROM college_key_dates WHERE college_id = $1', [collegeId]);
  }
}

module.exports = CollegeKeyDates;
