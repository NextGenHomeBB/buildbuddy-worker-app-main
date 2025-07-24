import { useState, useRef, useCallback } from 'react'
import {
  DndContext,
  DragOverlay,
  DragStartEvent,
  DragEndEvent,
  closestCenter,
  pointerWithin,
  getFirstCollision,
} from '@dnd-kit/core'
import { useGesture } from '@use-gesture/react'
import { TaskNode } from './TaskNode'
import { RelationDialog } from './RelationDialog'
import { TaskMapTask, useTaskMap } from '@/hooks/useTaskMap'
import { Button } from '@/components/ui/button'
import { Eye, EyeOff, Trash2 } from 'lucide-react'
import { useIsMobile } from '@/hooks/use-mobile'

export function TaskMapCanvas() {
  const isMobile = useIsMobile()
  const canvasRef = useRef<HTMLDivElement>(null)
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 })
  const [activeTask, setActiveTask] = useState<TaskMapTask | null>(null)
  const [dropTarget, setDropTarget] = useState<TaskMapTask | null>(null)
  const [showRelationDialog, setShowRelationDialog] = useState(false)
  const [showMiniMap, setShowMiniMap] = useState(true)
  const [selectedRelation, setSelectedRelation] = useState<string | null>(null)

  const { tasks, relations, createRelation, deleteRelation, isCreating } = useTaskMap()

  // Grid layout for tasks (responsive)
  const getTaskPosition = useCallback((index: number) => {
    const cols = isMobile ? 2 : 4
    const spacing = isMobile ? 160 : 180
    const col = index % cols
    const row = Math.floor(index / cols)
    return {
      x: col * spacing + 20,
      y: row * spacing + 20
    }
  }, [isMobile])

  // Pan and zoom gestures
  useGesture(
    {
      onDrag: ({ offset: [x, y], pinching }) => {
        if (!pinching) {
          setTransform(prev => ({ ...prev, x, y }))
        }
      },
      onPinch: ({ offset: [scale] }) => {
        setTransform(prev => ({ ...prev, scale: Math.max(0.5, Math.min(2, scale)) }))
      },
    },
    {
      target: canvasRef,
      drag: { 
        from: () => [transform.x, transform.y],
        filterTaps: true,
      },
      pinch: { 
        from: () => [transform.scale, 0],
        scaleBounds: { min: 0.5, max: 2 },
      },
    }
  )

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find(t => t.id === event.active.id)
    setActiveTask(task || null)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveTask(null)

    if (over && active.id !== over.id) {
      const srcTask = tasks.find(t => t.id === active.id)
      const destTask = tasks.find(t => t.id === over.id)
      
      if (srcTask && destTask) {
        setDropTarget(destTask)
        setShowRelationDialog(true)
      }
    }
  }

  const handleCreateRelation = (relation: 'blocks' | 'relates' | 'duplicate') => {
    if (activeTask && dropTarget) {
      createRelation({
        srcTask: activeTask.id,
        destTask: dropTarget.id,
        relation
      })
    }
    setDropTarget(null)
    setShowRelationDialog(false)
  }

  const handleDeleteRelation = (relationId: string) => {
    deleteRelation(relationId)
    setSelectedRelation(null)
  }

  const renderRelationLines = () => {
    return relations.map(relation => {
      const srcTask = tasks.find(t => t.id === relation.src_task)
      const destTask = tasks.find(t => t.id === relation.dest_task)
      
      if (!srcTask || !destTask) return null

      const srcIndex = tasks.findIndex(t => t.id === srcTask.id)
      const destIndex = tasks.findIndex(t => t.id === destTask.id)
      const srcPos = getTaskPosition(srcIndex)
      const destPos = getTaskPosition(destIndex)

      const x1 = srcPos.x + 72 // center of node (width/2)
      const y1 = srcPos.y + 60 // center of node (height/2)
      const x2 = destPos.x + 72
      const y2 = destPos.y + 60

      const lineColors = {
        blocks: 'stroke-red-500',
        relates: 'stroke-blue-500',
        duplicate: 'stroke-yellow-500'
      }

      return (
        <g key={relation.id}>
          <line
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            className={`${lineColors[relation.relation]} stroke-2 cursor-pointer`}
            strokeDasharray={relation.relation === 'relates' ? '5,5' : '0'}
            onClick={() => setSelectedRelation(selectedRelation === relation.id ? null : relation.id)}
          />
          
          {/* Arrow marker */}
          <polygon
            points={`${x2-8},${y2-4} ${x2},${y2} ${x2-8},${y2+4}`}
            className={`${lineColors[relation.relation].replace('stroke', 'fill')}`}
          />
          
          {/* Delete button when selected */}
          {selectedRelation === relation.id && (
            <foreignObject
              x={(x1 + x2) / 2 - 12}
              y={(y1 + y2) / 2 - 12}
              width="24"
              height="24"
            >
              <Button
                size="sm"
                variant="destructive"
                className="w-6 h-6 p-0"
                onClick={() => handleDeleteRelation(relation.id)}
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </foreignObject>
          )}
        </g>
      )
    })
  }

  return (
    <div className="relative w-full h-full overflow-hidden bg-background">
      <DndContext
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div
          ref={canvasRef}
          className="relative w-full h-full touch-none"
          style={{
            transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
            transformOrigin: '0 0',
          }}
        >
          {/* SVG for relation lines */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{ zIndex: 1 }}
          >
            <defs>
              <marker
                id="arrowhead"
                markerWidth="10"
                markerHeight="7"
                refX="9"
                refY="3.5"
                orient="auto"
              >
                <polygon points="0 0, 10 3.5, 0 7" fill="currentColor" />
              </marker>
            </defs>
            {renderRelationLines()}
          </svg>

          {/* Task nodes */}
          <div className="relative" style={{ zIndex: 2 }}>
            {tasks.map((task, index) => {
              const position = getTaskPosition(index)
              return (
                <div
                  key={task.id}
                  className="absolute"
                  style={{
                    left: position.x,
                    top: position.y,
                  }}
                >
                  <TaskNode task={task} />
                </div>
              )
            })}
          </div>
        </div>

        <DragOverlay>
          {activeTask && <TaskNode task={activeTask} isDragOverlay />}
        </DragOverlay>
      </DndContext>

      {/* MiniMap Toggle */}
      <Button
        variant="outline"
        size="sm"
        className="absolute bottom-4 right-4 z-10"
        onClick={() => setShowMiniMap(!showMiniMap)}
      >
        {showMiniMap ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </Button>

      {/* MiniMap */}
      {showMiniMap && (
        <div className="absolute top-4 right-4 w-32 h-24 bg-card border border-border rounded-lg p-2 z-10">
          <div className="text-xs text-muted-foreground mb-1">Map Overview</div>
          <div className="relative w-full h-16 bg-muted rounded overflow-hidden">
            {tasks.slice(0, 8).map((task, index) => {
              const position = getTaskPosition(index)
              return (
                <div
                  key={task.id}
                  className="absolute w-2 h-2 bg-primary rounded-sm"
                  style={{
                    left: `${(position.x / 800) * 100}%`,
                    top: `${(position.y / 600) * 100}%`,
                  }}
                />
              )
            })}
          </div>
        </div>
      )}

      {/* Relation Dialog */}
      <RelationDialog
        open={showRelationDialog}
        onOpenChange={setShowRelationDialog}
        srcTask={activeTask}
        destTask={dropTarget}
        onConfirm={handleCreateRelation}
        isLoading={isCreating}
      />
    </div>
  )
}