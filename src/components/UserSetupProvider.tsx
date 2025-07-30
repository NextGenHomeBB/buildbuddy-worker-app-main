
import { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useUserSetup } from '@/hooks/useUserSetup'
import { useAuth } from '@/contexts/AuthContext'

interface UserSetupProviderProps {
  children: ReactNode
}

export function UserSetupProvider({ children }: UserSetupProviderProps) {
  const { user, loading: authLoading } = useAuth()
  const { isSetupComplete, isLoading: setupLoading, needsOrganization } = useUserSetup()
  const location = useLocation()

  // Show loading while auth or setup is in progress
  if (authLoading || (user && setupLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-construction-yellow border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">
            {authLoading ? 'Loading...' : 'Setting up your account...'}
          </p>
        </div>
      </div>
    )
  }

  // Allow access to auth pages and join-organization page without redirect
  const allowedPaths = ['/login', '/signup', '/join-organization', '/']
  const isOnAllowedPath = allowedPaths.includes(location.pathname)

  // If user needs to join an organization and is not already on join page, redirect to join screen
  if (user && needsOrganization && !isOnAllowedPath) {
    return <Navigate to="/join-organization" replace />
  }

  return <>{children}</>
}
