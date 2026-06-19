const { pool } = require('../../config/database');

class UserCredit {
  static async ensureRowForUpdate(client, userId) {
    await client.query(
      `INSERT INTO user_credits (user_id, balance)
       VALUES ($1, 0)
       ON CONFLICT (user_id) DO NOTHING`,
      [userId]
    );

    const result = await client.query(
      `SELECT user_id, balance, created_at, updated_at
       FROM user_credits
       WHERE user_id = $1
       FOR UPDATE`,
      [userId]
    );

    return result.rows[0];
  }

  static async getBalance(userId) {
    const result = await pool.query(
      `SELECT user_id, balance, created_at, updated_at
       FROM user_credits
       WHERE user_id = $1`,
      [userId]
    );

    if (result.rows[0]) {
      return {
        ...result.rows[0],
        balance: Number(result.rows[0].balance),
      };
    }

    return {
      user_id: userId,
      balance: 0,
      created_at: null,
      updated_at: null,
    };
  }

  static async updateBalance(client, userId, nextBalance) {
    const result = await client.query(
      `UPDATE user_credits
       SET balance = $2, updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $1
       RETURNING user_id, balance, updated_at`,
      [userId, nextBalance]
    );
    return result.rows[0];
  }
}

module.exports = UserCredit;
