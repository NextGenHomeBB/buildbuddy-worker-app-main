import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { MobileBottomNav } from '@/components/MobileBottomNav'
import { User, Mail, Calendar, Building, Edit, Save, X } from 'lucide-react'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'
import { profileValidationSchema, sanitizeText } from '@/lib/security'

export default function Profile() {
  const { user, signOut } = useAuth()
  const { toast } = useToast()
  const [isEditing, setIsEditing] = useState(false)
  const [fullName, setFullName] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single()
      
      if (profile) {
        setFullName(profile.full_name || '')
      }
    }
    
    fetchProfile()
  }, [user])

  const handleSignOut = async () => {
    await signOut()
  }

  const handleSaveProfile = async () => {
    if (!user) return

    // Validate and sanitize input
    const validation = profileValidationSchema.safeParse({
      full_name: fullName.trim()
    })

    if (!validation.success) {
      toast({
        title: "Validation Error",
        description: validation.error.errors[0]?.message || "Invalid name",
        variant: "destructive",
      })
      return
    }

    const sanitizedName = sanitizeText(validation.data.full_name)
    
    setIsLoading(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          full_name: sanitizedName
        })
      
      if (error) throw error
      
      setFullName(sanitizedName)
      setIsEditing(false)
      toast({
        title: 'Profile updated',
        description: 'Your name has been updated successfully.',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update profile. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    // Reset to original value
    const originalName = user?.user_metadata?.full_name || ''
    setFullName(originalName)
  }

  return (
    <div className="min-h-screen bg-background pb-20 lg:pb-0">
      {/* Header */}
      <div className="bg-card border-b border-border p-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-foreground">Profile</h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Profile Card */}
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Avatar className="w-24 h-24">
                <AvatarImage src={user?.user_metadata?.avatar_url} />
                <AvatarFallback className="text-2xl">
                  {user?.email?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
            </div>
            <CardTitle className="text-xl">
              {user?.user_metadata?.full_name || 'Worker'}
            </CardTitle>
            <Badge variant="secondary" className="mx-auto">
              Construction Worker
            </Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Editable Name Field */}
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-sm font-medium">Full Name</Label>
              {isEditing ? (
                <div className="flex gap-2">
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter your full name"
                    className="flex-1"
                  />
                  <Button
                    size="sm"
                    onClick={handleSaveProfile}
                    disabled={isLoading}
                  >
                    <Save className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCancelEdit}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-between p-2 border rounded-md">
                  <span className="text-foreground">{fullName || 'No name set'}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setIsEditing(true)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-3 text-muted-foreground">
              <Mail className="w-4 h-4" />
              <span>{user?.email}</span>
            </div>
            <div className="flex items-center gap-3 text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span>Joined {new Date(user?.created_at || '').toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-3 text-muted-foreground">
              <Building className="w-4 h-4" />
              <span>Demo Construction Company</span>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Account Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button variant="outline" className="w-full justify-start">
              <User className="w-4 h-4 mr-2" />
              Edit Profile
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleSignOut}
              className="w-full justify-start"
            >
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </div>

      <MobileBottomNav />
    </div>
  )
}