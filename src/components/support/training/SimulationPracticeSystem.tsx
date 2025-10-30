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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useTranslation } from 'react-i18next';
import {
  Users,
  MessageSquare,
  Phone,
  Mail,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Timer,
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  Volume2,
  VolumeX,
  Settings,
  Eye,
  EyeOff,
  Edit,
  Save,
  RefreshCw,
  Award,
  Trophy,
  Target,
  Star,
  Brain,
  Lightbulb,
  BookOpen,
  Video,
  FileText,
  HeadphonesIcon,
  Globe,
  Languages,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Flag,
  ThumbsUp,
  ThumbsDown,
  MessageCircle,
  Zap,
  Shield,
  Sword,
  Heart,
  Activity,
  TrendingUp,
  BarChart3,
  Mic,
  MicOff,
  Camera,
  CameraOff,
  Monitor,
  MonitorOff,
  Download,
  Upload,
  Share2,
  Bookmark,
  Search,
  Filter,
  Grid,
  List,
  Users2,
  UserCheck,
  UserX,
  AlertCircle,
  Info,
  HelpCircle,
  GraduationCap,
  School,
  Clipboard,
  CheckSquare,
  Square,
  PlayCircle,
  PauseCircle,
  StopCircle
} from 'lucide-react';

interface SimulationScenario {
  id: string;
  title: string;
  description: string;
  category: 'customer-service' | 'technical' | 'crisis' | 'sales' | 'compliance' | 'vip-service';
  type: 'roleplay' | 'case-study' | 'interactive' | 'assessment' | 'gamified';
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  duration: number; // in minutes
  estimatedTime: number; // estimated completion time
  objectives: string[];
  skills: string[];
  scenario: ScenarioContent;
  evaluation: EvaluationCriteria;
  prerequisites?: string[];
  resources: SimulationResource[];
  tags: string[];
  language: string[];
  points: number;
  attempts: number;
  maxAttempts: number;
  bestScore?: number;
  completed?: boolean;
  lastAttempt?: Date;
  averageRating: number;
  totalRatings: number;
  creator: string;
  createdAt: Date;
  lastUpdated: Date;
  featured: boolean;
  interactive: boolean;
}

interface ScenarioContent {
  setup: ScenarioSetup;
  steps: ScenarioStep[];
  branching: BranchingLogic[];
  media: MediaContent[];
  dialogues: Dialogue[];
  environment: EnvironmentSettings;
}

interface ScenarioSetup {
  context: string;
  role: string;
  clientProfile: ClientProfile;
  environment: string;
  tools: string[];
  timeConstraints?: TimeConstraint;
}

interface ClientProfile {
  name: string;
  type: 'vip' | 'regular' | 'new' | 'returning' | 'difficult';
  personality: string[];
  mood: string;
  history: string;
  preferences: string[];
  triggers: string[];
  language: string;
}

interface ScenarioStep {
  id: string;
  type: 'dialogue' | 'action' | 'decision' | 'evaluation' | 'feedback';
  title: string;
  description: string;
  content: any;
  options?: StepOption[];
  correctAnswer?: string;
  explanation?: string;
  points: number;
  timeLimit?: number;
  required: boolean;
  skipAllowed: boolean;
}

interface StepOption {
  id: string;
  text: string;
  correct: boolean;
  feedback: string;
  points: number;
  consequences?: string[];
  nextStep?: string;
}

interface BranchingLogic {
  condition: string;
  truePath: string;
  falsePath: string;
  description: string;
}

interface MediaContent {
  type: 'video' | 'audio' | 'image' | 'document';
  url: string;
  description: string;
  duration?: number;
  autoplay: boolean;
  required: boolean;
}

interface Dialogue {
  id: string;
  speaker: 'agent' | 'client' | 'system';
  text: string;
  emotion: string;
  timing?: number;
  audioUrl?: string;
  videoUrl?: string;
}

interface EnvironmentSettings {
  background: string;
  sounds: string[];
  tools: string[];
  constraints: EnvironmentConstraint[];
}

interface EnvironmentConstraint {
  type: 'time' | 'resources' | 'rules';
  description: string;
  value: any;
}

interface TimeConstraint {
  type: 'overall' | 'per-step' | 'response';
  duration: number;
  penalty: number;
  strict: boolean;
}

interface EvaluationCriteria {
  categories: EvaluationCategory[];
  scoring: ScoringMethod;
  feedback: FeedbackMethod;
  certification?: CertificationInfo;
}

interface EvaluationCategory {
  name: string;
  description: string;
  weight: number;
  levels: SkillLevel[];
}

interface SkillLevel {
  level: number;
  name: string;
  description: string;
  score: number;
  indicators: string[];
}

