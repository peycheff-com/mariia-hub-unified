import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { useTranslation } from 'react-i18next';
import {
  Search,
  Filter,
  Download,
  Upload,
  Calendar,
  Clock,
  User,
  FileText,
  Settings,
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  Edit,
  Trash2,
  Save,
  RefreshCw,
  Play,
  Pause,
  Flag,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Phone,
  Mail,
  HeadphonesIcon,
  Printer,
  Share2,
  Bookmark,
  ChevronRight,
  ChevronDown,
  ExternalLink,
  FileSearch,
  FilterIcon,
  Zap,
  Users,
  Timer,
  Clipboard,
  CheckSquare,
  AlertCircle,
  Info,
  Lightbulb,
  BookOpen,
  GraduationCap,
  Award,
  Target,
  TrendingUp,
  BarChart3,
  Activity,
  Star,
  Lock,
  Unlock,
  Globe,
  Languages,
  MapPin,
  Camera,
  Video,
  Image,
  File,
  Folder,
  FolderOpen,
  Archive,
  Hash,
  Tag,
  List,
  Grid
} from 'lucide-react';

interface SOPDocument {
  id: string;
  title: string;
  description: string;
  category: string;
  subcategory?: string;
  version: string;
  status: 'draft' | 'review' | 'approved' | 'archived' | 'deprecated';
  priority: 'low' | 'medium' | 'high' | 'critical';
  type: 'procedure' | 'policy' | 'guideline' | 'checklist' | 'flowchart' | 'manual';
  content: SOPContent[];
  author: string;
  reviewers: string[];
  approvedBy?: string;
  createdAt: Date;
  lastUpdated: Date;
  nextReviewDate: Date;
  effectiveDate?: Date;
  expiryDate?: Date;
  tags: string[];
  attachments: SOPAttachment[];
  relatedDocuments: string[];
  complianceRequirements: ComplianceRequirement[];
  emergencyProcedures?: EmergencyProcedure[];
  qualityChecks: QualityCheck[];
  metrics: SOPMetrics;
  accessibility: {
    language: string[];
    formats: string[];
    features: string[];
  };
}

interface SOPContent {
  id: string;
  type: 'section' | 'step' | 'checklist' | 'flowchart' | 'table' | 'image' | 'video';
  title: string;
  content: any;
  order: number;
  required: boolean;
  estimatedTime?: number;
  dependencies?: string[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

interface SOPAttachment {
  id: string;
  name: string;
  type: 'pdf' | 'doc' | 'image' | 'video' | 'spreadsheet' | 'presentation';
  url: string;
  size: string;
  description: string;
  required: boolean;
}

interface ComplianceRequirement {
  id: string;
  type: 'legal' | 'regulatory' | 'industry' | 'internal';
  name: string;
  description: string;
  authority: string;
  reference: string;
  mandatory: boolean;
  lastVerified: Date;
}

interface EmergencyProcedure {
  id: string;
  title: string;
  description: string;
  triggers: string[];
  immediateActions: string[];
  contacts: EmergencyContact[];
  escalationLevel: number;
}

interface EmergencyContact {
  name: string;
  role: string;
  phone: string;
  email: string;
  priority: number;
}

interface QualityCheck {
  id: string;
  name: string;
  description: string;
  type: 'automated' | 'manual' | 'peer-review';
  frequency: 'once' | 'daily' | 'weekly' | 'monthly' | 'quarterly';
  responsible: string;
  criteria: string[];
}

interface SOPMetrics {
  views: number;
  downloads: number;
  shares: number;
  lastAccessed: Date;
  averageRating: number;
  totalRatings: number;
  feedbackCount: number;
  completionRate: number;
  errorReports: number;
}

interface SOPCategory {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  color: string;
  documentCount: number;
  subcategories: SOPSubcategory[];
  required: boolean;
}

interface SOPSubcategory {
  id: string;
  name: string;
  description: string;
  documentCount: number;
}

interface SOPVersion {
  id: string;
  documentId: string;
  version: string;
  changes: string[];
  author: string;
  date: Date;
  approved: boolean;
}

interface SOPTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  structure: SOPContent[];
  requiredSections: string[];
  qualityChecks: QualityCheck[];
}

const SOPDocumentationSystem: React.FC = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('browse');
  const [selectedDocument, setSelectedDocument] = useState<SOPDocument | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [bookmarkedDocuments, setBookmarkedDocuments] = useState<string[]>([]);
  const [documentFeedback, setDocumentFeedback] = useState<{ [key: string]: number }>({});

