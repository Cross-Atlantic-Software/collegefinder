/**
 * Clear exams_taxonomies table fully.
 * Clears user_exam_preferences.target_exams, then deletes all exam rows.
 * Cascades will remove dependent rows (exam_mocks, user_exam_attempts, etc.).
 *
 * Run from repo root: node backend/scripts/clearExamsTaxonomies.js
 */

require('dotenv').config();
const db = require('../src/config/database');

async function main() {
  try {
    const countResult = await db.query('SELECT COUNT(*)::int AS n FROM exams_taxonomies');
    const before = countResult.rows[0].n;

    await db.query('UPDATE user_exam_preferences SET target_exams = NULL WHERE target_exams IS NOT NULL');
    await db.query('DELETE FROM exams_taxonomies');

    console.log(`Cleared exams_taxonomies: ${before} row(s) removed.`);
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
