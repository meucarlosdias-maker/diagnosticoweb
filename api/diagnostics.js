const DEFAULT_TEMPLATES = [
  {
    _id: '1', name: 'Follow-up Alto Impacto', category: 'automacao', triggerKeyword: 'Automatizar',
    emailSubject: '{companyName}: Oportunidade de automacao identificada',
    emailBody: '<p>Ola {name},</p><p>Realizamos um diagnostico digital completo da <strong>{companyName}</strong> e identificamos uma oportunidade significativa.</p><p><strong>Oportunidade:</strong> {actionTitle}</p><p><strong>ROI esperado:</strong> {actionROI}</p><p>Podemos agendar 15 minutos?</p><p>Abs,<br><strong>Agencia Global</strong></p>',
    whatsappTemplate: 'Ola {name}! Fizemos um diagnostico da {companyName} e encontramos uma oportunidade:\n\n*{actionTitle}*\nROI: {actionROI}\n\nPosso enviar mais detalhes?\n\nAbs, Agencia Global',
    priority: 'high', usedCount: 0
  },
  {
    _id: '2', name: 'Melhoria de SEO', category: 'seo', triggerKeyword: 'schema.org',
    emailSubject: '{companyName}: Oportunidades de SEO',
    emailBody: '<p>Ola {name},</p><p>No diagnostico da <strong>{companyName}</strong>, identificamos pontos de melhoria em SEO.</p><p><strong>Oportunidade:</strong> {actionTitle}</p><p><strong>ROI:</strong> {actionROI}</p><p>Quer saber como implementar?</p><p>Abs,<br><strong>Agencia Global</strong></p>',
    whatsappTemplate: 'Oi {name}! Seu diagnostico da {companyName} apontou uma oportunidade de SEO:\n\n*{actionTitle}*\nROI: {actionROI}\n\nQuer saber como implementar?\n\nAbs, Agencia Global',
    priority: 'medium', usedCount: 0
  },
  {
    _id: '3', name: 'Engajamento Redes Sociais', category: 'social', triggerKeyword: 'Instagram',
    emailSubject: '{companyName}: Estrategia de engajamento',
    emailBody: '<p>Ola {name},</p><p>Analisamos a presenca digital da <strong>{companyName}</strong> e identificamos oportunidades de engajamento.</p><p><strong>Oportunidade:</strong> {actionTitle}</p><p><strong>ROI:</strong> {actionROI}</p><p>Posso compartilhar estrategias?</p><p>Abs,<br><strong>Agencia Global</strong></p>',
    whatsappTemplate: 'Ola {name}! O diagnostico da {companyName} mostrou oportunidades no Instagram:\n\n*{actionTitle}*\nROI: {actionROI}\n\nQuer dicas praticas?\n\nAbs, Agencia Global',
    priority: 'medium', usedCount: 0
  },
  {
    _id: '4', name: 'Seguidor Padrao', category: 'geral', triggerKeyword: 'acao',
    emailSubject: 'Diagnostico Digital - {companyName}',
    emailBody: '<p>Ola {name},</p><p>Concluimos o diagnostico digital da <strong>{companyName}</strong> e seu score foi <strong>{score}/100</strong>.</p><p>Identificamos <strong>{totalActions}</strong> oportunidades prioritarias.</p><p>Quer que eu apresente um plano de acao?</p><p>Abs,<br><strong>Agencia Global</strong></p>',
    whatsappTemplate: 'Ola {name}! Seu diagnostico da {companyName} ficou pronto!\n\nScore: {score}/100\n{totalActions} acoes prioritarias\n\nPosso enviar o relatorio completo?\n\nAbs, Agencia Global',
    priority: 'low', usedCount: 0
  }
];

let diagnosticsStore = [];
let templatesStore = [...DEFAULT_TEMPLATES];

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const url = new URL(req.url, `https://${req.headers.host}`);
  const pathParts = url.pathname.split('/').filter(Boolean);
  const id = pathParts[2] || null;

  try {
    switch (req.method) {
      case 'GET': {
        return res.status(200).json({ diagnostics: diagnosticsStore });
      }

      case 'POST': {
        const novo = {
          ...req.body,
          _id: Date.now().toString(),
          createdAt: new Date().toISOString(),
          status: 'pending',
          sentVia: 'none',
          followUpSent: false,
          notes: ''
        };
        diagnosticsStore.push(novo);
        return res.status(200).json({ success: true, id: novo._id });
      }

      case 'PUT': {
        if (!id) return res.status(400).json({ error: 'Missing id' });
        const idx = diagnosticsStore.findIndex(d => d._id === id);
        if (idx === -1) return res.status(404).json({ error: 'Not found' });
        diagnosticsStore[idx] = { ...diagnosticsStore[idx], ...req.body, updatedAt: new Date().toISOString() };
        return res.status(200).json({ success: true });
      }

      case 'DELETE': {
        if (!id) return res.status(400).json({ error: 'Missing id' });
        diagnosticsStore = diagnosticsStore.filter(d => d._id !== id);
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