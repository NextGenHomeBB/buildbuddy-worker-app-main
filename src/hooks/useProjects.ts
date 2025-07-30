import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'

// Project type for compatibility
export interface Project {
  id: string
  name: string
  description?: string
  location?: string
  status: string
  budget?: number
  progress?: number
  created_at: string
  updated_at: string
  manager_id?: string
  organization_id: string
  company_id: string // Add missing field for compatibility
  start_date?: string
  end_date?: string
  remaining_budget?: number
  spent?: number
  type?: string
  // Geographic fields for ProjectGeoMap compatibility
  lat?: number
  lng?: number
  priority?: string
}

export function useProjects() {
  const { data: rawProjects = [], isLoading, error } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    }
  })

  // Map to Project type
  const projects: Project[] = rawProjects.map(p => ({
    ...p,
    company_id: p.organization_id, // Map organization_id to company_id for compatibility
  }))

  // Filter active projects (excluding archived)
  const activeProjects = projects.filter(project => 
    project.status !== 'archived'
  )

  return {
    projects,
    activeProjects, 
    isLoading,
    error,
    data: projects // Add data property for compatibility
  }
}