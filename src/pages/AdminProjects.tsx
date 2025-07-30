import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Building, Search, Filter } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { TaskAssignmentModal } from '@/components/TaskAssignmentModal'

interface Task {
  id: string
  title: string
  description: string | null
  status: string
  priority: string
  assigned_to: string | null
  project_name?: string
  assigned_worker_name?: string
}

export default function AdminProjects() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    fetchTasks()
  }, [])

  const fetchTasks = async () => {
    try {
      setIsLoading(true)
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          projects(name),
          profiles(full_name)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      const formattedTasks = data?.map(task => ({
        ...task,
        project_name: (task.projects as any)?.name || 'Unknown Project',
        assigned_worker_name: (task.profiles as any)?.full_name || null
      })) || []

      setTasks(formattedTasks)
    } catch (error) {
      console.error('Error fetching tasks:', error)
      toast({
        title: 'Error',
        description: 'Failed to load tasks',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const filteredTasks = tasks.filter(task =>
    task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    task.project_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    task.assigned_worker_name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-construction-yellow border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading tasks...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building className="h-6 w-6" />
              <div>
                <CardTitle>Task Management</CardTitle>
                <CardDescription>
                  Assign and manage tasks for workers
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-6">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tasks, projects, or workers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>

          {filteredTasks.length === 0 ? (
            <div className="text-center py-8">
              <Building className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No tasks found</h3>
              <p className="text-muted-foreground">
                {searchTerm ? 'Try adjusting your search criteria' : 'No tasks available'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTasks.map((task) => (
                <Card key={task.id} className="border-l-4 border-l-primary">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{task.title}</h3>
                          <Badge variant="outline">{task.status}</Badge>
                          <Badge variant="outline">{task.priority}</Badge>
                        </div>
                        
                        {task.description && (
                          <p className="text-sm text-muted-foreground">
                            {task.description}
                          </p>
                        )}
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>Project: {task.project_name}</span>
                          <span>
                            Assigned to: {task.assigned_worker_name || 'Unassigned'}
                          </span>
                        </div>
                      </div>
                      
                      <div className="ml-4">
                        <TaskAssignmentModal 
                          task={task} 
                          onTaskUpdated={fetchTasks}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}