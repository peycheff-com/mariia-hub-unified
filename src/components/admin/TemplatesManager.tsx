import React, { useState, useEffect } from 'react'
import {
  Mail,
  MessageSquare,
  Smartphone,
  Plus,
  Edit,
  Copy,
  Trash2,
  Eye,
  Search,
  Filter,
  Tag,
  Code,
  FileText,
  Zap,
  BarChart3,
  History,
  Play,
  Save,
  X
} from 'lucide-react'
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
import { useToast } from '@/hooks/use-toast aria-live="polite" aria-atomic="true"'
import { useMessaging } from '@/hooks/useMessaging'
import { cn } from '@/lib/utils'


interface TemplatesManagerProps {
  className?: string
}

interface TemplateFormData {
  name: string
  channel: 'email' | 'sms' | 'whatsapp'
  category: string
  subject_template?: string
  template_content: string
  variables: string[]
  locale: string
  is_active: boolean
}

interface TemplateTestForm {
  recipient: string
  variables: Record<string, string>
}

export const TemplatesManager: React.FC<TemplatesManagerProps> = ({ className }) => {
  const { t } = useTranslation()
  const { toast aria-live="polite" aria-atomic="true" } = useToast()
  const {
    templates,
    createTemplate,
    updateTemplate,
    fetchTemplates
  } = useMessaging()

  // State
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedChannel, setSelectedChannel] = useState<string>('all')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showPreviewDialog, setShowPreviewDialog] = useState(false)
  const [showTestDialog, setShowTestDialog] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null)
  const [editingTemplate, setEditingTemplate] = useState<any>(null)
  const [testForm, setTestForm] = useState<TemplateTestForm>({
    recipient: '',
    variables: {}
  })

  // Form state
  const [formData, setFormData] = useState<TemplateFormData>({
    name: '',
    channel: 'email',
    category: 'general',
    template_content: '',
    variables: [],
    locale: 'en',
    is_active: true
  })

  // Get unique categories
  const categories = Array.from(new Set(templates.map(t => t.category).filter(Boolean)))

  // Filter templates
  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.template_content.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesChannel = selectedChannel === 'all' || template.channel === selectedChannel
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory

    return matchesSearch && matchesChannel && matchesCategory
  })

  // Extract variables from template content
  const extractVariables = (content: string): string[] => {
    const regex = /{{(\w+)}}/g
    const variables = new Set<string>()
    let match

    while ((match = regex.exec(content)) !== null) {
      variables.add(match[1])
    }

    return Array.from(variables)
  }

  // Update variables when content changes
  useEffect(() => {
    const variables = extractVariables(formData.template_content)
    setFormData(prev => ({ ...prev, variables }))
  }, [formData.template_content])

  // Handle form submission
  const handleCreateTemplate = async () => {
    if (!formData.name || !formData.template_content) {
      toast aria-live="polite" aria-atomic="true"({
        title: t('error', 'Error'),
        description: t('fill_required_fields', 'Please fill in all required fields'),
        variant: 'destructive'
      })
      return
    }

    setLoading(true)
    try {
      await createTemplate(formData)

      setShowCreateDialog(false)
      setFormData({
        name: '',
        channel: 'email',
        category: 'general',
        template_content: '',
        variables: [],
        locale: 'en',
        is_active: true
      })

      toast aria-live="polite" aria-atomic="true"({
        title: t('success', 'Success'),
        description: t('template_created', 'Template created successfully')
      })
    } catch (error) {
      console.error('Failed to create template:', error)
    } finally {
      setLoading(false)
    }
  }

  // Handle template update
  const handleUpdateTemplate = async () => {
    if (!editingTemplate?.id || !formData.name || !formData.template_content) {
      toast aria-live="polite" aria-atomic="true"({
        title: t('error', 'Error'),
        description: t('fill_required_fields', 'Please fill in all required fields'),
        variant: 'destructive'
      })
      return
    }

    setLoading(true)
    try {
      await updateTemplate(editingTemplate.id, formData)

      setShowEditDialog(false)
      setEditingTemplate(null)
      setFormData({
        name: '',
        channel: 'email',
        category: 'general',
        template_content: '',
        variables: [],
        locale: 'en',
        is_active: true
      })

      toast aria-live="polite" aria-atomic="true"({
        title: t('success', 'Success'),
        description: t('template_updated', 'Template updated successfully')
      })
    } catch (error) {
      console.error('Failed to update template:', error)
    } finally {
      setLoading(false)
    }
  }

  // Handle template preview
  const handlePreview = (template: any) => {
    setSelectedTemplate(template)
    setShowPreviewDialog(true)
  }

  // Handle template edit
  const handleEdit = (template: any) => {
    setEditingTemplate(template)
    setFormData({
      name: template.name,
      channel: template.channel,
      category: template.category || 'general',
      subject_template: template.subject_template || '',
      template_content: template.template_content,
      variables: Array.isArray(template.variables) ? template.variables : [],
      locale: template.locale || 'en',
      is_active: template.is_active
    })
    setShowEditDialog(true)
  }

  // Handle template test
  const handleTest = (template: any) => {
    setSelectedTemplate(template)
    setTestForm({
      recipient: '',
      variables: (Array.isArray(template.variables) ? template.variables : []).reduce((acc, variable) => {
        acc[variable] = ''
        return acc
      }, {} as Record<string, string>)
    })
    setShowTestDialog(true)
  }

  // Handle template duplication
  const handleDuplicate = async (template: any) => {
    const duplicatedData = {
      ...template,
      name: `${template.name} (Copy)`,
      id: undefined,
      created_at: undefined,
      updated_at: undefined,
      usage_count: 0
    }

    try {
      await createTemplate(duplicatedData)
      toast aria-live="polite" aria-atomic="true"({
        title: t('success', 'Success'),
        description: t('template_duplicated', 'Template duplicated successfully')
      })
    } catch (error) {
      console.error('Failed to duplicate template:', error)
    }
  }

  // Render template content with variables
  const renderTemplateContent = (content: string, variables: Record<string, string> = {}) => {
    let rendered = content

    // Replace variables with values or placeholders
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g')
      rendered = rendered.replace(regex, value || `{{${key}}}`)
    })

    // Highlight unreplaced variables
    rendered = rendered.replace(/{{(\w+)}}/g, '<span class="text-primary bg-primary/10 px-1 rounded">{$1}</span>')

    return rendered
  }

  // Get channel icon
  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'email':
        return <Mail className="h-4 w-4" />
      case 'sms':
        return <Smartphone className="h-4 w-4" />
      case 'whatsapp':
        return <MessageSquare className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{t('message_templates', 'Message Templates')}</h2>
          <p className="text-muted-foreground">
            {t('templates_description', 'Create and manage message templates for different channels')}
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          {t('create_template', 'Create Template')}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('total_templates', 'Total Templates')}</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{templates.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('email_templates', 'Email Templates')}</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {templates.filter(t => t.channel === 'email').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('sms_templates', 'SMS Templates')}</CardTitle>
            <Smartphone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {templates.filter(t => t.channel === 'sms').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('whatsapp_templates', 'WhatsApp Templates')}</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {templates.filter(t => t.channel === 'whatsapp').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder={t('search_templates', 'Search templates...')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={selectedChannel} onValueChange={setSelectedChannel}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder={t('all_channels', 'All Channels')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('all_channels', 'All Channels')}</SelectItem>
            <SelectItem value="email">{t('email', 'Email')}</SelectItem>
            <SelectItem value="sms">{t('sms', 'SMS')}</SelectItem>
            <SelectItem value="whatsapp">{t('whatsapp', 'WhatsApp')}</SelectItem>
          </SelectContent>
        </Select>

        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder={t('all_categories', 'All Categories')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('all_categories', 'All Categories')}</SelectItem>
            {categories.map(category => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Templates List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTemplates.map((template) => (
          <Card key={template.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  {getChannelIcon(template.channel)}
                  <div>
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    <CardDescription>
                      {template.category} • v{template.version}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Badge variant={template.is_active ? 'default' : 'secondary'}>
                    {template.is_active ? t('active', 'Active') : t('inactive', 'Inactive')}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {template.subject_template && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      {t('subject', 'Subject')}:
                    </p>
                    <p className="text-sm line-clamp-2">{template.subject_template}</p>
                  </div>
                )}

                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    {t('content', 'Content')}:
                  </p>
                  <p className="text-sm line-clamp-3">{template.template_content}</p>
                </div>

                {Array.isArray(template.variables) && template.variables.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {template.variables.slice(0, 3).map(variable => (
                      <Badge key={variable} variant="outline" className="text-xs">
                        {`{{${variable}}}`}
                      </Badge>
                    ))}
                    {template.variables.length > 3 && (
                      <span className="text-xs text-muted-foreground">
                        +{template.variables.length - 3}
                      </span>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>{t('used_times', 'Used {{count}} times', { count: template.usage_count })}</span>
                  <span>{template.locale}</span>
                </div>

                <Separator />

                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handlePreview(template)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleTest(template)}
                  >
                    <Play className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(template)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDuplicate(template)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create Template Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('create_template', 'Create Template')}</DialogTitle>
            <DialogDescription>
              {t('create_template_description', 'Create a new message template for automated communications')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">{t('template_name', 'Template Name')}</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder={t('enter_template_name', 'Enter template name...')}
                />
              </div>
              <div>
                <Label htmlFor="channel">{t('channel', 'Channel')}</Label>
                <Select
                  value={formData.channel}
                  onValueChange={(value: any) => setFormData(prev => ({ ...prev, channel: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">{t('email', 'Email')}</SelectItem>
                    <SelectItem value="sms">{t('sms', 'SMS')}</SelectItem>
                    <SelectItem value="whatsapp">{t('whatsapp', 'WhatsApp')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">{t('category', 'Category')}</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  placeholder={t('general', 'General')}
                />
              </div>
              <div>
                <Label htmlFor="locale">{t('language', 'Language')}</Label>
                <Select
                  value={formData.locale}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, locale: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="pl">Polski</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {formData.channel === 'email' && (
              <div>
                <Label htmlFor="subject">{t('subject_template', 'Subject Template')}</Label>
                <Input
                  id="subject"
                  value={formData.subject_template || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, subject_template: e.target.value }))}
                  placeholder={t('email_subject_placeholder', 'Hello {{customer_name}}!')}
                />
              </div>
            )}

            <div>
              <Label htmlFor="content">{t('message_content', 'Message Content')}</Label>
              <Textarea
                id="content"
                value={formData.template_content}
                onChange={(e) => setFormData(prev => ({ ...prev, template_content: e.target.value }))}
                placeholder={t('message_content_placeholder', 'Hi {{customer_name}},\n\nYour appointment is confirmed for {{date}} at {{time}}.\n\nBest regards,\n{{business_name}}')}
                rows={8}
              />
            </div>

            {formData.variables.length > 0 && (
              <div>
                <Label>{t('detected_variables', 'Detected Variables')}</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.variables.map(variable => (
                    <Badge key={variable} variant="secondary">
                      {`{{${variable}}}`}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Switch
                  id="active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                />
                <Label htmlFor="active">{t('active', 'Active')}</Label>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  {t('cancel', 'Cancel')}
                </Button>
                <Button onClick={handleCreateTemplate} disabled={loading}>
                  {loading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  {t('create', 'Create')}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Template Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('edit_template', 'Edit Template')}</DialogTitle>
            <DialogDescription>
              {t('edit_template_description', 'Update the template details and content')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-name">{t('template_name', 'Template Name')}</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder={t('enter_template_name', 'Enter template name...')}
                />
              </div>
              <div>
                <Label htmlFor="edit-channel">{t('channel', 'Channel')}</Label>
                <Select
                  value={formData.channel}
                  onValueChange={(value: any) => setFormData(prev => ({ ...prev, channel: value }))}
                  disabled
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">{t('email', 'Email')}</SelectItem>
                    <SelectItem value="sms">{t('sms', 'SMS')}</SelectItem>
                    <SelectItem value="whatsapp">{t('whatsapp', 'WhatsApp')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-category">{t('category', 'Category')}</Label>
                <Input
                  id="edit-category"
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  placeholder={t('general', 'General')}
                />
              </div>
              <div>
                <Label htmlFor="edit-locale">{t('language', 'Language')}</Label>
                <Select
                  value={formData.locale}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, locale: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="pl">Polski</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {formData.channel === 'email' && (
              <div>
                <Label htmlFor="edit-subject">{t('subject_template', 'Subject Template')}</Label>
                <Input
                  id="edit-subject"
                  value={formData.subject_template || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, subject_template: e.target.value }))}
                  placeholder={t('email_subject_placeholder', 'Hello {{customer_name}}!')}
                />
              </div>
            )}

            <div>
              <Label htmlFor="edit-content">{t('message_content', 'Message Content')}</Label>
              <Textarea
                id="edit-content"
                value={formData.template_content}
                onChange={(e) => setFormData(prev => ({ ...prev, template_content: e.target.value }))}
                rows={8}
              />
            </div>

            {formData.variables.length > 0 && (
              <div>
                <Label>{t('detected_variables', 'Detected Variables')}</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.variables.map(variable => (
                    <Badge key={variable} variant="secondary">
                      {`{{${variable}}}`}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Switch
                  id="edit-active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                />
                <Label htmlFor="edit-active">{t('active', 'Active')}</Label>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                  {t('cancel', 'Cancel')}
                </Button>
                <Button onClick={handleUpdateTemplate} disabled={loading}>
                  {loading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  {t('save', 'Save')}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('template_preview', 'Template Preview')}</DialogTitle>
            <DialogDescription>
              {t('template_preview_description', 'Preview how the template will look with sample data')}
            </DialogDescription>
          </DialogHeader>

          {selectedTemplate && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                {getChannelIcon(selectedTemplate.channel)}
                <Badge variant="outline">{selectedTemplate.channel}</Badge>
                <Badge variant="outline">{selectedTemplate.category}</Badge>
              </div>

              {selectedTemplate.subject_template && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    {t('subject', 'Subject')}:
                  </Label>
                  <p className="p-3 bg-muted rounded-lg mt-1">
                    {selectedTemplate.subject_template}
                  </p>
                </div>
              )}

              <div>
                <Label className="text-sm font-medium text-muted-foreground">
                  {t('content', 'Content')}:
                </Label>
                <div
                  className="p-3 bg-muted rounded-lg mt-1 whitespace-pre-wrap"
                  dangerouslySetInnerHTML={{
                    __html: renderTemplateContent(selectedTemplate.template_content)
                  }}
                />
              </div>

              {Array.isArray(selectedTemplate.variables) && selectedTemplate.variables.length > 0 && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    {t('variables', 'Variables')}:
                  </Label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {selectedTemplate.variables.map(variable => (
                      <Badge key={variable} variant="outline">
                        {`{{${variable}}}`}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end">
                <Button variant="outline" onClick={() => setShowPreviewDialog(false)}>
                  {t('close', 'Close')}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Test Dialog */}
      <Dialog open={showTestDialog} onOpenChange={setShowTestDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('test_template', 'Test Template')}</DialogTitle>
            <DialogDescription>
              {t('test_template_description', 'Send a test message to see how the template works')}
            </DialogDescription>
          </DialogHeader>

          {selectedTemplate && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="test-recipient">{t('recipient', 'Recipient')}</Label>
                <Input
                  id="test-recipient"
                  value={testForm.recipient}
                  onChange={(e) => setTestForm(prev => ({ ...prev, recipient: e.target.value }))}
                  placeholder={
                    selectedTemplate.channel === 'email' ? 'test@example.com' : '+48123456789'
                  }
                />
              </div>

              {Array.isArray(selectedTemplate.variables) && selectedTemplate.variables.length > 0 && (
                <div>
                  <Label>{t('variable_values', 'Variable Values')}</Label>
                  <div className="space-y-2 mt-2">
                    {selectedTemplate.variables.map(variable => (
                      <div key={variable}>
                        <Label htmlFor={`var-${variable}`} className="text-sm">
                          {variable}
                        </Label>
                        <Input
                          id={`var-${variable}`}
                          value={testForm.variables[variable] || ''}
                          onChange={(e) => setTestForm(prev => ({
                            ...prev,
                            variables: {
                              ...prev.variables,
                              [variable]: e.target.value
                            }
                          }))}
                          placeholder={`Enter ${variable}...`}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <Label className="text-sm font-medium text-muted-foreground">
                  {t('preview', 'Preview')}:
                </Label>
                <div className="p-3 bg-muted rounded-lg mt-1">
                  <p className="whitespace-pre-wrap">
                    {renderTemplateContent(
                      selectedTemplate.template_content,
                      testForm.variables
                    )}
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowTestDialog(false)}>
                  {t('cancel', 'Cancel')}
                </Button>
                <Button>
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