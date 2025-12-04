const db = require('../config/database');

class UserCareerGoals {
  /**
   * Find career goals by user ID
   */
  static async findByUserId(userId) {
    const userIdNum = typeof userId === 'string' ? parseInt(userId, 10) : userId;
    if (isNaN(userIdNum)) {
      return null;
    }

    const result = await db.query(
      'SELECT * FROM user_career_goals WHERE user_id = $1',
      [userIdNum]
    );
    return result.rows[0] || null;
  }

  /**
   * Create or update user career goals
   */
  static async upsert(userId, data) {
    const userIdNum = typeof userId === 'string' ? parseInt(userId, 10) : userId;
    if (isNaN(userIdNum)) {
      throw new Error('Invalid user ID');
    }

    const { interests } = data;

    // Ensure arrays are properly formatted for PostgreSQL INTEGER[]
    // Convert string IDs to integers if needed
    let interestsArray = [];
    if (Array.isArray(interests)) {
      interestsArray = interests.map(id => {
        const numId = typeof id === 'string' ? parseInt(id, 10) : id;
        return isNaN(numId) ? null : numId;
      }).filter(id => id !== null);
    }

    const result = await db.query(
      `INSERT INTO user_career_goals (user_id, interests)
      VALUES ($1, $2)
      ON CONFLICT (user_id)
      DO UPDATE SET
        interests = EXCLUDED.interests,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *`,
      [
        userIdNum,
        interestsArray.length > 0 ? interestsArray : null
      ]
    );

    return result.rows[0];
  }

  /**
   * Delete user career goals
   */
  static async deleteByUserId(userId) {
    const userIdNum = typeof userId === 'string' ? parseInt(userId, 10) : userId;
    if (isNaN(userIdNum)) {
      throw new Error('Invalid user ID');
    }

    const result = await db.query(
      'DELETE FROM user_career_goals WHERE user_id = $1 RETURNING *',
      [userIdNum]
    );
    return result.rows[0] || null;
  }
}

module.exports = UserCareerGoals;


