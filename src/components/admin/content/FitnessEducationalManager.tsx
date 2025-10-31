import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
  Activity,
  TrendingUp,
  Target,
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
  Timer,
  Flame,
  Dumbbell,
  Brain,
  Apple,
  Moon,
  PlayCircle,
  FileText,
  CheckCircle,
  AlertCircle,
  Clock,
  Muscle,
  HeartPulse,
  Weight,
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
  FitnessEducationalContent as FitnessEducationalContentType,
  ContentCalendar,
  ContentPerformanceAnalytics,
} from '@/types/content-strategy';

interface FitnessEducationalManagerProps {
  className?: string;
}

// Fitness category icons and descriptions
const FITNESS_CATEGORIES = {
  glutes_training: {
    icon: <Target className="w-4 h-4" />,
    color: 'bg-pink-100 text-pink-700',
    description: 'Glute-focused workouts and lower body development',
    primaryMuscles: ['Gluteus Maximus', 'Gluteus Medius', 'Gluteus Minimus'],
    equipment: ['Barbell', 'Dumbbells', 'Resistance Bands', 'Machines'],
  },
  lower_body: {
    icon: <Muscle className="w-4 h-4" />,
    color: 'bg-purple-100 text-purple-700',
    description: 'Comprehensive lower body training programs',
    primaryMuscles: ['Quadriceps', 'Hamstrings', 'Calves', 'Adductors'],
    equipment: ['Barbell', 'Dumbbells', 'Leg Press', 'Cables'],
  },
  strength_training: {
    icon: <Dumbbell className="w-4 h-4" />,
    color: 'bg-blue-100 text-blue-700',
    description: 'Full body strength and resistance training',
    primaryMuscles: ['All Major Muscle Groups'],
    equipment: ['Free Weights', 'Machines', 'Cables', 'Bodyweight'],
  },
  cardio_fitness: {
    icon: <HeartPulse className="w-4 h-4" />,
    color: 'bg-red-100 text-red-700',
    description: 'Cardiovascular conditioning and endurance',
    primaryMuscles: ['Heart', 'Lungs', 'Legs'],
    equipment: ['Treadmill', 'Bicycle', 'Elliptical', 'Jump Rope'],
  },
  flexibility_mobility: {
    icon: <Activity className="w-4 h-4" />,
    color: 'bg-green-100 text-green-700',
    description: 'Flexibility, mobility, and recovery work',
    primaryMuscles: ['All Muscles', 'Joints', 'Connective Tissue'],
    equipment: ['Yoga Mat', 'Foam Roller', 'Resistance Bands'],
  },
  nutrition: {
    icon: <Apple className="w-4 h-4" />,
    color: 'bg-orange-100 text-orange-700',
    description: 'Sports nutrition and dietary guidance',
    primaryMuscles: ['N/A - Systemic'],
    equipment: ['Food Scale', 'Meal Prep Containers'],
  },
  recovery: {
    icon: <Moon className="w-4 h-4" />,
    color: 'bg-indigo-100 text-indigo-700',
    description: 'Recovery strategies and techniques',
    primaryMuscles: ['All Muscles', 'Nervous System'],
    equipment: ['Foam Roller', 'Massage Balls', 'Ice Packs'],
  },
  mindset_wellness: {
    icon: <Brain className="w-4 h-4" />,
    color: 'bg-cyan-100 text-cyan-700',
    description: 'Mental health and fitness mindset',
    primaryMuscles: ['N/A - Mental'],
    equipment: ['Journal', 'Meditation Apps'],
  },
  exercise_science: {
    icon: <FileText className="w-4 h-4" />,
    color: 'bg-gray-100 text-gray-700',
    description: 'Scientific principles behind exercise',
    primaryMuscles: ['N/A - Educational'],
    equipment: ['N/A - Research'],
  },
  program_design: {
    icon: <Settings className="w-4 h-4" />,
    color: 'bg-emerald-100 text-emerald-700',
    description: 'Workout program design and periodization',
    primaryMuscles: ['Varies by Program'],
    equipment: ['Program Planning Tools'],
  },
  injury_prevention: {
    icon: <AlertCircle className="w-4 h-4" />,
    color: 'bg-yellow-100 text-yellow-700',
    description: 'Injury prevention and rehabilitation',
    primaryMuscles: ['Stabilizer Muscles', 'Injury-prone Areas'],
    equipment: ['Resistance Bands', 'Stability Equipment'],
  },
  performance_optimization: {
    icon: <Zap className="w-4 h-4" />,
    color: 'bg-amber-100 text-amber-700',
    description: 'Advanced performance enhancement',
    primaryMuscles: ['All Performance Systems'],
    equipment: ['Advanced Training Tools'],
  },
};

