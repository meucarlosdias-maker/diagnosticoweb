const { getRedis } = require('../_lib');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const id = req.query.id;

  if (req.method === 'PUT') {
    try {
      const redis = getRedis();
      const templates = (await redis.get('templates')) || [];
      const idx = templates.findIndex(t => t._id === id);
      if (idx === -1) return res.status(404).json({ error: 'Template não encontrado' });
      templates[idx] = { ...templates[idx], ...req.body };
      await redis.set('templates', templates);
      return res.status(200).json({ success: true });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
