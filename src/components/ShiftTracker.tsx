import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Clock, Play, Square, Timer } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface TimeSheet {
  id: string
  user_id: string
  work_date: string
  hours: number
  project_id: string | null
  note: string | null
  created_at: string
}

export function ShiftTracker() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [isShiftActive, setIsShiftActive] = useState(false)
  const [shiftStartTime, setShiftStartTime] = useState<Date | null>(null)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [todayHours, setTodayHours] = useState(0)

  // Load shift state from localStorage on mount
  useEffect(() => {
    const savedShiftData = localStorage.getItem('activeShift')
    if (savedShiftData) {
      const { startTime } = JSON.parse(savedShiftData)
      const shiftStart = new Date(startTime)
      setShiftStartTime(shiftStart)
      setIsShiftActive(true)
      
      // Calculate elapsed time
      const now = new Date()
      const elapsed = Math.floor((now.getTime() - shiftStart.getTime()) / 1000)
      setElapsedTime(elapsed)
    }
  }, [])

  // Update elapsed time every second when shift is active
  useEffect(() => {
    let interval: NodeJS.Timeout
    
    if (isShiftActive && shiftStartTime) {
      interval = setInterval(() => {
        const now = new Date()
        const elapsed = Math.floor((now.getTime() - shiftStartTime.getTime()) / 1000)
        setElapsedTime(elapsed)
      }, 1000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isShiftActive, shiftStartTime])

  // Load today's total hours on component mount
  useEffect(() => {
    if (user) {
      loadTodayHours()
    }
  }, [user])

  const loadTodayHours = async () => {
    if (!user) return

    const today = new Date().toISOString().split('T')[0]
    
    const { data, error } = await supabase
      .from('time_sheets')
      .select('hours')
      .eq('user_id', user.id)
      .eq('work_date', today)

    if (error) {
      console.error('Error loading today hours:', error)
      return
    }

    const total = data.reduce((sum, sheet) => sum + (sheet.hours || 0), 0)
    setTodayHours(total)
  }

  const startShift = () => {
    const now = new Date()
    setShiftStartTime(now)
    setIsShiftActive(true)
    setElapsedTime(0)
    
    // Save to localStorage
    localStorage.setItem('activeShift', JSON.stringify({
      startTime: now.toISOString()
    }))
    
    toast({
      title: 'Shift Started',
      description: `Started at ${now.toLocaleTimeString()}`,
    })
  }

  const stopShift = async () => {
    if (!shiftStartTime || !user) return

    const endTime = new Date()
    const hoursWorked = (endTime.getTime() - shiftStartTime.getTime()) / (1000 * 60 * 60)
    const today = new Date().toISOString().split('T')[0]

    try {
      const { error } = await supabase
        .from('time_sheets')
        .insert({
          user_id: user.id,
          work_date: today,
          hours: hoursWorked,
          note: `Shift: ${shiftStartTime.toLocaleTimeString()} - ${endTime.toLocaleTimeString()}`
        })

      if (error) throw error

      setIsShiftActive(false)
      setShiftStartTime(null)
      setElapsedTime(0)
      
      // Clear localStorage
      localStorage.removeItem('activeShift')
      
      // Reload today's hours
      await loadTodayHours()

      toast({
        title: 'Shift Completed',
        description: `Worked ${formatHours(hoursWorked)} today`,
      })
    } catch (error) {
      console.error('Error saving shift:', error)
      toast({
        title: 'Error',
        description: 'Failed to save shift data',
        variant: 'destructive',
      })
    }
  }

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const formatHours = (hours: number) => {
    return `${hours.toFixed(2)} hours`
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Timer className="h-5 w-5" />
          Shift Tracker
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Shift Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Current Shift:</span>
          </div>
          <Badge variant={isShiftActive ? "default" : "secondary"}>
            {isShiftActive ? "Active" : "Not Started"}
          </Badge>
        </div>

        {/* Elapsed Time Display */}
        {isShiftActive && (
          <div className="text-center p-4 bg-muted rounded-lg">
            <div className="text-2xl font-mono font-semibold text-primary">
              {formatTime(elapsedTime)}
            </div>
            <div className="text-sm text-muted-foreground">
              Started at {shiftStartTime?.toLocaleTimeString()}
            </div>
          </div>
        )}

        {/* Today's Total Hours */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Total hours today:</span>
          <span className="font-semibold">{formatHours(todayHours + (elapsedTime / 3600))}</span>
        </div>

        {/* Control Buttons */}
        <div className="flex gap-2">
          {!isShiftActive ? (
            <Button onClick={startShift} className="flex-1 flex items-center gap-2">
              <Play className="h-4 w-4" />
              Start Shift
            </Button>
          ) : (
            <Button onClick={stopShift} variant="destructive" className="flex-1 flex items-center gap-2">
              <Square className="h-4 w-4" />
              End Shift
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}