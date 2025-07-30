import { useNavigate } from 'react-router-dom'
import { ProjectGeoMap } from '@/components/ProjectGeoMap'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Map } from 'lucide-react'
import { useIsMobile } from '@/hooks/use-mobile'
import { MobileBottomNav } from '@/components/MobileBottomNav'

export default function TaskMap() {
  const navigate = useNavigate()
  const isMobile = useIsMobile()

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/today')}
            className="lg:hidden"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          
          <div className="flex items-center gap-2">
            <img 
              src="/lovable-uploads/f8eff9bf-a328-4c88-bf0b-a0a5a85c77ec.png" 
              alt="NextGen Home" 
              className="h-6 w-auto cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => navigate('/today')}
            />
            {!isMobile && (
              <>
                <Map className="h-5 w-5 text-muted-foreground" />
                <h1 className="text-xl font-semibold text-foreground">Project Map</h1>
              </>
            )}
          </div>
        </div>

        <div className="text-sm text-muted-foreground">
          Click projects to view details • Toggle lines to see connections
        </div>
      </div>

      {/* Map */}
      <ProjectGeoMap />

      {/* Mobile Instructions */}
      {isMobile && (
        <div className="bg-card border-t border-border p-3">
          <div className="text-xs text-muted-foreground text-center">
            Tap projects for details • Use controls to navigate
          </div>
        </div>
      )}

      <MobileBottomNav />
    </div>
  )
}