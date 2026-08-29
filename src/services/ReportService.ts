import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

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
  aiRecommendations: any[]
  webResults: any[]
}

export async function generatePDFReport(
  analysis: AnalysisResult,
  leadData: any
): Promise<string> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  })

  // Color scheme
  const colors = {
    primary: [30, 60, 115], // Dark blue
    secondary: [41, 98, 178],
    accent: [52, 153, 235],
    success: [34, 177, 76],
    warning: [241, 196, 15],
    error: [239, 68, 68],
    lightGray: [245, 245, 245],
    darkGray: [80, 80, 80],
    white: [255, 255, 255],
  }

  // Helper to add colored header
  const addHeader = (text: string, className?: string) => {
    doc.setFillColor(...colors.primary)
    doc.rect(0, 0, doc.getWidth(), 12, 'F')
    doc.setTextColor(...colors.white)
    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.text(text, 15, 8)
    doc.setTextColor(...colors.darkGray)
  }

  // Title page
  doc.setFillColor(...colors.primary)
  doc.rect(0, 0, doc.getWidth(), doc.getHeight(), 'F')
  
  doc.setTextColor(...colors.white)
  doc.setFontSize(28)
  doc.setFont('helvetica', 'bold')
  doc.text('Investigação Digital Empresarial', 15, 30)
  
  doc.setFontSize(18)
  doc.setFont('helvetica', 'normal')
  doc.text(`Relatório Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 15, 45)
  
  doc.text(`Empresa: ${leadData.companyName}`, 15, 55)
  doc.text(`Segmento: ${leadData.segment}`, 15, 62)
  
  doc.setTextColor(...colors.darkGray)
  
  // Metrics section
  doc.setFillColor(...colors.lightGray)
  doc.rect(15, 75, doc.getWidth() - 30, 28, 'F')
  
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...colors.primary)
  doc.text('Indicadores Principais', 20, 85)
  
  doc.setTextColor(...colors.darkGray)
  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  
  const metrics = [
    { label: 'Score Geral', value: `${analysis.overallScore}/100` },
    { label: 'Presença Digital', value: `${analysis.categoryScores.digitalPresence}/100` },
    { label: 'Engajamento', value: `${analysis.categoryScores.engagement}/100` },
    { label: 'SEO & Site', value: `${analysis.categoryScores.seo}/100` },
    { label: 'Reputação', value: `${analysis.categoryScores.reputation}/100` },
    { label: 'Operacional', value: `${analysis.categoryScores.operational}/100` },
  ]
  
  let yPos = 95
  metrics.forEach((m, i) => {
    if (i > 0 && yPos > 260) {
      doc.addPage()
      yPos = 20
    }
    doc.text(`${m.label}: ${m.value}`, 20, yPos)
    yPos += 8
  })
  
  // Strengths
  let currentY = yPos + 5
  if (analysis.strengths.length > 0) {
    currentY += 5
    doc.setFillColor(...colors.success)
    doc.rect(15, currentY, doc.getWidth() - 30, 5, 'F')
    doc.setTextColor(...colors.white)
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('✓ Pontos Fortes', 20, currentY + 3)
    currentY += 10
    
    doc.setTextColor(...colors.darkGray)
    doc.setFont('helvetica', 'normal')
    analysis.strengths.forEach((s: string, i: number) => {
      if (currentY > 275) {
        doc.addPage()
        currentY = 20
      }
      doc.text(`${i + 1}. ${s}`, 20, currentY)
      currentY += 6
    })
  }
  
  // Weaknesses
  currentY += 5
  if (analysis.weaknesses.length > 0) {
    currentY += 3
    doc.setFillColor(...colors.error)
    doc.rect(15, currentY, doc.getWidth() - 30, 5, 'F')
    doc.setTextColor(...colors.white)
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('✗ Problemas Identificados', 20, currentY + 3)
    currentY += 10
    
    doc.setTextColor(...colors.darkGray)
    doc.setFont('helvetica', 'normal')
    analysis.weaknesses.forEach((w: string, i: number) => {
      if (currentY > 275) {
        doc.addPage()
        currentY = 20
      }
      doc.text(`${i + 1}. ${w}`, 20, currentY)
      currentY += 6
    })
  }
  
  // Opportunities
  currentY += 5
  if (analysis.opportunities.length > 0) {
    currentY += 3
    doc.setFillColor(...colors.warning)
    doc.rect(15, currentY, doc.getWidth() - 30, 5, 'F')
    doc.setTextColor(...colors.white)
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('⚡ Oportunidades', 20, currentY + 3)
    currentY += 10
    
    doc.setTextColor(...colors.darkGray)
    doc.setFont('helvetica', 'normal')
    analysis.opportunities.forEach((o: string, i: number) => {
      if (currentY > 275) {
        doc.addPage()
        currentY = 20
      }
      doc.text(`${i + 1}. ${o}`, 20, currentY)
      currentY += 6
    })
  }
  
  // AI Recommendations
  currentY += 5
  if (analysis.aiRecommendations.length > 0) {
    currentY += 3
    doc.setFillColor(...colors.primary)
    doc.rect(15, currentY, doc.getWidth() - 30, 5, 'F')
    doc.setTextColor(...colors.white)
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('🤖 Recomendações de IA', 20, currentY + 3)
    currentY += 10
    
    doc.setTextColor(...colors.darkGray)
    doc.setFont('helvetica', 'normal')
    analysis.aiRecommendations.forEach((rec: any, i: number) => {
      if (currentY > 275) {
        doc.addPage()
        currentY = 20
      }
      doc.setFillColor(...colors.primary)
      doc.rect(15, currentY, 3, 6, 'F')
      
      const impactColor = rec.impact === 'alto' ? colors.success : rec.impact === 'medio' ? colors.warning : colors.error
      doc.setFillColor(...impactColor)
      doc.rect(20, currentY + 1, 4, 4, 'F')
      
      doc.setFontSize(11)
      doc.text(`${rec.title}`, 25, currentY + 1)
      doc.setFontSize(9)
      doc.setTextColor(...impactColor)
      doc.text(`Impacto: ${rec.impact} | Implementação: ${rec.implementation}`, 25, currentY + 5)
      doc.setTextColor(...colors.darkGray)
      doc.setFontSize(10)
      doc.text(`— ${rec.description}`, 25, currentY + 8)
      currentY += 12
    })
  }
  
  // Web Results summary
  currentY += 5
  if (analysis.webResults.length > 0) {
    currentY += 3
    doc.setFillColor(...colors.primary)
    doc.rect(15, currentY, doc.getWidth() - 30, 5, 'F')
    doc.setTextColor(...colors.white)
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('📊 Resultados da Pesquisa Web', 20, currentY + 3)
    currentY += 10
    
    doc.setTextColor(...colors.darkGray)
    doc.setFont('helvetica', 'normal')
    analysis.webResults.forEach((result: any, i: number) => {
      if (currentY > 275) {
        doc.addPage()
        currentY = 20
      }
      doc.setFillColor(...colors.lightGray)
      doc.rect(15, currentY, doc.getWidth() - 30, 10, 'F')
      doc.text(`${i + 1}. ${result.title}`, 20, currentY + 3)
      doc.text(`Fonte: ${result.source}`, 20, currentY + 7)
      currentY += 11
    })
  }
  
  // Save the PDF
  const fileName = `${leadData.companyName.replace(/\s+/g, '_')}_relatorio_digital_${new Date().getTime()}.pdf`
  doc.save(fileName)
  
  // Return a URL/representation for download
  return `data:application/pdf;base64,${doc.output('datauristring')}`
}