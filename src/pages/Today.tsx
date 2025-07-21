
import { useAuth } from '@/contexts/AuthContext'
import { useMyTasks } from '@/hooks/useMyTasks'
import { TaskCard } from '@/components/TaskCard'
import { MobileBottomNav } from '@/components/MobileBottomNav'
import { Button } from '@/components/ui/button'
import { LogOut, Calendar, HardHat, TrendingUp } from 'lucide-react'

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
            
            <Button onClick={handleSignOut} variant="outline" size="sm">
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile Header */}
      <header className="lg:hidden bg-gradient-to-r from-construction-yellow to-construction-orange px-4 py-6 safe-area-padding">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-12 h-12 bg-white rounded-xl shadow-lg">
              <HardHat className="w-6 h-6 text-construction-yellow" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Today's Work</h1>
              <p className="text-sm text-white/80">
                {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  month: 'short', 
                  day: 'numeric' 
                })}
              </p>
            </div>
          </div>
          
          <Button 
            onClick={handleSignOut} 
            variant="outline" 
            size="sm"
            className="bg-white/10 border-white/20 text-white hover:bg-white/20"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>

        {/* Progress Stats */}
        <div className="mt-6 bg-white/10 backdrop-blur-sm rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-white" />
              <span className="text-white font-medium">Progress</span>
            </div>
            <span className="text-2xl font-bold text-white">{completionRate}%</span>
          </div>
          <div className="mt-2 bg-white/20 rounded-full h-2">
            <div 
              className="bg-white rounded-full h-2 transition-all duration-500"
              style={{ width: `${completionRate}%` }}
            />
          </div>
          <p className="text-white/80 text-sm mt-2">
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
