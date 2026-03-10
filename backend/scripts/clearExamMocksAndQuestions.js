/**
 * Clear exam_mock_questions, exam_mocks, and questions tables fully.
 * Order: exam_mock_questions → exam_mocks → questions (questions delete cascades to user_attempt_answers).
 *
 * Run from repo root: node backend/scripts/clearExamMocksAndQuestions.js
 */

require('dotenv').config();
const db = require('../src/config/database');

async function main() {
  try {
    const [mq, em, q] = await Promise.all([
      db.query('SELECT COUNT(*)::int AS n FROM exam_mock_questions'),
      db.query('SELECT COUNT(*)::int AS n FROM exam_mocks'),
      db.query('SELECT COUNT(*)::int AS n FROM questions')
    ]);

    await db.query('DELETE FROM exam_mock_questions');
    await db.query('DELETE FROM exam_mocks');
    await db.query('DELETE FROM questions');

    console.log(`Cleared exam_mock_questions: ${mq.rows[0].n} row(s).`);
    console.log(`Cleared exam_mocks: ${em.rows[0].n} row(s).`);
    console.log(`Cleared questions: ${q.rows[0].n} row(s).`);
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
