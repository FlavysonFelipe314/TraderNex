import { Icon } from '@iconify/react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'

function EmailSentPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { forgotPassword } = useAuth()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  
  // Obter email do state da navegação
  const email = location.state?.email || ''

  const handleBackToLogin = () => {
    navigate('/login')
  }

  const handleResendEmail = async () => {
    if (!email) {
      setMessage('E-mail não encontrado. Por favor, tente novamente a partir da página de recuperação.')
      return
    }

    setLoading(true)
    setMessage('')

    try {
      const result = await forgotPassword(email)
      
      if (result.success) {
        setMessage('E-mail reenviado com sucesso! Verifique sua caixa de entrada.')
      } else {
        setMessage(result.message || 'Erro ao reenviar e-mail.')
      }
    } catch (err) {
      setMessage('Erro inesperado. Tente novamente.')
      console.error('Erro ao reenviar e-mail:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex w-full h-full">
      {/* Left Panel */}
      <div className="flex-1 bg-[#0e0e10] relative flex flex-col justify-between p-[60px_80px] overflow-hidden text-white lg:block hidden"
        style={{
          backgroundImage: `linear-gradient(rgba(14, 14, 16, 0.95), rgba(14, 14, 16, 0.95)), url('https://images.unsplash.com/photo-1611974765270-ca1258634369?q=80&w=2664&auto=format&fit=crop')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        {/* Grid Overlay */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundSize: '40px 40px',
            backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)`
          }}
        />

        <div className="flex items-center gap-3 relative z-[2]">
          <div className="w-[10px] h-[10px] bg-primary rounded-full shadow-[0_0_12px_#00ff88]" />
          <div className="text-2xl font-bold text-white tracking-[-0.02em]">
            TraderNex
          </div>
        </div>

        <div className="relative z-[2] max-w-[520px]">
          <h1 className="text-[42px] font-bold text-white leading-[1.1] mb-6 tracking-[-0.03em]">
            Verifique sua caixa de entrada.
          </h1>
          <p className="text-lg text-[#9ca3af] leading-relaxed mb-10">
            O primeiro passo para recuperar o acesso à sua conta e voltar a
            acompanhar a performance do Falcon FX.
          </p>

          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3 text-[#e5e7eb] text-[15px] font-medium">
              <div className="text-primary flex items-center drop-shadow-[0_0_4px_rgba(0,255,136,0.4)]">
                <div className="w-5 h-5 flex items-center justify-center">
                  <Icon
                    icon="lucide:check-circle-2"
                    className="text-xl"
                  />
                </div>
              </div>
              Segurança de ponta a ponta
            </div>
            <div className="flex items-center gap-3 text-[#e5e7eb] text-[15px] font-medium">
              <div className="text-primary flex items-center drop-shadow-[0_0_4px_rgba(0,255,136,0.4)]">
                <div className="w-5 h-5 flex items-center justify-center">
                  <Icon
                    icon="lucide:check-circle-2"
                    className="text-xl"
                  />
                </div>
              </div>
              Processo rápido e automatizado
            </div>
          </div>

          <div className="bg-[rgba(255,255,255,0.05)] backdrop-blur-[12px] border border-[rgba(255,255,255,0.1)] rounded-lg p-5 flex items-center gap-4 max-w-[380px] mt-[60px]">
            <img
              src="https://app.banani.co/avatar3.jpeg"
              alt="Cliente"
              className="w-12 h-12 rounded-full border-2 border-[rgba(255,255,255,0.1)]"
            />
            <div>
              <h4 className="text-white text-sm font-semibold mb-1">Suporte Técnico</h4>
              <p className="text-primary text-[13px] font-semibold">Estamos prontos para ajudar se precisar.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-8 md:p-10 bg-white">
        <div className="w-full max-w-[440px] text-center">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-[rgba(0,255,136,0.1)] rounded-full flex items-center justify-center mx-auto mb-6 sm:mb-8 text-secondary">
            <div className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center">
              <Icon
                icon="lucide:mail-check"
                className="text-3xl sm:text-[40px]"
              />
            </div>
          </div>

          <h2 className="text-2xl sm:text-3xl lg:text-[28px] font-bold text-[#111827] mb-3 tracking-[-0.02em]">
            E-mail enviado!
          </h2>
          <p className="text-sm sm:text-base text-[#6b7280] leading-normal mb-8 sm:mb-10">
            Enviamos as instruções de recuperação de senha para o seu e-mail.
            Por favor, verifique também sua caixa de spam.
          </p>

          <a
            href="#"
            className="flex items-center justify-center w-full h-[48px] sm:h-[52px] bg-[#0e0e10] text-white border-none rounded-md text-sm sm:text-base font-semibold cursor-pointer transition-all mb-6 no-underline hover:bg-black hover:text-primary hover:-translate-y-[1px] hover:shadow-[0_4px_12px_rgba(0,0,0,0.15)]"
            onClick={(e) => {
              e.preventDefault()
              handleBackToLogin()
            }}
            data-media-type="banani-button"
          >
            Voltar para o Login
          </a>

          {message && (
            <div className={`mb-4 p-3 rounded-lg text-sm ${
              message.includes('sucesso') 
                ? 'bg-green-50 border border-green-200 text-green-600' 
                : 'bg-red-50 border border-red-200 text-red-600'
            }`}>
              {message}
            </div>
          )}

          <p className="text-xs sm:text-sm text-[#6b7280]">
            Não recebeu o e-mail?
            <a
              href="#"
              className="text-secondary no-underline font-semibold ml-1 cursor-pointer transition-colors hover:text-[#111827] hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={(e) => {
                e.preventDefault()
                if (!loading) {
                  handleResendEmail()
                }
              }}
              data-media-type="banani-button"
            >
              {loading ? 'Enviando...' : 'Clique para reenviar'}
            </a>
          </p>

          <div className="flex items-center justify-center gap-2 mt-8 sm:mt-[60px] text-xs text-[#9ca3af] pt-4 sm:pt-6 border-t border-[#f3f4f6]">
            <div className="w-[14px] h-[14px] flex items-center justify-center">
              <Icon
                icon="lucide:shield-check"
                className="text-sm"
              />
            </div>
            Ambiente protegido por criptografia TLS 1.3
          </div>
        </div>
      </div>
    </div>
  )
}

export default EmailSentPage
