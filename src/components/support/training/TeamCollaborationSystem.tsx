import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Clock,
  MessageSquare,
  Users,
  BookOpen,
  Lightbulb,
  Award,
  Coffee,
  ThumbsUp,
  MessageCircle,
  Share2,
  Bell,
  Search,
  Filter,
  Plus,
  Send,
  Paperclip,
  Smile,
  MoreHorizontal,
  Star,
  TrendingUp,
  Calendar,
  Video,
  FileText,
  Link,
  Hash,
  AtSign,
  Eye,
  Reply,
  Forward,
  Flag,
  Bookmark,
  Download,
  Upload,
  Edit,
  Trash2,
  Check,
  X,
  AlertCircle,
  CheckCircle2,
  User,
  MapPin,
  Globe,
  Zap,
  Target,
  Brain,
  Heart,
  Trophy,
  Sparkles,
  Gift,
  PartyPopper,
  Crown
} from 'lucide-react';

// Types
interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  avatar?: string;
  status: 'online' | 'offline' | 'busy' | 'away';
  expertise: string[];
  level: 'junior' | 'senior' | 'expert' | 'master';
  joinDate: string;
  lastActive: string;
  timezone: string;
  languages: string[];
  badges: string[];
  stats: {
    contributions: number;
    helpedOthers: number;
    receivedThanks: number;
    knowledgeScore: number;
  };
}

interface Discussion {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  author: TeamMember;
  createdAt: string;
  updatedAt: string;
  replies: Reply[];
  views: number;
  likes: number;
  isPinned: boolean;
  isLocked: boolean;
  status: 'active' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  attachments: Attachment[];
  relatedTopics: string[];
  participants: string[];
}

interface Reply {
  id: string;
  content: string;
  author: TeamMember;
  createdAt: string;
  likes: number;
  isAnswer: boolean;
  attachments: Attachment[];
  replies?: Reply[];
}

interface KnowledgeShare {
  id: string;
  title: string;
  description: string;
  type: 'tip' | 'technique' | 'resource' | 'template' | 'tool';
  category: string;
  content: string;
  author: TeamMember;
  createdAt: string;
  tags: string[];
  rating: number;
  uses: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  estimatedTime: number;
  prerequisites: string[];
  outcomes: string[];
  attachments: Attachment[];
  reviews: Review[];
  featured: boolean;
}

interface TeamActivity {
  id: string;
  type: 'message' | 'mention' | 'like' | 'share' | 'achievement' | 'join' | 'milestone';
  actor: TeamMember;
  target?: string;
  content: string;
  createdAt: string;
  metadata?: Record<string, any>;
}

interface TeamChannel {
  id: string;
  name: string;
  description: string;
  type: 'public' | 'private' | 'direct';
  members: string[];
  unreadCount: number;
  lastMessage?: {
    content: string;
    author: string;
    timestamp: string;
  };
  isPinned: boolean;
  isMuted: boolean;
  category: 'general' | 'training' | 'support' | 'social' | 'projects';
  emoji?: string;
}

interface Message {
  id: string;
  content: string;
  author: TeamMember;
  channel: string;
  createdAt: string;
  reactions: Reaction[];
  replies: Message[];
  attachments: Attachment[];
  isEdited: boolean;
  editedAt?: string;
  threadId?: string;
}

interface Reaction {
  emoji: string;
  users: string[];
  count: number;
}

interface Attachment {
  id: string;
  name: string;
  type: 'image' | 'document' | 'video' | 'link' | 'file';
  url: string;
  size: number;
  uploadedBy: string;
  uploadedAt: string;
}

interface Review {
  id: string;
  rating: number;
  comment: string;
  reviewer: TeamMember;
  createdAt: string;
  helpful: number;
}

interface CollaborationStats {
  teamSize: number;
  activeMembers: number;
  discussionsToday: number;
  knowledgeShared: number;
  problemsSolved: number;
  avgResponseTime: number;
  engagementRate: number;
  topContributors: TeamMember[];
  trendingTopics: string[];
}

