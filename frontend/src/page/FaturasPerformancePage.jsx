import { useEffect, useState } from 'react'
import { Icon } from '@iconify/react'
import DashboardLayout from '../components/DashboardLayout'
import { getInvoices } from '../services/dashboardService'

function FaturasPerformancePage() {
  const [statusFilter, setStatusFilter] = useState('todas')
  const [periodFilter, setPeriodFilter] = useState('ultimas-4-semanas')
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    document.body.classList.add('scroll-enabled')
    return () => {
      document.body.classList.remove('scroll-enabled')
    }
  }, [])

  const [totals, setTotals] = useState({ total: 0, pending: 0, paid: 0, overdue: 0 })
  const [nextDueDate, setNextDueDate] = useState(null)
  const [weekNumber, setWeekNumber] = useState(null)

  // Carregar faturas do backend
  useEffect(() => {
    const loadInvoices = async () => {
      setLoading(true)
      try {
        const result = await getInvoices()
        if (result.success && result.data) {
          // Salvar totais
          if (result.totals) {
            setTotals(result.totals)
          }
          if (result.nextDueDate) {
            setNextDueDate(result.nextDueDate)
          }
          if (result.weekNumber) {
            setWeekNumber(result.weekNumber)
          }

          // Transformar dados do backend para o formato esperado pelo frontend
          const formattedInvoices = result.data.map((inv, index) => {
            const amount = inv.amount != null && !isNaN(inv.amount) ? Number(inv.amount) : 0;
            
            // Usar profit_amount do banco (se disponível) ou extrair da descrição
            let profit = inv.profit_amount != null && !isNaN(inv.profit_amount) ? Number(inv.profit_amount) : 0;
            
            // Se não tiver no banco, tentar extrair da descrição
            if (profit === 0) {
              const description = inv.description || ''
              const profitMatch = description.match(/Lucro:\s*\$?\s*([\d,\.]+)/i) || 
                                 description.match(/Lucro:\s*R\$?\s*([\d,\.]+)/i) ||
                                 description.match(/Lucro:\s*([\d,\.]+)/i)
              if (profitMatch) {
                const profitStr = profitMatch[1].replace(/\./g, '').replace(',', '.')
                profit = parseFloat(profitStr) || 0
              }
            }
            
            const planName = inv.plan_name || inv.planName || 'Nex Start'
            const feePercentage = inv.fee_percentage || 0
            
            // Calcular período da semana (segunda a sexta)
            const dueDate = inv.due_date ? new Date(inv.due_date) : new Date()
            const weekStart = new Date(dueDate)
            weekStart.setDate(dueDate.getDate() - 4) // Segunda-feira (4 dias antes da sexta)
            
            // Calcular número da semana
            const startOfYear = new Date(dueDate.getFullYear(), 0, 1)
            const days = Math.floor((dueDate - startOfYear) / (24 * 60 * 60 * 1000))
            const weekNum = Math.ceil((days + startOfYear.getDay() + 1) / 7)
            
            return {
              id: inv.invoice_number || `INV-${index + 1}`,
              week: `${planName} - Semana ${weekNum} • ${dueDate.getFullYear()}`,
              period: `${weekStart.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} a ${dueDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}`,
              profit: profit > 0 ? `$ ${profit.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '--',
              value: amount > 0 ? `$ ${amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '$ 0.00',
              dueDate: inv.due_date ? new Date(inv.due_date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A',
              status: inv.status === 'paid' ? 'paid' : inv.status === 'pending' ? 'pending' : inv.status === 'overdue' ? 'overdue' : 'exempt',
              isCurrent: inv.status === 'pending' && (!inv.due_date || new Date(inv.due_date) >= new Date()),
              planName: planName,
              feePercentage: feePercentage,
              rawAmount: amount,
              rawProfit: profit
            };
          })
          setInvoices(formattedInvoices)
        }
      } catch (error) {
        console.error('Erro ao carregar faturas:', error)
        // Manter dados mock em caso de erro
      } finally {
        setLoading(false)
      }
    }

    loadInvoices()
  }, [])

  // Dados mock como fallback
  const mockInvoices = [
    { 
      id: '#WK-42-2025', 
      week: 'Semana 42 • 2025', 
      period: '13 a 17 Out', 
      profit: '$ 281.66', 
      value: '$ 84.50', 
      dueDate: '17 Out 2025', 
      status: 'pending', 
      isCurrent: true 
    },
    { 
      id: '#WK-41-2025', 
      week: 'Semana 41 • 2025', 
      period: '06 a 10 Out', 
      profit: '$ 312.40', 
      value: '$ 93.72', 
      dueDate: '10 Out 2025', 
      status: 'paid' 
    },
    { 
      id: '#WK-40-2025', 
      week: 'Semana 40 • 2025', 
      period: '29 Set a 03 Out', 
      profit: '$ 198.00', 
      value: '$ 59.40', 
      dueDate: '03 Out 2025', 
      status: 'paid' 
    },
    { 
      id: '#WK-39-2025', 
      week: 'Semana 39 • 2025', 
      period: '22 a 26 Set', 
      profit: '--', 
      value: '$ 0.00', 
      dueDate: '26 Set 2025', 
      status: 'exempt' 
    },
    { 
      id: '#WK-38-2025', 
      week: 'Semana 38 • 2025', 
      period: '15 a 19 Set', 
      profit: '$ 420.00', 
      value: '$ 126.00', 
      dueDate: '19 Set 2025', 
      status: 'paid' 
    },
  ]

  // Filtrar faturas baseado nos filtros
  const filteredInvoices = invoices.filter(inv => {
    if (statusFilter === 'pendentes' && inv.status !== 'pending') return false
    if (statusFilter === 'pagas' && inv.status !== 'paid') return false
    return true
  })

  // Usar dados reais ou mock
  const displayInvoices = filteredInvoices.length > 0 ? filteredInvoices : (invoices.length > 0 ? invoices : mockInvoices)

  return (
    <DashboardLayout>
      <div className="px-4 sm:px-6 lg:px-16 py-6 sm:py-8 lg:py-12 pb-24 sm:pb-24 lg:pb-12">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 sm:mb-10 lg:mb-12 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-[32px] font-bold text-[#111827] mb-2 sm:mb-2.5 tracking-[-0.02em]">Faturas de Performance</h1>
            <p className="text-sm sm:text-[15px] text-[#6b7280] font-normal max-w-[600px]">
              Gerencie seus pagamentos semanais e veja o histórico completo das taxas geradas pela sua conta.
            </p>
          </div>
          <button className="w-full sm:w-auto flex items-center justify-center gap-2 sm:gap-2.5 px-4 sm:px-5 h-11 sm:h-12 bg-white text-[#111827] border border-[#ebebeb] rounded-xl text-xs sm:text-[13px] font-semibold cursor-pointer shadow-[0_1px_2px_rgba(0,0,0,0.03)] transition-all hover:border-[#00afaa] hover:text-[#00afaa] hover:shadow-[0_4px_12px_rgba(0,175,170,0.1)]">
            <Icon icon="lucide:download" className="text-base" />
            <span>Baixar Extrato Completo</span>
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {/* Total Pago */}
          <div className="bg-white p-6 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.02)] border border-[rgba(0,0,0,0.03)] flex flex-col justify-between h-[140px] transition-all hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(0,0,0,0.06)]">
            <div className="flex justify-between items-center mb-3">
              <span className="text-[13px] font-semibold text-[#6b7280] uppercase tracking-wider">Total Pago (Ano)</span>
              <div className="w-9 h-9 rounded-[10px] bg-[rgba(0,255,136,0.1)] flex items-center justify-center text-[#059669]">
                <Icon icon="lucide:check-circle" className="text-lg" />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <div className="text-[28px] font-bold text-[#111827] tracking-tight leading-tight">
                {loading ? '...' : `$ ${totals.paid.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              </div>
              <div className="text-[13px] text-[#9ca3af] font-medium">
                {invoices.filter(inv => inv.status === 'paid').length} semanas liquidadas
              </div>
            </div>
          </div>

          {/* Valor Pendente */}
          <div className="bg-white p-6 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.02)] border border-[rgba(0,0,0,0.03)] flex flex-col justify-between h-[140px] transition-all hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(0,0,0,0.06)]">
            <div className="flex justify-between items-center mb-3">
              <span className="text-[13px] font-semibold text-[#6b7280] uppercase tracking-wider">Valor Pendente</span>
              <div className="w-9 h-9 rounded-[10px] bg-[#fff7ed] flex items-center justify-center text-[#d97706]">
                <Icon icon="lucide:clock" className="text-lg" />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <div className="text-[28px] font-bold text-[#d97706] tracking-tight leading-tight">
                {loading ? '...' : `$ ${totals.pending.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              </div>
              <div className="text-[13px] text-[#9ca3af] font-medium">Fecha nesta sexta-feira</div>
            </div>
          </div>

          {/* Próximo Vencimento */}
          <div className="bg-white p-6 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.02)] border border-[rgba(0,0,0,0.03)] flex flex-col justify-between h-[140px] transition-all hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(0,0,0,0.06)]">
            <div className="flex justify-between items-center mb-3">
              <span className="text-[13px] font-semibold text-[#6b7280] uppercase tracking-wider">Próximo Vencimento</span>
              <div className="w-9 h-9 rounded-[10px] bg-[#f3f4f6] flex items-center justify-center text-[#111827]">
                <Icon icon="lucide:calendar" className="text-lg" />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <div className="text-[28px] font-bold text-[#111827] tracking-tight leading-tight">
                {loading ? '...' : (nextDueDate ? new Date(nextDueDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A')}
              </div>
              <div className="text-[13px] text-[#9ca3af] font-medium">
                Sexta-feira {weekNumber ? `(Semana ${weekNumber})` : ''}
              </div>
            </div>
          </div>
        </div>

        {/* Table Section */}
        <div className="bg-white rounded-2xl p-8 shadow-[0_4px_20px_rgba(0,0,0,0.02)] border border-[rgba(0,0,0,0.03)]">
          {/* Filter Toolbar */}
          <div className="flex mb-7">
            <div className="flex items-center gap-4">
              <div className="flex bg-[#f3f4f6] p-1 rounded-xl">
                <button
                  className={`px-4 py-2 text-[13px] font-semibold rounded-[10px] cursor-pointer transition-all ${
                    statusFilter === 'todas'
                      ? 'bg-white text-[#111827] shadow-[0_2px_4px_rgba(0,0,0,0.05)]'
                      : 'text-[#6b7280] hover:text-[#111827]'
                  }`}
                  onClick={() => setStatusFilter('todas')}
                >
                  Todas
                </button>
                <button
                  className={`px-4 py-2 text-[13px] font-semibold rounded-[10px] cursor-pointer transition-all ${
                    statusFilter === 'pendentes'
                      ? 'bg-white text-[#111827] shadow-[0_2px_4px_rgba(0,0,0,0.05)]'
                      : 'text-[#6b7280] hover:text-[#111827]'
                  }`}
                  onClick={() => setStatusFilter('pendentes')}
                >
                  Pendentes
                </button>
                <button
                  className={`px-4 py-2 text-[13px] font-semibold rounded-[10px] cursor-pointer transition-all ${
                    statusFilter === 'pagas'
                      ? 'bg-white text-[#111827] shadow-[0_2px_4px_rgba(0,0,0,0.05)]'
                      : 'text-[#6b7280] hover:text-[#111827]'
                  }`}
                  onClick={() => setStatusFilter('pagas')}
                >
                  Pagas
                </button>
              </div>
              <div className="w-px h-6 bg-[#ebebeb]" />
              <div className="flex bg-[#f3f4f6] p-1 rounded-xl">
                <button
                  className={`px-4 py-2 text-[13px] font-semibold rounded-[10px] cursor-pointer transition-all ${
                    periodFilter === 'ultimas-4-semanas'
                      ? 'bg-white text-[#111827] shadow-[0_2px_4px_rgba(0,0,0,0.05)]'
                      : 'text-[#6b7280] hover:text-[#111827]'
                  }`}
                  onClick={() => setPeriodFilter('ultimas-4-semanas')}
                >
                  Últimas 4 semanas
                </button>
                <button
                  className={`px-4 py-2 text-[13px] font-semibold rounded-[10px] cursor-pointer transition-all ${
                    periodFilter === 'ultimas-12-semanas'
                      ? 'bg-white text-[#111827] shadow-[0_2px_4px_rgba(0,0,0,0.05)]'
                      : 'text-[#6b7280] hover:text-[#111827]'
                  }`}
                  onClick={() => setPeriodFilter('ultimas-12-semanas')}
                >
                  Últimas 12 semanas
                </button>
                <button
                  className={`px-4 py-2 text-[13px] font-semibold rounded-[10px] cursor-pointer transition-all ${
                    periodFilter === 'todo-ano'
                      ? 'bg-white text-[#111827] shadow-[0_2px_4px_rgba(0,0,0,0.05)]'
                      : 'text-[#6b7280] hover:text-[#111827]'
                  }`}
                  onClick={() => setPeriodFilter('todo-ano')}
                >
                  Todo o ano
                </button>
              </div>
            </div>
          </div>

          {/* Desktop Table View */}
          <div className="hidden lg:flex flex-col w-full">
            {/* Table Header */}
            <div className="flex px-6 py-3 border-b border-[#ebebeb]">
              <div className="flex-[1.2] text-xs font-semibold text-[#9ca3af] uppercase tracking-wider">ID Fatura</div>
              <div className="flex-[2.2] text-xs font-semibold text-[#9ca3af] uppercase tracking-wider">Período (Semanal)</div>
              <div className="flex-[1.2] text-xs font-semibold text-[#9ca3af] uppercase tracking-wider">Valor da taxa</div>
              <div className="flex-[1.4] text-xs font-semibold text-[#9ca3af] uppercase tracking-wider">
                Vencimento
                <span className="font-normal normal-case ml-1 opacity-60">(Sexta-feira)</span>
              </div>
              <div className="flex-[1.2] text-xs font-semibold text-[#9ca3af] uppercase tracking-wider">Status</div>
              <div className="flex-1 text-xs font-semibold text-[#9ca3af] uppercase tracking-wider text-right">Ação</div>
            </div>

            {/* Table Rows */}
            {loading ? (
              <div className="px-6 py-8 text-center text-[#6b7280]">
                <div className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-[#00afaa]"></div>
                  <span>Carregando faturas...</span>
                </div>
              </div>
            ) : displayInvoices.length === 0 ? (
              <div className="px-6 py-8 text-center text-[#6b7280]">
                Nenhuma fatura encontrada
              </div>
            ) : (
              displayInvoices.map((invoice, index) => (
                <div
                  key={invoice.id || index}
                  className={`flex items-center px-6 py-5 border-b border-[#f9fafb] transition-all hover:bg-white hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(0,0,0,0.04)] hover:rounded-lg hover:z-10 hover:relative ${
                    index % 2 === 0 ? 'bg-[#fafafa]' : ''
                  } ${invoice.isCurrent ? 'bg-gradient-to-r from-[rgba(0,255,136,0.02)] to-transparent border-l-[3px] border-l-[#00ff88]' : ''} ${index === displayInvoices.length - 1 ? 'border-b-0' : ''}`}
                >
                  <div className="flex-[1.2] font-mono font-bold text-[#111827] tracking-tight text-sm">{invoice.id}</div>
                  <div className="flex-[2.2] flex flex-col gap-1">
                    <div className="flex items-center">
                      <span className="font-semibold text-[#111827] text-sm">{invoice.week}</span>
                      {invoice.isCurrent && (
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#00afaa] bg-[rgba(0,175,175,0.1)] px-2 py-0.5 rounded ml-2.5">
                          Semana atual
                        </span>
                      )}
                    </div>
                    <div className="flex items-center text-[13px] text-[#9ca3af]">
                      <Icon icon="lucide:calendar" className="text-xs mr-1" />
                      {invoice.period}
                      {invoice.rawProfit > 0 && (
                        <>
                          <span className="mx-2 opacity-50">•</span>
                          Lucro: {invoice.profit}
                        </>
                      )}
                      {invoice.planName && invoice.feePercentage > 0 && (
                        <>
                          <span className="mx-2 opacity-50">•</span>
                          {invoice.planName} ({invoice.feePercentage}%)
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex-[1.2] font-semibold text-[#111827] text-[15px]">{invoice.value}</div>
                  <div className="flex-[1.4] text-sm text-[#6b7280]">{invoice.dueDate}</div>
                  <div className="flex-[1.2]">
                    {invoice.status === 'paid' && (
                      <span className="inline-flex items-center justify-center px-3.5 py-1.5 rounded-full text-xs font-bold min-w-[80px] bg-[rgba(0,255,136,0.12)] text-[#059669]">
                        Pago
                      </span>
                    )}
                    {invoice.status === 'pending' && (
                      <span className="inline-flex items-center justify-center px-3.5 py-1.5 rounded-full text-xs font-bold min-w-[80px] bg-[#fff7ed] text-[#d97706]">
                        Pendente
                      </span>
                    )}
                    {invoice.status === 'exempt' && (
                      <span className="inline-flex items-center justify-center px-3.5 py-1.5 rounded-full text-xs font-bold min-w-[80px] bg-[#f3f4f6] text-[#9ca3af]">
                        Isento
                      </span>
                    )}
                    {invoice.status === 'overdue' && (
                      <span className="inline-flex items-center justify-center px-3.5 py-1.5 rounded-full text-xs font-bold min-w-[80px] bg-[#fee2e2] text-[#991b1b]">
                        Vencida
                      </span>
                    )}
                  </div>
                  <div className="flex-1 flex justify-end">
                    {invoice.status === 'pending' ? (
                      <button className="bg-[#00afaa] text-white border-none px-4 py-1.5 rounded-lg text-[13px] font-semibold cursor-pointer shadow-[0_4px_12px_rgba(0,175,170,0.25)] transition-all hover:bg-[#009691] hover:-translate-y-0.5 hover:shadow-[0_6px_16px_rgba(0,175,170,0.35)]">
                        Pagar
                      </button>
                    ) : invoice.status === 'paid' ? (
                      <button className="w-8 h-8 rounded-lg border border-transparent bg-transparent flex items-center justify-center text-[#6b7280] cursor-pointer transition-all hover:bg-white hover:border-[#e5e7eb] hover:text-[#111827] hover:shadow-[0_2px_6px_rgba(0,0,0,0.05)]">
                        <Icon icon="lucide:download" className="text-lg" />
                      </button>
                    ) : (
                      <span className="text-xs text-[#9ca3af] italic">Sem lucro</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Mobile Card View */}
          <div className="lg:hidden space-y-4">
            {loading ? (
              <div className="py-8 text-center text-[#6b7280]">
                <div className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-[#00afaa]"></div>
                  <span>Carregando faturas...</span>
                </div>
              </div>
            ) : displayInvoices.length === 0 ? (
              <div className="py-8 text-center text-[#6b7280]">
                Nenhuma fatura encontrada
              </div>
            ) : (
              displayInvoices.map((invoice, index) => (
                <div
                  key={invoice.id || index}
                  className={`bg-white rounded-xl p-4 border ${
                    invoice.isCurrent 
                      ? 'border-l-4 border-l-[#00ff88] bg-gradient-to-r from-[rgba(0,255,136,0.02)] to-white' 
                      : 'border-[#e5e7eb]'
                  } shadow-sm`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="font-mono font-bold text-[#111827] text-sm mb-1">{invoice.id}</div>
                      <div className="flex items-center flex-wrap gap-2 mb-2">
                        <span className="font-semibold text-[#111827] text-sm">{invoice.week}</span>
                        {invoice.isCurrent && (
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#00afaa] bg-[rgba(0,175,175,0.1)] px-2 py-0.5 rounded">
                            Semana atual
                          </span>
                        )}
                      </div>
                      <div className="flex items-center text-xs text-[#6b7280] gap-1.5 flex-wrap">
                        <Icon icon="lucide:calendar" className="text-xs flex-shrink-0" />
                        <span>{invoice.period}</span>
                      </div>
                    </div>
                    <div>
                      {invoice.status === 'paid' && (
                        <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-full text-xs font-bold bg-[rgba(0,255,136,0.12)] text-[#059669]">
                          Pago
                        </span>
                      )}
                      {invoice.status === 'pending' && (
                        <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-full text-xs font-bold bg-[#fff7ed] text-[#d97706]">
                          Pendente
                        </span>
                      )}
                      {invoice.status === 'exempt' && (
                        <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-full text-xs font-bold bg-[#f3f4f6] text-[#9ca3af]">
                          Isento
                        </span>
                      )}
                      {invoice.status === 'overdue' && (
                        <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-full text-xs font-bold bg-[#fee2e2] text-[#991b1b]">
                          Vencida
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[#e5e7eb]">
                    <div>
                      <div className="text-[10px] font-semibold text-[#9ca3af] uppercase tracking-wider mb-1">Valor da Taxa</div>
                      <div className="text-base font-bold text-[#111827]">{invoice.value}</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-semibold text-[#9ca3af] uppercase tracking-wider mb-1">Vencimento</div>
                      <div className="text-sm text-[#6b7280]">{invoice.dueDate}</div>
                    </div>
                  </div>
                  {invoice.rawProfit > 0 && (
                    <div className="mt-2 pt-2 border-t border-[#e5e7eb]">
                      <div className="text-[10px] font-semibold text-[#9ca3af] uppercase tracking-wider mb-1">Lucro</div>
                      <div className="text-sm font-semibold text-[#059669]">{invoice.profit}</div>
                    </div>
                  )}
                  {invoice.planName && invoice.feePercentage > 0 && (
                    <div className="mt-2 text-xs text-[#9ca3af]">
                      {invoice.planName} ({invoice.feePercentage}%)
                    </div>
                  )}
                  <div className="mt-3 pt-3 border-t border-[#e5e7eb] flex justify-end">
                    {invoice.status === 'pending' ? (
                      <button className="bg-[#00afaa] text-white border-none px-4 py-2 rounded-lg text-sm font-semibold cursor-pointer shadow-[0_4px_12px_rgba(0,175,170,0.25)] transition-all hover:bg-[#009691] active:scale-95 w-full sm:w-auto">
                        Pagar Agora
                      </button>
                    ) : invoice.status === 'paid' ? (
                      <button className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-[#e5e7eb] bg-white text-[#6b7280] cursor-pointer transition-all hover:bg-[#f9fafb] hover:border-[#d1d5db] active:scale-95">
                        <Icon icon="lucide:download" className="text-base" />
                        <span className="text-sm font-medium">Baixar</span>
                      </button>
                    ) : (
                      <span className="text-xs text-[#9ca3af] italic">Sem ação disponível</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Table Footer */}
          <div className="mt-6 text-center border-t border-[#f3f4f6] pt-6">
            <p className="text-xs text-[#9ca3af] m-0">
              As faturas são geradas automaticamente toda sexta-feira conforme desempenho operacional da sua conta MT4. • Fechamento semanal – TraderNex
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default FaturasPerformancePage
