import { useState } from 'react'
import { Calendar } from '@/components/ui/calendar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { useMyTasks } from '@/hooks/useMyTasks'
import { TaskCard } from '@/components/TaskCard'
import { MobileBottomNav } from '@/components/MobileBottomNav'

export default function CalendarPage() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const { tasks, isLoading } = useMyTasks()

  // Filter tasks for the selected date
  const selectedDateTasks = selectedDate 
    ? tasks.filter(task => {
        if (!task.due_date) return false
        const taskDate = new Date(task.due_date)
        return format(taskDate, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd')
      })
    : []

  // Get tasks with due dates for calendar highlighting
  const tasksWithDueDates = tasks.filter(task => task.due_date)
  const taskDates = tasksWithDueDates.map(task => new Date(task.due_date!))

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-4 pb-24 lg:pb-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">Calendar</h1>
          <p className="text-muted-foreground mt-2">View and manage your tasks by date</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Calendar Section */}
          <Card>
            <CardHeader>
              <CardTitle>Select a Date</CardTitle>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="rounded-md border"
                modifiers={{
                  hasTasks: taskDates,
                }}
                modifiersStyles={{
                  hasTasks: {
                    backgroundColor: 'hsl(var(--primary))',
                    color: 'hsl(var(--primary-foreground))',
                    borderRadius: '50%',
                  },
                }}
              />
            </CardContent>
          </Card>

          {/* Tasks for Selected Date */}
          <Card>
            <CardHeader>
              <CardTitle>
                {selectedDate ? format(selectedDate, 'MMMM d, yyyy') : 'Select a date'}
              </CardTitle>
              {selectedDateTasks.length > 0 && (
                <Badge variant="secondary" className="w-fit">
                  {selectedDateTasks.length} task{selectedDateTasks.length !== 1 ? 's' : ''}
                </Badge>
              )}
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-2 text-muted-foreground">Loading tasks...</p>
                </div>
              ) : selectedDateTasks.length > 0 ? (
                <div className="space-y-3">
                  {selectedDateTasks.map((task) => (
                    <TaskCard key={task.id} task={task} />
                  ))}
                </div>
              ) : selectedDate ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No tasks scheduled for this date</p>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Select a date to view tasks</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* All Upcoming Tasks */}
        {tasksWithDueDates.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>All Upcoming Tasks</CardTitle>
              <Badge variant="outline" className="w-fit">
                {tasksWithDueDates.length} task{tasksWithDueDates.length !== 1 ? 's' : ''} with due dates
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {tasksWithDueDates
                  .sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime())
                  .map((task) => (
                    <TaskCard key={task.id} task={task} showDueDate />
                  ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <MobileBottomNav />
    </div>
  )
}