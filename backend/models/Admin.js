const db = require('../config/database');
const bcrypt = require('bcryptjs');

class Admin {
  static async findByEmail(email) {
    const result = await db.query(
      'SELECT * FROM admin_users WHERE email = $1',
      [email]
    );
    return result.rows[0] || null;
  }

  static async findById(id) {
    const result = await db.query(
      'SELECT id, email, type, is_active, created_at, last_login FROM admin_users WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  static async create(email, password, type = 'user', createdBy = null) {
    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    const result = await db.query(
      `INSERT INTO admin_users (email, password_hash, type, created_by) 
       VALUES ($1, $2, $3, $4) 
       RETURNING id, email, type, is_active, created_at`,
      [email, passwordHash, type, createdBy]
    );
    return result.rows[0];
  }

  static async updateLastLogin(id) {
    const result = await db.query(
      'UPDATE admin_users SET last_login = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *',
      [id]
    );
    return result.rows[0];
  }

  static async updateActiveStatus(id, isActive) {
    const result = await db.query(
      'UPDATE admin_users SET is_active = $1 WHERE id = $2 RETURNING id, email, type, is_active',
      [isActive, id]
    );
    return result.rows[0];
  }

  static async updateType(id, type) {
    // Prevent changing super_admin type
    const admin = await this.findById(id);
    if (admin && admin.type === 'super_admin') {
      throw new Error('Cannot change super_admin type');
    }

    const result = await db.query(
      'UPDATE admin_users SET type = $1 WHERE id = $2 RETURNING id, email, type, is_active',
      [type, id]
    );
    return result.rows[0];
  }

  static async findAll() {
    const result = await db.query(
      `SELECT id, email, type, is_active, created_at, last_login, created_by
       FROM admin_users 
       ORDER BY created_at DESC`
    );
    return result.rows;
  }

  static async delete(id) {
    // Check if trying to delete super_admin
    const admin = await this.findById(id);
    if (admin && admin.type === 'super_admin') {
      throw new Error('Cannot delete super_admin');
    }

    const result = await db.query(
      'DELETE FROM admin_users WHERE id = $1 RETURNING id',
      [id]
    );
    return result.rows[0];
  }

  static async verifyPassword(admin, password) {
    // Get full admin record with password_hash
    const result = await db.query(
      'SELECT password_hash FROM admin_users WHERE id = $1',
      [admin.id]
    );
    if (!result.rows[0]) return false;

    return await bcrypt.compare(password, result.rows[0].password_hash);
  }
}

module.exports = Admin;

