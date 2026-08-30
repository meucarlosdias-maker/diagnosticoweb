const express = require('express');
const cors = require('cors');
const path = require('path');
const { execFileSync } = require('child_process');
const fs = require('fs');
const os = require('os');

const app = express();
const PORT = 3000;

const AI_API_KEY = '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';
const PS_SCRIPT = path.join(__dirname, 'api-call.ps1');

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname)));

function callNvidia(body) {
  const tmpFile = path.join(os.tmpdir(), `nvidia_${Date.now()}.json`);
  fs.writeFileSync(tmpFile, body, 'utf8');
  try {
    const result = execFileSync('powershell', [
      '-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', PS_SCRIPT,
      '-Method', 'POST',
      '-Url', 'https://integrate.api.nvidia.com/v1/chat/completions',
      '-BodyPath', tmpFile,
      '-Auth', `Bearer ${AI_API_KEY}`
    ], { encoding: 'utf8', timeout: 300000, maxBuffer: 10 * 1024 * 1024, env: { ...process.env, PYTHONIOENCODING: 'utf-8' } });
    try { fs.unlinkSync(tmpFile); } catch(e) {}
    return JSON.parse(result.trim());
  } catch (err) {
    try { fs.unlinkSync(tmpFile); } catch(e) {}
    const msg = err.stdout ? err.stdout.trim() : err.stderr ? err.stderr.trim() : err.message;
    throw new Error(msg);
  }
}

