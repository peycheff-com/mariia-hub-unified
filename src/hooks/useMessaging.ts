import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/integrations/supabase/client'
import type {
  Database,
  MessageThread,
  Message,
  CommunicationTemplate,
  Campaign
} from '@/integrations/supabase/types'
import { useToast } from '@/hooks/use-toast'

type Tables = Database['public']['Tables']

export interface MessageThreadWithDetails extends Tables['message_threads']['Row'] {
  client?: {
    id: string
    full_name: string | null
    email: string | null
    phone: string | null
    avatar_url: string | null
  }
  assigned_user?: {
    id: string
    full_name: string | null
    avatar_url: string | null
  }
  message_count?: number
  unread_count?: number
  last_message?: Tables['messages']['Row']
}

export interface MessageWithSender extends Tables['messages']['Row'] {
  sender?: {
    id: string
    full_name: string | null
    avatar_url: string | null
    role: string | null
  }
  attachments?: Tables['message_attachments']['Row'][]
}

export interface MessagingFilters {
  channels: ('email' | 'sms' | 'whatsapp' | 'in-app')[]
  status: ('open' | 'closed' | 'archived' | 'spam')[]
  assignedTo?: string | null
  priority?: ('low' | 'normal' | 'high' | 'urgent')[]
  tags?: string[]
  dateRange?: {
    start: Date
    end: Date
  }
  search?: string
}

export interface MessagingStats {
  totalThreads: number
  openThreads: number
  closedThreads: number
  unreadMessages: number
  averageResponseTime: number
  channelStats: {
    email: number
    sms: number
    whatsapp: number
    in_app: number
  }
}

