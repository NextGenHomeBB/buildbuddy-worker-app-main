import { Card, CardContent } from '@/components/ui/card'
import { TaskList } from '@/hooks/useTaskLists'
import { useTasksByList } from '@/hooks/useTasksByList'
import { NavLink } from 'react-router-dom'

interface ListCardProps {
  list: TaskList
}

export function ListCard({ list }: ListCardProps) {
  const { data: tasks } = useTasksByList(list.id)
  const todoCount = tasks?.filter(task => task.status === 'todo').length || 0

  return (
    <NavLink to={`/lists/${list.id}`} className="block">
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
          </div>
        </CardContent>
      </Card>
    </NavLink>
  )
}