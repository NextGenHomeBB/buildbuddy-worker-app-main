import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useLanguage } from '@/hooks/useLanguage'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/integrations/supabase/client'
import { MobileBottomNav } from '@/components/MobileBottomNav'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { Bell, Moon, Globe, Shield, HelpCircle, Download, Clock } from 'lucide-react'

export default function Settings() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { toast } = useToast()
  const { t } = useTranslation()
  const { currentLanguage, changeLanguage, availableLanguages } = useLanguage()
  const [isDownloading, setIsDownloading] = useState(false)

  const downloadTimeSheetStatement = async () => {
    if (!user) return

    setIsDownloading(true)
    try {
      // Fetch all time sheets for the user
      const { data: timeSheets, error } = await supabase
        .from('time_sheets')
        .select('*')
        .eq('user_id', user.id)
        .order('work_date', { ascending: false })

      if (error) throw error

      if (!timeSheets || timeSheets.length === 0) {
        toast({
          title: 'No Data Found',
          description: 'You have no shift hours recorded yet.',
          variant: 'destructive',
        })
        return
      }

      // Create CSV content
      const csvHeader = 'Date,Hours Worked,Note,Created At\n'
      const csvRows = timeSheets.map(sheet => {
        const date = new Date(sheet.work_date).toLocaleDateString()
        const hours = sheet.hours?.toFixed(2) || '0.00'
        const note = (sheet.note || '').replace(/,/g, ';') // Replace commas to avoid CSV issues
        const createdAt = new Date(sheet.created_at).toLocaleString()
        return `"${date}","${hours}","${note}","${createdAt}"`
      }).join('\n')

      const csvContent = csvHeader + csvRows

      // Calculate totals
      const totalHours = timeSheets.reduce((sum, sheet) => sum + (sheet.hours || 0), 0)
      const totalDays = timeSheets.length

      // Add summary at the end
      const csvSummary = `\n\nSUMMARY:\nTotal Days Worked,${totalDays}\nTotal Hours,${totalHours.toFixed(2)}\nAverage Hours per Day,${totalDays > 0 ? (totalHours / totalDays).toFixed(2) : '0.00'}`
      const finalCsvContent = csvContent + csvSummary

      // Create and download file
      const blob = new Blob([finalCsvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      
      link.setAttribute('href', url)
      link.setAttribute('download', `shift-hours-statement-${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast({
        title: 'Download Complete',
        description: `Downloaded statement with ${totalDays} work days and ${totalHours.toFixed(2)} total hours.`,
      })
    } catch (error) {
      console.error('Error downloading time sheet:', error)
      toast({
        title: 'Download Failed',
        description: 'Unable to download your shift hours statement. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background pb-20 lg:pb-0">
      {/* Header */}
      <div className="bg-card border-b border-border p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-center">
          <img 
            src="/lovable-uploads/f8eff9bf-a328-4c88-bf0b-a0a5a85c77ec.png" 
            alt="NextGen Home" 
            className="h-8 w-auto cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => navigate('/today')}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Task Updates</div>
                <div className="text-sm text-muted-foreground">Get notified when tasks are assigned or updated</div>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Daily Reminders</div>
                <div className="text-sm text-muted-foreground">Receive daily task reminders</div>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>

        {/* Appearance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Moon className="w-5 h-5" />
              Appearance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Dark Mode</div>
                <div className="text-sm text-muted-foreground">Toggle dark mode theme</div>
              </div>
              <Switch />
            </div>
          </CardContent>
        </Card>

        {/* Time Tracking */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Time Tracking
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Shift Hours Statement</div>
                <div className="text-sm text-muted-foreground">Download a CSV file with all your recorded shift hours</div>
              </div>
            </div>
            <Button 
              onClick={downloadTimeSheetStatement}
              disabled={isDownloading}
              className="w-full justify-start hover-scale"
              variant="outline"
            >
              <Download className="w-4 h-4 mr-2" />
              {isDownloading ? 'Preparing Download...' : 'Download Shift Hours Statement'}
            </Button>
          </CardContent>
        </Card>

        {/* Language & Region */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5" />
              {t('settings.languageRegion')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={currentLanguage} onValueChange={changeLanguage}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="z-50 bg-popover">
                {availableLanguages.map((lang) => (
                  <SelectItem key={lang.code} value={lang.code}>
                    <div className="flex items-center gap-2">
                      <span>{lang.flag}</span>
                      <span>{lang.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Privacy & Security */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Privacy & Security
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full justify-start">
              Change Password
            </Button>
            <Button variant="outline" className="w-full justify-start">
              Privacy Settings
            </Button>
          </CardContent>
        </Card>

        {/* Help & Support */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="w-5 h-5" />
              Help & Support
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full justify-start">
              Help Center
            </Button>
            <Button variant="outline" className="w-full justify-start">
              Contact Support
            </Button>
            <Button variant="outline" className="w-full justify-start">
              Report a Bug
            </Button>
          </CardContent>
        </Card>
      </div>

      <MobileBottomNav />
    </div>
  )
}