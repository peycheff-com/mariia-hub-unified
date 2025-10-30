import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { toast aria-live="polite" aria-atomic="true" } from 'sonner';
import {
  Video,
  Image,
  FileText,
  Download,
  PlayCircle,
  Camera,
  Mic,
  FileDown,
  Layout,
  Palette,
  Filter,
  Plus,
  Edit,
  Trash2,
  BarChart3,
  Eye,
  Heart,
  Share2,
  MessageCircle,
  Search,
  ChevronDown,
  ChevronUp,
  Settings,
  Lightbulb,
  Zap,
  Target,
  Users,
  TrendingUp,
  Clock,
  Calendar,
  Tag,
  FolderOpen,
  Grid,
  List,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Monitor,
  Smartphone,
  Tablet,
  Headphones,
  BookOpen,
  CheckCircle,
  AlertCircle,
  Upload,
  File,
  Folder,
  Archive,
  Star,
  Award,
  Rocket,
  Brain,
  Cpu,
  SmartphoneIcon,
  MessageSquare,
  HelpCircle,
  Gamepad2,
  Trophy,
  Gift,
  Sparkles,
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
  ContentAssets as ContentAssetsType,
  InteractiveContent as InteractiveContentType,
  ContentCalendar,
  ContentPerformanceAnalytics,
} from '@/types/content-strategy';

interface MultiFormatContentManagerProps {
  className?: string;
}

// Content asset types with detailed information
const CONTENT_ASSET_TYPES = {
  image: {
    icon: <Image className="w-4 h-4" alt="" />,
    color: 'bg-green-100 text-green-700',
    description: 'Static images, photos, graphics',
    formats: ['JPG', 'PNG', 'WebP', 'SVG', 'GIF'],
    maxSize: '10MB',
    qualityLevels: ['low', 'medium', 'high', 'ultra'],
  },
  video: {
    icon: <Video className="w-4 h-4" />,
    color: 'bg-red-100 text-red-700',
    description: 'Video content, tutorials, demonstrations',
    formats: ['MP4', 'WebM', 'MOV', 'AVI'],
    maxSize: '500MB',
    qualityLevels: ['360p', '720p', '1080p', '4K'],
  },
  audio: {
    icon: <Mic className="w-4 h-4" />,
    color: 'bg-blue-100 text-blue-700',
    description: 'Audio content, podcasts, music',
    formats: ['MP3', 'WAV', 'AAC', 'OGG'],
    maxSize: '100MB',
    qualityLevels: ['64kbps', '128kbps', '256kbps', '320kbps'],
  },
  document: {
    icon: <FileText className="w-4 h-4" />,
    color: 'bg-purple-100 text-purple-700',
    description: 'PDFs, guides, worksheets',
    formats: ['PDF', 'DOC', 'PPT', 'XLS'],
    maxSize: '50MB',
    qualityLevels: ['standard', 'print', 'premium'],
  },
  presentation: {
    icon: <Layout className="w-4 h-4" />,
    color: 'bg-orange-100 text-orange-700',
    description: 'Slides, presentations, visual aids',
    formats: ['PPT', 'PDF', 'Google Slides'],
    maxSize: '100MB',
    qualityLevels: ['standard', 'widescreen', 'interactive'],
  },
  infographic: {
    icon: <Palette className="w-4 h-4" />,
    color: 'bg-pink-100 text-pink-700',
    description: 'Information graphics, data visualization',
    formats: ['PNG', 'JPG', 'SVG', 'PDF'],
    maxSize: '20MB',
    qualityLevels: ['web', 'print', 'large-format'],
  },
  interactive_quiz: {
    icon: <Brain className="w-4 h-4" />,
    color: 'bg-indigo-100 text-indigo-700',
    description: 'Interactive quizzes, assessments',
    formats: ['HTML5', 'JSON', 'SCORM'],
    maxSize: '25MB',
    qualityLevels: ['basic', 'advanced', 'gamified'],
  },
  assessment: {
    icon: <CheckCircle className="w-4 h-4" />,
    color: 'bg-teal-100 text-teal-700',
    description: 'Self-assessments, progress tests',
    formats: ['HTML5', 'JSON', 'PDF'],
    maxSize: '15MB',
    qualityLevels: ['basic', 'detailed', 'comprehensive'],
  },
  template: {
    icon: <Grid className="w-4 h-4" />,
    color: 'bg-cyan-100 text-cyan-700',
    description: 'Templates, worksheets, planners',
    formats: ['PDF', 'DOC', 'XLS', 'CANVA'],
    maxSize: '25MB',
    qualityLevels: ['basic', 'premium', 'pro'],
  },
  checklist: {
    icon: <FileDown className="w-4 h-4" />,
    color: 'bg-amber-100 text-amber-700',
    description: 'Checklists, guides, step-by-step',
    formats: ['PDF', 'DOC', 'HTML'],
    maxSize: '10MB',
    qualityLevels: ['simple', 'detailed', 'comprehensive'],
  },
  guide: {
    icon: <BookOpen className="w-4 h-4" />,
    color: 'bg-lime-100 text-lime-700',
    description: 'Comprehensive guides, tutorials',
    formats: ['PDF', 'EPUB', 'HTML', 'Video'],
    maxSize: '100MB',
    qualityLevels: ['basic', 'detailed', 'masterclass'],
  },
};

