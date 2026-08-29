import { useState } from 'react'

interface FormData {
  companyName: string
  segment: string
  instagramUrl: string
  websiteUrl: string
  whatsappUrl: string
  usesAI: boolean
  aiDescription: string
}

interface FormErrors {
  companyName?: string
  segment?: string
  instagramUrl?: string
  websiteUrl?: string
  whatsappUrl?: string
}

export function useLeadForm() {
  const [form, setForm] = useState<FormData>({
    companyName: '',
    segment: '',
    instagramUrl: '',
    websiteUrl: '',
    whatsappUrl: '',
    usesAI: false,
    aiDescription: '',
  })

  const [errors, setErrors] = useState<FormErrors>({})

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type, checked } = e.target
    setForm({
      ...form,
      [name]: type === 'checkbox' ? checked : value,
    })
  }

  const validate = (): boolean => {
    const errors: FormErrors = {}
    
    if (!form.companyName.trim()) errors.companyName = 'Nome da empresa é obrigatório'
    if (!form.segment.trim()) errors.segment = 'Segmento é obrigatório'
    if (!form.instagramUrl.trim()) errors.instagramUrl = 'Link do Instagram é obrigatório'
    if (!form.websiteUrl.trim()) errors.websiteUrl = 'Link do site é obrigatório'
    if (!form.whatsappUrl.trim()) errors.whatsappUrl = 'Link do WhatsApp é obrigatório'

    setErrors(errors)
    return Object.keys(errors).length === 0
  }

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validate()) {
      const submitData = {
        ...form,
        timestamp: new Date().toISOString(),
      }
      window.dispatchEvent(new CustomEvent('lead-submit', { detail: submitData }))
    }
  }

  return {
    form,
    errors,
    handleChange,
    onSubmit,
    validate,
  }
}

export function LeadForm() {
  const { form, errors, handleChange, onSubmit } = useLeadForm()

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold mb-6 text-center border-b pb-2">Investigação Digital da Empresa</h2>
      
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Nome da Empresa</label>
          <input
            type="text"
            name="companyName"
            value={form.companyName}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded focus outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Ex: Loja XYZ Ltda"
          />
          {errors.companyName && <p className="text-sm text-red-600 mt-1">{errors.companyName}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Segmento/Setor</label>
          <input
            type="text"
            name="segment"
            value={form.segment}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded focus outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Ex: Comércio, Serviços, Indústria"
          />
          {errors.segment && <p className="text-sm text-red-600 mt-1">{errors.segment}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Link do Instagram</label>
          <input
            type="url"
            name="instagramUrl"
            value={form.instagramUrl}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded focus outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="https://instagram.com/empresa"
          />
          {errors.instagramUrl && <p className="text-sm text-red-600 mt-1">{errors.instagramUrl}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Link do Site</label>
          <input
            type="url"
            name="websiteUrl"
            value={form.websiteUrl}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded focus outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="https://www.empresaxyz.com"
          />
          {errors.websiteUrl && <p className="text-sm text-red-600 mt-1">{errors.websiteUrl}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Link do WhatsApp</label>
          <input
            type="text"
            name="whatsappUrl"
            value={form.whatsappUrl}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded focus outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="+55 11 98888-7777"
          />
          {errors.whatsappUrl && <p className="text-sm text-red-600 mt-1">{errors.whatsappUrl}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">O Usa IA no Negócio?</label>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              name="usesAI"
              checked={form.usesAI}
              onChange={handleChange}
              className="rounded border-gray-500 w-4 h-4 focus:ring-blue-500"
            />
            <span className="text-sm">Sim, descreva como:</span>
          </div>
          {form.usesAI && (
            <textarea
              name="aiDescription"
              value={form.aiDescription}
              onChange={handleChange}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded focus outline-none focus:ring-2 focus:ring-blue-500 mt-2"
              placeholder="Ex: Usamos ChatGPT para atendimento, automação de e-mails, etc."
            />)
        </div>

        <button
          type="submit"
          className="w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors font-medium"
        >
          Gerar Relatório Grátis
        </button>
      </form>
    </div>
  )
}