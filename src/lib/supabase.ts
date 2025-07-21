import { createClient } from '@supabase/supabase-js'

// Environment variables - to be defined in Lovable → Environment Variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'http://localhost:54321'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key'

// Database types for worker tasks
export interface WorkerTask {
  id: string
  title: string
  description?: string
  status: 'pending' | 'in_progress' | 'completed'
  priority: 'low' | 'medium' | 'high'
  assigned_worker_id: string
  created_at: string
  updated_at: string
  due_date?: string
}

export interface Database {
  public: {
    Tables: {
      // Define your actual table structure here
    }
    Views: {
      'worker.my_tasks_view': {
        Row: WorkerTask
      }
    }
  }
}

// Create a single supabase client for interacting with your database
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})