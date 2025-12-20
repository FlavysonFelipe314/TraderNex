import { useEffect, useState } from 'react'
import { Icon } from '@iconify/react'
import DashboardLayout from '../components/DashboardLayout'
import {
  getAllReferralCommissions,
  getReferralCommissionStats,
  approveCommissionPayment,
  rejectCommissionPayment,
  processWeeklyCommissions
} from '../services/adminService'
import { formatCurrencyBR } from '../utils/format'

function AdminReferralsPage() {
  const [commissions, setCommissions] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // 'all', 'pending', 'paid'
  const [selectedCommission, setSelectedCommission] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    document.body.classList.add('scroll-enabled')
    return () => {
      document.body.classList.remove('scroll-enabled')
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [filter])

  const loadData = async () => {
    setLoading(true)
    try {
      const [commissionsResult, statsResult] = await Promise.all([
        getAllReferralCommissions({
          commission_paid: filter === 'pending' ? false : filter === 'paid' ? true : undefined
        }),
        getReferralCommissionStats()
      ])

      if (commissionsResult.success) {
        setCommissions(commissionsResult.data || [])
      }

      if (statsResult.success) {
        setStats(statsResult.data)
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApprovePayment = async (referralId) => {
    if (!confirm('Deseja aprovar o pagamento desta comissão?')) return

    setActionLoading(true)
    try {
      const result = await approveCommissionPayment(referralId)
      if (result.success) {
        alert('Pagamento aprovado com sucesso!')
        await loadData()
      } else {
        alert('Erro ao aprovar pagamento: ' + result.message)
      }
    } catch (error) {
      console.error('Erro ao aprovar pagamento:', error)
      alert('Erro ao aprovar pagamento.')
    } finally {
      setActionLoading(false)
      setSelectedCommission(null)
    }
  }

  const handleRejectPayment = async (referralId) => {
    const reason = prompt('Informe o motivo da rejeição:')
    if (!reason) return

    setActionLoading(true)
    try {
      const result = await rejectCommissionPayment(referralId, reason)
      if (result.success) {
        alert('Pagamento rejeitado.')
        await loadData()
      } else {
        alert('Erro ao rejeitar pagamento: ' + result.message)
      }
    } catch (error) {
      console.error('Erro ao rejeitar pagamento:', error)
      alert('Erro ao rejeitar pagamento.')
    } finally {
      setActionLoading(false)
      setSelectedCommission(null)
    }
  }

  const filteredCommissions = commissions.filter(comm => {
    if (filter === 'pending') return !comm.commission_paid
    if (filter === 'paid') return comm.commission_paid
    return true
  })

  return (
    <DashboardLayout
      title="Gerenciamento de Comissões"
      subtitle="Visualize e gerencie comissões de indicações e pagamentos"
    >
      <div className="max-w-[1600px] w-full mx-auto px-4 sm:px-6 py-6">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-br from-[#00afaa] to-[#009a96] rounded-2xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90 mb-1">Total de Comissões</p>
                  <p className="text-3xl font-bold">{stats.totalReferrals}</p>
                </div>
                <Icon icon="lucide:dollar-sign" className="text-4xl opacity-80" />
              </div>
            </div>
            <div className="bg-gradient-to-br from-[#f59e0b] to-[#d97706] rounded-2xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90 mb-1">Pagamentos Pendentes</p>
                  <p className="text-3xl font-bold">{stats.pendingPayments}</p>
                  <p className="text-xs opacity-80 mt-1">
                    {formatCurrencyBR(stats.pendingCommission)}
                  </p>
                </div>
                <Icon icon="lucide:clock" className="text-4xl opacity-80" />
              </div>
            </div>
            <div className="bg-gradient-to-br from-[#10b981] to-[#059669] rounded-2xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90 mb-1">Pagamentos Aprovados</p>
                  <p className="text-3xl font-bold">{stats.paidPayments}</p>
                  <p className="text-xs opacity-80 mt-1">
                    {formatCurrencyBR(stats.paidCommission)}
                  </p>
                </div>
                <Icon icon="lucide:check-circle" className="text-4xl opacity-80" />
              </div>
            </div>
            <div className="bg-gradient-to-br from-[#3b82f6] to-[#2563eb] rounded-2xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90 mb-1">Comissão Total</p>
                  <p className="text-3xl font-bold">{formatCurrencyBR(stats.totalCommission)}</p>
                </div>
                <Icon icon="lucide:trending-up" className="text-4xl opacity-80" />
              </div>
            </div>
          </div>
        )}

        {/* Botão de Processar Comissões Semanais */}
        <div className="mb-6 flex justify-end">
          <button
            onClick={async () => {
              if (!confirm('Deseja processar as comissões semanais agora? Isso calculará comissões baseado nos lucros da semana.')) return
              
              setActionLoading(true)
              try {
                const result = await processWeeklyCommissions()
                if (result.success) {
                  alert(`Comissões processadas!\nProcessados: ${result.data?.processed || 0}\nComissões: ${result.data?.commissions || 0}\nFaturas: ${result.data?.invoices || 0}`)
                  await loadData()
                } else {
                  alert('Erro ao processar: ' + result.message)
                }
              } catch (error) {
                console.error('Erro ao processar comissões:', error)
                alert('Erro ao processar comissões semanais.')
              } finally {
                setActionLoading(false)
              }
            }}
            disabled={actionLoading}
            className="px-4 py-2 bg-gradient-to-r from-[#00afaa] to-[#009a96] text-white rounded-lg text-sm font-medium hover:from-[#009a96] hover:to-[#008882] transition-all shadow-md flex items-center gap-2 disabled:opacity-50"
          >
            <Icon icon="lucide:refresh-cw" className="text-sm" />
            {actionLoading ? 'Processando...' : 'Processar Comissões Semanais'}
          </button>
        </div>

        {/* Filtros */}
        <div className="mb-6 flex flex-wrap gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filter === 'all'
                ? 'bg-[#00afaa] text-white shadow-md'
                : 'bg-white text-[#6b7280] border border-[#e5e7eb] hover:bg-[#f9fafb]'
            }`}
          >
            Todas
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filter === 'pending'
                ? 'bg-[#f59e0b] text-white shadow-md'
                : 'bg-white text-[#6b7280] border border-[#e5e7eb] hover:bg-[#f9fafb]'
            }`}
          >
            Pendentes ({stats?.pendingPayments || 0})
          </button>
          <button
            onClick={() => setFilter('paid')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filter === 'paid'
                ? 'bg-[#10b981] text-white shadow-md'
                : 'bg-white text-[#6b7280] border border-[#e5e7eb] hover:bg-[#f9fafb]'
            }`}
          >
            Pagas ({stats?.paidPayments || 0})
          </button>
        </div>

        {/* Tabela de Comissões */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#00afaa]"></div>
          </div>
        ) : filteredCommissions.length === 0 ? (
          <div className="p-12 text-center text-[#6b7280] bg-white rounded-2xl shadow-sm">
            <Icon icon="lucide:inbox" className="text-5xl mx-auto mb-4 text-[#9ca3af]" />
            <p className="text-base font-medium">Nenhuma comissão encontrada.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-[#e5e7eb] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-[#fafafa] border-b border-[#e5e7eb]">
                    <th className="text-left px-6 py-4 text-xs font-semibold text-[#6b7280] uppercase tracking-wider">
                      Indicador
                    </th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-[#6b7280] uppercase tracking-wider">
                      Indicado
                    </th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-[#6b7280] uppercase tracking-wider">
                      Investimento
                    </th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-[#6b7280] uppercase tracking-wider">
                      Lucro
                    </th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-[#6b7280] uppercase tracking-wider">
                      Taxa Corretora
                    </th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-[#6b7280] uppercase tracking-wider">
                      Comissão
                    </th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-[#6b7280] uppercase tracking-wider">
                      Status
                    </th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-[#6b7280] uppercase tracking-wider">
                      Última Atualização
                    </th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-[#6b7280] uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCommissions.map((comm) => (
                    <tr
                      key={comm.id}
                      className="hover:bg-[#f9fafb] transition-colors border-b border-[#f3f4f6]"
                    >
                      <td className="px-6 py-4">
                        <div className="text-sm font-semibold text-[#111827]">
                          {comm.referrer_first_name} {comm.referrer_last_name}
                        </div>
                        <div className="text-xs text-[#6b7280]">{comm.referrer_email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-semibold text-[#111827]">
                          {comm.referred_first_name} {comm.referred_last_name}
                        </div>
                        <div className="text-xs text-[#6b7280]">{comm.referred_email}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-[#111827]">
                        {formatCurrencyBR(comm.investment_amount)}
                      </td>
                      <td className="px-6 py-4 text-sm text-[#111827]">
                        {formatCurrencyBR(comm.profit_amount)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-[#111827]">
                          {formatCurrencyBR(comm.broker_profit)}
                        </div>
                        <div className="text-xs text-[#6b7280]">
                          ({comm.broker_fee_percentage}%)
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-bold text-[#00afaa]">
                          {formatCurrencyBR(comm.commission)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                            comm.commission_paid
                              ? 'bg-[#dcfce7] text-[#166534]'
                              : 'bg-[#fef3c7] text-[#b45309]'
                          }`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-current" />
                          {comm.commission_paid ? 'Pago' : 'Pendente'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-[#6b7280]">
                        {comm.last_commission_date
                          ? new Date(comm.last_commission_date).toLocaleDateString('pt-BR')
                          : new Date(comm.created_at).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-6 py-4">
                        {!comm.commission_paid && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleApprovePayment(comm.id)}
                              disabled={actionLoading}
                              className="px-3 py-1.5 bg-[#10b981] text-white rounded-lg text-xs font-medium hover:bg-[#059669] transition-colors disabled:opacity-50 flex items-center gap-1"
                            >
                              <Icon icon="lucide:check" className="text-sm" />
                              Aprovar
                            </button>
                            <button
                              onClick={() => handleRejectPayment(comm.id)}
                              disabled={actionLoading}
                              className="px-3 py-1.5 bg-[#ef4444] text-white rounded-lg text-xs font-medium hover:bg-[#dc2626] transition-colors disabled:opacity-50 flex items-center gap-1"
                            >
                              <Icon icon="lucide:x" className="text-sm" />
                              Rejeitar
                            </button>
                          </div>
                        )}
                        {comm.commission_paid && (
                          <span className="text-xs text-[#6b7280]">Pago</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

export default AdminReferralsPage
