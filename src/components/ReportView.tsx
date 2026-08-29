import { useEffect, useState } from 'react'
import { analyzeLead } from '../services/AnalysisService'
import { generatePDFReport } from '../services/ReportService'

interface ReportViewProps {
  leadData: any
  onClose: () => void
}

export function ReportView({ leadData, onClose }: ReportViewProps) {
  const [analysis, setAnalysis] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [pdfGenerated, setPdfGenerated] = useState(false)

  useEffect(() => {
    ;(async () => {
      setLoading(true)
      try {
        const result = await analyzeLead(leadData)
        setAnalysis(result)
        // Generate PDF report
        const pdfUrl = await generatePDFReport(result, leadData)
        // In a full app, this would trigger a download
        console.log('PDF report generated:', pdfUrl)
      } catch (error) {
        console.error('Analysis error:', error)
      } finally {
        setLoading(false)
      }
    })()
  }, [leadData])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <p>Analisando sua empresa...</p>
        </div>
      </div>
    )
  }

  if (!analysis) {
    return <p>Não foi possível gerar o relatório.</p>
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <button
        onClick={onClose}
        className="mb-4 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 text-sm font-medium"
      >
        ← Voltar ao formulário
      </button>
      <h2 className="text-2xl font-bold mb-6 text-center">
        Relatório Digital: {leadData.companyName}
      </h2>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <div>
          <h3 className="text-xl font-bold text-blue-600">{analysis.overallScore}/100</h3>
          <p className="text-sm text-gray-600">Score Geral de Presença Digital</p>
        </div>
        <div>
          <h3 className="text-xl font-bold text-green-600">{analysis.categoryScores.digitalPresence}/100</h3>
          <p className="text-sm text-gray-600">Presença Digital</p>
        </div>
        <div>
          <h3 className="text-xl font-bold text-green-600">{analysis.categoryScores.engagement}/100</h3>
          <p className="text-sm text-gray-600">Engajamento</p>
        </div>
        <div>
          <h3 className="text-xl font-bold text-green-600">{analysis.categoryScores.seo}/100</h3>
          <p className="text-sm text-gray-600">SEO & Site</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <div>
          <h3 className="text-xl font-bold text-green-600">{analysis.categoryScores.reputation}/100</h3>
          <p className="text-sm text-gray-600">Reputação</p>
        </div>
        <div>
          <h3 className="text-xl font-bold text-green-600">{analysis.categoryScores.operational}/100</h3>
          <p className="text-sm text-gray-600">Operacional</p>
        </div>
      </div>

      {/* Strengths */}
      {analysis.strengths.length > 0 && (
        <div className="mb-8 p-4 bg-green-50 rounded">
          <h3 className="font-medium text-green-700 mb-2">Pontos Fortes</h3>
          <ul className="space-y-1 text-sm">
            {analysis.strengths.map((s: string, i: number) => (
              <li key={i} className="flex items-start">
                <svg
                  className="h-4 w-4 text-green-500 flex-sr-0"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12 5v14M5 12h14M12 18h.01M8.59 8.59a.75.75 0 1 1 1.06-1.06l3 3a.75.75 0 0 1 0 1.06l-3 3a.75.75 0 1 1-1.06-1.06z"></path>
                </svg>
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Weaknesses */}
      {analysis.weaknesses.length > 0 && (
        <div className="mb-8 p-4 bg-red-50 rounded">
          <h3 className="font-medium text-red-700 mb-2">Pontos "Ruim" / Problemas</h3>
          <ul className="space-y-1 text-sm">
            {analysis.weaknesses.map((w: string, i: number) => (
              <li key={i} className="flex items-start">
                <svg
                  className="h-4 w-4 text-red-500 flex-sr-0"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M18 6L6 18M6 6l12 12"></path>
                </svg>
                <span>{w}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Opportunities */}
      {analysis.opportunities.length > 0 && (
        <div className="mb-8 p-4 bg-blue-50 rounded">
          <h3 className="font-medium text-blue-700 mb-2">Oportunidades de Melhoria</h3>
          <ul className="space-y-1 text-sm">
            {analysis.opportunities.map((o: string, i: number) => (
              <li key={i} className="flex items-start">
                <svg
                  className="h-4 w-4 text-blue-500 flex-sr-0 rotate-90"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12 5v14M5 12h14M12 18h.01M8.59 8.59a.75.75 0 1 1 1.06-1.06l3 3a.75.75 0 0 1 0 1.06l-3 3a.75.75 0 1 1-1.06-1.06z"></path>
                </svg>
                <span>{o}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* AI Recommendations */}
      {analysis.aiRecommendations.length > 0 && (
        <div className="mb-8">
          <h3 className="font-medium text-purple-700 mb-4">Recomendações de IA</h3>
          <div className="grid grid-cols-2 gap-3">
            {analysis.aiRecommendations.map((rec: any, i: number) => (
              <div
                key={i}
                className={`p-3 rounded ${rec.implementation === 'facil' ? 'bg-purple-100' : rec.implementation === 'medio' ? 'bg-purple-200' : 'bg-purple-300'}`}
              >
                <h4 className="font-semibold text-purple-800 mb-1">{rec.title}</h4>
                <p className="text-sm text-purple-600 line-clamp-2">{rec.description}</p>
                <div className="mt-2 flex gap-2">
                  <span className="px-2 py-1 text-xs rounded {rec.implementation === 'facil' ? 'bg-green-100 text-green-800' : rec.implementation === 'medio' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}">
                    Implementação: {rec.implementation}
                  </span>
                  <span className="px-2 py-1 text-xs rounded {rec.impact === 'alto' ? 'bg-green-100 text-green-800' : rec.impact === 'medio' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}">
                    Impacto: {rec.impact}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Web Results Summary */}
      {analysis.webResults.length > 0 && (
        <div>
          <h3 className="font-medium text-gray-700 mb-3">Resumo da Pesquisa Web</h3>
          <div className="space-y-2 text-sm">
            {analysis.webResults.map((result: any, i: number) => (
              <div key={i} className="p-3 rounded bg-gray-50">
                <h4 className="font-medium">{result.title}</h4>
                <p className="text-gray-600 line-clamp-2">{result.description}</p>
                <a
                  href={result.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline cursor-pointer text-sm"
                >
                  Ver detalhes no {result.source}
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-8 text-center">
        <button
          onClick={() => window.print()}
          className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors font-medium text-sm"
        >
          Imprimir/Download do Relatório
        </button>
        <button
          onClick={onClose}
          className="mt-2 px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded text-sm font-medium"
        >
          Fechar
        </button>
      </div>
    </div>
  )
}