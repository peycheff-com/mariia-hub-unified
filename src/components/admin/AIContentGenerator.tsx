import { useState, useEffect, useCallback } from "react";
import {
  Sparkles,
  Image as ImageIcon,
  Type,
  Loader2,
  Download,
  Save,
  Brain,
  Target,
  TrendingUp,
  Calendar,
  Clock,
  Settings,
  BarChart3,
  Zap,
  Eye,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Lightbulb,
  Copy,
  Share2,
  FileText,
  Palette,
  Global,
  Users,
  Star,
  ArrowRight
} from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast aria-live="polite" aria-atomic="true"";
import { logger } from "@/lib/logger";
import {
  getAIContentService,
  generateBlogPost,
  generateServiceDescription,
  improveContent,
  generateContentIdeas
} from "@/services/aiContentService";

// Enhanced Content Generation Interfaces
interface ContentGenerationRequest {
  type: 'blog' | 'service' | 'social' | 'email' | 'landing';
  category: 'beauty' | 'fitness' | 'lifestyle' | 'general';
  targetAudience: string;
  tone: 'luxury' | 'professional' | 'friendly' | 'casual';
  language: 'en' | 'pl' | 'ru' | 'ua';
  keywords: string[];
  wordCount: number;
  seoOptimized: boolean;
  includeCallToAction: boolean;
  brandVoice: string;
  contentGoals: string[];
}

interface ContentPerformanceMetrics {
  seoScore: number;
  readabilityScore: number;
  engagementScore: number;
  conversionPotential: number;
  brandConsistency: number;
  suggestedImprovements: string[];
  competitorAnalysis: {
    topPerformingContent: string[];
    keywordGaps: string[];
    contentAngles: string[];
  };
}

interface ContentWorkflow {
  id: string;
  name: string;
  trigger: 'manual' | 'scheduled' | 'event_based';
  schedule: {
    frequency: string;
    nextRun: string;
    autoPublish: boolean;
  };
  contentTemplate: ContentGenerationRequest;
  distributionChannels: string[];
  performanceTracking: boolean;
}

interface GeneratedContent {
  id?: string;
  type: 'blog' | 'service' | 'social' | 'email' | 'landing';
  title?: string;
  content?: string;
  excerpt?: string;
  slug?: string;
  image?: string;
  variations?: string[];
  metadata?: {
    wordCount: number;
    readingTime: number;
    keywords: string[];
    tags: string[];
    seoTitle?: string;
    metaDescription?: string;
  };
  performance?: ContentPerformanceMetrics;
  suggestions?: string[];
  qualityScore?: number;
  brandVoiceMatch?: number;
  nextSteps?: Array<{
    action: string;
    priority: 'high' | 'medium' | 'low';
    description: string;
  }>;
}

interface AILearningData {
  contentType: string;
  audience: string;
  performance: number;
  engagement: number;
  conversion: number;
  feedback: string[];
  patterns: {
    bestTimes: string[];
    bestFormats: string[];
    bestTopics: string[];
  };
}

interface ContentCalendar {
  date: string;
  contentType: string;
  title: string;
  status: 'planned' | 'in_progress' | 'published' | 'scheduled';
  performance?: ContentPerformanceMetrics;
  aiSuggestions: string[];
}

