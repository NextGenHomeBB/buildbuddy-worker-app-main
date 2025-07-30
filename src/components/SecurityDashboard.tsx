import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { Shield, AlertTriangle, Users, Activity, RefreshCw } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface SecurityEvent {
  id: string
  user_id: string | null
  action: string
  table_name: string
  timestamp: string
  old_values: any
  new_values: any
  ip_address: string | null
}

interface RateLimit {
  id: string
  user_id: string
  operation: string
  attempt_count: number
  window_start: string
}

export function SecurityDashboard() {
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([])
  const [rateLimits, setRateLimits] = useState<RateLimit[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  const { user } = useAuth()

  const fetchSecurityData = async () => {
    try {
      setLoading(true)
      
      // Fetch recent security audit logs
      const { data: events, error: eventsError } = await supabase
        .from('security_audit_log')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(100)

      if (eventsError) throw eventsError

      // Fetch recent rate limit violations
      const { data: limits, error: limitsError } = await supabase
        .from('rate_limits')
        .select('*')
        .gte('window_start', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('window_start', { ascending: false })

      if (limitsError) throw limitsError

      setSecurityEvents(events || [])
      setRateLimits(limits || [])
    } catch (error) {
      console.error('Failed to fetch security data:', error)
      toast({
        title: 'Error',
        description: 'Failed to load security dashboard',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSecurityData()
  }, [])

  const getSeverityBadge = (action: string) => {
    const lowSeverity = ['INSERT', 'SELECT']
    const mediumSeverity = ['UPDATE']
    const highSeverity = ['DELETE', 'role']
    
    if (highSeverity.some(term => action.toLowerCase().includes(term))) {
      return <Badge variant="destructive">High</Badge>
    } else if (mediumSeverity.some(term => action.toLowerCase().includes(term))) {
      return <Badge variant="secondary">Medium</Badge>
    } else {
      return <Badge variant="outline">Low</Badge>
    }
  }

  const getActionIcon = (action: string) => {
    if (action.toLowerCase().includes('role')) return <Users className="h-4 w-4" />
    if (action.toLowerCase().includes('delete')) return <AlertTriangle className="h-4 w-4" />
    return <Activity className="h-4 w-4" />
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Security Dashboard</h1>
        </div>
        <Button onClick={fetchSecurityData} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Security Events</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{securityEvents.length}</div>
            <p className="text-xs text-muted-foreground">Last 24 hours</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rate Limits Hit</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rateLimits.length}</div>
            <p className="text-xs text-muted-foreground">Active restrictions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Severity</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {securityEvents.filter(event => 
                event.action.toLowerCase().includes('delete') || 
                event.action.toLowerCase().includes('role')
              ).length}
            </div>
            <p className="text-xs text-muted-foreground">Critical events</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="events" className="space-y-4">
        <TabsList>
          <TabsTrigger value="events">Security Events</TabsTrigger>
          <TabsTrigger value="limits">Rate Limits</TabsTrigger>
        </TabsList>

        <TabsContent value="events" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Security Events</CardTitle>
              <CardDescription>Audit log of security-related activities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {securityEvents.map((event) => (
                  <div key={event.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {getActionIcon(event.action)}
                      <div>
                        <div className="font-medium">{event.action} on {event.table_name}</div>
                        <div className="text-sm text-muted-foreground">
                          User ID: {event.user_id || 'System'} • {formatDistanceToNow(new Date(event.timestamp))} ago
                        </div>
                        {event.ip_address && (
                          <div className="text-xs text-muted-foreground">IP: {event.ip_address}</div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getSeverityBadge(event.action)}
                    </div>
                  </div>
                ))}
                
                {securityEvents.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No security events found
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="limits" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Rate Limits</CardTitle>
              <CardDescription>Users currently affected by rate limiting</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {rateLimits.map((limit) => (
                  <div key={limit.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <div className="font-medium">{limit.operation}</div>
                      <div className="text-sm text-muted-foreground">
                        User: {limit.user_id} • {limit.attempt_count} attempts
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Window started: {formatDistanceToNow(new Date(limit.window_start))} ago
                      </div>
                    </div>
                    <Badge variant="outline">{limit.attempt_count} attempts</Badge>
                  </div>
                ))}
                
                {rateLimits.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No active rate limits
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}