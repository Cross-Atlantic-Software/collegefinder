const db = require('../../config/database');

class ScholarshipDocumentsRequired {
  static async findByScholarshipId(scholarshipId) {
    const result = await db.query(
      'SELECT * FROM scholarship_documents_required WHERE scholarship_id = $1 ORDER BY id',
      [scholarshipId]
    );
    return result.rows;
  }

  static async create(data) {
    const { scholarship_id, document_name } = data;
    const result = await db.query(
      'INSERT INTO scholarship_documents_required (scholarship_id, document_name) VALUES ($1, $2) RETURNING *',
      [scholarship_id, document_name || null]
    );
    return result.rows[0];
  }

  static async deleteByScholarshipId(scholarshipId) {
    await db.query('DELETE FROM scholarship_documents_required WHERE scholarship_id = $1', [scholarshipId]);
  }
}

module.exports = ScholarshipDocumentsRequired;
