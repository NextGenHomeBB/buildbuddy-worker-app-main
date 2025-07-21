
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
    <div className="group relative overflow-hidden rounded-xl border border-border/40 bg-card/60 backdrop-blur-sm hover:border-border/60 hover:bg-card/80 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5">
      {/* Swipe Action Backgrounds with Improved Visual Feedback */}
      {isSwipingRight && (
        <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-green-400 flex items-center justify-start pl-6 z-0 animate-pulse">
          <div className="flex items-center space-x-3">
            <div className="bg-white/20 rounded-full p-2">
              <Check className="w-5 h-5 text-white" />
            </div>
            <span className="text-white font-semibold text-lg">Complete Task</span>
          </div>
        </div>
      )}
      {isSwipingLeft && task.status === 'completed' && (
        <div className="absolute inset-0 bg-gradient-to-l from-orange-500 to-orange-400 flex items-center justify-end pr-6 z-0 animate-pulse">
          <div className="flex items-center space-x-3">
            <span className="text-white font-semibold text-lg">Mark Incomplete</span>
            <div className="bg-white/20 rounded-full p-2">
              <X className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>
      )}

      {/* Main Card with Enhanced Styling */}
      <Card 
        className={`relative z-10 border-0 shadow-none transition-all duration-300 ease-out ${
          isSwipingRight ? 'bg-green-50/80 dark:bg-green-950/50 scale-[0.98]' : 
          isSwipingLeft ? 'bg-orange-50/80 dark:bg-orange-950/50 scale-[0.98]' : 
          'hover:scale-[1.01] active:scale-[0.99]'
        } ${task.status === 'completed' ? 'opacity-75' : 'opacity-100'}`}
        style={{ transform: `translateX(${swipeOffset}px)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <CardHeader className="pb-4 px-5 xs:px-7 pt-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start space-x-4 flex-1 min-w-0">
              <div className="relative">
                <Checkbox
                  checked={task.status === 'completed'}
                  onCheckedChange={handleStatusChange}
                  disabled={isUpdating}
                  className="mt-0.5 h-5 w-5 border-2 transition-all duration-200 data-[state=checked]:bg-construction-yellow data-[state=checked]:border-construction-yellow hover:border-construction-yellow/60 shadow-sm"
                />
                {isUpdating && (
                  <div className="absolute inset-0 rounded border-2 border-construction-yellow/30 animate-ping" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <CardTitle className={`text-lg xs:text-xl font-semibold leading-tight mb-1 transition-all duration-200 ${
                  task.status === 'completed' 
                    ? 'line-through text-muted-foreground/60' 
                    : 'text-foreground group-hover:text-primary'
                }`}>
                  {task.title}
                </CardTitle>
                {task.description && (
                  <p className="text-muted-foreground text-sm xs:text-base leading-relaxed line-clamp-2">
                    {task.description}
                  </p>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-2 items-end shrink-0">
              <Badge 
                variant={getPriorityColor(task.priority)} 
                className="text-xs font-medium shadow-sm transition-all duration-200 hover:shadow-md"
              >
                {task.priority.toUpperCase()}
              </Badge>
              <Badge 
                className={`text-xs font-medium shadow-sm transition-all duration-200 ${getStatusColor(task.status)}`}
              >
                {task.status.replace('_', ' ').toUpperCase()}
              </Badge>
            </div>
          </div>
        </CardHeader>
        
        {(task.created_at || task.due_date) && (
          <CardContent className="pt-0 px-5 xs:px-7 pb-5">
            <div className="flex flex-wrap items-center gap-3 xs:gap-6 mt-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5 bg-muted/30 rounded-full px-2 py-1">
                <Clock className="h-3 w-3" />
                <span>Created {new Date(task.created_at).toLocaleDateString()}</span>
              </div>
              {task.due_date && (
                <div className="flex items-center gap-1.5 bg-destructive/10 text-destructive rounded-full px-2 py-1">
                  <AlertCircle className="h-3 w-3" />
                  <span>Due {new Date(task.due_date).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </CardContent>
        )}
      </Card>

      {/* Enhanced Swipe Instructions */}
      {task.status === 'pending' && !isSwipingRight && !isSwipingLeft && (
        <div className="lg:hidden absolute bottom-3 left-1/2 transform -translate-x-1/2 text-xs text-muted-foreground/70 bg-background/80 backdrop-blur-sm rounded-full px-3 py-1 border border-border/30 group-hover:opacity-100 transition-opacity duration-300">
          Swipe right to complete →
        </div>
      )}
      {task.status === 'completed' && !isSwipingRight && !isSwipingLeft && (
        <div className="lg:hidden absolute bottom-3 left-1/2 transform -translate-x-1/2 text-xs text-muted-foreground/70 bg-background/80 backdrop-blur-sm rounded-full px-3 py-1 border border-border/30 group-hover:opacity-100 transition-opacity duration-300">
          ← Swipe left to mark incomplete
        </div>
      )}
    </div>
  )
}
