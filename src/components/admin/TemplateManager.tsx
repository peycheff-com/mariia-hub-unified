import React, { useState, useRef, useEffect } from 'react'
import {
  Mail,
  MessageSquare,
  Smartphone,
  Plus,
  Edit,
  Trash2,
  Eye,
  Copy,
  Download,
  Upload,
  Save,
  Send,
  Code,
  Type,
  Palette,
  Image as ImageIcon,
  Link,
  Variable,
  CheckCircle,
  AlertCircle,
  Clock,
  BarChart3,
  Users,
  Zap
} from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'


import type {
  MarketingTemplate,
  ChannelType,
  TemplateType,
  TemplateVariable,
  RenderTemplateResult,
  TestTemplateRequest
} from '@/types/marketing-automation'

interface TemplateManagerProps {
  className?: string
}

interface TemplatePreviewProps {
  template: MarketingTemplate
  previewData: Record<string, any>
  channel: ChannelType
}

const TemplatePreview: React.FC<TemplatePreviewProps> = ({ template, previewData, channel }) => {
  const renderTemplate = (template: MarketingTemplate, data: Record<string, any>): RenderTemplateResult => {
    const variables = new Set<string>()
    const missing = new Set<string>()
    const errors: string[] = []

    const replaceVariables = (text: string): string => {
      return text.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
        variables.add(varName)
        if (data[varName] !== undefined) {
          return String(data[varName])
        }
        missing.add(varName)
        return `[${varName}]`
      })
    }

    try {
      const renderedSubject = template.subject_template ? replaceVariables(template.subject_template) : undefined
      const renderedBody = replaceVariables(template.body_template)

      return {
        rendered_subject: renderedSubject,
        rendered_body: renderedBody,
        used_variables: Array.from(variables),
        missing_variables: Array.from(missing),
        errors
      }
    } catch (error) {
      return {
        rendered_body: template.body_template,
        used_variables: [],
        missing_variables: [],
        errors: [error instanceof Error ? error.message : 'Unknown error']
      }
    }
  }

  const rendered = renderTemplate(template, previewData)

  if (channel === 'email') {
    return (
      <div className="border rounded-lg overflow-hidden">
        <div className="bg-gray-100 p-2 border-b">
          <p className="text-sm font-medium">{rendered.rendered_subject}</p>
        </div>
        <div className="bg-white p-4">
          <div dangerouslySetInnerHTML={{ __html: rendered.rendered_body }} />
        </div>
        {rendered.missing_variables.length > 0 && (
          <div className="bg-yellow-50 p-3 border-t">
            <div className="flex items-center gap-2 text-yellow-800">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">Missing variables: {rendered.missing_variables.join(', ')}</span>
            </div>
          </div>
        )}
      </div>
    )
  }

  if (channel === 'sms') {
    return (
      <div className="border rounded-lg p-4 bg-gray-50">
        <div className="space-y-2">
          <div className="flex items-start gap-2">
            <Smartphone className="h-4 w-4 mt-1 text-gray-500" />
            <div className="flex-1">
              <p className="text-sm">{rendered.rendered_body}</p>
              <p className="text-xs text-gray-500 mt-2">
                {rendered.rendered_body.length}/160 characters
              </p>
            </div>
          </div>
          {rendered.missing_variables.length > 0 && (
            <div className="flex items-center gap-2 text-yellow-800 text-xs">
              <AlertCircle className="h-3 w-3" />
              <span>Missing: {rendered.missing_variables.join(', ')}</span>
            </div>
          )}
        </div>
      </div>
    )
  }

  if (channel === 'whatsapp') {
    return (
      <div className="border rounded-lg p-4 bg-green-50">
        <div className="space-y-2">
          <div className="flex items-start gap-2">
            <MessageSquare className="h-4 w-4 mt-1 text-green-600" />
            <div className="flex-1">
              <p className="text-sm">{rendered.rendered_body}</p>
            </div>
          </div>
          {rendered.missing_variables.length > 0 && (
            <div className="flex items-center gap-2 text-yellow-800 text-xs">
              <AlertCircle className="h-3 w-3" />
              <span>Missing: {rendered.missing_variables.join(', ')}</span>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="border rounded-lg p-4">
      <pre className="text-sm whitespace-pre-wrap">{rendered.rendered_body}</pre>
    </div>
  )
}

export const TemplateManager: React.FC<TemplateManagerProps> = ({ className }) => {
  const { t } = useTranslation()
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [templates, setTemplates] = useState<MarketingTemplate[]>([
    {
      id: '1',
      name: 'Welcome Email',
      description: 'Welcome email for new customers',
      channel: 'email',
      type: 'automation',
      subject_template: 'Welcome to {{business_name}}!',
      body_template: '<h1>Welcome {{customer_name}}!</h1><p>Thank you for joining us. We are excited to have you as part of our community.</p><p>Here is a special offer for your first visit: {{welcome_offer}}</p>',
      variables: [
        { name: 'customer_name', type: 'string', description: 'Customer full name', required: true },
        { name: 'business_name', type: 'string', description: 'Business name', required: true },
        { name: 'welcome_offer', type: 'string', description: 'Special welcome offer', required: false }
      ],
      language: 'en',
      is_active: true,
      created_at: '2024-01-20T10:00:00Z',
      updated_at: '2024-01-20T10:00:00Z',
      metadata: {}
    },
    {
      id: '2',
      name: 'Appointment Reminder',
      description: 'SMS reminder for upcoming appointments',
      channel: 'sms',
      type: 'transactional',
      body_template: 'Hi {{customer_name}}, this is a reminder about your appointment tomorrow at {{appointment_time}}. Reply CANCEL to reschedule.',
      variables: [
        { name: 'customer_name', type: 'string', description: 'Customer first name', required: true },
        { name: 'appointment_time', type: 'string', description: 'Appointment time', required: true }
      ],
      language: 'en',
      is_active: true,
      created_at: '2024-01-20T10:00:00Z',
      updated_at: '2024-01-20T10:00:00Z',
      metadata: {}
    }
  ])

  const [selectedTemplate, setSelectedTemplate] = useState<MarketingTemplate | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showTestDialog, setShowTestDialog] = useState(false)
  const [activeTab, setActiveTab] = useState('templates')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedChannel, setSelectedChannel] = useState<ChannelType | 'all'>('all')
  const [selectedType, setSelectedType] = useState<TemplateType | 'all'>('all')
  const [isPreviewMode, setIsPreviewMode] = useState(false)

  const [formData, setFormData] = useState<Partial<MarketingTemplate>>({
    name: '',
    description: '',
    channel: 'email',
    type: 'marketing',
    subject_template: '',
    body_template: '',
    variables: [],
    language: 'en',
    is_active: true
  })

  const [previewData, setPreviewData] = useState<Record<string, any>>({
    customer_name: 'John Doe',
    business_name: 'Beauty Studio',
    welcome_offer: '20% off your first service',
    appointment_time: '10:00 AM'
  })

  const [testRecipients, setTestRecipients] = useState<string[]>([])
  const [testEmail, setTestEmail] = useState('')
  const [testPhone, setTestPhone] = useState('')

  // Filter templates
  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.description?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesChannel = selectedChannel === 'all' || template.channel === selectedChannel
    const matchesType = selectedType === 'all' || template.type === selectedType
    return matchesSearch && matchesChannel && matchesType
  })

  // Handle template creation
  const handleCreateTemplate = () => {
    if (!formData.name || !formData.body_template) {
      toast({
        title: t('error', 'Error'),
        description: t('template_name_and_body_required', 'Template name and body are required'),
        variant: 'destructive'
      })
      return
    }

    const newTemplate: MarketingTemplate = {
      id: `template-${Date.now()}`,
      name: formData.name!,
      description: formData.description,
      channel: formData.channel!,
      type: formData.type!,
      subject_template: formData.subject_template,
      body_template: formData.body_template!,
      variables: formData.variables || [],
      language: formData.language || 'en',
      is_active: formData.is_active ?? true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      metadata: formData.metadata || {}
    }

    setTemplates(prev => [newTemplate, ...prev])
    setShowCreateDialog(false)
    resetForm()

    toast({
      title: t('success', 'Success'),
      description: t('template_created', 'Template created successfully')
    })
  }

  // Handle template update
  const handleUpdateTemplate = () => {
    if (!selectedTemplate || !formData.name || !formData.body_template) return

    const updatedTemplate: MarketingTemplate = {
      ...selectedTemplate,
      name: formData.name!,
      description: formData.description,
      subject_template: formData.subject_template,
      body_template: formData.body_template!,
      variables: formData.variables || [],
      language: formData.language || 'en',
      is_active: formData.is_active ?? true,
      updated_at: new Date().toISOString()
    }

    setTemplates(prev => prev.map(t => t.id === selectedTemplate.id ? updatedTemplate : t))
    setSelectedTemplate(updatedTemplate)

    toast({
      title: t('success', 'Success'),
      description: t('template_updated', 'Template updated successfully')
    })
  }

  // Handle template deletion
  const handleDeleteTemplate = (templateId: string) => {
    if (!confirm(t('confirm_delete_template', 'Are you sure you want to delete this template?'))) {
      return
    }

    setTemplates(prev => prev.filter(t => t.id !== templateId))
    if (selectedTemplate?.id === templateId) {
      setSelectedTemplate(null)
    }

    toast({
      title: t('template_deleted', 'Template Deleted'),
      description: t('template_deleted_description', 'The template has been deleted')
    })
  }

  // Handle template duplication
  const handleDuplicateTemplate = (template: MarketingTemplate) => {
    const duplicated: MarketingTemplate = {
      ...template,
      id: `template-${Date.now()}`,
      name: `${template.name} (Copy)`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    setTemplates(prev => [duplicated, ...prev])

    toast({
      title: t('template_duplicated', 'Template Duplicated'),
      description: t('template_duplicated_description', 'The template has been duplicated')
    })
  }

  // Handle template testing
  const handleTestTemplate = () => {
    if (!selectedTemplate) return

    const recipients: string[] = []

    if (selectedTemplate.channel === 'email' && testEmail) {
      recipients.push(testEmail)
    }

    if ((selectedTemplate.channel === 'sms' || selectedTemplate.channel === 'whatsapp') && testPhone) {
      recipients.push(testPhone)
    }

    if (recipients.length === 0) {
      toast({
        title: t('error', 'Error'),
        description: t('provide_test_recipient', 'Please provide at least one test recipient'),
        variant: 'destructive'
      })
      return
    }

    // Simulate sending test
    toast({
      title: t('test_sent', 'Test Sent'),
      description: t('template_test_sent', 'Test template has been sent to recipients')
    })

    setShowTestDialog(false)
    setTestEmail('')
    setTestPhone('')
  }

  // Export template
  const exportTemplate = (template: MarketingTemplate) => {
    const dataStr = JSON.stringify(template, null, 2)
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)
    const exportFileDefaultName = `${template.name.replace(/\s+/g, '-').toLowerCase()}.json`

    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.click()
  }

  // Import template
  const importTemplate = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string)
        imported.id = `template-${Date.now()}`
        imported.created_at = new Date().toISOString()
        imported.updated_at = new Date().toISOString()

        setTemplates(prev => [imported, ...prev])

        toast({
          title: t('import_successful', 'Import Successful'),
          description: t('template_imported', 'Template imported successfully')
        })
      } catch (error) {
        toast({
          title: t('import_failed', 'Import Failed'),
          description: t('invalid_template_file', 'Invalid template file'),
          variant: 'destructive'
        })
      }
    }
    reader.readAsText(file)
  }

  // Extract variables from template
  const extractVariables = (template: string): string[] => {
    const matches = template.match(/\{\{(\w+)\}\}/g)
    return matches ? matches.map(match => match.slice(2, -2)) : []
  }

  // Update variables when template changes
  useEffect(() => {
    if (formData.body_template) {
      const extractedVars = extractVariables(formData.body_template)
      const subjectVars = formData.subject_template ? extractVariables(formData.subject_template) : []
      const allVars = [...new Set([...extractedVars, ...subjectVars])]

      const variables: TemplateVariable[] = allVars.map(varName => ({
        name: varName,
        type: 'string',
        description: `${varName} variable`,
        required: true
      }))

      setFormData(prev => ({ ...prev, variables }))
    }
  }, [formData.body_template, formData.subject_template])

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      channel: 'email',
      type: 'marketing',
      subject_template: '',
      body_template: '',
      variables: [],
      language: 'en',
      is_active: true
    })
  }

  // Load template for editing
  const loadTemplateForEditing = (template: MarketingTemplate) => {
    setSelectedTemplate(template)
    setFormData({
      name: template.name,
      description: template.description,
      channel: template.channel,
      type: template.type,
      subject_template: template.subject_template,
      body_template: template.body_template,
      variables: template.variables,
      language: template.language,
      is_active: template.is_active
    })
    setActiveTab('editor')
  }

  const getChannelIcon = (channel: ChannelType) => {
    switch (channel) {
      case 'email':
        return <Mail className="h-4 w-4" />
      case 'sms':
        return <Smartphone className="h-4 w-4" />
      case 'whatsapp':
        return <MessageSquare className="h-4 w-4" />
      case 'push':
        return <Zap className="h-4 w-4" />
      default:
        return <Mail className="h-4 w-4" />
    }
  }

  const getChannelColor = (channel: ChannelType) => {
    switch (channel) {
      case 'email':
        return 'bg-blue-100 text-blue-800'
      case 'sms':
        return 'bg-green-100 text-green-800'
      case 'whatsapp':
        return 'bg-green-100 text-green-800'
      case 'push':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{t('template_manager', 'Template Manager')}</h2>
          <p className="text-muted-foreground">
            {t('templates_description', 'Create and manage message templates for all channels')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <label>
              <Upload className="h-4 w-4 mr-2" />
              {t('import', 'Import')}
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={importTemplate}
                className="hidden"
              />
            </label>
          </Button>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            {t('create_template', 'Create Template')}
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="templates">{t('templates', 'Templates')}</TabsTrigger>
          <TabsTrigger value="editor">{t('editor', 'Editor')}</TabsTrigger>
          <TabsTrigger value="analytics">{t('analytics', 'Analytics')}</TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-4">
          {/* Filters */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Variable className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder={t('search_templates', 'Search templates...')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedChannel} onValueChange={(value: any) => setSelectedChannel(value)}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder={t('all_channels', 'All Channels')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('all_channels', 'All Channels')}</SelectItem>
                <SelectItem value="email">{t('email', 'Email')}</SelectItem>
                <SelectItem value="sms">{t('sms', 'SMS')}</SelectItem>
                <SelectItem value="whatsapp">WhatsApp</SelectItem>
                <SelectItem value="push">{t('push', 'Push')}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedType} onValueChange={(value: any) => setSelectedType(value)}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder={t('all_types', 'All Types')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('all_types', 'All Types')}</SelectItem>
                <SelectItem value="marketing">{t('marketing', 'Marketing')}</SelectItem>
                <SelectItem value="transactional">{t('transactional', 'Transactional')}</SelectItem>
                <SelectItem value="automation">{t('automation', 'Automation')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Templates Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTemplates.map((template) => (
              <Card key={template.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {getChannelIcon(template.channel)}
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                    </div>
                    <Switch
                      checked={template.is_active}
                      onCheckedChange={(checked) => {
                        setTemplates(prev => prev.map(t =>
                          t.id === template.id ? { ...t, is_active: checked } : t
                        ))
                      }}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getChannelColor(template.channel)}>
                      {template.channel}
                    </Badge>
                    <Badge variant="outline">{template.type}</Badge>
                    <Badge variant="secondary">{template.language}</Badge>
                  </div>
                  {template.description && (
                    <CardDescription>{template.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="text-sm">
                      <p className="text-muted-foreground">{t('variables', 'Variables')}:</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {template.variables.slice(0, 3).map((variable) => (
                          <Badge key={variable.name} variant="outline" className="text-xs">
                            {variable.name}
                          </Badge>
                        ))}
                        {template.variables.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{template.variables.length - 3}
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="text-xs text-muted-foreground">
                      {t('last_updated', 'Last updated')}: {new Date(template.updated_at).toLocaleDateString()}
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                      <Button size="sm" variant="outline" onClick={() => loadTemplateForEditing(template)}>
                        <Edit className="h-3 w-3 mr-1" />
                        {t('edit', 'Edit')}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => {
                        setSelectedTemplate(template)
                        setShowTestDialog(true)
                      }}>
                        <Send className="h-3 w-3 mr-1" />
                        {t('test', 'Test')}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => exportTemplate(template)}>
                        <Download className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleDuplicateTemplate(template)}>
                        <Copy className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleDeleteTemplate(template.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="editor" className="space-y-4">
          {selectedTemplate ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Template Editor */}
              <Card>
                <CardHeader>
                  <CardTitle>{t('template_editor', 'Template Editor')}</CardTitle>
                  <CardDescription>
                    {t('editor_description', 'Edit your template content and variables')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>{t('template_name', 'Template Name')}</Label>
                    <Input
                      value={formData.name || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>

                  <div>
                    <Label>{t('description', 'Description')}</Label>
                    <Textarea
                      value={formData.description || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      rows={2}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label>{t('channel', 'Channel')}</Label>
                      <Select
                        value={formData.channel}
                        onValueChange={(value: ChannelType) => setFormData(prev => ({ ...prev, channel: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="email">{t('email', 'Email')}</SelectItem>
                          <SelectItem value="sms">{t('sms', 'SMS')}</SelectItem>
                          <SelectItem value="whatsapp">WhatsApp</SelectItem>
                          <SelectItem value="push">{t('push', 'Push')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>{t('type', 'Type')}</Label>
                      <Select
                        value={formData.type}
                        onValueChange={(value: TemplateType) => setFormData(prev => ({ ...prev, type: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="marketing">{t('marketing', 'Marketing')}</SelectItem>
                          <SelectItem value="transactional">{t('transactional', 'Transactional')}</SelectItem>
                          <SelectItem value="automation">{t('automation', 'Automation')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>{t('language', 'Language')}</Label>
                      <Select
                        value={formData.language}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, language: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="en">English</SelectItem>
                          <SelectItem value="pl">Polski</SelectItem>
                          <SelectItem value="ru">Русский</SelectItem>
                          <SelectItem value="ua">Українська</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {formData.channel === 'email' && (
                    <div>
                      <Label>{t('subject_template', 'Subject Template')}</Label>
                      <Input
                        value={formData.subject_template || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, subject_template: e.target.value }))}
                        placeholder="{{customer_name}} - Welcome!"
                      />
                    </div>
                  )}

                  <div>
                    <Label>{t('body_template', 'Body Template')}</Label>
                    <Textarea
                      value={formData.body_template || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, body_template: e.target.value }))}
                      placeholder={t('body_template_placeholder', 'Enter your message template with variables like {{variable_name}}')}
                      rows={10}
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between">
                      <Label>{t('detected_variables', 'Detected Variables')}</Label>
                      <Button variant="outline" size="sm" onClick={() => setIsPreviewMode(!isPreviewMode)}>
                        {isPreviewMode ? <Edit className="h-4 w-4 mr-1" /> : <Eye className="h-4 w-4 mr-1" />}
                        {isPreviewMode ? t('edit', 'Edit') : t('preview', 'Preview')}
                      </Button>
                    </div>
                    <div className="mt-2 space-y-2">
                      {formData.variables?.map((variable) => (
                        <div key={variable.name} className="flex items-center gap-2 p-2 border rounded">
                          <Code className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm font-mono">{`{{${variable.name}}}`}</span>
                          <Badge variant="outline" className="text-xs">{variable.type}</Badge>
                          {variable.required && <Badge variant="destructive" className="text-xs">Required</Badge>}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setActiveTab('templates')}>
                      {t('cancel', 'Cancel')}
                    </Button>
                    <Button onClick={handleUpdateTemplate}>
                      <Save className="h-4 w-4 mr-2" />
                      {t('save_changes', 'Save Changes')}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Live Preview */}
              <Card>
                <CardHeader>
                  <CardTitle>{t('live_preview', 'Live Preview')}</CardTitle>
                  <CardDescription>
                    {t('preview_description', 'See how your template looks with sample data')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>{t('preview_data', 'Preview Data')}</Label>
                    <Textarea
                      value={JSON.stringify(previewData, null, 2)}
                      onChange={(e) => {
                        try {
                          setPreviewData(JSON.parse(e.target.value))
                        } catch (error) {
                          // Invalid JSON, ignore
                        }
                      }}
                      rows={6}
                      placeholder={t('preview_data_placeholder', 'Enter JSON data for preview...')}
                    />
                  </div>

                  <Separator />

                  <div>
                    <Label>{t('template_preview', 'Template Preview')}</Label>
                    <div className="mt-2">
                      {formData.body_template && (
                        <TemplatePreview
                          template={{
                            ...selectedTemplate,
                            subject_template: formData.subject_template,
                            body_template: formData.body_template,
                            channel: formData.channel!
                          }}
                          previewData={previewData}
                          channel={formData.channel!}
                        />
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Type className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold">{t('no_template_selected', 'No Template Selected')}</h3>
                <p className="text-muted-foreground text-center">
                  {t('select_template_to_edit', 'Select a template from the templates tab to edit it')}
                </p>
                <Button className="mt-4" onClick={() => setActiveTab('templates')}>
                  {t('browse_templates', 'Browse Templates')}
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>{t('template_analytics', 'Template Analytics')}</CardTitle>
              <CardDescription>
                {t('analytics_description', 'Performance metrics for your templates')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{t('coming_soon', 'Analytics dashboard coming soon...')}</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Template Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('create_new_template', 'Create New Template')}</DialogTitle>
            <DialogDescription>
              {t('create_template_description', 'Create a new message template for any channel')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>{t('template_name', 'Template Name')}</Label>
              <Input
                value={formData.name || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder={t('enter_template_name', 'Enter template name...')}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>{t('channel', 'Channel')}</Label>
                <Select
                  value={formData.channel}
                  onValueChange={(value: ChannelType) => setFormData(prev => ({ ...prev, channel: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">{t('email', 'Email')}</SelectItem>
                    <SelectItem value="sms">{t('sms', 'SMS')}</SelectItem>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    <SelectItem value="push">{t('push', 'Push')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{t('type', 'Type')}</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: TemplateType) => setFormData(prev => ({ ...prev, type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="marketing">{t('marketing', 'Marketing')}</SelectItem>
                    <SelectItem value="transactional">{t('transactional', 'Transactional')}</SelectItem>
                    <SelectItem value="automation">{t('automation', 'Automation')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{t('language', 'Language')}</Label>
                <Select
                  value={formData.language}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, language: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="pl">Polski</SelectItem>
                    <SelectItem value="ru">Русский</SelectItem>
                    <SelectItem value="ua">Українська</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {formData.channel === 'email' && (
              <div>
                <Label>{t('subject_template', 'Subject Template')}</Label>
                <Input
                  value={formData.subject_template || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, subject_template: e.target.value }))}
                  placeholder="{{customer_name}} - Welcome!"
                />
              </div>
            )}

            <div>
              <Label>{t('body_template', 'Body Template')}</Label>
              <Textarea
                value={formData.body_template || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, body_template: e.target.value }))}
                placeholder={t('body_template_placeholder', 'Enter your message template...')}
                rows={8}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                {t('cancel', 'Cancel')}
              </Button>
              <Button onClick={handleCreateTemplate}>
                {t('create_template', 'Create Template')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Test Template Dialog */}
      <Dialog open={showTestDialog} onOpenChange={setShowTestDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('test_template', 'Test Template')}</DialogTitle>
            <DialogDescription>
              {t('test_template_description', 'Send a test message to preview your template')}
            </DialogDescription>
          </DialogHeader>

          {selectedTemplate && (
            <div className="space-y-4">
              {selectedTemplate.channel === 'email' && (
                <div>
                  <Label>{t('test_email', 'Test Email Address')}</Label>
                  <Input
                    type="email"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    placeholder="test@example.com"
                  />
                </div>
              )}

              {(selectedTemplate.channel === 'sms' || selectedTemplate.channel === 'whatsapp') && (
                <div>
                  <Label>{t('test_phone', 'Test Phone Number')}</Label>
                  <Input
                    type="tel"
                    value={testPhone}
                    onChange={(e) => setTestPhone(e.target.value)}
                    placeholder="+48 123 456 789"
                  />
                </div>
              )}

              <div>
                <Label>{t('test_data', 'Test Data (Optional)')}</Label>
                <Textarea
                  value={JSON.stringify(previewData, null, 2)}
                  onChange={(e) => {
                    try {
                      setPreviewData(JSON.parse(e.target.value))
                    } catch (error) {
                      // Invalid JSON, ignore
                    }
                  }}
                  rows={4}
                  placeholder={t('test_data_placeholder', 'Enter test data in JSON format...')}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowTestDialog(false)}>
                  {t('cancel', 'Cancel')}
                </Button>
                <Button onClick={handleTestTemplate}>
                  <Send className="h-4 w-4 mr-2" />
                  {t('send_test', 'Send Test')}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}