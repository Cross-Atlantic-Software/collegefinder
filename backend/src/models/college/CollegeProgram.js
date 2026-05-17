const db = require('../../config/database');

class CollegeProgram {
  static async findByCollegeId(collegeId) {
    const result = await db.query(
      'SELECT * FROM college_programs WHERE college_id = $1 ORDER BY id',
      [collegeId]
    );
    return result.rows;
  }

  /** Programs for many colleges with program display name */
  static async findByCollegeIdsWithProgramNames(collegeIds) {
    if (!collegeIds || collegeIds.length === 0) return [];
    const result = await db.query(
      `SELECT cp.*, p.name AS program_name
       FROM college_programs cp
       LEFT JOIN programs p ON p.id = cp.program_id
       WHERE cp.college_id = ANY($1::int[])
       ORDER BY cp.college_id, cp.id`,
      [collegeIds]
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
      branch_id, branch_course, program_description, duration_unit,
      key_dates_summary, fee_per_semester, total_fee,
      placement, scholarship, counselling_process, documents_required,
      recommended_exam_ids, contact_email, contact_number, brochure_url
    } = data;
    const result = await db.query(
      `INSERT INTO college_programs (
        college_id, program_id, intake_capacity, duration_years,
        branch_id, branch_course, program_description, duration_unit,
        key_dates_summary, fee_per_semester, total_fee,
        placement, scholarship, counselling_process, documents_required,
        recommended_exam_ids, contact_email, contact_number, brochure_url
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19) RETURNING *`,
      [
        college_id, program_id, intake_capacity || null, duration_years ?? null,
        branch_id || null, branch_course || null, program_description || null, duration_unit || 'years',
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

  /** Colleges that list this exam on any program (recommended_exam_ids CSV). */
  static async getCollegeIdsByExamId(examId) {
    const id = parseInt(examId, 10);
    if (!Number.isInteger(id) || id < 1) return [];
    const result = await db.query(
      `SELECT DISTINCT college_id
       FROM college_programs
       WHERE recommended_exam_ids IS NOT NULL
         AND TRIM(recommended_exam_ids) <> ''
         AND EXISTS (
           SELECT 1
           FROM unnest(string_to_array(recommended_exam_ids, ',')) AS token(raw)
           WHERE TRIM(raw) ~ '^[0-9]+$'
             AND TRIM(raw)::int = $1
         )
       ORDER BY college_id`,
      [id]
    );
    return result.rows.map((r) => r.college_id);
  }
}

module.exports = CollegeProgram;
