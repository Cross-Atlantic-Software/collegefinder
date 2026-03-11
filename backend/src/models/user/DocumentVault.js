const db = require('../../config/database');

class DocumentVault {
  /**
   * Find document vault by user ID
   */
  static async findByUserId(userId) {
    const userIdNum = typeof userId === 'string' ? parseInt(userId, 10) : userId;
    if (isNaN(userIdNum)) {
      return null;
    }

    const result = await db.query(
      'SELECT * FROM user_document_vault WHERE user_id = $1',
      [userIdNum]
    );
    return result.rows[0] || null;
  }

  /**
   * Create or update user document vault
   */
  static async upsert(userId, data) {
    const userIdNum = typeof userId === 'string' ? parseInt(userId, 10) : userId;
    if (isNaN(userIdNum)) {
      throw new Error('Invalid user ID');
    }

    const {
      passport_size_photograph,
      signature_image,
      matric_marksheet,
      matric_certificate,
      postmatric_marksheet,
      valid_photo_id_proof,
      sc_certificate,
      st_certificate,
      obc_ncl_certificate,
      ews_certificate,
      pwbd_disability_certificate,
      udid_card,
      domicile_certificate,
      citizenship_certificate,
      migration_certificate
    } = data;

    // Check if record exists
    const existing = await this.findByUserId(userIdNum);

    if (existing) {
      // Update existing record
      const result = await db.query(
        `UPDATE user_document_vault SET
          passport_size_photograph = COALESCE($1, passport_size_photograph),
          signature_image = COALESCE($2, signature_image),
          matric_marksheet = COALESCE($3, matric_marksheet),
          matric_certificate = COALESCE($4, matric_certificate),
          postmatric_marksheet = COALESCE($5, postmatric_marksheet),
          valid_photo_id_proof = COALESCE($6, valid_photo_id_proof),
          sc_certificate = COALESCE($7, sc_certificate),
          st_certificate = COALESCE($8, st_certificate),
          obc_ncl_certificate = COALESCE($9, obc_ncl_certificate),
          ews_certificate = COALESCE($10, ews_certificate),
          pwbd_disability_certificate = COALESCE($11, pwbd_disability_certificate),
          udid_card = COALESCE($12, udid_card),
          domicile_certificate = COALESCE($13, domicile_certificate),
          citizenship_certificate = COALESCE($14, citizenship_certificate),
          migration_certificate = COALESCE($15, migration_certificate),
          updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $16
        RETURNING *`,
        [
          passport_size_photograph,
          signature_image,
          matric_marksheet,
          matric_certificate,
          postmatric_marksheet,
          valid_photo_id_proof,
          sc_certificate,
          st_certificate,
          obc_ncl_certificate,
          ews_certificate,
          pwbd_disability_certificate,
          udid_card,
          domicile_certificate,
          citizenship_certificate,
          migration_certificate,
          userIdNum
        ]
      );
      return result.rows[0];
    } else {
      // Create new record
      const result = await db.query(
        `INSERT INTO user_document_vault (
          user_id,
          passport_size_photograph,
          signature_image,
          matric_marksheet,
          matric_certificate,
          postmatric_marksheet,
          valid_photo_id_proof,
          sc_certificate,
          st_certificate,
          obc_ncl_certificate,
          ews_certificate,
          pwbd_disability_certificate,
          udid_card,
          domicile_certificate,
          citizenship_certificate,
          migration_certificate
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        RETURNING *`,
        [
          userIdNum,
          passport_size_photograph || null,
          signature_image || null,
          matric_marksheet || null,
          matric_certificate || null,
          postmatric_marksheet || null,
          valid_photo_id_proof || null,
          sc_certificate || null,
          st_certificate || null,
          obc_ncl_certificate || null,
          ews_certificate || null,
          pwbd_disability_certificate || null,
          udid_card || null,
          domicile_certificate || null,
          citizenship_certificate || null,
          migration_certificate || null
        ]
      );
      return result.rows[0];
    }
  }

  /**
   * Delete a specific document field
   */
  static async deleteDocument(userId, fieldName) {
    const userIdNum = typeof userId === 'string' ? parseInt(userId, 10) : userId;
    if (isNaN(userIdNum)) {
      throw new Error('Invalid user ID');
    }

    const allowedFields = [
      'passport_size_photograph',
      'signature_image',
      'matric_marksheet',
      'matric_certificate',
      'postmatric_marksheet',
      'valid_photo_id_proof',
      'sc_certificate',
      'st_certificate',
      'obc_ncl_certificate',
      'ews_certificate',
      'pwbd_disability_certificate',
      'udid_card',
      'domicile_certificate',
      'citizenship_certificate',
      'migration_certificate'
    ];

    if (!allowedFields.includes(fieldName)) {
      throw new Error('Invalid field name');
    }

    const result = await db.query(
      `UPDATE user_document_vault 
       SET ${fieldName} = NULL, updated_at = CURRENT_TIMESTAMP 
       WHERE user_id = $1 
       RETURNING *`,
      [userIdNum]
    );

    return result.rows[0];
  }
}

module.exports = DocumentVault;

