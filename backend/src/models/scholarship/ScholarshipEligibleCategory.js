const db = require('../../config/database');

class ScholarshipEligibleCategory {
  static async findByScholarshipId(scholarshipId) {
    const result = await db.query(
      'SELECT * FROM scholarship_eligible_categories WHERE scholarship_id = $1 ORDER BY id',
      [scholarshipId]
    );
    return result.rows;
  }

  static async create(data) {
    const { scholarship_id, category } = data;
    const result = await db.query(
      'INSERT INTO scholarship_eligible_categories (scholarship_id, category) VALUES ($1, $2) RETURNING *',
      [scholarship_id, category || null]
    );
    return result.rows[0];
  }

  static async deleteByScholarshipId(scholarshipId) {
    await db.query('DELETE FROM scholarship_eligible_categories WHERE scholarship_id = $1', [scholarshipId]);
  }
}

module.exports = ScholarshipEligibleCategory;
