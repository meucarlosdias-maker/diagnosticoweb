import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    switch (req.method) {
      case 'GET': {
        const diagnostics = (await kv.get('diagnostics')) || [];
        return res.status(200).json({ diagnostics });
      }

      case 'POST': {
        const diagnostics = (await kv.get('diagnostics')) || [];
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
        await kv.set('diagnostics', diagnostics);
        return res.status(200).json({ success: true, id: novo._id });
      }

      case 'PUT': {
        const { id } = req.query;
        const diagnostics = (await kv.get('diagnostics')) || [];
        const idx = diagnostics.findIndex(d => d._id === id);
        if (idx === -1) return res.status(404).json({ error: 'Not found' });
        diagnostics[idx] = { ...diagnostics[idx], ...req.body, updatedAt: new Date().toISOString() };
        await kv.set('diagnostics', diagnostics);
        return res.status(200).json({ success: true });
      }

      case 'DELETE': {
        const { id } = req.query;
        let diagnostics = (await kv.get('diagnostics')) || [];
        diagnostics = diagnostics.filter(d => d._id !== id);
        await kv.set('diagnostics', diagnostics);
        return res.status(200).json({ success: true });
      }

      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (err) {
    console.error('Diagnostics API error:', err);
    return res.status(500).json({ error: err.message });
  }
}