const db = require('../../config/database');

class GovernmentIdentification {
  /**
   * Find government identification by user ID
   */
  static async findByUserId(userId) {
    const userIdNum = typeof userId === 'string' ? parseInt(userId, 10) : userId;
    if (isNaN(userIdNum)) {
      return null;
    }

    const result = await db.query(
      'SELECT * FROM government_identification WHERE user_id = $1',
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
      'SELECT * FROM government_identification WHERE id = $1',
      [idNum]
    );
    return result.rows[0] || null;
  }

  /**
   * Create or update government identification (upsert)
   */
  static async upsert(userId, data) {
    const userIdNum = typeof userId === 'string' ? parseInt(userId, 10) : userId;
    if (isNaN(userIdNum)) {
      throw new Error('Invalid user ID');
    }

    const {
      aadhar_number,
      alternative_id_type,
      alternative_id_number,
      place_of_issue
    } = data;

    // Check if record exists
    const existing = await GovernmentIdentification.findByUserId(userIdNum);

    if (existing) {
      // Update existing record
      const result = await db.query(
        `UPDATE government_identification 
         SET aadhar_number = $1,
             alternative_id_type = $2,
             alternative_id_number = $3,
             place_of_issue = $4,
             updated_at = CURRENT_TIMESTAMP
         WHERE user_id = $5
         RETURNING *`,
        [
          aadhar_number || null,
          alternative_id_type || null,
          alternative_id_number || null,
          place_of_issue || null,
          userIdNum
        ]
      );
      return result.rows[0];
    } else {
      // Create new record
      const result = await db.query(
        `INSERT INTO government_identification 
         (user_id, aadhar_number, alternative_id_type, alternative_id_number, place_of_issue)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [
          userIdNum,
          aadhar_number || null,
          alternative_id_type || null,
          alternative_id_number || null,
          place_of_issue || null
        ]
      );
      return result.rows[0];
    }
  }

  /**
   * Delete government identification by user ID
   */
  static async deleteByUserId(userId) {
    const userIdNum = typeof userId === 'string' ? parseInt(userId, 10) : userId;
    if (isNaN(userIdNum)) {
      throw new Error('Invalid user ID');
    }

    const result = await db.query(
      'DELETE FROM government_identification WHERE user_id = $1 RETURNING *',
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
      'DELETE FROM government_identification WHERE id = $1 RETURNING *',
      [idNum]
    );
    return result.rows[0] || null;
  }
}

module.exports = GovernmentIdentification;

