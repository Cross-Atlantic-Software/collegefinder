const db = require('../../config/database');

class ExamCareerGoal {
  /**
   * Find all career goals for an exam
   */
  static async findByExamId(examId) {
    const result = await db.query(
      `SELECT ecg.*, cg.label, cg.logo 
       FROM exam_career_goal ecg
       JOIN career_goals_taxonomies cg ON ecg.career_goal_id = cg.id
       WHERE ecg.exam_id = $1
       ORDER BY cg.label ASC`,
      [examId]
    );
    return result.rows;
  }

  /**
   * Find all exams for a career goal
   */
  static async findByCareerGoalId(careerGoalId) {
    const result = await db.query(
      `SELECT ecg.*, e.name, e.code 
       FROM exam_career_goal ecg
       JOIN exams_taxonomies e ON ecg.exam_id = e.id
       WHERE ecg.career_goal_id = $1
       ORDER BY e.name ASC`,
      [careerGoalId]
    );
    return result.rows;
  }

  /**
   * Check if relationship exists
   */
  static async exists(examId, careerGoalId) {
    const result = await db.query(
      'SELECT * FROM exam_career_goal WHERE exam_id = $1 AND career_goal_id = $2',
      [examId, careerGoalId]
    );
    return result.rows.length > 0;
  }

  /**
   * Create exam-career goal relationship
   */
  static async create(examId, careerGoalId) {
    const result = await db.query(
      'INSERT INTO exam_career_goal (exam_id, career_goal_id) VALUES ($1, $2) RETURNING *',
      [examId, careerGoalId]
    );
    return result.rows[0];
  }

  /**
   * Delete exam-career goal relationship
   */
  static async delete(examId, careerGoalId) {
    const result = await db.query(
      'DELETE FROM exam_career_goal WHERE exam_id = $1 AND career_goal_id = $2 RETURNING *',
      [examId, careerGoalId]
    );
    return result.rows[0] || null;
  }

  /**
   * Delete all relationships for an exam
   */
  static async deleteByExamId(examId) {
    const result = await db.query(
      'DELETE FROM exam_career_goal WHERE exam_id = $1',
      [examId]
    );
    return result.rowCount;
  }

  /**
   * Set career goals for an exam (replace all existing)
   */
  static async setCareerGoalsForExam(examId, careerGoalIds) {
    // Delete existing relationships
    await this.deleteByExamId(examId);

    // Create new relationships
    if (careerGoalIds && careerGoalIds.length > 0) {
      const values = [];
      const placeholders = [];
      careerGoalIds.forEach((careerGoalId, index) => {
        placeholders.push(`($1, $${index + 2})`);
        values.push(careerGoalId);
      });
      values.unshift(examId);

      const query = `
        INSERT INTO exam_career_goal (exam_id, career_goal_id) 
        VALUES ${placeholders.join(', ')}
        RETURNING *
      `;

      const result = await db.query(query, values);
      return result.rows;
    }

    return [];
  }

  /**
   * Get career goal IDs for an exam
   */
  static async getCareerGoalIds(examId) {
    const result = await db.query(
      'SELECT career_goal_id FROM exam_career_goal WHERE exam_id = $1',
      [examId]
    );
    return result.rows.map(row => row.career_goal_id);
  }

  /**
   * Get distinct exam IDs linked to any of the given career goal IDs.
   * Used for recommended exams: user's career goals -> exam IDs.
   */
  static async getExamIdsByCareerGoalIds(careerGoalIds) {
    if (!careerGoalIds || careerGoalIds.length === 0) {
      return [];
    }
    const result = await db.query(
      'SELECT DISTINCT exam_id FROM exam_career_goal WHERE career_goal_id = ANY($1::int[]) ORDER BY exam_id',
      [careerGoalIds]
    );
    return result.rows.map(row => row.exam_id);
  }
}

module.exports = ExamCareerGoal;