  // Mock data
  const sopCategories: SOPCategory[] = [
    {
      id: 'operations',
      name: 'Operations Procedures',
      description: 'Core operational processes and workflows',
      icon: Settings,
      color: 'text-blue-600',
      documentCount: 25,
      required: true,
      subcategories: [
        { id: 'booking', name: 'Booking Management', documentCount: 8 },
        { id: 'payment', name: 'Payment Processing', documentCount: 6 },
        { id: 'scheduling', name: 'Scheduling Procedures', documentCount: 5 },
        { id: 'inventory', name: 'Inventory Management', documentCount: 6 }
      ]
    },
    {
      id: 'customer-service',
      name: 'Customer Service Standards',
      description: 'Customer interaction and service delivery standards',
      icon: Users,
      color: 'text-green-600',
      documentCount: 18,
      required: true,
      subcategories: [
        { id: 'communication', name: 'Communication Standards', documentCount: 7 },
        { id: 'escalation', name: 'Escalation Procedures', documentCount: 4 },
        { id: 'complaints', name: 'Complaint Handling', documentCount: 4 },
        { id: 'feedback', name: 'Feedback Management', documentCount: 3 }
      ]
    },
    {
      id: 'emergency',
      name: 'Emergency Procedures',
      description: 'Critical emergency response procedures',
      icon: AlertTriangle,
      color: 'text-red-600',
      documentCount: 12,
      required: true,
      subcategories: [
        { id: 'medical', name: 'Medical Emergencies', documentCount: 4 },
        { id: 'security', name: 'Security Incidents', documentCount: 3 },
        { id: 'system', name: 'System Failures', documentCount: 3 },
        { id: 'facility', name: 'Facility Issues', documentCount: 2 }
      ]
    },
    {
      id: 'compliance',
      name: 'Compliance & Legal',
      description: 'Regulatory compliance and legal requirements',
      icon: Shield,
      color: 'text-purple-600',
      documentCount: 15,
      required: true,
      subcategories: [
        { id: 'gdpr', name: 'GDPR Compliance', documentCount: 5 },
        { id: 'health-safety', name: 'Health & Safety', documentCount: 4 },
        { id: 'data-protection', name: 'Data Protection', documentCount: 3 },
        { id: 'licenses', name: 'Licenses & Permits', documentCount: 3 }
      ]
    },
    {
      id: 'quality',
      name: 'Quality Assurance',
      description: 'Quality standards and assurance procedures',
      icon: Award,
      color: 'text-yellow-600',
      documentCount: 10,
      required: false,
      subcategories: [
        { id: 'standards', name: 'Quality Standards', documentCount: 4 },
        { id: 'audits', name: 'Audit Procedures', documentCount: 3 },
        { id: 'improvement', name: 'Continuous Improvement', documentCount: 3 }
      ]
    },
    {
      id: 'training',
      name: 'Training & Development',
      description: 'Training procedures and development programs',
      icon: GraduationCap,
      color: 'text-indigo-600',
      documentCount: 8,
      required: false,
      subcategories: [
        { id: 'onboarding', name: 'Onboarding Procedures', documentCount: 3 },
        { id: 'skills', name: 'Skills Development', documentCount: 3 },
        { id: 'assessment', name: 'Assessment Procedures', documentCount: 2 }
      ]
    }
  ];

