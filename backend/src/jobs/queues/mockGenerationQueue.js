const { Queue } = require('bullmq');
const { getRedisConnection } = require('../redisConnection');

let mockGenerationQueue = null;

/**
 * Returns the singleton BullMQ Queue for mock generation.
 * Lazily initialised so the server can start even if Redis is temporarily unavailable.
 */
function getMockGenerationQueue() {
  if (!mockGenerationQueue) {
    mockGenerationQueue = new Queue('mock-generation', {
      connection: getRedisConnection(),
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000, // 5s, 10s, 20s
        },
        removeOnComplete: { count: 100 },
        removeOnFail: { count: 50 },
      },
    });

    mockGenerationQueue.on('error', (err) => {
      console.error('❌ mockGenerationQueue error:', err.message);
    });
  }

  return mockGenerationQueue;
}

module.exports = { getMockGenerationQueue };
