import { useEffect, useState } from 'react'
import { Icon } from '@iconify/react'
import DashboardLayout from '../components/DashboardLayout'
import { 
  getAllUsers,
  updateMyfxbookIntegrationLogin, 
  updateOperationalControls,
  setSystemMyfxbookConfig,
  getSystemMyfxbookConfig
} from '../services/adminService'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'

function AdminPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState(null)
  const [activeModal, setActiveModal] = useState(null) // 'mt4', 'controls', 'system-config'
  const [filter, setFilter] = useState('all') // 'all', 'with-mt4', 'without-mt4', 'with-myfxbook', 'without-myfxbook'
  
  // Estados para edição
  const [editingLogin, setEditingLogin] = useState('')
  const [editingAutomationEnabled, setEditingAutomationEnabled] = useState(true)
  const [editingRiskProfile, setEditingRiskProfile] = useState('moderado')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    document.body.classList.add('scroll-enabled')
    return () => {
      document.body.classList.remove('scroll-enabled')
    }
  }, [])

  useEffect(() => {
    loadUsers()
    loadSystemConfig()
  }, [])

  const loadSystemConfig = async () => {
    try {
      const result = await getSystemMyfxbookConfig()
      if (result.success) {
        setSystemConfig(result.data)
        if (result.data.configured) {
          setSystemEmail(result.data.email)
        } else {
          // Pré-preencher com as credenciais padrão da empresa
          setSystemEmail('contato@tradernex.com')
        }
      } else {
        // Pré-preencher com as credenciais padrão da empresa
        setSystemEmail('contato@tradernex.com')
      }
    } catch (error) {
      console.error('Erro ao carregar configuração do sistema:', error)
      // Pré-preencher com as credenciais padrão da empresa
      setSystemEmail('contato@tradernex.com')
    }
  }

  const handleSaveSystemConfig = async () => {
    if (!systemEmail || !systemPassword) {
      alert('Por favor, preencha email e senha.')
      return
    }
    
    setSaving(true)
    try {
      const result = await setSystemMyfxbookConfig(systemEmail, systemPassword)
      if (result.success) {
        alert('Credenciais padrão do sistema configuradas com sucesso!')
        await loadSystemConfig()
        setSystemPassword('')
        closeModal()
      } else {
        alert('Erro ao salvar: ' + (result.message || 'Erro desconhecido'))
      }
    } catch (error) {
      console.error('Erro ao salvar:', error)
      alert('Erro ao salvar credenciais padrão do sistema.')
    } finally {
      setSaving(false)
    }
  }

  const loadUsers = async () => {
    setLoading(true)
    try {
      const result = await getAllUsers()
      if (result.success) {
        setUsers(result.data || [])
      } else {
        console.error('Erro ao carregar usuários:', result.message)
        if (result.error?.status === 403) {
          navigate('/dashboard')
        }
      }
    } catch (error) {
      console.error('Erro ao carregar usuários:', error)
      if (error.response?.status === 403) {
        navigate('/dashboard')
      }
    } finally {
      setLoading(false)
    }
  }

  const openModal = (user, modalType) => {
    setSelectedUser(user)
    setActiveModal(modalType)
    
    if (modalType === 'system-config') {
      // Modal de configuração do sistema - não precisa de user
      return
    }
    
    if (!user) return
    
    if (modalType === 'mt4' && user.mt4_accounts && user.mt4_accounts.length > 0) {
      const firstAccount = user.mt4_accounts[0]
      setEditingLogin(firstAccount.myfxbook_integration_login || '')
    }
    
    if (modalType === 'controls' && user.mt4_accounts && user.mt4_accounts.length > 0) {
      const firstAccount = user.mt4_accounts[0]
      setEditingAutomationEnabled(firstAccount.automation_enabled !== undefined ? firstAccount.automation_enabled : true)
      setEditingRiskProfile(firstAccount.risk_profile || 'moderado')
    }
  }

  const closeModal = () => {
    setSelectedUser(null)
    setActiveModal(null)
    setEditingLogin('')
  }

  const handleSaveMyfxbookLogin = async () => {
    if (!selectedUser || !selectedUser.mt4_accounts || selectedUser.mt4_accounts.length === 0) {
      alert('Este usuário não possui conta MT4 cadastrada.')
      return
    }
    
    setSaving(true)
    try {
      const accountId = selectedUser.mt4_accounts[0].id
      const result = await updateMyfxbookIntegrationLogin(accountId, editingLogin)
      if (result.success) {
        await loadUsers()
        closeModal()
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


  const handleSaveControls = async () => {
    if (!selectedUser || !selectedUser.mt4_accounts || selectedUser.mt4_accounts.length === 0) {
      alert('Este usuário não possui conta MT4 cadastrada.')
      return
    }
    
    setSaving(true)
    try {
      const accountId = selectedUser.mt4_accounts[0].id
      const result = await updateOperationalControls(accountId, editingAutomationEnabled, editingRiskProfile)
      if (result.success) {
        await loadUsers()
        closeModal()
      } else {
        alert('Erro ao salvar: ' + (result.message || 'Erro desconhecido'))
      }
    } catch (error) {
      console.error('Erro ao salvar:', error)
      alert('Erro ao salvar controles operacionais.')
    } finally {
      setSaving(false)
    }
  }

  const filteredUsers = users.filter(user => {
    if (filter === 'all') return true
    if (filter === 'with-mt4') return user.has_mt4
    if (filter === 'without-mt4') return !user.has_mt4
    if (filter === 'with-myfxbook') return user.has_myfxbook
    if (filter === 'without-myfxbook') return !user.has_myfxbook
    return true
  })

  const stats = {
    total: users.length,
    with_mt4: users.filter(u => u.has_mt4).length,
    with_myfxbook: users.filter(u => u.has_myfxbook).length,
    without_mt4: users.filter(u => !u.has_mt4).length
  }

  return (
    <DashboardLayout 
      title="Painel Administrativo"
      subtitle="Gerencie usuários, contas MT4 e integrações MyFXBook"
    >
      <div className="max-w-[1600px] w-full mx-auto px-4 sm:px-6 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-br from-[#00afaa] to-[#009a96] rounded-2xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90 mb-1">Total de Usuários</p>
                <p className="text-3xl font-bold">{stats.total}</p>
              </div>
              <Icon icon="lucide:users" className="text-4xl opacity-80" />
            </div>
          </div>
          <div className="bg-gradient-to-br from-[#3b82f6] to-[#2563eb] rounded-2xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90 mb-1">Com MT4</p>
                <p className="text-3xl font-bold">{stats.with_mt4}</p>
              </div>
              <Icon icon="lucide:database" className="text-4xl opacity-80" />
            </div>
          </div>
          <div className="bg-gradient-to-br from-[#8b5cf6] to-[#7c3aed] rounded-2xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90 mb-1">Com MyFXBook</p>
                <p className="text-3xl font-bold">{stats.with_myfxbook}</p>
              </div>
              <Icon icon="lucide:bar-chart-3" className="text-4xl opacity-80" />
            </div>
          </div>
          <div className="bg-gradient-to-br from-[#ef4444] to-[#dc2626] rounded-2xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90 mb-1">Sem MT4</p>
                <p className="text-3xl font-bold">{stats.without_mt4}</p>
              </div>
              <Icon icon="lucide:alert-circle" className="text-4xl opacity-80" />
            </div>
          </div>
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
            Todos
          </button>
          <button
            onClick={() => setFilter('with-mt4')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filter === 'with-mt4'
                ? 'bg-[#3b82f6] text-white shadow-md'
                : 'bg-white text-[#6b7280] border border-[#e5e7eb] hover:bg-[#f9fafb]'
            }`}
          >
            Com MT4
          </button>
          <button
            onClick={() => setFilter('without-mt4')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filter === 'without-mt4'
                ? 'bg-[#ef4444] text-white shadow-md'
                : 'bg-white text-[#6b7280] border border-[#e5e7eb] hover:bg-[#f9fafb]'
            }`}
          >
            Sem MT4
          </button>
          <button
            onClick={() => setFilter('with-myfxbook')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filter === 'with-myfxbook'
                ? 'bg-[#8b5cf6] text-white shadow-md'
                : 'bg-white text-[#6b7280] border border-[#e5e7eb] hover:bg-[#f9fafb]'
            }`}
          >
            Com MyFXBook
          </button>
          <button
            onClick={() => setFilter('without-myfxbook')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filter === 'without-myfxbook'
                ? 'bg-[#f59e0b] text-white shadow-md'
                : 'bg-white text-[#6b7280] border border-[#e5e7eb] hover:bg-[#f9fafb]'
            }`}
          >
            Sem MyFXBook
          </button>
        </div>

        {/* Grid de Usuários */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#00afaa]"></div>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-12 text-center text-[#6b7280] bg-white rounded-2xl shadow-sm">
            <Icon icon="lucide:inbox" className="text-5xl mx-auto mb-4 text-[#9ca3af]" />
            <p className="text-base font-medium">Nenhum usuário encontrado.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredUsers.map((user) => (
              <div
                key={user.id}
                className="bg-white rounded-2xl shadow-sm border border-[#e5e7eb] p-6 hover:shadow-md transition-all"
              >
                {/* Header do Card */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-[#111827] mb-1">
                      {user.first_name} {user.last_name}
                    </h3>
                    <p className="text-sm text-[#6b7280]">{user.email}</p>
                  </div>
                  <div className="flex gap-2">
                    {user.has_mt4 && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-[#dbeafe] text-[#1e40af]">
                        <Icon icon="lucide:database" className="text-xs mr-1" />
                        MT4
                      </span>
                    )}
                    {user.has_myfxbook && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-[#ede9fe] text-[#6d28d9]">
                        <Icon icon="lucide:bar-chart-3" className="text-xs mr-1" />
                        MyFXBook
                      </span>
                    )}
                  </div>
                </div>

                {/* Status */}
                <div className="mb-4 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#6b7280]">Contas MT4:</span>
                    <span className="font-semibold text-[#111827]">
                      {user.mt4_count || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#6b7280]">MyFXBook:</span>
                    <span className={`font-semibold ${user.mt4_accounts && user.mt4_accounts.some(acc => acc.myfxbook_integration_login) ? 'text-[#10b981]' : 'text-[#ef4444]'}`}>
                      {user.mt4_accounts && user.mt4_accounts.some(acc => acc.myfxbook_integration_login) ? 'Configurado' : 'Não configurado'}
                    </span>
                  </div>
                </div>

                {/* Botões de Ação */}
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => openModal(user, 'mt4')}
                    className="flex-1 px-3 py-2 bg-[#f3f4f6] hover:bg-[#e5e7eb] text-[#111827] rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1"
                  >
                    <Icon icon="lucide:database" className="text-sm" />
                    MT4
                  </button>
                  {user.has_mt4 && (
                    <button
                      onClick={() => openModal(user, 'controls')}
                      className="flex-1 px-3 py-2 bg-[#f3f4f6] hover:bg-[#e5e7eb] text-[#111827] rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1"
                    >
                      <Icon icon="lucide:settings" className="text-sm" />
                      Controles
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal MT4 */}
        {activeModal === 'mt4' && selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-[#e5e7eb] px-6 py-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-[#111827]">
                  Contas MT4 - {selectedUser.first_name} {selectedUser.last_name}
                </h2>
                <button
                  onClick={closeModal}
                  className="text-[#6b7280] hover:text-[#111827] transition-colors"
                >
                  <Icon icon="lucide:x" className="text-2xl" />
                </button>
              </div>
              <div className="p-6">
                {selectedUser.mt4_accounts && selectedUser.mt4_accounts.length > 0 ? (
                  <div className="space-y-4">
                    {selectedUser.mt4_accounts.map((account, index) => (
                      <div key={account.id} className="border border-[#e5e7eb] rounded-xl p-4">
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div>
                            <label className="text-xs text-[#6b7280] mb-1 block">Número da Conta</label>
                            <p className="font-mono text-sm font-semibold text-[#111827]">{account.account_number}</p>
                          </div>
                          <div>
                            <label className="text-xs text-[#6b7280] mb-1 block">Corretora</label>
                            <p className="text-sm text-[#111827]">{account.broker || 'N/A'}</p>
                          </div>
                          <div>
                            <label className="text-xs text-[#6b7280] mb-1 block">Servidor</label>
                            <p className="text-sm text-[#111827]">{account.server || 'N/A'}</p>
                          </div>
                          <div>
                            <label className="text-xs text-[#6b7280] mb-1 block">Saldo</label>
                            <p className="text-sm font-semibold text-[#111827]">
                              {account.balance ? `$${parseFloat(account.balance).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'N/A'}
                            </p>
                          </div>
                        </div>
                        {index === 0 && (
                          <div className="mt-4 pt-4 border-t border-[#e5e7eb]">
                            <label className="text-sm font-medium text-[#111827] mb-2 block">
                              Account ID MyFXBook
                            </label>
                            <p className="text-xs text-[#6b7280] mb-2">
                              Informe o Account Number do MyFXBook (ex: 7739458, 34182616). O sistema usará as credenciais padrão configuradas.
                            </p>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={editingLogin}
                                onChange={(e) => setEditingLogin(e.target.value)}
                                placeholder="Ex: 7739458"
                                className="flex-1 px-3 py-2 border border-[#e5e7eb] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00afaa]"
                                disabled={saving}
                              />
                              <button
                                onClick={handleSaveMyfxbookLogin}
                                disabled={saving}
                                className="px-4 py-2 bg-[#00afaa] text-white rounded-lg text-sm font-medium hover:bg-[#009a96] transition-colors disabled:opacity-50"
                              >
                                {saving ? 'Salvando...' : 'Salvar'}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-[#6b7280]">
                    <Icon icon="lucide:database-off" className="text-4xl mx-auto mb-2 text-[#9ca3af]" />
                    <p>Este usuário não possui contas MT4 cadastradas.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}


        {/* Modal Configuração do Sistema */}
        {activeModal === 'system-config' && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
              <div className="sticky top-0 bg-white border-b border-[#e5e7eb] px-6 py-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-[#111827]">
                  Configurar Credenciais MyFXBook do Sistema
                </h2>
                <button
                  onClick={closeModal}
                  className="text-[#6b7280] hover:text-[#111827] transition-colors"
                >
                  <Icon icon="lucide:x" className="text-2xl" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="text-sm font-medium text-[#111827] mb-2 block">
                    Email MyFXBook do Sistema
                  </label>
                  <input
                    type="email"
                    value={systemEmail}
                    onChange={(e) => setSystemEmail(e.target.value)}
                    placeholder="email@myfxbook.com"
                    className="w-full px-3 py-2 border border-[#e5e7eb] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00afaa]"
                    disabled={saving}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-[#111827] mb-2 block">
                    Senha MyFXBook do Sistema
                  </label>
                  <input
                    type="password"
                    value={systemPassword}
                    onChange={(e) => setSystemPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3 py-2 border border-[#e5e7eb] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00afaa]"
                    disabled={saving}
                  />
                </div>
                {systemConfig && systemConfig.configured && (
                  <div className="mt-4 pt-4 border-t border-[#e5e7eb]">
                    <p className="text-xs text-[#6b7280]">
                      Configurado em: {new Date(systemConfig.updated_at).toLocaleString('pt-BR')}
                    </p>
                  </div>
                )}
                <button
                  onClick={handleSaveSystemConfig}
                  disabled={saving}
                  className="w-full px-4 py-2 bg-[#00afaa] text-white rounded-lg text-sm font-medium hover:bg-[#009a96] transition-colors disabled:opacity-50"
                >
                  {saving ? 'Salvando...' : 'Salvar Configuração'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Controles */}
        {activeModal === 'controls' && selectedUser && selectedUser.mt4_accounts && selectedUser.mt4_accounts.length > 0 && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
              <div className="sticky top-0 bg-white border-b border-[#e5e7eb] px-6 py-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-[#111827]">
                  Controles Operacionais - {selectedUser.first_name} {selectedUser.last_name}
                </h2>
                <button
                  onClick={closeModal}
                  className="text-[#6b7280] hover:text-[#111827] transition-colors"
                >
                  <Icon icon="lucide:x" className="text-2xl" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="text-sm font-medium text-[#111827] mb-2 block">
                    Conta: {selectedUser.mt4_accounts[0].account_number}
                  </label>
                </div>
                <div>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingAutomationEnabled}
                      onChange={(e) => setEditingAutomationEnabled(e.target.checked)}
                      className="w-5 h-5 text-[#00afaa] rounded focus:ring-[#00afaa]"
                      disabled={saving}
                    />
                    <span className="text-sm font-medium text-[#111827]">
                      Trading Automatizado
                    </span>
                  </label>
                </div>
                <div>
                  <label className="text-sm font-medium text-[#111827] mb-2 block">
                    Perfil de Risco
                  </label>
                  <select
                    value={editingRiskProfile}
                    onChange={(e) => setEditingRiskProfile(e.target.value)}
                    className="w-full px-3 py-2 border border-[#e5e7eb] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00afaa]"
                    disabled={saving}
                  >
                    <option value="conservador">Conservador</option>
                    <option value="moderado">Moderado</option>
                    <option value="agressivo">Agressivo</option>
                  </select>
                </div>
                <button
                  onClick={handleSaveControls}
                  disabled={saving}
                  className="w-full px-4 py-2 bg-[#00afaa] text-white rounded-lg text-sm font-medium hover:bg-[#009a96] transition-colors disabled:opacity-50"
                >
                  {saving ? 'Salvando...' : 'Salvar Controles'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

export default AdminPage
