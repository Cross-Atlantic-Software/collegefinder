const db = require('../../config/database');

class CollegeDocumentsRequired {
  static async findByCollegeId(collegeId) {
    const result = await db.query(
      'SELECT * FROM college_documents_required WHERE college_id = $1 ORDER BY id',
      [collegeId]
    );
    return result.rows;
  }

  static async create(data) {
    const { college_id, document_name } = data;
    const result = await db.query(
      `INSERT INTO college_documents_required (college_id, document_name)
       VALUES ($1, $2) RETURNING *`,
      [college_id, document_name || null]
    );
    return result.rows[0];
  }

  static async deleteByCollegeId(collegeId) {
    await db.query('DELETE FROM college_documents_required WHERE college_id = $1', [collegeId]);
  }
}

module.exports = CollegeDocumentsRequired;
