import { Clock, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { DailyTaskAssignment } from '@/hooks/useDailyTasks'

interface DailyTaskCardProps {
  task: DailyTaskAssignment
  onComplete: (taskId: string) => void
  isCompleting: boolean
  getTimeRemaining: (expiresAt: string) => string
  isTaskExpiringSoon: (expiresAt: string) => boolean
}

export function DailyTaskCard({ 
  task, 
  onComplete, 
  isCompleting, 
  getTimeRemaining, 
  isTaskExpiringSoon 
}: DailyTaskCardProps) {
  const handleStatusChange = (checked: boolean) => {
    if (checked) {
      onComplete(task.id)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-destructive text-destructive-foreground'
      case 'medium': return 'bg-warning text-warning-foreground'
      case 'low': return 'bg-muted text-muted-foreground'
      default: return 'bg-secondary text-secondary-foreground'
    }
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return <AlertTriangle className="h-3 w-3" />
      case 'medium': return <Clock className="h-3 w-3" />
      case 'low': return <CheckCircle2 className="h-3 w-3" />
      default: return null
    }
  }

  const timeRemaining = getTimeRemaining(task.expires_at)
  const isExpiringSoon = isTaskExpiringSoon(task.expires_at)

  return (
    <Card 
      className={`transition-all duration-200 hover:shadow-md ${
        isExpiringSoon ? 'border-warning/50 bg-warning/5' : ''
      }`}
      data-testid="daily-task-card"
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Checkbox
            checked={false}
            onCheckedChange={handleStatusChange}
            disabled={isCompleting}
            className="mt-1 flex-shrink-0"
          />
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-2">
              <h3 className="font-medium text-foreground line-clamp-1">
                {task.task_template?.title}
              </h3>
              
              <div className="flex items-center gap-2 flex-shrink-0">
                {task.task_template?.priority && (
                  <Badge 
                    variant="secondary" 
                    className={`${getPriorityColor(task.task_template.priority)} text-xs flex items-center gap-1`}
                  >
                    {getPriorityIcon(task.task_template.priority)}
                    {task.task_template.priority}
                  </Badge>
                )}
              </div>
            </div>

            {task.task_template?.description && (
              <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                {task.task_template.description}
              </p>
            )}

            <div className="flex items-center justify-between text-xs text-muted-foreground">
              {task.project?.name && (
                <span className="font-medium text-primary">
                  {task.project.name}
                </span>
              )}
              
              <div className={`flex items-center gap-1 ${
                isExpiringSoon ? 'text-warning font-medium' : ''
              }`}>
                <Clock className="h-3 w-3" />
                <span>{timeRemaining}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}