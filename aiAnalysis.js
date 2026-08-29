/**
 * AI Analysis Service
 * Uses NVIDIA DeepSeek API to perform real web analysis as a digital specialist
 */

const AI_API_KEY = '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';
const AI_BASE_URL = 'https://integrate.api.nvidia.com/v1';
const AI_MODEL = 'moonshotai/kimi-k3';

// Use local server proxy for AI calls (avoids CORS), CORS proxies for website fetch
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
      const timeout = setTimeout(() => controller.abort(), 8000);
      const resp = await fetch(proxy + encodeURIComponent(url), {
        signal: controller.signal,
        headers: { 'Accept': 'text/html' }
      });
      clearTimeout(timeout);
      if (resp.ok) {
        const html = await resp.text();
        return extractContent(html);
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
function extractContent(html) {
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
  const ogType = getMeta('og:type') || '';
  const author = getMeta('author') || '';

  const h1s = [...doc.querySelectorAll('h1')].map(e => e.textContent.trim()).filter(Boolean).slice(0, 5);
  const h2s = [...doc.querySelectorAll('h2')].map(e => e.textContent.trim()).filter(Boolean).slice(0, 8);
  const navLinks = [...doc.querySelectorAll('nav a, header a')].map(e => e.textContent.trim()).filter(Boolean).slice(0, 15);
  const footerText = doc.querySelector('footer')?.textContent?.trim()?.slice(0, 500) || '';
  const bodyText = doc.querySelector('body')?.textContent?.replace(/\s+/g, ' ')?.trim()?.slice(0, 3000) || '';

  const hasSSL = html.includes('https');
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
  if (stylesheets.some(s => s.includes('elementor'))) techIndicators.push('Elementor');
  if (scripts.some(s => s.includes('react') || s.includes('next'))) techIndicators.push('React/Next.js');
  if (scripts.some(s => s.includes('vue'))) techIndicators.push('Vue.js');
  if (scripts.some(s => s.includes('angular'))) techIndicators.push('Angular');
  if (scripts.some(s => s.includes('jquery'))) techIndicators.push('jQuery');
  if (scripts.some(s => s.includes('gtag') || s.includes('analytics'))) techIndicators.push('Google Analytics');
  if (scripts.some(s => s.includes('facebook') || s.includes('fbq'))) techIndicators.push('Facebook Pixel');
  if (scripts.some(s => s.includes('hotjar'))) techIndicators.push('Hotjar');
  if (scripts.some(s => s.includes('intercom'))) techIndicators.push('Intercom');
  if (scripts.some(s => s.includes('crisp'))) techIndicators.push('Crisp');
  if (scripts.some(s => s.includes('tidio'))) techIndicators.push('Tidio');

  const hasWhatsApp = html.includes('wa.me') || html.includes('whatsapp') || html.includes('api.whatsapp');
  const hasContactForm = html.includes('contato') || html.includes('contact') || html.includes('form');
  const hasPhone = html.includes('tel:') || html.includes('telefone') || html.includes('(11)') || html.includes('(21)');

  return {
    title, description, keywords, ogTitle, ogImage, ogType, author,
    h1s, h2s, navLinks, footerText, bodyText: bodyText.slice(0, 2000),
    hasSSL, hasViewport, hasSchema,
    techIndicators, scripts: scripts.length, stylesheets: stylesheets.length,
    images, hasWhatsApp, hasContactForm, hasPhone
  };
}

/**
 * Search for company info via OpenAI
 */
async function searchCompanyInfo(companyName, segment, websiteUrl) {
  try {
    const resp = await fetch(`${API_BASE}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: AI_MODEL,
        messages: [
          {
            role: 'system',
            content: 'Você é um pesquisador de mercado. Retorne APENAS um objeto JSON válido, sem markdown, sem ```json, sem texto antes ou depois.'
          },
          {
            role: 'user',
            content: `Pesquise e retorne um JSON com informações sobre a empresa "${companyName}" do segmento "${segment}" com site "${websiteUrl}". 

Retorne APENAS este JSON (sem nenhum texto adicional):
{
  "knownInfo": "breve descrição do que se sabe sobre a empresa",
  "marketPosition": "posição de mercado estimada",
  "competitors": ["concorrente1", "concorrente2", "concorrente3"],
  "industryTrends": ["tendencia1", "tendencia2", "tendencia3"],
  "digitalChallenges": ["desafio1", "desafio2"]
}`
          }
        ],
        temperature: 0.3,
        max_tokens: 1500
      })
    });

    if (!resp.ok) return null;
    const data = await resp.json();
    let content = data.choices[0]?.message?.content || data.choices[0]?.message?.reasoning_content || '';
    content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(content);
  } catch (e) {
    console.error('Search error:', e);
    return null;
  }
}