// Interactive content types with descriptions
const INTERACTIVE_TYPES = {
  beauty_consultation_quiz: {
    icon: <Sparkles className="w-4 h-4" />,
    color: 'bg-pink-100 text-pink-700',
    title: 'Beauty Consultation Quiz',
    description: 'Personalized beauty recommendations based on user preferences and needs',
    estimatedTime: '5-10 minutes',
    questions: 15,
    outcomes: 'Personalized beauty routine',
  },
  fitness_assessment: {
    icon: <Target className="w-4 h-4" />,
    color: 'bg-blue-100 text-blue-700',
    title: 'Fitness Assessment',
    description: 'Comprehensive fitness level evaluation and program recommendations',
    estimatedTime: '10-15 minutes',
    questions: 20,
    outcomes: 'Custom fitness program',
  },
  skin_analysis: {
    icon: <Camera className="w-4 h-4" />,
    color: 'bg-green-100 text-green-700',
    title: 'Skin Analysis Tool',
    description: 'Skin type and condition analysis with product recommendations',
    estimatedTime: '5-8 minutes',
    questions: 12,
    outcomes: 'Skincare routine recommendations',
  },
  body_type_finder: {
    icon: <Users className="w-4 h-4" />,
    color: 'bg-purple-100 text-purple-700',
    title: 'Body Type Finder',
    description: 'Body shape analysis and fitness/wardrobe recommendations',
    estimatedTime: '8-12 minutes',
    questions: 18,
    outcomes: 'Personalized recommendations',
  },
  routine_planner: {
    icon: <Calendar className="w-4 h-4" />,
    color: 'bg-orange-100 text-orange-700',
    title: 'Beauty/Fitness Routine Planner',
    description: 'Personalized daily/weekly routine planning tool',
    estimatedTime: '10-15 minutes',
    questions: 25,
    outcomes: 'Custom routine schedule',
  },
  progress_tracker: {
    icon: <TrendingUp className="w-4 h-4" />,
    color: 'bg-teal-100 text-teal-700',
    title: 'Progress Tracker',
    description: 'Track beauty and fitness progress with visual analytics',
    estimatedTime: '3-5 minutes',
    questions: 10,
    outcomes: 'Progress dashboard setup',
  },
  knowledge_test: {
    icon: <Brain className="w-4 h-4" />,
    color: 'bg-indigo-100 text-indigo-700',
    title: 'Beauty/Fitness Knowledge Test',
    description: 'Test knowledge and learn best practices',
    estimatedTime: '15-20 minutes',
    questions: 30,
    outcomes: 'Knowledge assessment and resources',
  },
  preference_matcher: {
    icon: <Heart className="w-4 h-4" />,
    color: 'bg-red-100 text-red-700',
    title: 'Service Preference Matcher',
    description: 'Match users with ideal beauty/fitness services',
    estimatedTime: '5-7 minutes',
    questions: 8,
    outcomes: 'Service recommendations',
  },
  budget_calculator: {
    icon: <Calculator className="w-4 h-4" />,
    color: 'bg-yellow-100 text-yellow-700',
    title: 'Budget Calculator',
    description: 'Calculate beauty/fitness service costs and budgets',
    estimatedTime: '5-8 minutes',
    questions: 12,
    outcomes: 'Budget planning and recommendations',
  },
};

