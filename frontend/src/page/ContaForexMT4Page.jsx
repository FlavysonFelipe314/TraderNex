import { useEffect, useState, useRef, useCallback } from 'react'
import { Icon } from '@iconify/react'
import { useNavigate } from 'react-router-dom'
import DashboardLayout from '../components/DashboardLayout'
import { 
  getMT4Accounts, 
  addMT4Account,
  updateMT4Settings,
  getMyfxbookData
} from '../services/dashboardService'

function ContaForexMT4Page() {
  const navigate = useNavigate()
  const [automationEnabled, setAutomationEnabled] = useState(true)
  const [riskProfile, setRiskProfile] = useState('moderado')
  const [lastUpdated, setLastUpdated] = useState('2 min')
  const [mt4Accounts, setMt4Accounts] = useState([])
  const [loading, setLoading] = useState(true)
  const [myfxbookConnected, setMyfxbookConnected] = useState(false)
  const [myfxbookData, setMyfxbookData] = useState(null)
  
  // Refs para controlar requisições e evitar múltiplas chamadas
  const isLoadingRef = useRef(false)

  useEffect(() => {
    document.body.classList.add('scroll-enabled')
    return () => {
      document.body.classList.remove('scroll-enabled')
    }
  }, [])

  // Função para carregar dados com proteção contra múltiplas requisições
  const loadMT4Accounts = useCallback(async () => {
    // Se já está carregando, não fazer nova requisição
    if (isLoadingRef.current) {
      console.log('[ContaForex] Ignorando requisição, já está carregando...')
      return
    }
    
    isLoadingRef.current = true
    setLoading(true)
    
    try {
      // Usar Promise.allSettled para não falhar completamente se uma requisição falhar
      const [mt4Result, myfxbookResult] = await Promise.allSettled([
        getMT4Accounts(),
        getMyfxbookData()
      ])
      
      // Processar resultado MT4
      if (mt4Result.status === 'fulfilled') {
        const result = mt4Result.value
        console.log('Resultado getMT4Accounts:', result)
        if (result.success) {
          const accounts = result.data || []
          console.log('Contas MT4 carregadas:', accounts)
          setMt4Accounts(accounts)
          
          // Carregar configurações operacionais da primeira conta
          if (accounts.length > 0) {
            const firstAccount = accounts[0]
            if (firstAccount.automation_enabled !== undefined) {
              setAutomationEnabled(firstAccount.automation_enabled)
            }
            if (firstAccount.risk_profile) {
              setRiskProfile(firstAccount.risk_profile)
            }
          }
        } else {
          console.warn('Falha ao carregar contas MT4:', result.message)
        }
      } else {
        const error = mt4Result.reason
        if (error.response?.status !== 401 && error.response?.status !== 429) {
          console.error('[ContaForex] Erro ao carregar MT4:', error)
        }
      }

      // Processar resultado MyFXBook
      if (myfxbookResult.status === 'fulfilled') {
        const result = myfxbookResult.value
        if (result.success && result.data) {
          const isConnected = result.data.connected
          setMyfxbookConnected(isConnected)
          if (isConnected && result.data.account) {
            setMyfxbookData({
              equity: result.data.account.equity,
              profit: result.data.account.profit,
              currency: result.data.account.currency || 'USD'
            })
          } else {
            setMyfxbookData(null)
          }
        } else {
          // Não limpar dados se foi rate limit
          if (result.error?.status !== 429 && result.error?.response?.status !== 429) {
            setMyfxbookConnected(false)
            setMyfxbookData(null)
          }
        }
      } else {
        const error = myfxbookResult.reason
        if (error.response?.status === 429) {
          console.warn('[ContaForex] Rate limit MyFXBook, mantendo dados anteriores')
          // Não limpar dados em caso de rate limit
        } else if (error.response?.status === 401) {
          // Erro de autenticação será tratado pelo interceptor
          console.warn('[ContaForex] Erro de autenticação')
        } else {
          console.error('[ContaForex] Erro ao carregar MyFXBook:', error)
          setMyfxbookConnected(false)
          setMyfxbookData(null)
        }
      }
    } catch (error) {
      // Tratamento de erro geral
      if (error.response?.status === 429) {
        console.warn('[ContaForex] Rate limit atingido, mantendo dados anteriores')
        return
      }
      if (error.response?.status === 401) {
        // Erro de autenticação será tratado pelo interceptor
        return
      }
      console.error('Erro ao carregar dados:', error)
    } finally {
      isLoadingRef.current = false
      setLoading(false)
    }
  }, [])

  // Carregar contas MT4 e dados MyFXBook
  useEffect(() => {
    loadMT4Accounts()
  }, [loadMT4Accounts])

  // MyFXBook removido - apenas admin pode configurar via painel admin


  return (
    <DashboardLayout 
      title="Configuração MT4"
      subtitle="Gerencie a conexão e parâmetros de risco da sua conta"
      customHeader={
        <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-[#6b7280] bg-white px-3 py-1.5 rounded-full border border-[#f3f4f6]">
          <Icon icon="lucide:clock" className="text-xs" />
          <span>Atualizado há {lastUpdated}</span>
        </div>
      }
    >
      <div className="max-w-[1080px] flex flex-col gap-4 sm:gap-6 lg:gap-7">
        {/* Top Cards Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Card 1: Status MT4 Conectado */}
          <div className="bg-white rounded-xl sm:rounded-2xl border border-[#e5e7eb] shadow-[0_4px_6px_-1px_rgba(0,0,0,0.02),0_10px_15px_-3px_rgba(0,0,0,0.03)] h-auto sm:h-[110px] flex items-center px-4 sm:px-7 py-4 sm:py-0 gap-4 sm:gap-5 hover:-translate-y-0.5 transition-transform">
            <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center ${
              mt4Accounts.length > 0 && mt4Accounts[0].status === 'active'
                ? 'bg-[#d1fae5] text-[#059669]' 
                : 'bg-[#fee2e2] text-[#dc2626]'
            }`}>
              <Icon 
                icon={mt4Accounts.length > 0 && mt4Accounts[0].status === 'active' ? "lucide:check-circle" : "lucide:x-circle"} 
                className="text-lg sm:text-xl" 
              />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[10px] sm:text-xs font-semibold text-[#9ca3af] uppercase tracking-wider">MT4 Conectado</span>
              <span className={`text-sm sm:text-base font-bold ${
                mt4Accounts.length > 0 && mt4Accounts[0].status === 'active' ? 'text-[#059669]' : 'text-[#dc2626]'
                }`}>
                  {mt4Accounts.length > 0 && mt4Accounts[0].status === 'active' ? 'Conectado' : 'Desconectado'}
                </span>
            </div>
          </div>

          {/* Card 2: Nome do Broker */}
            <div className="bg-white rounded-xl sm:rounded-2xl border border-[#e5e7eb] shadow-[0_4px_6px_-1px_rgba(0,0,0,0.02),0_10px_15px_-3px_rgba(0,0,0,0.03)] h-auto sm:h-[110px] flex items-center px-4 sm:px-7 py-4 sm:py-0 gap-4 sm:gap-5 hover:-translate-y-0.5 transition-transform">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#f9fafb] rounded-xl flex items-center justify-center text-[#4b5563]">
                <Icon icon="lucide:server" className="text-lg sm:text-xl" />
              </div>
              <div className="flex flex-col gap-1">
              <span className="text-[10px] sm:text-xs font-semibold text-[#9ca3af] uppercase tracking-wider">Broker</span>
              <span className="text-sm sm:text-base font-bold text-[#111827]">
                {mt4Accounts.length > 0 ? mt4Accounts[0].broker || 'N/A' : 'N/A'}
              </span>
            </div>
          </div>

          {/* Card 3: Falcon AI */}
          <div className={`rounded-xl sm:rounded-2xl border h-auto sm:h-[110px] flex items-center justify-between px-4 sm:px-7 py-4 sm:py-0 hover:-translate-y-0.5 transition-transform ${
            mt4Accounts.length > 0 && mt4Accounts[0].status === 'active' && automationEnabled
              ? 'bg-[#0e0e10] border-[#1f2937] shadow-[0_8px_30px_rgba(0,255,136,0.05)]'
              : 'bg-[#1f2937] border-[#374151] shadow-[0_4px_6px_-1px_rgba(0,0,0,0.02)]'
          }`}>
            <div className="flex items-center gap-3 sm:gap-5">
              <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center border ${
                mt4Accounts.length > 0 && mt4Accounts[0].status === 'active' && automationEnabled
                  ? 'bg-[rgba(255,255,255,0.08)] text-[#00ff88] border-[rgba(0,255,136,0.2)] shadow-[0_0_15px_rgba(0,255,136,0.15)]'
                  : 'bg-[rgba(255,255,255,0.05)] text-[#6b7280] border-[rgba(255,255,255,0.1)]'
              }`}>
                <Icon icon="lucide:zap" className="text-lg sm:text-[22px]" />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] sm:text-xs font-semibold text-[rgba(255,255,255,0.5)] uppercase tracking-wider">Inteligência Ativa</span>
                <span className={`text-sm sm:text-[17px] font-bold ${
                  mt4Accounts.length > 0 && mt4Accounts[0].status === 'active' && automationEnabled
                    ? 'text-white'
                    : 'text-[#9ca3af]'
                }`}>
                  {mt4Accounts.length > 0 && mt4Accounts[0].status === 'active' && automationEnabled
                    ? 'Falcon AI Operando'
                    : 'Falcon AI Inativo'}
                </span>
              </div>
            </div>
            <div className={`text-[11px] font-bold px-3 py-1.5 rounded-full border ${
              mt4Accounts.length > 0 && mt4Accounts[0].status === 'active' && automationEnabled
                ? 'bg-[rgba(0,255,136,0.1)] text-[#00ff88] border-[rgba(0,255,136,0.2)]'
                : 'bg-[rgba(107,114,128,0.1)] text-[#6b7280] border-[rgba(107,114,128,0.2)]'
            }`}>
              v4.2
            </div>
          </div>
        </div>

        {/* Main Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-7">
          {/* Column 1: Account Data */}
          <div className="bg-white rounded-xl sm:rounded-2xl border border-[#e5e7eb] shadow-[0_4px_6px_-1px_rgba(0,0,0,0.02),0_10px_15px_-3px_rgba(0,0,0,0.03)] overflow-hidden">
            <div className="px-4 sm:px-7 py-4 sm:py-6 border-b border-[#f3f4f6] flex justify-between items-center flex-wrap gap-2">
              <div className="flex items-center gap-3.5">
                <div className="w-9 h-9 bg-[#f9fafb] rounded-[10px] flex items-center justify-center text-[#6b7280]">
                  <Icon icon="lucide:database" className="text-lg" />
                </div>
                <h3 className="text-base font-bold text-[#111827] m-0">Dados da Conta</h3>
              </div>
              <span className="text-[11px] font-bold bg-[#f3f4f6] text-[#4b5563] px-3 py-1.5 rounded-lg">
                MetaTrader 4
              </span>
            </div>

            <div className="px-4 sm:px-7 py-4 sm:py-7 flex flex-col justify-between">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-[#6b7280] text-sm">Carregando dados da conta...</div>
                </div>
              ) : mt4Accounts.length > 0 ? (
                // Mostrar dados MT4
                <div className="flex flex-col gap-3 sm:gap-4 mb-6 sm:mb-8">
                  <div className="flex justify-between items-center text-xs sm:text-sm gap-2">
                    <div className="flex items-center gap-2.5">
                      <Icon icon="lucide:user" className="text-sm text-[#9ca3af]" />
                      <span className="text-[#6b7280] font-medium">Login MT4</span>
                    </div>
                    <span className="font-mono text-[#111827] font-semibold bg-[#f9fafb] px-1.5 py-0.5 rounded border border-[#f3f4f6] tracking-tight">
                      {mt4Accounts[0].account_number || mt4Accounts[0].accountNumber || 'N/A'}
                    </span>
                  </div>
                  <div className="h-px bg-[#f2f3f5] w-full" />
                  <div className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-2.5">
                      <Icon icon="lucide:hard-drive" className="text-sm text-[#9ca3af]" />
                      <span className="text-[#6b7280] font-medium">Servidor</span>
                    </div>
                    <span className="text-[#111827] font-semibold">{mt4Accounts[0].server || 'N/A'}</span>
                  </div>
                  <div className="h-px bg-[#f2f3f5] w-full" />
                  <div className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-2.5">
                      <Icon icon="lucide:building-2" className="text-sm text-[#9ca3af]" />
                      <span className="text-[#6b7280] font-medium">Corretora</span>
                    </div>
                    <span className="text-[#111827] font-semibold">{mt4Accounts[0].broker || 'N/A'}</span>
                  </div>
                  <div className="h-px bg-[#f2f3f5] w-full" />
                  <div className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-2.5">
                      <Icon icon="lucide:dollar-sign" className="text-sm text-[#9ca3af]" />
                      <span className="text-[#6b7280] font-medium">Moeda Base</span>
                    </div>
                    <span className="text-[#111827] font-semibold">
                      {myfxbookData?.currency || mt4Accounts[0].currency || 'USD'}
                    </span>
                  </div>
                  <div className="h-px bg-[#f2f3f5] w-full" />
                  <div className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-2.5">
                      <Icon icon="lucide:trending-up" className="text-sm text-[#9ca3af]" />
                      <span className="text-[#6b7280] font-medium">Equity</span>
                    </div>
                    <span className="text-[#111827] font-semibold">
                      {myfxbookData?.equity 
                        ? `$${parseFloat(myfxbookData.equity).toFixed(2)}` 
                        : mt4Accounts[0].equity 
                          ? `$${parseFloat(mt4Accounts[0].equity).toFixed(2)}` 
                          : 'N/A'}
                    </span>
                  </div>
                      <div className="h-px bg-[#f2f3f5] w-full" />
                      <div className="flex justify-between items-center text-sm">
                        <div className="flex items-center gap-2.5">
                      <Icon icon="lucide:dollar-sign" className="text-sm text-[#9ca3af]" />
                      <span className="text-[#6b7280] font-medium">Lucro</span>
                        </div>
                    <span className={`font-semibold ${
                      (myfxbookData?.profit || 0) >= 0 ? 'text-[#059669]' : 'text-[#dc2626]'
                    }`}>
                      {myfxbookData?.profit !== undefined
                        ? `${(myfxbookData.profit || 0) >= 0 ? '+' : ''}$${parseFloat(myfxbookData.profit).toFixed(2)}`
                        : 'N/A'}
                        </span>
                      </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 mb-6 sm:mb-8">
                  <div className="w-16 h-16 bg-[#f3f4f6] rounded-full flex items-center justify-center mb-4">
                    <Icon icon="lucide:database" className="text-2xl text-[#9ca3af]" />
                  </div>
                  <p className="text-[#6b7280] text-sm text-center mb-2">Nenhuma conta cadastrada</p>
                  <p className="text-[#9ca3af] text-xs text-center">Configure suas credenciais MT4</p>
                </div>
              )}

              <div className="flex flex-col gap-3">
                <button 
                  onClick={() => navigate('/mt4-config')}
                  className="w-full h-11 sm:h-12 border border-[#00afaa] bg-white rounded-xl text-[#007979] font-semibold text-xs sm:text-sm cursor-pointer flex items-center justify-center gap-2.5 hover:bg-[#f0fdfa] hover:shadow-[0_0_15px_rgba(0,175,175,0.15)] transition-all"
                >
                  <Icon icon="lucide:settings-2" className="text-base" />
                  Configurar Credenciais
                </button>
              </div>
            </div>
          </div>

          {/* Column 2: Operational Controls */}
          <div className="bg-white rounded-xl sm:rounded-2xl border border-[#e5e7eb] shadow-[0_4px_6px_-1px_rgba(0,0,0,0.02),0_10px_15px_-3px_rgba(0,0,0,0.03)] overflow-hidden">
            <div className="px-4 sm:px-7 py-4 sm:py-6 border-b border-[#f3f4f6] flex justify-between items-center">
              <div className="flex items-center gap-3.5">
                <div className="w-9 h-9 bg-[#f9fafb] rounded-[10px] flex items-center justify-center text-[#6b7280]">
                  <Icon icon="lucide:sliders" className="text-lg" />
                </div>
                <h3 className="text-base font-bold text-[#111827] m-0">Controles Operacionais</h3>
              </div>
            </div>

            <div className="px-4 sm:px-7 py-4 sm:py-7 flex flex-col">
              <div className="flex flex-col gap-0">
                {/* Automation Toggle */}
                <div className="flex justify-between items-center py-3 sm:py-4 gap-2">
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-semibold text-[#374151]">Trading Automatizado</span>
                    <span className="text-[13px] text-[#9ca3af]">Permitir novas ordens pelo Falcon FX.</span>
                  </div>
                  <div 
                    className={`w-12 h-7 rounded-full relative cursor-pointer transition-all duration-300 ${
                      automationEnabled ? 'bg-[#00ff88] shadow-[0_0_10px_rgba(0,255,136,0.4)]' : 'bg-[#e5e7eb]'
                    }`}
                    onClick={async () => {
                      const newValue = !automationEnabled
                      setAutomationEnabled(newValue)
                      
                      // Salvar no backend
                      if (mt4Accounts.length > 0) {
                        try {
                          await updateMT4Settings(mt4Accounts[0].id, {
                            automationEnabled: newValue
                          })
                        } catch (error) {
                          console.error('Erro ao salvar configuração:', error)
                          // Reverter em caso de erro
                          setAutomationEnabled(!newValue)
                        }
                      }
                    }}
                  >
                    <div className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow-[0_2px_4px_rgba(0,0,0,0.1)] transition-transform duration-300 ${
                      automationEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`} />
                  </div>
                </div>

                <div className="h-px bg-[#f3f4f6] w-full my-2" />

                {/* Risk Profile Selector */}
                <div className="flex flex-col gap-4 py-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-semibold text-[#374151]">Perfil de Risco</span>
                    <span className="text-[13px] text-[#9ca3af]">Define a agressividade das entradas.</span>
                  </div>
                  <div className="flex bg-[#f3f4f6] p-1 rounded-[10px] gap-1">
                    <button
                      className={`flex-1 text-center py-2 px-3 text-[13px] font-medium rounded-lg cursor-pointer transition-all ${
                        riskProfile === 'conservador' 
                          ? 'bg-white text-[#111827] font-semibold shadow-[0_2px_4px_rgba(0,0,0,0.05)]' 
                          : 'text-[#6b7280] hover:text-[#374151]'
                      }`}
                      onClick={async () => {
                        setRiskProfile('conservador')
                        if (mt4Accounts.length > 0) {
                          try {
                            await updateMT4Settings(mt4Accounts[0].id, {
                              riskProfile: 'conservador'
                            })
                          } catch (error) {
                            console.error('Erro ao salvar perfil de risco:', error)
                          }
                        }
                      }}
                    >
                      Conservador
                    </button>
                    <button
                      className={`flex-1 text-center py-2 px-3 text-[13px] font-medium rounded-lg cursor-pointer transition-all ${
                        riskProfile === 'moderado' 
                          ? 'bg-white text-[#111827] font-semibold shadow-[0_2px_4px_rgba(0,0,0,0.05)]' 
                          : 'text-[#6b7280] hover:text-[#374151]'
                      }`}
                      onClick={async () => {
                        setRiskProfile('moderado')
                        if (mt4Accounts.length > 0) {
                          try {
                            await updateMT4Settings(mt4Accounts[0].id, {
                              riskProfile: 'moderado'
                            })
                          } catch (error) {
                            console.error('Erro ao salvar perfil de risco:', error)
                          }
                        }
                      }}
                    >
                      Moderado
                    </button>
                    <button
                      className={`flex-1 text-center py-2 px-3 text-[13px] font-medium rounded-lg cursor-pointer transition-all ${
                        riskProfile === 'agressivo' 
                          ? 'bg-white text-[#111827] font-semibold shadow-[0_2px_4px_rgba(0,0,0,0.05)]' 
                          : 'text-[#6b7280] hover:text-[#374151]'
                      }`}
                      onClick={async () => {
                        setRiskProfile('agressivo')
                        if (mt4Accounts.length > 0) {
                          try {
                            await updateMT4Settings(mt4Accounts[0].id, {
                              riskProfile: 'agressivo'
                            })
                          } catch (error) {
                            console.error('Erro ao salvar perfil de risco:', error)
                          }
                        }
                      }}
                    >
                      Agressivo
                    </button>
                  </div>
                </div>

                <div className="h-px bg-[#f3f4f6] w-full my-2" />

                {/* Password Update */}
                <button
                  onClick={() => navigate('/mt4-config')}
                  className="w-full flex justify-between items-center py-4 cursor-pointer hover:bg-[#f9fafb] rounded-lg px-2 -mx-2 transition-colors"
                  data-media-type="banani-button"
                >
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-semibold text-[#374151]">Senha do MT4</span>
                    <span className="text-[13px] text-[#9ca3af]">Atualize caso tenha alterado na corretora.</span>
                  </div>
                  <div className="w-9 h-9 border border-[#e5e7eb] rounded-lg flex items-center justify-center text-[#6b7280] hover:bg-[#f9fafb] hover:text-[#374151] hover:border-[#d1d5db] transition-all">
                    <Icon icon="lucide:key" className="text-base" />
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>


        {/* Danger Zone */}
        {/* <div className="bg-[#fff0f0] rounded-xl sm:rounded-2xl border border-[#ffc9c9] p-4 sm:p-6 lg:p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-none">
          <div className="flex gap-3 sm:gap-5 items-start sm:items-center">
            <div className="w-10 h-10 sm:w-14 sm:h-14 bg-[#ffe4e4] text-[#dc2626] rounded-xl flex items-center justify-center flex-shrink-0">
              <Icon icon="lucide:alert-octagon" className="text-xl sm:text-2xl" />
            </div>
            <div>
              <div className="text-sm sm:text-base font-bold text-[#991b1b] mb-1">Zona de Perigo</div>
              <div className="text-xs sm:text-sm text-[#b91c1c] opacity-85 max-w-[500px]">
                Desconectar sua conta irá parar imediatamente o robô e cancelar a gestão da sua carteira.
              </div>
            </div>
          </div>
          <button className="w-full sm:w-auto bg-[#e53935] border-none text-white font-semibold text-xs sm:text-sm px-6 sm:px-8 h-11 sm:h-12 rounded-xl cursor-pointer transition-all shadow-[0_4px_12px_rgba(229,57,53,0.2)] hover:bg-[#c62828] hover:shadow-[0_6px_16px_rgba(198,40,40,0.3)]">
            Desconectar Conta
          </button>
        </div> */}
      </div>


      <style>{`
        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
            opacity: 0.8;
          }
          100% {
            transform: scale(3.5);
            opacity: 0;
          }
        }
      `}</style>
    </DashboardLayout>
  )
}

export default ContaForexMT4Page
