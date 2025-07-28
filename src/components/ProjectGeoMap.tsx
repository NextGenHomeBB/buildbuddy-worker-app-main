import React, { 
  useEffect, 
  useRef, 
  useState, 
  useCallback,
  forwardRef,
  useImperativeHandle
} from 'react'
import mapboxgl from 'mapbox-gl'
import Supercluster from 'supercluster'
import { useProjects, Project } from '@/hooks/useProjects'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle 
} from '@/components/ui/sheet'
import { Card, CardContent } from '@/components/ui/card'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Route, MapPin, Navigation } from 'lucide-react'
import { cn } from '@/lib/utils'
import 'mapbox-gl/dist/mapbox-gl.css'

// Default Mapbox style (uses OpenStreetMap data)
const MAPBOX_STYLE = 'mapbox://styles/mapbox/light-v11'

// Color mapping for project status
const STATUS_COLORS = {
  completed: '#94a3b8', // slate-400
  pending: '#f59e0b',   // amber-500
  at_risk: '#dc2626'    // rose-600
} as const

// Viewport persistence key
const VIEWPORT_KEY = 'projectGeoMap_viewport'

export interface ProjectGeoMapRef {
  flyToProject: (id: string) => void
}

interface MapViewport {
  lng: number
  lat: number
  zoom: number
}

