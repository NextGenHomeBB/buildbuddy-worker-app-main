import { useState, useEffect } from 'react'
import { Calendar, Search, TrendingUp, Clock, Briefcase, LogOut, User, Settings, Menu, RefreshCw } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { MobileBottomNav } from '@/components/MobileBottomNav'
import { useTaskHistory } from '@/hooks/useTaskHistory'
import { format, parseISO } from 'date-fns'

export default function TaskHistory() {
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedProject, setSelectedProject] = useState<string>()
  
  const { 
    groupedHistory, 
    isLoading, 
    getCompletionStats, 
    searchHistory, 
    flushAndRefresh,
    error 
  } = useTaskHistory()
  
  // Simplified stats for now
  const stats = { totalTasks: 0, totalProjects: 0, averagePerDay: 0 }
  const filteredHistory: any[] = []
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleSignOut = async () => {
    await signOut()
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await flushAndRefresh()
    } catch (error) {
      console.error('Failed to refresh:', error)
    } finally {
      setIsRefreshing(false)
    }
  }

  // Auto-flush queue when component mounts to sync any pending tasks
  useEffect(() => {
    const autoFlush = async () => {
      try {
        await flushAndRefresh()
      } catch (error) {
        console.error('Auto-flush failed:', error)
      }
    }
    autoFlush()
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pb-20 lg:pb-0">
        {/* Header */}
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
                      <p className="font-medium text-sm">{user?.email?.split('@')[0] || 'User'}</p>
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
              
              <div className="w-9" />
            </div>
          </div>
        </header>

        <div className="container mx-auto p-4 space-y-4">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground mt-2">Loading history...</p>
          </div>
        </div>

        <MobileBottomNav />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-20 lg:pb-0">
      {/* Header */}
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
                    <p className="font-medium text-sm">{user?.email?.split('@')[0] || 'User'}</p>
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
            
            <div className="w-9" />
          </div>
        </div>
      </header>

      <div className="container mx-auto p-4 space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Calendar className="h-6 w-6" />
            Task History
          </h1>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Sync
          </Button>
        </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Tasks</p>
                <p className="text-2xl font-bold">{stats.totalTasks || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-secondary/10 flex items-center justify-center">
                <Briefcase className="h-5 w-5 text-secondary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Projects</p>
                <p className="text-2xl font-bold">{stats.totalProjects || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center">
                <Clock className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg/Day</p>
                <p className="text-2xl font-bold">{stats.averagePerDay || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tasks, projects, or descriptions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      {/* History List */}
      <div className="space-y-4">
        {error && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-destructive">
                <span>⚠️</span>
                <p className="text-sm">Failed to load history. Please try refreshing.</p>
              </div>
            </CardContent>
          </Card>
        )}
        
        {!Array.isArray(filteredHistory) || filteredHistory.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No task history found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm ? 'Try adjusting your search terms.' : 'Complete some tasks to see your history here.'}
              </p>
              {!searchTerm && (
                <Button 
                  variant="outline" 
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="flex items-center gap-2 mx-auto"
                >
                  <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                  Sync Completed Tasks
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          Array.isArray(filteredHistory) ? filteredHistory.map((group) => (
            <Collapsible key={group.date} defaultOpen={true}>
              <Card>
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        📅 {group.displayDate}
                      </span>
                      <Badge variant="secondary">
                        {group.tasks.length} task{group.tasks.length !== 1 ? 's' : ''}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                </CollapsibleTrigger>
                
                <CollapsibleContent>
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      {group.tasks.map((task, index) => (
                        <div key={task.id}>
                          <div className="flex items-start gap-3 py-3">
                            <div className="h-2 w-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2 mb-1">
                                <h4 className="font-medium text-foreground line-clamp-1">
                                  ✅ {task.task_title}
                                </h4>
                                <span className="text-sm text-muted-foreground flex-shrink-0">
                                  {format(parseISO(task.completed_at), 'h:mm a')}
                                </span>
                              </div>
                              
                              {task.task_description && (
                                <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                                  {task.task_description}
                                </p>
                              )}
                              
                              {task.project?.name && (
                                <Badge variant="outline" className="text-xs">
                                  {task.project.name}
                                </Badge>
                              )}
                            </div>
                          </div>
                          
                          {index < group.tasks.length - 1 && (
                            <Separator className="ml-5" />
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          )) : []
        )}
      </div>
      </div>

      <MobileBottomNav />
    </div>
  )
}