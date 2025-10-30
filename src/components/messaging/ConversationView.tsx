import React, { useState, useRef, useEffect } from 'react'
import { format } from 'date-fns'
import { enUS, pl } from 'date-fns/locale'
import {
  Download,
  Image as ImageIcon,
  File,
  Play,
  Check,
  CheckCheck,
  Clock,
  AlertCircle
} from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { LazyImage } from '@/components/ui/lazy-image'

import type { MessageWithSender, MessageThreadWithDetails } from '@/hooks/useMessaging'

interface ConversationViewProps {
  thread: MessageThreadWithDetails | null
  messages: MessageWithSender[]
  loading: boolean
  className?: string
}

interface MessageBubbleProps {
  message: MessageWithSender
  isOwn: boolean
  showAvatar?: boolean
  showTimestamp?: boolean
}

const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isOwn,
  showAvatar = true,
  showTimestamp = true
}) => {
  const { t, i18n } = useTranslation()
  const locale = i18n.language === 'pl' ? pl : enUS

  const getStatusIcon = () => {
    if (message.direction === 'inbound') return null

    switch (message.delivery_status) {
      case 'sent':
        return <Check className="h-3 w-3 text-gray-400" />
      case 'delivered':
        return <CheckCheck className="h-3 w-3 text-gray-400" />
      case 'read':
        return <CheckCheck className="h-3 w-3 text-blue-500" />
      case 'failed':
        return <AlertCircle className="h-3 w-3 text-red-500" />
      case 'pending':
        return <Clock className="h-3 w-3 text-yellow-500" />
      default:
        return null
    }
  }

  const formatMessageTime = (date: string) => {
    return format(new Date(date), 'HH:mm', { locale })
  }

  const renderAttachment = (attachment: any) => {
    const isImage = attachment.file_type?.startsWith('image/')
    const isVideo = attachment.file_type?.startsWith('video/')

    if (isImage) {
      return (
        <div className="relative group">
          <LazyImage
            src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/communications/${attachment.storage_path}`}
            alt={attachment.original_filename}
            className="max-w-sm rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => window.open(
              `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/communications/${attachment.storage_path}`,
              '_blank'
            )}
          />
          <div className="absolute bottom-2 right-2 bg-black/50 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
            <ImageIcon className="h-4 w-4" alt="" />
          </div>
        </div>
      )
    }

    if (isVideo) {
      return (
        <div className="relative group">
          <video
            controls
            className="max-w-sm rounded-lg"
            poster={attachment.thumbnail_path ?
              `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/communications/${attachment.thumbnail_path}` :
              undefined
            }
          >
            <source
              src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/communications/${attachment.storage_path}`}
              type={attachment.file_type}
            />
          </video>
        </div>
      )
    }

    return (
      <div className="flex items-center gap-2 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg max-w-sm">
        <File className="h-5 w-5 text-gray-500" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{attachment.original_filename}</p>
          <p className="text-xs text-gray-500">
            {attachment.file_size && `${(attachment.file_size / 1024 / 1024).toFixed(2)} MB`}
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            const link = document.createElement('a')
            link.href = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/communications/${attachment.storage_path}`
            link.download = attachment.original_filename
            link.click()
          }}
        >
          <Download className="h-4 w-4" />
        </Button>
      </div>
    )
  }

  return (
    <div className={cn(
      "flex gap-3 mb-4",
      isOwn && "flex-row-reverse"
    )}>
      {showAvatar && !isOwn && (
        <Avatar className="h-8 w-8 mt-1">
          <AvatarImage src={message.sender?.avatar_url || undefined} />
          <AvatarFallback className="text-xs">
            {message.sender?.full_name?.charAt(0) || 'U'}
          </AvatarFallback>
        </Avatar>
      )}

      <div className={cn(
        "flex flex-col max-w-[70%]",
        isOwn && "items-end"
      )}>
        {!isOwn && message.sender?.full_name && (
          <p className="text-xs text-gray-500 mb-1 px-1">
            {message.sender.full_name}
            {message.sender.role === 'admin' && (
              <Badge variant="secondary" className="ml-1 text-xs">
                {t('admin', 'Admin')}
              </Badge>
            )}
          </p>
        )}

        {message.attachments && message.attachments.length > 0 && (
          <div className="space-y-2 mb-2">
            {message.attachments.map((attachment, index) => (
              <div key={attachment.id}>
                {renderAttachment(attachment)}
              </div>
            ))}
          </div>
        )}

        {message.content && (
          <div className={cn(
            "rounded-2xl px-4 py-2 break-words",
            isOwn
              ? "bg-primary text-primary-foreground rounded-br-sm"
              : "bg-muted rounded-bl-sm"
          )}>
            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
          </div>
        )}

        {showTimestamp && (
          <div className={cn(
            "flex items-center gap-1 mt-1 px-1",
            isOwn && "flex-row-reverse"
          )}>
            <span className="text-xs text-gray-500">
              {formatMessageTime(message.sent_at)}
            </span>
            {getStatusIcon()}
          </div>
        )}
      </div>
    </div>
  )
}

export const ConversationView: React.FC<ConversationViewProps> = ({
  thread,
  messages,
  loading,
  className
}) => {
  const { t, i18n } = useTranslation()
  const locale = i18n.language === 'pl' ? pl : enUS
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const [autoScroll, setAutoScroll] = useState(true)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (autoScroll && scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]')
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight
      }
    }
  }, [messages, autoScroll])

  // Check if user is scrolling up
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const element = e.currentTarget
    const isAtBottom = element.scrollHeight - element.scrollTop <= element.clientHeight + 100
    setAutoScroll(isAtBottom)
  }

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'email':
        return '📧'
      case 'sms':
        return '💬'
      case 'whatsapp':
        return '📱'
      case 'in-app':
        return '🔔'
      default:
        return '💭'
    }
  }

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

  if (!thread) {
    return (
      <div className={cn(
        "flex items-center justify-center h-full text-gray-500",
        className
      )}>
        <div className="text-center">
          <div className="text-6xl mb-4">💬</div>
          <p className="text-lg font-medium">{t('select_conversation', 'Select a conversation')}</p>
          <p className="text-sm mt-2">{t('choose_conversation_to_start', 'Choose a conversation from the list to start messaging')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={thread.client?.avatar_url || undefined} />
            <AvatarFallback>
              {thread.client?.full_name?.charAt(0) || 'C'}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-semibold">{thread.client?.full_name || 'Unknown Client'}</h3>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span>{getChannelIcon(thread.channel)}</span>
              <span className="capitalize">{thread.channel}</span>
              {thread.subject && (
                <>
                  <span>•</span>
                  <span className="truncate max-w-xs">{thread.subject}</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className={cn(
            "w-2 h-2 rounded-full",
            getPriorityColor(thread.priority)
          )} />
          <Badge variant={thread.status === 'open' ? 'default' : 'secondary'}>
            {t(thread.status, thread.status)}
          </Badge>
          {thread.assigned_user && (
            <Avatar className="h-6 w-6">
              <AvatarImage src={thread.assigned_user.avatar_url || undefined} />
              <AvatarFallback className="text-xs">
                {thread.assigned_user.full_name?.charAt(0)}
              </AvatarFallback>
            </Avatar>
          )}
        </div>
      </div>

      {/* Messages */}
      <ScrollArea
        ref={scrollAreaRef}
        className="flex-1 p-4"
        onScroll={handleScroll}
      >
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : (
          <>
            {/* Date separators */}
            {messages.map((message, index) => {
              const prevMessage = messages[index - 1]
              const showDateSeparator = !prevMessage ||
                new Date(message.sent_at).toDateString() !== new Date(prevMessage.sent_at).toDateString()

              return (
                <React.Fragment key={message.id}>
                  {showDateSeparator && (
                    <div className="flex items-center justify-center my-4">
                      <Separator className="flex-1" />
                      <span className="px-3 text-xs text-gray-500 bg-background">
                        {format(new Date(message.sent_at), 'PPP', { locale })}
                      </span>
                      <Separator className="flex-1" />
                    </div>
                  )}

                  <MessageBubble
                    message={message}
                    isOwn={message.direction === 'outbound'}
                    showAvatar={message.direction === 'inbound' && (
                      !messages[index + 1] ||
                      messages[index + 1].direction === 'outbound' ||
                      new Date(messages[index + 1].sent_at).getTime() - new Date(message.sent_at).getTime() > 300000
                    )}
                    showTimestamp={
                      !messages[index + 1] ||
                      messages[index + 1].direction !== message.direction ||
                      new Date(messages[index + 1].sent_at).getTime() - new Date(message.sent_at).getTime() > 300000
                    }
                  />
                </React.Fragment>
              )
            })}

            {messages.length === 0 && (
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center">
                  <p className="text-sm">{t('no_messages_yet', 'No messages yet')}</p>
                  <p className="text-xs mt-1">{t('start_conversation', 'Start a conversation')}</p>
                </div>
              </div>
            )}
          </>
        )}
      </ScrollArea>

      {/* Typing indicator placeholder */}
      <div className="p-4 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="text-xs text-gray-500 text-center">
          {thread.client?.email && (
            <span>📧 {thread.client.email}</span>
          )}
          {thread.client?.phone && (
            <>
              {thread.client?.email && <span className="mx-2">•</span>}
              <span>📱 {thread.client.phone}</span>
            </>
          )}
        </div>
      </div>
    </div>
  )
}