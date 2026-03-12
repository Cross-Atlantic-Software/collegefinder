/**
 * Clear all exam mocks except Mock 1 (order_index = 1).
 * Keeps Mock 1 and its questions, clears Mock 2, 3, 4, etc.
 *
 * Run from repo root: node backend/scripts/clearMocksExceptFirst.js
 */

require('dotenv').config();
const db = require('../src/config/database');

async function main() {
  try {
    // Get mocks to delete (order_index > 1)
    const mocksToDelete = await db.query(
      'SELECT id, exam_id, order_index FROM exam_mocks WHERE order_index > 1'
    );
    const mockIds = mocksToDelete.rows.map((r) => r.id);

    if (mockIds.length === 0) {
      console.log('No mocks to clear (only Mock 1 exists or no mocks at all).');
      return;
    }

    console.log(`Clearing ${mockIds.length} mock(s) with order_index > 1:`, mocksToDelete.rows.map((r) => `exam ${r.exam_id} mock ${r.order_index}`).join(', '));

    // Delete user_attempt_answers for attempts on those mocks
    const uaaResult = await db.query(
      `DELETE FROM user_attempt_answers
       WHERE user_exam_attempt_id IN (
         SELECT id FROM user_exam_attempts WHERE exam_mock_id = ANY($1::int[])
       )
       RETURNING id`,
      [mockIds]
    );
    console.log(`Deleted ${uaaResult.rowCount} user_attempt_answers for non-Mock-1 attempts.`);

    // Delete user_exam_attempts for those mocks
    const ueaResult = await db.query(
      'DELETE FROM user_exam_attempts WHERE exam_mock_id = ANY($1::int[]) RETURNING id',
      [mockIds]
    );
    console.log(`Deleted ${ueaResult.rowCount} user_exam_attempts for non-Mock-1 attempts.`);

    // Delete exam_mock_questions for those mocks, then exam_mocks
    const emqResult = await db.query(
      'DELETE FROM exam_mock_questions WHERE exam_mock_id = ANY($1::int[]) RETURNING id',
      [mockIds]
    );
    console.log(`Deleted ${emqResult.rowCount} exam_mock_questions.`);

    const emResult = await db.query(
      'DELETE FROM exam_mocks WHERE order_index > 1 RETURNING id',
      []
    );
    console.log(`Deleted ${emResult.rowCount} exam_mocks (Mock 2+).`);

    // Reset total_mocks_generated to 1 for exams that have Mock 1
    const resetResult = await db.query(`
      UPDATE exams_taxonomies et
      SET total_mocks_generated = 1
      WHERE EXISTS (SELECT 1 FROM exam_mocks em WHERE em.exam_id = et.id AND em.order_index = 1)
        AND total_mocks_generated > 1
      RETURNING id
    `);
    if (resetResult.rowCount > 0) {
      console.log(`Reset total_mocks_generated to 1 for ${resetResult.rowCount} exam(s).`);
    }

    console.log('Done. Only Mock 1 remains. Restart the backend and start Mock 1.');
  } catch (err) {
    console.error('Error:', err.message || err);
    process.exit(1);
  } finally {
    if (db.pool) await db.pool.end();
    process.exit(0);
  }
}

main();
