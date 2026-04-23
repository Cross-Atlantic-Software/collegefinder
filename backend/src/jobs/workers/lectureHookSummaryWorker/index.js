const { generateAndPersistLectureHookSummary } = require('../../../utils/lectureHookSummary');

async function processLectureHookSummary(job) {
  const lectureId = parseInt(job?.data?.lectureId, 10);
  if (Number.isNaN(lectureId) || lectureId <= 0) {
    throw new Error('Invalid lectureId in lecture hook summary job');
  }

  await generateAndPersistLectureHookSummary(lectureId);
  return { lectureId };
}

function startLectureHookSummaryWorker() {
  const { Worker } = require('bullmq');
  const { getRedisConnection } = require('../../redisConnection');

  const worker = new Worker('lecture-hook-summary', processLectureHookSummary, {
    connection: getRedisConnection(),
    concurrency: 2,
    lockDuration: 180000,
    stalledInterval: 30000,
    maxStalledCount: 5,
  });

  worker.on('completed', (job, result) => {
    console.log(`✅ [Worker] lecture hook summary completed for lecture ${result?.lectureId || job?.data?.lectureId}`);
  });

  worker.on('failed', (job, err) => {
    console.error(`❌ [Worker] lecture hook summary failed (job ${job?.id}):`, err.message);
  });

  worker.on('error', (err) => {
    console.error('❌ [Worker] lectureHookSummaryWorker error:', err.message);
  });

  console.log('🟢 lectureHookSummaryWorker started');
  return worker;
}

module.exports = {
  startLectureHookSummaryWorker,
};
