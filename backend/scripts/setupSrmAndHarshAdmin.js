/**
 * One-time setup script:
 *  1. Upserts sharmaharsh634@gmail.com as an active CMS admin (type = 'super_admin')
 *  2. Registers SRMJEEE 2026 in exam_adapters (portal URL pattern only, no adapter sections yet)
 *
 * Run: node backend/scripts/setupSrmAndHarshAdmin.js
 */

require('dotenv').config();
const db = require('../src/config/database');

async function main() {
  try {
    await db.init();
    console.log('✅ DB connected');

    // ── 1. Upsert Harsh as admin ──────────────────────────────────────
    const email = 'sharmaharsh634@gmail.com';
    const existing = await db.query('SELECT id, email, type, is_active FROM admin_users WHERE email = $1', [email]);

    if (existing.rows[0]) {
      await db.query(
        'UPDATE admin_users SET type = $1, is_active = TRUE WHERE email = $2',
        ['super_admin', email]
      );
      console.log(`✅ Updated admin_users — ${email} is now a super_admin (is_active = true)`);
    } else {
      await db.query(
        `INSERT INTO admin_users (email, password_hash, type, is_active, created_by)
         VALUES ($1, '', 'super_admin', TRUE, 'seed-script')`,
        [email]
      );
      console.log(`✅ Inserted ${email} into admin_users as super_admin`);
    }

    // ── 2. Register SRM exam in exam_adapters ─────────────────────────
    const examId           = 'srmjeee_2026';
    const examName         = 'SRMJEEE 2026 — SRM B.Tech Admissions';
    const portalUrlPattern = 'applications.srmist.edu.in';
    const emptyAdapter     = JSON.stringify({ sections: [] });

    const examExists = await db.query('SELECT exam_id FROM exam_adapters WHERE exam_id = $1', [examId]);

    if (examExists.rows[0]) {
      await db.query(
        `UPDATE exam_adapters
            SET exam_name = $1,
                portal_url_pattern = $2,
                is_active = TRUE,
                status = 'draft',
                updated_at = CURRENT_TIMESTAMP
          WHERE exam_id = $3`,
        [examName, portalUrlPattern, examId]
      );
      console.log(`✅ exam_adapters updated — ${examId} already existed, refreshed name/pattern/active`);
    } else {
      await db.query(
        `INSERT INTO exam_adapters
           (exam_id, exam_name, portal_url_pattern, adapter_config, version, is_active, status, is_ai_generated, created_by, updated_by)
         VALUES ($1, $2, $3, $4::jsonb, 1, TRUE, 'draft', FALSE, $5, $5)`,
        [examId, examName, portalUrlPattern, emptyAdapter, email]
      );
      console.log(`✅ exam_adapters — registered ${examId} (${portalUrlPattern})`);
    }

    console.log('\nAll done! Restart the backend and reload the extension.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

main();
