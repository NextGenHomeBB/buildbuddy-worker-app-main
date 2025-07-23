import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { MobileBottomNav } from '@/components/MobileBottomNav'
import { Briefcase, Calendar, Users, MapPin, ArrowLeft } from 'lucide-react'

interface Project {
  id: string
  name: string
  description: string | null
  status: string
  progress: number
  budget: number | null
  location: string | null
  start_date: string | null
  company_id: string | null
}

export default function Projects() {
  const navigate = useNavigate()
  const { user } = useAuth()
  
  const { data: projects, isLoading, error } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      console.log('Fetching projects for user:', user?.id)
      
      // First, let's check what user_project_role entries exist for this user
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_project_role')
        .select('*')
        .eq('user_id', user?.id)
      
      console.log('User project roles:', userRoles)
      if (rolesError) console.error('Error fetching user roles:', rolesError)
      
      // Also check the user's profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single()
      
      console.log('User profile:', profile)
      if (profileError) console.error('Error fetching profile:', profileError)

      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false })

      console.log('Projects query result:', { data, error })
      
      if (error) {
        console.error('Projects query error:', error)
        throw error
      }
      
      console.log('Projects returned:', data?.length || 0)
      return data as Project[]
    },
    enabled: !!user, // Only run query if user is available
  })

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4 pb-20">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-64" />
            ))}
          </div>
        </div>
        <MobileBottomNav />
      </div>
    )
  }

  if (error) {
    console.error('Projects page error:', error)
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Error Loading Projects</CardTitle>
            <CardDescription>
              {error.message || 'Failed to load projects. Please try again.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>User ID: {user?.id}</p>
              <p>Error details: {JSON.stringify(error)}</p>
            </div>
          </CardContent>
        </Card>
        <MobileBottomNav />
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500'
      case 'planning':
        return 'bg-yellow-500'
      case 'completed':
        return 'bg-blue-500'
      case 'on_hold':
        return 'bg-orange-500'
      default:
        return 'bg-gray-500'
    }
  }

  const formatCurrency = (amount: number | null) => {
    if (!amount) return 'No budget set'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'No date set'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  console.log('Rendering projects page with projects:', projects?.length || 0)

  return (
    <div className="min-h-screen bg-background p-4 pb-20">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate(-1)}
            className="mb-4 -ml-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold text-foreground mb-2">Projects</h1>
          <p className="text-muted-foreground">
            Manage and track your construction projects
          </p>
          <div className="mt-2 text-sm text-muted-foreground">
            <p>Logged in as: {user?.email}</p>
            <p>User ID: {user?.id}</p>
            <p>Projects found: {projects?.length || 0}</p>
          </div>
        </div>

        {projects?.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Briefcase className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No projects available</h3>
              <p className="text-muted-foreground mb-4">
                You don't have access to any projects yet. This could be because:
              </p>
              <ul className="text-sm text-muted-foreground text-left max-w-md mx-auto space-y-1">
                <li>• You haven't been assigned to any projects</li>
                <li>• Your account permissions need to be updated</li>
                <li>• There might be a database connectivity issue</li>
              </ul>
              <p className="text-sm text-muted-foreground mt-4">
                Contact your project manager if you believe this is incorrect.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {projects?.map((project) => (
              <Card key={project.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{project.name}</CardTitle>
                      <Badge 
                        variant="secondary" 
                        className={`${getStatusColor(project.status)} text-white`}
                      >
                        {project.status.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                  {project.description && (
                    <CardDescription className="line-clamp-2">
                      {project.description}
                    </CardDescription>
                  )}
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Progress</span>
                      <span>{Math.round(project.progress)}%</span>
                    </div>
                    <Progress value={project.progress} className="h-2" />
                  </div>

                  <div className="space-y-2 text-sm">
                    {project.location && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span>{project.location}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>Start: {formatDate(project.start_date)}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span>Budget: {formatCurrency(project.budget)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <MobileBottomNav />
    </div>
  )
}
