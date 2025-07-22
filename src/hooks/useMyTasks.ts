import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, WorkerTask } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'
import { enqueueMutation } from '@/lib/offlineQueue'

export function useMyTasks() {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const {
    data: tasks,
    isLoading,
    error
  } = useQuery({
    queryKey: ['my-tasks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('worker.my_tasks_view')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as WorkerTask[]
    }
  })

  const updateTaskStatus = useMutation({
    mutationFn: async ({ taskId, status }: { taskId: string; status: 'todo' | 'done' }) => {
      const patch = { status, updated_at: new Date().toISOString() }
      
      if (!navigator.onLine) {
        // Queue the mutation for when we come back online
        await enqueueMutation({
          table: 'tasks',
          recordId: taskId,
          patch
        })
        return { queued: true }
      }

      // Try to execute immediately when online
      const { error } = await supabase
        .from('tasks')
        .update(patch)
        .eq('id', taskId)

      if (error) throw error
      return { queued: false }
    },
    onMutate: async ({ taskId, status }) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ['my-tasks'] })
      
      const previousTasks = queryClient.getQueryData<WorkerTask[]>(['my-tasks'])
      
      queryClient.setQueryData<WorkerTask[]>(['my-tasks'], (old = []) =>
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
        queryClient.invalidateQueries({ queryKey: ['my-tasks'] })
        toast({
          title: 'Task Updated',
          description: `Task marked as ${status === 'done' ? 'completed' : 'todo'}`,
        })
      }
    },
    onError: (error, variables, context) => {
      // Revert optimistic update
      if (context?.previousTasks) {
        queryClient.setQueryData(['my-tasks'], context.previousTasks)
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