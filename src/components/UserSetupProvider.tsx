
import { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useUserSetup } from '@/hooks/useUserSetup'
import { useAuth } from '@/contexts/AuthContext'

interface UserSetupProviderProps {
  children: ReactNode
}

export function UserSetupProvider({ children }: UserSetupProviderProps) {
  const { user, loading: authLoading } = useAuth()
  const { isSetupComplete, isLoading: setupLoading, needsOrganization } = useUserSetup()

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

  // If user needs to join an organization, redirect to join screen
  if (user && needsOrganization) {
    return <Navigate to="/join-organization" replace />
  }

  return <>{children}</>
}
