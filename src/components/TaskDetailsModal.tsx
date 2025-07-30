import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { WorkerTask, supabase } from '@/lib/types'
import { AlertTriangle, Minus, Circle, Clock, Calendar, CheckCircle2, X, Building, Layers } from 'lucide-react'
import { format } from 'date-fns'
import { useState, useEffect } from 'react'

interface TaskDetailsModalProps {
  task: WorkerTask | null
  isOpen: boolean
  onClose: () => void
}

export function TaskDetailsModal({ task, isOpen, onClose }: TaskDetailsModalProps) {
  const [projectInfo, setProjectInfo] = useState<{ name: string; phase: string } | null>(null)
  const [loading, setLoading] = useState(false)

  // Fetch project and phase information
  useEffect(() => {
    const fetchProjectInfo = async () => {
      if (!task || !isOpen) return
      
      setLoading(true)
      try {
        // First get the basic task data to check phase_id
        const { data: taskData, error: taskError } = await supabase
          .from('tasks')
          .select(`
            phase_id,
            project_id,
            projects (name),
            project_phases (name)
          `)
          .eq('id', task.id)
          .single()

        if (taskError) {
          console.error('Error fetching task data:', taskError)
          return
        }

        console.log('Task data:', taskData) // Debug log

        if (taskData) {
          setProjectInfo({
            name: (taskData.projects as any)?.name || 'Unknown Project',
            phase: (taskData.project_phases as any)?.name || (taskData.phase_id ? 'Phase Not Found' : 'No Phase Assigned')
          })
        }
      } catch (error) {
        console.error('Error fetching project info:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchProjectInfo()
  }, [task, isOpen])

  if (!task) return null

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
        return 'destructive'
      case 'medium':
        return 'secondary'
      case 'low':
        return 'outline'
      default:
        return 'secondary'
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

  const getStatusBadge = (status: WorkerTask['status']) => {
    switch (status) {
      case 'completed':
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Completed
          </Badge>
        )
      case 'pending':
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
            <Clock className="h-3 w-3 mr-1" />
            {status}
          </Badge>
        )
    }
  }

  const PriorityIcon = getPriorityIcon(task.priority)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg animate-scale-in">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <DialogTitle className="text-xl font-semibold text-gray-900 pr-4">
              {task.title}
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6 animate-fade-in">
          {/* Status and Priority */}
          <div className="flex items-center gap-3">
            {getStatusBadge(task.status)}
            <Badge variant={getPriorityColor(task.priority)} className="flex items-center gap-1">
              <PriorityIcon className="h-3 w-3" />
              {getPriorityLabel(task.priority)}
            </Badge>
          </div>

          {/* Description */}
          {task.description && (
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">Description</h4>
              <p className="text-gray-600 leading-relaxed">
                {task.description}
              </p>
            </div>
          )}

          {/* Project and Phase Information */}
          {projectInfo && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-900">Project & Phase</h4>
              <div className="grid grid-cols-1 gap-3 text-sm">
                {/* Project */}
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500 flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    Project
                  </span>
                  <span className="text-gray-900 font-medium">
                    {projectInfo.name}
                  </span>
                </div>

                {/* Phase */}
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500 flex items-center gap-2">
                    <Layers className="h-4 w-4" />
                    Phase
                  </span>
                  <span className="text-gray-900 font-medium">
                    {projectInfo.phase}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Task Details */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-900">Task Information</h4>
            
            <div className="grid grid-cols-1 gap-3 text-sm">
              {/* Created Date */}
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Created
                </span>
                <span className="text-gray-900 font-medium">
                  {format(new Date(task.created_at), 'MMM d, yyyy')}
                </span>
              </div>

              {/* Due Date */}
              {task.due_date && (
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500 flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Due Date
                  </span>
                  <span className="text-gray-900 font-medium">
                    {format(new Date(task.due_date), 'MMM d, yyyy')}
                  </span>
                </div>
              )}

              {/* Last Updated */}
              <div className="flex items-center justify-between py-2">
                <span className="text-gray-500 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Last Updated
                </span>
                <span className="text-gray-900 font-medium">
                  {format(new Date(task.updated_at), 'MMM d, yyyy')}
                </span>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div className="flex justify-end pt-4 border-t border-gray-100">
            <Button onClick={onClose} className="hover-scale">
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}