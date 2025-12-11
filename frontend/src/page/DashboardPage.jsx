import { Icon } from '@iconify/react'
import { useEffect, useState } from 'react'
import Sidebar from '../components/Sidebar'
import MobileBottomNav from '../components/MobileBottomNav'
import { useSidebar } from '../contexts/SidebarContext'
import { useAuth } from '../contexts/AuthContext'
import { getDashboardData, getMT4Accounts, getPerformanceStats } from '../services/dashboardService'

function DashboardPage() {
  const { isSidebarOpen } = useSidebar()
  const { user } = useAuth()
  const [dashboardData, setDashboardData] = useState(null)
  const [mt4Accounts, setMt4Accounts] = useState([])
  const [period, setPeriod] = useState('30d')
  const [performanceData, setPerformanceData] = useState([])
  const [loading, setLoading] = useState(true)

  // Adicionar animação pulse
  const pulseStyle = {
    animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
  }

  // Habilitar scroll no body quando o componente montar
  useEffect(() => {
    document.body.classList.add('scroll-enabled')
    return () => {
      document.body.classList.remove('scroll-enabled')
    }
  }, [])

  // Carregar dados do dashboard
  useEffect(() => {
    const loadDashboardData = async () => {
      setLoading(true)
      try {
        const [dashboardResult, mt4Result] = await Promise.all([
          getDashboardData(),
          getMT4Accounts()
        ])

        if (dashboardResult.success) {
          setDashboardData(dashboardResult.data)
        }
        
        // Carregar dados de performance
        const performanceResult = await getPerformanceStats(period)
        if (performanceResult.success) {
           setPerformanceData(performanceResult.data)
        }

        if (mt4Result.success) {
          setMt4Accounts(mt4Result.data || [])
        }
      } catch (error) {
        console.error('Erro ao carregar dados do dashboard:', error)
      } finally {
        setLoading(false)
      }
    }

    loadDashboardData()
  }, [period])

  const pulseKeyframes = `
    @keyframes pulse {
      0%, 100% {
        opacity: 1;
      }
      50% {
        opacity: 0.5;
      }
    }
  `

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: pulseKeyframes }} />
      <div className="flex min-h-screen bg-[#F8F9FB] text-[#0F172A] font-sans text-sm leading-normal antialiased">
      <Sidebar />

      {/* Main Area */}
      <div className={`flex-1 flex flex-col py-6 px-4 gap-6 sm:gap-8 md:gap-10 lg:py-14 lg:px-16 md:py-10 md:px-10 sm:py-6 sm:px-6 overflow-y-auto bg-[#F8F9FB] transition-all duration-300 pb-20 lg:pb-6 ${isSidebarOpen ? 'lg:ml-[240px]' : 'lg:ml-0'}`}>
        <div className="flex items-start justify-between mb-4 flex-wrap gap-4 lg:gap-6 lg:flex-row flex-col">
          <div className="flex flex-col gap-2">
            <div className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#0F172A] tracking-[-0.03em] leading-none">
              Visão Geral
            </div>
            <div className="text-sm sm:text-[15px] text-[#64748B] font-normal">
              Bem-vindo de volta, {user?.firstName || user?.first_name || 'Usuário'}. Aqui está o resumo da sua carteira.
            </div>
          </div>
          <div className="flex items-center gap-3 sm:gap-4 lg:flex-row flex-col w-full lg:w-auto">
            <div className="flex bg-white rounded-full p-1 border border-[#E2E8F0] shadow-sm">
              {['7d', '30d', '90d', '1y'].map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-300 ${
                    period === p
                      ? 'bg-[#0F172A] text-white shadow-md'
                      : 'text-[#64748B] hover:text-[#0F172A]'
                  }`}
                >
                  {p === '1y' ? '1 Ano' : `${p.replace('d', '')} Dias`}
                </button>
              ))}
            </div>
            <button className="inline-flex items-center justify-center gap-2 px-4 sm:px-6 rounded-full text-xs sm:text-[13px] font-semibold cursor-pointer transition-all duration-300 h-10 sm:h-11 tracking-[-0.01em] whitespace-nowrap bg-[#00FF88] text-[#003319] shadow-[0_0_12px_rgba(0,255,136,0.25)] border border-[rgba(0,255,136,0.2)] hover:-translate-y-[1px] hover:shadow-[0_6px_20px_rgba(0,255,136,0.35)] hover:bg-[#1AFF95] w-full sm:w-auto" data-media-type="banani-button">
              <div className="w-3.5 h-3.5 flex items-center justify-center">
                <Icon icon="lucide:refresh-ccw" className="text-sm" />
              </div>
              <span>Sincronizar</span>
            </button>
          </div>
        </div>

        {/* KPI Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
          <div className="group bg-white rounded-xl sm:rounded-2xl p-5 sm:p-8 border border-[rgba(0,0,0,0.03)] shadow-[0_4px_6px_-1px_rgba(0,0,0,0.02),0_10px_15px_-3px_rgba(0,0,0,0.04)] flex flex-col gap-4 sm:gap-5 transition-all duration-300 relative overflow-hidden hover:-translate-y-1 hover:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.05),0_10px_10px_-5px_rgba(0,0,0,0.01)] cursor-pointer" data-media-type="banani-button">
            <div className="flex items-center justify-between">
              <div className="text-xs font-semibold text-[#64748B] uppercase tracking-[0.04em]">
                Saldo Total
              </div>
              <div className="w-8 h-8 rounded-[10px] bg-[#F8FAFC] flex items-center justify-center text-[#94A3B8] transition-all duration-300 group-hover:bg-[rgba(0,255,136,0.1)] group-hover:text-[#059669]">
                <Icon icon="lucide:wallet" className="text-base" />
              </div>
            </div>
            <div>
              <div className="text-[28px] font-bold text-[#059669] tracking-[-0.03em] leading-none">
                $ 42,350.27
              </div>
            </div>
            <div className="text-xs text-[#94A3B8] flex items-center gap-1.5 font-medium">
              <span>Consolidado MT4</span>
            </div>
          </div>

          <div className="group bg-white rounded-2xl p-8 border border-[rgba(0,0,0,0.03)] shadow-[0_4px_6px_-1px_rgba(0,0,0,0.02),0_10px_15px_-3px_rgba(0,0,0,0.04)] flex flex-col gap-5 transition-all duration-300 relative overflow-hidden hover:-translate-y-1 hover:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.05),0_10px_10px_-5px_rgba(0,0,0,0.01)] cursor-pointer" data-media-type="banani-button">
            <div className="flex items-center justify-between">
              <div className="text-xs font-semibold text-[#64748B] uppercase tracking-[0.04em]">
                Depósitos
              </div>
              <div className="w-8 h-8 rounded-[10px] bg-[#F8FAFC] flex items-center justify-center text-[#94A3B8] transition-all duration-300 group-hover:bg-[rgba(0,255,136,0.1)] group-hover:text-[#059669]">
                <Icon icon="lucide:arrow-down-circle" className="text-base" />
              </div>
            </div>
            <div>
              <div className="text-xl sm:text-2xl lg:text-[28px] font-bold text-[#0F172A] tracking-[-0.03em] leading-none">
                $ {dashboardData?.profile?.totalInvested?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
              </div>
            </div>
            <div className="text-xs text-[#94A3B8] flex items-center gap-1.5 font-medium">
              <span>Total investido</span>
            </div>
          </div>

          <div className="group bg-white rounded-2xl p-8 border border-[rgba(0,0,0,0.03)] shadow-[0_4px_6px_-1px_rgba(0,0,0,0.02),0_10px_15px_-3px_rgba(0,0,0,0.04)] flex flex-col gap-5 transition-all duration-300 relative overflow-hidden hover:-translate-y-1 hover:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.05),0_10px_10px_-5px_rgba(0,0,0,0.01)] cursor-pointer" data-media-type="banani-button">
            <div className="flex items-center justify-between">
              <div className="text-xs font-semibold text-[#64748B] uppercase tracking-[0.04em]">
                Lucro Líquido
              </div>
              <div className="w-8 h-8 rounded-[10px] bg-[#F8FAFC] flex items-center justify-center text-[#94A3B8] transition-all duration-300 group-hover:bg-[rgba(0,255,136,0.1)] group-hover:text-[#059669]">
                <Icon icon="lucide:trending-up" className="text-base" />
              </div>
            </div>
            <div>
              <div className="text-xl sm:text-2xl lg:text-[28px] font-bold text-[#059669] tracking-[-0.03em] leading-none">
                + $ {dashboardData?.profile?.totalProfit?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
              </div>
            </div>
            <div className="text-xs text-[#94A3B8] flex items-center gap-1.5 font-medium">
              {dashboardData?.profile?.profitPercentage > 0 && (
                <div className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-[rgba(16,185,129,0.08)] text-[#059669]">
                  <div className="w-2.5 h-2.5 flex items-center justify-center">
                    <Icon icon="lucide:arrow-up-right" className="text-[10px]" />
                  </div>
                  {dashboardData.profile.profitPercentage.toFixed(1)}%
                </div>
              )}
              <span>no período</span>
            </div>
          </div>

          <div className="group bg-white rounded-2xl p-8 border border-[rgba(0,0,0,0.03)] shadow-[0_4px_6px_-1px_rgba(0,0,0,0.02),0_10px_15px_-3px_rgba(0,0,0,0.04)] flex flex-col gap-5 transition-all duration-300 relative overflow-hidden hover:-translate-y-1 hover:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.05),0_10px_10px_-5px_rgba(0,0,0,0.01)] cursor-pointer" data-media-type="banani-button">
            <div className="flex items-center justify-between">
              <div className="text-xs font-semibold text-[#64748B] uppercase tracking-[0.04em]">
                Performance Fee
              </div>
              <div className="w-8 h-8 rounded-[10px] bg-[#F8FAFC] flex items-center justify-center text-[#94A3B8] transition-all duration-300 group-hover:bg-[rgba(0,255,136,0.1)] group-hover:text-[#059669]">
                <Icon icon="lucide:percent" className="text-base" />
              </div>
            </div>
            <div>
              <div className="text-xl sm:text-2xl lg:text-[28px] font-bold text-[#0F172A] tracking-[-0.03em] leading-none">
                {dashboardData?.profile?.accountType === 'Pro' ? '40%' : dashboardData?.profile?.accountType === 'Premium' ? '30%' : '50%'}
              </div>
            </div>
            <div className="text-xs text-[#94A3B8] flex items-center gap-1.5 font-medium">
              <span>Plano atual</span>
            </div>
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-[2.2fr_1.3fr] gap-4 sm:gap-6 items-stretch">
          {/* Chart Card */}
          <div className="bg-white rounded-xl sm:rounded-2xl border border-[rgba(0,0,0,0.03)] shadow-[0_4px_6px_-1px_rgba(0,0,0,0.02),0_10px_15px_-3px_rgba(0,0,0,0.04)] flex flex-col overflow-hidden">
            <div className="p-4 sm:p-6 lg:p-8 border-b border-[#F8FAFC] flex justify-between items-center bg-white">
              <div>
                <div className="text-base font-bold text-[#0F172A] tracking-[-0.01em] flex items-center gap-2.5">
                  Evolução do Patrimônio
                </div>
                <div className="text-[13px] text-[#64748B] mt-1">
                  Crescimento do saldo nos últimos {period === '1y' ? '12 meses' : `${period.replace('d', '')} dias`}
                </div>
              </div>
            </div>
            <div className="p-4 sm:p-6 lg:p-8 h-[250px] sm:h-[300px] lg:h-[380px] relative bg-gradient-to-b from-white to-[#FBFCFD]">
              <div className="absolute top-4 right-4 sm:top-8 sm:right-8 flex items-center gap-2 text-[10px] sm:text-[11px] font-semibold text-[#94A3B8] bg-[rgba(255,255,255,0.8)] px-2 sm:px-3 py-1 sm:py-1.5 rounded-full border border-[#F1F5F9] backdrop-blur-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-[#00FF88] shadow-[0_0_0_2px_rgba(0,255,136,0.2)]" />
                Saldo MT4 consolidado
              </div>
              
              {performanceData.length > 0 ? (
                <svg
                  className="w-full h-full overflow-visible"
                  viewBox="0 0 600 250"
                  preserveAspectRatio="none"
                >
                  <defs>
                    <linearGradient id="gradientFill" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" style={{ stopColor: '#00ff88', stopOpacity: 1 }} />
                      <stop offset="100%" style={{ stopColor: '#00ff88', stopOpacity: 0 }} />
                    </linearGradient>
                    <linearGradient id="strokeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" style={{ stopColor: '#00ff88', stopOpacity: 1 }} />
                      <stop offset="100%" style={{ stopColor: '#00afaa', stopOpacity: 1 }} />
                    </linearGradient>
                  </defs>
                  {/* Grid Lines */}
                  {[0, 1, 2, 3, 4].map((i) => (
                    <line 
                      key={i} 
                      x1="0" 
                      y1={250 - (i * 250 / 4)} 
                      x2="600" 
                      y2={250 - (i * 250 / 4)} 
                      stroke="#F1F5F9" 
                      strokeWidth="1" 
                      strokeOpacity="0.4" 
                    />
                  ))}
                  
                  {/* Chart Path */}
                  {(() => {
                    const min = Math.min(...performanceData.map(d => d.value));
                    const max = Math.max(...performanceData.map(d => d.value));
                    const range = max - min || 1;
                    
                    const points = performanceData.map((d, i) => {
                      const x = (i / (performanceData.length - 1)) * 600;
                      const y = 250 - ((d.value - min) / range) * 200 - 25; // Leave some margin
                      return `${x},${y}`;
                    }).join(' ');

                    const firstX = 0;
                    const lastX = 600;
                    const areaPath = `M${firstX},250 ${points} L${lastX},250 Z`.replace(/,/g, ' ');
                    const linePath = `M${points.split(' ')[0]} L${points.substring(points.indexOf(' ') + 1)}`.replace(/,/g, ' ');

                    return (
                      <>
                        <path
                          d={areaPath}
                          fill="url(#gradientFill)"
                          opacity="0.1"
                        />
                        <path
                          d={`M${points.replace(/ /g, ' L')}`}
                          fill="none"
                          stroke="url(#strokeGradient)"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          style={{ filter: 'drop-shadow(0 8px 16px rgba(0, 255, 136, 0.2))' }}
                        />
                      </>
                    );
                  })()}

                  {/* X Axis Labels */}
                  {performanceData.filter((_, i) => i % Math.ceil(performanceData.length / 5) === 0).map((d, i, arr) => {
                    const x = (performanceData.indexOf(d) / (performanceData.length - 1)) * 600;
                    return (
                      <text 
                        key={i} 
                        x={x > 550 ? 550 : x < 50 ? 10 : x} 
                        y="245" 
                        className="text-[11px] fill-[#94A3B8] font-medium"
                      >
                        {new Date(d.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                      </text>
                    );
                  })}
                </svg>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[#94A3B8] text-sm">
                  {loading ? 'Carregando dados...' : 'Nenhum dado disponível para o período selecionado'}
                </div>
              )}
            </div>
          </div>

          {/* Connection Card */}
          <div className="bg-white rounded-xl sm:rounded-2xl border border-[rgba(0,0,0,0.03)] shadow-[0_4px_6px_-1px_rgba(0,0,0,0.02),0_10px_15px_-3px_rgba(0,0,0,0.04)] flex flex-col overflow-hidden">
            <div className="p-4 sm:p-6 lg:p-8 border-b border-[#F8FAFC] flex justify-between items-center bg-white">
              <div>
                <div className="text-base font-bold text-[#0F172A] tracking-[-0.01em] flex items-center gap-2.5">
                  <div className="w-4 h-4 flex items-center justify-center text-[#00AFAA] opacity-80">
                    <Icon icon="lucide:link" className="text-base" />
                  </div>
                  Conexão MT4
                </div>
                <div className="text-[13px] text-[#64748B] mt-1">
                  Status em tempo real
                </div>
              </div>
              <button className="bg-white border border-[#E2E8F0] rounded-full px-5 py-2 text-xs font-semibold text-[#0F172A] transition-all shadow-[0_2px_4px_rgba(0,0,0,0.02)] hover:border-[#CBD5E1] hover:shadow-[0_4px_8px_rgba(0,0,0,0.04)] hover:-translate-y-[1px] hover:text-black" data-media-type="banani-button">
                Gerenciar
              </button>
            </div>
            <div className="p-4 sm:p-6 lg:p-8 flex flex-col gap-4 sm:gap-6 lg:gap-8 flex-1">
              <div className="flex items-center justify-between px-4 sm:px-6 py-4 sm:py-5 bg-[rgba(240,253,244,0.6)] border border-[rgba(34,197,94,0.15)] rounded-xl sm:rounded-[14px]">
                <span className="flex items-center gap-3 font-bold text-[#15803D] text-[13px]">
                  <div 
                    className="w-2 h-2 bg-[#22C55E] rounded-full shadow-[0_0_0_4px_rgba(34,197,94,0.15)]" 
                    style={pulseStyle}
                  />
                  Conectada e Operando
                </span>
                <div className="w-[18px] h-[18px] flex items-center justify-center">
                  <Icon icon="lucide:wifi" className="text-[18px] text-[#22c55e]" />
                </div>
              </div>
              <div className="flex flex-col gap-0">
                {mt4Accounts.length > 0 ? (
                  mt4Accounts.slice(0, 1).map((account) => (
                    <>
                      <div key={`${account.id}-login`} className="flex justify-between py-3 sm:py-4 lg:py-5 border-b border-[#F1F5F9] text-xs sm:text-[13px] items-center">
                        <span className="text-[#64748B] font-medium">Login MT4</span>
                        <span className="font-semibold text-[#0F172A] text-right break-all ml-2">{account.account_number || account.accountNumber}</span>
                      </div>
                      <div key={`${account.id}-broker`} className="flex justify-between py-3 sm:py-4 lg:py-5 border-b border-[#F1F5F9] text-xs sm:text-[13px] items-center">
                        <span className="text-[#64748B] font-medium">Corretora</span>
                        <span className="font-semibold text-[#0F172A] text-right break-all ml-2">{account.broker || 'N/A'}</span>
                      </div>
                      <div key={`${account.id}-server`} className="flex justify-between py-3 sm:py-4 lg:py-5 text-xs sm:text-[13px] items-center">
                        <span className="text-[#64748B] font-medium">Servidor</span>
                        <span className="font-semibold text-[#0F172A] text-right break-all ml-2">{account.server || 'N/A'}</span>
                      </div>
                    </>
                  ))
                ) : (
                  <>
                    <div className="flex justify-between py-3 sm:py-4 lg:py-5 border-b border-[#F1F5F9] text-xs sm:text-[13px] items-center">
                      <span className="text-[#64748B] font-medium">Login MT4</span>
                      <span className="font-semibold text-[#0F172A] text-right break-all ml-2">82139402</span>
                    </div>
                    <div className="flex justify-between py-3 sm:py-4 lg:py-5 border-b border-[#F1F5F9] text-xs sm:text-[13px] items-center">
                      <span className="text-[#64748B] font-medium">Corretora</span>
                      <span className="font-semibold text-[#0F172A] text-right break-all ml-2">ICMarkets (Live)</span>
                    </div>
                    <div className="flex justify-between py-3 sm:py-4 lg:py-5 text-xs sm:text-[13px] items-center">
                      <span className="text-[#64748B] font-medium">Servidor</span>
                      <span className="font-semibold text-[#0F172A] text-right break-all ml-2">ICMarkets-Live18</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
      
      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </>
  )
}

export default DashboardPage
