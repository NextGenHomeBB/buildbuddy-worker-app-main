import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { TaskList, useDeleteTaskList } from '@/hooks/useTaskLists'
import { useTasksByList } from '@/hooks/useTasksByList'
import { NavLink } from 'react-router-dom'
import { Trash2 } from 'lucide-react'

interface ListCardProps {
  list: TaskList
}

export function ListCard({ list }: ListCardProps) {
  const { data: tasks } = useTasksByList(list.id)
  const deleteTaskList = useDeleteTaskList()
  const todoCount = tasks?.filter(task => task.status === 'todo').length || 0

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (window.confirm(`Are you sure you want to delete "${list.name}"? This action cannot be undone.`)) {
      deleteTaskList.mutate(list.id)
    }
  }

  return (
    <NavLink to={`/lists/${list.id}`} className="block group">
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div
              className="w-4 h-4 rounded-full flex-shrink-0"
              style={{ backgroundColor: list.color_hex }}
            />
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-foreground truncate">
                {list.name}
              </h3>
              <p className="text-sm text-muted-foreground">
                {todoCount} tasks
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              disabled={deleteTaskList.isPending}
              className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </NavLink>
  )
}