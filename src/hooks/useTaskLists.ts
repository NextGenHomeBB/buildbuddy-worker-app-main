import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

export interface TaskList {
  id: string
  name: string
  color_hex: string
  owner_id: string
  created_at: string
  updated_at: string
}

export function useTaskLists() {
  return useQuery({
    queryKey: ['taskLists'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('task_lists')
        .select('*')
        .order('created_at', { ascending: true })

      if (error) throw error
      return data as TaskList[]
    },
  })
}

export function useCreateTaskList() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (listData: { name: string; color_hex: string }) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      const { data, error } = await supabase
        .from('task_lists')
        .insert({
          name: listData.name,
          color_hex: listData.color_hex,
          owner_id: user.id,
        })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['taskLists'] })
      toast({
        title: 'List created',
        description: 'Your new task list has been created successfully.',
      })
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to create list. Please try again.',
        variant: 'destructive',
      })
      console.error('Error creating list:', error)
    },
  })
}

export function useUpdateTaskList() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; name?: string; color_hex?: string }) => {
      const { data, error } = await supabase
        .from('task_lists')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['taskLists'] })
      toast({
        title: 'List updated',
        description: 'Your task list has been updated successfully.',
      })
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to update list. Please try again.',
        variant: 'destructive',
      })
      console.error('Error updating list:', error)
    },
  })
}

export function useDeleteTaskList() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('task_lists')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['taskLists'] })
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      toast({
        title: 'List deleted',
        description: 'Your task list has been deleted successfully.',
      })
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to delete list. Please try again.',
        variant: 'destructive',
      })
      console.error('Error deleting list:', error)
    },
  })
}