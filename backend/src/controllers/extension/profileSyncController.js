/**
 * Phase 2 — Profile Sync-Back
 * PATCH /api/extension/profile
 *
 * When a student edits a value on the sidebar's pre-fill review screen, the
 * extension sends the changed dotted-path values here. This controller is the
 * INVERSE of FillProfileController.getFillProfile: that controller reads the
 * normalized profile tables and assembles them into one nested JSON; this one
 * takes a nested-path edit and writes it back to the correct table + column.
 *
 * Body shape:
 *   { "changes": { "address.city": "Pune", "student.email": "x@y.com", ... } }
 *
 * Response:
 *   { success: true,
 *     applied: [ { path, table, column }, ... ],   // persisted to the profile
 *     skipped: [ { path, reason }, ... ] }          // not a syncable field (form-only)
 *
 * Security model:
 *   - userId always comes from req.user.id (the auth token), never from the body,
 *     so a student can only ever edit their own profile.
 *   - Column/table identifiers are taken ONLY from the hardcoded REVERSE_MAP
 *     below — never from request input — and are additionally regex-checked
 *     before being placed in the SQL identifier position. Values are always
 *     passed as bound parameters ($1, $2, ...). So there is no SQL-injection
 *     surface even though identifiers can't be parameterized.
 */

const db = require('../../config/database');

// ── Which key column links each table back to the user ──────────────────────
// `users` is keyed by its own primary key `id`; every satellite table is keyed
// by a `user_id` foreign key. We need this to know how to target the row.
const TABLES = {
  users:                     { key: 'id' },
  user_address:              { key: 'user_id' },
  user_academics:            { key: 'user_id' },
  other_personal_details:    { key: 'user_id' },
  government_identification:  { key: 'user_id' },
  user_other_info:           { key: 'user_id' },
};

// ── REVERSE_MAP: dotted source path → [ table, column, coercion? ] ───────────
// This is the exact mirror of the forward assembly in fillProfileController.
// ONLY genuinely editable scalar columns are listed. Derived/computed values
// (full_name, disability flag, id_document_type), lookup-resolved values
// (category), document URLs, and arrays (subjects) are intentionally absent —
// a path not in this map is reported back as "skipped" and treated as a
// form-only edit that is NOT written to the profile.
const REVERSE_MAP = {
  // users
  'student.first_name':       ['users', 'first_name'],
  'student.last_name':        ['users', 'last_name'],
  'student.father_name':      ['users', 'father_full_name'],
  'student.mother_name':      ['users', 'mother_full_name'],
  'student.guardian_name':    ['users', 'guardian_name'],
  'student.dob':              ['users', 'date_of_birth', 'date'],
  'student.gender':           ['users', 'gender'],
  'student.nationality':      ['users', 'nationality'],
  'student.marital_status':   ['users', 'marital_status'],
  'student.mobile':           ['users', 'phone_number'],
  'student.alternate_mobile': ['users', 'alternate_mobile_number'],

  // user_address
  'address.line1':    ['user_address', 'correspondence_address_line1'],
  'address.line2':    ['user_address', 'correspondence_address_line2'],
  'address.city':     ['user_address', 'city_town_village'],
  'address.district': ['user_address', 'district'],
  'address.state':    ['user_address', 'state'],
  'address.pincode':  ['user_address', 'pincode'],
  'address.country':  ['user_address', 'country'],

  // user_academics — Class 12 (postmatric)
  'education.class_12.board':          ['user_academics', 'postmatric_board'],
  'education.class_12.school':         ['user_academics', 'postmatric_school_name'],
  'education.class_12.passing_year':   ['user_academics', 'postmatric_passing_year', 'int'],
  'education.class_12.roll_no':        ['user_academics', 'postmatric_roll_number'],
  'education.class_12.total_marks':    ['user_academics', 'postmatric_total_marks', 'num'],
  'education.class_12.obtained_marks': ['user_academics', 'postmatric_obtained_marks', 'num'],
  'education.class_12.percentage':     ['user_academics', 'postmatric_percentage', 'num'],
  'education.class_12.state':          ['user_academics', 'postmatric_state'],
  'education.class_12.city':           ['user_academics', 'postmatric_city'],
  'education.class_12.school_pincode': ['user_academics', 'postmatric_school_pincode'],
  'education.class_12.stream':         ['user_academics', 'stream'],
  'education.class_12.cgpa':           ['user_academics', 'postmatric_cgpa', 'num'],

  // user_academics — Class 10 (matric)
  'education.class_10.board':          ['user_academics', 'matric_board'],
  'education.class_10.school':         ['user_academics', 'matric_school_name'],
  'education.class_10.passing_year':   ['user_academics', 'matric_passing_year', 'int'],
  'education.class_10.roll_no':        ['user_academics', 'matric_roll_number'],
  'education.class_10.total_marks':    ['user_academics', 'matric_total_marks', 'num'],
  'education.class_10.obtained_marks': ['user_academics', 'matric_obtained_marks', 'num'],
  'education.class_10.percentage':     ['user_academics', 'matric_percentage', 'num'],
  'education.class_10.state':          ['user_academics', 'matric_state'],
  'education.class_10.city':           ['user_academics', 'matric_city'],
  'education.class_10.school_pincode': ['user_academics', 'matric_school_pincode'],

  // other_personal_details
  'student.religion':             ['other_personal_details', 'religion'],
  'student.sub_category':         ['other_personal_details', 'sub_category'],
  'student.mother_tongue':        ['other_personal_details', 'mother_tongue'],
  'student.annual_family_income': ['other_personal_details', 'annual_family_income'],
  'student.occupation_of_father': ['other_personal_details', 'occupation_of_father'],
  'student.occupation_of_mother': ['other_personal_details', 'occupation_of_mother'],

  // government_identification
  'student.aadhar_no': ['government_identification', 'aadhar_number'],
  'student.pan_no':    ['government_identification', 'pan_number'],
  'student.apaar_id':  ['government_identification', 'apaar_id'],

  // user_other_info
  'other.medium':   ['user_other_info', 'medium'],
  'other.language': ['user_other_info', 'language'],
};

