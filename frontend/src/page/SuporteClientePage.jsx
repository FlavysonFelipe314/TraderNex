import { useEffect, useState } from 'react'
import { Icon } from '@iconify/react'
import DashboardLayout from '../components/DashboardLayout'
import { getUserTickets, createTicket } from '../services/supportService'

function SuporteClientePage() {
  const [expandedFaq, setExpandedFaq] = useState(null)
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    document.body.classList.add('scroll-enabled')
    return () => {
      document.body.classList.remove('scroll-enabled')
    }
  }, [])

  // Carregar tickets do usuário
  useEffect(() => {
    const loadTickets = async () => {
      try {
        const result = await getUserTickets()
        if (result.success) {
          setTickets(result.data || [])
        }
      } catch (error) {
        console.error('Erro ao carregar tickets:', error)
      }
    }

    loadTickets()
  }, [])

  const handleCreateTicket = async (subject, message, category = 'technical') => {
    setLoading(true)
    try {
      const result = await createTicket({
        subject,
        message,
        category,
        priority: 'medium'
      })
      if (result.success) {
        // Recarregar lista de tickets
        const ticketsResult = await getUserTickets()
        if (ticketsResult.success) {
          setTickets(ticketsResult.data || [])
        }
        return { success: true, message: result.message }
      } else {
        return { success: false, message: result.message }
      }
    } catch (error) {
      console.error('Erro ao criar ticket:', error)
      return { success: false, message: 'Erro ao criar ticket. Tente novamente.' }
    } finally {
      setLoading(false)
    }
  }

  const faqs = [
    { id: 1, question: 'Como conectar minha conta MT4 pela primeira vez?' },
    { id: 2, question: 'Qual o horário de funcionamento do suporte?' },
    { id: 3, question: 'Como funciona a cobrança da taxa de performance?' },
    { id: 4, question: 'Posso fazer upgrade do meu plano?' },
    { id: 5, question: 'Minha conta está sem trades, o que fazer?' },
  ]

  const articles = [
    { id: 1, title: 'Como conectar sua conta MT4 na TraderNex', icon: 'lucide:plug' },
    { id: 2, title: 'Como funciona a taxa de performance semanal?', icon: 'lucide:percent' },
    { id: 3, title: 'Como usar o app MT4 no celular', icon: 'lucide:smartphone' },
  ]

  const toggleFaq = (id) => {
    setExpandedFaq(expandedFaq === id ? null : id)
  }

  return (
    <DashboardLayout>
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-10 py-6 sm:py-8 lg:py-12">
        {/* Hero Section */}
        <div className="mb-8 sm:mb-10 lg:mb-12">
          <h1 className="text-2xl sm:text-3xl lg:text-[32px] font-bold text-[#111827] mb-3 tracking-[-0.02em]">Central de Ajuda</h1>
          <p className="text-sm sm:text-base text-[#6b7280] max-w-[600px] leading-relaxed">
            Fale com nossa equipe e resolva qualquer dúvida sobre sua conta, Forex e operações com a Falcon FX.
          </p>
        </div>

        {/* Contact Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-10 lg:mb-12">
          {/* WhatsApp Card */}
          <div className="bg-white rounded-xl sm:rounded-2xl p-5 sm:p-6 lg:p-8 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05),0_2px_4px_-1px_rgba(0,0,0,0.03)] border border-[rgba(0,255,136,0.2)] relative overflow-hidden hover:-translate-y-1 transition-transform">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#00ff88] to-[#00afaa]" />
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-[rgba(0,255,136,0.15)] flex items-center justify-center mb-4 sm:mb-6 text-[#002914]">
              <Icon icon="lucide:message-circle" className="text-2xl sm:text-[28px]" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-[#111827] mb-2">Chat via WhatsApp</h3>
            <p className="text-xs sm:text-sm text-[#6b7280] mb-4 sm:mb-5 leading-relaxed flex-1">
              Atendimento rápido para dúvidas gerais e suporte comercial.
            </p>
            <div className="inline-flex items-center gap-1.5 text-[10px] sm:text-xs font-semibold px-2 sm:px-2.5 py-1 rounded-full bg-[#dcfce7] text-[#166534] mb-4 sm:mb-6">
              <div className="w-1.5 h-1.5 rounded-full bg-current" />
              <span className="whitespace-nowrap">Online agora — tempo médio 2 min</span>
            </div>
            <button className="w-full h-11 sm:h-12 rounded-[10px] text-xs sm:text-sm font-semibold flex items-center justify-center cursor-pointer transition-all bg-[#00ff88] text-[#002914] shadow-[0_4px_12px_rgba(0,255,136,0.25)] hover:bg-[#00cc6a] hover:shadow-[0_6px_16px_rgba(0,255,136,0.35)]">
              Iniciar Conversa
            </button>
          </div>

          {/* Ticket Card */}
          <div className="bg-white rounded-2xl p-8 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05),0_2px_4px_-1px_rgba(0,0,0,0.03)] border border-[#e5e7eb] hover:-translate-y-1 transition-transform">
            <div className="w-14 h-14 rounded-2xl bg-[#f3f4f6] flex items-center justify-center mb-6 text-[#111827]">
              <Icon icon="lucide:ticket" className="text-[28px]" />
            </div>
            <h3 className="text-lg font-bold text-[#111827] mb-2">Abrir Ticket Técnico</h3>
            <p className="text-sm text-[#6b7280] mb-5 leading-relaxed flex-1">
              Para questões técnicas ou problemas com MT4. Resposta em até 24h.
            </p>
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-[#fef3c7] text-[#b45309] mb-6">
              <div className="w-1.5 h-1.5 rounded-full bg-current" />
              Fila baixa
            </div>
            <button className="w-full h-12 rounded-[10px] text-sm font-semibold flex items-center justify-center cursor-pointer transition-all bg-white border border-[#e5e7eb] text-[#111827] hover:border-[#00afaa] hover:text-[#00afaa] hover:bg-[rgba(0,175,170,0.03)]">
              Novo Ticket
            </button>
          </div>

          {/* Knowledge Base Card */}
          <div className="bg-white rounded-2xl p-8 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05),0_2px_4px_-1px_rgba(0,0,0,0.03)] border border-[#e5e7eb] hover:-translate-y-1 transition-transform">
            <div className="w-14 h-14 rounded-2xl bg-[#f3f4f6] flex items-center justify-center mb-6 text-[#111827]">
              <Icon icon="lucide:book-open" className="text-[28px]" />
            </div>
            <h3 className="text-lg font-bold text-[#111827] mb-2">Base de Conhecimento</h3>
            <p className="text-sm text-[#6b7280] mb-5 leading-relaxed flex-1">
              Tutoriais passo a passo sobre MT4, depósitos, performance e plataforma.
            </p>
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-[#f3f4f6] text-[#4b5563] mb-6">
              +40 artigos disponíveis
            </div>
            <button className="w-full h-12 rounded-[10px] text-sm font-semibold flex items-center justify-center cursor-pointer transition-all bg-white border border-[#e5e7eb] text-[#111827] hover:border-[#00afaa] hover:text-[#00afaa] hover:bg-[rgba(0,175,170,0.03)]">
              Acessar Artigos
            </button>
          </div>
        </div>

        {/* Recommended Articles */}
        <div className="mb-12">
          <div className="flex items-center gap-2 text-base font-semibold text-[#111827] mb-4">
            <Icon icon="lucide:star" className="text-lg" />
            Artigos recomendados
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {articles.map((article) => (
              <div
                key={article.id}
                className="bg-white border border-[#e5e7eb] rounded-xl p-4 flex items-center gap-4 cursor-pointer transition-all hover:border-[#00afaa] hover:shadow-[0_4px_12px_rgba(0,0,0,0.03)]"
              >
                <div className="w-10 h-10 rounded-lg bg-[#f9fafb] flex items-center justify-center text-[#00afaa] flex-shrink-0">
                  <Icon icon={article.icon} className="text-xl" />
                </div>
                <span className="text-sm font-medium text-[#111827] leading-snug">{article.title}</span>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ & Emergency */}
        <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-12 mb-12">
          {/* FAQ Section */}
          <div>
            <div className="flex items-center gap-2 text-base font-semibold text-[#111827] mb-4">
              <Icon icon="lucide:help-circle" className="text-lg" />
              Perguntas Frequentes
            </div>
            <div className="flex flex-col gap-3">
              {faqs.map((faq) => (
                <div
                  key={faq.id}
                  className="bg-white border border-[#e5e7eb] rounded-xl px-6 py-4.5 cursor-pointer transition-all hover:border-[#d1d5db] hover:bg-[#fafafa] flex justify-between items-center"
                  onClick={() => toggleFaq(faq.id)}
                >
                  <span className="text-[15px] font-medium text-[#111827]">{faq.question}</span>
                  <Icon 
                    icon="lucide:chevron-down" 
                    className={`text-lg text-[#9ca3af] transition-transform ${expandedFaq === faq.id ? 'rotate-180' : ''}`}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Emergency Box */}
          <div className="bg-[#fef2f2] border border-[#fecaca] rounded-2xl p-6">
            <div className="flex items-center gap-2.5 text-base font-bold text-[#991b1b] mb-2">
              <Icon icon="lucide:alert-triangle" className="text-xl" />
              Ajuda urgente
            </div>
            <p className="text-[13px] text-[#7f1d1d] leading-relaxed mb-5">
              Se sua conta parou de operar ou apresentou falhas graves, clique abaixo para suporte prioritário.
            </p>
            <button className="w-full h-10 bg-white border border-[#fecaca] rounded-lg text-[#dc2626] text-[13px] font-semibold cursor-pointer flex items-center justify-center gap-2 transition-all hover:bg-[#fef2f2] hover:border-[#ef4444]">
              Suporte de Emergência
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-[#e5e7eb] pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-[13px] text-[#6b7280]">
          <div className="flex flex-wrap gap-6">
            <a href="mailto:suporte@tradernex.com" className="text-[#111827] font-medium hover:text-[#00afaa] transition-colors">
              suporte@tradernex.com
            </a>
            <a href="mailto:financeiro@tradernex.com" className="text-[#111827] font-medium hover:text-[#00afaa] transition-colors">
              financeiro@tradernex.com
            </a>
            <a href="mailto:contato@tradernex.com" className="text-[#111827] font-medium hover:text-[#00afaa] transition-colors">
              contato@tradernex.com
            </a>
          </div>
          <div className="flex items-center gap-2 font-medium">
            <Icon icon="lucide:clock" className="text-sm" />
            Atendimento: 09h às 22h — Seg à Dom
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default SuporteClientePage
