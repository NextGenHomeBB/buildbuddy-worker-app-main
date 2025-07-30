import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, List } from 'lucide-react'
import { NewListModal } from '@/components/NewListModal'
import { MobileBottomNav } from '@/components/MobileBottomNav'

// Simplified Lists Home Screen
export default function ListsHomeScreen() {
  const [showNewListModal, setShowNewListModal] = useState(false)

  return (
    <div className="container mx-auto p-6 pb-20 lg:pb-0">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Task Lists</h1>
          <p className="text-muted-foreground">Organize your tasks into lists</p>
        </div>
        <Button onClick={() => setShowNewListModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New List
        </Button>
      </div>

      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <List className="h-5 w-5" />
              <CardTitle>Task Lists</CardTitle>
            </div>
            <CardDescription>
              Manage your task lists here
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <List className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No Lists Yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first task list to get started
              </p>
              <Button onClick={() => setShowNewListModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create List
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <NewListModal 
        open={showNewListModal}
        onOpenChange={setShowNewListModal}
      />

      <MobileBottomNav />
    </div>
  )
}