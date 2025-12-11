import { useEffect, useState } from 'react'
import { Icon } from '@iconify/react'
import DashboardLayout from '../components/DashboardLayout'
import { getPerformanceStats } from '../services/dashboardService'

function RelatoriosPerformancePage() {
  const [selectedPeriod, setSelectedPeriod] = useState('este-mes')
  const [performanceData, setPerformanceData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    document.body.classList.add('scroll-enabled')
    return () => {
      document.body.classList.remove('scroll-enabled')
    }
  }, [])

  // Carregar dados de performance
  useEffect(() => {
    const loadPerformanceData = async () => {
      setLoading(true)
      try {
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

  const periods = [
    { id: 'hoje', label: 'Hoje' },
    { id: '7-dias', label: '7 dias' },
    { id: 'este-mes', label: 'Este mês' },
    { id: 'este-ano', label: 'Este ano' },
  ]

  const historyData = [
    { period: 'Setembro 2025', trades: '142 trades', drawdown: '1.2%', profit: '$ 1,240.50', return: '+4.2%', isPositive: true },
    { period: 'Agosto 2025', trades: '115 trades', drawdown: '0.8%', profit: '$ 980.00', return: '+3.8%', isPositive: true },
    { period: 'Julho 2025', trades: '128 trades', drawdown: '2.1%', profit: '$ 1,850.20', return: '+6.1%', isPositive: true },
    { period: 'Junho 2025', trades: '98 trades', drawdown: '1.5%', profit: '$ 850.00', return: '+2.9%', isPositive: true },
    { period: 'Maio 2025', trades: '85 trades', drawdown: '3.2%', profit: '-$ 120.00', return: '-0.4%', isPositive: false, isWarning: true },
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
            <button className="flex items-center gap-2 px-5 h-11 bg-white text-[#111827] border border-[#e5e7eb] rounded-xl text-[13px] font-semibold cursor-pointer shadow-[0_1px_2px_rgba(0,0,0,0.03)] transition-all hover:border-[#00ff88] hover:shadow-[0_0_0_3px_rgba(0,255,136,0.1)] hover:text-[#00afaa]">
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
              <div className="text-2xl sm:text-3xl lg:text-[32px] font-bold text-[#059669] tracking-tight leading-none mb-1.5">+42,8%</div>
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
              <div className="text-[32px] font-bold text-[#059669] tracking-tight leading-none mb-1.5">$ 12,450.00</div>
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
              <div className="text-[32px] font-bold text-[#111827] tracking-tight leading-none mb-1.5">2.45</div>
              <div className="text-[13px] text-[#9ba0aa] font-normal">Alta eficiência</div>
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
              <div className="text-[32px] font-bold text-[#e53935] tracking-tight leading-none mb-1.5">-4.2%</div>
              <div className="text-[13px] text-[#9ba0aa] font-normal">Risco controlado</div>
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
              <line x1="0" y1="300" x2="1000" y2="300" stroke="#F3F4F6" strokeWidth="1" />
              <line x1="0" y1="225" x2="1000" y2="225" stroke="#F3F4F6" strokeWidth="1" />
              <line x1="0" y1="150" x2="1000" y2="150" stroke="#F3F4F6" strokeWidth="1" />
              <line x1="0" y1="75" x2="1000" y2="75" stroke="#F3F4F6" strokeWidth="1" />
              
              {/* Area Fill */}
              <path
                d="M0,300 C150,295 300,245 450,230 C600,215 750,130 850,110 C950,90 1000,60 1000,60 L1000,350 L0,350 Z"
                fill="url(#chartGradient)"
                stroke="none"
              />
              
              {/* Main Line */}
              <path
                d="M0,300 C150,295 300,245 450,230 C600,215 750,130 850,110 C950,90 1000,60 1000,60"
                fill="none"
                stroke="#00FF88"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              
              {/* Markers */}
              <circle cx="0" cy="300" r="5" fill="#00FF88" stroke="white" strokeWidth="2.5" />
              <circle cx="450" cy="230" r="5" fill="#00FF88" stroke="white" strokeWidth="2.5" />
              <circle cx="850" cy="110" r="5" fill="#00FF88" stroke="white" strokeWidth="2.5" />
              <circle cx="1000" cy="60" r="6" fill="#00FF88" stroke="white" strokeWidth="3" style={{ filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))' }} />
            </svg>

            {/* Tooltip */}
            <div className="absolute top-5 right-0 bg-white px-3.5 py-2.5 rounded-[10px] shadow-[0_4px_12px_rgba(0,0,0,0.1)] border border-[#f3f4f6] flex flex-col gap-0.5 pointer-events-none">
              <div className="text-[11px] text-[#6b7280] font-medium uppercase">Dezembro</div>
              <div className="text-sm text-[#111827] font-bold">$ 14,250.00</div>
            </div>

            {/* X Axis Labels */}
            <div className="flex justify-between pt-5 text-[#9ca3af] text-xs font-medium">
              <span>Jan</span>
              <span>Fev</span>
              <span>Mar</span>
              <span>Abr</span>
              <span>Mai</span>
              <span>Jun</span>
              <span>Jul</span>
              <span>Ago</span>
              <span>Set</span>
              <span>Out</span>
              <span>Nov</span>
              <span>Dez</span>
            </div>
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
          {historyData.map((row, index) => (
            <div
              key={index}
              className={`grid grid-cols-[2fr_1.5fr_1.5fr_1.5fr_1fr_0.8fr] items-center px-6 py-6 border-b border-[#f9fafb] transition-all hover:bg-[#f3f4f6] hover:-translate-y-0.5 hover:shadow-[0_2px_8px_rgba(0,0,0,0.02)] ${
                index % 2 === 0 ? 'bg-[#fafafa]' : ''
              } ${index === historyData.length - 1 ? 'border-b-0' : ''}`}
            >
              <div className="text-sm font-semibold text-[#111827]">{row.period}</div>
              <div className="text-sm text-[#6b7280]">{row.trades}</div>
              <div className={`text-sm ${row.isWarning ? 'text-[#f59e0b] font-semibold' : 'text-[#6b7280]'}`}>
                {row.drawdown}
              </div>
              <div className="text-sm text-[#6b7280]">{row.profit}</div>
              <div>
                {row.isPositive ? (
                  <span className="inline-flex items-center justify-center px-3 py-1 rounded-md text-xs font-bold min-w-[64px] bg-[rgba(0,255,136,0.08)] text-[#059669] border border-[rgba(0,255,136,0.15)]">
                    {row.return}
                  </span>
                ) : (
                  <span className="inline-flex items-center justify-center px-3 py-1 rounded-md text-xs font-bold min-w-[64px] bg-[#fef2f2] text-[#dc2626] border border-[#fecaca]">
                    {row.return}
                  </span>
                )}
              </div>
              <div className="flex justify-end">
                <button className="w-8 h-8 rounded-lg border border-transparent bg-transparent flex items-center justify-center text-[#6b7280] cursor-pointer transition-all hover:bg-white hover:border-[#e5e7eb] hover:text-[#111827] hover:shadow-[0_2px_4px_rgba(0,0,0,0.05)]">
                  <Icon icon="lucide:file-text" className="text-base" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  )
}

export default RelatoriosPerformancePage
