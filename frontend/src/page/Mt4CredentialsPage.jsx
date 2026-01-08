import { useState, useEffect } from 'react'
import { Icon } from '@iconify/react'
import DashboardLayout from '../components/DashboardLayout'
import { addMT4Account, getMT4Accounts } from '../services/dashboardService'
import { useNavigate } from 'react-router-dom'

// Configuração de corretoras e seus servidores
const BROKERS_CONFIG = {
  'Roboforex': [
    'RoboForex-Demo',
    'RoboForex-DemoPro',
    'RoboForex-ECN',
    'RoboForex-ECN-2',
    'RoboForex-ECN-3',
    'RoboForex-Prime',
    'RoboForex-Pro',
    'RoboForex-Pro-2',
    'RoboForex-Pro-3',
    'RoboForex-Pro-4',
    'RoboForex-Pro-5',
    'RoboForex-Pro-6',
    'RoboForex-ProCent',
    'RoboForex-ProCent-2',
    'RoboForex-ProCent-3',
    'RoboForex-ProCent-4',
    'RoboForex-ProCent-5',
    'RoboForex-ProCent-6',
    'RoboForex-ProCent-7',
    'RoboForex-ProCent-8'
  ],
  'Vantage Markets': [
    // VantageInternational
    'VantageInternational-Demo',
    'VantageInternational-Demo 2',
    'VantageInternational-Live 1',
    'VantageInternational-Live 2',
    'VantageInternational-Live 3',
    'VantageInternational-Live 4',
    'VantageInternational-Live 5',
    'VantageInternational-Live 6',
    'VantageInternational-Live 7',
    'VantageInternational-Live 8',
    'VantageInternational-Live 9',
    'VantageInternational-Live 10',
    'VantageInternational-Live 11',
    'VantageInternational-Live 12',
    'VantageInternational-Live 14',
    'VantageInternational-Live 16',
    'VantageInternational-Live 18',
    'VantageInternational-Live 20',
    'VantageInternational-Live 22',
    // VantageFX
    'VantageFX-Demo',
    'VantageFx-Demo 2',
    'VantageFX-Live',
    'VantageFX-Live 1',
    'VantageFX-Live 3',
    'VantageFX-Live 4',
    'VantageFX-Live 5',
    // VantageFXInternational
    'VantageFXInternational-Demo',
    'VantageFXInternational-Live 1',
    'VantageFXInternational-Live 2',
    'VantageFXInternational-Live 3',
    'VantageFXInternational-Live 4',
    'VantageFXInternational-Live 5',
    'VantageFXInternational-Live 6',
    'VantageFXInternational-Live 7',
    // VantageFX-UK
    'VantageFX-UK-Demo',
    'VantageFX-UK-Real',
    'VantageFX-UK-Live UK',
    // VantageAU
    'VantageAU-Demo',
    'VantageAU-Live',
    'VantageAU-Live 1',
    'VantageAU-Live 2',
    // VantagePrime
    'VantagePrime-Demo',
    'VantagePrime-Live',
    // VantagePrimeLimited
    'VantagePrimeLimited-Demo',
    'VantagePrimeLimited-Live 1',
    'VantagePrimeLimited-Live 2',
    // VantageGlobalPrime
    'VantageGlobalPrime-Demo',
    'VantageGlobalPrimeLLP-Live'
  ]
}

const AVAILABLE_BROKERS = Object.keys(BROKERS_CONFIG)

