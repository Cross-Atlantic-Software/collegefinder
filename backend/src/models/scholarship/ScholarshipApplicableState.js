const db = require('../../config/database');

class ScholarshipApplicableState {
  static async findByScholarshipId(scholarshipId) {
    const result = await db.query(
      'SELECT * FROM scholarship_applicable_states WHERE scholarship_id = $1 ORDER BY id',
      [scholarshipId]
    );
    return result.rows;
  }

  static async findByScholarshipIds(scholarshipIds) {
    if (!scholarshipIds?.length) return new Map();
    const ids = scholarshipIds
      .map((id) => parseInt(id, 10))
      .filter((n) => Number.isInteger(n) && n > 0);
    if (!ids.length) return new Map();
    const result = await db.query(
      `SELECT scholarship_id, state_name
       FROM scholarship_applicable_states
       WHERE scholarship_id = ANY($1::int[])
       ORDER BY scholarship_id, id`,
      [ids]
    );
    const map = new Map();
    for (const row of result.rows) {
      if (!map.has(row.scholarship_id)) map.set(row.scholarship_id, []);
      if (row.state_name?.trim()) map.get(row.scholarship_id).push(row.state_name.trim());
    }
    return map;
  }

  static async create(data) {
    const { scholarship_id, state_name } = data;
    const result = await db.query(
      'INSERT INTO scholarship_applicable_states (scholarship_id, state_name) VALUES ($1, $2) RETURNING *',
      [scholarship_id, state_name || null]
    );
    return result.rows[0];
  }

  static async deleteByScholarshipId(scholarshipId) {
    await db.query('DELETE FROM scholarship_applicable_states WHERE scholarship_id = $1', [scholarshipId]);
  }
}

module.exports = ScholarshipApplicableState;
