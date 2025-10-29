import React, { useState } from 'react'
import {
  Shield,
  FileText,
  Users,
  Mail,
  MessageSquare,
  Smartphone,
  Download,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  Eye,
  RefreshCw,
  Database,
  UserCheck,
  Settings,
  Activity,
  BarChart3,
  FileCheck,
  Gavel,
  BookOpen,
  HelpCircle,
  ExternalLink,
  Plus,
  Save,
  Trash2,
  Filter
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { format } from 'date-fns'

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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'


import type { ComplianceRecord, ConsentManagementConfig, MarketingPreferences } from '@/types/marketing-automation'

interface MarketingComplianceManagerProps {
  className?: string
}

// Mock compliance records
const mockComplianceRecords: ComplianceRecord[] = [
  {
    id: '1',
    campaign_id: 'campaign-1',
    customer_id: 'customer-1',
    consent_type: 'email',
    consent_given: true,
    consent_timestamp: '2024-01-15T10:00:00Z',
    consent_source: 'registration_form',
    ip_address: '192.168.1.1',
    user_agent: 'Mozilla/5.0...',
    gdpr_compliant: true,
    marketing_preferences: {
      id: 'pref-1',
      customer_id: 'customer-1',
      email_consent: true,
      sms_consent: false,
      whatsapp_consent: false,
      push_consent: true,
      consent_updated_at: '2024-01-15T10:00:00Z',
      consent_source: 'registration_form',
      created_at: '2024-01-15T10:00:00Z',
      updated_at: '2024-01-15T10:00:00Z'
    }
  },
  {
    id: '2',
    campaign_id: 'campaign-2',
    customer_id: 'customer-2',
    consent_type: 'sms',
    consent_given: false,
    consent_timestamp: '2024-01-10T14:30:00Z',
    consent_source: 'unsubscribe_link',
    ip_address: '192.168.1.2',
    user_agent: 'Mozilla/5.0...',
    gdpr_compliant: true,
    marketing_preferences: {
      id: 'pref-2',
      customer_id: 'customer-2',
      email_consent: true,
      sms_consent: false,
      whatsapp_consent: false,
      push_consent: false,
      consent_updated_at: '2024-01-10T14:30:00Z',
      consent_source: 'unsubscribe_link',
      unsubscribe_reason: 'Too many messages',
      created_at: '2024-01-05T09:00:00Z',
      updated_at: '2024-01-10T14:30:00Z'
    }
  }
]

export const MarketingComplianceManager: React.FC<MarketingComplianceManagerProps> = ({ className }) => {
  const { t } = useTranslation()
  const { toast } = useToast()

  const [records, setRecords] = useState<ComplianceRecord[]>(mockComplianceRecords)
  const [selectedRecord, setSelectedRecord] = useState<ComplianceRecord | null>(null)
  const [showRecordDialog, setShowRecordDialog] = useState(false)
  const [showSettingsDialog, setShowSettingsDialog] = useState(false)
  const [showDataRequestDialog, setShowDataRequestDialog] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterConsent, setFilterConsent] = useState<string>('all')

  const [complianceConfig, setComplianceConfig] = useState<ConsentManagementConfig>({
    require_double_opt_in: true,
    consent_expiry_days: 730,
    default_consent_preferences: {
      email_consent: false,
      sms_consent: false,
      whatsapp_consent: false,
      push_consent: false
    },
    gdpr_compliance_enabled: true,
    ccpa_compliance_enabled: false,
    data_retention_days: 2555
  })

  const [dataRequest, setDataRequest] = useState({
    type: 'export',
    customer_id: '',
    email: '',
    verification: ''
  })

  // Calculate compliance statistics
  const totalRecords = records.length
  const compliantRecords = records.filter(r => r.gdpr_compliant).length
  const consentRate = records.length > 0 ? (records.filter(r => r.consent_given).length / records.length) * 100 : 0
  const recentConsents = records.filter(r => {
    const consentDate = new Date(r.consent_timestamp)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    return consentDate > thirtyDaysAgo
  }).length

  // Filter records
  const filteredRecords = records.filter(record => {
    const matchesSearch = record.customer_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         record.consent_source.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesConsent = filterConsent === 'all' ||
                         (filterConsent === 'given' && record.consent_given) ||
                         (filterConsent === 'withdrawn' && !record.consent_given)
    return matchesSearch && matchesConsent
  })

  // Generate compliance report
  const generateComplianceReport = () => {
    const reportData = {
      generated_at: new Date().toISOString(),
      total_records: totalRecords,
      compliant_records: compliantRecords,
      compliance_rate: totalRecords > 0 ? (compliantRecords / totalRecords) * 100 : 0,
      consent_rate: consentRate,
      consent_expiry_days: complianceConfig.consent_expiry_days,
      data_retention_days: complianceConfig.data_retention_days,
      gdpr_enabled: complianceConfig.gdpr_compliance_enabled,
      ccpa_enabled: complianceConfig.ccpa_compliance_enabled,
      records: records
    }

    const dataStr = JSON.stringify(reportData, null, 2)
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)
    const exportFileDefaultName = `marketing-compliance-report-${format(new Date(), 'yyyy-MM-dd')}.json`

    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.click()

    toast({
      title: t('report_generated', 'Report Generated'),
      description: t('compliance_report_exported', 'Compliance report has been exported')
    })
  }

  const getConsentIcon = (consentGiven: boolean) => {
    return consentGiven ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <XCircle className="h-4 w-4 text-red-500" />
    )
  }

  const getConsentColor = (consentGiven: boolean) => {
    return consentGiven ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{t('marketing_compliance', 'Marketing Compliance')}</h2>
          <p className="text-muted-foreground">
            {t('marketing_compliance_description', 'Manage GDPR, consent, and privacy compliance for marketing campaigns')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={generateComplianceReport}>
            <Download className="h-4 w-4 mr-2" />
            {t('generate_report', 'Generate Report')}
          </Button>
          <Button onClick={() => setShowSettingsDialog(true)}>
            <Settings className="h-4 w-4 mr-2" />
            {t('settings', 'Settings')}
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">{t('overview', 'Overview')}</TabsTrigger>
          <TabsTrigger value="consent_records">{t('consent_records', 'Consent Records')}</TabsTrigger>
          <TabsTrigger value="preferences">{t('preferences', 'Preferences')}</TabsTrigger>
          <TabsTrigger value="settings">{t('settings', 'Settings')}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Compliance Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t('compliance_rate', 'Compliance Rate')}</p>
                    <p className="text-2xl font-bold">
                      {totalRecords > 0 ? Math.round((compliantRecords / totalRecords) * 100) : 0}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <UserCheck className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t('consent_rate', 'Consent Rate')}</p>
                    <p className="text-2xl font-bold">{consentRate.toFixed(1)}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Clock className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t('recent_consents', 'Recent Consents (30d)')}</p>
                    <p className="text-2xl font-bold">{recentConsents}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <Shield className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t('data_retention', 'Data Retention')}</p>
                    <p className="text-2xl font-bold">{complianceConfig.data_retention_days}d</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Compliance Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gavel className="h-5 w-5" />
                  {t('regulatory_compliance', 'Regulatory Compliance')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium">GDPR</span>
                  <div className="flex items-center gap-2">
                    <Switch checked={complianceConfig.gdpr_compliance_enabled} />
                    <Badge className={complianceConfig.gdpr_compliance_enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                      {complianceConfig.gdpr_compliance_enabled ? t('enabled', 'Enabled') : t('disabled', 'Disabled')}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">CCPA</span>
                  <div className="flex items-center gap-2">
                    <Switch checked={complianceConfig.ccpa_compliance_enabled} />
                    <Badge className={complianceConfig.ccpa_compliance_enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                      {complianceConfig.ccpa_compliance_enabled ? t('enabled', 'Enabled') : t('disabled', 'Disabled')}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">{t('double_opt_in', 'Double Opt-In')}</span>
                  <div className="flex items-center gap-2">
                    <Switch checked={complianceConfig.require_double_opt_in} />
                    <Badge className={complianceConfig.require_double_opt_in ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                      {complianceConfig.require_double_opt_in ? t('enabled', 'Enabled') : t('disabled', 'Disabled')}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  {t('compliance_alerts', 'Compliance Alerts')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-yellow-800">
                      {t('consent_expiring', 'Consent Expiring Soon')}
                    </p>
                    <p className="text-xs text-yellow-700">
                      23 {t('consents_expire_next_30d', 'consents expire in next 30 days')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <FileCheck className="h-4 w-4 text-blue-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-blue-800">
                      {t('audit_reminder', 'Audit Reminder')}
                    </p>
                    <p className="text-xs text-blue-700">
                      {t('next_audit_in', 'Next audit in')} 45 {t('days', 'days')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="consent_records" className="space-y-4">
          {/* Filters */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder={t('search_records', 'Search records...')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterConsent} onValueChange={setFilterConsent}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder={t('filter_consent', 'Filter by consent')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('all_records', 'All Records')}</SelectItem>
                <SelectItem value="given">{t('consent_given', 'Consent Given')}</SelectItem>
                <SelectItem value="withdrawn">{t('consent_withdrawn', 'Consent Withdrawn')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Records Table */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('customer', 'Customer')}</TableHead>
                    <TableHead>{t('consent_type', 'Consent Type')}</TableHead>
                    <TableHead>{t('status', 'Status')}</TableHead>
                    <TableHead>{t('source', 'Source')}</TableHead>
                    <TableHead>{t('date', 'Date')}</TableHead>
                    <TableHead>{t('actions', 'Actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">{record.customer_id}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {record.consent_type === 'email' && <Mail className="h-4 w-4" />}
                          {record.consent_type === 'sms' && <Smartphone className="h-4 w-4" />}
                          {record.consent_type === 'whatsapp' && <MessageSquare className="h-4 w-4" />}
                          {record.consent_type}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getConsentIcon(record.consent_given)}
                          <Badge className={getConsentColor(record.consent_given)}>
                            {record.consent_given ? t('given', 'Given') : t('withdrawn', 'Withdrawn')}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>{record.consent_source.replace('_', ' ')}</TableCell>
                      <TableCell>{format(new Date(record.consent_timestamp), 'PPp')}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="ghost" onClick={() => {
                            setSelectedRecord(record)
                            setShowRecordDialog(true)
                          }}>
                            <Eye className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferences" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('default_consent_preferences', 'Default Consent Preferences')}</CardTitle>
              <CardDescription>
                {t('default_preferences_description', 'Set default consent preferences for new customers')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold">{t('marketing_channels', 'Marketing Channels')}</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        <span>{t('email_marketing', 'Email Marketing')}</span>
                      </div>
                      <Switch
                        checked={complianceConfig.default_consent_preferences?.email_consent || false}
                        onCheckedChange={(checked) => setComplianceConfig(prev => ({
                          ...prev,
                          default_consent_preferences: {
                            ...prev.default_consent_preferences!,
                            email_consent: checked
                          }
                        }))}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Smartphone className="h-4 w-4" />
                        <span>{t('sms_marketing', 'SMS Marketing')}</span>
                      </div>
                      <Switch
                        checked={complianceConfig.default_consent_preferences?.sms_consent || false}
                        onCheckedChange={(checked) => setComplianceConfig(prev => ({
                          ...prev,
                          default_consent_preferences: {
                            ...prev.default_consent_preferences!,
                            sms_consent: checked
                          }
                        }))}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" />
                        <span>WhatsApp</span>
                      </div>
                      <Switch
                        checked={complianceConfig.default_consent_preferences?.whatsapp_consent || false}
                        onCheckedChange={(checked) => setComplianceConfig(prev => ({
                          ...prev,
                          default_consent_preferences: {
                            ...prev.default_consent_preferences!,
                            whatsapp_consent: checked
                          }
                        }))}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Activity className="h-4 w-4" />
                        <span>{t('push_notifications', 'Push Notifications')}</span>
                      </div>
                      <Switch
                        checked={complianceConfig.default_consent_preferences?.push_consent || false}
                        onCheckedChange={(checked) => setComplianceConfig(prev => ({
                          ...prev,
                          default_consent_preferences: {
                            ...prev.default_consent_preferences!,
                            push_consent: checked
                          }
                        }))}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold">{t('consent_settings', 'Consent Settings')}</h3>
                  <div className="space-y-3">
                    <div>
                      <Label>{t('consent_expiry', 'Consent Expiry (days)')}</Label>
                      <Input
                        type="number"
                        value={complianceConfig.consent_expiry_days}
                        onChange={(e) => setComplianceConfig(prev => ({
                          ...prev,
                          consent_expiry_days: parseInt(e.target.value) || 730
                        }))}
                      />
                    </div>
                    <div>
                      <Label>{t('data_retention', 'Data Retention Period (days)')}</Label>
                      <Input
                        type="number"
                        value={complianceConfig.data_retention_days}
                        onChange={(e) => setComplianceConfig(prev => ({
                          ...prev,
                          data_retention_days: parseInt(e.target.value) || 2555
                        }))}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={() => {
                  toast({
                    title: t('preferences_saved', 'Preferences Saved'),
                    description: t('default_preferences_updated', 'Default consent preferences have been updated')
                  })
                }}>
                  <Save className="h-4 w-4 mr-2" />
                  {t('save_preferences', 'Save Preferences')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('compliance_settings', 'Compliance Settings')}</CardTitle>
              <CardDescription>
                {t('settings_description', 'Configure compliance and privacy settings')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold">{t('regulatory_frameworks', 'Regulatory Frameworks')}</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">GDPR Compliance</p>
                        <p className="text-sm text-muted-foreground">
                          {t('gdpr_description', 'General Data Protection Regulation')}
                        </p>
                      </div>
                      <Switch
                        checked={complianceConfig.gdpr_compliance_enabled}
                        onCheckedChange={(checked) => setComplianceConfig(prev => ({
                          ...prev,
                          gdpr_compliance_enabled: checked
                        }))}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">CCPA Compliance</p>
                        <p className="text-sm text-muted-foreground">
                          {t('ccpa_description', 'California Consumer Privacy Act')}
                        </p>
                      </div>
                      <Switch
                        checked={complianceConfig.ccpa_compliance_enabled}
                        onCheckedChange={(checked) => setComplianceConfig(prev => ({
                          ...prev,
                          ccpa_compliance_enabled: checked
                        }))}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold">{t('consent_management', 'Consent Management')}</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{t('double_opt_in', 'Double Opt-In')}</p>
                        <p className="text-sm text-muted-foreground">
                          {t('double_opt_in_description', 'Require email confirmation for consent')}
                        </p>
                      </div>
                      <Switch
                        checked={complianceConfig.require_double_opt_in}
                        onCheckedChange={(checked) => setComplianceConfig(prev => ({
                          ...prev,
                          require_double_opt_in: checked
                        }))}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">{t('privacy_policy', 'Privacy Policy')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      {t('privacy_policy_description', 'Review and update your privacy policy')}
                    </p>
                    <Button variant="outline" className="w-full">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      {t('view_privacy_policy', 'View Privacy Policy')}
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">{t('compliance_guide', 'Compliance Guide')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      {t('guide_description', 'Learn about GDPR and data protection best practices')}
                    </p>
                    <Button variant="outline" className="w-full">
                      <BookOpen className="h-4 w-4 mr-2" />
                      {t('read_guide', 'Read Guide')}
                    </Button>
                  </CardContent>
                </Card>
              </div>

              <div className="flex justify-end">
                <Button onClick={() => {
                  toast({
                    title: t('settings_saved', 'Settings Saved'),
                    description: t('compliance_settings_updated', 'Compliance settings have been updated successfully')
                  })
                  setShowSettingsDialog(false)
                }}>
                  <Save className="h-4 w-4 mr-2" />
                  {t('save_settings', 'Save Settings')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Record Details Dialog */}
      <Dialog open={showRecordDialog} onOpenChange={setShowRecordDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('consent_record_details', 'Consent Record Details')}</DialogTitle>
          </DialogHeader>

          {selectedRecord && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{t('customer_id', 'Customer ID')}</Label>
                  <p className="font-mono">{selectedRecord.customer_id}</p>
                </div>
                <div>
                  <Label>{t('consent_type', 'Consent Type')}</Label>
                  <p>{selectedRecord.consent_type}</p>
                </div>
                <div>
                  <Label>{t('consent_status', 'Consent Status')}</Label>
                  <div className="flex items-center gap-2">
                    {getConsentIcon(selectedRecord.consent_given)}
                    <span>{selectedRecord.consent_given ? t('given', 'Given') : t('withdrawn', 'Withdrawn')}</span>
                  </div>
                </div>
                <div>
                  <Label>{t('consent_source', 'Consent Source')}</Label>
                  <p>{selectedRecord.consent_source.replace('_', ' ')}</p>
                </div>
                <div>
                  <Label>{t('ip_address', 'IP Address')}</Label>
                  <p className="font-mono">{selectedRecord.ip_address}</p>
                </div>
                <div>
                  <Label>{t('gdpr_compliant', 'GDPR Compliant')}</Label>
                  <div className="flex items-center gap-2">
                    {selectedRecord.gdpr_compliant ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                    <span>{selectedRecord.gdpr_compliant ? t('yes', 'Yes') : t('no', 'No')}</span>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <Label>{t('marketing_preferences', 'Marketing Preferences')}</Label>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    <span>{t('email', 'Email')}:</span>
                    <Badge className={selectedRecord.marketing_preferences.email_consent ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                      {selectedRecord.marketing_preferences.email_consent ? t('enabled', 'Enabled') : t('disabled', 'Disabled')}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Smartphone className="h-4 w-4" />
                    <span>{t('sms', 'SMS')}:</span>
                    <Badge className={selectedRecord.marketing_preferences.sms_consent ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                      {selectedRecord.marketing_preferences.sms_consent ? t('enabled', 'Enabled') : t('disabled', 'Disabled')}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    <span>WhatsApp:</span>
                    <Badge className={selectedRecord.marketing_preferences.whatsapp_consent ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                      {selectedRecord.marketing_preferences.whatsapp_consent ? t('enabled', 'Enabled') : t('disabled', 'Disabled')}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    <span>{t('push', 'Push')}:</span>
                    <Badge className={selectedRecord.marketing_preferences.push_consent ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                      {selectedRecord.marketing_preferences.push_consent ? t('enabled', 'Enabled') : t('disabled', 'Disabled')}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button variant="outline" onClick={() => setShowRecordDialog(false)}>
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