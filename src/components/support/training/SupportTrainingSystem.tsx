import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
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
  Printer
} from 'lucide-react';

interface TrainingModule {
  id: string;
  title: string;
  description: string;
  category: string;
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  duration: number; // in minutes
  type: 'video' | 'text' | 'interactive' | 'simulation' | 'assessment';
  content: any[];
  objectives: string[];
  prerequisites?: string[];
  assessment?: {
    questions: any[];
    passingScore: number;
    timeLimit?: number;
  };
  resources?: any[];
  progress?: number;
  completed?: boolean;
  score?: number;
  lastAccessed?: Date;
  bookmarked?: boolean;
}

interface TrainingScenario {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  type: 'roleplay' | 'simulation' | 'case_study' | 'crisis';
  estimatedTime: number;
  steps: any[];
  evaluationCriteria: any[];
  feedback?: any;
  completed?: boolean;
  score?: number;
  attempts?: number;
}

interface KnowledgeBaseArticle {
  id: string;
  title: string;
  category: string;
  content: string;
  tags: string[];
  lastUpdated: Date;
  author: string;
  helpfulCount: number;
  viewCount: number;
  searchableContent: string;
  relatedArticles?: string[];
  attachments?: any[];
}

interface TrainingProgress {
  userId: string;
  completedModules: string[];
  currentModule?: string;
  totalScore: number;
  timeSpent: number;
  skillLevel: string;
  achievements: any[];
  lastActivity: Date;
  streak: number;
  certificates: any[];
}

interface SOPDocument {
  id: string;
  title: string;
  description: string;
  category: string;
  version: string;
  lastUpdated: Date;
  approvedBy: string;
  content: any[];
  checklist?: any[];
  flowchart?: any;
  relatedDocuments?: string[];
  complianceRequirements?: string[];
  emergencyProcedures?: any;
}

