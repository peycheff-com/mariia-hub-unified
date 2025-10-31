import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard, FileText, Users, BarChart3, Calendar, Settings,
  Search, Filter, Plus, Edit3, Eye, Trash2, Download, Upload,
  Sparkles, Brain, TrendingUp, Clock, CheckCircle, AlertCircle,
  MessageSquare, GitCompare, History, Target, Zap, Globe,
  BookOpen, Video, Image as ImageIcon, Music, FolderOpen,
  Bell, UserPlus, Share2, Lock, Unlock, Archive, Star,
  ArrowUpRight, ArrowDownRight, MoreHorizontal, Grid, List
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger
} from '@/components/ui/dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
  DropdownMenuSeparator, DropdownMenuCheckboxItem
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';

// Import our new components
import RichTextEditor from './RichTextEditor';
import AIContentOptimizer from './AIContentOptimizer';
import ContentVersionHistory from './ContentVersionHistory';
import ContentCollaboration from './ContentCollaboration';
import ContentWorkflow from './ContentWorkflow';
import AdvancedMediaManager from './AdvancedMediaManager';
import ContentPerformanceDashboard from './ContentPerformanceDashboard';

interface ContentItem {
  id: string;
  title: string;
  type: 'blog' | 'service' | 'page' | 'product' | 'gallery' | 'video';
  status: 'draft' | 'review' | 'approved' | 'published' | 'scheduled' | 'archived';
  author: {
    id: string;
    name: string;
    avatar?: string;
  };
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
  scheduledFor?: Date;
  excerpt: string;
  tags: string[];
  category: string;
  featured: boolean;
  priority: 'low' | 'medium' | 'high';
  metrics: {
    views: number;
    engagement: number;
    conversions: number;
    shares: number;
    comments: number;
  };
  seo: {
    score: number;
    keywords: string[];
    metaTitle?: string;
    metaDescription?: string;
  };
  collaboration: {
    collaborators: number;
    comments: number;
    unresolvedIssues: number;
    lastActivity: Date;
  };
  versions: number;
  wordCount: number;
  readingTime: number;
  thumbnail?: string;
  language: string;
  aiOptimized: boolean;
  lastAnalyzed?: Date;
}

interface ContentStats {
  total: number;
  published: number;
  draft: number;
  scheduled: number;
  review: number;
  archived: number;
  totalViews: number;
  totalEngagement: number;
  totalConversions: number;
  avgReadingTime: number;
  aiOptimized: number;
  collaborationActive: number;
  thisMonthGrowth: number;
  topPerforming: ContentItem[];
  recentlyUpdated: ContentItem[];
  needsAttention: ContentItem[];
}

