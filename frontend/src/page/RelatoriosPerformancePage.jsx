import { useEffect, useState, useMemo } from 'react'
import { Icon } from '@iconify/react'
import DashboardLayout from '../components/DashboardLayout'
import { getPerformanceStats, getMyfxbookData } from '../services/dashboardService'
import { formatCurrencyBR, formatPercentBR, formatNumberBR } from '../utils/format'

function RelatoriosPerformancePage() {
  const [selectedPeriod, setSelectedPeriod] = useState('este-mes')
  const [customDates, setCustomDates] = useState({ startDate: '', endDate: '' })
  const [showDatePicker, setShowDatePicker] = useState(false)
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
  const getDateRange = (period) => {
    const today = new Date()
    const endDate = today.toISOString().split('T')[0]
    let startDate = ''

    switch (period) {
      case 'hoje':
        startDate = endDate
        break
      case '7-dias':
        const sevenDaysAgo = new Date(today)
        sevenDaysAgo.setDate(today.getDate() - 7)
        startDate = sevenDaysAgo.toISOString().split('T')[0]
        break
      case 'este-mes':
        const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
        startDate = firstDayOfMonth.toISOString().split('T')[0]
        break
      case 'este-ano':
        const firstDayOfYear = new Date(today.getFullYear(), 0, 1)
        startDate = firstDayOfYear.toISOString().split('T')[0]
        break
      case 'custom':
        return { startDate: customDates.startDate, endDate: customDates.endDate }
      default:
        const thirtyDaysAgo = new Date(today)
        thirtyDaysAgo.setDate(today.getDate() - 30)
        startDate = thirtyDaysAgo.toISOString().split('T')[0]
    }

    return { startDate, endDate }
  }

  // Carregar dados de performance e MyFXBook
  useEffect(() => {
    const loadPerformanceData = async () => {
      setLoading(true)
      try {
        const dateRange = getDateRange(selectedPeriod)
        console.log('[Relatórios] Carregando dados para período:', selectedPeriod, 'Datas:', dateRange)
        
        // Carregar dados do MyFXBook com filtros de data
        const myfxbookResult = await getMyfxbookData(dateRange.startDate, dateRange.endDate)
        console.log('[Relatórios] Resultado MyFXBook:', myfxbookResult)
        
        if (myfxbookResult.success && myfxbookResult.data?.connected) {
          setMyfxbookData(myfxbookResult.data)
        } else {
          // Se não conectado, limpar dados anteriores
          setMyfxbookData(null)
        }

        // Carregar dados de performance como fallback
        const periodMap = {
          'hoje': 'day',
          '7-dias': 'week',
          'este-mes': 'month',
          'este-ano': 'year',
          'custom': 'month' // Para custom, usar month como fallback
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
  }, [selectedPeriod, customDates.startDate, customDates.endDate])

  // Calcular KPIs baseados em dados do MyFXBook
  const kpis = useMemo(() => {
    if (!myfxbookData?.account) {
      return {
        totalReturn: 0,
        netProfit: 0,
        profitFactor: 0,
        maxDrawdown: 0,
        gain: 0,
        openTrades: 0,
        openOrders: 0,
        totalTrades: 0
      }
    }

    const account = myfxbookData.account
    return {
      totalReturn: parseFloat(account.absGain || account.gain || 0),
      netProfit: parseFloat(account.profit || 0),
      profitFactor: parseFloat(account.profitFactor || 0),
      maxDrawdown: Math.abs(parseFloat(account.drawdown || 0)),
      gain: parseFloat(myfxbookData.gain || account.gain || 0),
      openTrades: myfxbookData.openTrades?.length || 0,
      openOrders: myfxbookData.openOrders?.length || 0,
      totalTrades: myfxbookData.history?.length || 0
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
        profitFormatted: formatCurrencyBR(month.profit),
        drawdownFormatted: `${formatNumberBR(month.drawdown)}%`,
        returnFormatted: formatPercentBR((month.profit / (kpis.netProfit || 1)) * 100, 1),
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
    { id: 'custom', label: 'Personalizado' },
  ]

  const handleCustomDateApply = () => {
    if (customDates.startDate && customDates.endDate) {
      if (new Date(customDates.startDate) > new Date(customDates.endDate)) {
        alert('A data inicial deve ser anterior à data final')
        return
      }
      setSelectedPeriod('custom')
      setShowDatePicker(false)
    } else {
      alert('Por favor, selecione ambas as datas')
    }
  }

  return (
    <DashboardLayout>
      <div className="px-4 sm:px-6 lg:px-16 py-6 sm:py-8 lg:py-12">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 sm:mb-10 lg:mb-12 gap-4 relative">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-[32px] font-bold text-[#111827] mb-2 sm:mb-2.5 tracking-[-0.02em]">Relatórios de Performance</h1>
            <p className="text-sm sm:text-[15px] text-[#6b7280] font-normal">
              Análise detalhada da evolução e resultados institucionais da sua conta.
            </p>
            {myfxbookData?.period && (
              <p className="text-xs text-[#9ca3af] mt-1">
                Período: {new Date(myfxbookData.period.startDate).toLocaleDateString('pt-BR')} até {new Date(myfxbookData.period.endDate).toLocaleDateString('pt-BR')}
              </p>
            )}
          </div>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center w-full sm:w-auto">
            {/* Filter Pills */}
            <div className="flex bg-white rounded-xl p-1 border border-[#ebebeb] shadow-[0_2px_4px_rgba(0,0,0,0.02)] overflow-x-auto">
              {periods.map((period) => (
                <button
                  key={period.id}
                  className={`px-4 sm:px-6 py-2 text-xs sm:text-[13px] font-medium rounded-lg transition-all whitespace-nowrap ${
                    selectedPeriod === period.id
                      ? 'bg-white text-[#00afaa] font-bold shadow-[0_2px_8px_rgba(0,0,0,0.06)] border border-[#f0f0f0]'
                      : 'text-[#6b7280] hover:text-[#111827] hover:bg-[#f9fafb]'
                  }`}
                  onClick={() => {
                    if (period.id === 'custom') {
                      setShowDatePicker(!showDatePicker)
                    } else {
                      setSelectedPeriod(period.id)
                      setShowDatePicker(false)
                    }
                  }}
                >
                  {period.label}
                </button>
              ))}
            </div>
            
            {/* Date Picker (aparece quando custom está selecionado) */}
            {showDatePicker && (
              <div className="absolute top-full mt-2 bg-white rounded-xl p-4 border border-[#ebebeb] shadow-lg z-10 flex flex-col sm:flex-row gap-3">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-[#6b7280]">Data Inicial</label>
                  <input
                    type="date"
                    value={customDates.startDate}
                    onChange={(e) => setCustomDates({ ...customDates, startDate: e.target.value })}
                    className="px-3 py-2 border border-[#e5e7eb] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00afaa]"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-[#6b7280]">Data Final</label>
                  <input
                    type="date"
                    value={customDates.endDate}
                    onChange={(e) => setCustomDates({ ...customDates, endDate: e.target.value })}
                    className="px-3 py-2 border border-[#e5e7eb] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00afaa]"
                  />
                </div>
                <div className="flex items-end gap-2">
                  <button
                    onClick={handleCustomDateApply}
                    className="px-4 py-2 bg-[#00afaa] text-white rounded-lg text-sm font-semibold hover:bg-[#009994] transition-colors"
                  >
                    Aplicar
                  </button>
                  <button
                    onClick={() => {
                      setShowDatePicker(false)
                      setCustomDates({ startDate: '', endDate: '' })
                    }}
                    className="px-4 py-2 bg-[#f3f4f6] text-[#6b7280] rounded-lg text-sm font-semibold hover:bg-[#e5e7eb] transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
            
            {/* Export Button */}
            <button 
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-5 h-11 bg-white text-[#111827] border border-[#e5e7eb] rounded-xl text-[13px] font-semibold cursor-pointer shadow-[0_1px_2px_rgba(0,0,0,0.03)] transition-all hover:border-[#00ff88] hover:shadow-[0_0_0_3px_rgba(0,255,136,0.1)] hover:text-[#00afaa]"
            >
              <Icon icon="lucide:download" className="text-base" />
              <span>CSV</span>
            </button>
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
                {loading ? '...' : formatPercentBR(kpis.totalReturn)}
              </div>
              <div className="text-xs sm:text-[13px] text-[#9ba0aa] font-normal">Desde o início</div>
            </div>
          </div>

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
                {loading ? '...' : formatCurrencyBR(kpis.netProfit)}
              </div>
              <div className="text-[13px] text-[#9ba0aa] font-normal">Acumulado no ano</div>
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
                {loading ? '...' : `-${formatNumberBR(kpis.maxDrawdown)}%`}
              </div>
              <div className="text-[13px] text-[#9ba0aa] font-normal">
                {kpis.maxDrawdown < 5 ? 'Risco controlado' : kpis.maxDrawdown < 10 ? 'Risco moderado' : 'Risco elevado'}
              </div>
            </div>
          </div>
        </div>

        {/* Informações Adicionais */}
        {myfxbookData?.connected && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8 sm:mb-10 lg:mb-12">
            {/* Trades Abertos */}
            <div className="bg-white p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-[0_8px_24px_rgba(0,0,0,0.04)] border border-[rgba(0,0,0,0.02)]">
              <div className="flex justify-between items-start mb-3">
                <span className="text-[11px] font-bold text-[#9ca3af] uppercase tracking-wider">TRADES ABERTOS</span>
                <Icon icon="lucide:trending-up" className="text-base text-[#059669]" />
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-[#111827]">{kpis.openTrades}</div>
            </div>

            {/* Ordens Abertas */}
            <div className="bg-white p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-[0_8px_24px_rgba(0,0,0,0.04)] border border-[rgba(0,0,0,0.02)]">
              <div className="flex justify-between items-start mb-3">
                <span className="text-[11px] font-bold text-[#9ca3af] uppercase tracking-wider">ORDENS ABERTAS</span>
                <Icon icon="lucide:list" className="text-base text-[#6b7280]" />
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-[#111827]">{kpis.openOrders}</div>
            </div>

            {/* Total de Trades */}
            <div className="bg-white p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-[0_8px_24px_rgba(0,0,0,0.04)] border border-[rgba(0,0,0,0.02)]">
              <div className="flex justify-between items-start mb-3">
                <span className="text-[11px] font-bold text-[#9ca3af] uppercase tracking-wider">TOTAL TRADES</span>
                <Icon icon="lucide:bar-chart-2" className="text-base text-[#6b7280]" />
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-[#111827]">{kpis.totalTrades}</div>
            </div>

            {/* Ganho no Período */}
            <div className="bg-white p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-[0_8px_24px_rgba(0,0,0,0.04)] border border-[rgba(0,0,0,0.02)]">
              <div className="flex justify-between items-start mb-3">
                <span className="text-[11px] font-bold text-[#9ca3af] uppercase tracking-wider">GANHO PERÍODO</span>
                <Icon icon="lucide:percent" className="text-base text-[#059669]" />
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-[#059669]">
                {loading ? '...' : kpis.gain ? formatPercentBR(kpis.gain) : 'N/A'}
              </div>
            </div>
          </div>
        )}


        {/* Trades Abertos */}
        {myfxbookData?.openTrades && myfxbookData.openTrades.length > 0 && (
          <div className="bg-white rounded-2xl p-8 shadow-[0_8px_24px_rgba(0,0,0,0.04)] border border-[rgba(0,0,0,0.02)] mb-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-[#111827] tracking-[-0.01em]">Trades Abertos</h3>
              <span className="text-xs font-semibold text-[#00afaa] bg-[rgba(0,175,170,0.08)] px-3 py-1 rounded-full">
                {myfxbookData.openTrades.length} {myfxbookData.openTrades.length === 1 ? 'trade' : 'trades'}
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#f3f4f6]">
                    <th className="text-left py-3 px-4 text-xs font-semibold text-[#6b7280] uppercase">Símbolo</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-[#6b7280] uppercase">Tipo</th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-[#6b7280] uppercase">Lotes</th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-[#6b7280] uppercase">Preço Abertura</th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-[#6b7280] uppercase">P/L</th>
                  </tr>
                </thead>
                <tbody>
                  {myfxbookData.openTrades.map((trade, index) => (
                    <tr key={index} className="border-b border-[#f9fafb] hover:bg-[#f3f4f6]">
                      <td className="py-3 px-4 text-sm font-semibold text-[#111827]">{trade.symbol || 'N/A'}</td>
                      <td className="py-3 px-4 text-sm text-[#6b7280]">{trade.side === 'buy' ? 'Compra' : 'Venda'}</td>
                      <td className="py-3 px-4 text-sm text-right text-[#6b7280]">{parseFloat(trade.lots || 0).toFixed(2)}</td>
                      <td className="py-3 px-4 text-sm text-right text-[#6b7280]">{parseFloat(trade.openPrice || 0).toFixed(5)}</td>
                      <td className={`py-3 px-4 text-sm text-right font-semibold ${parseFloat(trade.profit || 0) >= 0 ? 'text-[#059669]' : 'text-[#e53935]'}`}>
                        {formatCurrencyBR(trade.profit || 0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Ordens Abertas */}
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
                    <th className="text-left py-3 px-4 text-xs font-semibold text-[#6b7280] uppercase">Símbolo</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-[#6b7280] uppercase">Tipo</th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-[#6b7280] uppercase">Lotes</th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-[#6b7280] uppercase">Preço</th>
                  </tr>
                </thead>
                <tbody>
                  {myfxbookData.openOrders.map((order, index) => (
                    <tr key={index} className="border-b border-[#f9fafb] hover:bg-[#f3f4f6]">
                      <td className="py-3 px-4 text-sm font-semibold text-[#111827]">{order.symbol || 'N/A'}</td>
                      <td className="py-3 px-4 text-sm text-[#6b7280]">{order.type || 'N/A'}</td>
                      <td className="py-3 px-4 text-sm text-right text-[#6b7280]">{parseFloat(order.lots || 0).toFixed(2)}</td>
                      <td className="py-3 px-4 text-sm text-right text-[#6b7280]">{parseFloat(order.price || 0).toFixed(5)}</td>
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
