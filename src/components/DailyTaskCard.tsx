import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Clock, CheckCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

// Simplified stub component for daily tasks
export function DailyTaskCard({ assignment }: { assignment: any }) {
  const { toast } = useToast()
  const [isCompleting, setIsCompleting] = useState(false)

  const handleComplete = async () => {
    setIsCompleting(true)
    setTimeout(() => {
      setIsCompleting(false)
      toast({
        title: 'Task completed',
        description: 'Daily task marked as complete',
      })
    }, 1000)
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg">Daily Task</CardTitle>
            <CardDescription>Simplified daily task view</CardDescription>
          </div>
          <Badge variant="outline">pending</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>Due today</span>
        </div>
        
        <Button 
          onClick={handleComplete}
          disabled={isCompleting}
          className="w-full"
        >
          {isCompleting ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              Completing...
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Mark Complete
            </div>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}