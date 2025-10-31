import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { cn } from '@/lib/utils';
import { contentStrategyService } from '@/services/content-strategy.service';
import { ContentPillar, TargetAudienceSegment, ExpertiseLevel, ContentStrategyType } from '@/types/content-strategy';

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
  Sparkles,
  FileText,
  Users,
  TrendingUp,
  Award,
  BookOpen,
  Lightbulb,
  Target,
  BarChart3,
  Clock,
  Eye,
  Edit,
  Copy,
  Download,
  Star,
  Zap,
  Globe,
  MapPin,
  Calendar,
  Heart,
  MessageCircle
} from 'lucide-react';

interface ThoughtLeadershipTemplate {
  id: string;
  name: string;
  category: ContentPillar;
  targetAudience: TargetAudienceSegment;
  expertiseLevel: ExpertiseLevel;
  description: string;
  sectionStructure: TemplateSection[];
  requiredElements: string[];
  optionalElements: string[];
  wordCountGuidelines: {
    minimum: number;
    optimal: number;
    maximum: number;
  };
  credibilityRequirements: {
    industryCertifications: boolean;
    expertCredentials: boolean;
    dataSourcesCited: boolean;
    peerReviewPreferred: boolean;
  };
  evidenceRequirements: {
    scientificStudies: number;
    marketData: number;
    expertTestimonials: number;
    caseStudies: number;
  };
  expertIntegrationPoints: string[];
  localContextElements: {
    localExpertOpinions: boolean;
    warsawMarketData: boolean;
    localClientPreferences: boolean;
    regulatoryContext: boolean;
  };
  seasonalVariations: {
    [key: string]: {
      focus: string;
      localEvents: string[];
    };
  };
  culturalIntegrationPoints: string[];
  seoChecklist: string[];
  keywordIntegrationRules: {
    primaryKeywordDensity: string;
    secondaryKeywords: string;
    longTailKeywords: string;
    localSeoTerms: string;
  };
  internalLinkingStrategy: {
    servicePages: number;
    relatedBlogPosts: number;
    expertProfiles: number;
    bookingSystem: number;
  };
  visualRequirements: {
    featuredImage: boolean;
    infographics: number;
    expertPhotos: boolean;
    beforeAfterExamples: boolean;
  };
  brandIntegrationPoints: {
    logoPlacement: boolean;
    brandColors: boolean;
    luxuryAesthetics: boolean;
    consistentMessaging: boolean;
  };
  usageCount: number;
  successRate: number;
  estimatedTime: number; // minutes
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  tags: string[];
}

interface TemplateSection {
  title: string;
  description: string;
  wordCount: number;
  requiredElements: string[];
  tips: string[];
  examples: string[];
}

interface ThoughtLeadershipTemplatesProps {
  className?: string;
  language?: string;
  onTemplateSelect?: (template: ThoughtLeadershipTemplate) => void;
}

