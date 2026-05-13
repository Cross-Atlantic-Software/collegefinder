const { generateAndPersistLectureHookSummary } = require('../../../utils/lectureHookSummary');

let _worker = null;
let _queue = null;
let _pauseRequested = false;

function isHookSummaryWorkerCancelled() {
  return _pauseRequested;
}

async function processLectureHookSummary(job) {
  if (_pauseRequested) {
    throw new Error('Worker paused — job will be retried after resume');
  }

  const lectureId = parseInt(job?.data?.lectureId, 10);
  if (Number.isNaN(lectureId) || lectureId <= 0) {
    throw new Error('Invalid lectureId in lecture hook summary job');
  }

  await generateAndPersistLectureHookSummary(lectureId, isHookSummaryWorkerCancelled);
  return { lectureId };
}

function startLectureHookSummaryWorker() {
  const { Worker, Queue } = require('bullmq');
  const { getRedisConnection } = require('../../redisConnection');

  _queue = new Queue('lecture-hook-summary', { connection: getRedisConnection() });

  const worker = new Worker('lecture-hook-summary', processLectureHookSummary, {
    connection: getRedisConnection(),
    concurrency: 1,
    lockDuration: 300000,
    stalledInterval: 60000,
    maxStalledCount: 3,
  });

  worker.on('completed', (job, result) => {
    console.log(`✅ [Worker] lecture hook summary completed for lecture ${result?.lectureId || job?.data?.lectureId}`);
  });

  worker.on('failed', (job, err) => {
    if (_pauseRequested && err.message.includes('Worker paused')) {
      console.log(`⏸️ [Worker] job ${job?.id} deferred (worker paused)`);
    } else {
      console.error(`❌ [Worker] lecture hook summary failed (job ${job?.id}):`, err.message);
    }
  });

  worker.on('error', (err) => {
    console.error('❌ [Worker] lectureHookSummaryWorker error:', err.message);
  });

  _worker = worker;
  console.log('🟢 lectureHookSummaryWorker started');
  return worker;
}

async function pauseLectureHookSummaryWorker() {
  if (!_worker) return { success: false, message: 'Worker not started' };
  _pauseRequested = true;
  await _worker.pause(true);
  if (_queue) await _queue.pause();
  console.log('⏸️  lectureHookSummaryWorker paused');
  return { success: true, paused: true };
}

async function resumeLectureHookSummaryWorker() {
  if (!_worker) return { success: false, message: 'Worker not started' };
  _pauseRequested = false;
  _worker.resume();
  if (_queue) await _queue.resume();
  console.log('▶️  lectureHookSummaryWorker resumed');
  return { success: true, paused: false };
}

function isLectureHookSummaryWorkerPaused() {
  return _pauseRequested;
}

module.exports = {
  startLectureHookSummaryWorker,
  pauseLectureHookSummaryWorker,
  resumeLectureHookSummaryWorker,
  isLectureHookSummaryWorkerPaused,
};
