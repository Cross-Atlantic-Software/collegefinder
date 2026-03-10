/**
 * Mock generation worker: BullMQ worker and sync runner.
 * BullMQ is required lazily in startMockGenerationWorker so this module can be loaded
 * (and runMockGenerationSync used) when bullmq is not installed (e.g. in Docker).
 */
const { QUEUE_NAME } = require('./config');
const { processMockGeneration, handleFailed } = require('./processJob');

function startMockGenerationWorker() {
  const { Worker } = require('bullmq');
  const { getRedisConnection } = require('../redisConnection');
  const worker = new Worker(QUEUE_NAME, processMockGeneration, {
    connection: getRedisConnection(),
    concurrency: 2,
  });

  worker.on('completed', (job) => {
    console.log(`✅ [Worker] Job ${job.id} completed (mock generation)`);
  });

  worker.on('failed', handleFailed);

  worker.on('error', (err) => {
    console.error('❌ [Worker] mockGenerationWorker error:', err.message);
  });

  console.log('🟢 mockGenerationWorker started');
  return worker;
}

/**
 * Run mock generation inline (e.g. from seed script or API).
 * Same logic as the BullMQ job processor. jobData = { examId, mockNumber, mockTestId }.
 */
async function runMockGenerationSync(jobData) {
  return processMockGeneration({ data: jobData });
}

module.exports = { startMockGenerationWorker, runMockGenerationSync };
