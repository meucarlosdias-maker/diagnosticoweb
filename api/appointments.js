const { redis } = require('./_lib');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'GET') {
    try {
      const appointments = (await redis.get('appointments')) || [];
      return res.status(200).json({ appointments });
    } catch (e) {
      return res.status(200).json({ appointments: [] });
    }
  }

  if (req.method === 'POST') {
    try {
      const appointments = (await redis.get('appointments')) || [];
      const novo = {
        ...req.body,
        _id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        status: 'pending'
      };
      appointments.push(novo);
      await redis.set('appointments', appointments);
      console.log('[APPT] Saved:', novo._id, novo.companyName);
      return res.status(200).json({ success: true, appointment: novo });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
