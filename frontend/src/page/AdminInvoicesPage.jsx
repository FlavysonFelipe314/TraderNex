import { useEffect, useState } from 'react'
import { Icon } from '@iconify/react'
import DashboardLayout from '../components/DashboardLayout'
import {
  getAllInvoices,
  getInvoiceStats,
  markInvoiceAsPaidAdmin
} from '../services/adminService'
import { formatCurrencyBR } from '../utils/format'

function AdminInvoicesPage() {
  const [invoices, setInvoices] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // 'all', 'pending', 'paid', 'overdue'
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
      const [invoicesResult, statsResult] = await Promise.all([
        getAllInvoices({
          status: filter === 'all' ? undefined : filter === 'overdue' ? undefined : filter,
          period: filter === 'overdue' ? 'overdue' : undefined
        }),
        getInvoiceStats()
      ])

      if (invoicesResult.success) {
        setInvoices(invoicesResult.data || [])
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

  const handleMarkAsPaid = async (invoiceId) => {
    if (!confirm('Deseja marcar esta fatura como paga?')) return

    setActionLoading(true)
    try {
      const result = await markInvoiceAsPaidAdmin(invoiceId)
      if (result.success) {
        alert('Fatura marcada como paga com sucesso!')
        await loadData()
      } else {
        alert('Erro ao marcar fatura como paga: ' + result.message)
      }
    } catch (error) {
      console.error('Erro ao marcar fatura como paga:', error)
      alert('Erro ao marcar fatura como paga.')
    } finally {
      setActionLoading(false)
    }
  }

  const filteredInvoices = invoices.filter(inv => {
    if (filter === 'pending') return inv.status === 'pending'
    if (filter === 'paid') return inv.status === 'paid'
    if (filter === 'overdue') return inv.status === 'pending' && new Date(inv.due_date) < new Date()
    return true
  })

  return (
    <DashboardLayout
      title="Gerenciamento de Faturas"
      subtitle="Visualize e gerencie todas as faturas de performance fee"
    >
      <div className="max-w-[1600px] w-full mx-auto px-4 sm:px-6 py-6">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-br from-[#00afaa] to-[#009a96] rounded-2xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90 mb-1">Total de Faturas</p>
                  <p className="text-3xl font-bold">{stats.totalInvoices}</p>
                  <p className="text-xs opacity-80 mt-1">
                    {formatCurrencyBR(stats.totalAmount)}
                  </p>
                </div>
                <Icon icon="lucide:file-text" className="text-4xl opacity-80" />
              </div>
            </div>
            <div className="bg-gradient-to-br from-[#f59e0b] to-[#d97706] rounded-2xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90 mb-1">Pendentes</p>
                  <p className="text-3xl font-bold">{stats.pendingInvoices}</p>
                  <p className="text-xs opacity-80 mt-1">
                    {formatCurrencyBR(stats.pendingAmount)}
                  </p>
                </div>
                <Icon icon="lucide:clock" className="text-4xl opacity-80" />
              </div>
            </div>
            <div className="bg-gradient-to-br from-[#ef4444] to-[#dc2626] rounded-2xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90 mb-1">Vencidas</p>
                  <p className="text-3xl font-bold">{stats.overdueInvoices}</p>
                  <p className="text-xs opacity-80 mt-1">
                    {formatCurrencyBR(stats.overdueAmount)}
                  </p>
                </div>
                <Icon icon="lucide:alert-triangle" className="text-4xl opacity-80" />
              </div>
            </div>
            <div className="bg-gradient-to-br from-[#10b981] to-[#059669] rounded-2xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90 mb-1">Pagas</p>
                  <p className="text-3xl font-bold">{stats.paidInvoices}</p>
                  <p className="text-xs opacity-80 mt-1">
                    {formatCurrencyBR(stats.paidAmount)}
                  </p>
                </div>
                <Icon icon="lucide:check-circle" className="text-4xl opacity-80" />
              </div>
            </div>
          </div>
        )}

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
            Pendentes ({stats?.pendingInvoices || 0})
          </button>
          <button
            onClick={() => setFilter('overdue')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filter === 'overdue'
                ? 'bg-[#ef4444] text-white shadow-md'
                : 'bg-white text-[#6b7280] border border-[#e5e7eb] hover:bg-[#f9fafb]'
            }`}
          >
            Vencidas ({stats?.overdueInvoices || 0})
          </button>
          <button
            onClick={() => setFilter('paid')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filter === 'paid'
                ? 'bg-[#10b981] text-white shadow-md'
                : 'bg-white text-[#6b7280] border border-[#e5e7eb] hover:bg-[#f9fafb]'
            }`}
          >
            Pagas ({stats?.paidInvoices || 0})
          </button>
        </div>

        {/* Tabela de Faturas */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#00afaa]"></div>
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="p-12 text-center text-[#6b7280] bg-white rounded-2xl shadow-sm">
            <Icon icon="lucide:inbox" className="text-5xl mx-auto mb-4 text-[#9ca3af]" />
            <p className="text-base font-medium">Nenhuma fatura encontrada.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-[#e5e7eb] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-[#fafafa] border-b border-[#e5e7eb]">
                    <th className="text-left px-6 py-4 text-xs font-semibold text-[#6b7280] uppercase tracking-wider">
                      Cliente
                    </th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-[#6b7280] uppercase tracking-wider">
                      Plano
                    </th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-[#6b7280] uppercase tracking-wider">
                      Fatura
                    </th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-[#6b7280] uppercase tracking-wider">
                      Valor
                    </th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-[#6b7280] uppercase tracking-wider">
                      Vencimento
                    </th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-[#6b7280] uppercase tracking-wider">
                      Status
                    </th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-[#6b7280] uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInvoices.map((inv) => {
                    const isOverdue = inv.status === 'pending' && new Date(inv.due_date) < new Date()
                    return (
                      <tr
                        key={inv.id}
                        className={`hover:bg-[#f9fafb] transition-colors border-b border-[#f3f4f6] ${
                          isOverdue ? 'bg-[#fef2f2]' : ''
                        }`}
                      >
                        <td className="px-6 py-4">
                          <div className="text-sm font-semibold text-[#111827]">
                            {inv.first_name} {inv.last_name}
                          </div>
                          <div className="text-xs text-[#6b7280]">{inv.email}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-[#f0fdf4] text-[#166534]">
                              {inv.plan_name || 'Nex Start'}
                            </span>
                            {inv.fee_percentage > 0 && (
                              <span className="text-xs text-[#6b7280]">
                                Taxa: {inv.fee_percentage}%
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-mono font-semibold text-[#111827]">
                            {inv.invoice_number}
                          </div>
                          <div className="text-xs text-[#6b7280] mt-1 truncate max-w-[200px]">
                            {inv.description || 'Performance Fee Semanal'}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1">
                            <div className="text-sm font-bold text-[#111827]">
                              {formatCurrencyBR(inv.amount)}
                            </div>
                            {inv.profit_amount > 0 && (
                              <div className="text-xs text-[#6b7280]">
                                Lucro: {formatCurrencyBR(inv.profit_amount)}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-[#111827]">
                            {new Date(inv.due_date).toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </div>
                          <div className="text-xs text-[#6b7280]">
                            {new Date(inv.due_date).toLocaleDateString('pt-BR', { weekday: 'long' })}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                              inv.status === 'paid'
                                ? 'bg-[#dcfce7] text-[#166534]'
                                : isOverdue
                                ? 'bg-[#fee2e2] text-[#991b1b]'
                                : 'bg-[#fef3c7] text-[#b45309]'
                            }`}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-current" />
                            {inv.status === 'paid' ? 'Pago' : isOverdue ? 'Vencida' : 'Pendente'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {inv.status === 'pending' && (
                            <button
                              onClick={() => handleMarkAsPaid(inv.id)}
                              disabled={actionLoading}
                              className="px-3 py-1.5 bg-[#10b981] text-white rounded-lg text-xs font-medium hover:bg-[#059669] transition-colors disabled:opacity-50 flex items-center gap-1"
                            >
                              <Icon icon="lucide:check" className="text-sm" />
                              Marcar Paga
                            </button>
                          )}
                          {inv.status === 'paid' && (
                            <span className="text-xs text-[#6b7280]">Paga</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

export default AdminInvoicesPage