const DIFFICULTY_LEVELS = {
  beginner: {
    label: 'Beginner',
    color: 'bg-green-100 text-green-700',
    description: 'Just starting fitness journey',
    experienceRange: '0-6 months',
    typicalResults: 'Foundation building',
  },
  intermediate: {
    label: 'Intermediate',
    color: 'bg-yellow-100 text-yellow-700',
    description: 'Consistent training experience',
    experienceRange: '6 months - 2 years',
    typicalResults: 'Strength and muscle gains',
  },
  advanced: {
    label: 'Advanced',
    color: 'bg-orange-100 text-orange-700',
    description: 'Years of dedicated training',
    experienceRange: '2-5 years',
    typicalResults: 'Peak performance',
  },
  elite: {
    label: 'Elite',
    color: 'bg-purple-100 text-purple-700',
    description: 'Professional or competitive level',
    experienceRange: '5+ years',
    typicalResults: 'Excellence and expertise',
  },
};

const INTENSITY_LEVELS = {
  low: {
    label: 'Low Intensity',
    color: 'bg-blue-100 text-blue-700',
    heartRate: '50-60% MHR',
    description: 'Active recovery, beginners',
  },
  moderate: {
    label: 'Moderate Intensity',
    color: 'bg-green-100 text-green-700',
    heartRate: '60-70% MHR',
    description: 'Fat burning, fitness building',
  },
  high: {
    label: 'High Intensity',
    color: 'bg-orange-100 text-orange-700',
    heartRate: '70-85% MHR',
    description: 'Performance improvement',
  },
  maximum: {
    label: 'Maximum Intensity',
    color: 'bg-red-100 text-red-700',
    heartRate: '85-95% MHR',
    description: 'Peak performance, advanced',
  },
};

