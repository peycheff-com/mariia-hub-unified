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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { useTranslation } from 'react-i18next';
import {
  Play,
  Pause,
  Square,
  Circle,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  Maximize2,
  Download,
  Upload,
  Share2,
  Bookmark,
  Users,
  User,
  Calendar,
  Clock,
  Timer,
  Video,
  FileText,
  HeadphonesIcon,
  Mic,
  MicOff,
  Camera,
  CameraOff,
  Monitor,
  Settings,
  Globe,
  Languages,
  MessageSquare,
  Phone,
  Mail,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  HelpCircle,
  BookOpen,
  GraduationCap,
  Award,
  Target,
  TrendingUp,
  BarChart3,
  Activity,
  Star,
  Eye,
  EyeOff,
  Edit,
  Save,
  RefreshCw,
  PlayCircle,
  PauseCircle,
  StopCircle,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Fullscreen,
  Grid,
  List,
  Search,
  Filter,
  Tag,
  Hash,
  Bell,
  BellOff,
  Wifi,
  WifiOff,
  Battery,
  BatteryLow,
  Sun,
  Moon,
  Zap,
  Brain,
  Lightbulb,
  Rocket,
  Flag,
  ThumbsUp,
  ThumbsDown,
  MessageCircle,
  AtSign,
  Link,
  ExternalLink,
  Clipboard,
  Copy,
  Printer,
  Archive,
  Folder,
  FolderOpen,
  Image,
  File,
  FileVideo,
  FileAudio,
  FileText as FileTextIcon
} from 'lucide-react';

interface TrainingCourse {
  id: string;
  title: string;
  description: string;
  category: string;
  type: 'video' | 'interactive' | 'live' | 'self-paced' | 'blended' | 'workshop';
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  duration: number; // in minutes
  lessons: Lesson[];
  instructor?: Instructor;
  prerequisites: string[];
  learningObjectives: string[];
  materials: CourseMaterial[];
  assessments: Assessment[];
  certificate: CertificateInfo;
  schedule: CourseSchedule;
  enrollment: EnrollmentInfo;
  delivery: DeliveryMethod[];
  interactive: boolean;
  mobileFriendly: boolean;
  offline: boolean;
  multiLanguage: string[];
  tags: string[];
  rating: number;
  reviews: CourseReview[];
  createdAt: Date;
  lastUpdated: Date;
  active: boolean;
  featured: boolean;
}

interface Lesson {
  id: string;
  title: string;
  description: string;
  type: 'video' | 'text' | 'interactive' | 'quiz' | 'assignment' | 'live-session';
  duration: number;
  order: number;
  content: LessonContent;
  materials: LessonMaterial[];
  assessment?: LessonAssessment;
  completed: boolean;
  progress: number;
  timeSpent: number;
  lastAccessed?: Date;
}

interface LessonContent {
  type: 'video' | 'text' | 'html' | 'interactive' | 'presentation';
  data: any;
  url?: string;
  autoplay?: boolean;
  controls?: boolean;
  quality?: string;
}

interface Instructor {
  id: string;
  name: string;
  bio: string;
  expertise: string[];
  avatar: string;
  rating: number;
  courses: string[];
  availability: AvailabilityInfo;
}

interface CourseMaterial {
  id: string;
  name: string;
  type: 'document' | 'video' | 'audio' | 'presentation' | 'link';
  url: string;
  size: string;
  downloadable: boolean;
  required: boolean;
}

interface Assessment {
  id: string;
  title: string;
  type: 'quiz' | 'exam' | 'assignment' | 'project';
  questions: any[];
  passingScore: number;
  timeLimit?: number;
  attempts: number;
  maxAttempts: number;
  available: boolean;
}

interface CertificateInfo {
  available: boolean;
  template: string;
  requirements: string[];
  validity: number; // in months
  digital: boolean;
  printable: boolean;
}

interface CourseSchedule {
  type: 'self-paced' | 'fixed' | 'flexible';
  startDate?: Date;
  endDate?: Date;
  liveSessions: LiveSession[];
  deadlines: Deadline[];
}

