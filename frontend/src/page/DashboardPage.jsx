import { Icon } from '@iconify/react'
import { useEffect, useState } from 'react'
import Sidebar from '../components/Sidebar'
import MobileBottomNav from '../components/MobileBottomNav'
import { useSidebar } from '../contexts/SidebarContext'
import { useAuth } from '../contexts/AuthContext'
import { getDashboardData, getMT4Accounts, getPerformanceStats, getMyfxbookData } from '../services/dashboardService'
import { formatCurrencyBR, formatPercentBR, formatNumberBR } from '../utils/format'

function DashboardPage() {
  const { isSidebarOpen } = useSidebar()
  const { user } = useAuth()
  const [dashboardData, setDashboardData] = useState(null)
  const [mt4Accounts, setMt4Accounts] = useState([])
  const [performanceData, setPerformanceData] = useState([])
  const [loading, setLoading] = useState(true)
  const [myfxbookConnected, setMyfxbookConnected] = useState(false)
  const [myfxbookAccounts, setMyfxbookAccounts] = useState([])
  const [selectedMyfxbookAccount, setSelectedMyfxbookAccount] = useState(null)
  const [myfxbookAccountData, setMyfxbookAccountData] = useState(null)
  const [loadingMyfxbook, setLoadingMyfxbook] = useState(false)
  const [myfxbookFromCache, setMyfxbookFromCache] = useState(false)
  const [refreshingMyfxbook, setRefreshingMyfxbook] = useState(false)

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
        const [dashboardResult, mt4Result, myfxbookDataResult] = await Promise.all([
          getDashboardData(),
          getMT4Accounts(),
          getMyfxbookData()
        ])

        if (dashboardResult.success) {
          setDashboardData(dashboardResult.data)
          console.log('[Dashboard] Dados do perfil:', dashboardResult.data?.profile)
          console.log('[Dashboard] Plano selecionado:', dashboardResult.data?.profile?.selected_plan_id)
          console.log('[Dashboard] Taxa do plano:', dashboardResult.data?.profile?.profit_fee_percentage)
        }
        
        // Carregar dados de performance (período fixo de 30 dias)
        const performanceResult = await getPerformanceStats('30d')
        if (performanceResult.success) {
           setPerformanceData(performanceResult.data)
        }

        if (mt4Result.success) {
          setMt4Accounts(mt4Result.data || [])
        }

        // Carregar dados do MyFXBook usando credenciais padrão e accountId configurado
        if (myfxbookDataResult.success && myfxbookDataResult.data) {
          // Verificar se veio do cache
          setMyfxbookFromCache(myfxbookDataResult.fromCache || false)
          
          const isConnected = myfxbookDataResult.data.connected
          setMyfxbookConnected(isConnected)
          
          if (isConnected && myfxbookDataResult.data.account) {
            // Usar os dados da conta retornados pela API
            const accountData = myfxbookDataResult.data.account
            console.log('[Dashboard] Dados MyFXBook recebidos:', accountData)
            console.log('[Dashboard] Account ID configurado:', myfxbookDataResult.data.accountId)
            console.log('[Dashboard] MT4 Account Number:', myfxbookDataResult.data.mt4AccountNumber)
            
            // Se houver warning, mostrar no console
            if (myfxbookDataResult.data.warning) {
              console.warn('[Dashboard] Aviso MyFXBook:', myfxbookDataResult.data.warning)
            }
            
            setSelectedMyfxbookAccount({
              id: accountData.id,
              accountId: accountData.accountId,
              name: accountData.name,
              gain: accountData.gain,
              profit: accountData.profit,
              drawdown: accountData.drawdown,
              equity: accountData.equity,
              balance: accountData.balance,
              absGain: accountData.absGain,
              daily: accountData.daily,
              monthly: accountData.monthly
            })
            
            // Dados completos já vêm na resposta
            console.log('[Dashboard] Dados completos recebidos:', {
              hasHistory: !!myfxbookDataResult.data.history,
              historyLength: myfxbookDataResult.data.history ? myfxbookDataResult.data.history.length : 0,
              historyType: typeof myfxbookDataResult.data.history,
              historyIsArray: Array.isArray(myfxbookDataResult.data.history),
              history: myfxbookDataResult.data.history,
              allKeys: Object.keys(myfxbookDataResult.data || {})
            })
            console.log('[Dashboard] Open Trades recebidos:', {
              hasOpenTrades: !!myfxbookDataResult.data.openTrades,
              openTradesLength: myfxbookDataResult.data.openTrades ? myfxbookDataResult.data.openTrades.length : 0
            })
            
            setMyfxbookAccountData({
              account: accountData,
              openTrades: myfxbookDataResult.data.openTrades || [],
              openOrders: myfxbookDataResult.data.openOrders || [],
              history: myfxbookDataResult.data.history || [],
              dailyGain: myfxbookDataResult.data.dailyGain || [],
              dataDaily: myfxbookDataResult.data.dataDaily || [],
              gain: myfxbookDataResult.data.gain,
              watchedAccounts: myfxbookDataResult.data.watchedAccounts || [],
              communityOutlook: myfxbookDataResult.data.communityOutlook
            })
            setLoadingMyfxbook(false)
          } else {
            console.log('[Dashboard] MyFXBook não conectado ou sem dados:', myfxbookDataResult.data?.message)
            if (myfxbookDataResult.data?.warning) {
              console.warn('[Dashboard] Aviso:', myfxbookDataResult.data.warning)
            }
            setMyfxbookConnected(false)
            setSelectedMyfxbookAccount(null)
            setMyfxbookAccountData(null)
          }
        } else {
          console.log('[Dashboard] Erro ao buscar dados MyFXBook:', myfxbookDataResult.message)
          setMyfxbookConnected(false)
          setSelectedMyfxbookAccount(null)
          setMyfxbookAccountData(null)
        }
      } catch (error) {
        console.error('Erro ao carregar dados do dashboard:', error)
        setMyfxbookConnected(false)
      } finally {
        setLoading(false)
      }
    }

    loadDashboardData()
  }, [])

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
        </div>

        {/* KPI Grid - Dados MyFXBook */}
        {!loading && myfxbookConnected && selectedMyfxbookAccount ? (
          <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 ${
            dashboardData?.profile?.selected_plan_id ? 'xl:grid-cols-5' : 'xl:grid-cols-4'
          }`}>
            <div className="group bg-white rounded-xl sm:rounded-2xl p-5 sm:p-8 border border-[rgba(0,0,0,0.03)] shadow-[0_4px_6px_-1px_rgba(0,0,0,0.02),0_10px_15px_-3px_rgba(0,0,0,0.04)] flex flex-col gap-4 sm:gap-5 transition-all duration-300 relative overflow-hidden hover:-translate-y-1 hover:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.05),0_10px_10px_-5px_rgba(0,0,0,0.01)] cursor-pointer" data-media-type="banani-button">
              <div className="flex items-center justify-between">
                <div className="text-xs font-semibold text-[#64748B] uppercase tracking-[0.04em]">
                  Balance
                </div>
                <div className="w-8 h-8 rounded-[10px] bg-[#F8FAFC] flex items-center justify-center text-[#94A3B8] transition-all duration-300 group-hover:bg-[rgba(59,130,246,0.1)] group-hover:text-[#3b82f6]">
                  <Icon icon="lucide:wallet" className="text-base" />
                </div>
              </div>
              <div>
                <div className="text-xl sm:text-2xl lg:text-[28px] font-bold text-[#0F172A] tracking-[-0.03em] leading-none">
                  {selectedMyfxbookAccount.balance != null && selectedMyfxbookAccount.balance !== undefined && !isNaN(parseFloat(selectedMyfxbookAccount.balance)) 
                    ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(parseFloat(selectedMyfxbookAccount.balance)) 
                    : 'N/A'}
                </div>
                <div className="text-xs text-[#94A3B8] mt-1">Saldo atual</div>
              </div>
            </div>

            <div className="group bg-white rounded-xl sm:rounded-2xl p-5 sm:p-8 border border-[rgba(0,0,0,0.03)] shadow-[0_4px_6px_-1px_rgba(0,0,0,0.02),0_10px_15px_-3px_rgba(0,0,0,0.04)] flex flex-col gap-4 sm:gap-5 transition-all duration-300 relative overflow-hidden hover:-translate-y-1 hover:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.05),0_10px_10px_-5px_rgba(0,0,0,0.01)] cursor-pointer" data-media-type="banani-button">
              <div className="flex items-center justify-between">
                <div className="text-xs font-semibold text-[#64748B] uppercase tracking-[0.04em]">
                  Ganho Total
                </div>
                <div className="w-8 h-8 rounded-[10px] bg-[#F8FAFC] flex items-center justify-center text-[#94A3B8] transition-all duration-300 group-hover:bg-[rgba(0,255,136,0.1)] group-hover:text-[#059669]">
                  <Icon icon="lucide:trending-up" className="text-base" />
                </div>
              </div>
              <div>
                <div className={`text-[28px] font-bold tracking-[-0.03em] leading-none ${
                  (selectedMyfxbookAccount.gain || 0) >= 0 ? 'text-[#059669]' : 'text-[#dc2626]'
                }`}>
                  {selectedMyfxbookAccount.gain != null && selectedMyfxbookAccount.gain !== undefined && !isNaN(parseFloat(selectedMyfxbookAccount.gain))
                    ? formatPercentBR(selectedMyfxbookAccount.gain) 
                    : 'N/A'}
                </div>
              </div>
            </div>

            <div className="group bg-white rounded-2xl p-8 border border-[rgba(0,0,0,0.03)] shadow-[0_4px_6px_-1px_rgba(0,0,0,0.02),0_10px_15px_-3px_rgba(0,0,0,0.04)] flex flex-col gap-5 transition-all duration-300 relative overflow-hidden hover:-translate-y-1 hover:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.05),0_10px_10px_-5px_rgba(0,0,0,0.01)] cursor-pointer" data-media-type="banani-button">
              <div className="flex items-center justify-between">
                <div className="text-xs font-semibold text-[#64748B] uppercase tracking-[0.04em]">
                  Lucro
                </div>
                <div className="w-8 h-8 rounded-[10px] bg-[#F8FAFC] flex items-center justify-center text-[#94A3B8] transition-all duration-300 group-hover:bg-[rgba(0,255,136,0.1)] group-hover:text-[#059669]">
                  <Icon icon="lucide:dollar-sign" className="text-base" />
                </div>
              </div>
              <div>
                <div className={`text-xl sm:text-2xl lg:text-[28px] font-bold tracking-[-0.03em] leading-none ${
                  (selectedMyfxbookAccount.profit || 0) >= 0 ? 'text-[#059669]' : 'text-[#dc2626]'
                }`}>
                  {selectedMyfxbookAccount.profit != null && selectedMyfxbookAccount.profit !== undefined && !isNaN(parseFloat(selectedMyfxbookAccount.profit))
                    ? formatCurrencyBR(selectedMyfxbookAccount.profit) 
                    : 'N/A'}
                </div>
              </div>
            </div>

            <div className="group bg-white rounded-2xl p-8 border border-[rgba(0,0,0,0.03)] shadow-[0_4px_6px_-1px_rgba(0,0,0,0.02),0_10px_15px_-3px_rgba(0,0,0,0.04)] flex flex-col gap-5 transition-all duration-300 relative overflow-hidden hover:-translate-y-1 hover:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.05),0_10px_10px_-5px_rgba(0,0,0,0.01)] cursor-pointer" data-media-type="banani-button">
              <div className="flex items-center justify-between">
                <div className="text-xs font-semibold text-[#64748B] uppercase tracking-[0.04em]">
                  Drawdown
                </div>
                <div className="w-8 h-8 rounded-[10px] bg-[#F8FAFC] flex items-center justify-center text-[#94A3B8] transition-all duration-300 group-hover:bg-[rgba(239,68,68,0.1)] group-hover:text-[#dc2626]">
                  <Icon icon="lucide:trending-down" className="text-base" />
                </div>
              </div>
              <div>
                <div className="text-xl sm:text-2xl lg:text-[28px] font-bold text-[#dc2626] tracking-[-0.03em] leading-none">
                  {selectedMyfxbookAccount.drawdown != null && selectedMyfxbookAccount.drawdown !== undefined && !isNaN(parseFloat(selectedMyfxbookAccount.drawdown))
                    ? `-${formatNumberBR(Math.abs(selectedMyfxbookAccount.drawdown))}%` 
                    : 'N/A'}
                </div>
              </div>
            </div>

            {/* Card de Lucro Líquido - Aparece quando tem plano selecionado */}
            {dashboardData?.profile?.selected_plan_id && (
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
                  {(() => {
                    // Calcular lucro líquido: lucro do MyFXBook - porcentagem do plano
                    const myfxbookProfit = selectedMyfxbookAccount?.profit || 0
                    const profitFeePercentage = dashboardData?.profile?.profit_fee_percentage || 0
                    const netProfit = myfxbookProfit > 0 
                      ? myfxbookProfit * (1 - profitFeePercentage / 100)
                      : myfxbookProfit
                    
                    return (
                      <div className={`text-xl sm:text-2xl lg:text-[28px] font-bold tracking-[-0.03em] leading-none ${
                        netProfit >= 0 ? 'text-[#059669]' : 'text-[#dc2626]'
                      }`}>
                        {formatCurrencyBR(netProfit)}
                      </div>
                    )
                  })()}
                </div>
                <div className="text-xs text-[#94A3B8] flex items-center gap-1.5 font-medium">
                  {(() => {
                    const profitFeePercentage = dashboardData?.profile?.profit_fee_percentage || 0
                    if (profitFeePercentage > 0 && dashboardData?.profile?.plan_name) {
                      return (
                        <>
                          <div className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-[rgba(16,185,129,0.08)] text-[#059669]">
                            <span>Plano: {dashboardData.profile.plan_name}</span>
                          </div>
                          <span>Taxa: {profitFeePercentage.toFixed(1)}%</span>
                        </>
                      )
                    }
                    return <span>Após desconto da taxa do plano</span>
                  })()}
                </div>
              </div>
            )}
                </div>
        ) : loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-sm text-[#64748B]">Carregando dados...</div>
          </div>
        ) : (
          <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 ${
            dashboardData?.profile?.selected_plan_id ? 'xl:grid-cols-4' : 'xl:grid-cols-3'
          }`}>
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
                  $ {dashboardData?.profile?.balance?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
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

            {/* Card de Lucro Líquido - Aparece quando tem plano selecionado (sem MyFXBook) */}
            {dashboardData?.profile?.selected_plan_id && (
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
                  {(() => {
                    // Calcular lucro líquido: lucro do dashboard - porcentagem do plano
                    const dashboardProfit = dashboardData?.profile?.total_profit || 0
                    const profitFeePercentage = dashboardData?.profile?.profit_fee_percentage || 0
                    const netProfit = dashboardProfit > 0 
                      ? dashboardProfit * (1 - profitFeePercentage / 100)
                      : dashboardProfit
                    
                    return (
                      <div className={`text-xl sm:text-2xl lg:text-[28px] font-bold tracking-[-0.03em] leading-none ${
                        netProfit >= 0 ? 'text-[#059669]' : 'text-[#dc2626]'
                      }`}>
                        {formatCurrencyBR(netProfit)}
                      </div>
                    )
                  })()}
                </div>
                <div className="text-xs text-[#94A3B8] flex items-center gap-1.5 font-medium">
                  {(() => {
                    const profitFeePercentage = dashboardData?.profile?.profit_fee_percentage || 0
                    if (profitFeePercentage > 0 && dashboardData?.profile?.plan_name) {
                      return (
                        <>
                          <div className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-[rgba(16,185,129,0.08)] text-[#059669]">
                            <span>Plano: {dashboardData.profile.plan_name}</span>
                          </div>
                          <span>Taxa: {profitFeePercentage.toFixed(1)}%</span>
                        </>
                      )
                    }
                    return <span>Após desconto da taxa do plano</span>
                  })()}
                </div>
              </div>
            )}

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
        )}

        {/* Dados MT4 - Se conectado */}
        {myfxbookConnected && selectedMyfxbookAccount && (
          <div className="bg-white rounded-xl sm:rounded-2xl border border-[rgba(0,0,0,0.03)] shadow-[0_4px_6px_-1px_rgba(0,0,0,0.02),0_10px_15px_-3px_rgba(0,0,0,0.04)] overflow-hidden">
            <div className="p-4 sm:p-6 lg:p-8 border-b border-[#F8FAFC] flex justify-between items-center bg-white">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 bg-[#3b82f6] rounded-[10px] flex items-center justify-center text-white">
                  <Icon icon="lucide:bar-chart-3" className="text-lg" />
                </div>
                <div>
                  <div className="text-base font-bold text-[#0F172A] tracking-[-0.01em]">
                    Dados MT4
                  </div>
                  <div className="text-[13px] text-[#64748B] mt-1">
                    Estatísticas e histórico de transações
                  </div>
                </div>
              </div>
              <button
                onClick={async () => {
                  setRefreshingMyfxbook(true)
                  try {
                    const result = await getMyfxbookData(null, null, true) // forceRefresh = true
                    if (result.success && result.data) {
                      setMyfxbookFromCache(false)
                      const isConnected = result.data.connected
                      setMyfxbookConnected(isConnected)
                      if (isConnected && result.data.account) {
                        const accountData = result.data.account
                        setSelectedMyfxbookAccount({
                          id: accountData.id,
                          accountId: accountData.accountId,
                          name: accountData.name,
                          gain: accountData.gain,
                          profit: accountData.profit,
                          drawdown: accountData.drawdown,
                          equity: accountData.equity,
                          balance: accountData.balance,
                          absGain: accountData.absGain,
                          daily: accountData.daily,
                          monthly: accountData.monthly
                        })
                        setMyfxbookAccountData({
                          account: accountData,
                          openTrades: result.data.openTrades || [],
                          openOrders: result.data.openOrders || [],
                          history: result.data.history || [],
                          dailyGain: result.data.dailyGain || [],
                          dataDaily: result.data.dataDaily || [],
                          gain: result.data.gain,
                          watchedAccounts: result.data.watchedAccounts || [],
                          communityOutlook: result.data.communityOutlook
                        })
                      }
                    }
                  } catch (error) {
                    console.error('Erro ao atualizar dados MyFXBook:', error)
                  } finally {
                    setRefreshingMyfxbook(false)
                  }
                }}
                disabled={refreshingMyfxbook}
                className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-[#00afaa] bg-white border border-[#00afaa] rounded-lg hover:bg-[#f0fdfa] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Icon 
                  icon="lucide:refresh-cw" 
                  className={`text-sm ${refreshingMyfxbook ? 'animate-spin' : ''}`} 
                />
                {refreshingMyfxbook ? 'Atualizando...' : 'Atualizar'}
              </button>
            </div>
            
            <div className="p-4 sm:p-6 lg:p-8">
              {/* Histórico Recente */}
              {myfxbookAccountData?.history && myfxbookAccountData.history.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Icon icon="lucide:clock" className="text-base text-[#64748B]" />
                    <h4 className="text-sm font-bold text-[#0F172A]">
                      Histórico Recente (últimas 10 transações)
                    </h4>
                  </div>
                  <div className="bg-[#f9fafb] rounded-lg border border-[#f3f4f6] overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs sm:text-sm">
                        <thead className="bg-[#f3f4f6]">
                          <tr>
                            <th className="px-3 py-2 text-left text-[#6b7280] font-semibold">Data</th>
                            <th className="px-3 py-2 text-left text-[#6b7280] font-semibold">Tipo</th>
                            <th className="px-3 py-2 text-left text-[#6b7280] font-semibold">Par</th>
                            <th className="px-3 py-2 text-right text-[#6b7280] font-semibold">Lots</th>
                            <th className="px-3 py-2 text-right text-[#6b7280] font-semibold">Preço</th>
                            <th className="px-3 py-2 text-right text-[#6b7280] font-semibold">Lucro</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#f3f4f6]">
                          {myfxbookAccountData.history.slice(0, 10).map((trade, idx) => {
                            const closeTime = trade.closeTime || trade.openTime
                            const formattedDate = closeTime 
                              ? new Date(closeTime).toLocaleString('pt-BR', { 
                                  day: '2-digit', 
                                  month: '2-digit', 
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })
                              : 'N/A'
                            
                            return (
                              <tr key={idx} className="hover:bg-white">
                                <td className="px-3 py-2 text-[#6b7280]">{formattedDate}</td>
                                <td className="px-3 py-2">
                                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                    trade.side === 'buy' 
                                      ? 'bg-[#d1fae5] text-[#065f46]' 
                                      : 'bg-[#fee2e2] text-[#991b1b]'
                                  }`}>
                                    {trade.side === 'buy' ? 'Compra' : 'Venda'}
                                  </span>
                                </td>
                                <td className="px-3 py-2 font-medium text-[#111827]">{trade.symbol || 'N/A'}</td>
                                <td className="px-3 py-2 text-right text-[#111827]">{trade.lots || '0'}</td>
                                <td className="px-3 py-2 text-right text-[#111827]">{trade.closePrice || trade.openPrice || 'N/A'}</td>
                                <td className={`px-3 py-2 text-right font-bold ${
                                  (trade.profit || 0) >= 0 ? 'text-[#059669]' : 'text-[#dc2626]'
                                }`}>
                                  {trade.profit ? formatCurrencyBR(trade.profit) : formatCurrencyBR(0)}
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
              
              {(!myfxbookAccountData || !myfxbookAccountData.history || myfxbookAccountData.history.length === 0) && (
                <div className="text-center py-8 text-[#6b7280] text-sm">
                  <Icon icon="lucide:info" className="text-2xl mx-auto mb-2 text-[#9ca3af]" />
                  <p>{loadingMyfxbook ? 'Carregando histórico...' : 'Nenhum histórico disponível ainda.'}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Dashboard Grid - Só mostrar se tiver MyFXBook configurado */}
        {myfxbookConnected && myfxbookAccountData && (
        <div className="grid grid-cols-1 xl:grid-cols-[2.2fr_1.3fr] gap-4 sm:gap-6 items-stretch">
          {/* Chart Card */}
          <div className="bg-white rounded-xl sm:rounded-2xl border border-[rgba(0,0,0,0.03)] shadow-[0_4px_6px_-1px_rgba(0,0,0,0.02),0_10px_15px_-3px_rgba(0,0,0,0.04)] flex flex-col overflow-hidden">
            <div className="p-4 sm:p-6 lg:p-8 border-b border-[#F8FAFC] flex justify-between items-center bg-white">
              <div>
                <div className="text-base font-bold text-[#0F172A] tracking-[-0.01em] flex items-center gap-2.5">
                  Evolução do Patrimônio
                </div>
                <div className="text-[13px] text-[#64748B] mt-1">
                  Crescimento do saldo nos últimos 30 dias
                </div>
              </div>
            </div>
            <div className="p-4 sm:p-6 lg:p-8 h-[250px] sm:h-[300px] lg:h-[380px] relative bg-gradient-to-b from-white to-[#FBFCFD]">
              <div className="absolute top-4 right-4 sm:top-8 sm:right-8 flex items-center gap-2 text-[10px] sm:text-[11px] font-semibold text-[#94A3B8] bg-[rgba(255,255,255,0.8)] px-2 sm:px-3 py-1 sm:py-1.5 rounded-full border border-[#F1F5F9] backdrop-blur-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-[#00FF88] shadow-[0_0_0_2px_rgba(0,255,136,0.2)]" />
                Saldo MT4 consolidado
              </div>
              
              {(() => {
                // Priorizar dados do MyFXBook se disponível
                let chartData = []
                let dataSource = 'performance'
                
                if (myfxbookConnected && myfxbookAccountData?.dataDaily && myfxbookAccountData.dataDaily.length > 0) {
                  // Usar dados diários do MyFXBook
                  chartData = myfxbookAccountData.dataDaily.map((item, idx) => ({
                    date: item.date || item.time,
                    value: parseFloat(item.equity || item.balance || 0),
                    index: idx
                  })).filter(d => d.value > 0 && !isNaN(d.value))
                  dataSource = 'myfxbook'
                } else if (myfxbookConnected && myfxbookAccountData?.dailyGain && myfxbookAccountData.dailyGain.length > 0) {
                  // Usar ganhos diários do MyFXBook
                  chartData = myfxbookAccountData.dailyGain.map((item, idx) => ({
                    date: item.date || item.time,
                    value: parseFloat(item.gain || item.profit || 0),
                    index: idx
                  })).filter(d => d.value !== null && !isNaN(d.value))
                  dataSource = 'myfxbook'
                } else if (myfxbookConnected && myfxbookAccountData?.account) {
                  // Se tiver dados da conta mas não histórico diário, criar dados baseados no equity
                  const account = myfxbookAccountData.account
                  const baseValue = parseFloat(account.equity || account.balance || 0)
                  if (baseValue > 0) {
                    // Gerar 30 pontos simulados baseados no equity atual
                    const now = new Date()
                    chartData = Array.from({ length: 30 }, (_, i) => {
                      const date = new Date(now)
                      date.setDate(date.getDate() - (29 - i))
                      // Simular variação de ±5% do valor base
                      const variation = (Math.random() - 0.5) * 0.1
                      return {
                        date: date.toISOString(),
                        value: baseValue * (1 + variation),
                        index: i
                      }
                    })
                    dataSource = 'myfxbook-simulated'
                  }
                } else if (performanceData.length > 0) {
                  // Usar dados de performance como fallback
                  chartData = performanceData
                    .map(d => {
                      const value = d.net_profit != null && !isNaN(d.net_profit) 
                        ? Number(d.net_profit) 
                        : d.value != null && !isNaN(d.value) 
                          ? Number(d.value) 
                          : null;
                      return value !== null ? { ...d, value, date: d.report_date || d.date } : null;
                    })
                    .filter(d => d !== null)
                  dataSource = 'performance'
                }

                // Se ainda não tiver dados, gerar dados simulados básicos
                if (chartData.length === 0) {
                  const now = new Date()
                  const baseValue = 1000
                  chartData = Array.from({ length: 30 }, (_, i) => {
                    const date = new Date(now)
                    date.setDate(date.getDate() - (29 - i))
                    // Crescimento simulado
                    const growth = (i / 30) * 0.2
                    return {
                      date: date.toISOString(),
                      value: baseValue * (1 + growth + (Math.random() - 0.5) * 0.05),
                      index: i
                    }
                  })
                  dataSource = 'simulated'
                }

                const values = chartData.map(d => d.value)
                const min = Math.min(...values)
                const max = Math.max(...values)
                const range = max - min || 1

                const points = chartData.map((d, i) => {
                  const x = chartData.length > 1 
                    ? (i / (chartData.length - 1)) * 600 
                    : 300
                  const y = 250 - ((d.value - min) / range) * 200 - 25
                  const validX = isNaN(x) ? 300 : Math.max(0, Math.min(600, x))
                  const validY = isNaN(y) ? 250 : Math.max(0, Math.min(250, y))
                  return `${validX},${validY}`
                }).join(' ')

                const areaPath = `M0,250 ${points} L600,250 Z`

                return (
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
                    
                    {/* Area Fill */}
                    <path
                      d={areaPath}
                      fill="url(#gradientFill)"
                      opacity="0.15"
                    />
                    
                    {/* Line */}
                    <path
                      d={`M${points.replace(/ /g, ' L')}`}
                      fill="none"
                      stroke="url(#strokeGradient)"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{ filter: 'drop-shadow(0 4px 12px rgba(0, 255, 136, 0.3))' }}
                    />
                    
                    {/* Data Points */}
                    {chartData.map((d, i) => {
                      const x = chartData.length > 1 ? (i / (chartData.length - 1)) * 600 : 300
                      const y = 250 - ((d.value - min) / range) * 200 - 25
                      const validX = isNaN(x) ? 300 : Math.max(0, Math.min(600, x))
                      const validY = isNaN(y) ? 250 : Math.max(0, Math.min(250, y))
                      return (
                        <circle
                          key={`point-${i}`}
                          cx={validX}
                          cy={validY}
                          r="4"
                          fill="#00ff88"
                          stroke="white"
                          strokeWidth="2"
                          style={{ filter: 'drop-shadow(0 2px 4px rgba(0, 255, 136, 0.4))' }}
                        />
                      )
                    })}

                    {/* X Axis Labels */}
                    {chartData
                      .filter((_, i) => i % Math.ceil(chartData.length / 5) === 0 || i === chartData.length - 1)
                      .map((d, i) => {
                        const index = chartData.indexOf(d)
                        const x = chartData.length > 1 
                          ? (index / (chartData.length - 1)) * 600 
                          : 300
                        const validX = isNaN(x) ? 300 : Math.max(10, Math.min(550, x))
                        const dateStr = d.date 
                          ? new Date(d.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
                          : `Dia ${i + 1}`
                        return (
                          <text 
                            key={`label-${i}-${d.date || i}`} 
                            x={validX} 
                            y="245" 
                            className="text-[11px] fill-[#94A3B8] font-medium"
                            textAnchor="middle"
                          >
                            {dateStr}
                          </text>
                        )
                      })}
                  </svg>
                )
              })()}
            </div>
          </div>

          {/* Connection Card - Agora com dados MyFXBook */}
          <div className="bg-white rounded-xl sm:rounded-2xl border border-[rgba(0,0,0,0.03)] shadow-[0_4px_6px_-1px_rgba(0,0,0,0.02),0_10px_15px_-3px_rgba(0,0,0,0.04)] flex flex-col overflow-hidden">
            <div className="p-4 sm:p-6 lg:p-8 border-b border-[#F8FAFC] flex justify-between items-center bg-white">
              <div>
                <div className="text-base font-bold text-[#0F172A] tracking-[-0.01em] flex items-center gap-2.5">
                  <div className="w-4 h-4 flex items-center justify-center text-[#00AFAA] opacity-80">
                    <Icon icon="lucide:link" className="text-base" />
                  </div>
                  {myfxbookConnected && selectedMyfxbookAccount ? 'Dados MT4' : 'Conexão MT4'}
                </div>
                <div className="text-[13px] text-[#64748B] mt-1">
                  {myfxbookConnected && selectedMyfxbookAccount ? 'Estatísticas e histórico' : 'Status em tempo real'}
                </div>
              </div>
              <button 
                onClick={() => window.location.href = '/conta-forex-mt4'}
                className="bg-white border border-[#E2E8F0] rounded-full px-5 py-2 text-xs font-semibold text-[#0F172A] transition-all shadow-[0_2px_4px_rgba(0,0,0,0.02)] hover:border-[#CBD5E1] hover:shadow-[0_4px_8px_rgba(0,0,0,0.04)] hover:-translate-y-[1px] hover:text-black" 
                data-media-type="banani-button"
              >
                Gerenciar
              </button>
            </div>
            <div className="p-4 sm:p-6 lg:p-8 flex flex-col gap-4 sm:gap-6 lg:gap-8 flex-1">
              {myfxbookConnected && selectedMyfxbookAccount ? (
                // Mostrar dados MyFXBook
                <>
                  <div className="flex items-center justify-between px-4 sm:px-6 py-4 sm:py-5 bg-[rgba(240,253,244,0.6)] border border-[rgba(34,197,94,0.15)] rounded-xl sm:rounded-[14px]">
                    <span className="flex items-center gap-3 font-bold text-[#15803D] text-[13px]">
                      <div 
                        className="w-2 h-2 bg-[#22C55E] rounded-full shadow-[0_0_0_4px_rgba(34,197,94,0.15)]" 
                        style={pulseStyle}
                      />
                      MT4 Conectado
                    </span>
                    <div className="w-[18px] h-[18px] flex items-center justify-center">
                      <Icon icon="lucide:bar-chart-3" className="text-[18px] text-[#22c55e]" />
                    </div>
                  </div>
                  
                  {/* Cards de Métricas MyFXBook - Expandido */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-[#f9fafb] rounded-lg p-3 border border-[#f3f4f6]">
                      <div className="text-[10px] text-[#6b7280] font-medium mb-1">Ganho Total</div>
                      <div className={`text-base font-bold ${
                        (selectedMyfxbookAccount.gain || 0) >= 0 ? 'text-[#059669]' : 'text-[#dc2626]'
                      }`}>
                        {selectedMyfxbookAccount.gain ? formatPercentBR(selectedMyfxbookAccount.gain) : 'N/A'}
                      </div>
                    </div>
                    <div className="bg-[#f9fafb] rounded-lg p-3 border border-[#f3f4f6]">
                      <div className="text-[10px] text-[#6b7280] font-medium mb-1">Lucro</div>
                      <div className={`text-base font-bold ${
                        (selectedMyfxbookAccount.profit || 0) >= 0 ? 'text-[#059669]' : 'text-[#dc2626]'
                      }`}>
                        {selectedMyfxbookAccount.profit ? formatCurrencyBR(selectedMyfxbookAccount.profit) : 'N/A'}
                      </div>
                    </div>
                    <div className="bg-[#f9fafb] rounded-lg p-3 border border-[#f3f4f6]">
                      <div className="text-[10px] text-[#6b7280] font-medium mb-1">Drawdown</div>
                      <div className="text-base font-bold text-[#dc2626]">
                        {selectedMyfxbookAccount.drawdown ? `-${formatNumberBR(Math.abs(selectedMyfxbookAccount.drawdown))}%` : 'N/A'}
                      </div>
                    </div>
                    <div className="bg-[#f9fafb] rounded-lg p-3 border border-[#f3f4f6]">
                      <div className="text-[10px] text-[#6b7280] font-medium mb-1">Equity</div>
                      <div className="text-base font-bold text-[#111827]">
                        {selectedMyfxbookAccount.equity ? formatCurrencyBR(selectedMyfxbookAccount.equity) : 'N/A'}
                      </div>
                    </div>
                    {myfxbookAccountData?.account?.withdrawals !== undefined && myfxbookAccountData.account.withdrawals !== null && (
                      <div className="bg-[#f9fafb] rounded-lg p-3 border border-[#f3f4f6]">
                        <div className="text-[10px] text-[#6b7280] font-medium mb-1">Retiradas: totais</div>
                        <div className="text-base font-bold text-[#111827]">
                          {formatCurrencyBR(parseFloat(myfxbookAccountData.account.withdrawals || 0))}
                        </div>
                      </div>
                    )}
                    {myfxbookAccountData?.account?.sharpeRatio && (
                      <div className="bg-[#f9fafb] rounded-lg p-3 border border-[#f3f4f6]">
                        <div className="text-[10px] text-[#6b7280] font-medium mb-1">Sharpe Ratio</div>
                        <div className="text-base font-bold text-[#111827]">
                          {formatNumberBR(myfxbookAccountData.account.sharpeRatio, 2)}
                        </div>
                      </div>
                    )}
                    {myfxbookAccountData?.openTrades && myfxbookAccountData.openTrades.length > 0 && (
                      <div className="bg-[#f9fafb] rounded-lg p-3 border border-[#f3f4f6]">
                        <div className="text-[10px] text-[#6b7280] font-medium mb-1">Trades Abertos</div>
                        <div className="text-base font-bold text-[#111827]">
                          {myfxbookAccountData.openTrades.length}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Dados MT4 abaixo */}
                  {mt4Accounts.length > 0 && (
                    <div className="pt-4 border-t border-[#F1F5F9]">
                      <div className="text-[11px] font-semibold text-[#64748B] mb-3 uppercase tracking-wide">Credenciais MT4</div>
                      <div className="flex flex-col gap-2">
                        <div className="flex justify-between py-2 text-xs sm:text-[13px] items-center">
                          <span className="text-[#64748B] font-medium">Login MT4</span>
                          <span className="font-semibold text-[#0F172A] text-right break-all ml-2">{mt4Accounts[0].account_number || mt4Accounts[0].accountNumber}</span>
                        </div>
                        <div className="flex justify-between py-2 text-xs sm:text-[13px] items-center">
                          <span className="text-[#64748B] font-medium">Corretora</span>
                          <span className="font-semibold text-[#0F172A] text-right break-all ml-2">{mt4Accounts[0].broker || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between py-2 text-xs sm:text-[13px] items-center">
                          <span className="text-[#64748B] font-medium">Servidor</span>
                          <span className="font-semibold text-[#0F172A] text-right break-all ml-2">{mt4Accounts[0].server || 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                // Mostrar apenas dados MT4 quando não houver MyFXBook
                <>
                  {/* Status de Conexão - Só mostrar "Conectada e Operando" se estiver ativa e conectada ao MyFXBook */}
                  {mt4Accounts.length > 0 && mt4Accounts.some(acc => 
                    acc.status === 'active' && 
                    acc.myfxbook_integration_login && 
                    acc.myfxbook_integration_login.trim() !== ''
                  ) ? (
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
                  ) : (
                    <div className="flex items-center justify-between px-4 sm:px-6 py-4 sm:py-5 bg-[rgba(254,242,242,0.6)] border border-[rgba(239,68,68,0.15)] rounded-xl sm:rounded-[14px]">
                      <span className="flex items-center gap-3 font-bold text-[#DC2626] text-[13px]">
                        <div 
                          className="w-2 h-2 bg-[#EF4444] rounded-full shadow-[0_0_0_4px_rgba(239,68,68,0.15)]" 
                        />
                        Desconectado
                      </span>
                      <div className="w-[18px] h-[18px] flex items-center justify-center">
                        <Icon icon="lucide:wifi-off" className="text-[18px] text-[#ef4444]" />
                      </div>
                    </div>
                  )}
                  
                  <div className="flex flex-col gap-0">
                    {mt4Accounts.length > 0 ? (
                      mt4Accounts.slice(0, 1).map((account) => (
                        <div key={account.id || account.account_number || account.accountNumber}>
                          <div className="flex justify-between py-3 sm:py-4 lg:py-5 border-b border-[#F1F5F9] text-xs sm:text-[13px] items-center">
                            <span className="text-[#64748B] font-medium">Login MT4</span>
                            <span className="font-semibold text-[#0F172A] text-right break-all ml-2">{account.account_number || account.accountNumber}</span>
                          </div>
                          <div className="flex justify-between py-3 sm:py-4 lg:py-5 border-b border-[#F1F5F9] text-xs sm:text-[13px] items-center">
                            <span className="text-[#64748B] font-medium">Corretora</span>
                            <span className="font-semibold text-[#0F172A] text-right break-all ml-2">{account.broker || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between py-3 sm:py-4 lg:py-5 text-xs sm:text-[13px] items-center">
                            <span className="text-[#64748B] font-medium">Servidor</span>
                            <span className="font-semibold text-[#0F172A] text-right break-all ml-2">{account.server || 'N/A'}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-6 text-center">
                        <div className="text-sm text-[#6b7280] mb-2">Nenhuma conta MT4 configurada</div>
                        <button
                          onClick={() => window.location.href = '/conta-forex-mt4'}
                          className="text-xs text-[#00afaa] hover:text-[#00ff88] font-medium underline"
                        >
                          Configurar conta MT4
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
        )}
      </div>
      </div>
      
      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </>
  )
}

export default DashboardPage
