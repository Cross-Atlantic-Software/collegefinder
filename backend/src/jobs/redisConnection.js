const { Redis } = require('ioredis');

let redisConnection = null;

/**
 * Returns a shared ioredis connection used by BullMQ queues and workers.
 * BullMQ requires that Queue and Worker share the same connection config (not instance).
 * We use maxRetriesPerRequest: null so BullMQ can block on commands indefinitely.
 */
function getRedisConnection() {
  if (!redisConnection) {
    redisConnection = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
      password: process.env.REDIS_PASSWORD || undefined,
      maxRetriesPerRequest: null, // Required by BullMQ
      enableReadyCheck: false,
      lazyConnect: true,
    });

    redisConnection.on('connect', () => {
      console.log('✅ Redis connected');
    });

    redisConnection.on('error', (err) => {
      console.error('❌ Redis connection error:', err.message);
    });
  }

  return redisConnection;
}

module.exports = { getRedisConnection };
