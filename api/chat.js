const AI_API_KEY = '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';
const NVIDIA_URL = 'https://integrate.api.nvidia.com/v1/chat/completions';

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const MAX_RETRIES = 2;
  const TIMEOUT_MS = 250000;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

      console.log(`[API] Chat attempt ${attempt}/${MAX_RETRIES}, model: ${req.body.model}`);

      const response = await fetch(NVIDIA_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${AI_API_KEY}`
        },
        body: JSON.stringify(req.body),
        signal: controller.signal
      });

      clearTimeout(timer);

      if (!response.ok) {
        const errText = await response.text().catch(() => '');
        console.error(`[API] NVIDIA error ${response.status}: ${errText.slice(0, 200)}`);
        if (response.status === 429 && attempt < MAX_RETRIES) {
          console.log(`[API] Rate limited, waiting 3s before retry...`);
          await new Promise(r => setTimeout(r, 3000));
          continue;
        }
        return res.status(response.status).json({ error: `NVIDIA API error: ${response.status}` });
      }

      const data = await response.json();
      console.log(`[API] Chat success, tokens: ${data.usage?.total_tokens || '?'}`);
      return res.status(200).json(data);
    } catch (error) {
      console.error(`[API] Chat attempt ${attempt} error:`, error.message);
      if (error.name === 'AbortError' && attempt < MAX_RETRIES) {
        console.log(`[API] Timeout on attempt ${attempt}, retrying...`);
        continue;
      }
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(504).json({ error: 'AI API timeout after retries' });
};
