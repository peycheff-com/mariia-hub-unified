import React, { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { enUS, pl } from 'date-fns/locale'
import {
  MessageSquare,
  Smartphone,
  Mail,
  Send,
  Archive,
  Trash2,
  Flag,
  Search,
  Filter,
  Plus,
  Clock,
  CheckCircle,
  X,
  User,
  Users,
  Calendar,
  Tag,
  RefreshCw,
  Settings
} from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/hooks/use-toast aria-live="polite" aria-atomic="true"'
import { useMessaging, type MessageThreadWithDetails, type MessagingFilters } from '@/hooks/useMessaging'
import { ConversationView } from '@/components/messaging/ConversationView'
import { MessageComposer } from '@/components/messaging/MessageComposer'
import { TemplateSelector } from '@/components/messaging/TemplateSelector'
import { cn } from '@/lib/utils'


interface UnifiedInboxProps {
  className?: string
}

export const UnifiedInbox: React.FC<UnifiedInboxProps> = ({ className }) => {
  const { t, i18n } = useTranslation()
  const locale = i18n.language === 'pl' ? pl : enUS
  const { toast aria-live="polite" aria-atomic="true" } = useToast()

  // Messaging state
  const {
    threads,
    selectedThread,
    messages,
    templates,
    stats,
    loading,
    messagesLoading,
    filters,
    setFilters,
    setSelectedThread,
    sendMessage,
    createThread,
    updateThreadStatus,
    refetch
  } = useMessaging()

  // UI state
  const [searchQuery, setSearchQuery] = useState('')
  const [showNewConversationDialog, setShowNewConversationDialog] = useState(false)
  const [showAssignDialog, setShowAssignDialog] = useState(false)
  const [selectedThreads, setSelectedThreads] = useState<string[]>([])
  const [newConversationData, setNewConversationData] = useState({
    clientId: '',
    channel: 'whatsapp' as 'email' | 'sms' | 'whatsapp' | 'in-app',
    subject: '',
    initialMessage: ''
  })
  const [assignedTo, setAssignedTo] = useState<string | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)

  // Update filters when search changes
  useEffect(() => {
    setFilters(prev => ({
      ...prev,
      search: searchQuery
    }))
  }, [searchQuery, setFilters])

  // Get channel icon
  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'email':
        return <Mail className="h-4 w-4 text-purple-600" />
      case 'sms':
        return <Smartphone className="h-4 w-4 text-blue-600" />
      case 'whatsapp':
        return <MessageSquare className="h-4 w-4 text-green-600" />
      case 'in-app':
        return <MessageSquare className="h-4 w-4 text-gray-600" />
      default:
        return <MessageSquare className="h-4 w-4 text-gray-600" />
    }
  }

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-500'
      case 'high':
        return 'bg-orange-500'
      case 'normal':
        return 'bg-blue-500'
      case 'low':
        return 'bg-gray-500'
      default:
        return 'bg-gray-500'
    }
  }

  // Handle sending message
  const handleSendMessage = async (content: string, files?: File[]) => {
    if (!selectedThread) return

    try {
      await sendMessage(selectedThread.id, content, 'text', files, selectedTemplate || undefined)
      setSelectedTemplate(null)
    } catch (error) {
      console.error('Failed to send message:', error)
    }
  }

  // Handle creating new thread
  const handleCreateThread = async () => {
    if (!newConversationData.clientId) {
      toast aria-live="polite" aria-atomic="true"({
        title: t('error', 'Error'),
        description: t('select_client', 'Please select a client'),
        variant: 'destructive'
      })
      return
    }

    try {
      await createThread(
        newConversationData.clientId,
        newConversationData.channel,
        newConversationData.subject,
        newConversationData.initialMessage
      )

      setShowNewConversationDialog(false)
      setNewConversationData({
        clientId: '',
        channel: 'whatsapp',
        subject: '',
        initialMessage: ''
      })

      toast aria-live="polite" aria-atomic="true"({
        title: t('success', 'Success'),
        description: t('conversation_created', 'Conversation created successfully')
      })
    } catch (error) {
      console.error('Failed to create thread:', error)
    }
  }

  // Handle thread selection
  const handleThreadSelect = (thread: MessageThreadWithDetails) => {
    setSelectedThread(thread)
    setSelectedThreads([])
  }

  // Handle bulk actions
  const handleSelectAll = () => {
    if (selectedThreads.length === threads.length) {
      setSelectedThreads([])
    } else {
      setSelectedThreads(threads.map(t => t.id))
    }
  }

  const handleBulkArchive = async () => {
    try {
      for (const threadId of selectedThreads) {
        await updateThreadStatus(threadId, 'archived')
      }
      setSelectedThreads([])
      toast aria-live="polite" aria-atomic="true"({
        title: t('success', 'Success'),
        description: t('threads_archived', 'Threads archived successfully')
      })
    } catch (error) {
      console.error('Failed to archive threads:', error)
    }
  }

  const handleBulkAssign = async () => {
    if (!assignedTo) return

    try {
      for (const threadId of selectedThreads) {
        await updateThreadStatus(threadId, 'open', assignedTo)
      }
      setSelectedThreads([])
      setShowAssignDialog(false)
      setAssignedTo(null)
      toast aria-live="polite" aria-atomic="true"({
        title: t('success', 'Success'),
        description: t('threads_assigned', 'Threads assigned successfully')
      })
    } catch (error) {
      console.error('Failed to assign threads:', error)
    }
  }

  // Filter tabs
  const filterTabs = [
    { id: 'all', label: t('all', 'All'), count: stats?.totalThreads || 0 },
    { id: 'open', label: t('open', 'Open'), count: stats?.openThreads || 0 },
    { id: 'unread', label: t('unread', 'Unread'), count: stats?.unreadMessages || 0 }
  ]

  return (
    <div className={cn("h-full flex", className)}>
      {/* Conversations List */}
      <div className="w-96 border-r bg-background">
        {/* Header */}
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">{t('inbox', 'Inbox')}</h2>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={refetch}>
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button size="sm" onClick={() => setShowNewConversationDialog(true)}>
                <Plus className="h-4 w-4 mr-1" />
                {t('new', 'New')}
              </Button>
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder={t('search_conversations', 'Search conversations...')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2 mb-3">
            <Select
              value={filters.status[0] || 'all'}
              onValueChange={(value) => setFilters(prev => ({
                ...prev,
                status: value === 'all' ? ['open', 'closed', 'archived'] : [value as any]
              }))}
            >
              <SelectTrigger className="flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('all_status', 'All Status')}</SelectItem>
                <SelectItem value="open">{t('open', 'Open')}</SelectItem>
                <SelectItem value="closed">{t('closed', 'Closed')}</SelectItem>
                <SelectItem value="archived">{t('archived', 'Archived')}</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.channels[0] || 'all'}
              onValueChange={(value) => setFilters(prev => ({
                ...prev,
                channels: value === 'all' ? ['email', 'sms', 'whatsapp', 'in-app'] : [value as any]
              }))}
            >
              <SelectTrigger className="flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('all_channels', 'All Channels')}</SelectItem>
                <SelectItem value="email">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email
                  </div>
                </SelectItem>
                <SelectItem value="sms">
                  <div className="flex items-center gap-2">
                    <Smartphone className="h-4 w-4" />
                    SMS
                  </div>
                </SelectItem>
                <SelectItem value="whatsapp">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    WhatsApp
                  </div>
                </SelectItem>
                <SelectItem value="in-app">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    In-App
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Quick stats */}
          {stats && (
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full" />
                <span>{stats.openThreads} {t('open', 'Open')}</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-gray-500 rounded-full" />
                <span>{stats.closedThreads} {t('closed', 'Closed')}</span>
              </div>
            </div>
          )}
        </div>

        {/* Conversations List */}
        <ScrollArea className="flex-1">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : threads.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>{t('no_conversations', 'No conversations found')}</p>
            </div>
          ) : (
            <>
              {/* Bulk actions */}
              {selectedThreads.length > 0 && (
                <div className="p-2 bg-muted/50 border-b">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      {selectedThreads.length} {t('selected', 'selected')}
                    </span>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" onClick={() => setShowAssignDialog(true)}>
                        <User className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={handleBulkArchive}>
                        <Archive className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Thread list */}
              <div className="divide-y">
                {threads.map((thread) => (
                  <div
                    key={thread.id}
                    className={cn(
                      "p-4 hover:bg-muted/50 cursor-pointer transition-colors",
                      selectedThread?.id === thread.id && "bg-muted",
                      selectedThreads.includes(thread.id) && "bg-primary/5"
                    )}
                    onClick={() => handleThreadSelect(thread)}
                  >
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={selectedThreads.includes(thread.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedThreads(prev => [...prev, thread.id])
                          } else {
                            setSelectedThreads(prev => prev.filter(id => id !== thread.id))
                          }
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />

                      <Avatar className="h-10 w-10 mt-0.5">
                        <AvatarImage src={thread.client?.avatar_url || undefined} />
                        <AvatarFallback>
                          {thread.client?.full_name?.charAt(0) || 'C'}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-semibold truncate">
                            {thread.client?.full_name || 'Unknown Client'}
                          </p>
                          <div className="flex items-center gap-1">
                            <div className={cn(
                              "w-2 h-2 rounded-full",
                              getPriorityColor(thread.priority)
                            )} />
                            <span className="text-xs text-muted-foreground">
                              {thread.last_message_at &&
                                format(new Date(thread.last_message_at), 'HH:mm', { locale })
                              }
                            </span>
                          </div>
                        </div>

                        {thread.subject && (
                          <p className="text-sm font-medium text-muted-foreground mb-1 truncate">
                            {thread.subject}
                          </p>
                        )}

                        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                          {thread.last_message?.content || t('no_messages', 'No messages')}
                        </p>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {getChannelIcon(thread.channel)}
                            <Badge variant={thread.status === 'open' ? 'default' : 'secondary'} className="text-xs">
                              {t(thread.status, thread.status)}
                            </Badge>
                            {thread.unread_count && thread.unread_count > 0 && (
                              <Badge variant="destructive" className="text-xs">
                                {thread.unread_count}
                              </Badge>
                            )}
                          </div>

                          {thread.assigned_user && (
                            <Avatar className="h-5 w-5">
                              <AvatarImage src={thread.assigned_user.avatar_url || undefined} />
                              <AvatarFallback className="text-xs">
                                {thread.assigned_user.full_name?.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                          )}
                        </div>

                        {thread.tags && thread.tags.length > 0 && (
                          <div className="flex items-center gap-1 mt-2">
                            {thread.tags.slice(0, 2).map(tag => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                            {thread.tags.length > 2 && (
                              <span className="text-xs text-muted-foreground">
                                +{thread.tags.length - 2}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </ScrollArea>
      </div>

      {/* Message View */}
      <div className="flex-1 flex flex-col">
        <ConversationView
          thread={selectedThread}
          messages={messages}
          loading={messagesLoading}
          className="flex-1"
        />

        {selectedThread && (
          <>
            {/* Template Selector */}
            <div className="border-t p-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <TemplateSelector
                templates={templates.filter(t => t.channel === selectedThread.channel)}
                channel={selectedThread.channel}
                onSelect={(template) => setSelectedTemplate(template.id)}
                placeholder={t('select_template', 'Select a template...')}
              />
            </div>

            {/* Message Composer */}
            <MessageComposer
              onSendMessage={handleSendMessage}
              disabled={messagesLoading}
              placeholder={t('type_message', 'Type a message...')}
            />
          </>
        )}
      </div>

      {/* New Conversation Dialog */}
      <Dialog open={showNewConversationDialog} onOpenChange={setShowNewConversationDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('new_conversation', 'New Conversation')}</DialogTitle>
            <DialogDescription>
              {t('start_new_conversation', 'Start a new conversation with a client')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="client">{t('client', 'Client')}</Label>
              <Select value={newConversationData.clientId} onValueChange={(value) =>
                setNewConversationData(prev => ({ ...prev, clientId: value }))
              }>
                <SelectTrigger>
                  <SelectValue placeholder={t('select_client', 'Select client...')} />
                </SelectTrigger>
                <SelectContent>
                  {/* NOTE: Client data loading pending - requires database integration */}
                  {/* TODO: Load clients from database with proper error handling */}
                  <SelectItem value="demo">Demo Client</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="channel">{t('channel', 'Channel')}</Label>
              <Select value={newConversationData.channel} onValueChange={(value: any) =>
                setNewConversationData(prev => ({ ...prev, channel: value }))
              }>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email
                    </div>
                  </SelectItem>
                  <SelectItem value="sms">
                    <div className="flex items-center gap-2">
                      <Smartphone className="h-4 w-4" />
                      SMS
                    </div>
                  </SelectItem>
                  <SelectItem value="whatsapp">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      WhatsApp
                    </div>
                  </SelectItem>
                  <SelectItem value="in-app">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      In-App
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="subject">{t('subject', 'Subject')} (optional)</Label>
              <Input
                id="subject"
                value={newConversationData.subject}
                onChange={(e) => setNewConversationData(prev => ({ ...prev, subject: e.target.value }))}
                placeholder={t('conversation_subject', 'Conversation subject...')}
              />
            </div>

            <div>
              <Label htmlFor="message">{t('initial_message', 'Initial Message')}</Label>
              <Textarea
                id="message"
                value={newConversationData.initialMessage}
                onChange={(e) => setNewConversationData(prev => ({ ...prev, initialMessage: e.target.value }))}
                placeholder={t('type_first_message', 'Type the first message...')}
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowNewConversationDialog(false)}>
                {t('cancel', 'Cancel')}
              </Button>
              <Button onClick={handleCreateThread}>
                {t('create', 'Create')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Assign Dialog */}
      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('assign_conversations', 'Assign Conversations')}</DialogTitle>
            <DialogDescription>
              {t('assign_selected_conversations', 'Assign selected conversations to a team member')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>{t('assign_to', 'Assign to')}</Label>
              <Select value={assignedTo || ''} onValueChange={setAssignedTo}>
                <SelectTrigger>
                  <SelectValue placeholder={t('select_team_member', 'Select team member...')} />
                </SelectTrigger>
                <SelectContent>
                  {/* NOTE: Team member data loading pending - requires database integration */}
                  {/* TODO: Load team members from database with proper error handling */}
                  <SelectItem value="user1">John Doe</SelectItem>
                  <SelectItem value="user2">Jane Smith</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowAssignDialog(false)}>
                {t('cancel', 'Cancel')}
              </Button>
              <Button onClick={handleBulkAssign} disabled={!assignedTo}>
                {t('assign', 'Assign')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}