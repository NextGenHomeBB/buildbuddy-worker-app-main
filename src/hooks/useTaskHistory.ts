import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { format, parseISO, startOfDay, endOfDay } from 'date-fns'

export interface TaskHistoryItem {
  id: string
  daily_assignment_id: string
  worker_id: string
  project_id?: string
  task_title: string
  task_description?: string
  completion_date: string
  completed_at: string
  created_at: string
  project?: {
    name: string
  }
}

export interface GroupedTaskHistory {
  date: string
  displayDate: string
  tasks: TaskHistoryItem[]
}

export function useTaskHistory(startDate?: Date, endDate?: Date, projectId?: string) {
  const {
    data: history,
    isLoading,
    error
  } = useQuery({
    queryKey: ['task-history', startDate, endDate, projectId],
    queryFn: async () => {
      let query = supabase
        .from('task_completion_history')
        .select(`
          *,
          project:projects (
            name
          )
        `)
        .order('completed_at', { ascending: false })

      // Apply date filter
      if (startDate) {
        query = query.gte('completion_date', format(startDate, 'yyyy-MM-dd'))
      }
      if (endDate) {
        query = query.lte('completion_date', format(endDate, 'yyyy-MM-dd'))
      }

      // Apply project filter
      if (projectId) {
        query = query.eq('project_id', projectId)
      }

      const { data, error } = await query

      if (error) throw error
      return data as TaskHistoryItem[]
    }
  })

  // Group tasks by completion date
  const groupedHistory: GroupedTaskHistory[] = history?.reduce((groups, task) => {
    const date = task.completion_date
    const existingGroup = groups.find(group => group.date === date)
    
    if (existingGroup) {
      existingGroup.tasks.push(task)
    } else {
      const parsedDate = parseISO(date + 'T00:00:00')
      const today = startOfDay(new Date())
      const yesterday = startOfDay(new Date(Date.now() - 24 * 60 * 60 * 1000))
      
      let displayDate: string
      if (startOfDay(parsedDate).getTime() === today.getTime()) {
        displayDate = `Today (${format(parsedDate, 'MMM d, yyyy')})`
      } else if (startOfDay(parsedDate).getTime() === yesterday.getTime()) {
        displayDate = `Yesterday (${format(parsedDate, 'MMM d, yyyy')})`
      } else {
        displayDate = format(parsedDate, 'MMMM d, yyyy')
      }
      
      groups.push({
        date,
        displayDate,
        tasks: [task]
      })
    }
    
    return groups
  }, [] as GroupedTaskHistory[]) || []

  // Search function
  const searchHistory = (searchTerm: string) => {
    if (!searchTerm.trim()) return groupedHistory
    
    const filtered = groupedHistory.map(group => ({
      ...group,
      tasks: group.tasks.filter(task =>
        task.task_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.task_description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.project?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    })).filter(group => group.tasks.length > 0)
    
    return filtered
  }

  // Get completion stats for a date range
  const getCompletionStats = () => {
    if (!history) return { totalTasks: 0, totalProjects: 0, averagePerDay: 0 }
    
    const totalTasks = history.length
    const uniqueProjects = new Set(history.map(task => task.project_id)).size
    const uniqueDays = new Set(history.map(task => task.completion_date)).size
    const averagePerDay = uniqueDays > 0 ? Math.round((totalTasks / uniqueDays) * 10) / 10 : 0
    
    return {
      totalTasks,
      totalProjects: uniqueProjects,
      averagePerDay
    }
  }

  return {
    history: history || [],
    groupedHistory,
    isLoading,
    error,
    searchHistory,
    getCompletionStats
  }
}