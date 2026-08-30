const { getRedis } = require('./_lib');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'GET') {
    try {
      const redis = getRedis();
      const diagnostics = (await redis.get('diagnostics')) || [];
      return res.status(200).json({ diagnostics });
    } catch (e) {
      console.error('[DIAG] GET error:', e.message);
      return res.status(200).json({ diagnostics: [], error: e.message });
    }
  }

  if (req.method === 'POST') {
    try {
      const redis = getRedis();
      const diagnostics = (await redis.get('diagnostics')) || [];
      const novo = {
        ...req.body,
        _id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        status: 'pending',
        sentVia: 'none',
        followUpSent: false,
        notes: ''
      };
      diagnostics.push(novo);
      await redis.set('diagnostics', diagnostics);
      console.log('[DIAG] Saved:', novo._id, novo.companyName);
      return res.status(200).json({ success: true, id: novo._id });
    } catch (e) {
      console.error('[DIAG] POST error:', e.message);
      return res.status(500).json({ error: e.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
