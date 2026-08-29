import { useEffect, useState } from 'react'
import { LeadForm } from './components/LeadForm'
import { ReportView } from './components/ReportView'

export function App() {
  const [showReport, setShowReport] = useState(false)
  const [leadData, setLeadData] = useState<any>(null)

  const handleLeadSubmit = (e: any) => {
    setLeadData(e.detail)
    setShowReport(true)
    // Trigger the analysis pipeline
    runAnalysis(e.detail)
  }

  useEffect(() => {
    const handleEvent = (e: CustomEvent) => {
      const data = e.detail
      console.log('Lead data received:', data)
    }
    window.addEventListener('lead-submit', handleEvent)
    return () => window.removeEventListener('lead-submit', handleEvent)
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      {showReport ? (
        <ReportView
          leadData={leadData}
          onClose={() => setShowReport(false)}
        />
      ) : (
        <LeadForm onSubmit={handleLeadSubmit} />
      )}
    </div>
  )
}