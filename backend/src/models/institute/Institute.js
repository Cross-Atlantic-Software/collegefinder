const db = require('../../config/database');

class Institute {
  static async findAll() {
    const result = await db.query(
      'SELECT * FROM institutes ORDER BY institute_name ASC'
    );
    return result.rows;
  }

  static async findById(id) {
    const result = await db.query(
      'SELECT * FROM institutes WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  static async findByName(name) {
    const result = await db.query(
      'SELECT * FROM institutes WHERE LOWER(institute_name) = LOWER($1)',
      [name]
    );
    return result.rows[0] || null;
  }

  /** Match dashboard route slug (`slugifyInstituteName`). */
  static async findBySlug(slug) {
    const s = slug != null ? String(slug).trim().toLowerCase() : '';
    if (!s) return null;
    const result = await db.query(
      `SELECT * FROM institutes
       WHERE regexp_replace(
         regexp_replace(lower(trim(institute_name)), '[^a-z0-9]+', '-', 'g'),
         '(^-+|-+$)', '', 'g'
       ) = $1
       LIMIT 1`,
      [s]
    );
    return result.rows[0] || null;
  }

  static async findByIds(ids) {
    if (!ids?.length) return [];
    const validIds = ids.map((id) => parseInt(id, 10)).filter((n) => Number.isInteger(n) && n > 0);
    if (!validIds.length) return [];
    const result = await db.query(
      `SELECT i.*
       FROM institutes i
       INNER JOIN unnest($1::int[]) WITH ORDINALITY AS t(id, ord) ON i.id = t.id
       ORDER BY t.ord`,
      [validIds]
    );
    return result.rows;
  }

  static async create(data) {
    const {
      institute_name,
      institute_location,
      google_maps_link,
      type,
      logo,
      logo_filename,
      website,
      contact_number,
      referral_contact_email,
      branches_number,
      student_strength,
    } = data;
    const result = await db.query(
      `INSERT INTO institutes (institute_name, institute_location, google_maps_link, type, logo, logo_filename, website, contact_number, referral_contact_email, branches_number, student_strength)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
      [
        institute_name,
        institute_location || null,
        google_maps_link != null ? String(google_maps_link).trim() || null : null,
        type || null,
        logo || null,
        logo_filename || null,
        website || null,
        contact_number || null,
        referral_contact_email != null ? String(referral_contact_email).trim() || null : null,
        branches_number != null ? String(branches_number).trim() || null : null,
        student_strength != null ? String(student_strength).trim() || null : null,
      ]
    );
    return result.rows[0];
  }

  static async findMissingLogosByFilename(filename) {
    if (!filename || !String(filename).trim()) return [];
    const result = await db.query(
      `SELECT * FROM institutes
       WHERE LOWER(TRIM(logo_filename)) = LOWER(TRIM($1))
       AND (logo IS NULL OR logo = '')`,
      [String(filename).trim()]
    );
    return result.rows;
  }

  static async update(id, data) {
    const {
      institute_name,
      institute_location,
      google_maps_link,
      type,
      logo,
      logo_filename,
      website,
      contact_number,
      referral_contact_email,
      branches_number,
      student_strength,
    } = data;
    const updates = [];
    const values = [];
    let paramCount = 1;
    if (institute_name !== undefined) { updates.push(`institute_name = $${paramCount++}`); values.push(institute_name); }
    if (institute_location !== undefined) { updates.push(`institute_location = $${paramCount++}`); values.push(institute_location); }
    if (google_maps_link !== undefined) {
      updates.push(`google_maps_link = $${paramCount++}`);
      values.push(google_maps_link != null ? String(google_maps_link).trim() || null : null);
    }
    if (type !== undefined) { updates.push(`type = $${paramCount++}`); values.push(type); }
    if (logo !== undefined) { updates.push(`logo = $${paramCount++}`); values.push(logo); }
    if (logo_filename !== undefined) { updates.push(`logo_filename = $${paramCount++}`); values.push(logo_filename); }
    if (website !== undefined) { updates.push(`website = $${paramCount++}`); values.push(website); }
    if (contact_number !== undefined) { updates.push(`contact_number = $${paramCount++}`); values.push(contact_number); }
    if (referral_contact_email !== undefined) {
      updates.push(`referral_contact_email = $${paramCount++}`);
      values.push(referral_contact_email != null ? String(referral_contact_email).trim() || null : null);
    }
    if (branches_number !== undefined) {
      updates.push(`branches_number = $${paramCount++}`);
      values.push(branches_number != null ? String(branches_number).trim() || null : null);
    }
    if (student_strength !== undefined) {
      updates.push(`student_strength = $${paramCount++}`);
      values.push(student_strength != null ? String(student_strength).trim() || null : null);
    }
    if (updates.length === 0) return await this.findById(id);
    values.push(id);
    const result = await db.query(
      `UPDATE institutes SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${paramCount} RETURNING *`,
      values
    );
    return result.rows[0] || null;
  }

  static async delete(id) {
    const result = await db.query(
      'DELETE FROM institutes WHERE id = $1 RETURNING *',
      [id]
    );
    return result.rows[0] || null;
  }
}

module.exports = Institute;
