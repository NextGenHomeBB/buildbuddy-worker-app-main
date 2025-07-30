import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckSquare } from 'lucide-react'

// Simplified Today page
export default function Today() {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Good Morning!</h1>
        <p className="text-muted-foreground">Here's what you need to focus on today</p>
      </div>

      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CheckSquare className="h-5 w-5" />
              <CardTitle>Today's Tasks</CardTitle>
            </div>
            <CardDescription>
              Your tasks for today
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <CheckSquare className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No Tasks Today</h3>
              <p className="text-muted-foreground">
                You're all caught up! Enjoy your day.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}