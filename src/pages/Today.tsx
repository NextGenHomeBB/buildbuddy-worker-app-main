
import { useAuth } from '@/contexts/AuthContext'
import { useMyTasks } from '@/hooks/useMyTasks'
import { TaskCard } from '@/components/TaskCard'
import { MobileBottomNav } from '@/components/MobileBottomNav'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { LogOut, Calendar, User, Settings, Menu, ArrowRight } from 'lucide-react'

export default function Today() {
  const { user, signOut } = useAuth()
  const { tasks, isLoading, error } = useMyTasks()

  const handleSignOut = async () => {
    await signOut()
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

  const username = user?.email?.split('@')[0] || 'User'

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
                    <p className="font-medium text-sm">{username}</p>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <User className="h-4 w-4 mr-2" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem>
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
          <h2 className="text-2xl font-medium text-gray-900 truncate max-w-[240px]">
            Hi, {username.charAt(0).toUpperCase() + username.slice(1)}
          </h2>
          <p className="text-gray-500">
            {completedTasks} of {totalTasks} tasks completed
          </p>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-gray-100 rounded-full h-2 mt-4 mb-6">
          <div 
            className="bg-blue-500 h-2 rounded-full transition-all duration-500"
            style={{ width: `${completionRate}%` }}
          />
        </div>
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
