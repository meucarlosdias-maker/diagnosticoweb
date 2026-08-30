/**
 * AI Analysis Service — Agente BACY (Auditor de Presença Digital)
 * NVIDIA API Kimi k3 + CORS proxy para busca web
 */

const AI_API_KEY = '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';
const AI_BASE_URL = 'https://integrate.api.nvidia.com/v1';
const AI_MODEL = 'moonshotai/kimi-k3';

const API_BASE = window.location.origin;

const CORS_PROXIES = [
  'https://api.allorigins.win/raw?url=',
  'https://corsproxy.io/?url=',
  'https://api.codetabs.com/v1/proxy?quest='
];

/**
 * Fetch website content via CORS proxy
 */
async function fetchWebsiteContent(url) {
  for (const proxy of CORS_PROXIES) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);
      const resp = await fetch(proxy + encodeURIComponent(url), {
        signal: controller.signal,
        headers: { 'Accept': 'text/html' }
      });
      clearTimeout(timeout);
      if (resp.ok) {
        const html = await resp.text();
        return extractContent(html, url);
      }
    } catch (e) {
      continue;
    }
  }
  return null;
}

/**
 * Extract useful content from HTML
 */
function extractContent(html, url) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  const getMeta = (name) => {
    const el = doc.querySelector(`meta[name="${name}"], meta[property="${name}"]`);
    return el ? el.getAttribute('content') : null;
  };

  const title = doc.querySelector('title')?.textContent || '';
  const description = getMeta('description') || getMeta('og:description') || '';
  const keywords = getMeta('keywords') || '';
  const ogTitle = getMeta('og:title') || '';
  const ogImage = getMeta('og:image') || '';

  const h1s = [...doc.querySelectorAll('h1')].map(e => e.textContent.trim()).filter(Boolean).slice(0, 5);
  const h2s = [...doc.querySelectorAll('h2')].map(e => e.textContent.trim()).filter(Boolean).slice(0, 8);
  const navLinks = [...doc.querySelectorAll('nav a, header a')].map(e => e.textContent.trim()).filter(Boolean).slice(0, 15);
  const footerText = doc.querySelector('footer')?.textContent?.trim()?.slice(0, 500) || '';
  const bodyText = doc.querySelector('body')?.textContent?.replace(/\s+/g, ' ')?.trim()?.slice(0, 3000) || '';

  const hasSSL = url?.startsWith('https');
  const hasViewport = html.includes('viewport');
  const hasSchema = html.includes('application/ld+json');
  const scripts = [...doc.querySelectorAll('script[src]')].map(e => e.getAttribute('src')).filter(Boolean);
  const stylesheets = [...doc.querySelectorAll('link[rel="stylesheet"]')].map(e => e.getAttribute('href')).filter(Boolean);
  const images = [...doc.querySelectorAll('img')].map(e => ({
    alt: e.getAttribute('alt') || '',
    src: e.getAttribute('src') || ''
  })).slice(0, 10);

  const techIndicators = [];
  if (scripts.some(s => s.includes('wordpress') || s.includes('wp-content'))) techIndicators.push('WordPress');
  if (scripts.some(s => s.includes('shopify'))) techIndicators.push('Shopify');
  if (scripts.some(s => s.includes('wix'))) techIndicators.push('Wix');
  if (stylesheets.some(s => s.includes('bootstrap'))) techIndicators.push('Bootstrap');
  if (stylesheets.some(s => s.includes('tailwind'))) techIndicators.push('Tailwind CSS');
  if (scripts.some(s => s.includes('react') || s.includes('next'))) techIndicators.push('React/Next.js');
  if (scripts.some(s => s.includes('vue'))) techIndicators.push('Vue.js');
  if (scripts.some(s => s.includes('jquery'))) techIndicators.push('jQuery');
  if (scripts.some(s => s.includes('gtag') || s.includes('analytics'))) techIndicators.push('Google Analytics');
  if (scripts.some(s => s.includes('facebook') || s.includes('fbq'))) techIndicators.push('Facebook Pixel');
  if (scripts.some(s => s.includes('hotjar'))) techIndicators.push('Hotjar');
  if (scripts.some(s => s.includes('tidio'))) techIndicators.push('Tidio');

  const hasWhatsApp = html.includes('wa.me') || html.includes('whatsapp') || html.includes('api.whatsapp');
  const hasContactForm = html.includes('contato') || html.includes('contact') || html.includes('form');
  const hasPhone = html.includes('tel:') || html.includes('telefone');

  return {
    url, title, description, keywords, ogTitle, ogImage,
    h1s, h2s, navLinks, footerText, bodyText: bodyText.slice(0, 2000),
    hasSSL, hasViewport, hasSchema,
    techIndicators, scripts: scripts.length, stylesheets: stylesheets.length,
    images, hasWhatsApp, hasContactForm, hasPhone
  };
}

