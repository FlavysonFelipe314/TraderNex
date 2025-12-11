import { createContext, useContext, useState, useEffect } from 'react'

const SidebarContext = createContext(null)

export function SidebarProvider({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    // Verificar se é mobile
    if (typeof window !== 'undefined') {
      const isMobile = window.innerWidth < 1024
      if (isMobile) return false
    }
    // Carregar preferência do localStorage para desktop
    const saved = localStorage.getItem('sidebarOpen')
    return saved !== null ? JSON.parse(saved) : true
  })

  useEffect(() => {
    // Salvar preferência no localStorage apenas para desktop
    if (typeof window !== 'undefined') {
      const isMobile = window.innerWidth < 1024
      if (!isMobile) {
        localStorage.setItem('sidebarOpen', JSON.stringify(isSidebarOpen))
      }
    }
  }, [isSidebarOpen])

  // Fechar sidebar automaticamente ao redimensionar para mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsSidebarOpen(false)
      } else {
        // Restaurar preferência do localStorage ao voltar para desktop
        const saved = localStorage.getItem('sidebarOpen')
        if (saved !== null) {
          setIsSidebarOpen(JSON.parse(saved))
        }
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Controlar scroll do body quando sidebar estiver aberto em mobile
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isMobile = window.innerWidth < 1024
      if (isMobile) {
        if (isSidebarOpen) {
          document.body.classList.add('sidebar-open')
        } else {
          document.body.classList.remove('sidebar-open')
        }
      }
    }
    return () => {
      document.body.classList.remove('sidebar-open')
    }
  }, [isSidebarOpen])

  const toggleSidebar = () => {
    setIsSidebarOpen(prev => !prev)
  }

  const value = {
    isSidebarOpen,
    toggleSidebar,
    setIsSidebarOpen
  }

  return <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>
}

export function useSidebar() {
  const context = useContext(SidebarContext)
  if (!context) {
    throw new Error('useSidebar deve ser usado dentro de um SidebarProvider')
  }
  return context
}
