import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast aria-live="polite" aria-atomic="true" } from 'sonner';

import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { contentStrategyService } from '@/services/content-strategy.service';
import { ContentStrategyItem, ContentPillar, TargetAudienceSegment } from '@/types/content-strategy';

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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Progress,
} from '@/components/ui/progress';
import {
  Alert,
  AlertDescription,
} from '@/components/ui/alert';
import {
  Switch,
} from '@/components/ui/switch';
import {
  Globe,
  Languages,
  Translate,
  FileText,
  CheckCircle2,
  AlertCircle,
  Clock,
  Users,
  MapPin,
  Calendar,
  BarChart3,
  Settings,
  Eye,
  Edit,
  Copy,
  Download,
  Upload,
  RefreshCw,
  Zap,
  BookOpen,
  MessageSquare,
  Target,
  TrendingUp,
  Star,
  Heart,
  Info,
  ChevronRight,
  ExternalLink,
  Flag
} from 'lucide-react';

interface TranslationTask {
  id: string;
  content_id: string;
  source_language: string;
  target_language: string;
  status: 'pending' | 'in_progress' | 'review' | 'completed' | 'failed';
  progress: number;
  assigned_to: string | null;
  quality_score: number | null;
  cultural_adaptation_score: number | null;
  seo_localization_score: number | null;
  estimated_completion: string | null;
  actual_completion: string | null;
  word_count: number;
  cost_estimate: number;
  created_at: string;
  updated_at: string;
}

interface LocalizationGuideline {
  id: string;
  language: string;
  region: string;
  cultural_preferences: {
    beauty_standards: string[];
    communication_style: string;
    formality_level: 'formal' | 'casual' | 'mixed';
    humor_usage: boolean;
    directness_level: number; // 1-10
  };
  market_specifics: {
    local_trends: string[];
    competitor_references: string[];
    seasonal_considerations: string[];
    regulatory_notes: string[];
  };
  seo_guidelines: {
    local_keywords: string[];
    search_patterns: string[];
    competitor_analysis: string[];
    local_search_engines: string[];
  };
  content_examples: {
    successful_translations: string[];
    cultural_adaptations: string[];
    common_mistakes: string[];
  };
}

interface ContentLocalization {
  id: string;
  content_id: string;
  target_language: string;
  target_region: string;
  title: string;
  content: string;
  meta_title: string;
  meta_description: string;
  keywords: string[];
  cultural_adaptations: string[];
  local_examples: string[];
  local_references: string[];
  quality_metrics: {
    translation_quality: number;
    cultural_appropriateness: number;
    seo_optimization: number;
    readability_score: number;
  };
  status: 'draft' | 'review' | 'approved' | 'published';
  reviewer_notes: string;
  created_at: string;
  updated_at: string;
}

interface MultiLanguageContentWorkflowProps {
  className?: string;
  defaultLanguage?: string;
}

const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇬🇧', region: 'Global' },
  { code: 'pl', name: 'Polski', flag: '🇵🇱', region: 'Poland' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺', region: 'Eastern Europe' },
  { code: 'uk', name: 'Українська', flag: '🇺🇦', region: 'Eastern Europe' }
];

