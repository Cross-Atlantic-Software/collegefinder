/**
 * Initialise all background job workers.
 * Called once at server startup (after DB is ready).
 * Workers require bullmq/ioredis; if missing (e.g. old Docker image), we skip without crashing.
 */
async function initJobs() {
  try {
    const { startMockGenerationWorker } = require('./workers/mockGenerationWorker');
    const { startLectureHookSummaryWorker } = require('./workers/lectureHookSummaryWorker');
    startMockGenerationWorker();
    startLectureHookSummaryWorker();
    console.log('✅ Background job workers started');

    // Recover any stuck/lost mock generation (e.g. after backend restart)
    const { runRecovery } = require('./recovery/recoverStuckMockGeneration');
    runRecovery().catch((err) => console.error('❌ Recovery failed:', err.message));
  } catch (err) {
    if (err.code === 'MODULE_NOT_FOUND') {
      console.warn('⚠️  Background job workers skipped (bullmq/redis not installed or not available). Run: npm install bullmq ioredis');
    } else {
      console.error('❌ Failed to start background job workers:', err.message);
    }
  }
}

module.exports = { initJobs };
