
import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { WorkerTask } from '@/lib/supabase'
import { useMyTasks } from '@/hooks/useMyTasks'
import { ArrowRight, AlertTriangle, Minus, Circle } from 'lucide-react'

interface TaskCardProps {
  task: WorkerTask
}

export function TaskCard({ task }: TaskCardProps) {
  const { updateTaskStatus, isUpdating } = useMyTasks()

  const handleStatusChange = (checked: boolean) => {
    const newStatus = checked ? 'completed' : 'pending'
    updateTaskStatus({ taskId: task.id, status: newStatus })
  }

  const getPriorityLabel = (priority: WorkerTask['priority']) => {
    switch (priority) {
      case 'high':
        return 'High Priority'
      case 'medium':
        return 'Medium Priority'
      case 'low':
        return 'Low Priority'
      default:
        return 'Medium Priority'
    }
  }

  const getPriorityColor = (priority: WorkerTask['priority']) => {
    switch (priority) {
      case 'high':
        return 'text-red-700'
      case 'medium':
        return 'text-orange-600'
      case 'low':
        return 'text-green-600'
      default:
        return 'text-orange-600'
    }
  }

  const getPriorityIcon = (priority: WorkerTask['priority']) => {
    switch (priority) {
      case 'high':
        return AlertTriangle
      case 'medium':
        return Minus
      case 'low':
        return Circle
      default:
        return Minus
    }
  }

  const PriorityIcon = getPriorityIcon(task.priority)

  return (
    <Card data-testid="task-card" className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-brandBlue">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3 flex-1">
            <label className="p-2 cursor-pointer">
              <Checkbox
                checked={task.status === 'completed'}
                onCheckedChange={handleStatusChange}
                disabled={isUpdating}
                className="rounded-full border-2 border-gray-300 data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-green-500"
              />
              <span className="sr-only">Mark task as {task.status === 'completed' ? 'incomplete' : 'complete'}</span>
            </label>
            
            <div className="flex-1 min-w-0">
              <h3 className={`font-medium text-gray-900 mb-1 ${
                task.status === 'completed' ? 'line-through text-gray-500' : ''
              }`}>
                {task.title}
              </h3>
              
              {task.description && (
                <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                  {task.description}
                </p>
              )}
              
              <div className="flex items-center justify-between">
                <div className={`flex items-center gap-1 text-xs font-medium ${getPriorityColor(task.priority)}`}>
                  <PriorityIcon className="h-3 w-3" aria-hidden="true" />
                  <span>{getPriorityLabel(task.priority)}</span>
                  <span className="sr-only">{task.priority} priority</span>
                </div>
                
                <span className="text-xs text-gray-400">
                  Project Task
                </span>
              </div>
            </div>
          </div>
          
          <button
            className="p-2 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brandBlue rounded"
            aria-label="View task details"
          >
            <ArrowRight className="h-5 w-5 text-gray-300" />
          </button>
        </div>
      </CardContent>
    </Card>
  )
}
