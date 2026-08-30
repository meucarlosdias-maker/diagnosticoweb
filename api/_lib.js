let redis = null;

function getRedis() {
  if (redis) return redis;
  const { Redis } = require('@upstash/redis');
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token || url === 'placeholder') {
    throw new Error('UPSTASH_REDIS_REST_URL e UPSTASH_REDIS_REST_TOKEN não configurados');
  }
  redis = new Redis({ url, token });
  return redis;
}

module.exports = { getRedis };