// Mock data
const mockTeamMembers: TeamMember[] = [
  {
    id: '1',
    name: 'Anna Kowalska',
    email: 'anna.kowalska@mariaborysevych.com',
    role: 'Senior Support Specialist',
    department: 'Customer Support',
    avatar: '/avatars/anna.jpg',
    status: 'online',
    expertise: ['VIP Client Relations', 'Beauty Services', 'Polish Language'],
    level: 'senior',
    joinDate: '2023-01-15',
    lastActive: '2024-01-15T10:30:00',
    timezone: 'Europe/Warsaw',
    languages: ['Polish', 'English', 'Russian'],
    badges: ['Top Contributor', 'Language Expert', 'VIP Certified'],
    stats: {
      contributions: 145,
      helpedOthers: 89,
      receivedThanks: 234,
      knowledgeScore: 92
    }
  },
  {
    id: '2',
    name: 'Piotr Wiśniewski',
    email: 'piotr.wisniewski@mariaborysevych.com',
    role: 'Training Coordinator',
    department: 'Training & Development',
    status: 'online',
    expertise: ['Training Systems', 'Quality Assurance', 'Process Improvement'],
    level: 'expert',
    joinDate: '2022-06-01',
    lastActive: '2024-01-15T10:25:00',
    timezone: 'Europe/Warsaw',
    languages: ['Polish', 'English'],
    badges: ['Training Expert', 'Quality Champion', 'Process Master'],
    stats: {
      contributions: 203,
      helpedOthers: 156,
      receivedThanks: 312,
      knowledgeScore: 95
    }
  },
  {
    id: '3',
    name: 'Maria Nowak',
    email: 'maria.nowak@mariaborysevych.com',
    role: 'Beauty Expert',
    department: 'Service Delivery',
    status: 'busy',
    expertise: ['Beauty Treatments', 'Client Consultation', 'Aftercare Support'],
    level: 'master',
    joinDate: '2021-03-10',
    lastActive: '2024-01-15T10:15:00',
    timezone: 'Europe/Warsaw',
    languages: ['Polish', 'English', 'Italian'],
    badges: ['Beauty Master', 'Client Expert', 'Top Performer'],
    stats: {
      contributions: 178,
      helpedOthers: 145,
      receivedThanks: 298,
      knowledgeScore: 98
    }
  },
  {
    id: '4',
    name: 'Katarzyna Dąbrowska',
    email: 'katarzyna.dabrowska@mariaborysevych.com',
    role: 'Support Specialist',
    department: 'Customer Support',
    status: 'away',
    expertise: ['General Support', 'Booking Systems', 'Multilingual Support'],
    level: 'intermediate',
    joinDate: '2023-08-20',
    lastActive: '2024-01-15T09:45:00',
    timezone: 'Europe/Warsaw',
    languages: ['Polish', 'English', 'Spanish'],
    badges: ['Rising Star', 'Helper'],
    stats: {
      contributions: 67,
      helpedOthers: 34,
      receivedThanks: 89,
      knowledgeScore: 78
    }
  },
  {
    id: '5',
    name: 'Tomasz Lewandowski',
    email: 'tomasz.lewandowski@mariaborysevych.com',
    role: 'Fitness Consultant',
    department: 'Service Delivery',
    status: 'offline',
    expertise: ['Fitness Programs', 'Training Plans', 'Client Assessment'],
    level: 'senior',
    joinDate: '2022-11-15',
    lastActive: '2024-01-15T08:30:00',
    timezone: 'Europe/Warsaw',
    languages: ['Polish', 'English', 'German'],
    badges: ['Fitness Expert', 'Client Success', 'Innovator'],
    stats: {
      contributions: 134,
      helpedOthers: 98,
      receivedThanks: 187,
      knowledgeScore: 88
    }
  }
];

const mockDiscussions: Discussion[] = [
  {
    id: '1',
    title: 'Best practices for handling VIP client complaints',
    content: 'I wanted to share our team\'s approach to handling VIP client complaints that has resulted in a 95% satisfaction rate...',
    category: 'Customer Support',
    tags: ['VIP', 'complaints', 'best practices', 'customer satisfaction'],
    author: mockTeamMembers[0],
    createdAt: '2024-01-15T09:00:00',
    updatedAt: '2024-01-15T10:30:00',
    replies: [
      {
        id: '1',
        content: 'Great insights Anna! I particularly like the proactive follow-up approach.',
        author: mockTeamMembers[1],
        createdAt: '2024-01-15T09:15:00',
        likes: 5,
        isAnswer: false,
        attachments: []
      },
      {
        id: '2',
        content: 'We\'ve implemented similar practices and saw a 40% reduction in escalation cases.',
        author: mockTeamMembers[2],
        createdAt: '2024-01-15T09:45:00',
        likes: 8,
        isAnswer: true,
        attachments: []
      }
    ],
    views: 156,
    likes: 23,
    isPinned: true,
    isLocked: false,
    status: 'active',
    priority: 'high',
    attachments: [],
    relatedTopics: ['customer retention', 'service recovery', 'client relations'],
    participants: ['1', '2', '3']
  },
  {
    id: '2',
    title: 'Tips for explaining complex beauty procedures to clients',
    content: 'How do you effectively explain complex beauty procedures to clients who have no technical background?',
    category: 'Beauty Services',
    tags: ['beauty', 'communication', 'client education', 'procedures'],
    author: mockTeamMembers[3],
    createdAt: '2024-01-14T14:30:00',
    updatedAt: '2024-01-15T08:00:00',
    replies: [
      {
        id: '3',
        content: 'I use analogies and visual aids to help clients understand better.',
        author: mockTeamMembers[2],
        createdAt: '2024-01-14T15:00:00',
        likes: 12,
        isAnswer: false,
        attachments: []
      }
    ],
    views: 89,
    likes: 15,
    isPinned: false,
    isLocked: false,
    status: 'active',
    priority: 'medium',
    attachments: [],
    relatedTopics: ['client communication', 'education', 'consultation skills'],
    participants: ['3', '4']
  }
];

