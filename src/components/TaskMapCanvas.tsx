import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Network, Plus } from 'lucide-react'

// Simplified stub component for task map canvas
export function TaskMapCanvas() {
  return (
    <Card className="w-full h-96">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Network className="h-5 w-5" />
              Task Map
            </CardTitle>
            <CardDescription>
              Visual task relationship mapping (simplified view)
            </CardDescription>
          </div>
          <Button variant="outline" size="sm">
            <Plus className="h-4 w-4" />
            Add Relation
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex items-center justify-center h-64">
        <div className="text-center space-y-2 text-muted-foreground">
          <Network className="h-12 w-12 mx-auto opacity-50" />
          <p>Task mapping functionality coming soon</p>
          <p className="text-sm">This feature requires additional database setup</p>
        </div>
      </CardContent>
    </Card>
  )
}