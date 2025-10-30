import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useTranslation } from 'react-i18next';
import {
  Search,
  Filter,
  BookOpen,
  FileText,
  Video,
  MessageSquare,
  Phone,
  Mail,
  AlertTriangle,
  CheckCircle,
  Clock,
  User,
  Calendar,
  Tag,
  Hash,
  Star,
  Download,
  Share2,
  Printer,
  ChevronDown,
  ChevronRight,
  Eye,
  ThumbsUp,
  ThumbsDown,
  Bookmark,
  Link,
  ExternalLink,
  Zap,
  Shield,
  Heart,
  Settings,
  Users,
  MapPin,
  Globe,
  Languages,
  HeadphonesIcon,
  TrendingUp,
  Target,
  Award,
  Lightbulb,
  HelpCircle,
  AlertCircle,
  Info,
  CheckSquare,
  Square
} from 'lucide-react';

interface KnowledgeArticle {
  id: string;
  title: string;
  category: string;
  subcategory?: string;
  content: string;
  excerpt: string;
  tags: string[];
  author: string;
  lastUpdated: Date;
  createdAt: Date;
  viewCount: number;
  helpfulCount: number;
  notHelpfulCount: number;
  searchRank?: number;
  attachments?: Attachment[];
  relatedArticles?: string[];
  emergencyProcedure?: boolean;
  quickAccess?: boolean;
  difficulty: 'basic' | 'intermediate' | 'advanced';
  estimatedReadTime: number;
  lastReviewedBy?: string;
  complianceInfo?: ComplianceInfo;
  translations?: { [key: string]: TranslationInfo };
}

interface Attachment {
  id: string;
  name: string;
  type: 'pdf' | 'doc' | 'image' | 'video' | 'link';
  url: string;
  size: string;
}

interface ComplianceInfo {
  required: boolean;
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  lastReview: Date;
  nextReview: Date;
  approvedBy: string;
}

interface TranslationInfo {
  title: string;
  content: string;
  lastUpdated: Date;
  translator: string;
}

interface KnowledgeCategory {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  color: string;
  articleCount: number;
  subcategories?: KnowledgeSubcategory[];
  quickAccess?: boolean;
}

interface KnowledgeSubcategory {
  id: string;
  name: string;
  description: string;
  articleCount: number;
}

interface SearchFilters {
  category: string;
  difficulty: string;
  tags: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  author?: string;
  hasAttachments?: boolean;
  isEmergency?: boolean;
}