  const mockSOPDocuments: SOPDocument[] = [
    {
      id: 'booking-complete-procedure',
      title: 'Complete Booking Procedure',
      description: 'End-to-end process for handling customer bookings from initial contact to confirmation',
      category: 'operations',
      subcategory: 'booking',
      version: '2.1',
      status: 'approved',
      priority: 'high',
      type: 'procedure',
      content: [
        {
          id: '1',
          type: 'section',
          title: '1. Initial Customer Contact',
          content: {
            steps: [
              'Greet customer using luxury service standards',
              'Verify customer identity and VIP status',
              'Understand service requirements and preferences',
              'Check availability for requested dates'
            ],
            notes: 'Always maintain brand voice and luxury positioning'
          },
          order: 1,
          required: true,
          riskLevel: 'low'
        },
        {
          id: '2',
          type: 'checklist',
          title: '2. Booking Information Collection',
          content: {
            items: [
              { id: '1', text: 'Customer full name and contact information', required: true },
              { id: '2', text: 'Service type and specific requirements', required: true },
              { id: '3', text: 'Preferred date and time options', required: true },
              { id: '4', text: 'Special accommodations or needs', required: false },
              { id: '5', text: 'Payment method and billing details', required: true }
            ]
          },
          order: 2,
          required: true,
          riskLevel: 'medium'
        }
      ],
      author: 'Operations Team',
      reviewers: ['Jane Smith', 'John Doe'],
      approvedBy: 'Sarah Wilson',
      createdAt: new Date('2024-09-15'),
      lastUpdated: new Date('2024-10-20'),
      nextReviewDate: new Date('2025-01-20'),
      effectiveDate: new Date('2024-10-25'),
      tags: ['booking', 'customer-service', 'essential'],
      attachments: [
        {
          id: '1',
          name: 'Booking_Checklist.pdf',
          type: 'pdf',
          url: '/files/booking-checklist.pdf',
          size: '245 KB',
          description: 'Comprehensive booking checklist for daily use',
          required: true
        }
      ],
      relatedDocuments: ['payment-processing-sop', 'customer-communication-standards'],
      complianceRequirements: [
        {
          id: '1',
          type: 'legal',
          name: 'Consumer Protection Act',
          description: 'Ensure compliance with consumer booking regulations',
          authority: 'Office of Consumer Protection',
          reference: 'CPA-2024-001',
          mandatory: true,
          lastVerified: new Date('2024-10-15')
        }
      ],
      qualityChecks: [
        {
          id: '1',
          name: 'Data Accuracy Check',
          description: 'Verify all customer information is accurate and complete',
          type: 'manual',
          frequency: 'once',
          responsible: 'Booking Agent',
          criteria: ['All required fields completed', 'Contact information verified', 'Service details confirmed']
        }
      ],
      metrics: {
        views: 145,
        downloads: 23,
        shares: 8,
        lastAccessed: new Date('2024-10-28'),
        averageRating: 4.7,
        totalRatings: 12,
        feedbackCount: 3,
        completionRate: 95,
        errorReports: 0
      },
      accessibility: {
        language: ['en', 'pl'],
        formats: ['web', 'pdf', 'mobile'],
        features: ['searchable', 'printable', 'offline-access']
      }
    },
    {
      id: 'emergency-medical-response',
      title: 'Medical Emergency Response Procedure',
      description: 'Critical procedures for handling medical emergencies in the salon environment',
      category: 'emergency',
      subcategory: 'medical',
      version: '1.3',
      status: 'approved',
      priority: 'critical',
      type: 'procedure',
      content: [
        {
          id: '1',
          type: 'section',
          title: 'IMMEDIATE RESPONSE',
          content: {
            steps: [
              'Assess the situation quickly and safely',
              'Call emergency services (112) immediately',
              'Provide first aid only if trained and safe',
              'Clear the area around the affected person'
            ]
          },
          order: 1,
          required: true,
          riskLevel: 'critical'
        }
      ],
      author: 'Safety Officer',
      reviewers: ['Health & Safety Committee'],
      approvedBy: 'Medical Director',
      createdAt: new Date('2024-08-20'),
      lastUpdated: new Date('2024-10-15'),
      nextReviewDate: new Date('2024-12-15'),
      tags: ['emergency', 'medical', 'critical', 'safety'],
      attachments: [
        {
          id: '1',
          name: 'Emergency_Contacts_Poster.pdf',
          type: 'pdf',
          url: '/files/emergency-contacts.pdf',
          size: '1.2 MB',
          description: 'Emergency contact information poster for display',
          required: true
        }
      ],
      relatedDocuments: ['first-aid-procedures', 'emergency-communication-plan'],
      complianceRequirements: [
        {
          id: '1',
          type: 'regulatory',
          name: 'Health & Safety Regulations',
          description: 'Compliance with workplace health and safety requirements',
          authority: 'Health & Safety Executive',
          reference: 'HSE-2024-015',
          mandatory: true,
          lastVerified: new Date('2024-10-01')
        }
      ],
      emergencyProcedures: [
        {
          id: '1',
          title: 'Medical Emergency',
          description: 'Any medical emergency requiring immediate attention',
          triggers: ['Fainting', 'Breathing difficulties', 'Chest pain', 'Severe bleeding', 'Allergic reaction'],
          immediateActions: [
            'Call 112 immediately',
            'Assess breathing and consciousness',
            'Start CPR if trained and necessary',
            'Stay with the person until help arrives'
          ],
          contacts: [
            { name: 'Emergency Services', role: 'Medical Emergency', phone: '112', email: 'emergency@gov.pl', priority: 1 },
            { name: 'On-site First Aider', role: 'First Aid', phone: '+48 123 456 789', email: 'firstaid@company.com', priority: 2 }
          ],
          escalationLevel: 1
        }
      ],
      qualityChecks: [
        {
          id: '1',
          name: 'Emergency Response Drill',
          description: 'Quarterly emergency response simulation',
          type: 'manual',
          frequency: 'quarterly',
          responsible: 'Safety Officer',
          criteria: ['Response time under 2 minutes', 'Correct procedure followed', 'Communication clear']
        }
      ],
      metrics: {
        views: 89,
        downloads: 45,
        shares: 12,
        lastAccessed: new Date('2024-10-27'),
        averageRating: 4.9,
        totalRatings: 8,
        feedbackCount: 2,
        completionRate: 100,
        errorReports: 0
      },
      accessibility: {
        language: ['en', 'pl'],
        formats: ['web', 'pdf', 'mobile', 'print'],
        features: ['searchable', 'printable', 'offline-access', 'emergency-quick-access']
      }
    },
    {
      id: 'luxury-communication-standards',
      title: 'Luxury Communication Standards Guide',
      description: 'Comprehensive guide for maintaining luxury service communication across all channels',
      category: 'customer-service',
      subcategory: 'communication',
      version: '3.0',
      status: 'approved',
      priority: 'high',
      type: 'guideline',
      content: [
        {
          id: '1',
          type: 'section',
          title: 'Brand Voice Guidelines',
          content: {
            principles: [
              'Maintain elegant, professional tone',
              'Use warm but not overly familiar language',
              'Always show empathy and understanding',
              'Be concise yet thorough in responses'
            ]
          },
          order: 1,
          required: true,
          riskLevel: 'medium'
        }
      ],
      author: 'Communications Team',
      reviewers: ['Marketing Director', 'Customer Experience Manager'],
      approvedBy: 'Brand Director',
      createdAt: new Date('2024-09-01'),
      lastUpdated: new Date('2024-10-10'),
      nextReviewDate: new Date('2025-01-10'),
      tags: ['communication', 'luxury', 'standards', 'brand'],
      attachments: [
        {
          id: '1',
          name: 'Communication_Templates.docx',
          type: 'doc',
          url: '/files/communication-templates.docx',
          size: '1.5 MB',
          description: 'Collection of approved communication templates',
          required: true
        },
        {
          id: '2',
          name: 'Brand_Voice_Guide.pdf',
          type: 'pdf',
          url: '/files/brand-voice.pdf',
          size: '3.2 MB',
          description: 'Complete brand voice and tone guidelines',
          required: true
        }
      ],
      relatedDocuments: ['phone-standards', 'email-guidelines', 'social-media-protocols'],
      complianceRequirements: [
        {
          id: '1',
          type: 'internal',
          name: 'Brand Standards Compliance',
          description: 'Adherence to company brand standards',
          authority: 'Brand Department',
          reference: 'BS-2024-008',
          mandatory: true,
          lastVerified: new Date('2024-10-05')
        }
      ],
      qualityChecks: [
        {
          id: '1',
          name: 'Communication Quality Review',
          description: 'Monthly review of communications against standards',
          type: 'peer-review',
          frequency: 'monthly',
          responsible: 'Quality Assurance Team',
          criteria: ['Brand voice consistency', 'Grammar and spelling', 'Tone appropriateness', 'Client satisfaction']
        }
      ],
      metrics: {
        views: 234,
        downloads: 67,
        shares: 34,
        lastAccessed: new Date('2024-10-28'),
        averageRating: 4.8,
        totalRatings: 18,
        feedbackCount: 5,
        completionRate: 92,
        errorReports: 1
      },
      accessibility: {
        language: ['en', 'pl'],
        formats: ['web', 'pdf', 'mobile'],
        features: ['searchable', 'printable', 'templates-available']
      }
    }
  ];

