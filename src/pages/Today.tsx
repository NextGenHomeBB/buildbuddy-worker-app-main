import { useEffect, useState } from 'react'
import { LogOut, User, Settings } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useWorkerTasks } from '@/hooks/useWorkerTasks'
import { TaskCard } from '@/components/TaskCard'
import { MobileBottomNav } from '@/components/MobileBottomNav'
import { ShiftTracker } from '@/components/ShiftTracker'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Calendar, Menu, History } from 'lucide-react'
import { useDailyTasks } from '@/hooks/useDailyTasks'
import { DailyTaskCard } from '@/components/DailyTaskCard'
import { supabase } from '@/integrations/supabase/client'
import { format } from 'date-fns'

export default function Today() {
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  const { 
    dailyTasks, 
    isLoading: isDailyLoading, 
    error: dailyError, 
    completeTask, 
    isCompleting, 
    getTimeRemaining, 
    isTaskExpiringSoon 
  } = useDailyTasks()
  
  const { tasks: workerTasks, isLoading: isWorkerLoading } = useWorkerTasks()
  const [profileName, setProfileName] = useState<string>('')

  // Filter worker tasks - show tasks due today, starting today, or tasks without dates (newly assigned)
  const today = format(new Date(), 'yyyy-MM-dd')
  const filteredWorkerTasks = workerTasks.filter(task => {
    // Include tasks that have due_date (end_date) today
    if (task.due_date) {
      const taskDueDate = format(new Date(task.due_date), 'yyyy-MM-dd')
      if (taskDueDate === today) return true
    }
    
    // Include tasks that start today (for tasks without end_date)
    if (task.start_date && !task.due_date) {
      const taskStartDate = format(new Date(task.start_date), 'yyyy-MM-dd')
      if (taskStartDate === today) return true
    }
    
    // Include tasks without dates (newly assigned tasks) that are pending
    if (!task.due_date && !task.start_date && task.status === 'pending') {
      return true
    }
    
    return false
  })

  // Sort function for priority (high first, then medium, then low)
  const priorityOrder = { 'high': 0, 'medium': 1, 'low': 2 }
  
  // Sort daily tasks by priority
  const sortedDailyTasks = [...dailyTasks].sort((a, b) => {
    const priorityA = priorityOrder[a.task_template?.priority as keyof typeof priorityOrder] ?? 1
    const priorityB = priorityOrder[b.task_template?.priority as keyof typeof priorityOrder] ?? 1
    return priorityA - priorityB
  })
  
  // Sort worker tasks by priority
  const todaysWorkerTasks = [...filteredWorkerTasks].sort((a, b) => {
    const priorityA = priorityOrder[a.priority as keyof typeof priorityOrder] ?? 1
    const priorityB = priorityOrder[b.priority as keyof typeof priorityOrder] ?? 1
    return priorityA - priorityB
  })

  const isLoading = isDailyLoading || isWorkerLoading
  const error = dailyError

  // Fetch user profile name
  useEffect(() => {
    const fetchProfileName = async () => {
      if (!user) return

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .maybeSingle()

        if (error) {
          console.error('Error fetching profile:', error)
          return
        }

        if (data?.full_name) {
          setProfileName(data.full_name)
        }
      } catch (error) {
        console.error('Error fetching profile name:', error)
      }
    }

    fetchProfileName()
  }, [user])

  const handleSignOut = async () => {
    await signOut()
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 space-y-4">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground mt-2">Loading daily tasks...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-4 space-y-4">
        <div className="text-center py-8">
          <p className="text-destructive">Failed to load daily tasks. Please try again.</p>
        </div>
      </div>
    )
  }

  // Calculate task progress - daily tasks don't have completed state, they get moved to history
  const totalTasks = sortedDailyTasks.length + todaysWorkerTasks.length
  const completionRate = 0 // Daily tasks don't show completion rate as completed ones are removed

  // Use profile name if available, otherwise fallback to email username
  const displayName = profileName || user?.email?.split('@')[0] || 'User'

  return (
    <div className="min-h-screen bg-background pb-20 lg:pb-0">
      {/* Clean Header */}
      <header className="bg-background border-b border-border">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="p-2">
                  <Menu className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <div className="flex items-center justify-start gap-3 p-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      {user?.email?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col space-y-1 leading-none">
                    <p className="font-medium text-sm">{displayName}</p>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/profile')}>
                  <User className="h-4 w-4 mr-2" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/settings')}>
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <img 
              src="/lovable-uploads/f8eff9bf-a328-4c88-bf0b-a0a5a85c77ec.png" 
              alt="NextGen Home" 
              className="h-8 w-auto cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => navigate('/today')}
            />
            
            <div className="w-9" /> {/* Spacer for center alignment */}
          </div>
        </div>
      </header>

      {/* Welcome Section */}
      <div className="px-4 py-6">
        <div className="space-y-1">
          <h2 data-testid="greeting-header" className="text-2xl font-medium text-foreground truncate max-w-[240px]">
            Hi, {displayName.charAt(0).toUpperCase() + displayName.slice(1)}
          </h2>
          <p className="text-muted-foreground">
            {totalTasks} task{totalTasks !== 1 ? 's' : ''} assigned
          </p>
        </div>
      </div>

      {/* Shift Tracker Section */}
      <div className="px-4 mb-6">
        <ShiftTracker />
      </div>

      {/* Tasks Section */}
      <div className="px-4 mb-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-foreground">Today's Tasks</h2>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/history')}
              >
                <History className="h-4 w-4 mr-2" />
                View History
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            {sortedDailyTasks.length === 0 && todaysWorkerTasks.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No tasks assigned</h3>
                <p className="text-muted-foreground">
                  No tasks assigned for today. Check back later or contact your supervisor.
                </p>
              </div>
            ) : (
              <>
                {/* Daily Tasks */}
                {sortedDailyTasks.map((task) => (
                  <DailyTaskCard 
                    key={`daily-${task.id}`} 
                    task={task}
                    onComplete={completeTask}
                    isCompleting={isCompleting}
                    getTimeRemaining={getTimeRemaining}
                    isTaskExpiringSoon={isTaskExpiringSoon}
                  />
                ))}
                
                {/* Worker Tasks Due Today */}
                {todaysWorkerTasks.map((task) => (
                  <TaskCard 
                    key={`worker-${task.id}`} 
                    task={task}
                    showDueDate={false}
                  />
                ))}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  )
}