import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Settings, Building2, Users, Shield } from 'lucide-react'

const AdminSettings = () => {
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Organization Settings</h1>
          <p className="text-muted-foreground">Configure your organization preferences and policies</p>
        </div>

        {/* Organization Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Organization Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="org-name">Organization Name</Label>
                <Input id="org-name" placeholder="BuildBuddy Construction" />
              </div>
              <div>
                <Label htmlFor="org-email">Contact Email</Label>
                <Input id="org-email" type="email" placeholder="admin@buildbuddy.com" />
              </div>
            </div>
            <div>
              <Label htmlFor="org-address">Address</Label>
              <Input id="org-address" placeholder="123 Construction Ave, Builder City" />
            </div>
            <Button>Save Organization Details</Button>
          </CardContent>
        </Card>

        {/* User Management Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              User Management
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Auto-assign new users</h4>
                <p className="text-sm text-muted-foreground">Automatically assign worker role to new registrations</p>
              </div>
              <Button variant="outline">Configure</Button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">User approval required</h4>
                <p className="text-sm text-muted-foreground">Require admin approval for new user accounts</p>
              </div>
              <Button variant="outline">Configure</Button>
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Security & Permissions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Two-factor authentication</h4>
                <p className="text-sm text-muted-foreground">Require 2FA for admin accounts</p>
              </div>
              <Button variant="outline">Configure</Button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Session timeout</h4>
                <p className="text-sm text-muted-foreground">Automatically log out inactive users</p>
              </div>
              <Button variant="outline">Configure</Button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Password policy</h4>
                <p className="text-sm text-muted-foreground">Set minimum password requirements</p>
              </div>
              <Button variant="outline">Configure</Button>
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Email notifications</h4>
                <p className="text-sm text-muted-foreground">Send email alerts for important events</p>
              </div>
              <Button variant="outline">Configure</Button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Real-time alerts</h4>
                <p className="text-sm text-muted-foreground">Push notifications for urgent issues</p>
              </div>
              <Button variant="outline">Configure</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default AdminSettings