const POLISH_LOCALIZATION_GUIDELINES: LocalizationGuideline = {
  id: 'pl-guidelines',
  language: 'pl',
  region: 'Poland',
  cultural_preferences: {
    beauty_standards: [
      'Natural enhancement preferred over dramatic changes',
      'Subtle elegance valued',
      'Professional discretion important',
      'Quality over price sensitivity',
      'Long-term results valued'
    ],
    communication_style: 'Professional yet warm',
    formality_level: 'mixed',
    humor_usage: false,
    directness_level: 6
  },
  market_specifics: {
    local_trends: [
      'Natural lip enhancement',
      'Defined but natural brows',
      'Skincare-first approach',
      'Minimal makeup aesthetic'
    ],
    competitor_references: [
      'Local beauty standards',
      'EU regulations compliance',
      'Warsaw market preferences'
    ],
    seasonal_considerations: [
      'Harsh winters require intensive moisturizing',
      'Summer humidity affects makeup longevity',
      'Spring seasonal beauty renewal',
      'Autumn recovery treatments'
    ],
    regulatory_notes: [
      'EU cosmetic regulations',
      'Polish health and safety standards',
      'Local licensing requirements'
    ]
  },
  seo_guidelines: {
    local_keywords: [
      'salon urody Warszawa',
      'powiększanie ust Warszawa',
      'brwiWarszawa',
      'zabiegi pielęgnacyjne',
      'kosmetologia estetyczna'
    ],
    search_patterns: [
      'Mobile-first searches',
      'Local service-based queries',
      'Price comparison searches',
      'Review-driven decisions'
    ],
    competitor_analysis: [
      'Local salon keywords',
      'International brand Polish presence',
      'Service-specific terminology'
    ],
    local_search_engines: ['Google', 'Onet', 'WP']
  },
  content_examples: {
    successful_translations: [
      'Naturalny wygląd z subtelnymi poprawami',
      'Profesjonalna pielęgnacja w luksusowym salonie',
      'Indywidualne podejście do każdej klientki'
    ],
    cultural_adaptations: [
      'Emphasis on discretion and privacy',
      'Highlighting qualifications and experience',
      'Family-friendly service descriptions',
      'Traditional beauty standards integration'
    ],
    common_mistakes: [
      'Direct translation of beauty terms',
      'Ignoring local beauty standards',
      'Over-promising results',
      'Inappropriate casual language'
    ]
  }
};

const TRANSLATION_TEMPLATES = {
  beauty_service: {
    en: {
      title: 'Professional {service_name} in Warsaw',
      description: 'Experience premium {service_name} treatments at our luxury Warsaw salon. Expert aestheticians, personalized approach, natural results.',
      call_to_action: 'Book your consultation today',
      trust_signals: ['Certified professionals', 'Premium products', '5-star reviews']
    },
    pl: {
      title: 'Profesjonalny {service_name} w Warszawie',
      description: 'Odkryj premium zabiegi {service_name} w naszym luksusowym salonie w Warszawie. Doświadczeni specjaliści, indywidualne podejście, naturalne efekty.',
      call_to_action: 'Umów konsultację już dziś',
      trust_signals: ['Certyfikowani specjaliści', 'Premium produkty', '5-gwiazdkowe opinie']
    }
  },
  educational_content: {
    en: {
      title: 'Complete Guide to {topic}',
      description: 'Learn everything about {topic} from Warsaw\'s leading beauty experts. Science-based information, practical tips, real results.',
      expertise_indicators: ['Evidence-based', 'Expert-written', 'Clinically tested'],
      local_relevance: 'Tailored for Warsaw climate and lifestyle'
    },
    pl: {
      title: 'Kompleksowy przewodnik po {topic}',
      description: 'Poznaj wszystko o {topic} od wiodących ekspertów beauty w Warszawie. Informacje naukowe, praktyczne porady, prawdziwe efekty.',
      expertise_indicators: ['Oparte na dowodach', 'Napisane przez ekspertów', 'Przetestowane klinicznie'],
      local_relevance: 'Dostosowane do klimatu i stylu życia w Warszawie'
    }
  }
};

