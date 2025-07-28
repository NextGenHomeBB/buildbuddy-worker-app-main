import { useParams, useNavigate } from 'react-router-dom'
import { useTasksByList, useUpdateTaskStatus, useDeleteTask } from '@/hooks/useTasksByList'
import { useTaskLists } from '@/hooks/useTaskLists'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowLeft, Plus, Trash2, LoaderCircle, Inbox } from 'lucide-react'
import { AddTaskDialog } from '@/components/AddTaskDialog'

export default function TaskListScreen() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  
  
  const isUnassigned = id === 'unassigned'
  const listId = isUnassigned ? null : id || null
  
  const { data: lists } = useTaskLists()
  const { data: tasks, isLoading } = useTasksByList(listId)
  const updateTaskStatus = useUpdateTaskStatus()
  const deleteTask = useDeleteTask()

  const currentList = lists?.find(list => list.id === id)
  const listName = isUnassigned ? 'Unassigned' : currentList?.name || 'List'
  const listColor = isUnassigned ? '#6B7280' : currentList?.color_hex || '#3478F6'

  const handleTaskToggle = (taskId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'done' ? 'todo' : 'done'
    updateTaskStatus.mutate({ taskId, status: newStatus })
  }

  const handleDeleteTask = (taskId: string) => {
    deleteTask.mutate(taskId)
  }


  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoaderCircle className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b">
        <div
          className="h-1"
          style={{ backgroundColor: listColor }}
        />
        <div className="flex items-center gap-4 p-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/lists')}
            className="p-2"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-3 flex-1">
            {isUnassigned ? (
              <Inbox className="w-5 h-5 text-muted-foreground" />
            ) : (
              <div
                className="w-5 h-5 rounded-full"
                style={{ backgroundColor: listColor }}
              />
            )}
            <h1 className="text-xl font-semibold text-foreground">
              {listName}
            </h1>
          </div>
        </div>
      </div>

      {/* Tasks List */}
      <div className="flex-1 p-4 pb-24">
        <div className="space-y-2 max-w-2xl mx-auto">
          {tasks?.map((task) => (
            <Card
              key={task.id}
              className="transition-all hover:shadow-sm"
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={task.status === 'done'}
                    onCheckedChange={() => handleTaskToggle(task.id, task.status)}
                    className="mt-0.5"
                  />
                  <div className="flex-1 min-w-0">
                    <h3
                      className={`font-medium ${
                        task.status === 'done'
                          ? 'text-muted-foreground line-through'
                          : 'text-foreground'
                      }`}
                    >
                      {task.title}
                    </h3>
                    {task.description && (
                      <p
                        className={`text-sm mt-1 ${
                          task.status === 'done'
                            ? 'text-muted-foreground line-through'
                            : 'text-muted-foreground'
                        }`}
                      >
                        {task.description}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteTask(task.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-2"
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          {tasks?.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">
                No tasks in this list yet.
              </p>
              <AddTaskDialog 
                defaultListId={isUnassigned ? undefined : id}
                trigger={
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Add First Task
                  </Button>
                }
              />
            </div>
          )}
        </div>
      </div>

      {/* Floating Add Button */}
      {tasks && tasks.length > 0 && (
        <AddTaskDialog 
          defaultListId={isUnassigned ? undefined : id}
        />
      )}
    </div>
  )
}