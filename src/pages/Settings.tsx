import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Settings as SettingsIcon } from 'lucide-react'
import { MobileBottomNav } from '@/components/MobileBottomNav'

// Simplified Settings component
export default function Settings() {
  return (
    <div className="container mx-auto p-6 pb-20 lg:pb-0">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <SettingsIcon className="h-6 w-6" />
            <CardTitle>Settings</CardTitle>
          </div>
          <CardDescription>
            Application settings (simplified view)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center py-8">
            <SettingsIcon className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Settings Coming Soon</h3>
            <p className="text-muted-foreground">
              Advanced settings functionality is being developed
            </p>
          </div>
        </CardContent>
      </Card>

      <MobileBottomNav />
    </div>
  )
}