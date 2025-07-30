import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { 
  Building, 
  MapPin, 
  Calendar, 
  DollarSign, 
  Users, 
  Clock,
  Search,
  Eye,
  Play,
  Pause,
  CheckCircle2,
  AlertCircle
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { useOrganization } from '@/contexts/OrganizationContext'
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'

interface Project {
  id: string
  name: string
  description?: string
  status: string
  location?: string
  budget?: number
  progress?: number
  start_date?: string
  end_date?: string
  manager_id?: string
  organization_id: string
  created_at: string
  updated_at: string
  spent?: number
  remaining_budget?: number
}

interface ProjectStats {
  total_tasks: number
  completed_tasks: number
  active_workers: number
  time_logged_hours: number
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'active': return 'bg-primary text-primary-foreground'
    case 'completed': return 'bg-green-500 text-white'
    case 'on_hold': return 'bg-construction-orange text-construction-orange-foreground'
    case 'draft': return 'bg-construction-gray-300 text-construction-gray-800'
    default: return 'bg-secondary text-secondary-foreground'
  }
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'active': return <Play className="h-4 w-4" />
    case 'completed': return <CheckCircle2 className="h-4 w-4" />
    case 'on_hold': return <Pause className="h-4 w-4" />
    case 'draft': return <AlertCircle className="h-4 w-4" />
    default: return <Building className="h-4 w-4" />
  }
}

export default function Projects() {
  const { user } = useAuth()
  const { currentOrgId } = useOrganization()
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  // Fetch projects
  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['projects', currentOrgId],
    queryFn: async () => {
      if (!currentOrgId) return []
      
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('organization_id', currentOrgId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    },
    enabled: !!currentOrgId
  })

  // Fetch project statistics
  const { data: projectStats = {} } = useQuery({
    queryKey: ['project-stats', currentOrgId],
    queryFn: async () => {
      if (!currentOrgId || projects.length === 0) return {}
      
      const stats: Record<string, ProjectStats> = {}
      
      for (const project of projects) {
        // Get task counts
        const { data: tasks } = await supabase
          .from('tasks')
          .select('id, status')
          .eq('project_id', project.id)

        const totalTasks = tasks?.length || 0
        const completedTasks = tasks?.filter(t => t.status === 'completed').length || 0

        // Get active workers count
        const { data: workers } = await supabase
          .from('task_workers')
          .select('user_id')
          .eq('organization_id', currentOrgId)
          .in('task_id', tasks?.map(t => t.id) || [])

        const activeWorkers = new Set(workers?.map(w => w.user_id) || []).size

        // Get time logged (simplified - would need proper aggregation in real app)
        const { data: timeEntries } = await supabase
          .from('time_entries')
          .select('start_ts, end_ts')
          .eq('project_id', project.id)
          .not('end_ts', 'is', null)

        const timeLoggedHours = timeEntries?.reduce((total, entry) => {
          const start = new Date(entry.start_ts)
          const end = new Date(entry.end_ts!)
          return total + (end.getTime() - start.getTime()) / (1000 * 60 * 60)
        }, 0) || 0

        stats[project.id] = {
          total_tasks: totalTasks,
          completed_tasks: completedTasks,
          active_workers: activeWorkers,
          time_logged_hours: Math.round(timeLoggedHours * 10) / 10
        }
      }
      
      return stats
    },
    enabled: !!currentOrgId && projects.length > 0
  })

  // Filter projects
  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.location?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  const ProjectCard = ({ project }: { project: Project }) => {
    const stats = projectStats[project.id] || {
      total_tasks: 0,
      completed_tasks: 0,
      active_workers: 0,
      time_logged_hours: 0
    }

    const taskProgress = stats.total_tasks > 0 ? (stats.completed_tasks / stats.total_tasks) * 100 : 0
    const budgetUsed = project.budget && project.spent ? (project.spent / project.budget) * 100 : 0

    return (
      <Card className="transition-all hover:shadow-md cursor-pointer group">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg group-hover:text-primary transition-colors">
                  {project.name}
                </CardTitle>
                <Badge className={getStatusColor(project.status)}>
                  {getStatusIcon(project.status)}
                  {project.status.replace('_', ' ')}
                </Badge>
              </div>
              
              {project.description && (
                <CardDescription className="line-clamp-2">
                  {project.description}
                </CardDescription>
              )}
            </div>
            
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate(`/projects/${project.id}`)}
            >
              <Eye className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Location and Dates */}
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            {project.location && (
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                <span>{project.location}</span>
              </div>
            )}
            {project.start_date && (
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>{format(new Date(project.start_date), 'MMM dd, yyyy')}</span>
              </div>
            )}
          </div>

          {/* Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Task Progress</span>
              <span>{stats.completed_tasks}/{stats.total_tasks} tasks</span>
            </div>
            <Progress value={taskProgress} className="h-2" />
          </div>

          {/* Budget Progress */}
          {project.budget && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Budget Used</span>
                <span>${project.spent?.toLocaleString() || 0} / ${project.budget.toLocaleString()}</span>
              </div>
              <Progress 
                value={budgetUsed} 
                className="h-2"
              />
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 pt-2 border-t">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>Workers</span>
              </div>
              <p className="text-lg font-semibold">{stats.active_workers}</p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>Hours</span>
              </div>
              <p className="text-lg font-semibold">{stats.time_logged_hours}h</p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
                <DollarSign className="h-4 w-4" />
                <span>Budget</span>
              </div>
              <p className="text-lg font-semibold">
                {project.budget ? `$${(project.budget / 1000).toFixed(0)}k` : 'N/A'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const projectsByStatus = {
    active: filteredProjects.filter(p => p.status === 'active'),
    completed: filteredProjects.filter(p => p.status === 'archived'), // Using 'archived' which exists in DB
    on_hold: filteredProjects.filter(p => p.status === 'archived'), // Treating 'completed' as archived
    draft: filteredProjects.filter(p => p.status === 'draft')
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Projects</h1>
          <p className="text-muted-foreground">
            Manage construction projects and track progress
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex gap-2">
          <Button
            variant={statusFilter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('all')}
          >
            All ({filteredProjects.length})
          </Button>
          <Button
            variant={statusFilter === 'active' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('active')}
          >
            Active ({projectsByStatus.active.length})
          </Button>
          <Button
            variant={statusFilter === 'completed' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('completed')}
          >
            Completed ({projectsByStatus.completed.length})
          </Button>
        </div>
      </div>

      {/* Projects Grid */}
      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-muted rounded w-3/4" />
                <div className="h-4 bg-muted rounded w-1/2" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="h-4 bg-muted rounded" />
                  <div className="h-2 bg-muted rounded" />
                  <div className="h-16 bg-muted rounded" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredProjects.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredProjects.map(project => (
            <div key={project.id} onClick={() => navigate(`/projects/${project.id}`)}>
              <ProjectCard project={project} />
            </div>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <Building className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">
              {searchTerm || statusFilter !== 'all' ? 'No Projects Found' : 'No Projects Yet'}
            </h3>
            <p className="text-muted-foreground">
              {searchTerm || statusFilter !== 'all' 
                ? 'Try adjusting your search or filters' 
                : 'Start by creating your first construction project'
              }
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}