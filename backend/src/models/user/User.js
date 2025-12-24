const db = require('../../config/database');

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
      console.error('Invalid userId passed to findById:', id);
      return null;
    }
    const result = await db.query(
      'SELECT * FROM users WHERE id = $1',
      [userId]
    );
    return result.rows[0] || null;
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

  /**
   * Check if user has completed all onboarding steps
   * Required steps:
   * 1. Name (from users table)
   * 2. Stream (from user_academics table - stream_id)
   * 3. Interests (from user_career_goals table - interests array)
   */
  static async checkOnboardingCompletion(userId) {
    const userIdNum = typeof userId === 'string' ? parseInt(userId, 10) : userId;
    if (isNaN(userIdNum)) {
      console.log('❌ checkOnboardingCompletion - Invalid userId:', userId);
      return false;
    }

    try {
      console.log('🔍 checkOnboardingCompletion - Checking user ID:', userIdNum);
      
      // Check if user has name
      const user = await User.findById(userIdNum);
      console.log('🔍 checkOnboardingCompletion - User found:', !!user);
      if (!user || !user.name || user.name.trim() === '') {
        console.log('❌ checkOnboardingCompletion - Missing name. User:', user ? { id: user.id, name: user.name } : 'null');
        return false;
      }
      console.log('✅ checkOnboardingCompletion - Name check passed:', user.name);

      // Check if user has stream
      const academicsResult = await db.query(
        'SELECT stream_id FROM user_academics WHERE user_id = $1 AND stream_id IS NOT NULL',
        [userIdNum]
      );
      console.log('🔍 checkOnboardingCompletion - Academics result:', academicsResult.rows);
      if (!academicsResult.rows[0] || !academicsResult.rows[0].stream_id) {
        console.log('❌ checkOnboardingCompletion - Missing stream_id');
        return false;
      }
      console.log('✅ checkOnboardingCompletion - Stream check passed:', academicsResult.rows[0].stream_id);

      // Check if user has interests
      const careerGoalsResult = await db.query(
        'SELECT interests FROM user_career_goals WHERE user_id = $1 AND interests IS NOT NULL AND array_length(interests, 1) > 0',
        [userIdNum]
      );
      console.log('🔍 checkOnboardingCompletion - Career goals result:', careerGoalsResult.rows);
      if (!careerGoalsResult.rows[0] || !careerGoalsResult.rows[0].interests || 
          careerGoalsResult.rows[0].interests.length === 0) {
        console.log('❌ checkOnboardingCompletion - Missing interests');
        return false;
      }
      console.log('✅ checkOnboardingCompletion - Interests check passed:', careerGoalsResult.rows[0].interests);

      console.log('✅ checkOnboardingCompletion - ALL CHECKS PASSED - User has completed onboarding');
      return true;
    } catch (error) {
      console.error('❌ Error checking onboarding completion:', error);
      return false;
    }
  }

  /**
   * Mark onboarding as completed
   */
  static async markOnboardingCompleted(userId) {
    const userIdNum = typeof userId === 'string' ? parseInt(userId, 10) : userId;
    if (isNaN(userIdNum)) {
      throw new Error('Invalid user ID');
    }

    const result = await db.query(
      'UPDATE users SET onboarding_completed = TRUE WHERE id = $1 RETURNING *',
      [userIdNum]
    );
    return result.rows[0];
  }

  /**
   * Verify and update onboarding status based on actual data
   * This ensures onboarding_completed flag matches the actual completion state
   */
  static async verifyAndUpdateOnboardingStatus(userId) {
    const userIdNum = typeof userId === 'string' ? parseInt(userId, 10) : userId;
    if (isNaN(userIdNum)) {
      return false;
    }

    const isComplete = await User.checkOnboardingCompletion(userIdNum);
    const currentUser = await User.findById(userIdNum);
    
    // If status doesn't match, update it
    const currentStatus = currentUser?.onboarding_completed === true || 
                         currentUser?.onboarding_completed === 't' || 
                         currentUser?.onboarding_completed === 1;
    
    if (isComplete !== currentStatus) {
      if (isComplete) {
        await User.markOnboardingCompleted(userIdNum);
      } else {
        await db.query(
          'UPDATE users SET onboarding_completed = FALSE WHERE id = $1',
          [userIdNum]
        );
      }
    }
    
    return isComplete;
  }

  static async findByGoogleId(googleId) {
    const result = await db.query(
      'SELECT * FROM users WHERE google_id = $1',
      [googleId]
    );
    return result.rows[0] || null;
  }

  static async createWithGoogle({ email, name, firstName, lastName, googleId, profilePhoto, emailVerified }) {
    // New Google users should NOT have onboarding_completed set to true
    // They need to go through onboarding even if they have a name from Google
    const result = await db.query(
      `INSERT INTO users (email, name, first_name, last_name, google_id, profile_photo, auth_provider, email_verified, onboarding_completed) 
       VALUES ($1, $2, $3, $4, $5, $6, 'google', $7, FALSE) 
       RETURNING *`,
      [email, name || null, firstName || null, lastName || null, googleId, profilePhoto || null, emailVerified || true]
    );
    return result.rows[0];
  }

  static async findByFacebookId(facebookId) {
    const result = await db.query(
      'SELECT * FROM users WHERE facebook_id = $1',
      [facebookId]
    );
    return result.rows[0] || null;
  }

  static async createWithFacebook({ email, name, firstName, lastName, facebookId, profilePhoto }) {
    // email_verified is true only if Facebook provided the email
    const emailVerified = email ? true : false;
    const result = await db.query(
      `INSERT INTO users (email, name, first_name, last_name, facebook_id, profile_photo, auth_provider, email_verified, onboarding_completed)
       VALUES ($1, $2, $3, $4, $5, $6, 'facebook', $7, FALSE)
       RETURNING *`,
      [email || null, name || null, firstName || null, lastName || null, facebookId, profilePhoto || null, emailVerified]
    );
    return result.rows[0];
  }

  static async linkFacebookAccount(userId, facebookId) {
    // Only set email_verified if user already has an email
    const result = await db.query(
      `UPDATE users SET facebook_id = $1, auth_provider = 'facebook', 
       email_verified = CASE WHEN email IS NOT NULL THEN true ELSE false END 
       WHERE id = $2 RETURNING *`,
      [facebookId, userId]
    );
    return result.rows[0];
  }

  static async updateFromFacebook(userId, { firstName, lastName, name, profilePhoto }) {
    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (firstName !== undefined) {
      updates.push(`first_name = $${paramIndex++}`);
      values.push(firstName);
    }
    if (lastName !== undefined) {
      updates.push(`last_name = $${paramIndex++}`);
      values.push(lastName);
    }
    if (name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      values.push(name);
    }
    if (profilePhoto !== undefined) {
      updates.push(`profile_photo = $${paramIndex++}`);
      values.push(profilePhoto);
    }

    if (updates.length === 0) {
      return await User.findById(userId);
    }

    values.push(userId);
    const query = `UPDATE users SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${paramIndex} RETURNING *`;
    const result = await db.query(query, values);
    return result.rows[0];
  }

  static async linkGoogleAccount(userId, googleId) {
    const result = await db.query(
      `UPDATE users SET google_id = $1, auth_provider = 'google', email_verified = true WHERE id = $2 RETURNING *`,
      [googleId, userId]
    );
    return result.rows[0];
  }

  static async updateFromGoogle(userId, { firstName, lastName, name, profilePhoto, emailVerified }) {
    // Build update query dynamically based on what's provided
    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (firstName !== undefined) {
      updates.push(`first_name = $${paramIndex++}`);
      values.push(firstName);
    }
    if (lastName !== undefined) {
      updates.push(`last_name = $${paramIndex++}`);
      values.push(lastName);
    }
    if (name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      values.push(name);
    }
    if (profilePhoto !== undefined) {
      updates.push(`profile_photo = $${paramIndex++}`);
      values.push(profilePhoto);
    }
    if (emailVerified !== undefined) {
      updates.push(`email_verified = $${paramIndex++}`);
      values.push(emailVerified);
    }

    if (updates.length === 0) {
      // No updates to make
      return await User.findById(userId);
    }

    values.push(userId);
    const query = `UPDATE users SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${paramIndex} RETURNING *`;
    
    const result = await db.query(query, values);
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
           state, 
           district,
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
          state: null,
          district: null,
          email_verified: false,
          auth_provider: 'email'
        }));
      }
      throw error;
    }
  }
}

module.exports = User;
