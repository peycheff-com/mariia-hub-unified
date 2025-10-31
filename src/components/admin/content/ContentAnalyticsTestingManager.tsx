import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
  BarChart3,
  TrendingUp,
  Eye,
  Heart,
  Share2,
  MessageCircle,
  Target,
  Users,
  Clock,
  Calendar,
  Filter,
  Search,
  Plus,
  Edit,
  Trash2,
  Play,
  Pause,
  CheckCircle,
  XCircle,
  AlertCircle,
  Award,
  Zap,
  Brain,
  Lightbulb,
  Settings,
  Download,
  RefreshCw,
  BarChart,
  PieChart,
  LineChart,
  Activity,
  Layers,
  Split,
  GitBranch,
  Flask,
  Beaker,
  TestTube,
  Trophy,
  Medal,
  Star,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Globe,
  Smartphone,
  Monitor,
  Tablet,
  MousePointer,
  Click,
  Timer,
  DollarSign,
  ShoppingCart,
  CreditCard,
  TrendingDown,
  ArrowUp,
  ArrowDown,
  Minus,
  Info,
  HelpCircle,
  BookOpen,
  FileText,
  Video,
  Image,
  Mic,
  Headphones,
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
import {
  Slider,
} from '@/components/ui/slider';

// Types
import {
  ContentPerformanceAnalytics as ContentPerformanceAnalyticsType,
  ContentABTests as ContentABTestsType,
  ContentPerformanceBenchmarks as ContentPerformanceBenchmarksType,
  ContentAIInsights as ContentAIInsightsType,
  ContentAnalyticsFilters,
  ContentAnalyticsDashboard,
} from '@/types/content-strategy';

interface ContentAnalyticsTestingManagerProps {
  className?: string;
}

// A/B Test variables with descriptions
const AB_TEST_VARIABLES = {
  headline: {
    icon: <FileText className="w-4 h-4" />,
    description: 'Test different headline variations for better click-through rates',
    examples: ['"10 Tips for Perfect Lips"', "Your Guide to Lip Blush", "Get Perfect Lips Today"],
    impact: 'High',
    difficulty: 'Low',
  },
  featured_image: {
    icon: <Image className="w-4 h-4" alt="" />,
    description: 'Compare different images to find most engaging visuals',
    examples: ['Before/After photos', 'Lifestyle shots', 'Product-focused images'],
    impact: 'High',
    difficulty: 'Medium',
  },
  content_structure: {
    icon: <Layers className="w-4 h-4" />,
    description: 'Test different content layouts and structures',
    examples: ['Step-by-step vs. overview', 'Short vs. long form', 'Bullet points vs. paragraphs'],
    impact: 'Medium',
    difficulty: 'Medium',
  },
  call_to_action: {
    icon: <Target className="w-4 h-4" />,
    description: 'Optimize CTAs for better conversion rates',
    examples: ['"Book Now"', "Schedule Consultation", "Learn More"],
    impact: 'Very High',
    difficulty: 'Low',
  },
  format: {
    icon: <Video className="w-4 h-4" />,
    description: 'Compare different content formats (video, text, interactive)',
    examples: ['Video tutorial vs. written guide', 'Interactive quiz vs. article'],
    impact: 'High',
    difficulty: 'High',
  },
  tone: {
    icon: <MessageSquare className="w-4 h-4" />,
    description: 'Test different writing tones and styles',
    examples: ['Professional vs. casual', 'Educational vs. inspirational', 'Formal vs. friendly'],
    impact: 'Medium',
    difficulty: 'Low',
  },
};

// Primary metrics for A/B testing
const PRIMARY_METRICS = {
  engagement_rate: {
    icon: <Heart className="w-4 h-4" />,
    label: 'Engagement Rate',
    description: 'Percentage of users who engage with content',
    calculation: '(Likes + Comments + Shares) / Views',
    goodBenchmark: '5-8%',
    excellentBenchmark: '10%+',
  },
  conversion_rate: {
    icon: <ShoppingCart className="w-4 h-4" />,
    label: 'Conversion Rate',
    description: 'Percentage of users who complete desired action',
    calculation: 'Conversions / Clicks',
    goodBenchmark: '2-4%',
    excellentBenchmark: '6%+',
  },
  time_on_page: {
    icon: <Clock className="w-4 h-4" />,
    label: 'Time on Page',
    description: 'Average time users spend on content',
    calculation: 'Total time on page / Total views',
    goodBenchmark: '2-3 minutes',
    excellentBenchmark: '5+ minutes',
  },
  share_rate: {
    icon: <Share2 className="w-4 h-4" />,
    label: 'Share Rate',
    description: 'Percentage of users who share content',
    calculation: 'Shares / Views',
    goodBenchmark: '1-3%',
    excellentBenchmark: '5%+',
  },
};

