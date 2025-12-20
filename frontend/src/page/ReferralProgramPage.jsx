import { useEffect, useState } from 'react'
import { Icon } from '@iconify/react'
import DashboardLayout from '../components/DashboardLayout'
import { useAuth } from '../contexts/AuthContext'
import { getReferrals } from '../services/dashboardService'

function ReferralProgramPage() {
  const [copied, setCopied] = useState(false)
  const { user } = useAuth()
  const [referralData, setReferralData] = useState(null)
  const [loading, setLoading] = useState(true)
  
  const referralCode = referralData?.referralCode || user?.referralCode || 'JOA23'
  const referralLink = `app.tradernex.com/register?ref=${referralCode}`

  useEffect(() => {
    document.body.classList.add('scroll-enabled')
    return () => {
      document.body.classList.remove('scroll-enabled')
    }
  }, [])

  // Carregar dados de indicações
  useEffect(() => {
    const loadReferrals = async () => {
      setLoading(true)
      try {
        const result = await getReferrals()
        if (result.success) {
          setReferralData(result.data)
        }
      } catch (error) {
        console.error('Erro ao carregar dados de indicações:', error)
      } finally {
        setLoading(false)
      }
    }

    loadReferrals()
  }, [])

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text)
    setCopied(type)
    setTimeout(() => setCopied(false), 2000)
  }

  // Calcular estatísticas
  const stats = referralData ? {
    totalReferrals: referralData.totalReferrals || 0,
    activeReferrals: referralData.activeReferrals || 0,
    totalEarnings: referralData.totalEarnings || 0,
    availableForWithdrawal: referralData.availableForWithdrawal || 0,
    // Calcular acumulado no mês (comissões do mês atual)
    monthlyEarnings: referralData.referrals?.filter(ref => {
      const lastDate = ref.lastCommissionDate ? new Date(ref.lastCommissionDate) : new Date(ref.createdAt)
      const now = new Date()
      return lastDate.getMonth() === now.getMonth() && lastDate.getFullYear() === now.getFullYear()
    }).reduce((sum, ref) => sum + (parseFloat(ref.commission) || 0), 0) || 0
  } : null

  // Formatar dados de indicações
  const displayReferrals = referralData?.referrals?.map(ref => {
    const profitAmount = parseFloat(ref.profitAmount) || 0
    const brokerProfit = parseFloat(ref.brokerProfit) || 0
    const commission = parseFloat(ref.commission) || 0
    const brokerFeePercentage = parseFloat(ref.brokerFeePercentage) || 0
    
    // Determinar plano baseado no valor do investimento
    const investmentAmount = parseFloat(ref.investmentAmount) || 0
    let plan = 'Nex Start'
    if (investmentAmount >= 10000) plan = 'Nex Prime'
    else if (investmentAmount >= 5000) plan = 'Nex Pro'
    
    return {
      name: ref.referredName || 'Usuário',
      date: ref.createdAt ? new Date(ref.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A',
      plan: plan,
      status: ref.status || 'active',
      profit: profitAmount > 0 ? `$ ${profitAmount.toFixed(2)}` : '-',
      fee: brokerProfit > 0 ? `$ ${brokerProfit.toFixed(2)}` : '-',
      commission: commission > 0 ? `+ $ ${commission.toFixed(2)}` : '-',
      lastCommissionDate: ref.lastCommissionDate
    }
  }) || []

  return (
    <DashboardLayout>
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 py-6 sm:py-8 lg:py-10">
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-[#0e0e10] to-[#1a1d21] rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-12 mb-6 sm:mb-8 lg:mb-10 flex flex-col lg:flex-row justify-between items-start lg:items-center relative overflow-hidden border border-[rgba(255,255,255,0.05)] shadow-[0_20px_40px_-10px_rgba(0,0,0,0.2)] gap-6 lg:gap-0">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_20%_50%,rgba(0,255,136,0.08),transparent_70%)] pointer-events-none" />
          
          <div className="max-w-[600px] relative z-10 w-full lg:w-auto">
            <h2 className="text-2xl sm:text-3xl lg:text-[32px] font-bold mb-3 sm:mb-4 leading-tight bg-gradient-to-r from-white to-[#e5e7eb] bg-clip-text text-transparent">
              Ganhe renda recorrente indicando amigos para a TraderNex.
            </h2>
            <p className="text-sm sm:text-base text-[#9ca3af] mb-6 sm:mb-8 leading-relaxed">
              Receba 10% da taxa de performance semanal dos seus indicados — sem limites de ganhos. Construa sua carteira de afiliados.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="flex items-center gap-3 text-sm font-medium text-[#d1d5db]">
                <div className="w-6 h-6 rounded-full bg-[rgba(0,255,136,0.1)] flex items-center justify-center text-[#00ff88]">
                  <Icon icon="lucide:cpu" className="text-sm" />
                </div>
                <span>IA Falcon FX gerindo para eles</span>
              </div>
              <div className="flex items-center gap-3 text-sm font-medium text-[#d1d5db]">
                <div className="w-6 h-6 rounded-full bg-[rgba(0,255,136,0.1)] flex items-center justify-center text-[#00ff88]">
                  <Icon icon="lucide:zap" className="text-sm" />
                </div>
                <span>Sem carência, saque livre</span>
              </div>
              <div className="flex items-center gap-3 text-sm font-medium text-[#d1d5db]">
                <div className="w-6 h-6 rounded-full bg-[rgba(0,255,136,0.1)] flex items-center justify-center text-[#00ff88]">
                  <Icon icon="lucide:shield-check" className="text-sm" />
                </div>
                <span>Capital sempre na conta do cliente</span>
              </div>
              <div className="flex items-center gap-3 text-sm font-medium text-[#d1d5db]">
                <div className="w-6 h-6 rounded-full bg-[rgba(0,255,136,0.1)] flex items-center justify-center text-[#00ff88]">
                  <Icon icon="lucide:clock" className="text-sm" />
                </div>
                <span>Comissões pagas semanalmente</span>
              </div>
            </div>
          </div>

          {/* Referral Box */}
          <div className="bg-[rgba(255,255,255,0.03)] backdrop-blur-[10px] border border-[rgba(255,255,255,0.1)] rounded-xl sm:rounded-2xl p-5 sm:p-6 lg:p-8 w-full lg:w-[420px] relative z-10">
            <label className="text-[10px] sm:text-xs font-semibold text-[#9ca3af] uppercase tracking-wider mb-3 sm:mb-4 block">Seu Código de Indicação</label>
            <div className="flex gap-2 sm:gap-3 mb-4 sm:mb-6">
              <div className="flex-1 bg-black border border-[rgba(255,255,255,0.2)] rounded-lg text-[#00ff88] font-mono text-lg sm:text-xl font-bold flex items-center justify-center h-11 sm:h-12 tracking-wider text-center px-2">
                {referralCode}
              </div>
              <button
                className="h-11 sm:h-12 px-4 sm:px-5 rounded-lg bg-[rgba(255,255,255,0.1)] text-white border-none font-semibold cursor-pointer transition-all hover:bg-[rgba(255,255,255,0.2)] flex items-center justify-center flex-shrink-0"
                onClick={() => copyToClipboard(referralCode, 'code')}
              >
                <Icon icon={copied === 'code' ? 'lucide:check' : 'lucide:copy'} className="text-lg sm:text-xl" />
              </button>
            </div>
            <label className="text-[10px] sm:text-xs font-semibold text-[#9ca3af] uppercase tracking-wider mb-3 sm:mb-4 block">Link de Cadastro</label>
            <div className="flex gap-2">
              <div className="flex-1 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-lg text-[#d1d5db] px-3 sm:px-4 text-xs sm:text-[13px] h-10 flex items-center overflow-hidden">
                <span className="truncate">https://{referralLink}</span>
              </div>
              <button
                className="h-10 px-3 sm:px-4 rounded-lg bg-[#00ff88] text-[#002914] border-none font-semibold text-xs sm:text-[13px] cursor-pointer transition-all hover:bg-[#00cc6a] flex items-center gap-1.5 sm:gap-2 flex-shrink-0 whitespace-nowrap"
                onClick={() => copyToClipboard(`https://${referralLink}`, 'link')}
              >
                {copied === 'link' ? 'Copiado!' : 'Copiar'}
              </button>
            </div>
          </div>
        </div>

        {/* Earnings Metrics */}
        <div className="flex items-center gap-2 sm:gap-2.5 mb-4 sm:mb-6">
          <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-md bg-[rgba(0,175,170,0.1)] flex items-center justify-center text-[#00afaa]">
            <Icon icon="lucide:wallet" className="text-sm sm:text-base" />
          </div>
          <span className="text-base sm:text-lg font-bold text-[#111827]">Seus Ganhos</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <div className="bg-white rounded-2xl p-6 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05),0_2px_4px_-1px_rgba(0,0,0,0.03)] border border-[#e5e7eb] flex flex-col gap-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[13px] font-semibold text-[#6b7280]">Disponível para Saque</span>
              <Icon icon="lucide:unlock" className="text-lg text-[#9ca3af] opacity-70" />
            </div>
            <div className="text-2xl font-bold text-[#111827] tracking-tight">
              {loading ? '...' : `$ ${(stats?.availableForWithdrawal || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            </div>
            <div className="text-xs text-[#6b7280] flex items-center gap-1">
              <span className="text-[#00ff88] font-semibold">Liberado</span>
              <span>• Solicitar saque</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05),0_2px_4px_-1px_rgba(0,0,0,0.03)] border border-[#e5e7eb] flex flex-col gap-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[13px] font-semibold text-[#6b7280]">Comissão Total</span>
              <Icon icon="lucide:piggy-bank" className="text-lg text-[#9ca3af] opacity-70" />
            </div>
            <div className="text-2xl font-bold text-[#111827] tracking-tight">
              {loading ? '...' : `$ ${(stats?.totalEarnings || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            </div>
            <div className="text-xs text-[#6b7280] flex items-center gap-1">
              <span className="text-[#059669] font-semibold bg-[#ecfdf5] px-1.5 py-0.5 rounded">Lifetime</span>
              <span>desde o início</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05),0_2px_4px_-1px_rgba(0,0,0,0.03)] border border-[#e5e7eb] flex flex-col gap-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[13px] font-semibold text-[#6b7280]">Acumulado no Mês</span>
              <Icon icon="lucide:calendar-days" className="text-lg text-[#9ca3af] opacity-70" />
            </div>
            <div className="text-2xl font-bold text-[#111827] tracking-tight">
              {loading ? '...' : `$ ${(stats?.monthlyEarnings || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            </div>
            <div className="text-xs text-[#6b7280] flex items-center gap-1">
              <span className="text-[#059669] font-semibold bg-[#ecfdf5] px-1.5 py-0.5 rounded">Este mês</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05),0_2px_4px_-1px_rgba(0,0,0,0.03)] border border-[#e5e7eb] flex flex-col gap-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[13px] font-semibold text-[#6b7280]">Total de Indicados</span>
              <Icon icon="lucide:trending-up" className="text-lg text-[#9ca3af] opacity-70" />
            </div>
            <div className="text-2xl font-bold text-[#111827] tracking-tight">
              {loading ? '...' : (stats?.totalReferrals || 0)}
            </div>
            <div className="text-xs text-[#6b7280]">{stats?.activeReferrals || 0} ativos</div>
          </div>
        </div>

        {/* Referral Stats + Plans Table */}
        <div className="grid grid-cols-1 lg:grid-cols-[2fr_3fr] gap-8 mb-10">
          {/* Performance da Rede */}
          <div className="bg-white rounded-2xl p-6 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05),0_2px_4px_-1px_rgba(0,0,0,0.03)] border border-[#e5e7eb] flex flex-col">
            <div className="flex items-center gap-2.5 mb-5 text-base">
              <div className="w-7 h-7 rounded-md bg-[rgba(0,175,170,0.1)] flex items-center justify-center text-[#00afaa]">
                <Icon icon="lucide:users" className="text-base" />
              </div>
              <span className="font-bold text-[#111827]">Performance da Rede</span>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <div className="text-[13px] font-semibold text-[#6b7280] mb-1">Total de Indicados</div>
                <div className="text-xl font-bold text-[#111827] tracking-tight">{loading ? '...' : (stats?.totalReferrals || 0)}</div>
              </div>
              <div>
                <div className="text-[13px] font-semibold text-[#6b7280] mb-1">Ativos (Operando)</div>
                <div className="text-xl font-bold text-[#00afaa] tracking-tight">{loading ? '...' : (stats?.activeReferrals || 0)}</div>
              </div>
              <div>
                <div className="text-[13px] font-semibold text-[#6b7280] mb-1">Comissão Total</div>
                <div className="text-xl font-bold text-[#111827] tracking-tight">
                  {loading ? '...' : `$ ${(stats?.totalEarnings || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                </div>
              </div>
              <div>
                <div className="text-[13px] font-semibold text-[#6b7280] mb-1">Disponível</div>
                <div className="text-xl font-bold text-[#00afaa] tracking-tight">
                  {loading ? '...' : `$ ${(stats?.availableForWithdrawal || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                </div>
              </div>
            </div>
          </div>

          {/* Earnings Rules */}
          <div className="bg-white rounded-2xl p-6 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05),0_2px_4px_-1px_rgba(0,0,0,0.03)] border border-[#e5e7eb] flex flex-col">
            <div className="flex items-center gap-2.5 mb-2 text-base">
              <div className="w-7 h-7 rounded-md bg-[rgba(0,175,170,0.1)] flex items-center justify-center text-[#00afaa]">
                <Icon icon="lucide:percent" className="text-base" />
              </div>
              <span className="font-bold text-[#111827]">Quanto você ganha por plano</span>
            </div>
            <p className="text-[13px] text-[#6b7280] mb-4">
              Sua comissão é calculada sobre a taxa de performance paga pelo cliente.
            </p>
            <table className="w-full border-collapse mt-4">
              <thead>
                <tr>
                  <th className="text-left text-xs text-[#6b7280] font-semibold pb-3">Plano do Cliente</th>
                  <th className="text-left text-xs text-[#6b7280] font-semibold pb-3">Performance Fee</th>
                  <th className="text-left text-xs text-[#6b7280] font-semibold pb-3">Sua Comissão</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="text-sm font-semibold text-[#111827] py-3 border-t border-[#f3f4f6]">Nex Start</td>
                  <td className="text-sm text-[#111827] py-3 border-t border-[#f3f4f6]">50%</td>
                  <td className="text-sm text-[#00afaa] font-semibold py-3 border-t border-[#f3f4f6]">10% da taxa</td>
                </tr>
                <tr>
                  <td className="text-sm font-semibold text-[#111827] py-3 border-t border-[#f3f4f6]">Nex Pro</td>
                  <td className="text-sm text-[#111827] py-3 border-t border-[#f3f4f6]">40%</td>
                  <td className="text-sm text-[#00afaa] font-semibold py-3 border-t border-[#f3f4f6]">10% da taxa</td>
                </tr>
                <tr>
                  <td className="text-sm font-semibold text-[#111827] py-3 border-t border-[#f3f4f6] pb-0">Nex Prime</td>
                  <td className="text-sm text-[#111827] py-3 border-t border-[#f3f4f6] pb-0">30%</td>
                  <td className="text-sm text-[#00afaa] font-semibold py-3 border-t border-[#f3f4f6] pb-0">10% da taxa</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Latest Referrals Table */}
        <div className="flex items-center gap-2.5 mb-6">
          <div className="w-7 h-7 rounded-md bg-[rgba(0,175,170,0.1)] flex items-center justify-center text-[#00afaa]">
            <Icon icon="lucide:list" className="text-base" />
          </div>
          <span className="text-lg font-bold text-[#111827]">Últimas Indicações</span>
        </div>

        <div className="bg-white rounded-2xl shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05),0_2px_4px_-1px_rgba(0,0,0,0.03)] border border-[#e5e7eb] overflow-hidden mb-10">
          <div className="px-6 py-6 pb-4 flex justify-between items-center border-b border-[#f3f4f6]">
            <div className="text-sm font-semibold">Histórico Recente</div>
            <div className="text-[13px] text-[#00afaa] font-semibold cursor-pointer">Ver todos →</div>
          </div>
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-[#fafafa]">
                <th className="text-left px-6 py-4 text-xs font-semibold text-[#6b7280] uppercase tracking-wider border-b border-[#f3f4f6]">Nome</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-[#6b7280] uppercase tracking-wider border-b border-[#f3f4f6]">Data Cadastro</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-[#6b7280] uppercase tracking-wider border-b border-[#f3f4f6]">Plano</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-[#6b7280] uppercase tracking-wider border-b border-[#f3f4f6]">Status MT4</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-[#6b7280] uppercase tracking-wider border-b border-[#f3f4f6]">Lucro (Semana)</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-[#6b7280] uppercase tracking-wider border-b border-[#f3f4f6]">Taxa Gerada</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-[#6b7280] uppercase tracking-wider border-b border-[#f3f4f6]">Sua Comissão</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-[#6b7280] uppercase tracking-wider border-b border-[#f3f4f6]"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" className="px-6 py-8 text-center text-[#6b7280]">
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-[#00afaa]"></div>
                      <span>Carregando indicações...</span>
                    </div>
                  </td>
                </tr>
              ) : displayReferrals.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-8 text-center text-[#6b7280]">
                    Nenhuma indicação encontrada
                  </td>
                </tr>
              ) : (
                displayReferrals.map((ref, index) => (
                  <tr key={index} className="hover:bg-[#f9fafb] transition-colors">
                    <td className="px-6 py-4 text-sm font-semibold text-[#111827] border-b border-[#f3f4f6]">{ref.name}</td>
                    <td className="px-6 py-4 text-sm text-[#111827] border-b border-[#f3f4f6]">{ref.date}</td>
                    <td className="px-6 py-4 text-sm text-[#111827] border-b border-[#f3f4f6]">{ref.plan}</td>
                    <td className="px-6 py-4 text-sm border-b border-[#f3f4f6]">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                        ref.status === 'active' ? 'bg-[#dcfce7] text-[#166534]' :
                        ref.status === 'pending' ? 'bg-[#fef3c7] text-[#b45309]' :
                        'bg-[#f3f4f6] text-[#6b7280]'
                      }`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current" />
                        {ref.status === 'active' ? 'Conectado' : ref.status === 'pending' ? 'Pendente' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-[#111827] border-b border-[#f3f4f6]">{ref.profit}</td>
                    <td className="px-6 py-4 text-sm text-[#111827] border-b border-[#f3f4f6]">{ref.fee}</td>
                    <td className={`px-6 py-4 text-sm border-b border-[#f3f4f6] ${ref.commission.includes('+') ? 'text-[#059669] font-bold' : 'text-[#6b7280]'}`}>
                      {ref.commission}
                    </td>
                    <td className="px-6 py-4 border-b border-[#f3f4f6]">
                      <button className="w-8 h-8 rounded-lg border border-[#e5e7eb] bg-white text-[#6b7280] flex items-center justify-center cursor-pointer transition-all hover:border-[#00afaa] hover:text-[#00afaa]">
                        <Icon icon="lucide:more-horizontal" className="text-sm" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Marketing Materials */}
        <div className="flex items-center gap-2.5 mb-6">
          <div className="w-7 h-7 rounded-md bg-[rgba(0,175,170,0.1)] flex items-center justify-center text-[#00afaa]">
            <Icon icon="lucide:megaphone" className="text-base" />
          </div>
          <span className="text-lg font-bold text-[#111827]">Materiais de Divulgação</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-[#f9fafb] rounded-xl p-5 border border-[#e5e7eb] transition-all cursor-pointer hover:bg-white hover:border-[#00afaa] hover:shadow-[0_4px_12px_rgba(0,0,0,0.05)]">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-[#111827] shadow-[0_2px_6px_rgba(0,0,0,0.05)] mb-4">
              <Icon icon="lucide:message-square" className="text-xl" />
            </div>
            <div className="text-[15px] font-semibold text-[#111827] mb-1">Scripts de Abordagem</div>
            <div className="text-[13px] text-[#6b7280] leading-snug">Modelos prontos de texto para enviar no WhatsApp e Telegram.</div>
          </div>

          <div className="bg-[#f9fafb] rounded-xl p-5 border border-[#e5e7eb] transition-all cursor-pointer hover:bg-white hover:border-[#00afaa] hover:shadow-[0_4px_12px_rgba(0,0,0,0.05)]">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-[#111827] shadow-[0_2px_6px_rgba(0,0,0,0.05)] mb-4">
              <Icon icon="lucide:image" className="text-xl" />
            </div>
            <div className="text-[15px] font-semibold text-[#111827] mb-1">Banners e Criativos</div>
            <div className="text-[13px] text-[#6b7280] leading-snug">Imagens de alta qualidade para postar nos stories e feed.</div>
          </div>

          <div className="bg-[#f9fafb] rounded-xl p-5 border border-[#e5e7eb] transition-all cursor-pointer hover:bg-white hover:border-[#00afaa] hover:shadow-[0_4px_12px_rgba(0,0,0,0.05)]">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-[#111827] shadow-[0_2px_6px_rgba(0,0,0,0.05)] mb-4">
              <Icon icon="lucide:file-text" className="text-xl" />
            </div>
            <div className="text-[15px] font-semibold text-[#111827] mb-1">Argumentação de Venda</div>
            <div className="text-[13px] text-[#6b7280] leading-snug">PDF com as principais dúvidas e respostas para prospectos.</div>
          </div>
        </div>

        {/* Footer Info */}
        <div className="text-center py-10 text-[13px] text-[#6b7280] border-t border-[#e5e7eb] mt-10">
          Comissões semanais calculadas automaticamente toda sexta-feira com base no desempenho MT4. <br />
          O pagamento é liberado na sua carteira assim que a fatura do cliente é liquidada.
        </div>
      </div>
    </DashboardLayout>
  )
}

export default ReferralProgramPage
