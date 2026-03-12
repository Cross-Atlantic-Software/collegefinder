/**
 * Seed a JEE Advanced mock test using the worker (buildParams + exam_mock_prompts).
 * Uses the prompt stored in exam_mock_prompts for JEE Advanced.
 *
 * Run from repo root: node backend/scripts/seedJeeAdvancedMock.js [--resume]
 * Or from backend: npm run seed-jee-adv-mock
 *
 * --resume: Keep existing questions and generate only the remaining ones.
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const db = require('../src/config/database');
const { runMockGenerationSync } = require('../src/jobs/workers/mockGenerationWorker');

const EXAM_CODE = 'JEE_ADVANCED';
const ORDER_INDEX = 1;
const RESUME = process.argv.includes('--resume');

async function main() {
  try {
    console.log('🚀 Seeding JEE Advanced Mock (using exam_mock_prompts)\n');

    const examResult = await db.query(
      'SELECT id, name FROM exams_taxonomies WHERE code = $1',
      [EXAM_CODE]
    );

    if (examResult.rows.length === 0) {
      console.error('❌ JEE Advanced exam not found. Run seed-three-exams first.');
      process.exit(1);
    }

    const { id: examId, name: examName } = examResult.rows[0];
    console.log(`✅ Exam: ${examName} (ID: ${examId})\n`);

    const existing = await db.query(
      'SELECT id FROM exam_mocks WHERE exam_id = $1 AND order_index = $2',
      [examId, ORDER_INDEX]
    );

    let mockTestId;
    if (existing.rows.length > 0) {
      mockTestId = existing.rows[0].id;
      await db.query("UPDATE exam_mocks SET status = 'generating' WHERE id = $1", [mockTestId]);
      if (RESUME) {
        const countRow = await db.query(
          'SELECT COUNT(*)::int AS n FROM exam_mock_questions WHERE exam_mock_id = $1',
          [mockTestId]
        );
        console.log(`♻️  Resuming Mock ${ORDER_INDEX} — ${countRow.rows[0].n} questions already saved\n`);
      } else {
        await db.query('DELETE FROM exam_mock_questions WHERE exam_mock_id = $1', [mockTestId]);
        console.log(`♻️  Reset Mock ${ORDER_INDEX}, generating fresh...\n`);
      }
    } else {
      const ins = await db.query(
        `INSERT INTO exam_mocks (exam_id, order_index, status, created_by)
         VALUES ($1, $2, 'generating', 'system') RETURNING id`,
        [examId, ORDER_INDEX]
      );
      mockTestId = ins.rows[0].id;
      console.log(`✨ Created Mock ${ORDER_INDEX}\n`);
    }

    console.log('📋 Running mock generation (Gemini API)...\n');
    const startMs = Date.now();

    await runMockGenerationSync({
      examId,
      mockNumber: ORDER_INDEX,
      mockTestId,
    });

    const durationMs = Date.now() - startMs;
    console.log(`\n✅ Done! Mock generated in ${(durationMs / 1000).toFixed(1)}s`);
  } catch (err) {
    console.error('❌ Error:', err.message);
    console.error(err.stack);
    process.exit(1);
  } finally {
    if (db.pool) await db.pool.end();
    process.exit(0);
  }
}

main();
