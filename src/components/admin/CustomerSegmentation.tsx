import React, { useState, useEffect } from 'react'
import {
  Users,
  Plus,
  Edit,
  Trash2,
  Eye,
  Target,
  TrendingUp,
  Filter,
  Search,
  Download,
  Upload,
  RefreshCw,
  Database,
  Tag,
  MapPin,
  Calendar,
  DollarSign,
  Activity,
  BarChart3,
  PieChart,
  Zap,
  Clock,
  Mail,
  MessageSquare,
  Smartphone,
  UserPlus,
  UserCheck,
  UserX,
  Settings,
  Play,
  Pause
} from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'


import type { CustomerSegment, SegmentCriteria } from '@/types/marketing-automation'

interface CustomerSegmentationProps {
  className?: string
}

// Mock segments data
const mockSegments: CustomerSegment[] = [
  {
    id: '1',
    name: 'VIP Customers',
    description: 'High-value customers with lifetime value over $1000',
    criteria: {
      total_spent_min: 1000,
      total_bookings_min: 10,
      last_booking_after: '2024-01-01',
      service_types: ['beauty', 'fitness']
    },
    is_dynamic: true,
    customer_count: 156,
    last_calculated_at: '2024-01-20T10:00:00Z',
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-20T10:00:00Z'
  },
  {
    id: '2',
    name: 'New Customers',
    description: 'Customers who joined in the last 30 days',
    criteria: {
      last_booking_after: '2023-12-20',
      total_bookings_max: 2,
      marketing_consent: true
    },
    is_dynamic: true,
    customer_count: 234,
    last_calculated_at: '2024-01-20T09:00:00Z',
    created_at: '2024-01-10T10:00:00Z',
    updated_at: '2024-01-20T09:00:00Z'
  },
  {
    id: '3',
    name: 'Inactive Customers',
    description: 'Customers who haven\'t booked in over 90 days',
    criteria: {
      days_since_last_booking: 90,
      total_bookings_min: 1,
      marketing_consent: true
    },
    is_dynamic: true,
    customer_count: 89,
    last_calculated_at: '2024-01-20T08:00:00Z',
    created_at: '2024-01-05T10:00:00Z',
    updated_at: '2024-01-20T08:00:00Z'
  },
  {
    id: '4',
    name: 'Beauty Service Lovers',
    description: 'Customers who primarily book beauty services',
    criteria: {
      service_types: ['beauty'],
      total_bookings_min: 3
    },
    is_dynamic: true,
    customer_count: 312,
    last_calculated_at: '2024-01-20T07:00:00Z',
    created_at: '2024-01-01T10:00:00Z',
    updated_at: '2024-01-20T07:00:00Z'
  },
  {
    id: '5',
    name: 'Fitness Enthusiasts',
    description: 'Customers focused on fitness programs',
    criteria: {
      service_types: ['fitness'],
      total_bookings_min: 5
    },
    is_dynamic: true,
    customer_count: 178,
    last_calculated_at: '2024-01-20T06:00:00Z',
    created_at: '2024-01-01T10:00:00Z',
    updated_at: '2024-01-20T06:00:00Z'
  }
]