// Sample data for demonstration
const sampleContentPerformance: ContentPerformanceAnalyticsType[] = [
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
  {
    id: '2',
    content_id: 'content-2',
    date: '2024-01-16',
    views: 3200,
    unique_views: 2800,
    average_time_on_page_seconds: 240,
    bounce_rate: 28,
    likes: 245,
    shares: 67,
    comments: 34,
    saves_bookmarks: 156,
    clicks: 189,
    conversions: 18,
    conversion_rate: 0.56,
    revenue_generated: 27900,
    website_visits: 1100,
    instagram_engagement: 320,
    facebook_engagement: 145,
    tiktok_views: 4500,
    newsletter_clicks: 67,
    quality_score: 94,
    relevance_score: 91,
    sentiment_score: 88,
    demographic_data: { age: '25-45', gender: 'female', location: 'Warsaw' },
    geographic_data: { poland: 80, europe: 15, other: 5 },
    behavior_data: { device: 'mobile', sessionDuration: 240, pagesVisited: 4.1 },
    video_completion_rate: 85,
    audio_completion_rate: 0,
    quiz_completion_rate: 0,
    download_completion_rate: 67,
    created_at: '2024-01-16T10:00:00Z',
    updated_at: '2024-01-16T10:00:00Z',
  },
];

const sampleABTests: ContentABTestsType[] = [
  {
    id: '1',
    test_name: 'Lip Blush Headline Test',
    hypothesis: 'A benefit-focused headline will increase click-through rates by 15%',
    content_a_id: 'content-1',
    content_b_id: 'content-2',
    traffic_split_percentage: 50,
    test_variable: 'headline',
    start_date: '2024-01-15',
    end_date: '2024-01-22',
    sample_size_target: 2000,
    primary_metric: 'engagement_rate',
    minimum_detectable_effect: 10,
    confidence_level: 95,
    status: 'completed',
    variant_a_performance: {
      views: 1250,
      engagement_rate: 7.2,
      conversion_rate: 0.48,
      time_on_page: 180,
    },
    variant_b_performance: {
      views: 1275,
      engagement_rate: 8.9,
      conversion_rate: 0.56,
      time_on_page: 240,
    },
    statistical_significance: 97.3,
    winner_variant: 'variant_b',
    confidence_interval: {
      lower: 15.2,
      upper: 23.8,
    },
    key_learnings: [
      'Benefit-focused headlines outperform feature-focused',
      'Emotional language increases engagement',
      'Specific numbers build credibility',
    ],
    recommendations: [
      'Use benefit-focused headlines in future content',
      'A/B test emotional vs. rational appeals',
      'Test specific numbers vs. general statements',
    ],
    business_impact: '23% increase in engagement rate leading to 27,900 PLN additional revenue',
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-22T10:00:00Z',
    completed_at: '2024-01-22T10:00:00Z',
  },
];

const sampleBenchmarks: ContentPerformanceBenchmarksType[] = [
  {
    id: '1',
    content_category: 'beauty_education',
    content_format: 'blog_post',
    target_audience: 'beauty_professionals',
    industry_average_views: 800,
    industry_average_engagement_rate: 4.2,
    industry_average_conversion_rate: 2.1,
    target_views: 1200,
    target_engagement_rate: 6.0,
    target_conversion_rate: 3.5,
    top_performing_content: ['content-2', 'content-5', 'content-8'],
    best_practices: {
      headline_length: '50-60 characters',
      content_length: '1500-2000 words',
      image_count: '3-5 high-quality images',
      cta_placement: 'After key value proposition',
    },
    benchmark_period_start: '2024-01-01',
    benchmark_period_end: '2024-01-31',
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
  },
];

