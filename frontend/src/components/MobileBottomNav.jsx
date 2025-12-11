import { Icon } from '@iconify/react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useSidebar } from '../contexts/SidebarContext'

function MobileBottomNav() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const { toggleSidebar } = useSidebar()

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/')
  }

  // Itens principais para o bottom nav (os mais usados)
  const mainNavItems = [
    { id: 'overview', label: 'Início', icon: 'lucide:layout-dashboard', path: '/dashboard' },
    { id: 'invest', label: 'Investir', icon: 'lucide:trending-up', path: '/investir-planos' },
    { id: 'forex', label: 'MT4', icon: 'lucide:layers', path: '/conta-forex-mt4' },
    { id: 'menu', label: 'Menu', icon: 'lucide:menu', isMenu: true },
  ]

  const handleNavigation = (path) => {
    navigate(path)
  }

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-[#e5e7eb] shadow-[0_-4px_12px_rgba(0,0,0,0.08)] safe-area-inset-bottom">
      <div className="flex items-center justify-around h-16 px-2 max-w-screen-xl mx-auto">
        {mainNavItems.map((item) => {
          if (item.isMenu) {
            return (
              <button
                key={item.id}
                onClick={toggleSidebar}
                className="flex flex-col items-center justify-center gap-1 flex-1 h-full transition-all duration-200 text-[#6b7280] active:text-[#00ff88]"
                data-media-type="banani-button"
              >
                <div className="w-6 h-6 flex items-center justify-center">
                  <Icon icon={item.icon} className="text-xl" />
                </div>
                <span className="text-[10px] font-medium">{item.label}</span>
              </button>
            )
          }

          const active = isActive(item.path)
          return (
            <button
              key={item.id}
              onClick={() => handleNavigation(item.path)}
              className={`relative flex flex-col items-center justify-center gap-1 flex-1 h-full transition-all duration-200 ${
                active
                  ? 'text-[#00ff88]'
                  : 'text-[#6b7280] active:text-[#00ff88]'
              }`}
              data-media-type="banani-button"
            >
              <div className={`w-6 h-6 flex items-center justify-center transition-all ${
                active ? 'scale-110' : ''
              }`}>
                <Icon 
                  icon={item.icon} 
                  className="text-xl"
                />
              </div>
              <span className={`text-[10px] font-medium transition-all ${
                active ? 'font-semibold' : ''
              }`}>
                {item.label}
              </span>
              {active && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-0.5 bg-[#00ff88] rounded-full" />
              )}
            </button>
          )
        })}
      </div>
    </nav>
  )
}

export default MobileBottomNav
