import { useEffect, useState } from 'react'
import { Icon } from '@iconify/react'
import DashboardLayout from '../components/DashboardLayout'
import { registerCryptoInterest } from '../services/dashboardService'

function CriptoEmBrevePage() {
  const [loading, setLoading] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [alreadyRegistered, setAlreadyRegistered] = useState(false)

  useEffect(() => {
    document.body.classList.add('scroll-enabled')
    return () => {
      document.body.classList.remove('scroll-enabled')
    }
  }, [])

  const handleRegisterInterest = async () => {
    setLoading(true)
    try {
      const result = await registerCryptoInterest()
      if (result.success) {
        if (result.alreadyRegistered) {
          setAlreadyRegistered(true)
        } else {
          setShowSuccess(true)
          setTimeout(() => setShowSuccess(false), 5000)
        }
      }
    } catch (error) {
      console.error('Erro ao registrar interesse:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col items-center py-6 sm:py-8 lg:py-10 px-4 sm:px-6 lg:px-12">
        {/* Header */}
        <header className="w-full max-w-[800px] mb-8 sm:mb-10 lg:mb-12 text-center">
          <h1 className="text-2xl sm:text-3xl lg:text-[32px] font-bold text-[#111827] mb-3 tracking-[-0.02em]">Cripto Futures</h1>
          <p className="text-sm sm:text-base text-[#6b7280] font-normal">
            Expanda seus horizontes de investimento com inteligência artificial.
          </p>
        </header>

        {/* Coming Soon Card */}
        <div className="w-full max-w-[600px] flex justify-center">
          <div className="bg-white border border-[#e5e7eb] rounded-2xl sm:rounded-3xl p-6 sm:p-10 lg:p-16 flex flex-col items-center text-center shadow-[0_20px_40px_-10px_rgba(0,0,0,0.05)] relative overflow-hidden">
            {/* Decorative background blur */}
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(0,255,136,0.03),transparent_60%)] pointer-events-none z-0" />
            
            {/* Icon with glow */}
            <div className="relative mb-6 sm:mb-8 z-10">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 sm:w-20 sm:h-20 bg-[#00ff88] blur-[40px] opacity-20 -z-10" />
              <Icon icon="lucide:rocket" className="text-5xl sm:text-[64px] text-[#00ff88]" />
            </div>

            <h2 className="text-xl sm:text-2xl font-bold text-[#111827] mb-3 sm:mb-4 relative z-10">Módulo em Desenvolvimento</h2>
            <p className="text-sm sm:text-[15px] leading-relaxed text-[#6b7280] mb-6 sm:mb-8 max-w-[400px] relative z-10 px-2">
              Estamos treinando a IA Falcon FX para operar no mercado de Criptomoedas e Futuros com a mesma precisão e segurança do Forex.
            </p>

            {/* Features Preview */}
            <div className="flex gap-2 sm:gap-3 mb-6 sm:mb-8 flex-wrap justify-center relative z-10">
              <div className="flex items-center gap-2 px-3 sm:px-4 py-1.5 bg-[#f9fafb] border border-[#e5e7eb] rounded-full text-[10px] sm:text-xs font-semibold text-[#4b5563]">
                <Icon icon="lucide:zap" className="text-sm" />
                Alta Volatilidade
              </div>
              <div className="flex items-center gap-2 px-4 py-1.5 bg-[#f9fafb] border border-[#e5e7eb] rounded-full text-xs font-semibold text-[#4b5563]">
                <Icon icon="lucide:shield-check" className="text-sm" />
                Gestão de Risco 2.0
              </div>
              <div className="flex items-center gap-2 px-4 py-1.5 bg-[#f9fafb] border border-[#e5e7eb] rounded-full text-xs font-semibold text-[#4b5563]">
                <Icon icon="lucide:clock" className="text-sm" />
                Operações 24/7
              </div>
            </div>

            <div className="h-px w-full bg-[#f3f4f6] mb-8 relative z-10" />

            {/* Notification Area */}
            <div className="flex flex-col items-center gap-4 relative z-10">
              <p className="text-[13px] text-[#6b7280] m-0 font-medium">
                Seja o primeiro a saber quando lançarmos.
              </p>
              <button 
                onClick={handleRegisterInterest}
                disabled={loading || showSuccess || alreadyRegistered}
                className={`h-11 sm:h-12 px-6 sm:px-8 rounded-xl font-semibold text-xs sm:text-sm cursor-pointer flex items-center gap-2 sm:gap-2.5 transition-all relative overflow-hidden ${
                  showSuccess || alreadyRegistered
                    ? 'bg-[#00ff88] text-[#0e0e10] border border-[#00ff88] shadow-[0_4px_12px_rgba(0,255,136,0.3)]'
                    : 'bg-[#0e0e10] text-[#00ff88] border border-[rgba(0,255,136,0.2)] shadow-[0_4px_12px_rgba(0,0,0,0.1)] hover:bg-black hover:shadow-[0_8px_20px_rgba(0,255,136,0.15)] hover:-translate-y-0.5'
                } ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                style={{
                  animation: showSuccess ? 'bounceIn 0.6s ease-out' : alreadyRegistered ? 'pulse 2s infinite' : 'none'
                }}
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-[#00ff88] border-t-transparent rounded-full animate-spin" />
                    Registrando...
                  </>
                ) : showSuccess || alreadyRegistered ? (
                  <>
                    <Icon icon="lucide:check-circle" className="text-lg" />
                    {alreadyRegistered ? 'Já registrado!' : 'Registrado com sucesso!'}
                  </>
                ) : (
                  <>
                    <Icon icon="lucide:bell" className="text-lg" />
                    Quero ser avisado
                  </>
                )}
              </button>
              
              {/* Success Message */}
              {showSuccess && (
                <div 
                  className="absolute -bottom-16 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[#00ff88] to-[#00afaa] text-white px-6 py-3 rounded-xl shadow-2xl flex items-center gap-2 z-20"
                  style={{ animation: 'fadeInDown 0.5s ease-out' }}
                >
                  <Icon icon="lucide:check-circle" className="text-xl" />
                  <span className="text-sm font-semibold">Você será avisado quando lançarmos!</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default CriptoEmBrevePage
