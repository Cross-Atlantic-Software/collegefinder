const db = require('../../config/database');

class CollegeCourse {
  /**
   * Find all college courses
   */
  static async findAll() {
    const result = await db.query(
      `SELECT cc.*, 
              c.name as college_name,
              s.name as stream_name,
              l.name as level_name,
              p.name as program_name
       FROM college_courses cc
       LEFT JOIN colleges c ON cc.college_id = c.id
       LEFT JOIN streams s ON cc.stream_id = s.id
       LEFT JOIN levels l ON cc.level_id = l.id
       LEFT JOIN programs p ON cc.program_id = p.id
       ORDER BY c.name ASC, cc.title ASC`
    );
    return result.rows;
  }

  /**
   * Find courses by college ID
   */
  static async findByCollegeId(collegeId) {
    const result = await db.query(
      `SELECT cc.*, 
              s.name as stream_name,
              l.name as level_name,
              p.name as program_name
       FROM college_courses cc
       LEFT JOIN streams s ON cc.stream_id = s.id
       LEFT JOIN levels l ON cc.level_id = l.id
       LEFT JOIN programs p ON cc.program_id = p.id
       WHERE cc.college_id = $1 
       ORDER BY cc.title ASC`,
      [collegeId]
    );
    return result.rows;
  }

  /**
   * Find course by ID
   */
  static async findById(id) {
    const result = await db.query(
      `SELECT cc.*, 
              c.name as college_name,
              s.name as stream_name,
              l.name as level_name,
              p.name as program_name
       FROM college_courses cc
       LEFT JOIN colleges c ON cc.college_id = c.id
       LEFT JOIN streams s ON cc.stream_id = s.id
       LEFT JOIN levels l ON cc.level_id = l.id
       LEFT JOIN programs p ON cc.program_id = p.id
       WHERE cc.id = $1`,
      [id]
    );
    return result.rows[0] || null;
  }

  /**
   * Create a new course
   */
  static async create(data) {
    const {
      college_id,
      stream_id,
      level_id,
      program_id,
      title,
      summary,
      duration,
      curriculum_detail,
      admission_process,
      eligibility,
      placements,
      scholarship,
      brochure_url,
      fee_per_sem,
      total_fee,
      subject_ids,
      exam_ids
    } = data;

    const result = await db.query(
      `INSERT INTO college_courses (
        college_id, stream_id, level_id, program_id, title, summary, duration,
        curriculum_detail, admission_process, eligibility, placements, scholarship,
        brochure_url, fee_per_sem, total_fee, subject_ids, exam_ids
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      RETURNING *`,
      [
        college_id,
        stream_id || null,
        level_id || null,
        program_id || null,
        title,
        summary || null,
        duration || null,
        curriculum_detail || null,
        admission_process || null,
        eligibility || null,
        placements || null,
        scholarship || null,
        brochure_url || null,
        fee_per_sem || null,
        total_fee || null,
        subject_ids && Array.isArray(subject_ids) && subject_ids.length > 0 ? subject_ids : null,
        exam_ids && Array.isArray(exam_ids) && exam_ids.length > 0 ? exam_ids : null
      ]
    );
    return result.rows[0];
  }

  /**
   * Update a course
   */
  static async update(id, data) {
    const {
      college_id,
      stream_id,
      level_id,
      program_id,
      title,
      summary,
      duration,
      curriculum_detail,
      admission_process,
      eligibility,
      placements,
      scholarship,
      brochure_url,
      fee_per_sem,
      total_fee,
      subject_ids,
      exam_ids
    } = data;

    const updates = [];
    const values = [];
    let paramCount = 1;

    if (college_id !== undefined) {
      updates.push(`college_id = $${paramCount++}`);
      values.push(college_id);
    }
    if (stream_id !== undefined) {
      updates.push(`stream_id = $${paramCount++}`);
      values.push(stream_id || null);
    }
    if (level_id !== undefined) {
      updates.push(`level_id = $${paramCount++}`);
      values.push(level_id || null);
    }
    if (program_id !== undefined) {
      updates.push(`program_id = $${paramCount++}`);
      values.push(program_id || null);
    }
    if (title !== undefined) {
      updates.push(`title = $${paramCount++}`);
      values.push(title);
    }
    if (summary !== undefined) {
      updates.push(`summary = $${paramCount++}`);
      values.push(summary || null);
    }
    if (duration !== undefined) {
      updates.push(`duration = $${paramCount++}`);
      values.push(duration || null);
    }
    if (curriculum_detail !== undefined) {
      updates.push(`curriculum_detail = $${paramCount++}`);
      values.push(curriculum_detail || null);
    }
    if (admission_process !== undefined) {
      updates.push(`admission_process = $${paramCount++}`);
      values.push(admission_process || null);
    }
    if (eligibility !== undefined) {
      updates.push(`eligibility = $${paramCount++}`);
      values.push(eligibility || null);
    }
    if (placements !== undefined) {
      updates.push(`placements = $${paramCount++}`);
      values.push(placements || null);
    }
    if (scholarship !== undefined) {
      updates.push(`scholarship = $${paramCount++}`);
      values.push(scholarship || null);
    }
    if (brochure_url !== undefined) {
      updates.push(`brochure_url = $${paramCount++}`);
      values.push(brochure_url || null);
    }
    if (fee_per_sem !== undefined) {
      updates.push(`fee_per_sem = $${paramCount++}`);
      values.push(fee_per_sem || null);
    }
    if (total_fee !== undefined) {
      updates.push(`total_fee = $${paramCount++}`);
      values.push(total_fee || null);
    }
    if (subject_ids !== undefined) {
      updates.push(`subject_ids = $${paramCount++}`);
      values.push(subject_ids && Array.isArray(subject_ids) && subject_ids.length > 0 ? subject_ids : null);
    }
    if (exam_ids !== undefined) {
      updates.push(`exam_ids = $${paramCount++}`);
      values.push(exam_ids && Array.isArray(exam_ids) && exam_ids.length > 0 ? exam_ids : null);
    }

    if (updates.length === 0) {
      return await this.findById(id);
    }

    values.push(id);
    const result = await db.query(
      `UPDATE college_courses SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
       WHERE id = $${paramCount} RETURNING *`,
      values
    );
    return result.rows[0] || null;
  }

  /**
   * Delete a course
   */
  static async delete(id) {
    const result = await db.query('DELETE FROM college_courses WHERE id = $1 RETURNING *', [id]);
    return result.rows[0] || null;
  }
}

module.exports = CollegeCourse;

