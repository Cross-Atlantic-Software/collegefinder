const crypto = require('crypto');

const TTL_SECONDS = parseInt(process.env.DASHBOARD_SCHOLARSHIP_SORT_CACHE_TTL || '600', 10);
const KEY_PREFIX = 'dashboard:scholarships:sorted';
const memoryStore = new Map();

function getRedisSafe() {
  try {
    const { getRedisConnection } = require('../jobs/redisConnection');
    return getRedisConnection();
  } catch {
    return null;
  }
}

function buildContextHash(ctx) {
  const payload = {
    streamId: ctx.streamId,
    allExamIds: [...(ctx.allExamIds || [])].sort((a, b) => a - b),
    allCollegeIds: [...(ctx.allCollegeIds || [])].sort((a, b) => a - b),
    recommendedExamIds: [...(ctx.recommendedExamIds || [])].sort((a, b) => a - b),
    shortlistedExamIds: [...(ctx.shortlistedExamIds || [])].sort((a, b) => a - b),
    recommendedCollegeIds: [...(ctx.recommendedCollegeIds || [])].sort((a, b) => a - b),
    shortlistedCollegeIds: [...(ctx.shortlistedCollegeIds || [])].sort((a, b) => a - b),
    shortlistedScholarshipIds: [...(ctx.shortlistedScholarshipIds || [])].sort((a, b) => a - b),
    userCity: ctx.userCity || '',
  };
  return crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex').slice(0, 24);
}

function cacheKey(userId, tab, ctx) {
  return `${KEY_PREFIX}:u${userId}:t${tab}:h${buildContextHash(ctx)}`;
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

async function getCachedSortedScholarshipIds(userId, tab, ctx) {
  const key = cacheKey(userId, tab, ctx);
  const redis = getRedisSafe();
  if (redis) {
    try {
      const raw = await redis.get(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (err) {
      console.warn('Scholarship sort cache read failed:', err.message);
    }
  }
  return memoryGet(key);
}

async function setCachedSortedScholarshipIds(userId, tab, ctx, scholarshipIds) {
  const key = cacheKey(userId, tab, ctx);
  const payload = JSON.stringify(scholarshipIds);
  const redis = getRedisSafe();
  if (redis) {
    try {
      await redis.setex(key, TTL_SECONDS, payload);
    } catch (err) {
      console.warn('Scholarship sort cache write failed:', err.message);
    }
  }
  memorySet(key, scholarshipIds, TTL_SECONDS);
}

async function invalidateDashboardScholarshipSortCacheForUser(userId) {
  const uid = String(userId);
  const redis = getRedisSafe();
  if (redis) {
    try {
      const pattern = `${KEY_PREFIX}:u${uid}:*`;
      let cursor = '0';
      do {
        const [next, keys] = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
        cursor = next;
        if (keys.length) await redis.del(...keys);
      } while (cursor !== '0');
    } catch (err) {
      console.warn('Scholarship sort cache invalidate failed:', err.message);
    }
  }
  for (const key of [...memoryStore.keys()]) {
    if (key.includes(`:u${uid}:`)) memoryStore.delete(key);
  }
}

module.exports = {
  getCachedSortedScholarshipIds,
  setCachedSortedScholarshipIds,
  invalidateDashboardScholarshipSortCacheForUser,
};
