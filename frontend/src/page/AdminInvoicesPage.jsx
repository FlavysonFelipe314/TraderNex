import { useEffect, useState } from 'react'
import { Icon } from '@iconify/react'
import DashboardLayout from '../components/DashboardLayout'
import {
  getAllInvoices,
  getInvoiceStats,
  markInvoiceAsPaidAdmin,
  getInvoiceSuggestion,
  createInvoiceManual,
  getAllUsers
} from '../services/adminService'
import { formatCurrencyBR } from '../utils/format'

function AdminInvoicesPage() {
  const [invoices, setInvoices] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // 'all', 'pending', 'paid', 'overdue'
  const [actionLoading, setActionLoading] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [users, setUsers] = useState([])
  const [selectedUserId, setSelectedUserId] = useState('')
  const [suggestion, setSuggestion] = useState(null)
  const [loadingSuggestion, setLoadingSuggestion] = useState(false)
  const [formData, setFormData] = useState({
    profit: '',
    amount: '',
    periodStart: '',
    periodEnd: '',
    description: ''
  })

  useEffect(() => {
    document.body.classList.add('scroll-enabled')
    return () => {
      document.body.classList.remove('scroll-enabled')
    }
  }, [])

  useEffect(() => {
    loadData()
    loadUsers()
  }, [filter])

  useEffect(() => {
    if (showCreateModal && selectedUserId) {
      loadSuggestion()
    }
  }, [selectedUserId, showCreateModal])

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

  const loadUsers = async () => {
    try {
      const result = await getAllUsers()
      if (result.success && result.data) {
        setUsers(result.data)
      }
    } catch (error) {
      console.error('Erro ao carregar usuários:', error)
    }
  }

  const loadSuggestion = async () => {
    if (!selectedUserId) return
    
    setLoadingSuggestion(true)
    try {
      const result = await getInvoiceSuggestion(selectedUserId, formData.periodStart || undefined, formData.periodEnd || undefined)
      if (result.success && result.data) {
        setSuggestion(result.data)
        setFormData(prev => ({
          ...prev,
          profit: result.data.weeklyProfit.toString(),
          amount: result.data.suggestedFee.toFixed(2),
          periodStart: result.data.periodStart.split('T')[0],
          periodEnd: result.data.periodEnd.split('T')[0],
          description: `Performance Fee Semanal - ${result.data.planName} - Período: ${new Date(result.data.periodStart).toLocaleDateString('pt-BR')} a ${new Date(result.data.periodEnd).toLocaleDateString('pt-BR')}`
        }))
      }
    } catch (error) {
      console.error('Erro ao buscar sugestão:', error)
    } finally {
      setLoadingSuggestion(false)
    }
  }

  const handleCreateInvoice = async () => {
    if (!selectedUserId || !formData.profit || !formData.amount) {
      alert('Preencha todos os campos obrigatórios')
      return
    }

    setActionLoading(true)
    try {
      const result = await createInvoiceManual({
        userId: selectedUserId,
        profit: parseFloat(formData.profit),
        amount: parseFloat(formData.amount),
        periodStart: formData.periodStart || undefined,
        periodEnd: formData.periodEnd || undefined,
        description: formData.description || undefined
      })
      
      if (result.success) {
        alert('Fatura criada com sucesso!')
        setShowCreateModal(false)
        setSelectedUserId('')
        setSuggestion(null)
        setFormData({
          profit: '',
          amount: '',
          periodStart: '',
          periodEnd: '',
          description: ''
        })
        await loadData()
      } else {
        alert('Erro ao criar fatura: ' + result.message)
      }
    } catch (error) {
      console.error('Erro ao criar fatura:', error)
      alert('Erro ao criar fatura.')
    } finally {
      setActionLoading(false)
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

        {/* Botão Criar Fatura Manual */}
        <div className="mb-6 flex justify-between items-center flex-wrap gap-4">
          <div className="flex flex-wrap gap-2">
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
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-[#00afaa] text-white rounded-lg text-sm font-medium hover:bg-[#009691] transition-colors flex items-center gap-2"
          >
            <Icon icon="lucide:plus" className="text-lg" />
            Criar Fatura Manual
          </button>
        </div>

        {/* Modal Criar Fatura Manual */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-[#e5e7eb]">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-[#111827]">Criar Fatura Manual</h2>
                  <button
                    onClick={() => {
                      setShowCreateModal(false)
                      setSelectedUserId('')
                      setSuggestion(null)
                      setFormData({
                        profit: '',
                        amount: '',
                        periodStart: '',
                        periodEnd: '',
                        description: ''
                      })
                    }}
                    className="text-[#6b7280] hover:text-[#111827] transition-colors"
                  >
                    <Icon icon="lucide:x" className="text-2xl" />
                  </button>
                </div>
              </div>
              
              <div className="p-6 space-y-4">
                {/* Selecionar Usuário */}
                <div>
                  <label className="block text-sm font-medium text-[#111827] mb-2">
                    Selecionar Cliente *
                  </label>
                  <select
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    className="w-full px-4 py-2 border border-[#e5e7eb] rounded-lg focus:ring-2 focus:ring-[#00afaa] focus:border-[#00afaa]"
                  >
                    <option value="">Selecione um cliente</option>
                    {users.map(user => (
                      <option key={user.id} value={user.id}>
                        {user.first_name} {user.last_name} ({user.email}) - {user.plan_name || 'Sem plano'}
                      </option>
                    ))}
                  </select>
                </div>

                {loadingSuggestion && (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#00afaa] mx-auto"></div>
                    <p className="text-sm text-[#6b7280] mt-2">Buscando sugestão de valor...</p>
                  </div>
                )}

                {suggestion && (
                  <div className="bg-[#f0fdf4] border border-[#86efac] rounded-lg p-4">
                    <p className="text-sm font-medium text-[#166534] mb-2">💡 Sugestão Baseada no Plano:</p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-[#6b7280]">Plano:</span>
                        <span className="ml-2 font-semibold text-[#111827]">{suggestion.planName}</span>
                      </div>
                      <div>
                        <span className="text-[#6b7280]">Taxa:</span>
                        <span className="ml-2 font-semibold text-[#111827]">{suggestion.feePercentage}%</span>
                      </div>
                      <div>
                        <span className="text-[#6b7280]">Lucro Semanal:</span>
                        <span className="ml-2 font-semibold text-[#111827]">{formatCurrencyBR(suggestion.weeklyProfit)}</span>
                      </div>
                      <div>
                        <span className="text-[#6b7280]">Valor Sugerido:</span>
                        <span className="ml-2 font-semibold text-[#00afaa]">{formatCurrencyBR(suggestion.suggestedFee)}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Período */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#111827] mb-2">
                      Data Início (Segunda)
                    </label>
                    <input
                      type="date"
                      value={formData.periodStart}
                      onChange={(e) => {
                        setFormData(prev => ({ ...prev, periodStart: e.target.value }))
                        if (selectedUserId) {
                          setTimeout(() => loadSuggestion(), 500)
                        }
                      }}
                      className="w-full px-4 py-2 border border-[#e5e7eb] rounded-lg focus:ring-2 focus:ring-[#00afaa] focus:border-[#00afaa]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#111827] mb-2">
                      Data Fim (Sexta)
                    </label>
                    <input
                      type="date"
                      value={formData.periodEnd}
                      onChange={(e) => {
                        setFormData(prev => ({ ...prev, periodEnd: e.target.value }))
                        if (selectedUserId) {
                          setTimeout(() => loadSuggestion(), 500)
                        }
                      }}
                      className="w-full px-4 py-2 border border-[#e5e7eb] rounded-lg focus:ring-2 focus:ring-[#00afaa] focus:border-[#00afaa]"
                    />
                  </div>
                </div>

                {/* Lucro */}
                <div>
                  <label className="block text-sm font-medium text-[#111827] mb-2">
                    Lucro Semanal *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.profit}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, profit: e.target.value }))
                      if (suggestion) {
                        const newProfit = parseFloat(e.target.value) || 0
                        const newAmount = (newProfit * suggestion.feePercentage) / 100
                        setFormData(prev => ({ ...prev, amount: newAmount.toFixed(2) }))
                      }
                    }}
                    className="w-full px-4 py-2 border border-[#e5e7eb] rounded-lg focus:ring-2 focus:ring-[#00afaa] focus:border-[#00afaa]"
                    placeholder="0.00"
                  />
                </div>

                {/* Valor da Fatura */}
                <div>
                  <label className="block text-sm font-medium text-[#111827] mb-2">
                    Valor da Fatura (Performance Fee) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                    className="w-full px-4 py-2 border border-[#e5e7eb] rounded-lg focus:ring-2 focus:ring-[#00afaa] focus:border-[#00afaa]"
                    placeholder="0.00"
                  />
                  {suggestion && (
                    <p className="text-xs text-[#6b7280] mt-1">
                      Valor sugerido: {formatCurrencyBR(suggestion.suggestedFee)}
                    </p>
                  )}
                </div>

                {/* Descrição */}
                <div>
                  <label className="block text-sm font-medium text-[#111827] mb-2">
                    Descrição
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-4 py-2 border border-[#e5e7eb] rounded-lg focus:ring-2 focus:ring-[#00afaa] focus:border-[#00afaa]"
                    rows="3"
                    placeholder="Descrição da fatura..."
                  />
                </div>
              </div>

              <div className="p-6 border-t border-[#e5e7eb] flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowCreateModal(false)
                    setSelectedUserId('')
                    setSuggestion(null)
                    setFormData({
                      profit: '',
                      amount: '',
                      periodStart: '',
                      periodEnd: '',
                      description: ''
                    })
                  }}
                  className="px-4 py-2 text-[#6b7280] hover:text-[#111827] transition-colors"
                  disabled={actionLoading}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreateInvoice}
                  disabled={actionLoading || !selectedUserId || !formData.profit || !formData.amount}
                  className="px-4 py-2 bg-[#00afaa] text-white rounded-lg font-medium hover:bg-[#009691] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {actionLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                      Criando...
                    </>
                  ) : (
                    <>
                      <Icon icon="lucide:check" className="text-lg" />
                      Criar Fatura
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

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
