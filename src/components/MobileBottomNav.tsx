import { Home, Calendar, Briefcase, User } from 'lucide-react'
import { NavLink, useLocation } from 'react-router-dom'
import { AddTaskDialog } from './AddTaskDialog'

export function MobileBottomNav() {
  const location = useLocation()

  const navItems = [
    { icon: Home, label: 'Today', path: '/today' },
    { icon: Calendar, label: 'Calendar', path: '/calendar' },
    { icon: Briefcase, label: 'Projects', path: '/projects' },
    { icon: User, label: 'Profile', path: '/profile' },
  ]

  return (
    <>
      {/* Bottom Navigation Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
        <div className="flex items-center justify-around px-2 py-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path
            const Icon = item.icon
            
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center justify-center min-h-[56px] min-w-[60px] rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brandBlue ${
                  isActive 
                    ? 'text-blue-500' 
                    : 'text-gray-400 hover:text-gray-600'
                }`}
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
