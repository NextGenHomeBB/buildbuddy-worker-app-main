
import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'

export function useUserSetup() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [isSetupComplete, setIsSetupComplete] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const setupUserProfile = async () => {
      if (!user) {
        setIsLoading(false)
        return
      }

      try {
        // Check if user already has a profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', user.id)
          .single()

        if (profileError && profileError.code !== 'PGRST116') {
          throw profileError
        }

        if (!profile) {
          // User doesn't have a profile, create one
          console.log('Creating user profile...')
          
          const { error: setupError } = await supabase.rpc('create_user_profile', {
            user_id: user.id,
            user_email: user.email
          })

          if (setupError) {
            console.error('Profile creation error:', setupError)
            throw setupError
          }

          console.log('User profile created successfully')
          toast({
            title: 'Welcome!',
            description: 'Your profile has been created. You can now start creating tasks.',
          })
        }

        setIsSetupComplete(true)
      } catch (error) {
        console.error('Error setting up user:', error)
        toast({
          title: 'Setup Error',
          description: 'There was an issue setting up your account. You can still use the app.',
          variant: 'destructive',
        })
        setIsSetupComplete(true) // Allow them to continue even if setup fails
      } finally {
        setIsLoading(false)
      }
    }

    setupUserProfile()
  }, [user, toast])

  return { isSetupComplete, isLoading }
}
