import { useEffect, useState, useCallback } from 'react'
import { Icon } from '@iconify/react'
import DashboardLayout from '../components/DashboardLayout'
import { 
  getMT4Accounts, 
  addMT4Account,
  connectMyfxbook,
  disconnectMyfxbook,
  getMyfxbookStatus,
  getMyfxbookAccounts,
  getMyfxbookAccountData,
  getMyfxbookFullData,
  updateMT4Settings
} from '../services/dashboardService'

function ContaForexMT4Page() {
  const [automationEnabled, setAutomationEnabled] = useState(true)
  const [riskProfile, setRiskProfile] = useState('moderado')
  const [lastUpdated, setLastUpdated] = useState('2 min')
  const [mt4Accounts, setMt4Accounts] = useState([])
  const [loading, setLoading] = useState(true)
  const [myfxbookConnected, setMyfxbookConnected] = useState(false)
  const [myfxbookLoading, setMyfxbookLoading] = useState(false)
  const [showMyfxbookModal, setShowMyfxbookModal] = useState(false)
  const [myfxbookEmail, setMyfxbookEmail] = useState('')
  const [myfxbookPassword, setMyfxbookPassword] = useState('')
  const [myfxbookError, setMyfxbookError] = useState('')
  const [myfxbookAccounts, setMyfxbookAccounts] = useState([])
  const [selectedMyfxbookAccount, setSelectedMyfxbookAccount] = useState(null)
  const [myfxbookAccountData, setMyfxbookAccountData] = useState(null)
  const [loadingMyfxbookData, setLoadingMyfxbookData] = useState(false)

  useEffect(() => {
    document.body.classList.add('scroll-enabled')
    return () => {
      document.body.classList.remove('scroll-enabled')
    }
  }, [])

  // Carregar contas MT4
  useEffect(() => {
    const loadMT4Accounts = async () => {
      setLoading(true)
      try {
        const result = await getMT4Accounts()
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
      } catch (error) {
        console.error('Erro ao carregar contas MT4:', error)
      } finally {
        setLoading(false)
      }
    }

    loadMT4Accounts()
  }, [])

  // Carregar status Myfxbook
  useEffect(() => {
    const loadMyfxbookStatus = async () => {
      try {
        const result = await getMyfxbookStatus()
        console.log('Resultado getMyfxbookStatus:', result)
        if (result.success && result.data) {
          // Se há conexão salva (mesmo que sessão expirada), manter a informação
          const hasConnection = result.data.hasSession || result.data.email || result.data.hasSavedConnection
          const isConnected = result.data.connected || (result.data.hasSession && result.data.sessionValid)
          
          setMyfxbookConnected(isConnected)
          
          // Se há conexão salva mas sessão expirada, manter o email para facilitar reconexão
          if ((hasConnection || result.data.hasSavedConnection) && !isConnected) {
            console.log('Conexão Myfxbook encontrada no banco, mas sessão expirada. Precisa reconectar.')
            // Manter email salvo para facilitar reconexão
            if (result.data.email) {
              setMyfxbookEmail(result.data.email)
            }
          }
          
          // Se não está conectado E não tem conexão salva, limpar dados
          if (!isConnected && !hasConnection) {
            setMyfxbookAccounts([])
            setSelectedMyfxbookAccount(null)
            setMyfxbookAccountData(null)
          }
          
          // Se tem sessão mas não tem contas ainda, tentar buscar contas novamente após alguns segundos
          if (result.data.hasSession && (!result.data.accounts || result.data.accounts.length === 0) && isConnected) {
            console.log('Tem sessão mas sem contas, tentando buscar novamente em 3 segundos...')
            setTimeout(async () => {
              const retryResult = await getMyfxbookStatus()
              if (retryResult.success && retryResult.data) {
                const retryIsConnected = retryResult.data.connected || (retryResult.data.hasSession && retryResult.data.sessionValid)
                if (retryIsConnected && retryResult.data.accounts && retryResult.data.accounts.length > 0) {
                  setMyfxbookAccounts(retryResult.data.accounts)
                  setMyfxbookConnected(true)
                  if (!selectedMyfxbookAccount) {
                    const firstAccount = retryResult.data.accounts[0]
                    setSelectedMyfxbookAccount(firstAccount)
                    if (firstAccount.id || firstAccount.accountId) {
                      loadMyfxbookAccountData(firstAccount.id || firstAccount.accountId)
                    }
                  }
                }
              }
            }, 3000)
          }
          
          // Se tem contas disponíveis, carregar
          if (result.data.accounts && result.data.accounts.length > 0 && isConnected) {
            setMyfxbookAccounts(result.data.accounts)
            // Selecionar primeira conta e carregar dados
            if (!selectedMyfxbookAccount) {
              const firstAccount = result.data.accounts[0]
              setSelectedMyfxbookAccount(firstAccount)
              if (firstAccount.id || firstAccount.accountId) {
                loadMyfxbookAccountData(firstAccount.id || firstAccount.accountId)
              }
            }
          }
        }
      } catch (error) {
        console.error('Erro ao carregar status Myfxbook:', error)
        // Se der erro 404, significa que não há conexão - isso é normal
        if (error.response?.status === 404 || error.response?.status === 400) {
          // Não há conexão - garantir que estado está limpo
          setMyfxbookConnected(false)
          setMyfxbookAccounts([])
          setSelectedMyfxbookAccount(null)
          setMyfxbookAccountData(null)
        } else {
          console.error('Erro inesperado ao carregar status Myfxbook:', error)
        }
      }
    }

    loadMyfxbookStatus()
  }, [])

  // Função para carregar dados de uma conta Myfxbook
  const loadMyfxbookAccountData = useCallback(async (accountId) => {
    if (!accountId) return
    
    setLoadingMyfxbookData(true)
    try {
      const result = await getMyfxbookFullData(accountId)
      if (result.success) {
        setMyfxbookAccountData(result.data)
      }
    } catch (error) {
      console.error('Erro ao carregar dados da conta Myfxbook:', error)
    } finally {
      setLoadingMyfxbookData(false)
    }
  }, [])

  // Função para conectar Myfxbook
  const handleConnectMyfxbook = async (e) => {
    e?.preventDefault()
    setMyfxbookError('')
    setMyfxbookLoading(true)

    try {
      const result = await connectMyfxbook(myfxbookEmail, myfxbookPassword)
      if (result.success) {
        setMyfxbookConnected(true)
        const accounts = result.data?.accounts || []
        setMyfxbookAccounts(accounts)
        // Selecionar primeira conta automaticamente se houver
        if (accounts.length > 0) {
          setSelectedMyfxbookAccount(accounts[0])
          // Carregar dados da conta
          loadMyfxbookAccountData(accounts[0].id || accounts[0].accountId)
        }
        setShowMyfxbookModal(false)
        setMyfxbookEmail('')
        setMyfxbookPassword('')
        // Atualizar status
        const statusResult = await getMyfxbookStatus()
        if (statusResult.success && statusResult.data) {
          setMyfxbookConnected(statusResult.data.connected || false)
          if (statusResult.data.accounts && statusResult.data.accounts.length > 0) {
            setMyfxbookAccounts(statusResult.data.accounts)
            if (!selectedMyfxbookAccount) {
              setSelectedMyfxbookAccount(statusResult.data.accounts[0])
              loadMyfxbookAccountData(statusResult.data.accounts[0].id || statusResult.data.accounts[0].accountId)
            }
          }
        }
      } else {
        setMyfxbookError(result.message || 'Erro ao conectar conta Myfxbook')
      }
    } catch (error) {
      setMyfxbookError('Erro ao conectar conta Myfxbook. Verifique suas credenciais.')
    } finally {
      setMyfxbookLoading(false)
    }
  }

  // Função para desconectar Myfxbook
  const handleDisconnectMyfxbook = async (e) => {
    e?.preventDefault()
    
    const deleteCredentials = window.confirm(
      'Como deseja desconectar?\n\n' +
      'OK = Desconectar sessão (reconexão automática no próximo login)\n' +
      'Cancelar = Desconectar completamente (remover credenciais salvas)'
    )
    
    if (deleteCredentials === null) {
      return // Usuário cancelou
    }

    const finalConfirm = window.confirm(
      deleteCredentials 
        ? 'Tem certeza? Isso removerá suas credenciais salvas e você precisará reconectar manualmente.'
        : 'Tem certeza que deseja desconectar a sessão? A conexão será restaurada automaticamente quando você fizer login novamente.'
    )

    if (!finalConfirm) {
      return
    }

    setMyfxbookLoading(true)
    try {
      // Passar deleteCredentials como false para manter credenciais (reconexão automática)
      // ou true para remover completamente
      const result = await disconnectMyfxbook(deleteCredentials)
      console.log('Resultado desconectar:', result)
      if (result.success) {
        setMyfxbookConnected(false)
        setMyfxbookAccounts([])
        setSelectedMyfxbookAccount(null)
        setMyfxbookAccountData(null)
        
        if (deleteCredentials) {
          // Se deletou credenciais, limpar email também
          setMyfxbookEmail('')
        }
        
        // Recarregar status para garantir que está sincronizado
        const statusResult = await getMyfxbookStatus()
        if (statusResult.success && statusResult.data) {
          setMyfxbookConnected(statusResult.data.connected || false)
        }
      } else {
        alert('Erro ao desconectar: ' + (result.message || 'Erro desconhecido'))
      }
    } catch (error) {
      console.error('Erro ao desconectar Myfxbook:', error)
      alert('Erro ao desconectar conta Myfxbook. Tente novamente.')
    } finally {
      setMyfxbookLoading(false)
    }
  }

  const pulseStyle = {
    animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
  }

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
          {/* Status Card */}
          <div className="bg-white rounded-xl sm:rounded-2xl border border-[#e5e7eb] shadow-[0_4px_6px_-1px_rgba(0,0,0,0.02),0_10px_15px_-3px_rgba(0,0,0,0.03)] h-auto sm:h-[110px] flex items-center px-4 sm:px-7 py-4 sm:py-0 gap-4 sm:gap-5 hover:-translate-y-0.5 transition-transform">
            <div className="relative w-3.5 h-3.5 flex items-center justify-center">
              <div 
                className={`absolute w-2.5 h-2.5 rounded-full opacity-50 ${
                  myfxbookConnected ? 'bg-[#00c853]' : 'bg-[#9ca3af]'
                }`}
                style={myfxbookConnected ? pulseStyle : {}}
              />
              <div className={`relative w-2.5 h-2.5 rounded-full z-10 ${
                myfxbookConnected ? 'bg-[#00c853]' : 'bg-[#9ca3af]'
              }`} />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-[#9ca3af] uppercase tracking-wider">Status da Conexão</span>
              <div className="flex flex-col gap-0.5">
                <span className={`text-base font-bold ${
                  myfxbookConnected ? 'text-[#059669]' : 'text-[#6b7280]'
                }`}>
                  {myfxbookConnected ? 'Conectado' : 'Desconectado'}
                </span>
                {!myfxbookConnected && myfxbookEmail && (
                  <span className="text-[10px] text-[#9ca3af]">
                    Conexão salva • Clique para reconectar
                  </span>
                )}
              </div>
              {!myfxbookConnected && myfxbookEmail && (
                <span className="text-[10px] text-[#9ca3af] mt-0.5">
                  Conexão salva • Clique para reconectar
                </span>
              )}
            </div>
          </div>

          {/* Myfxbook Stats Card - Substitui o Broker Card */}
          {myfxbookConnected && selectedMyfxbookAccount ? (
            <div className="bg-white rounded-xl sm:rounded-2xl border border-[#e5e7eb] shadow-[0_4px_6px_-1px_rgba(0,0,0,0.02),0_10px_15px_-3px_rgba(0,0,0,0.03)] h-auto sm:h-[110px] flex items-center px-4 sm:px-7 py-4 sm:py-0 gap-4 sm:gap-5 hover:-translate-y-0.5 transition-transform">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#3b82f6] rounded-xl flex items-center justify-center text-white">
                <Icon icon="lucide:bar-chart-3" className="text-lg sm:text-xl" />
              </div>
              <div className="flex flex-col gap-1 flex-1 min-w-0">
                <span className="text-[10px] sm:text-xs font-semibold text-[#9ca3af] uppercase tracking-wider">Ganho Total</span>
                <span className={`text-sm sm:text-base font-bold truncate ${
                  (selectedMyfxbookAccount.gain || 0) >= 0 ? 'text-[#059669]' : 'text-[#dc2626]'
                }`}>
                  {selectedMyfxbookAccount.gain ? `${parseFloat(selectedMyfxbookAccount.gain).toFixed(2)}%` : 'N/A'}
                </span>
                <div className="flex gap-3 mt-1">
                  <span className={`text-[10px] font-medium ${
                    (selectedMyfxbookAccount.profit || 0) >= 0 ? 'text-[#059669]' : 'text-[#dc2626]'
                  }`}>
                    {selectedMyfxbookAccount.profit ? `Lucro: $${parseFloat(selectedMyfxbookAccount.profit).toFixed(2)}` : ''}
                  </span>
                  <span className="text-[10px] font-medium text-[#dc2626]">
                    {selectedMyfxbookAccount.drawdown ? `DD: ${parseFloat(selectedMyfxbookAccount.drawdown).toFixed(2)}%` : ''}
                  </span>
                </div>
                <span className="text-[10px] font-semibold text-[#111827] mt-0.5">
                  {selectedMyfxbookAccount.equity ? `Equity: $${parseFloat(selectedMyfxbookAccount.equity).toFixed(2)}` : ''}
                </span>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl sm:rounded-2xl border border-[#e5e7eb] shadow-[0_4px_6px_-1px_rgba(0,0,0,0.02),0_10px_15px_-3px_rgba(0,0,0,0.03)] h-auto sm:h-[110px] flex items-center px-4 sm:px-7 py-4 sm:py-0 gap-4 sm:gap-5 hover:-translate-y-0.5 transition-transform">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#f9fafb] rounded-xl flex items-center justify-center text-[#4b5563]">
                <Icon icon="lucide:server" className="text-lg sm:text-xl" />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] sm:text-xs font-semibold text-[#9ca3af] uppercase tracking-wider">Broker Conectado</span>
                <span className="text-sm sm:text-base font-bold text-[#111827]">{mt4Accounts.length > 0 ? mt4Accounts[0].broker || 'N/A' : 'N/A'}</span>
              </div>
            </div>
          )}

          {/* Falcon AI Card */}
          <div className="bg-[#0e0e10] rounded-xl sm:rounded-2xl border border-[#1f2937] shadow-[0_8px_30px_rgba(0,255,136,0.05)] h-auto sm:h-[110px] flex items-center justify-between px-4 sm:px-7 py-4 sm:py-0 hover:-translate-y-0.5 transition-transform sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-3 sm:gap-5">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[rgba(255,255,255,0.08)] rounded-xl flex items-center justify-center text-[#00ff88] border border-[rgba(0,255,136,0.2)] shadow-[0_0_15px_rgba(0,255,136,0.15)]">
                <Icon icon="lucide:zap" className="text-lg sm:text-[22px]" />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] sm:text-xs font-semibold text-[rgba(255,255,255,0.5)] uppercase tracking-wider">Inteligência Ativa</span>
                <span className="text-sm sm:text-[17px] font-bold text-white">Falcon AI Operando</span>
              </div>
            </div>
            <div className="bg-[rgba(0,255,136,0.1)] text-[#00ff88] text-[11px] font-bold px-3 py-1.5 rounded-full border border-[rgba(0,255,136,0.2)]">
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
                {myfxbookConnected && selectedMyfxbookAccount ? 'Myfxbook' : 'MetaTrader 4'}
              </span>
            </div>

            <div className="px-4 sm:px-7 py-4 sm:py-7 flex flex-col justify-between">
              {loading || loadingMyfxbookData ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-[#6b7280] text-sm">Carregando dados da conta...</div>
                </div>
              ) : myfxbookConnected && selectedMyfxbookAccount ? (
                // Mostrar dados do Myfxbook quando conectado
                <div className="flex flex-col gap-3 sm:gap-4 mb-6 sm:mb-8">
                  {/* Ganho Total */}
                  <div className="flex justify-between items-center text-xs sm:text-sm gap-2">
                    <div className="flex items-center gap-2.5">
                      <Icon icon="lucide:trending-up" className="text-sm text-[#9ca3af]" />
                      <span className="text-[#6b7280] font-medium">Ganho Total</span>
                    </div>
                    <span className={`font-semibold ${
                      (selectedMyfxbookAccount.gain || 0) >= 0 ? 'text-[#059669]' : 'text-[#dc2626]'
                    }`}>
                      {selectedMyfxbookAccount.gain ? `${parseFloat(selectedMyfxbookAccount.gain).toFixed(2)}%` : 'N/A'}
                    </span>
                  </div>
                  <div className="h-px bg-[#f2f3f5] w-full" />
                  {/* Lucro */}
                  <div className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-2.5">
                      <Icon icon="lucide:dollar-sign" className="text-sm text-[#9ca3af]" />
                      <span className="text-[#6b7280] font-medium">Lucro</span>
                    </div>
                    <span className={`font-semibold ${
                      (selectedMyfxbookAccount.profit || 0) >= 0 ? 'text-[#059669]' : 'text-[#dc2626]'
                    }`}>
                      {selectedMyfxbookAccount.profit ? `$${parseFloat(selectedMyfxbookAccount.profit).toFixed(2)}` : 'N/A'}
                    </span>
                  </div>
                  <div className="h-px bg-[#f2f3f5] w-full" />
                  {/* Drawdown */}
                  <div className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-2.5">
                      <Icon icon="lucide:trending-down" className="text-sm text-[#9ca3af]" />
                      <span className="text-[#6b7280] font-medium">Drawdown</span>
                    </div>
                    <span className="text-[#dc2626] font-semibold">
                      {selectedMyfxbookAccount.drawdown ? `${parseFloat(selectedMyfxbookAccount.drawdown).toFixed(2)}%` : 'N/A'}
                    </span>
                  </div>
                  <div className="h-px bg-[#f2f3f5] w-full" />
                  {/* Equity */}
                  <div className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-2.5">
                      <Icon icon="lucide:wallet" className="text-sm text-[#9ca3af]" />
                      <span className="text-[#6b7280] font-medium">Equity</span>
                    </div>
                    <span className="text-[#111827] font-semibold">
                      {selectedMyfxbookAccount.equity ? `$${parseFloat(selectedMyfxbookAccount.equity).toFixed(2)}` : 'N/A'}
                    </span>
                  </div>
                  {/* Dados adicionais se disponíveis */}
                  {selectedMyfxbookAccount.balance && (
                    <>
                      <div className="h-px bg-[#f2f3f5] w-full" />
                      <div className="flex justify-between items-center text-sm">
                        <div className="flex items-center gap-2.5">
                          <Icon icon="lucide:bar-chart-2" className="text-sm text-[#9ca3af]" />
                          <span className="text-[#6b7280] font-medium">Saldo</span>
                        </div>
                        <span className="text-[#111827] font-semibold">
                          ${parseFloat(selectedMyfxbookAccount.balance).toFixed(2)}
                        </span>
                      </div>
                    </>
                  )}
                  {selectedMyfxbookAccount.currency && (
                    <>
                      <div className="h-px bg-[#f2f3f5] w-full" />
                      <div className="flex justify-between items-center text-sm">
                        <div className="flex items-center gap-2.5">
                          <Icon icon="lucide:coins" className="text-sm text-[#9ca3af]" />
                          <span className="text-[#6b7280] font-medium">Moeda</span>
                        </div>
                        <span className="text-[#111827] font-semibold">{selectedMyfxbookAccount.currency}</span>
                      </div>
                    </>
                  )}
                  {selectedMyfxbookAccount.leverage && (
                    <>
                      <div className="h-px bg-[#f2f3f5] w-full" />
                      <div className="flex justify-between items-center text-sm">
                        <div className="flex items-center gap-2.5">
                          <Icon icon="lucide:activity" className="text-sm text-[#9ca3af]" />
                          <span className="text-[#6b7280] font-medium">Alavancagem</span>
                        </div>
                        <span className="text-[#111827] font-semibold">{selectedMyfxbookAccount.leverage}</span>
                      </div>
                    </>
                  )}
                  {selectedMyfxbookAccount.name && (
                    <>
                      <div className="h-px bg-[#f2f3f5] w-full" />
                      <div className="flex justify-between items-center text-sm">
                        <div className="flex items-center gap-2.5">
                          <Icon icon="lucide:tag" className="text-sm text-[#9ca3af]" />
                          <span className="text-[#6b7280] font-medium">Conta</span>
                        </div>
                        <span className="text-[#111827] font-semibold">{selectedMyfxbookAccount.name}</span>
                      </div>
                    </>
                  )}
                  {selectedMyfxbookAccount.accountId && (
                    <>
                      <div className="h-px bg-[#f2f3f5] w-full" />
                      <div className="flex justify-between items-center text-xs sm:text-sm gap-2">
                        <div className="flex items-center gap-2.5">
                          <Icon icon="lucide:hash" className="text-sm text-[#9ca3af]" />
                          <span className="text-[#6b7280] font-medium">ID da Conta</span>
                        </div>
                        <span className="font-mono text-[#111827] font-semibold bg-[#f9fafb] px-1.5 py-0.5 rounded border border-[#f3f4f6] tracking-tight">
                          {selectedMyfxbookAccount.accountId}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              ) : mt4Accounts.length > 0 ? (
                // Mostrar dados MT4 quando não houver Myfxbook conectado
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
                    <span className="text-[#111827] font-semibold">{mt4Accounts[0].currency || 'USD'}</span>
                  </div>
                  <div className="h-px bg-[#f2f3f5] w-full" />
                  <div className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-2.5">
                      <Icon icon="lucide:bar-chart-2" className="text-sm text-[#9ca3af]" />
                      <span className="text-[#6b7280] font-medium">Saldo</span>
                    </div>
                    <span className="text-[#111827] font-semibold">
                      {mt4Accounts[0].balance ? `$${parseFloat(mt4Accounts[0].balance).toFixed(2)}` : 'N/A'}
                    </span>
                  </div>
                  {mt4Accounts[0].equity && (
                    <>
                      <div className="h-px bg-[#f2f3f5] w-full" />
                      <div className="flex justify-between items-center text-sm">
                        <div className="flex items-center gap-2.5">
                          <Icon icon="lucide:trending-up" className="text-sm text-[#9ca3af]" />
                          <span className="text-[#6b7280] font-medium">Equity</span>
                        </div>
                        <span className="text-[#111827] font-semibold">
                          ${parseFloat(mt4Accounts[0].equity).toFixed(2)}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 mb-6 sm:mb-8">
                  <div className="w-16 h-16 bg-[#f3f4f6] rounded-full flex items-center justify-center mb-4">
                    <Icon icon="lucide:database" className="text-2xl text-[#9ca3af]" />
                  </div>
                  <p className="text-[#6b7280] text-sm text-center mb-2">Nenhuma conta cadastrada</p>
                  <p className="text-[#9ca3af] text-xs text-center">Configure suas credenciais ou conecte o Myfxbook</p>
                </div>
              )}

              <div className="flex flex-col gap-3">
                <button 
                  onClick={() => window.location.href = '/mt4-config'}
                  className="w-full h-11 sm:h-12 border border-[#00afaa] bg-white rounded-xl text-[#007979] font-semibold text-xs sm:text-sm cursor-pointer flex items-center justify-center gap-2.5 hover:bg-[#f0fdfa] hover:shadow-[0_0_15px_rgba(0,175,175,0.15)] transition-all"
                >
                  <Icon icon="lucide:settings-2" className="text-base" />
                  Configurar Credenciais
                </button>
                 
                <button 
                  onClick={() => {
                    if (myfxbookConnected) {
                      handleDisconnectMyfxbook()
                    } else {
                      // Se já tem email salvo, usar no modal (será preenchido automaticamente)
                      setShowMyfxbookModal(true)
                    }
                  }}
                  className={`w-full h-11 sm:h-12 border rounded-xl font-semibold text-xs sm:text-sm cursor-pointer flex items-center justify-center gap-2.5 transition-all ${
                    myfxbookConnected
                      ? 'border-[#dc2626] bg-white text-[#dc2626] hover:bg-[#fef2f2]'
                      : myfxbookEmail
                        ? 'border-[#f59e0b] bg-[#fffbeb] text-[#d97706] hover:bg-[#fef3c7]'
                        : 'border-[#3b82f6] bg-white text-[#3b82f6] hover:bg-[#eff6ff] hover:shadow-[0_0_15px_rgba(59,130,246,0.15)]'
                  }`}
                  disabled={myfxbookLoading}
                  title={myfxbookEmail && !myfxbookConnected ? 'Reconectar com email salvo' : ''}
                >
                  <Icon icon={myfxbookConnected ? "lucide:unlink" : myfxbookEmail ? "lucide:refresh-cw" : "lucide:link"} className="text-base" />
                  {myfxbookLoading 
                    ? (myfxbookConnected ? 'Desconectando...' : 'Conectando...')
                    : myfxbookConnected 
                      ? 'Desconectar Myfxbook'
                      : myfxbookEmail
                        ? 'Reconectar Myfxbook'
                        : 'Conectar Myfxbook'
                  }
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
                <div className="flex justify-between items-center py-4 cursor-pointer hover:bg-[#f9fafb] rounded-lg px-2 -mx-2 transition-colors">
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-semibold text-[#374151]">Senha do MT4</span>
                    <span className="text-[13px] text-[#9ca3af]">Atualize caso tenha alterado na corretora.</span>
                  </div>
                  <div className="w-9 h-9 border border-[#e5e7eb] rounded-lg flex items-center justify-center text-[#6b7280] hover:bg-[#f9fafb] hover:text-[#374151] hover:border-[#d1d5db] transition-all">
                    <Icon icon="lucide:key" className="text-base" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Seção de Dados Myfxbook - Só aparece se conectado */}
        {myfxbookConnected && myfxbookAccounts.length > 0 && (
          <div className="bg-white rounded-xl sm:rounded-2xl border border-[#e5e7eb] shadow-[0_4px_6px_-1px_rgba(0,0,0,0.02),0_10px_15px_-3px_rgba(0,0,0,0.03)] overflow-hidden">
            <div className="px-4 sm:px-7 py-4 sm:py-6 border-b border-[#f3f4f6] flex justify-between items-center flex-wrap gap-2">
              <div className="flex items-center gap-3.5">
                <div className="w-9 h-9 bg-[#3b82f6] rounded-[10px] flex items-center justify-center text-white">
                  <Icon icon="lucide:bar-chart-3" className="text-lg" />
                </div>
                <h3 className="text-base font-bold text-[#111827] m-0">Dados Myfxbook</h3>
              </div>
              {myfxbookAccounts.length > 1 && (
                <select
                  value={selectedMyfxbookAccount?.id || selectedMyfxbookAccount?.accountId || ''}
                  onChange={(e) => {
                    const account = myfxbookAccounts.find(acc => 
                      (acc.id || acc.accountId) === e.target.value
                    )
                    if (account) {
                      setSelectedMyfxbookAccount(account)
                      loadMyfxbookAccountData(account.id || account.accountId)
                    }
                  }}
                  className="text-xs font-medium bg-[#f3f4f6] text-[#4b5563] px-3 py-1.5 rounded-lg border border-[#e5e7eb] cursor-pointer"
                >
                  {myfxbookAccounts.map((acc) => (
                    <option key={acc.id || acc.accountId} value={acc.id || acc.accountId}>
                      {acc.name || acc.accountName || `Conta ${acc.accountId || acc.id}`}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="px-4 sm:px-7 py-4 sm:py-7">
              {loadingMyfxbookData ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-[#6b7280] text-sm">Carregando dados do Myfxbook...</div>
                </div>
              ) : selectedMyfxbookAccount ? (
                <div className="space-y-6">
                  {/* Métricas Principais */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                    <div className="bg-[#f9fafb] rounded-lg p-3 sm:p-4 border border-[#f3f4f6]">
                      <div className="text-xs text-[#6b7280] font-medium mb-1">Ganho Total</div>
                      <div className={`text-base sm:text-lg font-bold ${
                        (selectedMyfxbookAccount.gain || 0) >= 0 ? 'text-[#059669]' : 'text-[#dc2626]'
                      }`}>
                        {selectedMyfxbookAccount.gain ? `${parseFloat(selectedMyfxbookAccount.gain).toFixed(2)}%` : 'N/A'}
                      </div>
                    </div>
                    <div className="bg-[#f9fafb] rounded-lg p-3 sm:p-4 border border-[#f3f4f6]">
                      <div className="text-xs text-[#6b7280] font-medium mb-1">Lucro</div>
                      <div className={`text-base sm:text-lg font-bold ${
                        (selectedMyfxbookAccount.profit || 0) >= 0 ? 'text-[#059669]' : 'text-[#dc2626]'
                      }`}>
                        {selectedMyfxbookAccount.profit ? `$${parseFloat(selectedMyfxbookAccount.profit).toFixed(2)}` : 'N/A'}
                      </div>
                    </div>
                    <div className="bg-[#f9fafb] rounded-lg p-3 sm:p-4 border border-[#f3f4f6]">
                      <div className="text-xs text-[#6b7280] font-medium mb-1">Drawdown</div>
                      <div className="text-base sm:text-lg font-bold text-[#dc2626]">
                        {selectedMyfxbookAccount.drawdown ? `${parseFloat(selectedMyfxbookAccount.drawdown).toFixed(2)}%` : 'N/A'}
                      </div>
                    </div>
                    <div className="bg-[#f9fafb] rounded-lg p-3 sm:p-4 border border-[#f3f4f6]">
                      <div className="text-xs text-[#6b7280] font-medium mb-1">Equity</div>
                      <div className="text-base sm:text-lg font-bold text-[#111827]">
                        {selectedMyfxbookAccount.equity ? `$${parseFloat(selectedMyfxbookAccount.equity).toFixed(2)}` : 'N/A'}
                      </div>
                    </div>
                  </div>

                  {/* Trades Abertos */}
                  {myfxbookAccountData?.openTrades && myfxbookAccountData.openTrades.length > 0 && (
                    <div>
                      <h4 className="text-sm font-bold text-[#111827] mb-3 flex items-center gap-2">
                        <Icon icon="lucide:trending-up" className="text-base" />
                        Trades Abertos ({myfxbookAccountData.openTrades.length})
                      </h4>
                      <div className="bg-[#f9fafb] rounded-lg border border-[#f3f4f6] overflow-hidden">
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs sm:text-sm">
                            <thead className="bg-[#f3f4f6]">
                              <tr>
                                <th className="px-3 py-2 text-left text-[#6b7280] font-semibold">Par</th>
                                <th className="px-3 py-2 text-left text-[#6b7280] font-semibold">Tipo</th>
                                <th className="px-3 py-2 text-right text-[#6b7280] font-semibold">Lots</th>
                                <th className="px-3 py-2 text-right text-[#6b7280] font-semibold">Preço Abertura</th>
                                <th className="px-3 py-2 text-right text-[#6b7280] font-semibold">Preço Atual</th>
                                <th className="px-3 py-2 text-right text-[#6b7280] font-semibold">Pips</th>
                                <th className="px-3 py-2 text-right text-[#6b7280] font-semibold">Lucro</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[#f3f4f6]">
                              {myfxbookAccountData.openTrades.slice(0, 10).map((trade, idx) => (
                                <tr key={idx} className="hover:bg-white">
                                  <td className="px-3 py-2 font-medium text-[#111827]">{trade.symbol || 'N/A'}</td>
                                  <td className="px-3 py-2">
                                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                      trade.side === 'buy' 
                                        ? 'bg-[#d1fae5] text-[#065f46]' 
                                        : 'bg-[#fee2e2] text-[#991b1b]'
                                    }`}>
                                      {trade.side === 'buy' ? 'Compra' : 'Venda'}
                                    </span>
                                  </td>
                                  <td className="px-3 py-2 text-right text-[#111827]">{trade.lots || '0'}</td>
                                  <td className="px-3 py-2 text-right text-[#111827]">{trade.openPrice ? parseFloat(trade.openPrice).toFixed(5) : 'N/A'}</td>
                                  <td className="px-3 py-2 text-right text-[#111827]">{trade.currentPrice ? parseFloat(trade.currentPrice).toFixed(5) : 'N/A'}</td>
                                  <td className={`px-3 py-2 text-right font-medium ${
                                    (trade.pips || 0) >= 0 ? 'text-[#059669]' : 'text-[#dc2626]'
                                  }`}>
                                    {trade.pips ? `${parseFloat(trade.pips).toFixed(1)}` : '0'}
                                  </td>
                                  <td className={`px-3 py-2 text-right font-bold ${
                                    (trade.profit || 0) >= 0 ? 'text-[#059669]' : 'text-[#dc2626]'
                                  }`}>
                                    {trade.profit ? `$${parseFloat(trade.profit).toFixed(2)}` : '$0.00'}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Histórico Recente */}
                  {myfxbookAccountData?.history && myfxbookAccountData.history.length > 0 && (
                    <div>
                      <h4 className="text-sm font-bold text-[#111827] mb-3 flex items-center gap-2">
                        <Icon icon="lucide:history" className="text-base" />
                        Histórico Recente (últimas {Math.min(myfxbookAccountData.history.length, 10)} transações)
                      </h4>
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
                              {myfxbookAccountData.history.slice(0, 10).map((trade, idx) => (
                                <tr key={idx} className="hover:bg-white">
                                  <td className="px-3 py-2 text-[#6b7280]">{trade.closeTime || trade.openTime || 'N/A'}</td>
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
                                    {trade.profit ? `$${parseFloat(trade.profit).toFixed(2)}` : '$0.00'}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Mensagem se não houver dados */}
                  {(!myfxbookAccountData || (!myfxbookAccountData.openTrades?.length && !myfxbookAccountData.history?.length)) && (
                    <div className="text-center py-8 text-[#6b7280] text-sm">
                      <Icon icon="lucide:info" className="text-2xl mx-auto mb-2 text-[#9ca3af]" />
                      <p>Nenhum dado disponível ainda. Os dados serão atualizados em breve.</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-[#6b7280] text-sm">
                  <p>Selecione uma conta para ver os dados</p>
                </div>
              )}
            </div>
          </div>
        )}

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

      {/* Modal Myfxbook */}
      {showMyfxbookModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 sm:p-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-[#111827]">Conectar Myfxbook</h3>
              <button
                onClick={() => {
                  setShowMyfxbookModal(false)
                  setMyfxbookError('')
                  setMyfxbookEmail('')
                  setMyfxbookPassword('')
                }}
                className="text-[#6b7280] hover:text-[#111827] transition-colors"
              >
                <Icon icon="lucide:x" className="text-xl" />
              </button>
            </div>

            <form onSubmit={handleConnectMyfxbook} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-[#374151] mb-2">
                  Email Myfxbook
                </label>
                <input
                  type="email"
                  value={myfxbookEmail}
                  onChange={(e) => setMyfxbookEmail(e.target.value)}
                  className="w-full px-4 py-2.5 border border-[#e5e7eb] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3b82f6] focus:border-transparent"
                  placeholder="seu@email.com"
                  required
                  disabled={myfxbookLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#374151] mb-2">
                  Senha Myfxbook
                </label>
                <input
                  type="password"
                  value={myfxbookPassword}
                  onChange={(e) => setMyfxbookPassword(e.target.value)}
                  className="w-full px-4 py-2.5 border border-[#e5e7eb] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3b82f6] focus:border-transparent"
                  placeholder="••••••••"
                  required
                  disabled={myfxbookLoading}
                />
              </div>

              {myfxbookError && (
                <div className="bg-[#fef2f2] border border-[#fecaca] text-[#dc2626] px-4 py-3 rounded-lg text-sm">
                  {myfxbookError}
                </div>
              )}

              <div className="flex gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowMyfxbookModal(false)
                    setMyfxbookError('')
                    setMyfxbookEmail('')
                    setMyfxbookPassword('')
                  }}
                  className="flex-1 px-4 py-2.5 border border-[#e5e7eb] rounded-lg text-[#6b7280] font-medium hover:bg-[#f9fafb] transition-colors"
                  disabled={myfxbookLoading}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-[#3b82f6] text-white rounded-lg font-medium hover:bg-[#2563eb] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={myfxbookLoading}
                >
                  {myfxbookLoading ? 'Conectando...' : 'Conectar'}
                </button>
              </div>
            </form>

            {myfxbookConnected && (
              <div className="mt-4 pt-4 border-t border-[#e5e7eb]">
                <div className="bg-[#fef2f2] border border-[#fecaca] rounded-lg p-4 mb-4">
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 bg-[#dc2626] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Icon icon="lucide:alert-circle" className="text-white text-xs" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-bold text-[#991b1b] mb-1">Zona de Perigo</h4>
                      <p className="text-xs text-[#991b1b]">
                        Desconectar sua conta irá parar imediatamente o robô e cancelar a gestão da sua carteira.
                      </p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleDisconnectMyfxbook}
                  className="w-full px-4 py-2.5 bg-[#dc2626] text-white rounded-lg font-semibold hover:bg-[#b91c1c] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  disabled={myfxbookLoading}
                >
                  {myfxbookLoading ? (
                    <>
                      <Icon icon="lucide:loader-2" className="animate-spin text-base" />
                      Desconectando...
                    </>
                  ) : (
                    <>
                      <Icon icon="lucide:unlink" className="text-base" />
                      Desconectar Conta
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

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