interface ScoringMethod {
  type: 'points' | 'percentage' | 'rubric' | 'adaptive';
  details: any;
}

interface FeedbackMethod {
  type: 'immediate' | 'delayed' | 'detailed' | 'peer-review';
  details: any;
}

interface CertificationInfo {
  name: string;
  description: string;
  requirements: string[];
  validPeriod: number; // in months
  badgeUrl?: string;
}

interface SimulationResource {
  id: string;
  name: string;
  type: 'guide' | 'template' | 'checklist' | 'reference' | 'video';
  description: string;
  url: string;
  downloadable: boolean;
  required: boolean;
}

interface SimulationSession {
  id: string;
  scenarioId: string;
  userId: string;
  startTime: Date;
  endTime?: Date;
  status: 'not-started' | 'in-progress' | 'completed' | 'paused' | 'abandoned';
  currentStep: number;
  progress: number;
  score: number;
  answers: SessionAnswer[];
  timeSpent: number;
  attempts: number;
  feedback: SessionFeedback;
  achievements: Achievement[];
}

interface SessionAnswer {
  stepId: string;
  selectedOption: string;
  timeTaken: number;
  points: number;
  correct: boolean;
  feedback: string;
}

interface SessionFeedback {
  overall: number;
  categories: { [key: string]: number };
  strengths: string[];
  improvements: string[];
  detailed: string;
  nextSteps: string[];
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  points: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  unlockedAt: Date;
}

interface SimulationTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  structure: Partial<ScenarioContent>;
  placeholders: TemplatePlaceholder[];
  guidelines: string[];
}

interface TemplatePlaceholder {
  key: string;
  type: 'text' | 'option' | 'media' | 'dialogue';
  description: string;
  required: boolean;
  defaultValue?: any;
}

