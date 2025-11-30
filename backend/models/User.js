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
    try {
      // Try to insert with new columns first
      const result = await db.query(
        `INSERT INTO users (email, auth_provider, email_verified) 
         VALUES ($1, 'email', false) 
         RETURNING *`,
        [email]
      );
      return result.rows[0];
    } catch (error) {
      // If columns don't exist, fall back to basic insert
      if (error.code === '42703') { // column does not exist
        console.log('⚠️  New user columns not found, using fallback insert');
        const result = await db.query(
          `INSERT INTO users (email) 
           VALUES ($1) 
           RETURNING *`,
          [email]
        );
        // Add default values for missing columns
        return {
          ...result.rows[0],
          email_verified: false,
          auth_provider: 'email'
        };
      }
      throw error;
    }
  }

  static async markEmailAsVerified(id) {
    try {
      const result = await db.query(
        'UPDATE users SET email_verified = true WHERE id = $1 RETURNING *',
        [id]
      );
      return result.rows[0];
    } catch (error) {
      // If email_verified column doesn't exist, just return the user without updating
      if (error.code === '42703') { // column does not exist
        console.log('⚠️  email_verified column not found, skipping update');
        return await this.findById(id);
      }
      throw error;
    }
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

  static async update(id, data) {
    const { email, name, email_verified, is_active } = data;
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (email !== undefined) {
      updates.push(`email = $${paramCount++}`);
      values.push(email);
    }
    if (name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(name);
    }
    if (email_verified !== undefined) {
      updates.push(`email_verified = $${paramCount++}`);
      values.push(email_verified);
    }
    if (is_active !== undefined) {
      updates.push(`is_active = $${paramCount++}`);
      values.push(is_active);
    }

    if (updates.length === 0) {
      return await this.findById(id);
    }

    values.push(id);
    const query = `UPDATE users SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${paramCount} RETURNING *`;
    
    try {
      const result = await db.query(query, values);
      return result.rows[0];
    } catch (error) {
      // If columns don't exist, filter them out and retry
      if (error.code === '42703') { // column does not exist
        console.log('⚠️  Some columns not found, retrying with available columns');
        const safeUpdates = [];
        const safeValues = [];
        let safeParamCount = 1;

        // Only include columns that likely exist (email, is_active)
        if (email !== undefined) {
          safeUpdates.push(`email = $${safeParamCount++}`);
          safeValues.push(email);
        }
        if (is_active !== undefined) {
          safeUpdates.push(`is_active = $${safeParamCount++}`);
          safeValues.push(is_active);
        }

        if (safeUpdates.length === 0) {
          return await this.findById(id);
        }

        safeValues.push(id);
        const safeQuery = `UPDATE users SET ${safeUpdates.join(', ')} WHERE id = $${safeParamCount} RETURNING *`;
        const result = await db.query(safeQuery, safeValues);
        return result.rows[0];
      }
      throw error;
    }
  }

  static async delete(id) {
    const result = await db.query('DELETE FROM users WHERE id = $1 RETURNING *', [id]);
    return result.rows[0];
  }

  static async createWithDetails(email, name = null) {
    try {
      // Try to insert with new columns first
      const result = await db.query(
        `INSERT INTO users (email, name, auth_provider, email_verified) 
         VALUES ($1, $2, 'email', false) 
         RETURNING *`,
        [email, name]
      );
      return result.rows[0];
    } catch (error) {
      // If columns don't exist, fall back to basic insert
      if (error.code === '42703') { // column does not exist
        console.log('⚠️  New user columns not found, using fallback insert');
        const result = await db.query(
          `INSERT INTO users (email, name) 
           VALUES ($1, $2) 
           RETURNING *`,
          [email, name]
        );
        // Add default values for missing columns
        return {
          ...result.rows[0],
          email_verified: false,
          auth_provider: 'email'
        };
      }
      throw error;
    }
  }

  // Get all users for admin panel
  static async findAll() {
    try {
      // Try to select with new columns first
      const result = await db.query(
        `SELECT id, email, name, email_verified, auth_provider, created_at, last_login, is_active 
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
          email_verified: false,
          auth_provider: 'email'
        }));
      }
      throw error;
    }
  }
}

module.exports = User;
