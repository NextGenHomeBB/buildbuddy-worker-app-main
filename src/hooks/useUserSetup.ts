
import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

export function useUserSetup() {
  const { user, hasOrganization } = useAuth()
  const { toast } = useToast()
  const [isSetupComplete, setIsSetupComplete] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [needsOrganization, setNeedsOrganization] = useState(false)

  useEffect(() => {
    if (!user) {
      setIsLoading(false)
      setNeedsOrganization(false)
      return
    }

    // Check if user has organization in JWT claims
    if (!hasOrganization) {
      setNeedsOrganization(true)
      setIsSetupComplete(false)
      setIsLoading(false)
      return
    }

    // User has organization, profile will be created by backend trigger
    setNeedsOrganization(false)
    setIsSetupComplete(true)
    setIsLoading(false)
  }, [user, hasOrganization])

  return { isSetupComplete, isLoading, needsOrganization }
}
