import { useState, useRef, useCallback, useMemo } from 'react'
import {
  DndContext,
  DragOverlay,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
  closestCenter,
  pointerWithin,
  rectIntersection,
  CollisionDetection,
  UniqueIdentifier,
} from '@dnd-kit/core'
import { useGesture } from '@use-gesture/react'
import { TaskNode } from './TaskNode'
import { RelationDialog } from './RelationDialog'
import { TaskMapTask, useTaskMap } from '@/hooks/useTaskMap'
import { Button } from '@/components/ui/button'
import { Eye, EyeOff, Trash2, Move } from 'lucide-react'
import { useIsMobile } from '@/hooks/use-mobile'

export function TaskMapCanvas() {
  const isMobile = useIsMobile()
  const canvasRef = useRef<HTMLDivElement>(null)
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 })
  const [activeTask, setActiveTask] = useState<TaskMapTask | null>(null)
  const [overId, setOverId] = useState<UniqueIdentifier | null>(null)
  const [dropTarget, setDropTarget] = useState<TaskMapTask | null>(null)
  const [showRelationDialog, setShowRelationDialog] = useState(false)
  const [showMiniMap, setShowMiniMap] = useState(true)
  const [selectedRelation, setSelectedRelation] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isPanning, setIsPanning] = useState(false)

  const { tasks, relations, createRelation, deleteRelation, isCreating } = useTaskMap()

  // Grid layout for tasks (responsive)
  const getTaskPosition = useCallback((index: number) => {
    const cols = isMobile ? 2 : 4
    const spacing = isMobile ? 160 : 180
    const col = index % cols
    const row = Math.floor(index / cols)
    return {
      x: col * spacing + 40,
      y: row * spacing + 40
    }
  }, [isMobile])

  // Custom collision detection for better drag experience
  const customCollisionDetection: CollisionDetection = useCallback((args) => {
    if (!activeTask) return []
    
    // First try pointer collision for better responsiveness
    const pointerCollisions = pointerWithin(args)
    if (pointerCollisions.length > 0) {
      return pointerCollisions.filter(collision => collision.id !== activeTask.id)
    }
    
    // Fallback to rectangle intersection
    const intersectionCollisions = rectIntersection(args)
    return intersectionCollisions.filter(collision => collision.id !== activeTask.id)
  }, [activeTask])

  // Pan and zoom gestures
  useGesture(
    {
      onDragStart: () => {
        if (!isDragging) {
          setIsPanning(true)
        }
      },
      onDrag: ({ offset: [x, y], pinching, tap }) => {
        if (!pinching && !isDragging && !tap) {
          setTransform(prev => ({ ...prev, x, y }))
        }
      },
      onDragEnd: () => {
        setIsPanning(false)
      },
      onPinch: ({ offset: [scale] }) => {
        setTransform(prev => ({ 
          ...prev, 
          scale: Math.max(0.3, Math.min(3, scale)) 
        }))
      },
    },
    {
      target: canvasRef,
      drag: { 
        from: () => [transform.x, transform.y],
        filterTaps: true,
        threshold: 5,
        preventScrollAxis: 'xy',
      },
      pinch: { 
        from: () => [transform.scale, 0],
        scaleBounds: { min: 0.3, max: 3 },
        preventDefault: true,
      },
    }
  )

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find(t => t.id === event.active.id)
    setActiveTask(task || null)
    setIsDragging(true)
    setIsPanning(false)
  }

  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event
    setOverId(over?.id || null)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveTask(null)
    setIsDragging(false)
    setOverId(null)

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
        collisionDetection={customCollisionDetection}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div
          ref={canvasRef}
          className={`relative w-full h-full transition-none ${
            isPanning ? 'cursor-grabbing' : isDragging ? 'cursor-default' : 'cursor-grab'
          }`}
          style={{
            transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
            transformOrigin: '0 0',
            touchAction: 'none',
          }}
        >
          {/* Background grid for better visual reference */}
          <div 
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `
                linear-gradient(to right, #e5e7eb 1px, transparent 1px),
                linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)
              `,
              backgroundSize: '40px 40px'
            }}
          />

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
              const isOver = overId === task.id
              const isActive = activeTask?.id === task.id
              
              return (
                <div
                  key={task.id}
                  className={`absolute transition-all duration-150 ${
                    isOver && !isActive ? 'scale-105 z-10' : ''
                  }`}
                  style={{
                    left: position.x,
                    top: position.y,
                  }}
                >
                  <TaskNode 
                    task={task} 
                    isDropTarget={isOver && !isActive}
                    isBeingDragged={isActive}
                  />
                </div>
              )
            })}
          </div>
        </div>

        <DragOverlay dropAnimation={null}>
          {activeTask && (
            <div className="relative">
              <TaskNode task={activeTask} isDragOverlay />
              <div className="absolute -top-8 left-1/2 transform -translate-x-1/2">
                <div className="bg-primary text-primary-foreground px-2 py-1 rounded text-xs font-medium whitespace-nowrap">
                  Drop on task to link
                </div>
              </div>
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {/* Controls */}
      <div className="absolute bottom-4 right-4 z-10 flex flex-col gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setTransform({ x: 0, y: 0, scale: 1 })}
          title="Reset view"
        >
          <Move className="w-4 h-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowMiniMap(!showMiniMap)}
          title={showMiniMap ? "Hide minimap" : "Show minimap"}
        >
          {showMiniMap ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </Button>
      </div>

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