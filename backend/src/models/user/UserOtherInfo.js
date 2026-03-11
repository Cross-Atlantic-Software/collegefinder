const db = require('../../config/database');

class UserOtherInfo {
  /**
   * Find user other info by user ID
   */
  static async findByUserId(userId) {
    const userIdNum = typeof userId === 'string' ? parseInt(userId, 10) : userId;
    if (isNaN(userIdNum)) {
      return null;
    }

    const result = await db.query(
      'SELECT * FROM user_other_info WHERE user_id = $1',
      [userIdNum]
    );
    return result.rows[0] || null;
  }

  /**
   * Find by ID
   */
  static async findById(id) {
    const idNum = typeof id === 'string' ? parseInt(id, 10) : id;
    if (isNaN(idNum)) {
      return null;
    }

    const result = await db.query(
      'SELECT * FROM user_other_info WHERE id = $1',
      [idNum]
    );
    return result.rows[0] || null;
  }

  /**
   * Create or update user other info (upsert)
   */
  static async upsert(userId, data) {
    const userIdNum = typeof userId === 'string' ? parseInt(userId, 10) : userId;
    if (isNaN(userIdNum)) {
      throw new Error('Invalid user ID');
    }

    const {
      medium,
      language,
      program_ids,
      exam_city_ids
    } = data;

    // Check if record exists
    const existing = await UserOtherInfo.findByUserId(userIdNum);

    // Prepare arrays - ensure they're arrays of integers
    let programIdsArray = null;
    if (program_ids) {
      if (Array.isArray(program_ids)) {
        programIdsArray = program_ids
          .map(id => {
            const numId = typeof id === 'string' ? parseInt(id, 10) : id;
            return isNaN(numId) ? null : numId;
          })
          .filter(id => id !== null && id > 0);
        if (programIdsArray.length === 0) programIdsArray = null;
      }
    }

    let examCityIdsArray = null;
    if (exam_city_ids) {
      if (Array.isArray(exam_city_ids)) {
        examCityIdsArray = exam_city_ids
          .map(id => {
            const numId = typeof id === 'string' ? parseInt(id, 10) : id;
            return isNaN(numId) ? null : numId;
          })
          .filter(id => id !== null && id > 0);
        if (examCityIdsArray.length === 0) examCityIdsArray = null;
      }
    }

    if (existing) {
      // Update existing record
      const result = await db.query(
        `UPDATE user_other_info 
         SET medium = $1,
             language = $2,
             program_ids = $3,
             exam_city_ids = $4,
             updated_at = CURRENT_TIMESTAMP
         WHERE user_id = $5
         RETURNING *`,
        [
          medium || null,
          language || null,
          programIdsArray,
          examCityIdsArray,
          userIdNum
        ]
      );
      return result.rows[0];
    } else {
      // Create new record
      const result = await db.query(
        `INSERT INTO user_other_info 
         (user_id, medium, language, program_ids, exam_city_ids)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [
          userIdNum,
          medium || null,
          language || null,
          programIdsArray,
          examCityIdsArray
        ]
      );
      return result.rows[0];
    }
  }

  /**
   * Delete user other info by user ID
   */
  static async deleteByUserId(userId) {
    const userIdNum = typeof userId === 'string' ? parseInt(userId, 10) : userId;
    if (isNaN(userIdNum)) {
      throw new Error('Invalid user ID');
    }

    const result = await db.query(
      'DELETE FROM user_other_info WHERE user_id = $1 RETURNING *',
      [userIdNum]
    );
    return result.rows[0] || null;
  }

  /**
   * Delete by ID
   */
  static async deleteById(id) {
    const idNum = typeof id === 'string' ? parseInt(id, 10) : id;
    if (isNaN(idNum)) {
      throw new Error('Invalid ID');
    }

    const result = await db.query(
      'DELETE FROM user_other_info WHERE id = $1 RETURNING *',
      [idNum]
    );
    return result.rows[0] || null;
  }
}

module.exports = UserOtherInfo;


