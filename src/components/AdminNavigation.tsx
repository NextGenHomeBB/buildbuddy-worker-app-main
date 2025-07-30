import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  LayoutDashboard, 
  Users, 
  Building2, 
  BarChart3, 
  Clock, 
  Settings,
  LogOut,
  ArrowLeft 
} from 'lucide-react'
import { cn } from '@/lib/utils'

const AdminNavigation = () => {
  const { signOut, userRole } = useAuth()
  const location = useLocation()

  const adminNavItems = [
    { path: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/admin/users', label: 'Users', icon: Users },
    { path: '/admin/projects', label: 'Projects', icon: Building2 },
    { path: '/admin/reports', label: 'Reports', icon: BarChart3 },
    { path: '/admin/time-tracking', label: 'Time Tracking', icon: Clock },
    { path: '/admin/settings', label: 'Settings', icon: Settings },
  ]

  const isActive = (path: string) => {
    if (path === '/admin') {
      return location.pathname === '/admin'
    }
    return location.pathname.startsWith(path)
  }

  return (
    <div className="w-64 bg-card border-r min-h-screen flex flex-col">
      {/* Header */}
      <div className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <h1 className="text-xl font-bold">BuildBuddy</h1>
          <Badge variant="destructive" className="text-xs">
            ADMIN
          </Badge>
        </div>
        
        {/* Switch to Worker View */}
        <Button variant="outline" size="sm" asChild className="w-full">
          <Link to="/today">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Worker View
          </Link>
        </Button>
      </div>

      <Separator />

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <div className="space-y-2">
          {adminNavItems.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  isActive(item.path)
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            )
          })}
        </div>
      </nav>

      <Separator />

      {/* Footer */}
      <div className="p-4">
        <Button 
          variant="ghost" 
          className="w-full justify-start"
          onClick={() => signOut()}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </div>
  )
}

export default AdminNavigation