import { useEffect, useState } from 'react'
import { Icon } from '@iconify/react'
import DashboardLayout from '../components/DashboardLayout'
import { getAllUsers, deleteUser } from '../services/adminService'

function AdminUsersPage() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [deletingUserId, setDeletingUserId] = useState(null)
  const [filter, setFilter] = useState('all') // 'all', 'with-plan', 'without-plan'

  useEffect(() => {
    document.body.classList.add('scroll-enabled')
    return () => {
      document.body.classList.remove('scroll-enabled')
    }
  }, [])

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    setLoading(true)
    try {
      const result = await getAllUsers()
      if (result.success && result.data) {
        // getAllUsers retorna um array onde cada item é um objeto com informações do usuário
        // Cada objeto já contém: id, email, first_name, last_name, created_at, plan_name, has_mt4, has_myfxbook
        setUsers(result.data.map(user => ({
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          created_at: user.created_at,
          plan_name: user.plan_name,
          selected_plan_id: user.selected_plan_id,
          has_mt4: user.has_mt4 || false,
          has_myfxbook: user.has_myfxbook || false
        })))
      }
    } catch (error) {
      console.error('Erro ao carregar usuários:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (userId, userName) => {
    if (!window.confirm(`Tem certeza que deseja deletar o usuário "${userName}"?\n\nEsta ação não pode ser desfeita!`)) {
      return
    }

    setDeletingUserId(userId)
    try {
      const result = await deleteUser(userId)
      if (result.success) {
        await loadUsers()
        alert('Usuário deletado com sucesso!')
      } else {
        alert('Erro: ' + (result.message || 'Erro desconhecido'))
      }
    } catch (error) {
      console.error('Erro ao deletar usuário:', error)
      alert('Erro ao deletar usuário.')
    } finally {
      setDeletingUserId(null)
    }
  }

  const filteredUsers = users.filter(user => {
    if (filter === 'all') return true
    if (filter === 'with-plan') return user.plan_name
    if (filter === 'without-plan') return !user.plan_name
    return true
  })

  return (
    <DashboardLayout 
      title="Gerenciar Usuários"
      subtitle="Visualize e gerencie todos os usuários do sistema"
    >
      <div className="max-w-[1400px] w-full mx-auto px-4 sm:px-6 py-6">
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
            onClick={() => setFilter('with-plan')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filter === 'with-plan'
                ? 'bg-[#10b981] text-white shadow-md'
                : 'bg-white text-[#6b7280] border border-[#e5e7eb] hover:bg-[#f9fafb]'
            }`}
          >
            Com Plano
          </button>
          <button
            onClick={() => setFilter('without-plan')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filter === 'without-plan'
                ? 'bg-[#f59e0b] text-white shadow-md'
                : 'bg-white text-[#6b7280] border border-[#e5e7eb] hover:bg-[#f9fafb]'
            }`}
          >
            Sem Plano
          </button>
        </div>

        {/* Lista de Usuários */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#00afaa]"></div>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-12 text-center text-[#6b7280] bg-white rounded-2xl shadow-sm">
            <Icon icon="lucide:users" className="text-5xl mx-auto mb-4 text-[#9ca3af]" />
            <p className="text-base font-medium">Nenhum usuário encontrado.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredUsers.map((user) => (
              <div
                key={user.id}
                className="bg-white rounded-2xl shadow-sm border border-[#e5e7eb] p-6 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-[#111827] mb-1">
                      {user.first_name} {user.last_name}
                    </h3>
                    <p className="text-sm text-[#6b7280]">{user.email}</p>
                  </div>
                </div>

                <div className="space-y-2 mb-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[#6b7280]">Cadastrado em:</span>
                    <span className="font-semibold text-[#111827]">
                      {new Date(user.created_at).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#6b7280]">Plano:</span>
                    <span className={`font-semibold ${
                      user.plan_name ? 'text-[#059669]' : 'text-[#6b7280]'
                    }`}>
                      {user.plan_name || 'Nenhum'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#6b7280]">MT4:</span>
                    <span className={`font-semibold ${
                      user.has_mt4 ? 'text-[#3b82f6]' : 'text-[#6b7280]'
                    }`}>
                      {user.has_mt4 ? 'Configurado' : 'Não configurado'}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleDelete(user.id, `${user.first_name} ${user.last_name}`)}
                    disabled={deletingUserId === user.id}
                    className="flex-1 px-3 py-2 bg-[#fee2e2] hover:bg-[#fecaca] text-[#dc2626] rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1 disabled:opacity-50"
                  >
                    {deletingUserId === user.id ? (
                      <>
                        <div className="w-4 h-4 border-2 border-[#dc2626] border-t-transparent rounded-full animate-spin"></div>
                        Deletando...
                      </>
                    ) : (
                      <>
                        <Icon icon="lucide:trash-2" className="text-sm" />
                        Deletar
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

export default AdminUsersPage
