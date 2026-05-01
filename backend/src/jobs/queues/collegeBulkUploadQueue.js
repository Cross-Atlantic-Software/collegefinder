let collegeBulkUploadQueue = null;

const QUEUE_NAME = 'college-bulk-upload';

function getCollegeBulkUploadQueue() {
  if (!collegeBulkUploadQueue) {
    const { Queue } = require('bullmq');
    const { getRedisConnection } = require('../redisConnection');
    collegeBulkUploadQueue = new Queue(QUEUE_NAME, {
      connection: getRedisConnection(),
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: { count: 200 },
        removeOnFail: { count: 200 },
      },
    });
    collegeBulkUploadQueue.on('error', (err) => {
      console.error('❌ collegeBulkUploadQueue error:', err.message);
    });
  }
  return collegeBulkUploadQueue;
}

async function enqueueCollegeBulkUploadJob(uploadJobId) {
  const id = parseInt(uploadJobId, 10);
  const queue = getCollegeBulkUploadQueue();
  const jobId = `college-bulk-${id}`;
  try {
    return await queue.add('process-bulk', { uploadJobId: id }, { jobId });
  } catch (e) {
    if (String(e.message || '').includes('already exists') || e.code === 'DUPLICATE') {
      console.log(`[college-bulk] job ${id} already in queue`);
      return null;
    }
    throw e;
  }
}

async function recoverCollegeBulkUploadJobs() {
  const UploadJob = require('../../models/UploadJob');
  const staleMinutes = parseInt(process.env.COLLEGE_BULK_STALE_MINUTES || '15', 10);
  const rows = await UploadJob.findPendingOrStaleProcessing('colleges', staleMinutes);
  if (rows.length === 0) return { recovered: 0 };
  let recovered = 0;
  for (const j of rows) {
    try {
      await enqueueCollegeBulkUploadJob(j.id);
      recovered += 1;
      console.log(`🔄 [college-bulk] re-queued upload job ${j.id} (status was ${j.status})`);
    } catch (e) {
      console.error(`❌ [college-bulk] failed to re-queue job ${j.id}:`, e.message);
    }
  }
  return { recovered };
}

module.exports = {
  QUEUE_NAME,
  getCollegeBulkUploadQueue,
  enqueueCollegeBulkUploadJob,
  recoverCollegeBulkUploadJobs,
};
