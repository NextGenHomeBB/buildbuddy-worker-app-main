import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

export interface TaskRelation {
  id: string
  src_task: string
  dest_task: string
  relation: 'blocks' | 'relates' | 'duplicate'
  created_at: string
  src_title: string
  dest_title: string
}

export interface TaskMapTask {
  id: string
  title: string
  status: 'todo' | 'done'
  priority: 'low' | 'medium' | 'high'
  assignee: string
  project_id: string
  x?: number
  y?: number
}

export function useTaskMap() {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const {
    data: relations = [],
    isLoading: relationsLoading
  } = useQuery({
    queryKey: ['task-map-relations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_task_relations')

      if (error) {
        // Fallback to direct query if RPC doesn't exist
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('task_relations')
          .select(`
            *,
            src_task:tasks!task_relations_src_task_fkey(title),
            dest_task:tasks!task_relations_dest_task_fkey(title)
          `)

        if (fallbackError) throw fallbackError
        
        return (fallbackData || []).map(rel => ({
          ...rel,
          src_title: rel.src_task?.title || '',
          dest_title: rel.dest_task?.title || ''
        })) as TaskRelation[]
      }
      
      return data as TaskRelation[]
    }
  })

  const {
    data: tasks = [],
    isLoading: tasksLoading
  } = useQuery({
    queryKey: ['my-tasks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('worker.my_tasks_view')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as TaskMapTask[]
    }
  })

  const createRelation = useMutation({
    mutationFn: async ({ srcTask, destTask, relation }: { 
      srcTask: string
      destTask: string
      relation: 'blocks' | 'relates' | 'duplicate'
    }) => {
      const { error } = await supabase
        .from('task_relations')
        .insert({
          src_task: srcTask,
          dest_task: destTask,
          relation
        })

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-map-relations'] })
      toast({
        title: 'Relation created',
        description: 'Task relationship has been added successfully',
      })
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to create task relationship',
        variant: 'destructive',
      })
      console.error('Create relation error:', error)
    }
  })

  const deleteRelation = useMutation({
    mutationFn: async (relationId: string) => {
      const { error } = await supabase
        .from('task_relations')
        .delete()
        .eq('id', relationId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-map-relations'] })
      toast({
        title: 'Relation deleted',
        description: 'Task relationship has been removed',
      })
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to delete task relationship',
        variant: 'destructive',
      })
      console.error('Delete relation error:', error)
    }
  })

  return {
    relations,
    tasks,
    isLoading: relationsLoading || tasksLoading,
    createRelation: createRelation.mutate,
    deleteRelation: deleteRelation.mutate,
    isCreating: createRelation.isPending,
    isDeleting: deleteRelation.isPending
  }
}