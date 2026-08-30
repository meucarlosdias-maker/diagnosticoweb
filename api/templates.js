const { getRedis } = require('./_lib');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'GET') {
    try {
      const redis = getRedis();
      const templates = (await redis.get('templates')) || [];
      return res.status(200).json({ templates });
    } catch (e) {
      return res.status(200).json({ templates: [], error: e.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