export function useMessaging() {
  const [threads, setThreads] = useState<MessageThreadWithDetails[]>([])
  const [selectedThread, setSelectedThread] = useState<MessageThreadWithDetails | null>(null)
  const [messages, setMessages] = useState<MessageWithSender[]>([])
  const [templates, setTemplates] = useState<CommunicationTemplate[]>([])
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [filters, setFilters] = useState<MessagingFilters>({
    channels: ['email', 'sms', 'whatsapp', 'in-app'],
    status: ['open'],
    priority: undefined,
    tags: [],
    search: ''
  })
  const [stats, setStats] = useState<MessagingStats | null>(null)
    const { toast } = useToast()

  // Fetch message threads with filters
  const fetchThreads = useCallback(async () => {
    try {
      setLoading(true)

      let query = supabase
        .from('message_threads')
        .select(`
          *,
          client:profiles!message_threads_client_id_fkey (
            id,
            full_name,
            email,
            phone,
            avatar_url
          ),
          assigned_user:profiles!message_threads_assigned_to_fkey (
            id,
            full_name,
            avatar_url
          )
        `)
        .in('channel', filters.channels)
        .in('status', filters.status)

      if (filters.assignedTo !== undefined) {
        if (filters.assignedTo === 'unassigned') {
          query = query.is('assigned_to', null)
        } else {
          query = query.eq('assigned_to', filters.assignedTo)
        }
      }

      if (filters.priority && filters.priority.length > 0) {
        query = query.in('priority', filters.priority)
      }

      if (filters.tags && filters.tags.length > 0) {
        query = query.contains('tags', filters.tags)
      }

      if (filters.dateRange) {
        query = query
          .gte('created_at', filters.dateRange.start.toISOString())
          .lte('created_at', filters.dateRange.end.toISOString())
      }

      if (filters.search) {
        query = query.or(`subject.ilike.%${filters.search}%,client.full_name.ilike.%${filters.search}%`)
      }

      const { data, error } = await query
        .order('last_message_at', { ascending: false })

      if (error) throw error

      // Fetch message counts for each thread
      const threadsWithCounts = await Promise.all(
        (data || []).map(async (thread) => {
          const { count: messageCount } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('thread_id', thread.id)

          const { count: unreadCount } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('thread_id', thread.id)
            .is('read_at', null)
            .eq('direction', 'inbound')

          // Get last message
          const { data: lastMessage } = await supabase
            .from('messages')
            .select('*')
            .eq('thread_id', thread.id)
            .order('sent_at', { ascending: false })
            .limit(1)
            .single()

          return {
            ...thread,
            message_count: messageCount || 0,
            unread_count: unreadCount || 0,
            last_message: lastMessage
          }
        })
      )

      setThreads(threadsWithCounts)
    } catch (error) {
      console.error('Error fetching threads:', error)
      toast({
        title: "Error",
        description: "Failed to load conversations",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }, [filters, supabase, toast])

  // Fetch messages for a specific thread
  const fetchMessages = useCallback(async (threadId: string) => {
    try {
      setMessagesLoading(true)

      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:profiles!messages_sender_id_fkey (
            id,
            full_name,
            avatar_url,
            role
          )
        `)
        .eq('thread_id', threadId)
        .order('sent_at', { ascending: true })

      if (error) throw error

      // Fetch attachments for messages
      const messagesWithAttachments = await Promise.all(
        (data || []).map(async (message) => {
          const { data: attachments } = await supabase
            .from('message_attachments')
            .select('*')
            .eq('message_id', message.id)

          return {
            ...message,
            attachments: attachments || []
          }
        })
      )

      setMessages(messagesWithAttachments)

      // Mark messages as read
      await supabase
        .from('messages')
        .update({ read_at: new Date().toISOString() })
        .eq('thread_id', threadId)
        .is('read_at', null)
        .eq('direction', 'inbound')
    } catch (error) {
      console.error('Error fetching messages:', error)
    } finally {
      setMessagesLoading(false)
    }
  }, [supabase])

  // Send a new message
  const sendMessage = useCallback(async (
    threadId: string,
    content: string,
    messageType: 'text' | 'image' | 'file' = 'text',
    attachments?: File[],
    templateId?: string
  ) => {
    try {
      let uploadedAttachments: Tables['message_attachments']['Insert'][] = []

      // Upload attachments if any
      if (attachments && attachments.length > 0) {
        for (const file of attachments) {
          const fileExt = file.name.split('.').pop()
          const fileName = `${Math.random()}.${fileExt}`
          const filePath = `message-attachments/${threadId}/${fileName}`

          const { error: uploadError } = await supabase.storage
            .from('communications')
            .upload(filePath, file)

          if (uploadError) throw uploadError

          uploadedAttachments.push({
            message_id: '', // Will be set after message creation
            filename: fileName,
            original_filename: file.name,
            file_type: file.type,
            file_size: file.size,
            storage_path: filePath
          })
        }
      }

      // Create message
      const { data: message, error: messageError } = await supabase
        .from('messages')
        .insert({
          thread_id: threadId,
          content,
          message_type: messageType,
          direction: 'outbound',
          attachments: uploadedAttachments.map(a => ({
            filename: a.filename,
            original_filename: a.original_filename,
            file_type: a.file_type,
            file_size: a.file_size
          }))
        })
        .select()
        .single()

      if (messageError) throw messageError

      // Update attachments with message ID
      if (uploadedAttachments.length > 0) {
        await Promise.all(
          uploadedAttachments.map(attachment =>
            supabase
              .from('message_attachments')
              .insert({ ...attachment, message_id: message.id })
          )
        )
      }

      // Update template usage count if template was used
      if (templateId) {
        await supabase
          .from('communication_templates')
          .update({ usage_count: supabase.rpc('increment', { x: 1 }) })
          .eq('id', templateId)
      }

      // Trigger sending based on channel
      const thread = threads.find(t => t.id === threadId)
      if (thread) {
        await sendViaChannel(thread.channel, message, thread)
      }

      // Refresh messages and threads
      await fetchMessages(threadId)
      await fetchThreads()

      return message
    } catch (error) {
      console.error('Error sending message:', error)
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive"
      })
      throw error
    }
  }, [supabase, threads, fetchMessages, fetchThreads, toast])

  // Send message via appropriate channel
  const sendViaChannel = async (
    channel: string,
    message: Tables['messages']['Row'],
    thread: MessageThreadWithDetails
  ) => {
    try {
      switch (channel) {
        case 'email':
          await sendEmail(message, thread)
          break
        case 'sms':
          await sendSMS(message, thread)
          break
        case 'whatsapp':
          await sendWhatsApp(message, thread)
          break
        case 'in-app':
          // In-app messages are stored in the database already
          await triggerInAppNotification(message, thread)
          break
      }

      // Update delivery status
      await supabase
        .from('messages')
        .update({ delivery_status: 'sent' })
        .eq('id', message.id)
    } catch (error) {
      // Update delivery status to failed
      await supabase
        .from('messages')
        .update({ delivery_status: 'failed' })
        .eq('id', message.id)
      throw error
    }
  }

  // Send email via Resend
  const sendEmail = async (message: Tables['messages']['Row'], thread: MessageThreadWithDetails) => {
    const { data: { session } } = await supabase.auth.getSession()

    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token}`
      },
      body: JSON.stringify({
        to: thread.client?.email,
        subject: thread.subject || 'Message from Beauty Studio',
        content: message.content,
        messageId: message.id
      })
    })

    if (!response.ok) {
      throw new Error('Failed to send email')
    }
  }

  // Send SMS via Twilio
  const sendSMS = async (message: Tables['messages']['Row'], thread: MessageThreadWithDetails) => {
    const { data: { session } } = await supabase.auth.getSession()

    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-sms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token}`
      },
      body: JSON.stringify({
        to: thread.client?.phone,
        message: message.content,
        messageId: message.id
      })
    })

    if (!response.ok) {
      throw new Error('Failed to send SMS')
    }
  }

  // Send WhatsApp message
  const sendWhatsApp = async (message: Tables['messages']['Row'], thread: MessageThreadWithDetails) => {
    const { data: { session } } = await supabase.auth.getSession()

    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-whatsapp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token}`
      },
      body: JSON.stringify({
        to: thread.client?.phone,
        message: message.content,
        messageId: message.id
      })
    })

    if (!response.ok) {
      throw new Error('Failed to send WhatsApp message')
    }
  }

  // Trigger in-app notification
  const triggerInAppNotification = async (
    message: Tables['messages']['Row'],
    thread: MessageThreadWithDetails
  ) => {
    if (thread.client_id) {
      await supabase
        .from('notifications')
        .insert({
          user_id: thread.client_id,
          title: 'New Message',
          body: message.content.substring(0, 100),
          type: 'message',
          metadata: {
            thread_id: thread.id,
            message_id: message.id
          }
        })
    }
  }

  // Create new thread
  const createThread = useCallback(async (
    clientId: string,
    channel: 'email' | 'sms' | 'whatsapp' | 'in-app',
    subject?: string,
    initialMessage?: string
  ) => {
    try {
      const { data, error } = await supabase
        .from('message_threads')
        .insert({
          client_id: clientId,
          channel,
          subject,
          status: 'open'
        })
        .select(`
          *,
          client:profiles!message_threads_client_id_fkey (
            id,
            full_name,
            email,
            phone,
            avatar_url
          )
        `)
        .single()

      if (error) throw error

      if (initialMessage) {
        await sendMessage(data.id, initialMessage, 'text')
      }

      await fetchThreads()
      return data
    } catch (error) {
      console.error('Error creating thread:', error)
      toast({
        title: "Error",
        description: "Failed to create conversation",
        variant: "destructive"
      })
      throw error
    }
  }, [supabase, sendMessage, fetchThreads, toast])

  // Update thread status
  const updateThreadStatus = useCallback(async (
    threadId: string,
    status: 'open' | 'closed' | 'archived' | 'spam',
    assignedTo?: string | null,
    tags?: string[]
  ) => {
    try {
      const updateData: Partial<Tables['message_threads']['Update']> = { status }

      if (assignedTo !== undefined) {
        updateData.assigned_to = assignedTo
      }

      if (tags) {
        updateData.tags = tags
      }

      const { error } = await supabase
        .from('message_threads')
        .update(updateData)
        .eq('id', threadId)

      if (error) throw error

      await fetchThreads()
      toast({
        title: "Success",
        description: "Conversation updated"
      })
    } catch (error) {
      console.error('Error updating thread:', error)
      toast({
        title: "Error",
        description: "Failed to update conversation",
        variant: "destructive"
      })
      throw error
    }
  }, [supabase, fetchThreads, toast])

  // Fetch templates
  const fetchTemplates = useCallback(async (channel?: string) => {
    try {
      let query = supabase
        .from('communication_templates')
        .select('*')
        .eq('is_active', true)
        .order('name')

      if (channel) {
        query = query.eq('channel', channel)
      }

      const { data, error } = await query

      if (error) throw error
      setTemplates(data || [])
    } catch (error) {
      console.error('Error fetching templates:', error)
    }
  }, [supabase])

  // Create template
  const createTemplate = useCallback(async (
    template: Omit<Tables['communication_templates']['Insert'], 'id' | 'created_at' | 'updated_at'>
  ) => {
    try {
      const { data, error } = await supabase
        .from('communication_templates')
        .insert(template)
        .select()
        .single()

      if (error) throw error

      await fetchTemplates()
      toast({
        title: "Success",
        description: "Template created successfully"
      })

      return data
    } catch (error) {
      console.error('Error creating template:', error)
      toast({
        title: "Error",
        description: "Failed to create template",
        variant: "destructive"
      })
      throw error
    }
  }, [supabase, fetchTemplates, toast])

  // Update template
  const updateTemplate = useCallback(async (
    id: string,
    updates: Partial<Tables['communication_templates']['Update']>
  ) => {
    try {
      const { error } = await supabase
        .from('communication_templates')
        .update(updates)
        .eq('id', id)

      if (error) throw error

      await fetchTemplates()
      toast({
        title: "Success",
        description: "Template updated successfully"
      })
    } catch (error) {
      console.error('Error updating template:', error)
      toast({
        title: "Error",
        description: "Failed to update template",
        variant: "destructive"
      })
      throw error
    }
  }, [supabase, fetchTemplates, toast])

  // Fetch campaigns
  const fetchCampaigns = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setCampaigns(data || [])
    } catch (error) {
      console.error('Error fetching campaigns:', error)
    }
  }, [supabase])

  // Fetch messaging stats
  const fetchStats = useCallback(async () => {
    try {
      const [threadStats, channelStats] = await Promise.all([
        supabase
          .from('message_threads')
          .select('status, channel')
          .eq('status', 'open'),
        supabase
          .from('message_threads')
          .select('channel')
      ])

      const stats: MessagingStats = {
        totalThreads: 0,
        openThreads: threadStats.data?.length || 0,
        closedThreads: 0,
        unreadMessages: 0,
        averageResponseTime: 0,
        channelStats: {
          email: 0,
          sms: 0,
          whatsapp: 0,
          in_app: 0
        }
      }

      // Count by channel
      channelStats.data?.forEach(thread => {
        if (thread.channel in stats.channelStats) {
          stats.channelStats[thread.channel as keyof typeof stats.channelStats]++
        }
      })

      stats.totalThreads = stats.channelStats.email + stats.channelStats.sms +
                          stats.channelStats.whatsapp + stats.channelStats.in_app

      setStats(stats)
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }, [supabase])

  // Load initial data
  useEffect(() => {
    fetchThreads()
    fetchTemplates()
    fetchCampaigns()
    fetchStats()
  }, [fetchThreads, fetchTemplates, fetchCampaigns, fetchStats])

  // Real-time subscription for new messages
  useEffect(() => {
    const channel = supabase
      .channel('messaging')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages'
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newMessage = payload.new as Tables['messages']['Row']

            // If it's for the current thread, fetch messages
            if (selectedThread && newMessage.thread_id === selectedThread.id) {
              fetchMessages(selectedThread.id)
            }

            // Refresh threads list
            fetchThreads()
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'message_threads'
        },
        () => {
          fetchThreads()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, selectedThread, fetchMessages, fetchThreads])

  // Load messages when thread is selected
  useEffect(() => {
    if (selectedThread) {
      fetchMessages(selectedThread.id)
    } else {
      setMessages([])
    }
  }, [selectedThread, fetchMessages])

  return {
    // Data
    threads,
    selectedThread,
    messages,
    templates,
    campaigns,
    stats,

    // Loading states
    loading,
    messagesLoading,

    // Filters
    filters,
    setFilters,

    // Actions
    setSelectedThread,
    sendMessage,
    createThread,
    updateThreadStatus,
    createTemplate,
    updateTemplate,
    fetchThreads,
    fetchMessages,
    fetchTemplates,
    fetchCampaigns,
    fetchStats,

    // Refetch functions
    refetch: () => {
      fetchThreads()
      fetchTemplates()
      fetchCampaigns()
      fetchStats()
    }
  }
}

