const db = require('../../config/database');

class UserAddress {
  /**
   * Find address by user ID
   */
  static async findByUserId(userId) {
    const userIdNum = typeof userId === 'string' ? parseInt(userId, 10) : userId;
    if (isNaN(userIdNum)) {
      return null;
    }

    const result = await db.query(
      'SELECT * FROM user_address WHERE user_id = $1',
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
      'SELECT * FROM user_address WHERE id = $1',
      [idNum]
    );
    return result.rows[0] || null;
  }

  /**
   * Create or update address (upsert)
   */
  static async upsert(userId, data) {
    const userIdNum = typeof userId === 'string' ? parseInt(userId, 10) : userId;
    if (isNaN(userIdNum)) {
      throw new Error('Invalid user ID');
    }

    const {
      correspondence_address_line1,
      correspondence_address_line2,
      city_town_village,
      district,
      state,
      country,
      pincode,
      permanent_address_same_as_correspondence,
      permanent_address
    } = data;

    // Check if record exists
    const existing = await UserAddress.findByUserId(userIdNum);

    if (existing) {
      // Update existing record
      const result = await db.query(
        `UPDATE user_address 
         SET correspondence_address_line1 = $1,
             correspondence_address_line2 = $2,
             city_town_village = $3,
             district = $4,
             state = $5,
             country = $6,
             pincode = $7,
             permanent_address_same_as_correspondence = $8,
             permanent_address = $9,
             updated_at = CURRENT_TIMESTAMP
         WHERE user_id = $10
         RETURNING *`,
        [
          correspondence_address_line1 || null,
          correspondence_address_line2 || null,
          city_town_village || null,
          district || null,
          state || null,
          country || 'India',
          pincode || null,
          permanent_address_same_as_correspondence === true || permanent_address_same_as_correspondence === 'true' || permanent_address_same_as_correspondence === 1,
          permanent_address || null,
          userIdNum
        ]
      );
      return result.rows[0];
    } else {
      // Create new record
      const result = await db.query(
        `INSERT INTO user_address 
         (user_id, correspondence_address_line1, correspondence_address_line2, city_town_village, 
          district, state, country, pincode, permanent_address_same_as_correspondence, permanent_address)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING *`,
        [
          userIdNum,
          correspondence_address_line1 || null,
          correspondence_address_line2 || null,
          city_town_village || null,
          district || null,
          state || null,
          country || 'India',
          pincode || null,
          permanent_address_same_as_correspondence === true || permanent_address_same_as_correspondence === 'true' || permanent_address_same_as_correspondence === 1,
          permanent_address || null
        ]
      );
      return result.rows[0];
    }
  }

  /**
   * Delete address by user ID
   */
  static async deleteByUserId(userId) {
    const userIdNum = typeof userId === 'string' ? parseInt(userId, 10) : userId;
    if (isNaN(userIdNum)) {
      throw new Error('Invalid user ID');
    }

    const result = await db.query(
      'DELETE FROM user_address WHERE user_id = $1 RETURNING *',
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
      'DELETE FROM user_address WHERE id = $1 RETURNING *',
      [idNum]
    );
    return result.rows[0] || null;
  }
}

module.exports = UserAddress;

