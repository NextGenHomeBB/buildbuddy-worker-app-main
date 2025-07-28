import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/contexts/AuthContext'
import { enqueueMutation } from '@/lib/offlineQueue'

interface WorkerTask {
  id: string
  title: string
  description?: string
  status: 'pending' | 'completed'  // mapped from todo/done
  priority: 'low' | 'medium' | 'high'
  assigned_worker_id: string  // for compatibility with TaskCard
  assignee: string
  created_at: string
  updated_at: string
  due_date?: string  // mapped from end_date
  start_date?: string  // include start_date for filtering
  end_date?: string
  project_id?: string
}

export function useWorkerTasks() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const { user } = useAuth()

  const {
    data: tasks,
    isLoading,
    error
  } = useQuery({
    queryKey: ['worker-tasks'],
    queryFn: async () => {
      if (!user?.id) {
        throw new Error('User not authenticated')
      }

      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('assignee', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      
      // Map fields for calendar compatibility
      return data.map(task => ({
        ...task,
        due_date: task.end_date,
        assigned_worker_id: task.assignee,
        status: task.status === 'done' ? 'completed' : 'pending'
      })) as WorkerTask[]
    },
    enabled: !!user?.id
  })

  const updateTaskStatus = useMutation({
    mutationFn: async ({ taskId, status }: { taskId: string; status: 'pending' | 'completed' }) => {
      const dbStatus = status === 'completed' ? 'done' : 'todo'
      const patch = { 
        status: dbStatus,
        updated_at: new Date().toISOString(),
        completed_at: status === 'completed' ? new Date().toISOString() : null
      }
      
      if (!navigator.onLine) {
        await enqueueMutation({
          table: 'tasks',
          recordId: taskId,
          patch
        })
        return { queued: true }
      }

      const { error } = await supabase
        .from('tasks')
        .update(patch)
        .eq('id', taskId)

      if (error) throw error
      return { queued: false }
    },
    onMutate: async ({ taskId, status }) => {
      await queryClient.cancelQueries({ queryKey: ['worker-tasks'] })
      
      const previousTasks = queryClient.getQueryData<WorkerTask[]>(['worker-tasks'])
      
      queryClient.setQueryData<WorkerTask[]>(['worker-tasks'], (old = []) =>
        old.map(task =>
          task.id === taskId ? { ...task, status } : task
        )
      )
      
      return { previousTasks }
    },
    onSuccess: (data, { status }) => {
      if (data?.queued) {
        toast({
          title: 'Queued while offline',
          description: `Task will be updated when connection is restored`,
        })
      } else {
        queryClient.invalidateQueries({ queryKey: ['worker-tasks'] })
        toast({
          title: 'Task Updated',
          description: `Task marked as ${status === 'completed' ? 'completed' : 'pending'}`,
        })
      }
    },
    onError: (error, variables, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(['worker-tasks'], context.previousTasks)
      }
      
      toast({
        title: 'Error',
        description: 'Failed to update task status',
        variant: 'destructive',
      })
      console.error('Task update error:', error)
    }
  })

  return {
    tasks: tasks || [],
    isLoading,
    error,
    updateTaskStatus: updateTaskStatus.mutate,
    isUpdating: updateTaskStatus.isPending
  }
}