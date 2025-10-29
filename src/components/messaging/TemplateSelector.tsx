import React, { useState, useMemo } from 'react'
import { Check, ChevronDown, FileText, Mail, MessageSquare, Smartphone } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'


import type { CommunicationTemplate } from '@/integrations/supabase/types'

interface TemplateSelectorProps {
  templates: CommunicationTemplate[]
  channel?: 'email' | 'sms' | 'whatsapp'
  onSelect: (template: CommunicationTemplate) => void
  disabled?: boolean
  placeholder?: string
  className?: string
}

interface TemplatePreviewProps {
  template: CommunicationTemplate
  variables?: Record<string, string>
  onClose?: () => void
}

const TemplatePreview: React.FC<TemplatePreviewProps> = ({ template, variables = {}, onClose }) => {
  const { t } = useTranslation()

  // Replace template variables with values
  const renderContent = () => {
    let content = template.template_content

    // Replace common variables
    const commonVariables = {
      customer_name: t('john_doe', 'John Doe'),
      business_name: t('beauty_studio', 'Beauty Studio'),
      date: new Date().toLocaleDateString(),
      time: new Date().toLocaleTimeString(),
      ...variables
    }

    Object.entries(commonVariables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g')
      content = content.replace(regex, value)
    })

    return content
  }

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
    <div className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {getChannelIcon(template.channel)}
          <h3 className="font-semibold">{template.name}</h3>
          <Badge variant="secondary" className="text-xs">
            {template.channel}
          </Badge>
        </div>
        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose}>
            ×
          </Button>
        )}
      </div>

      {template.subject_template && (
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-1">
            {t('subject', 'Subject')}:
          </p>
          <p className="text-sm p-2 bg-muted rounded">
            {template.subject_template}
          </p>
        </div>
      )}

      <div>
        <p className="text-sm font-medium text-muted-foreground mb-1">
          {t('content', 'Content')}:
        </p>
        <div className="text-sm p-3 bg-muted rounded-lg whitespace-pre-wrap max-h-64 overflow-y-auto">
          {renderContent()}
        </div>
      </div>

      {template.variables && Array.isArray(template.variables) && template.variables.length > 0 && (
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-1">
            {t('variables_used', 'Variables used')}:
          </p>
          <div className="flex flex-wrap gap-1">
            {template.variables.map((variable: any) => (
              <Badge key={variable} variant="outline" className="text-xs">
                {`{{${variable}}}`}
              </Badge>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{t('used_times', 'Used {{count}} times', { count: template.usage_count })}</span>
        <span>v{template.version}</span>
      </div>
    </div>
  )
}

export const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  templates,
  channel,
  onSelect,
  disabled = false,
  placeholder,
  className
}) => {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState<CommunicationTemplate | null>(null)
  const [showPreview, setShowPreview] = useState(false)

  // Filter templates by channel and search query
  const filteredTemplates = useMemo(() => {
    let filtered = templates

    if (channel) {
      filtered = filtered.filter(t => t.channel === channel)
    }

    if (searchQuery) {
      filtered = filtered.filter(t =>
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.template_content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.category?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    return filtered
  }, [templates, channel, searchQuery])

  // Group templates by category
  const templatesByCategory = useMemo(() => {
    const groups: Record<string, CommunicationTemplate[]> = {}

    filteredTemplates.forEach(template => {
      const category = template.category || t('general', 'General')
      if (!groups[category]) {
        groups[category] = []
      }
      groups[category].push(template)
    })

    return groups
  }, [filteredTemplates, t])

  // Get all unique channels
  const availableChannels = useMemo(() => {
    const channels = new Set(templates.map(t => t.channel))
    return Array.from(channels)
  }, [templates])

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

  const handleSelectTemplate = (template: CommunicationTemplate) => {
    setSelectedTemplate(template)
    setShowPreview(true)
  }

  const handleUseTemplate = () => {
    if (selectedTemplate) {
      onSelect(selectedTemplate)
      setOpen(false)
      setShowPreview(false)
      setSelectedTemplate(null)
    }
  }

  if (showPreview && selectedTemplate) {
    return (
      <div className="border rounded-lg p-4 space-y-3">
        <TemplatePreview
          template={selectedTemplate}
          onClose={() => {
            setShowPreview(false)
            setSelectedTemplate(null)
          }}
        />
        <div className="flex gap-2">
          <Button onClick={handleUseTemplate} className="flex-1">
            {t('use_template', 'Use Template')}
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setShowPreview(false)
              setSelectedTemplate(null)
            }}
          >
            {t('back', 'Back')}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("space-y-3", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className="w-full justify-between"
          >
            {selectedTemplate ? (
              <div className="flex items-center gap-2 truncate">
                {getChannelIcon(selectedTemplate.channel)}
                <span className="truncate">{selectedTemplate.name}</span>
              </div>
            ) : (
              <span className="text-muted-foreground">
                {placeholder || t('select_template', 'Select a template...')}
              </span>
            )}
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-[400px] p-0" align="start">
          <Command>
            <CommandInput
              placeholder={t('search_templates', 'Search templates...')}
              value={searchQuery}
              onValueChange={setSearchQuery}
            />
            <CommandList>
              <CommandEmpty>
                {t('no_templates_found', 'No templates found')}
              </CommandEmpty>

              {!channel && availableChannels.length > 1 && (
                <Tabs defaultValue={availableChannels[0]} className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    {availableChannels.map(ch => (
                      <TabsTrigger key={ch} value={ch} className="text-xs">
                        {getChannelIcon(ch)}
                        <span className="ml-1 capitalize">{ch}</span>
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  {availableChannels.map(ch => (
                    <TabsContent key={ch} value={ch} className="mt-0">
                      <ScrollArea className="h-[300px]">
                        {Object.entries(templatesByCategory).map(([category, categoryTemplates]) => (
                          <CommandGroup key={category} heading={category}>
                            {categoryTemplates
                              .filter(t => t.channel === ch)
                              .map(template => (
                                <CommandItem
                                  key={template.id}
                                  value={template.name}
                                  onSelect={() => handleSelectTemplate(template)}
                                >
                                  <div className="flex items-center gap-2 w-full">
                                    {getChannelIcon(template.channel)}
                                    <div className="flex-1 min-w-0">
                                      <p className="font-medium truncate">{template.name}</p>
                                      <p className="text-xs text-muted-foreground truncate">
                                        {template.template_content.substring(0, 50)}...
                                      </p>
                                    </div>
                                    <Badge variant="secondary" className="text-xs">
                                      {template.usage_count}
                                    </Badge>
                                  </div>
                                </CommandItem>
                              ))}
                          </CommandGroup>
                        ))}
                      </ScrollArea>
                    </TabsContent>
                  ))}
                </Tabs>
              )}

              {channel && (
                <ScrollArea className="h-[300px]">
                  {Object.entries(templatesByCategory).map(([category, categoryTemplates]) => (
                    <CommandGroup key={category} heading={category}>
                      {categoryTemplates.map(template => (
                        <CommandItem
                          key={template.id}
                          value={template.name}
                          onSelect={() => handleSelectTemplate(template)}
                        >
                          <div className="flex items-center gap-2 w-full">
                            <Check
                              className={cn(
                                "h-4 w-4",
                                selectedTemplate?.id === template.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{template.name}</p>
                              <p className="text-xs text-muted-foreground truncate">
                                {template.template_content.substring(0, 50)}...
                              </p>
                            </div>
                            <Badge variant="secondary" className="text-xs">
                              {template.usage_count}
                            </Badge>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  ))}
                </ScrollArea>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Quick template shortcuts */}
      {filteredTemplates.length > 0 && !open && (
        <div className="flex flex-wrap gap-1">
          {filteredTemplates.slice(0, 3).map(template => (
            <Button
              key={template.id}
              variant="ghost"
              size="sm"
              onClick={() => handleSelectTemplate(template)}
              className="text-xs h-6 px-2"
            >
              {template.name}
            </Button>
          ))}
          {filteredTemplates.length > 3 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setOpen(true)}
              className="text-xs h-6 px-2 text-muted-foreground"
            >
              +{filteredTemplates.length - 3} more
            </Button>
          )}
        </div>
      )}
    </div>
  )
}