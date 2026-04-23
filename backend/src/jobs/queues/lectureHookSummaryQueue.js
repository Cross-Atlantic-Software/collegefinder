let lectureHookSummaryQueue = null;

function getLectureHookSummaryQueue() {
  if (!lectureHookSummaryQueue) {
    const { Queue } = require('bullmq');
    const { getRedisConnection } = require('../redisConnection');
    lectureHookSummaryQueue = new Queue('lecture-hook-summary', {
      connection: getRedisConnection(),
      defaultJobOptions: {
        attempts: 5,
        backoff: {
          type: 'exponential',
          delay: 3000,
        },
        removeOnComplete: { count: 500 },
        removeOnFail: { count: 500 },
      },
    });

    lectureHookSummaryQueue.on('error', (err) => {
      console.error('❌ lectureHookSummaryQueue error:', err.message);
    });
  }

  return lectureHookSummaryQueue;
}

async function enqueueLectureHookSummary(lectureId, { force = false } = {}) {
  const id = parseInt(lectureId, 10);
  if (Number.isNaN(id) || id <= 0) {
    throw new Error('Invalid lectureId for hook summary queue');
  }

  const queue = getLectureHookSummaryQueue();
  // BullMQ custom job id cannot contain ":" in this environment.
  const baseJobId = `lecture-hook-summary-${id}`;
  const jobId = force ? `${baseJobId}-${Date.now()}` : baseJobId;
  return queue.add(
    'generate-lecture-hook-summary',
    { lectureId: id },
    {
      jobId,
    }
  );
}

/**
 * Enqueue a hook summary job for a lecture that still needs one, without forcing duplicates.
 * Re-adds when the previous job finished/failed so retries are possible after DB changes.
 *
 * @returns {{ kind: 'queued', job: import('bullmq').Job } | { kind: 'skipped', reason: string, job?: import('bullmq').Job }}
 */
async function enqueueLectureHookSummaryIfPending(lectureId) {
  const id = parseInt(lectureId, 10);
  if (Number.isNaN(id) || id <= 0) {
    throw new Error('Invalid lectureId for hook summary queue');
  }

  const queue = getLectureHookSummaryQueue();
  const baseJobId = `lecture-hook-summary-${id}`;
  const existing = await queue.getJob(baseJobId);

  if (existing) {
    const state = await existing.getState();
    if (state === 'waiting' || state === 'active' || state === 'delayed' || state === 'paused') {
      return { kind: 'skipped', reason: `job_${state}`, job: existing };
    }
    if (state === 'completed' || state === 'failed') {
      try {
        await existing.remove();
      } catch (removeErr) {
        console.warn(`Could not remove prior hook summary job ${baseJobId}:`, removeErr.message || removeErr);
      }
    }
  }

  const job = await queue.add(
    'generate-lecture-hook-summary',
    { lectureId: id },
    { jobId: baseJobId }
  );
  return { kind: 'queued', job };
}

module.exports = {
  getLectureHookSummaryQueue,
  enqueueLectureHookSummary,
  enqueueLectureHookSummaryIfPending,
};