const SupportTrainingSystem: React.FC = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedModule, setSelectedModule] = useState<TrainingModule | null>(null);
  const [trainingProgress, setTrainingProgress] = useState<TrainingProgress | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [assessmentAnswers, setAssessmentAnswers] = useState<any>({});
  const [showResults, setShowResults] = useState(false);
  const [bookmarkedModules, setBookmarkedModules] = useState<string[]>([]);

  // Mock training modules data
  const trainingModules: TrainingModule[] = [
    {
      id: 'onboarding-foundation',
      title: 'New Employee Onboarding - Foundation',
      description: 'Essential introduction to company culture, brand standards, and support philosophy',
      category: 'onboarding',
      level: 'beginner',
      duration: 60,
      type: 'interactive',
      objectives: [
        'Understand company values and luxury service philosophy',
        'Master brand voice and communication standards',
        'Learn support team structure and escalation procedures'
      ],
      content: [
        {
          type: 'video',
          title: 'Welcome to the Team',
          duration: '15 min',
          url: '/training/videos/welcome.mp4'
        },
        {
          type: 'text',
          title: 'Company Culture and Values',
          content: 'Detailed information about our luxury service approach...'
        },
        {
          type: 'interactive',
          title: 'Brand Voice Practice',
          exercise: 'Practice exercises for luxury communication'
        }
      ],
      assessment: {
        questions: [
          {
            id: 1,
            type: 'multiple-choice',
            question: 'What is our primary service philosophy?',
            options: [
              'Fast response times',
              'Luxury white-glove service',
              'Cost efficiency',
              'Automation first'
            ],
            correct: 1
          }
        ],
        passingScore: 80
      }
    },
    {
      id: 'beauty-services-knowledge',
      title: 'Beauty Services - Product Knowledge',
      description: 'Comprehensive training on all beauty services, treatments, and procedures',
      category: 'product-knowledge',
      level: 'intermediate',
      duration: 90,
      type: 'video',
      objectives: [
        'Master all beauty service offerings',
        'Understand treatment procedures and aftercare',
        'Learn pricing and package options'
      ],
      content: [
        {
          type: 'video',
          title: 'Lip Enhancement Services',
          duration: '25 min'
        },
        {
          type: 'video',
          title: 'Brow Services Overview',
          duration: '20 min'
        }
      ]
    },
    {
      id: 'crisis-management',
      title: 'Crisis Management and De-escalation',
      description: 'Advanced techniques for handling difficult situations and crisis scenarios',
      category: 'advanced-skills',
      level: 'advanced',
      duration: 120,
      type: 'simulation',
      objectives: [
        'Master de-escalation techniques',
        'Handle emergency situations professionally',
        'Maintain brand reputation under pressure'
      ],
      prerequisites: ['onboarding-foundation', 'customer-service-excellence']
    }
  ];

  const trainingScenarios: TrainingScenario[] = [
    {
      id: 'angry-client-roleplay',
      title: 'Handling an Upset VIP Client',
      description: 'Practice de-escalation techniques with a dissatisfied VIP customer',
      category: 'customer-service',
      difficulty: 'medium',
      type: 'roleplay',
      estimatedTime: 30,
      steps: [
        {
          id: 1,
          title: 'Initial Contact',
          description: 'Client calls about a cancelled appointment',
          clientMessage: 'I cannot believe you cancelled my appointment! This is unacceptable!',
          options: [
            'Apologize and offer immediate solutions',
            'Explain the cancellation policy',
            'Transfer to a manager',
            'Reschedule immediately'
          ],
          correctAnswer: 0,
          feedback: 'Always start with empathy and immediate solutions for VIP clients'
        }
      ],
      evaluationCriteria: [
        'Empathy and active listening',
        'Problem-solving skills',
        'Brand voice consistency',
        'Resolution effectiveness'
      ]
    }
  ];

  const knowledgeBaseArticles: KnowledgeBaseArticle[] = [
    {
      id: 'booking-procedures',
      title: 'Complete Booking Procedures Guide',
      category: 'procedures',
      content: 'Step-by-step guide for handling all booking scenarios...',
      tags: ['booking', 'procedures', 'step-by-step'],
      lastUpdated: new Date(),
      author: 'Training Department',
      helpfulCount: 45,
      viewCount: 324,
      searchableContent: 'booking appointment scheduling procedures guide'
    },
    {
      id: 'luxury-communication',
      title: 'Luxury Communication Standards',
      category: 'standards',
      content: 'Detailed guidelines for maintaining luxury service communication...',
      tags: ['communication', 'luxury', 'standards'],
      lastUpdated: new Date(),
      author: 'Quality Assurance',
      helpfulCount: 67,
      viewCount: 512
    }
  ];

  const sopDocuments: SOPDocument[] = [
    {
      id: 'ticket-management-sop',
      title: 'Support Ticket Management SOP',
      description: 'Standard procedures for creating, managing, and resolving support tickets',
      category: 'operations',
      version: '2.1',
      lastUpdated: new Date(),
      approvedBy: 'Head of Customer Experience',
      content: [
        {
          section: 'Ticket Creation',
          steps: [
            'Gather all necessary client information',
            'Categorize and prioritize appropriately',
            'Set expectations for response time'
          ]
        }
      ],
      checklist: [
        { id: 1, task: 'Verify client identity and VIP status', required: true },
        { id: 2, task: 'Check service history for context', required: true },
        { id: 3, task: 'Document all interactions thoroughly', required: true }
      ]
    }
  ];

  const categories = [
    { id: 'all', name: 'All Categories', icon: BookOpen },
    { id: 'onboarding', name: 'Onboarding', icon: Users },
    { id: 'product-knowledge', name: 'Product Knowledge', icon: Brain },
    { id: 'customer-service', name: 'Customer Service', icon: Heart },
    { id: 'technical-skills', name: 'Technical Skills', icon: Settings },
    { id: 'advanced-skills', name: 'Advanced Skills', icon: Award },
    { id: 'compliance', name: 'Compliance', icon: Shield }
  ];

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-blue-100 text-blue-800';
      case 'advanced': return 'bg-purple-100 text-purple-800';
      case 'expert': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return Video;
      case 'text': return FileText;
      case 'interactive': return Users;
      case 'simulation': return Brain;
      case 'assessment': return Target;
      default: return BookOpen;
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-orange-100 text-orange-800';
      case 'expert': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleModuleSelect = (module: TrainingModule) => {
    setSelectedModule(module);
    setActiveTab('module-viewer');
  };

  const handleBookmark = (moduleId: string) => {
    setBookmarkedModules(prev =>
      prev.includes(moduleId)
        ? prev.filter(id => id !== moduleId)
        : [...prev, moduleId]
    );
  };

  const handleAssessmentSubmit = () => {
    // Calculate score and show results
    setShowResults(true);
  };

  const filteredModules = trainingModules.filter(module => {
    const matchesSearch = module.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         module.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || module.category === selectedCategory;
    const matchesLevel = selectedLevel === 'all' || module.level === selectedLevel;
    return matchesSearch && matchesCategory && matchesLevel;
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
                <h1 className="text-3xl font-bold text-amber-900">Support Training Academy</h1>
                <p className="text-amber-600">Comprehensive Training for Excellence in Luxury Support</p>
              </div>
            </div>

            {trainingProgress && (
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="text-sm text-amber-600">Current Level</p>
                  <p className="text-lg font-bold text-amber-900">{trainingProgress.skillLevel}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-amber-600">Completed</p>
                  <p className="text-lg font-bold text-amber-900">{trainingProgress.completedModules.length} modules</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-amber-600">Success Rate</p>
                  <p className="text-lg font-bold text-amber-900">{trainingProgress.totalScore}%</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-8 bg-gradient-to-r from-amber-100 to-orange-100 border border-amber-200">
            <TabsTrigger value="dashboard" className="data-[state=active]:bg-white data-[state=active]:shadow-md">
              <BarChart3 className="h-4 w-4 mr-2" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="modules" className="data-[state=active]:bg-white data-[state=active]:shadow-md">
              <BookOpen className="h-4 w-4 mr-2" />
              Modules
            </TabsTrigger>
            <TabsTrigger value="scenarios" className="data-[state=active]:bg-white data-[state=active]:shadow-md">
              <Users className="h-4 w-4 mr-2" />
              Scenarios
            </TabsTrigger>
            <TabsTrigger value="knowledge-base" className="data-[state=active]:bg-white data-[state=active]:shadow-md">
              <Lightbulb className="h-4 w-4 mr-2" />
              Knowledge
            </TabsTrigger>
            <TabsTrigger value="sop" className="data-[state=active]:bg-white data-[state=active]:shadow-md">
              <FileText className="h-4 w-4 mr-2" />
              SOPs
            </TabsTrigger>
            <TabsTrigger value="assessment" className="data-[state=active]:bg-white data-[state=active]:shadow-md">
              <Target className="h-4 w-4 mr-2" />
              Assessment
            </TabsTrigger>
            <TabsTrigger value="progress" className="data-[state=active]:bg-white data-[state=active]:shadow-md">
              <TrendingUp className="h-4 w-4 mr-2" />
              Progress
            </TabsTrigger>
            <TabsTrigger value="resources" className="data-[state=active]:bg-white data-[state=active]:shadow-md">
              <Download className="h-4 w-4 mr-2" />
              Resources
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <Card className="border-amber-200 shadow-lg">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-amber-600">Modules Completed</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-amber-900">12</div>
                  <p className="text-xs text-amber-600">+3 this week</p>
                </CardContent>
              </Card>

              <Card className="border-amber-200 shadow-lg">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-amber-600">Success Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-amber-900">94%</div>
                  <p className="text-xs text-amber-600">Above target</p>
                </CardContent>
              </Card>

              <Card className="border-amber-200 shadow-lg">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-amber-600">Learning Streak</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-amber-900">7 days</div>
                  <p className="text-xs text-amber-600">Keep it up!</p>
                </CardContent>
              </Card>

              <Card className="border-amber-200 shadow-lg">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-amber-600">Next Milestone</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-amber-900">Advanced</div>
                  <p className="text-xs text-amber-600">2 modules to go</p>
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
                  {trainingModules.slice(0, 3).map((module) => (
                    <div key={module.id} className="border border-amber-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-3">
                        <Badge className={getLevelColor(module.level)}>
                          {module.level}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleBookmark(module.id)}
                        >
                          <Bookmark className={`h-4 w-4 ${bookmarkedModules.includes(module.id) ? 'fill-amber-600 text-amber-600' : 'text-gray-400'}`} />
                        </Button>
                      </div>
                      <h3 className="font-semibold text-amber-900 mb-2">{module.title}</h3>
                      <p className="text-sm text-amber-600 mb-3">{module.description}</p>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-amber-500" />
                          <span className="text-xs text-amber-600">{module.duration} min</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {React.createElement(getTypeIcon(module.type), { className: "h-4 w-4 text-amber-500" })}
                          <span className="text-xs text-amber-600">{module.type}</span>
                        </div>
                      </div>
                      <Progress value={module.progress || 0} className="mb-3" />
                      <Button
                        className="w-full bg-amber-600 hover:bg-amber-700"
                        onClick={() => handleModuleSelect(module)}
                      >
                        {module.progress ? 'Continue' : 'Start'}
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Upcoming Training */}
            <Card className="border-amber-200 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-amber-900">
                  <Calendar className="h-5 w-5 text-amber-600" />
                  Upcoming Training Sessions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Video className="h-5 w-5 text-amber-600" />
                      <div>
                        <p className="font-medium text-amber-900">Live Workshop: Advanced De-escalation</p>
                        <p className="text-sm text-amber-600">Tomorrow, 2:00 PM - 3:30 PM</p>
                      </div>
                    </div>
                    <Button size="sm">Join</Button>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Users className="h-5 w-5 text-amber-600" />
                      <div>
                        <p className="font-medium text-amber-900">Role-Playing Practice Session</p>
                        <p className="text-sm text-amber-600">Friday, 10:00 AM - 11:00 AM</p>
                      </div>
                    </div>
                    <Button size="sm" variant="outline">Register</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Modules Tab */}
          <TabsContent value="modules" className="space-y-6">
            {/* Filters */}
            <Card className="border-amber-200 shadow-lg">
              <CardHeader>
                <CardTitle>Training Modules</CardTitle>
                <CardDescription>Browse our comprehensive training curriculum</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row gap-4 mb-6">
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
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-full md:w-48 border-amber-200">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                    <SelectTrigger className="w-full md:w-48 border-amber-200">
                      <SelectValue placeholder="Level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Levels</SelectItem>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                      <SelectItem value="expert">Expert</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredModules.map((module) => (
                    <Card key={module.id} className="border-amber-200 shadow-lg hover:shadow-xl transition-shadow">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <Badge className={getLevelColor(module.level)}>
                            {module.level}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleBookmark(module.id)}
                          >
                            <Bookmark className={`h-4 w-4 ${bookmarkedModules.includes(module.id) ? 'fill-amber-600 text-amber-600' : 'text-gray-400'}`} />
                          </Button>
                        </div>
                        <CardTitle className="text-lg text-amber-900">{module.title}</CardTitle>
                        <CardDescription>{module.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              {React.createElement(getTypeIcon(module.type), { className: "h-4 w-4 text-amber-500" })}
                              <span className="text-amber-600">{module.type}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-amber-500" />
                              <span className="text-amber-600">{module.duration} min</span>
                            </div>
                          </div>

                          {module.prerequisites && module.prerequisites.length > 0 && (
                            <Alert>
                              <AlertCircle className="h-4 w-4" />
                              <AlertDescription>
                                Requires: {module.prerequisites.join(', ')}
                              </AlertDescription>
                            </Alert>
                          )}

                          <div className="space-y-2">
                            <p className="text-sm font-medium text-amber-900">Learning Objectives:</p>
                            <ul className="text-sm text-amber-600 space-y-1">
                              {module.objectives.slice(0, 2).map((objective, index) => (
                                <li key={index} className="flex items-center gap-2">
                                  <CheckCircle className="h-3 w-3 text-green-500" />
                                  {objective}
                                </li>
                              ))}
                            </ul>
                          </div>

                          {module.progress !== undefined && (
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span className="text-amber-600">Progress</span>
                                <span className="text-amber-900 font-medium">{module.progress}%</span>
                              </div>
                              <Progress value={module.progress} />
                            </div>
                          )}

                          <Button
                            className="w-full bg-amber-600 hover:bg-amber-700"
                            onClick={() => handleModuleSelect(module)}
                          >
                            {module.progress ? 'Continue Learning' : 'Start Module'}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Module Viewer Tab */}
          <TabsContent value="module-viewer" className="space-y-6">
            {selectedModule && (
              <>
                {/* Module Header */}
                <Card className="border-amber-200 shadow-lg">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setActiveTab('modules')}
                          >
                            <ChevronLeft className="h-4 w-4 mr-1" />
                            Back to Modules
                          </Button>
                          <Badge className={getLevelColor(selectedModule.level)}>
                            {selectedModule.level}
                          </Badge>
                          <div className="flex items-center gap-2">
                            {React.createElement(getTypeIcon(selectedModule.type), { className: "h-4 w-4 text-amber-500" })}
                            <span className="text-sm text-amber-600">{selectedModule.type}</span>
                          </div>
                        </div>
                        <CardTitle className="text-2xl text-amber-900">{selectedModule.title}</CardTitle>
                        <CardDescription>{selectedModule.description}</CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleBookmark(selectedModule.id)}
                        >
                          <Bookmark className={`h-4 w-4 mr-2 ${bookmarkedModules.includes(selectedModule.id) ? 'fill-amber-600 text-amber-600' : 'text-gray-400'}`} />
                          {bookmarkedModules.includes(selectedModule.id) ? 'Bookmarked' : 'Bookmark'}
                        </Button>
                        <Button variant="outline" size="sm">
                          <Share2 className="h-4 w-4 mr-2" />
                          Share
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
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
                          {selectedModule.content.map((content, index) => (
                            <div key={index} className="space-y-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-amber-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                                  {index + 1}
                                </div>
                                <h3 className="text-lg font-semibold text-amber-900">{content.title}</h3>
                              </div>

                              {content.type === 'video' && (
                                <div className="bg-black rounded-lg aspect-video flex items-center justify-center">
                                  <div className="text-center text-white">
                                    <Play className="h-16 w-16 mx-auto mb-4" />
                                    <p>Video Player Placeholder</p>
                                    <p className="text-sm opacity-75">{content.duration}</p>
                                  </div>
                                </div>
                              )}

                              {content.type === 'text' && (
                                <div className="prose max-w-none text-amber-800">
                                  <p>{content.content}</p>
                                </div>
                              )}

                              {content.type === 'interactive' && (
                                <Card className="border-amber-200">
                                  <CardContent className="p-6">
                                    <h4 className="font-medium text-amber-900 mb-3">Interactive Exercise</h4>
                                    <p className="text-amber-600 mb-4">{content.exercise}</p>
                                    <Button className="bg-amber-600 hover:bg-amber-700">
                                      Start Exercise
                                    </Button>
                                  </CardContent>
                                </Card>
                              )}
                            </div>
                          ))}

                          {/* Assessment Section */}
                          {selectedModule.assessment && (
                            <>
                              <Separator />
                              <div className="space-y-6">
                                <div className="flex items-center gap-3">
                                  <Target className="h-6 w-6 text-amber-600" />
                                  <h3 className="text-lg font-semibold text-amber-900">Module Assessment</h3>
                                </div>

                                {!showResults ? (
                                  <div className="space-y-6">
                                    {selectedModule.assessment.questions.map((question, qIndex) => (
                                      <Card key={question.id} className="border-amber-200">
                                        <CardContent className="p-6">
                                          <h4 className="font-medium text-amber-900 mb-4">
                                            {qIndex + 1}. {question.question}
                                          </h4>
                                          <RadioGroup
                                            value={assessmentAnswers[question.id]}
                                            onValueChange={(value) => setAssessmentAnswers(prev => ({
                                              ...prev,
                                              [question.id]: value
                                            }))}
                                          >
                                            {question.options.map((option: string, oIndex: number) => (
                                              <div key={oIndex} className="flex items-center space-x-2">
                                                <RadioGroupItem value={oIndex.toString()} id={`${question.id}-${oIndex}`} />
                                                <Label htmlFor={`${question.id}-${oIndex}`}>{option}</Label>
                                              </div>
                                            ))}
                                          </RadioGroup>
                                        </CardContent>
                                      </Card>
                                    ))}

                                    <div className="flex justify-center">
                                      <Button
                                        size="lg"
                                        className="bg-amber-600 hover:bg-amber-700"
                                        onClick={handleAssessmentSubmit}
                                      >
                                        Submit Assessment
                                      </Button>
                                    </div>
                                  </div>
                                ) : (
                                  <Card className="border-green-200 bg-green-50">
                                    <CardContent className="p-6 text-center">
                                      <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
                                      <h3 className="text-xl font-semibold text-green-900 mb-2">Assessment Completed!</h3>
                                      <p className="text-green-700 mb-4">You scored 85% - Congratulations!</p>
                                      <Button className="bg-green-600 hover:bg-green-700">
                                        View Certificate
                                      </Button>
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
                              <span className="text-sm text-amber-600">Duration</span>
                              <span className="text-sm font-medium text-amber-900">{selectedModule.duration} min</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-amber-600">Level</span>
                              <Badge className={getLevelColor(selectedModule.level)}>
                                {selectedModule.level}
                              </Badge>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-amber-600">Type</span>
                              <span className="text-sm font-medium text-amber-900">{selectedModule.type}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-amber-600">Passing Score</span>
                              <span className="text-sm font-medium text-amber-900">{selectedModule.assessment?.passingScore}%</span>
                            </div>
                          </CardContent>
                        </Card>

                        {/* Progress */}
                        <Card className="border-amber-200">
                          <CardHeader>
                            <CardTitle className="text-lg text-amber-900">Your Progress</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="text-center">
                              <div className="text-3xl font-bold text-amber-900 mb-2">65%</div>
                                      <Progress value={65} className="mb-2" />
                                      <p className="text-sm text-amber-600">Module Complete</p>
                                    </div>
                                  </CardContent>
                                </Card>

                                {/* Resources */}
                                <Card className="border-amber-200">
                                  <CardHeader>
                                    <CardTitle className="text-lg text-amber-900">Resources</CardTitle>
                                  </CardHeader>
                                  <CardContent className="space-y-3">
                                    <Button variant="outline" className="w-full justify-start">
                                      <Download className="h-4 w-4 mr-2" />
                                      Module Workbook
                                    </Button>
                                    <Button variant="outline" className="w-full justify-start">
                                      <FileText className="h-4 w-4 mr-2" />
                                      Quick Reference Guide
                                    </Button>
                                    <Button variant="outline" className="w-full justify-start">
                                      <Video className="h-4 w-4 mr-2" />
                                      Additional Videos
                                    </Button>
                                  </CardContent>
                                </Card>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </>
                    )}
                  </TabsContent>

                  {/* Scenarios Tab */}
                  <TabsContent value="scenarios" className="space-y-6">
                    <Card className="border-amber-200 shadow-lg">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-amber-900">
                          <Users className="h-5 w-5 text-amber-600" />
                          Training Scenarios & Simulations
                        </CardTitle>
                        <CardDescription>
                          Practice real-world situations in a safe environment
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {trainingScenarios.map((scenario) => (
                            <Card key={scenario.id} className="border-amber-200 shadow-lg hover:shadow-xl transition-shadow">
                              <CardHeader>
                                <div className="flex items-center justify-between">
                                  <Badge className={getDifficultyColor(scenario.difficulty)}>
                                    {scenario.difficulty}
                                  </Badge>
                                  <div className="flex items-center gap-2">
                                    {scenario.type === 'roleplay' && <Users className="h-4 w-4 text-amber-500" />}
                                    {scenario.type === 'simulation' && <Brain className="h-4 w-4 text-amber-500" />}
                                    {scenario.type === 'case_study' && <FileText className="h-4 w-4 text-amber-500" />}
                                    {scenario.type === 'crisis' && <AlertCircle className="h-4 w-4 text-amber-500" />}
                                  </div>
                                </div>
                                <CardTitle className="text-lg text-amber-900">{scenario.title}</CardTitle>
                                <CardDescription>{scenario.description}</CardDescription>
                              </CardHeader>
                              <CardContent>
                                <div className="space-y-4">
                                  <div className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-2">
                                      <Clock className="h-4 w-4 text-amber-500" />
                                      <span className="text-amber-600">{scenario.estimatedTime} min</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Target className="h-4 w-4 text-amber-500" />
                                      <span className="text-amber-600">{scenario.steps.length} steps</span>
                                    </div>
                                  </div>

                                  {scenario.completed && (
                                    <div className="flex items-center gap-2 text-green-600">
                                      <CheckCircle className="h-4 w-4" />
                                      <span className="text-sm">Completed - Score: {scenario.score}%</span>
                                    </div>
                                  )}

                                  <Button
                                    className="w-full bg-amber-600 hover:bg-amber-700"
                                    onClick={() => setActiveTab('scenario-viewer')}
                                  >
                                    {scenario.completed ? 'Practice Again' : 'Start Scenario'}
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Knowledge Base Tab */}
                  <TabsContent value="knowledge-base" className="space-y-6">
                    <Card className="border-amber-200 shadow-lg">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-amber-900">
                          <Lightbulb className="h-5 w-5 text-amber-600" />
                          Staff Knowledge Base
                        </CardTitle>
                        <CardDescription>
                          Quick access to essential information and procedures
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="mb-6">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-amber-500" />
                            <Input
                              placeholder="Search knowledge base..."
                              className="pl-10 border-amber-200"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {knowledgeBaseArticles.map((article) => (
                            <Card key={article.id} className="border-amber-200 shadow-lg hover:shadow-xl transition-shadow">
                              <CardHeader>
                                <div className="flex items-center justify-between">
                                  <Badge variant="outline" className="border-amber-300 text-amber-700">
                                    {article.category}
                                  </Badge>
                                  <div className="flex items-center gap-1 text-xs text-amber-500">
                                    <Eye className="h-3 w-3" />
                                    {article.viewCount}
                                  </div>
                                </div>
                                <CardTitle className="text-lg text-amber-900">{article.title}</CardTitle>
                              </CardHeader>
                              <CardContent>
                                <div className="space-y-4">
                                  <p className="text-sm text-amber-600 line-clamp-3">
                                    {article.content.substring(0, 150)}...
                                  </p>

                                  <div className="flex flex-wrap gap-1">
                                    {article.tags.slice(0, 3).map((tag, index) => (
                                      <Badge key={index} variant="secondary" className="text-xs">
                                        {tag}
                                      </Badge>
                                    ))}
                                  </div>

                                  <div className="flex items-center justify-between text-xs text-amber-500">
                                    <span>By {article.author}</span>
                                    <span>{article.helpfulCount} found helpful</span>
                                  </div>

                                  <Button
                                    variant="outline"
                                    className="w-full border-amber-300 text-amber-700 hover:bg-amber-50"
                                  >
                                    Read Article
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* SOP Tab */}
                  <TabsContent value="sop" className="space-y-6">
                    <Card className="border-amber-200 shadow-lg">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-amber-900">
                          <FileText className="h-5 w-5 text-amber-600" />
                          Standard Operating Procedures
                        </CardTitle>
                        <CardDescription>
                          Official procedures and guidelines for support operations
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          {sopDocuments.map((sop) => (
                            <Card key={sop.id} className="border-amber-200 shadow-lg">
                              <CardHeader>
                                <div className="flex items-center justify-between">
                                  <Badge variant="outline" className="border-amber-300 text-amber-700">
                                    Version {sop.version}
                                  </Badge>
                                  <div className="flex items-center gap-2">
                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                    <span className="text-xs text-green-600">Approved</span>
                                  </div>
                                </div>
                                <CardTitle className="text-lg text-amber-900">{sop.title}</CardTitle>
                                <CardDescription>{sop.description}</CardDescription>
                              </CardHeader>
                              <CardContent>
                                <div className="space-y-4">
                                  <div className="text-sm text-amber-600">
                                    <p>Approved by: {sop.approvedBy}</p>
                                    <p>Last updated: {sop.lastUpdated.toLocaleDateString()}</p>
                                  </div>

                                  {sop.checklist && (
                                    <div>
                                      <h4 className="font-medium text-amber-900 mb-2">Quick Checklist</h4>
                                      <div className="space-y-1">
                                        {sop.checklist.slice(0, 3).map((item) => (
                                          <div key={item.id} className="flex items-center gap-2 text-sm">
                                            <Checkbox checked={item.required} disabled />
                                            <span className={item.required ? "font-medium text-amber-900" : "text-amber-600"}>
                                              {item.task}
                                            </span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  <div className="flex gap-2">
                                    <Button className="flex-1 bg-amber-600 hover:bg-amber-700">
                                      <FileText className="h-4 w-4 mr-2" />
                                      View SOP
                                    </Button>
                                    <Button variant="outline" size="sm">
                                      <Download className="h-4 w-4" />
                                    </Button>
                                    <Button variant="outline" size="sm">
                                      <Printer className="h-4 w-4" />
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

                  {/* Assessment Tab */}
                  <TabsContent value="assessment" className="space-y-6">
                    <Card className="border-amber-200 shadow-lg">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-amber-900">
                          <Target className="h-5 w-5 text-amber-600" />
                          Skills Assessment & Certification
                        </CardTitle>
                        <CardDescription>
                          Evaluate your skills and earn certifications
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          {/* Skills Assessment */}
                          <Card className="border-amber-200">
                            <CardHeader>
                              <CardTitle className="text-lg text-amber-900">Skills Assessment</CardTitle>
                              <CardDescription>Test your knowledge across different areas</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              <div className="space-y-3">
                                <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
                                  <div>
                                    <p className="font-medium text-amber-900">Customer Service Excellence</p>
                                    <p className="text-sm text-amber-600">25 questions • 30 min</p>
                                  </div>
                                  <Button size="sm">Start</Button>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
                                  <div>
                                    <p className="font-medium text-amber-900">Technical Knowledge</p>
                                    <p className="text-sm text-amber-600">30 questions • 45 min</p>
                                  </div>
                                  <Button size="sm">Start</Button>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
                                  <div>
                                    <p className="font-medium text-amber-900">Crisis Management</p>
                                    <p className="text-sm text-amber-600">20 questions • 35 min</p>
                                  </div>
                                  <Button size="sm">Start</Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>

                          {/* Certifications */}
                          <Card className="border-amber-200">
                            <CardHeader>
                              <CardTitle className="text-lg text-amber-900">Your Certifications</CardTitle>
                              <CardDescription>Track your earned certifications</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              <div className="space-y-3">
                                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                                  <Award className="h-8 w-8 text-green-600" />
                                  <div className="flex-1">
                                    <p className="font-medium text-green-900">Customer Service Excellence</p>
                                    <p className="text-sm text-green-600">Earned: Oct 15, 2024 • Expires: Oct 15, 2025</p>
                                  </div>
                                  <Button size="sm" variant="outline">View</Button>
                                </div>
                                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                  <Award className="h-8 w-8 text-blue-600" />
                                  <div className="flex-1">
                                    <p className="font-medium text-blue-900">Product Knowledge Specialist</p>
                                    <p className="text-sm text-blue-600">Earned: Sep 20, 2024 • Expires: Sep 20, 2025</p>
                                  </div>
                                  <Button size="sm" variant="outline">View</Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Progress Tab */}
                  <TabsContent value="progress" className="space-y-6">
                    <Card className="border-amber-200 shadow-lg">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-amber-900">
                          <TrendingUp className="h-5 w-5 text-amber-600" />
                          Your Learning Progress
                        </CardTitle>
                        <CardDescription>
                          Track your training journey and achievements
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                          <Card className="border-amber-200">
                            <CardContent className="p-6 text-center">
                              <GraduationCap className="h-12 w-12 text-amber-600 mx-auto mb-4" />
                              <div className="text-2xl font-bold text-amber-900 mb-1">Level 3</div>
                                      <p className="text-sm text-amber-600">Intermediate Support Specialist</p>
                                      <Progress value={65} className="mt-4" />
                                      <p className="text-xs text-amber-500 mt-2">35% to next level</p>
                                    </CardContent>
                                  </Card>

                                  <Card className="border-amber-200">
                                    <CardContent className="p-6 text-center">
                                      <Target className="h-12 w-12 text-amber-600 mx-auto mb-4" />
                                      <div className="text-2xl font-bold text-amber-900 mb-1">89%</div>
                                      <p className="text-sm text-amber-600">Average Score</p>
                                      <div className="flex items-center justify-center gap-1 mt-2">
                                        <TrendingUp className="h-4 w-4 text-green-500" />
                                        <span className="text-xs text-green-600">+5% this month</span>
                                      </div>
                                    </CardContent>
                                  </Card>

                                  <Card className="border-amber-200">
                                    <CardContent className="p-6 text-center">
                                      <Calendar className="h-12 w-12 text-amber-600 mx-auto mb-4" />
                                      <div className="text-2xl font-bold text-amber-900 mb-1">14</div>
                                      <p className="text-sm text-amber-600">Day Streak</p>
                                      <div className="flex items-center justify-center gap-1 mt-2">
                                        <Zap className="h-4 w-4 text-yellow-500" />
                                        <span className="text-xs text-yellow-600">Personal best!</span>
                                      </div>
                                    </CardContent>
                                  </Card>
                                </div>

                                {/* Recent Activity */}
                                <Card className="border-amber-200">
                                  <CardHeader>
                                    <CardTitle className="text-lg text-amber-900">Recent Activity</CardTitle>
                                  </CardHeader>
                                  <CardContent>
                                    <div className="space-y-4">
                                      <div className="flex items-center gap-4 p-3 bg-amber-50 rounded-lg">
                                        <CheckCircle className="h-5 w-5 text-green-600" />
                                        <div className="flex-1">
                                          <p className="font-medium text-amber-900">Completed: Crisis Management Module</p>
                                          <p className="text-sm text-amber-600">Score: 92% • 2 hours ago</p>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-4 p-3 bg-amber-50 rounded-lg">
                                        <Award className="h-5 w-5 text-blue-600" />
                                        <div className="flex-1">
                                          <p className="font-medium text-amber-900">Earned Certification: Advanced Communication</p>
                                          <p className="text-sm text-amber-600">Yesterday at 3:45 PM</p>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-4 p-3 bg-amber-50 rounded-lg">
                                        <Users className="h-5 w-5 text-purple-600" />
                                        <div className="flex-1">
                                          <p className="font-medium text-amber-900">Completed Role-Play Scenario</p>
                                          <p className="text-sm text-amber-600">Handling VIP Clients • Score: 88%</p>
                                        </div>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              </CardContent>
                            </Card>
                          </TabsContent>

                          {/* Resources Tab */}
                          <TabsContent value="resources" className="space-y-6">
                            <Card className="border-amber-200 shadow-lg">
                              <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-amber-900">
                                  <Download className="h-5 w-5 text-amber-600" />
                                  Training Resources & Materials
                                </CardTitle>
                                <CardDescription>
                                  Download guides, templates, and reference materials
                                </CardDescription>
                              </CardHeader>
                              <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                  <Card className="border-amber-200 shadow-lg">
                                    <CardHeader>
                                      <CardTitle className="text-lg text-amber-900">Quick Reference Guides</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                      <Button variant="outline" className="w-full justify-start">
                                        <FileText className="h-4 w-4 mr-2" />
                                        Booking Procedures Guide
                                      </Button>
                                      <Button variant="outline" className="w-full justify-start">
                                        <FileText className="h-4 w-4 mr-2" />
                                        Communication Templates
                                      </Button>
                                      <Button variant="outline" className="w-full justify-start">
                                        <FileText className="h-4 w-4 mr-2" />
                                        Escalation Matrix
                                      </Button>
                                    </CardContent>
                                  </Card>

                                  <Card className="border-amber-200 shadow-lg">
                                    <CardHeader>
                                      <CardTitle className="text-lg text-amber-900">Templates & Forms</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                      <Button variant="outline" className="w-full justify-start">
                                        <FileText className="h-4 w-4 mr-2" />
                                        Call Script Templates
                                      </Button>
                                      <Button variant="outline" className="w-full justify-start">
                                        <FileText className="h-4 w-4 mr-2" />
                                        Email Templates
                                      </Button>
                                      <Button variant="outline" className="w-full justify-start">
                                        <FileText className="h-4 w-4 mr-2" />
                                        Feedback Forms
                                      </Button>
                                    </CardContent>
                                  </Card>

                                  <Card className="border-amber-200 shadow-lg">
                                    <CardHeader>
                                      <CardTitle className="text-lg text-amber-900">Video Library</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                      <Button variant="outline" className="w-full justify-start">
                                        <Video className="h-4 w-4 mr-2" />
                                        Best Practice Examples
                                      </Button>
                                      <Button variant="outline" className="w-full justify-start">
                                        <Video className="h-4 w-4 mr-2" />
                                        System Tutorials
                                      </Button>
                                      <Button variant="outline" className="w-full justify-start">
                                        <Video className="h-4 w-4 mr-2" />
                                        Role-Play Examples
                                      </Button>
                                    </CardContent>
                                  </Card>
                                </div>
                              </CardContent>
                            </Card>
                          </TabsContent>
                        </Tabs>
                      </div>
                    );
                  };

                  export default SupportTrainingSystem;