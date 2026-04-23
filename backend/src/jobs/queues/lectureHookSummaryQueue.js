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

module.exports = {
  getLectureHookSummaryQueue,
  enqueueLectureHookSummary,
};
