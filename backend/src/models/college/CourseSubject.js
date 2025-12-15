const db = require('../../config/database');

class CourseSubject {
  /**
   * Find all course subjects
   */
  static async findAll() {
    const result = await db.query(
      `SELECT cs.*, 
              cct.title as course_title,
              c.name as college_name,
              s.name as subject_name
       FROM course_subjects cs
       LEFT JOIN college_courses cct ON cs.course_id = cct.id
       LEFT JOIN colleges c ON cct.college_id = c.id
       LEFT JOIN subjects s ON cs.subject_id = s.id
       ORDER BY c.name ASC, cct.title ASC, s.name ASC`
    );
    return result.rows;
  }

  /**
   * Find subjects by course ID
   */
  static async findByCourseId(courseId) {
    const result = await db.query(
      `SELECT cs.*, s.name as subject_name
       FROM course_subjects cs
       LEFT JOIN subjects s ON cs.subject_id = s.id
       WHERE cs.course_id = $1 
       ORDER BY s.name ASC`,
      [courseId]
    );
    return result.rows;
  }

  /**
   * Find subject by ID
   */
  static async findById(id) {
    const result = await db.query(
      `SELECT cs.*, 
              cct.title as course_title,
              c.name as college_name,
              s.name as subject_name
       FROM course_subjects cs
       LEFT JOIN college_courses cct ON cs.course_id = cct.id
       LEFT JOIN colleges c ON cct.college_id = c.id
       LEFT JOIN subjects s ON cs.subject_id = s.id
       WHERE cs.id = $1`,
      [id]
    );
    return result.rows[0] || null;
  }

  /**
   * Create a new course subject
   */
  static async create(data) {
    const { course_id, subject_id } = data;

    const result = await db.query(
      `INSERT INTO course_subjects (course_id, subject_id)
       VALUES ($1, $2)
       RETURNING *`,
      [course_id, subject_id]
    );
    return result.rows[0];
  }

  /**
   * Update a course subject
   */
  static async update(id, data) {
    const { course_id, subject_id } = data;

    const updates = [];
    const values = [];
    let paramCount = 1;

    if (course_id !== undefined) {
      updates.push(`course_id = $${paramCount++}`);
      values.push(course_id);
    }
    if (subject_id !== undefined) {
      updates.push(`subject_id = $${paramCount++}`);
      values.push(subject_id);
    }

    if (updates.length === 0) {
      return await this.findById(id);
    }

    values.push(id);
    const result = await db.query(
      `UPDATE course_subjects SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
       WHERE id = $${paramCount} RETURNING *`,
      values
    );
    return result.rows[0] || null;
  }

  /**
   * Delete a course subject
   */
  static async delete(id) {
    const result = await db.query('DELETE FROM course_subjects WHERE id = $1 RETURNING *', [id]);
    return result.rows[0] || null;
  }
}

module.exports = CourseSubject;

