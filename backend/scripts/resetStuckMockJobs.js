/**
 * Clear stuck mock generation jobs and reset exam_mocks rows stuck in generating/failed.
 * Usage: node scripts/resetStuckMockJobs.js
 */
require('dotenv').config();
const db = require('../src/config/database');

async function clearBullMqJobs() {
  try {
    const { getMockGenerationQueue } = require('../src/jobs/queues/mockGenerationQueue');
    const queue = getMockGenerationQueue();
    const jobs = await queue.getJobs(['active', 'waiting', 'delayed', 'failed']);
    for (const job of jobs) {
      await job.remove().catch(() => {});
    }
    console.log(`🧹 Removed ${jobs.length} mock-generation queue job(s)`);
  } catch (err) {
    console.warn('⚠️  Could not clear BullMQ jobs:', err.message);
  }
}

async function resetMocks() {
  const delLinks = await db.query('DELETE FROM exam_mock_questions');
  console.log(`🧹 Cleared ${delLinks.rowCount} exam_mock_questions row(s)`);

  const delMocks = await db.query('DELETE FROM exam_mocks');
  console.log(`🧹 Cleared ${delMocks.rowCount} exam_mocks row(s)`);

  await db.query('UPDATE exams_taxonomies SET total_mocks_generated = 0');
  console.log('🔄 Reset total_mocks_generated on all exams');
}

async function main() {
  await clearBullMqJobs();
  await resetMocks();
  console.log('\n✅ Mock generation state reset. Pick an exam in Mock Test to generate Mock 1.');
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