interface LiveSession {
  id: string;
  title: string;
  date: Date;
  duration: number;
  type: 'lecture' | 'workshop' | 'qna' | 'office-hours';
  instructor: string;
  joinUrl?: string;
  recording?: string;
  required: boolean;
}

interface Deadline {
  id: string;
  title: string;
  dueDate: Date;
  type: 'assignment' | 'quiz' | 'project';
  points: number;
  latePenalty: number;
}

interface EnrollmentInfo {
  open: boolean;
  capacity: number;
  enrolled: number;
  waitlist: number;
  startDate: Date;
  endDate: Date;
  price?: number;
  currency?: string;
  requirements: string[];
}

interface DeliveryMethod {
  type: 'online' | 'in-person' | 'hybrid';
  platform?: string;
  location?: string;
  requirements: string[];
}

interface LessonMaterial {
  id: string;
  name: string;
  type: 'document' | 'link' | 'download';
  url: string;
  required: boolean;
}

interface LessonAssessment {
  questions: any[];
  passingScore: number;
  timeLimit?: number;
}

interface CourseReview {
  id: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  date: Date;
  helpful: number;
}

interface AvailabilityInfo {
  timezone: string;
  officeHours: {
    day: string;
    start: string;
    end: string;
  }[];
  responseTime: string;
}

interface LearnerProgress {
  userId: string;
  courseId: string;
  status: 'not-started' | 'in-progress' | 'completed' | 'dropped' | 'suspended';
  progress: number;
  timeSpent: number;
  lastActivity: Date;
  enrolledAt: Date;
  completedAt?: Date;
  currentLesson?: number;
  completedLessons: string[];
  assessmentScores: AssessmentScore[];
  certificateEarned?: boolean;
  notes: string[];
}

interface AssessmentScore {
  assessmentId: string;
  score: number;
  passed: boolean;
  attempts: number;
  date: Date;
}

interface LiveClass {
  id: string;
  title: string;
  description: string;
  instructor: string;
  date: Date;
  duration: number;
  type: 'lecture' | 'workshop' | 'qna' | 'office-hours';
  attendees: string[];
  maxAttendees: number;
  platform: string;
  joinUrl: string;
  recording?: string;
  materials: any[];
  status: 'scheduled' | 'live' | 'completed' | 'cancelled';
}

interface TrainingSession {
  id: string;
  courseId: string;
  learnerId: string;
  lessonId: string;
  startTime: Date;
  endTime?: Date;
  status: 'active' | 'paused' | 'completed';
  progress: number;
  timeSpent: number;
  bookmarks: Bookmark[];
  notes: string[];
  interactions: Interaction[];
}

interface Bookmark {
  id: string;
  time: number;
  note?: string;
}

interface Interaction {
  type: 'note' | 'bookmark' | 'question' | 'answer';
  timestamp: number;
  content: string;
  data?: any;
}

interface LearningPath {
  id: string;
  name: string;
  description: string;
  courses: string[];
  estimatedDuration: number;
  prerequisites: string[];
  enrolled: boolean;
  progress: number;
  completedCourses: string[];
  certificate?: string;
}

