import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CalendarDays } from 'lucide-react'
import { MobileBottomNav } from '@/components/MobileBottomNav'

// Simplified Calendar component
export default function Calendar() {
  return (
    <div className="container mx-auto p-6 pb-20 lg:pb-0">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CalendarDays className="h-6 w-6" />
            <CardTitle>Calendar</CardTitle>
          </div>
          <CardDescription>
            Task calendar view (simplified)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center py-8">
            <CalendarDays className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Calendar View Coming Soon</h3>
            <p className="text-muted-foreground">
              The calendar functionality is being developed
            </p>
          </div>
        </CardContent>
      </Card>

      <MobileBottomNav />
    </div>
  )
}