const BEAUTY_INNOVATION_TEMPLATES: ThoughtLeadershipTemplate[] = [
  {
    id: 'warsaw-beauty-innovation-analysis',
    name: 'Warsaw Beauty Innovation Analysis',
    category: 'beauty_innovation',
    targetAudience: 'beauty_professionals',
    expertiseLevel: 'professional',
    description: 'In-depth analysis of emerging beauty trends and technologies specifically for the Warsaw market',
    sectionStructure: [
      {
        title: 'Industry Context & Market Overview',
        description: 'Set the stage with current beauty industry landscape in Warsaw',
        wordCount: 150,
        requiredElements: ['Market statistics', 'Key players', 'Current trends'],
        tips: [
          'Use recent market data from Polish beauty associations',
          'Include both international and local brands',
          'Reference Warsaw\'s unique position in European beauty market'
        ],
        examples: [
          'Warsaw\'s beauty market grew 15% in 2024, outpacing European average',
          'Local Polish brands gaining market share from international giants'
        ]
      },
      {
        title: 'Trend Analysis & Emerging Technologies',
        description: 'Deep dive into current and emerging beauty technologies',
        wordCount: 300,
        requiredElements: ['Technology descriptions', 'Market impact', 'Adoption rates'],
        tips: [
          'Focus on technologies relevant to Polish climate and lifestyle',
          'Include both hardware and software innovations',
          'Consider regulatory environment in Poland/EU'
        ],
        examples: [
          'AI-powered skin analysis tools adapted for Eastern European skin types',
          'Sustainable beauty technologies gaining traction in environmentally conscious Warsaw'
        ]
      },
      {
        title: 'Innovation Spotlight: Technology Deep Dive',
        description: 'Detailed examination of specific innovative technologies',
        wordCount: 400,
        requiredElements: ['Technical details', 'Benefits', 'Limitations', 'Case studies'],
        tips: [
          'Choose technologies with proven results in Polish market',
          'Include scientific backing and clinical studies',
          'Address specific needs of Warsaw clientele'
        ],
        examples: [
          'Advanced lip enhancement techniques combining traditional methods with new technology',
          'Non-invasive skin rejuvenation technologies suitable for Polish climate'
        ]
      },
      {
        title: 'Warsaw Market Impact & Integration',
        description: 'How these innovations impact the local Warsaw beauty scene',
        wordCount: 250,
        requiredElements: ['Local adoption', 'Pricing impact', 'Client feedback', 'Business implications'],
        tips: [
          'Include testimonials from Warsaw-based beauty professionals',
          'Address cultural preferences and beauty standards',
          'Consider economic factors affecting adoption'
        ],
        examples: [
          'How Warsaw beauty salons are successfully integrating new technologies',
          'Client responses to innovative treatments in local market'
        ]
      },
      {
        title: 'Expert Predictions & Future Outlook',
        description: 'Forward-looking insights from industry experts',
        wordCount: 200,
        requiredElements: ['Expert quotes', 'Trend predictions', 'Market forecasts'],
        tips: [
          'Include predictions from Polish beauty industry leaders',
          'Consider regulatory changes on horizon',
          'Address global trends with local relevance'
        ],
        examples: [
          'Warsaw beauty experts predict 25% growth in demand for tech-enhanced services',
          'EU regulations expected to shape beauty innovation in coming years'
        ]
      },
      {
        title: 'Actionable Insights for Professionals',
        description: 'Practical takeaways for beauty professionals',
        wordCount: 200,
        requiredElements: ['Implementation steps', 'Investment considerations', 'Training needs'],
        tips: [
          'Provide specific actionable steps for Warsaw beauty businesses',
          'Include ROI calculations and timelines',
          'Address training and certification requirements'
        ],
        examples: [
          'Step-by-step guide to implementing new lip enhancement technology',
          'Cost-benefit analysis for Warsaw salons considering equipment upgrades'
        ]
      },
      {
        title: 'Conclusion & Strategic Summary',
        description: 'Wrap up with key takeaways and strategic recommendations',
        wordCount: 100,
        requiredElements: ['Key takeaways', 'Next steps', 'Resources'],
        tips: [
          'Reinforce the value proposition for Warsaw market',
          'Provide clear next steps and resources',
          'End with strong call to action for professional development'
        ],
        examples: [
          'Why staying ahead of beauty technology trends is crucial for Warsaw market success',
          'Recommended resources for continued professional development'
        ]
      }
    ],
    requiredElements: [
      'Data-driven analysis',
      'Expert perspectives',
      'Local market context',
      'Practical applications',
      'Future predictions'
    ],
    optionalElements: [
      'Client testimonials',
      'Before/after case studies',
      'Video demonstrations',
      'Interactive elements'
    ],
    wordCountGuidelines: {
      minimum: 1200,
      optimal: 1600,
      maximum: 2500
    },
    credibilityRequirements: {
      industryCertifications: true,
      expertCredentials: true,
      dataSourcesCited: true,
      peerReviewPreferred: true
    },
    evidenceRequirements: {
      scientificStudies: 2,
      marketData: 1,
      expertTestimonials: 2,
      caseStudies: 1
    },
    expertIntegrationPoints: [
      'Introduction section with expert credentials',
      'Technology analysis with expert commentary',
      'Market impact with local expert insights',
      'Future predictions from industry leaders'
    ],
    localContextElements: {
      localExpertOpinions: true,
      warsawMarketData: true,
      localClientPreferences: true,
      regulatoryContext: true
    },
    seasonalVariations: {
      spring: {
        focus: 'Pre-summer beauty preparation and new treatment launches',
        localEvents: ['Warsaw Beauty Week', 'Spring Fashion Week']
      },
      summer: {
        focus: 'Protective treatments and sun-safe innovations',
        localEvents: ['Open Air Festivals', 'Summer Beauty Events']
      },
      autumn: {
        focus: 'Recovery treatments and winter preparation technologies',
        localEvents: ['Warsaw Fashion Week', 'Beauty Trade Shows']
      },
      winter: {
        focus: 'Intensive treatments and new year preparation innovations',
        localEvents: ['New Year Beauty Prep', 'Industry Conferences']
      }
    },
    culturalIntegrationPoints: [
      'Polish beauty standards and preferences',
      'Eastern European skin type considerations',
      'Local climate impact on beauty treatments',
      'Cultural attitudes toward beauty enhancement'
    ],
    seoChecklist: [
      'Meta title with Warsaw beauty focus',
      'Meta description highlighting innovation',
      'H1 tag with primary keywords',
      'H2 tags for each section',
      'Image alt text for all visuals',
      'Internal links to relevant services',
      'External authority links to research',
      'Local SEO terms for Warsaw market'
    ],
    keywordIntegrationRules: {
      primaryKeywordDensity: '1-2%',
      secondaryKeywords: '3-5 variations',
      longTailKeywords: 'natural integration',
      localSeoTerms: 'warsaw-specific terms like "beauty salon Warsaw", "innovative treatments Poland"'
    },
    internalLinkingStrategy: {
      servicePages: 3,
      relatedBlogPosts: 2,
      expertProfiles: 1,
      bookingSystem: 1
    },
    visualRequirements: {
      featuredImage: true,
      infographics: 2,
      expertPhotos: true,
      beforeAfterExamples: true
    },
    brandIntegrationPoints: {
      logoPlacement: true,
      brandColors: true,
      luxuryAesthetics: true,
      consistentMessaging: true
    },
    usageCount: 0,
    successRate: 85,
    estimatedTime: 180,
    difficulty: 'advanced',
    tags: ['innovation', 'technology', 'warsaw', 'professional', 'market-analysis']
  },
  {
    id: 'seasonal-beauty-guide-warsaw',
    name: 'Seasonal Beauty Guide for Warsaw',
    category: 'beauty_innovation',
    targetAudience: 'luxury_clients',
    expertiseLevel: 'intermediate',
    description: 'Comprehensive seasonal beauty guide adapted for Warsaw climate and lifestyle',
    sectionStructure: [
      {
        title: 'Seasonal Beauty Overview',
        description: 'Introduction to current seasonal beauty needs in Warsaw',
        wordCount: 120,
        requiredElements: ['Seasonal context', 'Climate impact', 'Lifestyle factors'],
        tips: [
          'Consider Warsaw\'s continental climate',
          'Address seasonal lifestyle changes',
          'Include local seasonal events'
        ],
        examples: [
          'How Warsaw\'s humid summers affect skin care routines',
          'Winter indoor heating impact on beauty treatments'
        ]
      },
      {
        title: 'Climate-Adapted Skincare',
        description: 'Skincare recommendations for current Warsaw climate',
        wordCount: 250,
        requiredElements: ['Product recommendations', 'Treatment schedules', 'Protection methods'],
        tips: [
          'Focus on products suitable for Polish climate',
          'Include both professional and at-home care',
          'Address pollution concerns in urban environment'
        ],
        examples: [
          'Best moisturizers for Warsaw winter conditions',
          'Summer skincare routines for city dwellers'
        ]
      },
      {
        title: 'Seasonal Treatment Recommendations',
        description: 'Professional beauty treatments for the current season',
        wordCount: 300,
        requiredElements: ['Treatment descriptions', 'Benefits', 'Timing considerations'],
        tips: [
          'Align treatments with seasonal events',
          'Consider recovery time for social calendar',
          'Address seasonal skin concerns'
        ],
        examples: [
          'Pre-summer body preparation treatments',
          'Winter skin rejuvenation sessions'
        ]
      },
      {
        title: 'Local Beauty Events & Opportunities',
        description: 'Seasonal beauty events and opportunities in Warsaw',
        wordCount: 150,
        requiredElements: ['Event listings', 'Special offers', 'Networking opportunities'],
        tips: [
          'Include major Warsaw beauty events',
          'Highlight seasonal promotions',
          'Mention local beauty community gatherings'
        ],
        examples: [
          'Warsaw Beauty Week seasonal highlights',
          'Seasonal workshops and masterclasses'
        ]
      },
      {
        title: 'Expert Tips & Tricks',
        description: 'Professional tips for seasonal beauty success',
        wordCount: 200,
        requiredElements: ['Professional advice', 'Quick tips', 'Dos and don\'ts'],
        tips: [
          'Include advice from local beauty experts',
          'Provide practical, actionable tips',
          'Address common seasonal concerns'
        ],
        examples: [
          'Warsaw beauty experts\' winter skin tips',
          'Summer beauty hacks from local professionals'
        ]
      }
    ],
    requiredElements: [
      'Seasonal context',
      'Climate considerations',
      'Local relevance',
      'Practical advice'
    ],
    optionalElements: [
      'Product reviews',
      'Treatment experiences',
      'Photo galleries',
      'Video tutorials'
    ],
    wordCountGuidelines: {
      minimum: 1000,
      optimal: 1400,
      maximum: 2000
    },
    credibilityRequirements: {
      industryCertifications: false,
      expertCredentials: true,
      dataSourcesCited: false,
      peerReviewPreferred: false
    },
    evidenceRequirements: {
      scientificStudies: 1,
      marketData: 0,
      expertTestimonials: 2,
      caseStudies: 1
    },
    expertIntegrationPoints: [
      'Expert tips section',
      'Treatment recommendations with expert validation',
      'Local beauty professional insights'
    ],
    localContextElements: {
      localExpertOpinions: true,
      warsawMarketData: false,
      localClientPreferences: true,
      regulatoryContext: false
    },
    seasonalVariations: {
      spring: {
        focus: 'Renewal and preparation for summer',
        localEvents: ['Spring Beauty Festivals', 'Easter Preparation Events']
      },
      summer: {
        focus: 'Protection and maintenance',
        localEvents: ['Summer Beauty Workshops', 'Outdoor Event Preparation']
      },
      autumn: {
        focus: 'Recovery and rejuvenation',
        localEvents: ['Fall Beauty Renewal', 'Fashion Week Preparation']
      },
      winter: {
        focus: 'Intensive care and protection',
        localEvents: ['Winter Beauty Retreats', 'Holiday Preparation']
      }
    },
    culturalIntegrationPoints: [
      'Polish seasonal beauty traditions',
      'Local holiday beauty preparations',
      'Regional beauty preferences'
    ],
    seoChecklist: [
      'Seasonal keywords',
      'Warsaw location terms',
      'Beauty treatment terms'
    ],
    keywordIntegrationRules: {
      primaryKeywordDensity: '1-2%',
      secondaryKeywords: '2-3 variations',
      longTailKeywords: 'natural integration',
      localSeoTerms: 'Warsaw-specific seasonal terms'
    },
    internalLinkingStrategy: {
      servicePages: 2,
      relatedBlogPosts: 3,
      expertProfiles: 1,
      bookingSystem: 1
    },
    visualRequirements: {
      featuredImage: true,
      infographics: 1,
      expertPhotos: false,
      beforeAfterExamples: true
    },
    brandIntegrationPoints: {
      logoPlacement: true,
      brandColors: true,
      luxuryAesthetics: true,
      consistentMessaging: true
    },
    usageCount: 0,
    successRate: 78,
    estimatedTime: 120,
    difficulty: 'intermediate',
    tags: ['seasonal', 'climate', 'warsaw', 'skincare', 'lifestyle']
  }
];