const TrainingDeliverySystem: React.FC = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('courses');
  const [selectedCourse, setSelectedCourse] = useState<TrainingCourse | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [notes, setNotes] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedLevel, setSelectedLevel] = useState('all');

  // Mock data
  const mockCourses: TrainingCourse[] = [
    {
      id: 'luxury-customer-service',
      title: 'Luxury Customer Service Excellence',
      description: 'Master the art of delivering exceptional service to VIP and high-value clients',
      category: 'customer-service',
      type: 'blended',
      level: 'advanced',
      duration: 480, // 8 hours
      lessons: [
        {
          id: 'lesson-1',
          title: 'Introduction to Luxury Service',
          description: 'Understanding the luxury service mindset and brand expectations',
          type: 'video',
          duration: 45,
          order: 1,
          content: {
            type: 'video',
            url: '/videos/luxury-intro.mp4',
            autoplay: false,
            controls: true,
            quality: '1080p'
          },
          materials: [
            {
              id: 'm1',
              name: 'Luxury Service Handbook',
              type: 'document',
              url: '/materials/luxury-handbook.pdf',
              size: '2.5 MB',
              downloadable: true,
              required: false
            }
          ],
          completed: false,
          progress: 0,
          timeSpent: 0
        },
        {
          id: 'lesson-2',
          title: 'VIP Client Communication',
          description: 'Mastering communication protocols for high-value clients',
          type: 'video',
          duration: 60,
          order: 2,
          content: {
            type: 'video',
            url: '/videos/vip-communication.mp4',
            autoplay: false,
            controls: true,
            quality: '1080p'
          },
          completed: false,
          progress: 0,
          timeSpent: 0
        }
      ],
      instructor: {
        id: 'instructor-1',
        name: 'Sarah Mitchell',
        bio: '15+ years experience in luxury hospitality and customer service',
        expertise: ['Luxury Service', 'VIP Management', 'Communication'],
        avatar: '/avatars/sarah-mitchell.jpg',
        rating: 4.9,
        courses: ['luxury-customer-service', 'vip-protocols'],
        availability: {
          timezone: 'Europe/Warsaw',
          officeHours: [
            { day: 'Monday', start: '09:00', end: '17:00' },
            { day: 'Tuesday', start: '09:00', end: '17:00' },
            { day: 'Wednesday', start: '09:00', end: '17:00' }
          ],
          responseTime: 'Within 24 hours'
        }
      },
      prerequisites: ['customer-service-basics', 'communication-fundamentals'],
      learningObjectives: [
        'Understand luxury service principles',
        'Master VIP client communication',
        'Handle difficult situations with grace',
        'Create memorable client experiences'
      ],
      materials: [
        {
          id: 'cm-1',
          name: 'Course Workbook',
          type: 'document',
          url: '/materials/course-workbook.pdf',
          size: '5.2 MB',
          downloadable: true,
          required: false
        }
      ],
      assessments: [
        {
          id: 'assess-1',
          title: 'Final Assessment',
          type: 'exam',
          questions: [],
          passingScore: 85,
          timeLimit: 60,
          attempts: 0,
          maxAttempts: 3,
          available: true
        }
      ],
      certificate: {
        available: true,
        template: 'luxury-certificate',
        requirements: ['Complete all lessons', 'Pass final assessment with 85% or higher'],
        validity: 12,
        digital: true,
        printable: true
      },
      schedule: {
        type: 'flexible',
        liveSessions: [
          {
            id: 'live-1',
            title: 'Live Q&A Session',
            date: new Date('2024-11-15T14:00:00'),
            duration: 90,
            type: 'qna',
            instructor: 'instructor-1',
            joinUrl: 'https://zoom.us/j/123456789',
            required: true
          }
        ],
        deadlines: [
          {
            id: 'deadline-1',
            title: 'Practical Assignment',
            dueDate: new Date('2024-11-30'),
            type: 'assignment',
            points: 100,
            latePenalty: 10
          }
        ]
      },
      enrollment: {
        open: true,
        capacity: 30,
        enrolled: 12,
        waitlist: 0,
        startDate: new Date('2024-11-01'),
        endDate: new Date('2024-12-15'),
        price: 299,
        currency: 'PLN',
        requirements: ['Customer service experience', 'Fluent in Polish and English']
      },
      delivery: [
        { type: 'online', platform: 'Custom LMS', requirements: ['Internet connection', 'Web browser'] }
      ],
      interactive: true,
      mobileFriendly: true,
      offline: false,
      multiLanguage: ['en', 'pl'],
      tags: ['luxury', 'vip', 'customer-service', 'advanced'],
      rating: 4.8,
      reviews: [],
      createdAt: new Date('2024-10-01'),
      lastUpdated: new Date('2024-10-28'),
      active: true,
      featured: true
    },
    {
      id: 'technical-fundamentals',
      title: 'Technical Support Fundamentals',
      description: 'Essential technical skills for support agents',
      category: 'technical',
      type: 'self-paced',
      level: 'beginner',
      duration: 300, // 5 hours
      lessons: [],
      prerequisites: [],
      learningObjectives: [
        'Understand technical terminology',
        'Navigate support systems',
        'Basic troubleshooting techniques'
      ],
      materials: [],
      assessments: [],
      certificate: {
        available: false,
        template: '',
        requirements: [],
        validity: 0,
        digital: false,
        printable: false
      },
      schedule: {
        type: 'self-paced'
      },
      enrollment: {
        open: true,
        capacity: 50,
        enrolled: 23,
        waitlist: 5,
        startDate: new Date('2024-11-01'),
        endDate: new Date('2024-12-01'),
        price: 0,
        currency: 'PLN',
        requirements: []
      },
      delivery: [
        { type: 'online', platform: 'Custom LMS', requirements: ['Internet connection'] }
      ],
      interactive: true,
      mobileFriendly: true,
      offline: true,
      multiLanguage: ['en', 'pl'],
      tags: ['technical', 'fundamentals', 'beginner', 'free'],
      rating: 4.6,
      reviews: [],
      createdAt: new Date('2024-10-15'),
      lastUpdated: new Date('2024-10-25'),
      active: true,
      featured: false
    }
  ];

  const mockLiveClasses: LiveClass[] = [
    {
      id: 'live-1',
      title: 'Advanced Problem-Solving Workshop',
      description: 'Interactive workshop on complex problem-solving techniques',
      instructor: 'John Smith',
      date: new Date('2024-11-05T15:00:00'),
      duration: 120,
      type: 'workshop',
      attendees: ['user-1', 'user-2', 'user-3'],
      maxAttendees: 20,
      platform: 'Zoom',
      joinUrl: 'https://zoom.us/j/987654321',
      materials: [
        { id: 'live-m1', name: 'Workshop Materials', type: 'document', url: '/live/workshop-materials.pdf' }
      ],
      status: 'scheduled'
    },
    {
      id: 'live-2',
      title: 'Office Hours with Training Manager',
      description: 'Weekly Q&A session with the training team',
      instructor: 'Training Manager',
      date: new Date('2024-11-06T10:00:00'),
      duration: 60,
      type: 'office-hours',
      attendees: [],
      maxAttendees: 15,
      platform: 'Microsoft Teams',
      joinUrl: 'https://teams.microsoft.com/l/meetup/123456789',
      status: 'scheduled'
    }
  ];

  useEffect(() => {
    // Initialize data
  }, []);

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      'customer-service': 'text-blue-600',
      'technical': 'text-purple-600',
      'sales': 'text-green-600',
      'compliance': 'text-red-600',
      'leadership': 'text-yellow-600',
      'soft-skills': 'text-pink-600'
    };
    return colors[category] || 'text-gray-600';
  };

  const getLevelColor = (level: string) => {
    const colors: { [key: string]: string } = {
      'beginner': 'bg-green-100 text-green-800',
      'intermediate': 'bg-blue-100 text-blue-800',
      'advanced': 'bg-purple-100 text-purple-800',
      'expert': 'bg-red-100 text-red-800'
    };
    return colors[level] || 'bg-gray-100 text-gray-800';
  };

  const getTypeIcon = (type: string) => {
    const icons: { [key: string]: React.ComponentType<any> } = {
      'video': Video,
      'interactive': Activity,
      'live': Users,
      'self-paced': Clock,
      'blended': Grid,
      'workshop': MessageSquare
    };
    return icons[type] || FileText;
  };

  const handleCourseSelect = (course: TrainingCourse) => {
    setSelectedCourse(course);
    setActiveTab('course-view');
  };

  const handleLessonSelect = (lesson: Lesson) => {
    setSelectedLesson(lesson);
    setCurrentTime(0);
    setIsPlaying(false);
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = (time: number) => {
    setCurrentTime(time);
  };

  const handleBookmark = () => {
    const newBookmark: Bookmark = {
      id: `bookmark-${Date.now()}`,
      time: currentTime,
      note: notes
    };
    setBookmarks([...bookmarks, newBookmark]);
  };

  const filteredCourses = mockCourses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         course.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || course.category === selectedCategory;
    const matchesType = selectedType === 'all' || course.type === selectedType;
    const matchesLevel = selectedLevel === 'all' || course.level === selectedLevel;
    return matchesSearch && matchesCategory && matchesType && matchesLevel;
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
                <h1 className="text-3xl font-bold text-amber-900">Training Delivery System</h1>
                <p className="text-amber-600">Learning Management System with multimedia delivery</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-amber-50 rounded-lg p-2">
                <Button
                  variant={isFullscreen ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setIsFullscreen(!isFullscreen)}
                >
                  <Maximize2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowTranscript(!showTranscript)}
                >
                  <FileText className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowNotes(!showNotes)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </div>

              <Button className="bg-amber-600 hover:bg-amber-700">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-8 bg-gradient-to-r from-amber-100 to-orange-100 border border-amber-200">
            <TabsTrigger value="courses" className="data-[state=active]:bg-white data-[state=active]:shadow-md">
              <BookOpen className="h-4 w-4 mr-2" />
              Courses
            </TabsTrigger>
            <TabsTrigger value="learning-paths" className="data-[state=active]:bg-white data-[state=active]:shadow-md">
              <Target className="h-4 w-4 mr-2" />
              Learning Paths
            </TabsTrigger>
            <TabsTrigger value="live-classes" className="data-[state=active]:bg-white data-[state=active]:shadow-md">
              <Users className="h-4 w-4 mr-2" />
              Live Classes
            </TabsTrigger>
            <TabsTrigger value="schedule" className="data-[state=active]:bg-white data-[state=active]:shadow-md">
              <Calendar className="h-4 w-4 mr-2" />
              Schedule
            </TabsTrigger>
            <TabsTrigger value="progress" className="data-[state=active]:bg-white data-[state=active]:shadow-md">
              <TrendingUp className="h-4 w-4 mr-2" />
              Progress
            </TabsTrigger>
            <TabsTrigger value="certificates" className="data-[state=active]:bg-white data-[state=active]:shadow-md">
              <Award className="h-4 w-4 mr-2" />
              Certificates
            </TabsTrigger>
            <TabsTrigger value="resources" className="data-[state=active]:bg-white data-[state=active]:shadow-md">
              <FolderOpen className="h-4 w-4 mr-2" />
              Resources
            </TabsTrigger>
          </TabsList>

          {/* Courses Tab */}
          <TabsContent value="courses" className="space-y-6">
            {/* Filters and Search */}
            <Card className="border-amber-200 shadow-lg">
              <CardHeader>
                <CardTitle>Course Catalog</CardTitle>
                <CardDescription>Browse available training courses</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col lg:flex-row gap-4 mb-6">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-amber-500" />
                      <Input
                        placeholder="Search courses..."
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
                        <SelectItem value="all">All Categories</SelectItem>
                        <SelectItem value="customer-service">Customer Service</SelectItem>
                        <SelectItem value="technical">Technical</SelectItem>
                        <SelectItem value="sales">Sales</SelectItem>
                        <SelectItem value="compliance">Compliance</SelectItem>
                        <SelectItem value="leadership">Leadership</SelectItem>
                        <SelectItem value="soft-skills">Soft Skills</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={selectedType} onValueChange={setSelectedType}>
                      <SelectTrigger className="w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="video">Video</SelectItem>
                        <SelectItem value="interactive">Interactive</SelectItem>
                        <SelectItem value="live">Live</SelectItem>
                        <SelectItem value="self-paced">Self-Paced</SelectItem>
                        <SelectItem value="blended">Blended</SelectItem>
                        <SelectItem value="workshop">Workshop</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                      <SelectTrigger className="w-48">
                        <SelectValue />
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
                </div>

                {/* Course Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredCourses.map((course) => {
                    const TypeIcon = getTypeIcon(course.type);
                    return (
                      <Card key={course.id} className="border-amber-200 shadow-lg hover:shadow-xl transition-all cursor-pointer group">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2">
                              <TypeIcon className="h-5 w-5 text-amber-600" />
                              <Badge className={getLevelColor(course.level)}>
                                {course.level}
                              </Badge>
                            </div>
                            {course.featured && (
                              <Badge className="bg-yellow-100 text-yellow-800">
                                <Star className="h-3 w-3 mr-1" />
                                Featured
                              </Badge>
                            )}
                          </div>
                          <CardTitle className="text-lg text-amber-900 line-clamp-2">{course.title}</CardTitle>
                          <CardDescription className="line-clamp-2">{course.description}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div className="flex items-center justify-between text-sm">
                              <div className="flex items-center gap-2">
                                <div className={`w-3 h-3 rounded-full ${getCategoryColor(course.category)}`} />
                                <span className="text-amber-600 capitalize">{course.category}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-amber-600">{course.duration} min</span>
                                <span className="text-amber-600">•</span>
                                <span className="text-amber-600">{course.lessons.length} lessons</span>
                              </div>
                            </div>

                            {course.instructor && (
                              <div className="flex items-center gap-2">
                                <img
                                  src={course.instructor.avatar}
                                  alt={course.instructor.name}
                                  className="w-6 h-6 rounded-full"
                                />
                                <div>
                                  <p className="text-sm font-medium text-amber-900">{course.instructor.name}</p>
                                  <p className="text-xs text-amber-600">Rating: {course.instructor.rating}/5</p>
                                </div>
                              </div>
                            )}

                            <div className="flex items-center justify-between text-sm">
                              <div className="flex items-center gap-2 text-amber-500">
                                <Star className="h-4 w-4 fill-yellow-400" />
                                <span className="font-medium text-amber-900">{course.rating}</span>
                                <span className="text-amber-500">({course.reviews.length} reviews)</span>
                              </div>
                              <div className="flex items-center gap-2">
                                {course.mobileFriendly && (
                                  <div className="flex items-center gap-1 text-green-600">
                                    <Phone className="h-4 w-4" />
                                    <span className="text-xs">Mobile</span>
                                  </div>
                                )}
                                {course.offline && (
                                  <div className="flex items-center gap-1 text-blue-600">
                                    <Download className="h-4 w-4" />
                                    <span className="text-xs">Offline</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="flex flex-wrap gap-1">
                              {course.tags.slice(0, 3).map((tag) => (
                                <Badge key={tag} variant="secondary" className="text-xs">
                                  #{tag}
                                </Badge>
                              ))}
                            </div>

                            <div className="flex items-center justify-between">
                              <div className="text-sm text-amber-600">
                                {course.enrollment.enrolled}/{course.enrollment.capacity} enrolled
                              </div>
                              <Button
                                className="bg-amber-600 hover:bg-amber-700"
                                onClick={() => handleCourseSelect(course)}
                              >
                                {course.enrollment.enrolled >= course.enrollment.capacity ? 'Join Waitlist' : 'Enroll Now'}
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Course View */}
          {selectedCourse && (
            <div className="space-y-6">
              {/* Course Header */}
              <Card className="border-amber-200 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h1 className="text-2xl font-bold text-amber-900">{selectedCourse.title}</h1>
                        <Badge className={getLevelColor(selectedCourse.level)}>
                          {selectedCourse.level}
                        </Badge>
                        <Badge className={getCategoryColor(selectedCourse.category)}>
                          {selectedCourse.category}
                        </Badge>
                      </div>
                      <p className="text-amber-600 mb-4">{selectedCourse.description}</p>
                      <div className="flex items-center gap-6 text-sm text-amber-500">
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {selectedCourse.duration} minutes
                        </span>
                        <span className="flex items-center gap-1">
                          <BookOpen className="h-4 w-4" />
                          {selectedCourse.lessons.length} lessons
                        </span>
                        <span className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-yellow-400" />
                          {selectedCourse.rating}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Button className="bg-amber-600 hover:bg-amber-700">
                        <Play className="h-4 w-4 mr-2" />
                        Start Course
                      </Button>
                      <Button variant="outline">
                        <Bookmark className="h-4 w-4 mr-2" />
                        Bookmark
                      </Button>
                      <Button variant="outline">
                        <Share2 className="h-4 w-4 mr-2" />
                        Share
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Course Content */}
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-3">
                  {/* Video Player / Lesson Content */}
                  {selectedLesson ? (
                    <Card className="border-amber-200 shadow-lg">
                      <CardContent className="p-4">
                        <div className="bg-black rounded-lg aspect-video flex items-center justify-center">
                          <div className="text-center text-white">
                            <PlayCircle className="h-16 w-16 mx-auto mb-4" />
                            <p>Video Player</p>
                            <p className="text-sm opacity-75">Lesson: {selectedLesson.title}</p>
                          </div>
                        </div>

                        {/* Video Controls */}
                        <div className="mt-4 space-y-3">
                          <div className="flex items-center gap-4">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={handlePlayPause}
                            >
                              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                            </Button>
                            <div className="flex-1">
                              <Progress value={(currentTime / duration) * 100} />
                            </div>
                            <span className="text-sm text-amber-600">
                              {Math.floor(currentTime / 60)}:{(currentTime % 60).toString().padStart(2, '0')} /
                              {Math.floor(duration / 60)}:{(duration % 60).toString().padStart(2, '0')}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setVolume(volume === 0 ? 1 : 0)}
                            >
                              {volume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setIsFullscreen(!isFullscreen)}
                            >
                              <Maximize2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        {/* Lesson Navigation */}
                        <div className="space-y-3">
                          <h4 className="font-medium text-amber-900">Course Content</h4>
                          <div className="space-y-2">
                            {selectedCourse.lessons.map((lesson, index) => (
                              <div
                                key={lesson.id}
                                className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-amber-50 ${
                                  selectedLesson.id === lesson.id ? 'bg-amber-100' : ''
                                }`}
                                onClick={() => handleLessonSelect(lesson)}
                              >
                                <div className="w-8 h-8 bg-amber-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                                  {lesson.order + 1}
                                </div>
                                <div className="flex-1">
                                  <p className="font-medium text-amber-900">{lesson.title}</p>
                                  <p className="text-sm text-amber-600">{lesson.description}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <TypeIcon className="h-4 w-4 text-amber-500" />
                                  <span className="text-sm text-amber-500">{lesson.duration} min</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card className="border-amber-200 shadow-lg">
                      <CardContent className="p-6 text-center">
                        <BookOpen className="h-12 w-12 text-amber-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-amber-900 mb-2">Select a Lesson</h3>
                        <p className="text-amber-600">Choose a lesson from the course content to begin learning</p>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                  {/* Course Info */}
                  <Card className="border-amber-200">
                    <CardHeader>
                      <CardTitle className="text-lg text-amber-900">Course Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label>Instructor</Label>
                        {selectedCourse.instructor && (
                          <div className="flex items-center gap-3 mt-2">
                            <img
                              src={selectedCourse.instructor.avatar}
                              alt={selectedCourse.instructor.name}
                              className="w-10 h-10 rounded-full"
                            />
                            <div>
                              <p className="font-medium text-amber-900">{selectedCourse.instructor.name}</p>
                              <p className="text-sm text-amber-600">Rating: {selectedCourse.instructor.rating}/5</p>
                            </div>
                          </div>
                        )}
                      </div>
                      <div>
                        <Label>Duration</Label>
                        <p className="mt-2 text-sm text-amber-900">{selectedCourse.duration} minutes total</p>
                      </div>
                      <div>
                        <Label>Level</Label>
                        <p className="mt-2">
                          <Badge className={getLevelColor(selectedCourse.level)}>
                            {selectedCourse.level}
                          </Badge>
                        </p>
                      </div>
                      <div>
                        <Label>Format</Label>
                        <p className="mt-2 text-sm text-amber-900 capitalize">{selectedCourse.type}</p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Materials */}
                  {selectedCourse.materials.length > 0 && (
                    <Card className="border-amber-200">
                      <CardHeader>
                        <CardTitle className="text-lg text-amber-900">Materials</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {selectedCourse.materials.map((material) => (
                            <div key={material.id} className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
                              <div className="flex items-center gap-3">
                                <FileTextIcon className="h-4 w-4 text-amber-600" />
                                <div>
                                  <p className="font-medium text-amber-900">{material.name}</p>
                                  <p className="text-sm text-amber-600">{material.size}</p>
                                </div>
                              </div>
                              <Button size="sm" variant="outline">
                                <Download className="h-4 w-4 mr-2" />
                                {material.downloadable ? 'Download' : 'View'}
                              </Button>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Bookmarks */}
                  <Card className="border-amber-200">
                    <CardHeader>
                      <CardTitle className="text-lg text-amber-900">Bookmarks</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {bookmarks.length > 0 ? (
                          bookmarks.map((bookmark) => (
                            <div key={bookmark.id} className="flex items-center justify-between p-2 bg-amber-50 rounded-lg">
                              <div className="text-sm text-amber-900">
                                {Math.floor(bookmark.time / 60)}:{(bookmark.time % 60).toString().padStart(2, '0')}
                              </div>
                              <Button size="sm" variant="ghost">
                                <ChevronRight className="h-4 w-4" />
                              </Button>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-4">
                            <Bookmark className="h-8 w-8 text-amber-300 mx-auto mb-2" />
                            <p className="text-sm text-amber-600">No bookmarks yet</p>
                          </div>
                        )}
                        <Button
                          className="w-full mt-3"
                          variant="outline"
                          onClick={handleBookmark}
                        >
                          Add Bookmark
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Other Tabs */}
          <TabsContent value="learning-paths" className="space-y-6">
            <Card className="border-amber-200 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-amber-900">
                  <Target className="h-5 w-5 text-amber-600" />
                  Learning Paths
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Target className="h-12 w-12 text-amber-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-amber-900 mb-2">Structured Learning Journeys</h3>
                  <p className="text-amber-600">Curated paths to achieve specific goals</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="live-classes" className="space-y-6">
            <Card className="border-amber-200 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-amber-900">
                  <Users className="h-5 w-5 text-amber-600" />
                  Live Classes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockLiveClasses.map((liveClass) => (
                    <Card key={liveClass.id} className="border-amber-200 shadow-md">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold text-amber-900">{liveClass.title}</h3>
                            <p className="text-sm text-amber-600">{liveClass.description}</p>
                            <div className="flex items-center gap-3 mt-2 text-xs text-amber-500">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {liveClass.date.toLocaleDateString()}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {liveClass.duration} min
                              </span>
                              <span className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {liveClass.attendees.length}/{liveClass.maxAttendees}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className="bg-green-100 text-green-800">
                              {liveClass.status}
                            </Badge>
                            <Button size="sm" variant="outline">
                              <ExternalLink className="h-4 w-4 mr-2" />
                              Join Class
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

          {/* Other tabs content would go here */}
          <TabsContent value="schedule">
            <Card className="border-amber-200 shadow-lg">
              <CardContent className="text-center py-8">
                <Calendar className="h-12 w-12 text-amber-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-amber-900 mb-2">Training Schedule</h3>
                <p className="text-amber-600">Calendar view of upcoming sessions</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="progress">
            <Card className="border-amber-200 shadow-lg">
              <CardContent className="text-center py-8">
                <TrendingUp className="h-12 w-12 text-amber-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-amber-900 mb-2">Your Progress</h3>
                <p className="text-amber-600">Track your learning achievements</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="certificates">
            <Card className="border-amber-200 shadow-lg">
              <CardContent className="text-center py-8">
                <Award className="h-12 w-12 text-amber-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-amber-900 mb-2">Certificates</h3>
                <p className="text-amber-600">Your earned certifications</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="resources">
            <Card className="border-amber-200 shadow-lg">
              <CardContent className="text-center py-8">
                <FolderOpen className="h-12 w-12 text-amber-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-amber-900 mb-2">Resources</h3>
                <p className="text-amber-600">Additional learning materials</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default TrainingDeliverySystem;