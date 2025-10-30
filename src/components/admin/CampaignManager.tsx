import React, { useState, useEffect } from 'react'
import {
  Mail,
  MessageSquare,
  Smartphone,
  Plus,
  Edit,
  Play,
  Pause,
  Square,
  Trash2,
  Eye,
  Search,
  Filter,
  Users,
  Send,
  Calendar,
  Clock,
  BarChart3,
  Target,
  Zap,
  Settings,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react'
import { format } from 'date-fns'
import { enUS, pl } from 'date-fns/locale'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/hooks/use-toast aria-live="polite" aria-atomic="true"'
import { cn } from '@/lib/utils'


interface CampaignManagerProps {
  className?: string
}

interface CampaignFormData {
  name: string
  type: 'email' | 'sms' | 'whatsapp' | 'multi'
  template_id?: string
  segment_criteria: Record<string, any>
  schedule_at?: string
  send_time_optimization: boolean
  timezone: string
}

interface SegmentCriteria {
  service_types?: string[]
  last_booking_after?: string
  last_booking_before?: string
  total_bookings_min?: number
  total_bookings_max?: number
  has_active_booking?: boolean
  tags?: string[]
  custom_attributes?: Record<string, any>
}

export const CampaignManager: React.FC<CampaignManagerProps> = ({ className }) => {
  const { t, i18n } = useTranslation()
  const locale = i18n.language === 'pl' ? pl : enUS
  const { toast aria-live="polite" aria-atomic="true" } = useToast()

  // State
  const [campaigns, setCampaigns] = useState<any[]>([])
  const [templates, setTemplates] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showPreviewDialog, setShowPreviewDialog] = useState(false)
  const [selectedCampaign, setSelectedCampaign] = useState<any>(null)
  const [activeTab, setActiveTab] = useState('overview')

  // Form state
  const [formData, setFormData] = useState<CampaignFormData>({
    name: '',
    type: 'email',
    segment_criteria: {},
    send_time_optimization: false,
    timezone: 'Europe/Warsaw'
  })

  const [segmentCriteria, setSegmentCriteria] = useState<SegmentCriteria>({
    service_types: [],
    tags: []
  })

  // Mock data - replace with actual API calls
  useEffect(() => {
    setCampaigns([
      {
        id: '1',
        name: 'Welcome Series - New Clients',
        type: 'email',
        status: 'running',
        template_id: 'template-1',
        total_recipients: 150,
        sent_count: 120,
        delivered_count: 115,
        opened_count: 85,
        clicked_count: 25,
        failed_count: 5,
        schedule_at: '2024-01-20T10:00:00Z',
        send_time_optimization: true,
        created_at: '2024-01-19T15:30:00Z'
      },
      {
        id: '2',
        name: 'Appointment Reminders',
        type: 'sms',
        status: 'completed',
        template_id: 'template-2',
        total_recipients: 200,
        sent_count: 200,
        delivered_count: 198,
        opened_count: 150,
        clicked_count: 45,
        failed_count: 2,
        schedule_at: '2024-01-18T09:00:00Z',
        send_time_optimization: false,
        created_at: '2024-01-17T10:00:00Z'
      },
      {
        id: '3',
        name: 'Special Promotion - Summer Deals',
        type: 'multi',
        status: 'scheduled',
        template_id: 'template-3',
        total_recipients: 500,
        sent_count: 0,
        delivered_count: 0,
        opened_count: 0,
        clicked_count: 0,
        failed_count: 0,
        schedule_at: '2024-01-25T14:00:00Z',
        send_time_optimization: true,
        created_at: '2024-01-22T11:20:00Z'
      }
    ])

    setTemplates([
      { id: 'template-1', name: 'Welcome Email', channel: 'email' },
      { id: 'template-2', name: 'Appointment Reminder', channel: 'sms' },
      { id: 'template-3', name: 'Summer Promotion', channel: 'email' }
    ])
  }, [])

  // Filter campaigns
  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesSearch = campaign.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = selectedStatus === 'all' || campaign.status === selectedStatus
    return matchesSearch && matchesStatus
  })

  // Calculate metrics
  const totalRecipients = campaigns.reduce((acc, c) => acc + c.total_recipients, 0)
  const totalSent = campaigns.reduce((acc, c) => acc + c.sent_count, 0)
  const totalDelivered = campaigns.reduce((acc, c) => acc + c.delivered_count, 0)
  const totalOpened = campaigns.reduce((acc, c) => acc + c.opened_count, 0)
  const totalClicked = campaigns.reduce((acc, c) => acc + c.clicked_count, 0)

  const averageDeliveryRate = totalSent > 0 ? (totalDelivered / totalSent) * 100 : 0
  const averageOpenRate = totalDelivered > 0 ? (totalOpened / totalDelivered) * 100 : 0
  const averageClickRate = totalOpened > 0 ? (totalClicked / totalOpened) * 100 : 0

  // Handle campaign creation
  const handleCreateCampaign = async () => {
    if (!formData.name) {
      toast aria-live="polite" aria-atomic="true"({
        title: t('error', 'Error'),
        description: t('campaign_name_required', 'Campaign name is required'),
        variant: 'destructive'
      })
      return
    }

    setLoading(true)
    try {
      // NOTE: Campaign API integration pending - currently using mock data
      // TODO: Implement actual API call to create campaign
      const newCampaign = {
        id: Date.now().toString(),
        ...formData,
        status: 'draft',
        total_recipients: 0,
        sent_count: 0,
        delivered_count: 0,
        opened_count: 0,
        clicked_count: 0,
        failed_count: 0,
        created_at: new Date().toISOString()
      }

      setCampaigns(prev => [newCampaign, ...prev])
      setShowCreateDialog(false)
      resetForm()

      toast aria-live="polite" aria-atomic="true"({
        title: t('success', 'Success'),
        description: t('campaign_created', 'Campaign created successfully')
      })
    } catch (error) {
      console.error('Failed to create campaign:', error)
    } finally {
      setLoading(false)
    }
  }

  // Handle campaign actions
  const handleLaunchCampaign = async (campaignId: string) => {
    try {
      // NOTE: Campaign API integration pending - currently using mock data
      // TODO: Implement actual API call to launch campaign
      setCampaigns(prev => prev.map(c =>
        c.id === campaignId ? { ...c, status: 'running' } : c
      ))

      toast aria-live="polite" aria-atomic="true"({
        title: t('campaign_launched', 'Campaign Launched'),
        description: t('campaign_is_running', 'The campaign is now running')
      })
    } catch (error) {
      console.error('Failed to launch campaign:', error)
    }
  }

  const handlePauseCampaign = async (campaignId: string) => {
    try {
      // NOTE: Campaign API integration pending - currently using mock data
      // TODO: Implement actual API call to pause campaign
      setCampaigns(prev => prev.map(c =>
        c.id === campaignId ? { ...c, status: 'paused' } : c
      ))

      toast aria-live="polite" aria-atomic="true"({
        title: t('campaign_paused', 'Campaign Paused'),
        description: t('campaign_paused_description', 'The campaign has been paused')
      })
    } catch (error) {
      console.error('Failed to pause campaign:', error)
    }
  }

  const handleStopCampaign = async (campaignId: string) => {
    try {
      // NOTE: Campaign API integration pending - currently using mock data
      // TODO: Implement actual API call to stop campaign
      setCampaigns(prev => prev.map(c =>
        c.id === campaignId ? { ...c, status: 'cancelled' } : c
      ))

      toast aria-live="polite" aria-atomic="true"({
        title: t('campaign_stopped', 'Campaign Stopped'),
        description: t('campaign_stopped_description', 'The campaign has been stopped')
      })
    } catch (error) {
      console.error('Failed to stop campaign:', error)
    }
  }

  const handleDeleteCampaign = async (campaignId: string) => {
    if (!confirm(t('confirm_delete_campaign', 'Are you sure you want to delete this campaign?'))) {
      return
    }

    try {
      // NOTE: Campaign API integration pending - currently using mock data
      // TODO: Implement actual API call to delete campaign
      setCampaigns(prev => prev.filter(c => c.id !== campaignId))

      toast aria-live="polite" aria-atomic="true"({
        title: t('campaign_deleted', 'Campaign Deleted'),
        description: t('campaign_deleted_description', 'The campaign has been deleted')
      })
    } catch (error) {
      console.error('Failed to delete campaign:', error)
    }
  }

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      type: 'email',
      segment_criteria: {},
      send_time_optimization: false,
      timezone: 'Europe/Warsaw'
    })
    setSegmentCriteria({
      service_types: [],
      tags: []
    })
  }

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft':
        return <Edit className="h-4 w-4 text-gray-500" />
      case 'scheduled':
        return <Calendar className="h-4 w-4 text-blue-500" />
      case 'running':
        return <Play className="h-4 w-4 text-green-500" />
      case 'paused':
        return <Pause className="h-4 w-4 text-yellow-500" />
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />
    }
  }

  // Get channel icon
  const getChannelIcon = (type: string) => {
    switch (type) {
      case 'email':
        return <Mail className="h-4 w-4" />
      case 'sms':
        return <Smartphone className="h-4 w-4" />
      case 'whatsapp':
        return <MessageSquare className="h-4 w-4" />
      case 'multi':
        return <Users className="h-4 w-4" />
      default:
        return <Send className="h-4 w-4" />
    }
  }

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800'
      case 'scheduled':
        return 'bg-blue-100 text-blue-800'
      case 'running':
        return 'bg-green-100 text-green-800'
      case 'paused':
        return 'bg-yellow-100 text-yellow-800'
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{t('campaign_manager', 'Campaign Manager')}</h2>
          <p className="text-muted-foreground">
            {t('campaigns_description', 'Create and manage automated marketing campaigns')}
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          {t('create_campaign', 'Create Campaign')}
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">{t('overview', 'Overview')}</TabsTrigger>
          <TabsTrigger value="campaigns">{t('campaigns', 'Campaigns')}</TabsTrigger>
          <TabsTrigger value="analytics">{t('analytics', 'Analytics')}</TabsTrigger>
          <TabsTrigger value="segments">{t('segments', 'Segments')}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('total_recipients', 'Total Recipients')}</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalRecipients.toLocaleString()}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('delivery_rate', 'Delivery Rate')}</CardTitle>
                <Send className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{averageDeliveryRate.toFixed(1)}%</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('open_rate', 'Open Rate')}</CardTitle>
                <Mail className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{averageOpenRate.toFixed(1)}%</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('click_rate', 'Click Rate')}</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{averageClickRate.toFixed(1)}%</div>
              </CardContent>
            </Card>
          </div>

          {/* Active Campaigns */}
          <Card>
            <CardHeader>
              <CardTitle>{t('active_campaigns', 'Active Campaigns')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {campaigns.filter(c => c.status === 'running' || c.status === 'scheduled').map(campaign => (
                  <div key={campaign.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {getChannelIcon(campaign.type)}
                      <div>
                        <p className="font-medium">{campaign.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {campaign.total_recipients} {t('recipients', 'recipients')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress value={(campaign.sent_count / campaign.total_recipients) * 100} className="w-32" />
                      <span className="text-sm text-muted-foreground">
                        {campaign.sent_count}/{campaign.total_recipients}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="campaigns" className="space-y-4">
          {/* Filters */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder={t('search_campaigns', 'Search campaigns...')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder={t('all_status', 'All Status')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('all_status', 'All Status')}</SelectItem>
                <SelectItem value="draft">{t('draft', 'Draft')}</SelectItem>
                <SelectItem value="scheduled">{t('scheduled', 'Scheduled')}</SelectItem>
                <SelectItem value="running">{t('running', 'Running')}</SelectItem>
                <SelectItem value="paused">{t('paused', 'Paused')}</SelectItem>
                <SelectItem value="completed">{t('completed', 'Completed')}</SelectItem>
                <SelectItem value="cancelled">{t('cancelled', 'Cancelled')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Campaigns List */}
          <div className="grid grid-cols-1 gap-4">
            {filteredCampaigns.map((campaign) => (
              <Card key={campaign.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      {getStatusIcon(campaign.status)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold">{campaign.name}</h3>
                          <Badge className={getStatusColor(campaign.status)}>
                            {t(campaign.status, campaign.status)}
                          </Badge>
                          <Badge variant="outline">
                            {getChannelIcon(campaign.type)}
                            <span className="ml-1 capitalize">{campaign.type}</span>
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">{t('recipients', 'Recipients')}</p>
                            <p className="font-medium">{campaign.total_recipients}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">{t('sent', 'Sent')}</p>
                            <p className="font-medium">{campaign.sent_count}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">{t('delivered', 'Delivered')}</p>
                            <p className="font-medium">{campaign.delivered_count}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">{t('opened', 'Opened')}</p>
                            <p className="font-medium">{campaign.opened_count}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">{t('clicked', 'Clicked')}</p>
                            <p className="font-medium">{campaign.clicked_count}</p>
                          </div>
                        </div>

                        {campaign.schedule_at && (
                          <p className="text-sm text-muted-foreground mt-2">
                            {t('scheduled_for', 'Scheduled for')}: {format(new Date(campaign.schedule_at), 'PPP p', { locale })}
                          </p>
                        )}

                        <div className="mt-3">
                          <Progress value={(campaign.sent_count / campaign.total_recipients) * 100} className="h-2" />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {campaign.status === 'draft' && (
                        <Button size="sm" onClick={() => handleLaunchCampaign(campaign.id)}>
                          <Play className="h-4 w-4 mr-1" />
                          {t('launch', 'Launch')}
                        </Button>
                      )}
                      {campaign.status === 'running' && (
                        <Button size="sm" variant="outline" onClick={() => handlePauseCampaign(campaign.id)}>
                          <Pause className="h-4 w-4 mr-1" />
                          {t('pause', 'Pause')}
                        </Button>
                      )}
                      {campaign.status === 'paused' && (
                        <Button size="sm" onClick={() => handleLaunchCampaign(campaign.id)}>
                          <Play className="h-4 w-4 mr-1" />
                          {t('resume', 'Resume')}
                        </Button>
                      )}
                      {(campaign.status === 'running' || campaign.status === 'paused') && (
                        <Button size="sm" variant="outline" onClick={() => handleStopCampaign(campaign.id)}>
                          <Square className="h-4 w-4 mr-1" />
                          {t('stop', 'Stop')}
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" onClick={() => setSelectedCampaign(campaign)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleDeleteCampaign(campaign.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>{t('campaign_analytics', 'Campaign Analytics')}</CardTitle>
              <CardDescription>
                {t('analytics_description', 'Detailed performance metrics for your campaigns')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{t('coming_soon', 'Analytics dashboard coming soon...')}</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="segments">
          <Card>
            <CardHeader>
              <CardTitle>{t('audience_segments', 'Audience Segments')}</CardTitle>
              <CardDescription>
                {t('segments_description', 'Define target segments for your campaigns')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{t('coming_soon', 'Segment management coming soon...')}</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Campaign Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('create_campaign', 'Create Campaign')}</DialogTitle>
            <DialogDescription>
              {t('create_campaign_description', 'Set up a new automated marketing campaign')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">{t('basic_information', 'Basic Information')}</h3>
              <div>
                <Label htmlFor="campaign-name">{t('campaign_name', 'Campaign Name')}</Label>
                <Input
                  id="campaign-name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder={t('enter_campaign_name', 'Enter campaign name...')}
                />
              </div>
              <div>
                <Label htmlFor="campaign-type">{t('campaign_type', 'Campaign Type')}</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: any) => setFormData(prev => ({ ...prev, type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Email Campaign
                      </div>
                    </SelectItem>
                    <SelectItem value="sms">
                      <div className="flex items-center gap-2">
                        <Smartphone className="h-4 w-4" />
                        SMS Campaign
                      </div>
                    </SelectItem>
                    <SelectItem value="whatsapp">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" />
                        WhatsApp Campaign
                      </div>
                    </SelectItem>
                    <SelectItem value="multi">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Multi-Channel Campaign
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Template Selection */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">{t('message_template', 'Message Template')}</h3>
              <Select
                value={formData.template_id || ''}
                onValueChange={(value) => setFormData(prev => ({ ...prev, template_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('select_template', 'Select a template...')} />
                </SelectTrigger>
                <SelectContent>
                  {templates
                    .filter(t => formData.type === 'multi' || t.channel === formData.type)
                    .map(template => (
                      <SelectItem key={template.id} value={template.id}>
                        <div className="flex items-center gap-2">
                          {getChannelIcon(template.channel)}
                          {template.name}
                        </div>
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {/* Audience Segmentation */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">{t('audience_segmentation', 'Audience Segmentation')}</h3>

              <div>
                <Label>{t('service_types', 'Service Types')}</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {['beauty', 'fitness', 'lifestyle'].map(service => (
                    <div key={service} className="flex items-center space-x-2">
                      <Checkbox
                        id={`service-${service}`}
                        checked={segmentCriteria.service_types?.includes(service)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSegmentCriteria(prev => ({
                              ...prev,
                              service_types: [...(prev.service_types || []), service]
                            }))
                          } else {
                            setSegmentCriteria(prev => ({
                              ...prev,
                              service_types: prev.service_types?.filter(s => s !== service) || []
                            }))
                          }
                        }}
                      />
                      <Label htmlFor={`service-${service}`} className="capitalize">
                        {t(service, service)}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="min-bookings">{t('minimum_bookings', 'Minimum Bookings')}</Label>
                  <Input
                    id="min-bookings"
                    type="number"
                    placeholder="0"
                    value={segmentCriteria.total_bookings_min || ''}
                    onChange={(e) => setSegmentCriteria(prev => ({
                      ...prev,
                      total_bookings_min: parseInt(e.target.value) || undefined
                    }))}
                  />
                </div>
                <div>
                  <Label htmlFor="max-bookings">{t('maximum_bookings', 'Maximum Bookings')}</Label>
                  <Input
                    id="max-bookings"
                    type="number"
                    placeholder="999"
                    value={segmentCriteria.total_bookings_max || ''}
                    onChange={(e) => setSegmentCriteria(prev => ({
                      ...prev,
                      total_bookings_max: parseInt(e.target.value) || undefined
                    }))}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="active-booking"
                  checked={segmentCriteria.has_active_booking || false}
                  onCheckedChange={(checked) => setSegmentCriteria(prev => ({
                    ...prev,
                    has_active_booking: checked as boolean
                  }))}
                />
                <Label htmlFor="active-booking">
                  {t('has_active_booking', 'Has active booking')}
                </Label>
              </div>
            </div>

            {/* Scheduling */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">{t('scheduling', 'Scheduling')}</h3>

              <div>
                <Label htmlFor="schedule-at">{t('schedule_for', 'Schedule for')} (optional)</Label>
                <Input
                  id="schedule-at"
                  type="datetime-local"
                  value={formData.schedule_at || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, schedule_at: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="timezone">{t('timezone', 'Timezone')}</Label>
                <Select
                  value={formData.timezone}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, timezone: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Europe/Warsaw">Europe/Warsaw</SelectItem>
                    <SelectItem value="Europe/London">Europe/London</SelectItem>
                    <SelectItem value="Europe/Paris">Europe/Paris</SelectItem>
                    <SelectItem value="America/New_York">America/New_York</SelectItem>
                    <SelectItem value="America/Los_Angeles">America/Los_Angeles</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="send-time-optimization"
                  checked={formData.send_time_optimization}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, send_time_optimization: checked }))}
                />
                <Label htmlFor="send-time-optimization">
                  {t('send_time_optimization', 'Send time optimization')}
                </Label>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                {t('cancel', 'Cancel')}
              </Button>
              <Button onClick={handleCreateCampaign} disabled={loading}>
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                {t('create_campaign', 'Create Campaign')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}