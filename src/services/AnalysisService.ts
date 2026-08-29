import axios from 'axios'

interface WebResult {
  title: string
  description: string
  url: string
  source: 'instagram' | 'website' | 'reviews' | 'general'
}

interface AnalysisResult {
  overallScore: number
  categoryScores: {
    digitalPresence: number
    engagement: number
    seo: number
    reputation: number
    operational: number
  }
  strengths: string[]
  weaknesses: string[]
  opportunities: string[]
  aiRecommendations: AiRecommendation[]
  webResults: WebResult[]
}

interface AiRecommendation {
  area: 'atendimento' | 'marketing' | 'operacional' | 'vendas'
  title: string
  description: string
  implementation: 'facil' | 'medio' | 'complexo'
  impact: 'alto' | 'medio' | 'baixo'
}

interface LeadFormData {
  companyName: string
  segment: string
  instagramUrl: string
  websiteUrl: string
  whatsappUrl: string
  usesAI: boolean
  aiDescription: string
  timestamp: string
}

const API_BASE = 'https://api.example.com' // Placeholder - will use local analysis

export async function analyzeLead(data: LeadFormData): Promise<AnalysisResult> {
  const results: WebResult[] = []

  // Simulate web searches based on provided URLs
  // In a full implementation, this would use SerpAPI, Google Custom Search, etc.

  // 1. Analyze Instagram
  if (data.instagramUrl) {
    try {
      const instagramResponse = await axios.get(
        `https://graph.facebook.com/v18.0/${new URL(data.instagramUrl).pathname.slice(1)}`,
        { params: { fields: 'followers_count', access_token: 'demo' } }
      )
      results.push({
        title: 'Perfil Instagram',
        description: `Perfil encontrado com ${instagramResponse.data.followers_count || 0} seguidores`,
        url: data.instagramUrl,
        source: 'instagram',
      })
    } catch (e) {
      results.push({
        title: 'Perfil Instagram',
        description: 'Não foi possível acessar o perfil Instagram',
        url: data.instagramUrl,
        source: 'instagram',
      })
    }
  }

  // 2. Analyze Website
  if (data.websiteUrl) {
    try {
      const websiteResponse = await axios.get(data.websiteUrl, { timeout: 5000 })
      const html = websiteResponse.data
      
      // Basic checks
      const hasHttps = data.websiteUrl.startsWith('https://')
      const hasMetaDescription = html.includes('<meta name="description"')
      const hasViewport = html.includes('viewport')
      const hasTitle = html.includes('<title>')
      
      let score = 60 // base score
      if (hasHttps) score += 10
      if (hasMetaDescription) score += 10
      if (hasViewport) score += 10
      if (hasTitle) score += 10
      
      const finalScore = Math.min(100, score)
      
      results.push({
        title: 'Análise do Site',
        description: `Site avaliado com ${finalScore} pontos - ${hasHttps ? 'HTTPS ativo' : 'Sem HTTPS'} ${hasMetaDescription ? ', meta description presente' : ''}`,
        url: data.websiteUrl,
        source: 'website',
      })
    } catch (e) {
      results.push({
        title: 'Análise do Site',
        description: 'Não foi possível acessar o site',
        url: data.websiteUrl,
        source: 'website',
      })
    }
  }

  // 3. Check WhatsApp availability
  if (data.whatsappUrl) {
    results.push({
      title: 'WhatsApp Business',
      description: 'Link de WhatsApp configurado - disponibilidade para atendimento direto',
      url: data.whatsappUrl,
      source: 'operational',
    })
  }

  // 4. Check AI usage
  if (data.usesAI) {
    results.push({
      title: 'Presença de IA',
      description: data.aiDescription || 'Empresa declara uso de IA',
      url: '',
      source: 'general',
    })
  } else {
    results.push({
      title: 'Presença de IA',
      description: 'Empresa não declara uso de IA - oportunidade de automação',
      url: '',
      source: 'general',
    })
  }

  // Calculate category scores
  const digitalPresence = calculateDigitalPresence(results)
  const engagement = calculateEngagement(results)
  const seo = calculateSEO(results)
  const reputation = calculateReputation(results)
  const operational = calculateOperational(results)

  // Overall score
  const overallScore = Math.round(
    (digitalPresence + engagement + seo + reputation + operational) / 5
  )

  // Strengths and weaknesses
  const strengths: string[] = []
  const weaknesses: string[] = []
  const opportunities: string[] = []
  const aiRecommendations: AiRecommendation[] = []

  // Analyze and generate recommendations
  if (overallScore >= 80) {
    strengths.push('Excelente presença digital geral')
    opportunities.push('Manter consistência e explorar novas plataformas')
    aiRecommendations.push({
      area: 'marketing',
      title: 'Automação de Redes Sociais',
      description: 'Use ferramentas de IA para agendar posts e otimizar horários de publicação',
      implementation: 'facil',
      impact: 'medio',
    })
  } else if (overallScore >= 60) {
    strengths.push('Presença digital satisfatória')
    if (!results.some(r => r.source === 'website' && r.description.includes('HTTPS'))) {
      weaknesses.push('Site sem HTTPS - segurança comprometida')
      opportunities.push('Implementar certificado SSL')
    }
    if (data.usesAI) {
      strengths.push('Já utiliza IA em algum aspecto')
    } else {
      opportunities.push('Implantar IA para automação de atendimento')
      aiRecommendations.push({
        area: 'atendimento',
        title: 'Chatbot WhatsApp',
        description: 'Implante um chatbot inteligente no WhatsApp para atendimento 24/7',
        implementation: 'medio',
        impact: 'alto',
      })
    }
  } else {
    weaknesses.push('Presença digital precisa de melhorias significativas')
    if (!results.some(r => r.source === 'website' && r.description.includes('HTTPS'))) {
      weaknesses.push('Site sem HTTPS - implementar certificado SSL imediatamente')
    }
    if (!results.some(r => r.source === 'instagram')) {
      weaknesses.push('Perfil Instagram não analisado ou inexistente')
    }
    opportunities.push('Redesign digital focado em pilares estratégicos')
    aiRecommendations.push({
      area: 'operacional',
      title: 'Sistema de Gestão',
      description: 'Implemente um CRM ou sistema de gestão com IA para organizar clientes e leads',
      implementation: 'complexo',
      impact: 'alto',
    })
    aiRecommendations.push({
      area: 'marketing',
      title: 'Conteúdo Automatizado',
      description: 'Use IA para gerar posts, legendas e respostas automáticas',
      implementation: 'facil',
      impact: 'medio',
    })
  }

  return {
    overallScore,
    categoryScores: {
      digitalPresence,
      engagement,
      seo,
      reputation,
      operational,
    },
    strengths,
    weaknesses,
    opportunities,
    aiRecommendations,
    webResults: results,
  }
}

