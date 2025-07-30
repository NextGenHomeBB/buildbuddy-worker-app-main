import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'
import { UserPlus, Loader2 } from 'lucide-react'

interface Task {
  id: string
  title: string
  status: string
  priority: string
  assigned_to: string | null
}

interface Worker {
  id: string
  full_name: string
  role: string
}

interface TaskAssignmentModalProps {
  task: Task
  onTaskUpdated: () => void
}

export function TaskAssignmentModal({ task, onTaskUpdated }: TaskAssignmentModalProps) {
  const [workers, setWorkers] = useState<Worker[]>([])
  const [selectedWorkerId, setSelectedWorkerId] = useState<string>(task.assigned_to || '')
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (isOpen) {
      fetchWorkers()
    }
  }, [isOpen])

  const fetchWorkers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, role')
        .eq('role', 'worker')
        .order('full_name')

      if (error) throw error
      setWorkers(data || [])
    } catch (error) {
      console.error('Error fetching workers:', error)
      toast({
        title: 'Error',
        description: 'Failed to load workers',
        variant: 'destructive'
      })
    }
  }

  const handleAssignTask = async () => {
    if (!selectedWorkerId) {
      toast({
        title: 'Error',
        description: 'Please select a worker',
        variant: 'destructive'
      })
      return
    }

    setIsLoading(true)
    try {
      console.log('🔧 TaskAssignmentModal - Assigning task:', task.id)
      console.log('🔧 TaskAssignmentModal - Selected worker ID:', selectedWorkerId)
      console.log('🔧 TaskAssignmentModal - Setting status to: pending')
      console.log('🔧 TaskAssignmentModal - Setting due_date to:', new Date().toISOString().split('T')[0])
      
      const { data, error } = await supabase
        .from('tasks')
        .update({ 
          assigned_to: selectedWorkerId,
          status: 'pending',
          due_date: new Date().toISOString().split('T')[0] // Set due date to today
        })
        .eq('id', task.id)
        .select()

      console.log('🔧 TaskAssignmentModal - Update result:', { data, error })

      if (error) throw error

      toast({
        title: 'Success',
        description: 'Task assigned successfully'
      })
      setIsOpen(false)
      onTaskUpdated()
    } catch (error) {
      console.error('🔧 TaskAssignmentModal - Error assigning task:', error)
      toast({
        title: 'Error',
        description: 'Failed to assign task',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleUnassignTask = async () => {
    setIsLoading(true)
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ assigned_to: null })
        .eq('id', task.id)

      if (error) throw error

      toast({
        title: 'Success',
        description: 'Task unassigned successfully'
      })
      setIsOpen(false)
      onTaskUpdated()
    } catch (error) {
      console.error('Error unassigning task:', error)
      toast({
        title: 'Error',
        description: 'Failed to unassign task',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getAssignedWorkerName = () => {
    const worker = workers.find(w => w.id === task.assigned_to)
    return worker?.full_name || 'Unassigned'
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <UserPlus className="h-4 w-4 mr-2" />
          {task.assigned_to ? 'Reassign' : 'Assign'}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Assign Task</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Task: {task.title}</h4>
            <div className="flex gap-2">
              <Badge variant="outline">{task.status}</Badge>
              <Badge variant="outline">{task.priority}</Badge>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">
              Currently assigned to: {getAssignedWorkerName()}
            </label>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Select Worker</label>
            <Select value={selectedWorkerId} onValueChange={setSelectedWorkerId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a worker" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Unassigned</SelectItem>
                {workers.map((worker) => (
                  <SelectItem key={worker.id} value={worker.id}>
                    {worker.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 pt-4">
            <Button 
              onClick={handleAssignTask}
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Assign Task
            </Button>
            
            {task.assigned_to && (
              <Button 
                variant="outline" 
                onClick={handleUnassignTask}
                disabled={isLoading}
              >
                Unassign
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}