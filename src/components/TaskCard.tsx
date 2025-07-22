
import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { WorkerTask } from '@/lib/supabase'
import { useMyTasks } from '@/hooks/useMyTasks'
import { ArrowRight } from 'lucide-react'

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
        return 'text-red-600'
      case 'medium':
        return 'text-orange-600'
      case 'low':
        return 'text-green-600'
      default:
        return 'text-orange-600'
    }
  }

  return (
    <Card className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3 flex-1">
            <Checkbox
              checked={task.status === 'completed'}
              onCheckedChange={handleStatusChange}
              disabled={isUpdating}
              className="mt-1 h-5 w-5 border-2 border-gray-300 data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
            />
            
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
                <span className={`text-xs font-medium ${getPriorityColor(task.priority)}`}>
                  {getPriorityLabel(task.priority)}
                </span>
                
                <span className="text-xs text-gray-400">
                  Project Task
                </span>
              </div>
            </div>
          </div>
          
          <ArrowRight className="h-5 w-5 text-gray-300 ml-3 flex-shrink-0" />
        </div>
      </CardContent>
    </Card>
  )
}
