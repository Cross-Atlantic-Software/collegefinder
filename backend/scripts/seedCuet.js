/**
 * Seed CUET into exams_taxonomies with a valid format so dashboard/test UI does not crash.
 * Run from repo root: node backend/scripts/seedCuet.js
 */
require('dotenv').config();
const db = require('../src/config/database');

/** Minimal valid format: name, duration_minutes, total_*, marking_scheme, rules, sections with subsections */
function buildCuetFormat() {
  return {
    default: {
      name: 'CUET (UG)',
      duration_minutes: 180,
      total_questions: 50,
      total_marks: 200,
      marking_scheme: { correct: 4, incorrect: -1, unattempted: 0 },
      rules: [
        'Total duration: 3 hours (180 minutes)',
        'Section I - General Test: 50 questions',
        'Marking: +4 for correct, -1 for incorrect, 0 for unattempted',
        'Multiple choice - choose one correct option',
      ],
      sections: {
        'Section I - General Test': {
          name: 'Section I - General Test',
          total_questions: 50,
          marks: 200,
          subsections: {
            'Section A': {
              type: 'mcq_single',
              questions: 50,
              marks_per_question: 4,
              required: 50,
            },
          },
        },
      },
    },
  };
}

async function main() {
  const format = buildCuetFormat();
  const r = await db.query(
    `INSERT INTO exams_taxonomies (name, code, description, format)
     VALUES ($1, $2, $3, $4::jsonb)
     ON CONFLICT (code)
     DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, format = EXCLUDED.format
     RETURNING id, name, code`,
    [
      'CUET',
      'CUET',
      'Common University Entrance Test - for admission to central and other participating universities',
      JSON.stringify(format),
    ]
  );
  console.log('CUET added/updated:', r.rows[0]);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.pool && db.pool.end());
