const AI_API_KEY = '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';

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { auditResult, formData } = req.body;

    const PROSPECTION_PROMPT = `Você é o **Estrategista Comercial da BACY Agência**. Todo o seu atendimento e comunicação deve ser feito em Português do Brasil.

## Catálogo de soluções da BACY:
1. **Leadly** — atendimento via WhatsApp com IA, automação de respostas, qualificação de leads, agendamento, follow-up automático, CRM básico
2. **Criação/reforma de site** — sites institucionais ou landing pages otimizadas, focadas em conversão e SEO
3. **Gestão de Google Meu Negócio** — otimização de perfil, categoria, fotos, respostas a avaliações
4. **Gestão de redes sociais** — produção de conteúdo, calendário editorial, consistência de marca
5. **Gestão de reputação** — monitoramento e resposta a avaliações, captação de reviews positivos
6. **Gestão de mídia paga** — Google Ads / Meta Ads, estruturação de campanhas, pixel, funil
7. **Automação e integrações (n8n)** — fluxos personalizados além do Leadly

## Regras:
- Priorize soluções do catálogo atual
- Se nenhuma resolver bem, proponha novo serviço como "oportunidade de expansão"
- Ancore toda recomendação num achado real da auditoria
- Seja direto e comercial — relatório interno
- Não invente preços — use faixas (entrada/intermediário/avançado)

## Formato de saída (JSON válido, sem markdown):
{
  "diagnosis": "resumo de 3-4 linhas puxando achados mais relevantes",
  "primaryPain": { "finding": "...", "impact": "...", "solution": "..." },
  "secondaryPains": [{ "finding": "...", "impact": "...", "solution": "..." }],
  "openingHook": "frase pronta para usar na abordagem",
  "approachChannel": "canal recomendado",
  "approachTone": "tom",
  "approachJustification": "justificativa",
  "commercialOffer": { "entrySolution": "...", "upsellNatural": "...", "packageRange": "..." },
  "objections": [{ "objection": "...", "response": "..." }],
  "firstMessageScript": "roteiro de 3-5 frases pronto para copiar/colar",
  "newServiceOpportunities": [{ "realPain": "...", "whatItWouldDo": "...", "viability": "...", "scalable": "...", "name": "...", "priceRange": "..." }]
}`;

    const f = auditResult.findings || {};
    const plan = auditResult.actionPlan || {};
    const comp = auditResult.competitorAnalysis || {};

    const userPrompt = `Gere uma estratégia de prospecção completa baseada na auditoria abaixo.

DADOS DA EMPRESA:
- Nome: ${formData.companyName}
- Segmento: ${formData.segment || 'Não informado'}
- Site: ${formData.websiteUrl || 'Não informado'}
- Instagram: ${formData.instagramUrl || 'Não informado'}
- Score geral: ${auditResult.overallScore}/100

RESUMO DA AUDITORIA:
${auditResult.expertSummary || 'Não disponível'}

ACHADOS POR CATEGORIA:
1. SITE (${f.site?.status || 'N/A'}): Evidência: ${f.site?.evidence || 'N/A'} | Risco: ${f.site?.risk || 'N/A'} | Ação: ${f.site?.action || 'N/A'}
2. SEO (${f.seo?.status || 'N/A'}): Evidência: ${f.seo?.evidence || 'N/A'} | Risco: ${f.seo?.risk || 'N/A'} | Ação: ${f.seo?.action || 'N/A'}
3. GMB (${f.gmb?.status || 'N/A'}): Evidência: ${f.gmb?.evidence || 'N/A'} | Risco: ${f.gmb?.risk || 'N/A'} | Ação: ${f.gmb?.action || 'N/A'}
4. SOCIAL (${f.socialMedia?.status || 'N/A'}): Evidência: ${f.socialMedia?.evidence || 'N/A'} | Risco: ${f.socialMedia?.risk || 'N/A'} | Ação: ${f.socialMedia?.action || 'N/A'}
5. REPUTAÇÃO (${f.reputation?.status || 'N/A'}): Evidência: ${f.reputation?.evidence || 'N/A'} | Risco: ${f.reputation?.risk || 'N/A'} | Ação: ${f.reputation?.action || 'N/A'}
6. CONCORRÊNCIA: ${comp.competitors?.join(', ') || 'N/A'} — ${comp.whatTheyDoBetter || 'N/A'} — Gap: ${comp.identifiedGap || 'N/A'}
7. PUBLICIDADE: ${auditResult.paidAds?.status || 'N/A'} — ${auditResult.paidAds?.evidence || 'N/A'}

PLANO DE AÇÃO: Agora: ${plan.now?.join('; ') || 'N/A'} | Médio: ${plan.shortTerm?.join('; ') || 'N/A'} | Estratégico: ${plan.strategic?.join('; ') || 'N/A'}
ONDE A BACY AJUDA: ${auditResult.whereWeCanHelp || 'Não disponível'}

Gere a estratégia seguindo o formato JSON do sistema.`;

    const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'moonshotai/kimi-k3',
        messages: [
          { role: 'system', content: PROSPECTION_PROMPT },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.4,
        max_tokens: 10000
      })
    });

    const data = await response.json();
    let content = data.choices[0]?.message?.content || data.choices[0]?.message?.reasoning_content || '{}';
    content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    try {
      return res.status(200).json(JSON.parse(content));
    } catch (e) {
      return res.status(200).json({ rawText: content });
    }
  } catch (err) {
    console.error('[PROSPECT] Error:', err.message);
    return res.status(500).json({ error: err.message });
  }
};
