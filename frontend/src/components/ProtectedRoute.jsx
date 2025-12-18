import { Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading, user } = useAuth()

  // Debug
  useEffect(() => {
    console.log('[ProtectedRoute] Loading:', loading)
    console.log('[ProtectedRoute] IsAuthenticated:', isAuthenticated)
    console.log('[ProtectedRoute] User:', user)
  }, [loading, isAuthenticated, user])

  if (loading) {
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

  if (!isAuthenticated) {
    console.log('[ProtectedRoute] Não autenticado, redirecionando para /login')
    return <Navigate to="/login" replace />
  }

  return children
}

export default ProtectedRoute
