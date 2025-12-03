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
    // Ensure id is a number
    const userId = typeof id === 'string' ? parseInt(id, 10) : id;
    if (isNaN(userId)) {
      console.error('❌ Invalid userId passed to findById:', id);
      return null;
    }
    console.log('🔍 User.findById - Looking for ID:', userId, 'Type:', typeof userId);
    const result = await db.query(
      'SELECT * FROM users WHERE id = $1',
      [userId]
    );
    const user = result.rows[0] || null;
    if (user) {
      console.log('✅ User found - ID:', user.id, 'Email:', user.email);
    } else {
      console.log('❌ User not found - ID:', userId);
    }
    return user;
  }

  static async create(email) {
    const result = await db.query(
      `INSERT INTO users (email, auth_provider, email_verified) 
       VALUES ($1, 'email', false) 
       RETURNING *`,
      [email]
    );
    return result.rows[0];
  }

  static async markEmailAsVerified(id) {
    const result = await db.query(
      'UPDATE users SET email_verified = true WHERE id = $1 RETURNING *',
      [id]
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

  static async updateName(id, name) {
    const result = await db.query(
      'UPDATE users SET name = $1 WHERE id = $2 RETURNING *',
      [name, id]
    );
    return result.rows[0];
  }

  // Get all users for admin panel
  static async findAll() {
    try {
      // Try to select with new columns first
      const result = await db.query(
        `SELECT 
           id, 
           email, 
           name, 
           first_name, 
           last_name, 
           date_of_birth, 
           gender, 
           phone_number, 
           location, 
           email_verified, 
           auth_provider, 
           created_at, 
           last_login, 
           is_active 
         FROM users 
         ORDER BY created_at DESC`
      );
      return result.rows;
    } catch (error) {
      // If columns don't exist, fall back to basic query and add defaults
      if (error.code === '42703') { // column does not exist
        console.log('⚠️  New user columns not found, using fallback query');
        const result = await db.query(
          `SELECT id, email, created_at, last_login, is_active 
           FROM users 
           ORDER BY created_at DESC`
        );
        // Add default values for missing columns
        return result.rows.map(user => ({
          ...user,
          name: null,
          first_name: null,
          last_name: null,
          date_of_birth: null,
          gender: null,
          phone_number: null,
          location: null,
          email_verified: false,
          auth_provider: 'email'
        }));
      }
      throw error;
    }
  }
}

module.exports = User;
