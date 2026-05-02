let lectureBulkUploadQueue = null;

const QUEUE_NAME = 'lecture-bulk-upload';

function getLectureBulkUploadQueue() {
  if (!lectureBulkUploadQueue) {
    const { Queue } = require('bullmq');
    const { getRedisConnection } = require('../redisConnection');
    lectureBulkUploadQueue = new Queue(QUEUE_NAME, {
      connection: getRedisConnection(),
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: { count: 200 },
        removeOnFail: { count: 200 },
      },
    });
    lectureBulkUploadQueue.on('error', (err) => {
      console.error('❌ lectureBulkUploadQueue error:', err.message);
    });
  }
  return lectureBulkUploadQueue;
}

/**
 * One BullMQ job id per upload DB row — avoids duplicate workers for the same job.
 */
async function enqueueLectureBulkUploadJob(uploadJobId) {
  const id = parseInt(uploadJobId, 10);
  const queue = getLectureBulkUploadQueue();
  const jobId = `lecture-bulk-${id}`;
  try {
    return await queue.add('process-bulk', { uploadJobId: id }, { jobId });
  } catch (e) {
    if (String(e.message || '').includes('already exists') || e.code === 'DUPLICATE') {
      console.log(`[lecture-bulk] job ${id} already in queue`);
      return null;
    }
    throw e;
  }
}

/**
 * Re-queue jobs that were pending or left in processing (e.g. after server restart).
 */
async function recoverLectureBulkUploadJobs() {
  const UploadJob = require('../../models/UploadJob');
  const staleMinutes = parseInt(process.env.LECTURE_BULK_STALE_MINUTES || '15', 10);
  const rows = await UploadJob.findPendingOrStaleProcessing('lectures', staleMinutes);
  if (rows.length === 0) return { recovered: 0 };
  let recovered = 0;
  for (const j of rows) {
    try {
      await enqueueLectureBulkUploadJob(j.id);
      recovered += 1;
      console.log(`🔄 [lecture-bulk] re-queued upload job ${j.id} (status was ${j.status})`);
    } catch (e) {
      console.error(`❌ [lecture-bulk] failed to re-queue job ${j.id}:`, e.message);
    }
  }
  return { recovered };
}

module.exports = {
  QUEUE_NAME,
  getLectureBulkUploadQueue,
  enqueueLectureBulkUploadJob,
  recoverLectureBulkUploadJobs,
};
