import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { isUserAdmin } from '../utils/authUtils'

function AdminProtectedRoute({ children }) {
  const { isAuthenticated, loading, user } = useAuth()

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
    return <Navigate to="/login" replace />
  }

  if (!isUserAdmin(user)) {
    // Se não for admin, redirecionar para dashboard
    // Não limpar dados, apenas redirecionar
    return <Navigate to="/dashboard" replace />
  }

  return children
}

export default AdminProtectedRoute
