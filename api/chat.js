export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const AI_API_KEY = process.env.NVIDIA_API_KEY || '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';
  const AI_URL = 'https://integrate.api.nvidia.com/v1/chat/completions';

  try {
    const response = await fetch(AI_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AI_API_KEY}`
      },
      body: JSON.stringify(req.body)
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('NVIDIA API error:', data);
      return res.status(response.status).json(data);
    }

    return res.status(200).json(data);
  } catch (err) {
    console.error('Chat API error:', err);
    return res.status(500).json({ error: err.message });
  }
}