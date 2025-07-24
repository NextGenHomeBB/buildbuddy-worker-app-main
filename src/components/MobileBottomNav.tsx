import { Home, Calendar, Briefcase, User, Map } from 'lucide-react'
import { NavLink, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { AddTaskDialog } from './AddTaskDialog'

export function MobileBottomNav() {
  const location = useLocation()
  const { t } = useTranslation()

  const navItems = [
    { icon: Home, label: t('navigation.today'), path: '/today' },
    { icon: Calendar, label: t('navigation.calendar'), path: '/calendar' },
    { icon: Map, label: 'Map', path: '/map' },
    { icon: Briefcase, label: t('navigation.projects'), path: '/projects' },
    { icon: User, label: t('navigation.profile'), path: '/profile' },
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