/**
 * Main AI Analysis — Agente BACY
 */
export async function analyzeWithAI(formData) {
  const { companyName, segment, city, instagramUrl, websiteUrl, hasInstagram, hasWebsite } = formData;

  // Step 1: Fetch website content (Reconhecimento inicial)
  let websiteData = null;
  if (websiteUrl && hasWebsite !== false) {
    websiteData = await fetchWebsiteContent(websiteUrl);
  }

  // Step 2: Build and send BACY prompt
  const bacyPrompt = buildBACYPrompt(companyName, segment, city, instagramUrl, websiteUrl, hasInstagram, hasWebsite, websiteData);

  const analysisResp = await fetch(`${API_BASE}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: AI_MODEL,
      messages: [
        { role: 'system', content: BACY_SYSTEM_PROMPT },
        { role: 'user', content: bacyPrompt }
      ],
      temperature: 0.3,
      max_tokens: 12000
    })
  });

  if (!analysisResp.ok) {
    throw new Error(`AI API error: ${analysisResp.status}`);
  }

  const analysisData = await analysisResp.json();
  let content = analysisData.choices[0]?.message?.content || analysisData.choices[0]?.message?.reasoning_content || '{}';
  content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

  let result;
  try {
    result = JSON.parse(content);
  } catch (e) {
    result = createFallbackResult(companyName, segment);
  }

  // Attach raw website data
  result.websiteData = websiteData;

  return result;
}

/**
 * System prompt — Agente BACY
 */
const BACY_SYSTEM_PROMPT = `Você é o **Auditor Digital da BACY Agência**, um agente autônomo especializado em SEO local, redes sociais, reputação online e automação de atendimento para pequenas e médias empresas brasileiras. Todo o seu atendimento e comunicação deve ser feito em Português do Brasil.

## Seu papel
Você recebe 3 informações básicas do lead (nome da empresa, site, @ do Instagram) e conduz sozinho uma auditoria completa, ativa e detalhada da presença digital da empresa.

## Regras de rigor
1. Toda afirmação deve estar amparada por algo que você efetivamente encontrou — não invente números
2. Se um site/perfil não carregar/não existir, registre como achado crítico
3. Diferencie claramente o que foi **verificado diretamente** do que foi **inferido**
4. Seja consultivo e direto — raio-x rápido e honesto, não relatório inflado
5. Toda recomendação deve nascer de um achado real, nunca de suposição genérica
6. NÃO mencione nomes de ferramentas específicas, preços ou valores monetários
7. Foque no IMPACTO e RETORNO de cada recomendação
8. Use linguagem acessível mas técnica o suficiente para impressionar

## Formato de saída (JSON válido, sem markdown, sem texto antes ou depois):
{
  "overallScore": número de 0 a 100,
  "categoryScores": {
    "site": número 0-100,
    "seo": número 0-100,
    "gmb": número 0-100,
    "socialMedia": número 0-100,
    "reputation": número 0-100
  },
  "expertSummary": "resumo executivo de 4-6 linhas: nota geral, maior risco, maior oportunidade, uma frase de gancho comercial",
  "findings": {
    "site": {
      "status": "Bom|Ruim|Crítico|Não verificado",
      "evidence": "o que foi encontrado no site",
      "risk": "risco identificado",
      "action": "ação recomendada específica"
    },
    "seo": {
      "status": "...",
      "evidence": "...",
      "risk": "...",
      "action": "..."
    },
    "gmb": {
      "status": "...",
      "evidence": "...",
      "risk": "...",
      "action": "..."
    },
    "socialMedia": {
      "status": "...",
      "evidence": "...",
      "risk": "...",
      "action": "..."
    },
    "reputation": {
      "status": "...",
      "evidence": "...",
      "risk": "...",
      "action": "..."
    }
  },
  "competitorAnalysis": {
    "competitors": ["concorrente1", "concorrente2", "concorrente3"],
    "whatTheyDoBetter": "o que os concorrentes fazem melhor",
    "identifiedGap": "gap competitivo identificado"
  },
  "paidAds": {
    "status": "Verificado|Não verificável remotamente",
    "evidence": "evidência encontrada ou justificativa"
  },
  "actionPlan": {
    "now": ["ação 1 - baixo esforço / alto impacto", "ação 2"],
    "shortTerm": ["ação 3 - médio prazo 1-3 meses", "ação 4"],
    "strategic": ["ação 5 - posicionamento de marca, médio-longo prazo"]
  },
  "whereWeCanHelp": "conectar as lacunas encontradas com soluções de automação, site, GMB, redes, mídia paga"
}`;

/**
 * Build the BACY investigation prompt
 */
function buildBACYPrompt(companyName, segment, city, instagramUrl, websiteUrl, hasInstagram, hasWebsite, websiteData) {
  const hasSite = hasWebsite !== false && websiteUrl;
  const hasInsta = hasInstagram !== false && instagramUrl;

  let prompt = `Conduza uma auditoria completa da presença digital da empresa abaixo, seguindo o processo de investigação do Agente BACY.

DADOS DO LEAD:
- Nome da empresa: ${companyName}
- Ramo de atuação: ${segment || 'Não informado'}
- Cidade: ${city || 'Não informado'}
- Site: ${hasSite ? websiteUrl : 'Empresa NÃO possui site'}
- Instagram: ${hasInsta ? instagramUrl : 'Empresa NÃO possui perfil de Instagram'}`;

  if (websiteData) {
    prompt += `

DADOS EXTRAÍDOS DO SITE (Reconhecimento Inicial):
- Título: ${websiteData.title}
- Descrição: ${websiteData.description}
- Keywords: ${websiteData.keywords}
- H1s: ${websiteData.h1s.join(', ')}
- H2s: ${websiteData.h2s.join(', ')}
- Links de navegação: ${websiteData.navLinks.join(', ')}
- Footer: ${websiteData.footerText.slice(0, 300)}
- Possui SSL: ${websiteData.hasSSL ? 'Sim' : 'Não'}
- Responsivo mobile: ${websiteData.hasViewport ? 'Sim' : 'Não'}
- Schema markup: ${websiteData.hasSchema ? 'Sim' : 'Não'}
- Tecnologias detectadas: ${websiteData.techIndicators.join(', ') || 'Nenhuma'}
- Scripts carregados: ${websiteData.scripts}
- Possui WhatsApp no site: ${websiteData.hasWhatsApp ? 'Sim' : 'Não'}
- Possui formulário de contato: ${websiteData.hasContactForm ? 'Sim' : 'Não'}
- Possui telefone: ${websiteData.hasPhone ? 'Sim' : 'Não'}
- Texto do corpo (resumo): ${websiteData.bodyText.slice(0, 1500)}
- Imagens: ${websiteData.images.length} imagens, ${websiteData.images.filter(i => i.alt).length} com alt text`;
  }

  prompt += `

INSTRUÇÕES DE INVESTIGAÇÃO (execute mentalmente cada passo):

1. SITE: ${hasSite ? 'Avalie status, SSL, carregamento, design, CTA (WhatsApp/form/tel), mobile-friendly' : 'A empresa NÃO possui site — registre como achado CRÍTICO e recomende criação de site/landing page'}
2. SEO: Busque "[nome empresa] ${city || '[cidade]'}" e "[ramo] em ${city || '[cidade]'}" — a empresa aparece? Como está posicionada?
3. GOOGLE MEU NEGÓCIO: Verifique se existe perfil GMB — nome, categoria, endereço, horário, fotos, nota, avaliações
4. INSTAGRAM/REDES: ${hasInsta ? 'Avalie seguidores, posts, última postagem, qualidade visual, link na bio, Stories/Destaques, gestão profissional vs. abandonado' : 'A empresa NÃO possui Instagram — registre como achado CRÍTICO e recomende criação e gestão de perfil'}
5. REPUTAÇÃO: Verifique avaliações Google, Reclame Aqui, menções em redes sociais
6. CONCORRÊNCIA: Identifique 2-3 concorrentes diretos posicionados no mesmo ramo/cidade
7. PUBLICIDADE PAGA: Procure sinais de pixel Meta/Google no site, anúncios ativos

Dê um SCORE REALISTA baseado nos dados encontrados — não medalhas de participação.
Seja duro nos problemas — o dono precisa saber onde está perdendo clientes.
Inclua um plano de ação priorizado (resolver agora / médio prazo / estratégico).

Retorne APENAS o JSON conforme o formato do sistema, sem texto adicional.`;

  return prompt;
}

/**
 * Fallback result when AI fails
 */
function createFallbackResult(companyName, segment) {
  return {
    overallScore: 50,
    categoryScores: { site: 50, seo: 40, gmb: 45, socialMedia: 50, reputation: 50 },
    expertSummary: `Auditoria básica da empresa ${companyName} do segmento ${segment}. Não foi possível realizar análise completa via IA neste momento.`,
    findings: {
      site: { status: 'Não verificado', evidence: 'Análise indisponível', risk: 'Desconhecido', action: 'Solicitar nova análise' },
      seo: { status: 'Não verificado', evidence: 'Análise indisponível', risk: 'Desconhecido', action: 'Solicitar nova análise' },
      gmb: { status: 'Não verificado', evidence: 'Análise indisponível', risk: 'Desconhecido', action: 'Solicitar nova análise' },
      socialMedia: { status: 'Não verificado', evidence: 'Análise indisponível', risk: 'Desconhecido', action: 'Solicitar nova análise' },
      reputation: { status: 'Não verificado', evidence: 'Análise indisponível', risk: 'Desconhecido', action: 'Solicitar nova análise' }
    },
    competitorAnalysis: { competitors: [], whatTheyDoBetter: 'Não verificado', identifiedGap: 'Não verificado' },
    paidAds: { status: 'Não verificável remotamente', evidence: 'Análise indisponível' },
    actionPlan: { now: ['Solicitar nova análise completa'], shortTerm: [], strategic: [] },
    whereWeCanHelp: 'Análise pendente — realize uma nova auditoria quando o sistema estiver disponível.'
  };
}

// ==========================================
// AGENTE: Estrategista de Prospecção BACY
// ==========================================

/**
 * Generate prospecting strategy from audit report
 */
export async function generateProspection(auditResult, formData) {
  const prospectPrompt = buildProspectionPrompt(auditResult, formData);

  const resp = await fetch(`${API_BASE}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: AI_MODEL,
      messages: [
        { role: 'system', content: PROSPECTION_SYSTEM_PROMPT },
        { role: 'user', content: prospectPrompt }
      ],
      temperature: 0.4,
      max_tokens: 10000
    })
  });

  if (!resp.ok) {
    throw new Error(`AI API error: ${resp.status}`);
  }

  const data = await resp.json();
  let content = data.choices[0]?.message?.content || data.choices[0]?.message?.reasoning_content || '{}';
  content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

  try {
    return JSON.parse(content);
  } catch (e) {
    return { rawText: content };
  }
}

