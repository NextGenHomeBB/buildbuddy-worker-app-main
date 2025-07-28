import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export interface Project {
  id: string
  name: string
  lat: number
  lng: number
  status: 'completed' | 'pending' | 'at_risk'
  priority: number
  description?: string
  created_at?: string
}

// Mock data with European cities for demo
const mockProjects: Project[] = [
  {
    id: '1',
    name: 'Amsterdam HQ Remodel',
    lat: 52.3728,
    lng: 4.8936,
    status: 'completed',
    priority: 1,
    description: 'Complete renovation of headquarters building'
  },
  {
    id: '2', 
    name: 'Berlin Warehouse B',
    lat: 52.5200,
    lng: 13.4050,
    status: 'pending',
    priority: 2,
    description: 'New warehouse construction project'
  },
  {
    id: '3',
    name: 'London Retail Fit-out',
    lat: 51.5072,
    lng: -0.1276,
    status: 'at_risk',
    priority: 3,
    description: 'Retail space renovation with delays'
  },
  {
    id: '4',
    name: 'Paris Office Complex',
    lat: 48.8566,
    lng: 2.3522,
    status: 'pending',
    priority: 4,
    description: 'Modern office building construction'
  },
  {
    id: '5',
    name: 'Barcelona Housing',
    lat: 41.3851,
    lng: 2.1734,
    status: 'completed',
    priority: 5,
    description: 'Affordable housing development'
  }
]

export function useProjects() {
  return useQuery({
    queryKey: ['projects'],
    queryFn: async (): Promise<Project[]> => {
      // Try to fetch from Supabase first
      const { data, error } = await supabase
        .from('projects')
        .select('id, name, description, status, created_at')
        .limit(100)

      if (error) {
        console.warn('Using mock data:', error.message)
        return mockProjects
      }

      // Transform Supabase data to match our interface
      const projects: Project[] = (data || []).map((project, index) => ({
        id: project.id,
        name: project.name,
        lat: mockProjects[index % mockProjects.length].lat,
        lng: mockProjects[index % mockProjects.length].lng,
        status: project.status === 'active' ? 'pending' : 
                project.status === 'completed' ? 'completed' : 'at_risk',
        priority: index + 1,
        description: project.description || ''
      }))

      // If no projects in DB, use mock data
      return projects.length > 0 ? projects : mockProjects
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}