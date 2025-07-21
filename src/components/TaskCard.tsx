
import { useState, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { WorkerTask } from '@/lib/supabase'
import { useMyTasks } from '@/hooks/useMyTasks'
import { Clock, AlertCircle, Check, X } from 'lucide-react'

interface TaskCardProps {
  task: WorkerTask
}

export function TaskCard({ task }: TaskCardProps) {
  const { updateTaskStatus, isUpdating } = useMyTasks()
  const [swipeOffset, setSwipeOffset] = useState(0)
  const [isSwipingLeft, setIsSwipingLeft] = useState(false)
  const [isSwipingRight, setIsSwipingRight] = useState(false)
  const startXRef = useRef<number>(0)
  const isDraggingRef = useRef(false)

  const handleStatusChange = (checked: boolean) => {
    const newStatus = checked ? 'completed' : 'pending'
    updateTaskStatus({ taskId: task.id, status: newStatus })
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    startXRef.current = e.touches[0].clientX
    isDraggingRef.current = false
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!startXRef.current) return
    
    const currentX = e.touches[0].clientX
    const diffX = currentX - startXRef.current
    
    // Only allow horizontal swipes
    if (Math.abs(diffX) > 10) {
      isDraggingRef.current = true
      setSwipeOffset(diffX)
      
      // Show action indicators
      if (diffX > 50) {
        setIsSwipingRight(true)
        setIsSwipingLeft(false)
      } else if (diffX < -50) {
        setIsSwipingLeft(true)
        setIsSwipingRight(false)
      } else {
        setIsSwipingRight(false)
        setIsSwipingLeft(false)
      }
    }
  }

  const handleTouchEnd = () => {
    if (!isDraggingRef.current) {
      // Reset states if not dragging
      setSwipeOffset(0)
      setIsSwipingLeft(false)
      setIsSwipingRight(false)
      return
    }

    // Execute action based on swipe direction and distance
    if (swipeOffset > 80 && task.status !== 'completed') {
      // Swipe right to complete
      handleStatusChange(true)
    } else if (swipeOffset < -80 && task.status === 'completed') {
      // Swipe left to uncomplete
      handleStatusChange(false)
    }

    // Reset swipe states
    setSwipeOffset(0)
    setIsSwipingLeft(false)
    setIsSwipingRight(false)
    isDraggingRef.current = false
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
        return 'bg-construction-yellow/20 text-construction-yellow dark:bg-construction-yellow/10 dark:text-construction-yellow'
      case 'pending':
        return 'bg-construction-orange/20 text-construction-orange dark:bg-construction-orange/10 dark:text-construction-orange'
      default:
        return 'bg-muted text-muted-foreground'
    }
  }

  return (
    <div className="relative overflow-hidden rounded-lg">
      {/* Swipe Action Backgrounds */}
      {isSwipingRight && (
        <div className="absolute inset-0 bg-green-500 flex items-center justify-start pl-6 z-0">
          <Check className="w-6 h-6 text-white" />
          <span className="ml-2 text-white font-medium">Complete</span>
        </div>
      )}
      {isSwipingLeft && (
        <div className="absolute inset-0 bg-orange-500 flex items-center justify-end pr-6 z-0">
          <span className="mr-2 text-white font-medium">Undo</span>
          <X className="w-6 h-6 text-white" />
        </div>
      )}

      {/* Main Card */}
      <Card 
        className={`relative z-10 transition-transform duration-200 ease-out touch-target ${
          isSwipingRight ? 'bg-green-50 border-green-200' : 
          isSwipingLeft ? 'bg-orange-50 border-orange-200' : ''
        }`}
        style={{ transform: `translateX(${swipeOffset}px)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <CardHeader className="pb-3 px-4 xs:px-6">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start space-x-3 flex-1 min-w-0">
              <Checkbox
                checked={task.status === 'completed'}
                onCheckedChange={handleStatusChange}
                disabled={isUpdating}
                className="mt-1 touch-target data-[state=checked]:bg-construction-yellow data-[state=checked]:border-construction-yellow"
              />
              <CardTitle className={`text-base xs:text-lg leading-tight ${
                task.status === 'completed' 
                  ? 'line-through text-muted-foreground' 
                  : 'text-foreground'
              }`}>
                {task.title}
              </CardTitle>
            </div>
            <div className="flex flex-col gap-2 items-end">
              <Badge variant={getPriorityColor(task.priority)} className="text-xs">
                {task.priority}
              </Badge>
              <Badge className={`text-xs ${getStatusColor(task.status)}`}>
                {task.status.replace('_', ' ')}
              </Badge>
            </div>
          </div>
        </CardHeader>
        
        {task.description && (
          <CardContent className="pt-0 px-4 xs:px-6">
            <p className="text-muted-foreground text-sm xs:text-base leading-relaxed">
              {task.description}
            </p>
            
            <div className="flex flex-col xs:flex-row xs:items-center gap-2 xs:gap-4 mt-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>Created: {new Date(task.created_at).toLocaleDateString()}</span>
              </div>
              {task.due_date && (
                <div className="flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  <span>Due: {new Date(task.due_date).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </CardContent>
        )}
      </Card>

      {/* Swipe Instructions - Show on first few tasks */}
      {task.status === 'pending' && (
        <div className="lg:hidden absolute bottom-2 left-1/2 transform -translate-x-1/2 text-xs text-muted-foreground opacity-60">
          Swipe right to complete
        </div>
      )}
    </div>
  )
}
