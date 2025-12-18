import { useEffect, useState } from 'react'
import { Icon } from '@iconify/react'
import DashboardLayout from '../components/DashboardLayout'
import { 
  getAllMT4Accounts, 
  updateMyfxbookIntegrationLogin, 
  updateMyfxbookPassword,
  updateMyfxbookEmail,
  updateOperationalControls
} from '../services/adminService'
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
  const [editingEmailUserId, setEditingEmailUserId] = useState(null)
  const [editingEmail, setEditingEmail] = useState('')
  const [editingControlsAccountId, setEditingControlsAccountId] = useState(null)
  const [editingAutomationEnabled, setEditingAutomationEnabled] = useState(true)
  const [editingRiskProfile, setEditingRiskProfile] = useState('moderado')
  const [saving, setSaving] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
  const [savingEmail, setSavingEmail] = useState(false)
  const [savingControls, setSavingControls] = useState(false)
  const [activeTab, setActiveTab] = useState('mt4-accounts')

  useEffect(() => {
    document.body.classList.add('scroll-enabled')
    return () => {
      document.body.classList.remove('scroll-enabled')
    }
  }, [])

  useEffect(() => {
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

  const handleEditEmailClick = (account) => {
    setEditingEmailUserId(account.user_id)
    setEditingEmail('')
  }

  const handleCancelEmailEdit = () => {
    setEditingEmailUserId(null)
    setEditingEmail('')
  }

  const handleSaveEmail = async (userId) => {
    if (!editingEmail) {
      alert('Por favor, digite o email MyFXBook.')
      return
    }

    setSavingEmail(true)
    try {
      const result = await updateMyfxbookEmail(userId, editingEmail)
      if (result.success) {
        alert('Email MyFXBook salvo com sucesso!')
        setEditingEmailUserId(null)
        setEditingEmail('')
      } else {
        alert('Erro ao salvar: ' + (result.message || 'Erro desconhecido'))
      }
    } catch (error) {
      console.error('Erro ao salvar email:', error)
      alert('Erro ao salvar email MyFXBook.')
    } finally {
      setSavingEmail(false)
    }
  }

  const handleEditControlsClick = (account) => {
    setEditingControlsAccountId(account.id)
    setEditingAutomationEnabled(account.automation_enabled !== undefined ? account.automation_enabled : true)
    setEditingRiskProfile(account.risk_profile || 'moderado')
  }

  const handleCancelControlsEdit = () => {
    setEditingControlsAccountId(null)
    setEditingAutomationEnabled(true)
    setEditingRiskProfile('moderado')
  }

  const handleSaveControls = async (accountId) => {
    setSavingControls(true)
    try {
      const result = await updateOperationalControls(accountId, editingAutomationEnabled, editingRiskProfile)
      if (result.success) {
        alert('Controles operacionais salvos com sucesso!')
        await loadMT4Accounts()
        setEditingControlsAccountId(null)
      } else {
        alert('Erro ao salvar: ' + (result.message || 'Erro desconhecido'))
      }
    } catch (error) {
      console.error('Erro ao salvar controles:', error)
      alert('Erro ao salvar controles operacionais.')
    } finally {
      setSavingControls(false)
    }
  }

  return (
    <DashboardLayout 
      title="Painel Administrativo"
      subtitle="Gerencie contas MT4, integrações MyFXBook e controles operacionais"
    >
      <div className="max-w-[1600px] w-full mx-auto px-4 sm:px-6">
        {/* Header Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gradient-to-br from-[#00afaa] to-[#009a96] rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90 mb-1">Total de Contas</p>
                <p className="text-3xl font-bold">{mt4Accounts.length}</p>
              </div>
              <Icon icon="lucide:database" className="text-4xl opacity-80" />
            </div>
          </div>
          <div className="bg-gradient-to-br from-[#3b82f6] to-[#2563eb] rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90 mb-1">Contas Ativas</p>
                <p className="text-3xl font-bold">
                  {mt4Accounts.filter(a => a.automation_enabled).length}
                </p>
              </div>
              <Icon icon="lucide:activity" className="text-4xl opacity-80" />
            </div>
          </div>
          <div className="bg-gradient-to-br from-[#8b5cf6] to-[#7c3aed] rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90 mb-1">MyFXBook Configurado</p>
                <p className="text-3xl font-bold">
                  {mt4Accounts.filter(a => a.myfxbook_integration_login).length}
                </p>
              </div>
              <Icon icon="lucide:bar-chart-3" className="text-4xl opacity-80" />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-[#e5e7eb]">
          <button
            onClick={() => setActiveTab('mt4-accounts')}
            className={`px-6 py-3 font-semibold text-sm transition-colors relative ${
              activeTab === 'mt4-accounts'
                ? 'text-[#00afaa]'
                : 'text-[#6b7280] hover:text-[#111827]'
            }`}
          >
            Contas MT4
            {activeTab === 'mt4-accounts' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#00afaa] rounded-t-full" />
            )}
          </button>
        </div>

        {/* Conteúdo */}
        {activeTab === 'mt4-accounts' && (
          <div className="bg-white rounded-xl sm:rounded-2xl border border-[#e5e7eb] shadow-lg overflow-hidden">
            <div className="px-6 py-5 border-b border-[#f3f4f6] bg-gradient-to-r from-[#f9fafb] to-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 bg-gradient-to-br from-[#00afaa] to-[#009a96] rounded-xl flex items-center justify-center text-white shadow-md">
                    <Icon icon="lucide:database" className="text-xl" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-[#111827] m-0">Contas MT4 de Todos os Usuários</h3>
                    <p className="text-sm text-[#6b7280] m-0 mt-0.5">Gerencie credenciais, MyFXBook e controles operacionais</p>
                  </div>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="p-12 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-[#00afaa] border-t-transparent"></div>
                <p className="text-[#6b7280] text-sm mt-4">Carregando contas MT4...</p>
              </div>
            ) : mt4Accounts.length === 0 ? (
              <div className="p-12 text-center text-[#6b7280]">
                <Icon icon="lucide:inbox" className="text-5xl mx-auto mb-4 text-[#9ca3af]" />
                <p className="text-base font-medium">Nenhuma conta MT4 encontrada.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gradient-to-r from-[#f9fafb] to-[#f3f4f6]">
                    <tr>
                      <th className="px-6 py-4 text-left text-[#6b7280] font-semibold text-xs uppercase tracking-wider">Usuário</th>
                      <th className="px-6 py-4 text-left text-[#6b7280] font-semibold text-xs uppercase tracking-wider">Login MT4</th>
                      <th className="px-6 py-4 text-left text-[#6b7280] font-semibold text-xs uppercase tracking-wider">Corretora</th>
                      <th className="px-6 py-4 text-left text-[#6b7280] font-semibold text-xs uppercase tracking-wider">Servidor</th>
                      <th className="px-6 py-4 text-left text-[#6b7280] font-semibold text-xs uppercase tracking-wider">Saldo</th>
                      <th className="px-6 py-4 text-left text-[#6b7280] font-semibold text-xs uppercase tracking-wider">Trading Auto</th>
                      <th className="px-6 py-4 text-left text-[#6b7280] font-semibold text-xs uppercase tracking-wider">Perfil Risco</th>
                      <th className="px-6 py-4 text-left text-[#6b7280] font-semibold text-xs uppercase tracking-wider">MyFXBook</th>
                      <th className="px-6 py-4 text-left text-[#6b7280] font-semibold text-xs uppercase tracking-wider">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f3f4f6]">
                    {mt4Accounts.map((account) => (
                      <tr key={account.id} className="hover:bg-[#f9fafb] transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="font-semibold text-[#111827]">
                              {account.first_name} {account.last_name}
                            </span>
                            <span className="text-xs text-[#6b7280] mt-0.5">{account.email}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-mono text-[#111827] font-medium bg-[#f9fafb] px-2 py-1 rounded text-xs">
                            {account.account_number}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-[#111827] font-medium">
                          {account.broker || <span className="text-[#9ca3af]">N/A</span>}
                        </td>
                        <td className="px-6 py-4 text-[#111827] font-medium">
                          {account.server || <span className="text-[#9ca3af]">N/A</span>}
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-semibold text-[#111827]">
                            ${account.balance ? parseFloat(account.balance).toFixed(2) : '0.00'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {editingControlsAccountId === account.id ? (
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={editingAutomationEnabled}
                                onChange={(e) => setEditingAutomationEnabled(e.target.checked)}
                                className="w-4 h-4 text-[#00afaa] rounded focus:ring-[#00afaa]"
                              />
                              <span className="text-xs text-[#6b7280]">
                                {editingAutomationEnabled ? 'Ativo' : 'Inativo'}
                              </span>
                            </label>
                          ) : (
                            <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
                              account.automation_enabled 
                                ? 'bg-[#d1fae5] text-[#065f46]' 
                                : 'bg-[#fee2e2] text-[#991b1b]'
                            }`}>
                              {account.automation_enabled ? 'Ativo' : 'Inativo'}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {editingControlsAccountId === account.id ? (
                            <select
                              value={editingRiskProfile}
                              onChange={(e) => setEditingRiskProfile(e.target.value)}
                              className="px-2 py-1 border border-[#e5e7eb] rounded text-xs focus:outline-none focus:ring-2 focus:ring-[#00afaa]"
                            >
                              <option value="conservador">Conservador</option>
                              <option value="moderado">Moderado</option>
                              <option value="agressivo">Agressivo</option>
                            </select>
                          ) : (
                            <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-[#f3f4f6] text-[#374151] capitalize">
                              {account.risk_profile || 'N/A'}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1.5">
                            <div className="text-xs text-[#6b7280]">Login:</div>
                            {editingAccountId === account.id ? (
                              <input
                                type="text"
                                value={editingLogin}
                                onChange={(e) => setEditingLogin(e.target.value)}
                                placeholder="Login MyFXBook"
                                className="w-full px-2 py-1 border border-[#e5e7eb] rounded text-xs focus:outline-none focus:ring-2 focus:ring-[#00afaa]"
                                disabled={saving}
                              />
                            ) : (
                              <span className="text-[#111827] font-mono text-xs">
                                {account.myfxbook_integration_login || (
                                  <span className="text-[#9ca3af] italic">Não configurado</span>
                                )}
                              </span>
                            )}
                            <div className="text-xs text-[#6b7280] mt-1">Email:</div>
                            {editingEmailUserId === account.user_id ? (
                              <input
                                type="email"
                                value={editingEmail}
                                onChange={(e) => setEditingEmail(e.target.value)}
                                placeholder="Email MyFXBook"
                                className="w-full px-2 py-1 border border-[#e5e7eb] rounded text-xs focus:outline-none focus:ring-2 focus:ring-[#00afaa]"
                                disabled={savingEmail}
                              />
                            ) : (
                              <span className="text-[#111827] text-xs">
                                <span className="text-[#9ca3af] italic">••••••••</span>
                              </span>
                            )}
                            <div className="text-xs text-[#6b7280] mt-1">Senha:</div>
                            {editingPasswordUserId === account.user_id ? (
                              <input
                                type="password"
                                value={editingPassword}
                                onChange={(e) => setEditingPassword(e.target.value)}
                                placeholder="Senha MyFXBook"
                                className="w-full px-2 py-1 border border-[#e5e7eb] rounded text-xs focus:outline-none focus:ring-2 focus:ring-[#00afaa]"
                                disabled={savingPassword}
                              />
                            ) : (
                              <span className="text-[#111827] text-xs">
                                <span className="text-[#9ca3af] italic">••••••••</span>
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {editingAccountId === account.id || editingEmailUserId === account.user_id || editingPasswordUserId === account.user_id || editingControlsAccountId === account.id ? (
                            <div className="flex flex-col gap-2">
                              {editingAccountId === account.id && (
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleSave(account.id)}
                                    disabled={saving}
                                    className="px-3 py-1.5 bg-[#00afaa] text-white rounded-lg text-xs font-semibold hover:bg-[#009a96] transition-colors disabled:opacity-50 flex items-center gap-1"
                                  >
                                    {saving ? 'Salvando...' : <><Icon icon="lucide:check" className="text-xs" /> Salvar</>}
                                  </button>
                                  <button
                                    onClick={handleCancelEdit}
                                    disabled={saving}
                                    className="px-3 py-1.5 bg-white border border-[#e5e7eb] text-[#6b7280] rounded-lg text-xs font-semibold hover:bg-[#f9fafb] transition-colors disabled:opacity-50"
                                  >
                                    Cancelar
                                  </button>
                                </div>
                              )}
                              {editingEmailUserId === account.user_id && (
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleSaveEmail(account.user_id)}
                                    disabled={savingEmail}
                                    className="px-3 py-1.5 bg-[#3b82f6] text-white rounded-lg text-xs font-semibold hover:bg-[#2563eb] transition-colors disabled:opacity-50 flex items-center gap-1"
                                  >
                                    {savingEmail ? 'Salvando...' : <><Icon icon="lucide:check" className="text-xs" /> Salvar</>}
                                  </button>
                                  <button
                                    onClick={handleCancelEmailEdit}
                                    disabled={savingEmail}
                                    className="px-3 py-1.5 bg-white border border-[#e5e7eb] text-[#6b7280] rounded-lg text-xs font-semibold hover:bg-[#f9fafb] transition-colors disabled:opacity-50"
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
                                    className="px-3 py-1.5 bg-[#8b5cf6] text-white rounded-lg text-xs font-semibold hover:bg-[#7c3aed] transition-colors disabled:opacity-50 flex items-center gap-1"
                                  >
                                    {savingPassword ? 'Salvando...' : <><Icon icon="lucide:check" className="text-xs" /> Salvar</>}
                                  </button>
                                  <button
                                    onClick={handleCancelPasswordEdit}
                                    disabled={savingPassword}
                                    className="px-3 py-1.5 bg-white border border-[#e5e7eb] text-[#6b7280] rounded-lg text-xs font-semibold hover:bg-[#f9fafb] transition-colors disabled:opacity-50"
                                  >
                                    Cancelar
                                  </button>
                                </div>
                              )}
                              {editingControlsAccountId === account.id && (
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleSaveControls(account.id)}
                                    disabled={savingControls}
                                    className="px-3 py-1.5 bg-[#10b981] text-white rounded-lg text-xs font-semibold hover:bg-[#059669] transition-colors disabled:opacity-50 flex items-center gap-1"
                                  >
                                    {savingControls ? 'Salvando...' : <><Icon icon="lucide:check" className="text-xs" /> Salvar</>}
                                  </button>
                                  <button
                                    onClick={handleCancelControlsEdit}
                                    disabled={savingControls}
                                    className="px-3 py-1.5 bg-white border border-[#e5e7eb] text-[#6b7280] rounded-lg text-xs font-semibold hover:bg-[#f9fafb] transition-colors disabled:opacity-50"
                                  >
                                    Cancelar
                                  </button>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="flex flex-col gap-1.5">
                              <button
                                onClick={() => handleEditClick(account)}
                                className="px-3 py-1.5 bg-[#f9fafb] border border-[#e5e7eb] text-[#6b7280] rounded-lg text-xs font-semibold hover:bg-[#f3f4f6] transition-colors flex items-center gap-1"
                              >
                                <Icon icon="lucide:edit" className="text-xs" />
                                Login
                              </button>
                              <button
                                onClick={() => handleEditEmailClick(account)}
                                className="px-3 py-1.5 bg-[#f9fafb] border border-[#e5e7eb] text-[#6b7280] rounded-lg text-xs font-semibold hover:bg-[#f3f4f6] transition-colors flex items-center gap-1"
                              >
                                <Icon icon="lucide:mail" className="text-xs" />
                                Email
                              </button>
                              <button
                                onClick={() => handleEditPasswordClick(account)}
                                className="px-3 py-1.5 bg-[#f9fafb] border border-[#e5e7eb] text-[#6b7280] rounded-lg text-xs font-semibold hover:bg-[#f3f4f6] transition-colors flex items-center gap-1"
                              >
                                <Icon icon="lucide:key" className="text-xs" />
                                Senha
                              </button>
                              <button
                                onClick={() => handleEditControlsClick(account)}
                                className="px-3 py-1.5 bg-[#f9fafb] border border-[#e5e7eb] text-[#6b7280] rounded-lg text-xs font-semibold hover:bg-[#f3f4f6] transition-colors flex items-center gap-1"
                              >
                                <Icon icon="lucide:settings" className="text-xs" />
                                Controles
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