export const ProjectGeoMap = forwardRef<ProjectGeoMapRef>((_, ref) => {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const markersRef = useRef<mapboxgl.Marker[]>([])
  const linesRef = useRef<string[]>([])
  
  const [showLines, setShowLines] = useState(true)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [mapCenter, setMapCenter] = useState<[number, number]>([4.8936, 52.3728])
  const [mapboxToken, setMapboxToken] = useState('')
  const [mapLoaded, setMapLoaded] = useState(false)
  
  const { data: projects = [], isLoading } = useProjects()

  // Load saved viewport
  const loadViewport = useCallback((): MapViewport => {
    try {
      const saved = localStorage.getItem(VIEWPORT_KEY)
      if (saved) {
        return JSON.parse(saved)
      }
    } catch (e) {
      console.warn('Failed to load saved viewport:', e)
    }
    return { lng: 4.8936, lat: 52.3728, zoom: 5 }
  }, [])

  // Save viewport to localStorage
  const saveViewport = useCallback((viewport: MapViewport) => {
    try {
      localStorage.setItem(VIEWPORT_KEY, JSON.stringify(viewport))
    } catch (e) {
      console.warn('Failed to save viewport:', e)
    }
  }, [])

  // Calculate distance between two points in km
  const calculateDistance = useCallback((
    lat1: number, 
    lng1: number, 
    lat2: number, 
    lng2: number
  ): number => {
    const R = 6371 // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLng = (lng2 - lng1) * Math.PI / 180
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c
  }, [])

  // Get projects in current viewport
  const getProjectsInViewport = useCallback((): Project[] => {
    if (!map.current) return []
    
    const bounds = map.current.getBounds()
    return projects.filter(project => 
      project.lat >= bounds.getSouth() &&
      project.lat <= bounds.getNorth() &&
      project.lng >= bounds.getWest() &&
      project.lng <= bounds.getEast()
    )
  }, [projects])

  // Draw geodesic lines between projects
  const drawGeodesicLines = useCallback(() => {
    if (!map.current || !showLines || !mapLoaded) return

    // Remove existing lines
    linesRef.current.forEach(lineId => {
      if (map.current?.getLayer(lineId)) {
        map.current.removeLayer(lineId)
      }
      if (map.current?.getSource(lineId)) {
        map.current.removeSource(lineId)
      }
    })
    linesRef.current = []

    const viewportProjects = getProjectsInViewport()
    if (viewportProjects.length < 2 || viewportProjects.length > 10) return

    // Sort by priority (lowest number first)
    const sortedProjects = [...viewportProjects].sort((a, b) => a.priority - b.priority)

    // Draw lines between consecutive projects
    for (let i = 0; i < sortedProjects.length - 1; i++) {
      const from = sortedProjects[i]
      const to = sortedProjects[i + 1]
      const lineId = `line-${from.id}-${to.id}`

      map.current?.addSource(lineId, {
        type: 'geojson',
        data: {
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: [[from.lng, from.lat], [to.lng, to.lat]]
          },
          properties: {}
        }
      })

      map.current?.addLayer({
        id: lineId,
        type: 'line',
        source: lineId,
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': '#6366f1', // indigo-500
          'line-width': 2,
          'line-opacity': 0.7
        }
      })

      linesRef.current.push(lineId)
    }
  }, [showLines, getProjectsInViewport, mapLoaded])

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return

    // Check for Mapbox token
    const token = localStorage.getItem('mapbox_token') || 'pk.demo_token'
    setMapboxToken(token)
    
    if (!token || token === 'pk.demo_token') {
      console.warn('No Mapbox token found. Using demo mode.')
    }

    mapboxgl.accessToken = token
    const viewport = loadViewport()

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: MAPBOX_STYLE,
      center: [viewport.lng, viewport.lat],
      zoom: viewport.zoom,
      bearing: 0,
      pitch: 0
    })

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right')

    // Wait for style to load before enabling operations
    map.current.on('load', () => {
      setMapLoaded(true)
    })

    map.current.on('moveend', () => {
      if (!map.current || !mapLoaded) return
      const center = map.current.getCenter()
      const zoom = map.current.getZoom()
      setMapCenter([center.lng, center.lat])
      saveViewport({ lng: center.lng, lat: center.lat, zoom })
      drawGeodesicLines()
    })

    return () => {
      map.current?.remove()
      map.current = null
      setMapLoaded(false)
    }
  }, [loadViewport, saveViewport])

  // Add project markers
  useEffect(() => {
    if (!map.current || !projects.length || !mapLoaded) return

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove())
    markersRef.current = []

    // Fit bounds to all projects on initial load
    if (projects.length > 0) {
      const bounds = new mapboxgl.LngLatBounds()
      projects.forEach(project => {
        bounds.extend([project.lng, project.lat])
      })
      map.current.fitBounds(bounds, { padding: 50 })
    }

    // Add markers for each project
    projects.forEach(project => {
      const markerEl = document.createElement('div')
      markerEl.className = 'cursor-pointer'
      markerEl.innerHTML = `
        <div class="w-6 h-6 rounded-full border-2 border-white shadow-lg flex items-center justify-center" 
             style="background-color: ${STATUS_COLORS[project.status]}"
             role="button"
             tabindex="0"
             aria-label="${project.name} – ${project.status}">
          <svg class="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd" />
          </svg>
        </div>
      `

      const marker = new mapboxgl.Marker(markerEl)
        .setLngLat([project.lng, project.lat])
        .addTo(map.current!)

      markerEl.addEventListener('click', () => {
        setSelectedProject(project)
        setSheetOpen(true)
      })

      markerEl.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          setSelectedProject(project)
          setSheetOpen(true)
        }
      })

      markersRef.current.push(marker)
    })

    // Initial line drawing after markers are placed
    setTimeout(drawGeodesicLines, 100)
  }, [projects, mapLoaded, drawGeodesicLines])

  // Redraw lines when toggle changes
  useEffect(() => {
    if (mapLoaded) {
      drawGeodesicLines()
    }
  }, [showLines, mapLoaded, drawGeodesicLines])

  // Imperative handle for flyToProject
  useImperativeHandle(ref, () => ({
    flyToProject: (id: string) => {
      const project = projects.find(p => p.id === id)
      if (project && map.current) {
        map.current.flyTo({
          center: [project.lng, project.lat],
          zoom: 12,
          duration: 2000
        })
        setSelectedProject(project)
        setSheetOpen(true)
      }
    }
  }), [projects])

  const selectedDistance = selectedProject ? 
    calculateDistance(mapCenter[1], mapCenter[0], selectedProject.lat, selectedProject.lng) 
    : 0

  const getStatusBadgeVariant = (status: Project['status']) => {
    switch (status) {
      case 'completed': return 'secondary'
      case 'pending': return 'default'
      case 'at_risk': return 'destructive'
      default: return 'secondary'
    }
  }

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading projects...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 relative">
      {/* Mapbox Token Input (if not set) */}
      {(!mapboxToken || mapboxToken === 'pk.demo_token') && (
        <Card className="absolute top-4 left-4 z-10 w-80">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground mb-2">
              Enter your Mapbox token for full functionality:
            </p>
            <input
              type="text"
              placeholder="pk.your_mapbox_token_here"
              className="w-full p-2 text-xs border rounded"
              onBlur={(e) => {
                if (e.target.value) {
                  localStorage.setItem('mapbox_token', e.target.value)
                  window.location.reload()
                }
              }}
            />
          </CardContent>
        </Card>
      )}

      {/* Map Container */}
      <div ref={mapContainer} className="absolute inset-0" />

      {/* Floating Controls */}
      <div className="absolute bottom-4 right-4 z-10">
        <Card>
          <CardContent className="p-2">
            <ToggleGroup 
              type="single" 
              value={showLines ? 'lines' : ''} 
              onValueChange={(value) => setShowLines(value === 'lines')}
            >
              <ToggleGroupItem value="lines" aria-label="Toggle geodesic lines">
                <Route className="h-4 w-4" />
              </ToggleGroupItem>
            </ToggleGroup>
          </CardContent>
        </Card>
      </div>

      {/* Project Details Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              {selectedProject?.name}
            </SheetTitle>
          </SheetHeader>
          
          {selectedProject && (
            <div className="mt-6 space-y-4">
              <div className="flex items-center gap-2">
                <Badge variant={getStatusBadgeVariant(selectedProject.status)}>
                  {selectedProject.status.replace('_', ' ')}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  Priority: {selectedProject.priority}
                </span>
              </div>

              {selectedProject.description && (
                <p className="text-sm text-muted-foreground">
                  {selectedProject.description}
                </p>
              )}

              <div className="text-sm">
                <span className="font-medium">Distance from center: </span>
                <span className="text-muted-foreground">
                  {selectedDistance.toFixed(1)} km
                </span>
              </div>

              <Button
                className="w-full"
                onClick={() => {
                  const url = `https://www.google.com/maps/dir/?api=1&destination=${selectedProject.lat},${selectedProject.lng}`
                  window.open(url, '_blank')
                }}
              >
                <Navigation className="h-4 w-4 mr-2" />
                Navigate
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
})

ProjectGeoMap.displayName = 'ProjectGeoMap'