import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'
import { enqueueMutation } from '@/lib/offlineQueue'

export interface DailyTaskAssignment {
  id: string
  task_template_id: string
  worker_id: string
  project_id?: string
  assigned_date: string
  expires_at: string
  status: 'pending' | 'completed' | 'expired'
  completed_at?: string
  created_at: string
  task_template?: {
    title: string
    description?: string
    priority: 'low' | 'medium' | 'high'
  }
  project?: {
    name: string
  }
}

export function useDailyTasks() {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const {
    data: dailyTasks,
    isLoading,
    error
  } = useQuery({
    queryKey: ['daily-tasks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('daily_task_assignments')
        .select(`
          *,
          task_template:tasks!task_template_id (
            title,
            description,
            priority
          ),
          project:projects (
            name
          )
        `)
        .eq('assigned_date', new Date().toISOString().split('T')[0])
        .eq('status', 'pending')
        .lt('expires_at', 'now() + interval \'4 hours\'') // Only show tasks that haven't expired
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as DailyTaskAssignment[]
    }
  })

  const completeTask = useMutation({
    mutationFn: async (assignmentId: string) => {
      if (!navigator.onLine) {
        // Queue the mutation for when we come back online
        await enqueueMutation({
          table: 'daily_task_assignments',
          recordId: assignmentId,
          patch: { status: 'completed', completed_at: new Date().toISOString() }
        })
        return { queued: true }
      }

      // Call the database function to complete the task and add to history
      const { data, error } = await supabase.rpc('complete_daily_task', {
        assignment_id: assignmentId
      })

      if (error) throw error
      return data
    },
    onMutate: async (assignmentId) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ['daily-tasks'] })
      
      const previousTasks = queryClient.getQueryData<DailyTaskAssignment[]>(['daily-tasks'])
      
      queryClient.setQueryData<DailyTaskAssignment[]>(['daily-tasks'], (old = []) =>
        old.filter(task => task.id !== assignmentId)
      )
      
      return { previousTasks }
    },
    onSuccess: (data) => {
      if (data?.queued) {
        toast({
          title: 'Queued while offline',
          description: 'Task completion will sync when connection is restored',
        })
      } else {
        queryClient.invalidateQueries({ queryKey: ['daily-tasks'] })
        queryClient.invalidateQueries({ queryKey: ['task-history'] })
        toast({
          title: 'Task Completed',
          description: 'Task has been marked as complete and added to history',
        })
      }
    },
    onError: (error, variables, context) => {
      // Revert optimistic update
      if (context?.previousTasks) {
        queryClient.setQueryData(['daily-tasks'], context.previousTasks)
      }
      
      toast({
        title: 'Error',
        description: 'Failed to complete task',
        variant: 'destructive',
      })
      console.error('Task completion error:', error)
    }
  })

  // Calculate time remaining for tasks
  const getTimeRemaining = (expiresAt: string) => {
    const now = new Date()
    const expiry = new Date(expiresAt)
    const diffMs = expiry.getTime() - now.getTime()
    
    if (diffMs <= 0) return 'Expired'
    
    const hours = Math.floor(diffMs / (1000 * 60 * 60))
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
    
    if (hours > 0) {
      return `${hours}h ${minutes}m remaining`
    } else {
      return `${minutes}m remaining`
    }
  }

  const isTaskExpiringSoon = (expiresAt: string) => {
    const now = new Date()
    const expiry = new Date(expiresAt)
    const diffMs = expiry.getTime() - now.getTime()
    const hoursRemaining = diffMs / (1000 * 60 * 60)
    
    return hoursRemaining <= 2 && hoursRemaining > 0
  }

  return {
    dailyTasks: dailyTasks || [],
    isLoading,
    error,
    completeTask: completeTask.mutate,
    isCompleting: completeTask.isPending,
    getTimeRemaining,
    isTaskExpiringSoon
  }
}