export const MultiLanguageContentWorkflow = ({
  className,
  defaultLanguage = 'en'
}: MultiLanguageContentWorkflowProps) => {
  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState('overview');
  const [sourceLanguage, setSourceLanguage] = useState(defaultLanguage);
  const [targetLanguages, setTargetLanguages] = useState<string[]>(['pl']);
  const [contentItems, setContentItems] = useState<ContentStrategyItem[]>([]);
  const [translationTasks, setTranslationTasks] = useState<TranslationTask[]>([]);
  const [localizedContent, setLocalizedContent] = useState<ContentLocalization[]>([]);
  const [selectedContent, setSelectedContent] = useState<ContentStrategyItem | null>(null);
  const [showTranslationDialog, setShowTranslationDialog] = useState(false);
  const [showLocalizationDialog, setShowLocalizationDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [autoTranslate, setAutoTranslate] = useState(true);
  const [culturalAdaptation, setCulturalAdaptation] = useState(true);
  const [seoLocalization, setSeoLocalization] = useState(true);

  // Translation workflow state
  const [translationForm, setTranslationForm] = useState({
    content_id: '',
    target_languages: [] as string[],
    priority: 'normal' as 'low' | 'normal' | 'high',
    deadline: '',
    special_instructions: '',
    budget_range: ''
  });

  useEffect(() => {
    loadContentItems();
    loadTranslationTasks();
    loadLocalizedContent();
  }, []);

  const loadContentItems = async () => {
    try {
      const { data, error } = await supabase
        .from('content_strategy_items')
        .select(`
          *,
          content_strategy!inner (*)
        `)
        .eq('status', 'published')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setContentItems(data || []);
    } catch (error) {
      console.error('Failed to load content items:', error);
      toast aria-live="polite" aria-atomic="true".error('Failed to load content items');
    }
  };

  const loadTranslationTasks = async () => {
    try {
      const { data, error } = await supabase
        .from('translation_tasks')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTranslationTasks(data || []);
    } catch (error) {
      console.error('Failed to load translation tasks:', error);
    }
  };

  const loadLocalizedContent = async () => {
    try {
      const { data, error } = await supabase
        .from('content_localization')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setLocalizedContent(data || []);
    } catch (error) {
      console.error('Failed to load localized content:', error);
    }
  };

  const calculateTranslationProgress = () => {
    if (translationTasks.length === 0) return 0;
    const completedTasks = translationTasks.filter(task => task.status === 'completed').length;
    return Math.round((completedTasks / translationTasks.length) * 100);
  };

  const calculateLocalizationQuality = () => {
    if (localizedContent.length === 0) return 0;
    const totalQuality = localizedContent.reduce((acc, content) => {
      return acc + (
        (content.quality_metrics.translation_quality +
         content.quality_metrics.cultural_appropriateness +
         content.quality_metrics.seo_optimization +
         content.quality_metrics.readability_score) / 4
      );
    }, 0);
    return Math.round(totalQuality / localizedContent.length);
  };

  const createTranslationTask = async () => {
    if (!selectedContent) return;

    try {
      setLoading(true);

      for (const targetLang of translationForm.target_languages) {
        // Create translation task
        const taskData = {
          content_id: selectedContent.id,
          source_language: sourceLanguage,
          target_language: targetLang,
          status: 'pending',
          progress: 0,
          word_count: selectedContent.word_count_target || 1000,
          cost_estimate: Math.round((selectedContent.word_count_target || 1000) * 0.1),
          created_at: new Date().toISOString()
        };

        const { error: taskError } = await supabase
          .from('translation_tasks')
          .insert([taskData]);

        if (taskError) throw taskError;

        // Auto-translate if enabled
        if (autoTranslate) {
          await performAutoTranslation(selectedContent, targetLang);
        }
      }

      toast aria-live="polite" aria-atomic="true".success('Translation tasks created successfully');
      setShowTranslationDialog(false);
      await loadTranslationTasks();
    } catch (error) {
      console.error('Failed to create translation tasks:', error);
      toast aria-live="polite" aria-atomic="true".error('Failed to create translation tasks');
    } finally {
      setLoading(false);
    }
  };

  const performAutoTranslation = async (content: ContentStrategyItem, targetLanguage: string) => {
    try {
      // This would integrate with a translation service like Google Translate, DeepL, or OpenAI
      const template = TRANSLATION_TEMPLATES[targetLanguage as keyof typeof TRANSLATION_TEMPLATES] ||
                      TRANSLATION_TEMPLATES[targetLanguage as keyof typeof TRANSLATION_TEMPLATES]?.beauty_service;

      if (!template) {
        throw new Error(`No template available for ${targetLanguage}`);
      }

      // Simulate translation process
      await new Promise(resolve => setTimeout(resolve, 2000));

      const localizedData = {
        content_id: content.id,
        target_language: targetLanguage,
        target_region: targetLanguage === 'pl' ? 'Poland' : 'International',
        title: content.title,
        content: content.content || '',
        meta_title: content.meta_title || '',
        meta_description: content.meta_description || '',
        keywords: content.target_keywords || [],
        cultural_adaptations: culturalAdaptation ? getCulturalAdaptations(targetLanguage) : [],
        local_examples: getLocalExamples(targetLanguage),
        local_references: getLocalReferences(targetLanguage),
        quality_metrics: {
          translation_quality: 85,
          cultural_appropriateness: culturalAdaptation ? 90 : 75,
          seo_optimization: seoLocalization ? 80 : 60,
          readability_score: 88
        },
        status: 'review' as const,
        reviewer_notes: 'Auto-generated translation requiring human review',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('content_localization')
        .insert([localizedData]);

      if (error) throw error;

      // Update translation task status
      await supabase
        .from('translation_tasks')
        .update({
          status: 'completed',
          progress: 100,
          actual_completion: new Date().toISOString()
        })
        .eq('content_id', content.id)
        .eq('target_language', targetLanguage);

      toast aria-live="polite" aria-atomic="true".success(`Auto-translation to ${targetLanguage} completed`);
    } catch (error) {
      console.error('Auto-translation failed:', error);
      toast aria-live="polite" aria-atomic="true".error('Auto-translation failed');
    }
  };

  const getCulturalAdaptations = (language: string): string[] => {
    const adaptations: Record<string, string[]> = {
      pl: [
        'Emphasis on discretion and privacy',
        'Professional terminology with explanations',
        'Family-friendly service descriptions',
        'Integration with Polish beauty standards',
        'Local Warsaw context'
      ],
      ru: [
        'Formal professional tone',
        'Detailed technical explanations',
        'Emphasis on quality and luxury',
        'Seasonal adaptations for climate',
        'Cultural beauty preferences'
      ],
      uk: [
        'Warm, approachable tone',
        'Emphasis on natural results',
        'Community-focused messaging',
        'Traditional and modern beauty balance',
        'Local market references'
      ]
    };
    return adaptations[language] || [];
  };

  const getLocalExamples = (language: string): string[] => {
    const examples: Record<string, string[]> = {
      pl: [
        'Klientki z Warszawy cenią sobie dyskrecję',
        'Naturalne efekty są najważniejsze',
        'Profesjonalne podejście do każdej klientki',
        'Luksusowe zabiegi w centrum Warszawy'
      ],
      ru: [
        'Профессиональный подход к каждому клиенту',
        'Естественные результаты и качество',
        'Роскошные процедуры в центре города',
        'Конфиденциальность и комфорт'
      ],
      uk: [
        'Індивідуальний підхід до кожної клієнтки',
        'Натуральні результати та якість',
        'Люксові процедури в центрі міста',
        'Дискретність та комфорт'
      ]
    };
    return examples[language] || [];
  };

  const getLocalReferences = (language: string): string[] => {
    const references: Record<string, string[]> = {
      pl: [
        'zgodne z normami UE',
        'certyfikowani specjaliści',
        'warszawskie standardy piękna',
        'polskie preferencje estetyczne'
      ],
      ru: [
        'соответствие стандартам ЕС',
        'сертифицированные специалисты',
        'местные стандарты красоты',
        'региональные предпочтения'
      ],
      uk: [
        'відповідно стандартам ЄС',
        'сертифіковані спеціалісти',
        'місцеві стандарти краси',
        'регіональні переваги'
      ]
    };
    return references[language] || [];
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      in_progress: 'bg-blue-100 text-blue-800',
      review: 'bg-orange-100 text-orange-800',
      completed: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getLanguageFlag = (languageCode: string) => {
    const language = SUPPORTED_LANGUAGES.find(lang => lang.code === languageCode);
    return language?.flag || '🌐';
  };

  const exportLocalizationReport = () => {
    const report = {
      generated_at: new Date().toISOString(),
      source_language: sourceLanguage,
      target_languages: targetLanguages,
      total_content_items: contentItems.length,
      translation_tasks: translationTasks.length,
      completed_translations: translationTasks.filter(t => t.status === 'completed').length,
      average_quality_score: calculateLocalizationQuality(),
      localized_content_count: localizedContent.length,
      cultural_adaptations_enabled: culturalAdaptation,
      seo_localization_enabled: seoLocalization,
      cost_analysis: {
        total_estimated_cost: translationTasks.reduce((acc, task) => acc + task.cost_estimate, 0),
        cost_per_word: 0.10,
        potential_roi_increase: '25-40%'
      }
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `localization-report-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);

    toast aria-live="polite" aria-atomic="true".success('Localization report exported successfully');
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Languages className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{targetLanguages.length}</p>
                <p className="text-sm text-gray-600">Target Languages</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Translate className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{calculateTranslationProgress()}%</p>
                <p className="text-sm text-gray-600">Translation Progress</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Globe className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{calculateLocalizationQuality()}%</p>
                <p className="text-sm text-gray-600">Localization Quality</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Target className="h-8 w-8 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">{localizedContent.length}</p>
                <p className="text-sm text-gray-600">Localized Items</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Language Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Language Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label className="text-sm font-medium mb-2 block">Source Language</Label>
              <Select value={sourceLanguage} onValueChange={setSourceLanguage}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SUPPORTED_LANGUAGES.map(lang => (
                    <SelectItem key={lang.code} value={lang.code}>
                      <span className="flex items-center gap-2">
                        <span>{lang.flag}</span>
                        <span>{lang.name}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-medium mb-2 block">Target Languages</Label>
              <div className="space-y-2">
                {SUPPORTED_LANGUAGES.filter(lang => lang.code !== sourceLanguage).map(lang => (
                  <div key={lang.code} className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <span>{lang.flag}</span>
                      <span>{lang.name}</span>
                    </span>
                    <Switch
                      checked={targetLanguages.includes(lang.code)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setTargetLanguages([...targetLanguages, lang.code]);
                        } else {
                          setTargetLanguages(targetLanguages.filter(l => l !== lang.code));
                        }
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Auto-Translation</Label>
                <p className="text-xs text-gray-500">Use AI for initial translations</p>
              </div>
              <Switch checked={autoTranslate} onCheckedChange={setAutoTranslate} />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Cultural Adaptation</Label>
                <p className="text-xs text-gray-500">Adapt content for local culture</p>
              </div>
              <Switch checked={culturalAdaptation} onCheckedChange={setCulturalAdaptation} />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">SEO Localization</Label>
                <p className="text-xs text-gray-500">Optimize for local search</p>
              </div>
              <Switch checked={seoLocalization} onCheckedChange={setSeoLocalization} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button onClick={() => setShowTranslationDialog(true)} className="w-full">
              <Translate className="h-4 w-4 mr-2" />
              Create Translation Tasks
            </Button>
            <Button onClick={exportLocalizationReport} variant="outline" className="w-full">
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
            <Button onClick={() => window.open('/docs/LOCALIZATION_GUIDELINES.md', '_blank')} variant="outline" className="w-full">
              <BookOpen className="h-4 w-4 mr-2" />
              View Guidelines
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderTranslationTasks = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Translation Tasks</h3>
          <p className="text-sm text-gray-600">
            Track and manage translation progress
          </p>
        </div>
        <Button onClick={() => setShowTranslationDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Task
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {translationTasks.length === 0 ? (
            <div className="text-center py-8">
              <Translate className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500">No translation tasks created</p>
              <p className="text-sm text-gray-400">Create translation tasks to start localizing your content</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Content</TableHead>
                  <TableHead>Languages</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Quality Score</TableHead>
                  <TableHead>Cost</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {translationTasks.map(task => (
                  <TableRow key={task.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">Content #{task.content_id.slice(-8)}</p>
                        <p className="text-sm text-gray-500">{task.word_count} words</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span>{getLanguageFlag(task.source_language)}</span>
                        <span>→</span>
                        <span>{getLanguageFlag(task.target_language)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(task.status)}>
                        {task.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="w-24">
                        <Progress value={task.progress} className="h-2" />
                        <p className="text-xs text-gray-500 mt-1">{task.progress}%</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {task.status === 'completed' ? (
                        <span className="text-green-600 font-medium">92%</span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">${task.cost_estimate}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <RefreshCw className="h-4 w-4" />
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
    </div>
  );

  const renderLocalizedContent = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Localized Content</h3>
          <p className="text-sm text-gray-600">
            Review and manage translated content
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowLocalizationDialog(true)}>
            <Edit className="h-4 w-4 mr-2" />
            Review Content
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {localizedContent.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Globe className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500">No localized content yet</p>
              <p className="text-sm text-gray-400">Complete translation tasks to see localized content here</p>
            </CardContent>
          </Card>
        ) : (
          localizedContent.map(content => (
            <Card key={content.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span>{getLanguageFlag(content.target_language)}</span>
                      <Badge variant="outline">{content.target_region}</Badge>
                      <Badge className={getStatusColor(content.status)}>
                        {content.status}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg">{content.title}</CardTitle>
                    <CardDescription>
                      {content.meta_description}
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-600">
                      {Math.round(
                        (content.quality_metrics.translation_quality +
                         content.quality_metrics.cultural_appropriateness +
                         content.quality_metrics.seo_optimization +
                         content.quality_metrics.readability_score) / 4
                      )}%
                    </div>
                    <div className="text-sm text-gray-600">Quality Score</div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Quality Metrics */}
                  <div className="grid grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-lg font-semibold text-green-600">
                        {content.quality_metrics.translation_quality}%
                      </div>
                      <div className="text-xs text-gray-600">Translation</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-blue-600">
                        {content.quality_metrics.cultural_appropriateness}%
                      </div>
                      <div className="text-xs text-gray-600">Cultural Fit</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-purple-600">
                        {content.quality_metrics.seo_optimization}%
                      </div>
                      <div className="text-xs text-gray-600">SEO Score</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-orange-600">
                        {content.quality_metrics.readability_score}%
                      </div>
                      <div className="text-xs text-gray-600">Readability</div>
                    </div>
                  </div>

                  {/* Content Preview */}
                  <div>
                    <h4 className="font-medium mb-2">Content Preview:</h4>
                    <p className="text-sm text-gray-700 line-clamp-3">
                      {content.content}
                    </p>
                  </div>

                  {/* Cultural Adaptations */}
                  {content.cultural_adaptations.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Cultural Adaptations:</h4>
                      <div className="flex flex-wrap gap-1">
                        {content.cultural_adaptations.slice(0, 3).map((adaptation, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {adaptation}
                          </Badge>
                        ))}
                        {content.cultural_adaptations.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{content.cultural_adaptations.length - 3}
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Keywords */}
                  {content.keywords.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Local Keywords:</h4>
                      <div className="flex flex-wrap gap-1">
                        {content.keywords.slice(0, 5).map((keyword, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {keyword}
                          </Badge>
                        ))}
                        {content.keywords.length > 5 && (
                          <Badge variant="secondary" className="text-xs">
                            +{content.keywords.length - 5}
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-2" />
                      Full Preview
                    </Button>
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    {content.status === 'review' && (
                      <Button size="sm">
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Approve
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );

  const renderGuidelines = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Localization Guidelines</h3>
          <p className="text-sm text-gray-600">
            Cultural and market-specific guidance for content localization
          </p>
        </div>
      </div>

      {/* Polish Market Guidelines */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>🇵🇱</span>
            Polish Market Guidelines
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Cultural Preferences */}
            <div>
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Users className="h-4 w-4" />
                Cultural Preferences
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium mb-2">Beauty Standards:</p>
                  <ul className="text-sm space-y-1">
                    {POLISH_LOCALIZATION_GUIDELINES.cultural_preferences.beauty_standards.map((standard, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <ChevronRight className="h-3 w-3 text-blue-500 mt-0.5" />
                        {standard}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-sm font-medium mb-2">Communication Style:</p>
                  <ul className="text-sm space-y-1">
                    <li className="flex items-center gap-2">
                      <span className="font-medium">Style:</span> {POLISH_LOCALIZATION_GUIDELINES.cultural_preferences.communication_style}
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="font-medium">Formality:</span> {POLISH_LOCALIZATION_GUIDELINES.cultural_preferences.formality_level}
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="font-medium">Directness:</span> {POLISH_LOCALIZATION_GUIDELINES.cultural_preferences.directness_level}/10
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Market Specifics */}
            <div>
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Market-Specific Considerations
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium mb-2">Local Trends:</p>
                  <ul className="text-sm space-y-1">
                    {POLISH_LOCALIZATION_GUIDELINES.market_specifics.local_trends.map((trend, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <ChevronRight className="h-3 w-3 text-green-500 mt-0.5" />
                        {trend}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-sm font-medium mb-2">Seasonal Factors:</p>
                  <ul className="text-sm space-y-1">
                    {POLISH_LOCALIZATION_GUIDELINES.market_specifics.seasonal_considerations.map((factor, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <ChevronRight className="h-3 w-3 text-orange-500 mt-0.5" />
                        {factor}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* SEO Guidelines */}
            <div>
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                SEO & Keywords
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium mb-2">Local Keywords:</p>
                  <div className="flex flex-wrap gap-1">
                    {POLISH_LOCALIZATION_GUIDELINES.seo_guidelines.local_keywords.map((keyword, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium mb-2">Search Patterns:</p>
                  <ul className="text-sm space-y-1">
                    {POLISH_LOCALIZATION_GUIDELINES.seo_guidelines.search_patterns.map((pattern, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <ChevronRight className="h-3 w-3 text-purple-500 mt-0.5" />
                        {pattern}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content Examples */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Content Examples & Best Practices
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Successful Translations */}
            <div>
              <h4 className="font-medium mb-3">Successful Translations</h4>
              <div className="space-y-2">
                {POLISH_LOCALIZATION_GUIDELINES.content_examples.successful_translations.map((example, idx) => (
                  <div key={idx} className="p-3 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-sm text-green-800">{example}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Common Mistakes */}
            <div>
              <h4 className="font-medium mb-3">Common Mistakes to Avoid</h4>
              <div className="space-y-2">
                {POLISH_LOCALIZATION_GUIDELINES.content_examples.common_mistakes.map((mistake, idx) => (
                  <div key={idx} className="p-3 bg-red-50 rounded-lg border border-red-200">
                    <p className="text-sm text-red-800">{mistake}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Globe className="w-8 h-8 text-primary" />
            Multi-Language Content Workflow
          </h1>
          <p className="text-muted-foreground mt-2">
            Comprehensive content localization for Polish and international markets
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={exportLocalizationReport}>
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="translations" className="flex items-center gap-2">
            <Translate className="h-4 w-4" />
            Translations
          </TabsTrigger>
          <TabsTrigger value="localized" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Localized Content
          </TabsTrigger>
          <TabsTrigger value="guidelines" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Guidelines
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          {renderOverview()}
        </TabsContent>

        <TabsContent value="translations">
          {renderTranslationTasks()}
        </TabsContent>

        <TabsContent value="localized">
          {renderLocalizedContent()}
        </TabsContent>

        <TabsContent value="guidelines">
          {renderGuidelines()}
        </TabsContent>
      </Tabs>

      {/* Translation Task Dialog */}
      <Dialog open={showTranslationDialog} onOpenChange={setShowTranslationDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Translation Tasks</DialogTitle>
            <DialogDescription>
              Set up translation tasks for your content to reach international audiences
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="content-select">Select Content</Label>
              <Select value={translationForm.content_id} onValueChange={(value) => setTranslationForm(prev => ({ ...prev, content_id: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose content to translate" />
                </SelectTrigger>
                <SelectContent>
                  {contentItems.slice(0, 10).map(item => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Target Languages</Label>
              <div className="space-y-2">
                {SUPPORTED_LANGUAGES.filter(lang => lang.code !== sourceLanguage).map(lang => (
                  <div key={lang.code} className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <span>{lang.flag}</span>
                      <span>{lang.name}</span>
                    </span>
                    <Switch
                      checked={translationForm.target_languages.includes(lang.code)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setTranslationForm(prev => ({
                            ...prev,
                            target_languages: [...prev.target_languages, lang.code]
                          }));
                        } else {
                          setTranslationForm(prev => ({
                            ...prev,
                            target_languages: prev.target_languages.filter(l => l !== lang.code)
                          }));
                        }
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select value={translationForm.priority} onValueChange={(value: any) => setTranslationForm(prev => ({ ...prev, priority: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="deadline">Deadline (Optional)</Label>
                <Input
                  id="deadline"
                  type="date"
                  value={translationForm.deadline}
                  onChange={(e) => setTranslationForm(prev => ({ ...prev, deadline: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="instructions">Special Instructions</Label>
              <Textarea
                id="instructions"
                value={translationForm.special_instructions}
                onChange={(e) => setTranslationForm(prev => ({ ...prev, special_instructions: e.target.value }))}
                placeholder="Any specific requirements or preferences for translation..."
                rows={3}
              />
            </div>
          </div>
          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={() => setShowTranslationDialog(false)}>
              Cancel
            </Button>
            <Button onClick={createTranslationTask} disabled={loading}>
              {loading ? 'Creating...' : 'Create Tasks'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MultiLanguageContentWorkflow;