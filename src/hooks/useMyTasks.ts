import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, WorkerTask } from '@/lib/types'
import { useToast } from '@/hooks/use-toast'

// Simplified version using actual tasks table
export function useMyTasks() {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data: tasks = [], isLoading, error } = useQuery({
    queryKey: ['my-tasks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('assigned_to', (await supabase.auth.getUser()).data.user?.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      
      // Map to WorkerTask format
      return (data || []).map(task => ({
        id: task.id,
        title: task.title,
        description: task.description,
        status: task.status === 'completed' ? 'completed' : 'pending',
        priority: task.priority as 'low' | 'medium' | 'high',
        assigned_worker_id: task.assigned_to || '',
        created_at: task.created_at,
        updated_at: task.updated_at,
        due_date: task.due_date
      })) as WorkerTask[]
    }
  })

  const completeMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const { error } = await supabase
        .from('tasks')
        .update({ status: 'completed' })
        .eq('id', taskId)

      if (error) throw error
      return taskId
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-tasks'] })
      toast({
        title: 'Task completed',
        description: 'Task has been marked as complete',
      })
    }
  })

  return {
    tasks,
    isLoading,
    error,
    completeTask: completeMutation.mutate,
    isCompleting: completeMutation.isPending
  }
}