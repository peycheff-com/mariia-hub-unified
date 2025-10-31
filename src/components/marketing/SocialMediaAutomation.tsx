import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Calendar } from '@/components/ui/calendar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Calendar as CalendarIcon,
  Clock,
  Image as ImageIcon,
  Video,
  Send,
  Settings,
  TrendingUp,
  Users,
  BarChart3,
  Plus,
  Edit,
  Trash2,
  Eye,
  RefreshCw,
  Zap,
  Target,
  MessageSquare,
  Heart,
  Share2,
  Hash,
  AtSign
} from 'lucide-react';
import { marketingService } from '@/services/marketing.service';
import {
  SocialMediaPlatform,
  SocialMediaAccount,
  SocialMediaContent,
  ContentSchedulingRule,
  SocialMediaPostRequest,
  ScheduleContentRequest,
  ContentCalendarEvent,
  ContentOptimization
} from '@/types/marketing';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface SocialMediaAutomationProps {
  className?: string;
}

export const SocialMediaAutomation: React.FC<SocialMediaAutomationProps> = ({ className }) => {
  const [platforms, setPlatforms] = useState<SocialMediaPlatform[]>([]);
  const [accounts, setAccounts] = useState<SocialMediaAccount[]>([]);
  const [content, setContent] = useState<SocialMediaContent[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<ContentCalendarEvent[]>([]);
  const [schedulingRules, setSchedulingRules] = useState<ContentSchedulingRule[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isScheduleRuleDialogOpen, setIsScheduleRuleDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [optimizationSuggestions, setOptimizationSuggestions] = useState<ContentOptimization | null>(null);

  // Form states
  const [contentForm, setContentForm] = useState<SocialMediaPostRequest>({
    content: '',
    platforms: [],
    contentType: 'post',
    hashtags: [],
    mentions: []
  });

  const [scheduleRuleForm, setScheduleRuleForm] = useState<Partial<ContentSchedulingRule>>({
    name: '',
    description: '',
    posting_frequency: {},
    optimal_times: {},
    content_types: []
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [platformsData, accountsData, contentData, rulesData] = await Promise.all([
        marketingService.getSocialMediaPlatforms(),
        marketingService.getSocialMediaAccounts(),
        marketingService.getSocialMediaContent() as Promise<SocialMediaContent[]>,
        loadSchedulingRules()
      ]);

      setPlatforms(platformsData);
      setAccounts(accountsData);
      setContent(contentData);
      setSchedulingRules(rulesData);

      // Load calendar events for current month
      const today = new Date();
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

      const events = await marketingService.getContentCalendar({
        start: startOfMonth,
        end: endOfMonth
      });
      setCalendarEvents(events);
    } catch (error) {
      console.error('Error loading social media data:', error);
      toast.error('Failed to load social media data');
    } finally {
      setIsLoading(false);
    }
  };

  const loadSchedulingRules = async (): Promise<ContentSchedulingRule[]> => {
    // Mock data - in real implementation this would come from the service
    return [];
  };

  const handleCreateContent = async () => {
    try {
      const request: ScheduleContentRequest = {
        content: contentForm,
        platforms: contentForm.platforms,
        optimizeTiming: true
      };

      const result = await marketingService.createSocialMediaContent(request);
      setContent([result, ...content]);
      setIsCreateDialogOpen(false);
      resetContentForm();
      toast.success('Social media content created successfully');
    } catch (error) {
      console.error('Error creating content:', error);
      toast.error('Failed to create content');
    }
  };

  const handleScheduleContent = async (contentId: string, scheduledFor: Date) => {
    try {
      await marketingService.scheduleContent(contentId, scheduledFor);
      await loadData();
      toast.success('Content scheduled successfully');
    } catch (error) {
      console.error('Error scheduling content:', error);
      toast.error('Failed to schedule content');
    }
  };

  const handlePostContent = async (contentId: string) => {
    try {
      await marketingService.postContent(contentId);
      await loadData();
      toast.success('Content posted successfully');
    } catch (error) {
      console.error('Error posting content:', error);
      toast.error('Failed to post content');
    }
  };

  const handleOptimizeContent = async () => {
    if (!contentForm.content) return;

    try {
      // Mock optimization - in real implementation this would use AI
      const suggestions: ContentOptimization = {
        score: 85,
        suggestions: {
          title: ['Add emojis to increase engagement'],
          content: ['Include a question to encourage comments', 'Add relevant hashtags'],
          hashtags: ['Add trending hashtags in your niche'],
          timing: ['Post at 9 AM for higher engagement'],
          media: ['Add an image to increase reach']
        },
        bestPractices: {
          length: { min: 50, max: 150, optimal: 100 },
          hashtags: { count: 10, popular: ['#beauty', '#warsaw', '#skincare'] },
          timing: { best: ['9:00 AM', '12:00 PM', '6:00 PM'], avoid: ['2:00 AM - 6:00 AM'] },
          media: { types: ['image', 'video'], specs: { 'image': '1080x1080', 'video': '9:16' } }
        }
      };

      setOptimizationSuggestions(suggestions);
    } catch (error) {
      console.error('Error optimizing content:', error);
      toast.error('Failed to optimize content');
    }
  };

  const handleCreateSchedulingRule = async () => {
    try {
      // Mock implementation - in real implementation this would call the service
      const newRule: ContentSchedulingRule = {
        id: `rule_${Date.now()}`,
        name: scheduleRuleForm.name || '',
        description: scheduleRuleForm.description || '',
        platform_ids: [],
        posting_frequency: scheduleRuleForm.posting_frequency || {},
        optimal_times: scheduleRuleForm.optimal_times || {},
        content_types: scheduleRuleForm.content_types || [],
        is_active: true,
        created_by: '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      setSchedulingRules([...schedulingRules, newRule]);
      setIsScheduleRuleDialogOpen(false);
      resetScheduleRuleForm();
      toast.success('Scheduling rule created successfully');
    } catch (error) {
      console.error('Error creating scheduling rule:', error);
      toast.error('Failed to create scheduling rule');
    }
  };

  const resetContentForm = () => {
    setContentForm({
      content: '',
      platforms: [],
      contentType: 'post',
      hashtags: [],
      mentions: []
    });
    setOptimizationSuggestions(null);
  };

  const resetScheduleRuleForm = () => {
    setScheduleRuleForm({
      name: '',
      description: '',
      posting_frequency: {},
      optimal_times: {},
      content_types: []
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'posted': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPlatformIcon = (platform: string) => {
    const icons: Record<string, React.ReactNode> = {
      instagram: <Heart className="w-4 h-4" />,
      facebook: <Users className="w-4 h-4" />,
      linkedin: <Users className="w-4 h-4" />,
      twitter: <MessageSquare className="w-4 h-4" />,
      tiktok: <Video className="w-4 h-4" />,
      youtube: <Video className="w-4 h-4" />,
      pinterest: <ImageIcon className="w-4 h-4" alt="" />
    };
    return icons[platform] || <MessageSquare className="w-4 h-4" />;
  };

  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case 'post': return <MessageSquare className="w-4 h-4" />;
      case 'story': return <ImageIcon className="w-4 h-4" alt="" />;
      case 'reel': return <Video className="w-4 h-4" />;
      case 'carousel': return <ImageIcon className="w-4 h-4" alt="" />;
      case 'video': return <Video className="w-4 h-4" />;
      default: return <MessageSquare className="w-4 h-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Social Media Automation</h2>
          <p className="text-muted-foreground">Manage and automate your social media presence across platforms</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isScheduleRuleDialogOpen} onOpenChange={setIsScheduleRuleDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Clock className="w-4 h-4 mr-2" />
                Scheduling Rules
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Scheduling Rule</DialogTitle>
                <DialogDescription>
                  Set up automated posting schedules for optimal engagement
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="rule-name">Rule Name</Label>
                  <Input
                    id="rule-name"
                    value={scheduleRuleForm.name || ''}
                    onChange={(e) => setScheduleRuleForm({ ...scheduleRuleForm, name: e.target.value })}
                    placeholder="e.g., Daily Instagram Posts"
                  />
                </div>
                <div>
                  <Label htmlFor="rule-description">Description</Label>
                  <Textarea
                    id="rule-description"
                    value={scheduleRuleForm.description || ''}
                    onChange={(e) => setScheduleRuleForm({ ...scheduleRuleForm, description: e.target.value })}
                    placeholder="Describe this scheduling rule..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Platforms</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select platforms" />
                      </SelectTrigger>
                      <SelectContent>
                        {platforms.map((platform) => (
                          <SelectItem key={platform.id} value={platform.name}>
                            <div className="flex items-center gap-2">
                              {getPlatformIcon(platform.name)}
                              {platform.display_name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Content Types</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select content types" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="post">Posts</SelectItem>
                        <SelectItem value="story">Stories</SelectItem>
                        <SelectItem value="reel">Reels</SelectItem>
                        <SelectItem value="carousel">Carousels</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>Posting Frequency</Label>
                  <div className="grid grid-cols-7 gap-2 mt-2">
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                      <div key={day} className="text-center">
                        <Label className="text-xs">{day}</Label>
                        <Switch className="mt-1" />
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <Label>Optimal Times</Label>
                  <div className="flex gap-2 mt-2">
                    <Input type="time" placeholder="9:00 AM" />
                    <Input type="time" placeholder="12:00 PM" />
                    <Input type="time" placeholder="6:00 PM" />
                    <Button variant="outline" size="sm">Add Time</Button>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsScheduleRuleDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateSchedulingRule}>
                    Create Rule
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create Content
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create Social Media Content</DialogTitle>
                <DialogDescription>
                  Create and schedule content for multiple social media platforms
                </DialogDescription>
              </DialogHeader>
              <Tabs defaultValue="content" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="content">Content</TabsTrigger>
                  <TabsTrigger value="media">Media</TabsTrigger>
                  <TabsTrigger value="scheduling">Scheduling</TabsTrigger>
                </TabsList>

                <TabsContent value="content" className="space-y-4">
                  <div>
                    <Label htmlFor="content-text">Content</Label>
                    <Textarea
                      id="content-text"
                      value={contentForm.content}
                      onChange={(e) => setContentForm({ ...contentForm, content: e.target.value })}
                      placeholder="What would you like to share?"
                      className="min-h-[120px]"
                    />
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-sm text-muted-foreground">
                        {contentForm.content.length} characters
                      </span>
                      <Button variant="outline" size="sm" onClick={handleOptimizeContent}>
                        <Zap className="w-4 h-4 mr-2" />
                        Optimize with AI
                      </Button>
                    </div>
                  </div>

                  {optimizationSuggestions && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">AI Optimization Suggestions</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <Label className="text-xs font-medium">Content Score: {optimizationSuggestions.score}/100</Label>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs font-medium">Suggestions:</Label>
                          {optimizationSuggestions.suggestions.content.map((suggestion, index) => (
                            <div key={index} className="text-xs text-muted-foreground">• {suggestion}</div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Platforms</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {platforms.map((platform) => (
                          <Badge
                            key={platform.id}
                            variant={contentForm.platforms.includes(platform.name) ? "default" : "outline"}
                            className="cursor-pointer"
                            onClick={() => {
                              const platforms = contentForm.platforms.includes(platform.name)
                                ? contentForm.platforms.filter(p => p !== platform.name)
                                : [...contentForm.platforms, platform.name];
                              setContentForm({ ...contentForm, platforms });
                            }}
                          >
                            {getPlatformIcon(platform.name)}
                            {platform.display_name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <Label>Content Type</Label>
                      <Select
                        value={contentForm.contentType}
                        onValueChange={(value) => setContentForm({ ...contentForm, contentType: value as any })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="post">Post</SelectItem>
                          <SelectItem value="story">Story</SelectItem>
                          <SelectItem value="reel">Reel</SelectItem>
                          <SelectItem value="carousel">Carousel</SelectItem>
                          <SelectItem value="video">Video</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="hashtags">Hashtags</Label>
                      <Input
                        id="hashtags"
                        value={contentForm.hashtags?.join(', ') || ''}
                        onChange={(e) => setContentForm({
                          ...contentForm,
                          hashtags: e.target.value.split(',').map(h => h.trim()).filter(h => h)
                        })}
                        placeholder="#beauty #warsaw #skincare"
                      />
                    </div>
                    <div>
                      <Label htmlFor="mentions">Mentions</Label>
                      <Input
                        id="mentions"
                        value={contentForm.mentions?.join(', ') || ''}
                        onChange={(e) => setContentForm({
                          ...contentForm,
                          mentions: e.target.value.split(',').map(m => m.trim()).filter(m => m)
                        })}
                        placeholder="@username @business"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="cta">Call to Action</Label>
                    <Input
                      id="cta"
                      value={contentForm.callToAction || ''}
                      onChange={(e) => setContentForm({ ...contentForm, callToAction: e.target.value })}
                      placeholder="Book now, Learn more, etc."
                    />
                  </div>
                </TabsContent>

                <TabsContent value="media" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Media Upload</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                        <ImageIcon className="w-12 h-12 mx-auto text-gray-400 mb-4" alt="Image" />
                        <p className="text-sm text-gray-600 mb-2">Drag and drop images or videos here</p>
                        <p className="text-xs text-gray-500 mb-4">or click to browse files</p>
                        <Button variant="outline">Choose Files</Button>
                      </div>
                      <div className="mt-4 text-xs text-gray-500">
                        Supported formats: JPG, PNG, MP4, MOV. Max file size: 100MB
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="scheduling" className="space-y-4">
                  <div>
                    <Label>Post Now or Schedule?</Label>
                    <div className="grid grid-cols-2 gap-4 mt-2">
                      <Card className="cursor-pointer hover:shadow-md transition-shadow">
                        <CardContent className="p-4 text-center">
                          <Send className="w-8 h-8 mx-auto mb-2 text-green-600" />
                          <h3 className="font-medium">Post Now</h3>
                          <p className="text-sm text-muted-foreground">Publish immediately</p>
                        </CardContent>
                      </Card>
                      <Card className="cursor-pointer hover:shadow-md transition-shadow">
                        <CardContent className="p-4 text-center">
                          <CalendarIcon className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                          <h3 className="font-medium">Schedule</h3>
                          <p className="text-sm text-muted-foreground">Post at optimal time</p>
                        </CardContent>
                      </Card>
                    </div>
                  </div>

                  <div>
                    <Label>Schedule for:</Label>
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      className="rounded-md border mt-2"
                    />
                  </div>

                  <div>
                    <Label>Optimal Posting Times:</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {['9:00 AM', '12:00 PM', '3:00 PM', '6:00 PM'].map((time) => (
                        <Button key={time} variant="outline" size="sm">
                          {time}
                        </Button>
                      ))}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="flex justify-end gap-2 mt-6">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateContent}>
                  Create Content
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="content" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="content">Content Library</TabsTrigger>
          <TabsTrigger value="calendar">Content Calendar</TabsTrigger>
          <TabsTrigger value="automation">Automation</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="content" className="space-y-4">
          <div className="grid gap-4">
            {content.map((item) => (
              <Card key={item.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={getStatusColor(item.scheduling_status)}>
                          {item.scheduling_status}
                        </Badge>
                        <div className="flex items-center gap-1">
                          {getContentTypeIcon(item.content_type)}
                          <span className="text-sm text-muted-foreground">{item.content_type}</span>
                        </div>
                        {item.scheduled_for && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <CalendarIcon className="w-4 h-4" />
                            {format(new Date(item.scheduled_for), 'MMM d, yyyy HH:mm')}
                          </div>
                        )}
                      </div>
                      <p className="text-sm mb-2 line-clamp-2">{item.content}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        {item.hashtags && item.hashtags.length > 0 && (
                          <div className="flex items-center gap-1">
                            <Hash className="w-3 h-3" />
                            {item.hashtags.length} hashtags
                          </div>
                        )}
                        {item.mentions && item.mentions.length > 0 && (
                          <div className="flex items-center gap-1">
                            <AtSign className="w-3 h-3" />
                            {item.mentions.length} mentions
                          </div>
                        )}
                        {Object.keys(item.platform_specific_content || {}).length > 0 && (
                          <div className="flex items-center gap-1">
                            <Target className="w-3 h-3" />
                            {Object.keys(item.platform_specific_content || {}).length} platforms
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      {item.scheduling_status === 'draft' && (
                        <Button size="sm" onClick={() => handleScheduleContent(item.id, new Date())}>
                          <Clock className="w-4 h-4 mr-2" />
                          Schedule
                        </Button>
                      )}
                      {item.scheduling_status === 'scheduled' && (
                        <Button size="sm" onClick={() => handlePostContent(item.id)}>
                          <Send className="w-4 h-4 mr-2" />
                          Post Now
                        </Button>
                      )}
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4 mr-2" />
                        Preview
                      </Button>
                      <Button variant="outline" size="sm">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="calendar" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Content Calendar</CardTitle>
              <CardDescription>View and manage your scheduled content</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-4">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                  <div key={day} className="text-center font-medium text-sm p-2">
                    {day}
                  </div>
                ))}
                {/* Calendar days would be rendered here based on selectedDate */}
                {Array.from({ length: 35 }, (_, i) => {
                  const date = new Date(selectedDate!);
                  date.setDate(date.getDate() - date.getDay() + i);
                  const dayEvents = calendarEvents.filter(event =>
                    format(new Date(event.scheduledFor), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
                  );

                  return (
                    <div key={i} className="border rounded-lg p-2 min-h-[100px]">
                      <div className="text-sm font-medium mb-1">{format(date, 'd')}</div>
                      <div className="space-y-1">
                        {dayEvents.slice(0, 3).map((event) => (
                          <div key={event.id} className="text-xs p-1 bg-blue-50 rounded">
                            <div className="flex items-center gap-1">
                              {getContentTypeIcon(event.type)}
                              <span className="truncate">{event.title}</span>
                            </div>
                          </div>
                        ))}
                        {dayEvents.length > 3 && (
                          <div className="text-xs text-gray-500">+{dayEvents.length - 3} more</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="automation" className="space-y-4">
          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Active Scheduling Rules</CardTitle>
              </CardHeader>
              <CardContent>
                {schedulingRules.length === 0 ? (
                  <div className="text-center py-8">
                    <Clock className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-muted-foreground">No scheduling rules set up yet</p>
                    <Button
                      className="mt-4"
                      onClick={() => setIsScheduleRuleDialogOpen(true)}
                    >
                      Create First Rule
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {schedulingRules.map((rule) => (
                      <div key={rule.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <h3 className="font-medium">{rule.name}</h3>
                          <p className="text-sm text-muted-foreground">{rule.description}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant={rule.is_active ? "default" : "secondary"}>
                              {rule.is_active ? "Active" : "Inactive"}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              Next run: {rule.next_run_at ? format(new Date(rule.next_run_at), 'MMM d, HH:mm') : 'Not scheduled'}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch checked={rule.is_active} />
                          <Button variant="outline" size="sm">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Automation Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">92%</div>
                    <div className="text-sm text-muted-foreground">Automation Success Rate</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">156</div>
                    <div className="text-sm text-muted-foreground">Posts Automated</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">24%</div>
                    <div className="text-sm text-muted-foreground">Engagement Increase</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">3.2h</div>
                    <div className="text-sm text-muted-foreground">Time Saved/Week</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Users className="h-8 w-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Total Followers</p>
                    <p className="text-2xl font-bold">24,563</p>
                    <p className="text-xs text-green-600">+12% from last month</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Heart className="h-8 w-8 text-red-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Engagement Rate</p>
                    <p className="text-2xl font-bold">8.4%</p>
                    <p className="text-xs text-green-600">+2.1% from last month</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Share2 className="h-8 w-8 text-green-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Total Shares</p>
                    <p className="text-2xl font-bold">1,842</p>
                    <p className="text-xs text-green-600">+18% from last month</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <BarChart3 className="h-8 w-8 text-purple-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Reach</p>
                    <p className="text-2xl font-bold">45.2K</p>
                    <p className="text-xs text-green-600">+8% from last month</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Platform Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {platforms.map((platform) => (
                  <div key={platform.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {getPlatformIcon(platform.name)}
                      <div>
                        <h3 className="font-medium">{platform.display_name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {Math.floor(Math.random() * 10000)} followers
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-sm font-medium">{(Math.random() * 10).toFixed(1)}% engagement</div>
                        <div className="text-xs text-green-600">+{Math.floor(Math.random() * 5)}%</div>
                      </div>
                      <Button variant="outline" size="sm">
                        <BarChart3 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};