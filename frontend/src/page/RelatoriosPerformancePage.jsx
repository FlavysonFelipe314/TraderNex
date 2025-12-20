import { useEffect, useState, useMemo } from 'react'
import { Icon } from '@iconify/react'
import DashboardLayout from '../components/DashboardLayout'
import { getPerformanceStats, getMyfxbookData } from '../services/dashboardService'

function RelatoriosPerformancePage() {
  const [selectedPeriod, setSelectedPeriod] = useState('este-mes')
  const [customDateRange, setCustomDateRange] = useState(false)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [performanceData, setPerformanceData] = useState(null)
  const [myfxbookData, setMyfxbookData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    document.body.classList.add('scroll-enabled')
    return () => {
      document.body.classList.remove('scroll-enabled')
    }
  }, [])

  // Calcular datas baseadas no período selecionado
  const getDateRange = useMemo(() => {
    const end = new Date()
    const start = new Date()
    
    if (customDateRange && startDate && endDate) {
      return { startDate, endDate }
    }

    switch (selectedPeriod) {
      case 'hoje':
        start.setHours(0, 0, 0, 0)
        break
      case '7-dias':
        start.setDate(start.getDate() - 7)
        break
      case 'este-mes':
        start.setDate(1)
        start.setHours(0, 0, 0, 0)
        break
      case 'este-ano':
        start.setMonth(0, 1)
        start.setHours(0, 0, 0, 0)
        break
      default:
        start.setFullYear(start.getFullYear() - 1)
    }

    return {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0]
    }
  }, [selectedPeriod, customDateRange, startDate, endDate])

  // Carregar dados de performance e MyFXBook
  useEffect(() => {
    const loadPerformanceData = async () => {
      setLoading(true)
      try {
        const { startDate: start, endDate: end } = getDateRange
        
        // Carregar dados do MyFXBook com filtros de data
        const myfxbookResult = await getMyfxbookData(start, end)
        if (myfxbookResult.success && myfxbookResult.data?.connected) {
          setMyfxbookData(myfxbookResult.data)
        }

        // Carregar dados de performance como fallback
        const periodMap = {
          'hoje': 'day',
          '7-dias': 'week',
          'este-mes': 'month',
          'este-ano': 'year'
        }
        const backendPeriod = periodMap[selectedPeriod] || 'month'
        const result = await getPerformanceStats(backendPeriod)
        if (result.success) {
          setPerformanceData(result.data)
        }
      } catch (error) {
        console.error('Erro ao carregar dados de performance:', error)
      } finally {
        setLoading(false)
      }
    }

    loadPerformanceData()
  }, [selectedPeriod, customDateRange, startDate, endDate, getDateRange])

  // Calcular KPIs baseados em dados do MyFXBook
  const kpis = useMemo(() => {
    if (!myfxbookData?.account) {
      return {
        totalReturn: 0,
        netProfit: 0,
        profitFactor: 0,
        maxDrawdown: 0,
        periodGain: 0,
        openTrades: 0,
        openOrders: 0,
        totalTrades: 0,
        pips: 0,
        lots: 0
      }
    }

    const account = myfxbookData.account
    const periodGain = myfxbookData.gain !== null && myfxbookData.gain !== undefined 
      ? parseFloat(myfxbookData.gain) 
      : null

    return {
      totalReturn: parseFloat(account.absGain || account.gain || 0),
      netProfit: parseFloat(account.profit || 0),
      profitFactor: parseFloat(account.profitFactor || 0),
      maxDrawdown: Math.abs(parseFloat(account.drawdown || 0)),
      periodGain: periodGain,
      openTrades: myfxbookData.openTrades?.length || 0,
      openOrders: myfxbookData.openOrders?.length || 0,
      totalTrades: myfxbookData.history?.length || 0,
      pips: parseFloat(account.pips || 0),
      lots: parseFloat(account.lots || 0)
    }
  }, [myfxbookData])

  // Processar histórico mensal dos dados do MyFXBook
  const monthlyHistory = useMemo(() => {
    if (!myfxbookData?.history || myfxbookData.history.length === 0) {
      return []
    }

    // Agrupar trades por mês
    const monthlyMap = new Map()
    
    myfxbookData.history.forEach(trade => {
      const date = new Date(trade.closeTime || trade.time || trade.date)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      const monthLabel = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
      
      if (!monthlyMap.has(monthKey)) {
        monthlyMap.set(monthKey, {
          period: monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1),
          trades: 0,
          profit: 0,
          drawdown: 0,
          return: 0
        })
      }
      
      const monthData = monthlyMap.get(monthKey)
      monthData.trades += 1
      const profit = parseFloat(trade.profit || 0)
      monthData.profit += profit
    })

    // Calcular drawdown e retorno para cada mês
    if (myfxbookData.dailyGain && myfxbookData.dailyGain.length > 0) {
      myfxbookData.dailyGain.forEach(day => {
        const date = new Date(day.date || day.time)
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        
        if (monthlyMap.has(monthKey)) {
          const monthData = monthlyMap.get(monthKey)
          const drawdown = Math.abs(parseFloat(day.drawdown || 0))
          if (drawdown > monthData.drawdown) {
            monthData.drawdown = drawdown
          }
        }
      })
    }

    // Converter para array e ordenar por data (mais recente primeiro)
    const history = Array.from(monthlyMap.values())
      .map(month => ({
        ...month,
        profitFormatted: month.profit >= 0 
          ? `$ ${month.profit.toFixed(2)}` 
          : `-$ ${Math.abs(month.profit).toFixed(2)}`,
        drawdownFormatted: `${month.drawdown.toFixed(2)}%`,
        returnFormatted: month.profit >= 0 
          ? `+${((month.profit / (kpis.netProfit || 1)) * 100).toFixed(1)}%` 
          : `${((month.profit / (kpis.netProfit || 1)) * 100).toFixed(1)}%`,
        isPositive: month.profit >= 0,
        isWarning: month.drawdown > 3
      }))
      .sort((a, b) => {
        // Ordenar por período (mais recente primeiro)
        const dateA = new Date(a.period)
        const dateB = new Date(b.period)
        return dateB - dateA
      })
      .slice(0, 12) // Últimos 12 meses

    return history
  }, [myfxbookData, kpis.netProfit])

  // Dados do gráfico
  const chartData = useMemo(() => {
    // Prioridade 1: Dados do MyFXBook (dataDaily)
    if (myfxbookData?.dataDaily && myfxbookData.dataDaily.length > 0) {
      return myfxbookData.dataDaily.map(item => ({
        date: new Date(item.date || item.time),
        equity: parseFloat(item.equity || 0),
        balance: parseFloat(item.balance || 0)
      })).sort((a, b) => a.date - b.date)
    }
    
    // Prioridade 2: Dados do MyFXBook (dailyGain)
    if (myfxbookData?.dailyGain && myfxbookData.dailyGain.length > 0) {
      let cumulative = 0
      return myfxbookData.dailyGain.map(item => {
        cumulative += parseFloat(item.gain || item.profit || 0)
        return {
          date: new Date(item.date || item.time),
          equity: cumulative,
          balance: cumulative
        }
      }).sort((a, b) => a.date - b.date)
    }
    
    // Prioridade 3: Dados de performance do backend (fallback)
    if (performanceData && Array.isArray(performanceData) && performanceData.length > 0) {
      let cumulativeBalance = 0
      let cumulativeEquity = 0
      
      return performanceData.map(item => {
        const netProfit = parseFloat(item.net_profit || item.value || 0)
        cumulativeBalance += netProfit
        cumulativeEquity += netProfit
        
        return {
          date: new Date(item.report_date || item.date),
          equity: cumulativeEquity,
          balance: cumulativeBalance
        }
      }).sort((a, b) => a.date - b.date)
    }
    
    return []
  }, [myfxbookData, performanceData])

  // Exportar CSV
  const handleExportCSV = () => {
    if (!myfxbookData) {
      alert('Nenhum dado disponível para exportar')
      return
    }

    let csvContent = 'data:text/csv;charset=utf-8,'
    
    // Cabeçalho
    csvContent += 'Período,Operações,Drawdown,Lucro Líquido,Retorno\n'
    
    // Dados mensais
    monthlyHistory.forEach(month => {
      csvContent += `"${month.period}",${month.trades} trades,"${month.drawdownFormatted}","${month.profitFormatted}","${month.returnFormatted}"\n`
    })
    
    // Criar link de download
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `relatorio-performance-${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const periods = [
    { id: 'hoje', label: 'Hoje' },
    { id: '7-dias', label: '7 dias' },
    { id: 'este-mes', label: 'Este mês' },
    { id: 'este-ano', label: 'Este ano' },
  ]

  return (
    <DashboardLayout>
      <div className="px-4 sm:px-6 lg:px-16 py-6 sm:py-8 lg:py-12">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 sm:mb-10 lg:mb-12 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-[32px] font-bold text-[#111827] mb-2 sm:mb-2.5 tracking-[-0.02em]">Relatórios de Performance</h1>
            <p className="text-sm sm:text-[15px] text-[#6b7280] font-normal">
              Análise detalhada da evolução e resultados institucionais da sua conta.
            </p>
          </div>
          <div className="flex flex-col gap-4 w-full">
            {/* Filter Pills */}
            <div className="flex flex-wrap gap-3 items-center">
              <div className="flex bg-white rounded-xl p-1 border border-[#ebebeb] shadow-[0_2px_4px_rgba(0,0,0,0.02)] overflow-x-auto">
                {periods.map((period) => (
                  <button
                    key={period.id}
                    className={`px-4 sm:px-6 py-2 text-xs sm:text-[13px] font-medium rounded-lg transition-all whitespace-nowrap ${
                      selectedPeriod === period.id && !customDateRange
                        ? 'bg-white text-[#00afaa] font-bold shadow-[0_2px_8px_rgba(0,0,0,0.06)] border border-[#f0f0f0]'
                        : 'text-[#6b7280] hover:text-[#111827] hover:bg-[#f9fafb]'
                    }`}
                    onClick={() => {
                      setSelectedPeriod(period.id)
                      setCustomDateRange(false)
                    }}
                  >
                    {period.label}
                  </button>
                ))}
              </div>
              
              {/* Custom Date Range Toggle */}
              <button
                className={`px-4 py-2 text-xs sm:text-[13px] font-medium rounded-lg transition-all whitespace-nowrap border ${
                  customDateRange
                    ? 'bg-white text-[#00afaa] font-bold shadow-[0_2px_8px_rgba(0,0,0,0.06)] border-[#00afaa]'
                    : 'bg-white text-[#6b7280] border-[#ebebeb] hover:text-[#111827] hover:bg-[#f9fafb]'
                }`}
                onClick={() => {
                  setCustomDateRange(!customDateRange)
                  if (!customDateRange) {
                    const end = new Date()
                    const start = new Date()
                    start.setFullYear(start.getFullYear() - 1)
                    setEndDate(end.toISOString().split('T')[0])
                    setStartDate(start.toISOString().split('T')[0])
                  }
                }}
              >
                <Icon icon="lucide:calendar-range" className="inline mr-1.5" />
                Período Personalizado
              </button>
              
              {/* Export Button */}
              <button 
                onClick={handleExportCSV}
                className="flex items-center gap-2 px-5 h-11 bg-white text-[#111827] border border-[#e5e7eb] rounded-xl text-[13px] font-semibold cursor-pointer shadow-[0_1px_2px_rgba(0,0,0,0.03)] transition-all hover:border-[#00ff88] hover:shadow-[0_0_0_3px_rgba(0,255,136,0.1)] hover:text-[#00afaa]"
              >
                <Icon icon="lucide:download" className="text-base" />
                <span>CSV</span>
              </button>
            </div>

            {/* Custom Date Range Inputs */}
            {customDateRange && (
              <div className="flex flex-wrap gap-3 items-center bg-white p-4 rounded-xl border border-[#ebebeb] shadow-[0_2px_4px_rgba(0,0,0,0.02)]">
                <div className="flex items-center gap-2">
                  <label className="text-xs sm:text-[13px] font-medium text-[#6b7280] whitespace-nowrap">
                    De:
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    max={endDate || new Date().toISOString().split('T')[0]}
                    className="px-3 py-2 text-xs sm:text-[13px] border border-[#e5e7eb] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00afaa] focus:border-transparent"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs sm:text-[13px] font-medium text-[#6b7280] whitespace-nowrap">
                    Até:
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    min={startDate}
                    max={new Date().toISOString().split('T')[0]}
                    className="px-3 py-2 text-xs sm:text-[13px] border border-[#e5e7eb] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00afaa] focus:border-transparent"
                  />
                </div>
                {startDate && endDate && (
                  <div className="text-xs text-[#6b7280] ml-auto">
                    Período selecionado: {new Date(startDate).toLocaleDateString('pt-BR')} - {new Date(endDate).toLocaleDateString('pt-BR')}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* KPIs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8 sm:mb-10 lg:mb-12">
          {/* Retorno Total */}
          <div className="bg-white p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-[0_8px_24px_rgba(0,0,0,0.04)] border border-[rgba(0,0,0,0.02)] hover:-translate-y-1 transition-all flex flex-col justify-between min-h-[120px] sm:h-[140px]">
            <div className="flex justify-between items-start mb-3">
              <span className="text-[11px] font-bold text-[#9ca3af] uppercase tracking-wider">RETORNO TOTAL</span>
              <div className="w-8 h-8 rounded-[10px] bg-[rgba(0,255,136,0.1)] flex items-center justify-center text-[#059669]">
                <Icon icon="lucide:trending-up" className="text-base" />
              </div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl lg:text-[32px] font-bold text-[#059669] tracking-tight leading-none mb-1.5">
                {loading ? '...' : `${kpis.totalReturn >= 0 ? '+' : ''}${kpis.totalReturn.toFixed(2)}%`}
              </div>
              <div className="text-xs sm:text-[13px] text-[#9ba0aa] font-normal">Desde o início</div>
            </div>
          </div>

          {/* Ganho do Período */}
          {kpis.periodGain !== null && (
            <div className="bg-white p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-[0_8px_24px_rgba(0,0,0,0.04)] border border-[rgba(0,0,0,0.02)] hover:-translate-y-1 transition-all flex flex-col justify-between min-h-[120px] sm:h-[140px]">
              <div className="flex justify-between items-start mb-3">
                <span className="text-[11px] font-bold text-[#9ca3af] uppercase tracking-wider">GANHO PERÍODO</span>
                <div className="w-8 h-8 rounded-[10px] bg-[rgba(0,175,170,0.1)] flex items-center justify-center text-[#00afaa]">
                  <Icon icon="lucide:calendar" className="text-base" />
                </div>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl lg:text-[32px] font-bold text-[#00afaa] tracking-tight leading-none mb-1.5">
                  {loading ? '...' : `${kpis.periodGain >= 0 ? '+' : ''}${kpis.periodGain.toFixed(2)}%`}
                </div>
                <div className="text-xs sm:text-[13px] text-[#9ba0aa] font-normal">Período selecionado</div>
              </div>
            </div>
          )}

          {/* Lucro Líquido */}
          <div className="bg-white p-6 rounded-2xl shadow-[0_8px_24px_rgba(0,0,0,0.04)] border border-[rgba(0,0,0,0.02)] hover:-translate-y-1 transition-all flex flex-col justify-between h-[140px]">
            <div className="flex justify-between items-start mb-3">
              <span className="text-[11px] font-bold text-[#9ca3af] uppercase tracking-wider">LUCRO LÍQUIDO</span>
              <div className="w-8 h-8 rounded-[10px] bg-[#f3f4f6] flex items-center justify-center text-[#6b7280]">
                <Icon icon="lucide:dollar-sign" className="text-base" />
              </div>
            </div>
            <div>
              <div className="text-[32px] font-bold text-[#059669] tracking-tight leading-none mb-1.5">
                {loading ? '...' : `$ ${kpis.netProfit.toFixed(2)}`}
              </div>
              <div className="text-[13px] text-[#9ba0aa] font-normal">Acumulado total</div>
            </div>
          </div>

          {/* Fator de Lucro */}
          <div className="bg-white p-6 rounded-2xl shadow-[0_8px_24px_rgba(0,0,0,0.04)] border border-[rgba(0,0,0,0.02)] hover:-translate-y-1 transition-all flex flex-col justify-between h-[140px]">
            <div className="flex justify-between items-start mb-3">
              <span className="text-[11px] font-bold text-[#9ca3af] uppercase tracking-wider">FATOR DE LUCRO</span>
              <div className="w-8 h-8 rounded-[10px] bg-[#f3f4f6] flex items-center justify-center text-[#6b7280]">
                <Icon icon="lucide:pie-chart" className="text-base" />
              </div>
            </div>
            <div>
              <div className="text-[32px] font-bold text-[#111827] tracking-tight leading-none mb-1.5">
                {loading ? '...' : kpis.profitFactor.toFixed(2)}
              </div>
              <div className="text-[13px] text-[#9ba0aa] font-normal">
                {kpis.profitFactor >= 2 ? 'Alta eficiência' : kpis.profitFactor >= 1 ? 'Eficiência moderada' : 'Baixa eficiência'}
              </div>
            </div>
          </div>

          {/* Drawdown Máx. */}
          <div className="bg-white p-6 rounded-2xl shadow-[0_8px_24px_rgba(0,0,0,0.04)] border border-[rgba(0,0,0,0.02)] hover:-translate-y-1 transition-all flex flex-col justify-between h-[140px]">
            <div className="flex justify-between items-start mb-3">
              <span className="text-[11px] font-bold text-[#9ca3af] uppercase tracking-wider">DRAWDOWN MÁX.</span>
              <div className="w-8 h-8 rounded-[10px] bg-[#fef2f2] flex items-center justify-center text-[#e53935]">
                <Icon icon="lucide:activity" className="text-base" />
              </div>
            </div>
            <div>
              <div className="text-[32px] font-bold text-[#e53935] tracking-tight leading-none mb-1.5">
                {loading ? '...' : `-${kpis.maxDrawdown.toFixed(2)}%`}
              </div>
              <div className="text-[13px] text-[#9ba0aa] font-normal">
                {kpis.maxDrawdown < 5 ? 'Risco controlado' : kpis.maxDrawdown < 10 ? 'Risco moderado' : 'Risco elevado'}
              </div>
            </div>
          </div>

          {/* Trades Abertos */}
          <div className="bg-white p-6 rounded-2xl shadow-[0_8px_24px_rgba(0,0,0,0.04)] border border-[rgba(0,0,0,0.02)] hover:-translate-y-1 transition-all flex flex-col justify-between h-[140px]">
            <div className="flex justify-between items-start mb-3">
              <span className="text-[11px] font-bold text-[#9ca3af] uppercase tracking-wider">TRADES ABERTOS</span>
              <div className="w-8 h-8 rounded-[10px] bg-[rgba(59,130,246,0.1)] flex items-center justify-center text-[#3b82f6]">
                <Icon icon="lucide:activity" className="text-base" />
              </div>
            </div>
            <div>
              <div className="text-[32px] font-bold text-[#3b82f6] tracking-tight leading-none mb-1.5">
                {loading ? '...' : kpis.openTrades}
              </div>
              <div className="text-[13px] text-[#9ba0aa] font-normal">
                {kpis.openOrders > 0 && `${kpis.openOrders} ordens pendentes`}
                {kpis.openOrders === 0 && 'Nenhuma ordem pendente'}
              </div>
            </div>
          </div>

          {/* Total de Trades */}
          <div className="bg-white p-6 rounded-2xl shadow-[0_8px_24px_rgba(0,0,0,0.04)] border border-[rgba(0,0,0,0.02)] hover:-translate-y-1 transition-all flex flex-col justify-between h-[140px]">
            <div className="flex justify-between items-start mb-3">
              <span className="text-[11px] font-bold text-[#9ca3af] uppercase tracking-wider">TOTAL TRADES</span>
              <div className="w-8 h-8 rounded-[10px] bg-[#f3f4f6] flex items-center justify-center text-[#6b7280]">
                <Icon icon="lucide:list" className="text-base" />
              </div>
            </div>
            <div>
              <div className="text-[32px] font-bold text-[#111827] tracking-tight leading-none mb-1.5">
                {loading ? '...' : kpis.totalTrades}
              </div>
              <div className="text-[13px] text-[#9ba0aa] font-normal">Histórico completo</div>
            </div>
          </div>

          {/* Pips */}
          {kpis.pips > 0 && (
            <div className="bg-white p-6 rounded-2xl shadow-[0_8px_24px_rgba(0,0,0,0.04)] border border-[rgba(0,0,0,0.02)] hover:-translate-y-1 transition-all flex flex-col justify-between h-[140px]">
              <div className="flex justify-between items-start mb-3">
                <span className="text-[11px] font-bold text-[#9ca3af] uppercase tracking-wider">PIPS</span>
                <div className="w-8 h-8 rounded-[10px] bg-[rgba(139,92,246,0.1)] flex items-center justify-center text-[#8b5cf6]">
                  <Icon icon="lucide:target" className="text-base" />
                </div>
              </div>
              <div>
                <div className="text-[32px] font-bold text-[#8b5cf6] tracking-tight leading-none mb-1.5">
                  {loading ? '...' : kpis.pips.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}
                </div>
                <div className="text-[13px] text-[#9ba0aa] font-normal">Total acumulado</div>
              </div>
            </div>
          )}
        </div>


        {/* Open Orders Section */}
        {myfxbookData?.openOrders && myfxbookData.openOrders.length > 0 && (
          <div className="bg-white rounded-2xl p-8 shadow-[0_8px_24px_rgba(0,0,0,0.04)] border border-[rgba(0,0,0,0.02)] mb-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-[#111827] tracking-[-0.01em]">Ordens Abertas</h3>
              <span className="text-xs font-semibold text-[#00afaa] bg-[rgba(0,175,170,0.08)] px-3 py-1 rounded-full">
                {myfxbookData.openOrders.length} {myfxbookData.openOrders.length === 1 ? 'ordem' : 'ordens'}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#f3f4f6]">
                    <th className="text-left py-3 px-4 text-xs font-semibold text-[#6b7280] uppercase tracking-wider">Par</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-[#6b7280] uppercase tracking-wider">Tipo</th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-[#6b7280] uppercase tracking-wider">Volume</th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-[#6b7280] uppercase tracking-wider">Preço</th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-[#6b7280] uppercase tracking-wider">Stop Loss</th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-[#6b7280] uppercase tracking-wider">Take Profit</th>
                  </tr>
                </thead>
                <tbody>
                  {myfxbookData.openOrders.map((order, index) => (
                    <tr key={index} className="border-b border-[#f9fafb] hover:bg-[#f3f4f6] transition-colors">
                      <td className="py-4 px-4 text-sm font-semibold text-[#111827]">{order.symbol || '-'}</td>
                      <td className="py-4 px-4 text-sm">
                        <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold ${
                          order.side === 'buy' || order.type === 'buy'
                            ? 'bg-[rgba(0,255,136,0.1)] text-[#059669]'
                            : 'bg-[rgba(239,68,68,0.1)] text-[#dc2626]'
                        }`}>
                          {order.side === 'buy' || order.type === 'buy' ? 'Compra' : 'Venda'}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-sm text-right text-[#6b7280]">{order.lots || order.volume || '-'}</td>
                      <td className="py-4 px-4 text-sm text-right text-[#6b7280]">{order.openPrice || order.price || '-'}</td>
                      <td className="py-4 px-4 text-sm text-right text-[#6b7280]">{order.stopLoss || '-'}</td>
                      <td className="py-4 px-4 text-sm text-right text-[#6b7280]">{order.takeProfit || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* History Table */}
        <div className="bg-white rounded-2xl p-8 shadow-[0_8px_24px_rgba(0,0,0,0.04)] border border-[rgba(0,0,0,0.02)]">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-lg font-bold text-[#111827] tracking-[-0.01em]">Histórico Mensal</h3>
            <span className="text-xs font-semibold text-[#00afaa] bg-[rgba(0,175,170,0.08)] px-3 py-1 rounded-full">
              Últimos 12 meses
            </span>
          </div>

          {/* Table Header */}
          <div className="grid grid-cols-[2fr_1.5fr_1.5fr_1.5fr_1fr_0.8fr] px-6 py-4 border-b border-[#f3f4f6]">
            <div className="text-xs font-semibold text-[#6b7280] uppercase tracking-wider flex items-center">
              <Icon icon="lucide:calendar" className="text-sm mr-1.5" />
              Período
            </div>
            <div className="text-xs font-semibold text-[#6b7280] uppercase tracking-wider flex items-center">
              <Icon icon="lucide:bar-chart-2" className="text-sm mr-1.5" />
              Operações
            </div>
            <div className="text-xs font-semibold text-[#6b7280] uppercase tracking-wider flex items-center">
              <Icon icon="lucide:trending-down" className="text-sm mr-1.5" />
              Drawdown
            </div>
            <div className="text-xs font-semibold text-[#6b7280] uppercase tracking-wider flex items-center">
              <Icon icon="lucide:dollar-sign" className="text-sm mr-1.5" />
              Lucro Líquido
            </div>
            <div className="text-xs font-semibold text-[#6b7280] uppercase tracking-wider flex items-center">
              <Icon icon="lucide:percent" className="text-sm mr-1.5" />
              Retorno
            </div>
            <div className="text-xs font-semibold text-[#6b7280] uppercase tracking-wider flex items-center justify-end">
              Relatório
            </div>
          </div>

          {/* Table Rows */}
          {loading ? (
            <div className="px-6 py-12 text-center text-[#6b7280]">Carregando dados...</div>
          ) : monthlyHistory.length > 0 ? (
            monthlyHistory.map((row, index) => (
              <div
                key={index}
                className={`grid grid-cols-[2fr_1.5fr_1.5fr_1.5fr_1fr_0.8fr] items-center px-6 py-6 border-b border-[#f9fafb] transition-all hover:bg-[#f3f4f6] hover:-translate-y-0.5 hover:shadow-[0_2px_8px_rgba(0,0,0,0.02)] ${
                  index % 2 === 0 ? 'bg-[#fafafa]' : ''
                } ${index === monthlyHistory.length - 1 ? 'border-b-0' : ''}`}
              >
                <div className="text-sm font-semibold text-[#111827]">{row.period}</div>
                <div className="text-sm text-[#6b7280]">{row.trades} trades</div>
                <div className={`text-sm ${row.isWarning ? 'text-[#f59e0b] font-semibold' : 'text-[#6b7280]'}`}>
                  {row.drawdownFormatted}
                </div>
                <div className="text-sm text-[#6b7280]">{row.profitFormatted}</div>
                <div>
                  {row.isPositive ? (
                    <span className="inline-flex items-center justify-center px-3 py-1 rounded-md text-xs font-bold min-w-[64px] bg-[rgba(0,255,136,0.08)] text-[#059669] border border-[rgba(0,255,136,0.15)]">
                      {row.returnFormatted}
                    </span>
                  ) : (
                    <span className="inline-flex items-center justify-center px-3 py-1 rounded-md text-xs font-bold min-w-[64px] bg-[#fef2f2] text-[#dc2626] border border-[#fecaca]">
                      {row.returnFormatted}
                    </span>
                  )}
                </div>
                <div className="flex justify-end">
                  <button className="w-8 h-8 rounded-lg border border-transparent bg-transparent flex items-center justify-center text-[#6b7280] cursor-pointer transition-all hover:bg-white hover:border-[#e5e7eb] hover:text-[#111827] hover:shadow-[0_2px_4px_rgba(0,0,0,0.05)]">
                    <Icon icon="lucide:file-text" className="text-base" />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="px-6 py-12 text-center text-[#6b7280]">
              {myfxbookData ? 'Nenhum dado histórico disponível' : 'Conecte sua conta MT4 para ver os relatórios'}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}

export default RelatoriosPerformancePage
