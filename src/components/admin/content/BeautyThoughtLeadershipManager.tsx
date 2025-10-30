import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { toast aria-live="polite" aria-atomic="true" } from 'sonner';
import {
  Sparkles,
  TrendingUp,
  Award,
  Eye,
  Heart,
  Share2,
  MessageCircle,
  Calendar,
  Filter,
  Plus,
  Edit,
  Trash2,
  BarChart3,
  Target,
  Users,
  Zap,
  Star,
  BookOpen,
  Video,
  Image,
  Download,
  Search,
  ChevronDown,
  ChevronUp,
  Info,
  Settings,
  Lightbulb,
  Palette,
  Mic,
  Camera,
  FileText,
  Briefcase,
  Trophy,
  Crown,
  Gem,
  HeartHandshake,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Button,
} from '@/components/ui/button';
import {
  Input,
} from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Badge,
} from '@/components/ui/badge';
import {
  Progress,
} from '@/components/ui/progress';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Textarea,
} from '@/components/ui/textarea';
import {
  Label,
} from '@/components/ui/label';
import {
  Checkbox,
} from '@/components/ui/checkbox';

// Types
import {
  BeautyThoughtLeadership as BeautyThoughtLeadershipType,
  ContentCalendar,
  ContentPerformanceAnalytics,
} from '@/types/content-strategy';

interface BeautyThoughtLeadershipManagerProps {
  className?: string;
}

// Beauty category icons and descriptions
const BEAUTY_CATEGORIES = {
  lip_enhancements: {
    icon: <Heart className="w-4 h-4" />,
    color: 'bg-pink-100 text-pink-700',
    description: 'Lip treatments, enhancements, and artistry'
  },
  brow_artistry: {
    icon: <Edit className="w-4 h-4" />,
    color: 'bg-amber-100 text-amber-700',
    description: 'Brow shaping, tinting, and microblading'
  },
  skincare_treatments: {
    icon: <Sparkles className="w-4 h-4" />,
    color: 'bg-green-100 text-green-700',
    description: 'Skincare routines and treatments'
  },
  makeup_artistry: {
    icon: <Palette className="w-4 h-4" />,
    color: 'bg-purple-100 text-purple-700',
    description: 'Makeup techniques and applications'
  },
  beauty_trends: {
    icon: <TrendingUp className="w-4 h-4" />,
    color: 'bg-blue-100 text-blue-700',
    description: 'Latest beauty trends and innovations'
  },
  industry_insights: {
    icon: <Briefcase className="w-4 h-4" />,
    color: 'bg-gray-100 text-gray-700',
    description: 'Business insights and industry analysis'
  },
  product_reviews: {
    icon: <Star className="w-4 h-4" />,
    color: 'bg-yellow-100 text-yellow-700',
    description: 'Product reviews and recommendations'
  },
  technique_tutorials: {
    icon: <Video className="w-4 h-4" />,
    color: 'bg-red-100 text-red-700',
    description: 'Step-by-step technique tutorials'
  },
  client_education: {
    icon: <BookOpen className="w-4 h-4" />,
    color: 'bg-indigo-100 text-indigo-700',
    description: 'Client education and guidance'
  },
  business_growth: {
    icon: <Trophy className="w-4 h-4" />,
    color: 'bg-emerald-100 text-emerald-700',
    description: 'Business growth and scaling strategies'
  },
  innovation_technology: {
    icon: <Zap className="w-4 h-4" />,
    color: 'bg-cyan-100 text-cyan-700',
    description: 'Beauty technology and innovations'
  },
  sustainability: {
    icon: <HeartHandshake className="w-4 h-4" />,
    color: 'bg-lime-100 text-lime-700',
    description: 'Sustainable beauty practices'
  },
};

const EXPERTISE_LEVELS = {
  beginner: {
    label: 'Beginner',
    color: 'bg-green-100 text-green-700',
    description: 'Basic concepts and fundamentals'
  },
  intermediate: {
    label: 'Intermediate',
    color: 'bg-yellow-100 text-yellow-700',
    description: 'Developing skills and techniques'
  },
  advanced: {
    label: 'Advanced',
    color: 'bg-orange-100 text-orange-700',
    description: 'Professional-level techniques'
  },
  expert: {
    label: 'Expert',
    color: 'bg-purple-100 text-purple-700',
    description: 'Master-level and innovative techniques'
  },
};

