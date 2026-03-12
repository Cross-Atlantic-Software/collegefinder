const db = require('../../config/database');

class InstituteExamSpecialization {
  static async getExamIdsByInstituteId(instituteId) {
    const result = await db.query(
      'SELECT exam_id FROM institute_exam_specialization WHERE institute_id = $1 ORDER BY exam_id',
      [instituteId]
    );
    return result.rows.map(r => r.exam_id);
  }

  static async setSpecializationsForInstitute(instituteId, examIds) {
    await db.query('DELETE FROM institute_exam_specialization WHERE institute_id = $1', [instituteId]);
    if (!examIds || !Array.isArray(examIds) || examIds.length === 0) return [];
    const created = [];
    for (const examId of examIds) {
      const row = await db.query(
        `INSERT INTO institute_exam_specialization (institute_id, exam_id) VALUES ($1, $2) ON CONFLICT (institute_id, exam_id) DO NOTHING RETURNING *`,
        [instituteId, examId]
      );
      if (row.rows[0]) created.push(row.rows[0]);
    }
    return created;
  }

  static async deleteByInstituteId(instituteId) {
    await db.query('DELETE FROM institute_exam_specialization WHERE institute_id = $1', [instituteId]);
  }
}

module.exports = InstituteExamSpecialization;
