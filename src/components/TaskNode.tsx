import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { TaskMapTask } from '@/hooks/useTaskMap'

interface TaskNodeProps {
  task: TaskMapTask
  isDragOverlay?: boolean
  isDropTarget?: boolean
  isBeingDragged?: boolean
}

export function TaskNode({ task, isDragOverlay, isDropTarget, isBeingDragged }: TaskNodeProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: task.id,
    data: task
  })

  const style = {
    transform: CSS.Translate.toString(transform),
  }

  const priorityColors = {
    low: 'bg-blue-100 text-blue-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-red-100 text-red-800'
  }

  const statusColors = {
    todo: 'bg-gray-100 text-gray-800',
    done: 'bg-green-100 text-green-800'
  }

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`
        w-36 p-3 cursor-grab touch-none select-none transition-all duration-200
        ${isDragging || isDragOverlay ? 'opacity-60 shadow-lg scale-105' : 'opacity-100'}
        ${isDragOverlay ? 'rotate-2 border-primary shadow-2xl' : ''}
        ${isDropTarget ? 'border-green-400 border-2 bg-green-50 shadow-lg' : ''}
        ${isBeingDragged ? 'opacity-30' : ''}
        hover:shadow-md hover:scale-105 active:cursor-grabbing
        focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
      `}
    >
      <div className="space-y-2">
        <h3 className="text-sm font-medium line-clamp-2 leading-tight">
          {task.title}
        </h3>
        
        <div className="flex flex-col gap-1">
          <Badge 
            variant="secondary" 
            className={`text-xs px-1.5 py-0.5 ${statusColors[task.status]}`}
          >
            {task.status}
          </Badge>
          
          <Badge 
            variant="outline" 
            className={`text-xs px-1.5 py-0.5 ${priorityColors[task.priority]}`}
          >
            {task.priority}
          </Badge>
        </div>
      </div>
    </Card>
  )
}