const ContentManagementHub: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<ContentItem | null>(null);
  const [stats, setStats] = useState<ContentStats | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterAuthor, setFilterAuthor] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('updatedAt');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showContentEditor, setShowContentEditor] = useState(false);
  const [editingContent, setEditingContent] = useState<ContentItem | null>(null);
  const { toast } = useToast();

  // Mock data
  useEffect(() => {
    const mockContent: ContentItem[] = [
      {
        id: 'content-1',
        title: 'Complete Guide to Lash Extensions',
        type: 'blog',
        status: 'published',
        author: {
          id: 'user-1',
          name: 'Anna Kowalska',
          avatar: '/avatars/anna.jpg'
        },
        createdAt: new Date('2024-01-15T10:00:00'),
        updatedAt: new Date('2024-01-22T11:15:00'),
        publishedAt: new Date('2024-01-20T09:00:00'),
        excerpt: 'Everything you need to know about lash extensions, from preparation to aftercare...',
        tags: ['lashes', 'beauty', 'guide', 'premium'],
        category: 'Beauty Services',
        featured: true,
        priority: 'high',
        metrics: {
          views: 5420,
          engagement: 85,
          conversions: 78,
          shares: 145,
          comments: 23
        },
        seo: {
          score: 92,
          keywords: ['lash extensions', 'beauty salon', 'warsaw'],
          metaTitle: 'Complete Guide to Lash Extensions | Beauty Salon Warsaw',
          metaDescription: 'Professional lash extensions guide with expert tips and aftercare instructions.'
        },
        collaboration: {
          collaborators: 3,
          comments: 5,
          unresolvedIssues: 1,
          lastActivity: new Date('2024-01-22T14:30:00')
        },
        versions: 3,
        wordCount: 1850,
        readingTime: 9,
        language: 'en',
        aiOptimized: true,
        lastAnalyzed: new Date('2024-01-22T11:15:00')
      },
      {
        id: 'content-2',
        title: 'Brow Lamination Service',
        type: 'service',
        status: 'review',
        author: {
          id: 'user-2',
          name: 'Maria Nowak',
          avatar: '/avatars/maria.jpg'
        },
        createdAt: new Date('2024-01-18T14:30:00'),
        updatedAt: new Date('2024-01-23T16:45:00'),
        excerpt: 'Professional brow lamination service with long-lasting results...',
        tags: ['brows', 'lamination', 'service'],
        category: 'Beauty Services',
        featured: false,
        priority: 'medium',
        metrics: {
          views: 0,
          engagement: 0,
          conversions: 0,
          shares: 0,
          comments: 3
        },
        seo: {
          score: 78,
          keywords: ['brow lamination', 'eyebrows', 'beauty'],
          metaTitle: 'Brow Lamination Service | Professional Beauty Treatment',
          metaDescription: 'Get perfectly shaped brows with our professional brow lamination service.'
        },
        collaboration: {
          collaborators: 2,
          comments: 3,
          unresolvedIssues: 2,
          lastActivity: new Date('2024-01-23T16:45:00')
        },
        versions: 2,
        wordCount: 950,
        readingTime: 5,
        language: 'en',
        aiOptimized: false,
        lastAnalyzed: new Date('2024-01-23T16:45:00')
      }
    ];

    const mockStats: ContentStats = {
      total: mockContent.length,
      published: 1,
      draft: 0,
      scheduled: 0,
      review: 1,
      archived: 0,
      totalViews: mockContent.reduce((sum, item) => sum + item.metrics.views, 0),
      totalEngagement: Math.round(mockContent.reduce((sum, item) => sum + item.metrics.engagement, 0) / mockContent.length),
      totalConversions: mockContent.reduce((sum, item) => sum + item.metrics.conversions, 0),
      avgReadingTime: Math.round(mockContent.reduce((sum, item) => sum + item.readingTime, 0) / mockContent.length),
      aiOptimized: mockContent.filter(item => item.aiOptimized).length,
      collaborationActive: mockContent.filter(item => item.collaboration.collaborators > 1).length,
      thisMonthGrowth: 12.5,
      topPerforming: mockContent.filter(item => item.metrics.views > 1000),
      recentlyUpdated: mockContent.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()).slice(0, 3),
      needsAttention: mockContent.filter(item => item.status === 'review' || item.collaboration.unresolvedIssues > 0)
    };

    setContentItems(mockContent);
    setStats(mockStats);
  }, []);

  const filteredContent = contentItems.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesType = filterType === 'all' || item.type === filterType;
    const matchesStatus = filterStatus === 'all' || item.status === filterStatus;
    const matchesAuthor = filterAuthor === 'all' || item.author.id === filterAuthor;

    return matchesSearch && matchesType && matchesStatus && matchesAuthor;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'updatedAt':
        return b.updatedAt.getTime() - a.updatedAt.getTime();
      case 'createdAt':
        return b.createdAt.getTime() - a.createdAt.getTime();
      case 'views':
        return b.metrics.views - a.metrics.views;
      case 'engagement':
        return b.metrics.engagement - a.metrics.engagement;
      case 'title':
        return a.title.localeCompare(b.title);
      default:
        return 0;
    }
  });

  const getContentIcon = (type: string) => {
    const icons = {
      blog: BookOpen,
      service: Star,
      page: FileText,
      product: Target,
      gallery: ImageIcon,
      video: Video
    };
    return icons[type as keyof typeof icons] || FileText;
  };

  const getStatusColor = (status: string) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-700',
      review: 'bg-amber-100 text-amber-700',
      approved: 'bg-emerald-100 text-emerald-700',
      published: 'bg-blue-100 text-blue-700',
      scheduled: 'bg-purple-100 text-purple-700',
      archived: 'bg-gray-100 text-gray-700'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-700';
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      low: 'bg-green-100 text-green-700',
      medium: 'bg-amber-100 text-amber-700',
      high: 'bg-red-100 text-red-700'
    };
    return colors[priority as keyof typeof colors] || 'bg-gray-100 text-gray-700';
  };

  const StatCard = ({ title, value, change, icon: Icon, color = 'blue' }: {
    title: string;
    value: string | number;
    change?: number;
    icon: any;
    color?: string;
  }) => {
    const colorClasses = {
      blue: 'bg-blue-50 text-blue-600',
      green: 'bg-green-50 text-green-600',
      amber: 'bg-amber-50 text-amber-600',
      purple: 'bg-purple-50 text-purple-600'
    };

    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">{title}</p>
              <p className="text-2xl font-bold">{value}</p>
              {change !== undefined && (
                <div className={`flex items-center text-sm ${
                  change >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {change >= 0 ? <ArrowUpRight className="w-4 h-4 mr-1" /> : <ArrowDownRight className="w-4 h-4 mr-1" />}
                  {Math.abs(change)}%
                </div>
              )}
            </div>
            <div className={`p-3 rounded-lg ${colorClasses[color as keyof typeof colorClasses]}`}>
              <Icon className="w-6 h-6" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const ContentCard = ({ item }: { item: ContentItem }) => {
    const ContentIcon = getContentIcon(item.type);

    return (
      <Card className="hover:shadow-md transition-shadow cursor-pointer group">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <ContentIcon className="w-4 h-4 text-muted-foreground" />
                <Badge variant="outline">{item.type}</Badge>
                <Badge className={getStatusColor(item.status)}>
                  {item.status}
                </Badge>
                {item.featured && (
                  <Badge className="bg-amber-100 text-amber-700">
                    <Star className="w-3 h-3 mr-1" />
                    Featured
                  </Badge>
                )}
                <Badge className={getPriorityColor(item.priority)}>
                  {item.priority}
                </Badge>
              </div>
              <h3 className="font-semibold line-clamp-2 group-hover:text-blue-600 transition-colors">
                {item.title}
              </h3>
              <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                {item.excerpt}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            {/* Metrics */}
            {item.metrics.views > 0 && (
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <div className="text-lg font-bold">{item.metrics.views}</div>
                  <div className="text-xs text-muted-foreground">Views</div>
                </div>
                <div>
                  <div className="text-lg font-bold">{item.metrics.engagement}%</div>
                  <div className="text-xs text-muted-foreground">Engagement</div>
                </div>
                <div>
                  <div className="text-lg font-bold">{item.metrics.conversions}</div>
                  <div className="text-xs text-muted-foreground">Conversions</div>
                </div>
              </div>
            )}

            {/* Tags */}
            {item.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {item.tags.slice(0, 3).map(tag => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    #{tag}
                  </Badge>
                ))}
                {item.tags.length > 3 && (
                  <Badge variant="secondary" className="text-xs">
                    +{item.tags.length - 3}
                  </Badge>
                )}
              </div>
            )}

            {/* Author and Date */}
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Avatar className="w-4 h-4">
                  <AvatarImage src={item.author.avatar} />
                  <AvatarFallback className="text-xs">{item.author.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                </Avatar>
                <span>{item.author.name}</span>
              </div>
              <span>{item.updatedAt.toLocaleDateString()}</span>
            </div>

            {/* Collaboration Indicators */}
            {item.collaboration.collaborators > 1 && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Users className="w-3 h-3" />
                  <span>{item.collaboration.collaborators} collaborators</span>
                </div>
                {item.collaboration.unresolvedIssues > 0 && (
                  <Badge variant="destructive" className="text-xs">
                    {item.collaboration.unresolvedIssues} issues
                  </Badge>
                )}
              </div>
            )}

            {/* AI & SEO Indicators */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {item.aiOptimized && (
                  <Badge className="bg-purple-100 text-purple-700 text-xs">
                    <Sparkles className="w-3 h-3 mr-1" />
                    AI Optimized
                  </Badge>
                )}
                <Badge variant="outline" className="text-xs">
                  SEO: {item.seo.score}%
                </Badge>
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                <span>{item.readingTime} min read</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 mt-4 pt-3 border-t">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedItem(item);
                setShowContentEditor(true);
              }}
            >
              <Edit3 className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedItem(item);
              }}
            >
              <Eye className="w-4 h-4" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem>
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <History className="w-4 h-4 mr-2" />
                  View History
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <GitCompare className="w-4 h-4 mr-2" />
                  Compare Versions
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-red-600">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <LayoutDashboard className="w-8 h-8 text-blue-500" />
            Content Management Hub
          </h1>
          <p className="text-muted-foreground">
            World-class content management with AI optimization and real-time collaboration
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Upload className="w-4 h-4 mr-2" />
            Import
          </Button>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Content
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="editor">Editor</TabsTrigger>
          <TabsTrigger value="ai-optimizer">AI Optimizer</TabsTrigger>
          <TabsTrigger value="workflow">Workflow</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          {stats && (
            <>
              {/* Overview Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  title="Total Content"
                  value={stats.total}
                  change={stats.thisMonthGrowth}
                  icon={FileText}
                  color="blue"
                />
                <StatCard
                  title="Published"
                  value={stats.published}
                  icon={CheckCircle}
                  color="green"
                />
                <StatCard
                  title="Total Views"
                  value={stats.totalViews.toLocaleString()}
                  change={8.3}
                  icon={Eye}
                  color="purple"
                />
                <StatCard
                  title="AI Optimized"
                  value={`${stats.aiOptimized}/${stats.total}`}
                  change={25.0}
                  icon={Sparkles}
                  color="amber"
                />
              </div>

              {/* Quick Actions & Insights */}
              <div className="grid lg:grid-cols-3 gap-6">
                {/* Quick Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button className="w-full justify-start" onClick={() => setShowCreateDialog(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Create New Content
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Brain className="w-4 h-4 mr-2" />
                      Optimize with AI
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Users className="w-4 h-4 mr-2" />
                      Invite Collaborators
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Calendar className="w-4 h-4 mr-2" />
                      Schedule Publication
                    </Button>
                  </CardContent>
                </Card>

                {/* Top Performing */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-green-500" />
                      Top Performing
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {stats.topPerforming.map(item => (
                      <div key={item.id} className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{item.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {item.metrics.views} views • {item.metrics.engagement}% engagement
                          </p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {item.type}
                        </Badge>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Needs Attention */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-amber-500" />
                      Needs Attention
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {stats.needsAttention.map(item => (
                      <div key={item.id} className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{item.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {item.status} • {item.collaboration.unresolvedIssues} issues
                          </p>
                        </div>
                        <Badge variant="outline" className="text-xs text-amber-600">
                          Review
                        </Badge>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>

              {/* Recently Updated */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Recently Updated</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {stats.recentlyUpdated.map(item => (
                      <div key={item.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={item.author.avatar} />
                            <AvatarFallback>{item.author.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{item.title}</p>
                            <p className="text-sm text-muted-foreground">
                              Updated by {item.author.name} • {item.updatedAt.toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <Badge variant="outline">{item.type}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="content" className="space-y-6">
          {/* Filters and Search */}
          <Card>
            <CardContent className="py-4">
              <div className="flex flex-wrap items-center gap-4">
                <div className="relative flex-1 min-w-64">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search content..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="blog">Blog</SelectItem>
                    <SelectItem value="service">Service</SelectItem>
                    <SelectItem value="page">Page</SelectItem>
                    <SelectItem value="product">Product</SelectItem>
                    <SelectItem value="gallery">Gallery</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="review">Review</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="updatedAt">Last Updated</SelectItem>
                    <SelectItem value="createdAt">Created Date</SelectItem>
                    <SelectItem value="views">Most Views</SelectItem>
                    <SelectItem value="engagement">Engagement</SelectItem>
                    <SelectItem value="title">Title</SelectItem>
                  </SelectContent>
                </Select>

                <div className="flex items-center border rounded-md">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    className="rounded-r-none"
                  >
                    <Grid className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className="rounded-l-none"
                  >
                    <List className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Content Grid/List */}
          <div className={viewMode === 'grid' ? 'grid gap-4 md:grid-cols-2 lg:grid-cols-3' : 'space-y-4'}>
            {filteredContent.map(item => (
              <ContentCard key={item.id} item={item} />
            ))}
          </div>

          {filteredContent.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No content found</h3>
                <p className="text-muted-foreground mb-4">
                  No content matches your current filters
                </p>
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Content
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="editor">
          <Card>
            <CardHeader>
              <CardTitle>Rich Text Editor</CardTitle>
            </CardHeader>
            <CardContent>
              <RichTextEditor
                initialContent={editingContent?.excerpt || ''}
                enableAiAssistance={true}
                collaborationEnabled={true}
                versionHistoryEnabled={true}
                seoOptimizationEnabled={true}
                contentAnalyticsEnabled={true}
                onContentChange={(content) => {
                  console.log('Content changed:', content);
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai-optimizer">
          <AIContentOptimizer />
        </TabsContent>

        <TabsContent value="workflow">
          <ContentWorkflow />
        </TabsContent>

        <TabsContent value="analytics">
          <ContentPerformanceDashboard />
        </TabsContent>
      </Tabs>

      {/* Content Editor Dialog */}
      <Dialog open={showContentEditor} onOpenChange={setShowContentEditor}>
        <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingContent ? 'Edit Content' : 'Create Content'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <RichTextEditor
              initialContent={editingContent?.excerpt || ''}
              enableAiAssistance={true}
              collaborationEnabled={true}
              versionHistoryEnabled={true}
              seoOptimizationEnabled={true}
              contentAnalyticsEnabled={true}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Content Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Content</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block" htmlFor="content-type">Content Type</label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select content type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="blog">Blog Post</SelectItem>
                  <SelectItem value="service">Service Page</SelectItem>
                  <SelectItem value="page">Landing Page</SelectItem>
                  <SelectItem value="product">Product Description</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block" htmlFor="title">Title</label>
              <Input placeholder="Enter content title" />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button onClick={() => {
                setShowCreateDialog(false);
                setShowContentEditor(true);
              }}>
                Create Content
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ContentManagementHub;