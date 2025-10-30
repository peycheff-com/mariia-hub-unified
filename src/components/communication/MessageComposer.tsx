// Message composer component for sending messages to clients

import React, { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Send,
  Mail,
  Phone,
  MessageCircle,
  Bell,
  Calendar as CalendarIcon,
  Clock,
  FileText,
  User,
  Settings,
  Plus,
  X,
  Paperclip
} from 'lucide-react';
import { useSendMessage, useMessageTemplates, useClientPreferences } from '@/lib/communication/hooks/use-communication';
import { format } from 'date-fns';
import { CalendarDateTime } from '@internationalized/date';

interface MessageComposerProps {
  recipientId?: string;
  initialChannel?: 'email' | 'sms' | 'whatsapp';
  bookingId?: string;
  onMessageSent?: () => void;
  className?: string;
}

interface MessageAttachment {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
}

export function MessageComposer({
  recipientId,
  initialChannel = 'email',
  bookingId,
  onMessageSent,
  className
}: MessageComposerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedRecipient, setSelectedRecipient] = useState<string>(recipientId || '');
  const [channel, setChannel] = useState<'email' | 'sms' | 'whatsapp'>(initialChannel);
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [scheduleLater, setScheduleLater] = useState(false);
  const [scheduledDate, setScheduledDate] = useState<Date>();
  const [scheduledTime, setScheduledTime] = useState('12:00');
  const [priority, setPriority] = useState<'low' | 'normal' | 'high' | 'urgent'>('normal');
  const [attachments, setAttachments] = useState<MessageAttachment[]>([]);
  const [templateVariables, setTemplateVariables] = useState<Record<string, string>>({});

  const fileInputRef = useRef<HTMLInputElement>(null);

  const { sendMessage, isLoading, error } = useSendMessage();
  const { templates } = useMessageTemplates({ channel });
  const { preferences: clientPrefs } = useClientPreferences(selectedRecipient);

  const canSendToChannel = (channel: string) => {
    if (!selectedRecipient) return true;
    const pref = clientPrefs.find(p => p.channel === channel);
    return pref?.is_enabled ?? true;
  };

  const handleSendMessage = async () => {
    if (!selectedRecipient || !content.trim()) {
      return;
    }

    try {
      let scheduledFor: string | undefined;
      if (scheduleLater && scheduledDate) {
        const dateTime = new Date(scheduledDate);
        const [hours, minutes] = scheduledTime.split(':');
        dateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        scheduledFor = dateTime.toISOString();
      }

      await sendMessage.mutateAsync({
        recipientId: selectedRecipient,
        channel,
        subject: channel === 'email' ? subject : undefined,
        content,
        messageType: selectedTemplate ? 'template' : 'text',
        templateId: selectedTemplate || undefined,
        variables: Object.keys(templateVariables).length > 0 ? templateVariables : undefined,
        scheduledFor,
        priority,
        bookingId,
        attachments: attachments.map(att => ({
          filename: att.name,
          file_url: URL.createObjectURL(att.file), // In production, this would be uploaded to storage
          file_size: att.size,
          file_type: att.type
        }))
      });

      // Reset form
      setContent('');
      setSubject('');
      setSelectedTemplate('');
      setAttachments([]);
      setTemplateVariables({});
      setScheduleLater(false);
      onMessageSent?.();
      setIsOpen(false);

    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setContent(template.content);
      if (template.subject) {
        setSubject(template.subject);
      }
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const newAttachments: MessageAttachment[] = files.map(file => ({
      id: Math.random().toString(36).substring(7),
      file,
      name: file.name,
      size: file.size,
      type: file.type
    }));
    setAttachments(prev => [...prev, ...newAttachments]);
  };

  const removeAttachment = (id: string) => {
    setAttachments(prev => prev.filter(att => att.id !== id));
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'email':
        return <Mail className="h-4 w-4" />;
      case 'sms':
        return <Phone className="h-4 w-4" />;
      case 'whatsapp':
        return <MessageCircle className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className={className}>
          <Send className="h-4 w-4 mr-2" />
          Compose Message
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Compose Message</DialogTitle>
          <DialogDescription>
            Send a message to your client through their preferred communication channel
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Recipient and Channel Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recipient Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="recipient">Client ID or Email</Label>
                  <Input
                    id="recipient"
                    value={selectedRecipient}
                    onChange={(e) => setSelectedRecipient(e.target.value)}
                    placeholder="Enter client ID or email address"
                  />
                </div>

                <div>
                  <Label>Communication Channel</Label>
                  <Select value={channel} onValueChange={(value: any) => setChannel(value)}>
                    <SelectTrigger>
                      <SelectTrigger>
                        <div className="flex items-center space-x-2">
                          {getChannelIcon(channel)}
                          <SelectValue />
                        </div>
                      </SelectTrigger>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email">
                        <div className="flex items-center space-x-2">
                          <Mail className="h-4 w-4" />
                          <span>Email</span>
                          {canSendToChannel('email') ? (
                            <Badge variant="secondary" className="ml-2">Available</Badge>
                          ) : (
                            <Badge variant="destructive" className="ml-2">Disabled</Badge>
                          )}
                        </div>
                      </SelectItem>
                      <SelectItem value="sms">
                        <div className="flex items-center space-x-2">
                          <Phone className="h-4 w-4" />
                          <span>SMS</span>
                          {canSendToChannel('sms') ? (
                            <Badge variant="secondary" className="ml-2">Available</Badge>
                          ) : (
                            <Badge variant="destructive" className="ml-2">Disabled</Badge>
                          )}
                        </div>
                      </SelectItem>
                      <SelectItem value="whatsapp">
                        <div className="flex items-center space-x-2">
                          <MessageCircle className="h-4 w-4" />
                          <span>WhatsApp</span>
                          {canSendToChannel('whatsapp') ? (
                            <Badge variant="secondary" className="ml-2">Available</Badge>
                          ) : (
                            <Badge variant="destructive" className="ml-2">Disabled</Badge>
                          )}
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {channel === 'email' && (
                  <div>
                    <Label htmlFor="subject">Subject</Label>
                    <Input
                      id="subject"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="Enter email subject"
                    />
                  </div>
                )}

                <div>
                  <Label htmlFor="priority">Priority</Label>
                  <Select value={priority} onValueChange={(value: any) => setPriority(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Message Content */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Message Content</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="compose" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="compose">Compose</TabsTrigger>
                    <TabsTrigger value="template">Template</TabsTrigger>
                  </TabsList>

                  <TabsContent value="compose" className="space-y-4">
                    <div>
                      <Label htmlFor="content">Message</Label>
                      <Textarea
                        id="content"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder={`Type your ${channel} message here...`}
                        className="min-h-[150px]"
                      />
                      <div className="text-sm text-muted-foreground mt-1">
                        {channel === 'sms' && (
                          <span>Character count: {content.length} / 1600</span>
                        )}
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="template" className="space-y-4">
                    <div>
                      <Label htmlFor="template">Select Template</Label>
                      <Select value={selectedTemplate} onValueChange={handleTemplateSelect}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a template..." />
                        </SelectTrigger>
                        <SelectContent>
                          {templates.map((template) => (
                            <SelectItem key={template.id} value={template.id}>
                              <div>
                                <p className="font-medium">{template.name}</p>
                                <p className="text-sm text-muted-foreground">{template.category}</p>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {selectedTemplate && (
                      <div>
                        <Label htmlFor="content">Template Content</Label>
                        <Textarea
                          id="content"
                          value={content}
                          onChange={(e) => setContent(e.target.value)}
                          className="min-h-[150px]"
                        />
                      </div>
                    )}
                  </TabsContent>
                </Tabs>

                {/* Attachments */}
                <div className="space-y-2">
                  <Label>Attachments</Label>
                  <div className="flex items-center space-x-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Paperclip className="h-4 w-4 mr-2" />
                      Add Files
                    </Button>
                  </div>

                  {attachments.length > 0 && (
                    <div className="space-y-2">
                      {attachments.map((attachment) => (
                        <div key={attachment.id} className="flex items-center justify-between p-2 border rounded">
                          <div className="flex items-center space-x-2">
                            <FileText className="h-4 w-4" />
                            <span className="text-sm">{attachment.name}</span>
                            <span className="text-xs text-muted-foreground">
                              ({formatFileSize(attachment.size)})
                            </span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeAttachment(attachment.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Scheduling */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Scheduling</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="schedule-later"
                    checked={scheduleLater}
                    onCheckedChange={(checked) => setScheduleLater(checked as boolean)}
                  />
                  <Label htmlFor="schedule-later">Schedule for later</Label>
                </div>

                {scheduleLater && (
                  <div className="space-y-3">
                    <div>
                      <Label>Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-start text-left font-normal">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {scheduledDate ? format(scheduledDate, 'PPP') : 'Pick a date'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={scheduledDate}
                            onSelect={setScheduledDate}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div>
                      <Label htmlFor="time">Time</Label>
                      <Input
                        id="time"
                        type="time"
                        value={scheduledTime}
                        onChange={(e) => setScheduledTime(e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Client Preferences */}
            {selectedRecipient && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Client Preferences</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {clientPrefs.map((pref) => (
                      <div key={pref.id} className="flex items-center justify-between">
                        <span className="text-sm capitalize">{pref.channel}</span>
                        <Badge variant={pref.is_enabled ? 'default' : 'destructive'}>
                          {pref.is_enabled ? 'Enabled' : 'Disabled'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Clock className="h-4 w-4 mr-2" />
                  Save as Draft
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <User className="h-4 w-4 mr-2" />
                  View Client Profile
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Settings className="h-4 w-4 mr-2" />
                  Communication Settings
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSendMessage}
            disabled={isLoading || !selectedRecipient || !content.trim()}
          >
            <Send className="h-4 w-4 mr-2" />
            {isLoading ? 'Sending...' : scheduleLater ? 'Schedule Message' : 'Send Message'}
          </Button>
        </DialogFooter>

        {error && (
          <div className="text-sm text-destructive mt-2">
            Failed to send message: {error}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}