const StaffKnowledgeBase: React.FC = () => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedArticle, setSelectedArticle] = useState<KnowledgeArticle | null>(null);
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    category: 'all',
    difficulty: 'all',
    tags: []
  });
  const [showFilters, setShowFilters] = useState(false);
  const [bookmarkedArticles, setBookmarkedArticles] = useState<string[]>([]);
  const [helpfulVotes, setHelpfulVotes] = useState<{ [key: string]: boolean }>({});
  const [recentlyViewed, setRecentlyViewed] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState('browse');

  // Knowledge base categories
  const categories: KnowledgeCategory[] = [
    {
      id: 'procedures',
      name: 'Procedures & Workflows',
      description: 'Step-by-step guides for common tasks and processes',
      icon: FileText,
      color: 'text-blue-600',
      articleCount: 45,
      quickAccess: true,
      subcategories: [
        { id: 'booking', name: 'Booking Procedures', articleCount: 12 },
        { id: 'payment', name: 'Payment Processing', articleCount: 8 },
        { id: 'rescheduling', name: 'Rescheduling & Cancellations', articleCount: 10 },
        { id: 'refunds', name: 'Refunds & Compensation', articleCount: 6 },
        { id: 'verification', name: 'Identity Verification', articleCount: 9 }
      ]
    },
    {
      id: 'services',
      name: 'Service Knowledge',
      description: 'Detailed information about beauty and fitness services',
      icon: Heart,
      color: 'text-pink-600',
      articleCount: 38,
      quickAccess: true,
      subcategories: [
        { id: 'beauty-lips', name: 'Lip Enhancements', articleCount: 8 },
        { id: 'beauty-brows', name: 'Brow Services', articleCount: 7 },
        { id: 'fitness-glutes', name: 'Glute Programs', articleCount: 6 },
        { id: 'fitness-starter', name: 'Starter Programs', articleCount: 5 },
        { id: 'lifestyle', name: 'Lifestyle Services', articleCount: 12 }
      ]
    },
    {
      id: 'communication',
      name: 'Communication Standards',
      description: 'Templates, scripts, and communication guidelines',
      icon: MessageSquare,
      color: 'text-green-600',
      articleCount: 32,
      subcategories: [
        { id: 'phone-protocols', name: 'Phone Protocols', articleCount: 10 },
        { id: 'email-templates', name: 'Email Templates', articleCount: 12 },
        { id: 'chat-guidelines', name: 'Live Chat Guidelines', articleCount: 6 },
        { id: 'social-media', name: 'Social Media Responses', articleCount: 4 }
      ]
    },
    {
      id: 'technical',
      name: 'Technical Support',
      description: 'System guides and troubleshooting information',
      icon: Settings,
      color: 'text-purple-600',
      articleCount: 28,
      subcategories: [
        { id: 'booking-system', name: 'Booking System', articleCount: 8 },
        { id: 'payment-system', name: 'Payment System', articleCount: 6 },
        { id: 'crm-tools', name: 'CRM Tools', articleCount: 7 },
        { id: 'troubleshooting', name: 'Troubleshooting', articleCount: 7 }
      ]
    },
    {
      id: 'emergency',
      name: 'Emergency Procedures',
      description: 'Critical procedures for urgent situations',
      icon: AlertTriangle,
      color: 'text-red-600',
      articleCount: 15,
      quickAccess: true,
      subcategories: [
        { id: 'medical-emergency', name: 'Medical Emergencies', articleCount: 5 },
        { id: 'security-issues', name: 'Security Issues', articleCount: 4 },
        { id: 'system-outage', name: 'System Outages', articleCount: 3 },
        { id: 'crisis-pr', name: 'Crisis PR', articleCount: 3 }
      ]
    },
    {
      id: 'compliance',
      name: 'Compliance & Legal',
      description: 'Legal requirements and compliance procedures',
      icon: Shield,
      color: 'text-indigo-600',
      articleCount: 22,
      subcategories: [
        { id: 'gdpr', name: 'GDPR Compliance', articleCount: 8 },
        { id: 'data-protection', name: 'Data Protection', articleCount: 6 },
        { id: 'service-terms', name: 'Service Terms', articleCount: 5 },
        { id: 'legal-requirements', name: 'Legal Requirements', articleCount: 3 }
      ]
    },
    {
      id: 'quality',
      name: 'Quality Standards',
      description: 'Service quality metrics and improvement guidelines',
      icon: Award,
      color: 'text-yellow-600',
      articleCount: 18,
      subcategories: [
        { id: 'kpi-guidelines', name: 'KPI Guidelines', articleCount: 6 },
        { id: 'quality-metrics', name: 'Quality Metrics', articleCount: 5 },
        { id: 'improvement-processes', name: 'Improvement Processes', articleCount: 7 }
      ]
    },
    {
      id: 'training',
      name: 'Training Materials',
      description: 'Additional training resources and reference materials',
      icon: BookOpen,
      color: 'text-teal-600',
      articleCount: 25,
      subcategories: [
        { id: 'onboarding', name: 'Onboarding Materials', articleCount: 8 },
        { id: 'skill-development', name: 'Skill Development', articleCount: 9 },
        { id: 'best-practices', name: 'Best Practices', articleCount: 8 }
      ]
    }
  ];

  // Mock knowledge base articles
  const knowledgeArticles: KnowledgeArticle[] = [
    {
      id: 'complete-booking-procedure',
      title: 'Complete Booking Procedure Guide',
      category: 'procedures',
      subcategory: 'booking',
      content: `# Complete Booking Procedure Guide

## Overview
This guide covers the complete end-to-end booking process for beauty and fitness services.

## Step 1: Initial Client Contact
- **Greeting**: Always use the luxury service greeting script
- **Verification**: Verify client identity and VIP status
- **Needs Assessment**: Understand client requirements and preferences

## Step 2: Service Selection
- Present available options based on client needs
- Explain benefits and features of each service
- Provide pricing and duration information
- Check availability for requested dates

## Step 3: Booking Confirmation
- Collect all required information
- Confirm appointment details
- Send confirmation via preferred channel
- Set up reminders as needed

## Step 4: Pre-Appointment Preparation
- Send preparation instructions 24 hours prior
- Verify client contact information
- Prepare service area and materials

## Common Scenarios and Solutions

### VIP Client Booking
- Prioritize VIP clients in scheduling
- Offer premium appointment times
- Provide dedicated contact person
- Send personalized confirmations

### Last-Minute Bookings
- Check real-time availability
- Offer alternatives if fully booked
- Consider priority access for VIPs
- Document special circumstances

### Group Bookings
- Verify group size and requirements
- Check group discount eligibility
- Coordinate multiple service providers
- Confirm group logistics

## Quality Checks
- [ ] Client identity verified
- [ ] Service requirements confirmed
- [ ] Payment method validated
- [ ] Special needs noted
- [ ] Follow-up scheduled

## Related Articles
- Client Communication Standards
- Payment Processing Procedures
- VIP Service Protocols`,
      excerpt: 'Comprehensive step-by-step guide for handling all booking scenarios with luxury service standards.',
      tags: ['booking', 'procedures', 'vip', 'step-by-step'],
      author: 'Training Department',
      lastUpdated: new Date('2024-10-28'),
      createdAt: new Date('2024-09-15'),
      viewCount: 324,
      helpfulCount: 45,
      notHelpfulCount: 3,
      difficulty: 'basic',
      estimatedReadTime: 8,
      lastReviewedBy: 'Sarah Johnson',
      complianceInfo: {
        required: true,
        frequency: 'monthly',
        lastReview: new Date('2024-10-15'),
        nextReview: new Date('2024-11-15'),
        approvedBy: 'Head of Operations'
      },
      quickAccess: true,
      attachments: [
        {
          id: '1',
          name: 'Booking_Checklist.pdf',
          type: 'pdf',
          url: '/files/booking-checklist.pdf',
          size: '245 KB'
        }
      ],
      relatedArticles: ['vip-service-protocols', 'payment-procedures', 'client-communication']
    },
    {
      id: 'emergency-medical-procedure',
      title: 'Medical Emergency Response Protocol',
      category: 'emergency',
      subcategory: 'medical-emergency',
      content: `# Medical Emergency Response Protocol

## Immediate Actions
1. **Assess Situation**: Quickly evaluate the medical emergency
2. **Call Emergency Services**: Dial 112 immediately
3. **Provide First Aid**: Only if trained and safe to do so
4. **Notify Management**: Inform supervisor immediately

## Client Safety Procedures
- Clear the area around the affected client
- Ensure privacy and dignity
- Do not move the client unless necessary
- Stay with the client until help arrives

## Communication Protocol
- Inform emergency services of location and situation
- Contact client's emergency contact if available
- Document all actions taken
- Prepare incident report

## Post-Emergency Procedures
- Complete incident report within 24 hours
- Review and update procedures if needed
- Provide support to affected clients and staff
- Conduct debriefing session`,
      excerpt: 'Critical procedures for handling medical emergencies in the salon environment.',
      tags: ['emergency', 'medical', 'safety', 'critical'],
      author: 'Safety Officer',
      lastUpdated: new Date('2024-10-25'),
      createdAt: new Date('2024-08-20'),
      viewCount: 156,
      helpfulCount: 28,
      notHelpfulCount: 0,
      difficulty: 'basic',
      estimatedReadTime: 5,
      emergencyProcedure: true,
      quickAccess: true,
      complianceInfo: {
        required: true,
        frequency: 'quarterly',
        lastReview: new Date('2024-10-01'),
        nextReview: new Date('2025-01-01'),
        approvedBy: 'Safety Committee'
      }
    },
    {
      id: 'luxury-communication-standards',
      title: 'Luxury Communication Standards Guide',
      category: 'communication',
      subcategory: 'phone-protocols',
      content: `# Luxury Communication Standards

## Brand Voice Guidelines
- **Tone**: Elegant, professional, warm but not overly familiar
- **Language**: Clear, concise, avoid industry jargon
- **Pacing**: Speak slowly and clearly, allow for client questions
- **Empathy**: Always acknowledge client feelings and concerns

## Phone Communication Standards

### Opening Script
"Good morning/afternoon, thank you for calling [Salon Name]. My name is [Agent Name], how may I assist you today?"

### Active Listening Techniques
- Paraphrase client concerns to show understanding
- Use confirming statements ("I understand that...")
- Take notes while listening
- Avoid interrupting the client

### Problem Resolution Framework
1. **Acknowledge**: "I understand how frustrating that must be"
2. **Apologize**: "I apologize for the inconvenience"
3. **Assure**: "I'm here to help resolve this for you"
4. **Action**: "Let me look into that immediately"

### Closing Standards
- Summarize actions taken
- Confirm understanding
- Offer additional assistance
- Thank the client for their patience

## Written Communication Standards

### Email Templates
- Professional greeting and closing
- Clear subject lines
- Concise paragraphs
- Proper formatting and grammar

### Social Media Responses
- Maintain brand voice consistency
- Respond within 2 hours during business hours
- Move sensitive conversations to private channels
- Document all social media interactions

## VIP Communication Protocols
- Use client's preferred name and title
- Reference previous interactions when appropriate
- Offer priority service options
- Follow up personally on resolved issues`,
      excerpt: 'Complete guide to maintaining luxury service communication standards across all channels.',
      tags: ['communication', 'luxury', 'standards', 'vip'],
      author: 'Quality Assurance Team',
      lastUpdated: new Date('2024-10-26'),
      createdAt: new Date('2024-09-01'),
      viewCount: 512,
      helpfulCount: 67,
      notHelpfulCount: 5,
      difficulty: 'intermediate',
      estimatedReadTime: 12,
      lastReviewedBy: 'Communications Director',
      complianceInfo: {
        required: true,
        frequency: 'monthly',
        lastReview: new Date('2024-10-01'),
        nextReview: new Date('2024-11-01'),
        approvedBy: 'Communications Director'
      },
      attachments: [
        {
          id: '2',
          name: 'Communication_Templates.docx',
          type: 'doc',
          url: '/files/communication-templates.docx',
          size: '1.2 MB'
        },
        {
          id: '3',
          name: 'Phone_Script_Guide.pdf',
          type: 'pdf',
          url: '/files/phone-script-guide.pdf',
          size: '456 KB'
        }
      ]
    }
  ];

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'basic': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-blue-100 text-blue-800';
      case 'advanced': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryIcon = (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category?.icon || BookOpen;
  };

  const getCategoryColor = (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category?.color || 'text-gray-600';
  };

  const handleSearch = () => {
    // Implement search logic
    console.log('Searching for:', searchQuery);
  };

  const handleArticleView = (article: KnowledgeArticle) => {
    setSelectedArticle(article);
    setRecentlyViewed(prev => [article.id, ...prev.filter(id => id !== article.id)].slice(0, 10));
  };

  const handleBookmark = (articleId: string) => {
    setBookmarkedArticles(prev =>
      prev.includes(articleId)
        ? prev.filter(id => id !== articleId)
        : [...prev, articleId]
    );
  };

  const handleHelpfulVote = (articleId: string, helpful: boolean) => {
    setHelpfulVotes(prev => ({ ...prev, [articleId]: helpful }));
  };

  const filteredArticles = knowledgeArticles.filter(article => {
    const matchesSearch = searchQuery === '' ||
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = selectedCategory === 'all' || article.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const quickAccessArticles = knowledgeArticles.filter(article => article.quickAccess);
  const emergencyArticles = knowledgeArticles.filter(article => article.emergencyProcedure);

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50/30 via-orange-50/20 to-rose-50/30">
      {/* Header */}
      <div className="bg-white/90 backdrop-blur-md shadow-lg border-b border-amber-100">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <BookOpen className="h-8 w-8 text-amber-600" />
              <div>
                <h1 className="text-3xl font-bold text-amber-900">Staff Knowledge Base</h1>
                <p className="text-amber-600">Comprehensive resource center for support excellence</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Emergency Quick Access */}
              <Button
                variant="outline"
                className="border-red-300 text-red-700 hover:bg-red-50"
                onClick={() => setActiveTab('emergency')}
              >
                <AlertTriangle className="h-4 w-4 mr-2" />
                Emergency Procedures
              </Button>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-amber-500" />
                <Input
                  placeholder="Search knowledge base..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-10 w-80 border-amber-200"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Emergency Alert Bar */}
      {emergencyArticles.length > 0 && (
        <div className="bg-red-50 border-b border-red-200">
          <div className="max-w-7xl mx-auto px-6 py-3">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <span className="text-sm font-medium text-red-900">
                Emergency Procedures Available - Click the Emergency Procedures tab for critical information
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 bg-gradient-to-r from-amber-100 to-orange-100 border border-amber-200">
            <TabsTrigger value="browse" className="data-[state=active]:bg-white data-[state=active]:shadow-md">
              <BookOpen className="h-4 w-4 mr-2" />
              Browse
            </TabsTrigger>
            <TabsTrigger value="quick-access" className="data-[state=active]:bg-white data-[state=active]:shadow-md">
              <Zap className="h-4 w-4 mr-2" />
              Quick Access
            </TabsTrigger>
            <TabsTrigger value="emergency" className="data-[state=active]:bg-white data-[state=active]:shadow-md">
              <AlertTriangle className="h-4 w-4 mr-2" />
              Emergency
            </TabsTrigger>
            <TabsTrigger value="bookmarks" className="data-[state=active]:bg-white data-[state=active]:shadow-md">
              <Bookmark className="h-4 w-4 mr-2" />
              Bookmarks
            </TabsTrigger>
            <TabsTrigger value="recent" className="data-[state=active]:bg-white data-[state=active]:shadow-md">
              <Clock className="h-4 w-4 mr-2" />
              Recent
            </TabsTrigger>
            <TabsTrigger value="article-view" className="data-[state=active]:bg-white data-[state=active]:shadow-md">
              <FileText className="h-4 w-4 mr-2" />
              Article
            </TabsTrigger>
          </TabsList>

          {/* Browse Tab */}
          <TabsContent value="browse" className="space-y-6">
            {/* Categories Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {categories.map((category) => {
                const Icon = category.icon;
                return (
                  <Card
                    key={category.id}
                    className={`border-amber-200 shadow-lg hover:shadow-xl transition-all cursor-pointer ${
                      selectedCategory === category.id ? 'ring-2 ring-amber-400' : ''
                    }`}
                    onClick={() => setSelectedCategory(category.id === selectedCategory ? 'all' : category.id)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <Icon className={`h-8 w-8 ${category.color}`} />
                        {category.quickAccess && (
                          <Badge className="bg-amber-100 text-amber-800">
                            <Zap className="h-3 w-3 mr-1" />
                            Quick Access
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="text-lg text-amber-900">{category.name}</CardTitle>
                      <CardDescription>{category.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-amber-600">Articles</span>
                          <span className="font-medium text-amber-900">{category.articleCount}</span>
                        </div>

                        {category.subcategories && (
                          <div className="space-y-2">
                            {category.subcategories.slice(0, 3).map((subcategory) => (
                              <div key={subcategory.id} className="flex items-center justify-between text-xs">
                                <span className="text-amber-600">{subcategory.name}</span>
                                <span className="text-amber-500">{subcategory.articleCount}</span>
                              </div>
                            ))}
                            {category.subcategories.length > 3 && (
                              <div className="text-xs text-amber-500">
                                +{category.subcategories.length - 3} more subcategories
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Articles List */}
            {selectedCategory !== 'all' && (
              <Card className="border-amber-200 shadow-lg">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2 text-amber-900">
                        {React.createElement(getCategoryIcon(selectedCategory), {
                          className: `h-5 w-5 ${getCategoryColor(selectedCategory)}`
                        })}
                        {categories.find(cat => cat.id === selectedCategory)?.name}
                      </CardTitle>
                      <CardDescription>
                        {filteredArticles.length} articles found
                      </CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => setSelectedCategory('all')}
                    >
                      Clear Filter
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {filteredArticles.map((article) => (
                      <div
                        key={article.id}
                        className="border border-amber-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => handleArticleView(article)}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold text-amber-900">{article.title}</h3>
                              {article.emergencyProcedure && (
                                <Badge className="bg-red-100 text-red-800">
                                  <AlertTriangle className="h-3 w-3 mr-1" />
                                  Emergency
                                </Badge>
                              )}
                              {article.quickAccess && (
                                <Badge className="bg-amber-100 text-amber-800">
                                  <Zap className="h-3 w-3 mr-1" />
                                  Quick Access
                                </Badge>
                              )}
                              <Badge className={getDifficultyColor(article.difficulty)}>
                                {article.difficulty}
                              </Badge>
                            </div>
                            <p className="text-sm text-amber-600 mb-2">{article.excerpt}</p>
                            <div className="flex items-center gap-4 text-xs text-amber-500">
                              <span className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {article.author}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {article.lastUpdated.toLocaleDateString()}
                              </span>
                              <span className="flex items-center gap-1">
                                <Eye className="h-3 w-3" />
                                {article.viewCount} views
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {article.estimatedReadTime} min read
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleBookmark(article.id);
                              }}
                            >
                              <Bookmark className={`h-4 w-4 ${bookmarkedArticles.includes(article.id) ? 'fill-amber-600 text-amber-600' : 'text-gray-400'}`} />
                            </Button>
                            <ChevronRight className="h-4 w-4 text-amber-500" />
                          </div>
                        </div>

                        <div className="flex items-center gap-2 mt-3">
                          {article.tags.slice(0, 4).map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              #{tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Quick Access Tab */}
          <TabsContent value="quick-access" className="space-y-6">
            <Card className="border-amber-200 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-amber-900">
                  <Zap className="h-5 w-5 text-amber-600" />
                  Quick Access Articles
                </CardTitle>
                <CardDescription>
                  Essential articles and procedures for immediate reference
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {quickAccessArticles.map((article) => (
                    <Card key={article.id} className="border-amber-200 shadow-md hover:shadow-lg transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-center gap-2 mb-2">
                          {article.emergencyProcedure && (
                            <Badge className="bg-red-100 text-red-800">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Emergency
                            </Badge>
                          )}
                          <Badge className={getDifficultyColor(article.difficulty)}>
                            {article.difficulty}
                          </Badge>
                        </div>
                        <CardTitle className="text-lg text-amber-900">{article.title}</CardTitle>
                        <CardDescription>{article.excerpt}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 text-xs text-amber-500">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {article.estimatedReadTime} min
                            </span>
                            <span className="flex items-center gap-1">
                              <Eye className="h-3 w-3" />
                              {article.viewCount}
                            </span>
                          </div>
                          <Button
                            size="sm"
                            className="bg-amber-600 hover:bg-amber-700"
                            onClick={() => handleArticleView(article)}
                          >
                            Read Now
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Emergency Tab */}
          <TabsContent value="emergency" className="space-y-6">
            <Card className="border-red-200 shadow-lg bg-red-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-900">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                  Emergency Procedures
                </CardTitle>
                <CardDescription className="text-red-700">
                  Critical procedures for emergency situations - Review these regularly
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {emergencyArticles.map((article) => (
                    <Card key={article.id} className="border-red-200 shadow-md bg-white">
                      <CardHeader className="pb-3">
                        <div className="flex items-center gap-2">
                          <Badge className="bg-red-100 text-red-800">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            CRITICAL
                          </Badge>
                          <Badge className={getDifficultyColor(article.difficulty)}>
                            {article.difficulty}
                          </Badge>
                        </div>
                        <CardTitle className="text-lg text-red-900">{article.title}</CardTitle>
                        <CardDescription>{article.excerpt}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 text-xs text-red-600">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {article.estimatedReadTime} min read
                            </span>
                            {article.complianceInfo && (
                              <span className="flex items-center gap-1">
                                <Shield className="h-3 w-3" />
                                Required: {article.complianceInfo.frequency}
                              </span>
                            )}
                          </div>
                          <Button
                            size="sm"
                            className="bg-red-600 hover:bg-red-700 text-white"
                            onClick={() => handleArticleView(article)}
                          >
                            View Procedure
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Bookmarks Tab */}
          <TabsContent value="bookmarks" className="space-y-6">
            <Card className="border-amber-200 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-amber-900">
                  <Bookmark className="h-5 w-5 text-amber-600" />
                  Your Bookmarked Articles
                </CardTitle>
                <CardDescription>
                  Articles you've saved for quick reference
                </CardDescription>
              </CardHeader>
              <CardContent>
                {bookmarkedArticles.length > 0 ? (
                  <div className="space-y-4">
                    {knowledgeArticles
                      .filter(article => bookmarkedArticles.includes(article.id))
                      .map((article) => (
                        <div
                          key={article.id}
                          className="border border-amber-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                          onClick={() => handleArticleView(article)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="font-semibold text-amber-900 mb-1">{article.title}</h3>
                              <p className="text-sm text-amber-600 mb-2">{article.excerpt}</p>
                              <div className="flex items-center gap-3 text-xs text-amber-500">
                                <span>{article.category}</span>
                                <span>•</span>
                                <span>{article.lastUpdated.toLocaleDateString()}</span>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleBookmark(article.id);
                              }}
                            >
                              <Bookmark className="h-4 w-4 fill-amber-600 text-amber-600" />
                            </Button>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Bookmark className="h-12 w-12 text-amber-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-amber-900 mb-2">No bookmarked articles</h3>
                    <p className="text-amber-600">Bookmark articles you want to reference frequently</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Recent Tab */}
          <TabsContent value="recent" className="space-y-6">
            <Card className="border-amber-200 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-amber-900">
                  <Clock className="h-5 w-5 text-amber-600" />
                  Recently Viewed Articles
                </CardTitle>
                <CardDescription>
                  Articles you've viewed recently
                </CardDescription>
              </CardHeader>
              <CardContent>
                {recentlyViewed.length > 0 ? (
                  <div className="space-y-4">
                    {knowledgeArticles
                      .filter(article => recentlyViewed.includes(article.id))
                      .map((article) => (
                        <div
                          key={article.id}
                          className="border border-amber-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                          onClick={() => handleArticleView(article)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="font-semibold text-amber-900 mb-1">{article.title}</h3>
                              <p className="text-sm text-amber-600 mb-2">{article.excerpt}</p>
                              <div className="flex items-center gap-3 text-xs text-amber-500">
                                <span>{article.category}</span>
                                <span>•</span>
                                <span>Viewed recently</span>
                              </div>
                            </div>
                            <ChevronRight className="h-4 w-4 text-amber-500 mt-1" />
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Clock className="h-12 w-12 text-amber-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-amber-900 mb-2">No recent articles</h3>
                    <p className="text-amber-600">Articles you view will appear here</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Article View Tab */}
          <TabsContent value="article-view" className="space-y-6">
            {selectedArticle && (
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-3">
                  <Card className="border-amber-200 shadow-lg">
                    <CardHeader>
                      <div className="flex items-center justify-between mb-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setActiveTab('browse')}
                        >
                          <ChevronRight className="h-4 w-4 mr-1 rotate-180" />
                          Back to Browse
                        </Button>
                        <div className="flex items-center gap-2">
                          {selectedArticle.emergencyProcedure && (
                            <Badge className="bg-red-100 text-red-800">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Emergency Procedure
                            </Badge>
                          )}
                          {selectedArticle.quickAccess && (
                            <Badge className="bg-amber-100 text-amber-800">
                              <Zap className="h-3 w-3 mr-1" />
                              Quick Access
                            </Badge>
                          )}
                          <Badge className={getDifficultyColor(selectedArticle.difficulty)}>
                            {selectedArticle.difficulty}
                          </Badge>
                        </div>
                      </div>

                      <CardTitle className="text-2xl text-amber-900 mb-2">
                        {selectedArticle.title}
                      </CardTitle>

                      <div className="flex items-center gap-4 text-sm text-amber-600">
                        <span className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          {selectedArticle.author}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          Last updated: {selectedArticle.lastUpdated.toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {selectedArticle.estimatedReadTime} min read
                        </span>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-6">
                      {/* Compliance Info */}
                      {selectedArticle.complianceInfo && (
                        <Alert>
                          <Shield className="h-4 w-4" />
                          <AlertDescription>
                            <strong>Required Reading:</strong> This article must be reviewed {selectedArticle.complianceInfo.frequency}.
                            Last reviewed: {selectedArticle.complianceInfo.lastReview.toLocaleDateString()} by {selectedArticle.complianceInfo.approvedBy}.
                          </AlertDescription>
                        </Alert>
                      )}

                      {/* Article Content */}
                      <div className="prose max-w-none text-amber-800">
                        <div dangerouslySetInnerHTML={{ __html: selectedArticle.content.replace(/\n/g, '<br>') }} />
                      </div>

                      {/* Attachments */}
                      {selectedArticle.attachments && selectedArticle.attachments.length > 0 && (
                        <div className="space-y-3">
                          <h3 className="font-semibold text-amber-900">Attachments</h3>
                          <div className="space-y-2">
                            {selectedArticle.attachments.map((attachment) => (
                              <div key={attachment.id} className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
                                <div className="flex items-center gap-3">
                                  <FileText className="h-5 w-5 text-amber-600" />
                                  <div>
                                    <p className="font-medium text-amber-900">{attachment.name}</p>
                                    <p className="text-xs text-amber-600">{attachment.size}</p>
                                  </div>
                                </div>
                                <Button size="sm" variant="outline">
                                  <Download className="h-4 w-4 mr-2" />
                                  Download
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Tags */}
                      <div className="space-y-3">
                        <h3 className="font-semibold text-amber-900">Tags</h3>
                        <div className="flex flex-wrap gap-2">
                          {selectedArticle.tags.map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              #{tag}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {/* Feedback Section */}
                      <Separator />

                      <div className="space-y-4">
                        <h3 className="font-semibold text-amber-900">Was this article helpful?</h3>
                        <div className="flex items-center gap-4">
                          <Button
                            variant={helpfulVotes[selectedArticle.id] === true ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleHelpfulVote(selectedArticle.id, true)}
                            className="flex items-center gap-2"
                          >
                            <ThumbsUp className="h-4 w-4" />
                            Helpful ({selectedArticle.helpfulCount})
                          </Button>
                          <Button
                            variant={helpfulVotes[selectedArticle.id] === false ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleHelpfulVote(selectedArticle.id, false)}
                            className="flex items-center gap-2"
                          >
                            <ThumbsDown className="h-4 w-4" />
                            Not Helpful ({selectedArticle.notHelpfulCount})
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                  {/* Quick Actions */}
                  <Card className="border-amber-200">
                    <CardHeader>
                      <CardTitle className="text-lg text-amber-900">Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                        onClick={() => handleBookmark(selectedArticle.id)}
                      >
                        <Bookmark className={`h-4 w-4 mr-2 ${bookmarkedArticles.includes(selectedArticle.id) ? 'fill-amber-600 text-amber-600' : ''}`} />
                        {bookmarkedArticles.includes(selectedArticle.id) ? 'Bookmarked' : 'Bookmark'}
                      </Button>
                      <Button variant="outline" className="w-full justify-start">
                        <Share2 className="h-4 w-4 mr-2" />
                        Share
                      </Button>
                      <Button variant="outline" className="w-full justify-start">
                        <Printer className="h-4 w-4 mr-2" />
                        Print
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Related Articles */}
                  {selectedArticle.relatedArticles && selectedArticle.relatedArticles.length > 0 && (
                    <Card className="border-amber-200">
                      <CardHeader>
                        <CardTitle className="text-lg text-amber-900">Related Articles</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {selectedArticle.relatedArticles.map((relatedId) => {
                          const relatedArticle = knowledgeArticles.find(a => a.id === relatedId);
                          return relatedArticle ? (
                            <Button
                              key={relatedId}
                              variant="ghost"
                              className="w-full justify-start text-left h-auto p-3"
                              onClick={() => handleArticleView(relatedArticle)}
                            >
                              <div>
                                <p className="font-medium text-amber-900">{relatedArticle.title}</p>
                                <p className="text-xs text-amber-600">{relatedArticle.category}</p>
                              </div>
                            </Button>
                          ) : null;
                        })}
                      </CardContent>
                    </Card>
                  )}

                  {/* Article Info */}
                  <Card className="border-amber-200">
                    <CardHeader>
                      <CardTitle className="text-lg text-amber-900">Article Info</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-amber-600">Category</span>
                        <span className="font-medium text-amber-900 capitalize">{selectedArticle.category}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-amber-600">Views</span>
                        <span className="font-medium text-amber-900">{selectedArticle.viewCount}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-amber-600">Created</span>
                        <span className="font-medium text-amber-900">{selectedArticle.createdAt.toLocaleDateString()}</span>
                      </div>
                      {selectedArticle.lastReviewedBy && (
                        <div className="text-sm">
                          <span className="text-amber-600">Last reviewed by </span>
                          <span className="font-medium text-amber-900">{selectedArticle.lastReviewedBy}</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default StaffKnowledgeBase;