// Proxy: Chat completions (NVIDIA API via PowerShell)
app.post('/api/chat', async (req, res) => {
  try {
    const body = JSON.stringify(req.body);
    console.log(`[API] Request body length: ${body.length} chars`);
    const data = callNvidia(body);
    console.log(`[API] Response OK, choices: ${data.choices?.length}`);
    res.json(data);
  } catch (err) {
    console.error('[API] Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ========== ADMIN ROUTES ==========
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});
app.get('/admin.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

// ========== ADMIN CRUD ==========

// Middleware de autenticação simples
function checkAuth(req, res, next) {
  // Por enquanto, aceita todas as requisições (auth feita no frontend)
  next();
}

// LISTAR todos os diagnósticos
app.get('/api/diagnostics', checkAuth, (req, res) => {
  try {
    const dados = fs.readFileSync(path.join(__dirname, 'diagnostics.json'), 'utf8');
    res.json(JSON.parse(dados));
  } catch (e) {
    res.json({ diagnostics: [] });
  }
});

// SALVAR novo diagnóstico
app.post('/api/diagnostics', checkAuth, (req, res) => {
  try {
    const filePath = path.join(__dirname, 'diagnostics.json');
    let lista = { diagnostics: [] };
    try {
      const dados = fs.readFileSync(filePath, 'utf8');
      lista = JSON.parse(dados);
    } catch(e) {}
    
    const novo = {
      ...req.body,
      _id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      status: 'pending',
      sentVia: 'none',
      followUpSent: false,
      notes: ''
    };
    
    lista.diagnostics.push(novo);
    fs.writeFileSync(filePath, JSON.stringify(lista, null, 2));
    res.json({ success: true, id: novo._id });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Atualizar diagnóstico
app.put('/api/diagnostics/:id', checkAuth, (req, res) => {
  try {
    const filePath = path.join(__dirname, 'diagnostics.json');
    const dados = fs.readFileSync(filePath, 'utf8');
    const lista = JSON.parse(dados);
    
    const idx = lista.diagnostics.findIndex(d => d._id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Diagnóstico não encontrado' });
    
    lista.diagnostics[idx] = { ...lista.diagnostics[idx], ...req.body, updatedAt: new Date().toISOString() };
    
    fs.writeFileSync(filePath, JSON.stringify(lista, null, 2));
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Deletar diagnóstico
app.delete('/api/diagnostics/:id', checkAuth, (req, res) => {
  try {
    const filePath = path.join(__dirname, 'diagnostics.json');
    const dados = fs.readFileSync(filePath, 'utf8');
    const lista = JSON.parse(dados);
    
    lista.diagnostics = lista.diagnostics.filter(d => d._id !== req.params.id);
    
    fs.writeFileSync(filePath, JSON.stringify(lista, null, 2));
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// LISTAR templates
app.get('/api/templates', checkAuth, (req, res) => {
  try {
    const dados = fs.readFileSync(path.join(__dirname, 'templates.json'), 'utf8');
    res.json(JSON.parse(dados));
  } catch (e) {
    res.json({ templates: [] });
  }
});

// Atualizar template
app.put('/api/templates/:id', checkAuth, (req, res) => {
  try {
    const filePath = path.join(__dirname, 'templates.json');
    const dados = fs.readFileSync(filePath, 'utf8');
    const lista = JSON.parse(dados);
    
    const idx = lista.templates.findIndex(t => t._id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Template não encontrado' });
    
    lista.templates[idx] = { ...lista.templates[idx], ...req.body };
    
    fs.writeFileSync(filePath, JSON.stringify(lista, null, 2));
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ========== APPOINTMENTS API ==========

// LISTAR agendamentos
app.get('/api/appointments', checkAuth, (req, res) => {
  try {
    const dados = fs.readFileSync(path.join(__dirname, 'appointments.json'), 'utf8');
    res.json(JSON.parse(dados));
  } catch (e) {
    res.json({ appointments: [] });
  }
});

// CRIAR agendamento (público — lead agenda)
app.post('/api/appointments', (req, res) => {
  try {
    const filePath = path.join(__dirname, 'appointments.json');
    let lista = { appointments: [] };
    try {
      const dados = fs.readFileSync(filePath, 'utf8');
      lista = JSON.parse(dados);
    } catch(e) {}

    const novo = {
      ...req.body,
      _id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      status: 'pending'
    };

    lista.appointments.push(novo);
    fs.writeFileSync(filePath, JSON.stringify(lista, null, 2));
    res.json({ success: true, appointment: novo });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ATUALIZAR status do agendamento
app.put('/api/appointments/:id', checkAuth, (req, res) => {
  try {
    const filePath = path.join(__dirname, 'appointments.json');
    const dados = fs.readFileSync(filePath, 'utf8');
    const lista = JSON.parse(dados);

    const idx = lista.appointments.findIndex(a => a._id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Agendamento não encontrado' });

    lista.appointments[idx] = { ...lista.appointments[idx], ...req.body };
    fs.writeFileSync(filePath, JSON.stringify(lista, null, 2));
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// DELETAR agendamento
app.delete('/api/appointments/:id', checkAuth, (req, res) => {
  try {
    const filePath = path.join(__dirname, 'appointments.json');
    const dados = fs.readFileSync(filePath, 'utf8');
    const lista = JSON.parse(dados);

    lista.appointments = lista.appointments.filter(a => a._id !== req.params.id);
    fs.writeFileSync(filePath, JSON.stringify(lista, null, 2));
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ========== PROSPECTION API ==========
app.post('/api/prospect', checkAuth, async (req, res) => {
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

    const result = await callNvidia(JSON.stringify({
      model: 'moonshotai/kimi-k3',
      messages: [
        { role: 'system', content: PROSPECTION_PROMPT },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.4,
      max_tokens: 10000
    }));

    let content = result.choices[0]?.message?.content || result.choices[0]?.message?.reasoning_content || '{}';
    content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    try {
      res.json(JSON.parse(content));
    } catch (e) {
      res.json({ rawText: content });
    }
  } catch (err) {
    console.error('[PROSPECT] Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ========== GMB LOOKUP ==========
const GMB_SCRIPT = path.join(__dirname, 'gmb-lookup.ps1');

app.get('/api/gmb-lookup', checkAuth, async (req, res) => {
  try {
    const { company, city, segment } = req.query;
    if (!company || !city) {
      return res.status(400).json({ error: 'company and city are required' });
    }

    const result = execFileSync('powershell', [
      '-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', GMB_SCRIPT,
      '-CompanyName', company,
      '-City', city,
      '-Segment', segment || ''
    ], { encoding: 'utf8', timeout: 60000, maxBuffer: 10 * 1024 * 1024, env: { ...process.env, PYTHONIOENCODING: 'utf-8' } });

    try {
      res.json(JSON.parse(result.trim()));
    } catch (e) {
      res.json({ raw: result.trim() });
    }
  } catch (err) {
    console.error('[GMB] Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ========== FIM ADMIN CR
app.get('/{*splat}', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
