
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useMyTasks } from '@/hooks/useMyTasks'
import { TaskCard } from '@/components/TaskCard'
import { MobileBottomNav } from '@/components/MobileBottomNav'
import { ShiftTracker } from '@/components/ShiftTracker'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { LogOut, Calendar, User, Settings, Menu, ArrowRight, History, Clock } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase'

export default function Today() {
  const { user, signOut } = useAuth()
  const { tasks, isLoading, error } = useMyTasks()
  const [profileName, setProfileName] = useState<string>('')
  const [completedTasksHistory, setCompletedTasksHistory] = useState<any[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const navigate = useNavigate()

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
        } else {
          console.log('No profile found for user:', user.id)
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

  const fetchCompletedTasksHistory = async () => {
    if (!user) return
    
    setHistoryLoading(true)
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          id,
          title,
          description,
          completed_at,
          project_id,
          projects (
            name
          )
        `)
        .eq('assignee', user.id)
        .eq('status', 'completed')
        .not('completed_at', 'is', null)
        .order('completed_at', { ascending: false })
        .limit(20)

      if (error) {
        console.error('Error fetching completed tasks:', error)
        return
      }

      setCompletedTasksHistory(data || [])
    } catch (error) {
      console.error('Error fetching completed tasks history:', error)
    } finally {
      setHistoryLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white px-4">
        <div className="text-center">
          <h2 className="text-lg font-medium text-gray-900 mb-2">Error Loading Tasks</h2>
          <p className="text-gray-500">Please check your connection and try again.</p>
        </div>
      </div>
    )
  }

  const completedTasks = tasks.filter(t => t.status === 'completed').length
  const totalTasks = tasks.length
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  // Use profile name if available, otherwise fallback to email username
  const displayName = profileName || user?.email?.split('@')[0] || 'User'

  return (
    <div className="min-h-screen bg-white pb-20 lg:pb-0">
      {/* Clean Header */}
      <header className="bg-white border-b border-gray-100">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="p-2 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brandBlue">
                  <Menu className="h-5 w-5 text-gray-600" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <div className="flex items-center justify-start gap-3 p-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-gray-100 text-gray-600">
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
                <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <h1 className="text-lg font-semibold text-gray-900">Today</h1>
            
            <div className="w-9" /> {/* Spacer for center alignment */}
          </div>
        </div>
      </header>

      {/* Welcome Section */}
      <div className="px-4 py-6">
        <div className="space-y-1">
          <h2 data-testid="greeting-header" className="text-2xl font-medium text-gray-900 truncate max-w-[240px] cursor-pointer hover:text-blue-600 transition-colors" onClick={() => window.location.href = '/profile'}>
            Hi, {displayName.charAt(0).toUpperCase() + displayName.slice(1)}
          </h2>
          <p className="text-gray-500">
            {completedTasks} of {totalTasks} tasks completed
          </p>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-gray-100 rounded-full h-2 mt-1 mb-6">
          <div 
            className="bg-green-500 h-2 rounded-full transition-all duration-500"
            style={{ width: `${completionRate}%` }}
          />
        </div>
      </div>

      {/* Shift Tracker Section */}
      <div className="px-4 mb-6">
        <ShiftTracker />
      </div>

      {/* History Button */}
      <div className="px-4 mb-6">
        <Dialog>
          <DialogTrigger asChild>
            <Button 
              variant="outline" 
              className="w-full justify-between"
              onClick={fetchCompletedTasksHistory}
            >
              <div className="flex items-center gap-2">
                <History className="h-4 w-4" />
                <span>Task History</span>
              </div>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Completed Tasks History
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              {historyLoading ? (
                <div className="text-center py-8">
                  <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin mx-auto mb-2"></div>
                  <p className="text-sm text-gray-500">Loading history...</p>
                </div>
              ) : completedTasksHistory.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No completed tasks yet</p>
                </div>
              ) : (
                completedTasksHistory.map((task) => (
                  <div key={task.id} className="p-3 border rounded-lg bg-gray-50">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h4 className="font-medium text-sm text-gray-900 line-clamp-2">
                        {task.title}
                      </h4>
                      <Badge variant="secondary" className="text-xs">
                        ✓ Done
                      </Badge>
                    </div>
                    
                    {task.description && (
                      <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                        {task.description}
                      </p>
                    )}
                    
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Calendar className="h-3 w-3" />
                        <span>
                          Completed: {new Date(task.completed_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })} at {new Date(task.completed_at).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      
                      {task.projects?.name && (
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <ArrowRight className="h-3 w-3" />
                          <span>Project: {task.projects.name}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tasks Section */}
      <div className="px-4">
        {tasks.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks for today</h3>
            <p className="text-gray-500">
              You're all caught up! Check back later for new assignments.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {tasks.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        )}
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  )
}
