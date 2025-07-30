import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { Building, Users } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'

export default function JoinOrganization() {
  const [inviteCode, setInviteCode] = useState('')
  const [loading, setLoading] = useState(false)
  const { user } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) {
      toast({
        title: 'Authentication Error',
        description: 'Please log in first.',
        variant: 'destructive',
      })
      return
    }

    if (!inviteCode.trim()) {
      toast({
        title: 'Invalid Code',
        description: 'Please enter a valid organization code.',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)

    try {
      // Call the setCustomClaims edge function
      const { data, error } = await supabase.functions.invoke('setCustomClaims', {
        body: { 
          uid: user.id, 
          organization_id: inviteCode.trim()
        }
      })

      if (error) {
        console.error('Edge function error:', error)
        throw error
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to join organization')
      }

      // Refresh the session to get new JWT claims
      const { error: refreshError } = await supabase.auth.refreshSession()
      
      if (refreshError) {
        console.error('Session refresh error:', refreshError)
        // Continue anyway as the claims are set
      }

      toast({
        title: 'Welcome!',
        description: `Successfully joined ${data.organization?.name || 'organization'}`,
      })

      // Navigate to home after successful organization join
      navigate('/today', { replace: true })

    } catch (error: any) {
      console.error('Error joining organization:', error)
      
      let errorMessage = 'Failed to join organization. Please try again.'
      
      if (error.message?.includes('Invalid organization')) {
        errorMessage = 'Invalid organization code. Please check the code and try again.'
      } else if (error.message?.includes('organization_id')) {
        errorMessage = 'Please enter a valid organization code.'
      }

      toast({
        title: 'Join Failed',
        description: errorMessage,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-construction-yellow/10 via-background to-construction-orange/5 flex items-center justify-center px-4 xs:px-6 safe-area-padding">
      {/* Construction-themed background pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23f59e0b%22%20fill-opacity%3D%220.03%22%3E%3Cpath%20d%3D%22M30%2030l15-15v30l-15-15zM15%2030l15-15v30l-15-15z%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-50"></div>
      
      <Card className="w-full max-w-md relative z-10 shadow-xl border-2 border-construction-yellow/20">
        <CardHeader className="text-center pb-2">
          <div className="flex items-center justify-center mb-4">
            <div className="relative">
              <Building className="h-16 w-16 text-construction-yellow" />
              <Users className="h-8 w-8 text-construction-orange absolute -bottom-1 -right-1 bg-background rounded-full p-1" />
            </div>
          </div>
          <CardTitle className="text-2xl xs:text-3xl font-bold text-construction-gray-900">
            Join Organization
          </CardTitle>
          <CardDescription className="text-construction-gray-600">
            Enter your organization invite code to get started
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-2">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label 
                htmlFor="inviteCode" 
                className="text-sm font-medium text-construction-gray-700"
              >
                Organization Invite Code
              </Label>
              <Input
                id="inviteCode"
                type="text"
                placeholder="Enter your organization code"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                required
                className="h-12 text-base border-2 border-construction-gray-200 focus:border-construction-yellow focus:ring-construction-yellow/20 rounded-lg"
              />
              <p className="text-xs text-construction-gray-500">
                This code was provided by your organization administrator
              </p>
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 text-base font-semibold bg-construction-yellow hover:bg-construction-yellow/90 text-construction-yellow-foreground rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 touch-target" 
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-construction-yellow-foreground/30 border-t-construction-yellow-foreground rounded-full animate-spin mr-2" />
                  Joining Organization...
                </>
              ) : (
                'Join Organization'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}