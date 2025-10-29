import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { format, addDays, addWeeks, addMonths, isBefore, isAfter, startOfDay, endOfDay } from 'date-fns';
import { pl, enUS, ru, uk } from 'date-fns/locale';
import {
  Calendar as CalendarIcon,
  Clock,
  Plus,
  Edit,
  Trash2,
  Eye,
  BarChart3,
  Share2,
  Facebook,
  Instagram,
  Twitter,
  Mail,
  Globe,
  TrendingUp,
  Users,
  MessageSquare,
  Download,
  Upload,
  Settings,
  Repeat,
  Bell,
  Zap,
  Target,
  Activity
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calendar } from '@/components/ui/calendar';
import { useToast } from '@/hooks/use-toast';
import {
  ContentSchedule,
  ContentManagement,
  ContentSearchFilters
} from '@/types/content';
import { blogService } from '@/services/blog.service';
import { cn } from '@/lib/utils';

interface ContentSchedulerProps {
  contentId?: string;
  initialSchedule?: Partial<ContentSchedule>;
  onScheduled?: (schedule: ContentSchedule) => void;
  className?: string;
}

interface ScheduleEvent {
  id: string;
  title: string;
  contentId: string;
  date: Date;
  time: string;
  channels: string[];
  status: 'scheduled' | 'published' | 'failed' | 'cancelled';
  repeatPattern?: 'none' | 'daily' | 'weekly' | 'monthly';
  analytics?: {
    views: number;
    shares: number;
    clicks: number;
    conversions: number;
  };
}

