import React, { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { enUS, pl } from 'date-fns/locale'
import {
  MessageSquare,
  Send,
  Phone,
  Clock,
  CheckCircle,
  AlertCircle,
  Search,
  Filter,
  Plus,
  Settings,
  Bot,
  User,
  Archive,
  Trash2,
  Reply,
  Forward,
  MoreVertical,
  Paperclip,
  Image,
  FileText,
  Smile,
  PhoneCall,
  Video,
  MapPin,
  Calendar,
  Tag,
  Zap,
  BarChart3,
  Users,
  MessageCircle,
  TrendingUp,
  Activity
} from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { getWhatsAppService } from '@/services/whatsappService'

import type { MessageThreadWithDetails, MessageWithSender } from '@/hooks/useMessaging'

interface WhatsAppInboxProps {
  className?: string
}

interface QuickReply {
  id: string
  keywords: string[]
  response: string
  category: string
  isActive: boolean
  usageCount: number
}

interface WhatsAppAnalytics {
  totalSent: number
  totalFailed: number
  byType: {
    template: number
    text: number
    image: number
  }
  byTemplate: Record<string, number>
  optOutRate: number
}

export const WhatsAppInbox: React.FC<WhatsAppInboxProps> = ({ className }) => {
  const { t, i18n } = useTranslation()
  const locale = i18n.language === 'pl' ? pl : enUS
  const { toast } = useToast()
  const whatsappService = getWhatsAppService()

  // State
  const [threads, setThreads] = useState<MessageThreadWithDetails[]>([])
  const [selectedThread, setSelectedThread] = useState<MessageThreadWithDetails | null>(null)
  const [messages, setMessages] = useState<MessageWithSender[]>([])
  const [loading, setLoading] = useState(true)
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [messageInput, setMessageInput] = useState('')
  const [showNewMessageDialog, setShowNewMessageDialog] = useState(false)
  const [showQuickReplyDialog, setShowQuickReplyDialog] = useState(false)
  const [showAnalyticsDialog, setShowAnalyticsDialog] = useState(false)
  const [showSettingsDialog, setShowSettingsDialog] = useState(false)
  const [newMessageData, setNewMessageData] = useState({
    to: '',
    message: ''
  })
  const [selectedQuickReplies, setSelectedQuickReplies] = useState<string[]>([])
  const [analytics, setAnalytics] = useState<WhatsAppAnalytics | null>(null)
  const [autoReplyEnabled, setAutoReplyEnabled] = useState(true)
  const [businessHours, setBusinessHours] = useState({
    start: '09:00',
    end: '21:00',
    enabled: true
  })
  const [quickReplies, setQuickReplies] = useState<QuickReply[]>([])

  // Load threads
  useEffect(() => {
    loadThreads()
    loadQuickReplies()
    loadAnalytics()
  }, [])

  // Load messages when thread is selected
  useEffect(() => {
    if (selectedThread) {
      loadMessages(selectedThread.id)
    }
  }, [selectedThread])

  const loadThreads = async () => {
    try {
      setLoading(true)
      // This would use the existing messaging hook filtered for WhatsApp
      // For now, using mock data
      const mockThreads: MessageThreadWithDetails[] = [
        {
          id: '1',
          client_id: 'client1',
          channel: 'whatsapp',
          client: {
            id: 'client1',
            full_name: 'Anna Kowalska',
            phone: '+48500123456',
            avatar_url: null
          },
          status: 'open',
          last_message_at: new Date().toISOString(),
          last_message: {
            id: 'msg1',
            content: 'Dzień dobry, czy mogę umówić się na wizytę?',
            message_type: 'text',
            direction: 'inbound',
            sent_at: new Date().toISOString()
          },
          unread_count: 1,
          priority: 'normal'
        },
        {
          id: '2',
          client_id: 'client2',
          channel: 'whatsapp',
          client: {
            id: 'client2',
            full_name: 'Piotr Nowak',
            phone: '+48500987654',
            avatar_url: null
          },
          status: 'closed',
          last_message_at: new Date(Date.now() - 3600000).toISOString(),
          last_message: {
            id: 'msg2',
            content: 'Dziękuję, potwierdzam wizytę',
            message_type: 'text',
            direction: 'outbound',
            sent_at: new Date(Date.now() - 3600000).toISOString()
          },
          unread_count: 0,
          priority: 'normal'
        }
      ]
      setThreads(mockThreads)
    } catch (error) {
      console.error('Error loading threads:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadMessages = async (threadId: string) => {
    try {
      setMessagesLoading(true)
      // Mock messages
      const mockMessages: MessageWithSender[] = [
        {
          id: 'msg1',
          thread_id: threadId,
          content: 'Dzień dobry, czy mogę umówić się na wizytę?',
          message_type: 'text',
          direction: 'inbound',
          sent_at: new Date(Date.now() - 7200000).toISOString(),
          sender: {
            id: 'client1',
            full_name: 'Anna Kowalska',
            avatar_url: null,
            role: 'client'
          }
        },
        {
          id: 'msg2',
          thread_id: threadId,
          content: 'Dzień dobry! Oczywiście, na jaki zabieg jest Pani zainteresowana?',
          message_type: 'text',
          direction: 'outbound',
          sent_at: new Date(Date.now() - 3600000).toISOString(),
          sender: {
            id: 'admin1',
            full_name: 'Mariia Studio',
            avatar_url: null,
            role: 'admin'
          }
        },
        {
          id: 'msg3',
          thread_id: threadId,
          content: 'Chciałabym zrobić rzęsy i laminację brwi',
          message_type: 'text',
          direction: 'inbound',
          sent_at: new Date(Date.now() - 1800000).toISOString(),
          sender: {
            id: 'client1',
            full_name: 'Anna Kowalska',
            avatar_url: null,
            role: 'client'
          }
        }
      ]
      setMessages(mockMessages)
    } catch (error) {
      console.error('Error loading messages:', error)
    } finally {
      setMessagesLoading(false)
    }
  }

  const loadQuickReplies = async () => {
    try {
      // Load from database
      const mockQuickReplies: QuickReply[] = [
        {
          id: '1',
          keywords: ['cennik', 'cena', 'price'],
          response: 'Nasz cennik dostępny jest na stronie. Rzęsy: 200zł, Brwi: 150zł, Pakiet: 300zł',
          category: 'pricing',
          isActive: true,
          usageCount: 25
        },
        {
          id: '2',
          keywords: ['adres', 'gdzie', 'location'],
          response: 'Znajdujemy się przy ul. Prosta 123, Warszawa. Wejście od ul. Wilczej.',
          category: 'location',
          isActive: true,
          usageCount: 18
        }
      ]
      setQuickReplies(mockQuickReplies)
    } catch (error) {
      console.error('Error loading quick replies:', error)
    }
  }

  const loadAnalytics = async () => {
    try {
      const data = await whatsappService.getAnalytics()
      setAnalytics(data)
    } catch (error) {
      console.error('Error loading analytics:', error)
    }
  }

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedThread) return

    try {
      const result = await whatsappService.sendTextMessage(
        selectedThread.client?.phone || '',
        messageInput,
        { priority: 'normal' }
      )

      if (result.success) {
        // Add message to UI
        const newMessage: MessageWithSender = {
          id: result.messageId || 'new',
          thread_id: selectedThread.id,
          content: messageInput,
          message_type: 'text',
          direction: 'outbound',
          sent_at: new Date().toISOString(),
          sender: {
            id: 'admin1',
            full_name: 'Mariia Studio',
            avatar_url: null,
            role: 'admin'
          }
        }
        setMessages(prev => [...prev, newMessage])
        setMessageInput('')

        toast({
          title: t('success', 'Success'),
          description: t('message_sent', 'Message sent successfully')
        })
      } else {
        toast({
          title: t('error', 'Error'),
          description: result.error || t('failed_to_send', 'Failed to send message'),
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Error sending message:', error)
    }
  }

  const handleSendNewMessage = async () => {
    if (!newMessageData.to || !newMessageData.message) return

    try {
      const result = await whatsappService.sendTextMessage(
        newMessageData.to,
        newMessageData.message,
        { priority: 'normal' }
      )

      if (result.success) {
        setShowNewMessageDialog(false)
        setNewMessageData({ to: '', message: '' })
        toast({
          title: t('success', 'Success'),
          description: t('message_sent', 'Message sent successfully')
        })
      }
    } catch (error) {
      console.error('Error sending new message:', error)
    }
  }

  const handleQuickReplySelect = (reply: QuickReply) => {
    setMessageInput(reply.response)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-green-500'
      case 'closed': return 'bg-gray-500'
      case 'archived': return 'bg-yellow-500'
      default: return 'bg-gray-500'
    }
  }

  const getTimeAgo = (date: string) => {
    const now = new Date()
    const then = new Date(date)
    const diffInMinutes = Math.floor((now.getTime() - then.getTime()) / 60000)

    if (diffInMinutes < 1) return t('just_now', 'Just now')
    if (diffInMinutes < 60) return `${diffInMinutes} ${t('minutes_ago', 'minutes ago')}`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} ${t('hours_ago', 'hours ago')}`
    return format(then, 'dd MMM', { locale })
  }

  return (
    <div className={cn("h-full flex", className)}>
      {/* Threads List */}
      <div className="w-96 border-r bg-background">
        {/* Header */}
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-green-600" />
              <h2 className="text-xl font-semibold">WhatsApp</h2>
              <Badge variant="outline" className="text-xs">Beta</Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => setShowAnalyticsDialog(true)}>
                <BarChart3 className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setShowSettingsDialog(true)}>
                <Settings className="h-4 w-4" />
              </Button>
              <Button size="sm" onClick={() => setShowNewMessageDialog(true)}>
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

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span>{threads.filter(t => t.status === 'open').length} {t('open', 'Open')}</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-gray-500 rounded-full" />
              <span>{threads.filter(t => t.status === 'closed').length} {t('closed', 'Closed')}</span>
            </div>
            <div className="flex items-center gap-1">
              <Bot className="h-3 w-3" />
              <span>{autoReplyEnabled ? t('bot_on', 'Bot ON') : t('bot_off', 'Bot OFF')}</span>
            </div>
          </div>
        </div>

        {/* Threads List */}
        <ScrollArea className="flex-1">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : (
            <div className="divide-y">
              {threads.map((thread) => (
                <div
                  key={thread.id}
                  className={cn(
                    "p-4 hover:bg-muted/50 cursor-pointer transition-colors",
                    selectedThread?.id === thread.id && "bg-muted"
                  )}
                  onClick={() => setSelectedThread(thread)}
                >
                  <div className="flex items-start gap-3">
                    <div className="relative">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>
                          {thread.client?.full_name?.charAt(0) || 'C'}
                        </AvatarFallback>
                      </Avatar>
                      <div className={cn(
                        "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-background",
                        getStatusColor(thread.status)
                      )} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-semibold truncate">
                          {thread.client?.full_name || 'Unknown'}
                        </p>
                        <div className="flex items-center gap-1">
                          <Phone className="h-3 w-3 text-green-600" />
                          <span className="text-xs text-muted-foreground">
                            {getTimeAgo(thread.last_message_at || '')}
                          </span>
                        </div>
                      </div>

                      <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                        {thread.last_message?.content}
                      </p>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {thread.client?.phone}
                          </Badge>
                          {thread.unread_count && thread.unread_count > 0 && (
                            <Badge variant="destructive" className="text-xs">
                              {thread.unread_count}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Message View */}
      <div className="flex-1 flex flex-col">
        {selectedThread ? (
          <>
            {/* Thread Header */}
            <div className="p-4 border-b bg-background/95 backdrop-blur">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>
                      {selectedThread.client?.full_name?.charAt(0) || 'C'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{selectedThread.client?.full_name}</p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {selectedThread.client?.phone}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm">
                    <PhoneCall className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Video className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Archive className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              {messagesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={cn(
                        "flex",
                        message.direction === 'outbound' ? "justify-end" : "justify-start"
                      )}
                    >
                      <div className={cn(
                        "max-w-md lg:max-w-lg",
                        message.direction === 'outbound' && "order-2"
                      )}>
                        <div className={cn(
                          "rounded-lg px-4 py-2",
                          message.direction === 'outbound'
                            ? "bg-primary text-primary-foreground ml-auto"
                            : "bg-muted"
                        )}>
                          <p className="text-sm">{message.content}</p>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 px-1">
                          {format(new Date(message.sent_at), 'HH:mm', { locale })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>

            {/* Quick Replies */}
            {quickReplies.length > 0 && (
              <div className="p-4 border-t bg-muted/30">
                <div className="flex items-center gap-2 mb-2">
                  <Bot className="h-4 w-4" />
                  <span className="text-sm font-medium">{t('quick_replies', 'Quick Replies')}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {quickReplies.slice(0, 4).map((reply) => (
                    <Button
                      key={reply.id}
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuickReplySelect(reply)}
                      className="text-xs"
                    >
                      {reply.response.substring(0, 30)}...
                    </Button>
                  ))}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowQuickReplyDialog(true)}
                    className="text-xs"
                  >
                    <Settings className="h-3 w-3 mr-1" />
                    {t('manage', 'Manage')}
                  </Button>
                </div>
              </div>
            )}

            {/* Message Input */}
            <div className="p-4 border-t bg-background">
              <div className="flex items-end gap-2">
                <Button variant="ghost" size="sm">
                  <Paperclip className="h-4 w-4" />
                </Button>
                <div className="flex-1">
                  <Textarea
                    placeholder={t('type_message', 'Type a message...')}
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    className="min-h-[40px] resize-none"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleSendMessage()
                      }
                    }}
                  />
                </div>
                <Button variant="ghost" size="sm">
                  <Smile className="h-4 w-4" />
                </Button>
                <Button onClick={handleSendMessage} disabled={!messageInput.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageSquare className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
              <p className="text-lg font-medium text-muted-foreground">
                {t('select_conversation', 'Select a conversation')}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {t('choose_from_left', 'Choose a conversation from the left to start messaging')}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* New Message Dialog */}
      <Dialog open={showNewMessageDialog} onOpenChange={setShowNewMessageDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('new_message', 'New Message')}</DialogTitle>
            <DialogDescription>
              {t('send_new_whatsapp', 'Send a new WhatsApp message')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="phone">{t('phone_number', 'Phone Number')}</Label>
              <Input
                id="phone"
                placeholder="+48500123456"
                value={newMessageData.to}
                onChange={(e) => setNewMessageData(prev => ({ ...prev, to: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="message">{t('message', 'Message')}</Label>
              <Textarea
                id="message"
                placeholder={t('type_message', 'Type a message...')}
                value={newMessageData.message}
                onChange={(e) => setNewMessageData(prev => ({ ...prev, message: e.target.value }))}
                rows={4}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowNewMessageDialog(false)}>
                {t('cancel', 'Cancel')}
              </Button>
              <Button onClick={handleSendNewMessage}>
                <Send className="h-4 w-4 mr-2" />
                {t('send', 'Send')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Quick Replies Management Dialog */}
      <Dialog open={showQuickReplyDialog} onOpenChange={setShowQuickReplyDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('quick_replies', 'Quick Replies')}</DialogTitle>
            <DialogDescription>
              {t('manage_quick_replies', 'Manage quick reply templates for common questions')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-medium">{t('active_replies', 'Active Replies')}</h3>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-1" />
                {t('add_reply', 'Add Reply')}
              </Button>
            </div>
            <div className="space-y-2">
              {quickReplies.map((reply) => (
                <Card key={reply.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline">{reply.category}</Badge>
                          <span className="text-xs text-muted-foreground">
                            {reply.usageCount} {t('uses', 'uses')}
                          </span>
                        </div>
                        <p className="text-sm font-medium mb-1">{reply.response}</p>
                        <p className="text-xs text-muted-foreground">
                          {t('keywords', 'Keywords')}: {reply.keywords.join(', ')}
                        </p>
                      </div>
                      <Switch checked={reply.isActive} />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Analytics Dialog */}
      <Dialog open={showAnalyticsDialog} onOpenChange={setShowAnalyticsDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{t('whatsapp_analytics', 'WhatsApp Analytics')}</DialogTitle>
          </DialogHeader>

          {analytics && (
            <Tabs defaultValue="overview" className="w-full">
              <TabsList>
                <TabsTrigger value="overview">{t('overview', 'Overview')}</TabsTrigger>
                <TabsTrigger value="templates">{t('templates', 'Templates')}</TabsTrigger>
                <TabsTrigger value="activity">{t('activity', 'Activity')}</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-4 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">{t('total_sent', 'Total Sent')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{analytics.totalSent}</div>
                      <TrendingUp className="h-4 w-4 text-green-600 mt-1" />
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">{t('total_failed', 'Total Failed')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-red-600">{analytics.totalFailed}</div>
                      <AlertCircle className="h-4 w-4 text-red-600 mt-1" />
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">{t('success_rate', 'Success Rate')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-600">
                        {analytics.totalSent > 0
                          ? Math.round((analytics.totalSent / (analytics.totalSent + analytics.totalFailed)) * 100)
                          : 0}%
                      </div>
                      <CheckCircle className="h-4 w-4 text-green-600 mt-1" />
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">{t('opt_out_rate', 'Opt-out Rate')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{analytics.optOutRate}%</div>
                      <Users className="h-4 w-4 text-muted-foreground mt-1" />
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="templates" className="space-y-4">
                <h3 className="text-sm font-medium">{t('template_usage', 'Template Usage')}</h3>
                <div className="space-y-2">
                  {Object.entries(analytics.byTemplate).map(([template, count]) => (
                    <div key={template} className="flex items-center justify-between p-3 border rounded-lg">
                      <span className="font-medium">{template}</span>
                      <Badge variant="secondary">{count} {t('uses', 'uses')}</Badge>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="activity" className="space-y-4">
                <h3 className="text-sm font-medium">{t('message_types', 'Message Types')}</h3>
                <div className="grid grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <MessageCircle className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                      <div className="text-lg font-bold">{analytics.byType.template}</div>
                      <p className="text-sm text-muted-foreground">{t('templates', 'Templates')}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <MessageSquare className="h-8 w-8 mx-auto mb-2 text-green-600" />
                      <div className="text-lg font-bold">{analytics.byType.text}</div>
                      <p className="text-sm text-muted-foreground">{t('text_messages', 'Text Messages')}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <Image className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                      <div className="text-lg font-bold">{analytics.byType.image}</div>
                      <p className="text-sm text-muted-foreground">{t('images', 'Images')}</p>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('whatsapp_settings', 'WhatsApp Settings')}</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">{t('auto_reply', 'Auto Reply')}</Label>
                <p className="text-xs text-muted-foreground">
                  {t('auto_reply_desc', 'Enable automatic replies to common questions')}
                </p>
              </div>
              <Switch checked={autoReplyEnabled} onCheckedChange={setAutoReplyEnabled} />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">{t('business_hours', 'Business Hours')}</Label>
                <p className="text-xs text-muted-foreground">
                  {t('business_hours_desc', 'Only send messages during business hours')}
                </p>
              </div>
              <Switch checked={businessHours.enabled} onCheckedChange={(checked) =>
                setBusinessHours(prev => ({ ...prev, enabled: checked }))
              } />
            </div>

            {businessHours.enabled && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{t('start_time', 'Start Time')}</Label>
                  <Input
                    type="time"
                    value={businessHours.start}
                    onChange={(e) => setBusinessHours(prev => ({ ...prev, start: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>{t('end_time', 'End Time')}</Label>
                  <Input
                    type="time"
                    value={businessHours.end}
                    onChange={(e) => setBusinessHours(prev => ({ ...prev, end: e.target.value }))}
                  />
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}