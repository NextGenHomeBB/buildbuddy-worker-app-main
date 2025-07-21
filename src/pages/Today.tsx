
import { useAuth } from '@/contexts/AuthContext'
import { useMyTasks } from '@/hooks/useMyTasks'
import { TaskCard } from '@/components/TaskCard'
import { MobileBottomNav } from '@/components/MobileBottomNav'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { LogOut, Calendar, HardHat, TrendingUp, User, Settings } from 'lucide-react'

export default function Today() {
  const { user, signOut } = useAuth()
  const { tasks, isLoading, error } = useMyTasks()

  const handleSignOut = async () => {
    await signOut()
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-construction-yellow border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your tasks...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <HardHat className="w-8 h-8 text-destructive" />
          </div>
          <h2 className="text-xl font-semibold text-destructive mb-2">Error Loading Tasks</h2>
          <p className="text-muted-foreground">Please check your connection and try again.</p>
        </div>
      </div>
    )
  }

  const completedTasks = tasks.filter(t => t.status === 'completed').length
  const totalTasks = tasks.length
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  return (
    <div className="min-h-screen bg-background pb-20 lg:pb-0">
      {/* Desktop Header - Hidden on Mobile */}
      <header className="hidden lg:block border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 bg-construction-yellow rounded-lg">
                <HardHat className="w-5 h-5 text-construction-yellow-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Today's Tasks</h1>
                <p className="text-sm text-muted-foreground">
                  Welcome back, {user?.email}
                </p>
              </div>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-10 w-10 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-construction-yellow text-construction-yellow-foreground">
                      {user?.email?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    <p className="font-medium">{user?.email}</p>
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
                <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Mobile Header */}
      <header className="lg:hidden bg-gradient-to-br from-construction-yellow via-construction-orange to-orange-500 px-4 py-8 safe-area-padding shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-14 h-14 bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20">
              <HardHat className="w-7 h-7 text-construction-yellow" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white drop-shadow-sm">Today's Work</h1>
              <p className="text-base text-white/90 font-medium">
                {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  month: 'short', 
                  day: 'numeric' 
                })}
              </p>
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm"
                className="h-14 w-14 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-all duration-200 shadow-lg"
              >
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="bg-white/20 text-white border-0 text-xl font-bold">
                    {user?.email?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 mr-4 mt-2 bg-white/95 backdrop-blur-md border border-white/20 shadow-xl">
              <div className="flex items-center justify-start gap-3 p-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-construction-yellow text-construction-yellow-foreground">
                    {user?.email?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col space-y-1 leading-none">
                  <p className="font-semibold text-sm">{user?.email}</p>
                  <p className="text-xs text-muted-foreground">Worker</p>
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="p-3">
                <User className="h-4 w-4 mr-3" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem className="p-3">
                <Settings className="h-4 w-4 mr-3" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="text-destructive p-3">
                <LogOut className="h-4 w-4 mr-3" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Enhanced Progress Stats */}
        <div className="mt-8 bg-white/15 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-xl">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <span className="text-white font-semibold text-lg">Progress</span>
            </div>
            <span className="text-3xl font-bold text-white drop-shadow-sm">{completionRate}%</span>
          </div>
          <div className="mb-3 bg-white/20 rounded-full h-3 overflow-hidden">
            <div 
              className="bg-white rounded-full h-3 transition-all duration-700 ease-out shadow-sm"
              style={{ width: `${completionRate}%` }}
            />
          </div>
          <p className="text-white/90 text-sm font-medium">
            {completedTasks} of {totalTasks} tasks completed
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 lg:py-8">
        {tasks.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="h-8 w-8 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold mb-2">No tasks for today</h2>
            <p className="text-muted-foreground">
              Looks like you're all caught up! Check back later for new assignments.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Desktop Stats - Hidden on Mobile */}
            <div className="hidden lg:flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {tasks.length} task{tasks.length !== 1 ? 's' : ''} assigned
              </p>
              <div className="text-sm text-muted-foreground">
                {completedTasks} completed
              </div>
            </div>
            
            {/* Task Grid - Responsive */}
            <div className="grid gap-4 xs:gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              {tasks.map((task) => (
                <TaskCard key={task.id} task={task} />
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  )
}
