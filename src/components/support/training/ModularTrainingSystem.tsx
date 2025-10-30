import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useTranslation } from 'react-i18next';
import {
  BookOpen,
  GraduationCap,
  Award,
  Target,
  Users,
  Video,
  FileText,
  MessageSquare,
  Clock,
  CheckCircle,
  AlertCircle,
  Star,
  TrendingUp,
  User,
  Play,
  Pause,
  RotateCcw,
  Download,
  Upload,
  Search,
  Filter,
  Calendar,
  BarChart3,
  Brain,
  Heart,
  Shield,
  Phone,
  Mail,
  HeadphonesIcon,
  Globe,
  Languages,
  Zap,
  Settings,
  Lightbulb,
  ChevronRight,
  ChevronLeft,
  Bookmark,
  Share2,
  Printer,
  Lock,
  Unlock,
  Trophy,
  Medal,
  Flag,
  CheckSquare,
  Square,
  RefreshCw,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  Timer,
  Activity,
  PieChart,
  LineChart
} from 'lucide-react';

interface TrainingModule {
  id: string;
  title: string;
  description: string;
  category: string;
  subcategory?: string;
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  duration: number; // in minutes
  type: 'video' | 'text' | 'interactive' | 'simulation' | 'assessment' | 'workshop';
  status: 'not-started' | 'in-progress' | 'completed' | 'failed';
  progress: number; // 0-100
  score?: number;
  timeSpent: number; // in minutes
  lastAccessed?: Date;
  completedAt?: Date;
  attempts: number;
  maxAttempts: number;
  prerequisites?: string[];
  objectives: string[];
  content: ModuleContent[];
  assessment?: ModuleAssessment;
  resources?: ModuleResource[];
  certification?: CertificationInfo;
  tags: string[];
  difficulty: number; // 1-5 scale
  priority: 'low' | 'medium' | 'high' | 'urgent';
  estimatedTime: number;
  instructor?: string;
  nextSession?: Date;
  isMandatory: boolean;
  complianceRequired?: boolean;
  refreshFrequency?: 'none' | 'monthly' | 'quarterly' | 'annually';
  skillPoints: number;
}

interface ModuleContent {
  id: string;
  type: 'video' | 'text' | 'interactive' | 'quiz' | 'simulation' | 'download';
  title: string;
  description: string;
  duration?: number;
  order: number;
  isCompleted: boolean;
  content: any;
  resources?: any[];
}

interface ModuleAssessment {
  id: string;
  title: string;
  description: string;
  questions: AssessmentQuestion[];
  passingScore: number;
  timeLimit?: number; // in minutes
  attempts: number;
  maxAttempts: number;
  randomizeQuestions: boolean;
  showCorrectAnswers: boolean;
  allowReview: boolean;
}

