import { useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { isUserAdmin } from '../utils/authUtils'

function DashboardRedirect({ children }) {
  const { user, loading } = useAuth()

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

  // Se for admin, redirecionar para /admin
  if (isUserAdmin(user)) {
    return <Navigate to="/admin" replace />
  }

  return children
}

export default DashboardRedirect
