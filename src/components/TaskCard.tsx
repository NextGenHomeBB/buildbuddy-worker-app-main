import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { WorkerTask } from '@/lib/supabase'
import { useMyTasks } from '@/hooks/useMyTasks'
import { Clock, AlertCircle } from 'lucide-react'

interface TaskCardProps {
  task: WorkerTask
}

export function TaskCard({ task }: TaskCardProps) {
  const { updateTaskStatus, isUpdating } = useMyTasks()

  const handleStatusChange = (checked: boolean) => {
    const newStatus = checked ? 'completed' : 'pending'
    updateTaskStatus({ taskId: task.id, status: newStatus })
  }

  const getPriorityColor = (priority: WorkerTask['priority']) => {
    switch (priority) {
      case 'high':
        return 'destructive'
      case 'medium':
        return 'secondary'
      case 'low':
        return 'outline'
      default:
        return 'outline'
    }
  }

  const getStatusColor = (status: WorkerTask['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
      default:
        return 'bg-muted text-muted-foreground'
    }
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <Checkbox
              checked={task.status === 'completed'}
              onCheckedChange={handleStatusChange}
              disabled={isUpdating}
              className="mt-1"
            />
            <CardTitle className={`text-lg ${task.status === 'completed' ? 'line-through text-muted-foreground' : ''}`}>
              {task.title}
            </CardTitle>
          </div>
          <div className="flex gap-2">
            <Badge variant={getPriorityColor(task.priority)}>
              {task.priority}
            </Badge>
            <Badge className={getStatusColor(task.status)}>
              {task.status.replace('_', ' ')}
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      {task.description && (
        <CardContent className="pt-0">
          <p className="text-muted-foreground text-sm">{task.description}</p>
          
          <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Created: {new Date(task.created_at).toLocaleDateString()}
            </div>
            {task.due_date && (
              <div className="flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Due: {new Date(task.due_date).toLocaleDateString()}
              </div>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  )
}