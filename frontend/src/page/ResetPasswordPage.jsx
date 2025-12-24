import { Icon } from '@iconify/react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'

function ResetPasswordPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { resetPassword } = useAuth()
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  // Obter token da URL
  const token = searchParams.get('token')

  useEffect(() => {
    if (!token) {
      setError('Token de redefinição não encontrado. Por favor, solicite um novo link.')
    }
  }, [token])

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
    setError('')
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

    if (!token) {
      setError('Token inválido. Por favor, solicite um novo link de recuperação.')
      return
    }

    setLoading(true)

    try {
      const result = await resetPassword(token, formData.password)
      
      if (result.success) {
        setSuccess(true)
        // Redirecionar para login após 3 segundos
        setTimeout(() => {
          navigate('/login')
        }, 3000)
      } else {
        setError(result.message || 'Erro ao redefinir senha. Tente novamente.')
      }
    } catch (err) {
      setError('Erro inesperado. Tente novamente.')
      console.error('Erro ao redefinir senha:', err)
    } finally {
      setLoading(false)
    }
  }

  const floatKeyframes = `
    @keyframes float {
      0%, 100% {
        transform: translateY(0) rotate(-3deg);
      }
      50% {
        transform: translateY(-10px) rotate(-3deg);
      }
    }
  `

  if (success) {
    return (
      <div className="flex w-full h-full items-center justify-center bg-white p-4 sm:p-8">
        <div className="max-w-[440px] w-full text-center">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
            <Icon icon="lucide:check-circle" className="text-3xl sm:text-4xl text-green-600" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#111827] mb-3">Senha redefinida com sucesso!</h2>
          <p className="text-sm sm:text-base text-[#6b7280] mb-6">Você será redirecionado para a página de login em instantes...</p>
          <button
            onClick={() => navigate('/login')}
            className="w-full h-[48px] sm:h-[52px] bg-[#0e0e10] text-white border-none rounded-[12px] text-sm sm:text-base font-semibold cursor-pointer transition-all hover:bg-black hover:text-primary"
          >
            Ir para Login
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: floatKeyframes }} />
      <div className="flex w-full h-full">
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
              Redefina sua senha
            </h1>
            <p className="text-lg text-[#9ca3af] leading-relaxed mb-12">
              Crie uma nova senha segura para acessar sua conta TraderNex.
            </p>
          </div>
        </div>

        {/* Right Form Side */}
        <div className="w-full lg:w-[600px] bg-white flex flex-col justify-center p-6 sm:p-8 md:p-12 lg:p-16 overflow-y-auto relative">
          <div className="max-w-[400px] mx-auto w-full">
            <a 
              href="#"
              onClick={(e) => {
                e.preventDefault()
                navigate('/login')
              }}
              className="text-xs sm:text-sm text-[#6b7280] mb-4 sm:mb-6 inline-flex items-center gap-1.5 font-medium hover:text-[#0e0e10] transition-colors"
              data-media-type="banani-button"
            >
              <Icon icon="lucide:arrow-left" className="text-base" />
              Voltar para o login
            </a>

            <h2 className="text-2xl sm:text-3xl lg:text-[32px] font-bold text-[#111827] m-0 mb-3 tracking-[-0.02em]">
              Redefinir senha
            </h2>
            <p className="text-sm sm:text-[15px] text-[#6b7280] leading-relaxed mb-6 sm:mb-8">
              Digite sua nova senha abaixo. Certifique-se de que ela tenha no mínimo 8 caracteres.
            </p>

            <form onSubmit={handleSubmit}>
              {error && (
                <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <div className="mb-6">
                <label className="block text-sm font-medium text-[#111827] mb-2">
                  Nova senha
                </label>
                <div className="relative">
                  <input 
                    type="password" 
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    minLength={8}
                    className="w-full h-[48px] sm:h-[52px] px-4 border border-[#e5e7eb] rounded-[12px] text-sm sm:text-[15px] text-[#111827] transition-all outline-none bg-[#fafafa] hover:bg-white hover:border-[#d1d5db] focus:bg-white focus:border-[#0e0e10] focus:shadow-[0_0_0_1px_#0e0e10] disabled:opacity-50 disabled:cursor-not-allowed" 
                    placeholder="Mín. 8 caracteres" 
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

              <div className="mb-6">
                <label className="block text-sm font-medium text-[#111827] mb-2">
                  Confirmar senha
                </label>
                <div className="relative">
                  <input 
                    type="password" 
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    required
                    minLength={8}
                    className="w-full h-[48px] sm:h-[52px] px-4 border border-[#e5e7eb] rounded-[12px] text-sm sm:text-[15px] text-[#111827] transition-all outline-none bg-[#fafafa] hover:bg-white hover:border-[#d1d5db] focus:bg-white focus:border-[#0e0e10] focus:shadow-[0_0_0_1px_#0e0e10] disabled:opacity-50 disabled:cursor-not-allowed" 
                    placeholder="Repita a senha" 
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

              <button 
                type="submit"
                disabled={loading || !token}
                className="w-full h-[48px] sm:h-[54px] bg-[#0e0e10] text-white border-none rounded-[12px] text-sm sm:text-base font-semibold cursor-pointer transition-all flex items-center justify-center gap-3 mb-6 hover:bg-black hover:text-primary hover:-translate-y-[1px] hover:shadow-[0_4px_12px_rgba(0,0,0,0.15)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#0e0e10] disabled:hover:text-white disabled:hover:translate-y-0" 
                data-media-type="banani-button"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Redefinindo...
                  </>
                ) : (
                  <>
                    Redefinir senha
                    <div className="w-[18px] h-[18px] flex items-center justify-center">
                      <Icon
                        icon="lucide:key"
                        className="text-lg"
                      />
                    </div>
                  </>
                )}
              </button>
            </form>

            <div className="flex items-center justify-center gap-2 mt-8 text-xs text-[#9ca3af]">
              <div className="w-[14px] h-[14px] flex items-center justify-center">
                <Icon
                  icon="lucide:shield-check"
                  className="text-sm"
                />
              </div>
              Ambiente seguro com criptografia AES-256.
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default ResetPasswordPage