function Mt4CredentialsPage() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    platform: 'MT4',
    login: '',
    password: '',
    server: '',
    broker: ''
  })
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [availableServers, setAvailableServers] = useState([])
  const [riskProfile, setRiskProfile] = useState('moderado')
  const [showSetupMessage, setShowSetupMessage] = useState(false)

  useEffect(() => {
    document.body.classList.add('scroll-enabled')
    return () => {
      document.body.classList.remove('scroll-enabled')
    }
  }, [])

  // Atualizar servidores disponíveis quando a corretora mudar
  useEffect(() => {
    if (formData.broker && BROKERS_CONFIG[formData.broker]) {
      const servers = BROKERS_CONFIG[formData.broker]
      setAvailableServers(servers)
      // Se o servidor atual não está na lista da corretora selecionada, limpar
      if (formData.server && !servers.includes(formData.server)) {
        setFormData(prev => ({ ...prev, server: '' }))
      }
    } else {
      setAvailableServers([])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.broker])

  // Carregar dados existentes da conta MT4
  useEffect(() => {
    const loadExistingAccount = async () => {
      setLoadingData(true)
      try {
        const result = await getMT4Accounts()
        if (result.success && result.data && result.data.length > 0) {
          const account = result.data[0] // Pegar a primeira conta
          const broker = account.broker || ''
          const server = account.server || ''
          
          setFormData({
            platform: 'MT4',
            login: account.account_number || '',
            password: '', // Senha não é retornada por segurança
            server: server,
            broker: broker
          })
          
          // Atualizar servidores disponíveis se a corretora estiver configurada
          if (broker && BROKERS_CONFIG[broker]) {
            setAvailableServers(BROKERS_CONFIG[broker])
          }
          
          // Carregar perfil de risco se existir
          if (account.risk_profile) {
            setRiskProfile(account.risk_profile)
          }
        }
      } catch (error) {
        console.error('Erro ao carregar conta MT4 existente:', error)
      } finally {
        setLoadingData(false)
      }
    }

    loadExistingAccount()
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleBrokerChange = (e) => {
    const broker = e.target.value
    setFormData(prev => ({
      ...prev,
      broker: broker,
      server: '' // Limpar servidor ao trocar corretora
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess(false)
    
    // Validação dos campos obrigatórios
    if (!formData.login || !formData.broker || !formData.server || !formData.password) {
      setError('Por favor, preencha todos os campos obrigatórios.')
      setLoading(false)
      return
    }
    
    try {
      const result = await addMT4Account({
        ...formData,
        risk_profile: riskProfile
      })
      if (result.success) {
        setSuccess(true)
        setError('')
        setShowSetupMessage(true)
        // Limpar cache do onboarding para forçar atualização do menu
        try {
          const userData = localStorage.getItem('user')
          if (userData) {
            const user = JSON.parse(userData)
            if (user.id || user.userId) {
              const userId = user.id || user.userId
              localStorage.removeItem(`onboarding_status_${userId}`)
              // Disparar evento customizado para o Sidebar recarregar
              window.dispatchEvent(new CustomEvent('mt4-account-updated'))
            }
          }
        } catch (e) {
          console.warn('Erro ao limpar cache do onboarding:', e)
        }
        // Não redirecionar automaticamente, mostrar mensagem
      } else {
        setError(result.message || 'Erro ao conectar conta MT4.')
        setSuccess(false)
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Erro de conexão. Tente novamente mais tarde.'
      setError(errorMessage)
      setSuccess(false)
      console.error('Erro ao adicionar conta MT4:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <DashboardLayout 
      title="Configurar Credenciais MT4"
      subtitle="Conecte sua conta MetaTrader 4 para iniciar o robô"
    >
      <div className="max-w-[600px] w-full mx-auto">
        <div className="bg-white rounded-xl sm:rounded-2xl border border-[#e5e7eb] shadow-[0_4px_6px_-1px_rgba(0,0,0,0.02),0_10px_15px_-3px_rgba(0,0,0,0.03)] overflow-hidden">
          <div className="p-6 sm:p-8">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-[#f0fdfa] rounded-xl flex items-center justify-center text-[#00afaa]">
                <Icon icon="lucide:settings-2" className="text-2xl" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#111827]">Conectar Conta Existente</h3>
                <p className="text-sm text-[#6b7280]">Insira os dados da sua corretora</p>
              </div>
            </div>

            {error && (
              <div className="mb-6 bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm font-medium flex items-center gap-2">
                <Icon icon="lucide:alert-circle" className="text-lg" />
                {error}
              </div>
            )}

            {success && !showSetupMessage && (
              <div className="mb-6 bg-green-50 text-green-600 px-4 py-3 rounded-lg text-sm font-medium flex items-center gap-2">
                <Icon icon="lucide:check-circle" className="text-lg" />
                Credenciais salvas com sucesso!
              </div>
            )}

            {showSetupMessage && (
              <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Icon icon="lucide:info" className="text-blue-600 text-xl mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-blue-900 mb-1">
                      Configuração em andamento
                    </h4>
                    <p className="text-sm text-blue-700 mb-3">
                      Suas credenciais foram salvas com sucesso! O sistema irá configurar o setup e ativar o Falcon FX para operar em até <strong>30 minutos</strong>.
                    </p>
                    <p className="text-xs text-blue-600">
                      Quando o administrador ativar sua conta, você verá o status "Conectado" e o Falcon FX estará ativo. Até lá, a conta aparecerá como "Desconectada" e o Falcon FX como "Inativo".
                    </p>
                    <button
                      onClick={() => {
                        setShowSetupMessage(false)
                        navigate('/conta-forex-mt4')
                      }}
                      className="mt-4 w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                    >
                      Entendi, ir para Conta Forex
                    </button>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-[#374151]">Plataforma</label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af] z-10">
                    <Icon icon="lucide:monitor" />
                  </div>
                  <select
                    name="platform"
                    value={formData.platform}
                    onChange={handleChange}
                    required
                    className="w-full h-11 pl-10 pr-4 bg-[#f9fafb] border border-[#e5e7eb] rounded-xl text-sm outline-none focus:border-[#00afaa] focus:ring-2 focus:ring-[#00afaa]/10 transition-all appearance-none cursor-pointer"
                  >
                    <option value="MT4">MT4</option>
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9ca3af] pointer-events-none">
                    <Icon icon="lucide:chevron-down" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-[#374151]">Login (Número da Conta)</label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]">
                      <Icon icon="lucide:user" />
                    </div>
                    <input
                      type="text"
                      name="login"
                      value={formData.login}
                      onChange={handleChange}
                      placeholder="Ex: 82139402"
                      required
                      className="w-full h-11 pl-10 pr-4 bg-[#f9fafb] border border-[#e5e7eb] rounded-xl text-sm outline-none focus:border-[#00afaa] focus:ring-2 focus:ring-[#00afaa]/10 transition-all font-mono"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-[#374151]">Senha Principal</label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]">
                      <Icon icon="lucide:lock" />
                    </div>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="••••••••"
                      required
                      className="w-full h-11 pl-10 pr-4 bg-[#f9fafb] border border-[#e5e7eb] rounded-xl text-sm outline-none focus:border-[#00afaa] focus:ring-2 focus:ring-[#00afaa]/10 transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-[#374151]">Corretora (Broker)</label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af] z-10">
                    <Icon icon="lucide:building-2" />
                  </div>
                  <select
                    name="broker"
                    value={formData.broker}
                    onChange={handleBrokerChange}
                    required
                    className="w-full h-11 pl-10 pr-4 bg-[#f9fafb] border border-[#e5e7eb] rounded-xl text-sm outline-none focus:border-[#00afaa] focus:ring-2 focus:ring-[#00afaa]/10 transition-all appearance-none cursor-pointer"
                  >
                    <option value="">Selecione uma corretora</option>
                    {AVAILABLE_BROKERS.map(broker => (
                      <option key={broker} value={broker}>{broker}</option>
                    ))}
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9ca3af] pointer-events-none">
                    <Icon icon="lucide:chevron-down" />
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-[#374151]">Nome do Servidor</label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af] z-10">
                    <Icon icon="lucide:hard-drive" />
                  </div>
                  <select
                    name="server"
                    value={formData.server}
                    onChange={handleChange}
                    required
                    disabled={!formData.broker || availableServers.length === 0}
                    className="w-full h-11 pl-10 pr-4 bg-[#f9fafb] border border-[#e5e7eb] rounded-xl text-sm outline-none focus:border-[#00afaa] focus:ring-2 focus:ring-[#00afaa]/10 transition-all appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">
                      {!formData.broker 
                        ? 'Selecione primeiro uma corretora' 
                        : availableServers.length === 0 
                          ? 'Carregando servidores...' 
                          : 'Selecione um servidor'}
                    </option>
                    {availableServers.map(server => (
                      <option key={server} value={server}>{server}</option>
                    ))}
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9ca3af] pointer-events-none">
                    <Icon icon="lucide:chevron-down" />
                  </div>
                </div>
              </div>

              {/* Perfil de Risco */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-[#374151]">Perfil de Risco</label>
                <span className="text-xs text-[#6b7280] mb-1">Define a agressividade das entradas do Falcon FX</span>
                <div className="flex bg-[#f3f4f6] p-1 rounded-xl gap-1">
                  <button
                    type="button"
                    onClick={() => setRiskProfile('conservador')}
                    className={`flex-1 text-center py-2.5 px-3 text-sm font-medium rounded-lg cursor-pointer transition-all ${
                      riskProfile === 'conservador' 
                        ? 'bg-white text-[#111827] font-semibold shadow-[0_2px_4px_rgba(0,0,0,0.05)]' 
                        : 'text-[#6b7280] hover:text-[#374151]'
                    }`}
                  >
                    Conservador
                  </button>
                  <button
                    type="button"
                    onClick={() => setRiskProfile('moderado')}
                    className={`flex-1 text-center py-2.5 px-3 text-sm font-medium rounded-lg cursor-pointer transition-all ${
                      riskProfile === 'moderado' 
                        ? 'bg-white text-[#111827] font-semibold shadow-[0_2px_4px_rgba(0,0,0,0.05)]' 
                        : 'text-[#6b7280] hover:text-[#374151]'
                    }`}
                  >
                    Moderado
                  </button>
                  <button
                    type="button"
                    onClick={() => setRiskProfile('agressivo')}
                    className={`flex-1 text-center py-2.5 px-3 text-sm font-medium rounded-lg cursor-pointer transition-all ${
                      riskProfile === 'agressivo' 
                        ? 'bg-white text-[#111827] font-semibold shadow-[0_2px_4px_rgba(0,0,0,0.05)]' 
                        : 'text-[#6b7280] hover:text-[#374151]'
                    }`}
                  >
                    Agressivo
                  </button>
                </div>
              </div>

              <div className="mt-4 flex gap-4">
                <button
                  type="button"
                  onClick={() => navigate('/conta-forex-mt4')}
                  className="flex-1 h-12 bg-white border border-[#e5e7eb] rounded-xl text-[#374151] font-semibold text-sm hover:bg-[#f9fafb] hover:border-[#d1d5db] transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 h-12 bg-[#00afaa] text-white rounded-xl font-semibold text-sm hover:bg-[#009a96] hover:shadow-lg hover:shadow-[#00afaa]/20 transition-all disabled:opacity-70 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Icon icon="lucide:loader-2" className="animate-spin text-lg" />
                      Conectando...
                    </>
                  ) : (
                    <>
                      <Icon icon="lucide:check-circle-2" className="text-lg" />
                      Conectar Conta
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default Mt4CredentialsPage