export const ThoughtLeadershipTemplates = ({
  className,
  language = 'en',
  onTemplateSelect
}: ThoughtLeadershipTemplatesProps) => {
  const { t } = useTranslation();
  const [templates, setTemplates] = useState<ThoughtLeadershipTemplate[]>(BEAUTY_INNOVATION_TEMPLATES);
  const [selectedTemplate, setSelectedTemplate] = useState<ThoughtLeadershipTemplate | null>(null);
  const [filterCategory, setFilterCategory] = useState<ContentPillar | 'all'>('all');
  const [filterAudience, setFilterAudience] = useState<TargetAudienceSegment | 'all'>('all');
  const [filterDifficulty, setFilterDifficulty] = useState<'all' | 'beginner' | 'intermediate' | 'advanced'>('all');
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [createFromTemplate, setCreateFromTemplate] = useState(false);
  const [customFormData, setCustomFormData] = useState({
    title: '',
    targetAudience: '',
    expertiseLevel: '',
    customizations: ''
  });

  const filteredTemplates = templates.filter(template => {
    if (filterCategory !== 'all' && template.category !== filterCategory) return false;
    if (filterAudience !== 'all' && template.targetAudience !== filterAudience) return false;
    if (filterDifficulty !== 'all' && template.difficulty !== filterDifficulty) return false;
    return true;
  });

  const handleTemplateSelect = (template: ThoughtLeadershipTemplate) => {
    setSelectedTemplate(template);
    if (onTemplateSelect) {
      onTemplateSelect(template);
    }
  };

  const handleCreateFromTemplate = () => {
    if (!selectedTemplate) return;

    // Here you would implement the logic to create content from template
    toast.success(`Creating content from template: ${selectedTemplate.name}`);
    setCreateFromTemplate(false);
  };

  const handlePreviewTemplate = (template: ThoughtLeadershipTemplate) => {
    setSelectedTemplate(template);
    setShowPreviewDialog(true);
  };

  const handleDuplicateTemplate = (template: ThoughtLeadershipTemplate) => {
    const duplicatedTemplate = {
      ...template,
      id: `${template.id}-copy-${Date.now()}`,
      name: `${template.name} (Copy)`,
      usageCount: 0
    };
    setTemplates([...templates, duplicatedTemplate]);
    toast.success('Template duplicated successfully');
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryIcon = (category: ContentPillar) => {
    switch (category) {
      case 'beauty_innovation': return <Sparkles className="h-5 w-5" />;
      case 'fitness_science': return <TrendingUp className="h-5 w-5" />;
      case 'wellness_education': return <Heart className="h-5 w-5" />;
      case 'warsaw_lifestyle': return <MapPin className="h-5 w-5" />;
      case 'industry_standards': return <Award className="h-5 w-5" />;
      case 'client_education': return <BookOpen className="h-5 w-5" />;
      case 'trend_analysis': return <BarChart3 className="h-5 w-5" />;
      case 'expert_opinion': return <MessageCircle className="h-5 w-5" />;
      default: return <FileText className="h-5 w-5" />;
    }
  };

  const renderTemplateCard = (template: ThoughtLeadershipTemplate) => (
    <Card key={template.id} className="hover:shadow-lg transition-shadow cursor-pointer">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            {getCategoryIcon(template.category)}
            <div>
              <CardTitle className="text-lg">{template.name}</CardTitle>
              <CardDescription className="text-sm mt-1">
                {template.description}
              </CardDescription>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <Badge variant="outline" className={getDifficultyColor(template.difficulty)}>
              {template.difficulty}
            </Badge>
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Clock className="h-3 w-3" />
              {template.estimatedTime}min
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Tags */}
        <div className="flex flex-wrap gap-1">
          {template.tags.slice(0, 3).map(tag => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
          {template.tags.length > 3 && (
            <Badge variant="secondary" className="text-xs">
              +{template.tags.length - 3}
            </Badge>
          )}
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-lg font-semibold text-blue-600">
              {template.wordCountGuidelines.optimal}
            </div>
            <div className="text-xs text-gray-600">Words</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-green-600">
              {template.sectionStructure.length}
            </div>
            <div className="text-xs text-gray-600">Sections</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-purple-600">
              {template.successRate}%
            </div>
            <div className="text-xs text-gray-600">Success</div>
          </div>
        </div>

        {/* Required Elements */}
        <div className="space-y-2">
          <div className="text-sm font-medium flex items-center gap-2">
            <Target className="h-4 w-4" />
            Key Requirements:
          </div>
          <div className="flex flex-wrap gap-1">
            {template.requiredElements.slice(0, 2).map(element => (
              <Badge key={element} variant="outline" className="text-xs">
                {element}
              </Badge>
            ))}
            {template.requiredElements.length > 2 && (
              <Badge variant="outline" className="text-xs">
                +{template.requiredElements.length - 2}
              </Badge>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePreviewTemplate(template)}
            className="flex-1"
          >
            <Eye className="h-4 w-4 mr-1" />
            Preview
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDuplicateTemplate(template)}
          >
            <Copy className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            onClick={() => handleTemplateSelect(template)}
            className="flex-1"
          >
            <Sparkles className="h-4 w-4 mr-1" />
            Use Template
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderTemplatePreview = () => {
    if (!selectedTemplate) return null;

    return (
      <div className="space-y-6">
        {/* Template Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            {getCategoryIcon(selectedTemplate.category)}
            <h3 className="text-xl font-semibold">{selectedTemplate.name}</h3>
            <Badge className={getDifficultyColor(selectedTemplate.difficulty)}>
              {selectedTemplate.difficulty}
            </Badge>
          </div>
          <p className="text-gray-600">{selectedTemplate.description}</p>
        </div>

        {/* Template Structure */}
        <div className="space-y-4">
          <h4 className="font-semibold flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Content Structure
          </h4>

          <Accordion type="single" collapsible className="w-full">
            {selectedTemplate.sectionStructure.map((section, index) => (
              <AccordionItem key={index} value={`section-${index}`}>
                <AccordionTrigger className="text-left">
                  <div className="flex items-center justify-between w-full pr-4">
                    <span className="font-medium">{section.title}</span>
                    <span className="text-sm text-gray-500">{section.wordCount} words</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-3">
                  <p className="text-gray-600">{section.description}</p>

                  {section.requiredElements.length > 0 && (
                    <div>
                      <div className="font-medium text-sm mb-2">Required Elements:</div>
                      <div className="flex flex-wrap gap-1">
                        {section.requiredElements.map(element => (
                          <Badge key={element} variant="outline" className="text-xs">
                            {element}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {section.tips.length > 0 && (
                    <div>
                      <div className="font-medium text-sm mb-2 flex items-center gap-1">
                        <Lightbulb className="h-4 w-4" />
                        Tips:
                      </div>
                      <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                        {section.tips.map((tip, tipIndex) => (
                          <li key={tipIndex}>{tip}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {section.examples.length > 0 && (
                    <div>
                      <div className="font-medium text-sm mb-2">Examples:</div>
                      <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                        {section.examples.map((example, exampleIndex) => (
                          <li key={exampleIndex} className="italic">{example}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        {/* Requirements */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <h4 className="font-semibold flex items-center gap-2">
              <Award className="h-5 w-5" />
              Credibility Requirements
            </h4>
            <div className="space-y-2">
              {Object.entries(selectedTemplate.credibilityRequirements).map(([key, value]) => (
                <div key={key} className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${value ? 'bg-green-500' : 'bg-gray-300'}`} />
                  <span className="text-sm capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Evidence Requirements
            </h4>
            <div className="space-y-2">
              {Object.entries(selectedTemplate.evidenceRequirements).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-sm capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                  <Badge variant="outline">{value}</Badge>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* SEO Guidelines */}
        <div className="space-y-3">
          <h4 className="font-semibold flex items-center gap-2">
            <Globe className="h-5 w-5" />
            SEO Guidelines
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="font-medium text-sm mb-2">Keyword Integration:</div>
              <div className="space-y-1">
                {Object.entries(selectedTemplate.keywordIntegrationRules).map(([key, value]) => (
                  <div key={key} className="text-sm">
                    <span className="font-medium">{key}:</span> {value}
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="font-medium text-sm mb-2">Internal Linking:</div>
              <div className="space-y-1">
                {Object.entries(selectedTemplate.internalLinkingStrategy).map(([key, value]) => (
                  <div key={key} className="flex justify-between text-sm">
                    <span className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                    <Badge variant="outline">{value}</Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Sparkles className="w-8 h-8 text-primary" />
            Thought Leadership Templates
          </h1>
          <p className="text-muted-foreground mt-2">
            Professional templates for creating authoritative beauty industry content
          </p>
        </div>
        <Button onClick={() => setCreateFromTemplate(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Custom Template
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label className="text-sm font-medium mb-2 block">Category</Label>
              <Select value={filterCategory} onValueChange={(value: any) => setFilterCategory(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="beauty_innovation">Beauty Innovation</SelectItem>
                  <SelectItem value="fitness_science">Fitness Science</SelectItem>
                  <SelectItem value="wellness_education">Wellness Education</SelectItem>
                  <SelectItem value="warsaw_lifestyle">Warsaw Lifestyle</SelectItem>
                  <SelectItem value="industry_standards">Industry Standards</SelectItem>
                  <SelectItem value="client_education">Client Education</SelectItem>
                  <SelectItem value="trend_analysis">Trend Analysis</SelectItem>
                  <SelectItem value="expert_opinion">Expert Opinion</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-medium mb-2 block">Target Audience</Label>
              <Select value={filterAudience} onValueChange={(value: any) => setFilterAudience(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Audiences</SelectItem>
                  <SelectItem value="beauty_professionals">Beauty Professionals</SelectItem>
                  <SelectItem value="fitness_enthusiasts">Fitness Enthusiasts</SelectItem>
                  <SelectItem value="luxury_clients">Luxury Clients</SelectItem>
                  <SelectItem value="wellness_seekers">Wellness Seekers</SelectItem>
                  <SelectItem value="local_warsaw_residents">Local Warsaw Residents</SelectItem>
                  <SelectItem value="international_clients">International Clients</SelectItem>
                  <SelectItem value="medical_professionals">Medical Professionals</SelectItem>
                  <SelectItem value="beauty_students">Beauty Students</SelectItem>
                  <SelectItem value="fitness_beginners">Fitness Beginners</SelectItem>
                  <SelectItem value="seasonal_clients">Seasonal Clients</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-medium mb-2 block">Difficulty</Label>
              <Select value={filterDifficulty} onValueChange={(value: any) => setFilterDifficulty(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => {
                  setFilterCategory('all');
                  setFilterAudience('all');
                  setFilterDifficulty('all');
                }}
                className="w-full"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map(template => renderTemplateCard(template))}
      </div>

      {/* Template Preview Dialog */}
      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Template Preview</DialogTitle>
            <DialogDescription>
              Detailed structure and requirements for this thought leadership template
            </DialogDescription>
          </DialogHeader>
          {renderTemplatePreview()}
          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={() => setShowPreviewDialog(false)}>
              Close
            </Button>
            <Button onClick={handleCreateFromTemplate} className="flex-1">
              <Sparkles className="h-4 w-4 mr-2" />
              Create Content from Template
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create from Template Dialog */}
      <Dialog open={createFromTemplate} onOpenChange={setCreateFromTemplate}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Content from Template</DialogTitle>
            <DialogDescription>
              Customize the template to create your thought leadership content
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Content Title</Label>
              <Input
                id="title"
                value={customFormData.title}
                onChange={(e) => setCustomFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter your content title"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="targetAudience">Target Audience</Label>
                <Select value={customFormData.targetAudience} onValueChange={(value) => setCustomFormData(prev => ({ ...prev, targetAudience: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select audience" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beauty_professionals">Beauty Professionals</SelectItem>
                    <SelectItem value="luxury_clients">Luxury Clients</SelectItem>
                    <SelectItem value="wellness_seekers">Wellness Seekers</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="expertiseLevel">Expertise Level</Label>
                <Select value={customFormData.expertiseLevel} onValueChange={(value) => setCustomFormData(prev => ({ ...prev, expertiseLevel: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                    <SelectItem value="professional">Professional</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="customizations">Customizations</Label>
              <Textarea
                id="customizations"
                value={customFormData.customizations}
                onChange={(e) => setCustomFormData(prev => ({ ...prev, customizations: e.target.value }))}
                placeholder="Describe any customizations or specific focus areas for this content..."
                rows={4}
              />
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={() => setCreateFromTemplate(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateFromTemplate} className="flex-1">
              <Zap className="h-4 w-4 mr-2" />
              Generate Content
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ThoughtLeadershipTemplates;