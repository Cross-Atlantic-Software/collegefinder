const db = require('../../config/database');

class OtherPersonalDetails {
  /**
   * Find other personal details by user ID
   */
  static async findByUserId(userId) {
    const userIdNum = typeof userId === 'string' ? parseInt(userId, 10) : userId;
    if (isNaN(userIdNum)) {
      return null;
    }

    const result = await db.query(
      'SELECT * FROM other_personal_details WHERE user_id = $1',
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
      'SELECT * FROM other_personal_details WHERE id = $1',
      [idNum]
    );
    return result.rows[0] || null;
  }

  /**
   * Create or update other personal details (upsert)
   */
  static async upsert(userId, data) {
    const userIdNum = typeof userId === 'string' ? parseInt(userId, 10) : userId;
    if (isNaN(userIdNum)) {
      throw new Error('Invalid user ID');
    }

    const {
      religion,
      mother_tongue,
      annual_family_income,
      occupation_of_father,
      occupation_of_mother
    } = data;

    // Check if record exists
    const existing = await OtherPersonalDetails.findByUserId(userIdNum);

    if (existing) {
      // Update existing record
      const result = await db.query(
        `UPDATE other_personal_details 
         SET religion = $1,
             mother_tongue = $2,
             annual_family_income = $3,
             occupation_of_father = $4,
             occupation_of_mother = $5,
             updated_at = CURRENT_TIMESTAMP
         WHERE user_id = $6
         RETURNING *`,
        [
          religion || null,
          mother_tongue || null,
          annual_family_income || null,
          occupation_of_father || null,
          occupation_of_mother || null,
          userIdNum
        ]
      );
      return result.rows[0];
    } else {
      // Create new record
      const result = await db.query(
        `INSERT INTO other_personal_details 
         (user_id, religion, mother_tongue, annual_family_income, occupation_of_father, occupation_of_mother)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [
          userIdNum,
          religion || null,
          mother_tongue || null,
          annual_family_income || null,
          occupation_of_father || null,
          occupation_of_mother || null
        ]
      );
      return result.rows[0];
    }
  }

  /**
   * Delete other personal details by user ID
   */
  static async deleteByUserId(userId) {
    const userIdNum = typeof userId === 'string' ? parseInt(userId, 10) : userId;
    if (isNaN(userIdNum)) {
      throw new Error('Invalid user ID');
    }

    const result = await db.query(
      'DELETE FROM other_personal_details WHERE user_id = $1 RETURNING *',
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
      'DELETE FROM other_personal_details WHERE id = $1 RETURNING *',
      [idNum]
    );
    return result.rows[0] || null;
  }
}

module.exports = OtherPersonalDetails;

