import { createClient } from '@supabase/supabase-js'

// Environment variables - to be defined in Lovable → Environment Variables
const supabaseUrl = 'https://ppsjrqfgsznnlojpyjvu.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwc2pycWZnc3pubmxvanB5anZ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwOTY3NTgsImV4cCI6MjA2ODY3Mjc1OH0.dO08bUqr9XqMk3fVkDK1OxpnzY_S5pPzUPAicnpTURE'

// Database types for worker tasks
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