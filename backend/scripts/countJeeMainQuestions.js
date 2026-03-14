/**
 * Count questions for JEE Main on the DB.
 * Run from backend: node scripts/countJeeMainQuestions.js
 */
require('dotenv').config();
const db = require('../src/config/database');

async function main() {
  const jeem = await db.query(
    "SELECT id, name FROM exams_taxonomies WHERE code = 'JEE_MAIN'"
  );
  if (!jeem.rows[0]) {
    console.log('JEE_MAIN exam not found.');
    return;
  }
  const examId = jeem.rows[0].id;
  const name = jeem.rows[0].name;

  const inMocks = await db.query(
    'SELECT COUNT(*) AS n FROM exam_mock_questions WHERE exam_id = $1',
    [examId]
  );
  const totalBank = await db.query('SELECT COUNT(*) AS n FROM questions');
  const mockCount = await db.query(
    'SELECT COUNT(*) AS m FROM exam_mocks WHERE exam_id = $1',
    [examId]
  );

  console.log('JEE Main (exam_id: %s)', examId);
  console.log('Questions in JEE Main mocks (exam_mock_questions): %s', inMocks.rows[0].n);
  console.log('JEE Main mocks (exam_mocks): %s', mockCount.rows[0].m);
  console.log('Total questions in question bank: %s', totalBank.rows[0].n);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.pool && db.pool.end());
