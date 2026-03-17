const db = require('../../config/database');

class CollegeProgram {
  static async findByCollegeId(collegeId) {
    const result = await db.query(
      'SELECT * FROM college_programs WHERE college_id = $1 ORDER BY id',
      [collegeId]
    );
    return result.rows;
  }

  static async findById(id) {
    const result = await db.query(
      'SELECT * FROM college_programs WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  static async create(data) {
    const {
      college_id, program_id, intake_capacity, duration_years,
      branch_course, program_description, duration_unit,
      key_dates_summary, fee_per_semester, total_fee,
      placement, scholarship, counselling_process, documents_required,
      recommended_exam_ids, contact_email, contact_number, brochure_url
    } = data;
    const result = await db.query(
      `INSERT INTO college_programs (
        college_id, program_id, intake_capacity, duration_years,
        branch_course, program_description, duration_unit,
        key_dates_summary, fee_per_semester, total_fee,
        placement, scholarship, counselling_process, documents_required,
        recommended_exam_ids, contact_email, contact_number, brochure_url
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18) RETURNING *`,
      [
        college_id, program_id, intake_capacity || null, duration_years ?? null,
        branch_course || null, program_description || null, duration_unit || 'years',
        key_dates_summary || null, fee_per_semester ?? null, total_fee ?? null,
        placement || null, scholarship || null, counselling_process || null, documents_required || null,
        recommended_exam_ids || null, contact_email || null, contact_number || null, brochure_url || null
      ]
    );
    return result.rows[0];
  }

  static async deleteByCollegeId(collegeId) {
    await db.query('DELETE FROM college_programs WHERE college_id = $1', [collegeId]);
  }
}

module.exports = CollegeProgram;
