import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CheckSquare, Clock, AlertCircle, Play, Square, CheckCircle2, Timer, MapPin, User } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { useOrganization } from '@/contexts/OrganizationContext'
import { useToast } from '@/hooks/use-toast'
import { format, isToday, isTomorrow, isThisWeek } from 'date-fns'

interface Task {
  id: string
  title: string
  description?: string
  status: string
  priority: string
  due_date?: string
  project_id: string
  assigned_to?: string
  created_at: string
  updated_at: string
  projects?: {
    id: string
    name: string
    location?: string
  }
}

interface TimeEntry {
  id: string
  start_ts: string
  end_ts?: string
  project_id?: string
  notes?: string
  projects?: {
    name: string
  }
}

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'high': return 'bg-destructive text-destructive-foreground'
    case 'medium': return 'bg-construction-orange text-construction-orange-foreground'
    case 'low': return 'bg-construction-gray-300 text-construction-gray-800'
    default: return 'bg-secondary text-secondary-foreground'
  }
}

const getPriorityIcon = (priority: string) => {
  switch (priority) {
    case 'high': return <AlertCircle className="h-4 w-4" />
    case 'medium': return <Clock className="h-4 w-4" />
    case 'low': return <CheckSquare className="h-4 w-4" />
    default: return <Square className="h-4 w-4" />
  }
}

const getTimeUntilDue = (dueDate: string) => {
  const due = new Date(dueDate)
  const now = new Date()
  const diffInHours = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60))
  
  if (diffInHours < 0) return 'Overdue'
  if (diffInHours === 0) return 'Due now'
  if (diffInHours < 24) return `${diffInHours}h left`
  const diffInDays = Math.ceil(diffInHours / 24)
  return `${diffInDays}d left`
}