  const sopVersions: SOPVersion[] = [
    {
      id: 'v1',
      documentId: 'booking-complete-procedure',
      version: '1.0',
      changes: ['Initial version created', 'Basic booking steps outlined'],
      author: 'Operations Team',
      date: new Date('2024-05-15'),
      approved: true
    },
    {
      id: 'v2',
      documentId: 'booking-complete-procedure',
      version: '2.0',
      changes: ['Added VIP booking procedures', 'Updated payment handling steps', 'Added quality checks'],
      author: 'Operations Team',
      date: new Date('2024-08-20'),
      approved: true
    },
    {
      id: 'v3',
      documentId: 'booking-complete-procedure',
      version: '2.1',
      changes: ['Updated compliance requirements', 'Added new checklist items', 'Improved flow clarity'],
      author: 'Operations Team',
      date: new Date('2024-10-20'),
      approved: true
    }
  ];

  useEffect(() => {
    // Initialize data
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'review': return 'bg-blue-100 text-blue-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'archived': return 'bg-amber-100 text-amber-800';
      case 'deprecated': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'procedure': return FileText;
      case 'policy': return Shield;
      case 'guideline': return BookOpen;
      case 'checklist': return CheckSquare;
      case 'flowchart': return Users;
      case 'manual': return Folder;
      default: return FileText;
    }
  };

  const handleBookmark = (documentId: string) => {
    setBookmarkedDocuments(prev =>
      prev.includes(documentId)
        ? prev.filter(id => id !== documentId)
        : [...prev, documentId]
    );
  };

  const handleRating = (documentId: string, rating: number) => {
    setDocumentFeedback(prev => ({ ...prev, [documentId]: rating }));
  };

  const filteredDocuments = mockSOPDocuments.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         doc.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         doc.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || doc.category === selectedCategory;
    const matchesStatus = filterStatus === 'all' || doc.status === filterStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50/30 via-orange-50/20 to-rose-50/30">
      {/* Header */}
      <div className="bg-white/90 backdrop-blur-md shadow-lg border-b border-amber-100">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <FileText className="h-8 w-8 text-amber-600" />
              <div>
                <h1 className="text-3xl font-bold text-amber-900">SOP Documentation System</h1>
                <p className="text-amber-600">Standard Operating Procedures & Documentation Management</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                className="border-red-300 text-red-700 hover:bg-red-50"
              >
                <AlertTriangle className="h-4 w-4 mr-2" />
                Emergency SOPs
              </Button>

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

