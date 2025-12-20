import { useState, useEffect, useRef } from 'react'
import { Icon } from '@iconify/react'
import DashboardLayout from '../components/DashboardLayout'
import { useAuth } from '../contexts/AuthContext'
import { updatePassword as updatePasswordService } from '../services/profileService'

function PerfilAdminPage() {
  const { user, getProfile, updateProfile } = useAuth()
  const hasLoadedRef = useRef(false)
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    country: 'Brasil',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showToast, setShowToast] = useState(false)

  useEffect(() => {
    document.body.classList.add('scroll-enabled')
    return () => {
      document.body.classList.remove('scroll-enabled')
    }
  }, [])

  // Carregar dados do perfil
  useEffect(() => {
    if (!user || !user.id) {
      setLoading(false)
      return
    }

    // Evitar carregar múltiplas vezes para o mesmo usuário
    const userId = user.id
    if (hasLoadedRef.current === userId) {
      return
    }

    hasLoadedRef.current = userId
    let isMounted = true

    const loadProfile = async () => {
      setLoading(true)
      try {
        console.log('[PerfilAdminPage] Carregando perfil para userId:', userId)
        const result = await getProfile()
        console.log('[PerfilAdminPage] Resultado do getProfile:', result)
        if (!isMounted) return

        if (result.success && result.user) {
          const u = result.user
          console.log('[PerfilAdminPage] Dados do usuário recebidos:', u)
          setFormData(prev => ({
            ...prev,
            fullName: `${u.firstName || u.first_name || ''} ${u.lastName || u.last_name || ''}`.trim(),
            email: u.email || '',
            phone: u.phone || '',
            country: u.country || 'Brasil',
            street: u.street || u.address?.split(',')[0] || '',
            number: u.number || '',
            neighborhood: u.neighborhood || '',
            city: u.city || '',
            state: u.state || '',
            zipCode: u.zipCode || u.zip_code || '',
            complement: u.complement || ''
          }))
          console.log('[PerfilAdminPage] FormData atualizado com sucesso')
        } else {
          console.warn('[PerfilAdminPage] Resultado sem sucesso ou sem user:', result)
          if (user) {
            const u = user
            console.log('[PerfilAdminPage] Usando dados do user do contexto:', u)
            setFormData(prev => ({
              ...prev,
              fullName: `${u.firstName || u.first_name || ''} ${u.lastName || u.last_name || ''}`.trim(),
              email: u.email || '',
              phone: u.phone || '',
              country: u.country || 'Brasil'
            }))
          }
        }
      } catch (err) {
        if (!isMounted) return
        console.error('[PerfilAdminPage] Erro ao carregar perfil:', err)
        if (user) {
          const u = user
          setFormData(prev => ({
            ...prev,
            fullName: `${u.firstName || u.first_name || ''} ${u.lastName || u.last_name || ''}`.trim(),
            email: u.email || '',
            phone: u.phone || '',
            country: u.country || 'Brasil'
          }))
        }
      } finally {
        if (isMounted) {
          setLoading(false)
          console.log('[PerfilAdminPage] Loading finalizado')
        }
      }
    }

    loadProfile()

    return () => {
      isMounted = false
      // Resetar o ref quando o componente desmontar ou o user mudar
      if (hasLoadedRef.current === userId) {
        hasLoadedRef.current = false
      }
    }
  }, [user?.id]) // Usar apenas user.id como dependência

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    })
  }

  const handleSave = async () => {
    setSaving(true)
    
    try {
      // Separar nome completo em firstName e lastName
      const nameParts = formData.fullName.trim().split(' ')
      const firstName = nameParts[0] || ''
      const lastName = nameParts.slice(1).join(' ') || ''

      // Preparar dados para envio
      const profileData = {
        firstName,
        lastName,
        phone: formData.phone,
        country: formData.country
      }

      // Atualizar perfil
      const result = await updateProfile(profileData)
      
      // Se houver senha para atualizar
      if (formData.currentPassword && formData.newPassword && formData.confirmPassword) {
        if (formData.newPassword !== formData.confirmPassword) {
          alert('As senhas não coincidem.')
          setSaving(false)
          return
        }

        if (formData.newPassword.length < 6) {
          alert('A nova senha deve ter no mínimo 6 caracteres.')
          setSaving(false)
          return
        }

        const passwordResult = await updatePasswordService(formData.currentPassword, formData.newPassword)
        
        if (!passwordResult.success) {
          alert(passwordResult.message || 'Erro ao atualizar senha.')
          setSaving(false)
          return
        }

        // Limpar campos de senha após sucesso
        setFormData(prev => ({
          ...prev,
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        }))
      }
      
      if (result.success) {
        setShowToast(true)
        setTimeout(() => {
          setShowToast(false)
        }, 3000)
      } else {
        // Mostrar erro (pode adicionar um toast de erro se necessário)
        console.error('Erro ao salvar perfil:', result.message)
        alert(result.message || 'Erro ao salvar perfil. Tente novamente.')
      }
    } catch (err) {
      console.error('Erro ao salvar perfil:', err)
      alert('Erro inesperado ao salvar perfil. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  const getInitials = () => {
    const names = formData.fullName.split(' ')
    if (names.length >= 2) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase()
    }
    return formData.fullName.substring(0, 2).toUpperCase() || 'JS'
  }

  if (loading) {
    return (
      <DashboardLayout title="Meu Perfil" subtitle="Gerencie seus dados pessoais, segurança e preferências.">
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-[#00AFAA] border-t-transparent rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes slideIn {
          from {
            transform: translateY(-10px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .toast-show {
          animation: slideIn 0.4s ease-out forwards;
        }
      `}} />
      
      <DashboardLayout 
        title="Meu Perfil"
        subtitle="Gerencie seus dados pessoais, segurança e preferências."
        customHeader={
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-2.5 bg-[#00AFAA] text-white border-none rounded-full text-xs sm:text-sm font-semibold cursor-pointer shadow-[0_4px_12px_rgba(0,175,170,0.25)] transition-all hover:bg-[#008f8b] hover:-translate-y-[1px] hover:shadow-[0_6px_16px_rgba(0,175,170,0.35)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#00AFAA] disabled:hover:translate-y-0"
            data-media-type="banani-button"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Icon icon="lucide:save" className="text-base" />
                Salvar Alterações
              </>
            )}
          </button>
        }
      >
        <div className="max-w-[1200px]">
          <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-4 sm:gap-6 lg:gap-8">
            {/* 1. Dados Pessoais */}
            <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05),0_2px_4px_-1px_rgba(0,0,0,0.03)] border border-[#e5e7eb] flex flex-col gap-4 sm:gap-6 lg:gap-8">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 sm:pb-6 border-b border-[#f3f4f6] gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[rgba(0,175,170,0.08)] flex items-center justify-center text-[#00AFAA]">
                    <Icon icon="lucide:user" className="text-lg" />
                  </div>
                  <h3 className="text-lg font-bold text-[#111827] m-0 tracking-[-0.01em]">
                    Dados Pessoais
                  </h3>
                </div>
                {user?.emailVerified ? (
                  <div className="px-2.5 py-1 bg-[rgba(5,150,105,0.1)] text-[#059669] rounded-md text-[11px] font-bold">
                    VERIFICADO
                  </div>
                ) : (
                  <div className="px-2.5 py-1 bg-[rgba(217,119,6,0.1)] text-[#d97706] rounded-md text-[11px] font-bold">
                    NÃO VERIFICADO
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
                <div className="relative">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-[#1f2937] text-white text-2xl sm:text-3xl font-bold flex items-center justify-center border-4 border-[#f9fafb] shadow-[0_0_0_1px_#e5e7eb]">
                    {getInitials()}
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <button 
                    className="text-xs sm:text-[13px] font-semibold text-[#00AFAA] cursor-pointer px-3 sm:px-3.5 py-1.5 bg-[rgba(0,175,170,0.08)] rounded-lg border-none transition-all hover:bg-[rgba(0,175,170,0.15)]"
                    data-media-type="banani-button"
                  >
                    Alterar foto
                  </button>
                  <button 
                    className="text-xs text-[#ef4444] bg-none border-none cursor-pointer font-medium opacity-80 hover:opacity-100 hover:underline"
                    data-media-type="banani-button"
                  >
                    Remover
                  </button>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-br from-[#0e0e10] to-[#25262b] rounded-lg text-[#ffc107] text-[10px] sm:text-xs font-semibold shadow-[0_4px_12px_rgba(0,0,0,0.08)] border border-[rgba(255,193,7,0.2)] scale-95">
                  <Icon icon="lucide:shield" className="text-xs sm:text-sm" />
                  <span className="whitespace-nowrap">
                    Administrador
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-[13px] font-medium text-[#6b7280]">Nome Completo</label>
                  <div className="relative flex items-center bg-[#f9fafb] border border-[#e5e7eb] rounded-[10px] h-12 transition-all hover:border-[#d1d5db] hover:bg-white focus-within:bg-white focus-within:border-[#00AFAA] focus-within:shadow-[0_0_0_3px_rgba(0,175,170,0.1)]">
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      className="w-full h-full px-4 bg-transparent border-none outline-none text-sm text-[#111827]"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[13px] font-medium text-[#6b7280]">E-mail</label>
                  <div className="relative flex items-center bg-[#f3f4f6] border border-[#e5e7eb] rounded-[10px] h-12 opacity-80 pointer-events-none">
                    <input
                      type="text"
                      name="email"
                      value={formData.email}
                      readOnly
                      className="w-full h-full px-4 bg-transparent border-none outline-none text-sm text-[#111827]"
                    />
                    <div className="pr-4 flex items-center justify-center text-[#9ca3af]">
                      <Icon icon="lucide:lock" className="text-sm" />
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[13px] font-medium text-[#6b7280]">Telefone / WhatsApp</label>
                  <div className="relative flex items-center bg-[#f9fafb] border border-[#e5e7eb] rounded-[10px] h-12 transition-all hover:border-[#d1d5db] hover:bg-white focus-within:bg-white focus-within:border-[#00AFAA] focus-within:shadow-[0_0_0_3px_rgba(0,175,170,0.1)]">
                    <input
                      type="text"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full h-full px-4 bg-transparent border-none outline-none text-sm text-[#111827]"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[13px] font-medium text-[#6b7280]">Nacionalidade</label>
                  <div className="relative flex items-center bg-[#f9fafb] border border-[#e5e7eb] rounded-[10px] h-12 transition-all hover:border-[#d1d5db] hover:bg-white focus-within:bg-white focus-within:border-[#00AFAA] focus-within:shadow-[0_0_0_3px_rgba(0,175,170,0.1)]">
                    <input
                      type="text"
                      name="country"
                      value={formData.country}
                      onChange={handleInputChange}
                      className="w-full h-full px-4 bg-transparent border-none outline-none text-sm text-[#111827]"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Segurança */}
            <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05),0_2px_4px_-1px_rgba(0,0,0,0.03)] border border-[#e5e7eb] flex flex-col gap-4 sm:gap-6 lg:gap-8">
              <div className="flex justify-between items-center pb-6 border-b border-[#f3f4f6]">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[rgba(0,175,170,0.08)] flex items-center justify-center text-[#00AFAA]">
                    <Icon icon="lucide:shield-check" className="text-lg" />
                  </div>
                  <h3 className="text-lg font-bold text-[#111827] m-0 tracking-[-0.01em]">
                    Segurança
                  </h3>
                </div>
              </div>

              <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-[13px] font-medium text-[#6b7280]">Senha Atual</label>
                  <div className="relative flex items-center bg-[#f9fafb] border border-[#e5e7eb] rounded-[10px] h-12 transition-all hover:border-[#d1d5db] hover:bg-white focus-within:bg-white focus-within:border-[#00AFAA] focus-within:shadow-[0_0_0_3px_rgba(0,175,170,0.1)]">
                    <input
                      type="password"
                      name="currentPassword"
                      value={formData.currentPassword}
                      onChange={handleInputChange}
                      className="w-full h-full px-4 bg-transparent border-none outline-none text-sm text-[#111827]"
                      placeholder="********"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[13px] font-medium text-[#6b7280]">Nova Senha</label>
                  <div className="relative flex items-center bg-[#f9fafb] border border-[#e5e7eb] rounded-[10px] h-12 transition-all hover:border-[#d1d5db] hover:bg-white focus-within:bg-white focus-within:border-[#00AFAA] focus-within:shadow-[0_0_0_3px_rgba(0,175,170,0.1)]">
                    <input
                      type="password"
                      name="newPassword"
                      value={formData.newPassword}
                      onChange={handleInputChange}
                      className="w-full h-full px-4 bg-transparent border-none outline-none text-sm text-[#111827]"
                      placeholder="Digite para alterar"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[13px] font-medium text-[#6b7280]">Confirmar Nova Senha</label>
                  <div className="relative flex items-center bg-[#f9fafb] border border-[#e5e7eb] rounded-[10px] h-12 transition-all hover:border-[#d1d5db] hover:bg-white focus-within:bg-white focus-within:border-[#00AFAA] focus-within:shadow-[0_0_0_3px_rgba(0,175,170,0.1)]">
                    <input
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className="w-full h-full px-4 bg-transparent border-none outline-none text-sm text-[#111827]"
                      placeholder="Confirme a nova senha"
                    />
                  </div>
                </div>
              </div>

              {/* Código de Indicação */}
              {user?.referralCode && (
                <div className="pt-6 border-t border-[#f3f4f6]">
                  <div className="flex flex-col gap-2">
                    <label className="text-[13px] font-medium text-[#6b7280]">Código de Indicação</label>
                    <div className="text-lg font-mono font-bold text-[#00AFAA] bg-[rgba(0,175,170,0.08)] px-4 py-3 rounded-lg border border-[rgba(0,175,170,0.2)]">
                      {user.referralCode}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Toast */}
        {showToast && (
          <div className="fixed top-8 right-8 z-[100] bg-[#064e3b] text-[#a7f3d0] px-5 py-3 rounded-[10px] flex items-center gap-2.5 text-sm font-semibold shadow-[0_10px_30px_rgba(0,0,0,0.15)] border border-[rgba(0,255,136,0.2)] toast-show">
            <Icon icon="lucide:check-circle" className="text-xl" />
            <span>Dados atualizados com sucesso</span>
          </div>
        )}
      </DashboardLayout>
    </>
  )
}

export default PerfilAdminPage
