import { Icon } from '@iconify/react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'

function RegisterPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { register } = useAuth()
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    whatsapp: '',
    password: '',
    confirmPassword: '',
    referralCode: '',
  })
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Buscar código de indicação da URL
  useEffect(() => {
    const refCode = searchParams.get('ref')
    if (refCode) {
      setFormData(prev => ({
        ...prev,
        referralCode: refCode.toUpperCase()
      }))
    }
  }, [searchParams])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    setError('') // Limpar erro ao digitar
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    
    // Validações client-side
    if (formData.password !== formData.confirmPassword) {
      setError('As senhas não coincidem')
      return
    }

    if (formData.password.length < 8) {
      setError('A senha deve ter no mínimo 8 caracteres')
      return
    }

    if (!termsAccepted) {
      setError('Você deve aceitar os termos de uso')
      return
    }

    // Separar nome completo em firstName e lastName
    const nameParts = formData.fullName.trim().split(' ')
    const firstName = nameParts[0] || ''
    const lastName = nameParts.slice(1).join(' ') || ''

    if (!firstName) {
      setError('Nome é obrigatório')
      return
    }

    setLoading(true)

    try {
      const result = await register(
        formData.email,
        formData.password,
        firstName,
        lastName,
        formData.whatsapp,
        'BR', // País padrão, pode ser ajustado
        formData.referralCode || null // Código de indicação
      )
      
      if (result.success) {
        // Registro bem-sucedido, redirecionar para página de conta criada
        navigate('/account-created')
      } else {
        // Mostrar erro
        setError(result.message || 'Erro ao registrar. Tente novamente.')
      }
    } catch (err) {
      setError('Erro inesperado. Tente novamente.')
      console.error('Erro no registro:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleLoginClick = () => {
    navigate('/login')
  }

  return (
    <div className="flex w-full h-full min-h-screen lg:min-h-0">
      {/* Left Visual Side */}
      <div className="hidden lg:flex flex-1 bg-[#0e0e10] relative flex-col justify-between p-16 overflow-hidden text-white">
        {/* Background Pattern */}
        <div 
          className="absolute inset-0 z-0 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle at 15% 50%, rgba(0, 255, 136, 0.05) 0%, transparent 25%), radial-gradient(circle at 85% 30%, rgba(0, 175, 170, 0.08) 0%, transparent 25%)`
          }}
        />
        
        {/* Grid Overlay */}
        <div 
          className="absolute inset-0 z-[1]"
          style={{
            backgroundSize: '60px 60px',
            backgroundImage: `linear-gradient(to right, rgba(255, 255, 255, 0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(255, 255, 255, 0.03) 1px, transparent 1px)`
          }}
        />

        <div className="relative z-10 max-w-[520px] pt-10">
          <div className="flex items-center gap-3 mb-[60px]">
            <img 
              src="/logo.png"
              alt="TraderNex"
              className="h-10 w-auto"
            />
          </div>

          <h1 className="text-5xl font-bold leading-[1.1] mb-6 tracking-[-0.02em] text-white">
            Gestão profissional de Forex e Cripto com IA.
          </h1>
          <p className="text-lg text-[#9ca3af] leading-relaxed mb-12">
            Junte-se a mais de 250 investidores e deixe nossa IA potencializar
            seu capital com precisão e transparência.
          </p>

          <div className="flex flex-col gap-[18px]">
            <div className="flex items-center gap-[14px] text-[#e5e7eb] text-base font-medium">
              <div className="text-primary flex items-center justify-center drop-shadow-[0_0_4px_rgba(0,255,136,0.4)]">
                <div className="w-5 h-5 flex items-center justify-center">
                  <Icon
                    icon="lucide:check-circle-2"
                    className="text-xl"
                  />
                </div>
              </div>
              Setup automatizado em 2 minutos
            </div>
            <div className="flex items-center gap-[14px] text-[#e5e7eb] text-base font-medium">
              <div className="text-primary flex items-center justify-center drop-shadow-[0_0_4px_rgba(0,255,136,0.4)]">
                <div className="w-5 h-5 flex items-center justify-center">
                  <Icon
                    icon="lucide:check-circle-2"
                    className="text-xl"
                  />
                </div>
              </div>
              Sem custódia — capital sempre na sua conta
            </div>
            <div className="flex items-center gap-[14px] text-[#e5e7eb] text-base font-medium">
              <div className="text-primary flex items-center justify-center drop-shadow-[0_0_4px_rgba(0,255,136,0.4)]">
                <div className="w-5 h-5 flex items-center justify-center">
                  <Icon
                    icon="lucide:check-circle-2"
                    className="text-xl"
                  />
                </div>
              </div>
              Acompanhamento em tempo real via Dashboard
            </div>
          </div>
        </div>

        {/* Floating Card */}
        <div 
          className="absolute bottom-20 -right-5 bg-[rgba(20,21,25,0.9)] backdrop-blur-[16px] border border-[rgba(255,255,255,0.08)] rounded-[20px] p-6 w-80 shadow-[0_24px_48px_rgba(0,0,0,0.5)] z-[5] -rotate-[3deg]"
          style={{
            animation: 'float 6s ease-in-out infinite'
          }}
        >
          <style>{`
            @keyframes float {
              0%, 100% {
                transform: translateY(0) rotate(-3deg);
              }
              50% {
                transform: translateY(-10px) rotate(-3deg);
              }
            }
          `}</style>
          <div className="flex items-center gap-3 mb-4">
            <div 
              className="w-[42px] h-[42px] rounded-full border-2 border-[#2c2d31] bg-cover bg-center"
              style={{
                backgroundImage: 'url(https://app.banani.co/avatar1.jpeg)'
              }}
            />
            <div className="flex flex-col">
              <h4 className="m-0 text-[15px] text-white font-semibold">João Silva</h4>
              <p className="mt-0.5 text-[13px] text-[#9ca3af]">Cliente Nex Pro</p>
            </div>
          </div>
          <div className="flex justify-between items-center mt-3 pt-3 border-t border-[rgba(255,255,255,0.1)]">
            <span className="text-[13px] text-[#9ca3af]">Lucro acumulado</span>
            <div className="text-[13px] font-semibold text-primary bg-[rgba(0,255,136,0.1)] px-2 py-1 rounded-md flex items-center gap-1">
              <div className="w-[14px] h-[14px] flex items-center justify-center">
                <Icon
                  icon="lucide:trending-up"
                  className="text-sm"
                />
              </div>
              +12.4%
            </div>
          </div>
          <div className="text-xl font-bold text-white">$ 2,450.80</div>
        </div>
      </div>

      {/* Right Form Side */}
      <div className="w-full lg:w-[600px] bg-white flex flex-col justify-center p-6 sm:p-8 md:p-12 lg:p-16 overflow-y-auto relative min-h-screen lg:min-h-0 lg:h-full">
        <div className="max-w-[440px] mx-auto w-full py-4 lg:py-0">
          <div className="text-xs sm:text-sm text-[#6b7280] mb-2 block text-center lg:text-left">
            Já tem uma conta?
            <span 
              className="text-secondary font-semibold cursor-pointer ml-1" 
              onClick={handleLoginClick}
              data-media-type="banani-button"
            >
              Fazer login
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl lg:text-[32px] font-bold text-[#111827] m-0 mb-6 sm:mb-8 tracking-[-0.02em] text-center lg:text-left">
            Crie sua conta
          </h2>

          <form onSubmit={handleSubmit}>
            {error && (
              <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}
            <div className="mb-5">
              <label className="block text-sm font-medium text-[#111827] mb-2">Nome completo</label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                className="w-full h-[52px] px-4 border border-[#e5e7eb] rounded-[12px] text-[15px] text-[#111827] transition-all outline-none bg-[#fafafa] hover:bg-white hover:border-[#d1d5db] focus:bg-white focus:border-[#0e0e10] focus:shadow-[0_0_0_1px_#0e0e10] md:h-[48px] md:text-base disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="Ex: Carlos Mendes"
                required
                disabled={loading}
              />
            </div>

            <div className="mb-5">
              <label className="block text-sm font-medium text-[#111827] mb-2">E-mail profissional</label>
              <div className="relative">
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full h-[48px] sm:h-[52px] px-4 border border-[#e5e7eb] rounded-[12px] text-sm sm:text-[15px] text-[#111827] transition-all outline-none bg-[#fafafa] hover:bg-white hover:border-[#d1d5db] focus:bg-white focus:border-[#0e0e10] focus:shadow-[0_0_0_1px_#0e0e10] disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="seu@email.com"
                  required
                  disabled={loading}
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9ca3af] pointer-events-none">
                  <div className="w-[18px] h-[18px] flex items-center justify-center">
                    <Icon
                      icon="lucide:mail"
                      className="text-lg"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-5">
              <label className="block text-sm font-medium text-[#111827] mb-2">WhatsApp</label>
              <div className="relative">
                <input
                  type="text"
                  name="whatsapp"
                  value={formData.whatsapp}
                  onChange={handleInputChange}
                  className="w-full h-[48px] sm:h-[52px] px-4 border border-[#e5e7eb] rounded-[12px] text-sm sm:text-[15px] text-[#111827] transition-all outline-none bg-[#fafafa] hover:bg-white hover:border-[#d1d5db] focus:bg-white focus:border-[#0e0e10] focus:shadow-[0_0_0_1px_#0e0e10] disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="+55 (XX) XXXXX-XXXX"
                  required
                  disabled={loading}
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9ca3af] pointer-events-none">
                  <div className="w-[18px] h-[18px] flex items-center justify-center">
                    <Icon
                      icon="lucide:phone"
                      className="text-lg"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 mb-5">
              <div>
                <label className="block text-sm font-medium text-[#111827] mb-2">Senha</label>
                <div className="relative">
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="w-full h-[48px] sm:h-[52px] px-4 border border-[#e5e7eb] rounded-[12px] text-sm sm:text-[15px] text-[#111827] transition-all outline-none bg-[#fafafa] hover:bg-white hover:border-[#d1d5db] focus:bg-white focus:border-[#0e0e10] focus:shadow-[0_0_0_1px_#0e0e10] disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="Mín. 8 caracteres"
                    required
                    minLength={8}
                    disabled={loading}
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9ca3af] pointer-events-none">
                    <div className="w-[18px] h-[18px] flex items-center justify-center">
                      <Icon
                        icon="lucide:lock"
                        className="text-lg"
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#111827] mb-2">Confirmar senha</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="w-full h-[48px] sm:h-[52px] px-4 border border-[#e5e7eb] rounded-[12px] text-sm sm:text-[15px] text-[#111827] transition-all outline-none bg-[#fafafa] hover:bg-white hover:border-[#d1d5db] focus:bg-white focus:border-[#0e0e10] focus:shadow-[0_0_0_1px_#0e0e10] disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="Repita a senha"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="mb-2">
              <label className="block text-[13px] text-[#6b7280] mb-2">Código de indicação (opcional)</label>
              <input
                type="text"
                name="referralCode"
                value={formData.referralCode}
                onChange={handleInputChange}
                className="w-full h-11 px-4 border border-[#e5e7eb] rounded-[12px] text-sm text-[#111827] transition-all outline-none bg-[#fafafa] hover:bg-white hover:border-[#d1d5db] focus:bg-white focus:border-[#0e0e10] focus:shadow-[0_0_0_1px_#0e0e10] disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="Ex: JOA23"
                disabled={loading}
              />
            </div>

            <div className="flex items-start gap-3 my-6 mb-8">
              <div
                className={`w-5 h-5 border border-[#d1d5db] rounded-md flex items-center justify-center cursor-pointer flex-shrink-0 mt-0.5 transition-all ${
                  termsAccepted ? 'bg-[#0e0e10] border-[#0e0e10]' : 'bg-white'
                }`}
                onClick={() => setTermsAccepted(!termsAccepted)}
                data-media-type="banani-button"
              >
                <Icon
                  icon="lucide:check"
                  className={`text-sm ${termsAccepted ? 'text-white' : 'text-transparent'}`}
                />
              </div>
              <span className="text-[13px] text-[#6b7280] leading-normal">
                Concordo com os
                <span className="text-[#0e0e10] cursor-pointer hover:underline"> Termos de Uso</span> e
                <span className="text-[#0e0e10] cursor-pointer hover:underline"> Política de Privacidade</span> da
                TraderNex.
              </span>
            </div>

            <button
              type="submit"
              className="w-full h-[48px] sm:h-[54px] bg-[#0e0e10] text-white border-none rounded-[12px] text-sm sm:text-base font-semibold cursor-pointer transition-all flex items-center justify-center gap-3 mb-6 hover:bg-black hover:text-primary hover:-translate-y-[1px] hover:shadow-[0_4px_12px_rgba(0,0,0,0.15)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#0e0e10] disabled:hover:text-white disabled:hover:translate-y-0"
              data-media-type="banani-button"
              disabled={!termsAccepted || loading}
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Criando conta...
                </>
              ) : (
                <>
                  Criar minha conta
                  <div className="w-[18px] h-[18px] flex items-center justify-center">
                    <Icon
                      icon="lucide:arrow-right"
                      className="text-lg"
                    />
                  </div>
                </>
              )}
            </button>
          </form>

          <div className="flex items-center justify-center gap-2 text-xs text-[#9ca3af]">
            <div className="w-[14px] h-[14px] flex items-center justify-center">
              <Icon
                icon="lucide:shield-check"
                className="text-sm"
              />
            </div>
            Seus dados são protegidos com criptografia AES-256 e TLS 1.3.
          </div>
        </div>
      </div>
    </div>
  )
}

export default RegisterPage