const sampleAIInsights: ContentAIInsightsType[] = [
  {
    id: '1',
    content_id: 'content-1',
    sentiment_analysis: {
      overall_sentiment: 'positive',
      sentiment_score: 0.78,
      emotional_tone: 'inspirational',
      key_emotions: ['excitement', 'trust', 'anticipation'],
    },
    topic_modeling: {
      primary_topics: ['lip blush', 'beauty techniques', 'client education'],
      topic_distribution: { 'lip blush': 0.45, 'beauty techniques': 0.35, 'client education': 0.20 },
      topic_sentiment: { 'lip blush': 0.82, 'beauty techniques': 0.75, 'client education': 0.80 },
    },
    readability_analysis: {
      flesch_kincaid_grade: 8.5,
      reading_ease: 72.3,
      average_sentence_length: 15.2,
      average_words_per_sentence: 12.8,
      complex_words_percentage: 12.5,
    },
    seo_analysis: {
      keyword_density: { 'lip blush': 2.1, 'beauty': 1.8, 'tutorial': 1.2 },
      seo_score: 88,
      meta_description_optimized: true,
      heading_structure: 'optimal',
      internal_linking: 'good',
      readability_score: 92,
    },
    predicted_performance: {
      predicted_views: 2800,
      predicted_engagement_rate: 8.5,
      predicted_conversion_rate: 0.62,
      confidence_level: 87,
      success_probability: 0.73,
    },
    optimal_publication_time: {
      best_days: ['Tuesday', 'Wednesday', 'Thursday'],
      best_times: ['09:00', '14:00', '19:00'],
      seasonal_factors: 'Higher engagement in spring/winter',
      platform_specific: { instagram: 'evening', facebook: 'afternoon', tiktok: 'morning' },
    },
    recommended_improvements: {
      high_impact: [
        'Add more specific numbers in headline',
        'Include before/after images',
        'Add video demonstration',
      ],
      medium_impact: [
        'Optimize meta description',
        'Add more internal links',
        'Include client testimonials',
      ],
      low_impact: [
        'Adjust heading structure',
        'Add related articles section',
        'Improve alt text descriptions',
      ],
    },
    competitive_positioning: {
      market_position: 'above_average',
      competitive_advantage: ['practical tips', 'step-by-step approach', 'visual examples'],
      improvement_opportunities: ['video content', 'interactive elements', 'expert interviews'],
      market_gap_opportunities: ['advanced techniques', 'troubleshooting guides', 'cost breakdown'],
    },
    content_gap_analysis: {
      missing_topics: ['advanced techniques', 'common mistakes', 'cost analysis'],
      underserved_audiences: ['advanced practitioners', 'budget-conscious clients', 'time-pressed professionals'],
      content_format_opportunities: ['video tutorials', 'interactive guides', 'checklists'],
    },
    trending_topics: {
      current_trends: ['natural makeup', 'minimalist beauty', 'sustainable practices'],
      emerging_trends: ['AI-enhanced beauty', 'personalized routines', 'wellness integration'],
      seasonal_trends: ['spring renewal looks', 'summer waterproof makeup', 'winter skincare'],
    },
    audience_persona_alignment: {
      primary_persona_match: 0.85,
      secondary_persona_match: 0.72,
      persona_gaps: ['beginner level content', 'budget options'],
      content_preferences: { 'video': 0.78, 'step-by-step guides': 0.92, 'quick tips': 0.65 },
    },
    engagement_predictions: {
      predicted_likes: 265,
      predicted_shares: 78,
      predicted_comments: 45,
      predicted_saves: 198,
      engagement_breakdown: { 'likes': 0.45, 'shares': 0.13, 'comments': 0.08, 'saves': 0.34 },
    },
    recommended_topics: [
      'Advanced lip blush techniques',
      'Client consultation best practices',
      'Troubleshooting common issues',
    ],
    recommended_formats: [
      'Video tutorial with step-by-step guide',
      'Interactive quiz for technique selection',
      'Downloadable aftercare guide',
    ],
    recommended_distribution: {
      primary_channels: ['Instagram', 'Website Blog', 'Email Newsletter'],
      secondary_channels: ['Facebook', 'TikTok', 'Pinterest'],
      optimal_timing: { 'instagram': '19:00', 'facebook': '14:00', 'email': '09:00' },
    },
    analysis_confidence: 92,
    prediction_confidence: 87,
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
  },
];

