/**
 * Clear all test-related tables (backend/src/models/test) and exams_taxonomies.
 * Order respects foreign keys: user_attempt_answers → exam_mock_questions → user_exam_attempts
 * → exam_mocks → tests → questions → exam_mock_prompts → exams_taxonomies.
 *
 * Run from repo root: node backend/scripts/clearExamMocksAndQuestions.js
 * Or: npm run clear-mocks-and-questions (from backend/)
 */

require('dotenv').config();
const db = require('../src/config/database');

async function main() {
  try {
    const [uaa, emq, uea, em, t, q, emp, et] = await Promise.all([
      db.query('SELECT COUNT(*)::int AS n FROM user_attempt_answers'),
      db.query('SELECT COUNT(*)::int AS n FROM exam_mock_questions'),
      db.query('SELECT COUNT(*)::int AS n FROM user_exam_attempts'),
      db.query('SELECT COUNT(*)::int AS n FROM exam_mocks'),
      db.query('SELECT COUNT(*)::int AS n FROM tests'),
      db.query('SELECT COUNT(*)::int AS n FROM questions'),
      db.query('SELECT COUNT(*)::int AS n FROM exam_mock_prompts'),
      db.query('SELECT COUNT(*)::int AS n FROM exams_taxonomies')
    ]);

    await db.query('DELETE FROM user_attempt_answers');
    await db.query('DELETE FROM exam_mock_questions');
    await db.query('DELETE FROM user_exam_attempts');
    await db.query('DELETE FROM exam_mocks');
    await db.query('DELETE FROM tests');
    await db.query('DELETE FROM questions');
    await db.query('DELETE FROM exam_mock_prompts');
    await db.query('DELETE FROM exams_taxonomies');

    console.log(`Cleared user_attempt_answers: ${uaa.rows[0].n} row(s).`);
    console.log(`Cleared exam_mock_questions: ${emq.rows[0].n} row(s).`);
    console.log(`Cleared user_exam_attempts: ${uea.rows[0].n} row(s).`);
    console.log(`Cleared exam_mocks: ${em.rows[0].n} row(s).`);
    console.log(`Cleared tests: ${t.rows[0].n} row(s).`);
    console.log(`Cleared questions: ${q.rows[0].n} row(s).`);
    console.log(`Cleared exam_mock_prompts: ${emp.rows[0].n} row(s).`);
    console.log(`Cleared exams_taxonomies: ${et.rows[0].n} row(s).`);
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