// Sample data for demonstration
const sampleContentAssets: ContentAssetsType[] = [
  {
    id: '1',
    content_id: 'content-1',
    asset_type: 'video',
    title: 'Lip Blush Technique Tutorial',
    description: 'Complete step-by-step guide to perfect lip blush technique',
    file_url: 'https://example.com/lip-blush-tutorial.mp4',
    file_name: 'lip_blush_tutorial.mp4',
    file_size_bytes: 125829120, // 120MB
    file_format: 'MP4',
    dimensions: '1920x1080',
    duration_seconds: 1800, // 30 minutes
    thumbnail_url: 'https://example.com/lip-blush-thumb.jpg',
    preview_url: 'https://example.com/lip-blush-preview.mp4',
    download_url: 'https://example.com/lip-blush-download.mp4',
    asset_category: 'Tutorial',
    tags: ['lip blush', 'permanent makeup', 'tutorial', 'beauty'],
    order_index: 1,
    download_count: 245,
    view_count: 1820,
    share_count: 89,
    quality_level: 'high',
    optimization_status: 'optimized',
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
  },
  {
    id: '2',
    content_id: 'content-1',
    asset_type: 'document',
    title: 'Aftercare Instructions Guide',
    description: 'Comprehensive aftercare instructions for lip procedures',
    file_url: 'https://example.com/aftercare-guide.pdf',
    file_name: 'aftercare_guide.pdf',
    file_size_bytes: 2097152, // 2MB
    file_format: 'PDF',
    thumbnail_url: 'https://example.com/aftercare-thumb.jpg',
    preview_url: 'https://example.com/aftercare-preview.pdf',
    download_url: 'https://example.com/aftercare-download.pdf',
    asset_category: 'Educational',
    tags: ['aftercare', 'instructions', 'guide', 'recovery'],
    order_index: 2,
    download_count: 456,
    view_count: 980,
    share_count: 34,
    quality_level: 'premium',
    optimization_status: 'optimized',
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
  },
];

const sampleInteractiveContent: InteractiveContentType[] = [
  {
    id: '1',
    content_id: 'interactive-1',
    interaction_type: 'beauty_consultation_quiz',
    questions: [
      {
        id: 1,
        type: 'multiple_choice',
        question: 'What is your primary beauty concern?',
        options: ['Lip appearance', 'Brow shape', 'Skin quality', 'Overall look'],
        required: true,
      },
      {
        id: 2,
        type: 'image_selection',
        question: 'Which lip shape do you prefer?',
        images: ['lip1.jpg', 'lip2.jpg', 'lip3.jpg', 'lip4.jpg'],
        required: true,
      },
    ],
    results_logic: {
      scoring: 'weighted',
      outcome_calculation: 'based_on_preferences_and_lifestyle',
    },
    outcome_definitions: {
      natural_enhancement: {
        title: 'Natural Enhancement Path',
        description: 'Subtle improvements that enhance your natural beauty',
        recommendations: ['Lip tint', 'Brow lamination', 'Skincare routine'],
      },
      dramatic_transformation: {
        title: 'Dramatic Transformation Path',
        description: 'Bold changes for striking new look',
        recommendations: ['Lip blush', 'Microblading', 'Advanced treatments'],
      },
    },
    estimated_time_minutes: 8,
    question_count: 15,
    has_progress_bar: true,
    immediate_feedback: true,
    personalization_factors: ['lifestyle', 'budget', 'time_commitment', 'pain_tolerance'],
    adaptation_logic: {
      follow_up_questions: 'based_on_initial_responses',
      recommendation_adjustment: 'real_time_personalization',
    },
    collects_email: true,
    email_collection_point: 'results',
    follow_up_triggers: {
      completion: 'send_results_email',
      abandon: 'reminder_after_24h',
    },
    completion_rate: 78,
    average_completion_time_seconds: 480,
    drop_off_points: {
      question_5: 15,
      question_12: 8,
    },
    service_recommendations: {
      primary: 'Lip Blush Enhancement',
      secondary: ['Brow Lamination', 'Skincare Consultation'],
      upsell: 'Premium Beauty Package',
    },
    content_recommendations: {
      related_articles: ['Lip Care Guide', 'Color Theory for Lips'],
      related_videos: ['Lip Blush Tutorial', 'Aftercare Instructions'],
    },
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
  },
];

const sampleContentPerformance: ContentPerformanceAnalytics[] = [
  {
    id: '1',
    content_id: 'content-1',
    date: '2024-01-15',
    views: 1820,
    unique_views: 1650,
    average_time_on_page_seconds: 450,
    bounce_rate: 28,
    likes: 156,
    shares: 42,
    comments: 28,
    saves_bookmarks: 89,
    clicks: 234,
    conversions: 18,
    conversion_rate: 0.99,
    revenue_generated: 27000,
    website_visits: 450,
    instagram_engagement: 198,
    facebook_engagement: 87,
    tiktok_views: 2800,
    newsletter_clicks: 45,
    quality_score: 94,
    relevance_score: 91,
    sentiment_score: 88,
    demographic_data: { age: '25-45', gender: 'female', location: 'Warsaw' },
    geographic_data: { poland: 85, europe: 10, other: 5 },
    behavior_data: { device: 'mobile', sessionDuration: 450, pagesVisited: 4.2 },
    video_completion_rate: 85,
    audio_completion_rate: 0,
    quiz_completion_rate: 0,
    download_completion_rate: 72,
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
  },
];