// Sample data for demonstration
const sampleBeautyContent: BeautyThoughtLeadershipType[] = [
  {
    id: '1',
    content_id: 'content-1',
    beauty_category: 'lip_enhancements',
    expertise_level: 'advanced',
    techniques_demonstrated: ['lip blush', 'lip contouring', 'ombre lips'],
    products_mentioned: ['permanent makeup pigments', 'anesthetic cream', 'aftercare balm'],
    tools_required: ['pmu machine', 'cartridges', 'lip mapping tools'],
    skill_prerequisites: ['basic pmu knowledge', 'color theory'],
    learning_objectives: ['master lip blush technique', 'understand lip anatomy', 'client consultation skills'],
    trend_analysis: { popularity: 'high', season: 'year_round', targetAge: '25-45' },
    market_insights: { demand: 'growing', competition: 'medium', avgPrice: '800-1500 PLN' },
    expert_opinions: { industryLeaders: ['recommended'], certificationRequired: true },
    research_citations: ['lip anatomy study 2023', 'pigment safety research'],
    before_after_images: ['image1.jpg', 'image2.jpg'],
    step_by_step_images: ['step1.jpg', 'step2.jpg', 'step3.jpg'],
    video_demonstration_url: 'https://example.com/lip-blush-tutorial',
    preparation_steps: ['client consultation', 'lip mapping', 'color selection'],
    aftercare_instructions: ['avoid touching', 'use aftercare balm', 'no spicy food'],
    common_mistakes: ['incorrect depth', 'wrong color choice', 'poor aftercare'],
    tips_tricks: ['use proper lighting', 'stretch lips gently', 'check symmetry often'],
    cost_analysis: { supplies: 50, time: 120, profitMargin: 85 },
    roi_metrics: { avgClientValue: 1200, repeatBusiness: 40, referralRate: 25 },
    client_satisfaction_factors: ['realistic expectations', 'proper aftercare', 'color retention'],
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
  },
];

const sampleContentPerformance: ContentPerformanceAnalytics[] = [
  {
    id: '1',
    content_id: 'content-1',
    date: '2024-01-15',
    views: 2500,
    unique_views: 2100,
    average_time_on_page_seconds: 180,
    bounce_rate: 35,
    likes: 180,
    shares: 45,
    comments: 23,
    saves_bookmarks: 89,
    clicks: 156,
    conversions: 12,
    conversion_rate: 0.48,
    revenue_generated: 14400,
    website_visits: 890,
    instagram_engagement: 280,
    facebook_engagement: 120,
    tiktok_views: 3400,
    newsletter_clicks: 45,
    quality_score: 92,
    relevance_score: 88,
    sentiment_score: 85,
    demographic_data: { age: '25-45', gender: 'female', location: 'Warsaw' },
    geographic_data: { poland: 75, europe: 20, other: 5 },
    behavior_data: { device: 'mobile', sessionDuration: 180, pagesVisited: 3.2 },
    video_completion_rate: 78,
    audio_completion_rate: 0,
    quiz_completion_rate: 0,
    download_completion_rate: 45,
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
  },
];