// Helper function for automatic message sending
export const sendAutomatedMessage = async (
  recipient: string,
  templateName: string,
  variables: Record<string, string>,
  channel: 'whatsapp' | 'sms' | 'email' = 'whatsapp'
) => {
  try {

    // Get template
    const { data: template } = await supabase
      .from('communication_templates')
      .select('*')
      .eq('name', templateName)
      .eq('channel', channel)
      .single()

    if (!template) {
      console.error(`Template not found: ${templateName}`)
      return
    }

    // Replace variables
    let content = template.template_content
    for (const [key, value] of Object.entries(variables)) {
      content = content.replace(new RegExp(`{{${key}}}`, 'g'), value)
    }

    // Send message
    if (channel === 'whatsapp') {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-whatsapp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: recipient,
          message: content
        })
      })

      if (!response.ok) {
        throw new Error('Failed to send WhatsApp message')
      }
    } else if (channel === 'sms') {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-sms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: recipient,
          message: content
        })
      })

      if (!response.ok) {
        throw new Error('Failed to send SMS')
      }
    } else if (channel === 'email') {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: recipient,
          subject: template.subject_template || 'Message from Beauty Studio',
          content
        })
      })

      if (!response.ok) {
        throw new Error('Failed to send email')
      }
    }

    return { success: true }
  } catch (error) {
    console.error('Error sending automated message:', error)
    return { success: false, error }
  }
}