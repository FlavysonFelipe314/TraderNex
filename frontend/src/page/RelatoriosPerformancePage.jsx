import { useEffect, useState, useMemo } from 'react'
import { Icon } from '@iconify/react'
import DashboardLayout from '../components/DashboardLayout'
import { getPerformanceStats, getMyfxbookData } from '../services/dashboardService'

function RelatoriosPerformancePage() {
  const [selectedPeriod, setSelectedPeriod] = useState('este-mes')
  const [performanceData, setPerformanceData] = useState(null)
  const [myfxbookData, setMyfxbookData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    document.body.classList.add('scroll-enabled')
    return () => {
      document.body.classList.remove('scroll-enabled')
    }
  }, [])

  // Carregar dados de performance e MyFXBook
  useEffect(() => {
    const loadPerformanceData = async () => {
      setLoading(true)
      try {
        // Carregar dados do MyFXBook
        const myfxbookResult = await getMyfxbookData()
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
  }, [selectedPeriod])

  // Calcular KPIs baseados em dados do MyFXBook
  const kpis = useMemo(() => {
    if (!myfxbookData?.account) {
      return {
        totalReturn: 0,
        netProfit: 0,
        profitFactor: 0,
        maxDrawdown: 0
      }
    }

    const account = myfxbookData.account
    return {
      totalReturn: parseFloat(account.absGain || account.gain || 0),
      netProfit: parseFloat(account.profit || 0),
      profitFactor: parseFloat(account.profitFactor || 0),
      maxDrawdown: Math.abs(parseFloat(account.drawdown || 0))
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
    if (myfxbookData?.dataDaily && myfxbookData.dataDaily.length > 0) {
      return myfxbookData.dataDaily.map(item => ({
        date: new Date(item.date || item.time),
        equity: parseFloat(item.equity || 0),
        balance: parseFloat(item.balance || 0)
      })).sort((a, b) => a.date - b.date)
    } else if (myfxbookData?.dailyGain && myfxbookData.dailyGain.length > 0) {
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
    return []
  }, [myfxbookData])

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
                  onClick={() => setSelectedPeriod(period.id)}
                >
                  {period.label}
                </button>
              ))}
            </div>
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
                {loading ? '...' : `${kpis.totalReturn >= 0 ? '+' : ''}${kpis.totalReturn.toFixed(2)}%`}
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
                {loading ? '...' : `$ ${kpis.netProfit.toFixed(2)}`}
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
                {loading ? '...' : `-${kpis.maxDrawdown.toFixed(2)}%`}
              </div>
              <div className="text-[13px] text-[#9ba0aa] font-normal">
                {kpis.maxDrawdown < 5 ? 'Risco controlado' : kpis.maxDrawdown < 10 ? 'Risco moderado' : 'Risco elevado'}
              </div>
            </div>
          </div>
        </div>

        {/* Chart Section */}
        <div className="bg-white rounded-2xl p-8 mb-12 shadow-[0_8px_24px_rgba(0,0,0,0.04)] border border-[rgba(0,0,0,0.02)] hover:shadow-[0_12px_32px_rgba(0,0,0,0.06)] transition-shadow">
          <div className="flex justify-between items-start mb-8">
            <div className="flex flex-col gap-1">
              <h3 className="text-lg font-bold text-[#111827] tracking-[-0.01em]">Curva de Crescimento</h3>
              <p className="text-[13px] text-[#6b7280]">Crescimento da conta ao longo do período selecionado.</p>
            </div>
            <div className="flex gap-6 px-3 py-1.5 rounded-lg">
              <div className="flex items-center gap-2 text-xs font-medium text-[#6b7280]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00ff88] shadow-[0_0_0_2px_rgba(0,255,136,0.2)]" />
                Saldo
              </div>
              <div className="flex items-center gap-2 text-xs font-medium text-[#6b7280]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#e5e7eb]" />
                Equity
              </div>
            </div>
          </div>

          <div className="h-[380px] w-full relative">
            {chartData.length > 0 ? (
              <svg
                viewBox="0 0 1000 350"
                preserveAspectRatio="none"
                className="w-full h-full overflow-visible"
              >
                <defs>
                  <linearGradient id="chartGradient" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="rgba(0, 255, 136, 0.12)" />
                    <stop offset="100%" stopColor="rgba(0, 255, 136, 0)" />
                  </linearGradient>
                </defs>
                
                {/* Grid Lines */}
                {[0, 1, 2, 3, 4].map((i) => (
                  <line 
                    key={i}
                    x1="0" 
                    y1={300 - (i * 75)} 
                    x2="1000" 
                    y2={300 - (i * 75)} 
                    stroke="#F3F4F6" 
                    strokeWidth="1" 
                  />
                ))}
                
                {/* Calcular valores para o gráfico */}
                {(() => {
                  const values = chartData.map(d => d.equity || d.balance)
                  const min = Math.min(...values)
                  const max = Math.max(...values)
                  const range = max - min || 1
                  
                  const points = chartData.map((d, i) => {
                    const x = chartData.length > 1 ? (i / (chartData.length - 1)) * 1000 : 500
                    const y = 300 - ((d.equity || d.balance - min) / range) * 250
                    return `${x},${y}`
                  }).join(' ')
                  
                  const areaPath = `M0,300 ${points} L1000,300 Z`
                  
                  return (
                    <>
                      {/* Area Fill */}
                      <path
                        d={areaPath}
                        fill="url(#chartGradient)"
                        stroke="none"
                      />
                      
                      {/* Main Line */}
                      <path
                        d={`M${points.replace(/ /g, ' L')}`}
                        fill="none"
                        stroke="#00FF88"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                      />
                      
                      {/* Markers */}
                      {chartData.map((d, i) => {
                        const x = chartData.length > 1 ? (i / (chartData.length - 1)) * 1000 : 500
                        const values = chartData.map(d => d.equity || d.balance)
                        const min = Math.min(...values)
                        const max = Math.max(...values)
                        const range = max - min || 1
                        const y = 300 - ((d.equity || d.balance - min) / range) * 250
                        const isLast = i === chartData.length - 1
                        return (
                          <circle 
                            key={i}
                            cx={x} 
                            cy={y} 
                            r={isLast ? 6 : 5} 
                            fill="#00FF88" 
                            stroke="white" 
                            strokeWidth={isLast ? 3 : 2.5}
                            style={isLast ? { filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))' } : {}}
                          />
                        )
                      })}
                    </>
                  )
                })()}
              </svg>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[#94A3B8] text-sm">
                {loading ? 'Carregando dados...' : 'Nenhum dado disponível para exibir no gráfico'}
              </div>
            )}

            {/* X Axis Labels */}
            {chartData.length > 0 && (
              <div className="flex justify-between pt-5 text-[#9ca3af] text-xs font-medium">
                {chartData
                  .filter((_, i) => i % Math.ceil(chartData.length / 12) === 0 || i === chartData.length - 1)
                  .map((d, i) => (
                    <span key={i}>
                      {d.date.toLocaleDateString('pt-BR', { month: 'short' })}
                    </span>
                  ))}
              </div>
            )}
          </div>
        </div>

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
              {myfxbookData ? 'Nenhum dado histórico disponível' : 'Conecte sua conta MyFXBook para ver os relatórios'}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}

export default RelatoriosPerformancePage
