const db = require('../../config/database');

class CategoryAndReservation {
  /**
   * Find category and reservation by user ID
   */
  static async findByUserId(userId) {
    const userIdNum = typeof userId === 'string' ? parseInt(userId, 10) : userId;
    if (isNaN(userIdNum)) {
      return null;
    }

    const result = await db.query(
      'SELECT * FROM category_and_reservation WHERE user_id = $1',
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
      'SELECT * FROM category_and_reservation WHERE id = $1',
      [idNum]
    );
    return result.rows[0] || null;
  }

  /**
   * Create or update category and reservation (upsert)
   */
  static async upsert(userId, data) {
    const userIdNum = typeof userId === 'string' ? parseInt(userId, 10) : userId;
    if (isNaN(userIdNum)) {
      throw new Error('Invalid user ID');
    }

    const {
      category_id,
      ews_status,
      pwbd_status,
      type_of_disability,
      disability_percentage,
      udid_number,
      minority_status,
      ex_serviceman_defence_quota,
      kashmiri_migrant_regional_quota
    } = data;

    // Check if record exists
    const existing = await CategoryAndReservation.findByUserId(userIdNum);

    if (existing) {
      // Update existing record
      const result = await db.query(
        `UPDATE category_and_reservation 
         SET category_id = $1,
             ews_status = $2,
             pwbd_status = $3,
             type_of_disability = $4,
             disability_percentage = $5,
             udid_number = $6,
             minority_status = $7,
             ex_serviceman_defence_quota = $8,
             kashmiri_migrant_regional_quota = $9,
             updated_at = CURRENT_TIMESTAMP
         WHERE user_id = $10
         RETURNING *`,
        [
          category_id || null,
          ews_status === true || ews_status === 'true' || ews_status === 1,
          pwbd_status === true || pwbd_status === 'true' || pwbd_status === 1,
          type_of_disability || null,
          disability_percentage || null,
          udid_number || null,
          minority_status || null,
          ex_serviceman_defence_quota === true || ex_serviceman_defence_quota === 'true' || ex_serviceman_defence_quota === 1,
          kashmiri_migrant_regional_quota === true || kashmiri_migrant_regional_quota === 'true' || kashmiri_migrant_regional_quota === 1,
          userIdNum
        ]
      );
      return result.rows[0];
    } else {
      // Create new record
      const result = await db.query(
        `INSERT INTO category_and_reservation 
         (user_id, category_id, ews_status, pwbd_status, type_of_disability, 
          disability_percentage, udid_number, minority_status, 
          ex_serviceman_defence_quota, kashmiri_migrant_regional_quota)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING *`,
        [
          userIdNum,
          category_id || null,
          ews_status === true || ews_status === 'true' || ews_status === 1,
          pwbd_status === true || pwbd_status === 'true' || pwbd_status === 1,
          type_of_disability || null,
          disability_percentage || null,
          udid_number || null,
          minority_status || null,
          ex_serviceman_defence_quota === true || ex_serviceman_defence_quota === 'true' || ex_serviceman_defence_quota === 1,
          kashmiri_migrant_regional_quota === true || kashmiri_migrant_regional_quota === 'true' || kashmiri_migrant_regional_quota === 1
        ]
      );
      return result.rows[0];
    }
  }

  /**
   * Delete category and reservation by user ID
   */
  static async deleteByUserId(userId) {
    const userIdNum = typeof userId === 'string' ? parseInt(userId, 10) : userId;
    if (isNaN(userIdNum)) {
      throw new Error('Invalid user ID');
    }

    const result = await db.query(
      'DELETE FROM category_and_reservation WHERE user_id = $1 RETURNING *',
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
      'DELETE FROM category_and_reservation WHERE id = $1 RETURNING *',
      [idNum]
    );
    return result.rows[0] || null;
  }
}

module.exports = CategoryAndReservation;