interface AssessmentQuestion {
  id: string;
  type: 'multiple-choice' | 'true-false' | 'fill-blank' | 'essay' | 'practical';
  question: string;
  options?: string[];
  correctAnswer: any;
  explanation?: string;
  points: number;
  category?: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

interface ModuleResource {
  id: string;
  type: 'pdf' | 'doc' | 'video' | 'link' | 'template' | 'checklist';
  title: string;
  description: string;
  url?: string;
  downloadable?: boolean;
  size?: string;
  format?: string;
}

interface CertificationInfo {
  name: string;
  description: string;
  validFor: number; // in months
  issuer: string;
  badgeUrl?: string;
  requirements: string[];
}

interface LearningPath {
  id: string;
  name: string;
  description: string;
  category: string;
  level: string;
  modules: string[];
  estimatedDuration: number;
  isRequired: boolean;
  progress: number;
  completedModules: number;
  totalModules: number;
  skillPoints: number;
  badge?: string;
}

interface UserProgress {
  userId: string;
  currentLevel: string;
  totalPoints: number;
  completedModules: string[];
  inProgressModules: string[];
  skills: UserSkill[];
  achievements: Achievement[];
  streak: number;
  totalTimeSpent: number;
  averageScore: number;
  lastActivity: Date;
  nextMilestone: Milestone;
  learningPaths: LearningPathProgress[];
}

interface UserSkill {
  name: string;
  level: number; // 1-5
  points: number;
  category: string;
  lastImproved: Date;
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt: Date;
  points: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

interface Milestone {
  name: string;
  description: string;
  requiredPoints: number;
  currentPoints: number;
  progress: number;
  rewards: string[];
}

interface LearningPathProgress {
  pathId: string;
  progress: number;
  startedAt: Date;
  estimatedCompletion: Date;
  nextModule: string;
}

const ModularTrainingSystem: React.FC = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedModule, setSelectedModule] = useState<TrainingModule | null>(null);
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null);
  const [learningPaths, setLearningPaths] = useState<LearningPath[]>([]);
  const [showModuleDialog, setShowModuleDialog] = useState(false);
  const [currentContentIndex, setCurrentContentIndex] = useState(0);
  const [assessmentAnswers, setAssessmentAnswers] = useState<{ [key: string]: any }>({});
  const [showAssessmentResults, setShowAssessmentResults] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [sortBy, setSortBy] = useState('progress');

  // Mock data
  const trainingModules: TrainingModule[] = [
    {
      id: 'onboarding-foundation',
      title: 'New Employee Onboarding - Foundation',
      description: 'Essential introduction to company culture, brand standards, and support philosophy',
      category: 'onboarding',
      level: 'beginner',
      duration: 60,
      type: 'interactive',
      status: 'in-progress',
      progress: 65,
      score: 85,
      timeSpent: 45,
      lastAccessed: new Date('2024-10-28'),
      attempts: 1,
      maxAttempts: 3,
      objectives: [
        'Understand company values and luxury service philosophy',
        'Master brand voice and communication standards',
        'Learn support team structure and escalation procedures'
      ],
      content: [
        {
          id: '1',
          type: 'video',
          title: 'Welcome to the Team',
          description: 'Introduction to company culture and values',
          duration: 15,
          order: 1,
          isCompleted: true,
          content: { url: '/videos/welcome.mp4' }
        },
        {
          id: '2',
          type: 'text',
          title: 'Company Culture and Values',
          description: 'Detailed information about our luxury service approach',
          order: 2,
          isCompleted: true,
          content: { text: '...' }
        },
        {
          id: '3',
          type: 'interactive',
          title: 'Brand Voice Practice',
          description: 'Practice exercises for luxury communication',
          order: 3,
          isCompleted: false,
          content: { exercises: [] }
        }
      ],
      assessment: {
        id: 'onboarding-assessment',
        title: 'Onboarding Knowledge Check',
        description: 'Test your understanding of company culture and procedures',
        questions: [
          {
            id: '1',
            type: 'multiple-choice',
            question: 'What is our primary service philosophy?',
            options: [
              'Fast response times',
              'Luxury white-glove service',
              'Cost efficiency',
              'Automation first'
            ],
            correctAnswer: 1,
            explanation: 'Our focus is on providing exceptional white-glove service to every client.',
            points: 10,
            difficulty: 'easy'
          },
          {
            id: '2',
            type: 'true-false',
            question: 'VIP clients should be treated the same as regular clients',
            correctAnswer: false,
            explanation: 'VIP clients receive enhanced service with personalized attention and priority access.',
            points: 10,
            difficulty: 'easy'
          }
        ],
        passingScore: 80,
        timeLimit: 30,
        attempts: 1,
        maxAttempts: 3,
        randomizeQuestions: false,
        showCorrectAnswers: true,
        allowReview: true
      },
      resources: [
        {
          id: '1',
          type: 'pdf',
          title: 'Employee Handbook',
          description: 'Complete guide to company policies and procedures',
          url: '/files/employee-handbook.pdf',
          downloadable: true,
          size: '2.5 MB',
          format: 'PDF'
        },
        {
          id: '2',
          type: 'checklist',
          title: 'Onboarding Checklist',
          description: 'Track your progress through the onboarding process',
          downloadable: true,
          size: '150 KB',
          format: 'PDF'
        }
      ],
      tags: ['onboarding', 'culture', 'essentials'],
      difficulty: 1,
      priority: 'high',
      estimatedTime: 75,
      instructor: 'Sarah Johnson',
      isMandatory: true,
      complianceRequired: true,
      refreshFrequency: 'none',
      skillPoints: 50
    },
    {
      id: 'beauty-services-advanced',
      title: 'Beauty Services - Advanced Product Knowledge',
      description: 'Comprehensive training on advanced beauty services and consultation techniques',
      category: 'product-knowledge',
      level: 'advanced',
      duration: 120,
      type: 'workshop',
      status: 'not-started',
      progress: 0,
      timeSpent: 0,
      attempts: 0,
      maxAttempts: 3,
      prerequisites: ['beauty-services-basic', 'consultation-skills'],
      objectives: [
        'Master advanced beauty service techniques',
        'Handle complex client consultations',
        'Provide expert recommendations',
        'Manage difficult client situations'
      ],
      content: [
        {
          id: '1',
          type: 'video',
          title: 'Advanced Lip Enhancement Techniques',
          description: 'In-depth training on advanced procedures',
          duration: 45,
          order: 1,
          isCompleted: false,
          content: { url: '/videos/advanced-lip.mp4' }
        }
      ],
      tags: ['beauty', 'advanced', 'consultation'],
      difficulty: 4,
      priority: 'medium',
      estimatedTime: 150,
      nextSession: new Date('2024-11-05'),
      isMandatory: false,
      skillPoints: 100
    },
    {
      id: 'crisis-management',
      title: 'Crisis Management and De-escalation',
      description: 'Advanced techniques for handling difficult situations and crisis scenarios',
      category: 'advanced-skills',
      level: 'expert',
      duration: 180,
      type: 'simulation',
      status: 'completed',
      progress: 100,
      score: 92,
      timeSpent: 165,
      lastAccessed: new Date('2024-10-25'),
      completedAt: new Date('2024-10-25'),
      attempts: 1,
      maxAttempts: 5,
      prerequisites: ['customer-service-excellence', 'communication-standards'],
      objectives: [
        'Master de-escalation techniques',
        'Handle emergency situations professionally',
        'Maintain brand reputation under pressure',
        'Coordinate with emergency services'
      ],
      tags: ['crisis', 'emergency', 'advanced'],
      difficulty: 5,
      priority: 'urgent',
      estimatedTime: 200,
      isMandatory: true,
      complianceRequired: true,
      refreshFrequency: 'quarterly',
      skillPoints: 150,
      certification: {
        name: 'Crisis Management Specialist',
        description: 'Certified in handling crisis situations and emergency procedures',
        validFor: 12,
        issuer: 'Safety & Compliance Department',
        badgeUrl: '/badges/crisis-management.svg',
        requirements: ['Complete crisis management module', 'Pass assessment with 90%+', 'Annual refresher required']
      }
    }
  ];

  const learningPathsData: LearningPath[] = [
    {
      id: 'new-hire-path',
      name: 'New Hire Onboarding Path',
      description: 'Complete onboarding journey for new support team members',
      category: 'onboarding',
      level: 'beginner',
      modules: ['onboarding-foundation', 'company-policies', 'system-basics', 'first-week-support'],
      estimatedDuration: 480, // 8 hours
      isRequired: true,
      progress: 65,
      completedModules: 2,
      totalModules: 4,
      skillPoints: 200,
      badge: '/badges/onboarding-complete.svg'
    },
    {
      id: 'vip-service-path',
      name: 'VIP Service Excellence Path',
      description: 'Master the art of serving VIP clients with white-glove service',
      category: 'service-excellence',
      level: 'advanced',
      modules: ['luxury-communication', 'vip-protocols', 'personalized-service', 'relationship-management'],
      estimatedDuration: 360,
      isRequired: false,
      progress: 25,
      completedModules: 1,
      totalModules: 4,
      skillPoints: 300,
      badge: '/badges/vip-specialist.svg'
    },
    {
      id: 'leadership-path',
      name: 'Team Leadership Development',
      description: 'Develop leadership skills for senior support roles',
      category: 'leadership',
      level: 'expert',
      modules: ['team-management', 'performance-coaching', 'conflict-resolution', 'strategic-planning'],
      estimatedDuration: 600,
      isRequired: false,
      progress: 0,
      completedModules: 0,
      totalModules: 4,
      skillPoints: 500,
      badge: '/badges/team-leader.svg'
    }
  ];

  const mockUserProgress: UserProgress = {
    userId: 'user-123',
    currentLevel: 'Support Specialist Level 3',
    totalPoints: 850,
    completedModules: ['crisis-management'],
    inProgressModules: ['onboarding-foundation'],
    skills: [
      { name: 'Customer Communication', level: 4, points: 250, category: 'communication', lastImproved: new Date('2024-10-25') },
      { name: 'Crisis Management', level: 5, points: 150, category: 'emergency', lastImproved: new Date('2024-10-25') },
      { name: 'Product Knowledge', level: 2, points: 80, category: 'services', lastImproved: new Date('2024-10-20') },
      { name: 'System Navigation', level: 3, points: 120, category: 'technical', lastImproved: new Date('2024-10-22') }
    ],
    achievements: [
      {
        id: 'first-module',
        name: 'First Steps',
        description: 'Complete your first training module',
        icon: '🎯',
        unlockedAt: new Date('2024-10-25'),
        points: 10,
        rarity: 'common'
      },
      {
        id: 'crisis-expert',
        name: 'Crisis Expert',
        description: 'Score 90%+ in Crisis Management',
        icon: '🛡️',
        unlockedAt: new Date('2024-10-25'),
        points: 50,
        rarity: 'epic'
      }
    ],
    streak: 7,
    totalTimeSpent: 240,
    averageScore: 88.5,
    lastActivity: new Date('2024-10-28'),
    nextMilestone: {
      name: 'Senior Support Specialist',
      description: 'Reach Level 4 with 1000 skill points',
      requiredPoints: 1000,
      currentPoints: 850,
      progress: 85,
      rewards: ['Advanced tools access', 'Priority scheduling', 'Mentorship opportunities']
    },
    learningPaths: [
      {
        pathId: 'new-hire-path',
        progress: 65,
        startedAt: new Date('2024-10-15'),
        estimatedCompletion: new Date('2024-11-05'),
        nextModule: 'system-basics'
      }
    ]
  };

  useEffect(() => {
    setUserProgress(mockUserProgress);
    setLearningPaths(learningPathsData);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      case 'not-started': return 'bg-gray-100 text-gray-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-blue-100 text-blue-800';
      case 'advanced': return 'bg-purple-100 text-purple-800';
      case 'expert': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white';
      case 'epic': return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'rare': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'common': return 'bg-gray-100 text-gray-800 border-gray-300';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleModuleStart = (module: TrainingModule) => {
    setSelectedModule(module);
    setShowModuleDialog(true);
  };

  const handleModuleContinue = (module: TrainingModule) => {
    setSelectedModule(module);
    setCurrentContentIndex(module.content.findIndex(content => !content.isCompleted) || 0);
    setShowModuleDialog(true);
  };

  const handleContentComplete = (contentId: string) => {
    if (selectedModule) {
      const updatedContent = selectedModule.content.map(content =>
        content.id === contentId ? { ...content, isCompleted: true } : content
      );
      setSelectedModule({ ...selectedModule, content: updatedContent });
    }
  };

  const handleAssessmentSubmit = () => {
    // Calculate assessment score
    setShowAssessmentResults(true);
  };

  const filteredModules = trainingModules.filter(module => {
    const matchesSearch = module.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         module.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || module.category === selectedCategory;
    const matchesLevel = selectedLevel === 'all' || module.level === selectedLevel;
    return matchesSearch && matchesCategory && matchesLevel;
  });

  const sortedModules = [...filteredModules].sort((a, b) => {
    switch (sortBy) {
      case 'progress':
        return b.progress - a.progress;
      case 'priority':
        const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      case 'difficulty':
        return b.difficulty - a.difficulty;
      case 'duration':
        return a.duration - b.duration;
      default:
        return 0;
    }
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50/30 via-orange-50/20 to-rose-50/30">
      {/* Header */}
      <div className="bg-white/90 backdrop-blur-md shadow-lg border-b border-amber-100">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <GraduationCap className="h-8 w-8 text-amber-600" />
              <div>
                <h1 className="text-3xl font-bold text-amber-900">Modular Training System</h1>
                <p className="text-amber-600">Personalized learning paths for support excellence</p>
              </div>
            </div>

            {userProgress && (
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="text-sm text-amber-600">Current Level</p>
                  <p className="text-lg font-bold text-amber-900">{userProgress.currentLevel}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-amber-600">Skill Points</p>
                  <p className="text-lg font-bold text-amber-900">{userProgress.totalPoints}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-amber-600">Learning Streak</p>
                  <p className="text-lg font-bold text-amber-900">{userProgress.streak} days</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 bg-gradient-to-r from-amber-100 to-orange-100 border border-amber-200">
            <TabsTrigger value="dashboard" className="data-[state=active]:bg-white data-[state=active]:shadow-md">
              <BarChart3 className="h-4 w-4 mr-2" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="modules" className="data-[state=active]:bg-white data-[state=active]:shadow-md">
              <BookOpen className="h-4 w-4 mr-2" />
              Modules
            </TabsTrigger>
            <TabsTrigger value="learning-paths" className="data-[state=active]:bg-white data-[state=active]:shadow-md">
              <Target className="h-4 w-4 mr-2" />
              Learning Paths
            </TabsTrigger>
            <TabsTrigger value="progress" className="data-[state=active]:bg-white data-[state=active]:shadow-md">
              <TrendingUp className="h-4 w-4 mr-2" />
              Progress
            </TabsTrigger>
            <TabsTrigger value="achievements" className="data-[state=active]:bg-white data-[state=active]:shadow-md">
              <Trophy className="h-4 w-4 mr-2" />
              Achievements
            </TabsTrigger>
            <TabsTrigger value="certifications" className="data-[state=active]:bg-white data-[state=active]:shadow-md">
              <Award className="h-4 w-4 mr-2" />
              Certifications
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            {/* Progress Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <Card className="border-amber-200 shadow-lg">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-amber-600">Modules Completed</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-amber-900">
                    {userProgress?.completedModules.length || 0}
                  </div>
                  <p className="text-xs text-amber-600">This month: +2</p>
                </CardContent>
              </Card>

              <Card className="border-amber-200 shadow-lg">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-amber-600">Average Score</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-amber-900">
                    {userProgress?.averageScore.toFixed(1) || 0}%
                  </div>
                  <p className="text-xs text-amber-600">Above target</p>
                </CardContent>
              </Card>

              <Card className="border-amber-200 shadow-lg">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-amber-600">Learning Time</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-amber-900">
                    {Math.floor((userProgress?.totalTimeSpent || 0) / 60)}h
                  </div>
                  <p className="text-xs text-amber-600">This week: 5h</p>
                </CardContent>
              </Card>

              <Card className="border-amber-200 shadow-lg">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-amber-600">Next Milestone</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-lg font-bold text-amber-900">
                    {userProgress?.nextMilestone.progress || 0}%
                  </div>
                  <Progress value={userProgress?.nextMilestone.progress || 0} className="mt-2" />
                  <p className="text-xs text-amber-600 mt-1">
                    {userProgress?.nextMilestone.name}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Continue Learning */}
            <Card className="border-amber-200 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-amber-900">
                  <Play className="h-5 w-5 text-amber-600" />
                  Continue Learning
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {trainingModules
                    .filter(module => module.status === 'in-progress')
                    .slice(0, 3)
                    .map((module) => (
                      <Card key={module.id} className="border-amber-200 shadow-md hover:shadow-lg transition-shadow">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <Badge className={getStatusColor(module.status)}>
                              {module.status.replace('-', ' ')}
                            </Badge>
                            <Badge className={getPriorityColor(module.priority)}>
                              {module.priority}
                            </Badge>
                          </div>
                          <CardTitle className="text-lg text-amber-900">{module.title}</CardTitle>
                          <CardDescription className="line-clamp-2">
                            {module.description}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-amber-600">Progress</span>
                              <span className="font-medium text-amber-900">{module.progress}%</span>
                            </div>
                            <Progress value={module.progress} />
                            <div className="flex items-center justify-between text-xs text-amber-500">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {module.duration} min total
                              </span>
                              <span className="flex items-center gap-1">
                                <Activity className="h-3 w-3" />
                                {module.timeSpent} min spent
                              </span>
                            </div>
                            <Button
                              className="w-full bg-amber-600 hover:bg-amber-700"
                              onClick={() => handleModuleContinue(module)}
                            >
                              Continue Learning
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              </CardContent>
            </Card>

            {/* Recommended Modules */}
            <Card className="border-amber-200 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-amber-900">
                  <Lightbulb className="h-5 w-5 text-amber-600" />
                  Recommended for You
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {trainingModules
                    .filter(module => module.status === 'not-started' && module.priority !== 'low')
                    .slice(0, 2)
                    .map((module) => (
                      <div key={module.id} className="border border-amber-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Badge className={getLevelColor(module.level)}>
                              {module.level}
                            </Badge>
                            {module.isMandatory && (
                              <Badge className="bg-red-100 text-red-800">
                                <Lock className="h-3 w-3 mr-1" />
                                Required
                              </Badge>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-amber-900">{module.skillPoints} pts</p>
                          </div>
                        </div>
                        <h3 className="font-semibold text-amber-900 mb-2">{module.title}</h3>
                        <p className="text-sm text-amber-600 mb-3 line-clamp-2">{module.description}</p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-xs text-amber-500">
                            <Clock className="h-3 w-3" />
                            {module.estimatedTime} min
                          </div>
                          <Button
                            size="sm"
                            className="bg-amber-600 hover:bg-amber-700"
                            onClick={() => handleModuleStart(module)}
                          >
                            Start Module
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Modules Tab */}
          <TabsContent value="modules" className="space-y-6">
            {/* Filters and Search */}
            <Card className="border-amber-200 shadow-lg">
              <CardHeader>
                <CardTitle>Training Modules</CardTitle>
                <CardDescription>Browse and filter available training modules</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col lg:flex-row gap-4 mb-6">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-amber-500" />
                      <Input
                        placeholder="Search modules..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 border-amber-200"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="px-3 py-2 border border-amber-200 rounded-md bg-white text-sm"
                    >
                      <option value="all">All Categories</option>
                      <option value="onboarding">Onboarding</option>
                      <option value="product-knowledge">Product Knowledge</option>
                      <option value="customer-service">Customer Service</option>
                      <option value="technical-skills">Technical Skills</option>
                      <option value="advanced-skills">Advanced Skills</option>
                      <option value="compliance">Compliance</option>
                    </select>
                    <select
                      value={selectedLevel}
                      onChange={(e) => setSelectedLevel(e.target.value)}
                      className="px-3 py-2 border border-amber-200 rounded-md bg-white text-sm"
                    >
                      <option value="all">All Levels</option>
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                      <option value="expert">Expert</option>
                    </select>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="px-3 py-2 border border-amber-200 rounded-md bg-white text-sm"
                    >
                      <option value="progress">Sort by Progress</option>
                      <option value="priority">Sort by Priority</option>
                      <option value="difficulty">Sort by Difficulty</option>
                      <option value="duration">Sort by Duration</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {sortedModules.map((module) => (
                    <Card key={module.id} className="border-amber-200 shadow-lg hover:shadow-xl transition-shadow">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <Badge className={getStatusColor(module.status)}>
                              {module.status.replace('-', ' ')}
                            </Badge>
                            <Badge className={getPriorityColor(module.priority)}>
                              {module.priority}
                            </Badge>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-amber-900">{module.skillPoints} pts</p>
                          </div>
                        </div>
                        <CardTitle className="text-lg text-amber-900">{module.title}</CardTitle>
                        <CardDescription className="line-clamp-2">
                          {module.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <Badge className={getLevelColor(module.level)}>
                                {module.level}
                              </Badge>
                              <span className="text-amber-600">{module.type}</span>
                            </div>
                            <div className="flex items-center gap-2 text-amber-500">
                              <Clock className="h-4 w-4" />
                              <span>{module.duration} min</span>
                            </div>
                          </div>

                          {/* Prerequisites */}
                          {module.prerequisites && module.prerequisites.length > 0 && (
                            <Alert>
                              <Lock className="h-4 w-4" />
                              <AlertDescription className="text-xs">
                                Requires: {module.prerequisites.join(', ')}
                              </AlertDescription>
                            </Alert>
                          )}

                          {/* Progress */}
                          {module.progress > 0 && (
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span className="text-amber-600">Progress</span>
                                <span className="text-amber-900 font-medium">{module.progress}%</span>
                              </div>
                              <Progress value={module.progress} />
                              {module.score && (
                                <p className="text-xs text-amber-600">Score: {module.score}%</p>
                              )}
                            </div>
                          )}

                          {/* Objectives */}
                          <div className="space-y-2">
                            <p className="text-sm font-medium text-amber-900">You'll learn:</p>
                            <ul className="text-xs text-amber-600 space-y-1">
                              {module.objectives.slice(0, 2).map((objective, index) => (
                                <li key={index} className="flex items-center gap-2">
                                  <CheckCircle className="h-3 w-3 text-green-500 flex-shrink-0" />
                                  {objective}
                                </li>
                              ))}
                            </ul>
                          </div>

                          <Button
                            className="w-full"
                            variant={module.status === 'in-progress' ? 'default' : 'outline'}
                            onClick={() => module.status === 'not-started' ? handleModuleStart(module) : handleModuleContinue(module)}
                          >
                            {module.status === 'not-started' ? 'Start Module' :
                             module.status === 'in-progress' ? 'Continue Learning' :
                             module.status === 'completed' ? 'Review Module' : 'Retry Module'}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Learning Paths Tab */}
          <TabsContent value="learning-paths" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {learningPaths.map((path) => (
                <Card key={path.id} className="border-amber-200 shadow-lg hover:shadow-xl transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      {path.isRequired && (
                        <Badge className="bg-red-100 text-red-800">
                          <Lock className="h-3 w-3 mr-1" />
                          Required
                        </Badge>
                      )}
                      <Badge className="bg-amber-100 text-amber-800">
                        {path.level}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg text-amber-900">{path.name}</CardTitle>
                    <CardDescription>{path.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-amber-600">Progress</span>
                          <span className="font-medium text-amber-900">{path.progress}%</span>
                        </div>
                        <Progress value={path.progress} />
                        <p className="text-xs text-amber-600">
                          {path.completedModules} of {path.totalModules} modules completed
                        </p>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 text-amber-600">
                          <Clock className="h-4 w-4" />
                          <span>{Math.round(path.estimatedDuration / 60)}h total</span>
                        </div>
                        <div className="flex items-center gap-2 text-amber-600">
                          <Trophy className="h-4 w-4" />
                          <span>{path.skillPoints} points</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <p className="text-sm font-medium text-amber-900">Modules in this path:</p>
                        <div className="space-y-1">
                          {path.modules.slice(0, 3).map((moduleId, index) => {
                            const module = trainingModules.find(m => m.id === moduleId);
                            return module ? (
                              <div key={moduleId} className="flex items-center gap-2 text-xs">
                                <div className={`w-2 h-2 rounded-full ${
                                  module.status === 'completed' ? 'bg-green-500' :
                                  module.status === 'in-progress' ? 'bg-blue-500' : 'bg-gray-300'
                                }`} />
                                <span className="text-amber-700">{module.title}</span>
                              </div>
                            ) : null;
                          })}
                          {path.modules.length > 3 && (
                            <p className="text-xs text-amber-500">+{path.modules.length - 3} more modules</p>
                          )}
                        </div>
                      </div>

                      <Button
                        className="w-full bg-amber-600 hover:bg-amber-700"
                        disabled={path.progress === 100}
                      >
                        {path.progress === 0 ? 'Start Path' :
                         path.progress === 100 ? 'Completed' : 'Continue Path'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Progress Tab */}
          <TabsContent value="progress" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Skills Development */}
              <Card className="border-amber-200 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-amber-900">
                    <Brain className="h-5 w-5 text-amber-600" />
                    Skills Development
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {userProgress?.skills.map((skill) => (
                      <div key={skill.name} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-amber-900">{skill.name}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-amber-600">Level {skill.level}</span>
                            <span className="text-xs text-amber-500">({skill.points} pts)</span>
                          </div>
                        </div>
                        <Progress value={(skill.level / 5) * 100} className="h-2" />
                        <p className="text-xs text-amber-500">
                          Last improved: {skill.lastImproved.toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Learning Analytics */}
              <Card className="border-amber-200 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-amber-900">
                    <LineChart className="h-5 w-5 text-amber-600" />
                    Learning Analytics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-amber-50 rounded-lg">
                        <p className="text-2xl font-bold text-amber-900">{userProgress?.totalTimeSpent || 0}</p>
                        <p className="text-xs text-amber-600">Minutes Spent Learning</p>
                      </div>
                      <div className="text-center p-3 bg-amber-50 rounded-lg">
                        <p className="text-2xl font-bold text-amber-900">{userProgress?.averageScore.toFixed(1) || 0}%</p>
                        <p className="text-xs text-amber-600">Average Score</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-medium text-amber-900">Activity by Day</h4>
                      <div className="grid grid-cols-7 gap-1">
                        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, index) => (
                          <div key={index} className="text-center">
                            <div className={`h-8 rounded ${index < userProgress!.streak ? 'bg-green-500' : 'bg-gray-200'}`} />
                            <p className="text-xs text-amber-600 mt-1">{day}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Progress Timeline */}
            <Card className="border-amber-200 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-amber-900">
                  <Calendar className="h-5 w-5 text-amber-600" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-3 bg-green-50 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <div className="flex-1">
                      <p className="font-medium text-amber-900">Completed: Crisis Management</p>
                      <p className="text-sm text-amber-600">Score: 92% • 3 days ago</p>
                    </div>
                    <Badge className="bg-green-100 text-green-800">+150 pts</Badge>
                  </div>
                  <div className="flex items-center gap-4 p-3 bg-blue-50 rounded-lg">
                    <Play className="h-5 w-5 text-blue-600" />
                    <div className="flex-1">
                      <p className="font-medium text-amber-900">Started: Onboarding Foundation</p>
                      <p className="text-sm text-amber-600">65% complete • In progress</p>
                    </div>
                    <Badge className="bg-blue-100 text-blue-800">+25 pts</Badge>
                  </div>
                  <div className="flex items-center gap-4 p-3 bg-amber-50 rounded-lg">
                    <Trophy className="h-5 w-5 text-amber-600" />
                    <div className="flex-1">
                      <p className="font-medium text-amber-900">Achievement Unlocked: Crisis Expert</p>
                      <p className="text-sm text-amber-600">Epic rarity • 3 days ago</p>
                    </div>
                    <Badge className="bg-purple-100 text-purple-800">+50 pts</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Achievements Tab */}
          <TabsContent value="achievements" className="space-y-6">
            <Card className="border-amber-200 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-amber-900">
                  <Trophy className="h-5 w-5 text-amber-600" />
                  Your Achievements
                </CardTitle>
                <CardDescription>
                  Celebrate your learning milestones and accomplishments
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {userProgress?.achievements.map((achievement) => (
                    <Card key={achievement.id} className={`border-2 ${getRarityColor(achievement.rarity)}`}>
                      <CardHeader className="text-center">
                        <div className="text-4xl mb-2">{achievement.icon}</div>
                        <CardTitle className="text-lg">{achievement.name}</CardTitle>
                        <CardDescription>{achievement.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="text-center">
                        <div className="space-y-2">
                          <Badge className={getRarityColor(achievement.rarity)}>
                            {achievement.rarity}
                          </Badge>
                          <p className="text-sm text-amber-600">
                            Earned: {achievement.unlockedAt.toLocaleDateString()}
                          </p>
                          <p className="text-sm font-medium text-amber-900">
                            +{achievement.points} points
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Locked Achievements Preview */}
                <div className="mt-8">
                  <h3 className="text-lg font-semibold text-amber-900 mb-4">Locked Achievements</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <Card className="border-gray-200 opacity-60">
                      <CardHeader className="text-center">
                        <div className="text-4xl mb-2 grayscale">🚀</div>
                        <CardTitle className="text-lg">Speed Learner</CardTitle>
                        <CardDescription>Complete 5 modules in one week</CardTitle>
                      </CardHeader>
                      <CardContent className="text-center">
                        <Badge className="bg-gray-100 text-gray-600">2/5 modules</Badge>
                      </CardContent>
                    </Card>
                    <Card className="border-gray-200 opacity-60">
                      <CardHeader className="text-center">
                        <div className="text-4xl mb-2 grayscale">💎</div>
                        <CardTitle className="text-lg">Perfect Score</CardTitle>
                        <CardDescription>Score 100% on any assessment</CardDescription>
                      </CardHeader>
                      <CardContent className="text-center">
                        <Badge className="bg-gray-100 text-gray-600">Not achieved</Badge>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Certifications Tab */}
          <TabsContent value="certifications" className="space-y-6">
            <Card className="border-amber-200 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-amber-900">
                  <Award className="h-5 w-5 text-amber-600" />
                  Professional Certifications
                </CardTitle>
                <CardDescription>
                  Track your professional certifications and credentials
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {trainingModules
                    .filter(module => module.certification && module.status === 'completed')
                    .map((module) => (
                      <Card key={module.id} className="border-green-200 bg-green-50">
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <Badge className="bg-green-100 text-green-800">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Certified
                            </Badge>
                            {module.certification?.validFor && (
                              <Badge variant="outline" className="border-blue-300 text-blue-700">
                                Valid for {module.certification.validFor} months
                              </Badge>
                            )}
                          </div>
                          <CardTitle className="text-lg text-green-900">
                            {module.certification?.name}
                          </CardTitle>
                          <CardDescription>{module.certification?.description}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div className="flex items-center gap-2 text-sm text-green-700">
                              <Award className="h-4 w-4" />
                              <span>Issued by: {module.certification?.issuer}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-green-700">
                              <Calendar className="h-4 w-4" />
                              <span>Completed: {module.completedAt?.toLocaleDateString()}</span>
                            </div>
                            {module.score && (
                              <div className="flex items-center gap-2 text-sm text-green-700">
                                <Star className="h-4 w-4" />
                                <span>Score: {module.score}%</span>
                              </div>
                            )}
                            <div className="flex gap-2">
                              <Button size="sm" className="bg-green-600 hover:bg-green-700">
                                <Download className="h-4 w-4 mr-2" />
                                Download Certificate
                              </Button>
                              <Button size="sm" variant="outline">
                                <Share2 className="h-4 w-4 mr-2" />
                                Share
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>

                {/* In Progress Certifications */}
                <div className="mt-8">
                  <h3 className="text-lg font-semibold text-amber-900 mb-4">In Progress</h3>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {trainingModules
                      .filter(module => module.certification && module.status !== 'completed')
                      .map((module) => (
                        <Card key={module.id} className="border-amber-200">
                          <CardHeader>
                            <div className="flex items-center justify-between">
                              <Badge className="bg-blue-100 text-blue-800">
                                <Clock className="h-3 w-3 mr-1" />
                                In Progress
                              </Badge>
                              <Badge className={getLevelColor(module.level)}>
                                {module.level}
                              </Badge>
                            </div>
                            <CardTitle className="text-lg text-amber-900">
                              {module.certification?.name}
                            </CardTitle>
                            <CardDescription>{module.certification?.description}</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                  <span className="text-amber-600">Progress</span>
                                  <span className="font-medium text-amber-900">{module.progress}%</span>
                                </div>
                                <Progress value={module.progress} />
                              </div>
                              <Button
                                className="w-full bg-amber-600 hover:bg-amber-700"
                                onClick={() => handleModuleContinue(module)}
                              >
                                Continue Learning
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Module Dialog */}
      <Dialog open={showModuleDialog} onOpenChange={setShowModuleDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedModule && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <Badge className={getLevelColor(selectedModule.level)}>
                    {selectedModule.level}
                  </Badge>
                  <Badge className={getStatusColor(selectedModule.status)}>
                    {selectedModule.status.replace('-', ' ')}
                  </Badge>
                  <Badge className={getPriorityColor(selectedModule.priority)}>
                    {selectedModule.priority}
                  </Badge>
                </div>
                <DialogTitle className="text-2xl text-amber-900">
                  {selectedModule.title}
                </DialogTitle>
                <DialogDescription>{selectedModule.description}</DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-3">
                  {/* Module Content */}
                  <div className="space-y-6">
                    {/* Learning Objectives */}
                    <div>
                      <h3 className="text-lg font-semibold text-amber-900 mb-3">Learning Objectives</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {selectedModule.objectives.map((objective, index) => (
                          <div key={index} className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg">
                            <Target className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                            <span className="text-sm text-amber-900">{objective}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <Separator />

                    {/* Content Sections */}
                    <div>
                      <h3 className="text-lg font-semibold text-amber-900 mb-3">Module Content</h3>
                      <div className="space-y-4">
                        {selectedModule.content.map((content, index) => (
                          <Card key={content.id} className="border-amber-200">
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-3">
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                                    content.isCompleted ? 'bg-green-600' : 'bg-gray-400'
                                  }`}>
                                    {index + 1}
                                  </div>
                                  <div>
                                    <h4 className="font-medium text-amber-900">{content.title}</h4>
                                    <p className="text-sm text-amber-600">{content.description}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  {content.duration && (
                                    <span className="text-sm text-amber-500">
                                      <Clock className="h-3 w-3 inline mr-1" />
                                      {content.duration} min
                                    </span>
                                  )}
                                  {content.isCompleted ? (
                                    <CheckCircle className="h-5 w-5 text-green-600" />
                                  ) : (
                                    <Button
                                      size="sm"
                                      className="bg-amber-600 hover:bg-amber-700"
                                      onClick={() => handleContentComplete(content.id)}
                                    >
                                      Start
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>

                    {/* Assessment */}
                    {selectedModule.assessment && (
                      <>
                        <Separator />
                        <div>
                          <h3 className="text-lg font-semibold text-amber-900 mb-3">Module Assessment</h3>
                          {!showAssessmentResults ? (
                            <div className="space-y-4">
                              <Alert>
                                <Info className="h-4 w-4" />
                                <AlertDescription>
                                  <strong>Passing Score:</strong> {selectedModule.assessment.passingScore}%
                                  {selectedModule.assessment.timeLimit && ` • Time Limit: ${selectedModule.assessment.timeLimit} minutes`}
                                </AlertDescription>
                              </Alert>
                              <Button
                                size="lg"
                                className="bg-amber-600 hover:bg-amber-700"
                                onClick={handleAssessmentSubmit}
                              >
                                Start Assessment
                              </Button>
                            </div>
                          ) : (
                            <Card className="border-green-200 bg-green-50">
                              <CardContent className="p-6 text-center">
                                <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
                                <h3 className="text-xl font-semibold text-green-900 mb-2">Assessment Completed!</h3>
                                <p className="text-green-700 mb-4">You scored 92% - Congratulations!</p>
                                {selectedModule.certification && (
                                  <div className="p-4 bg-white rounded-lg border border-green-200 mb-4">
                                    <Award className="h-8 w-8 text-amber-600 mx-auto mb-2" />
                                    <p className="font-medium text-amber-900">
                                      {selectedModule.certification.name}
                                    </p>
                                    <p className="text-sm text-amber-600">
                                      Certification earned! Valid for {selectedModule.certification.validFor} months
                                    </p>
                                  </div>
                                )}
                                <div className="flex gap-2 justify-center">
                                  <Button className="bg-green-600 hover:bg-green-700">
                                    <Download className="h-4 w-4 mr-2" />
                                    Download Certificate
                                  </Button>
                                  <Button variant="outline">
                                    <Share2 className="h-4 w-4 mr-2" />
                                    Share Achievement
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                  {/* Module Info */}
                  <Card className="border-amber-200">
                    <CardHeader>
                      <CardTitle className="text-lg text-amber-900">Module Info</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-amber-600">Type</span>
                        <span className="text-sm font-medium text-amber-900 capitalize">{selectedModule.type}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-amber-600">Duration</span>
                        <span className="text-sm font-medium text-amber-900">{selectedModule.duration} min</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-amber-600">Skill Points</span>
                        <span className="text-sm font-medium text-amber-900">{selectedModule.skillPoints}</span>
                      </div>
                      {selectedModule.instructor && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-amber-600">Instructor</span>
                          <span className="text-sm font-medium text-amber-900">{selectedModule.instructor}</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Resources */}
                  {selectedModule.resources && selectedModule.resources.length > 0 && (
                    <Card className="border-amber-200">
                      <CardHeader>
                        <CardTitle className="text-lg text-amber-900">Resources</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {selectedModule.resources.map((resource) => (
                          <Button
                            key={resource.id}
                            variant="outline"
                            className="w-full justify-start"
                            size="sm"
                          >
                            <Download className="h-4 w-4 mr-2" />
                            {resource.title}
                          </Button>
                        ))}
                      </CardContent>
                    </Card>
                  )}

                  {/* Progress */}
                  <Card className="border-amber-200">
                    <CardHeader>
                      <CardTitle className="text-lg text-amber-900">Your Progress</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-amber-900 mb-2">{selectedModule.progress}%</div>
                        <Progress value={selectedModule.progress} className="mb-2" />
                        <p className="text-sm text-amber-600">Module Complete</p>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-amber-600">Time Spent</span>
                          <span className="font-medium text-amber-900">{selectedModule.timeSpent} min</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-amber-600">Attempts</span>
                          <span className="font-medium text-amber-900">{selectedModule.attempts}/{selectedModule.maxAttempts}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ModularTrainingSystem;