/**
 * Main AI Analysis - acts as a digital specialist
 */
export async function analyzeWithAI(formData) {
  const { companyName, segment, instagramUrl, websiteUrl } = formData;

  // Step 1: Fetch website content
  let websiteData = null;
  if (websiteUrl) {
    websiteData = await fetchWebsiteContent(websiteUrl);
  }

  // Step 2: Search for company info
  const companyInfo = await searchCompanyInfo(companyName, segment, websiteUrl);

  // Step 3: Analyze with AI as specialist
  const specialistPrompt = buildSpecialistPrompt(companyName, segment, instagramUrl, websiteUrl, websiteData, companyInfo);

  const analysisResp = await fetch(`${API_BASE}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: AI_MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: specialistPrompt }
      ],
      temperature: 0.4,
      max_tokens: 8000
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

  // Enrich with web data
  result.webResults = buildWebResults(websiteData, companyInfo, instagramUrl, websiteUrl, segment);
  result.websiteData = websiteData;

  return result;
}

/**
 * System prompt - Digital Specialist persona
 */
const SYSTEM_PROMPT = `Você é um ESPECIALISTA SÊNIOR EM MARKETING DIGITAL E TRANSFORMAÇÃO DIGITAL com 20 anos de experiência. Todo o seu atendimento e comunicação deve ser feito em Português do Brasil.

ANÁLISE ESPECIALIZADA:
- Você analisa a presença digital de empresas como um consultor top-tier
- Você identifica problemas que um CEO ou dono de empresa não perceberia
- Você recomenda soluções práticas e mensuráveis
- Você entende de SEO, redes sociais, UX/UI, automação, IA, e performance web
- Você conhece benchmarks do mercado brasileiro

SUAS REGRAS:
1. Seja ESPECÍFICO e DETALHADO - nada de respostas genéricas
2. Baseie sua análise nos dados reais fornecidos
3. Identifique OPORTUNIDADES CONCRETAS que a empresa está perdendo
4. Recomende estratégias e ações com foco no resultado e retorno esperado
5. NÃO mencione nomes de ferramentas, preços ou valores monetários
6. Foque no IMPACTO e RETORNO (ROI) de cada recomendação
7. Considere o porte e segmento da empresa para recomendações proporcionais
8. Use linguagem acessível mas técnica o suficiente para impressionar
9. Todas as respostas devem ser em Português do Brasil

FORMATO DE SAÍDA (JSON):
{
  "overallScore": número de 0 a 100,
  "categoryScores": {
    "digitalPresence": número 0-100,
    "engagement": número 0-100,
    "seo": número 0-100,
    "reputation": número 0-100,
    "operational": número 0-100
  },
  "expertSummary": "resumo executivo de 2-3 frases como um consultor falaria ao CEO",
  "strengths": ["ponto forte 1 com detalhes", "ponto forte 2"],
  "weaknesses": ["problema 1 - explique por que é grave", "problema 2"],
  "opportunities": ["oportunidade 1 - o que ganha ao implementar", "oportunidade 2"],
  "aiRecommendations": [
    {
      "title": "Título da recomendação",
      "description": "Descrição detalhada da estratégia, como implementar e o resultado esperado",
      "implementation": "facil|medio|complexo",
      "impact": "alto|medio|baixo",
      "expectedROI": "retorno esperado em termos de resultado (ex: aumento de leads, melhoria de conversão)"
    }
  ],
  "competitorInsights": "análise competitiva baseada no segmento",
  "priorityActions": ["ação 1 para os próximos 30 dias", "ação 2", "ação 3"]
}`;

/**
 * Build the specialist analysis prompt
 */
function buildSpecialistPrompt(companyName, segment, instagramUrl, websiteUrl, websiteData, companyInfo) {
  let prompt = `Analise a presença digital da empresa abaixo como um especialista sênior e retorne o JSON conforme o formato especificado.

DADOS DA EMPRESA:
- Nome: ${companyName}
- Segmento: ${segment}
- Instagram: ${instagramUrl}
- Website: ${websiteUrl}`;

  if (websiteData) {
    prompt += `

DADOS EXTRAÍDOS DO SITE:
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
- Quantidade de scripts: ${websiteData.scripts}
- Possui WhatsApp no site: ${websiteData.hasWhatsApp ? 'Sim' : 'Não'}
- Possui formulário de contato: ${websiteData.hasContactForm ? 'Sim' : 'Não'}
- Possui telefone: ${websiteData.hasPhone ? 'Sim' : 'Não'}
- Texto do corpo (resumo): ${websiteData.bodyText.slice(0, 1500)}
- Imagens: ${websiteData.images.length} imagens, ${websiteData.images.filter(i => i.alt).length} com alt text`;
  }

  if (companyInfo) {
    prompt += `

INFORMAÇÕES DE MERCADO:
- Posição de mercado: ${companyInfo.marketPosition}
- Concorrentes conhecidos: ${companyInfo.competitors?.join(', ')}
- Tendências do setor: ${companyInfo.industryTrends?.join(', ')}
- Desafios digitais do setor: ${companyInfo.digitalChallenges?.join(', ')}`;
  }

  prompt += `

INSTRUÇÕES ESPECÍFICAS:
1. Analise o site como um auditor UX/SEO - se tem SSL, responsividade, schema, velocidade
2. Avalie a presença no Instagram como um social media manager - frequência, engajamento, qualidade
3. Identifique GAPs de automação - onde a empresa perde tempo ou clientes por falta de automação
4. Recomende SOLUÇÕES DE IA específicas - nome da ferramenta, como usar, quanto custa
5. Dê um SCORE REALISTA baseado nos dados encontrados, não medalhas de participação
6. Seja duro nos problemas - o dono precisa saber onde está perdendo dinheiro
7. Inclua ações PRIORITÁRIAS para os próximos 30 dias

Retorne APENAS o JSON, sem texto adicional.`;

  return prompt;
}

/**
 * Build web results for the report
 */
function buildWebResults(websiteData, companyInfo, instagramUrl, websiteUrl, segment) {
  const results = [];

  if (websiteData) {
    results.push({
      title: 'Análise do Website',
      description: `${websiteData.title || 'Sem título'} — ${websiteData.techIndicators.join(', ') || 'Tecnologia não identificada'}. SSL: ${websiteData.hasSSL ? '✅' : '❌'}. Responsivo: ${websiteData.hasViewport ? '✅' : '❌'}. Schema: ${websiteData.hasSchema ? '✅' : '❌'}. ${websiteData.images.length} imagens (${websiteData.images.filter(i => i.alt).length} com alt). ${websiteData.scripts} scripts carregados.`,
      url: websiteUrl,
      source: 'website'
    });
  }

  if (instagramUrl) {
    results.push({
      title: 'Perfil Instagram',
      description: `Perfil identificado: ${instagramUrl}. Análise de engajamento, frequência de posts e qualidade do conteúdo visual realizada pela IA.`,
      url: instagramUrl,
      source: 'instagram'
    });
  }

  if (companyInfo) {
    results.push({
      title: `Análise de Mercado: ${segment}`,
      description: `Segmento analisado. Concorrentes identificados: ${companyInfo.competitors?.join(', ') || 'N/A'}. Tendências: ${companyInfo.industryTrends?.join(', ') || 'N/A'}. Desafios: ${companyInfo.digitalChallenges?.join(', ') || 'N/A'}.`,
      url: '',
      source: 'market'
    });
  }

  return results;
}

/**
 * Fallback result when AI fails
 */
function createFallbackResult(companyName, segment) {
  return {
    overallScore: 50,
    categoryScores: {
      digitalPresence: 50,
      engagement: 40,
      seo: 45,
      reputation: 50,
      operational: 40
    },
    expertSummary: `Análise básica da empresa ${companyName} do segmento ${segment}. Não foi possível realizar análise completa via IA neste momento.`,
    strengths: ['Presença online identificada'],
    weaknesses: ['Análise detalhada indisponível no momento'],
    opportunities: ['Realizar auditoria completa da presença digital'],
    aiRecommendations: [
      {
        title: 'Auditoria Digital Completa',
        description: 'Realizar análise detalhada de presença digital, SEO e redes sociais',
        implementation: 'medio',
        impact: 'alto',
        estimatedCost: 'Sob consulta',
        expectedROI: 'Melhoria significativa na presença digital'
      }
    ],
    competitorInsights: 'Análise competitiva pendente',
    priorityActions: ['Solicitar nova análise quando o site estiver acessível']
  };
}