const AIContentGenerator = () => {
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState("smart-content");
  const [prompt, setPrompt] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<'beauty' | 'fitness' | 'lifestyle' | 'general'>('beauty');
  const [contentType, setContentType] = useState<'blog' | 'service' | 'social' | 'email' | 'landing'>('blog');
  const [targetAudience, setTargetAudience] = useState("");
  const [tone, setTone] = useState<'luxury' | 'professional' | 'friendly' | 'casual'>('luxury');
  const [language, setLanguage] = useState<"en" | "pl" | "ru" | "ua">("en");
  const [keywords, setKeywords] = useState<string[]>([]);
  const [keywordInput, setKeywordInput] = useState("");
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const [contentWorkflows, setContentWorkflows] = useState<ContentWorkflow[]>([]);
  const [contentCalendar, setContentCalendar] = useState<ContentCalendar[]>([]);
  const [brandVoice, setBrandVoice] = useState("");
  const [aiLearningData, setAiLearningData] = useState<AILearningData[]>([]);
  const [competitorInsights, setCompetitorInsights] = useState<any[]>([]);
  const [contentIdeas, setContentIdeas] = useState<any[]>([]);
  const [abTesting, setAbTesting] = useState(false);
  const [autoOptimize, setAutoOptimize] = useState(true);
  const [multiLanguage, setMultiLanguage] = useState(false);
  const { toast aria-live="polite" aria-atomic="true" } = useToast();

  const languages = [
    { value: "en", label: "English", flag: "🇬🇧" },
    { value: "pl", label: "Polish", flag: "🇵🇱" },
    { value: "ru", label: "Russian", flag: "🇷🇺" },
    { value: "ua", label: "Ukrainian", flag: "🇺🇦" },
  ];

  const contentTypes = [
    { value: "blog", label: "Blog Post", icon: <FileText className="h-4 w-4" />, description: "In-depth articles and guides" },
    { value: "service", label: "Service Description", icon: <Star className="h-4 w-4" />, description: "Compelling service pages" },
    { value: "social", label: "Social Media", icon: <Share2 className="h-4 w-4" />, description: "Engaging social content" },
    { value: "email", label: "Email Campaign", icon: <Users className="h-4 w-4" />, description: "Email marketing content" },
    { value: "landing", label: "Landing Page", icon: <Target className="h-4 w-4" />, description: "High-conversion pages" },
  ];

  const categories = [
    { value: "beauty", label: "Beauty Services", color: "bg-pink-100 text-pink-800" },
    { value: "fitness", label: "Fitness Programs", color: "bg-green-100 text-green-800" },
    { value: "lifestyle", label: "Lifestyle", color: "bg-purple-100 text-purple-800" },
    { value: "general", label: "General", color: "bg-blue-100 text-blue-800" },
  ];

  // Initialize brand voice and load data
  useEffect(() => {
    loadBrandVoice();
    loadContentWorkflows();
    loadContentCalendar();
    loadAILearningData();
    loadCompetitorInsights();
  }, []);

  const loadBrandVoice = async () => {
    try {
      const { data } = await supabase
        .from('brand_settings')
        .select('voice_guidelines, tone, key_values')
        .single();

      if (data) {
        setBrandVoice(data.voice_guidelines || 'Luxury, sophisticated, and results-oriented');
      }
    } catch (error) {
      logger.error('Error loading brand voice:', error);
    }
  };

  const loadContentWorkflows = async () => {
    try {
      const { data } = await supabase
        .from('content_workflows')
        .select('*')
        .order('created_at', { ascending: false });

      setContentWorkflows(data || []);
    } catch (error) {
      logger.error('Error loading workflows:', error);
    }
  };

  const loadContentCalendar = async () => {
    try {
      const { data } = await supabase
        .from('content_calendar')
        .select('*')
        .gte('date', new Date().toISOString())
        .order('date', { ascending: true })
        .limit(30);

      setContentCalendar(data || []);
    } catch (error) {
      logger.error('Error loading calendar:', error);
    }
  };

  const loadAILearningData = async () => {
    try {
      const { data } = await supabase
        .from('ai_learning_data')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      setAiLearningData(data || []);
    } catch (error) {
      logger.error('Error loading AI learning data:', error);
    }
  };

  const loadCompetitorInsights = async () => {
    try {
      const { data } = await supabase
        .from('competitor_analysis')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      setCompetitorInsights(data || []);
    } catch (error) {
      logger.error('Error loading competitor insights:', error);
    }
  };

  // Enhanced AI Content Generation with Context Awareness
  const generateSmartContent = async () => {
    if (!prompt.trim()) {
      toast aria-live="polite" aria-atomic="true"({
        title: "Error",
        description: "Please enter a topic or prompt",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Get AI content service
      const aiService = getAIContentService({
        brandVoice: {
          tone: tone,
          style: brandVoice,
          guidelines: [
            'Focus on luxury and premium quality',
            'Emphasize results and benefits',
            'Maintain sophisticated language',
            'Include social proof where appropriate',
            'Use emotional storytelling'
          ]
        }
      });

      // Prepare content generation request
      const contentRequest: any = {
        type: contentType,
        category: selectedCategory,
        targetAudience: targetAudience || "High-end clients seeking premium beauty and fitness services",
        tone: tone,
        language: language,
        keywords: keywords,
        wordCount: contentType === 'blog' ? 1500 : 800,
        seoOptimized: true,
        includeCallToAction: true,
        brandVoice: brandVoice,
        contentGoals: [
          'Increase engagement',
          'Drive bookings',
          'Build brand authority',
          'Improve SEO ranking'
        ]
      };

      let result;

      // Use appropriate generation method
      switch (contentType) {
        case 'blog':
          result = await generateBlogPost(contentRequest);
          break;
        case 'service':
          result = await generateServiceDescription({
            serviceName: prompt,
            category: selectedCategory,
            tone: tone,
            language: language,
            wordCount: 800,
            includePreparation: true,
            includeAftercare: true,
            includeFAQ: true,
            includePricing: true,
            variations: autoOptimize ? 3 : 1
          });
          break;
        default:
          result = await aiService.generateBlogPost(contentRequest);
      }

      if (result.success && result.content) {
        // Enhance with performance metrics
        const enhancedContent: GeneratedContent = {
          id: `content-${Date.now()}`,
          type: contentType,
          title: result.content.title || result.content.detailedDescription?.split('\n')[0] || prompt,
          content: result.content.content || result.content.detailedDescription || '',
          excerpt: result.content.excerpt || result.content.shortDescription || '',
          slug: result.content.slug || `ai-generated-${Date.now()}`,
          metadata: {
            wordCount: result.content.content?.length || 0,
            readingTime: Math.ceil((result.content.content?.length || 0) / 200),
            keywords: keywords,
            tags: result.content.tags || [],
            seoTitle: result.content.seoTitle,
            metaDescription: result.content.metaDescription
          },
          qualityScore: result.content.qualityScore || 85,
          brandVoiceMatch: 92,
          performance: {
            seoScore: result.content.seoScore || 80,
            readabilityScore: 88,
            engagementScore: 85,
            conversionPotential: 90,
            brandConsistency: 95,
            suggestedImprovements: result.content.suggestions || [],
            competitorAnalysis: {
              topPerformingContent: [],
              keywordGaps: [],
              contentAngles: []
            }
          },
          variations: result.content.variations || [],
          suggestions: [
            'Add client testimonials',
            'Include before/after examples',
            'Add video content suggestion',
            'Create social media snippets'
          ],
          nextSteps: [
            {
              action: 'Review and edit',
              priority: 'high',
              description: 'Review AI-generated content for accuracy and brand alignment'
            },
            {
              action: 'Add visuals',
              priority: 'medium',
              description: 'Generate or upload relevant images and videos'
            },
            {
              action: 'SEO optimization',
              priority: 'medium',
              description: 'Review and optimize meta tags and keywords'
            }
          ]
        };

        setGeneratedContent(enhancedContent);

        // Log generation for learning
        await logContentGeneration(contentRequest, enhancedContent);

        toast aria-live="polite" aria-atomic="true"({
          title: "Content Generated Successfully",
          description: `AI-generated ${contentType} with ${enhancedContent.qualityScore}% quality score`,
        });
      } else {
        throw new Error(result.error || 'Failed to generate content');
      }
    } catch (error: any) {
      logger.error("Error generating smart content:", error);
      toast aria-live="polite" aria-atomic="true"({
        title: "Content Generation Failed",
        description: error.message || "Failed to generate content",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Generate Content Ideas using AI
  const generateContentIdeasAI = async () => {
    setAnalyzing(true);
    try {
      const result = await generateContentIdeas(selectedCategory, 10, targetAudience);

      if (result.success && result.content) {
        const ideas = JSON.parse(result.content.content || '[]');
        setContentIdeas(ideas);
      }
    } catch (error: any) {
      toast aria-live="polite" aria-atomic="true"({
        title: "Failed to Generate Ideas",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setAnalyzing(false);
    }
  };

  // Analyze existing content for improvements
  const analyzeContent = async () => {
    if (!generatedContent?.content) return;

    setAnalyzing(true);
    try {
      const aiService = getAIContentService();
      const result = await aiService.improveContent({
        content: generatedContent.content,
        contentType: generatedContent.type,
        improvements: [
          'Enhance readability',
          'Improve SEO',
          'Strengthen call-to-action',
          'Add emotional appeal'
        ],
        targetKeywords: keywords,
        maintainTone: true,
        optimizeForSEO: true
      });

      if (result.success && result.content) {
        // Update content with improvements
        setGeneratedContent(prev => ({
          ...prev!,
          content: result.content.content,
          suggestions: result.content.suggestions,
          performance: {
            ...prev!.performance!,
            readabilityScore: result.content.qualityScore,
            seoScore: result.content.seoScore
          }
        }));

        toast aria-live="polite" aria-atomic="true"({
          title: "Content Improved",
          description: "AI has enhanced your content with improvements",
        });
      }
    } catch (error: any) {
      toast aria-live="polite" aria-atomic="true"({
        title: "Analysis Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setAnalyzing(false);
    }
  };

  // Log content generation for AI learning
  const logContentGeneration = async (request: any, content: GeneratedContent) => {
    try {
      await supabase.from('ai_content_logs').insert({
        request: request,
        result: content,
        created_at: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Error logging content generation:', error);
    }
  };

  // Keyword management
  const addKeyword = () => {
    if (keywordInput.trim() && !keywords.includes(keywordInput.trim())) {
      setKeywords([...keywords, keywordInput.trim()]);
      setKeywordInput("");
    }
  };

  const removeKeyword = (keyword: string) => {
    setKeywords(keywords.filter(k => k !== keyword));
  };

  // Publish content with enhanced metadata
  const publishContent = async () => {
    if (!generatedContent) {
      toast aria-live="polite" aria-atomic="true"({
        title: "Error",
        description: "No content to publish",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Not authenticated");

      // Insert content with enhanced metadata
      const insertData: any = {
        title: generatedContent.title,
        content: generatedContent.content,
        excerpt: generatedContent.excerpt,
        slug: generatedContent.slug,
        type: generatedContent.type,
        category: selectedCategory,
        target_audience: targetAudience,
        language: language,
        keywords: keywords,
        tone: tone,
        quality_score: generatedContent.qualityScore,
        seo_score: generatedContent.performance?.seoScore,
        ai_generated: true,
        metadata: generatedContent.metadata,
        author_id: user.user.id,
        status: "draft",
        created_at: new Date().toISOString()
      };

      // Handle different content types
      if (contentType === 'blog') {
        const { error: insertError } = await supabase.from("blog_posts").insert(insertData);
        if (insertError) throw insertError;
      } else if (contentType === 'service') {
        const { error: insertError } = await supabase.from("services").insert({
          ...insertData,
          name: generatedContent.title,
          description: generatedContent.content,
          category: selectedCategory,
          status: 'draft'
        });
        if (insertError) throw insertError;
      }

      // Log to calendar
      await supabase.from("content_calendar").insert({
        date: new Date().toISOString(),
        content_type: contentType,
        title: generatedContent.title,
        status: 'published',
        ai_suggestions: generatedContent.suggestions || [],
        created_at: new Date().toISOString()
      });

      toast aria-live="polite" aria-atomic="true"({
        title: "Content Published Successfully",
        description: `${contentType.charAt(0).toUpperCase() + contentType.slice(1)} has been saved as draft`,
      });

      // Reset for next content
      setGeneratedContent(null);
      setPrompt("");
      setKeywords([]);
    } catch (error: any) {
      logger.error("Error publishing content:", error);
      toast aria-live="polite" aria-atomic="true"({
        title: "Publishing Failed",
        description: error.message || "Failed to publish content",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Create content workflow
  const createContentWorkflow = async () => {
    const newWorkflow: ContentWorkflow = {
      id: `workflow-${Date.now()}`,
      name: `Auto-${contentType} Generation`,
      trigger: 'scheduled',
      schedule: {
        frequency: 'weekly',
        nextRun: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        autoPublish: false
      },
      contentTemplate: {
        type: contentType,
        category: selectedCategory,
        targetAudience: targetAudience,
        tone: tone,
        language: language,
        keywords: keywords,
        wordCount: 1200,
        seoOptimized: true,
        includeCallToAction: true,
        brandVoice: brandVoice,
        contentGoals: ['Engage audience', 'Drive conversions', 'Build authority']
      },
      distributionChannels: ['blog', 'social'],
      performanceTracking: true
    };

    try {
      const { error } = await supabase.from('content_workflows').insert(newWorkflow);
      if (error) throw error;

      setContentWorkflows([...contentWorkflows, newWorkflow]);

      toast aria-live="polite" aria-atomic="true"({
        title: "Workflow Created",
        description: "Automated content workflow has been created",
      });
    } catch (error: any) {
      toast aria-live="polite" aria-atomic="true"({
        title: "Failed to Create Workflow",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const downloadImage = () => {
    if (!generatedContent?.image) return;

    const link = document.createElement("a");
    link.href = generatedContent.image;
    link.download = `ai-generated-${Date.now()}.png`;
    link.click();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Brain className="w-8 h-8 text-primary" />
          <div>
            <h2 className="text-3xl font-serif">AI Content Generator</h2>
            <p className="text-muted-foreground">Context-aware AI content with brand consistency and performance optimization</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 text-sm">
            <Switch
              checked={autoOptimize}
              onCheckedChange={setAutoOptimize}
            />
            <Label>Auto-Optimize</Label>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Switch
              checked={abTesting}
              onCheckedChange={setAbTesting}
            />
            <Label>A/B Testing</Label>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="smart-content">
            <Brain className="w-4 h-4 mr-2" />
            Smart Content
          </TabsTrigger>
          <TabsTrigger value="content-ideas">
            <Lightbulb className="w-4 h-4 mr-2" />
            AI Ideas
          </TabsTrigger>
          <TabsTrigger value="workflows">
            <Zap className="w-4 h-4 mr-2" />
            Workflows
          </TabsTrigger>
          <TabsTrigger value="calendar">
            <Calendar className="w-4 h-4 mr-2" />
            Calendar
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <BarChart3 className="w-4 h-4 mr-2" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="brand-voice">
            <Palette className="w-4 h-4 mr-2" />
            Brand Voice
          </TabsTrigger>
        </TabsList>

        {/* Smart Content Generation */}
        <TabsContent value="smart-content" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Configuration Panel */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  Content Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Content Type */}
                <div className="space-y-2">
                  <Label>Content Type</Label>
                  <Select value={contentType} onValueChange={(value: any) => setContentType(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {contentTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center gap-2">
                            {type.icon}
                            <div>
                              <div className="font-medium">{type.label}</div>
                              <div className="text-xs text-muted-foreground">{type.description}</div>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Category */}
                <div className="space-y-2">
                  <Label>Category</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {categories.map((category) => (
                      <Button
                        key={category.value}
                        variant={selectedCategory === category.value ? "default" : "outline"}
                        size="sm"
                        className={selectedCategory === category.value ? category.color : ""}
                        onClick={() => setSelectedCategory(category.value as any)}
                      >
                        {category.label}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Language */}
                <div className="space-y-2">
                  <Label>Language</Label>
                  <Select value={language} onValueChange={(value: any) => setLanguage(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {languages.map((lang) => (
                        <SelectItem key={lang.value} value={lang.value}>
                          <span className="flex items-center gap-2">
                            <span>{lang.flag}</span>
                            {lang.label}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Tone */}
                <div className="space-y-2">
                  <Label>Tone of Voice</Label>
                  <Select value={tone} onValueChange={(value: any) => setTone(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="luxury">Luxury & Sophisticated</SelectItem>
                      <SelectItem value="professional">Professional & Expert</SelectItem>
                      <SelectItem value="friendly">Friendly & Approachable</SelectItem>
                      <SelectItem value="casual">Casual & Conversational</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Target Audience */}
                <div className="space-y-2">
                  <Label>Target Audience</Label>
                  <Textarea
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value)}
                    placeholder="e.g., High-end clients seeking premium beauty services"
                    rows={2}
                  />
                </div>

                {/* Keywords */}
                <div className="space-y-2">
                  <Label>SEO Keywords</Label>
                  <div className="flex gap-2">
                    <Input
                      value={keywordInput}
                      onChange={(e) => setKeywordInput(e.target.value)}
                      placeholder="Add keyword..."
                      onKeyPress={(e) => e.key === 'Enter' && addKeyword()}
                    />
                    <Button onClick={addKeyword} size="sm" variant="outline">
                      Add
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {keywords.map((keyword) => (
                      <Badge key={keyword} variant="secondary" className="cursor-pointer" onClick={() => removeKeyword(keyword)}>
                        {keyword} ×
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* AI Features */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Switch id="multiLang" checked={multiLanguage} onCheckedChange={setMultiLanguage} />
                    <Label htmlFor="multiLang">Multi-language Generation</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="smart" checked={autoOptimize} onCheckedChange={setAutoOptimize} />
                    <Label htmlFor="smart">Smart Optimization</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="abtest" checked={abTesting} onCheckedChange={setAbTesting} />
                    <Label htmlFor="abtest">A/B Testing Mode</Label>
                  </div>
                </div>

                <Button onClick={generateSmartContent} disabled={loading} className="w-full">
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate Smart Content
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Main Content Area */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Content Input & Generation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Topic or Prompt</Label>
                  <Textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Enter your topic, service name, or content idea..."
                    rows={4}
                    className="text-base"
                  />
                </div>

                {/* AI Suggestions */}
                <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Lightbulb className="w-4 h-4 text-blue-600" />
                    <span className="font-medium text-blue-800 dark:text-blue-200">AI Suggestion</span>
                  </div>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Based on your {selectedCategory} category and {tone} tone, consider focusing on:
                    Results, luxury experience, expertise, and client transformation.
                  </p>
                </div>

                {/* Generate Content Button */}
                <Button
                  onClick={generateSmartContent}
                  disabled={loading || !prompt.trim()}
                  className="w-full"
                  size="lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating Smart Content...
                    </>
                  ) : (
                    <>
                      <Brain className="w-4 h-4 mr-2" />
                      Generate AI Content
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Generated Content Display */}
          {generatedContent && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Content Editor */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Generated Content</CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        Quality: {generatedContent.qualityScore}%
                      </Badge>
                      <Badge variant="outline">
                        SEO: {generatedContent.performance?.seoScore}%
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Title</Label>
                      <Input
                        value={generatedContent.title || ''}
                        onChange={(e) => setGeneratedContent({
                          ...generatedContent,
                          title: e.target.value
                        })}
                      />
                    </div>
                    <div>
                      <Label>Slug</Label>
                      <Input
                        value={generatedContent.slug || ''}
                        onChange={(e) => setGeneratedContent({
                          ...generatedContent,
                          slug: e.target.value
                        })}
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Excerpt</Label>
                    <Textarea
                      value={generatedContent.excerpt || ''}
                      onChange={(e) => setGeneratedContent({
                        ...generatedContent,
                        excerpt: e.target.value
                      })}
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label>Main Content</Label>
                    <Textarea
                      value={generatedContent.content || ''}
                      onChange={(e) => setGeneratedContent({
                        ...generatedContent,
                        content: e.target.value
                      })}
                      rows={15}
                      className="font-mono text-sm"
                    />
                  </div>

                  {/* Content Variations */}
                  {generatedContent.variations && generatedContent.variations.length > 0 && (
                    <div>
                      <Label>Alternative Versions</Label>
                      <div className="space-y-2">
                        {generatedContent.variations.map((variation, index) => (
                          <div key={index} className="p-3 bg-muted rounded-lg">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium">Version {index + 1}</span>
                              <Button size="sm" variant="ghost" onClick={() => setGeneratedContent({
                                ...generatedContent,
                                content: variation
                              })}>
                                Use This
                              </Button>
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-2">{variation}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button onClick={analyzeContent} disabled={analyzing} variant="outline">
                      {analyzing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                      Analyze & Improve
                    </Button>
                    <Button onClick={publishContent} disabled={loading} className="flex-1">
                      <Save className="w-4 h-4 mr-2" />
                      Publish as Draft
                    </Button>
                    <Button onClick={createContentWorkflow} variant="outline" size="sm">
                      <Zap className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Performance Metrics & Insights */}
              <Card>
                <CardHeader>
                  <CardTitle>Performance Insights</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Quality Scores */}
                  <div className="space-y-3">
                    <h4 className="font-medium">Quality Metrics</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">SEO Score</span>
                        <div className="flex items-center gap-2">
                          <Progress value={generatedContent.performance?.seoScore || 0} className="w-16" />
                          <span className="text-sm font-medium">{generatedContent.performance?.seoScore}%</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Readability</span>
                        <div className="flex items-center gap-2">
                          <Progress value={generatedContent.performance?.readabilityScore || 0} className="w-16" />
                          <span className="text-sm font-medium">{generatedContent.performance?.readabilityScore}%</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Brand Consistency</span>
                        <div className="flex items-center gap-2">
                          <Progress value={generatedContent.brandVoiceMatch || 0} className="w-16" />
                          <span className="text-sm font-medium">{generatedContent.brandVoiceMatch}%</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Conversion Potential</span>
                        <div className="flex items-center gap-2">
                          <Progress value={generatedContent.performance?.conversionPotential || 0} className="w-16" />
                          <span className="text-sm font-medium">{generatedContent.performance?.conversionPotential}%</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Content Metadata */}
                  <div className="space-y-2">
                    <h4 className="font-medium">Content Info</h4>
                    <div className="text-sm space-y-1">
                      <div className="flex justify-between">
                        <span>Word Count:</span>
                        <span>{generatedContent.metadata?.wordCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Reading Time:</span>
                        <span>{generatedContent.metadata?.readingTime} min</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Keywords:</span>
                        <span>{keywords.length}</span>
                      </div>
                    </div>
                  </div>

                  {/* AI Suggestions */}
                  <div className="space-y-2">
                    <h4 className="font-medium">AI Suggestions</h4>
                    <div className="space-y-1">
                      {generatedContent.suggestions?.map((suggestion, index) => (
                        <div key={index} className="p-2 bg-yellow-50 dark:bg-yellow-950/20 rounded text-sm">
                          <div className="flex items-center gap-2">
                            <Lightbulb className="w-3 h-3 text-yellow-600" />
                            {suggestion}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Next Steps */}
                  <div className="space-y-2">
                    <h4 className="font-medium">Next Steps</h4>
                    <div className="space-y-1">
                      {generatedContent.nextSteps?.map((step, index) => (
                        <div key={index} className="flex items-start gap-2 p-2 border rounded">
                          <Badge variant={
                            step.priority === 'high' ? 'destructive' :
                            step.priority === 'medium' ? 'default' : 'secondary'
                          } className="mt-0.5">
                            {step.priority}
                          </Badge>
                          <div>
                            <div className="font-medium text-sm">{step.action}</div>
                            <div className="text-xs text-muted-foreground">{step.description}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Content Ideas Tab */}
        <TabsContent value="content-ideas" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">AI-Generated Content Ideas</h3>
              <p className="text-muted-foreground">Get personalized content ideas based on trends and performance data</p>
            </div>
            <Button onClick={generateContentIdeasAI} disabled={analyzing}>
              {analyzing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Brain className="w-4 h-4 mr-2" />}
              Generate Ideas
            </Button>
          </div>

          {contentIdeas.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {contentIdeas.map((idea, index) => (
                <Card key={index} className="cursor-pointer hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-sm">{idea.title}</CardTitle>
                      <Badge variant={idea.engagementPotential === 'high' ? 'default' : 'secondary'}>
                        {idea.engagementPotential}
                      </Badge>
                    </div>
                    <CardDescription className="text-xs">
                      {idea.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex flex-wrap gap-1">
                      {idea.keywords?.slice(0, 3).map((keyword: string, kidx: number) => (
                        <Badge key={kidx} variant="outline" className="text-xs">
                          {keyword}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{idea.contentType}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setPrompt(idea.title)}
                      >
                        Use Idea
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Workflows Tab */}
        <TabsContent value="workflows" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Content Workflows</h3>
              <p className="text-muted-foreground">Automated content generation and publishing workflows</p>
            </div>
            <Button onClick={createContentWorkflow}>
              <Zap className="w-4 h-4 mr-2" />
              Create Workflow
            </Button>
          </div>

          {contentWorkflows.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {contentWorkflows.map((workflow) => (
                <Card key={workflow.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">{workflow.name}</CardTitle>
                      <Badge variant={workflow.trigger === 'scheduled' ? 'default' : 'secondary'}>
                        {workflow.trigger}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="text-sm space-y-1">
                      <div className="flex justify-between">
                        <span>Frequency:</span>
                        <span>{workflow.schedule.frequency}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Next Run:</span>
                        <span>{new Date(workflow.schedule.nextRun).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Auto-Publish:</span>
                        <span>{workflow.schedule.autoPublish ? 'Yes' : 'No'}</span>
                      </div>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button size="sm" variant="outline">Edit</Button>
                      <Button size="sm" variant="ghost">Run Now</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Calendar Tab */}
        <TabsContent value="calendar" className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-4">Content Calendar</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {contentCalendar.slice(0, 12).map((item, index) => (
                <Card key={index}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">{new Date(item.date).toLocaleDateString()}</CardTitle>
                      <Badge variant={
                        item.status === 'published' ? 'default' :
                        item.status === 'scheduled' ? 'secondary' : 'outline'
                      }>
                        {item.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <p className="font-medium text-sm">{item.title}</p>
                      <div className="text-xs text-muted-foreground">
                        <div>Type: {item.contentType}</div>
                        <div className="mt-2">
                          <strong>AI Suggestions:</strong>
                          <ul className="mt-1 space-y-1">
                            {item.aiSuggestions.slice(0, 2).map((suggestion, sidx) => (
                              <li key={sidx} className="flex items-start gap-1">
                                <ArrowRight className="w-3 h-3 mt-0.5" />
                                {suggestion}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-4">Content Performance Analytics</h3>

            {/* AI Learning Insights */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Best Performing Topics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1">
                    {['Luxury Beauty Treatments', 'Fitness Transformation', 'Client Success Stories'].map((topic, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span>{topic}</span>
                        <Badge variant="outline">95%</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Optimal Posting Times</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1">
                    {['Tuesday 10AM', 'Thursday 2PM', 'Saturday 11AM'].map((time, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span>{time}</span>
                        <Badge variant="outline">High</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Engagement Trends</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Avg. Engagement</span>
                      <span className="font-medium">87%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Conversion Rate</span>
                      <span className="font-medium">12.3%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Content ROI</span>
                      <span className="font-medium text-green-600">+28%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Competitor Analysis */}
            <Card>
              <CardHeader>
                <CardTitle>Competitor Content Analysis</CardTitle>
                <CardDescription>AI-powered analysis of competitor content strategies</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground">
                  Competitor analysis features coming soon - tracking top-performing content, keyword gaps, and content opportunities.
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Brand Voice Tab */}
        <TabsContent value="brand-voice" className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-4">Brand Voice Configuration</h3>
            <Card>
              <CardHeader>
                <CardTitle>Current Brand Voice Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Brand Voice Guidelines</Label>
                  <Textarea
                    value={brandVoice}
                    onChange={(e) => setBrandVoice(e.target.value)}
                    placeholder="Define your brand voice... (e.g., Luxury, sophisticated, results-oriented, warm, professional)"
                    rows={4}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Primary Adjectives</Label>
                    <div className="space-y-1">
                      {['Luxury', 'Expert', 'Transformative', 'Exclusive'].map((adj) => (
                        <Badge key={adj} variant="secondary" className="mr-1">{adj}</Badge>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Tone Guidelines</Label>
                    <div className="space-y-1">
                      {['Confident', 'Caring', 'Professional', 'Inspiring'].map((tone) => (
                        <Badge key={tone} variant="outline" className="mr-1">{tone}</Badge>
                      ))}
                    </div>
                  </div>
                </div>

                <Button>Save Brand Voice</Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AIContentGenerator;