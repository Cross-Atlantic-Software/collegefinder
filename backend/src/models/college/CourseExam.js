const db = require('../../config/database');

class CourseExam {
  /**
   * Find all course exams
   */
  static async findAll() {
    const result = await db.query(
      `SELECT ce.*, cc.title as course_title, c.name as college_name
       FROM course_exams ce
       LEFT JOIN college_courses cc ON ce.course_id = cc.id
       LEFT JOIN colleges c ON cc.college_id = c.id
       ORDER BY c.name ASC, cc.title ASC, ce.exam_name ASC`
    );
    return result.rows;
  }

  /**
   * Find exams by course ID
   */
  static async findByCourseId(courseId) {
    const result = await db.query(
      'SELECT * FROM course_exams WHERE course_id = $1 ORDER BY exam_name ASC',
      [courseId]
    );
    return result.rows;
  }

  /**
   * Find exam by ID
   */
  static async findById(id) {
    const result = await db.query(
      `SELECT ce.*, cc.title as course_title, c.name as college_name
       FROM course_exams ce
       LEFT JOIN college_courses cc ON ce.course_id = cc.id
       LEFT JOIN colleges c ON cc.college_id = c.id
       WHERE ce.id = $1`,
      [id]
    );
    return result.rows[0] || null;
  }

  /**
   * Create a new exam
   */
  static async create(data) {
    const { course_id, exam_name } = data;

    const result = await db.query(
      `INSERT INTO course_exams (course_id, exam_name)
       VALUES ($1, $2)
       RETURNING *`,
      [course_id, exam_name]
    );
    return result.rows[0];
  }

  /**
   * Update an exam
   */
  static async update(id, data) {
    const { course_id, exam_name } = data;

    const updates = [];
    const values = [];
    let paramCount = 1;

    if (course_id !== undefined) {
      updates.push(`course_id = $${paramCount++}`);
      values.push(course_id);
    }
    if (exam_name !== undefined) {
      updates.push(`exam_name = $${paramCount++}`);
      values.push(exam_name);
    }

    if (updates.length === 0) {
      return await this.findById(id);
    }

    values.push(id);
    const result = await db.query(
      `UPDATE course_exams SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
       WHERE id = $${paramCount} RETURNING *`,
      values
    );
    return result.rows[0] || null;
  }

  /**
   * Delete an exam
   */
  static async delete(id) {
    const result = await db.query('DELETE FROM course_exams WHERE id = $1 RETURNING *', [id]);
    return result.rows[0] || null;
  }
}

module.exports = CourseExam;

