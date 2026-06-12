/**
 * Register client exam portals in exam_adapters as empty drafts so the
 * extension's admin Builder can scan them (detection is a substring match
 * on portal_url_pattern — use the bare hostname).
 *
 * Deliberately does NOT call db.init(): the add_exam_adapter_drafts.sql
 * backfill (re-run on every init) promotes active drafts to 'published'.
 *
 * Run from backend: node scripts/seedClientPortalAdapters.js
 */

require('dotenv').config();
const db = require('../src/config/database');

const SEEDED_BY = 'seed-script';

const PORTALS = [
  { exam_id: 'upeseat_2026',     exam_name: 'UPESEAT 2026 — UPES Entrance',  portal_url_pattern: 'admission.upes.ac.in' },
  { exam_id: 'bennett_eet_2026', exam_name: 'Bennett University EET 2026',   portal_url_pattern: 'applications.bennett.edu.in' },
  { exam_id: 'pearl_2026',       exam_name: 'Pearl Academy Entrance 2026',   portal_url_pattern: 'admissions.pearlacademy.com' },
  { exam_id: 'kiitee_2026',      exam_name: 'KIITEE 2026',                   portal_url_pattern: 'kiitee.eduquity.com' },
];

async function main() {
  try {
    const emptyAdapter = JSON.stringify({ sections: [] });

    for (const p of PORTALS) {
      const existing = await db.query(
        'SELECT exam_id FROM exam_adapters WHERE exam_id = $1',
        [p.exam_id]
      );

      if (existing.rows[0]) {
        await db.query(
          `UPDATE exam_adapters
              SET exam_name = $1,
                  portal_url_pattern = $2,
                  is_active = TRUE,
                  status = 'draft',
                  updated_by = $3,
                  updated_at = CURRENT_TIMESTAMP
            WHERE exam_id = $4`,
          [p.exam_name, p.portal_url_pattern, SEEDED_BY, p.exam_id]
        );
        console.log(`✅ Updated ${p.exam_id} (${p.portal_url_pattern})`);
      } else {
        await db.query(
          `INSERT INTO exam_adapters
             (exam_id, exam_name, portal_url_pattern, adapter_config, version, is_active, status, is_ai_generated, created_by, updated_by)
           VALUES ($1, $2, $3, $4::jsonb, 1, TRUE, 'draft', FALSE, $5, $5)`,
          [p.exam_id, p.exam_name, p.portal_url_pattern, emptyAdapter, SEEDED_BY]
        );
        console.log(`✅ Registered ${p.exam_id} (${p.portal_url_pattern})`);
      }
    }

    console.log('\nDone. Reload the extension (or wait 10 min) so it refetches the registered exam list.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

main();
