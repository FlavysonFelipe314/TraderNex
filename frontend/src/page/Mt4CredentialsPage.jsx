import { useState, useEffect } from 'react'
import { Icon } from '@iconify/react'
import DashboardLayout from '../components/DashboardLayout'
import { addMT4Account, getMT4Accounts } from '../services/dashboardService'
import { useNavigate } from 'react-router-dom'

function Mt4CredentialsPage() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    login: '',
    password: '',
    server: '',
    broker: ''
  })
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    document.body.classList.add('scroll-enabled')
    return () => {
      document.body.classList.remove('scroll-enabled')
    }
  }, [])

  // Carregar dados existentes da conta MT4
  useEffect(() => {
    const loadExistingAccount = async () => {
      setLoadingData(true)
      try {
        const result = await getMT4Accounts()
        if (result.success && result.data && result.data.length > 0) {
          const account = result.data[0] // Pegar a primeira conta
          setFormData({
            login: account.account_number || '',
            password: '', // Senha não é retornada por segurança
            server: account.server || '',
            broker: account.broker || ''
          })
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

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    try {
      const result = await addMT4Account(formData)
      if (result.success) {
        setSuccess(true)
        setTimeout(() => {
          navigate('/conta-forex-mt4')
        }, 2000)
      } else {
        setError(result.message || 'Erro ao conectar conta MT4.')
      }
    } catch (err) {
      setError('Erro de conexão. Tente novamente mais tarde.')
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

            {success && (
              <div className="mb-6 bg-green-50 text-green-600 px-4 py-3 rounded-lg text-sm font-medium flex items-center gap-2">
                <Icon icon="lucide:check-circle" className="text-lg" />
                Conectado com sucesso! Redirecionando...
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
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
                <label className="text-sm font-semibold text-[#374151]">Nome do Servidor</label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]">
                    <Icon icon="lucide:hard-drive" />
                  </div>
                  <input
                    type="text"
                    name="server"
                    value={formData.server}
                    onChange={handleChange}
                    placeholder="Ex: ICMarkets-Live18"
                    required
                    className="w-full h-11 pl-10 pr-4 bg-[#f9fafb] border border-[#e5e7eb] rounded-xl text-sm outline-none focus:border-[#00afaa] focus:ring-2 focus:ring-[#00afaa]/10 transition-all"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-[#374151]">Corretora (Broker)</label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]">
                    <Icon icon="lucide:building-2" />
                  </div>
                  <input
                    type="text"
                    name="broker"
                    value={formData.broker}
                    onChange={handleChange}
                    placeholder="Ex: IC Markets Global"
                    required
                    className="w-full h-11 pl-10 pr-4 bg-[#f9fafb] border border-[#e5e7eb] rounded-xl text-sm outline-none focus:border-[#00afaa] focus:ring-2 focus:ring-[#00afaa]/10 transition-all"
                  />
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
