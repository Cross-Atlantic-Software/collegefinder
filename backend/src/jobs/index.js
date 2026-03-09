const { startMockGenerationWorker } = require('./workers/mockGenerationWorker');

/**
 * Initialise all background job workers.
 * Called once at server startup (after DB is ready).
 */
function initJobs() {
  try {
    startMockGenerationWorker();
    console.log('✅ Background job workers started');
  } catch (err) {
    console.error('❌ Failed to start background job workers:', err.message);
  }
}

module.exports = { initJobs };
