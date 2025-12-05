const db = require('../../config/database');

class Otp {
  static async create(userId, email, code, expiresAt) {
    const result = await db.query(
      `INSERT INTO otps (user_id, email, code, expires_at) 
       VALUES ($1, $2, $3, $4) 
       RETURNING *`,
      [userId, email, code, expiresAt]
    );
    return result.rows[0];
  }

  static async findByCodeAndEmail(code, email) {
    const result = await db.query(
      `SELECT * FROM otps 
       WHERE code = $1 AND email = $2 AND used = FALSE AND expires_at > CURRENT_TIMESTAMP
       ORDER BY created_at DESC
       LIMIT 1`,
      [code, email]
    );
    return result.rows[0] || null;
  }

  static async markAsUsed(id) {
    const result = await db.query(
      'UPDATE otps SET used = TRUE WHERE id = $1 RETURNING *',
      [id]
    );
    return result.rows[0];
  }

  static async invalidateUserOtps(userId, email) {
    await db.query(
      'UPDATE otps SET used = TRUE WHERE user_id = $1 AND email = $2 AND used = FALSE',
      [userId, email]
    );
  }

  static async getRecentOtpCount(email, minutes = 10) {
    const result = await db.query(
      `SELECT COUNT(*) as count FROM otps 
       WHERE email = $1 AND created_at > CURRENT_TIMESTAMP - INTERVAL '${minutes} minutes'`,
      [email]
    );
    return parseInt(result.rows[0].count);
  }
}

module.exports = Otp;

