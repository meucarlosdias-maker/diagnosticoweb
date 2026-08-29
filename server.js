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

// ========== FIM ADMIN CRUD ==========
app.get('/{*splat}', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
