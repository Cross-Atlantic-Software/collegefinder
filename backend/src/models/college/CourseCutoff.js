const db = require('../../config/database');

class CourseCutoff {
  /**
   * Find all course cutoffs
   */
  static async findAll() {
    const result = await db.query(
      `SELECT cc.*, 
              cct.title as course_title,
              c.name as college_name,
              ce.exam_name,
              cat.name as category_name
       FROM course_cutoffs cc
       LEFT JOIN college_courses cct ON cc.course_id = cct.id
       LEFT JOIN colleges c ON cct.college_id = c.id
       LEFT JOIN course_exams ce ON cc.exam_id = ce.id
       LEFT JOIN categories cat ON cc.category_id = cat.id
       ORDER BY c.name ASC, cct.title ASC, ce.exam_name ASC, cc.year DESC`
    );
    return result.rows;
  }

  /**
   * Find cutoffs by course ID
   */
  static async findByCourseId(courseId) {
    const result = await db.query(
      `SELECT cc.*, ce.exam_name
       FROM course_cutoffs cc
       LEFT JOIN course_exams ce ON cc.exam_id = ce.id
       WHERE cc.course_id = $1 
       ORDER BY ce.exam_name ASC, cc.year DESC`,
      [courseId]
    );
    return result.rows;
  }

  /**
   * Find cutoff by ID
   */
  static async findById(id) {
    const result = await db.query(
      `SELECT cc.*, 
              cct.title as course_title,
              c.name as college_name,
              ce.exam_name,
              cat.name as category_name
       FROM course_cutoffs cc
       LEFT JOIN college_courses cct ON cc.course_id = cct.id
       LEFT JOIN colleges c ON cct.college_id = c.id
       LEFT JOIN course_exams ce ON cc.exam_id = ce.id
       LEFT JOIN categories cat ON cc.category_id = cat.id
       WHERE cc.id = $1`,
      [id]
    );
    return result.rows[0] || null;
  }

  /**
   * Create a new cutoff
   */
  static async create(data) {
    const { course_id, exam_id, year, category_id, cutoff_value } = data;

    const result = await db.query(
      `INSERT INTO course_cutoffs (course_id, exam_id, year, category_id, cutoff_value)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [course_id, exam_id, year, category_id || null, cutoff_value]
    );
    return result.rows[0];
  }

  /**
   * Update a cutoff
   */
  static async update(id, data) {
    const { course_id, exam_id, year, category_id, cutoff_value } = data;

    const updates = [];
    const values = [];
    let paramCount = 1;

    if (course_id !== undefined) {
      updates.push(`course_id = $${paramCount++}`);
      values.push(course_id);
    }
    if (exam_id !== undefined) {
      updates.push(`exam_id = $${paramCount++}`);
      values.push(exam_id);
    }
    if (year !== undefined) {
      updates.push(`year = $${paramCount++}`);
      values.push(year);
    }
    if (category_id !== undefined) {
      updates.push(`category_id = $${paramCount++}`);
      values.push(category_id || null);
    }
    if (cutoff_value !== undefined) {
      updates.push(`cutoff_value = $${paramCount++}`);
      values.push(cutoff_value);
    }

    if (updates.length === 0) {
      return await this.findById(id);
    }

    values.push(id);
    const result = await db.query(
      `UPDATE course_cutoffs SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
       WHERE id = $${paramCount} RETURNING *`,
      values
    );
    return result.rows[0] || null;
  }

  /**
   * Delete a cutoff
   */
  static async delete(id) {
    const result = await db.query('DELETE FROM course_cutoffs WHERE id = $1 RETURNING *', [id]);
    return result.rows[0] || null;
  }
}

module.exports = CourseCutoff;