// Sample data for demonstration
const sampleFitnessContent: FitnessEducationalContentType[] = [
  {
    id: '1',
    content_id: 'fitness-1',
    fitness_category: 'glutes_training',
    difficulty_level: 'intermediate',
    primary_muscles: ['Gluteus Maximus', 'Gluteus Medius'],
    secondary_muscles: ['Hamstrings', 'Core'],
    equipment_needed: ['Barbell', 'Resistance Bands', 'Bench'],
    duration_minutes: 45,
    intensity_level: 'high',
    exercises: [
      {
        name: 'Barbell Hip Thrusts',
        sets: 4,
        reps: '8-12',
        rest: '90 seconds',
        weight: 'Moderate-Heavy',
      },
      {
        name: 'Bulgarian Split Squats',
        sets: 3,
        reps: '10-12',
        rest: '60 seconds',
        weight: 'Moderate',
      },
      {
        name: 'Cable Kickbacks',
        sets: 3,
        reps: '15-20',
        rest: '45 seconds',
        weight: 'Light-Moderate',
      },
      {
        name: 'Glute Bridges',
        sets: 3,
        reps: '15-25',
        rest: '45 seconds',
        weight: 'Bodyweight',
      },
    ],
    progression_options: {
      increaseWeight: 'Add 5-10% when comfortable',
      increaseReps: 'Progress to 15 reps before increasing weight',
      addSets: 'Add 4th set after 3 weeks',
      advancedVariations: ['Deficit hip thrusts', 'Paused reps', 'Banded variations'],
    },
    modifications: {
      beginner: ['Bodyweight glute bridges', 'Resistance band only', 'Reduced range of motion'],
      advanced: ['Paused reps', 'Eccentric focus', 'Drop sets'],
    },
    common_errors: [
      'Overarching lower back',
      'Not achieving full hip extension',
      'Using momentum instead of glute contraction',
      'Improper foot placement',
    ],
    research_references: [
      'Contreras et al. 2020 - EMG analysis of glute exercises',
      'Williams et al. 2019 - Hip thrust variations',
      'Journal of Strength & Conditioning Research 2021',
    ],
    biomechanics_explanation: 'The barbell hip thrust maximally activates the gluteus maximus due to the horizontal loading vector and hip extension mechanics.',
    physiological_benefits: [
      'Increased gluteal hypertrophy',
      'Improved hip extension strength',
      'Enhanced athletic performance',
      'Reduced lower back pain through better glute activation',
    ],
    key_concepts: [
      'Progressive overload',
      'Mind-muscle connection',
      'Full range of motion',
      'Proper breathing patterns',
    ],
    learning_points: [
      'How to properly activate glutes',
      'Progression planning',
      'Exercise selection principles',
      'Recovery and nutrition',
    ],
    practical_applications: [
      'Sports performance enhancement',
      'Aesthetic improvements',
      'Injury prevention',
      'Functional strength',
    ],
    nutrition_tips: {
      protein: '1.6-2.2g per kg bodyweight',
      carbs: '3-5g per kg bodyweight',
      timing: 'Post-workout protein within 30 minutes',
      hydration: '2-3 liters daily',
    },
    recovery_recommendations: [
      '48 hours between glute sessions',
      'Foam rolling and stretching',
      '7-9 hours quality sleep',
      'Active recovery on rest days',
    ],
    supplementation_notes: [
      'Creatine monohydrate - 5g daily',
      'Whey protein - 25-30g post-workout',
      'Omega-3 for inflammation reduction',
      'Vitamin D for bone health',
    ],
    progress_indicators: {
      strength: 'Increase in weight lifted by 10-20%',
      size: 'Glute measurement increase of 1-2 inches',
      performance: 'Improved vertical jump or sprint time',
      aesthetic: 'Visible shape and definition improvements',
    },
    testing_protocols: {
      strengthTest: '1RM hip thrust assessment every 8 weeks',
      progressPhotos: 'Monthly progress photos',
      measurements: 'Bi-weekly circumference measurements',
      performanceMetrics: 'Quarterly athletic testing',
    },
    expected_results_timeline: 'Noticeable improvements in 4-6 weeks, significant results in 12-16 weeks',
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
  },
];

const sampleContentPerformance: ContentPerformanceAnalytics[] = [
  {
    id: '1',
    content_id: 'fitness-1',
    date: '2024-01-15',
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
    demographic_data: { age: '25-45', gender: 'mixed', location: 'Warsaw' },
    geographic_data: { poland: 80, europe: 15, other: 5 },
    behavior_data: { device: 'mobile', sessionDuration: 240, pagesVisited: 4.1 },
    video_completion_rate: 85,
    audio_completion_rate: 0,
    quiz_completion_rate: 0,
    download_completion_rate: 67,
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
  },
];

