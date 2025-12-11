import { useEffect } from 'react'
import { Icon } from '@iconify/react'
import Sidebar from './Sidebar'
import MobileBottomNav from './MobileBottomNav'
import { useSidebar } from '../contexts/SidebarContext'

function DashboardLayout({ children, title, subtitle, customHeader, hideSidebar = false }) {
  const { isSidebarOpen, toggleSidebar } = useSidebar()
  const showSidebar = !hideSidebar && isSidebarOpen

  useEffect(() => {
    document.body.classList.add('scroll-enabled')
    return () => {
      document.body.classList.remove('scroll-enabled')
    }
  }, [])

  return (
    <div className="flex h-screen bg-[#F8F9FB] text-[#0F172A] font-sans text-sm leading-normal antialiased">
      {!hideSidebar && <Sidebar />}
      <div className={`flex-1 flex flex-col overflow-y-auto bg-[#F8F9FB] relative transition-all duration-300 ${showSidebar ? 'lg:ml-[240px]' : 'lg:ml-0'}`}>
        {/* Sticky Header */}
        {(title || subtitle || customHeader) && (
          <header className="sticky top-0 z-30 bg-[rgba(246,247,249,0.95)] backdrop-blur-sm py-6 px-4 lg:py-10 lg:px-10 md:py-6 md:px-6 flex justify-between items-center lg:items-end border-b border-[rgba(0,0,0,0.03)]">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              {/* Toggle Buttons */}
              {!hideSidebar && (
                <div className="flex items-center gap-2 mr-2">
                  <button
                    onClick={toggleSidebar}
                    className="lg:hidden w-10 h-10 flex items-center justify-center text-[#0F172A] hover:bg-[rgba(0,0,0,0.05)] rounded-lg transition-all"
                    data-media-type="banani-button"
                    aria-label="Toggle menu mobile"
                  >
                    <Icon icon="lucide:menu" className="text-xl" />
                  </button>
                  <button
                    onClick={toggleSidebar}
                    className="hidden lg:flex w-10 h-10 items-center justify-center text-[#0F172A] hover:bg-[rgba(0,0,0,0.05)] rounded-lg transition-all"
                    data-media-type="banani-button"
                    aria-label="Toggle menu desktop"
                  >
                    <Icon icon={isSidebarOpen ? 'lucide:panel-left-close' : 'lucide:panel-left-open'} className="text-xl" />
                  </button>
                </div>
              )}
              <div className="flex flex-col gap-1.5 min-w-0 flex-1">
                {title && (
                  <h1 className="text-2xl lg:text-[28px] font-bold text-[#111827] m-0 tracking-[-0.02em] truncate">
                    {title}
                  </h1>
                )}
                {subtitle && (
                  <p className="text-xs lg:text-sm text-[#6b7280] m-0 font-normal">
                    {subtitle}
                  </p>
                )}
              </div>
            </div>
            {customHeader && (
              <div className="flex items-center gap-3 flex-shrink-0">
                {customHeader}
              </div>
            )}
          </header>
        )}
        {/* Content Wrapper */}
        <div className="py-4 px-4 lg:py-8 lg:px-10 md:py-6 md:px-6 pb-20 lg:pb-4">
          {children}
        </div>
      </div>
      
      {/* Mobile Bottom Navigation */}
      {!hideSidebar && <MobileBottomNav />}
    </div>
  )
}

export default DashboardLayout
