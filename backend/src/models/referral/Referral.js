const db = require('../../config/database');
const {
  generateStudentCode,
  generateInstitutionCode,
  generateUniqueCode,
} = require('../../utils/referral/referralCodeGenerator');

class Referral {
  /**
   * Check whether a referral code is globally unique across users AND institutes.
   */
  static async isCodeUnique(code) {
    const result = await db.query(
      `SELECT 1 FROM (
         SELECT active_code AS referral_code FROM referral_codes WHERE active_code = $1
         UNION ALL
         SELECT referral_code FROM users WHERE referral_code = $1
         UNION ALL
         SELECT referral_code FROM institutes WHERE referral_code = $1
       ) t LIMIT 1`,
      [code]
    );
    return result.rows.length === 0;
  }

  // ── User helpers ─────────────────────────────────────────────────────

  static async getUserCode(userId) {
    const result = await db.query(
      `SELECT active_code
       FROM referral_codes
       WHERE user_id = $1 AND is_active = TRUE
       ORDER BY updated_at DESC
       LIMIT 1`,
      [userId]
    );
    return result.rows[0]?.active_code || null;
  }

  static async saveUserCode(userId, code) {
    const result = await db.query(
      `INSERT INTO referral_codes (user_id, active_code, is_active, deactivated_at, deactivated_by_admin_id)
       VALUES ($1, $2, TRUE, NULL, NULL)
       ON CONFLICT (user_id)
       DO UPDATE SET
         active_code = EXCLUDED.active_code,
         is_active = TRUE,
         deactivated_at = NULL,
         deactivated_by_admin_id = NULL,
         updated_at = CURRENT_TIMESTAMP
       RETURNING active_code`,
      [userId, code]
    );

    // Keep legacy column in sync for older screens/queries.
    await db.query(
      'UPDATE users SET referral_code = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [code, userId]
    );
    return result.rows[0]?.active_code || null;
  }

  /**
   * Generate a unique student code and persist it.
   * Returns the saved code string.
   */
  static async generateAndSaveUserCode(userId) {
    const existing = await this.getUserCode(userId);
    if (existing) return existing;

    const code = await generateUniqueCode(
      generateStudentCode,
      (c) => this.isCodeUnique(c)
    );
    return this.saveUserCode(userId, code);
  }

  // ── Institute helpers ────────────────────────────────────────────────

  static async getInstituteCode(instituteId) {
    const result = await db.query(
      'SELECT referral_code FROM institutes WHERE id = $1',
      [instituteId]
    );
    return result.rows[0]?.referral_code || null;
  }

  static async saveInstituteCode(instituteId, code) {
    const result = await db.query(
      'UPDATE institutes SET referral_code = $1 WHERE id = $2 RETURNING referral_code',
      [code, instituteId]
    );
    return result.rows[0]?.referral_code || null;
  }

  /**
   * Generate a unique institution code (name-prefixed) and persist it.
   */
  static async generateAndSaveInstituteCode(instituteId, instituteName) {
    const existing = await this.getInstituteCode(instituteId);
    if (existing) return existing;

    const code = await generateUniqueCode(
      () => generateInstitutionCode(instituteName),
      (c) => this.isCodeUnique(c)
    );
    return this.saveInstituteCode(instituteId, code);
  }

  // ── Referral attribution ─────────────────────────────────────────────