export const ContentAnalyticsTestingManager = ({ className }: ContentAnalyticsTestingManagerProps) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedMetric, setSelectedMetric] = useState<string>('all');
  const [selectedTimeRange, setSelectedTimeRange] = useState<string>('30d');
  const [selectedContentType, setSelectedContentType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateTestDialog, setShowCreateTestDialog] = useState(false);
  const [expandedTests, setExpandedTests] = useState<Set<string>>(new Set());

  // State for content management
  const [performance, setPerformance] = useState<ContentPerformanceAnalyticsType[]>(sampleContentPerformance);
  const [abTests, setABTests] = useState<ContentABTestsType[]>(sampleABTests);
  const [benchmarks, setBenchmarks] = useState<ContentPerformanceBenchmarksType[]>(sampleBenchmarks);
  const [aiInsights, setAIInsights] = useState<ContentAIInsightsType[]>(sampleAIInsights);

  // Toggle expanded state for test items
  const toggleExpanded = (id: string) => {
    setExpandedTests(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  // Filter data based on selected filters
  const filteredPerformance = performance.filter(perf => {
    const matchesMetric = selectedMetric === 'all' || true; // Add metric filtering logic
    const matchesTimeRange = true; // Add time range filtering logic
    const matchesContentType = true; // Add content type filtering logic
    const matchesSearch = searchTerm === '' || true; // Add search filtering logic
    return matchesMetric && matchesTimeRange && matchesContentType && matchesSearch;
  });

  // Calculate aggregated metrics
  const aggregatedMetrics = filteredPerformance.reduce((acc, curr) => ({
    totalViews: acc.totalViews + curr.views,
    totalEngagement: acc.totalEngagement + curr.likes + curr.shares + curr.comments,
    totalConversions: acc.totalConversions + curr.conversions,
    totalRevenue: acc.totalRevenue + curr.revenue_generated,
    avgEngagementRate: (acc.avgEngagementRate + curr.engagement_rate || 0) / (filteredPerformance.length || 1),
    avgConversionRate: (acc.avgConversionRate + curr.conversion_rate) / (filteredPerformance.length || 1),
    avgTimeOnPage: (acc.avgTimeOnPage + curr.average_time_on_page_seconds) / (filteredPerformance.length || 1),
    avgQualityScore: (acc.avgQualityScore + curr.quality_score) / (filteredPerformance.length || 1),
  }), {
    totalViews: 0,
    totalEngagement: 0,
    totalConversions: 0,
    totalRevenue: 0,
    avgEngagementRate: 0,
    avgConversionRate: 0,
    avgTimeOnPage: 0,
    avgQualityScore: 0,
  });

  // A/B Test Card Component
  const ABTestCard = ({ test }: { test: ContentABTestsType }) => {
    const isExpanded = expandedTests.has(test.id);
    const testVariableInfo = AB_TEST_VARIABLES[test.test_variable || 'headline'];
    const primaryMetricInfo = PRIMARY_METRICS[test.primary_metric || 'engagement_rate'];

    const getPerformanceDifference = (metric: string) => {
      const a = test.variant_a_performance[metric as keyof typeof test.variant_a_performance] as number;
      const b = test.variant_b_performance[metric as keyof typeof test.variant_b_performance] as number;
      const diff = ((b - a) / a) * 100;
      return diff;
    };

    const winnerPerformance = test.winner_variant === 'variant_b' ? test.variant_b_performance : test.variant_a_performance;
    const loserPerformance = test.winner_variant === 'variant_b' ? test.variant_a_performance : test.variant_b_performance;

    return (
      <Card className="transition-all duration-200 hover:shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100">
                <Flask className="w-5 h-5 text-purple-700" />
              </div>
              <div>
                <CardTitle className="text-lg">{test.test_name}</CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-xs">
                    {testVariableInfo.description.split(' ')[0]}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {test.status === 'completed' ? 'Completed' : test.status}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleExpanded(test.id)}
              >
                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="space-y-4">
            {/* Test Status and Results */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                {test.status === 'completed' ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : test.status === 'running' ? (
                  <Play className="w-5 h-5 text-blue-500" />
                ) : (
                  <Clock className="w-5 h-5 text-yellow-500" />
                )}
                <span className="font-medium capitalize">{test.status}</span>
              </div>
              {test.statistical_significance && (
                <Badge variant={test.statistical_significance >= 95 ? 'default' : 'outline'}>
                  {test.statistical_significance.toFixed(1)}% significance
                </Badge>
              )}
            </div>

            {/* Hypothesis */}
            <div>
              <h4 className="font-medium text-sm text-muted-foreground mb-2">Hypothesis</h4>
              <p className="text-sm bg-blue-50 p-3 rounded-lg">{test.hypothesis}</p>
            </div>

            {/* Performance Comparison */}
            {test.status === 'completed' && (
              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-2">Performance Comparison</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className={cn('p-3 rounded-lg border-2',
                    test.winner_variant === 'variant_a' ? 'border-green-500 bg-green-50' : 'border-gray-200')}>
                    <div className="font-medium text-sm mb-2">Variant A (Control)</div>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Views:</span>
                        <span>{test.variant_a_performance.views}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Engagement:</span>
                        <span>{test.variant_a_performance.engagement_rate}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Conversions:</span>
                        <span>{test.variant_a_performance.conversion_rate}%</span>
                      </div>
                    </div>
                  </div>
                  <div className={cn('p-3 rounded-lg border-2',
                    test.winner_variant === 'variant_b' ? 'border-green-500 bg-green-50' : 'border-gray-200')}>
                    <div className="font-medium text-sm mb-2">Variant B (Test)</div>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Views:</span>
                        <span>{test.variant_b_performance.views}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Engagement:</span>
                        <span>{test.variant_b_performance.engagement_rate}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Conversions:</span>
                        <span>{test.variant_b_performance.conversion_rate}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Winner Announcement */}
            {test.status === 'completed' && test.winner_variant && (
              <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Trophy className="w-5 h-5 text-green-600" />
                  <span className="font-semibold text-green-700">Winner: {test.winner_variant === 'variant_a' ? 'Variant A' : 'Variant B'}</span>
                </div>
                <p className="text-sm text-green-600">
                  {test.winner_variant === 'variant_b' ? 'Test variant' : 'Control variant'} won with{' '}
                  {Math.abs(getPerformanceDifference('engagement_rate')).toFixed(1)}% higher engagement rate
                </p>
              </div>
            )}

            {/* Expanded Content */}
            {isExpanded && (
              <div className="space-y-4 pt-4 border-t">
                {/* Test Configuration */}
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-2">Test Configuration</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Traffic Split:</span>
                      <span className="ml-2">{test.traffic_split_percentage}% / {100 - test.traffic_split_percentage}%</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Sample Size:</span>
                      <span className="ml-2">{test.sample_size_target}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Confidence Level:</span>
                      <span className="ml-2">{test.confidence_level}%</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Duration:</span>
                      <span className="ml-2">{new Date(test.end_date || test.start_date).getDate() - new Date(test.start_date).getDate()} days</span>
                    </div>
                  </div>
                </div>

                {/* Key Learnings */}
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-2">
                    <Lightbulb className="w-4 h-4 inline mr-1" />
                    Key Learnings
                  </h4>
                  <ul className="text-sm space-y-1">
                    {test.key_learnings.map((learning, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <CheckCircle className="w-3 h-3 text-green-500" />
                        {learning}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Recommendations */}
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-2">
                    <Target className="w-4 h-4 inline mr-1" />
                    Recommendations
                  </h4>
                  <ul className="text-sm space-y-1">
                    {test.recommendations.map((rec, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <ArrowUp className="w-3 h-3 text-blue-500" />
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Business Impact */}
                {test.business_impact && (
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-2">
                      <DollarSign className="w-4 h-4 inline mr-1" />
                      Business Impact
                    </h4>
                    <p className="text-sm bg-green-50 p-3 rounded-lg">{test.business_impact}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button size="sm" variant="outline">
                    <Download className="w-4 h-4 mr-1" />
                    Export Results
                  </Button>
                  <Button size="sm" variant="outline">
                    <RefreshCw className="w-4 h-4 mr-1" />
                    Run Similar Test
                  </Button>
                  <Button size="sm" variant="outline">
                    <Share2 className="w-4 h-4 mr-1" />
                    Share Insights
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
            <BarChart3 className="w-8 h-8 text-primary" />
            Content Analytics & A/B Testing
          </h1>
          <p className="text-muted-foreground mt-2">
            Track performance, run experiments, and optimize content strategy with data-driven insights
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Dialog open={showCreateTestDialog} onOpenChange={setShowCreateTestDialog}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Flask className="w-4 h-4" />
                Create A/B Test
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>Create A/B Test</DialogTitle>
                <DialogDescription>
                  Set up a controlled experiment to test content variations and optimize performance
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6 py-4 max-h-96 overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="test-name">Test Name</Label>
                    <Input placeholder="e.g., Headline Engagement Test" />
                  </div>
                  <div>
                    <Label htmlFor="test-variable">Test Variable</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select variable" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(AB_TEST_VARIABLES).map(([key, info]) => (
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
                </div>

                <div>
                  <Label htmlFor="hypothesis">Hypothesis</Label>
                  <Textarea
                    placeholder="State your hypothesis clearly - what do you expect to happen and why?"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="traffic-split">Traffic Split</Label>
                    <Select defaultValue="50">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="50">50% / 50%</SelectItem>
                        <SelectItem value="60">60% / 40%</SelectItem>
                        <SelectItem value="70">70% / 30%</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="sample-size">Sample Size</Label>
                    <Input type="number" placeholder="1000" />
                  </div>
                  <div>
                    <Label htmlFor="confidence">Confidence Level</Label>
                    <Select defaultValue="95">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="90">90%</SelectItem>
                        <SelectItem value="95">95%</SelectItem>
                        <SelectItem value="99">99%</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="primary-metric">Primary Metric</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select primary metric" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(PRIMARY_METRICS).map(([key, info]) => (
                          <SelectItem key={key} value={key}>
                            <div className="flex items-center gap-2">
                              {info.icon}
                              {info.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="duration">Test Duration (days)</Label>
                    <Input type="number" placeholder="7" />
                  </div>
                </div>

                <div>
                  <Label htmlFor="content-a">Variant A (Control)</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select content" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="content-1">Lip Blush Tutorial - Current Version</SelectItem>
                      <SelectItem value="content-2">Fitness Workout - Standard Version</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="content-b">Variant B (Test)</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select content" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="content-1">Lip Blush Tutorial - Test Version</SelectItem>
                      <SelectItem value="content-2">Fitness Workout - Test Version</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button onClick={() => setShowCreateTestDialog(false)}>
                    Start Test
                  </Button>
                  <Button variant="outline" onClick={() => setShowCreateTestDialog(false)}>
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
              <p className="text-2xl font-bold">{aggregatedMetrics.totalViews.toLocaleString()}</p>
            </div>
            <Eye className="w-8 h-8 text-blue-500" />
          </div>
          <div className="mt-2">
            <span className="text-xs text-green-600">+18% from last period</span>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Engagement Rate</p>
              <p className="text-2xl font-bold">{aggregatedMetrics.avgEngagementRate.toFixed(1)}%</p>
            </div>
            <Heart className="w-8 h-8 text-pink-500" />
          </div>
          <div className="mt-2">
            <span className="text-xs text-green-600">+12% improvement</span>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Conversion Rate</p>
              <p className="text-2xl font-bold">{(aggregatedMetrics.avgConversionRate * 100).toFixed(2)}%</p>
            </div>
            <Target className="w-8 h-8 text-purple-500" />
          </div>
          <div className="mt-2">
            <span className="text-xs text-green-600">+8% from A/B tests</span>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Revenue Generated</p>
              <p className="text-2xl font-bold">{aggregatedMetrics.totalRevenue.toLocaleString()} PLN</p>
            </div>
            <DollarSign className="w-8 h-8 text-green-500" />
          </div>
          <div className="mt-2">
            <span className="text-xs text-green-600">+24% growth</span>
          </div>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart className="w-4 h-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Performance
          </TabsTrigger>
          <TabsTrigger value="testing" className="flex items-center gap-2">
            <Flask className="w-4 h-4" />
            A/B Testing
          </TabsTrigger>
          <TabsTrigger value="insights" className="flex items-center gap-2">
            <Brain className="w-4 h-4" />
            AI Insights
          </TabsTrigger>
          <TabsTrigger value="benchmarks" className="flex items-center gap-2">
            <Award className="w-4 h-4" />
            Benchmarks
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Content Performance Trends */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LineChart className="w-5 h-5" />
                  Performance Trends
                </CardTitle>
                <CardDescription>
                  Track key metrics over time to identify patterns and opportunities
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Views Trend</span>
                    <Badge className="text-green-600">+18%</Badge>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: '75%' }}></div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Engagement Trend</span>
                    <Badge className="text-green-600">+12%</Badge>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: '68%' }}></div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Conversion Trend</span>
                    <Badge className="text-green-600">+8%</Badge>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-purple-500 h-2 rounded-full" style={{ width: '82%' }}></div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Top Performing Content */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="w-5 h-5" />
                  Top Performing Content
                </CardTitle>
                <CardDescription>
                  Your best-performing pieces driving engagement and conversions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {performance
                    .sort((a, b) => b.views - a.views)
                    .slice(0, 5)
                    .map((perf, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-8 h-8 bg-primary text-primary-foreground rounded-full text-sm font-bold">
                            {idx + 1}
                          </div>
                          <div>
                            <div className="font-medium">Content #{perf.content_id}</div>
                            <div className="text-sm text-muted-foreground">
                              {new Date(perf.date).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">{perf.views.toLocaleString()} views</div>
                          <div className="text-xs text-muted-foreground">
                            {perf.engagement_rate || 0}% engagement
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* A/B Test Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Flask className="w-5 h-5" />
                Recent A/B Test Results
              </CardTitle>
              <CardDescription>
                Latest experiments and their impact on content performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {abTests.slice(0, 3).map((test) => (
                  <div key={test.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={cn('p-2 rounded-lg',
                        test.status === 'completed' ? 'bg-green-100' : 'bg-blue-100')}>
                        {test.status === 'completed' ?
                          <CheckCircle className="w-4 h-4 text-green-700" /> :
                          <Play className="w-4 h-4 text-blue-700" />
                        }
                      </div>
                      <div>
                        <div className="font-medium">{test.test_name}</div>
                        <div className="text-sm text-muted-foreground">
                          {test.test_variable} • {test.status}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      {test.status === 'completed' && (
                        <>
                          <div className="font-semibold text-green-600">
                            {test.winner_variant === 'variant_b' ? 'Variant B' : 'Variant A'} Won
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {test.statistical_significance?.toFixed(1)}% significance
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart className="w-5 h-5" />
                Detailed Performance Analytics
              </CardTitle>
              <CardDescription>
                Comprehensive metrics and analysis for all content performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Performance Metrics Table */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4">Content</th>
                        <th className="text-left py-3 px-4">Views</th>
                        <th className="text-left py-3 px-4">Engagement</th>
                        <th className="text-left py-3 px-4">Conversions</th>
                        <th className="text-left py-3 px-4">Revenue</th>
                        <th className="text-left py-3 px-4">Quality Score</th>
                        <th className="text-left py-3 px-4">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {performance.map((perf, idx) => (
                        <tr key={idx} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <div className="font-medium">Content #{perf.content_id}</div>
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
                          <td className="py-3 px-4">{perf.conversions}</td>
                          <td className="py-3 px-4">
                            <span className="font-medium text-green-600">
                              {perf.revenue_generated.toLocaleString()} PLN
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1">
                              <Star className="w-4 h-4 text-yellow-500" />
                              {perf.quality_score}/100
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <Badge variant={perf.quality_score >= 90 ? 'default' : 'outline'}>
                              {perf.quality_score >= 90 ? 'Excellent' : perf.quality_score >= 80 ? 'Good' : 'Needs Work'}
                            </Badge>
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

        {/* A/B Testing Tab */}
        <TabsContent value="testing" className="space-y-6">
          <div className="grid gap-6">
            {abTests.map((test) => (
              <ABTestCard key={test.id} test={test} />
            ))}
          </div>

          {abTests.length === 0 && (
            <Card className="p-12 text-center">
              <Flask className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No A/B tests yet</h3>
              <p className="text-muted-foreground mb-4">
                Start experimenting with different content variations to optimize performance.
              </p>
              <Button onClick={() => setShowCreateTestDialog(true)}>
                <Flask className="w-4 h-4 mr-2" />
                Create Your First A/B Test
              </Button>
            </Card>
          )}
        </TabsContent>

        {/* AI Insights Tab */}
        <TabsContent value="insights" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* AI Performance Predictions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="w-5 h-5" />
                  AI Performance Predictions
                </CardTitle>
                <CardDescription>
                  Machine learning predictions for content performance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {aiInsights.slice(0, 3).map((insight, idx) => (
                    <div key={idx} className="p-4 bg-blue-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">Content #{insight.content_id}</span>
                        <Badge variant="outline">
                          {insight.prediction_confidence}% confidence
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-muted-foreground">Predicted Views:</span>
                          <div className="font-semibold">{insight.predicted_performance.predicted_views}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Predicted Engagement:</span>
                          <div className="font-semibold">{insight.predicted_performance.predicted_engagement_rate}%</div>
                        </div>
                      </div>
                      <div className="mt-2">
                        <div className="text-xs text-muted-foreground">Success Probability:</div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                          <div
                            className="bg-blue-500 h-2 rounded-full"
                            style={{ width: `${insight.predicted_performance.success_probability * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Content Optimization Recommendations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="w-5 h-5" />
                  Optimization Recommendations
                </CardTitle>
                <CardDescription>
                  AI-powered suggestions to improve content performance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {aiInsights.slice(0, 2).map((insight, idx) => (
                    <div key={idx} className="space-y-3">
                      <h4 className="font-medium">Content #{insight.content_id}</h4>

                      <div>
                        <h5 className="text-sm font-medium text-green-600 mb-2">High Impact</h5>
                        <ul className="text-sm space-y-1">
                          {insight.recommended_improvements.high_impact.map((improvement, iidx) => (
                            <li key={iidx} className="flex items-center gap-2">
                              <ArrowUp className="w-3 h-3 text-green-500" />
                              {improvement}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h5 className="text-sm font-medium text-blue-600 mb-2">Medium Impact</h5>
                        <ul className="text-sm space-y-1">
                          {insight.recommended_improvements.medium_impact.slice(0, 2).map((improvement, iidx) => (
                            <li key={iidx} className="flex items-center gap-2">
                              <ArrowUp className="w-3 h-3 text-blue-500" />
                              {improvement}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Content Sentiment Analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Content Sentiment Analysis
              </CardTitle>
              <CardDescription>
                Understanding audience emotional responses to content
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {aiInsights.map((insight, idx) => (
                  <div key={idx} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-medium">Content #{insight.content_id}</span>
                      <Badge variant={insight.sentiment_analysis.overall_sentiment === 'positive' ? 'default' : 'outline'}>
                        {insight.sentiment_analysis.overall_sentiment}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Sentiment Score:</span>
                        <span>{(insight.sentiment_analysis.sentiment_score * 100).toFixed(1)}%</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span>Emotional Tone:</span>
                        <span className="capitalize">{insight.sentiment_analysis.emotional_tone}</span>
                      </div>
                      <div className="mt-2">
                        <span className="text-xs text-muted-foreground">Key Emotions:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {insight.sentiment_analysis.key_emotions.map((emotion, eidx) => (
                            <Badge key={eidx} variant="outline" className="text-xs">
                              {emotion}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Benchmarks Tab */}
        <TabsContent value="benchmarks" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5" />
                Performance Benchmarks
              </CardTitle>
              <CardDescription>
                Compare your content performance against industry standards and targets
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Benchmark Comparison */}
                {benchmarks.map((benchmark, idx) => (
                  <div key={idx} className="p-6 border rounded-lg">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold">
                        {benchmark.content_category.replace('_', ' ')} - {benchmark.content_format.replace('_', ' ')}
                      </h4>
                      <Badge variant="outline">{benchmark.target_audience}</Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <h5 className="font-medium text-sm">Views</h5>
                        <div className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Industry Avg:</span>
                            <span>{benchmark.industry_average_views}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Your Target:</span>
                            <span className="font-medium">{benchmark.target_views}</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h5 className="font-medium text-sm">Engagement Rate</h5>
                        <div className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Industry Avg:</span>
                            <span>{benchmark.industry_average_engagement_rate}%</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Your Target:</span>
                            <span className="font-medium">{benchmark.target_engagement_rate}%</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h5 className="font-medium text-sm">Conversion Rate</h5>
                        <div className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Industry Avg:</span>
                            <span>{benchmark.industry_average_conversion_rate}%</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Your Target:</span>
                            <span className="font-medium">{benchmark.target_conversion_rate}%</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Best Practices */}
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                      <h5 className="font-medium text-sm mb-2">Best Practices</h5>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        {Object.entries(benchmark.best_practices).map(([key, value]) => (
                          <div key={key}>
                            <span className="text-muted-foreground capitalize">
                              {key.replace(/([A-Z])/g, ' $1').trim()}:
                            </span>
                            <div className="font-medium">{value as string}</div>
                          </div>
                        ))}
                      </div>
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

export default ContentAnalyticsTestingManager;