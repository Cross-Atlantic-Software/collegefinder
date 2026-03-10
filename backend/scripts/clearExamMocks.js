/**
 * Clear all rows from exam_mocks (and cascade to exam_mock_questions).
 * user_exam_attempts.exam_mock_id and user_attempt_answers.exam_mock_id become NULL.
 *
 * Run from repo root: node backend/scripts/clearExamMocks.js
 */

require('dotenv').config();
const db = require('../src/config/database');

async function main() {
  try {
    const countResult = await db.query('SELECT COUNT(*)::int AS n FROM exam_mocks');
    const before = countResult.rows[0].n;

    await db.query('DELETE FROM exam_mocks');

    console.log(`Cleared exam_mocks: ${before} row(s) removed.`);
    console.log('Done.');
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  } finally {
    if (db.pool) await db.pool.end();
    process.exit(0);
  }
}

main();