/**
 * System prompt — Estrategista de Prospecção BACY
 */
const PROSPECTION_SYSTEM_PROMPT = `Você é o **Estrategista Comercial da BACY Agência**. Você recebe o relatório de auditoria de presença digital gerado pelo Agente Auditor e transforma isso em um plano de prospecção e venda pronto para o time comercial.

Todo o seu atendimento e comunicação deve ser feito em Português do Brasil.

## Catálogo de soluções da BACY:
1. **Leadly** — atendimento via WhatsApp com IA, automação de respostas, qualificação de leads, agendamento, follow-up automático, CRM básico
2. **Criação/reforma de site** — sites institucionais ou landing pages otimizadas, focadas em conversão e SEO
3. **Gestão de Google Meu Negócio** — otimização de perfil, categoria, fotos, respostas a avaliações
4. **Gestão de redes sociais** — produção de conteúdo, calendário editorial, consistência de marca
5. **Gestão de reputação** — monitoramento e resposta a avaliações, captação de reviews positivos
6. **Gestão de mídia paga** — Google Ads / Meta Ads, estruturação de campanhas, pixel, funil
7. **Automação e integrações (n8n)** — fluxos personalizados além do Leadly

## Regras:
- Priorize soluções do catálogo atual — é o que gera receita mais rápido
- Se nenhuma solução existente resolver bem, proponha um novo serviço (marque como "oportunidade de expansão")
- Ancore toda recomendação num achado real da auditoria
- Seja direto e comercial — relatório interno, não para o cliente ver
- Não invente preços — use faixas (entrada/intermediário/avançado)

## Formato de saída (JSON válido, sem markdown):
{
  "diagnosis": "resumo de 3-4 linhas puxando achados mais relevantes",
  "primaryPain": {
    "finding": "o que foi encontrado na auditoria",
    "impact": "o que isso custa ao lead",
    "solution": "solução BACY recomendada"
  },
  "secondaryPains": [
    { "finding": "...", "impact": "...", "solution": "..." }
  ],
  "openingHook": "frase pronta para usar na abordagem",
  "approachChannel": "canal recomendado (WhatsApp/DM/ligação/visita)",
  "approachTone": "tom (consultivo/direto/técnico)",
  "approachJustification": "por que esse canal e tom",
  "commercialOffer": {
    "entrySolution": "solução de entrada — por quê",
    "upsellNatural": "upsell natural — quando oferecer",
    "packageRange": "entrada/intermediário/avançado — justificativa"
  },
  "objections": [
    { "objection": "objeção provável", "response": "resposta curta" }
  ],
  "firstMessageScript": "roteiro de 3-5 frases pronto para copiar/colar",
  "newServiceOpportunities": [
    {
      "realPain": "dor real identificada",
      "whatItWouldDo": "o que o serviço faria",
      "viability": "viável com stack atual da BACY",
      "scalable": "pontual ou escalável",
      "name": "nome sugerido",
      "priceRange": "faixa hipotética"
    }
  ]
}`;