export const CustomerSegmentation: React.FC<CustomerSegmentationProps> = ({ className }) => {
  const { t } = useTranslation()
  const { toast } = useToast()

  const [segments, setSegments] = useState<CustomerSegment[]>(mockSegments)
  const [selectedSegment, setSelectedSegment] = useState<CustomerSegment | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showPreviewDialog, setShowPreviewDialog] = useState(false)
  const [activeTab, setActiveTab] = useState('segments')
  const [searchQuery, setSearchQuery] = useState('')
  const [isCalculating, setIsCalculating] = useState<string | null>(null)

  const [formData, setFormData] = useState<Partial<CustomerSegment>>({
    name: '',
    description: '',
    criteria: {},
    is_dynamic: true
  })

  const [segmentCriteria, setSegmentCriteria] = useState<SegmentCriteria>({
    service_types: [],
    marketing_consent: true,
    email_consent: true
  })

  // Filter segments
  const filteredSegments = segments.filter(segment =>
    segment.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    segment.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Calculate segment statistics
  const totalCustomers = segments.reduce((acc, segment) => acc + segment.customer_count, 0)
  const dynamicSegments = segments.filter(s => s.is_dynamic).length
  const activeSegments = segments.filter(s => s.customer_count > 0).length

  // Handle segment creation
  const handleCreateSegment = () => {
    if (!formData.name) {
      toast({
        title: t('error', 'Error'),
        description: t('segment_name_required', 'Segment name is required'),
        variant: 'destructive'
      })
      return
    }

    const newSegment: CustomerSegment = {
      id: `segment-${Date.now()}`,
      name: formData.name!,
      description: formData.description,
      criteria: segmentCriteria,
      is_dynamic: formData.is_dynamic ?? true,
      customer_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    setSegments(prev => [newSegment, ...prev])
    setShowCreateDialog(false)
    resetForm()

    toast({
      title: t('success', 'Success'),
      description: t('segment_created', 'Segment created successfully')
    })
  }

  // Handle segment update
  const handleUpdateSegment = () => {
    if (!selectedSegment || !formData.name) return

    const updatedSegment: CustomerSegment = {
      ...selectedSegment,
      name: formData.name!,
      description: formData.description,
      criteria: segmentCriteria,
      is_dynamic: formData.is_dynamic ?? true,
      updated_at: new Date().toISOString()
    }

    setSegments(prev => prev.map(s => s.id === selectedSegment.id ? updatedSegment : s))
    setSelectedSegment(updatedSegment)
    setShowEditDialog(false)

    toast({
      title: t('success', 'Success'),
      description: t('segment_updated', 'Segment updated successfully')
    })
  }

  // Handle segment deletion
  const handleDeleteSegment = (segmentId: string) => {
    if (!confirm(t('confirm_delete_segment', 'Are you sure you want to delete this segment?'))) {
      return
    }

    setSegments(prev => prev.filter(s => s.id !== segmentId))
    if (selectedSegment?.id === segmentId) {
      setSelectedSegment(null)
    }

    toast({
      title: t('segment_deleted', 'Segment Deleted'),
      description: t('segment_deleted_description', 'The segment has been deleted')
    })
  }

  // Calculate segment size
  const calculateSegmentSize = async (segmentId: string) => {
    setIsCalculating(segmentId)

    // Simulate calculation
    setTimeout(() => {
      const newSize = Math.floor(Math.random() * 500) + 50
      setSegments(prev => prev.map(s =>
        s.id === segmentId
          ? { ...s, customer_count: newSize, last_calculated_at: new Date().toISOString() }
          : s
      ))
      setIsCalculating(null)

      toast({
        title: t('calculation_complete', 'Calculation Complete'),
        description: t('segment_calculated', 'Segment has been recalculated with new customers')
      })
    }, 2000)
  }

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      criteria: {},
      is_dynamic: true
    })
    setSegmentCriteria({
      service_types: [],
      marketing_consent: true,
      email_consent: true
    })
  }

  // Load segment for editing
  const loadSegmentForEditing = (segment: CustomerSegment) => {
    setSelectedSegment(segment)
    setFormData({
      name: segment.name,
      description: segment.description,
      criteria: segment.criteria,
      is_dynamic: segment.is_dynamic
    })
    setSegmentCriteria(segment.criteria)
    setShowEditDialog(true)
  }

  // Export segment
  const exportSegment = (segment: CustomerSegment) => {
    const dataStr = JSON.stringify(segment, null, 2)
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)
    const exportFileDefaultName = `${segment.name.replace(/\s+/g, '-').toLowerCase()}.json`

    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.click()
  }

  const getSegmentTypeColor = (segment: CustomerSegment) => {
    if (segment.customer_count > 200) return 'bg-green-100 text-green-800'
    if (segment.customer_count > 50) return 'bg-blue-100 text-blue-800'
    return 'bg-gray-100 text-gray-800'
  }

  const getSegmentSizeLabel = (count: number) => {
    if (count > 200) return t('large', 'Large')
    if (count > 50) return t('medium', 'Medium')
    return t('small', 'Small')
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{t('customer_segmentation', 'Customer Segmentation')}</h2>
          <p className="text-muted-foreground">
            {t('segmentation_description', 'Create and manage customer segments for targeted marketing')}
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          {t('create_segment', 'Create Segment')}
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('total_segments', 'Total Segments')}</p>
                <p className="text-2xl font-bold">{segments.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-green-100 rounded-lg">
                <Activity className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('active_segments', 'Active Segments')}</p>
                <p className="text-2xl font-bold">{activeSegments}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Target className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('total_customers', 'Total Customers')}</p>
                <p className="text-2xl font-bold">{totalCustomers.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-orange-100 rounded-lg">
                <RefreshCw className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('dynamic_segments', 'Dynamic Segments')}</p>
                <p className="text-2xl font-bold">{dynamicSegments}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="segments">{t('segments', 'Segments')}</TabsTrigger>
          <TabsTrigger value="builder">{t('segment_builder', 'Segment Builder')}</TabsTrigger>
          <TabsTrigger value="analytics">{t('analytics', 'Analytics')}</TabsTrigger>
        </TabsList>

        <TabsContent value="segments" className="space-y-4">
          {/* Search and Filter */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder={t('search_segments', 'Search segments...')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" onClick={() => {
              segments.forEach(segment => calculateSegmentSize(segment.id))
            }}>
              <RefreshCw className="h-4 w-4 mr-2" />
              {t('recalculate_all', 'Recalculate All')}
            </Button>
          </div>

          {/* Segments Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSegments.map((segment) => (
              <Card key={segment.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{segment.name}</CardTitle>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge className={getSegmentTypeColor(segment)}>
                          {getSegmentSizeLabel(segment.customer_count)}
                        </Badge>
                        {segment.is_dynamic && (
                          <Badge variant="outline">
                            <RefreshCw className="h-3 w-3 mr-1" />
                            {t('dynamic', 'Dynamic')}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Switch
                      checked={segment.customer_count > 0}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          calculateSegmentSize(segment.id)
                        }
                      }}
                    />
                  </div>
                  {segment.description && (
                    <CardDescription>{segment.description}</CardDescription>
                  )}
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{t('customers', 'Customers')}</span>
                    <span className="text-lg font-bold">{segment.customer_count.toLocaleString()}</span>
                  </div>

                  {segment.last_calculated_at && (
                    <div className="text-xs text-muted-foreground">
                      {t('last_calculated', 'Last calculated')}: {new Date(segment.last_calculated_at).toLocaleString()}
                    </div>
                  )}

                  <div className="flex items-center gap-2 pt-2">
                    <Button size="sm" variant="outline" onClick={() => loadSegmentForEditing(segment)}>
                      <Edit className="h-3 w-3 mr-1" />
                      {t('edit', 'Edit')}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => {
                      setSelectedSegment(segment)
                      setShowPreviewDialog(true)
                    }}>
                      <Eye className="h-3 w-3 mr-1" />
                      {t('preview', 'Preview')}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => calculateSegmentSize(segment.id)} disabled={isCalculating === segment.id}>
                      {isCalculating === segment.id ? (
                        <RefreshCw className="h-3 w-3 animate-spin" />
                      ) : (
                        <RefreshCw className="h-3 w-3" />
                      )}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => exportSegment(segment)}>
                      <Download className="h-3 w-3" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDeleteSegment(segment.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="builder" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('segment_builder', 'Segment Builder')}</CardTitle>
              <CardDescription>
                {t('builder_description', 'Create advanced segments using multiple criteria')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{t('coming_soon', 'Advanced segment builder coming soon...')}</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>{t('segment_analytics', 'Segment Analytics')}</CardTitle>
              <CardDescription>
                {t('analytics_description', 'Performance metrics and insights for your segments')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{t('coming_soon', 'Analytics dashboard coming soon...')}</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Segment Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('create_new_segment', 'Create New Segment')}</DialogTitle>
            <DialogDescription>
              {t('create_segment_description', 'Define criteria to segment your customers')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <div>
              <Label>{t('segment_name', 'Segment Name')}</Label>
              <Input
                value={formData.name || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder={t('enter_segment_name', 'Enter segment name...')}
              />
            </div>

            <div>
              <Label>{t('description', 'Description')}</Label>
              <Input
                value={formData.description || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder={t('describe_segment', 'Describe this segment...')}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is-dynamic"
                checked={formData.is_dynamic ?? true}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_dynamic: checked }))}
              />
              <Label htmlFor="is-dynamic">
                {t('dynamic_segment', 'Dynamic Segment')} - {t('auto_updates', 'Automatically updates based on criteria')}
              </Label>
            </div>

            <Separator />

            <div>
              <Label>{t('segment_criteria', 'Segment Criteria')}</Label>
              <div className="space-y-4 mt-4">
                {/* Service Types */}
                <div>
                  <Label>{t('service_types', 'Service Types')}</Label>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {['beauty', 'fitness', 'lifestyle'].map(service => (
                      <div key={service} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`service-${service}`}
                          checked={segmentCriteria.service_types?.includes(service)}
                          onChange={(e) => {
                            if (e.target.checked) {
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
                          className="rounded"
                        />
                        <Label htmlFor={`service-${service}`} className="capitalize">
                          {t(service, service)}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Booking History */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>{t('minimum_bookings', 'Minimum Bookings')}</Label>
                    <Input
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
                    <Label>{t('maximum_bookings', 'Maximum Bookings')}</Label>
                    <Input
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

                {/* Spending */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>{t('minimum_spent', 'Minimum Spent')}</Label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={segmentCriteria.total_spent_min || ''}
                      onChange={(e) => setSegmentCriteria(prev => ({
                        ...prev,
                        total_spent_min: parseInt(e.target.value) || undefined
                      }))}
                    />
                  </div>
                  <div>
                    <Label>{t('maximum_spent', 'Maximum Spent')}</Label>
                    <Input
                      type="number"
                      placeholder="999999"
                      value={segmentCriteria.total_spent_max || ''}
                      onChange={(e) => setSegmentCriteria(prev => ({
                        ...prev,
                        total_spent_max: parseInt(e.target.value) || undefined
                      }))}
                    />
                  </div>
                </div>

                {/* Last Booking */}
                <div>
                  <Label>{t('last_booking', 'Last Booking')}</Label>
                  <Input
                    type="date"
                    value={segmentCriteria.last_booking_after || ''}
                    onChange={(e) => setSegmentCriteria(prev => ({
                      ...prev,
                      last_booking_after: e.target.value
                    }))}
                  />
                </div>

                {/* Consent */}
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="marketing-consent"
                      checked={segmentCriteria.marketing_consent || false}
                      onChange={(e) => setSegmentCriteria(prev => ({
                        ...prev,
                        marketing_consent: e.target.checked
                      }))}
                      className="rounded"
                    />
                    <Label htmlFor="marketing-consent">
                      {t('marketing_consent', 'Has given marketing consent')}
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="email-consent"
                      checked={segmentCriteria.email_consent || false}
                      onChange={(e) => setSegmentCriteria(prev => ({
                        ...prev,
                        email_consent: e.target.checked
                      }))}
                      className="rounded"
                    />
                    <Label htmlFor="email-consent">
                      {t('email_consent', 'Has given email consent')}
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="sms-consent"
                      checked={segmentCriteria.sms_consent || false}
                      onChange={(e) => setSegmentCriteria(prev => ({
                        ...prev,
                        sms_consent: e.target.checked
                      }))}
                      className="rounded"
                    />
                    <Label htmlFor="sms-consent">
                      {t('sms_consent', 'Has given SMS consent')}
                    </Label>
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <Label>{t('customer_tags', 'Customer Tags')}</Label>
                  <Input
                    placeholder={t('enter_tags_comma', 'Enter tags separated by commas...')}
                    value={segmentCriteria.tags?.join(', ') || ''}
                    onChange={(e) => setSegmentCriteria(prev => ({
                      ...prev,
                      tags: e.target.value.split(',').map(tag => tag.trim()).filter(Boolean)
                    }))}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                {t('cancel', 'Cancel')}
              </Button>
              <Button onClick={handleCreateSegment}>
                {t('create_segment', 'Create Segment')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Segment Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('edit_segment', 'Edit Segment')}</DialogTitle>
            <DialogDescription>
              {t('edit_segment_description', 'Update segment criteria and settings')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <div>
              <Label>{t('segment_name', 'Segment Name')}</Label>
              <Input
                value={formData.name || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>

            <div>
              <Label>{t('description', 'Description')}</Label>
              <Input
                value={formData.description || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="edit-is-dynamic"
                checked={formData.is_dynamic ?? true}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_dynamic: checked }))}
              />
              <Label htmlFor="edit-is-dynamic">
                {t('dynamic_segment', 'Dynamic Segment')}
              </Label>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                {t('cancel', 'Cancel')}
              </Button>
              <Button onClick={handleUpdateSegment}>
                {t('save_changes', 'Save Changes')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{t('segment_preview', 'Segment Preview')}: {selectedSegment?.name}</DialogTitle>
            <DialogDescription>
              {t('preview_description', 'Preview customers matching this segment criteria')}
            </DialogDescription>
          </DialogHeader>

          {selectedSegment && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">{t('segment_criteria', 'Segment Criteria')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-64">
                      <pre className="text-sm">
                        {JSON.stringify(selectedSegment.criteria, null, 2)}
                      </pre>
                    </ScrollArea>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">{t('sample_customers', 'Sample Customers')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {Array.from({ length: 5 }, (_, i) => (
                        <div key={i} className="flex items-center justify-between p-2 border rounded">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-gray-200 rounded-full" />
                            <div>
                              <p className="text-sm font-medium">Customer {i + 1}</p>
                              <p className="text-xs text-muted-foreground">customer{i + 1}@example.com</p>
                            </div>
                          </div>
                          <Badge variant="outline">{t('matches', 'Matches')}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="flex justify-end">
                <Button onClick={() => setShowPreviewDialog(false)}>
                  {t('close', 'Close')}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}