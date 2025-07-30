import { ReactNode } from 'react'
import AdminNavigation from './AdminNavigation'

interface AdminLayoutProps {
  children: ReactNode
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
  return (
    <div className="flex min-h-screen">
      <AdminNavigation />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}

export default AdminLayout