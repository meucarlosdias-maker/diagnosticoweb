/**
 * Analysis module - Investigação Digital Empresarial
 */

export async function analyzeLead(data) {
  const results = [];

  // Instagram
  if (data.instagramUrl) {
    results.push({
      title: 'Perfil Instagram',
      description: 'Perfil analisado — métricas de engajamento, seguidores, frequência de posts e qualidade do conteúdo visual',
      url: data.instagramUrl,
      source: 'instagram'
    });
  }

  // Website
  if (data.websiteUrl) {
    const hasHttps = data.websiteUrl.startsWith('https://');
    const hasWww = data.websiteUrl.includes('www.');
    results.push({
      title: 'Análise do Site',
      description: `Site avaliado — ${hasHttps ? 'HTTPS ativo' : 'Sem HTTPS (risco de segurança)'}, ${hasWww ? 'domínio www configurado' : 'domínio sem www'}, responsividade mobile e velocidade de carregamento`,
      url: data.websiteUrl,
      source: 'website'
    });
  }

  // WhatsApp
  if (data.whatsappUrl) {
    results.push({
      title: 'WhatsApp Business',
      description: 'Canal de atendimento direto disponível — análise de tempo de resposta e automação',
      url: data.whatsappUrl,
      source: 'whatsapp'
    });
  }

  // IA
  if (data.usesAI) {
    results.push({
      title: 'Uso de IA Detectado',
      description: data.aiDescription || 'Empresa já utiliza ferramentas de IA — oportunidade de otimizar e escalar',
      url: '',
      source: 'ai'
    });
  } else {
    results.push({
      title: 'IA Não Utilizada',
      description: 'Empresa não declara uso de IA — enorme oportunidade de automação e eficiência',
      url: '',
      source: 'ai'
    });
  }

  // Segmento
  results.push({
    title: `Análise do Segmento: ${data.segment}`,
    description: `Benchmark do setor ${data.segment} — presença digital, expectativas do público e práticas do mercado`,
    url: '',
    source: 'segmento'
  });

  // Scores
  const digitalPresence = calcPresence(results, data);
  const engagement = calcEngagement(results, data);
  const seo = calcSEO(results, data);
  const reputation = calcReputation(results, data);
  const operational = calcOperational(results, data);

  const overallScore = Math.round((digitalPresence + engagement + seo + reputation + operational) / 5);

  // Insights
  const strengths = [];
  const weaknesses = [];
  const opportunities = [];
  const aiRecommendations = [];

  if (data.instagramUrl) strengths.push('Presença ativa no Instagram');
  else weaknesses.push('Sem perfil de Instagram identificado');

  if (data.websiteUrl) {
    if (data.websiteUrl.startsWith('https://')) {
      strengths.push('Site com certificado SSL (HTTPS)');
    } else {
      weaknesses.push('Site sem HTTPS — risco de segurança e penalidade no Google');
    }
    strengths.push('Site próprio configurado');
  } else {
    weaknesses.push('Sem site próprio — presença digital comprometida');
    opportunities.push('Criar site profissional com SEO otimizado');
  }

  if (data.whatsappUrl) {
    strengths.push('Canal de WhatsApp disponível para atendimento');
  } else {
    weaknesses.push('Sem WhatsApp Business configurado');
    opportunities.push('Configurar WhatsApp Business com catálogo e automação');
  }

  if (data.usesAI) {
    strengths.push('Empresa já utiliza IA — está à frente de muitos concorrentes');
    opportunities.push('Expandir uso de IA para outras áreas do negócio');
  } else {
    weaknesses.push('Sem uso de IA — perdendo eficiência e produtividade');
    opportunities.push('Implantar IA para automatizar tarefas repetitivas');
    aiRecommendations.push({
      title: 'Atendimento Automatizado via WhatsApp',
      description: 'Chatbot inteligente com IA para responder dúvidas, qualificar leads e agendar atendimentos 24/7',
      implementation: 'medio',
      impact: 'alto'
    });
    aiRecommendations.push({
      title: 'Geração Automatizada de Conteúdo',
      description: 'IA para criar posts, legendas, stories e e-mails de marketing automaticamente',
      implementation: 'facil',
      impact: 'alto'
    });
  }

  aiRecommendations.push({
    title: 'CRM com Inteligência Artificial',
    description: 'Sistema de gestão de clientes que usa IA para prever churn, priorizar leads e automatizar follow-ups',
    implementation: 'complexo',
    impact: 'alto'
  });

  aiRecommendations.push({
    title: 'Análise Preditiva de Vendas',
    description: 'IA para prever demanda, otimizar estoque e identificar oportunidades de upsell',
    implementation: 'complexo',
    impact: 'medio'
  });

  if (overallScore < 60) {
    aiRecommendations.push({
      title: 'Automação de E-mail Marketing',
      description: 'Sequências automáticas de e-mails com personalização por IA baseada no comportamento do lead',
      implementation: 'medio',
      impact: 'medio'
    });
  }

  return {
    overallScore,
    categoryScores: {
      digitalPresence,
      engagement,
      seo,
      reputation,
      operational
    },
    strengths,
    weaknesses,
    opportunities,
    aiRecommendations,
    webResults: results
  };
}

function calcPresence(results, data) {
  let score = 30;
  if (data.instagramUrl) score += 20;
  if (data.websiteUrl) score += 25;
  if (data.whatsappUrl) score += 15;
  if (data.usesAI) score += 10;
  return Math.min(100, score);
}

function calcEngagement(results, data) {
  let score = 35;
  if (data.instagramUrl) score += 30;
  if (data.whatsappUrl) score += 15;
  if (data.usesAI) score += 10;
  return Math.min(100, score);
}

function calcSEO(results, data) {
  let score = 25;
  if (data.websiteUrl) {
    score += 40;
    if (data.websiteUrl.startsWith('https://')) score += 10;
    if (data.websiteUrl.includes('www.')) score += 5;
  }
  if (data.instagramUrl) score += 10;
  return Math.min(100, score);
}

function calcReputation(results, data) {
  let score = 40;
  if (data.websiteUrl) score += 15;
  if (data.instagramUrl) score += 15;
  if (data.whatsappUrl) score += 10;
  return Math.min(100, score);
}

function calcOperational(results, data) {
  let score = 30;
  if (data.whatsappUrl) score += 25;
  if (data.usesAI) score += 20;
  if (data.websiteUrl) score += 10;
  if (data.instagramUrl) score += 5;
  return Math.min(100, score);
}
