import { useEffect, useState } from 'react'
import { Icon } from '@iconify/react'
import DashboardLayout from '../components/DashboardLayout'
import { getCryptoInterested, markCryptoInterestedAsNotified } from '../services/adminService'

function AdminCryptoInterestedPage() {
  const [interested, setInterested] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // 'all', 'notified', 'not-notified'
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, totalPages: 0 })
  const [notifyingId, setNotifyingId] = useState(null)

  useEffect(() => {
    document.body.classList.add('scroll-enabled')
    return () => {
      document.body.classList.remove('scroll-enabled')
    }
  }, [])

  useEffect(() => {
    loadInterested()
  }, [filter, pagination.page])

  const loadInterested = async () => {
    setLoading(true)
    try {
      const notified = filter === 'all' ? null : filter === 'notified'
      const result = await getCryptoInterested(pagination.page, pagination.limit, notified)
      if (result.success) {
        setInterested(result.data)
        setPagination(prev => ({
          ...prev,
          total: result.pagination.total,
          totalPages: result.pagination.totalPages
        }))
      }
    } catch (error) {
      console.error('Erro ao carregar interessados:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAsNotified = async (id) => {
    setNotifyingId(id)
    try {
      const result = await markCryptoInterestedAsNotified(id)
      if (result.success) {
        loadInterested()
      }
    } catch (error) {
      console.error('Erro ao marcar como notificado:', error)
    } finally {
      setNotifyingId(null)
    }
  }

  const filters = [
    { id: 'all', label: 'Todos' },
    { id: 'not-notified', label: 'Não notificados' },
    { id: 'notified', label: 'Notificados' }
  ]

  return (
    <DashboardLayout title="Interessados em Cripto" subtitle="Gerencie os usuários interessados em ser avisados sobre o lançamento do módulo de Cripto Futures">
      <div className="px-4 sm:px-6 lg:px-16 py-6 sm:py-8 lg:py-12">
        {/* Filters */}
        <div className="mb-6 flex gap-3">
          {filters.map((f) => (
            <button
              key={f.id}
              onClick={() => {
                setFilter(f.id)
                setPagination(prev => ({ ...prev, page: 1 }))
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filter === f.id
                  ? 'bg-[#00ff88] text-[#0e0e10] shadow-[0_2px_8px_rgba(0,255,136,0.3)]'
                  : 'bg-white text-[#6b7280] border border-[#e5e7eb] hover:bg-[#f9fafb]'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-[0_4px_6px_rgba(0,0,0,0.02)] border border-[rgba(0,0,0,0.03)]">
            <div className="text-sm text-[#6b7280] mb-2">Total de Interessados</div>
            <div className="text-2xl font-bold text-[#111827]">{pagination.total}</div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-[0_4px_6px_rgba(0,0,0,0.02)] border border-[rgba(0,0,0,0.03)]">
            <div className="text-sm text-[#6b7280] mb-2">Não Notificados</div>
            <div className="text-2xl font-bold text-[#f59e0b]">
              {interested.filter(i => !i.notified).length}
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-[0_4px_6px_rgba(0,0,0,0.02)] border border-[rgba(0,0,0,0.03)]">
            <div className="text-sm text-[#6b7280] mb-2">Notificados</div>
            <div className="text-2xl font-bold text-[#059669]">
              {interested.filter(i => i.notified).length}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-[0_4px_6px_rgba(0,0,0,0.02)] border border-[rgba(0,0,0,0.03)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#f9fafb] border-b border-[#e5e7eb]">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[#6b7280] uppercase tracking-wider">
                    Nome
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[#6b7280] uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[#6b7280] uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[#6b7280] uppercase tracking-wider">
                    Data de Registro
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[#6b7280] uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[#6b7280] uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f3f4f6]">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-[#6b7280]">
                      Carregando...
                    </td>
                  </tr>
                ) : interested.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-[#6b7280]">
                      Nenhum interessado encontrado
                    </td>
                  </tr>
                ) : (
                  interested.map((item) => (
                    <tr key={item.id} className="hover:bg-[#f9fafb] transition-colors">
                      <td className="px-6 py-4">
                        <div className="text-sm font-semibold text-[#111827]">
                          {item.firstName && item.lastName
                            ? `${item.firstName} ${item.lastName}`
                            : 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-[#6b7280]">{item.email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          item.isRegisteredUser
                            ? 'bg-[rgba(0,255,136,0.1)] text-[#059669]'
                            : 'bg-[#f3f4f6] text-[#6b7280]'
                        }`}>
                          {item.isRegisteredUser ? 'Usuário Registrado' : 'Visitante'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-[#6b7280]">
                          {new Date(item.createdAt).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          item.notified
                            ? 'bg-[rgba(5,150,105,0.1)] text-[#059669]'
                            : 'bg-[rgba(245,158,11,0.1)] text-[#f59e0b]'
                        }`}>
                          {item.notified ? (
                            <>
                              <Icon icon="lucide:check-circle" className="mr-1" />
                              Notificado
                            </>
                          ) : (
                            <>
                              <Icon icon="lucide:clock" className="mr-1" />
                              Pendente
                            </>
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {!item.notified && (
                          <button
                            onClick={() => handleMarkAsNotified(item.id)}
                            disabled={notifyingId === item.id}
                            className="flex items-center gap-2 px-3 py-1.5 bg-[#00ff88] text-[#0e0e10] rounded-lg text-xs font-semibold hover:bg-[#00e67a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {notifyingId === item.id ? (
                              <>
                                <div className="w-4 h-4 border-2 border-[#0e0e10] border-t-transparent rounded-full animate-spin" />
                                Marcando...
                              </>
                            ) : (
                              <>
                                <Icon icon="lucide:bell" className="text-sm" />
                                Marcar como Notificado
                              </>
                            )}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="px-6 py-4 border-t border-[#e5e7eb] flex items-center justify-between">
              <div className="text-sm text-[#6b7280]">
                Página {pagination.page} de {pagination.totalPages}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                  disabled={pagination.page === 1}
                  className="px-3 py-1.5 bg-white border border-[#e5e7eb] rounded-lg text-sm text-[#6b7280] hover:bg-[#f9fafb] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Anterior
                </button>
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.totalPages, prev.page + 1) }))}
                  disabled={pagination.page === pagination.totalPages}
                  className="px-3 py-1.5 bg-white border border-[#e5e7eb] rounded-lg text-sm text-[#6b7280] hover:bg-[#f9fafb] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Próxima
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}

export default AdminCryptoInterestedPage
