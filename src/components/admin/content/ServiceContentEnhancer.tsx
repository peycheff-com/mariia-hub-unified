import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast aria-live="polite" aria-atomic="true" } from 'sonner';

import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Switch,
} from '@/components/ui/switch';
import {
  Alert,
  AlertDescription,
} from '@/components/ui/alert';
import {
  Progress,
} from '@/components/ui/progress';
import {
  QuestionMarkCircle,
  Lightbulb,
  BookOpen,
  Users,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Star,
  Heart,
  MessageSquare,
  FileText,
  Edit,
  Plus,
  Trash2,
  Copy,
  Eye,
  EyeOff,
  Search,
  Filter,
  BarChart3,
  Target,
  Clock,
  Award,
  Zap,
  Shield,
  Info,
  ChevronRight,
  ExternalLink
} from 'lucide-react';

interface Service {
  id: string;
  title: string;
  description: string;
  category: string;
  service_type: 'beauty' | 'fitness' | 'lifestyle';
  price: number;
  duration_minutes: number;
  images: string[];
  tags: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface ServiceFAQ {
  id: string;
  service_id: string;
  question: string;
  answer: string;
  display_order: number;
  is_active: boolean;
  category: string;
  keywords: string[];
  helpful_count: number;
  not_helpful_count: number;
  created_at: string;
  updated_at: string;
}

interface ServiceContent {
  id: string;
  service_id: string;
  content_type: 'preparation' | 'aftercare' | 'expectations' | 'benefits' | 'risks' | 'faq';
  title: string;
  content: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface ContentEnhancement {
  id: string;
  service_id: string;
  enhancement_type: 'faq_expansion' | 'content_deepening' | 'trust_building' | 'educational_value';
  current_score: number;
  target_score: number;
  improvements: string[];
  auto_generated: boolean;
  status: 'pending' | 'in_progress' | 'completed' | 'applied';
  created_at: string;
}

interface ServiceContentEnhancerProps {
  className?: string;
  language?: string;
}

const FAQ_CATEGORIES = [
  'general',
  'preparation',
  'procedure',
  'aftercare',
  'safety',
  'pricing',
  'results',
  'contraindications',
  'maintenance',
  'comparisons'
];

const CONTENT_ENHANCEMENT_TEMPLATES = {
  preparation: {
    title: 'How to Prepare for Your {service_name} Session',
    sections: [
      'What to avoid before your appointment',
      'What to bring to your session',
      'Physical preparation guidelines',
      'Mental preparation tips',
      'Questions to ask during consultation'
    ],
    wordCount: 800,
    keywords: ['preparation', 'guidelines', 'before', 'consultation', 'tips']
  },
  aftercare: {
    title: 'Aftercare Guide for {service_name}',
    sections: [
      'Immediate post-treatment care',
      'First 24-48 hours instructions',
      'Long-term maintenance routine',
      'Products to use and avoid',
      'When to contact us'
    ],
    wordCount: 1000,
    keywords: ['aftercare', 'recovery', 'maintenance', 'guidelines', 'products']
  },
  expectations: {
    title: 'What to Expect from {service_name}',
    sections: [
      'Your journey from consultation to results',
      'Step-by-step process overview',
      'Sensations and comfort level',
      'Immediate and long-term results',
      'Realistic timeline expectations'
    ],
    wordCount: 900,
    keywords: ['expectations', 'process', 'results', 'timeline', 'experience']
  },
  benefits: {
    title: 'Benefits of {service_name}',
    sections: [
      'Primary advantages and outcomes',
      'Physical benefits you\'ll notice',
      'Emotional and confidence boost',
      'Long-term value and impact',
      'Why this beats alternatives'
    ],
    wordCount: 700,
    keywords: ['benefits', 'advantages', 'results', 'value', 'outcomes']
  },
  risks: {
    title: 'Understanding the Risks and Safety of {service_name}',
    sections: [
      'Potential side effects and how we minimize them',
      'Who should avoid this treatment',
      'Safety measures and protocols',
      'Emergency procedures',
      'Risk vs benefit analysis'
    ],
    wordCount: 600,
    keywords: ['risks', 'safety', 'side effects', 'contraindications', 'protocols']
  }
};

export const ServiceContentEnhancer = ({
  className,
  language = 'en'
}: ServiceContentEnhancerProps) => {
  const { t } = useTranslation();
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [serviceFAQs, setServiceFAQs] = useState<ServiceFAQ[]>([]);
  const [serviceContent, setServiceContent] = useState<ServiceContent[]>([]);
  const [contentEnhancements, setContentEnhancements] = useState<ContentEnhancement[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showFAQDialog, setShowFAQDialog] = useState(false);
  const [showContentDialog, setShowContentDialog] = useState(false);
  const [showEnhancementDialog, setShowEnhancementDialog] = useState(false);
  const [editingFAQ, setEditingFAQ] = useState<ServiceFAQ | null>(null);
  const [editingContent, setEditingContent] = useState<ServiceContent | null>(null);

  // Form states
  const [faqForm, setFaqForm] = useState({
    question: '',
    answer: '',
    category: 'general',
    keywords: '',
    display_order: 0
  });

  const [contentForm, setContentForm] = useState({
    content_type: 'preparation' as const,
    title: '',
    content: '',
    display_order: 0
  });

  // Load data
  useEffect(() => {
    loadServices();
  }, []);

  useEffect(() => {
    if (selectedService) {
      loadServiceContent(selectedService.id);
      loadServiceFAQs(selectedService.id);
      loadContentEnhancements(selectedService.id);
    }
  }, [selectedService]);

  const loadServices = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('is_active', true)
        .order('title');

      if (error) throw error;
      setServices(data || []);
    } catch (error) {
      console.error('Failed to load services:', error);
      toast aria-live="polite" aria-atomic="true".error('Failed to load services');
    } finally {
      setLoading(false);
    }
  };

