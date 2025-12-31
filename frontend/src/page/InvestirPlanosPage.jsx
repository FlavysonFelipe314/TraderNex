import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Icon } from '@iconify/react'
import Swal from 'sweetalert2'
import DashboardLayout from '../components/DashboardLayout'
import { getInvestmentPlans, selectInvestmentPlan } from '../services/dashboardService'

function InvestirPlanosPage() {
  const navigate = useNavigate()
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectingPlan, setSelectingPlan] = useState(null)

  useEffect(() => {
    document.body.classList.add('scroll-enabled')
    return () => {
      document.body.classList.remove('scroll-enabled')
    }
  }, [])

  // Carregar planos do backend
  useEffect(() => {
    const loadPlans = async () => {
      setLoading(true)
      try {
        const result = await getInvestmentPlans()
        if (result.success && result.data) {
          setPlans(result.data)
        }
      } catch (error) {
        console.error('Erro ao carregar planos:', error)
      } finally {
        setLoading(false)
      }
    }

    loadPlans()
  }, [])

  const handleSelectPlan = async (plan) => {
    setSelectingPlan(plan.id)
    try {
      const result = await selectInvestmentPlan(plan.id)
      if (result.success) {
        // Mostrar SweetAlert informando que foi encaminhado para análise
        await Swal.fire({
          icon: 'info',
          title: 'Solicitação Enviada!',
          html: `
            <div style="text-align: left;">
              <p style="margin-bottom: 12px;">A alteração foi encaminhada para análise do setor responsável.</p>
              <p style="margin-bottom: 12px;">Aguarde que dentro de alguns minutos você receberá um email informando o status da sua solicitação de mudança de plano.</p>
              <p style="color: #6b7280; font-size: 14px;">Plano selecionado: <strong>${plan.name}</strong></p>
            </div>
          `,
          confirmButtonText: 'Entendi',
          confirmButtonColor: '#00afaa',
          width: '500px'
        })
        setSelectingPlan(null)
      } else {
        await Swal.fire({
          icon: 'error',
          title: 'Erro',
          text: result.message || 'Erro ao selecionar plano',
          confirmButtonColor: '#dc2626'
        })
        setSelectingPlan(null)
      }
    } catch (error) {
      console.error('Erro ao selecionar plano:', error)
      await Swal.fire({
        icon: 'error',
        title: 'Erro',
        text: 'Erro ao selecionar plano. Tente novamente.',
        confirmButtonColor: '#dc2626'
      })
      setSelectingPlan(null)
    }
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col items-center pb-20">
        {/* Hero Section */}
        <section className="flex flex-col items-center text-center gap-4 sm:gap-6 py-8 sm:py-12 lg:py-18 px-4 sm:px-6 max-w-[960px] mx-auto">
          <div className="w-12 h-12 sm:w-15 sm:h-15 rounded-[14px] sm:rounded-[18px] bg-[rgba(0,175,170,0.04)] text-[#00afaa] flex items-center justify-center mb-1 border border-[rgba(0,175,170,0.08)]">
            <Icon icon="lucide:rocket" className="text-xl sm:text-2xl" />
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-[42px] font-extrabold text-[#111827] tracking-[-0.03em] leading-tight mb-1 px-2">
            Invista com inteligência e exclusividade
          </h1>
          <p className="text-sm sm:text-base text-[#6b7280] leading-relaxed font-normal max-w-[680px] px-2">
            Escolha o plano ideal com base na sua estratégia e objetivo financeiro. Nossa IA Falcon FX opera por você com segurança, transparência e performance.
          </p>

          {/* Features Summary */}
          <div className="flex justify-center gap-4 mt-4 flex-wrap">
            <div className="text-[13px] text-[#4b5563] bg-white border border-[#e5e7eb] px-[18px] py-2 rounded-full flex items-center gap-2 font-medium shadow-[0_2px_4px_rgba(0,0,0,0.02)]">
              <Icon icon="lucide:zap" className="text-[#00afaa] text-sm" />
              IA Falcon FX
            </div>
            <div className="text-[13px] text-[#4b5563] bg-white border border-[#e5e7eb] px-[18px] py-2 rounded-full flex items-center gap-2 font-medium shadow-[0_2px_4px_rgba(0,0,0,0.02)]">
              <Icon icon="lucide:clock" className="text-[#00afaa] text-sm" />
              Sem carência
            </div>
            <div className="text-[13px] text-[#4b5563] bg-white border border-[#e5e7eb] px-[18px] py-2 rounded-full flex items-center gap-2 font-medium shadow-[0_2px_4px_rgba(0,0,0,0.02)]">
              <Icon icon="lucide:shield-check" className="text-[#00afaa] text-sm" />
              Capital sempre na sua conta
            </div>
            <div className="text-[13px] text-[#4b5563] bg-white border border-[#e5e7eb] px-[18px] py-2 rounded-full flex items-center gap-2 font-medium shadow-[0_2px_4px_rgba(0,0,0,0.02)]">
              <Icon icon="lucide:bot" className="text-[#00afaa] text-sm" />
              Gestão automatizada
            </div>
          </div>
        </section>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-10 mb-10 sm:mb-14 items-stretch">
          {loading ? (
            <div className="col-span-full flex items-center justify-center py-20">
              <div className="w-8 h-8 border-4 border-[#00AFAA] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : plans.length > 0 ? (
            plans.map((plan) => (
              <div key={plan.id} className="bg-white rounded-[16px] sm:rounded-[20px] border border-[#e5e7eb] shadow-[0_10px_30px_-5px_rgba(0,0,0,0.04)] p-6 sm:p-9 flex flex-col gap-4 sm:gap-6 relative transition-all hover:-translate-y-2 hover:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.08)] min-h-[500px] sm:min-h-[560px]">
                <div className="text-center flex flex-col gap-2 sm:gap-3">
                  <div className="text-xl sm:text-2xl font-bold text-[#111827] tracking-[-0.02em]">{plan.name}</div>
                  <div className="text-xs sm:text-sm text-[#6b7280] leading-normal font-normal min-h-[36px] sm:min-h-[42px]">
                    {plan.description || 'Plano de investimento'}
                  </div>
                </div>
                <div className="h-px bg-[#f3f4f6] w-full my-1" />
                <div className="flex flex-col gap-[18px]">
                  <div className="flex justify-between items-center">
                    <span className="text-[13px] font-medium text-[#6b7280]">Capital mínimo</span>
                    <span className="text-[15px] font-bold text-[#111827]">US$ {plan.min_investment?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}</span>
                  </div>
                  {plan.max_investment && (
                    <div className="flex justify-between items-center">
                      <span className="text-[13px] font-medium text-[#6b7280]">Capital máximo</span>
                      <span className="text-[15px] font-bold text-[#111827]">US$ {plan.max_investment.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-[13px] font-medium text-[#6b7280]">Retorno esperado</span>
                    <span className="text-base font-extrabold text-[#00afaa]">{plan.expected_return || 0}%</span>
                  </div>
                  {plan.duration_days && (
                    <div className="flex justify-between items-center">
                      <span className="text-[13px] font-medium text-[#6b7280]">Duração</span>
                      <span className="text-[15px] font-bold text-[#111827]">{plan.duration_days} dias</span>
                    </div>
                  )}
                  {plan.risk_level && (
                    <div className="flex justify-between items-center">
                      <span className="text-[13px] font-medium text-[#6b7280]">Risco</span>
                      <span className={`text-[15px] font-bold ${
                        plan.risk_level === 'Low' ? 'text-[#059669]' :
                        plan.risk_level === 'Medium' ? 'text-[#d97706]' :
                        'text-[#dc2626]'
                      }`}>
                        {plan.risk_level === 'Low' ? 'Baixo' : plan.risk_level === 'Medium' ? 'Médio' : 'Alto'}
                      </span>
                    </div>
                  )}
                </div>
                <div className="h-px bg-[#f3f4f6] w-full my-1" />
                <div className="flex flex-col gap-4 flex-1 pt-2">
                  <div className="flex items-center gap-3 text-sm text-[#4b5563] font-medium">
                    <div className="text-[#00afaa] flex-shrink-0 w-5 h-5 bg-[#f0fdf9] rounded-full flex items-center justify-center">
                      <Icon icon="lucide:check" className="text-sm" />
                    </div>
                    Gestão automatizada Falcon FX
                  </div>
                  <div className="flex items-center gap-3 text-sm text-[#4b5563] font-medium">
                    <div className="text-[#00afaa] flex-shrink-0 w-5 h-5 bg-[#f0fdf9] rounded-full flex items-center justify-center">
                      <Icon icon="lucide:check" className="text-sm" />
                    </div>
                    Sem carência
                  </div>
                  <div className="flex items-center gap-3 text-sm text-[#4b5563] font-medium">
                    <div className="text-[#00afaa] flex-shrink-0 w-5 h-5 bg-[#f0fdf9] rounded-full flex items-center justify-center">
                      <Icon icon="lucide:check" className="text-sm" />
                    </div>
                    Capital sempre na sua conta
                  </div>
                </div>
                <button 
                  onClick={() => handleSelectPlan(plan)}
                  disabled={selectingPlan === plan.id}
                  className={`w-full h-11 sm:h-12 rounded-xl font-semibold text-xs sm:text-sm border-none cursor-pointer flex items-center justify-center gap-2 transition-all mt-4 sm:mt-6 ${
                    selectingPlan === plan.id
                      ? 'bg-[#00afaa] text-white opacity-75 cursor-not-allowed'
                      : 'bg-white border border-[#e5e7eb] text-[#374151] shadow-[0_2px_4px_rgba(0,0,0,0.02)] hover:border-[#d1d5db] hover:bg-[#f9fafb] hover:text-[#111827]'
                  }`}
                >
                  {selectingPlan === plan.id ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Selecionando...
                    </>
                  ) : (
                    `Selecionar ${plan.name}`
                  )}
                </button>
              </div>
            ))
          ) : (
            // Fallback com planos mock se não houver dados do backend
            <>
              {/* Nex Start - Mock */}
              <div className="bg-white rounded-[16px] sm:rounded-[20px] border border-[#e5e7eb] shadow-[0_10px_30px_-5px_rgba(0,0,0,0.04)] p-6 sm:p-9 flex flex-col gap-4 sm:gap-6 relative transition-all hover:-translate-y-2 hover:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.08)] min-h-[500px] sm:min-h-[560px]">
            <div className="text-center flex flex-col gap-2 sm:gap-3">
              <div className="text-xl sm:text-2xl font-bold text-[#111827] tracking-[-0.02em]">Nex Start</div>
              <div className="text-xs sm:text-sm text-[#6b7280] leading-normal font-normal min-h-[36px] sm:min-h-[42px]">
                Para iniciantes começarem com segurança.
              </div>
            </div>
            <div className="h-px bg-[#f3f4f6] w-full my-1" />
            <div className="flex flex-col gap-[18px]">
              <div className="flex justify-between items-center">
                <span className="text-[13px] font-medium text-[#6b7280]">Capital mínimo</span>
                <span className="text-[15px] font-bold text-[#111827]">US$ 1.000</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[13px] font-medium text-[#6b7280]">Taxa de performance</span>
                <span className="text-base font-extrabold text-[#00afaa]">50%</span>
              </div>
            </div>
            <div className="h-px bg-[#f3f4f6] w-full my-1" />
            <div className="flex flex-col gap-4 flex-1 pt-2">
              <div className="flex items-center gap-3 text-sm text-[#4b5563] font-medium">
                <div className="text-[#00afaa] flex-shrink-0 w-5 h-5 bg-[#f0fdf9] rounded-full flex items-center justify-center">
                  <Icon icon="lucide:check" className="text-sm" />
                </div>
                Gestão automatizada Falcon FX
              </div>
              <div className="flex items-center gap-3 text-sm text-[#4b5563] font-medium">
                <div className="text-[#00afaa] flex-shrink-0 w-5 h-5 bg-[#f0fdf9] rounded-full flex items-center justify-center">
                  <Icon icon="lucide:check" className="text-sm" />
                </div>
                Ideal para novos investidores
              </div>
              <div className="flex items-center gap-3 text-sm text-[#4b5563] font-medium">
                <div className="text-[#00afaa] flex-shrink-0 w-5 h-5 bg-[#f0fdf9] rounded-full flex items-center justify-center">
                  <Icon icon="lucide:check" className="text-sm" />
                </div>
                Sem carência
              </div>
              <div className="flex items-center gap-3 text-sm text-[#4b5563] font-medium">
                <div className="text-[#00afaa] flex-shrink-0 w-5 h-5 bg-[#f0fdf9] rounded-full flex items-center justify-center">
                  <Icon icon="lucide:check" className="text-sm" />
                </div>
                Suporte por e-mail
              </div>
            </div>
            <button className="w-full h-11 sm:h-12 rounded-xl font-semibold text-xs sm:text-sm border-none cursor-pointer flex items-center justify-center gap-2 transition-all mt-4 sm:mt-6 bg-white border border-[#e5e7eb] text-[#374151] shadow-[0_2px_4px_rgba(0,0,0,0.02)] hover:border-[#d1d5db] hover:bg-[#f9fafb] hover:text-[#111827]">
              Selecionar Nex Start
            </button>
          </div>

          {/* Nex Pro */}
          <div className="bg-white rounded-[20px] border border-[#e5e7eb] shadow-[0_10px_30px_-5px_rgba(0,0,0,0.04)] p-9 flex flex-col gap-6 relative transition-all hover:-translate-y-2 hover:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.08)] min-h-[560px]">
            <div className="text-center flex flex-col gap-3">
              <div className="text-2xl font-bold text-[#111827] tracking-[-0.02em]">Nex Pro</div>
              <div className="text-sm text-[#6b7280] leading-normal font-normal min-h-[42px]">
                Para escalar com controle e eficiência.
              </div>
            </div>
            <div className="h-px bg-[#f3f4f6] w-full my-1" />
            <div className="flex flex-col gap-[18px]">
              <div className="flex justify-between items-center">
                <span className="text-[13px] font-medium text-[#6b7280]">Capital mínimo</span>
                <span className="text-[15px] font-bold text-[#111827]">US$ 5.000</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[13px] font-medium text-[#6b7280]">Taxa de performance</span>
                <span className="text-base font-extrabold text-[#00afaa]">40%</span>
              </div>
            </div>
            <div className="h-px bg-[#f3f4f6] w-full my-1" />
            <div className="flex flex-col gap-4 flex-1 pt-2">
              <div className="flex items-center gap-3 text-sm text-[#4b5563] font-medium">
                <div className="text-[#00afaa] flex-shrink-0 w-5 h-5 bg-[#f0fdf9] rounded-full flex items-center justify-center">
                  <Icon icon="lucide:check" className="text-sm" />
                </div>
                Até 3 contas MT4 conectadas
              </div>
              <div className="flex items-center gap-3 text-sm text-[#4b5563] font-medium">
                <div className="text-[#00afaa] flex-shrink-0 w-5 h-5 bg-[#f0fdf9] rounded-full flex items-center justify-center">
                  <Icon icon="lucide:check" className="text-sm" />
                </div>
                Gestão de risco otimizada
              </div>
              <div className="flex items-center gap-3 text-sm text-[#4b5563] font-medium">
                <div className="text-[#00afaa] flex-shrink-0 w-5 h-5 bg-[#f0fdf9] rounded-full flex items-center justify-center">
                  <Icon icon="lucide:check" className="text-sm" />
                </div>
                Sem carência
              </div>
              <div className="flex items-center gap-3 text-sm text-[#4b5563] font-medium">
                <div className="text-[#00afaa] flex-shrink-0 w-5 h-5 bg-[#f0fdf9] rounded-full flex items-center justify-center">
                  <Icon icon="lucide:check" className="text-sm" />
                </div>
                Suporte via WhatsApp
              </div>
              <div className="flex items-center gap-3 text-sm text-[#4b5563] font-medium">
                <div className="text-[#00afaa] flex-shrink-0 w-5 h-5 bg-[#f0fdf9] rounded-full flex items-center justify-center">
                  <Icon icon="lucide:check" className="text-sm" />
                </div>
                IA Falcon FX automática
              </div>
            </div>
            <button 
              onClick={() => handleSelectPlan({ id: 'mock-nex-pro', name: 'Nex Pro' })}
              disabled={selectingPlan === 'mock-nex-pro'}
              className={`w-full h-12 rounded-xl font-semibold text-sm border-none cursor-pointer flex items-center justify-center gap-2 transition-all mt-6 ${
                selectingPlan === 'mock-nex-pro'
                  ? 'bg-[#00afaa] text-white opacity-75 cursor-not-allowed'
                  : 'bg-white border border-[#e5e7eb] text-[#374151] shadow-[0_2px_4px_rgba(0,0,0,0.02)] hover:border-[#d1d5db] hover:bg-[#f9fafb] hover:text-[#111827]'
              }`}
            >
              {selectingPlan === 'mock-nex-pro' ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Selecionando...
                </>
              ) : (
                'Selecionar Nex Pro'
              )}
            </button>
          </div>

          {/* Nex Prime - Highlighted */}
          <div className="bg-gradient-to-b from-white to-[#f8fafc] rounded-[16px] sm:rounded-[20px] border border-[#00ff88] shadow-[0_20px_60px_-12px_rgba(0,0,0,0.08),0_0_20px_rgba(0,255,136,0.1)] p-6 sm:p-9 flex flex-col gap-4 sm:gap-6 relative transition-all hover:-translate-y-2 hover:shadow-[0_30px_80px_-12px_rgba(0,0,0,0.12),0_0_30px_rgba(0,255,136,0.15)] min-h-[500px] sm:min-h-[560px] scale-[1.01] sm:scale-[1.02] z-[2] md:col-span-2 lg:col-span-1">
            <div className="absolute -top-3 sm:-top-4 left-1/2 -translate-x-1/2 bg-[#0e0e10] text-[#00ff88] px-3 sm:px-5 py-1.5 sm:py-2 rounded-full text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider shadow-[0_8px_20px_rgba(0,0,0,0.2)] z-[5] flex items-center gap-1.5 sm:gap-2 border border-[rgba(0,255,136,0.3)] whitespace-nowrap">
              <Icon icon="lucide:crown" className="text-[10px] sm:text-xs" />
              PLANO PREMIUM
            </div>
            <div className="text-center flex flex-col gap-2 sm:gap-3">
              <div className="text-2xl sm:text-[28px] font-extrabold text-[#111827] tracking-[-0.02em]">Nex Prime</div>
              <div className="text-sm text-[#6b7280] leading-normal font-normal min-h-[42px]">
                Para quem exige serviço exclusivo e acompanhamento individual.
              </div>
            </div>
            <div className="h-px bg-[#f3f4f6] w-full my-1" />
            <div className="flex flex-col gap-[18px]">
              <div className="flex justify-between items-center">
                <span className="text-[13px] font-medium text-[#6b7280]">Capital mínimo</span>
                <span className="text-[17px] font-bold text-[#111827]">US$ 10.000+</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[13px] font-medium text-[#6b7280]">Taxa de performance</span>
                <span className="text-xl font-extrabold text-[#00bf9c]" style={{ textShadow: '0 0 20px rgba(0,255,136,0.15)' }}>30%</span>
              </div>
            </div>
            <div className="h-px bg-[#f3f4f6] w-full my-1" />
            <div className="flex flex-col gap-4 flex-1 pt-2">
              <div className="flex items-center gap-3 text-sm text-[#4b5563] font-medium">
                <div className="text-[#00875a] flex-shrink-0 w-5 h-5 bg-[rgba(0,255,136,0.15)] rounded-full flex items-center justify-center">
                  <Icon icon="lucide:star" className="text-sm" />
                </div>
                Acompanhamento individual
              </div>
              <div className="flex items-center gap-3 text-sm text-[#4b5563] font-medium">
                <div className="text-[#00875a] flex-shrink-0 w-5 h-5 bg-[rgba(0,255,136,0.15)] rounded-full flex items-center justify-center">
                  <Icon icon="lucide:sliders-horizontal" className="text-sm" />
                </div>
                Configuração premium Falcon FX
              </div>
              <div className="flex items-center gap-3 text-sm text-[#4b5563] font-medium">
                <div className="text-[#00875a] flex-shrink-0 w-5 h-5 bg-[rgba(0,255,136,0.15)] rounded-full flex items-center justify-center">
                  <Icon icon="lucide:clock" className="text-sm" />
                </div>
                Sem carência
              </div>
              <div className="flex items-center gap-3 text-sm text-[#4b5563] font-medium">
                <div className="text-[#00875a] flex-shrink-0 w-5 h-5 bg-[rgba(0,255,136,0.15)] rounded-full flex items-center justify-center">
                  <Icon icon="lucide:message-circle" className="text-sm" />
                </div>
                Suporte WhatsApp 24/7
              </div>
              <div className="flex items-center gap-3 text-sm text-[#4b5563] font-medium">
                <div className="text-[#00875a] flex-shrink-0 w-5 h-5 bg-[rgba(0,255,136,0.15)] rounded-full flex items-center justify-center">
                  <Icon icon="lucide:bar-chart-2" className="text-sm" />
                </div>
                Gestão de alta precisão
              </div>
            </div>
            <button className="w-full h-12 sm:h-14 rounded-xl font-semibold text-sm sm:text-[15px] border-none cursor-pointer flex items-center justify-center gap-2 transition-all mt-4 sm:mt-6 bg-[#0e0e10] text-[#00ff88] shadow-[0_0_20px_rgba(0,255,136,0.15)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.25),0_0_25px_rgba(0,255,136,0.25)] hover:-translate-y-0.5">
              Selecionar Nex Prime
            </button>
          </div>
            </>
          )}
        </div>

        {/* Bottom Section */}
        <div className="flex flex-col gap-10 items-center mb-16">
          {/* Secondary Action */}
          <div className="text-center">
            <a href="#" className="text-sm text-[#6b7280] no-underline transition-all font-medium inline-flex items-center gap-2 cursor-pointer px-5 py-2.5 rounded-full bg-white border border-[#e5e7eb] hover:text-[#111827] hover:bg-white hover:border-[#d1d5db] hover:shadow-[0_4px_12px_rgba(0,0,0,0.05)]">
              <div className="w-6 h-6 rounded-full bg-[#f3f4f6] flex items-center justify-center text-[#9ca3af] transition-all">
                <Icon icon="lucide:help-circle" className="text-base" />
              </div>
              Não sabe qual plano escolher? Compare os planos →
            </a>
          </div>

          {/* Trust Indicators */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-[1000px] px-6">
            <div className="bg-white border border-[#f3f4f6] rounded-2xl px-6 py-5 flex items-center justify-center gap-4 transition-all w-full hover:border-[#e5e7eb] hover:shadow-[0_4px_12px_rgba(0,0,0,0.03)]">
              <div className="w-10 h-10 rounded-xl bg-[#f9fafb] text-[#6b7280] flex items-center justify-center flex-shrink-0">
                <Icon icon="lucide:lock" className="text-lg" />
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[13px] font-bold text-[#374151]">Capital sempre na sua conta</span>
                <span className="text-xs text-[#9ca3af]">Nunca temos acesso a depósitos ou saques.</span>
              </div>
            </div>

            <div className="bg-white border border-[#f3f4f6] rounded-2xl px-6 py-5 flex items-center justify-center gap-4 transition-all w-full hover:border-[#e5e7eb] hover:shadow-[0_4px_12px_rgba(0,0,0,0.03)]">
              <div className="w-10 h-10 rounded-xl bg-[#f9fafb] text-[#6b7280] flex items-center justify-center flex-shrink-0">
                <Icon icon="lucide:cpu" className="text-lg" />
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[13px] font-bold text-[#374151]">IA Falcon FX exclusiva</span>
                <span className="text-xs text-[#9ca3af]">Estratégias proprietárias de alta precisão.</span>
              </div>
            </div>

            <div className="bg-white border border-[#f3f4f6] rounded-2xl px-6 py-5 flex items-center justify-center gap-4 transition-all w-full hover:border-[#e5e7eb] hover:shadow-[0_4px_12px_rgba(0,0,0,0.03)]">
              <div className="w-10 h-10 rounded-xl bg-[#f9fafb] text-[#6b7280] flex items-center justify-center flex-shrink-0">
                <Icon icon="lucide:users" className="text-lg" />
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[13px] font-bold text-[#374151]">Clientes verificados</span>
                <span className="text-xs text-[#9ca3af]">Suporte humano + monitoramento constante.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default InvestirPlanosPage
