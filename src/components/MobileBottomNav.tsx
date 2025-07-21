
import { Home, CheckSquare, User, Settings } from 'lucide-react'
import { NavLink, useLocation } from 'react-router-dom'
import { AddTaskDialog } from './AddTaskDialog'

export function MobileBottomNav() {
  const location = useLocation()

  const navItems = [
    { icon: Home, label: 'Today', path: '/today' },
    { icon: CheckSquare, label: 'Tasks', path: '/tasks' },
    { icon: User, label: 'Profile', path: '/profile' },
    { icon: Settings, label: 'Settings', path: '/settings' },
  ]

  return (
    <>
      {/* Bottom Navigation Bar - Mobile/Tablet Only */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50 safe-area-padding">
        <div className="flex items-center justify-around px-2 py-1">
          {navItems.map((item, index) => {
            const isActive = location.pathname === item.path
            const Icon = item.icon
            
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => 
                  `flex flex-col items-center justify-center min-h-[60px] min-w-[60px] rounded-lg transition-colors ${
                    isActive 
                      ? 'text-construction-yellow bg-construction-yellow/10' 
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }`
                }
              >
                <Icon className="w-5 h-5 mb-1" />
                <span className="text-xs font-medium">{item.label}</span>
              </NavLink>
            )
          })}
        </div>
      </nav>

      {/* Floating Action Button - Add Task */}
      <AddTaskDialog />
    </>
  )
}
