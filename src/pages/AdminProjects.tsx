import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Building } from 'lucide-react'

// Simplified AdminProjects component
export default function AdminProjects() {
  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Building className="h-6 w-6" />
            <CardTitle>Admin Projects</CardTitle>
          </div>
          <CardDescription>
            Project management (simplified view)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center py-8">
            <Building className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Admin Projects Coming Soon</h3>
            <p className="text-muted-foreground">
              Advanced project management functionality is being developed
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}