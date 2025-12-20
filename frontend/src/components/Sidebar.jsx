import { Icon } from '@iconify/react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useSidebar } from '../contexts/SidebarContext'

function Sidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()
  const { isSidebarOpen, toggleSidebar } = useSidebar()
  
  // Verificar status de admin - verificar múltiplas fontes para garantir robustez
  // Também verificar localStorage como fallback caso o contexto não esteja atualizado
  const getUserFromStorage = () => {
    try {
      const stored = localStorage.getItem('user')
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  }
  
  const storedUser = getUserFromStorage()
  const adminCheck = 
    user?.is_admin === true || 
    user?.isAdmin === true || 
    user?.role === 'admin' ||
    storedUser?.is_admin === true ||
    storedUser?.isAdmin === true ||
    storedUser?.role === 'admin'
  
  const isAdmin = Boolean(adminCheck)
  
  // Debug: verificar status de admin em todas as rotas
  if (user) {
    console.log('[Sidebar] Verificação de admin:', {
      isAdmin,
      user_is_admin: user?.is_admin,
      user_isAdmin: user?.isAdmin,
      stored_is_admin: storedUser?.is_admin,
      stored_isAdmin: storedUser?.isAdmin,
      pathname: location.pathname,
      user_id: user?.id
    })
  }

  const navItems = [
    { id: 'overview', label: 'Visão Geral', icon: 'lucide:layout-dashboard', path: '/dashboard' },
    { id: 'invest', label: 'Investir (Planos)', icon: 'lucide:trending-up', path: '/investir-planos' },
    { id: 'forex', label: 'Conta Forex (MT4)', icon: 'lucide:layers', path: '/conta-forex-mt4' },
    { id: 'crypto', label: 'Cripto (Em breve)', icon: 'lucide:bitcoin', path: '/cripto-em-breve' },
    { id: 'reports', label: 'Relatórios', icon: 'lucide:file-bar-chart', path: '/relatorios-performance' },
    { id: 'invoices', label: 'Faturas', icon: 'lucide:receipt', path: '/faturas-performance' },
  ]

  const accountNavItems = [
    { id: 'profile', label: 'Perfil', icon: 'lucide:user', path: '/perfil-cliente' },
    { id: 'referrals', label: 'Indicações', icon: 'lucide:users', path: '/referral-program' },
    { id: 'support', label: 'Suporte', icon: 'lucide:life-buoy', path: '/suporte-cliente' },
  ]

  const adminAccountNavItems = [
    { id: 'profile', label: 'Perfil', icon: 'lucide:user', path: '/perfil-admin' },
  ]

  const adminNavItems = [
    { id: 'admin', label: 'Painel Admin', icon: 'lucide:shield', path: '/admin' },
    { id: 'plans', label: 'Planos', icon: 'lucide:package', path: '/admin/plans' },
    { id: 'users', label: 'Usuários', icon: 'lucide:users', path: '/admin/users' },
    { id: 'referrals', label: 'Comissões', icon: 'lucide:dollar-sign', path: '/admin/referrals' },
    { id: 'invoices', label: 'Faturas', icon: 'lucide:receipt', path: '/admin/invoices' },
    { id: 'crypto-interested', label: 'Interessados Cripto', icon: 'lucide:rocket', path: '/admin/crypto-interested' },
  ]

  const isActive = (path) => {
    // Para rotas de admin, usar lógica mais específica para evitar duplicação
    if (path.startsWith('/admin')) {
      // Se o pathname é exatamente igual ao path, está ativo
      if (location.pathname === path) {
        return true
      }
      // Para /admin, não deve estar ativo se estiver em sub-rotas como /admin/plans
      if (path === '/admin' && location.pathname !== '/admin') {
        return false
      }
      // Para sub-rotas como /admin/plans, verificar se o pathname começa com o path
      if (path !== '/admin' && location.pathname.startsWith(path)) {
        return true
      }
      return false
    }
    // Para admin em /perfil-cliente, não marcar itens do menu admin como ativos
    // mas manter o menu admin visível
    if (isAdmin && location.pathname === '/perfil-cliente') {
      return path === '/perfil-cliente'
    }
    
    // Para outras rotas, verificar correspondência exata ou início
    return location.pathname === path || location.pathname.startsWith(path + '/')
  }

  const getUserInitials = () => {
    if (user) {
      const firstName = user.firstName || user.first_name || ''
      const lastName = user.lastName || user.last_name || ''
      if (firstName && lastName) {
        return `${firstName[0]}${lastName[0]}`.toUpperCase()
      }
      if (firstName) {
        return firstName.substring(0, 2).toUpperCase()
      }
    }
    return 'JS'
  }

  const getUserName = () => {
    if (user) {
      const firstName = user.firstName || user.first_name || ''
      const lastName = user.lastName || user.last_name || ''
      return `${firstName} ${lastName}`.trim() || 'Usuário'
    }
    return 'João Silva'
  }

  const handleNavigation = (path) => {
    navigate(path)
    // Fechar sidebar em mobile após navegação
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      toggleSidebar()
    }
  }

  return (
    <>
      {/* Mobile Overlay - Apenas para drawer lateral no mobile */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity duration-300"
          onClick={toggleSidebar}
        />
      )}
      
      {/* Desktop Sidebar - Pode ser ocultado */}
      <aside className={`hidden lg:flex sidebar-custom-scroll w-[240px] bg-gradient-to-b from-[#121316] to-[#0E0E10] text-[#9ca3af] py-8 px-5 border-r border-[rgba(255,255,255,0.04)] flex-shrink-0 fixed left-0 top-0 h-screen z-50 flex-col overflow-y-auto transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-12 pl-1">
        <div 
          className="w-9 h-9 rounded-[10px] flex items-center justify-center text-[#002914] font-extrabold text-lg shadow-[0_0_20px_rgba(0,255,136,0.15)] flex-shrink-0 cursor-pointer"
            onClick={() => handleNavigation('/dashboard')}
          style={{
            background: 'linear-gradient(135deg, #00ff88 0%, #00afaa 100%)'
          }}
        >
          TN
        </div>
        <div className="flex flex-col gap-0.5 flex-1">
          <div className="text-base font-bold text-white leading-[1.1]">
            TraderNex
          </div>
          <div className="text-[11px] text-[rgba(255,255,255,0.4)] font-medium">
            Client Portal
          </div>
        </div>
      </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-1 mb-10">
          {/* MENU DE ADMIN - Exibir apenas se for admin, em TODAS as rotas */}
          {isAdmin && (
            <>
              {/* Seção Administração */}
              <div className="text-[10px] font-semibold text-[rgba(255,193,7,0.4)] uppercase tracking-[0.1em] mx-3 mb-3">
                Administração
              </div>
              {adminNavItems.map((item) => {
                const active = isActive(item.path)
                return (
                  <div
                    key={item.id}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-200 ${
                      active
                        ? 'bg-gradient-to-r from-[rgba(255,193,7,0.1)] to-[rgba(255,193,7,0.02)] text-[#ffc107] border border-[rgba(255,193,7,0.15)]'
                        : 'text-[#ffc107] border border-transparent hover:bg-[rgba(255,193,7,0.05)] hover:text-[#ffd54f] hover:pl-4'
                    }`}
                    onClick={() => handleNavigation(item.path)}
                    data-media-type="banani-button"
                  >
                    <div className="w-[18px] h-[18px] flex items-center justify-center">
                      <Icon icon={item.icon} className="text-lg" />
                    </div>
                    <span className="text-sm font-medium">{item.label}</span>
                  </div>
                )
              })}

              {/* Seção Sua Conta - apenas Perfil para admins */}
              <div className="text-[10px] font-semibold text-[rgba(255,255,255,0.3)] uppercase tracking-[0.1em] mx-3 mb-3 mt-6">
                Sua Conta
              </div>
              {adminAccountNavItems.map((item) => {
                const active = isActive(item.path)
                return (
                  <div
                    key={item.id}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-200 ${
                      active
                        ? 'bg-gradient-to-r from-[rgba(255,193,7,0.1)] to-[rgba(255,193,7,0.02)] text-[#ffc107] border border-[rgba(255,193,7,0.15)]'
                        : 'text-[#ffc107] border border-transparent hover:bg-[rgba(255,193,7,0.05)] hover:text-[#ffd54f] hover:pl-4'
                    }`}
                    onClick={() => handleNavigation(item.path)}
                    data-media-type="banani-button"
                  >
                    <div className="w-[18px] h-[18px] flex items-center justify-center">
                      <Icon icon={item.icon} className="text-lg" />
                    </div>
                    <span className="text-sm font-medium">{item.label}</span>
                  </div>
                )
              })}
            </>
          )}

          {/* MENU NORMAL - Exibir apenas se NÃO for admin */}
          {!isAdmin && (
            <>
              {/* Seção Principal */}
              <div className="text-[10px] font-semibold text-[rgba(255,255,255,0.3)] uppercase tracking-[0.1em] mx-3 mb-3 mt-6">
                Principal
              </div>
              {navItems.map((item) => {
                const active = isActive(item.path)
                return (
                  <div
                    key={item.id}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-200 ${
                      active
                        ? 'bg-gradient-to-r from-[rgba(0,255,136,0.06)] to-[rgba(0,255,136,0.01)] text-[#00ff88] border border-[rgba(0,255,136,0.08)]'
                        : 'text-[#9ca3af] border border-transparent hover:bg-[rgba(255,255,255,0.03)] hover:text-white hover:pl-4'
                    }`}
                    onClick={() => handleNavigation(item.path)}
                    data-media-type="banani-button"
                  >
                    <div className="w-[18px] h-[18px] flex items-center justify-center">
                      <Icon icon={item.icon} className="text-lg" />
                    </div>
                    <span className="text-sm font-medium">{item.label}</span>
                  </div>
                )
              })}

              {/* Seção Sua Conta - todos os itens para não-admins */}
              <div className="text-[10px] font-semibold text-[rgba(255,255,255,0.3)] uppercase tracking-[0.1em] mx-3 mb-3 mt-6">
                Sua Conta
              </div>
              {accountNavItems.map((item) => {
                const active = isActive(item.path)
                return (
                  <div
                    key={item.id}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-200 ${
                      active
                        ? 'bg-gradient-to-r from-[rgba(0,255,136,0.06)] to-[rgba(0,255,136,0.01)] text-[#00ff88] border border-[rgba(0,255,136,0.08)]'
                        : 'text-[#9ca3af] border border-transparent hover:bg-[rgba(255,255,255,0.03)] hover:text-white hover:pl-4'
                    }`}
                    onClick={() => handleNavigation(item.path)}
                    data-media-type="banani-button"
                  >
                    <div className="w-[18px] h-[18px] flex items-center justify-center">
                      <Icon icon={item.icon} className="text-lg" />
                    </div>
                    <span className="text-sm font-medium">{item.label}</span>
                  </div>
                )
              })}
            </>
          )}
        </nav>

        {/* Footer - User Card */}
        <div className="mt-auto">
          <div 
            className="flex items-center gap-2 p-2.5 bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)] rounded-xl transition-all duration-300 hover:bg-[rgba(255,255,255,0.04)] hover:border-[rgba(255,255,255,0.1)] overflow-hidden"
          >
            <div 
              className="flex items-center gap-2.5 flex-1 cursor-pointer min-w-0"
              onClick={() => handleNavigation(isAdmin ? '/perfil-admin' : '/perfil-cliente')}
              data-media-type="banani-button"
            >
              <div 
                className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-[13px] flex-shrink-0"
                style={{
                  background: '#2c3e50'
                }}
              >
                {getUserInitials()}
              </div>
              <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                <div className="text-[13px] font-semibold text-white truncate">{getUserName()}</div>
                <div className="text-[10px] text-[rgba(255,255,255,0.5)] truncate">Cliente TraderNex</div>
              </div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation()
                if (window.confirm('Tem certeza que deseja sair?')) {
                  logout()
                }
              }}
              className="flex items-center justify-center w-7 h-7 rounded-lg text-[rgba(255,255,255,0.5)] hover:text-white hover:bg-[rgba(239,68,68,0.1)] transition-all duration-200 flex-shrink-0 ml-1"
              title="Sair"
              data-media-type="banani-button"
            >
              <Icon icon="lucide:log-out" className="text-base" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Drawer Sidebar - Drawer que desliza da esquerda */}
      <aside className={`lg:hidden sidebar-custom-scroll w-[280px] max-w-[85vw] bg-gradient-to-b from-[#121316] to-[#0E0E10] text-[#9ca3af] py-6 px-4 border-r border-[rgba(255,255,255,0.04)] flex-shrink-0 fixed left-0 top-0 h-screen z-50 flex flex-col overflow-y-auto transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* Mobile Close Button */}
        <button
          onClick={toggleSidebar}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-[#9ca3af] hover:text-white hover:bg-[rgba(255,255,255,0.05)] rounded-lg transition-all"
          data-media-type="banani-button"
        >
          <Icon icon="lucide:x" className="text-xl" />
        </button>
        
        {/* Header */}
        <div className="flex items-center gap-3 mb-8 pl-1 mt-2">
          <div 
            className="w-9 h-9 rounded-[10px] flex items-center justify-center text-[#002914] font-extrabold text-lg shadow-[0_0_20px_rgba(0,255,136,0.15)] flex-shrink-0 cursor-pointer"
            onClick={() => handleNavigation('/dashboard')}
            style={{
              background: 'linear-gradient(135deg, #00ff88 0%, #00afaa 100%)'
            }}
          >
            TN
          </div>
          <div className="flex flex-col gap-0.5 flex-1">
            <div className="text-base font-bold text-white leading-[1.1]">
              TraderNex
            </div>
            <div className="text-[11px] text-[rgba(255,255,255,0.4)] font-medium">
              Client Portal
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-1 mb-8">
          {/* MENU DE ADMIN - Exibir apenas se for admin, em TODAS as rotas */}
          {isAdmin && (
            <>
              {/* Seção Administração */}
              <div className="text-[10px] font-semibold text-[rgba(255,193,7,0.4)] uppercase tracking-[0.1em] mx-3 mb-3">
                Administração
              </div>
              {adminNavItems.map((item) => {
                const active = isActive(item.path)
                return (
                  <div
                    key={item.id}
                    className={`flex items-center gap-3 px-3 py-3 rounded-lg cursor-pointer transition-all duration-200 ${
                      active
                        ? 'bg-gradient-to-r from-[rgba(255,193,7,0.1)] to-[rgba(255,193,7,0.02)] text-[#ffc107] border border-[rgba(255,193,7,0.15)]'
                        : 'text-[#ffc107] border border-transparent hover:bg-[rgba(255,193,7,0.05)] hover:text-[#ffd54f]'
                    }`}
                    onClick={() => handleNavigation(item.path)}
                    data-media-type="banani-button"
                  >
                    <div className="w-[18px] h-[18px] flex items-center justify-center">
                      <Icon icon={item.icon} className="text-lg" />
                    </div>
                    <span className="text-sm font-medium">{item.label}</span>
                  </div>
                )
              })}

              {/* Seção Sua Conta - apenas Perfil para admins */}
              <div className="text-[10px] font-semibold text-[rgba(255,255,255,0.3)] uppercase tracking-[0.1em] mx-3 mb-3 mt-6">
                Sua Conta
              </div>
              {accountNavItems
                .filter(item => item.id === 'profile')
                .map((item) => {
                  const active = isActive(item.path)
                  return (
                    <div
                      key={item.id}
                      className={`flex items-center gap-3 px-3 py-3 rounded-lg cursor-pointer transition-all duration-200 ${
                        active
                          ? 'bg-gradient-to-r from-[rgba(255,193,7,0.1)] to-[rgba(255,193,7,0.02)] text-[#ffc107] border border-[rgba(255,193,7,0.15)]'
                          : 'text-[#ffc107] border border-transparent hover:bg-[rgba(255,193,7,0.05)] hover:text-[#ffd54f]'
                      }`}
                      onClick={() => handleNavigation(item.path)}
                      data-media-type="banani-button"
                    >
                      <div className="w-[18px] h-[18px] flex items-center justify-center">
                        <Icon icon={item.icon} className="text-lg" />
                      </div>
                      <span className="text-sm font-medium">{item.label}</span>
                    </div>
                  )
                })}
            </>
          )}

          {/* MENU NORMAL - Exibir apenas se NÃO for admin */}
          {!isAdmin && (
            <>
              {/* Seção Principal */}
              <div className="text-[10px] font-semibold text-[rgba(255,255,255,0.3)] uppercase tracking-[0.1em] mx-3 mb-3 mt-6">
                Principal
              </div>
              {navItems.map((item) => {
                const active = isActive(item.path)
                return (
                  <div
                    key={item.id}
                    className={`flex items-center gap-3 px-3 py-3 rounded-lg cursor-pointer transition-all duration-200 ${
                      active
                        ? 'bg-gradient-to-r from-[rgba(0,255,136,0.06)] to-[rgba(0,255,136,0.01)] text-[#00ff88] border border-[rgba(0,255,136,0.08)]'
                        : 'text-[#9ca3af] border border-transparent hover:bg-[rgba(255,255,255,0.03)] hover:text-white'
                    }`}
                    onClick={() => handleNavigation(item.path)}
                    data-media-type="banani-button"
                  >
                    <div className="w-[18px] h-[18px] flex items-center justify-center">
                      <Icon icon={item.icon} className="text-lg" />
                    </div>
                    <span className="text-sm font-medium">{item.label}</span>
                  </div>
                )
              })}

              {/* Seção Sua Conta - todos os itens para não-admins */}
              <div className="text-[10px] font-semibold text-[rgba(255,255,255,0.3)] uppercase tracking-[0.1em] mx-3 mb-3 mt-6">
                Sua Conta
              </div>
              {accountNavItems.map((item) => {
                const active = isActive(item.path)
                return (
                  <div
                    key={item.id}
                    className={`flex items-center gap-3 px-3 py-3 rounded-lg cursor-pointer transition-all duration-200 ${
                      active
                        ? 'bg-gradient-to-r from-[rgba(0,255,136,0.06)] to-[rgba(0,255,136,0.01)] text-[#00ff88] border border-[rgba(0,255,136,0.08)]'
                        : 'text-[#9ca3af] border border-transparent hover:bg-[rgba(255,255,255,0.03)] hover:text-white'
                    }`}
                    onClick={() => handleNavigation(item.path)}
                    data-media-type="banani-button"
                  >
                    <div className="w-[18px] h-[18px] flex items-center justify-center">
                      <Icon icon={item.icon} className="text-lg" />
                    </div>
                    <span className="text-sm font-medium">{item.label}</span>
                  </div>
                )
              })}
            </>
          )}
        </nav>

        {/* Footer - User Card */}
        <div className="mt-auto">
          <div 
            className="flex items-center gap-2 p-2.5 bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)] rounded-xl transition-all duration-300 hover:bg-[rgba(255,255,255,0.04)] hover:border-[rgba(255,255,255,0.1)] overflow-hidden"
          >
            <div 
              className="flex items-center gap-2.5 flex-1 cursor-pointer min-w-0"
              onClick={() => handleNavigation(isAdmin ? '/perfil-admin' : '/perfil-cliente')}
              data-media-type="banani-button"
            >
              <div 
                className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-[13px] flex-shrink-0"
                style={{
                  background: '#2c3e50'
                }}
              >
                {getUserInitials()}
              </div>
              <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                <div className="text-[13px] font-semibold text-white truncate">{getUserName()}</div>
                <div className="text-[10px] text-[rgba(255,255,255,0.5)] truncate">Cliente TraderNex</div>
              </div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation()
                if (window.confirm('Tem certeza que deseja sair?')) {
                  logout()
                }
              }}
              className="flex items-center justify-center w-7 h-7 rounded-lg text-[rgba(255,255,255,0.5)] hover:text-white hover:bg-[rgba(239,68,68,0.1)] transition-all duration-200 flex-shrink-0 ml-1"
              title="Sair"
              data-media-type="banani-button"
            >
              <Icon icon="lucide:log-out" className="text-base" />
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}

export default Sidebar