export const FitnessEducationalManager = ({ className }: FitnessEducationalManagerProps) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('content');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [selectedIntensity, setSelectedIntensity] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [selectedContent, setSelectedContent] = useState<FitnessEducationalContentType | null>(null);

  // State for content management
  const [fitnessContent, setFitnessContent] = useState<FitnessEducationalContentType[]>(sampleFitnessContent);
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
  const filteredContent = fitnessContent.filter(content => {
    const matchesCategory = selectedCategory === 'all' || content.fitness_category === selectedCategory;
    const matchesDifficulty = selectedDifficulty === 'all' || content.difficulty_level === selectedDifficulty;
    const matchesIntensity = selectedIntensity === 'all' || content.intensity_level === selectedIntensity;
    const matchesSearch = searchTerm === '' ||
      content.exercises.some(exercise =>
        exercise.name.toLowerCase().includes(searchTerm.toLowerCase())
      ) ||
      content.primary_muscles.some(muscle =>
        muscle.toLowerCase().includes(searchTerm.toLowerCase())
      );
    return matchesCategory && matchesDifficulty && matchesIntensity && matchesSearch;
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
    avgCompletionRate: (acc.avgCompletionRate + curr.video_completion_rate || 0) / (performance.length || 1),
  }), { totalViews: 0, totalEngagement: 0, totalConversions: 0, avgEngagementRate: 0, avgCompletionRate: 0 });

  // Fitness Educational Content Card Component
  const FitnessContentCard = ({ content }: { content: FitnessEducationalContentType }) => {
    const contentPerf = getContentPerformance(content.content_id);
    const isExpanded = expandedItems.has(content.id);
    const categoryInfo = FITNESS_CATEGORIES[content.fitness_category];
    const difficultyInfo = DIFFICULTY_LEVELS[content.difficulty_level];
    const intensityInfo = INTENSITY_LEVELS[content.intensity_level];

    return (
      <Card className="transition-all duration-200 hover:shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={cn('p-2 rounded-lg', categoryInfo.color)}>
                {categoryInfo.icon}
              </div>
              <div>
                <CardTitle className="text-lg capitalize">
                  {content.fitness_category.replace('_', ' ')} Workout
                </CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className={cn('text-xs', difficultyInfo.color)}>
                    {difficultyInfo.label}
                  </Badge>
                  <Badge variant="outline" className={cn('text-xs', intensityInfo.color)}>
                    {intensityInfo.label}
                  </Badge>
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <Timer className="w-3 h-3" />
                    {content.duration_minutes} min
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
                    <PlayCircle className="w-4 h-4" />
                    <span className="font-semibold">{contentPerf.video_completion_rate}%</span>
                  </div>
                  <div className="text-xs text-muted-foreground">Completion</div>
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

            {/* Exercise Overview */}
            <div>
              <h4 className="font-medium text-sm text-muted-foreground mb-2">Exercise Overview</h4>
              <div className="space-y-2">
                {content.exercises.slice(0, 3).map((exercise, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm font-medium">{exercise.name}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {exercise.sets}×{exercise.reps}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{exercise.rest}</span>
                    </div>
                  </div>
                ))}
                {content.exercises.length > 3 && (
                  <div className="text-center text-sm text-muted-foreground">
                    +{content.exercises.length - 3} more exercises
                  </div>
                )}
              </div>
            </div>

            {/* Muscles Worked */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-2">Primary Muscles</h4>
                <div className="flex flex-wrap gap-1">
                  {content.primary_muscles.map((muscle, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs">
                      {muscle}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-2">Equipment</h4>
                <div className="flex flex-wrap gap-1">
                  {content.equipment_needed.slice(0, 3).map((equipment, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      {equipment}
                    </Badge>
                  ))}
                  {content.equipment_needed.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{content.equipment_needed.length - 3}
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
                    {content.learning_points.map((point, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <CheckCircle className="w-3 h-3 text-green-500" />
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Exercise Science */}
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-2">
                    Exercise Science
                  </h4>
                  <p className="text-sm bg-blue-50 p-3 rounded-lg">
                    {content.biomechanics_explanation}
                  </p>
                </div>

                {/* Progression Options */}
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-2">
                    Progression Plan
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-green-50 rounded-lg">
                      <div className="font-medium text-green-700 text-sm mb-1">Next 4 Weeks</div>
                      <p className="text-xs">{content.progression_options.increaseWeight}</p>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <div className="font-medium text-blue-700 text-sm mb-1">Long-term</div>
                      <p className="text-xs">{content.progression_options.advancedVariations?.join(', ')}</p>
                    </div>
                  </div>
                </div>

                {/* Expected Results */}
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-2">
                    Expected Results Timeline
                  </h4>
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-4 h-4 text-purple-600" />
                      <span className="font-medium text-purple-700">
                        {content.expected_results_timeline}
                      </span>
                    </div>
                    <div className="text-sm space-y-1">
                      {Object.entries(content.progress_indicators).map(([key, value]) => (
                        <div key={key} className="flex items-center gap-2">
                          <TrendingUp className="w-3 h-3 text-purple-500" />
                          <span className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}: {value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Nutrition and Recovery */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-2">
                      <Apple className="w-4 h-4 inline mr-1" />
                      Nutrition Tips
                    </h4>
                    <div className="space-y-1">
                      <div className="text-xs">
                        <span className="font-medium">Protein:</span> {content.nutrition_tips.protein}
                      </div>
                      <div className="text-xs">
                        <span className="font-medium">Timing:</span> {content.nutrition_tips.timing}
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-2">
                      <Moon className="w-4 h-4 inline mr-1" />
                      Recovery
                    </h4>
                    <ul className="text-xs space-y-1">
                      {content.recovery_recommendations.slice(0, 2).map((rec, idx) => (
                        <li key={idx}>• {rec}</li>
                      ))}
                    </ul>
                  </div>
                </div>

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
                    <Download className="w-4 h-4 mr-1" />
                    Export
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
            <Dumbbell className="w-8 h-8 text-primary" />
            Fitness Educational Content
          </h1>
          <p className="text-muted-foreground mt-2">
            Evidence-based fitness education for glutes, lower body, and performance optimization
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Create Workout
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>Create Fitness Educational Content</DialogTitle>
                <DialogDescription>
                  Design evidence-based workout programs with scientific backing
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6 py-4 max-h-96 overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="category">Fitness Category</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(FITNESS_CATEGORIES).map(([key, info]) => (
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
                    <Label htmlFor="difficulty">Difficulty Level</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select level" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(DIFFICULTY_LEVELS).map(([key, info]) => (
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

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="duration">Duration (minutes)</Label>
                    <Input type="number" placeholder="45" />
                  </div>
                  <div>
                    <Label htmlFor="intensity">Intensity Level</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select intensity" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(INTENSITY_LEVELS).map(([key, info]) => (
                          <SelectItem key={key} value={key}>
                            <div className="flex items-center gap-2">
                              <Flame className="w-3 h-3" />
                              {info.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="exercises">Exercises</Label>
                  <Textarea
                    placeholder="List exercises with sets, reps, and rest periods..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="primary-muscles">Primary Muscles</Label>
                    <Input placeholder="e.g., Gluteus Maximus, Hamstrings" />
                  </div>
                  <div>
                    <Label htmlFor="equipment">Equipment Needed</Label>
                    <Input placeholder="e.g., Barbell, Resistance Bands" />
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>Content Features</Label>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox id="exercise-science" />
                      <label htmlFor="exercise-science" className="text-sm">
                        Exercise Science
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="progression-plan" />
                      <label htmlFor="progression-plan" className="text-sm">
                        Progression Plan
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="nutrition-guide" />
                      <label htmlFor="nutrition-guide" className="text-sm">
                        Nutrition Guide
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="recovery-tips" />
                      <label htmlFor="recovery-tips" className="text-sm">
                        Recovery Tips
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="common-mistakes" />
                      <label htmlFor="common-mistakes" className="text-sm">
                        Common Mistakes
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="modifications" />
                      <label htmlFor="modifications" className="text-sm">
                        Modifications
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
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Views</p>
              <p className="text-2xl font-bold">{totalMetrics.totalViews.toLocaleString()}</p>
            </div>
            <Eye className="w-8 h-8 text-blue-500" />
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
            <span className="text-xs text-green-600">+12% from last month</span>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Completion Rate</p>
              <p className="text-2xl font-bold">{Math.round(totalMetrics.avgCompletionRate)}%</p>
            </div>
            <PlayCircle className="w-8 h-8 text-green-500" />
          </div>
          <div className="mt-2">
            <span className="text-xs text-green-600">+5% from last month</span>
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
            <span className="text-xs text-green-600">+22% from last month</span>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Workouts</p>
              <p className="text-2xl font-bold">{fitnessContent.length}</p>
            </div>
            <Dumbbell className="w-8 h-8 text-orange-500" />
          </div>
          <div className="mt-2">
            <span className="text-xs text-muted-foreground">2 published this month</span>
          </div>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="content" className="flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            Content Library
          </TabsTrigger>
          <TabsTrigger value="programs" className="flex items-center gap-2">
            <Target className="w-4 h-4" />
            Programs
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="science" className="flex items-center gap-2">
            <Brain className="w-4 h-4" />
            Science
          </TabsTrigger>
          <TabsTrigger value="progress" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Progress
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
                  placeholder="Search exercises, muscles, or equipment..."
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
                {Object.entries(FITNESS_CATEGORIES).map(([key, info]) => (
                  <SelectItem key={key} value={key}>
                    <div className="flex items-center gap-2">
                      {info.icon}
                      <span className="capitalize">{key.replace('_', ' ')}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                {Object.entries(DIFFICULTY_LEVELS).map(([key, info]) => (
                  <SelectItem key={key} value={key}>
                    <div className="flex items-center gap-2">
                      <div className={cn('w-3 h-3 rounded-full', info.color.split(' ')[0])}></div>
                      {info.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedIntensity} onValueChange={setSelectedIntensity}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Intensities</SelectItem>
                {Object.entries(INTENSITY_LEVELS).map(([key, info]) => (
                  <SelectItem key={key} value={key}>
                    <div className="flex items-center gap-2">
                      <Flame className="w-3 h-3" />
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
              <FitnessContentCard key={content.id} content={content} />
            ))}
          </div>

          {filteredContent.length === 0 && (
            <Card className="p-12 text-center">
              <Dumbbell className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No content found</h3>
              <p className="text-muted-foreground mb-4">
                Try adjusting your filters or create new fitness educational content.
              </p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Workout
              </Button>
            </Card>
          )}
        </TabsContent>

        {/* Programs Tab */}
        <TabsContent value="programs" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Workout Programs
              </CardTitle>
              <CardDescription>
                Structured multi-week programs for progressive development
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  {
                    title: 'Glute Transformation 12-Week',
                    category: 'glutes_training',
                    difficulty: 'intermediate',
                    duration: '12 weeks',
                    workouts: '3x/week',
                    participants: 234,
                    rating: 4.8,
                    image: '/api/placeholder/300/200',
                  },
                  {
                    title: 'Lower Body Strength Builder',
                    category: 'lower_body',
                    difficulty: 'advanced',
                    duration: '8 weeks',
                    workouts: '4x/week',
                    participants: 156,
                    rating: 4.9,
                    image: '/api/placeholder/300/200',
                  },
                  {
                    title: 'Beginner Fitness Foundation',
                    category: 'strength_training',
                    difficulty: 'beginner',
                    duration: '6 weeks',
                    workouts: '2x/week',
                    participants: 489,
                    rating: 4.7,
                    image: '/api/placeholder/300/200',
                  },
                ].map((program, idx) => (
                  <Card key={idx} className="overflow-hidden">
                    <div className="h-32 bg-gradient-to-br from-blue-100 to-purple-100"></div>
                    <CardContent className="p-4">
                      <h4 className="font-semibold mb-2">{program.title}</h4>
                      <div className="flex items-center gap-2 mb-3">
                        <Badge variant="outline" className="text-xs">
                          {program.difficulty}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {program.duration}
                        </span>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center justify-between">
                          <span>Workouts:</span>
                          <span>{program.workouts}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Participants:</span>
                          <span>{program.participants}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Rating:</span>
                          <div className="flex items-center gap-1">
                            <Star className="w-3 h-3 text-yellow-500 fill-current" />
                            {program.rating}
                          </div>
                        </div>
                      </div>
                      <Button className="w-full mt-4" size="sm">
                        View Program
                      </Button>
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
                Content Performance Analytics
              </CardTitle>
              <CardDescription>
                Track engagement and effectiveness of fitness educational content
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Performance Overview */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="p-6 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg">
                    <h4 className="font-semibold mb-4">Category Performance</h4>
                    <div className="space-y-3">
                      {Object.entries(FITNESS_CATEGORIES).slice(0, 5).map(([key, info]) => (
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
                              {Math.floor(Math.random() * 3000 + 1000)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg">
                    <h4 className="font-semibold mb-4">Difficulty Engagement</h4>
                    <div className="space-y-3">
                      {Object.entries(DIFFICULTY_LEVELS).map(([key, info]) => (
                        <div key={key} className="flex items-center justify-between p-2 bg-white rounded-lg">
                          <div className="flex items-center gap-2">
                            <div className={cn('w-3 h-3 rounded-full', info.color.split(' ')[0])}></div>
                            <span className="text-sm">{info.label}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">
                              {Math.floor(Math.random() * 85 + 15)}%
                            </span>
                            <span className="text-xs text-muted-foreground">completion</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Detailed Metrics Table */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4">Content</th>
                        <th className="text-left py-3 px-4">Views</th>
                        <th className="text-left py-3 px-4">Completion</th>
                        <th className="text-left py-3 px-4">Engagement</th>
                        <th className="text-left py-3 px-4">Conversions</th>
                        <th className="text-left py-3 px-4">Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {performance.map((perf, idx) => (
                        <tr key={idx} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <div className="font-medium">Fitness Workout #{idx + 1}</div>
                            <div className="text-sm text-muted-foreground">
                              {new Date(perf.date).toLocaleDateString()}
                            </div>
                          </td>
                          <td className="py-3 px-4">{perf.views.toLocaleString()}</td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1">
                              <PlayCircle className="w-4 h-4 text-green-500" />
                              {perf.video_completion_rate}%
                            </div>
                          </td>
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
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Science Tab */}
        <TabsContent value="science" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="w-5 h-5" />
                  Exercise Science Principles
                </CardTitle>
                <CardDescription>
                  Scientific backing for training methodologies
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    {
                      principle: 'Progressive Overload',
                      description: 'Gradually increasing stress to force adaptation',
                      evidence: 'Supported by 50+ years of research',
                      application: 'Weekly weight/volume increases',
                    },
                    {
                      principle: 'Specific Adaptation',
                      description: 'Training adaptations specific to imposed demands',
                      evidence: 'SAID principle in exercise physiology',
                      application: 'Sport-specific movement patterns',
                    },
                    {
                      principle: 'Recovery & Supercompensation',
                      description: 'Training stress followed by adaptation phase',
                      evidence: 'Hormesis and stress response research',
                      application: 'Periodized rest days and deloads',
                    },
                  ].map((item, idx) => (
                    <div key={idx} className="p-4 border rounded-lg">
                      <h4 className="font-semibold mb-2">{item.principle}</h4>
                      <p className="text-sm text-muted-foreground mb-2">{item.description}</p>
                      <div className="flex items-center gap-2 text-xs">
                        <Badge variant="outline">Evidence: {item.evidence}</Badge>
                        <Badge variant="outline">Application: {item.application}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Research References
                </CardTitle>
                <CardDescription>
                  Current scientific literature supporting content
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    {
                      title: 'Gluteus Maximus Activation During Common Exercises',
                      authors: 'Contreras et al.',
                      journal: 'Journal of Strength and Conditioning',
                      year: '2023',
                      findings: 'Hip thrusts show highest EMG activation',
                      relevance: 'Informs exercise selection for glute development',
                    },
                    {
                      title: 'Periodization Models for Strength Development',
                      authors: 'Williams et al.',
                      journal: 'Sports Medicine',
                      year: '2024',
                      findings: 'Non-linear periodization superior for strength',
                      relevance: 'Guides program design and progression',
                    },
                    {
                      title: 'Nutrient Timing for Muscle Hypertrophy',
                      authors: 'Aragon et al.',
                      journal: 'International Journal of Sport Nutrition',
                      year: '2023',
                      findings: 'Protein timing less critical than total daily intake',
                      relevance: 'Informs nutritional recommendations',
                    },
                  ].map((paper, idx) => (
                    <div key={idx} className="p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-medium text-sm mb-1">{paper.title}</h4>
                      <p className="text-xs text-muted-foreground mb-2">
                        {paper.authors} ({paper.year}) - {paper.journal}
                      </p>
                      <p className="text-xs mb-2">
                        <strong>Key Finding:</strong> {paper.findings}
                      </p>
                      <p className="text-xs text-blue-600">
                        <strong>Application:</strong> {paper.relevance}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Progress Tab */}
        <TabsContent value="progress" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Client Progress Tracking
              </CardTitle>
              <CardDescription>
                Monitor client transformations and program effectiveness
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Progress Overview */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">89%</div>
                    <div className="text-sm text-muted-foreground">Goal Achievement Rate</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">4.2kg</div>
                    <div className="text-sm text-muted-foreground">Avg Muscle Gain</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">94%</div>
                    <div className="text-sm text-muted-foreground">Client Satisfaction</div>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">12 weeks</div>
                    <div className="text-sm text-muted-foreground">Avg Program Duration</div>
                  </div>
                </div>

                {/* Success Stories */}
                <div>
                  <h4 className="font-semibold mb-4">Recent Transformations</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      {
                        name: 'Anna K.',
                        program: 'Glute Transformation',
                        duration: '12 weeks',
                        results: 'Glutes +3cm, Strength +45%',
                        image: '/api/placeholder/200/150',
                      },
                      {
                        name: 'Maria P.',
                        program: 'Lower Body Builder',
                        duration: '8 weeks',
                        results: 'Squat +20kg, Confidence +100%',
                        image: '/api/placeholder/200/150',
                      },
                      {
                        name: 'Ewa D.',
                        program: 'Beginner Foundation',
                        duration: '6 weeks',
                        results: 'Consistent routine, Energy +80%',
                        image: '/api/placeholder/200/150',
                      },
                    ].map((story, idx) => (
                      <Card key={idx} className="overflow-hidden">
                        <div className="h-32 bg-gradient-to-br from-pink-100 to-purple-100"></div>
                        <CardContent className="p-4">
                          <h5 className="font-semibold">{story.name}</h5>
                          <p className="text-sm text-muted-foreground mb-2">{story.program}</p>
                          <div className="space-y-1 text-xs">
                            <div className="flex justify-between">
                              <span>Duration:</span>
                              <span>{story.duration}</span>
                            </div>
                            <div className="text-center p-2 bg-green-50 rounded text-green-700 font-medium">
                              {story.results}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* Progress Tracking Tools */}
                <div>
                  <h4 className="font-semibold mb-4">Progress Tracking Features</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 border rounded-lg text-center">
                      <Weight className="w-8 h-8 mx-auto mb-2 text-blue-500" />
                      <div className="font-medium">Strength Metrics</div>
                      <div className="text-sm text-muted-foreground">1RM tracking, volume progression</div>
                    </div>
                    <div className="p-4 border rounded-lg text-center">
                      <Camera className="w-8 h-8 mx-auto mb-2 text-purple-500" />
                      <div className="font-medium">Visual Progress</div>
                      <div className="text-sm text-muted-foreground">Progress photos, measurements</div>
                    </div>
                    <div className="p-4 border rounded-lg text-center">
                      <BarChart3 className="w-8 h-8 mx-auto mb-2 text-green-500" />
                      <div className="font-medium">Performance Analytics</div>
                      <div className="text-sm text-muted-foreground">Trend analysis, goal tracking</div>
                    </div>
                    <div className="p-4 border rounded-lg text-center">
                      <Award className="w-8 h-8 mx-auto mb-2 text-orange-500" />
                      <div className="font-medium">Achievement System</div>
                      <div className="text-sm text-muted-foreground">Milestones, badges, rewards</div>
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

export default FitnessEducationalManager;