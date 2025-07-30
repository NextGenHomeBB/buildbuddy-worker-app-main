// Legacy types for compatibility
export interface WorkerTask {
  id: string
  title: string
  description?: string
  status: 'pending' | 'completed'
  priority: 'low' | 'medium' | 'high'
  assigned_worker_id: string
  created_at: string
  updated_at: string
  due_date?: string
}

export interface DailyTaskAssignment {
  id: string
  task_template_id: string
  worker_id: string
  project_id?: string
  assigned_date: string
  expires_at: string
  status: 'pending' | 'completed' | 'expired'
  completed_at?: string
  created_at: string
}

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
}

// Re-export the supabase client
export { supabase } from '@/integrations/supabase/client'
export type { Database } from '@/integrations/supabase/types'