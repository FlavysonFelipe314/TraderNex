import { useEffect, useState } from 'react'
import { Icon } from '@iconify/react'
import DashboardLayout from '../components/DashboardLayout'
import { 
  getAllPlans,
  createPlan,
  updatePlan,
  deletePlan
} from '../services/adminService'

function AdminPlansPage() {
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingPlan, setEditingPlan] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    min_investment: '',
    max_investment: '',
    expected_return: '',
    duration_days: '',
    risk_level: 'Medium',
    is_active: true
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    document.body.classList.add('scroll-enabled')
    return () => {
      document.body.classList.remove('scroll-enabled')
    }
  }, [])

  useEffect(() => {
    loadPlans()
  }, [])

  const loadPlans = async () => {
    setLoading(true)
    try {
      const result = await getAllPlans()
      if (result.success) {
        setPlans(result.data || [])
      }
    } catch (error) {
      console.error('Erro ao carregar planos:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (plan) => {
    setEditingPlan(plan)
    setFormData({
      name: plan.name || '',
      description: plan.description || '',
      min_investment: plan.min_investment || '',
      max_investment: plan.max_investment || '',
      expected_return: plan.expected_return || '',
      duration_days: plan.duration_days || '',
      risk_level: plan.risk_level || 'Medium',
      is_active: plan.is_active !== undefined ? plan.is_active : true
    })
    setShowForm(true)
  }

  const handleNew = () => {
    setEditingPlan(null)
    setFormData({
      name: '',
      description: '',
      min_investment: '',
      max_investment: '',
      expected_return: '',
      duration_days: '',
      risk_level: 'Medium',
      is_active: true
    })
    setShowForm(true)
  }

  const handleSave = async () => {
    if (!formData.name || !formData.min_investment || !formData.expected_return) {
      alert('Preencha pelo menos: Nome, Investimento Mínimo e Retorno Esperado.')
      return
    }

    setSaving(true)
    try {
      let result
      if (editingPlan) {
        result = await updatePlan(editingPlan.id, formData)
      } else {
        result = await createPlan(formData)
      }

      if (result.success) {
        await loadPlans()
        setShowForm(false)
        setEditingPlan(null)
        alert(editingPlan ? 'Plano atualizado com sucesso!' : 'Plano criado com sucesso!')
      } else {
        alert('Erro: ' + (result.message || 'Erro desconhecido'))
      }
    } catch (error) {
      console.error('Erro ao salvar plano:', error)
      alert('Erro ao salvar plano.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (planId) => {
    if (!window.confirm('Tem certeza que deseja deletar este plano?')) {
      return
    }

    try {
      const result = await deletePlan(planId)
      if (result.success) {
        await loadPlans()
        alert('Plano deletado com sucesso!')
      } else {
        alert('Erro: ' + (result.message || 'Erro desconhecido'))
      }
    } catch (error) {
      console.error('Erro ao deletar plano:', error)
      alert('Erro ao deletar plano.')
    }
  }

  return (
    <DashboardLayout 
      title="Gerenciar Planos"
      subtitle="Configure os planos de investimento disponíveis"
    >
      <div className="max-w-[1400px] w-full mx-auto px-4 sm:px-6 py-6">
        {/* Botão Novo Plano */}
        <div className="mb-6 flex justify-end">
          <button
            onClick={handleNew}
            className="px-4 py-2 bg-gradient-to-r from-[#00afaa] to-[#009a96] text-white rounded-lg text-sm font-medium hover:from-[#009a96] hover:to-[#008882] transition-all shadow-md flex items-center gap-2"
          >
            <Icon icon="lucide:plus" className="text-sm" />
            Novo Plano
          </button>
        </div>

        {/* Lista de Planos */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#00afaa]"></div>
          </div>
        ) : plans.length === 0 ? (
          <div className="p-12 text-center text-[#6b7280] bg-white rounded-2xl shadow-sm">
            <Icon icon="lucide:package" className="text-5xl mx-auto mb-4 text-[#9ca3af]" />
            <p className="text-base font-medium">Nenhum plano cadastrado.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className="bg-white rounded-2xl shadow-sm border border-[#e5e7eb] p-6 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-[#111827] mb-1">
                      {plan.name}
                    </h3>
                    <p className="text-sm text-[#6b7280]">{plan.description || 'Sem descrição'}</p>
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                    plan.is_active 
                      ? 'bg-[#d1fae5] text-[#059669]' 
                      : 'bg-[#fee2e2] text-[#dc2626]'
                  }`}>
                    {plan.is_active ? 'Ativo' : 'Inativo'}
                  </div>
                </div>

                <div className="space-y-2 mb-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[#6b7280]">Investimento:</span>
                    <span className="font-semibold text-[#111827]">
                      ${parseFloat(plan.min_investment).toFixed(2)}
                      {plan.max_investment ? ` - $${parseFloat(plan.max_investment).toFixed(2)}` : '+'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#6b7280]">Retorno Esperado:</span>
                    <span className="font-semibold text-[#059669]">
                      {parseFloat(plan.expected_return).toFixed(2)}%
                    </span>
                  </div>
                  {plan.duration_days && (
                    <div className="flex justify-between">
                      <span className="text-[#6b7280]">Duração:</span>
                      <span className="font-semibold text-[#111827]">
                        {plan.duration_days} dias
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-[#6b7280]">Risco:</span>
                    <span className="font-semibold text-[#111827]">
                      {plan.risk_level === 'Low' ? 'Baixo' : plan.risk_level === 'Medium' ? 'Médio' : 'Alto'}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(plan)}
                    className="flex-1 px-3 py-2 bg-[#f3f4f6] hover:bg-[#e5e7eb] text-[#111827] rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1"
                  >
                    <Icon icon="lucide:edit" className="text-sm" />
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(plan.id)}
                    className="px-3 py-2 bg-[#fee2e2] hover:bg-[#fecaca] text-[#dc2626] rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1"
                  >
                    <Icon icon="lucide:trash-2" className="text-sm" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal de Formulário */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-[#e5e7eb] px-6 py-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-[#111827]">
                  {editingPlan ? 'Editar Plano' : 'Novo Plano'}
                </h2>
                <button
                  onClick={() => {
                    setShowForm(false)
                    setEditingPlan(null)
                  }}
                  className="text-[#6b7280] hover:text-[#111827]"
                >
                  <Icon icon="lucide:x" className="text-xl" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="text-sm font-medium text-[#111827] mb-2 block">
                    Nome do Plano *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-[#e5e7eb] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00afaa]"
                    placeholder="Ex: Nex Start"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-[#111827] mb-2 block">
                    Descrição
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-[#e5e7eb] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00afaa]"
                    rows="3"
                    placeholder="Descrição do plano..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-[#111827] mb-2 block">
                      Investimento Mínimo ($) *
                    </label>
                    <input
                      type="number"
                      value={formData.min_investment}
                      onChange={(e) => setFormData({ ...formData, min_investment: e.target.value })}
                      className="w-full px-3 py-2 border border-[#e5e7eb] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00afaa]"
                      placeholder="1000"
                      step="0.01"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-[#111827] mb-2 block">
                      Investimento Máximo ($)
                    </label>
                    <input
                      type="number"
                      value={formData.max_investment}
                      onChange={(e) => setFormData({ ...formData, max_investment: e.target.value || null })}
                      className="w-full px-3 py-2 border border-[#e5e7eb] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00afaa]"
                      placeholder="10000 (deixe vazio para ilimitado)"
                      step="0.01"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-[#111827] mb-2 block">
                      Retorno Esperado (%) *
                    </label>
                    <input
                      type="number"
                      value={formData.expected_return}
                      onChange={(e) => setFormData({ ...formData, expected_return: e.target.value })}
                      className="w-full px-3 py-2 border border-[#e5e7eb] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00afaa]"
                      placeholder="5.0"
                      step="0.01"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-[#111827] mb-2 block">
                      Duração (dias)
                    </label>
                    <input
                      type="number"
                      value={formData.duration_days}
                      onChange={(e) => setFormData({ ...formData, duration_days: e.target.value || null })}
                      className="w-full px-3 py-2 border border-[#e5e7eb] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00afaa]"
                      placeholder="30"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-[#111827] mb-2 block">
                      Nível de Risco
                    </label>
                    <select
                      value={formData.risk_level}
                      onChange={(e) => setFormData({ ...formData, risk_level: e.target.value })}
                      className="w-full px-3 py-2 border border-[#e5e7eb] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00afaa]"
                    >
                      <option value="Low">Baixo</option>
                      <option value="Medium">Médio</option>
                      <option value="High">Alto</option>
                    </select>
                  </div>
                  <div className="flex items-end">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.is_active}
                        onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                        className="w-4 h-4 text-[#00afaa] rounded focus:ring-2 focus:ring-[#00afaa]"
                      />
                      <span className="text-sm font-medium text-[#111827]">Plano Ativo</span>
                    </label>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex-1 px-4 py-2 bg-[#00afaa] text-white rounded-lg text-sm font-medium hover:bg-[#009a96] transition-colors disabled:opacity-50"
                  >
                    {saving ? 'Salvando...' : 'Salvar'}
                  </button>
                  <button
                    onClick={() => {
                      setShowForm(false)
                      setEditingPlan(null)
                    }}
                    className="px-4 py-2 bg-[#f3f4f6] text-[#111827] rounded-lg text-sm font-medium hover:bg-[#e5e7eb] transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

export default AdminPlansPage