export const ContentScheduler: React.FC<ContentSchedulerProps> = ({
  contentId,
  initialSchedule,
  onScheduled,
  className
}) => {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();

  // State
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState('09:00');
  const [selectedChannels, setSelectedChannels] = useState<string[]>(['blog']);
  const [autoPublish, setAutoPublish] = useState(true);
  const [repeatPattern, setRepeatPattern] = useState<'none' | 'daily' | 'weekly' | 'monthly'>('none');
  const [repeatUntil, setRepeatUntil] = useState<Date | null>(null);
  const [timezone, setTimezone] = useState('Europe/Warsaw');
  const [scheduleEvents, setScheduleEvents] = useState<ScheduleEvent[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<ScheduleEvent | null>(null);
  const [activeTab, setActiveTab] = useState('calendar');

  // Content for scheduling
  const [contentList, setContentList] = useState<ContentManagement[]>([]);
  const [selectedContent, setSelectedContent] = useState<ContentManagement | null>(null);

  // Social media settings
  const [facebookSettings, setFacebookSettings] = useState({
    enabled: true,
    autoPost: true,
    customMessage: ''
  });
  const [instagramSettings, setInstagramSettings] = useState({
    enabled: true,
    autoPost: true,
    storyType: 'image',
    customMessage: ''
  });
  const [twitterSettings, setTwitterSettings] = useState({
    enabled: true,
    autoPost: true,
    includeHashtags: true,
    customMessage: ''
  });
  const [emailSettings, setEmailSettings] = useState({
    enabled: true,
    sendToList: 'all',
    customSubject: '',
    sendTime: '10:00'
  });

  // Load content list
  useEffect(() => {
    loadContent();
    loadScheduledEvents();
  }, []);

  const loadContent = async () => {
    try {
      const { posts } = await blogService.getBlogPosts({
        status: 'approved',
        limit: 50
      });
      setContentList(posts);
    } catch (error) {
      console.error('Error loading content:', error);
    }
  };

  const loadScheduledEvents = async () => {
    try {
      // Simulate loading scheduled events
      const events: ScheduleEvent[] = [
        {
          id: '1',
          title: 'Spring Beauty Trends 2024',
          contentId: '1',
          date: addDays(new Date(), 1),
          time: '10:00',
          channels: ['blog', 'facebook', 'instagram'],
          status: 'scheduled',
          analytics: undefined
        },
        {
          id: '2',
          title: 'Summer Fitness Challenge',
          contentId: '2',
          date: addDays(new Date(), 3),
          time: '14:00',
          channels: ['blog', 'email'],
          status: 'scheduled',
          repeatPattern: 'weekly',
          analytics: undefined
        },
        {
          id: '3',
          title: 'Skincare Tips for Busy Professionals',
          contentId: '3',
          date: addDays(new Date(), -1),
          time: '09:00',
          channels: ['blog', 'facebook', 'twitter'],
          status: 'published',
          analytics: {
            views: 1234,
            shares: 45,
            clicks: 89,
            conversions: 12
          }
        }
      ];
      setScheduleEvents(events);
    } catch (error) {
      console.error('Error loading events:', error);
    }
  };

  // Create schedule event
  const createScheduleEvent = useCallback(async () => {
    if (!selectedContent) {
      toast({
        title: t('admin.scheduler.noContent'),
        description: t('admin.scheduler.noContentDesc'),
        variant: 'destructive'
      });
      return;
    }

    try {
      const scheduleDateTime = new Date(selectedDate);
      const [hours, minutes] = selectedTime.split(':').map(Number);
      scheduleDateTime.setHours(hours, minutes);

      const newEvent: ScheduleEvent = {
        id: editingEvent?.id || crypto.randomUUID(),
        title: selectedContent.title,
        contentId: selectedContent.id,
        date: scheduleDateTime,
        time: selectedTime,
        channels: selectedChannels,
        status: 'scheduled',
        repeatPattern: repeatPattern !== 'none' ? repeatPattern : undefined,
        analytics: undefined
      };

      if (editingEvent) {
        setScheduleEvents(prev =>
          prev.map(e => e.id === editingEvent.id ? newEvent : e)
        );
      } else {
        setScheduleEvents(prev => [newEvent, ...prev]);
      }

      // Update content status
      if (autoPublish && isAfter(scheduleDateTime, new Date())) {
        await blogService.scheduleBlogPost(selectedContent.id, scheduleDateTime.toISOString());
      }

      onScheduled?.({
        id: newEvent.id,
        content_id: newEvent.contentId,
        scheduled_for: scheduleDateTime.toISOString(),
        channels: newEvent.channels,
        timezone,
        auto_publish: autoPublish,
        repeat_pattern: repeatPattern,
        repeat_until: repeatUntil?.toISOString(),
        status: newEvent.status,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      setIsDialogOpen(false);
      setEditingEvent(null);
      setSelectedContent(null);

      toast({
        title: t('admin.scheduler.scheduled'),
        description: t('admin.scheduler.scheduledDesc')
      });
    } catch (error) {
      console.error('Error scheduling content:', error);
      toast({
        title: t('admin.scheduler.scheduleFailed'),
        description: t('admin.scheduler.scheduleFailedDesc'),
        variant: 'destructive'
      });
    }
  }, [
    selectedContent,
    selectedDate,
    selectedTime,
    selectedChannels,
    autoPublish,
    repeatPattern,
    repeatUntil,
    timezone,
    editingEvent,
    onScheduled,
    toast,
    t
  ]);

  // Delete schedule event
  const deleteScheduleEvent = useCallback(async (eventId: string) => {
    try {
      setScheduleEvents(prev => prev.filter(e => e.id !== eventId));
      toast({
        title: t('admin.scheduler.deleted'),
        description: t('admin.scheduler.deletedDesc')
      });
    } catch (error) {
      console.error('Error deleting event:', error);
    }
  }, [toast, t]);

  // Get events for date
  const getEventsForDate = useCallback((date: Date) => {
    return scheduleEvents.filter(event =>
      format(event.date, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
    );
  }, [scheduleEvents]);

  // Get channel icon
  const getChannelIcon = (channel: string) => {
    const icons: Record<string, React.ReactNode> = {
      blog: <Globe className="h-4 w-4" />,
      facebook: <Facebook className="h-4 w-4 text-blue-600" />,
      instagram: <Instagram className="h-4 w-4 text-pink-600" />,
      twitter: <Twitter className="h-4 w-4 text-sky-500" />,
      email: <Mail className="h-4 w-4 text-gray-600" />
    };
    return icons[channel] || null;
  };

  // Get status color
  const getStatusColor = (status: ScheduleEvent['status']) => {
    const colors = {
      scheduled: 'bg-blue-100 text-blue-800',
      published: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || colors.scheduled;
  };

  return (
    <div className={cn('w-full space-y-6', className)}>
      {/* Calendar View */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              {t('admin.scheduler.title')}
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  {t('admin.scheduler.scheduleContent')}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {editingEvent ? t('admin.scheduler.editSchedule') : t('admin.scheduler.newSchedule')}
                  </DialogTitle>
                  <DialogDescription>
                    {t('admin.scheduler.scheduleDesc')}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-6">
                  {/* Content Selection */}
                  <div>
                    <Label>{t('admin.scheduler.selectContent')}</Label>
                    <Select
                      value={selectedContent?.id}
                      onValueChange={(value) => {
                        const content = contentList.find(c => c.id === value);
                        setSelectedContent(content || null);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t('admin.scheduler.selectContentPlaceholder')} />
                      </SelectTrigger>
                      <SelectContent>
                        {contentList.map((content) => (
                          <SelectItem key={content.id} value={content.id}>
                            {content.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Date and Time */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>{t('admin.scheduler.date')}</Label>
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={(date) => date && setSelectedDate(date)}
                        className="rounded-md border"
                      />
                    </div>
                    <div className="space-y-4">
                      <div>
                        <Label>{t('admin.scheduler.time')}</Label>
                        <Input
                          type="time"
                          value={selectedTime}
                          onChange={(e) => setSelectedTime(e.target.value)}
                        />
                      </div>

                      <div>
                        <Label>{t('admin.scheduler.timezone')}</Label>
                        <Select value={timezone} onValueChange={setTimezone}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Europe/Warsaw">
                              {t('admin.scheduler.warsaw')}
                            </SelectItem>
                            <SelectItem value="Europe/London">
                              {t('admin.scheduler.london')}
                            </SelectItem>
                            <SelectItem value="Europe/Paris">
                              {t('admin.scheduler.paris')}
                            </SelectItem>
                            <SelectItem value="America/New_York">
                              {t('admin.scheduler.newYork')}
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Switch
                          id="auto-publish"
                          checked={autoPublish}
                          onCheckedChange={setAutoPublish}
                        />
                        <Label htmlFor="auto-publish">{t('admin.scheduler.autoPublish')}</Label>
                      </div>
                    </div>
                  </div>

                  {/* Channels */}
                  <div>
                    <Label>{t('admin.scheduler.channels')}</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {[
                        { value: 'blog', label: 'Blog', icon: <Globe className="h-4 w-4" /> },
                        { value: 'facebook', label: 'Facebook', icon: <Facebook className="h-4 w-4 text-blue-600" /> },
                        { value: 'instagram', label: 'Instagram', icon: <Instagram className="h-4 w-4 text-pink-600" /> },
                        { value: 'twitter', label: 'Twitter', icon: <Twitter className="h-4 w-4 text-sky-500" /> },
                        { value: 'email', label: 'Email', icon: <Mail className="h-4 w-4 text-gray-600" /> }
                      ].map((channel) => (
                        <div
                          key={channel.value}
                          className={cn(
                            'flex items-center gap-2 p-2 rounded-lg border cursor-pointer',
                            selectedChannels.includes(channel.value) && 'bg-primary/10 border-primary'
                          )}
                          onClick={() => {
                            setSelectedChannels(prev =>
                              prev.includes(channel.value)
                                ? prev.filter(c => c !== channel.value)
                                : [...prev, channel.value]
                            );
                          }}
                        >
                          {channel.icon}
                          <span className="text-sm">{channel.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Repeat Pattern */}
                  <div>
                    <Label>{t('admin.scheduler.repeat')}</Label>
                    <Select value={repeatPattern} onValueChange={(value: any) => setRepeatPattern(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">{t('admin.scheduler.noRepeat')}</SelectItem>
                        <SelectItem value="daily">{t('admin.scheduler.daily')}</SelectItem>
                        <SelectItem value="weekly">{t('admin.scheduler.weekly')}</SelectItem>
                        <SelectItem value="monthly">{t('admin.scheduler.monthly')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={createScheduleEvent}>
                      {editingEvent ? t('admin.scheduler.update') : t('admin.scheduler.schedule')}
                    </Button>
                    <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                      {t('common.cancel')}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </CardTitle>
          <CardDescription>
            {t('admin.scheduler.description')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="calendar">{t('admin.scheduler.calendar')}</TabsTrigger>
              <TabsTrigger value="list">{t('admin.scheduler.list')}</TabsTrigger>
              <TabsTrigger value="analytics">{t('admin.scheduler.analytics')}</TabsTrigger>
              <TabsTrigger value="settings">{t('admin.scheduler.settings')}</TabsTrigger>
            </TabsList>

            {/* Calendar View */}
            <TabsContent value="calendar">
              <div className="grid md:grid-cols-3 gap-6">
                <div className="md:col-span-2">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                    className="rounded-md border"
                    modifiers={{
                      hasEvents: (date) => getEventsForDate(date).length > 0
                    }}
                    modifiersStyles={{
                      hasEvents: {
                        backgroundColor: 'hsl(var(--primary) / 0.1)',
                        fontWeight: 'bold'
                      }
                    }}
                  />
                </div>

                {/* Day's Events */}
                <div>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">
                        {format(selectedDate, 'EEEE, MMMM d')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-64">
                        <div className="space-y-3">
                          {getEventsForDate(selectedDate).length > 0 ? (
                            getEventsForDate(selectedDate).map((event) => (
                              <div key={event.id} className="p-3 rounded-lg border">
                                <div className="flex items-start justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <Badge className={getStatusColor(event.status)}>
                                      {t(`admin.scheduler.status.${event.status}`)}
                                    </Badge>
                                    <span className="text-sm text-muted-foreground">
                                      {event.time}
                                    </span>
                                  </div>
                                  <div className="flex gap-1">
                                    {event.channels.map((channel) => (
                                      <span key={channel} className="text-sm">
                                        {getChannelIcon(channel)}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                                <h4 className="font-medium text-sm mb-1">{event.title}</h4>
                                {event.repeatPattern && (
                                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <Repeat className="h-3 w-3" />
                                    {event.repeatPattern}
                                  </div>
                                )}
                                {event.analytics && (
                                  <div className="mt-2 pt-2 border-t text-xs text-muted-foreground">
                                    <div className="flex justify-between">
                                      <span>{t('admin.scheduler.views')}: {event.analytics.views}</span>
                                      <span>{t('admin.scheduler.shares')}: {event.analytics.shares}</span>
                                    </div>
                                  </div>
                                )}
                                <div className="flex gap-2 mt-2">
                                  <Button variant="ghost" size="sm">
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button variant="ghost" size="sm" onClick={() => {
                                    setEditingEvent(event);
                                    setIsDialogOpen(true);
                                  }}>
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => deleteScheduleEvent(event.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="text-center text-muted-foreground py-8">
                              <CalendarIcon className="h-12 w-12 mx-auto mb-2" />
                              <p>{t('admin.scheduler.noEvents')}</p>
                            </div>
                          )}
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            {/* List View */}
            <TabsContent value="list">
              <Card>
                <CardHeader>
                  <CardTitle>{t('admin.scheduler.scheduledContent')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-96">
                    <div className="space-y-3">
                      {scheduleEvents.map((event) => (
                        <div key={event.id} className="p-4 rounded-lg border">
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <div className="flex items-center gap-3">
                                <Badge className={getStatusColor(event.status)}>
                                  {t(`admin.scheduler.status.${event.status}`)}
                                </Badge>
                                <span className="text-sm">
                                  {format(event.date, 'MMM d, yyyy')} at {event.time}
                                </span>
                              </div>
                              <h4 className="font-medium">{event.title}</h4>
                              <div className="flex items-center gap-2">
                                {event.channels.map((channel) => (
                                  <Badge key={channel} variant="outline" className="text-xs">
                                    {getChannelIcon(channel)}
                                    <span className="ml-1">{channel}</span>
                                  </Badge>
                                ))}
                              </div>
                              {event.repeatPattern && (
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Repeat className="h-3 w-3" />
                                  Repeats {event.repeatPattern}
                                </div>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <Button variant="ghost" size="sm">
                                <BarChart3 className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => {
                                setEditingEvent(event);
                                setIsDialogOpen(true);
                              }}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteScheduleEvent(event.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Analytics Tab */}
            <TabsContent value="analytics">
              <div className="grid md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      {t('admin.scheduler.scheduledPosts')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">24</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {t('admin.scheduler.thisMonth')}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      {t('admin.scheduler.publishedPosts')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">18</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {t('admin.scheduler.successRate')}: 75%
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      {t('admin.scheduler.engagement')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">3.2K</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {t('admin.scheduler.totalInteractions')}
                    </p>
                  </CardContent>
                </Card>
              </div>

              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>{t('admin.scheduler.performance')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">{t('admin.scheduler.bestDay')}</span>
                      <span className="font-medium">Tuesday</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">{t('admin.scheduler.bestTime')}</span>
                      <span className="font-medium">10:00 - 12:00</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">{t('admin.scheduler.bestChannel')}</span>
                      <span className="font-medium flex items-center gap-1">
                        <Instagram className="h-4 w-4 text-pink-600" />
                        Instagram
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings">
              <div className="space-y-6">
                {/* Social Media Settings */}
                <Card>
                  <CardHeader>
                    <CardTitle>{t('admin.scheduler.socialMediaSettings')}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Facebook */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Facebook className="h-4 w-4 text-blue-600" />
                          <span>Facebook</span>
                        </div>
                        <Switch
                          checked={facebookSettings.enabled}
                          onCheckedChange={(checked) =>
                            setFacebookSettings(prev => ({ ...prev, enabled: checked }))
                          }
                        />
                      </div>
                      {facebookSettings.enabled && (
                        <div className="pl-6 space-y-3">
                          <div className="flex items-center space-x-2">
                            <Switch
                              id="fb-auto"
                              checked={facebookSettings.autoPost}
                              onCheckedChange={(checked) =>
                                setFacebookSettings(prev => ({ ...prev, autoPost: checked }))
                              }
                            />
                            <Label htmlFor="fb-auto">
                              {t('admin.scheduler.autoPost')}
                            </Label>
                          </div>
                          <Textarea
                            placeholder={t('admin.scheduler.customMessage')}
                            value={facebookSettings.customMessage}
                            onChange={(e) =>
                              setFacebookSettings(prev => ({ ...prev, customMessage: e.target.value }))
                            }
                            rows={2}
                          />
                        </div>
                      )}
                    </div>

                    {/* Instagram */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Instagram className="h-4 w-4 text-pink-600" />
                          <span>Instagram</span>
                        </div>
                        <Switch
                          checked={instagramSettings.enabled}
                          onCheckedChange={(checked) =>
                            setInstagramSettings(prev => ({ ...prev, enabled: checked }))
                          }
                        />
                      </div>
                      {instagramSettings.enabled && (
                        <div className="pl-6 space-y-3">
                          <div className="flex items-center space-x-2">
                            <Switch
                              id="ig-auto"
                              checked={instagramSettings.autoPost}
                              onCheckedChange={(checked) =>
                                setInstagramSettings(prev => ({ ...prev, autoPost: checked }))
                              }
                            />
                            <Label htmlFor="ig-auto">
                              {t('admin.scheduler.autoPost')}
                            </Label>
                          </div>
                          <Select
                            value={instagramSettings.storyType}
                            onValueChange={(value: any) =>
                              setInstagramSettings(prev => ({ ...prev, storyType: value }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="image">{t('admin.scheduler.storyType.image')}</SelectItem>
                              <SelectItem value="video">{t('admin.scheduler.storyType.video')}</SelectItem>
                              <SelectItem value="carousel">{t('admin.scheduler.storyType.carousel')}</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>

                    {/* Twitter */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Twitter className="h-4 w-4 text-sky-500" />
                          <span>Twitter</span>
                        </div>
                        <Switch
                          checked={twitterSettings.enabled}
                          onCheckedChange={(checked) =>
                            setTwitterSettings(prev => ({ ...prev, enabled: checked }))
                          }
                        />
                      </div>
                      {twitterSettings.enabled && (
                        <div className="pl-6 space-y-3">
                          <div className="flex items-center space-x-2">
                            <Switch
                              id="tw-auto"
                              checked={twitterSettings.autoPost}
                              onCheckedChange={(checked) =>
                                setTwitterSettings(prev => ({ ...prev, autoPost: checked }))
                              }
                            />
                            <Label htmlFor="tw-auto">
                              {t('admin.scheduler.autoPost')}
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Switch
                              id="tw-hashtags"
                              checked={twitterSettings.includeHashtags}
                              onCheckedChange={(checked) =>
                                setTwitterSettings(prev => ({ ...prev, includeHashtags: checked }))
                              }
                            />
                            <Label htmlFor="tw-hashtags">
                              {t('admin.scheduler.includeHashtags')}
                            </Label>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Email */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-gray-600" />
                          <span>Email Newsletter</span>
                        </div>
                        <Switch
                          checked={emailSettings.enabled}
                          onCheckedChange={(checked) =>
                            setEmailSettings(prev => ({ ...prev, enabled: checked }))
                          }
                        />
                      </div>
                      {emailSettings.enabled && (
                        <div className="pl-6 space-y-3">
                          <div>
                            <Label>{t('admin.scheduler.sendToList')}</Label>
                            <Select
                              value={emailSettings.sendToList}
                              onValueChange={(value: any) =>
                                setEmailSettings(prev => ({ ...prev, sendToList: value }))
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">{t('admin.scheduler.allSubscribers')}</SelectItem>
                                <SelectItem value="vip">{t('admin.scheduler.vipSubscribers')}</SelectItem>
                                <SelectItem value="new">{t('admin.scheduler.newSubscribers')}</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>{t('admin.scheduler.sendTime')}</Label>
                            <Input
                              type="time"
                              value={emailSettings.sendTime}
                              onChange={(e) =>
                                setEmailSettings(prev => ({ ...prev, sendTime: e.target.value }))
                              }
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Save Settings */}
                <div className="flex justify-end">
                  <Button>
                    <Settings className="h-4 w-4 mr-2" />
                    {t('admin.scheduler.saveSettings')}
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Import/Export */}
      <div className="flex justify-end gap-2">
        <Button variant="outline">
          <Upload className="h-4 w-4 mr-2" />
          {t('admin.scheduler.importSchedule')}
        </Button>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          {t('admin.scheduler.exportSchedule')}
        </Button>
      </div>
    </div>
  );
};