              <Button className="bg-amber-600 hover:bg-amber-700">
                <FileText className="h-4 w-4 mr-2" />
                Create SOP
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Critical Alert Banner */}
      <div className="bg-red-50 border-b border-red-200">
        <div className="max-w-7xl mx-auto px-6 py-3">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <span className="text-sm font-medium text-red-900">
              3 Critical SOPs require attention • Next review: Medical Emergency Response (Due in 5 days)
            </span>
            <Button size="sm" variant="outline" className="border-red-300 text-red-700 hover:bg-red-50">
              View Details
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 bg-gradient-to-r from-amber-100 to-orange-100 border border-amber-200">
            <TabsTrigger value="browse" className="data-[state=active]:bg-white data-[state=active]:shadow-md">
              <FileSearch className="h-4 w-4 mr-2" />
              Browse
            </TabsTrigger>
            <TabsTrigger value="categories" className="data-[state=active]:bg-white data-[state=active]:shadow-md">
              <Folder className="h-4 w-4 mr-2" />
              Categories
            </TabsTrigger>
            <TabsTrigger value="search" className="data-[state=active]:bg-white data-[state=active]:shadow-md">
              <Search className="h-4 w-4 mr-2" />
              Search
            </TabsTrigger>
            <TabsTrigger value="bookmarks" className="data-[state=active]:bg-white data-[state=active]:shadow-md">
              <Bookmark className="h-4 w-4 mr-2" />
              Bookmarks
            </TabsTrigger>
            <TabsTrigger value="templates" className="data-[state=active]:bg-white data-[state=active]:shadow-md">
              <FileText className="h-4 w-4 mr-2" />
              Templates
            </TabsTrigger>
            <TabsTrigger value="analytics" className="data-[state=active]:bg-white data-[state=active]:shadow-md">
              <BarChart3 className="h-4 w-4 mr-2" />
              Analytics
            </TabsTrigger>
          </TabsList>

          {/* Browse Tab */}
          <TabsContent value="browse" className="space-y-6">
            {/* Filters */}
            <Card className="border-amber-200 shadow-lg">
              <CardHeader>
                <CardTitle>Standard Operating Procedures</CardTitle>
                <CardDescription>Browse and manage all SOP documents</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col lg:flex-row gap-4 mb-6">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-amber-500" />
                      <Input
                        placeholder="Search SOPs..."
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
                        {sopCategories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                      <SelectTrigger className="w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="review">Under Review</SelectItem>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="archived">Archived</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Documents Display */}
                {viewMode === 'grid' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredDocuments.map((doc) => {
                      const TypeIcon = getTypeIcon(doc.type);
                      return (
                        <Card key={doc.id} className="border-amber-200 shadow-lg hover:shadow-xl transition-shadow">
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-2">
                                <TypeIcon className="h-5 w-5 text-amber-600" />
                                <Badge className={getStatusColor(doc.status)}>
                                  {doc.status}
                                </Badge>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleBookmark(doc.id)}
                              >
                                <Bookmark className={`h-4 w-4 ${bookmarkedDocuments.includes(doc.id) ? 'fill-amber-600 text-amber-600' : 'text-gray-400'}`} />
                              </Button>
                            </div>
                            <CardTitle className="text-lg text-amber-900 line-clamp-2">{doc.title}</CardTitle>
                            <CardDescription className="line-clamp-2">{doc.description}</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-4">
                              <div className="flex items-center justify-between text-sm">
                                <Badge className={getPriorityColor(doc.priority)}>
                                  {doc.priority}
                                </Badge>
                                <span className="text-amber-600">v{doc.version}</span>
                              </div>

                              <div className="flex items-center gap-3 text-xs text-amber-500">
                                <span className="flex items-center gap-1">
                                  <Eye className="h-3 w-3" />
                                  {doc.metrics.views}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Download className="h-3 w-3" />
                                  {doc.metrics.downloads}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Star className="h-3 w-3" />
                                  {doc.metrics.averageRating}
                                </span>
                              </div>

                              <div className="flex flex-wrap gap-1">
                                {doc.tags.slice(0, 3).map((tag) => (
                                  <Badge key={tag} variant="secondary" className="text-xs">
                                    #{tag}
                                  </Badge>
                                ))}
                              </div>

                              <div className="flex items-center justify-between text-xs text-amber-500">
                                <span>Updated: {doc.lastUpdated.toLocaleDateString()}</span>
                                <span>Review: {doc.nextReviewDate.toLocaleDateString()}</span>
                              </div>

                              <Button
                                className="w-full bg-amber-600 hover:bg-amber-700"
                                onClick={() => setSelectedDocument(doc)}
                              >
                                View Document
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredDocuments.map((doc) => {
                      const TypeIcon = getTypeIcon(doc.type);
                      return (
                        <Card key={doc.id} className="border-amber-200 shadow-md hover:shadow-lg transition-shadow">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4 flex-1">
                                <TypeIcon className="h-6 w-6 text-amber-600" />
                                <div className="flex-1">
                                  <div className="flex items-center gap-3 mb-2">
                                    <h3 className="font-semibold text-amber-900">{doc.title}</h3>
                                    <Badge className={getStatusColor(doc.status)}>
                                      {doc.status}
                                    </Badge>
                                    <Badge className={getPriorityColor(doc.priority)}>
                                      {doc.priority}
                                    </Badge>
                                    <span className="text-sm text-amber-600">v{doc.version}</span>
                                  </div>
                                  <p className="text-sm text-amber-600 mb-2 line-clamp-1">{doc.description}</p>
                                  <div className="flex items-center gap-4 text-xs text-amber-500">
                                    <span>Category: {doc.category}</span>
                                    <span>Updated: {doc.lastUpdated.toLocaleDateString()}</span>
                                    <span>Next Review: {doc.nextReviewDate.toLocaleDateString()}</span>
                                    <span>Views: {doc.metrics.views}</span>
                                    <span>Rating: {doc.metrics.averageRating}/5</span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleBookmark(doc.id)}
                                >
                                  <Bookmark className={`h-4 w-4 ${bookmarkedDocuments.includes(doc.id) ? 'fill-amber-600 text-amber-600' : 'text-gray-400'}`} />
                                </Button>
                                <Button size="sm" variant="outline">
                                  <Download className="h-4 w-4 mr-2" />
                                  Download
                                </Button>
                                <Button
                                  size="sm"
                                  className="bg-amber-600 hover:bg-amber-700"
                                  onClick={() => setSelectedDocument(doc)}
                                >
                                  View
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

          {/* Categories Tab */}
          <TabsContent value="categories" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sopCategories.map((category) => {
                const Icon = category.icon;
                return (
                  <Card
                    key={category.id}
                    className="border-amber-200 shadow-lg hover:shadow-xl transition-all cursor-pointer"
                    onClick={() => setSelectedCategory(category.id === selectedCategory ? 'all' : category.id)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <Icon className={`h-8 w-8 ${category.color}`} />
                        {category.required && (
                          <Badge className="bg-red-100 text-red-800">
                            <Lock className="h-3 w-3 mr-1" />
                            Required
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="text-lg text-amber-900">{category.name}</CardTitle>
                      <CardDescription>{category.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-amber-600">Documents</span>
                          <span className="font-medium text-amber-900">{category.documentCount}</span>
                        </div>

                        {category.subcategories && (
                          <div className="space-y-2">
                            {category.subcategories.slice(0, 3).map((subcategory) => (
                              <div key={subcategory.id} className="flex items-center justify-between text-xs">
                                <span className="text-amber-600">{subcategory.name}</span>
                                <span className="text-amber-500">{subcategory.documentCount}</span>
                              </div>
                            ))}
                            {category.subcategories.length > 3 && (
                              <div className="text-xs text-amber-500">
                                +{category.subcategories.length - 3} more subcategories
                              </div>
                            )}
                          </div>
                        )}

                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedCategory(category.id);
                            setActiveTab('browse');
                          }}
                        >
                          View Documents
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* Search Tab */}
          <TabsContent value="search" className="space-y-6">
            <Card className="border-amber-200 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-amber-900">
                  <Search className="h-5 w-5 text-amber-600" />
                  Advanced Search
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 space-y-4">
                    <div>
                      <Label>Search Query</Label>
                      <Input
                        placeholder="Enter keywords, phrases, or document numbers..."
                        className="mt-2"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Category</Label>
                        <Select>
                          <SelectTrigger className="mt-2">
                            <SelectValue placeholder="All Categories" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Categories</SelectItem>
                            {sopCategories.map((category) => (
                              <SelectItem key={category.id} value={category.id}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Type</Label>
                        <Select>
                          <SelectTrigger className="mt-2">
                            <SelectValue placeholder="All Types" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Types</SelectItem>
                            <SelectItem value="procedure">Procedures</SelectItem>
                            <SelectItem value="policy">Policies</SelectItem>
                            <SelectItem value="guideline">Guidelines</SelectItem>
                            <SelectItem value="checklist">Checklists</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label>Tags</Label>
                      <Input
                        placeholder="Search by tags (comma separated)..."
                        className="mt-2"
                      />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <Label>Date Range</Label>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        <Input type="date" placeholder="From" />
                        <Input type="date" placeholder="To" />
                      </div>
                    </div>
                    <div>
                      <Label>Author</Label>
                      <Input placeholder="Search by author..." className="mt-2" />
                    </div>
                    <div className="space-y-2">
                      <Label>Additional Filters</Label>
                      <div className="space-y-2">
                        <Checkbox id="has-attachments" />
                        <Label htmlFor="has-attachments" className="text-sm">Has attachments</Label>
                      </div>
                      <div className="space-y-2">
                        <Checkbox id="emergency-only" />
                        <Label htmlFor="emergency-only" className="text-sm">Emergency procedures only</Label>
                      </div>
                      <div className="space-y-2">
                        <Checkbox id="required-only" />
                        <Label htmlFor="required-only" className="text-sm">Required documents only</Label>
                      </div>
                    </div>
                    <Button className="w-full bg-amber-600 hover:bg-amber-700">
                      <Search className="h-4 w-4 mr-2" />
                      Search
                    </Button>
                  </div>
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
                  Bookmarked Documents
                </CardTitle>
                <CardDescription>
                  Quick access to your frequently referenced SOPs
                </CardDescription>
              </CardHeader>
              <CardContent>
                {bookmarkedDocuments.length > 0 ? (
                  <div className="space-y-4">
                    {mockSOPDocuments
                      .filter(doc => bookmarkedDocuments.includes(doc.id))
                      .map((doc) => (
                        <div
                          key={doc.id}
                          className="border border-amber-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="font-semibold text-amber-900">{doc.title}</h3>
                                <Badge className={getStatusColor(doc.status)}>
                                  {doc.status}
                                </Badge>
                                <Badge className={getPriorityColor(doc.priority)}>
                                  {doc.priority}
                                </Badge>
                              </div>
                              <p className="text-sm text-amber-600 mb-2">{doc.description}</p>
                              <div className="flex items-center gap-4 text-xs text-amber-500">
                                <span>{doc.category}</span>
                                <span>•</span>
                                <span>Updated: {doc.lastUpdated.toLocaleDateString()}</span>
                                <span>•</span>
                                <span>Version: {doc.version}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button size="sm" variant="outline">
                                <Download className="h-4 w-4 mr-2" />
                                Download
                              </Button>
                              <Button
                                size="sm"
                                className="bg-amber-600 hover:bg-amber-700"
                                onClick={() => setSelectedDocument(doc)}
                              >
                                View
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Bookmark className="h-12 w-12 text-amber-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-amber-900 mb-2">No bookmarked documents</h3>
                    <p className="text-amber-600">Bookmark SOPs you reference frequently for quick access</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Templates Tab */}
          <TabsContent value="templates" className="space-y-6">
            <Card className="border-amber-200 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-amber-900">
                  <FileText className="h-5 w-5 text-amber-600" />
                  SOP Templates
                </CardTitle>
                <CardDescription>
                  Pre-built templates for creating new SOP documents
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <Card className="border-amber-200 shadow-md hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <CardTitle className="text-lg text-amber-900">Standard Procedure Template</CardTitle>
                      <CardDescription>Template for creating standard operating procedures</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="text-sm text-amber-600">
                          <p>• Step-by-step procedures</p>
                          <p>• Quality checkpoints</p>
                          <p>• Compliance requirements</p>
                          <p>• Emergency procedures</p>
                        </div>
                        <Button className="w-full" variant="outline">
                          Use Template
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-amber-200 shadow-md hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <CardTitle className="text-lg text-amber-900">Emergency Procedure Template</CardTitle>
                      <CardDescription>Template for creating emergency response procedures</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="text-sm text-amber-600">
                          <p>• Immediate response steps</p>
                          <p>• Emergency contacts</p>
                          <p>• Escalation procedures</p>
                          <p>• Communication protocols</p>
                        </div>
                        <Button className="w-full" variant="outline">
                          Use Template
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-amber-200 shadow-md hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <CardTitle className="text-lg text-amber-900">Compliance Checklist Template</CardTitle>
                      <CardDescription>Template for creating compliance checklists</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="text-sm text-amber-600">
                          <p>• Regulatory requirements</p>
                          <p>• Verification steps</p>
                          <p>• Documentation needs</p>
                          <p>• Review schedules</p>
                        </div>
                        <Button className="w-full" variant="outline">
                          Use Template
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <Card className="border-amber-200 shadow-lg">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-amber-600">Total Documents</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-amber-900">88</div>
                  <p className="text-xs text-amber-600">+5 this month</p>
                </CardContent>
              </Card>

              <Card className="border-amber-200 shadow-lg">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-amber-600">Total Views</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-amber-900">2,456</div>
                  <p className="text-xs text-amber-600">+234 this week</p>
                </CardContent>
              </Card>

              <Card className="border-amber-200 shadow-lg">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-amber-600">Average Rating</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-amber-900">4.6</div>
                  <p className="text-xs text-amber-600">From 89 reviews</p>
                </CardContent>
              </Card>

              <Card className="border-amber-200 shadow-lg">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-amber-600">Pending Reviews</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-amber-900">7</div>
                  <p className="text-xs text-amber-600">Due this week</p>
                </CardContent>
              </Card>
            </div>

            {/* Most Accessed Documents */}
            <Card className="border-amber-200 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-amber-900">
                  <TrendingUp className="h-5 w-5 text-amber-600" />
                  Most Accessed Documents
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockSOPDocuments
                    .sort((a, b) => b.metrics.views - a.metrics.views)
                    .slice(0, 5)
                    .map((doc, index) => (
                      <div key={doc.id} className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-amber-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium text-amber-900">{doc.title}</p>
                            <p className="text-sm text-amber-600">{doc.category}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-amber-900">{doc.metrics.views} views</p>
                          <p className="text-sm text-amber-600">Last: {doc.metrics.lastAccessed.toLocaleDateString()}</p>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Document Viewer Dialog */}
      <Dialog open={!!selectedDocument} onOpenChange={() => setSelectedDocument(null)}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          {selectedDocument && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge className={getStatusColor(selectedDocument.status)}>
                      {selectedDocument.status}
                    </Badge>
                    <Badge className={getPriorityColor(selectedDocument.priority)}>
                      {selectedDocument.priority}
                    </Badge>
                    <span className="text-sm text-amber-600">Version {selectedDocument.version}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                      <Share2 className="h-4 w-4 mr-2" />
                      Share
                    </Button>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                    <Button variant="outline" size="sm">
                      <Printer className="h-4 w-4 mr-2" />
                      Print
                    </Button>
                  </div>
                </div>
                <DialogTitle className="text-2xl text-amber-900">{selectedDocument.title}</DialogTitle>
                <DialogDescription>{selectedDocument.description}</DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-3">
                  <div className="space-y-6">
                    {/* Document Information */}
                    <Card className="border-amber-200">
                      <CardHeader>
                        <CardTitle className="text-lg text-amber-900">Document Information</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-amber-600">Author:</span>
                            <span className="ml-2 font-medium text-amber-900">{selectedDocument.author}</span>
                          </div>
                          <div>
                            <span className="text-amber-600">Category:</span>
                            <span className="ml-2 font-medium text-amber-900 capitalize">{selectedDocument.category}</span>
                          </div>
                          <div>
                            <span className="text-amber-600">Created:</span>
                            <span className="ml-2 font-medium text-amber-900">{selectedDocument.createdAt.toLocaleDateString()}</span>
                          </div>
                          <div>
                            <span className="text-amber-600">Last Updated:</span>
                            <span className="ml-2 font-medium text-amber-900">{selectedDocument.lastUpdated.toLocaleDateString()}</span>
                          </div>
                          <div>
                            <span className="text-amber-600">Next Review:</span>
                            <span className="ml-2 font-medium text-amber-900">{selectedDocument.nextReviewDate.toLocaleDateString()}</span>
                          </div>
                          <div>
                            <span className="text-amber-600">Effective Date:</span>
                            <span className="ml-2 font-medium text-amber-900">
                              {selectedDocument.effectiveDate?.toLocaleDateString() || 'Not specified'}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Document Content */}
                    <Card className="border-amber-200">
                      <CardHeader>
                        <CardTitle className="text-lg text-amber-900">Content</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-6">
                          {selectedDocument.content.map((section) => (
                            <div key={section.id} className="space-y-3">
                              <div className="flex items-center gap-3">
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                                  section.required ? 'bg-red-600' : 'bg-gray-400'
                                }`}>
                                  {section.order}
                                </div>
                                <h3 className="text-lg font-semibold text-amber-900">{section.title}</h3>
                                {section.required && (
                                  <Badge className="bg-red-100 text-red-800">Required</Badge>
                                )}
                              </div>

                              {section.type === 'section' && section.content.steps && (
                                <div className="ml-9 space-y-2">
                                  {section.content.steps.map((step: string, index: number) => (
                                    <div key={index} className="flex items-start gap-3">
                                      <div className="w-2 h-2 bg-amber-600 rounded-full mt-2 flex-shrink-0" />
                                      <p className="text-amber-800">{step}</p>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {section.type === 'checklist' && section.content.items && (
                                <div className="ml-9 space-y-2">
                                  {section.content.items.map((item: any) => (
                                    <div key={item.id} className="flex items-center gap-3">
                                      <Checkbox />
                                      <span className={`text-amber-800 ${item.required ? 'font-medium' : ''}`}>
                                        {item.text}
                                        {item.required && <span className="text-red-600 ml-1">*</span>}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {section.estimatedTime && (
                                <div className="ml-9 text-sm text-amber-600">
                                  <Clock className="h-3 w-3 inline mr-1" />
                                  Estimated time: {section.estimatedTime} minutes
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Attachments */}
                    {selectedDocument.attachments.length > 0 && (
                      <Card className="border-amber-200">
                        <CardHeader>
                          <CardTitle className="text-lg text-amber-900">Attachments</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {selectedDocument.attachments.map((attachment) => (
                              <div key={attachment.id} className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
                                <div className="flex items-center gap-3">
                                  <FileText className="h-5 w-5 text-amber-600" />
                                  <div>
                                    <p className="font-medium text-amber-900">{attachment.name}</p>
                                    <p className="text-sm text-amber-600">{attachment.description}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm text-amber-500">{attachment.size}</span>
                                  {attachment.required && (
                                    <Badge className="bg-red-100 text-red-800">Required</Badge>
                                  )}
                                  <Button size="sm" variant="outline">
                                    <Download className="h-4 w-4 mr-2" />
                                    Download
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Emergency Procedures */}
                    {selectedDocument.emergencyProcedures && selectedDocument.emergencyProcedures.length > 0 && (
                      <Card className="border-red-200 bg-red-50">
                        <CardHeader>
                          <CardTitle className="text-lg text-red-900 flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5" />
                            Emergency Procedures
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            {selectedDocument.emergencyProcedures.map((procedure) => (
                              <div key={procedure.id} className="p-4 bg-white rounded-lg border border-red-200">
                                <h4 className="font-semibold text-red-900 mb-2">{procedure.title}</h4>
                                <p className="text-sm text-red-700 mb-3">{procedure.description}</p>
                                <div className="space-y-2">
                                  <p className="font-medium text-red-900">Triggers:</p>
                                  <ul className="text-sm text-red-700 space-y-1">
                                    {procedure.triggers.map((trigger, index) => (
                                      <li key={index} className="flex items-center gap-2">
                                        <AlertCircle className="h-3 w-3" />
                                        {trigger}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Feedback Section */}
                    <Separator />
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-amber-900">Rate this Document</h3>
                      <div className="flex items-center gap-2">
                        {[1, 2, 3, 4, 5].map((rating) => (
                          <Button
                            key={rating}
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRating(selectedDocument.id, rating)}
                          >
                            <Star className={`h-5 w-5 ${
                              documentFeedback[selectedDocument.id] >= rating
                                ? 'fill-amber-400 text-amber-400'
                                : 'text-gray-300'
                            }`} />
                          </Button>
                        ))}
                        <span className="text-sm text-amber-600 ml-2">
                          {selectedDocument.metrics.averageRating}/5 ({selectedDocument.metrics.totalRatings} ratings)
                        </span>
                      </div>
                    </div>
                  </div>
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
                        onClick={() => handleBookmark(selectedDocument.id)}
                      >
                        <Bookmark className={`h-4 w-4 mr-2 ${bookmarkedDocuments.includes(selectedDocument.id) ? 'fill-amber-600 text-amber-600' : ''}`} />
                        {bookmarkedDocuments.includes(selectedDocument.id) ? 'Bookmarked' : 'Bookmark'}
                      </Button>
                      <Button variant="outline" className="w-full justify-start">
                        <Share2 className="h-4 w-4 mr-2" />
                        Share Document
                      </Button>
                      <Button variant="outline" className="w-full justify-start" onClick={() => setShowVersionHistory(true)}>
                        <Clock className="h-4 w-4 mr-2" />
                        Version History
                      </Button>
                      <Button variant="outline" className="w-full justify-start">
                        <Flag className="h-4 w-4 mr-2" />
                        Report Issue
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Compliance Information */}
                  {selectedDocument.complianceRequirements.length > 0 && (
                    <Card className="border-amber-200">
                      <CardHeader>
                        <CardTitle className="text-lg text-amber-900">Compliance</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {selectedDocument.complianceRequirements.map((req) => (
                          <div key={req.id} className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Shield className="h-4 w-4 text-amber-600" />
                              <span className="font-medium text-amber-900">{req.name}</span>
                              {req.mandatory && (
                                <Badge className="bg-red-100 text-red-800">Mandatory</Badge>
                              )}
                            </div>
                            <p className="text-sm text-amber-600">{req.description}</p>
                            <p className="text-xs text-amber-500">
                              Authority: {req.authority} • Verified: {req.lastVerified.toLocaleDateString()}
                            </p>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )}

                  {/* Related Documents */}
                  {selectedDocument.relatedDocuments.length > 0 && (
                    <Card className="border-amber-200">
                      <CardHeader>
                        <CardTitle className="text-lg text-amber-900">Related Documents</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {selectedDocument.relatedDocuments.map((relatedId) => {
                          const relatedDoc = mockSOPDocuments.find(d => d.id === relatedId);
                          return relatedDoc ? (
                            <Button
                              key={relatedId}
                              variant="ghost"
                              className="w-full justify-start text-left h-auto p-3"
                              onClick={() => setSelectedDocument(relatedDoc)}
                            >
                              <div>
                                <p className="font-medium text-amber-900">{relatedDoc.title}</p>
                                <p className="text-xs text-amber-600">{relatedDoc.category}</p>
                              </div>
                            </Button>
                          ) : null;
                        })}
                      </CardContent>
                    </Card>
                  )}

                  {/* Document Metrics */}
                  <Card className="border-amber-200">
                    <CardHeader>
                      <CardTitle className="text-lg text-amber-900">Usage Metrics</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-amber-600">Views</span>
                        <span className="font-medium text-amber-900">{selectedDocument.metrics.views}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-amber-600">Downloads</span>
                        <span className="font-medium text-amber-900">{selectedDocument.metrics.downloads}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-amber-600">Shares</span>
                        <span className="font-medium text-amber-900">{selectedDocument.metrics.shares}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-amber-600">Completion Rate</span>
                        <span className="font-medium text-amber-900">{selectedDocument.metrics.completionRate}%</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-amber-600">Last Accessed</span>
                        <span className="font-medium text-amber-900">
                          {selectedDocument.metrics.lastAccessed.toLocaleDateString()}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Version History Dialog */}
      <Dialog open={showVersionHistory} onOpenChange={setShowVersionHistory}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Version History</DialogTitle>
            <DialogDescription>
              Track changes and updates to this document
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {sopVersions.map((version) => (
              <Card key={version.id} className="border-amber-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-amber-900">Version {version.version}</span>
                      {version.approved && (
                        <Badge className="bg-green-100 text-green-800">Approved</Badge>
                      )}
                    </div>
                    <span className="text-sm text-amber-600">{version.date.toLocaleDateString()}</span>
                  </div>
                  <p className="text-sm text-amber-600 mb-2">Author: {version.author}</p>
                  <div className="space-y-1">
                    {version.changes.map((change, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm text-amber-700">
                        <ChevronRight className="h-3 w-3" />
                        {change}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SOPDocumentationSystem;