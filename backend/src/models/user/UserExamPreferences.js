const db = require('../../config/database');

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

    // Get existing preferences to preserve fields that aren't being updated
    const existing = await this.findByUserId(userIdNum);

    // Prepare target_exams - use new value if provided, otherwise keep existing
    let targetExamsArray = null;
    if (target_exams !== undefined) {
      // Field is explicitly provided, use it
      if (Array.isArray(target_exams) && target_exams.length > 0) {
        targetExamsArray = target_exams.map(id => {
          const numId = typeof id === 'string' ? parseInt(id, 10) : id;
          return isNaN(numId) ? null : numId;
        }).filter(id => id !== null);
      } else {
        // Empty array or null means clear the field
        targetExamsArray = null;
      }
    } else {
      // Field not provided, keep existing value
      targetExamsArray = existing?.target_exams || null;
    }

    // Prepare previous_attempts - use new value if provided, otherwise keep existing
    let previousAttemptsJson = null;
    if (previous_attempts !== undefined) {
      // Field is explicitly provided, use it
      if (Array.isArray(previous_attempts) && previous_attempts.length > 0) {
        previousAttemptsJson = JSON.stringify(previous_attempts);
      } else {
        // Empty array or null means clear the field
        previousAttemptsJson = null;
      }
    } else {
      // Field not provided, keep existing value
      if (existing?.previous_attempts) {
        previousAttemptsJson = typeof existing.previous_attempts === 'string' 
          ? existing.previous_attempts 
          : JSON.stringify(existing.previous_attempts);
      } else {
        previousAttemptsJson = null;
      }
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
        targetExamsArray,
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

