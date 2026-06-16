/**
 * Seed SSC CGL into the exam catalog (exams_taxonomies) and register a draft
 * ExamFill adapter stub (exam_adapters). Idempotent — safe to re-run.
 *
 * Run from backend folder:  node scripts/seedSscCgl.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const db = require('../src/config/database');

async function main() {
  console.log('[seedSscCgl] Seeding SSC CGL …');

  // 1) Catalog row
  const cat = await db.query(
    `INSERT INTO exams_taxonomies
        (name, code, conducting_authority, exam_type, website, registration_link, abbreviation, description)
     SELECT 'SSC CGL', 'SSC_CGL', 'Staff Selection Commission', 'Government Recruitment',
            'https://ssc.gov.in', 'https://ssc.gov.in', 'SSC CGL',
            'Staff Selection Commission Combined Graduate Level examination for Group B and Group C posts in central government ministries and departments.'
     WHERE NOT EXISTS (SELECT 1 FROM exams_taxonomies WHERE lower(name) = lower('SSC CGL'))
     RETURNING id`
  );
  console.log(cat.rows[0]
    ? `[seedSscCgl] Catalog row created (id=${cat.rows[0].id}).`
    : '[seedSscCgl] Catalog row already exists — skipped.');

  // 2) Adapter stub (draft — admins build it, then publish for everyone)
  const ad = await db.query(
    `INSERT INTO exam_adapters
        (exam_id, exam_name, portal_url_pattern, adapter_config, version, is_active, status, is_ai_generated)
     VALUES ('ssc_cgl', 'SSC CGL', 'ssc.gov.in', '{"sections": []}'::jsonb, 1, FALSE, 'draft', FALSE)
     ON CONFLICT (exam_id) DO NOTHING
     RETURNING exam_id`
  );
  console.log(ad.rows[0]
    ? '[seedSscCgl] Adapter stub created (ssc_cgl, draft).'
    : '[seedSscCgl] Adapter stub already exists — skipped.');

  // 3) Eligibility — show SSC CGL on the dashboard for Science (PCM). Unions with existing streams.
  const elig = await db.query(
    `INSERT INTO exam_eligibility_criteria (exam_id, stream_ids)
     SELECT t.id, ARRAY[s.id]::integer[]
       FROM exams_taxonomies t
       CROSS JOIN streams s
      WHERE lower(t.name) = lower('SSC CGL') AND s.name = 'Science (PCM)'
     ON CONFLICT (exam_id) DO UPDATE
        SET stream_ids = ARRAY(SELECT DISTINCT unnest(exam_eligibility_criteria.stream_ids || EXCLUDED.stream_ids)),
            updated_at = CURRENT_TIMESTAMP
     RETURNING exam_id, stream_ids`
  );
  console.log(elig.rows[0]
    ? `[seedSscCgl] Eligibility set for SSC CGL — stream_ids=${JSON.stringify(elig.rows[0].stream_ids)} (PCM=1).`
    : '[seedSscCgl] Eligibility row unchanged.');

  console.log('[seedSscCgl] Done.');
}

main()
  .then(() => process.exit(0))
  .catch((err) => { console.error('[seedSscCgl] Failed:', err); process.exit(1); });
