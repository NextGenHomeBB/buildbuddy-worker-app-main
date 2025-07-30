
import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { HardHat, Wrench } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [loading, setLoading] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)
  const { user, signIn } = useAuth()
  const { toast } = useToast()

  // Redirect if already logged in
  if (user) {
    return <Navigate to="/today" replace />
  }

  const handleSignUp = async (email: string, password: string, name: string, companyName: string, phoneNumber: string) => {
    const redirectUrl = `${window.location.origin}/`
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: name,
          company_name: companyName,
          phone_number: phoneNumber
        }
      }
    })
    return { error }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    if (isSignUp) {
      const { error } = await handleSignUp(email, password, name, companyName, phoneNumber)
      
      if (error) {
        toast({
          title: 'Sign Up Failed',
          description: error.message,
          variant: 'destructive',
        })
      } else {
        toast({
          title: 'Account Created!',
          description: 'Please check your email to verify your account.',
        })
      }
    } else {
      const { error } = await signIn(email, password)

      if (error) {
        toast({
          title: 'Login Failed',
          description: error.message,
          variant: 'destructive',
        })
      } else {
        toast({
          title: 'Welcome back!',
          description: 'Successfully logged in',
        })
      }
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-construction-yellow/10 via-background to-construction-orange/5 flex items-center justify-center px-4 xs:px-6 safe-area-padding">
      {/* Construction-themed background pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23f59e0b%22%20fill-opacity%3D%220.03%22%3E%3Cpath%20d%3D%22M30%2030l15-15v30l-15-15zM15%2030l15-15v30l-15-15z%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-50"></div>
      
      <Card className="w-full max-w-md relative z-10 shadow-xl border-2 border-construction-yellow/20">
        <CardHeader className="text-center pb-2">
          <div className="flex items-center justify-center mb-6">
            <img 
              src="/lovable-uploads/dc577e50-0553-478b-a704-4c7c4b3808a1.png" 
              alt="NextGen Home Logo" 
              className="h-24 w-auto"
            />
          </div>
          <CardTitle className="text-2xl xs:text-3xl font-bold text-construction-gray-900 text-center">
            BuildingBuddy
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-2">
          <form onSubmit={handleSubmit} className="space-y-6">
            {isSignUp && (
              <div className="space-y-2">
                <Label 
                  htmlFor="name" 
                  className="text-sm font-medium text-construction-gray-700"
                >
                  Name
                </Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="John Smith"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="h-12 text-base border-2 border-construction-gray-200 focus:border-construction-yellow focus:ring-construction-yellow/20 rounded-lg"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label 
                htmlFor="email" 
                className="text-sm font-medium text-construction-gray-700"
              >
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="worker@buildbuddy.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12 text-base border-2 border-construction-gray-200 focus:border-construction-yellow focus:ring-construction-yellow/20 rounded-lg"
              />
            </div>
            
            <div className="space-y-2">
              <Label 
                htmlFor="password" 
                className="text-sm font-medium text-construction-gray-700"
              >
                Password
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-12 text-base border-2 border-construction-gray-200 focus:border-construction-yellow focus:ring-construction-yellow/20 rounded-lg"
              />
            </div>

            {isSignUp && (
              <>
                <div className="space-y-2">
                  <Label 
                    htmlFor="companyName" 
                    className="text-sm font-medium text-construction-gray-700"
                  >
                    Company Name
                  </Label>
                  <Input
                    id="companyName"
                    type="text"
                    placeholder="ABC Construction Co."
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    required
                    className="h-12 text-base border-2 border-construction-gray-200 focus:border-construction-yellow focus:ring-construction-yellow/20 rounded-lg"
                  />
                </div>

                <div className="space-y-2">
                  <Label 
                    htmlFor="phoneNumber" 
                    className="text-sm font-medium text-construction-gray-700"
                  >
                    Phone Number
                  </Label>
                  <Input
                    id="phoneNumber"
                    type="tel"
                    placeholder="+1 (555) 123-4567"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    required
                    className="h-12 text-base border-2 border-construction-gray-200 focus:border-construction-yellow focus:ring-construction-yellow/20 rounded-lg"
                  />
                </div>
              </>
            )}

            <Button 
              type="submit" 
              className="w-full h-12 text-base font-semibold bg-construction-yellow hover:bg-construction-yellow/90 text-construction-yellow-foreground rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 touch-target" 
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-construction-yellow-foreground/30 border-t-construction-yellow-foreground rounded-full animate-spin mr-2" />
                  {isSignUp ? 'Creating Account...' : 'Signing In...'}
                </>
              ) : (
                isSignUp ? 'Create Account' : 'Sign In to Start Work'
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-construction-gray-600">
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}
              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="ml-2 font-medium text-construction-yellow hover:text-construction-yellow/80 underline"
              >
                {isSignUp ? 'Sign In' : 'Sign Up'}
              </button>
            </p>
          </div>

        </CardContent>
      </Card>
    </div>
  )
}
