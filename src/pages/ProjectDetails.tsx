import { useParams, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Building, ArrowLeft } from 'lucide-react'

// Simplified Project Details page
export default function ProjectDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  
  return (
    <div className="container mx-auto p-6">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate('/projects')}
        className="mb-4"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Projects
      </Button>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Building className="h-6 w-6" />
            <CardTitle>Project Details</CardTitle>
          </div>
          <CardDescription>
            Project details view (simplified)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center py-8">
            <Building className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Project Details Coming Soon</h3>
            <p className="text-muted-foreground">
              Project details functionality is being developed
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}