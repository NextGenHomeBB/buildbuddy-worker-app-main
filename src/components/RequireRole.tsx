import { Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

interface RequireRoleProps {
  children: React.ReactNode
  allowedRoles: string[]
  fallbackPath?: string
}

export function RequireRole({ children, allowedRoles, fallbackPath = '/today' }: RequireRoleProps) {
  const { user, userRole, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (!userRole || !allowedRoles.includes(userRole)) {
    return <Navigate to={fallbackPath} replace />
  }

  return <>{children}</>
}