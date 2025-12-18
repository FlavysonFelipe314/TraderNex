import { useEffect, useState } from 'react'
import { Icon } from '@iconify/react'
import DashboardLayout from '../components/DashboardLayout'
import { getAllMT4Accounts, updateMyfxbookIntegrationLogin, updateMyfxbookPassword } from '../services/adminService'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'

function AdminPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [mt4Accounts, setMt4Accounts] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingAccountId, setEditingAccountId] = useState(null)
  const [editingLogin, setEditingLogin] = useState('')
  const [editingPasswordUserId, setEditingPasswordUserId] = useState(null)
  const [editingPassword, setEditingPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
  const [activeTab, setActiveTab] = useState('mt4-accounts')

  useEffect(() => {
    document.body.classList.add('scroll-enabled')
    return () => {
      document.body.classList.remove('scroll-enabled')
    }
  }, [])

  // Verificar se é admin (simplificado - você pode melhorar isso)
  useEffect(() => {
    // Aqui você pode verificar se o usuário é admin
    // Por enquanto, vamos apenas carregar os dados
    loadMT4Accounts()
  }, [])

  const loadMT4Accounts = async () => {
    setLoading(true)
    try {
      const result = await getAllMT4Accounts()
      if (result.success) {
        setMt4Accounts(result.data || [])
      } else {
        console.error('Erro ao carregar contas MT4:', result.message)
        // Se não for admin, redirecionar
        if (result.error?.status === 403) {
          navigate('/dashboard')
        }
      }
    } catch (error) {
      console.error('Erro ao carregar contas MT4:', error)
      if (error.response?.status === 403) {
        navigate('/dashboard')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleEditClick = (account) => {
    setEditingAccountId(account.id)
    setEditingLogin(account.myfxbook_integration_login || '')
  }

  const handleCancelEdit = () => {
    setEditingAccountId(null)
    setEditingLogin('')
  }

  const handleSave = async (accountId) => {
    setSaving(true)
    try {
      const result = await updateMyfxbookIntegrationLogin(accountId, editingLogin)
      if (result.success) {
        // Atualizar a lista
        await loadMT4Accounts()
        setEditingAccountId(null)
        setEditingLogin('')
      } else {
        alert('Erro ao salvar: ' + (result.message || 'Erro desconhecido'))
      }
    } catch (error) {
      console.error('Erro ao salvar:', error)
      alert('Erro ao salvar login de integração MyFXBook.')
    } finally {
      setSaving(false)
    }
  }

  const handleEditPasswordClick = (account) => {
    setEditingPasswordUserId(account.user_id)
    setEditingPassword('')
  }

  const handleCancelPasswordEdit = () => {
    setEditingPasswordUserId(null)
    setEditingPassword('')
  }

  const handleSavePassword = async (userId) => {
    if (!editingPassword) {
      alert('Por favor, digite a senha MyFXBook.')
      return
    }

    setSavingPassword(true)
    try {
      const result = await updateMyfxbookPassword(userId, editingPassword)
      if (result.success) {
        alert('Senha MyFXBook salva com sucesso!')
        setEditingPasswordUserId(null)
        setEditingPassword('')
      } else {
        alert('Erro ao salvar: ' + (result.message || 'Erro desconhecido'))
      }
    } catch (error) {
      console.error('Erro ao salvar senha:', error)
      alert('Erro ao salvar senha MyFXBook.')
    } finally {
      setSavingPassword(false)
    }
  }

  return (
    <DashboardLayout 
      title="Painel Administrativo"
      subtitle="Gerencie contas MT4 e integrações MyFXBook"
    >
      <div className="max-w-[1400px] w-full mx-auto">
        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-[#e5e7eb]">
          <button
            onClick={() => setActiveTab('mt4-accounts')}
            className={`px-4 py-2 font-semibold text-sm transition-colors ${
              activeTab === 'mt4-accounts'
                ? 'text-[#00afaa] border-b-2 border-[#00afaa]'
                : 'text-[#6b7280] hover:text-[#111827]'
            }`}
          >
            Contas MT4
          </button>
        </div>

        {/* Conteúdo */}
        {activeTab === 'mt4-accounts' && (
          <div className="bg-white rounded-xl sm:rounded-2xl border border-[#e5e7eb] shadow-[0_4px_6px_-1px_rgba(0,0,0,0.02),0_10px_15px_-3px_rgba(0,0,0,0.03)] overflow-hidden">
            <div className="px-4 sm:px-7 py-4 sm:py-6 border-b border-[#f3f4f6] flex justify-between items-center">
              <div className="flex items-center gap-3.5">
                <div className="w-9 h-9 bg-[#f9fafb] rounded-[10px] flex items-center justify-center text-[#6b7280]">
                  <Icon icon="lucide:database" className="text-lg" />
                </div>
                <h3 className="text-base font-bold text-[#111827] m-0">Contas MT4 de Todos os Usuários</h3>
              </div>
            </div>

            {loading ? (
              <div className="p-8 text-center text-[#6b7280]">
                Carregando contas MT4...
              </div>
            ) : mt4Accounts.length === 0 ? (
              <div className="p-8 text-center text-[#6b7280]">
                Nenhuma conta MT4 encontrada.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-[#f3f4f6]">
                    <tr>
                      <th className="px-4 py-3 text-left text-[#6b7280] font-semibold">Usuário</th>
                      <th className="px-4 py-3 text-left text-[#6b7280] font-semibold">Login MT4</th>
                      <th className="px-4 py-3 text-left text-[#6b7280] font-semibold">Corretora</th>
                      <th className="px-4 py-3 text-left text-[#6b7280] font-semibold">Servidor</th>
                      <th className="px-4 py-3 text-left text-[#6b7280] font-semibold">Saldo</th>
                      <th className="px-4 py-3 text-left text-[#6b7280] font-semibold">Trading Auto</th>
                      <th className="px-4 py-3 text-left text-[#6b7280] font-semibold">Perfil Risco</th>
                      <th className="px-4 py-3 text-left text-[#6b7280] font-semibold">Login MyFXBook</th>
                      <th className="px-4 py-3 text-left text-[#6b7280] font-semibold">Senha MyFXBook</th>
                      <th className="px-4 py-3 text-left text-[#6b7280] font-semibold">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f3f4f6]">
                    {mt4Accounts.map((account) => (
                      <tr key={account.id} className="hover:bg-[#f9fafb]">
                        <td className="px-4 py-3">
                          <div className="flex flex-col">
                            <span className="font-medium text-[#111827]">
                              {account.first_name} {account.last_name}
                            </span>
                            <span className="text-xs text-[#6b7280]">{account.email}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-mono text-[#111827]">
                          {account.account_number}
                        </td>
                        <td className="px-4 py-3 text-[#111827]">
                          {account.broker || 'N/A'}
                        </td>
                        <td className="px-4 py-3 text-[#111827]">
                          {account.server || 'N/A'}
                        </td>
                        <td className="px-4 py-3 text-[#111827]">
                          ${account.balance ? parseFloat(account.balance).toFixed(2) : '0.00'}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            account.automation_enabled 
                              ? 'bg-[#d1fae5] text-[#065f46]' 
                              : 'bg-[#fee2e2] text-[#991b1b]'
                          }`}>
                            {account.automation_enabled ? 'Ativo' : 'Inativo'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-1 rounded text-xs font-medium bg-[#f3f4f6] text-[#374151]">
                            {account.risk_profile || 'N/A'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {editingAccountId === account.id ? (
                            <input
                              type="text"
                              value={editingLogin}
                              onChange={(e) => setEditingLogin(e.target.value)}
                              placeholder="Login MyFXBook"
                              className="w-full px-2 py-1 border border-[#e5e7eb] rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#00afaa] focus:border-transparent"
                              disabled={saving}
                            />
                          ) : (
                            <span className="text-[#111827] font-mono">
                              {account.myfxbook_integration_login || (
                                <span className="text-[#9ca3af] italic">Não configurado</span>
                              )}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {editingPasswordUserId === account.user_id ? (
                            <input
                              type="password"
                              value={editingPassword}
                              onChange={(e) => setEditingPassword(e.target.value)}
                              placeholder="Senha MyFXBook"
                              className="w-full px-2 py-1 border border-[#e5e7eb] rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#00afaa] focus:border-transparent"
                              disabled={savingPassword}
                            />
                          ) : (
                            <span className="text-[#111827]">
                              <span className="text-[#9ca3af] italic">••••••••</span>
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {editingAccountId === account.id || editingPasswordUserId === account.user_id ? (
                            <div className="flex flex-col gap-2">
                              {editingAccountId === account.id && (
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleSave(account.id)}
                                    disabled={saving}
                                    className="px-3 py-1 bg-[#00afaa] text-white rounded text-xs font-semibold hover:bg-[#009a96] transition-colors disabled:opacity-50"
                                  >
                                    {saving ? 'Salvando...' : 'Salvar Login'}
                                  </button>
                                  <button
                                    onClick={handleCancelEdit}
                                    disabled={saving}
                                    className="px-3 py-1 bg-white border border-[#e5e7eb] text-[#6b7280] rounded text-xs font-semibold hover:bg-[#f9fafb] transition-colors disabled:opacity-50"
                                  >
                                    Cancelar
                                  </button>
                                </div>
                              )}
                              {editingPasswordUserId === account.user_id && (
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleSavePassword(account.user_id)}
                                    disabled={savingPassword}
                                    className="px-3 py-1 bg-[#3b82f6] text-white rounded text-xs font-semibold hover:bg-[#2563eb] transition-colors disabled:opacity-50"
                                  >
                                    {savingPassword ? 'Salvando...' : 'Salvar Senha'}
                                  </button>
                                  <button
                                    onClick={handleCancelPasswordEdit}
                                    disabled={savingPassword}
                                    className="px-3 py-1 bg-white border border-[#e5e7eb] text-[#6b7280] rounded text-xs font-semibold hover:bg-[#f9fafb] transition-colors disabled:opacity-50"
                                  >
                                    Cancelar
                                  </button>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="flex flex-col gap-1">
                              <button
                                onClick={() => handleEditClick(account)}
                                className="px-3 py-1 bg-[#f9fafb] border border-[#e5e7eb] text-[#6b7280] rounded text-xs font-semibold hover:bg-[#f3f4f6] transition-colors flex items-center gap-1"
                              >
                                <Icon icon="lucide:edit" className="text-xs" />
                                Editar Login
                              </button>
                              <button
                                onClick={() => handleEditPasswordClick(account)}
                                className="px-3 py-1 bg-[#f9fafb] border border-[#e5e7eb] text-[#6b7280] rounded text-xs font-semibold hover:bg-[#f3f4f6] transition-colors flex items-center gap-1"
                              >
                                <Icon icon="lucide:key" className="text-xs" />
                                Editar Senha
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

export default AdminPage