function calculateDigitalPresence(results: WebResult[]): number {
  if (results.length === 0) return 30
  const hasInstagram = results.some(r => r.source === 'instagram')
  const hasWebsite = results.some(r => r.source === 'website')
  const hasWhatsApp = results.some(r => r.source === 'operational')
  
  let score = 50
  if (hasInstagram) score += 15
  if (hasWebsite) score += 15
  if (hasWhatsApp) score += 10
  return Math.min(100, score)
}

function calculateEngagement(results: WebResult[]): number {
  // Based on presence of engagement signals
  let score = 50
  const hasInstagram = results.some(r => r.source === 'instagram')
  if (hasInstagram) score += 20
  // Check for reviews/mentions
  const hasReviews = results.some(r => r.source === 'general' && r.description.includes('avalia'))
  if (hasReviews) score += 15
  return Math.min(100, score)
}

function calculateSEO(results: WebResult[]): number {
  let score = 50
  const hasWebsite = results.some(r => r.source === 'website')
  if (hasWebsite) {
    score += 30 // base for having a website
    // Check for HTTPS in description
    const websiteResult = results.find(r => r.source === 'website')
    if (websiteResult?.description?.includes('HTTPS')) {
      score += 10
    }
  }
  return Math.min(100, score)
}

function calculateReputation(results: WebResult[]): number {
  let score = 50
  // Check for review signals
  const hasReviewMentions = results.some(r => r.description.includes('avalia') || r.description.includes('Reclame'))
  if (hasReviewMentions) score += 20
  return Math.min(100, score)
}

function calculateOperational(results: WebResult[]): number {
  let score = 50
  const hasWhatsapp = results.some(r => r.source === 'operational')
  if (hasWhatsapp) score += 20
  if (usesAIInResults(results)) score += 15
  return Math.min(100, score)
}

// Note: dataUsesAIContext needs access to the data, let me fix this
function usesAIInResults(results: WebResult[]): boolean {
  return results.some(r => r.source === 'general' && r.title.includes('IA'))
}