export const BeautyThoughtLeadershipManager = ({ className }: BeautyThoughtLeadershipManagerProps) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('content');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedExpertise, setSelectedExpertise] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [selectedContent, setSelectedContent] = useState<BeautyThoughtLeadershipType | null>(null);

  // State for content management
  const [beautyContent, setBeautyContent] = useState<BeautyThoughtLeadershipType[]>(sampleBeautyContent);
  const [performance, setPerformance] = useState<ContentPerformanceAnalytics[]>(sampleContentPerformance);

  // Toggle expanded state for content items
  const toggleExpanded = (id: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  // Filter content based on selected filters
  const filteredContent = beautyContent.filter(content => {
    const matchesCategory = selectedCategory === 'all' || content.beauty_category === selectedCategory;
    const matchesExpertise = selectedExpertise === 'all' || content.expertise_level === selectedExpertise;
    const matchesSearch = searchTerm === '' ||
      content.techniques_demonstrated.some(tech =>
        tech.toLowerCase().includes(searchTerm.toLowerCase())
      );
    return matchesCategory && matchesExpertise && matchesSearch;
  });

  // Get performance metrics for content
  const getContentPerformance = (contentId: string) => {
    return performance.find(p => p.content_id === contentId);
  };

  // Calculate total metrics
  const totalMetrics = performance.reduce((acc, curr) => ({
    totalViews: acc.totalViews + curr.views,
    totalEngagement: acc.totalEngagement + curr.likes + curr.shares + curr.comments,
    totalConversions: acc.totalConversions + curr.conversions,
    avgEngagementRate: (acc.avgEngagementRate + curr.engagement_rate || 0) / (performance.length || 1),
  }), { totalViews: 0, totalEngagement: 0, totalConversions: 0, avgEngagementRate: 0 });

  // Beauty Thought Leadership Content Card Component
  const BeautyContentCard = ({ content }: { content: BeautyThoughtLeadershipType }) => {
    const contentPerf = getContentPerformance(content.content_id);
    const isExpanded = expandedItems.has(content.id);
    const categoryInfo = BEAUTY_CATEGORIES[content.beauty_category];
    const expertiseInfo = EXPERTISE_LEVELS[content.expertise_level];

    return (
      <Card className="transition-all duration-200 hover:shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={cn('p-2 rounded-lg', categoryInfo.color)}>
                {categoryInfo.icon}
              </div>
              <div>
                <CardTitle className="text-lg">
                  {content.techniques_demonstrated.join(', ')}
                </CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className={cn('text-xs', expertiseInfo.color)}>
                    {expertiseInfo.label}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {content.learning_objectives.length} learning objectives
                  </span>
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleExpanded(content.id)}
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          <div className="space-y-4">
            {/* Quick Stats */}
            {contentPerf && (
              <div className="grid grid-cols-4 gap-4 p-3 bg-gray-50 rounded-lg">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-blue-600">
                    <Eye className="w-4 h-4" />
                    <span className="font-semibold">{contentPerf.views.toLocaleString()}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">Views</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-pink-600">
                    <Heart className="w-4 h-4" />
                    <span className="font-semibold">{contentPerf.likes}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">Likes</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-green-600">
                    <Share2 className="w-4 h-4" />
                    <span className="font-semibold">{contentPerf.shares}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">Shares</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-purple-600">
                    <Target className="w-4 h-4" />
                    <span className="font-semibold">{contentPerf.conversions}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">Conversions</div>
                </div>
              </div>
            )}

            {/* Techniques and Tools */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-2">Techniques</h4>
                <div className="flex flex-wrap gap-1">
                  {content.techniques_demonstrated.slice(0, 3).map((technique, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs">
                      {technique}
                    </Badge>
                  ))}
                  {content.techniques_demonstrated.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{content.techniques_demonstrated.length - 3}
                    </Badge>
                  )}
                </div>
              </div>
              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-2">Tools Required</h4>
                <div className="flex flex-wrap gap-1">
                  {content.tools_required.slice(0, 3).map((tool, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      {tool}
                    </Badge>
                  ))}
                  {content.tools_required.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{content.tools_required.length - 3}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Expanded Content */}
            {isExpanded && (
              <div className="space-y-4 pt-4 border-t">
                {/* Learning Objectives */}
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-2">
                    Learning Objectives
                  </h4>
                  <ul className="text-sm space-y-1">
                    {content.learning_objectives.map((objective, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                        {objective}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Market Insights */}
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-2">
                    Market Insights
                  </h4>
                  <div className="grid grid-cols-3 gap-4 p-3 bg-blue-50 rounded-lg">
                    <div className="text-center">
                      <div className="font-semibold text-blue-700">
                        {content.market_insights.demand}
                      </div>
                      <div className="text-xs text-muted-foreground">Demand</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-blue-700">
                        {content.market_insights.competition}
                      </div>
                      <div className="text-xs text-muted-foreground">Competition</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-blue-700">
                        {content.market_insights.avgPrice}
                      </div>
                      <div className="text-xs text-muted-foreground">Avg Price</div>
                    </div>
                  </div>
                </div>

                {/* Business Metrics */}
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-2">
                    Business Metrics
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Profit Margin</span>
                        <span className="font-semibold text-green-700">
                          {content.cost_analysis.profitMargin}%
                        </span>
                      </div>
                    </div>
                    <div className="p-3 bg-purple-50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Referral Rate</span>
                        <span className="font-semibold text-purple-700">
                          {content.roi_metrics.referralRate}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Visual Assets */}
                {(content.before_after_images.length > 0 || content.video_demonstration_url) && (
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-2">
                      Visual Assets
                    </h4>
                    <div className="flex gap-2">
                      {content.before_after_images.length > 0 && (
                        <div className="flex items-center gap-1 px-2 py-1 bg-pink-100 text-pink-700 rounded text-xs">
                          <Image className="w-3 h-3" alt="Image" />
                          {content.before_after_images.length} Before/After
                        </div>
                      )}
                      {content.video_demonstration_url && (
                        <div className="flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded text-xs">
                          <Video className="w-3 h-3" />
                          Video Tutorial
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button size="sm" variant="outline">
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  <Button size="sm" variant="outline">
                    <BarChart3 className="w-4 h-4 mr-1" />
                    Analytics
                  </Button>
                  <Button size="sm" variant="outline">
                    <Share2 className="w-4 h-4 mr-1" />
                    Share
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Crown className="w-8 h-8 text-primary" />
            Beauty Industry Thought Leadership
          </h1>
          <p className="text-muted-foreground mt-2">
            Establish authority and expertise in the Polish beauty industry
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Create Content
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Beauty Thought Leadership Content</DialogTitle>
                <DialogDescription>
                  Design expert content that establishes your authority in the beauty industry
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="category">Beauty Category</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(BEAUTY_CATEGORIES).map(([key, info]) => (
                          <SelectItem key={key} value={key}>
                            <div className="flex items-center gap-2">
                              {info.icon}
                              <span className="capitalize">{key.replace('_', ' ')}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="expertise">Expertise Level</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select level" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(EXPERTISE_LEVELS).map(([key, info]) => (
                          <SelectItem key={key} value={key}>
                            <div className="flex items-center gap-2">
                              <div className={cn('w-3 h-3 rounded-full', info.color.split(' ')[0])}></div>
                              {info.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="techniques">Techniques Demonstrated</Label>
                  <Input placeholder="e.g., Lip Blush, Microblading, Ombre Brows" />
                </div>

                <div>
                  <Label htmlFor="objectives">Learning Objectives</Label>
                  <Textarea
                    placeholder="What will readers learn from this content?"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="tools">Tools Required</Label>
                    <Input placeholder="List tools and equipment needed" />
                  </div>
                  <div>
                    <Label htmlFor="products">Products Mentioned</Label>
                    <Input placeholder="List products featured in content" />
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>Content Assets</Label>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox id="before-after" />
                      <label htmlFor="before-after" className="text-sm">
                        Before/After Images
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="video-tutorial" />
                      <label htmlFor="video-tutorial" className="text-sm">
                        Video Tutorial
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="step-guide" />
                      <label htmlFor="step-guide" className="text-sm">
                        Step-by-Step Guide
                      </label>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button onClick={() => setShowCreateDialog(false)}>
                    Create Content
                  </Button>
                  <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Performance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Views</p>
              <p className="text-2xl font-bold">{totalMetrics.totalViews.toLocaleString()}</p>
            </div>
            <Eye className="w-8 h-8 text-blue-500" />
          </div>
          <div className="mt-2">
            <span className="text-xs text-green-600">+12% from last month</span>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Engagement</p>
              <p className="text-2xl font-bold">{totalMetrics.totalEngagement.toLocaleString()}</p>
            </div>
            <Heart className="w-8 h-8 text-pink-500" />
          </div>
          <div className="mt-2">
            <span className="text-xs text-green-600">+8% from last month</span>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Conversions</p>
              <p className="text-2xl font-bold">{totalMetrics.totalConversions}</p>
            </div>
            <Target className="w-8 h-8 text-purple-500" />
          </div>
          <div className="mt-2">
            <span className="text-xs text-green-600">+15% from last month</span>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Content Pieces</p>
              <p className="text-2xl font-bold">{beautyContent.length}</p>
            </div>
            <Crown className="w-8 h-8 text-amber-500" />
          </div>
          <div className="mt-2">
            <span className="text-xs text-muted-foreground">3 published this month</span>
          </div>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="content" className="flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            Content Library
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="trends" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Trends
          </TabsTrigger>
          <TabsTrigger value="strategy" className="flex items-center gap-2">
            <Lightbulb className="w-4 h-4" />
            Strategy
          </TabsTrigger>
        </TabsList>

        {/* Content Library Tab */}
        <TabsContent value="content" className="space-y-6">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search techniques, tools, or keywords..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {Object.entries(BEAUTY_CATEGORIES).map(([key, info]) => (
                  <SelectItem key={key} value={key}>
                    <div className="flex items-center gap-2">
                      {info.icon}
                      <span className="capitalize">{key.replace('_', ' ')}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedExpertise} onValueChange={setSelectedExpertise}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                {Object.entries(EXPERTISE_LEVELS).map(([key, info]) => (
                  <SelectItem key={key} value={key}>
                    <div className="flex items-center gap-2">
                      <div className={cn('w-3 h-3 rounded-full', info.color.split(' ')[0])}></div>
                      {info.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Content Grid */}
          <div className="grid gap-6">
            {filteredContent.map((content) => (
              <BeautyContentCard key={content.id} content={content} />
            ))}
          </div>

          {filteredContent.length === 0 && (
            <Card className="p-12 text-center">
              <Crown className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No content found</h3>
              <p className="text-muted-foreground mb-4">
                Try adjusting your filters or create new beauty thought leadership content.
              </p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Content
              </Button>
            </Card>
          )}
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Content Performance Analytics
              </CardTitle>
              <CardDescription>
                Track how your beauty thought leadership content is performing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Performance Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="p-6 bg-gradient-to-br from-pink-50 to-purple-50 rounded-lg">
                    <h4 className="font-semibold mb-4">Top Performing Content</h4>
                    <div className="space-y-3">
                      {performance.slice(0, 3).map((perf, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-white rounded-lg">
                          <div>
                            <div className="font-medium">Beauty Content #{idx + 1}</div>
                            <div className="text-sm text-muted-foreground">
                              {perf.views.toLocaleString()} views
                            </div>
                          </div>
                          <Badge variant="secondary">
                            {perf.engagement_rate || 0}% engagement
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-6 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg">
                    <h4 className="font-semibold mb-4">Category Performance</h4>
                    <div className="space-y-3">
                      {Object.entries(BEAUTY_CATEGORIES).slice(0, 4).map(([key, info]) => (
                        <div key={key} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {info.icon}
                            <span className="capitalize text-sm">{key.replace('_', ' ')}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-20 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-500 h-2 rounded-full"
                                style={{ width: `${Math.random() * 60 + 40}%` }}
                              ></div>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {Math.floor(Math.random() * 2000 + 500)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Detailed Metrics */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4">Content</th>
                        <th className="text-left py-3 px-4">Views</th>
                        <th className="text-left py-3 px-4">Engagement</th>
                        <th className="text-left py-3 px-4">Shares</th>
                        <th className="text-left py-3 px-4">Conversions</th>
                        <th className="text-left py-3 px-4">Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {performance.map((perf, idx) => (
                        <tr key={idx} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <div className="font-medium">Beauty Content #{idx + 1}</div>
                            <div className="text-sm text-muted-foreground">
                              {new Date(perf.date).toLocaleDateString()}
                            </div>
                          </td>
                          <td className="py-3 px-4">{perf.views.toLocaleString()}</td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1">
                              <Heart className="w-4 h-4 text-pink-500" />
                              {perf.likes + perf.comments + perf.saves_bookmarks}
                            </div>
                          </td>
                          <td className="py-3 px-4">{perf.shares}</td>
                          <td className="py-3 px-4">{perf.conversions}</td>
                          <td className="py-3 px-4">
                            <span className="font-medium text-green-600">
                              {perf.revenue_generated.toLocaleString()} PLN
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Beauty Industry Trends
              </CardTitle>
              <CardDescription>
                Stay ahead of the curve with emerging beauty trends and insights
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Trending Topics */}
                <div className="p-6 bg-gradient-to-br from-pink-100 to-purple-100 rounded-lg">
                  <h4 className="font-semibold mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-pink-600" />
                    Trending Now
                  </h4>
                  <div className="space-y-2">
                    {['Lip Blush Techniques', 'Ombre Brows', 'Lash Lifting', 'Henna Brows'].map((trend, idx) => (
                      <div key={idx} className="flex items-center justify-between">
                        <span className="text-sm">{trend}</span>
                        <Badge variant="secondary" className="text-xs">
                          +{Math.floor(Math.random() * 50 + 10)}%
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Seasonal Trends */}
                <div className="p-6 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-lg">
                  <h4 className="font-semibold mb-4 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    Seasonal Focus
                  </h4>
                  <div className="space-y-3">
                    <div className="p-3 bg-white rounded-lg">
                      <div className="font-medium text-sm">Winter 2024</div>
                      <div className="text-xs text-muted-foreground">
                        Deep lip colors, skincare protection
                      </div>
                    </div>
                    <div className="p-3 bg-white rounded-lg">
                      <div className="font-medium text-sm">Spring 2024</div>
                      <div className="text-xs text-muted-foreground">
                        Fresh looks, brow emphasis
                      </div>
                    </div>
                  </div>
                </div>

                {/* Market Opportunities */}
                <div className="p-6 bg-gradient-to-br from-green-100 to-emerald-100 rounded-lg">
                  <h4 className="font-semibold mb-4 flex items-center gap-2">
                    <Target className="w-5 h-5 text-green-600" />
                    Market Gaps
                  </h4>
                  <div className="space-y-2">
                    {['Men\'s grooming education', 'Mature beauty techniques', 'Sustainable practices'].map((gap, idx) => (
                      <div key={idx} className="p-2 bg-white rounded text-sm">
                        {gap}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Content Recommendations */}
              <div className="mt-8 p-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
                <h4 className="font-semibold mb-4">AI-Powered Content Recommendations</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-white rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Lightbulb className="w-5 h-5 text-amber-500" />
                      <span className="font-medium">High-Impact Topics</span>
                    </div>
                    <ul className="text-sm space-y-1">
                      <li>• Advanced lip neutralization techniques</li>
                      <li>• Brow mapping for different face shapes</li>
                      <li>• Color theory for skin undertones</li>
                    </ul>
                  </div>
                  <div className="p-4 bg-white rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Gem className="w-5 h-5 text-purple-500" />
                      <span className="font-medium">Premium Content Ideas</span>
                    </div>
                    <ul className="text-sm space-y-1">
                      <li>• Client transformation series</li>
                      <li>• Behind-the-scenes studio tour</li>
                      <li>• Expert interviews and collaborations</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Strategy Tab */}
        <TabsContent value="strategy" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Content Pillars */}
            <Card>
              <CardHeader>
                <CardTitle>Content Pillars</CardTitle>
                <CardDescription>
                  Core themes that define your beauty expertise
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { name: 'Technical Excellence', progress: 85, color: 'bg-blue-500' },
                    { name: 'Client Education', progress: 92, color: 'bg-green-500' },
                    { name: 'Industry Innovation', progress: 78, color: 'bg-purple-500' },
                    { name: 'Business Growth', progress: 70, color: 'bg-orange-500' },
                  ].map((pillar, idx) => (
                    <div key={idx} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{pillar.name}</span>
                        <span className="text-sm text-muted-foreground">{pillar.progress}%</span>
                      </div>
                      <Progress value={pillar.progress} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Target Audience */}
            <Card>
              <CardHeader>
                <CardTitle>Target Audience Segments</CardTitle>
                <CardDescription>
                  Key demographics you're reaching with beauty content
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { segment: 'Beauty Professionals', reach: 2400, engagement: '12%' },
                    { segment: 'Aspiring Artists', reach: 3200, engagement: '18%' },
                    { segment: 'Potential Clients', reach: 5600, engagement: '8%' },
                    { segment: 'Industry Peers', reach: 1800, engagement: '15%' },
                  ].map((audience, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium">{audience.segment}</div>
                        <div className="text-sm text-muted-foreground">
                          {audience.reach.toLocaleString()} reach
                        </div>
                      </div>
                      <Badge variant="outline">{audience.engagement} engagement</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Strategic Initiatives */}
          <Card>
            <CardHeader>
              <CardTitle>Strategic Content Initiatives</CardTitle>
              <CardDescription>
                Long-term content strategies to establish market authority
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 border rounded-lg">
                  <Crown className="w-8 h-8 text-amber-500 mb-4" />
                  <h4 className="font-semibold mb-2">Thought Leadership</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Position yourself as the go-to expert in lip enhancements and brow artistry
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      Expert interviews
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      Trend forecasting
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                      Industry analysis
                    </div>
                  </div>
                </div>

                <div className="p-6 border rounded-lg">
                  <Users className="w-8 h-8 text-blue-500 mb-4" />
                  <h4 className="font-semibold mb-2">Community Building</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Create a loyal community of beauty enthusiasts and professionals
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      Interactive tutorials
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      Q&A sessions
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                      Student showcases
                    </div>
                  </div>
                </div>

                <div className="p-6 border rounded-lg">
                  <Trophy className="w-8 h-8 text-purple-500 mb-4" />
                  <h4 className="font-semibold mb-2">Market Education</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Educate the Polish market on premium beauty services
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      Service comparisons
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      Value education
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                      Myth debunking
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BeautyThoughtLeadershipManager;