export default function Today() {
  const { user } = useAuth()
  const { currentOrgId } = useOrganization()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [activeTimeEntry, setActiveTimeEntry] = useState<TimeEntry | null>(null)

  // Fetch today's tasks
  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ['today-tasks', user?.id],
    queryFn: async () => {
      if (!user?.id) return []
      
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          projects:project_id (
            id,
            name,
            location
          )
        `)
        .eq('assigned_to', user.id)
        .in('status', ['pending', 'in_progress'])
        .order('priority', { ascending: false })
        .order('due_date', { ascending: true })

      if (error) throw error
      return data || []
    },
    enabled: !!user?.id
  })

  // Fetch active time entry
  const { data: timeEntries = [] } = useQuery({
    queryKey: ['active-time-entry', user?.id],
    queryFn: async () => {
      if (!user?.id) return []
      
      const { data, error } = await supabase
        .from('time_entries')
        .select(`
          *,
          projects:project_id (name)
        `)
        .eq('user_id', user.id)
        .is('end_ts', null)
        .order('start_ts', { ascending: false })

      if (error) throw error
      return data || []
    },
    enabled: !!user?.id
  })

  useEffect(() => {
    if (timeEntries.length > 0) {
      setActiveTimeEntry(timeEntries[0])
    } else {
      setActiveTimeEntry(null)
    }
  }, [timeEntries])

  // Mark task as complete
  const updateTaskMutation = useMutation({
    mutationFn: async ({ taskId, status }: { taskId: string, status: string }) => {
      const { error } = await supabase
        .from('tasks')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', taskId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['today-tasks'] })
      toast({
        title: 'Task updated',
        description: 'Task status updated successfully',
      })
    }
  })

  // Start/stop time tracking
  const timeTrackingMutation = useMutation({
    mutationFn: async ({ action, projectId }: { action: 'start' | 'stop', projectId?: string }) => {
      if (action === 'start' && projectId) {
        const { error } = await supabase
          .from('time_entries')
          .insert({
            user_id: user?.id!,
            organization_id: currentOrgId!,
            project_id: projectId,
            start_ts: new Date().toISOString(),
            entry_type: 'labour'
          })

        if (error) throw error
      } else if (action === 'stop' && activeTimeEntry) {
        const { error } = await supabase
          .from('time_entries')
          .update({ end_ts: new Date().toISOString() })
          .eq('id', activeTimeEntry.id)

        if (error) throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['active-time-entry'] })
      toast({
        title: activeTimeEntry ? 'Time tracking stopped' : 'Time tracking started',
        description: activeTimeEntry ? 'Your time has been logged' : 'Time tracking is now active',
      })
    }
  })

  const todayTasks = tasks.filter(task => 
    !task.due_date || isToday(new Date(task.due_date)) || new Date(task.due_date) < new Date()
  )
  
  const upcomingTasks = tasks.filter(task => 
    task.due_date && (isTomorrow(new Date(task.due_date)) || isThisWeek(new Date(task.due_date)))
  )

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good Morning!'
    if (hour < 17) return 'Good Afternoon!'
    return 'Good Evening!'
  }

  const TaskCard = ({ task }: { task: Task }) => (
    <Card className="transition-all hover:shadow-md">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <Badge className={getPriorityColor(task.priority)}>
                {getPriorityIcon(task.priority)}
                {task.priority}
              </Badge>
              {task.due_date && (
                <Badge variant="outline" className="text-xs">
                  <Clock className="h-3 w-3 mr-1" />
                  {getTimeUntilDue(task.due_date)}
                </Badge>
              )}
            </div>
            
            <h3 className="font-semibold text-lg">{task.title}</h3>
            
            {task.description && (
              <p className="text-muted-foreground text-sm line-clamp-2">{task.description}</p>
            )}
            
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              {task.projects && (
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  <span>{task.projects.name}</span>
                </div>
              )}
              {task.projects?.location && (
                <span className="text-xs">{task.projects.location}</span>
              )}
            </div>
          </div>
          
          <div className="flex flex-col gap-2">
            {task.status === 'pending' && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => updateTaskMutation.mutate({ taskId: task.id, status: 'in_progress' })}
                disabled={updateTaskMutation.isPending}
              >
                <Play className="h-4 w-4 mr-1" />
                Start
              </Button>
            )}
            
            {task.status === 'in_progress' && (
              <Button
                size="sm"
                onClick={() => updateTaskMutation.mutate({ taskId: task.id, status: 'completed' })}
                disabled={updateTaskMutation.isPending}
              >
                <CheckCircle2 className="h-4 w-4 mr-1" />
                Complete
              </Button>
            )}
            
            {task.projects && !activeTimeEntry && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => timeTrackingMutation.mutate({ action: 'start', projectId: task.project_id })}
                disabled={timeTrackingMutation.isPending}
              >
                <Timer className="h-4 w-4 mr-1" />
                Track
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">{getGreeting()}</h1>
        <p className="text-muted-foreground">
          {format(new Date(), 'EEEE, MMMM do, yyyy')} • 
          {todayTasks.length} task{todayTasks.length !== 1 ? 's' : ''} for today
        </p>
      </div>

      {/* Active Time Tracking */}
      {activeTimeEntry && (
        <Card className="border-primary bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-primary rounded-full animate-pulse" />
                <div>
                  <p className="font-semibold">Time Tracking Active</p>
                  <p className="text-sm text-muted-foreground">
                    {activeTimeEntry.projects?.name || 'General Work'} • 
                    Started {format(new Date(activeTimeEntry.start_ts), 'HH:mm')}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={() => timeTrackingMutation.mutate({ action: 'stop' })}
                disabled={timeTrackingMutation.isPending}
              >
                <Square className="h-4 w-4 mr-1" />
                Stop
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tasks */}
      <Tabs defaultValue="today" className="space-y-4">
        <TabsList>
          <TabsTrigger value="today">Today ({todayTasks.length})</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming ({upcomingTasks.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="today" className="space-y-4">
          {tasksLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-4">
                    <div className="h-20 bg-muted rounded" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : todayTasks.length > 0 ? (
            <div className="space-y-4">
              {todayTasks.map(task => (
                <TaskCard key={task.id} task={task} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <CheckSquare className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No Tasks Today</h3>
                <p className="text-muted-foreground">
                  You're all caught up! Check upcoming tasks or enjoy your day.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="upcoming" className="space-y-4">
          {upcomingTasks.length > 0 ? (
            <div className="space-y-4">
              {upcomingTasks.map(task => (
                <TaskCard key={task.id} task={task} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Clock className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No Upcoming Tasks</h3>
                <p className="text-muted-foreground">
                  Your schedule looks clear for the next few days.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}