/**
 * Build prospecting prompt from audit results
 */
function buildProspectionPrompt(auditResult, formData) {
  const f = auditResult.findings || {};
  const plan = auditResult.actionPlan || {};
  const comp = auditResult.competitorAnalysis || {};

  let prompt = `Gere uma estratégia de prospecção completa baseada na auditoria abaixo.

DADOS DA EMPRESA:
- Nome: ${formData.companyName}
- Segmento: ${formData.segment || 'Não informado'}
- Cidade: ${formData.city || 'Não informado'}
- Site: ${formData.hasWebsite === false ? 'Não possui site' : (formData.websiteUrl || 'Não informado')}
- Instagram: ${formData.hasInstagram === false ? 'Não possui Instagram' : (formData.instagramUrl || 'Não informado')}
- Score geral: ${auditResult.overallScore}/100

RESUMO DA AUDITORIA:
${auditResult.expertSummary || 'Não disponível'}

ACHADOS POR CATEGORIA:

1. SITE (${f.site?.status || 'N/A'}):
   Evidência: ${f.site?.evidence || 'N/A'}
   Risco: ${f.site?.risk || 'N/A'}
   Ação: ${f.site?.action || 'N/A'}

2. SEO / GOOGLE (${f.seo?.status || 'N/A'}):
   Evidência: ${f.seo?.evidence || 'N/A'}
   Risco: ${f.seo?.risk || 'N/A'}
   Ação: ${f.seo?.action || 'N/A'}

3. GOOGLE MEU NEGÓCIO (${f.gmb?.status || 'N/A'}):
   Evidência: ${f.gmb?.evidence || 'N/A'}
   Risco: ${f.gmb?.risk || 'N/A'}
   Ação: ${f.gmb?.action || 'N/A'}

4. INSTAGRAM/REDES SOCIAIS (${f.socialMedia?.status || 'N/A'}):
   Evidência: ${f.socialMedia?.evidence || 'N/A'}
   Risco: ${f.socialMedia?.risk || 'N/A'}
   Ação: ${f.socialMedia?.action || 'N/A'}

5. REPUTAÇÃO (${f.reputation?.status || 'N/A'}):
   Evidência: ${f.reputation?.evidence || 'N/A'}
   Risco: ${f.reputation?.risk || 'N/A'}
   Ação: ${f.reputation?.action || 'N/A'}

6. CONCORRÊNCIA:
   Concorrentes: ${comp.competitors?.join(', ') || 'N/A'}
   O que fazem melhor: ${comp.whatTheyDoBetter || 'N/A'}
   Gap identificado: ${comp.identifiedGap || 'N/A'}

7. PUBLICIDADE PAGA:
   Status: ${auditResult.paidAds?.status || 'N/A'}
   Evidência: ${auditResult.paidAds?.evidence || 'N/A'}

PLANO DE AÇÃO DA AUDITORIA:
- Resolver agora: ${plan.now?.join('; ') || 'N/A'}
- Médio prazo: ${plan.shortTerm?.join('; ') || 'N/A'}
- Estratégico: ${plan.strategic?.join('; ') || 'N/A'}

ONDE A BACY PODE AJUDAR:
${auditResult.whereWeCanHelp || 'Não disponível'}

Gere a estratégia de prospecção seguindo o formato JSON do sistema. Seja específico, ancorado nos achados reais, e pronto para o time comercial usar imediatamente.`;

  return prompt;
}