const db = require('../config/database');

class User {
  static async findByEmail(email) {
    const result = await db.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    return result.rows[0] || null;
  }

  static async findById(id) {
    const result = await db.query(
      'SELECT * FROM users WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  static async create(email) {
    const result = await db.query(
      'INSERT INTO users (email) VALUES ($1) RETURNING *',
      [email]
    );
    return result.rows[0];
  }

  static async updateLastLogin(id) {
    const result = await db.query(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *',
      [id]
    );
    return result.rows[0];
  }

  static async updateActiveStatus(id, isActive) {
    const result = await db.query(
      'UPDATE users SET is_active = $1 WHERE id = $2 RETURNING *',
      [isActive, id]
    );
    return result.rows[0];
  }
}

module.exports = User;

