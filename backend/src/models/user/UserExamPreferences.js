const db = require('../../../config/database');

class UserExamPreferences {
  /**
   * Find exam preferences by user ID
   */
  static async findByUserId(userId) {
    const userIdNum = typeof userId === 'string' ? parseInt(userId, 10) : userId;
    if (isNaN(userIdNum)) {
      return null;
    }

    const result = await db.query(
      'SELECT * FROM user_exam_preferences WHERE user_id = $1',
      [userIdNum]
    );
    return result.rows[0] || null;
  }

  /**
   * Create or update user exam preferences
   */
  static async upsert(userId, data) {
    const userIdNum = typeof userId === 'string' ? parseInt(userId, 10) : userId;
    if (isNaN(userIdNum)) {
      throw new Error('Invalid user ID');
    }

    const { target_exams, previous_attempts } = data;

    // Ensure arrays are properly formatted for PostgreSQL INTEGER[]
    let targetExamsArray = [];
    if (Array.isArray(target_exams)) {
      targetExamsArray = target_exams.map(id => {
        const numId = typeof id === 'string' ? parseInt(id, 10) : id;
        return isNaN(numId) ? null : numId;
      }).filter(id => id !== null);
    }

    // Ensure previous_attempts is valid JSONB
    let previousAttemptsJson = null;
    if (Array.isArray(previous_attempts) && previous_attempts.length > 0) {
      previousAttemptsJson = JSON.stringify(previous_attempts);
    }

    const result = await db.query(
      `INSERT INTO user_exam_preferences (user_id, target_exams, previous_attempts)
      VALUES ($1, $2, $3::jsonb)
      ON CONFLICT (user_id)
      DO UPDATE SET
        target_exams = EXCLUDED.target_exams,
        previous_attempts = EXCLUDED.previous_attempts,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *`,
      [
        userIdNum,
        targetExamsArray.length > 0 ? targetExamsArray : null,
        previousAttemptsJson
      ]
    );

    return result.rows[0];
  }

  /**
   * Delete user exam preferences
   */
  static async deleteByUserId(userId) {
    const userIdNum = typeof userId === 'string' ? parseInt(userId, 10) : userId;
    if (isNaN(userIdNum)) {
      throw new Error('Invalid user ID');
    }

    const result = await db.query(
      'DELETE FROM user_exam_preferences WHERE user_id = $1 RETURNING *',
      [userIdNum]
    );
    return result.rows[0] || null;
  }
}

module.exports = UserExamPreferences;