  /**
   * Set or clear the "referred by" code on the user (code they received from someone else).
   * @param {number} userId
   * @param {string|null|undefined} email - used for referral_uses; optional when clearing
   * @param {*} rawInput - undefined = skip; null or '' = clear column
   * @param {{ silent?: boolean }} options - if silent, invalid/own code does not error (signup/OAuth)
   * @returns {Promise<{ skipped?: boolean, ok?: boolean, cleared?: boolean, code?: string, message?: string, noop?: boolean }>}
   */
  static async updateReferredByCode(userId, email, rawInput, options = {}) {
    const { silent = false } = options;

    if (rawInput === undefined) {
      return { skipped: true };
    }

    if (rawInput === null) {
      await db.query(
        'UPDATE users SET referred_by_code = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
        [userId]
      );
      return { ok: true, cleared: true };
    }

    const str = String(rawInput).trim();
    if (!str) {
      await db.query(
        'UPDATE users SET referred_by_code = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
        [userId]
      );
      return { ok: true, cleared: true };
    }

    const code = str.toUpperCase();

    const selfCheck = await db.query(
      'SELECT active_code FROM referral_codes WHERE user_id = $1 AND is_active = TRUE LIMIT 1',
      [userId]
    );
    if (selfCheck.rows[0]?.active_code === code) {
      if (silent) return { ok: true, noop: true };
      return { ok: false, message: 'You cannot use your own referral code.' };
    }

    const codeExists = await db.query(
      `SELECT 1 FROM referral_codes
       WHERE active_code = $1 AND is_active = TRUE
       LIMIT 1`,
      [code]
    );
    if (codeExists.rows.length === 0) {
      if (silent) return { ok: true, noop: true };
      return { ok: false, message: 'Referral code not found. Check the code and try again.' };
    }

    await db.query(
      'UPDATE users SET referred_by_code = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [code, userId]
    );
    if (email) {
      try {
        await this.recordUse(code, userId, email);
      } catch (e) {
        console.error('Referral.recordUse after referred_by_code', e);
      }
    }
    return { ok: true, code };
  }

  /**
   * Record that a user signed up / logged in using a referral code.
   * No-ops if the code doesn't exist or the same pair already exists.
   */
  static async recordUse(code, userId, email) {
    if (!code || !userId) return null;

    // Verify the referral code actually exists (belongs to some user or institute)
    const codeExists = await db.query(
      `SELECT user_id
       FROM referral_codes
       WHERE active_code = $1 AND is_active = TRUE
       LIMIT 1`,
      [code]
    );
    if (codeExists.rows.length === 0) return null;

    // Don't let a user "use" their own code
    if (codeExists.rows[0]?.user_id === userId) return null;

    const result = await db.query(
      `INSERT INTO referral_uses (referral_code, used_by_user_id, used_by_email)
       VALUES ($1, $2, $3)
       ON CONFLICT (referral_code, used_by_user_id) DO NOTHING
       RETURNING *`,
      [code, userId, email]
    );
    return result.rows[0] || null;
  }

  /**
   * Get all uses of a specific referral code.
   * Returns array of { used_by_email, used_at } ordered newest first.
   * @param {string} code
   */
  static async getUsesByCode(code) {
    const result = await db.query(
      `SELECT used_by_email, used_at
       FROM referral_uses
       WHERE referral_code = $1
       ORDER BY used_at DESC`,
      [code]
    );
    return result.rows;
  }

  /**
   * Get all uses of the referral code belonging to a user.
   * @param {number} userId
   */
  static async getUsesForUser(userId) {
    const result = await db.query(
      `SELECT ru.used_by_email, ru.used_at
       FROM referral_uses ru
       JOIN referral_codes rc ON rc.active_code = ru.referral_code
       WHERE rc.user_id = $1
       ORDER BY ru.used_at DESC`,
      [userId]
    );
    return result.rows;
  }

  // ── Admin helpers (active referral codes) ─────────────────────────────

  static async getAllUserCodesForAdmin() {
    const result = await db.query(
      `SELECT rc.id,
              rc.user_id,
              rc.active_code,
              rc.is_active,
              rc.created_at,
              rc.updated_at,
              rc.deactivated_at,
              rc.deactivated_by_admin_id,
              u.email AS user_email,
              u.name AS user_name
       FROM referral_codes rc
       JOIN users u ON u.id = rc.user_id
       ORDER BY rc.updated_at DESC, rc.id DESC`
    );
    return result.rows;
  }

  static async deactivateUserCodeByRowId(rowId, adminId = null) {
    const result = await db.query(
      `UPDATE referral_codes
       SET is_active = FALSE,
           deactivated_at = CURRENT_TIMESTAMP,
           deactivated_by_admin_id = $2,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [rowId, adminId]
    );
    const row = result.rows[0] || null;
    if (row) {
      await db.query(
        'UPDATE users SET referral_code = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
        [row.user_id]
      );
    }
    return row;
  }

  static async deleteUserCodeByRowId(rowId) {
    const result = await db.query(
      'DELETE FROM referral_codes WHERE id = $1 RETURNING *',
      [rowId]
    );
    const row = result.rows[0] || null;
    if (row) {
      await db.query(
        'UPDATE users SET referral_code = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
        [row.user_id]
      );
    }
    return row;
  }
}

module.exports = Referral;