const mockKnowledgeShares: KnowledgeShare[] = [
  {
    id: '1',
    title: 'Effective client consultation framework',
    description: 'A step-by-step framework for conducting thorough client consultations',
    type: 'technique',
    category: 'Client Management',
    content: 'This framework covers everything from initial greeting to follow-up procedures...',
    author: mockTeamMembers[2],
    createdAt: '2024-01-10T11:00:00',
    tags: ['consultation', 'framework', 'client management', 'best practices'],
    rating: 4.8,
    uses: 45,
    difficulty: 'intermediate',
    estimatedTime: 15,
    prerequisites: ['Basic client communication skills'],
    outcomes: ['Improved consultation quality', 'Better client satisfaction', 'Increased conversion'],
    attachments: [
      {
        id: '1',
        name: 'consultation-checklist.pdf',
        type: 'document',
        url: '/files/consultation-checklist.pdf',
        size: 245678,
        uploadedBy: '3',
        uploadedAt: '2024-01-10T11:00:00'
      }
    ],
    reviews: [
      {
        id: '1',
        rating: 5,
        comment: 'Excellent framework! Very practical and easy to implement.',
        reviewer: mockTeamMembers[0],
        createdAt: '2024-01-11T09:30:00',
        helpful: 12
      }
    ],
    featured: true
  },
  {
    id: '2',
    title: 'Quick Polish phrases for beauty consultations',
    description: 'Essential Polish phrases for working with Polish-speaking clients',
    type: 'resource',
    category: 'Language Support',
    content: 'A collection of key Polish phrases specifically for beauty consultations...',
    author: mockTeamMembers[0],
    createdAt: '2024-01-12T16:00:00',
    tags: ['Polish', 'language', 'phrases', 'consultation', 'multilingual'],
    rating: 4.9,
    uses: 67,
    difficulty: 'beginner',
    estimatedTime: 10,
    prerequisites: ['Basic Polish pronunciation'],
    outcomes: ['Better communication with Polish clients', 'Improved service quality'],
    attachments: [],
    reviews: [],
    featured: false
  }
];

const mockChannels: TeamChannel[] = [
  {
    id: '1',
    name: 'general',
    description: 'General team discussions and announcements',
    type: 'public',
    members: ['1', '2', '3', '4', '5'],
    unreadCount: 3,
    lastMessage: {
      content: 'Welcome to our new team member Katarzyna! 🎉',
      author: '2',
      timestamp: '2024-01-15T09:00:00'
    },
    isPinned: true,
    isMuted: false,
    category: 'general',
    emoji: '💬'
  },
  {
    id: '2',
    name: 'training-tips',
    description: 'Share training tips and best practices',
    type: 'public',
    members: ['1', '2', '3', '4', '5'],
    unreadCount: 7,
    lastMessage: {
      content: 'Check out the new VIP handling techniques I shared!',
      author: '3',
      timestamp: '2024-01-15T08:30:00'
    },
    isPinned: false,
    isMuted: false,
    category: 'training',
    emoji: '📚'
  },
  {
    id: '3',
    name: 'support-cases',
    description: 'Discuss challenging support cases',
    type: 'public',
    members: ['1', '3', '4'],
    unreadCount: 2,
    lastMessage: {
      content: 'Had an interesting case with a VIP client today...',
      author: '1',
      timestamp: '2024-01-14T16:45:00'
    },
    isPinned: false,
    isMuted: false,
    category: 'support',
    emoji: '🎯'
  }
];

const mockActivities: TeamActivity[] = [
  {
    id: '1',
    type: 'achievement',
    actor: mockTeamMembers[2],
    content: 'earned the "Knowledge Master" badge',
    createdAt: '2024-01-15T10:00:00',
    metadata: { badge: 'Knowledge Master', points: 100 }
  },
  {
    id: '2',
    type: 'share',
    actor: mockTeamMembers[1],
    content: 'shared a new training resource',
    createdAt: '2024-01-15T09:30:00',
    metadata: { resource: 'VIP Client Handling Guide', category: 'training' }
  },
  {
    id: '3',
    type: 'message',
    actor: mockTeamMembers[0],
    content: 'replied to "Best practices for VIP clients"',
    createdAt: '2024-01-15T09:15:00',
    metadata: { discussion: 'Best practices for VIP clients' }
  }
];