const SimulationPracticeSystem: React.FC = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('browse');
  const [selectedScenario, setSelectedScenario] = useState<SimulationScenario | null>(null);
  const [activeSession, setActiveSession] = useState<SimulationSession | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [showResults, setShowResults] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [bookmarkedScenarios, setBookmarkedScenarios] = useState<string[]>([]);

  // Mock data
  const mockScenarios: SimulationScenario[] = [
    {
      id: 'vip-client-complaint',
      title: 'Handling VIP Client Complaint',
      description: 'Practice de-escalation techniques with a dissatisfied VIP customer about a cancelled appointment',
      category: 'vip-service',
      type: 'roleplay',
      difficulty: 'advanced',
      duration: 20,
      estimatedTime: 25,
      objectives: [
        'Demonstrate empathy and active listening',
        'Apply de-escalation techniques',
        'Follow VIP service protocols',
        'Offer appropriate solutions'
      ],
      skills: ['empathy', 'de-escalation', 'vip-protocols', 'problem-solving'],
      scenario: {
        setup: {
          context: 'A VIP client is calling about their cancelled appointment',
          role: 'Customer Support Agent',
          clientProfile: {
            name: 'Alexandra Novak',
            type: 'vip',
            personality: ['demanding', 'expecting-priority', 'appreciates-personal-service'],
            mood: 'frustrated',
            history: 'Long-term VIP client with history of premium services',
            preferences: ['Direct communication', 'Quick resolutions', 'Personal attention'],
            triggers: ['Being put on hold', 'Generic responses', 'Feeling unheard'],
            language: 'en'
          },
          environment: 'Virtual call center',
          tools: ['CRM system', 'Calendar', 'Service catalog'],
          timeConstraints: {
            type: 'overall',
            duration: 20,
            penalty: 5,
            strict: false
          }
        },
        steps: [
          {
            id: '1',
            type: 'dialogue',
            title: 'Initial Contact',
            description: 'The client calls and immediately expresses frustration',
            content: {
              dialogue: {
                client: "I cannot believe you cancelled my appointment! This is completely unacceptable!",
                system: "The client is clearly upset and expects immediate attention."
              }
            },
            points: 10,
            required: true,
            skipAllowed: false,
            options: [
              {
                id: '1a',
                text: 'I sincerely apologize for the cancellation, Ms. Novak. Can you tell me what happened so I can help resolve this immediately?',
                correct: true,
                feedback: 'Excellent opening - shows empathy, uses client name, and offers immediate help',
                points: 10,
                nextStep: '2'
              },
              {
                id: '1b',
                text: 'I understand you\'re upset. Let me check your appointment details first.',
                correct: false,
                feedback: 'Too generic - doesn\'t show empathy or use client name appropriately',
                points: 5,
                nextStep: '2'
              },
              {
                id: '1c',
                text: 'These things happen. Would you like to reschedule?',
                correct: false,
                feedback: 'Dismissive tone - fails to acknowledge client\'s feelings',
                points: 2,
                nextStep: '2'
              }
            ]
          },
          {
            id: '2',
            type: 'decision',
            title: 'Information Gathering',
            description: 'Listen to the client\'s full explanation and gather necessary information',
            content: {
              situation: 'The client explains they had an important business meeting and the appointment was cancelled without proper notification aria-live="polite" aria-atomic="true".'
            },
            points: 15,
            required: true,
            skipAllowed: false,
            correctAnswer: '2a',
            options: [
              {
                id: '2a',
                text: 'I understand this is very inconvenient, especially with your business meeting. Let me check exactly what happened and find the best solution for you right now.',
                correct: true,
                feedback: 'Shows understanding of business impact and promises immediate action',
                points: 15
              },
              {
                id: '2b',
                text: 'Let me transfer you to a manager who can help with this.',
                correct: false,
                feedback: 'Too quick to escalate - you should try to resolve first',
                points: 8
              }
            ]
          }
        ],
        branching: [],
        media: [],
        dialogues: [
          {
            id: 'd1',
            speaker: 'client',
            text: 'I cannot believe you cancelled my appointment! This is completely unacceptable!',
            emotion: 'angry',
            timing: 2
          },
          {
            id: 'd2',
            speaker: 'client',
            text: 'I had a crucial business meeting and this appointment was very important for my preparation.',
            emotion: 'frustrated',
            timing: 8
          }
        ],
        environment: {
          background: 'virtual-office',
          sounds: ['phone-ringing', 'office-background'],
          tools: ['phone', 'computer', 'crm'],
          constraints: []
        }
      },
      evaluation: {
        categories: [
          {
            name: 'Communication Skills',
            description: 'Quality of verbal and written communication',
            weight: 30,
            levels: [
              { level: 5, name: 'Expert', description: 'Exceptional communication with luxury service standards', score: 95, indicators: ['Perfect tone', 'Empathy shown', 'Professional language'] },
              { level: 4, name: 'Advanced', description: 'Strong communication with minor improvements needed', score: 85, indicators: ['Good tone', 'Mostly empathetic', 'Professional'] },
              { level: 3, name: 'Competent', description: 'Adequate communication with clear areas for improvement', score: 75, indicators: ['Inconsistent tone', 'Some empathy', 'Generally professional'] },
              { level: 2, name: 'Developing', description: 'Basic communication needing significant improvement', score: 65, indicators: ['Poor tone', 'Limited empathy', 'Unprofessional at times'] },
              { level: 1, name: 'Novice', description: 'Communication skills require fundamental development', score: 55, indicators: ['Inappropriate tone', 'No empathy', 'Unprofessional'] }
            ]
          },
          {
            name: 'Problem Solving',
            description: 'Ability to identify and resolve client issues effectively',
            weight: 35,
            levels: [
              { level: 5, name: 'Expert', description: 'Outstanding problem-solving with creative solutions', score: 95, indicators: ['Quick thinking', 'Multiple solutions', 'Anticipatory service'] },
              { level: 4, name: 'Advanced', description: 'Strong problem-solving with good solutions', score: 85, indicators: ['Good analysis', 'Effective solutions', 'Follows procedures'] },
              { level: 3, name: 'Competent', description: 'Adequate problem-solving with standard solutions', score: 75, indicators: ['Basic analysis', 'Standard solutions', 'Needs guidance'] },
              { level: 2, name: 'Developing', description: 'Limited problem-solving needing support', score: 65, indicators: ['Poor analysis', 'Limited options', 'Requires help'] },
              { level: 1, name: 'Novice', description: 'Problem-solving skills require basic training', score: 55, indicators: ['No analysis', 'Wrong solutions', 'Cannot resolve'] }
            ]
          },
          {
            name: 'VIP Service Standards',
            description: 'Adherence to luxury service protocols',
            weight: 35,
            levels: [
              { level: 5, name: 'Expert', description: 'Perfect execution of VIP service standards', score: 95, indicators: ['White-glove service', 'Personal attention', 'Proactive solutions'] },
              { level: 4, name: 'Advanced', description: 'Strong adherence to VIP protocols', score: 85, indicators: ['Good VIP knowledge', 'Personal touches', 'Appropriate solutions'] },
              { level: 3, name: 'Competent', description: 'Basic understanding of VIP service', score: 75, indicators: ['Some VIP awareness', 'Occasional personal touches', 'Standard solutions'] },
              { level: 2, name: 'Developing', description: 'Limited VIP service knowledge', score: 65, indicators: ['Poor VIP awareness', 'Generic service', 'Inappropriate responses'] },
              { level: 1, name: 'Novice', description: 'No understanding of VIP service', score: 55, indicators: ['No VIP concept', 'Generic treatment', 'Poor service'] }
            ]
          }
        ],
        scoring: {
          type: 'points',
          details: { maxPoints: 100, passingScore: 75 }
        },
        feedback: {
          type: 'immediate',
          details: { showCorrectAnswers: true, provideExplanations: true }
        },
        certification: {
          name: 'VIP Service Specialist',
          description: 'Certified in handling VIP clients with luxury service standards',
          requirements: ['Score 85% or higher', 'Complete all VIP scenarios', 'Demonstrate consistent excellence'],
          validPeriod: 6
        }
      },
      prerequisites: ['luxury-communication-basics', 'customer-service-fundamentals'],
      resources: [
        {
          id: '1',
          name: 'VIP Service Handbook',
          type: 'guide',
          description: 'Complete guide to VIP service protocols',
          url: '/resources/vip-handbook.pdf',
          downloadable: true,
          required: false
        },
        {
          id: '2',
          name: 'De-escalation Techniques Video',
          type: 'video',
          description: 'Video demonstration of de-escalation methods',
          url: '/resources/de-escalation.mp4',
          downloadable: false,
          required: false
        }
      ],
      tags: ['vip', 'de-escalation', 'complaint-handling', 'luxury-service'],
      language: ['en', 'pl'],
      points: 100,
      attempts: 0,
      maxAttempts: 3,
      averageRating: 4.8,
      totalRatings: 24,
      creator: 'Training Department',
      createdAt: new Date('2024-09-15'),
      lastUpdated: new Date('2024-10-20'),
      featured: true,
      interactive: true
    },
    {
      id: 'technical-troubleshooting',
      title: 'Technical Issue Troubleshooting',
      description: 'Practice diagnosing and resolving technical problems with booking system',
      category: 'technical',
      type: 'interactive',
      difficulty: 'intermediate',
      duration: 15,
      estimatedTime: 20,
      objectives: [
        'Diagnose technical issues systematically',
        'Use appropriate troubleshooting tools',
        'Communicate technical information clearly',
        'Escalate when necessary'
      ],
      skills: ['technical-knowledge', 'troubleshooting', 'communication', 'system-navigation'],
      scenario: {
        setup: {
          context: 'Client reports issues with the online booking system',
          role: 'Technical Support Agent',
          clientProfile: {
            name: 'Maria Kowalska',
            type: 'regular',
            personality: ['patient', 'technical-savvy'],
            mood: 'confused',
            history: 'Regular client experiencing technical difficulties',
            preferences: ['Clear explanations', 'Step-by-step guidance'],
            triggers: ['Technical jargon', 'Being rushed'],
            language: 'pl'
          },
          environment: 'Virtual technical support',
          tools: ['CRM', 'Booking system', 'Admin panel', 'Diagnostic tools'],
          timeConstraints: {
            type: 'overall',
            duration: 15,
            penalty: 3,
            strict: false
          }
        },
        steps: [],
        branching: [],
        media: [],
        dialogues: [],
        environment: {
          background: 'technical-support',
          sounds: ['keyboard-typing', 'computer-fans'],
          tools: ['computer', 'diagnostic-software'],
          constraints: []
        }
      },
      evaluation: {
        categories: [
          {
            name: 'Technical Knowledge',
            description: 'Understanding of systems and technical concepts',
            weight: 40,
            levels: []
          },
          {
            name: 'Diagnostic Skills',
            description: 'Ability to identify and diagnose issues',
            weight: 35,
            levels: []
          },
          {
            name: 'Communication',
            description: 'Clear explanation of technical issues',
            weight: 25,
            levels: []
          }
        ],
        scoring: {
          type: 'points',
          details: { maxPoints: 100, passingScore: 70 }
        },
        feedback: {
          type: 'immediate',
          details: { showCorrectAnswers: true, provideExplanations: true }
        }
      },
      resources: [
        {
          id: '1',
          name: 'System Troubleshooting Guide',
          type: 'guide',
          description: 'Step-by-step troubleshooting procedures',
          url: '/resources/troubleshooting-guide.pdf',
          downloadable: true,
          required: false
        }
      ],
      tags: ['technical', 'troubleshooting', 'booking-system', 'problem-solving'],
      language: ['pl', 'en'],
      points: 75,
      attempts: 0,
      maxAttempts: 3,
      averageRating: 4.5,
      totalRatings: 18,
      creator: 'Technical Training Team',
      createdAt: new Date('2024-10-01'),
      lastUpdated: new Date('2024-10-15'),
      featured: false,
      interactive: true
    }
  ];

  const categories = [
    { id: 'all', name: 'All Categories', icon: Grid, color: 'text-gray-600' },
    { id: 'customer-service', name: 'Customer Service', icon: Users, color: 'text-blue-600' },
    { id: 'technical', name: 'Technical', icon: Shield, color: 'text-purple-600' },
    { id: 'crisis', name: 'Crisis Management', icon: AlertTriangle, color: 'text-red-600' },
    { id: 'sales', name: 'Sales', icon: Target, color: 'text-green-600' },
    { id: 'compliance', name: 'Compliance', icon: BookOpen, color: 'text-indigo-600' },
    { id: 'vip-service', name: 'VIP Service', icon: Star, color: 'text-yellow-600' }
  ];

  const difficulties = [
    { id: 'all', name: 'All Levels' },
    { id: 'beginner', name: 'Beginner' },
    { id: 'intermediate', name: 'Intermediate' },
    { id: 'advanced', name: 'Advanced' },
    { id: 'expert', name: 'Expert' }
  ];

  useEffect(() => {
    // Initialize simulation data
  }, []);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-blue-100 text-blue-800';
      case 'advanced': return 'bg-purple-100 text-purple-800';
      case 'expert': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryColor = (category: string) => {
    const cat = categories.find(c => c.id === category);
    return cat ? cat.color : 'text-gray-600';
  };

  const getCategoryIcon = (category: string) => {
    const cat = categories.find(c => c.id === category);
    return cat ? cat.icon : Grid;
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'roleplay': return Users;
      case 'case-study': return FileText;
      case 'interactive': return Activity;
      case 'assessment': return Target;
      case 'gamified': return Award;
      default: return PlayCircle;
    }
  };

  const handleScenarioStart = (scenario: SimulationScenario) => {
    setSelectedScenario(scenario);
    setActiveSession({
      id: `session-${Date.now()}`,
      scenarioId: scenario.id,
      userId: 'current-user',
      startTime: new Date(),
      status: 'in-progress',
      currentStep: 0,
      progress: 0,
      score: 0,
      answers: [],
      timeSpent: 0,
      attempts: 1,
      feedback: {
        overall: 0,
        categories: {},
        strengths: [],
        improvements: [],
        detailed: '',
        nextSteps: []
      },
      achievements: []
    });
    setIsPlaying(true);
    setCurrentStep(0);
  };

  const handleAnswerSelect = (answer: string) => {
    setSelectedAnswer(answer);
    if (activeSession && selectedScenario) {
      const step = selectedScenario.scenario.steps[currentStep];
      const option = step.options?.find(opt => opt.id === answer);

      const newAnswer: SessionAnswer = {
        stepId: step.id,
        selectedOption: answer,
        timeTaken: 0, // Would be calculated
        points: option?.points || 0,
        correct: option?.correct || false,
        feedback: option?.feedback || ''
      };

      setActiveSession(prev => ({
        ...prev,
        answers: [...prev.answers, newAnswer],
        score: prev.score + (option?.points || 0),
        progress: ((currentStep + 1) / selectedScenario.scenario.steps.length) * 100
      }));
    }
  };

  const handleNextStep = () => {
    if (selectedScenario && currentStep < selectedScenario.scenario.steps.length - 1) {
      setCurrentStep(prev => prev + 1);
      setSelectedAnswer('');
    } else {
      // Complete scenario
      setIsPlaying(false);
      setShowResults(true);
    }
  };

  const handleBookmark = (scenarioId: string) => {
    setBookmarkedScenarios(prev =>
      prev.includes(scenarioId)
        ? prev.filter(id => id !== scenarioId)
        : [...prev, scenarioId]
    );
  };

  const filteredScenarios = mockScenarios.filter(scenario => {
    const matchesSearch = scenario.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         scenario.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || scenario.category === selectedCategory;
    const matchesDifficulty = selectedDifficulty === 'all' || scenario.difficulty === selectedDifficulty;
    return matchesSearch && matchesCategory && matchesDifficulty;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50/30 via-orange-50/20 to-rose-50/30">
      {/* Header */}
      <div className="bg-white/90 backdrop-blur-md shadow-lg border-b border-amber-100">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Brain className="h-8 w-8 text-amber-600" />
              <div>
                <h1 className="text-3xl font-bold text-amber-900">Simulation & Practice System</h1>
                <p className="text-amber-600">Interactive training scenarios for skill development</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-amber-50 rounded-lg p-2">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Active Simulation Banner */}
      {activeSession && (
        <div className="bg-blue-50 border-b border-blue-200">
          <div className="max-w-7xl mx-auto px-6 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Activity className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">
                  Active Simulation: {selectedScenario?.title}
                </span>
                <span className="text-sm text-blue-600">
                  Step {currentStep + 1} of {selectedScenario?.scenario.steps.length} • Score: {activeSession.score}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={() => setIsPlaying(!isPlaying)}>
                  {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </Button>
                <Button size="sm" variant="outline" onClick={() => setShowResults(true)}>
                  <Eye className="h-4 w-4 mr-2" />
                  End Simulation
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 bg-gradient-to-r from-amber-100 to-orange-100 border border-amber-200">
            <TabsTrigger value="browse" className="data-[state=active]:bg-white data-[state=active]:shadow-md">
              <Search className="h-4 w-4 mr-2" />
              Browse
            </TabsTrigger>
            <TabsTrigger value="my-progress" className="data-[state=active]:bg-white data-[state=active]:shadow-md">
              <TrendingUp className="h-4 w-4 mr-2" />
              My Progress
            </TabsTrigger>
            <TabsTrigger value="featured" className="data-[state=active]:bg-white data-[state=active]:shadow-md">
              <Star className="h-4 w-4 mr-2" />
              Featured
            </TabsTrigger>
            <TabsTrigger value="certifications" className="data-[state=active]:bg-white data-[state=active]:shadow-md">
              <Award className="h-4 w-4 mr-2" />
              Certifications
            </TabsTrigger>
            <TabsTrigger value="leaderboard" className="data-[state=active]:bg-white data-[state=active]:shadow-md">
              <Trophy className="h-4 w-4 mr-2" />
              Leaderboard
            </TabsTrigger>
            <TabsTrigger value="create" className="data-[state=active]:bg-white data-[state=active]:shadow-md">
              <Plus className="h-4 w-4 mr-2" />
              Create
            </TabsTrigger>
          </TabsList>

          {/* Browse Tab */}
          <TabsContent value="browse" className="space-y-6">
            {/* Filters */}
            <Card className="border-amber-200 shadow-lg">
              <CardHeader>
                <CardTitle>Training Scenarios</CardTitle>
                <CardDescription>Browse and practice interactive training scenarios</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col lg:flex-row gap-4 mb-6">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-amber-500" />
                      <Input
                        placeholder="Search scenarios..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 border-amber-200"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger className="w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
                      <SelectTrigger className="w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {difficulties.map((difficulty) => (
                          <SelectItem key={difficulty.id} value={difficulty.id}>
                            {difficulty.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Scenarios Display */}
                {viewMode === 'grid' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredScenarios.map((scenario) => {
                      const TypeIcon = getTypeIcon(scenario.type);
                      return (
                        <Card key={scenario.id} className="border-amber-200 shadow-lg hover:shadow-xl transition-shadow">
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-2">
                                <TypeIcon className="h-5 w-5 text-amber-600" />
                                <Badge className={getDifficultyColor(scenario.difficulty)}>
                                  {scenario.difficulty}
                                </Badge>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleBookmark(scenario.id)}
                              >
                                <Bookmark className={`h-4 w-4 ${bookmarkedScenarios.includes(scenario.id) ? 'fill-amber-600 text-amber-600' : 'text-gray-400'}`} />
                              </Button>
                            </div>
                            {scenario.featured && (
                              <Badge className="bg-yellow-100 text-yellow-800">
                                <Star className="h-3 w-3 mr-1" />
                                Featured
                              </Badge>
                            )}
                            <CardTitle className="text-lg text-amber-900 line-clamp-2">{scenario.title}</CardTitle>
                            <CardDescription className="line-clamp-2">{scenario.description}</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-4">
                              <div className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2">
                                  {React.createElement(getCategoryIcon(scenario.category), {
                                    className: `h-4 w-4 ${getCategoryColor(scenario.category)}`
                                  })}
                                  <span className="text-amber-600 capitalize">{scenario.category}</span>
                                </div>
                                <span className="text-amber-600">{scenario.duration} min</span>
                              </div>

                              <div className="flex items-center gap-3 text-xs text-amber-500">
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {scenario.estimatedTime} min est.
                                </span>
                                <span className="flex items-center gap-1">
                                  <Target className="h-3 w-3" />
                                  {scenario.points} pts
                                </span>
                                <span className="flex items-center gap-1">
                                  <Star className="h-3 w-3" />
                                  {scenario.averageRating.toFixed(1)}
                                </span>
                              </div>

                              <div className="flex flex-wrap gap-1">
                                {scenario.tags.slice(0, 3).map((tag) => (
                                  <Badge key={tag} variant="secondary" className="text-xs">
                                    #{tag}
                                  </Badge>
                                ))}
                              </div>

                              <div className="space-y-2">
                                <p className="text-sm font-medium text-amber-900">You'll practice:</p>
                                <div className="flex flex-wrap gap-1">
                                  {scenario.skills.slice(0, 3).map((skill) => (
                                    <Badge key={skill} variant="outline" className="text-xs">
                                      {skill}
                                    </Badge>
                                  ))}
                                </div>
                              </div>

                              <Button
                                className="w-full bg-amber-600 hover:bg-amber-700"
                                onClick={() => handleScenarioStart(scenario)}
                              >
                                Start Scenario
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredScenarios.map((scenario) => {
                      const TypeIcon = getTypeIcon(scenario.type);
                      return (
                        <Card key={scenario.id} className="border-amber-200 shadow-md hover:shadow-lg transition-shadow">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4 flex-1">
                                <TypeIcon className="h-6 w-6 text-amber-600" />
                                <div className="flex-1">
                                  <div className="flex items-center gap-3 mb-2">
                                    <h3 className="font-semibold text-amber-900">{scenario.title}</h3>
                                    <Badge className={getDifficultyColor(scenario.difficulty)}>
                                      {scenario.difficulty}
                                    </Badge>
                                    {scenario.featured && (
                                      <Badge className="bg-yellow-100 text-yellow-800">
                                        <Star className="h-3 w-3 mr-1" />
                                        Featured
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-sm text-amber-600 mb-2 line-clamp-1">{scenario.description}</p>
                                  <div className="flex items-center gap-4 text-xs text-amber-500">
                                    <span>Category: {scenario.category}</span>
                                    <span>Duration: {scenario.duration} min</span>
                                    <span>Points: {scenario.points}</span>
                                    <span>Rating: {scenario.averageRating.toFixed(1)}/5</span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleBookmark(scenario.id)}
                                >
                                  <Bookmark className={`h-4 w-4 ${bookmarkedScenarios.includes(scenario.id) ? 'fill-amber-600 text-amber-600' : 'text-gray-400'}`} />
                                </Button>
                                <Button
                                  size="sm"
                                  className="bg-amber-600 hover:bg-amber-700"
                                  onClick={() => handleScenarioStart(scenario)}
                                >
                                  Start
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Active Simulation */}
          {activeSession && selectedScenario && (
            <Dialog open={true} onOpenChange={() => {}}>
              <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{selectedScenario.title}</DialogTitle>
                  <DialogDescription>{selectedScenario.description}</DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                  {/* Simulation Header */}
                  <div className="flex items-center justify-between p-4 bg-amber-50 rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="text-2xl font-bold text-amber-900">
                        Score: {activeSession.score}
                      </div>
                      <div className="text-sm text-amber-600">
                        Step {currentStep + 1} of {selectedScenario.scenario.steps.length}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsMuted(!isMuted)}
                      >
                        {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsPlaying(!isPlaying)}
                      >
                        {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowResults(true)}
                      >
                        <StopCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-amber-600">Progress</span>
                      <span className="font-medium text-amber-900">{activeSession.progress.toFixed(0)}%</span>
                    </div>
                    <Progress value={activeSession.progress} />
                  </div>

                  {/* Current Step */}
                  {selectedScenario.scenario.steps[currentStep] && (
                    <Card className="border-amber-200">
                      <CardHeader>
                        <CardTitle className="text-lg text-amber-900">
                          Step {currentStep + 1}: {selectedScenario.scenario.steps[currentStep].title}
                        </CardTitle>
                        <CardDescription>
                          {selectedScenario.scenario.steps[currentStep].description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {/* Dialogue/Content */}
                          {selectedScenario.scenario.steps[currentStep].content.dialogue && (
                            <div className="space-y-3">
                              <div className="p-4 bg-gray-50 rounded-lg">
                                <div className="flex items-center gap-2 mb-2">
                                  <User className="h-4 w-4 text-gray-600" />
                                  <span className="font-medium text-gray-900">Client</span>
                                </div>
                                <p className="text-gray-800">
                                  {selectedScenario.scenario.steps[currentStep].content.dialogue.client}
                                </p>
                              </div>
                            </div>
                          )}

                          {/* Options */}
                          {selectedScenario.scenario.steps[currentStep].options && (
                            <div className="space-y-3">
                              <h4 className="font-medium text-amber-900">How would you respond?</h4>
                              <RadioGroup
                                value={selectedAnswer}
                                onValueChange={handleAnswerSelect}
                              >
                                {selectedScenario.scenario.steps[currentStep].options?.map((option) => (
                                  <div key={option.id} className="flex items-center space-x-2">
                                    <RadioGroupItem value={option.id} id={option.id} />
                                    <Label htmlFor={option.id} className="text-sm">
                                      {option.text}
                                    </Label>
                                  </div>
                                ))}
                              </RadioGroup>
                            </div>
                          )}

                          {/* Action Buttons */}
                          <div className="flex justify-between">
                            <Button
                              variant="outline"
                              onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                              disabled={currentStep === 0}
                            >
                              <ChevronLeft className="h-4 w-4 mr-2" />
                              Previous
                            </Button>
                            <Button
                              className="bg-amber-600 hover:bg-amber-700"
                              onClick={handleNextStep}
                              disabled={!selectedAnswer}
                            >
                              {currentStep === selectedScenario.scenario.steps.length - 1 ? 'Complete' : 'Next'}
                              <ChevronRight className="h-4 w-4 ml-2" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          )}

          {/* Results Dialog */}
          {showResults && activeSession && selectedScenario && (
            <Dialog open={true} onOpenChange={() => setShowResults(false)}>
              <DialogContent className="max-w-4xl">
                <DialogHeader>
                  <DialogTitle>Simulation Results</DialogTitle>
                  <DialogDescription>
                    Your performance in {selectedScenario.title}
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                  {/* Overall Score */}
                  <div className="text-center p-6 bg-amber-50 rounded-lg">
                    <div className="text-4xl font-bold text-amber-900 mb-2">
                      {activeSession.score}/{selectedScenario.points}
                    </div>
                    <div className="text-lg text-amber-600">
                      {activeSession.score >= selectedScenario.points * 0.8 ? 'Excellent!' :
                       activeSession.score >= selectedScenario.points * 0.6 ? 'Good job!' :
                       activeSession.score >= selectedScenario.points * 0.4 ? 'Keep practicing!' :
                       'More practice needed'}
                    </div>
                  </div>

                  {/* Category Scores */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Category Performance</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {selectedScenario.evaluation.categories.map((category) => (
                          <div key={category.name} className="space-y-2">
                            <div className="flex justify-between">
                              <span className="font-medium text-amber-900">{category.name}</span>
                              <span className="text-sm text-amber-600">Weight: {category.weight}%</span>
                            </div>
                            <Progress value={75} /> {/* Would calculate actual score */}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Feedback */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Feedback</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-medium text-green-700 mb-2">Strengths</h4>
                          <ul className="text-sm text-green-700 space-y-1">
                            <li>• Excellent empathy and active listening</li>
                            <li>• Good problem-solving approach</li>
                            <li>• Professional communication</li>
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-medium text-yellow-700 mb-2">Areas for Improvement</h4>
                          <ul className="text-sm text-yellow-700 space-y-1">
                            <li>• Consider more solution options</li>
                            <li>• Work on response timing</li>
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Actions */}
                  <div className="flex justify-center gap-4">
                    <Button variant="outline">
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Try Again
                    </Button>
                    <Button className="bg-amber-600 hover:bg-amber-700">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Complete
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}

          {/* Other Tabs (My Progress, Featured, etc.) */}
          <TabsContent value="my-progress" className="space-y-6">
            <Card className="border-amber-200 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-amber-900">
                  <TrendingUp className="h-5 w-5 text-amber-600" />
                  Your Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <GraduationCap className="h-12 w-12 text-amber-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-amber-900 mb-2">Track Your Learning Journey</h3>
                  <p className="text-amber-600">Your simulation results and progress will appear here</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="featured" className="space-y-6">
            <Card className="border-amber-200 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-amber-900">
                  <Star className="h-5 w-5 text-amber-600" />
                  Featured Scenarios
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {mockScenarios.filter(s => s.featured).map((scenario) => (
                    <Card key={scenario.id} className="border-amber-200 shadow-md hover:shadow-lg transition-shadow">
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <Badge className="bg-yellow-100 text-yellow-800">
                              <Star className="h-3 w-3 mr-1" />
                              Featured
                            </Badge>
                            <Badge className={getDifficultyColor(scenario.difficulty)}>
                              {scenario.difficulty}
                            </Badge>
                          </div>
                          <h3 className="font-semibold text-amber-900">{scenario.title}</h3>
                          <p className="text-sm text-amber-600">{scenario.description}</p>
                          <Button
                            className="w-full bg-amber-600 hover:bg-amber-700"
                            onClick={() => handleScenarioStart(scenario)}
                          >
                            Start Scenario
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="certifications" className="space-y-6">
            <Card className="border-amber-200 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-amber-900">
                  <Award className="h-5 w-5 text-amber-600" />
                  Certifications
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Award className="h-12 w-12 text-amber-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-amber-900 mb-2">Earn Certifications</h3>
                  <p className="text-amber-600">Complete scenarios to earn professional certifications</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="leaderboard" className="space-y-6">
            <Card className="border-amber-200 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-amber-900">
                  <Trophy className="h-5 w-5 text-amber-600" />
                  Leaderboard
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Trophy className="h-12 w-12 text-amber-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-amber-900 mb-2">Top Performers</h3>
                  <p className="text-amber-600">Compete with others for the top spots</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="create" className="space-y-6">
            <Card className="border-amber-200 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-amber-900">
                  <Plus className="h-5 w-5 text-amber-600" />
                  Create Scenario
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Brain className="h-12 w-12 text-amber-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-amber-900 mb-2">Create Custom Scenarios</h3>
                  <p className="text-amber-600">Build your own training scenarios for specific needs</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default SimulationPracticeSystem;