  const loadServiceFAQs = async (serviceId: string) => {
    try {
      const { data, error } = await supabase
        .from('service_faqs')
        .select('*')
        .eq('service_id', serviceId)
        .order('display_order');

      if (error) throw error;
      setServiceFAQs(data || []);
    } catch (error) {
      console.error('Failed to load FAQs:', error);
    }
  };

  const loadServiceContent = async (serviceId: string) => {
    try {
      const { data, error } = await supabase
        .from('service_content')
        .select('*')
        .eq('service_id', serviceId)
        .order('display_order');

      if (error) throw error;
      setServiceContent(data || []);
    } catch (error) {
      console.error('Failed to load service content:', error);
    }
  };

  const loadContentEnhancements = async (serviceId: string) => {
    try {
      const { data, error } = await supabase
        .from('content_enhancements')
        .select('*')
        .eq('service_id', serviceId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setContentEnhancements(data || []);
    } catch (error) {
      console.error('Failed to load content enhancements:', error);
    }
  };

  const calculateContentScore = (serviceId: string): number => {
    const faqs = serviceFAQs.filter(f => f.service_id === serviceId);
    const content = serviceContent.filter(c => c.service_id === serviceId);

    let score = 0;

    // FAQ score (40% of total)
    score += Math.min((faqs.length * 8), 40);

    // Content depth score (30% of total)
    const contentTypes = new Set(content.map(c => c.content_type));
    score += Math.min((contentTypes.size * 6), 30);

    // Content quality score (20% of total)
    const avgContentLength = content.reduce((acc, c) => acc + c.content.length, 0) / (content.length || 1);
    score += Math.min((avgContentLength / 50), 20);

    // FAQ engagement score (10% of total)
    const totalHelpfulVotes = faqs.reduce((acc, f) => acc + f.helpful_count, 0);
    score += Math.min((totalHelpfulVotes / 10), 10);

    return Math.min(score, 100);
  };

  const generateContentSuggestions = async (serviceId: string) => {
    if (!selectedService) return;

    const currentScore = calculateContentScore(serviceId);
    const suggestions = [];

    // Analyze gaps in content
    const existingContentTypes = new Set(serviceContent.map(c => c.content_type));
    const faqCategories = new Set(serviceFAQs.map(f => f.category));

    // Check for missing content types
    ['preparation', 'aftercare', 'expectations', 'benefits', 'risks'].forEach(type => {
      if (!existingContentTypes.has(type)) {
        suggestions.push({
          type: 'content_deepening',
          priority: 'high',
          description: `Add ${type} content to educate clients better`,
          action: `Create ${type} guide using template`,
          estimated_impact: 15
        });
      }
    });

    // Check for missing FAQ categories
    ['safety', 'pricing', 'results', 'comparisons'].forEach(category => {
      if (!faqCategories.has(category)) {
        suggestions.push({
          type: 'faq_expansion',
          priority: 'medium',
          description: `Add ${category} FAQs to address client concerns`,
          action: `Generate ${category} focused FAQs`,
          estimated_impact: 10
        });
      }
    });

    // Check for FAQ count
    if (serviceFAQs.length < 8) {
      suggestions.push({
        type: 'faq_expansion',
        priority: 'high',
        description: 'Expand FAQ section to cover more client questions',
        action: 'Generate additional FAQs based on common client inquiries',
        estimated_impact: 12
      });
    }

    // Check for content quality
    const avgContentLength = serviceContent.reduce((acc, c) => acc + c.content.length, 0) / (serviceContent.length || 1);
    if (avgContentLength < 500) {
      suggestions.push({
        type: 'content_deepening',
        priority: 'medium',
        description: 'Enhance existing content with more detailed information',
        action: 'Expand current content sections with expert insights',
        estimated_impact: 8
      });
    }

    // Add trust-building suggestions
    suggestions.push({
      type: 'trust_building',
      priority: 'medium',
      description: 'Add trust signals and social proof elements',
      action: 'Include client testimonials, expert credentials, and success metrics',
      estimated_impact: 10
    });

    // Create enhancement record
    const enhancement: ContentEnhancement = {
      id: `enhancement-${Date.now()}`,
      service_id: serviceId,
      enhancement_type: 'content_deepening',
      current_score: currentScore,
      target_score: Math.min(currentScore + 25, 100),
      improvements: suggestions.map(s => s.description),
      auto_generated: true,
      status: 'pending',
      created_at: new Date().toISOString()
    };

    setContentEnhancements([enhancement, ...contentEnhancements]);
    toast aria-live="polite" aria-atomic="true".success('Content suggestions generated successfully');
  };

  const handleSaveFAQ = async () => {
    if (!selectedService) return;

    try {
      const faqData = {
        service_id: selectedService.id,
        question: faqForm.question,
        answer: faqForm.answer,
        category: faqForm.category,
        keywords: faqForm.keywords.split(',').map(k => k.trim()).filter(k => k),
        display_order: faqForm.display_order,
        is_active: true
      };

      if (editingFAQ) {
        const { error } = await supabase
          .from('service_faqs')
          .update(faqData)
          .eq('id', editingFAQ.id);

        if (error) throw error;
        toast aria-live="polite" aria-atomic="true".success('FAQ updated successfully');
      } else {
        const { error } = await supabase
          .from('service_faqs')
          .insert([faqData]);

        if (error) throw error;
        toast aria-live="polite" aria-atomic="true".success('FAQ created successfully');
      }

      await loadServiceFAQs(selectedService.id);
      setShowFAQDialog(false);
      setEditingFAQ(null);
      resetFAQForm();
    } catch (error) {
      console.error('Failed to save FAQ:', error);
      toast aria-live="polite" aria-atomic="true".error('Failed to save FAQ');
    }
  };

  const handleSaveContent = async () => {
    if (!selectedService) return;

    try {
      const contentData = {
        service_id: selectedService.id,
        content_type: contentForm.content_type,
        title: contentForm.title,
        content: contentForm.content,
        display_order: contentForm.display_order,
        is_active: true
      };

      if (editingContent) {
        const { error } = await supabase
          .from('service_content')
          .update(contentData)
          .eq('id', editingContent.id);

        if (error) throw error;
        toast aria-live="polite" aria-atomic="true".success('Content updated successfully');
      } else {
        const { error } = await supabase
          .from('service_content')
          .insert([contentData]);

        if (error) throw error;
        toast aria-live="polite" aria-atomic="true".success('Content created successfully');
      }

      await loadServiceContent(selectedService.id);
      setShowContentDialog(false);
      setEditingContent(null);
      resetContentForm();
    } catch (error) {
      console.error('Failed to save content:', error);
      toast aria-live="polite" aria-atomic="true".error('Failed to save content');
    }
  };

  const handleEditFAQ = (faq: ServiceFAQ) => {
    setEditingFAQ(faq);
    setFaqForm({
      question: faq.question,
      answer: faq.answer,
      category: faq.category,
      keywords: faq.keywords.join(', '),
      display_order: faq.display_order
    });
    setShowFAQDialog(true);
  };

  const handleEditContent = (content: ServiceContent) => {
    setEditingContent(content);
    setContentForm({
      content_type: content.content_type as any,
      title: content.title,
      content: content.content,
      display_order: content.display_order
    });
    setShowContentDialog(true);
  };

  const handleDeleteFAQ = async (faqId: string) => {
    try {
      const { error } = await supabase
        .from('service_faqs')
        .delete()
        .eq('id', faqId);

      if (error) throw error;
      toast aria-live="polite" aria-atomic="true".success('FAQ deleted successfully');
      await loadServiceFAQs(selectedService?.id || '');
    } catch (error) {
      console.error('Failed to delete FAQ:', error);
      toast aria-live="polite" aria-atomic="true".error('Failed to delete FAQ');
    }
  };

  const handleDeleteContent = async (contentId: string) => {
    try {
      const { error } = await supabase
        .from('service_content')
        .delete()
        .eq('id', contentId);

      if (error) throw error;
      toast aria-live="polite" aria-atomic="true".success('Content deleted successfully');
      await loadServiceContent(selectedService?.id || '');
    } catch (error) {
      console.error('Failed to delete content:', error);
      toast aria-live="polite" aria-atomic="true".error('Failed to delete content');
    }
  };

  const generateContentFromTemplate = (contentType: keyof typeof CONTENT_ENHANCEMENT_TEMPLATES) => {
    if (!selectedService) return;

    const template = CONTENT_ENHANCEMENT_TEMPLATES[contentType];
    setContentForm({
      content_type: contentType,
      title: template.title.replace('{service_name}', selectedService.title),
      content: template.sections.map(section => `## ${section}\n\n[Detailed content about ${section.toLowerCase()} for ${selectedService.title} will go here...]`).join('\n\n'),
      display_order: serviceContent.length + 1
    });
    setShowContentDialog(true);
  };

  const generateFAQsFromTemplate = (category: string) => {
    if (!selectedService) return;

    const faqTemplates = {
      general: [
        'What is {service_name} and how does it work?',
        'How long does a typical {service_name} session take?',
        'Is {service_name} suitable for me?'
      ],
      preparation: [
        'How should I prepare for my {service_name} appointment?',
        'What should I avoid before my {service_name} session?',
        'What do I need to bring to my appointment?'
      ],
      safety: [
        'Is {service_name} safe?',
        'What are the potential side effects?',
        'Who should avoid {service_name}?'
      ],
      pricing: [
        'How much does {service_name} cost?',
        'Do you offer payment plans or packages?',
        'Is {service_name} covered by insurance?'
      ]
    };

    const templates = faqTemplates[category as keyof typeof faqTemplates] || [];

    templates.forEach((template, index) => {
      const question = template.replace('{service_name}', selectedService.title);
      const answer = `[Detailed answer about ${selectedService.title} for this question...]`;

      // Create FAQ
      supabase
        .from('service_faqs')
        .insert([{
          service_id: selectedService.id,
          question,
          answer,
          category,
          keywords: [category, selectedService.title.toLowerCase()],
          display_order: serviceFAQs.length + index + 1,
          is_active: true
        }])
        .then(() => {
          // Reload FAQs after creation
          loadServiceFAQs(selectedService.id);
        });
    });

    toast aria-live="polite" aria-atomic="true".success(`Generated ${templates.length} ${category} FAQs`);
  };

  const resetFAQForm = () => {
    setFaqForm({
      question: '',
      answer: '',
      category: 'general',
      keywords: '',
      display_order: serviceFAQs.length + 1
    });
  };

  const resetContentForm = () => {
    setContentForm({
      content_type: 'preparation',
      title: '',
      content: '',
      display_order: serviceContent.length + 1
    });
  };

  const contentScore = selectedService ? calculateContentScore(selectedService.id) : 0;
  const scoreColor = contentScore >= 80 ? 'text-green-600' : contentScore >= 60 ? 'text-yellow-600' : 'text-red-600';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Loading service content...</div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-primary" />
            Service Content Enhancer
          </h1>
          <p className="text-muted-foreground mt-2">
            Comprehensive FAQ and service detail management for client education and trust building
          </p>
        </div>
      </div>

      {/* Service Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Service</CardTitle>
          <CardDescription>
            Choose a service to enhance its content and FAQs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {services.map(service => (
              <div
                key={service.id}
                className={cn(
                  "p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md",
                  selectedService?.id === service.id && "border-primary bg-primary/5"
                )}
                onClick={() => setSelectedService(service)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold">{service.title}</h3>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                      {service.description}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline">{service.category}</Badge>
                      <Badge variant="secondary">{service.service_type}</Badge>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {selectedService && (
        <>
          {/* Content Score Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Content Quality Score</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => generateContentSuggestions(selectedService.id)}
                >
                  <Lightbulb className="h-4 w-4 mr-2" />
                  Generate Suggestions
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-3xl font-bold">{contentScore}</span>
                  <span className={`text-lg font-medium ${scoreColor}`}>
                    {contentScore >= 80 ? 'Excellent' : contentScore >= 60 ? 'Good' : 'Needs Improvement'}
                  </span>
                </div>
                <Progress value={contentScore} className="h-3" />

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-blue-600">{serviceFAQs.length}</div>
                    <div className="text-sm text-gray-600">FAQs</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">{serviceContent.length}</div>
                    <div className="text-sm text-gray-600">Content Sections</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-purple-600">
                      {new Set(serviceContent.map(c => c.content_type)).size}
                    </div>
                    <div className="text-sm text-gray-600">Content Types</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-orange-600">
                      {serviceFAQs.reduce((acc, f) => acc + f.helpful_count, 0)}
                    </div>
                    <div className="text-sm text-gray-600">Helpful Votes</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Content Management Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="faqs">FAQs</TabsTrigger>
              <TabsTrigger value="content">Content</TabsTrigger>
              <TabsTrigger value="enhancements">Enhancements</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* FAQ Overview */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <QuestionMarkCircle className="h-5 w-5" />
                      FAQ Categories
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {FAQ_CATEGORIES.map(category => {
                        const count = serviceFAQs.filter(f => f.category === category).length;
                        return (
                          <div key={category} className="flex items-center justify-between">
                            <span className="capitalize">{category}</span>
                            <Badge variant={count > 0 ? "default" : "outline"}>
                              {count}
                            </Badge>
                          </div>
                        );
                      })}
                    </div>
                    <div className="mt-4 pt-4 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => generateFAQsFromTemplate('general')}
                        className="w-full"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Generate Basic FAQs
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Content Overview */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Content Sections
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {Object.keys(CONTENT_ENHANCEMENT_TEMPLATES).map(type => {
                        const exists = serviceContent.some(c => c.content_type === type);
                        return (
                          <div key={type} className="flex items-center justify-between">
                            <span className="capitalize">{type}</span>
                            <div className="flex items-center gap-2">
                              {exists ? (
                                <>
                                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                                  <Badge variant="default">Complete</Badge>
                                </>
                              ) : (
                                <>
                                  <AlertCircle className="h-4 w-4 text-yellow-500" />
                                  <Badge variant="outline">Missing</Badge>
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="mt-4 pt-4 border-t space-y-2">
                      {Object.entries(CONTENT_ENHANCEMENT_TEMPLATES).map(([type, template]) => (
                        <Button
                          key={type}
                          variant="outline"
                          size="sm"
                          onClick={() => generateContentFromTemplate(type as keyof typeof CONTENT_ENHANCEMENT_TEMPLATES)}
                          className="w-full"
                          disabled={serviceContent.some(c => c.content_type === type)}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add {template.title.split('for')[0].trim()}
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Enhancements */}
              {contentEnhancements.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Recent Content Enhancements
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {contentEnhancements.slice(0, 3).map(enhancement => (
                        <div key={enhancement.id} className="border rounded-lg p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge>{enhancement.enhancement_type}</Badge>
                                <Badge variant={enhancement.status === 'completed' ? 'default' : 'secondary'}>
                                  {enhancement.status}
                                </Badge>
                              </div>
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium">Score Progress:</span>
                                  <span className="text-sm">{enhancement.current_score} → {enhancement.target_score}</span>
                                </div>
                                <div className="space-y-1">
                                  {enhancement.improvements.slice(0, 2).map((improvement, idx) => (
                                    <div key={idx} className="text-sm text-gray-600 flex items-center gap-1">
                                      <ChevronRight className="h-3 w-3" />
                                      {improvement}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                            <Button variant="outline" size="sm">
                              Apply
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* FAQs Tab */}
            <TabsContent value="faqs" className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Frequently Asked Questions</h3>
                  <p className="text-sm text-gray-600">
                    Manage FAQs to address client concerns and build trust
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => generateFAQsFromTemplate('safety')}
                  >
                    <Shield className="h-4 w-4 mr-2" />
                    Safety FAQs
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => generateFAQsFromTemplate('pricing')}
                  >
                    <Target className="h-4 w-4 mr-2" />
                    Pricing FAQs
                  </Button>
                  <Dialog open={showFAQDialog} onOpenChange={setShowFAQDialog}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Add FAQ
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>
                          {editingFAQ ? 'Edit FAQ' : 'Add New FAQ'}
                        </DialogTitle>
                        <DialogDescription>
                          Create a comprehensive FAQ to address client questions
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="faq-category">Category</Label>
                          <Select
                            value={faqForm.category}
                            onValueChange={(value) => setFaqForm(prev => ({ ...prev, category: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {FAQ_CATEGORIES.map(category => (
                                <SelectItem key={category} value={category}>
                                  {category.charAt(0).toUpperCase() + category.slice(1)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label htmlFor="faq-question">Question</Label>
                          <Input
                            id="faq-question"
                            value={faqForm.question}
                            onChange={(e) => setFaqForm(prev => ({ ...prev, question: e.target.value }))}
                            placeholder="Enter the question..."
                          />
                        </div>

                        <div>
                          <Label htmlFor="faq-answer">Answer</Label>
                          <Textarea
                            id="faq-answer"
                            value={faqForm.answer}
                            onChange={(e) => setFaqForm(prev => ({ ...prev, answer: e.target.value }))}
                            placeholder="Provide a comprehensive answer..."
                            rows={6}
                          />
                        </div>

                        <div>
                          <Label htmlFor="faq-keywords">Keywords</Label>
                          <Input
                            id="faq-keywords"
                            value={faqForm.keywords}
                            onChange={(e) => setFaqForm(prev => ({ ...prev, keywords: e.target.value }))}
                            placeholder="Enter keywords separated by commas..."
                          />
                        </div>

                        <div>
                          <Label htmlFor="faq-order">Display Order</Label>
                          <Input
                            id="faq-order"
                            type="number"
                            value={faqForm.display_order}
                            onChange={(e) => setFaqForm(prev => ({ ...prev, display_order: parseInt(e.target.value) }))}
                          />
                        </div>
                      </div>
                      <div className="flex gap-2 pt-4">
                        <Button variant="outline" onClick={() => setShowFAQDialog(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleSaveFAQ}>
                          {editingFAQ ? 'Update' : 'Create'} FAQ
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              {/* FAQ List */}
              <Card>
                <CardContent className="p-0">
                  {serviceFAQs.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <QuestionMarkCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>No FAQs created yet</p>
                      <p className="text-sm">Start by adding some common questions clients ask</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Question</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Helpful</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {serviceFAQs.map(faq => (
                          <TableRow key={faq.id}>
                            <TableCell className="font-medium">
                              <div>
                                <p className="max-w-md truncate">{faq.question}</p>
                                <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                                  {faq.answer}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{faq.category}</Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <span className="text-green-600">👍 {faq.helpful_count}</span>
                                <span className="text-red-600">👎 {faq.not_helpful_count}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${faq.is_active ? 'bg-green-500' : 'bg-gray-300'}`} />
                                <span className="text-sm">{faq.is_active ? 'Active' : 'Inactive'}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEditFAQ(faq)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDeleteFAQ(faq.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Content Tab */}
            <TabsContent value="content" className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Service Content</h3>
                  <p className="text-sm text-gray-600">
                    Detailed content sections to educate clients about your services
                  </p>
                </div>
                <Dialog open={showContentDialog} onOpenChange={setShowContentDialog}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Content
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-3xl">
                    <DialogHeader>
                      <DialogTitle>
                        {editingContent ? 'Edit Content' : 'Add New Content'}
                      </DialogTitle>
                      <DialogDescription>
                        Create detailed educational content about your service
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="content-type">Content Type</Label>
                        <Select
                          value={contentForm.content_type}
                          onValueChange={(value: any) => setContentForm(prev => ({ ...prev, content_type: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="preparation">Preparation Guide</SelectItem>
                            <SelectItem value="aftercare">Aftercare Instructions</SelectItem>
                            <SelectItem value="expectations">What to Expect</SelectItem>
                            <SelectItem value="benefits">Benefits & Results</SelectItem>
                            <SelectItem value="risks">Risks & Safety</SelectItem>
                            <SelectItem value="faq">FAQ Content</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="content-title">Title</Label>
                        <Input
                          id="content-title"
                          value={contentForm.title}
                          onChange={(e) => setContentForm(prev => ({ ...prev, title: e.target.value }))}
                          placeholder="Enter content title..."
                        />
                      </div>

                      <div>
                        <Label htmlFor="content-body">Content</Label>
                        <Textarea
                          id="content-body"
                          value={contentForm.content}
                          onChange={(e) => setContentForm(prev => ({ ...prev, content: e.target.value }))}
                          placeholder="Write detailed content about this aspect of your service..."
                          rows={12}
                        />
                        <div className="text-sm text-gray-500 mt-1">
                          {contentForm.content.length} characters
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="content-order">Display Order</Label>
                        <Input
                          id="content-order"
                          type="number"
                          value={contentForm.display_order}
                          onChange={(e) => setContentForm(prev => ({ ...prev, display_order: parseInt(e.target.value) }))}
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 pt-4">
                      <Button variant="outline" onClick={() => setShowContentDialog(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleSaveContent}>
                        {editingContent ? 'Update' : 'Create'} Content
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Content Sections */}
              <div className="grid grid-cols-1 gap-4">
                {serviceContent.length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-8">
                      <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p className="text-gray-500">No content sections created yet</p>
                      <p className="text-sm text-gray-400">Add detailed content to educate your clients</p>
                    </CardContent>
                  </Card>
                ) : (
                  serviceContent.map(content => (
                    <Card key={content.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge>{content.content_type}</Badge>
                              <div className={`w-2 h-2 rounded-full ${content.is_active ? 'bg-green-500' : 'bg-gray-300'}`} />
                            </div>
                            <CardTitle className="text-lg">{content.title}</CardTitle>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditContent(content)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteContent(content.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="prose max-w-none">
                          <p className="text-gray-700 line-clamp-3">
                            {content.content}
                          </p>
                          {content.content.length > 300 && (
                            <Button variant="link" className="p-0 h-auto">
                              Read more
                            </Button>
                          )}
                        </div>
                        <div className="flex items-center justify-between mt-4 text-sm text-gray-500">
                          <span>{content.content.length} characters</span>
                          <span>Order: {content.display_order}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            {/* Enhancements Tab */}
            <TabsContent value="enhancements" className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">AI Content Enhancements</h3>
                  <p className="text-sm text-gray-600">
                    Intelligent suggestions to improve your service content
                  </p>
                </div>
                <Button onClick={() => generateContentSuggestions(selectedService.id)}>
                  <Zap className="h-4 w-4 mr-2" />
                  Generate New Suggestions
                </Button>
              </div>

              {contentEnhancements.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-8">
                    <Lightbulb className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-gray-500">No enhancement suggestions yet</p>
                    <p className="text-sm text-gray-400">Generate AI-powered suggestions to improve your content</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {contentEnhancements.map(enhancement => (
                    <Card key={enhancement.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <Badge>{enhancement.enhancement_type}</Badge>
                              <Badge variant={enhancement.status === 'completed' ? 'default' : 'secondary'}>
                                {enhancement.status}
                              </Badge>
                              {enhancement.auto_generated && (
                                <Badge variant="outline">AI Generated</Badge>
                              )}
                            </div>
                            <CardTitle className="text-lg">
                              Content Enhancement Opportunities
                            </CardTitle>
                            <CardDescription>
                              Improve your content score from {enhancement.current_score} to {enhancement.target_score}
                            </CardDescription>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-blue-600">
                              +{enhancement.target_score - enhancement.current_score}
                            </div>
                            <div className="text-sm text-gray-600">Score points</div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div>
                            <h4 className="font-medium mb-2">Suggested Improvements:</h4>
                            <ul className="space-y-2">
                              {enhancement.improvements.map((improvement, idx) => (
                                <li key={idx} className="flex items-start gap-2">
                                  <ChevronRight className="h-4 w-4 text-blue-500 mt-0.5" />
                                  <span className="text-sm">{improvement}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div className="flex gap-2 pt-2">
                            <Button size="sm">
                              <CheckCircle2 className="h-4 w-4 mr-2" />
                              Apply Suggestions
                            </Button>
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4 mr-2" />
                              Preview Changes
                            </Button>
                            <Button variant="outline" size="sm">
                              <X className="h-4 w-4 mr-2" />
                              Dismiss
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Analytics Tab */}
            <TabsContent value="analytics" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* FAQ Analytics */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      FAQ Performance
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span>Total FAQ Views</span>
                        <span className="font-semibold">1,234</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Average Helpfulness</span>
                        <span className="font-semibold text-green-600">85%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Most Viewed Category</span>
                        <Badge>safety</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Improvement Needed</span>
                        <Badge variant="outline">3 FAQs</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Content Analytics */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Content Engagement
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span>Average Read Time</span>
                        <span className="font-semibold">3m 24s</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Completion Rate</span>
                        <span className="font-semibold text-green-600">92%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Most Popular Content</span>
                        <Badge>preparation</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Client Feedback Score</span>
                        <span className="font-semibold text-blue-600">4.8/5</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Improvement Opportunities */}
              <Card>
                <CardHeader>
                  <CardTitle>Improvement Opportunities</CardTitle>
                  <CardDescription>
                    AI-identified areas for content enhancement
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertDescription>
                        <strong>High Priority:</strong> Add pricing information to FAQ section - clients frequently ask about costs
                      </AlertDescription>
                    </Alert>
                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Medium Priority:</strong> Expand aftercare content with seasonal tips for Warsaw climate
                      </AlertDescription>
                    </Alert>
                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Low Priority:</strong> Add video testimonials to enhance trust signals
                      </AlertDescription>
                    </Alert>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
};

export default ServiceContentEnhancer;