
import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { Plus } from 'lucide-react'
import { taskValidationSchema, sanitizeText } from '@/lib/security'

interface AddTaskDialogProps {
  trigger?: React.ReactNode
}

export function AddTaskDialog({ trigger }: AddTaskDialogProps) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium')
  const { toast } = useToast()
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const createTaskMutation = useMutation({
    mutationFn: async (taskData: { title: string; description?: string; priority: string }) => {
      console.log('Creating task with data:', taskData)
      console.log('Current user:', user?.id)
      
      // First, let's get a project for this user
      const { data: userProjectRole, error: projectError } = await supabase
        .from('user_project_role')
        .select('project_id')
        .eq('user_id', user?.id)
        .limit(1)
        .single()

      if (projectError) {
        console.error('Project lookup error:', projectError)
        // If no project found, create task without project initially
      }

      const taskToInsert = {
        title: taskData.title,
        description: taskData.description || null,
        priority: taskData.priority,
        assignee: user?.id,
        status: 'todo',
        project_id: userProjectRole?.project_id || null,
        phase_id: null, // We can add phase selection later
      }

      console.log('Inserting task:', taskToInsert)

      const { data, error } = await supabase
        .from('tasks')
        .insert(taskToInsert)
        .select()
      
      if (error) {
        console.error('Task creation error:', error)
        throw error
      }
      
      console.log('Task created successfully:', data)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-tasks'] })
      toast({
        title: 'Success',
        description: 'Task created successfully',
      })
      
      // Reset form and close dialog
      setTitle('')
      setDescription('')
      setPriority('medium')
      setOpen(false)
    },
    onError: (error) => {
      console.error('Task creation error:', error)
      toast({
        title: 'Error',
        description: `Failed to create task: ${error.message}`,
        variant: 'destructive',
      })
    }
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) {
      toast({
        title: 'Error',
        description: 'You must be logged in to create tasks',
        variant: 'destructive',
      })
      return
    }

    // Validate and sanitize input
    const validation = taskValidationSchema.safeParse({
      title: title.trim(),
      description: description.trim(),
      priority: priority as 'low' | 'medium' | 'high'
    })

    if (!validation.success) {
      toast({
        title: "Validation Error",
        description: validation.error.errors[0]?.message || "Invalid input",
        variant: "destructive",
      })
      return
    }

    const sanitizedData = {
      title: sanitizeText(validation.data.title),
      description: validation.data.description ? sanitizeText(validation.data.description) : undefined,
      priority: validation.data.priority
    }

    createTaskMutation.mutate(sanitizedData)
  }

  const defaultTrigger = (
    <Button
      className="lg:hidden fixed bottom-20 right-4 w-14 h-14 rounded-full bg-construction-yellow hover:bg-construction-yellow/90 text-construction-yellow-foreground shadow-lg hover:shadow-xl transition-all duration-200 z-40 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brandBlue"
      size="icon"
    >
      <Plus className="w-6 h-6" />
      <span className="sr-only">Add new task</span>
    </Button>
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Task</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Task Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter task title..."
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter task description..."
              rows={3}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="priority">Priority</Label>
            <Select value={priority} onValueChange={(value: 'low' | 'medium' | 'high') => setPriority(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createTaskMutation.isPending || !title.trim()}
              className="flex-1"
            >
              {createTaskMutation.isPending ? 'Creating...' : 'Create Task'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
