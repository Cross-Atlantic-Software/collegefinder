/**
 * Seed First Mock Tests (with sample previous-year style questions)
 *
 * For every exam in exams_taxonomies, this script:
 *   1. Creates a mock_tests row for Mock 1 if it doesn't exist.
 *   2. Inserts questions from seedData/firstMockQuestions.json into the questions table
 *      (source: Imported — no Gemini). Then links them in mock_questions and sets mock to ready.
 *
 * When the script finishes, Mock 1 for each exam is ready. When a user starts Mock 1,
 * the API will trigger generation of Mock 2 in the background (BullMQ + Gemini).
 *
 * To use your own previous year questions: edit or replace
 *   scripts/seedData/firstMockQuestions.json
 * and re-run this script (or run once with DB + migrations ready).
 *
 * Usage:
 *   node scripts/seedFirstMocks.js
 *   # Or, if you use Docker for the stack, run inside the backend container:
 *   docker-compose exec backend node scripts/seedFirstMocks.js
 *
 * Prerequisites:
 *   - PostgreSQL running and migrated (start with: docker-compose up -d)
 */

require('dotenv').config();
const path = require('path');
const fs = require('fs');
const db = require('../src/config/database');

async function seedFirstMocks() {
  console.log('🌱 Seeding Mock 1 for all exams (using seed questions, no Gemini)...\n');

  // Load seed questions from JSON
  const seedPath = path.join(__dirname, 'seedData', 'firstMockQuestions.json');
  if (!fs.existsSync(seedPath)) {
    console.error('❌ Seed file not found:', seedPath);
    process.exit(1);
  }
  const seedQuestions = JSON.parse(fs.readFileSync(seedPath, 'utf8'));
  if (!Array.isArray(seedQuestions) || seedQuestions.length === 0) {
    console.error('❌ firstMockQuestions.json must contain a non-empty array of questions.');
    process.exit(1);
  }

  try {
    await db.init();
  } catch (err) {
    if (err.code === 'ECONNREFUSED' || (err.errors && err.errors.some(e => e.code === 'ECONNREFUSED'))) {
      console.error('❌ Cannot connect to PostgreSQL (connection refused on port 5432).');
      console.error('   Start the database first, then run this script again.');
      console.error('   Example:  cd backend && docker-compose up -d');
      console.error('   Or run the seed inside the backend container:');
      console.error('   docker-compose exec backend node scripts/seedFirstMocks.js');
    } else {
      console.error('❌ Database error:', err.message);
    }
    process.exit(1);
  }

  const examsResult = await db.query(
    'SELECT id, name FROM exams_taxonomies ORDER BY id ASC'
  );
  const exams = examsResult.rows;

  if (exams.length === 0) {
    console.log('⚠️  No exams found. Run `npm run seed-exams` first.');
    process.exit(0);
  }

  console.log(`Found ${exams.length} exam(s). Seeding Mock 1 with ${seedQuestions.length} questions each...\n`);

  let created = 0;
  let skipped = 0;
  let failed = 0;

  for (const exam of exams) {
    let mockTestId;
    const existing = await db.query(
      'SELECT id, status FROM mock_tests WHERE exam_id = $1 AND mock_number = 1',
      [exam.id]
    );

    if (existing.rows.length > 0 && existing.rows[0].status === 'ready') {
      console.log(`  ⏭️  Mock 1 already ready for "${exam.name}" — skipping`);
      skipped++;
      continue;
    }

    if (existing.rows.length > 0) {
      mockTestId = existing.rows[0].id;
      // Clear any stale mock_questions so we can re-insert (e.g. after failed run)
      await db.query('DELETE FROM mock_questions WHERE mock_test_id = $1', [mockTestId]);
    } else {
      const insertResult = await db.query(`
        INSERT INTO mock_tests (exam_id, mock_number, status, created_by)
        VALUES ($1, 1, 'generating', 'manual')
        RETURNING id
      `, [exam.id]);
      mockTestId = insertResult.rows[0].id;
    }

    try {
      const insertedIds = [];
      for (let i = 0; i < seedQuestions.length; i++) {
        const q = seedQuestions[i];
        const options = Array.isArray(q.options) ? q.options : [];
        const result = await db.query(`
          INSERT INTO questions (
            exam_id, subject, section_name, section_type, difficulty, question_type,
            question_text, options, correct_option, solution_text, marks, negative_marks, source
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'Imported')
          RETURNING id
        `, [
          exam.id,
          q.subject || 'General',
          q.section_name || null,
          q.section_type || null,
          q.difficulty || 'medium',
          q.question_type || 'mcq',
          q.question_text,
          JSON.stringify(options),
          q.correct_option || 'A',
          q.solution_text || '',
          q.marks != null ? q.marks : 1,
          q.negative_marks != null ? q.negative_marks : 0.25,
        ]);
        insertedIds.push(result.rows[0].id);
      }

      for (let i = 0; i < insertedIds.length; i++) {
        await db.query(`
          INSERT INTO mock_questions (mock_test_id, question_id, order_index)
          VALUES ($1, $2, $3)
          ON CONFLICT (mock_test_id, question_id) DO NOTHING
        `, [mockTestId, insertedIds[i], i]);
      }

      await db.query(`
        UPDATE mock_tests SET status = 'ready', total_questions = $1 WHERE id = $2
      `, [insertedIds.length, mockTestId]);

      await db.query(`
        UPDATE exams_taxonomies SET total_mocks_generated = total_mocks_generated + 1 WHERE id = $1
      `, [exam.id]);

      console.log(`  ✅ Mock 1 ready for "${exam.name}" (${insertedIds.length} questions)`);
      created++;
    } catch (err) {
      console.error(`  ❌ Failed for "${exam.name}":`, err.message);
      failed++;
    }
  }

  console.log(`\n✅ Done. Created: ${created}, Already ready: ${skipped}, Failed: ${failed}`);
  console.log('   When a user starts Mock 1, Mock 2 will be generated in the background (Gemini).\n');
  process.exit(failed > 0 ? 1 : 0);
}

seedFirstMocks().catch((err) => {
  console.error('❌ seedFirstMocks failed:', err);
  process.exit(1);
});
