import { Icon } from '@iconify/react'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { usePWAInstall } from '../hooks/usePWAInstall'

function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall()
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showInstructions, setShowInstructions] = useState(false)
  const [instructionType, setInstructionType] = useState('ios')

  const handleRegisterClick = () => {
    navigate('/register')
  }

  const handleInstallClick = async () => {
    const result = await install()
    
    if (result.message === 'ios-instructions' || result.message === 'safari-instructions' || result.message === 'chrome-instructions') {
      const typeMap = {
        'ios-instructions': 'ios',
        'safari-instructions': 'safari',
        'chrome-instructions': 'chrome'
      }
      setInstructionType(typeMap[result.message] || 'ios')
      setShowInstructions(true)
    } else if (result.success) {
      // Instalação bem-sucedida - pode mostrar uma mensagem de sucesso
      console.log('App instalado com sucesso!')
    }
  }

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
    setError('') // Limpar erro ao digitar
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await login(formData.email, formData.password)
      
      if (result.success) {
        // Login bem-sucedido, redirecionar baseado no tipo de usuário
        if (result.user?.is_admin || result.user?.isAdmin) {
          navigate('/admin')
        } else {
          navigate('/dashboard')
        }
      } else {
        // Mostrar erro
        setError(result.message || 'Erro ao fazer login. Tente novamente.')
      }
    } catch (err) {
      setError('Erro inesperado. Tente novamente.')
      console.error('Erro no login:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
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
      <div className="w-full lg:w-[600px] bg-white flex flex-col justify-center p-6 sm:p-8 md:p-12 lg:p-16 overflow-y-auto relative">
        <div className="max-w-[400px] mx-auto w-full">
          <div className="text-xs sm:text-sm text-[#6b7280] mb-2 block text-center lg:text-left">
            Novo por aqui?
            <span 
              className="text-secondary font-semibold cursor-pointer ml-1 hover:underline" 
              onClick={handleRegisterClick}
              data-media-type="banani-button"
            >
              Criar conta
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl lg:text-[32px] font-bold text-[#111827] m-0 mb-6 sm:mb-8 tracking-[-0.02em] text-center lg:text-left">
            Acesse sua conta
          </h2>

          <form onSubmit={handleSubmit}>
            {error && (
              <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <div className="mb-6">
              <label className="block text-sm font-medium text-[#111827] mb-2">E-mail</label>
              <div className="relative">
                <input 
                  type="email" 
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="w-full h-[48px] sm:h-[52px] px-4 border border-[#e5e7eb] rounded-[12px] text-sm sm:text-[15px] text-[#111827] transition-all outline-none bg-[#fafafa] hover:bg-white hover:border-[#d1d5db] focus:bg-white focus:border-[#0e0e10] focus:shadow-[0_0_0_1px_#0e0e10]" 
                  placeholder="seu@email.com" 
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

            <div className="mb-6">
              <label className="block text-sm font-medium text-[#111827] mb-2">Senha</label>
              <div className="relative">
                <input 
                  type="password" 
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  className="w-full h-[48px] sm:h-[52px] px-4 border border-[#e5e7eb] rounded-[12px] text-sm sm:text-[15px] text-[#111827] transition-all outline-none bg-[#fafafa] hover:bg-white hover:border-[#d1d5db] focus:bg-white focus:border-[#0e0e10] focus:shadow-[0_0_0_1px_#0e0e10]" 
                  placeholder="Sua senha" 
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

            <div className="flex justify-end -mt-3 mb-8">
              <span 
                onClick={() => navigate('/forgot-password')}
                className="text-[13px] text-[#6b7280] font-medium cursor-pointer transition-all hover:text-[#0e0e10] hover:underline" 
                data-media-type="banani-button"
              >
                Esqueci minha senha
              </span>
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full h-[48px] sm:h-[54px] bg-[#0e0e10] text-white border-none rounded-[12px] text-sm sm:text-base font-semibold cursor-pointer transition-all flex items-center justify-center gap-3 mb-6 hover:bg-black hover:text-primary hover:-translate-y-[1px] hover:shadow-[0_4px_12px_rgba(0,0,0,0.15)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#0e0e10] disabled:hover:text-white disabled:hover:translate-y-0" 
              data-media-type="banani-button"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Entrando...
                </>
              ) : (
                <>
                  Entrar
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

          {/* Botão de Instalação PWA - Sempre mostrar se não estiver instalado */}
          {!isInstalled && (
            <div className="mb-6">
              <button
                type="button"
                onClick={handleInstallClick}
                className="w-full h-[48px] sm:h-[54px] bg-gradient-to-r from-[#00ff88] to-[#00afaa] text-[#0e0e10] border-none rounded-[12px] text-sm sm:text-base font-semibold cursor-pointer transition-all flex items-center justify-center gap-3 hover:from-[#00e67a] hover:to-[#009d8f] hover:-translate-y-[1px] hover:shadow-[0_4px_12px_rgba(0,255,136,0.3)]"
                data-media-type="banani-button"
              >
                <div className="w-[18px] h-[18px] flex items-center justify-center">
                  <Icon
                    icon={isIOS ? "lucide:download" : "lucide:smartphone"}
                    className="text-lg"
                  />
                </div>
                {isIOS ? 'Instalar App' : 'Instalar TraderNex'}
              </button>
              
              {showInstructions && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 flex items-center justify-center text-blue-600 mt-0.5">
                      <Icon icon="lucide:info" className="text-lg" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-blue-900 mb-2">
                        {instructionType === 'ios' 
                          ? 'Como instalar no iOS:' 
                          : instructionType === 'safari'
                          ? 'Como instalar no Safari:'
                          : 'Como instalar:'}
                      </p>
                      {instructionType === 'ios' ? (
                        <ol className="text-xs text-blue-800 space-y-1 list-decimal list-inside">
                          <li>Toque no botão <strong>Compartilhar</strong> (ícone de quadrado com seta) na parte inferior da tela</li>
                          <li>Role para baixo e selecione <strong>"Adicionar à Tela de Início"</strong></li>
                          <li>Toque em <strong>"Adicionar"</strong> no canto superior direito</li>
                        </ol>
                      ) : instructionType === 'safari' ? (
                        <ol className="text-xs text-blue-800 space-y-1 list-decimal list-inside">
                          <li>No menu do Safari, vá em <strong>Arquivo</strong> → <strong>Adicionar à Tela de Início</strong></li>
                          <li>Ou use o botão <strong>Compartilhar</strong> na barra de ferramentas</li>
                          <li>Selecione <strong>"Adicionar à Tela de Início"</strong> e confirme</li>
                        </ol>
                      ) : (
                        <ol className="text-xs text-blue-800 space-y-1 list-decimal list-inside">
                          <li>Procure o ícone de <strong>instalação</strong> (⊕) na barra de endereços do navegador</li>
                          <li>Ou vá em <strong>Menu</strong> (três pontos) → <strong>Instalar TraderNex</strong></li>
                          <li>Clique em <strong>"Instalar"</strong> na janela que aparecer</li>
                        </ol>
                      )}
                    </div>
                    <button
                      onClick={() => setShowInstructions(false)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <Icon icon="lucide:x" className="text-lg" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {isInstalled && (
            <div className="mb-6 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
              <div className="w-5 h-5 flex items-center justify-center text-green-600">
                <Icon icon="lucide:check-circle" className="text-lg" />
              </div>
              <p className="text-sm text-green-800 font-medium">
                App instalado! Acesse pelo ícone na sua tela inicial.
              </p>
            </div>
          )}

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
  )
}

export default LoginPage
