/**
 * Initialise all background job workers.
 * Called once at server startup (after DB is ready).
 * Workers require bullmq/ioredis; if missing (e.g. old Docker image), we skip without crashing.
 */
async function initJobs() {
  try {
    const { startMockGenerationWorker } = require('./workers/mockGenerationWorker');
    const { startLectureHookSummaryWorker } = require('./workers/lectureHookSummaryWorker');
    const { startLectureBulkUploadWorker } = require('./workers/lectureBulkUploadWorker');
    const { startCollegeBulkUploadWorker } = require('./workers/collegeBulkUploadWorker');
    const { recoverLectureBulkUploadJobs } = require('./queues/lectureBulkUploadQueue');
    const { recoverCollegeBulkUploadJobs } = require('./queues/collegeBulkUploadQueue');
    startMockGenerationWorker();
    startLectureHookSummaryWorker();
    startLectureBulkUploadWorker();
    startCollegeBulkUploadWorker();
    console.log('✅ Background job workers started');

    recoverLectureBulkUploadJobs()
      .then((r) => {
        if (r.recovered > 0) console.log(`✅ Re-queued ${r.recovered} lecture bulk upload job(s)`);
      })
      .catch((err) => console.error('❌ Lecture bulk upload recovery failed:', err.message));

    recoverCollegeBulkUploadJobs()
      .then((r) => {
        if (r.recovered > 0) console.log(`✅ Re-queued ${r.recovered} college bulk upload job(s)`);
      })
      .catch((err) => console.error('❌ College bulk upload recovery failed:', err.message));

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
