const { redis } = require('../_lib');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const id = req.query.id;

  if (req.method === 'PUT') {
    try {
      const appointments = (await redis.get('appointments')) || [];
      const idx = appointments.findIndex(a => a._id === id);
      if (idx === -1) return res.status(404).json({ error: 'Agendamento não encontrado' });
      appointments[idx] = { ...appointments[idx], ...req.body };
      await redis.set('appointments', appointments);
      return res.status(200).json({ success: true });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  if (req.method === 'DELETE') {
    try {
      let appointments = (await redis.get('appointments')) || [];
      appointments = appointments.filter(a => a._id !== id);
      await redis.set('appointments', appointments);
      return res.status(200).json({ success: true });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
