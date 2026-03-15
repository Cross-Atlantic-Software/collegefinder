/**
 * Clear all exam/mock related data on the server.
 * Keeps: exams_taxonomies, exam_mock_prompts (exam definitions and prompts).
 * Clears: user_attempt_answers, user_exam_attempts, exam_mock_questions, exam_mocks, questions.
 *
 * Run from backend: node scripts/clearExamMockData.js
 */

require('dotenv').config();
const { pool } = require('../src/config/database');

async function run() {
  if (!pool) {
    console.error('Database pool not available');
    process.exit(1);
  }

  const client = await pool.connect();
  try {
    console.log('Clearing exam/mock related tables (child tables first)...');

    await client.query('TRUNCATE TABLE user_attempt_answers RESTART IDENTITY CASCADE');
    console.log('  ✓ user_attempt_answers');

    await client.query('TRUNCATE TABLE user_exam_attempts RESTART IDENTITY CASCADE');
    console.log('  ✓ user_exam_attempts');

    await client.query('TRUNCATE TABLE exam_mock_questions RESTART IDENTITY CASCADE');
    console.log('  ✓ exam_mock_questions');

    await client.query('TRUNCATE TABLE exam_mocks RESTART IDENTITY CASCADE');
    console.log('  ✓ exam_mocks');

    await client.query('TRUNCATE TABLE questions RESTART IDENTITY CASCADE');
    console.log('  ✓ questions');

    console.log('Done. exams_taxonomies and exam_mock_prompts were left intact.');
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
