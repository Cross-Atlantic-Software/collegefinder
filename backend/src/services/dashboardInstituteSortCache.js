const crypto = require('crypto');

const TTL_SECONDS = parseInt(process.env.DASHBOARD_INSTITUTE_SORT_CACHE_TTL || '600', 10);
const KEY_PREFIX = 'dashboard:institutes:sorted';
const memoryStore = new Map();

function getRedisSafe() {
  try {
    const { getRedisConnection } = require('../jobs/redisConnection');
    return getRedisConnection();
  } catch {
    return null;
  }
}

function buildContextHash(ctx, delivery) {
  const payload = {
    delivery,
    streamId: ctx.streamId,
    poolExamIds: [...(ctx.poolExamIds || [])].sort((a, b) => a - b),
    formFilledExamIds: [...(ctx.formFilledExamIds || [])].sort((a, b) => a - b),
    recommendedExamIds: [...(ctx.recommendedExamIds || [])].sort((a, b) => a - b),
    shortlistedExamIds: [...(ctx.shortlistedExamIds || [])].sort((a, b) => a - b),
    userCity: ctx.userCity || '',
  };
  return crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex').slice(0, 24);
}

function cacheKey(userId, delivery, ctx) {
  return `${KEY_PREFIX}:u${userId}:d${delivery}:h${buildContextHash(ctx, delivery)}`;
}

function memoryGet(key) {
  const entry = memoryStore.get(key);
  if (!entry) return null;
  if (entry.expiresAt < Date.now()) {
    memoryStore.delete(key);
    return null;
  }
  return entry.value;
}

function memorySet(key, value, ttlSec) {
  memoryStore.set(key, {
    value,
    expiresAt: Date.now() + ttlSec * 1000,
  });
}

async function getCachedSortedInstituteIds(userId, delivery, ctx) {
  const key = cacheKey(userId, delivery, ctx);
  const redis = getRedisSafe();
  if (redis) {
    try {
      const raw = await redis.get(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (err) {
      console.warn('Institute sort cache read failed:', err.message);
    }
  }
  return memoryGet(key);
}

async function setCachedSortedInstituteIds(userId, delivery, ctx, instituteIds) {
  const key = cacheKey(userId, delivery, ctx);
  const payload = JSON.stringify(instituteIds);
  const redis = getRedisSafe();
  if (redis) {
    try {
      await redis.setex(key, TTL_SECONDS, payload);
    } catch (err) {
      console.warn('Institute sort cache write failed:', err.message);
    }
  }
  memorySet(key, instituteIds, TTL_SECONDS);
}

module.exports = {
  getCachedSortedInstituteIds,
  setCachedSortedInstituteIds,
};
