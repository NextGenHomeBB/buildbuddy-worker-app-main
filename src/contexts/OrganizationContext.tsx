import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useAuth } from '@/contexts/AuthContext'

interface OrganizationContextType {
  currentOrgId: string | null
  loading: boolean
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined)

export function OrganizationProvider({ children }: { children: ReactNode }) {
  const { session, user } = useAuth()
  const [currentOrgId, setCurrentOrgId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setCurrentOrgId(null)
      setLoading(false)
      return
    }

    // Extract organization_id from JWT claims
    const organizationId = user.user_metadata?.organization_id || null
    setCurrentOrgId(organizationId)
    setLoading(false)
    
    console.log('Organization context updated:', organizationId)
  }, [session, user])

  const value = {
    currentOrgId,
    loading,
  }

  return (
    <OrganizationContext.Provider value={value}>
      {children}
    </OrganizationContext.Provider>
  )
}

export function useOrganization() {
  const context = useContext(OrganizationContext)
  if (context === undefined) {
    throw new Error('useOrganization must be used within an OrganizationProvider')
  }
  return context
}