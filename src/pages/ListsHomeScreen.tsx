import { useTaskLists } from '@/hooks/useTaskLists'
import { useTasksByList } from '@/hooks/useTasksByList'
import { ListCard } from '@/components/ListCard'
import { NewListModal } from '@/components/NewListModal'
import { Card, CardContent } from '@/components/ui/card'
import { NavLink } from 'react-router-dom'
import { Inbox, LoaderCircle } from 'lucide-react'

export default function ListsHomeScreen() {
  const { data: lists, isLoading: listsLoading } = useTaskLists()
  const { data: unassignedTasks, isLoading: unassignedLoading } = useTasksByList(null)

  if (listsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoaderCircle className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const unassignedCount = unassignedTasks?.filter(task => task.status === 'todo').length || 0

  return (
    <div className="p-4 pb-24 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">Lists</h1>
        <NewListModal />
      </div>

      <div className="space-y-4">
        {/* Unassigned Tasks Smart List */}
        {unassignedCount > 0 && (
          <NavLink to="/lists/unassigned" className="block">
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full bg-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-foreground flex items-center gap-2">
                      <Inbox className="w-4 h-4" />
                      Unassigned
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {unassignedCount} tasks
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </NavLink>
        )}

        {/* User's Custom Lists */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {lists?.map((list) => (
            <ListCard key={list.id} list={list} />
          ))}
        </div>

        {lists?.length === 0 && unassignedCount === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">
              You don't have any lists yet. Create your first one!
            </p>
            <NewListModal />
          </div>
        )}
      </div>
    </div>
  )
}