const mockStats: CollaborationStats = {
  teamSize: 5,
  activeMembers: 4,
  discussionsToday: 8,
  knowledgeShared: 12,
  problemsSolved: 6,
  avgResponseTime: 15,
  engagementRate: 87,
  topContributors: mockTeamMembers.slice(0, 3),
  trendingTopics: ['VIP handling', 'Polish language support', 'beauty consultations', 'training techniques']
};

export function TeamCollaborationSystem() {
  const [activeTab, setActiveTab] = useState('team');
  const [selectedChannel, setSelectedChannel] = useState(mockChannels[0]);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isCreateDiscussionOpen, setIsCreateDiscussionOpen] = useState(false);
  const [isCreateKnowledgeOpen, setIsCreateKnowledgeOpen] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [selectedDiscussion, setSelectedDiscussion] = useState<Discussion | null>(null);
  const [selectedKnowledge, setSelectedKnowledge] = useState<KnowledgeShare | null>(null);

  // Filter functions
  const filteredDiscussions = mockDiscussions.filter(discussion => {
    const matchesSearch = discussion.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         discussion.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         discussion.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || discussion.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const filteredKnowledge = mockKnowledgeShares.filter(knowledge => {
    const matchesSearch = knowledge.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         knowledge.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         knowledge.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || knowledge.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const onlineMembers = mockTeamMembers.filter(member => member.status === 'online');
  const categories = ['all', ...Array.from(new Set([...mockDiscussions.map(d => d.category), ...mockKnowledgeShares.map(k => k.category)]))];

  // Action handlers
  const handleSendMessage = () => {
    if (newMessage.trim()) {
      // In a real implementation, this would send the message
      console.log('Sending message:', newMessage);
      setNewMessage('');
    }
  };

  const handleCreateDiscussion = (discussionData: any) => {
    // In a real implementation, this would create the discussion
    console.log('Creating discussion:', discussionData);
    setIsCreateDiscussionOpen(false);
  };

  const handleCreateKnowledge = (knowledgeData: any) => {
    // In a real implementation, this would create the knowledge share
    console.log('Creating knowledge share:', knowledgeData);
    setIsCreateKnowledgeOpen(false);
  };

  const handleReply = (discussionId: string) => {
    if (replyContent.trim()) {
      // In a real implementation, this would add the reply
      console.log('Replying to discussion:', discussionId, replyContent);
      setReplyContent('');
    }
  };

  const handleLikeDiscussion = (discussionId: string) => {
    // In a real implementation, this would like the discussion
    console.log('Liking discussion:', discussionId);
  };

  const handleLikeReply = (replyId: string) => {
    // In a real implementation, this would like the reply
    console.log('Liking reply:', replyId);
  };

  const handleRateKnowledge = (knowledgeId: string, rating: number) => {
    // In a real implementation, this would rate the knowledge
    console.log('Rating knowledge:', knowledgeId, rating);
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'busy': return 'bg-red-500';
      case 'away': return 'bg-yellow-500';
      default: return 'bg-gray-400';
    }
  };

  // Get level color
  const getLevelColor = (level: string) => {
    switch (level) {
      case 'master': return 'bg-purple-100 text-purple-800';
      case 'expert': return 'bg-blue-100 text-blue-800';
      case 'senior': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Format time
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Team Collaboration</h1>
          <p className="text-gray-600 mt-2">Connect, share knowledge, and grow together</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <div className="flex -space-x-2">
              {onlineMembers.slice(0, 4).map((member, index) => (
                <Avatar key={member.id} className="h-8 w-8 border-2 border-white">
                  <AvatarImage src={member.avatar} />
                  <AvatarFallback>{member.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                </Avatar>
              ))}
            </div>
            <span>{onlineMembers.length} online</span>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Post
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Team Members</p>
                <p className="text-2xl font-bold text-gray-900">{mockStats.teamSize}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
            <p className="text-xs text-green-600 mt-2">{mockStats.activeMembers} active today</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Discussions</p>
                <p className="text-2xl font-bold text-gray-900">{mockStats.discussionsToday}</p>
              </div>
              <MessageSquare className="h-8 w-8 text-green-500" />
            </div>
            <p className="text-xs text-gray-600 mt-2">Today</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Knowledge Shared</p>
                <p className="text-2xl font-bold text-gray-900">{mockStats.knowledgeShared}</p>
              </div>
              <Lightbulb className="h-8 w-8 text-yellow-500" />
            </div>
            <p className="text-xs text-gray-600 mt-2">This week</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Engagement</p>
                <p className="text-2xl font-bold text-gray-900">{mockStats.engagementRate}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-500" />
            </div>
            <p className="text-xs text-green-600 mt-2">+5% from last week</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="team" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Team
          </TabsTrigger>
          <TabsTrigger value="discussions" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Discussions
          </TabsTrigger>
          <TabsTrigger value="knowledge" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Knowledge
          </TabsTrigger>
          <TabsTrigger value="chat" className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4" />
            Chat
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Activity
          </TabsTrigger>
        </TabsList>

        {/* Team Tab */}
        <TabsContent value="team" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Team Members */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Team Members</CardTitle>
                <CardDescription>Connect with your team members and see their expertise</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockTeamMembers.map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={member.avatar} />
                            <AvatarFallback>{member.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                          </Avatar>
                          <div className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white ${getStatusColor(member.status)}`} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{member.name}</h4>
                            <Badge className={getLevelColor(member.level)}>{member.level}</Badge>
                          </div>
                          <p className="text-sm text-gray-600">{member.role}</p>
                          <div className="flex items-center gap-4 mt-1">
                            <span className="text-xs text-gray-500">
                              <MapPin className="h-3 w-3 inline mr-1" />
                              {member.timezone}
                            </span>
                            <span className="text-xs text-gray-500">
                              <Globe className="h-3 w-3 inline mr-1" />
                              {member.languages.join(', ')}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <p className="text-sm font-medium">{member.stats.knowledgeScore}</p>
                          <p className="text-xs text-gray-500">Knowledge Score</p>
                        </div>
                        <Button variant="outline" size="sm">
                          <MessageCircle className="h-4 w-4 mr-2" />
                          Message
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Top Contributors */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  Top Contributors
                </CardTitle>
                <CardDescription>This week's most active team members</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockStats.topContributors.map((member, index) => (
                    <div key={member.id} className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-r from-yellow-400 to-yellow-600 text-white font-bold text-sm">
                        {index + 1}
                      </div>
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={member.avatar} />
                        <AvatarFallback>{member.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h5 className="font-medium text-sm">{member.name}</h5>
                        <p className="text-xs text-gray-600">{member.stats.contributions} contributions</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{member.stats.knowledgeScore}</p>
                        <p className="text-xs text-gray-500">points</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Team Expertise */}
          <Card>
            <CardHeader>
              <CardTitle>Team Expertise & Skills</CardTitle>
              <CardDescription>Discover team members with specific skills and expertise</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {['VIP Client Relations', 'Beauty Services', 'Polish Language', 'Training Systems', 'Quality Assurance', 'Client Consultation', 'Multilingual Support', 'Fitness Programs'].map((skill) => (
                  <div key={skill} className="p-3 border rounded-lg">
                    <h5 className="font-medium text-sm mb-2">{skill}</h5>
                    <div className="flex -space-x-2">
                      {mockTeamMembers
                        .filter(member => member.expertise.includes(skill))
                        .slice(0, 3)
                        .map((member) => (
                          <TooltipProvider key={member.id}>
                            <Tooltip>
                              <TooltipTrigger>
                                <Avatar className="h-8 w-8 border-2 border-white">
                                  <AvatarImage src={member.avatar} />
                                  <AvatarFallback className="text-xs">{member.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                                </Avatar>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{member.name}</p>
                                <p className="text-xs text-gray-500">{member.level}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Discussions Tab */}
        <TabsContent value="discussions" className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search discussions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category === 'all' ? 'All Categories' : category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Dialog open={isCreateDiscussionOpen} onOpenChange={setIsCreateDiscussionOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  New Discussion
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create New Discussion</DialogTitle>
                  <DialogDescription>Start a new discussion with the team</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <Input placeholder="Discussion title" />
                  <Textarea placeholder="What would you like to discuss?" rows={4} />
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Customer Support">Customer Support</SelectItem>
                      <SelectItem value="Beauty Services">Beauty Services</SelectItem>
                      <SelectItem value="Training">Training</SelectItem>
                      <SelectItem value="General">General</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input placeholder="Tags (comma separated)" />
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateDiscussionOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateDiscussion}>
                    Create Discussion
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Discussion List */}
            <div className="lg:col-span-2 space-y-4">
              {filteredDiscussions.map((discussion) => (
                <Card key={discussion.id} className={`hover:shadow-md transition-shadow ${discussion.isPinned ? 'border-blue-200 bg-blue-50' : ''}`}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {discussion.isPinned && <Pin className="h-4 w-4 text-blue-500" />}
                          <h3 className="font-semibold text-lg hover:text-blue-600 cursor-pointer"
                              onClick={() => setSelectedDiscussion(discussion)}>
                            {discussion.title}
                          </h3>
                          <Badge variant={discussion.priority === 'high' ? 'destructive' :
                                        discussion.priority === 'medium' ? 'default' : 'secondary'}>
                            {discussion.priority}
                          </Badge>
                        </div>
                        <p className="text-gray-600 mb-3 line-clamp-2">{discussion.content}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={discussion.author.avatar} />
                              <AvatarFallback className="text-xs">{discussion.author.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                            </Avatar>
                            <span>{discussion.author.name}</span>
                          </div>
                          <span>{formatTime(discussion.createdAt)}</span>
                          <span>•</span>
                          <span>{discussion.replies.length} replies</span>
                          <span>•</span>
                          <span>{discussion.views} views</span>
                        </div>
                        <div className="flex items-center gap-2 mt-3">
                          {discussion.tags.map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              #{tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-4 pt-4 border-t">
                      <Button variant="ghost" size="sm" onClick={() => handleLikeDiscussion(discussion.id)}>
                        <ThumbsUp className="h-4 w-4 mr-2" />
                        {discussion.likes}
                      </Button>
                      <Button variant="ghost" size="sm">
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Reply
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Share2 className="h-4 w-4 mr-2" />
                        Share
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Bookmark className="h-4 w-4 mr-2" />
                        Save
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Trending Topics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                  Trending Topics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockStats.trendingTopics.map((topic, index) => (
                    <div key={topic} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100 text-green-600 font-bold text-sm">
                          {index + 1}
                        </div>
                        <span className="font-medium text-sm">{topic}</span>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {Math.floor(Math.random() * 20) + 5} posts
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Knowledge Tab */}
        <TabsContent value="knowledge" className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search knowledge base..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category === 'all' ? 'All Categories' : category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Dialog open={isCreateKnowledgeOpen} onOpenChange={setIsCreateKnowledgeOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Share Knowledge
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Share Knowledge</DialogTitle>
                  <DialogDescription>Share your expertise with the team</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <Input placeholder="Title" />
                  <Textarea placeholder="Describe your knowledge share..." rows={3} />
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tip">Quick Tip</SelectItem>
                      <SelectItem value="technique">Technique</SelectItem>
                      <SelectItem value="resource">Resource</SelectItem>
                      <SelectItem value="template">Template</SelectItem>
                      <SelectItem value="tool">Tool</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Client Management">Client Management</SelectItem>
                      <SelectItem value="Language Support">Language Support</SelectItem>
                      <SelectItem value="Technical Skills">Technical Skills</SelectItem>
                      <SelectItem value="Best Practices">Best Practices</SelectItem>
                    </SelectContent>
                  </Select>
                  <Textarea placeholder="Detailed content..." rows={6} />
                  <Input placeholder="Tags (comma separated)" />
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateKnowledgeOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateKnowledge}>
                    Share Knowledge
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredKnowledge.map((knowledge) => (
              <Card key={knowledge.id} className={`hover:shadow-md transition-shadow ${knowledge.featured ? 'border-yellow-200 bg-yellow-50' : ''}`}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{knowledge.type}</Badge>
                      {knowledge.featured && <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />}
                    </div>
                    <Badge className={getLevelColor(knowledge.difficulty)}>
                      {knowledge.difficulty}
                    </Badge>
                  </div>

                  <h3 className="font-semibold text-lg mb-2">{knowledge.title}</h3>
                  <p className="text-gray-600 mb-4 line-clamp-2">{knowledge.description}</p>

                  <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                    <div className="flex items-center gap-1">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={knowledge.author.avatar} />
                        <AvatarFallback className="text-xs">{knowledge.author.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      <span>{knowledge.author.name}</span>
                    </div>
                    <span>{formatTime(knowledge.createdAt)}</span>
                    <span>•</span>
                    <span>{knowledge.estimatedTime} min read</span>
                  </div>

                  <div className="flex items-center gap-2 mb-4">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                      <span className="text-sm font-medium">{knowledge.rating}</span>
                    </div>
                    <span className="text-sm text-gray-500">({knowledge.reviews.length} reviews)</span>
                    <span className="text-sm text-gray-500">•</span>
                    <span className="text-sm text-gray-500">{knowledge.uses} uses</span>
                  </div>

                  <div className="flex items-center gap-2 mb-4">
                    {knowledge.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        #{tag}
                      </Badge>
                    ))}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => setSelectedKnowledge(knowledge)}>
                      <BookOpen className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleRateKnowledge(knowledge.id, 5)}>
                      <ThumbsUp className="h-4 w-4 mr-2" />
                      Helpful
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Share2 className="h-4 w-4 mr-2" />
                      Share
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Chat Tab */}
        <TabsContent value="chat" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Channels List */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle>Channels</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {mockChannels.map((channel) => (
                    <div
                      key={channel.id}
                      className={`p-3 rounded-lg cursor-pointer transition-colors ${
                        selectedChannel.id === channel.id
                          ? 'bg-blue-100 text-blue-800'
                          : 'hover:bg-gray-100'
                      }`}
                      onClick={() => setSelectedChannel(channel)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span>{channel.emoji}</span>
                          <span className="font-medium text-sm">{channel.name}</span>
                        </div>
                        {channel.unreadCount > 0 && (
                          <Badge variant="destructive" className="text-xs">
                            {channel.unreadCount}
                          </Badge>
                        )}
                      </div>
                      {channel.lastMessage && (
                        <p className="text-xs text-gray-600 mt-1 truncate">
                          {channel.lastMessage.content}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Chat Area */}
            <Card className="lg:col-span-3">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{selectedChannel.emoji}</span>
                    <div>
                      <CardTitle className="text-lg">{selectedChannel.name}</CardTitle>
                      <CardDescription>{selectedChannel.description}</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm">
                      <Search className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Users className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-96 flex flex-col">
                  {/* Messages */}
                  <ScrollArea className="flex-1 mb-4">
                    <div className="space-y-4">
                      <div className="text-center text-sm text-gray-500 py-2">
                        Today
                      </div>

                      <div className="flex items-start gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src="/avatars/piotr.jpg" />
                          <AvatarFallback>PW</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm">Piotr Wiśniewski</span>
                            <span className="text-xs text-gray-500">9:00 AM</span>
                          </div>
                          <div className="bg-gray-100 rounded-lg p-3">
                            <p className="text-sm">Welcome to our new team member Katarzyna! 🎉</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src="/avatars/katarzyna.jpg" />
                          <AvatarFallback>KD</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm">Katarzyna Dąbrowska</span>
                            <span className="text-xs text-gray-500">9:15 AM</span>
                          </div>
                          <div className="bg-blue-100 rounded-lg p-3">
                            <p className="text-sm">Thank you everyone! I'm excited to be part of the team 🌟</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </ScrollArea>

                  {/* Message Input */}
                  <div className="border-t pt-4">
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm">
                        <Paperclip className="h-4 w-4" />
                      </Button>
                      <Input
                        placeholder="Type your message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                        className="flex-1"
                      />
                      <Button variant="ghost" size="sm">
                        <Smile className="h-4 w-4" />
                      </Button>
                      <Button onClick={handleSendMessage} size="sm">
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Stay updated with the latest team activities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockActivities.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-4 p-4 border rounded-lg">
                    <div className="flex-shrink-0">
                      {activity.type === 'achievement' && <Trophy className="h-6 w-6 text-yellow-500" />}
                      {activity.type === 'share' && <Share2 className="h-6 w-6 text-blue-500" />}
                      {activity.type === 'message' && <MessageCircle className="h-6 w-6 text-green-500" />}
                      {activity.type === 'like' && <ThumbsUp className="h-6 w-6 text-purple-500" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={activity.actor.avatar} />
                          <AvatarFallback className="text-xs">{activity.actor.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium text-sm">{activity.actor.name}</span>
                        <span className="text-sm text-gray-600">{activity.content}</span>
                      </div>
                      <p className="text-xs text-gray-500">{formatTime(activity.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Discussion Detail Modal */}
      {selectedDiscussion && (
        <Dialog open={!!selectedDiscussion} onOpenChange={() => setSelectedDiscussion(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedDiscussion.title}</DialogTitle>
              <DialogDescription>
                {selectedDiscussion.category} • {formatTime(selectedDiscussion.createdAt)}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Original Post */}
              <div className="flex items-start gap-4">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={selectedDiscussion.author.avatar} />
                  <AvatarFallback>{selectedDiscussion.author.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-medium">{selectedDiscussion.author.name}</h4>
                    <Badge className={getLevelColor(selectedDiscussion.author.level)}>
                      {selectedDiscussion.author.level}
                    </Badge>
                  </div>
                  <p className="text-gray-700 mb-4">{selectedDiscussion.content}</p>
                  <div className="flex items-center gap-2 mb-4">
                    {selectedDiscussion.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => handleLikeDiscussion(selectedDiscussion.id)}>
                      <ThumbsUp className="h-4 w-4 mr-2" />
                      {selectedDiscussion.likes}
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Share2 className="h-4 w-4 mr-2" />
                      Share
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Bookmark className="h-4 w-4 mr-2" />
                      Save
                    </Button>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Replies */}
              <div className="space-y-4">
                <h4 className="font-medium">Replies ({selectedDiscussion.replies.length})</h4>
                {selectedDiscussion.replies.map((reply) => (
                  <div key={reply.id} className="flex items-start gap-4">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={reply.author.avatar} />
                      <AvatarFallback className="text-xs">{reply.author.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h5 className="font-medium text-sm">{reply.author.name}</h5>
                        <span className="text-xs text-gray-500">{formatTime(reply.createdAt)}</span>
                        {reply.isAnswer && <Badge variant="default" className="text-xs">Best Answer</Badge>}
                      </div>
                      <p className="text-gray-700 text-sm mb-2">{reply.content}</p>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleLikeReply(reply.id)}>
                          <ThumbsUp className="h-3 w-3 mr-1" />
                          {reply.likes}
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Reply className="h-3 w-3 mr-1" />
                          Reply
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <Separator />

              {/* Add Reply */}
              <div className="space-y-4">
                <h4 className="font-medium">Add Reply</h4>
                <Textarea
                  placeholder="Share your thoughts..."
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  rows={4}
                />
                <div className="flex items-center gap-2">
                  <Button onClick={() => handleReply(selectedDiscussion.id)}>
                    <Send className="h-4 w-4 mr-2" />
                    Post Reply
                  </Button>
                  <Button variant="outline">
                    <Paperclip className="h-4 w-4 mr-2" />
                    Attach File
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Knowledge Detail Modal */}
      {selectedKnowledge && (
        <Dialog open={!!selectedKnowledge} onOpenChange={() => setSelectedKnowledge(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedKnowledge.title}</DialogTitle>
              <DialogDescription>
                Shared by {selectedKnowledge.author.name} • {formatTime(selectedKnowledge.createdAt)}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Knowledge Info */}
              <div className="flex items-center gap-4">
                <Badge variant="outline">{selectedKnowledge.type}</Badge>
                <Badge className={getLevelColor(selectedKnowledge.difficulty)}>
                  {selectedKnowledge.difficulty}
                </Badge>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm">{selectedKnowledge.estimatedTime} min read</span>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                  <span className="text-sm font-medium">{selectedKnowledge.rating}</span>
                  <span className="text-sm text-gray-500">({selectedKnowledge.reviews.length} reviews)</span>
                </div>
              </div>

              {/* Description */}
              <div>
                <h4 className="font-medium mb-2">Description</h4>
                <p className="text-gray-700">{selectedKnowledge.description}</p>
              </div>

              {/* Content */}
              <div>
                <h4 className="font-medium mb-2">Content</h4>
                <div className="prose prose-sm max-w-none">
                  <p className="text-gray-700">{selectedKnowledge.content}</p>
                </div>
              </div>

              {/* Tags */}
              <div>
                <h4 className="font-medium mb-2">Tags</h4>
                <div className="flex items-center gap-2">
                  {selectedKnowledge.tags.map((tag) => (
                    <Badge key={tag} variant="outline">
                      #{tag}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Prerequisites */}
              {selectedKnowledge.prerequisites.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Prerequisites</h4>
                  <ul className="list-disc list-inside text-sm text-gray-700">
                    {selectedKnowledge.prerequisites.map((prereq, index) => (
                      <li key={index}>{prereq}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Outcomes */}
              {selectedKnowledge.outcomes.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Learning Outcomes</h4>
                  <ul className="list-disc list-inside text-sm text-gray-700">
                    {selectedKnowledge.outcomes.map((outcome, index) => (
                      <li key={index}>{outcome}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Attachments */}
              {selectedKnowledge.attachments.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Attachments</h4>
                  <div className="space-y-2">
                    {selectedKnowledge.attachments.map((attachment) => (
                      <div key={attachment.id} className="flex items-center gap-3 p-3 border rounded-lg">
                        <FileText className="h-5 w-5 text-blue-500" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">{attachment.name}</p>
                          <p className="text-xs text-gray-500">{(attachment.size / 1024).toFixed(1)} KB</p>
                        </div>
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2 pt-4 border-t">
                <Button onClick={() => handleRateKnowledge(selectedKnowledge.id, 5)}>
                  <ThumbsUp className="h-4 w-4 mr-2" />
                  Mark as Helpful
                </Button>
                <Button variant="outline">
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
                <Button variant="outline">
                  <Bookmark className="h-4 w-4 mr-2" />
                  Save
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}