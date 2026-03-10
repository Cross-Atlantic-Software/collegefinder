/**
 * Keep only JEE exams in the exam taxonomies table.
 * Deletes all exams whose name or code does not contain "JEE" (case-insensitive).
 * Keeps JEE Main, JEE Advanced, and any other JEE-named exam.
 * Cascades will remove dependent rows (tests, exam_mocks, attempts, etc.).
 * Updates user_exam_preferences.target_exams to only include remaining JEE exam IDs.
 *
 * Run with: node backend/scripts/keepOnlyJeeExams.js
 * Or: npm run keep-only-jee-exams
 */

require('dotenv').config();
const db = require('../src/config/database');
const Exam = require('../src/models/taxonomy/Exam');

const JEE_PATTERN = /jee/i;

function isJee(exam) {
  const name = (exam.name || '').toLowerCase();
  const code = (exam.code || '').toLowerCase();
  return JEE_PATTERN.test(name) || JEE_PATTERN.test(code);
}

async function main() {
  try {
    const all = await Exam.findAll();
    const toKeep = all.filter(isJee);
    const toDelete = all.filter((e) => !isJee(e));

    if (toKeep.length === 0) {
      console.warn('No JEE exam found in DB. Add at least one exam with "JEE" in name or code and run again.');
      process.exit(1);
    }

    if (toDelete.length === 0) {
      console.log('Only JEE exams already present. No other exams to delete.');
      if (db.pool) await db.pool.end();
      process.exit(0);
      return;
    }

    console.log(`Keeping ${toKeep.length} exam(s): ${toKeep.map((e) => e.name).join(', ')}`);
    console.log(`Deleting ${toDelete.length} exam(s): ${toDelete.map((e) => e.name).join(', ')}`);

    const keepIds = new Set(toKeep.map((e) => e.id));

    for (const exam of toDelete) {
      await Exam.delete(exam.id);
      console.log(`  Deleted: ${exam.name} (id ${exam.id})`);
    }

    // Update user_exam_preferences: keep only target_exams that are still in DB (JEE)
    const prefsResult = await db.query(
      'SELECT user_id, target_exams FROM user_exam_preferences WHERE target_exams IS NOT NULL AND array_length(target_exams, 1) > 0'
    );

    for (const row of prefsResult.rows) {
      const current = row.target_exams || [];
      const valid = Array.isArray(current) ? current.filter((id) => keepIds.has(id)) : [];
      if (valid.length !== current.length) {
        await db.query(
          'UPDATE user_exam_preferences SET target_exams = $1 WHERE user_id = $2',
          [valid.length > 0 ? valid : null, row.user_id]
        );
        console.log(`  Updated preferences for user ${row.user_id}: target_exams ${JSON.stringify(current)} -> ${JSON.stringify(valid)}`);
      }
    }

    console.log('Done. Only JEE exams remain in exams_taxonomies.');
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  } finally {
    if (db.pool) await db.pool.end();
    process.exit(0);
  }
}

main();
