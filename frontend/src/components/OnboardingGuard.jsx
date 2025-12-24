import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { getDashboardData } from '../services/dashboardService'
import { getMT4Accounts } from '../services/dashboardService'

function OnboardingGuard({ children }) {
  const { user, loading: authLoading } = useAuth()
  const [onboardingStatus, setOnboardingStatus] = useState({
    loading: true,
    hasPlan: false,
    hasForexAccount: false,
    isComplete: false
  })

  useEffect(() => {
    const checkOnboarding = async () => {
      if (authLoading || !user) {
        return
      }

      try {
        // Verificar se tem plano selecionado
        const dashboardResult = await getDashboardData()
        const hasPlan = dashboardResult.success && 
                       dashboardResult.data?.profile?.selected_plan_id

        // Verificar se tem conta forex configurada
        const mt4Result = await getMT4Accounts()
        const hasForexAccount = mt4Result.success && 
                                mt4Result.data && 
                                mt4Result.data.length > 0

        setOnboardingStatus({
          loading: false,
          hasPlan: !!hasPlan,
          hasForexAccount: !!hasForexAccount,
          isComplete: hasPlan && hasForexAccount
        })
      } catch (error) {
        console.error('Erro ao verificar onboarding:', error)
        setOnboardingStatus({
          loading: false,
          hasPlan: false,
          hasForexAccount: false,
          isComplete: false
        })
      }
    }

    checkOnboarding()
  }, [user, authLoading])

  if (authLoading || onboardingStatus.loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        Carregando...
      </div>
    )
  }

  // Se não tem plano, redirecionar para planos
  if (!onboardingStatus.hasPlan) {
    return <Navigate to="/investir-planos" replace />
  }

  // Se tem plano mas não tem conta forex, redirecionar para conta forex
  if (onboardingStatus.hasPlan && !onboardingStatus.hasForexAccount) {
    return <Navigate to="/conta-forex-mt4" replace />
  }

  // Se tudo está completo, permitir acesso
  return children
}

export default OnboardingGuard