export const MultiFormatContentManager = ({ className }: MultiFormatContentManagerProps) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('assets');
  const [selectedAssetType, setSelectedAssetType] = useState<string>('all');
  const [selectedInteractiveType, setSelectedInteractiveType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateAssetDialog, setShowCreateAssetDialog] = useState(false);
  const [showCreateInteractiveDialog, setShowCreateInteractiveDialog] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // State for content management
  const [contentAssets, setContentAssets] = useState<ContentAssetsType[]>(sampleContentAssets);
  const [interactiveContent, setInteractiveContent] = useState<InteractiveContentType[]>(sampleInteractiveContent);
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

  // Filter content assets based on selected filters
  const filteredAssets = contentAssets.filter(asset => {
    const matchesType = selectedAssetType === 'all' || asset.asset_type === selectedAssetType;
    const matchesSearch = searchTerm === '' ||
      asset.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesType && matchesSearch;
  });

  // Filter interactive content based on selected filters
  const filteredInteractiveContent = interactiveContent.filter(content => {
    const matchesType = selectedInteractiveType === 'all' || content.interaction_type === selectedInteractiveType;
    const matchesSearch = searchTerm === '' ||
      INTERACTIVE_TYPES[content.interaction_type].title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      INTERACTIVE_TYPES[content.interaction_type].description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesSearch;
  });

  // Get performance metrics for content
  const getContentPerformance = (contentId: string) => {
    return performance.find(p => p.content_id === contentId);
  };

  // Calculate total metrics
  const totalMetrics = performance.reduce((acc, curr) => ({
    totalViews: acc.totalViews + curr.views,
    totalDownloads: acc.totalDownloads + (curr.download_completion_rate || 0),
    totalEngagement: acc.totalEngagement + curr.likes + curr.shares + curr.comments,
    totalConversions: acc.totalConversions + curr.conversions,
    avgCompletionRate: (acc.avgCompletionRate + (curr.video_completion_rate || 0)) / (performance.length || 1),
  }), { totalViews: 0, totalDownloads: 0, totalEngagement: 0, totalConversions: 0, avgCompletionRate: 0 });

  // Format file size
  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  // Format duration
  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  // Content Asset Card Component
  const ContentAssetCard = ({ asset }: { asset: ContentAssetsType }) => {
    const contentPerf = getContentPerformance(asset.content_id);
    const isExpanded = expandedItems.has(asset.id);
    const assetTypeInfo = CONTENT_ASSET_TYPES[asset.asset_type];

    return (
      <Card className="transition-all duration-200 hover:shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={cn('p-2 rounded-lg', assetTypeInfo.color)}>
                {assetTypeInfo.icon}
              </div>
              <div className="flex-1">
                <CardTitle className="text-lg line-clamp-2">{asset.title}</CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-xs">
                    {asset.asset_type.toUpperCase()}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {assetTypeInfo.description}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleExpanded(asset.id)}
              >
                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="space-y-4">
            {/* Asset Preview */}
            <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center">
              {asset.asset_type === 'video' && (
                <div className="text-center">
                  <PlayCircle className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <div className="text-sm text-gray-600">{formatDuration(asset.duration_seconds || 0)}</div>
                </div>
              )}
              {asset.asset_type === 'image' && (
                <Image className="w-12 h-12 text-gray-400" alt="Image" />
              )}
              {asset.asset_type === 'audio' && (
                <div className="text-center">
                  <Headphones className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <div className="text-sm text-gray-600">{formatDuration(asset.duration_seconds || 0)}</div>
                </div>
              )}
              {asset.asset_type === 'document' && (
                <div className="text-center">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <div className="text-sm text-gray-600">{asset.file_format}</div>
                </div>
              )}
              {asset.asset_type === 'interactive_quiz' && (
                <div className="text-center">
                  <Gamepad2 className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <div className="text-sm text-gray-600">Interactive Content</div>
                </div>
              )}
              {['presentation', 'infographic', 'assessment', 'template', 'checklist', 'guide'].includes(asset.asset_type) && (
                <Layout className="w-12 h-12 text-gray-400" />
              )}
            </div>

            {/* Asset Details */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-1">File Info</h4>
                <div className="text-sm space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Size:</span>
                    <span>{formatFileSize(asset.file_size_bytes)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Format:</span>
                    <span>{asset.file_format}</span>
                  </div>
                  {asset.dimensions && (
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Dimensions:</span>
                      <span>{asset.dimensions}</span>
                    </div>
                  )}
                </div>
              </div>
              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-1">Performance</h4>
                <div className="text-sm space-y-1">
                  <div className="flex items-center gap-2">
                    <Eye className="w-3 h-3 text-blue-500" />
                    <span>{asset.view_count} views</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Download className="w-3 h-3 text-green-500" />
                    <span>{asset.download_count} downloads</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Share2 className="w-3 h-3 text-purple-500" />
                    <span>{asset.share_count} shares</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Tags */}
            <div>
              <h4 className="font-medium text-sm text-muted-foreground mb-2">Tags</h4>
              <div className="flex flex-wrap gap-1">
                {asset.tags.slice(0, 4).map((tag, idx) => (
                  <Badge key={idx} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
                {asset.tags.length > 4 && (
                  <Badge variant="outline" className="text-xs">
                    +{asset.tags.length - 4}
                  </Badge>
                )}
              </div>
            </div>

            {/* Quality and Optimization */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-yellow-500" />
                <span className="text-sm font-medium">{asset.quality_level} quality</span>
              </div>
              <Badge variant={asset.optimization_status === 'optimized' ? 'default' : 'outline'}>
                {asset.optimization_status}
              </Badge>
            </div>

            {/* Expanded Content */}
            {isExpanded && (
              <div className="space-y-4 pt-4 border-t">
                {/* Description */}
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-2">Description</h4>
                  <p className="text-sm">{asset.description}</p>
                </div>

                {/* Engagement Metrics */}
                {contentPerf && (
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-2">
                      <BarChart3 className="w-4 h-4 inline mr-1" />
                      Engagement Metrics
                    </h4>
                    <div className="grid grid-cols-4 gap-3">
                      <div className="text-center p-2 bg-blue-50 rounded">
                        <div className="font-semibold text-blue-700">{contentPerf.views}</div>
                        <div className="text-xs">Views</div>
                      </div>
                      <div className="text-center p-2 bg-pink-50 rounded">
                        <div className="font-semibold text-pink-700">{contentPerf.likes}</div>
                        <div className="text-xs">Likes</div>
                      </div>
                      <div className="text-center p-2 bg-purple-50 rounded">
                        <div className="font-semibold text-purple-700">{contentPerf.shares}</div>
                        <div className="text-xs">Shares</div>
                      </div>
                      <div className="text-center p-2 bg-green-50 rounded">
                        <div className="font-semibold text-green-700">{contentPerf.conversions}</div>
                        <div className="text-xs">Conversions</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Technical Specifications */}
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-2">
                    <Cpu className="w-4 h-4 inline mr-1" />
                    Technical Specifications
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Category:</span>
                        <span>{asset.asset_category}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Optimization:</span>
                        <span>{asset.optimization_status}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Order Index:</span>
                        <span>{asset.order_index}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Created:</span>
                        <span>{new Date(asset.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button size="sm" variant="outline">
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  <Button size="sm" variant="outline">
                    <Download className="w-4 h-4 mr-1" />
                    Download
                  </Button>
                  <Button size="sm" variant="outline">
                    <Share2 className="w-4 h-4 mr-1" />
                    Share
                  </Button>
                  <Button size="sm" variant="outline">
                    <BarChart3 className="w-4 h-4 mr-1" />
                    Analytics
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  // Interactive Content Card Component
  const InteractiveContentCard = ({ content }: { content: InteractiveContentType }) => {
    const isExpanded = expandedItems.has(content.id);
    const contentTypeInfo = INTERACTIVE_TYPES[content.interaction_type];

    return (
      <Card className="transition-all duration-200 hover:shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={cn('p-2 rounded-lg', contentTypeInfo.color)}>
                {contentTypeInfo.icon}
              </div>
              <div className="flex-1">
                <CardTitle className="text-lg">{contentTypeInfo.title}</CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-xs">
                    Interactive
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {content.estimated_time_minutes} min • {content.question_count} questions
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
            {/* Preview */}
            <div className="p-4 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg">
              <p className="text-sm text-muted-foreground">{contentTypeInfo.description}</p>
            </div>

            {/* Performance Metrics */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="font-semibold text-green-700">{content.completion_rate}%</div>
                <div className="text-xs">Completion</div>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="font-semibold text-blue-700">
                  {Math.round(content.average_completion_time_seconds / 60)}m
                </div>
                <div className="text-xs">Avg Time</div>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <div className="font-semibold text-purple-700">
                  {Object.keys(content.drop_off_points).length}
                </div>
                <div className="text-xs">Drop Points</div>
              </div>
            </div>

            {/* Features */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-2">Features</h4>
                <div className="space-y-1">
                  {content.has_progress_bar && (
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-3 h-3 text-green-500" />
                      Progress Bar
                    </div>
                  )}
                  {content.immediate_feedback && (
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-3 h-3 text-green-500" />
                      Immediate Feedback
                    </div>
                  )}
                  {content.collects_email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="w-3 h-3 text-blue-500" />
                      Email Collection
                    </div>
                  )}
                </div>
              </div>
              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-2">Outcomes</h4>
                <p className="text-sm">{contentTypeInfo.outcomes}</p>
              </div>
            </div>

            {/* Expanded Content */}
            {isExpanded && (
              <div className="space-y-4 pt-4 border-t">
                {/* Question Structure */}
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-2">
                    <HelpCircle className="w-4 h-4 inline mr-1" />
                    Question Structure
                  </h4>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Total Questions:</span>
                          <span>{content.question_count}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Personalization:</span>
                          <span>{content.personalization_factors.length} factors</span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Email Collection:</span>
                          <span>{content.collects_email ? 'Yes' : 'No'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Collection Point:</span>
                          <span>{content.email_collection_point}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Service Recommendations */}
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-2">
                    <Target className="w-4 h-4 inline mr-1" />
                    Service Recommendations
                  </h4>
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="space-y-2">
                      <div>
                        <span className="font-medium text-sm">Primary:</span>
                        <div className="text-sm">{content.service_recommendations.primary}</div>
                      </div>
                      <div>
                        <span className="font-medium text-sm">Secondary:</span>
                        <div className="text-sm">{content.service_recommendations.secondary?.join(', ')}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Drop-off Analysis */}
                {Object.keys(content.drop_off_points).length > 0 && (
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-2">
                      <AlertCircle className="w-4 h-4 inline mr-1" />
                      Drop-off Analysis
                    </h4>
                    <div className="space-y-2">
                      {Object.entries(content.drop_off_points).map(([point, count]) => (
                        <div key={point} className="flex items-center justify-between p-2 bg-orange-50 rounded">
                          <span className="text-sm">{point.replace('_', ' ')}</span>
                          <Badge variant="outline">{count} users</Badge>
                        </div>
                      ))}
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
                    <PlayCircle className="w-4 h-4 mr-1" />
                    Preview
                  </Button>
                  <Button size="sm" variant="outline">
                    <BarChart3 className="w-4 h-4 mr-1" />
                    Analytics
                  </Button>
                  <Button size="sm" variant="outline">
                    <Gamepad2 className="w-4 h-4 mr-1" />
                    Test
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
            <Sparkles className="w-8 h-8 text-primary" />
            Multi-Format Content Strategy
          </h1>
          <p className="text-muted-foreground mt-2">
            Create diverse content formats including videos, interactive content, and downloadable resources
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => setShowCreateInteractiveDialog(true)}
            className="flex items-center gap-2"
          >
            <Gamepad2 className="w-4 h-4" />
            Create Interactive
          </Button>
          <Dialog open={showCreateAssetDialog} onOpenChange={setShowCreateAssetDialog}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Upload Asset
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Upload Content Asset</DialogTitle>
                <DialogDescription>
                  Add video, image, document, or other content assets to your library
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6 py-4">
                <div>
                  <Label htmlFor="asset-type">Asset Type</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select asset type" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(CONTENT_ASSET_TYPES).map(([key, info]) => (
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
                  <Label htmlFor="title">Title</Label>
                  <Input placeholder="Enter asset title" />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    placeholder="Describe your content asset..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Input placeholder="e.g., Tutorial, Educational" />
                  </div>
                  <div>
                    <Label htmlFor="quality">Quality Level</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select quality" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low Quality</SelectItem>
                        <SelectItem value="medium">Medium Quality</SelectItem>
                        <SelectItem value="high">High Quality</SelectItem>
                        <SelectItem value="ultra">Ultra Quality</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="tags">Tags</Label>
                  <Input placeholder="Enter tags separated by commas" />
                </div>

                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-lg font-medium mb-2">Drop your files here</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    or click to browse
                  </p>
                  <Button variant="outline">Choose Files</Button>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button onClick={() => setShowCreateAssetDialog(false)}>
                    Upload Asset
                  </Button>
                  <Button variant="outline" onClick={() => setShowCreateAssetDialog(false)}>
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
            <span className="text-xs text-green-600">+22% from last month</span>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Downloads</p>
              <p className="text-2xl font-bold">{Math.round(totalMetrics.totalDownloads).toLocaleString()}</p>
            </div>
            <Download className="w-8 h-8 text-green-500" />
          </div>
          <div className="mt-2">
            <span className="text-xs text-green-600">+18% from last month</span>
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
            <span className="text-xs text-green-600">+15% from last month</span>
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
            <span className="text-xs text-green-600">+28% from last month</span>
          </div>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="assets" className="flex items-center gap-2">
            <FolderOpen className="w-4 h-4" />
            Content Assets
          </TabsTrigger>
          <TabsTrigger value="interactive" className="flex items-center gap-2">
            <Gamepad2 className="w-4 h-4" />
            Interactive Content
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <Grid className="w-4 h-4" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        {/* Content Assets Tab */}
        <TabsContent value="assets" className="space-y-6">
          {/* Filters and Controls */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search assets by title, description, or tags..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={selectedAssetType} onValueChange={setSelectedAssetType}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {Object.entries(CONTENT_ASSET_TYPES).map(([key, info]) => (
                  <SelectItem key={key} value={key}>
                    <div className="flex items-center gap-2">
                      {info.icon}
                      <span className="capitalize">{key.replace('_', ' ')}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Asset Type Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {Object.entries(CONTENT_ASSET_TYPES).map(([key, info]) => (
              <Card
                key={key}
                className={cn(
                  'p-4 cursor-pointer transition-all hover:shadow-md',
                  selectedAssetType === key ? 'ring-2 ring-primary' : ''
                )}
                onClick={() => setSelectedAssetType(key)}
              >
                <div className="text-center">
                  <div className={cn('w-12 h-12 rounded-lg mx-auto mb-2 flex items-center justify-center', info.color)}>
                    {info.icon}
                  </div>
                  <div className="font-medium text-sm capitalize">
                    {key.replace('_', ' ')}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {contentAssets.filter(a => a.asset_type === key).length} items
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Content Grid */}
          <div className={cn(
            'gap-6',
            viewMode === 'grid' ? 'grid grid-cols-1 lg:grid-cols-2' : 'space-y-6'
          )}>
            {filteredAssets.map((asset) => (
              <ContentAssetCard key={asset.id} asset={asset} />
            ))}
          </div>

          {filteredAssets.length === 0 && (
            <Card className="p-12 text-center">
              <FolderOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No assets found</h3>
              <p className="text-muted-foreground mb-4">
                Try adjusting your filters or upload new content assets.
              </p>
              <Button onClick={() => setShowCreateAssetDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Upload Asset
              </Button>
            </Card>
          )}
        </TabsContent>

        {/* Interactive Content Tab */}
        <TabsContent value="interactive" className="space-y-6">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search interactive content..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={selectedInteractiveType} onValueChange={setSelectedInteractiveType}>
              <SelectTrigger className="w-64">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Interactive Types</SelectItem>
                {Object.entries(INTERACTIVE_TYPES).map(([key, info]) => (
                  <SelectItem key={key} value={key}>
                    <div className="flex items-center gap-2">
                      {info.icon}
                      <span>{info.title}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Interactive Content Grid */}
          <div className="grid gap-6">
            {filteredInteractiveContent.map((content) => (
              <InteractiveContentCard key={content.id} content={content} />
            ))}
          </div>

          {filteredInteractiveContent.length === 0 && (
            <Card className="p-12 text-center">
              <Gamepad2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No interactive content found</h3>
              <p className="text-muted-foreground mb-4">
                Create engaging quizzes, assessments, and interactive tools.
              </p>
              <Button onClick={() => setShowCreateInteractiveDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Interactive Content
              </Button>
            </Card>
          )}
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Grid className="w-5 h-5" />
                Content Templates & Frameworks
              </CardTitle>
              <CardDescription>
                Reusable templates for consistent content creation across all formats
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  {
                    name: 'Video Tutorial Template',
                    type: 'video',
                    description: 'Standard structure for beauty and fitness tutorial videos',
                    sections: ['Introduction', 'Materials Needed', 'Step-by-Step', 'Tips & Tricks', 'Conclusion'],
                    usage: 45,
                  },
                  {
                    name: 'Blog Post Template',
                    type: 'document',
                    description: 'SEO-optimized blog post structure for educational content',
                    sections: ['Hook', 'Problem Statement', 'Solution', 'Step Guide', 'FAQ', 'Conclusion'],
                    usage: 67,
                  },
                  {
                    name: 'Interactive Quiz Framework',
                    type: 'interactive_quiz',
                    description: 'Engaging quiz structure with personalized recommendations',
                    sections: ['Welcome', 'Assessment Questions', 'Results Analysis', 'Recommendations'],
                    usage: 23,
                  },
                  {
                    name: 'Social Media Content Pack',
                    type: 'image',
                    description: 'Complete social media kit with templates and captions',
                    sections: ['Instagram Post', 'Instagram Story', 'Facebook Post', 'TikTok Video'],
                    usage: 89,
                  },
                  {
                    name: 'Client Guide Template',
                    type: 'guide',
                    description: 'Comprehensive client education guide template',
                    sections: ['Preparation', 'Procedure', 'Aftercare', 'FAQ', 'Emergency Contacts'],
                    usage: 34,
                  },
                  {
                    name: 'Email Newsletter Template',
                    type: 'document',
                    description: 'Engaging newsletter template for content distribution',
                    sections: ['Header', 'Featured Content', 'Tips', 'Client Stories', 'Call to Action'],
                    usage: 56,
                  },
                ].map((template, idx) => (
                  <Card key={idx} className="hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{template.name}</CardTitle>
                        <Badge variant="outline">{template.usage} uses</Badge>
                      </div>
                      <CardDescription>{template.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-medium text-sm mb-2">Template Sections</h4>
                          <div className="space-y-1">
                            {template.sections.map((section, sidx) => (
                              <div key={sidx} className="flex items-center gap-2 text-sm">
                                <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                                {section}
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" className="flex-1">
                            <Edit className="w-4 h-4 mr-1" />
                            Customize
                          </Button>
                          <Button size="sm" className="flex-1">
                            <Download className="w-4 h-4 mr-1" />
                            Use Template
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Multi-Format Content Analytics
              </CardTitle>
              <CardDescription>
                Track performance across all content formats and identify top-performing assets
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Format Performance Overview */}
                <div className="p-6 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg">
                  <h4 className="font-semibold mb-4">Content Format Performance</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {Object.entries(CONTENT_ASSET_TYPES).map(([key, info]) => {
                      const assetCount = contentAssets.filter(a => a.asset_type === key).length;
                      const totalViews = contentAssets
                        .filter(a => a.asset_type === key)
                        .reduce((sum, asset) => sum + asset.view_count, 0);

                      return (
                        <div key={key} className="p-4 bg-white rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            {info.icon}
                            <span className="font-medium text-sm capitalize">
                              {key.replace('_', ' ')}
                            </span>
                          </div>
                          <div className="space-y-1 text-xs">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Assets:</span>
                              <span>{assetCount}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Views:</span>
                              <span>{totalViews.toLocaleString()}</span>
                            </div>
                          </div>
                          <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-500 h-2 rounded-full"
                              style={{ width: `${Math.min((totalViews / 1000) * 20, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Top Performing Assets */}
                <div>
                  <h4 className="font-semibold mb-4">Top Performing Assets</h4>
                  <div className="space-y-3">
                    {contentAssets
                      .sort((a, b) => b.view_count - a.view_count)
                      .slice(0, 5)
                      .map((asset, idx) => (
                        <div key={asset.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-8 h-8 bg-primary text-primary-foreground rounded-full text-sm font-bold">
                              {idx + 1}
                            </div>
                            <div>
                              <div className="font-medium">{asset.title}</div>
                              <div className="text-sm text-muted-foreground capitalize">
                                {asset.asset_type.replace('_', ' ')} • {formatFileSize(asset.file_size_bytes)}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <div className="font-semibold">{asset.view_count.toLocaleString()}</div>
                              <div className="text-xs text-muted-foreground">views</div>
                            </div>
                            <div className="text-right">
                              <div className="font-semibold">{asset.download_count}</div>
                              <div className="text-xs text-muted-foreground">downloads</div>
                            </div>
                            <Badge variant={asset.optimization_status === 'optimized' ? 'default' : 'outline'}>
                              {asset.quality_level}
                            </Badge>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Interactive Content Performance */}
                <div>
                  <h4 className="font-semibold mb-4">Interactive Content Performance</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {interactiveContent.map((content) => {
                      const contentTypeInfo = INTERACTIVE_TYPES[content.interaction_type];
                      return (
                        <div key={content.id} className="p-4 border rounded-lg">
                          <div className="flex items-center gap-2 mb-3">
                            {contentTypeInfo.icon}
                            <span className="font-medium">{contentTypeInfo.title}</span>
                          </div>
                          <div className="grid grid-cols-3 gap-3 text-center">
                            <div>
                              <div className="font-semibold text-lg">{content.completion_rate}%</div>
                              <div className="text-xs text-muted-foreground">Completion</div>
                            </div>
                            <div>
                              <div className="font-semibold text-lg">
                                {Math.round(content.average_completion_time_seconds / 60)}m
                              </div>
                              <div className="text-xs text-muted-foreground">Avg Time</div>
                            </div>
                            <div>
                              <div className="font-semibold text-lg">{content.question_count}</div>
                              <div className="text-xs text-muted-foreground">Questions</div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
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

export default MultiFormatContentManager;