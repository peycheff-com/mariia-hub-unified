import React, { useState, useRef, useCallback } from 'react'
import { Paperclip, Send, Mic, MicOff, Smile, X } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ResponsiveCard } from '@/components/ui/responsive-image'
import { cn } from '@/lib/utils'


interface MessageComposerProps {
  onSendMessage: (content: string, files?: File[]) => Promise<void>
  disabled?: boolean
  placeholder?: string
  className?: string
  allowAttachments?: boolean
  allowVoiceRecording?: boolean
  maxFileSize?: number // in MB
  acceptedFileTypes?: string[]
}

interface AttachmentPreviewProps {
  file: File
  onRemove: () => void
}

const AttachmentPreview: React.FC<AttachmentPreviewProps> = ({ file, onRemove }) => {
  const [preview, setPreview] = useState<string | null>(null)

  React.useEffect(() => {
    if (file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (e) => setPreview(e.target?.result as string)
      reader.readAsDataURL(file)
    }
  }, [file])

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  return (
    <div className="relative group bg-muted rounded-lg p-2 flex items-center gap-2 max-w-xs">
      {preview ? (
        <ResponsiveCard
          src={preview}
          alt={file.name}
          className="h-12 w-12 object-cover rounded"
        />
      ) : (
        <div className="h-12 w-12 bg-background rounded flex items-center justify-center">
          <Paperclip className="h-4 w-4 text-muted-foreground" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{file.name}</p>
        <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
      </div>
      <Button
        variant="ghost"
        size="sm"
        className="opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={onRemove}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  )
}

export const MessageComposer: React.FC<MessageComposerProps> = ({
  onSendMessage,
  disabled = false,
  placeholder,
  className,
  allowAttachments = true,
  allowVoiceRecording = true,
  maxFileSize = 10,
  acceptedFileTypes = ['image/*', 'video/*', 'application/pdf', '.doc', '.docx', '.txt']
}) => {
  const { t } = useTranslation()
  const [message, setMessage] = useState('')
  const [attachments, setAttachments] = useState<File[]>([])
  const [isRecording, setIsRecording] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])

  // Auto-resize textarea
  const adjustTextareaHeight = useCallback(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`
    }
  }, [])

  React.useEffect(() => {
    adjustTextareaHeight()
  }, [message, adjustTextareaHeight])

  // Handle file selection
  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])

    // Check file sizes
    const oversizedFiles = files.filter(file => file.size > maxFileSize * 1024 * 1024)
    if (oversizedFiles.length > 0) {
      toast.error(t('file_too_large', 'Some files are too large. Maximum size is {{maxSize}}MB.', { maxSize }))
      return
    }

    // Check total attachments limit
    if (attachments.length + files.length > 5) {
      toast.error(t('too_many_attachments', 'Maximum 5 attachments allowed'))
      return
    }

    setAttachments(prev => [...prev, ...files])

    // Clear file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [attachments.length, maxFileSize, t])

  // Remove attachment
  const removeAttachment = useCallback((index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index))
  }, [])

  // Handle voice recording
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        const audioFile = new File([audioBlob], `voice_${Date.now()}.webm`, { type: 'audio/webm' })
        setAttachments(prev => [...prev, audioFile])

        // Stop all tracks
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorder.start()
      setIsRecording(true)
    } catch (error) {
      console.error('Error starting recording:', error)
      toast.error(t('microphone_error', 'Could not access microphone'))
    }
  }, [])

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }, [isRecording])

  // Send message
  const handleSend = useCallback(async () => {
    if ((!message.trim() && attachments.length === 0) || isSending) return

    setIsSending(true)
    try {
      await onSendMessage(message.trim(), attachments)
      setMessage('')
      setAttachments([])

      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
      }
    } catch (error) {
      console.error('Error sending message:', error)
      toast.error(t('send_error', 'Failed to send message'))
    } finally {
      setIsSending(false)
    }
  }, [message, attachments, isSending, onSendMessage, t])

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      if (event.shiftKey) {
        // Allow new line with Shift+Enter
        return
      } else {
        // Send with Enter
        event.preventDefault()
        handleSend()
      }
    } else if (event.key === 'Escape') {
      // Clear attachments with Escape
      if (attachments.length > 0) {
        setAttachments([])
      }
    }
  }, [handleSend, attachments.length])

  return (
    <div className={cn("border-t bg-background p-4", className)}>
      {/* Attachments preview */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {attachments.map((file, index) => (
            <AttachmentPreview
              key={`${file.name}-${index}`}
              file={file}
              onRemove={() => removeAttachment(index)}
            />
          ))}
        </div>
      )}

      <div className="flex items-end gap-2">
        {/* Attachment button */}
        {allowAttachments && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={acceptedFileTypes.join(',')}
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled}
              className="shrink-0"
            >
              <Paperclip className="h-4 w-4" />
            </Button>
          </>
        )}

        {/* Message input */}
        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder || t('type_message', 'Type a message...')}
            disabled={disabled || isSending}
            className="min-h-[40px] max-h-[200px] resize-none pr-10"
            rows={1}
          />

          {/* Emoji button - placeholder for future implementation */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-2 bottom-2 h-6 w-6 p-0"
            disabled
          >
            <Smile className="h-3 w-3" />
          </Button>
        </div>

        {/* Voice recording / Send button */}
        {allowVoiceRecording && message.trim() === '' && attachments.length === 0 ? (
          <Button
            type="button"
            variant={isRecording ? "destructive" : "ghost"}
            size="sm"
            onMouseDown={startRecording}
            onMouseUp={stopRecording}
            onTouchStart={startRecording}
            onTouchEnd={stopRecording}
            disabled={disabled || isSending}
            className="shrink-0"
          >
            {isRecording ? (
              <MicOff className="h-4 w-4 animate-pulse" />
            ) : (
              <Mic className="h-4 w-4" />
            )}
          </Button>
        ) : (
          <Button
            type="button"
            onClick={handleSend}
            disabled={disabled || isSending || (!message.trim() && attachments.length === 0)}
            className="shrink-0"
          >
            {isSending ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        )}
      </div>

      {/* Recording indicator */}
      {isRecording && (
        <div className="flex items-center gap-2 mt-2 text-sm text-destructive">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-destructive rounded-full animate-pulse" />
            <span>{t('recording', 'Recording...')}</span>
          </div>
          <span className="text-xs text-muted-foreground">
            ({t('release_to_send', 'Release to send')})
          </span>
        </div>
      )}

      {/* Help text */}
      <div className="flex items-center justify-between mt-2">
        <p className="text-xs text-muted-foreground">
          {t('press_enter_to_send', 'Press Enter to send, Shift+Enter for new line')}
        </p>
        {attachments.length > 0 && (
          <p className="text-xs text-muted-foreground">
            {attachments.length} {t('attachment', 'attachment')}{attachments.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>
    </div>
  )
}