// Defence-in-depth: even though identifiers come from the trusted map above,
// re-validate their shape before interpolating them into SQL.
const IDENT = /^[a-z_][a-z0-9_]*$/;

/**
 * Coerce a string value from the edit form into the type the column expects.
 * Empty / blank → null (so clearing a field stores NULL, not "").
 */
function coerce(raw, kind) {
  if (raw === undefined || raw === null) return null;
  const s = String(raw).trim();
  if (s === '') return null;
  if (kind === 'int') { const n = parseInt(s, 10); return Number.isFinite(n) ? n : null; }
  if (kind === 'num') { const n = Number(s);        return Number.isFinite(n) ? n : null; }
  // 'date' → expect 'YYYY-MM-DD'; pass through as text, Postgres casts it.
  return s;
}

class ProfileSyncController {
  /**
   * PATCH /api/extension/profile
   */
  static async updateProfile(req, res) {
    const userId = req.user && req.user.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    const changes = req.body && req.body.changes;
    if (!changes || typeof changes !== 'object' || Array.isArray(changes)) {
      return res.status(400).json({
        success: false,
        message: 'Request body must be { "changes": { "<path>": <value> } }',
      });
    }

    // 1) Bucket each incoming change under its target table; record skips.
    const byTable = {};        // table → { column: coercedValue }
    const applied = [];        // [{ path, table, column }]
    const skipped = [];        // [{ path, reason }]

    for (const [path, value] of Object.entries(changes)) {
      const entry = REVERSE_MAP[path];
      if (!entry) {
        skipped.push({ path, reason: 'not a syncable profile field (form-only)' });
        continue;
      }
      const [table, column, kind] = entry;
      if (!IDENT.test(table) || !IDENT.test(column) || !TABLES[table]) {
        skipped.push({ path, reason: 'invalid mapping' });
        continue;
      }
      (byTable[table] = byTable[table] || {})[column] = coerce(value, kind);
      applied.push({ path, table, column });
    }

    if (Object.keys(byTable).length === 0) {
      // Nothing maps to the profile — still a success; everything was form-only.
      return res.json({ success: true, applied: [], skipped, message: 'Nothing to persist' });
    }

    // 2) Write all tables inside one transaction so a partial failure rolls back.
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');

      for (const [table, cols] of Object.entries(byTable)) {
        const keyCol = TABLES[table].key;
        const columns = Object.keys(cols);
        const values = columns.map((c) => cols[c]);

        // SET col_a = $1, col_b = $2, ...   (identifiers from trusted map only)
        const setClause = columns.map((c, i) => `${c} = $${i + 1}`).join(', ');
        const keyParam = `$${columns.length + 1}`;

        const upd = await client.query(
          `UPDATE ${table}
              SET ${setClause}, updated_at = CURRENT_TIMESTAMP
            WHERE ${keyCol} = ${keyParam}`,
          [...values, userId]
        );

        // A satellite table may not have a row for this user yet → insert one.
        // (The `users` row always exists, so this only applies to user_id tables.)
        if (upd.rowCount === 0 && keyCol === 'user_id') {
          const insCols = [keyCol, ...columns];
          const placeholders = insCols.map((_, i) => `$${i + 1}`).join(', ');
          await client.query(
            `INSERT INTO ${table} (${insCols.join(', ')}) VALUES (${placeholders})`,
            [userId, ...values]
          );
        }
      }

      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('Profile sync-back failed:', err);
      return res.status(500).json({ success: false, message: 'Failed to sync profile' });
    } finally {
      client.release();
    }

    return res.json({ success: true, applied, skipped });
  }
}

module.exports = ProfileSyncController;
// Exported for unit tests / reuse by the audit-report layer.
module.exports.REVERSE_MAP = REVERSE_MAP;
module.exports.coerce = coerce;
