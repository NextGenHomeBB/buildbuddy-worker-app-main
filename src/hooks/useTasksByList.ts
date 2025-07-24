import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'

export interface Task {
  id: string
  title: string
  description?: string
  status: 'todo' | 'completed'
  priority: 'low' | 'medium' | 'high'
  list_id?: string
  position: number
  assignee: string
  created_at: string
  updated_at: string
  completed_at?: string
}

export function useTasksByList(listId: string | null) {
  return useQuery({
    queryKey: ['tasks', 'byList', listId],
    queryFn: async () => {
      let query = supabase
        .from('tasks')
        .select('*')
        .eq('assignee', (await supabase.auth.getUser()).data.user?.id)
        .order('position', { ascending: true })
        .order('created_at', { ascending: true })

      if (listId === null) {
        // Get unassigned tasks
        query = query.is('list_id', null)
      } else {
        query = query.eq('list_id', listId)
      }

      const { data, error } = await query

      if (error) throw error
      return data as Task[]
    },
    enabled: listId !== undefined,
  })
}

export function useUpdateTaskStatus() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({ taskId, status }: { taskId: string; status: 'todo' | 'completed' }) => {
      const updates: any = { status }
      if (status === 'completed') {
        updates.completed_at = new Date().toISOString()
      } else {
        updates.completed_at = null
      }

      const { data, error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', taskId)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      queryClient.invalidateQueries({ queryKey: ['taskLists'] })
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to update task status. Please try again.',
        variant: 'destructive',
      })
      console.error('Error updating task status:', error)
    },
  })
}

export function useReorderTasks() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({ taskId, newPosition }: { taskId: string; newPosition: number }) => {
      const { data, error } = await supabase
        .from('tasks')
        .update({ position: newPosition })
        .eq('id', taskId)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to reorder tasks. Please try again.',
        variant: 'destructive',
      })
      console.error('Error reordering tasks:', error)
    },
  })
}

export function useDeleteTask() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (taskId: string) => {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      queryClient.invalidateQueries({ queryKey: ['taskLists'] })
      toast({
        title: 'Task deleted',
        description: 'The task has been deleted successfully.',
      })
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to delete task. Please try again.',
        variant: 'destructive',
      })
      console.error('Error deleting task:', error)
    },
  })
}