import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, WorkerTask } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'

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
    mutationFn: async ({ taskId, status }: { taskId: string; status: WorkerTask['status'] }) => {
      const { error } = await supabase
        .from('tasks') // Assuming the actual table is 'tasks'
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', taskId)

      if (error) throw error
    },
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ['my-tasks'] })
      toast({
        title: 'Task Updated',
        description: `Task status changed to ${status.replace('_', ' ')}`,
      })
    },
    onError: (error) => {
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