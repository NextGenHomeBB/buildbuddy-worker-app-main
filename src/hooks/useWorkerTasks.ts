import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

// Simplified stub implementation
export function useWorkerTasks() {
  const { toast } = useToast()

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['worker-tasks'],
    queryFn: async () => {
      // Use actual tasks table
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      
      // Map to expected format
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
      }))
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
      toast({
        title: 'Task completed',
        description: 'Task has been marked as complete',
      })
    }
  })

  return {
    tasks,
    isLoading,
    completeTask: completeMutation.mutate,
    isCompleting: completeMutation.isPending
  }
}