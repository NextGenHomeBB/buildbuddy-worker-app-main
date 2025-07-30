import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { format, parseISO, startOfDay, endOfDay } from 'date-fns'

// Simplified version using actual tables
export function useTaskHistory() {
  const { data: taskHistory = [], isLoading } = useQuery({
    queryKey: ['task-history'],
    queryFn: async () => {
      // Use actual tasks table instead of non-existent history table
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          projects:project_id (
            id,
            name
          )
        `)
        .eq('status', 'completed')
        .order('updated_at', { ascending: false })
        .limit(50)

      if (error) throw error

      // Map to expected format
      return (data || []).map(task => ({
        id: task.id,
        daily_assignment_id: task.id, // Use task id as assignment id
        worker_id: task.assigned_to,
        project_id: task.project_id,
        task_title: task.title,
        task_description: task.description,
        completion_date: task.updated_at?.split('T')[0] || '',
        completed_at: task.updated_at,
        created_at: task.created_at,
        project: task.projects
      }))
    }
  })

  // Group by date for display
  const groupedHistory = taskHistory.reduce((acc, task) => {
    const date = task.completion_date
    if (!acc[date]) {
      acc[date] = []
    }
    acc[date].push(task)
    return acc
  }, {} as Record<string, typeof taskHistory>)

  // Sort dates descending
  const sortedDates = Object.keys(groupedHistory).sort((a, b) => b.localeCompare(a))

  return {
    taskHistory,
    groupedHistory,
    sortedDates,
    isLoading
  }
}