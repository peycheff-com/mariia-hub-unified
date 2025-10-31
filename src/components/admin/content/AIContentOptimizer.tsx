import React, { useState, useEffect, useCallback } from 'react';
import {
  Sparkles,
  Brain,
  Target,
  TrendingUp,
  FileText,
  Search,
  CheckCircle,
  AlertCircle,
  Zap,
  Settings,
  RefreshCw,
  Copy,
  Download,
  Eye,
  Lightbulb,
  MessageSquare,
  BarChart3,
  Globe,
  Users,
  Clock,
  Award,
  Target as TargetIcon,
  Palette,
  Type,
  Image as ImageIcon
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';

interface AIOptimizationSuggestion {
  id: string;
  type: 'seo' | 'readability' | 'engagement' | 'conversion' | 'accessibility';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  originalText: string;
  suggestedText: string;
  reason: string;
  expectedImpact: string;
  confidence: number; // 0-100
  category: string;
  applied: boolean;
}

interface ContentAnalysis {
  id: string;
  content: string;
  contentType: 'blog' | 'service' | 'page' | 'product';
  targetAudience: string;
  primaryKeyword: string;
  secondaryKeywords: string[];
  tone: 'professional' | 'casual' | 'friendly' | 'authoritative';
  goals: string[];

  // Analysis results
  seoScore: number;
  readabilityScore: number;
  engagementScore: number;
  conversionScore: number;
  accessibilityScore: number;
  overallScore: number;

  // SEO Analysis
  keywordDensity: { [keyword: string]: number };
  metaTitle?: string;
  metaDescription?: string;
  headingStructure: {
    h1Count: number;
    h2Count: number;
    h3Count: number;
    issues: string[];
  };
  internalLinks: number;
  externalLinks: number;
  imageOptimizations: {
    altTexts: number;
    missingAlts: number;
    optimized: number;
  };

  // Readability Analysis
  averageSentenceLength: number;
  averageWordsPerParagraph: number;
  difficultWords: string[];
  readingTime: number; // minutes
  clarityIssues: string[];

  // Engagement Analysis
  emotionalTone: string;
  callToActions: string[];
  questions: number;
  statistics: number;
  stories: number;

  // Conversion Analysis
  valuePropositions: string[];
  urgencyTriggers: string[];
  socialProof: string[];
  objections: string[];

  suggestions: AIOptimizationSuggestion[];
}

interface AIContentTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  contentType: 'blog' | 'service' | 'page' | 'product';
  template: string;
  variables: string[];
  useCase: string;
  performance: {
    avgConversionRate: number;
    avgEngagement: number;
    usageCount: number;
  };
}

const AIContentOptimizer: React.FC = () => {
  const [content, setContent] = useState('');
  const [analysis, setAnalysis] = useState<ContentAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState('optimize');
  const [selectedContentType, setSelectedContentType] = useState('blog');
  const [targetAudience, setTargetAudience] = useState('');
  const [primaryKeyword, setPrimaryKeyword] = useState('');
  const [secondaryKeywords, setSecondaryKeywords] = useState('');
  const [selectedTone, setSelectedTone] = useState('professional');
  const [goals, setGoals] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [templates, setTemplates] = useState<AIContentTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<AIContentTemplate | null>(null);
  const [appliedSuggestions, setAppliedSuggestions] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  // Mock AI templates
  useEffect(() => {
    const mockTemplates: AIContentTemplate[] = [
      {
        id: 'template-1',
        name: 'High-Converting Service Page',
        description: 'Optimized service page template with proven conversion elements',
        category: 'Conversion',
        contentType: 'service',
        template: `
# [SERVICE_NAME] - Professional [CATEGORY] Services in Warsaw

Transform your [TARGET_DESIRED_OUTCOME] with our premium [SERVICE_NAME] service. Experience [KEY_BENEFIT] that lasts [DURATION].

## Why Choose Our [SERVICE_NAME] Service?

✅ **[UNIQUE_VALUE_PROPOSITION]** - Unlike other providers, we [DIFFERENTIATOR]
✅ **[SOCIAL_PROOF]** - Trusted by [NUMBER]+ satisfied clients in Warsaw
✅ **[QUALITY_ASSURANCE]** - [QUALITY_METRIC] with [GUARANTEE]
✅ **[EXPERTISE]** - [YEARS_EXPERIENCE] years of specialized experience

## What's Included in Your [SERVICE_NAME] Treatment

### Step 1: [PROCESS_STEP_1]
[DETAILED_DESCRIPTION_OF_STEP_1]

### Step 2: [PROCESS_STEP_2]
[DETAILED_DESCRIPTION_OF_STEP_2]

### Step 3: [PROCESS_STEP_3]
[DETAILED_DESCRIPTION_OF_STEP_3]

## [SERVICE_NAME] Results You Can Expect

**Immediate Results:** [IMMEDIATE_BENEFITS]
**Long-term Benefits:** [LONG_TERM_BENEFITS]
**Maintenance:** [MAINTENANCE_INSTRUCTIONS]

## [SERVICE_NAME] Pricing & Packages

**[PACKAGE_NAME]** - [PRICE] zł
- [INCLUSION_1]
- [INCLUSION_2]
- [INCLUSION_3]

**[PREMIUM_PACKAGE_NAME]** - [PREMIUM_PRICE] zł
- Everything in [PACKAGE_NAME], plus:
- [PREMIUM_INCLUSION_1]
- [PREMIUM_INCLUSION_2]

## Book Your [SERVICE_NAME] Appointment Today

📅 **Limited Availability:** Only [SLOTS] slots available this week
📍 **Location:** [ADDRESS], Warsaw
⏰ **Duration:** [DURATION] minutes
💰 **Special Offer:** [SPECIAL_OFFER]

[BOOKING_BUTTON]

## Frequently Asked Questions About [SERVICE_NAME]

**Q: [COMMON_QUESTION_1]?**
A: [ANSWER_1]

**Q: [COMMON_QUESTION_2]?**
A: [ANSWER_2]

**Q: [COMMON_QUESTION_3]?**
A: [ANSWER_3]

---

**Ready to transform your [TARGET_AREA]?**
Contact us today at [PHONE] or book online to schedule your [SERVICE_NAME] consultation.
        `,
        variables: ['SERVICE_NAME', 'CATEGORY', 'TARGET_DESIRED_OUTCOME', 'KEY_BENEFIT', 'DURATION', 'UNIQUE_VALUE_PROPOSITION', 'DIFFERENTIATOR', 'SOCIAL_PROOF', 'NUMBER', 'QUALITY_ASSURANCE', 'QUALITY_METRIC', 'GUARANTEE', 'YEARS_EXPERIENCE', 'PROCESS_STEP_1', 'DETAILED_DESCRIPTION_OF_STEP_1', 'PROCESS_STEP_2', 'DETAILED_DESCRIPTION_OF_STEP_2', 'PROCESS_STEP_3', 'DETAILED_DESCRIPTION_OF_STEP_3', 'IMMEDIATE_BENEFITS', 'LONG_TERM_BENEFITS', 'MAINTENANCE_INSTRUCTIONS', 'PACKAGE_NAME', 'PRICE', 'INCLUSION_1', 'INCLUSION_2', 'INCLUSION_3', 'PREMIUM_PACKAGE_NAME', 'PREMIUM_PRICE', 'PREMIUM_INCLUSION_1', 'PREMIUM_INCLUSION_2', 'SLOTS', 'ADDRESS', 'BOOKING_BUTTON', 'COMMON_QUESTION_1', 'ANSWER_1', 'COMMON_QUESTION_2', 'ANSWER_2', 'COMMON_QUESTION_3', 'ANSWER_3', 'PHONE', 'TARGET_AREA', 'SPECIAL_OFFER'],
        useCase: 'Service pages designed to maximize bookings and conversions',
        performance: {
          avgConversionRate: 12.5,
          avgEngagement: 78,
          usageCount: 45
        }
      },
      {
        id: 'template-2',
        name: 'SEO-Optimized Blog Post',
        description: 'Blog template optimized for search engines and reader engagement',
        category: 'SEO',
        contentType: 'blog',
        template: `
# [MAIN_KEYWORD]: The Ultimate [YEAR] Guide

*Published on [DATE] • Reading time: [READING_TIME] minutes*

Are you struggling with [PROBLEM]? You're not alone. [STATISTIC]% of [TARGET_AUDIENCE] face this challenge daily. In this comprehensive guide, we'll explore everything you need to know about [MAIN_KEYWORD].

## What is [MAIN_KEYWORD]?

[MAIN_KEYWORD] is [DEFINITION]. It's important because [IMPORTANCE_STATEMENT].

**Key takeaway:** [KEY_INSIGHT]

## Why [MAIN_KEYWORD] Matters in [YEAR]

The [INDUSTRY] landscape is constantly evolving, and [MAIN_KEYWORD] has become increasingly crucial for [TARGET_AUDIENCE]. Here's why:

### 1. [BENEFIT_1]
[EXPLANATION_OF_BENEFIT_1]

### 2. [BENEFIT_2]
[EXPLANATION_OF_BENEFIT_2]

### 3. [BENEFIT_3]
[EXPLANATION_OF_BENEFIT_3]

## How to [ACHIEVE_DESIRED_OUTCOME] with [MAIN_KEYWORD]

### Step 1: [STEP_1_TITLE]
[DETAILED_INSTRUCTIONS_FOR_STEP_1]

**Pro tip:** [EXPERT_TIP_1]

### Step 2: [STEP_2_TITLE]
[DETAILED_INSTRUCTIONS_FOR_STEP_2]

**Pro tip:** [EXPERT_TIP_2]

### Step 3: [STEP_3_TITLE]
[DETAILED_INSTRUCTIONS_FOR_STEP_3]

**Pro tip:** [EXPERT_TIP_3]

## Common [MAIN_KEYWORD] Mistakes to Avoid

Even experienced [TARGET_AUDIENCE] make these common mistakes:

❌ **[MISTAKE_1]:** [EXPLANATION_OF_MISTAKE_1]
✅ **Instead:** [CORRECT_APPROACH_1]

❌ **[MISTAKE_2]:** [EXPLANATION_OF_MISTAKE_2]
✅ **Instead:** [CORRECT_APPROACH_2]

❌ **[MISTAKE_3]:** [EXPLANATION_OF_MISTAKE_3]
✅ **Instead:** [CORRECT_APPROACH_3]

## [MAIN_KEYWORD] Tools and Resources

Here are our top recommendations for [MAIN_KEYWORD]:

### [TOOL_1_NAME]
- **Best for:** [USE_CASE_1]
- **Price:** [TOOL_1_PRICE]
- **Why we recommend it:** [RECOMMENDATION_REASON_1]

### [TOOL_2_NAME]
- **Best for:** [USE_CASE_2]
- **Price:** [TOOL_2_PRICE]
- **Why we recommend it:** [RECOMMENDATION_REASON_2]

## Real [MAIN_KEYWORD] Success Stories

### Case Study: [CLIENT_NAME]
**Challenge:** [CLIENT_CHALLENGE]
**Solution:** [SOLUTION_APPLIED]
**Results:** [MEASURABLE_RESULTS]

> "[TESTIMONIAL_QUOTE]" - [CLIENT_NAME], [CLIENT_TITLE]

## Expert Tips for [MAIN_KEYWORD] Success

We interviewed [EXPERT_NAME], [EXPERT_TITLE] with [EXPERIENCE] years of experience, to get their insider tips:

**[EXPERT_TIP_TITLE]:** [EXPERT_DETAILED_TIP]

"The key to successful [MAIN_KEYWORD] is [EXPERT_INSIGHT]." - [EXPERT_NAME]

## Frequently Asked Questions About [MAIN_KEYWORD]

**Q: [FREQUENT_QUESTION_1]?**
A: [DETAILED_ANSWER_1]

**Q: [FREQUENT_QUESTION_2]?**
A: [DETAILED_ANSWER_2]

**Q: [FREQUENT_QUESTION_3]?**
A: [DETAILED_ANSWER_3]

## [MAIN_KEYWORD]: Final Thoughts

[MAIN_KEYWORD] doesn't have to be [DIFFICULTY_LEVEL]. By following the steps and avoiding common mistakes outlined in this guide, you'll be well on your way to [DESIRED_OUTCOME].

**Ready to get started?** [CALL_TO_ACTION]

---

*Have questions about [MAIN_KEYWORD]? Leave a comment below or [CONTACT_METHOD]. We'd love to help you [ACHIEVE_GOAL]!*

**Related:** [RELATED_TOPIC_1] | [RELATED_TOPIC_2] | [RELATED_TOPIC_3]
        `,
        variables: ['MAIN_KEYWORD', 'YEAR', 'DATE', 'READING_TIME', 'PROBLEM', 'STATISTIC', 'TARGET_AUDIENCE', 'DEFINITION', 'IMPORTANCE_STATEMENT', 'KEY_INSIGHT', 'INDUSTRY', 'BENEFIT_1', 'EXPLANATION_OF_BENEFIT_1', 'BENEFIT_2', 'EXPLANATION_OF_BENEFIT_2', 'BENEFIT_3', 'EXPLANATION_OF_BENEFIT_3', 'ACHIEVE_DESIRED_OUTCOME', 'STEP_1_TITLE', 'DETAILED_INSTRUCTIONS_FOR_STEP_1', 'EXPERT_TIP_1', 'STEP_2_TITLE', 'DETAILED_INSTRUCTIONS_FOR_STEP_2', 'EXPERT_TIP_2', 'STEP_3_TITLE', 'DETAILED_INSTRUCTIONS_FOR_STEP_3', 'EXPERT_TIP_3', 'MISTAKE_1', 'EXPLANATION_OF_MISTAKE_1', 'CORRECT_APPROACH_1', 'MISTAKE_2', 'EXPLANATION_OF_MISTAKE_2', 'CORRECT_APPROACH_2', 'MISTAKE_3', 'EXPLANATION_OF_MISTAKE_3', 'CORRECT_APPROACH_3', 'TOOL_1_NAME', 'USE_CASE_1', 'TOOL_1_PRICE', 'RECOMMENDATION_REASON_1', 'TOOL_2_NAME', 'USE_CASE_2', 'TOOL_2_PRICE', 'RECOMMENDATION_REASON_2', 'CLIENT_NAME', 'CLIENT_CHALLENGE', 'SOLUTION_APPLIED', 'MEASURABLE_RESULTS', 'TESTIMONIAL_QUOTE', 'CLIENT_TITLE', 'EXPERT_NAME', 'EXPERT_TITLE', 'EXPERIENCE', 'EXPERT_TIP_TITLE', 'EXPERT_DETAILED_TIP', 'EXPERT_INSIGHT', 'FREQUENT_QUESTION_1', 'DETAILED_ANSWER_1', 'FREQUENT_QUESTION_2', 'DETAILED_ANSWER_2', 'FREQUENT_QUESTION_3', 'DETAILED_ANSWER_3', 'DIFFICULTY_LEVEL', 'DESIRED_OUTCOME', 'CALL_TO_ACTION', 'CONTACT_METHOD', 'ACHIEVE_GOAL', 'RELATED_TOPIC_1', 'RELATED_TOPIC_2', 'RELATED_TOPIC_3'],
        useCase: 'Blog posts designed to rank well in search engines and engage readers',
        performance: {
          avgConversionRate: 6.8,
          avgEngagement: 85,
          usageCount: 67
        }
      }
    ];

    setTemplates(mockTemplates);
  }, []);

  const analyzeContent = useCallback(async () => {
    if (!content.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter some content to analyze',
        variant: 'destructive',
      });
      return;
    }

    setIsAnalyzing(true);

    try {
      // Simulate AI analysis
      await new Promise(resolve => setTimeout(resolve, 3000));

      const mockAnalysis: ContentAnalysis = {
        id: `analysis-${Date.now()}`,
        content,
        contentType: selectedContentType as any,
        targetAudience,
        primaryKeyword,
        secondaryKeywords: secondaryKeywords.split(',').map(k => k.trim()).filter(k => k),
        tone: selectedTone as any,
        goals: goals.split(',').map(g => g.trim()).filter(g => g),

        // Mock analysis results
        seoScore: Math.floor(Math.random() * 40) + 60,
        readabilityScore: Math.floor(Math.random() * 30) + 70,
        engagementScore: Math.floor(Math.random() * 35) + 65,
        conversionScore: Math.floor(Math.random() * 45) + 55,
        accessibilityScore: Math.floor(Math.random() * 25) + 75,
        overallScore: 0,

        keywordDensity: {
          [primaryKeyword || 'content']: Math.random() * 3 + 1,
          'beauty': Math.random() * 2 + 0.5,
          'warsaw': Math.random() * 1.5 + 0.5
        },
        metaTitle: content.split('\n')[0]?.substring(0, 60) || 'Generated Title',
        metaDescription: content.substring(0, 160) + '...',
        headingStructure: {
          h1Count: (content.match(/^# /gm) || []).length,
          h2Count: (content.match(/^## /gm) || []).length,
          h3Count: (content.match(/^### /gm) || []).length,
          issues: []
        },
        internalLinks: Math.floor(Math.random() * 5),
        externalLinks: Math.floor(Math.random() * 3),
        imageOptimizations: {
          altTexts: Math.floor(Math.random() * 3),
          missingAlts: Math.floor(Math.random() * 2),
          optimized: Math.floor(Math.random() * 3)
        },

        averageSentenceLength: Math.floor(Math.random() * 10) + 15,
        averageWordsPerParagraph: Math.floor(Math.random() * 30) + 40,
        difficultWords: ['ubiquitous', 'ephemeral', 'paradigm'],
        readingTime: Math.ceil(content.split(' ').length / 200),
        clarityIssues: ['Long sentences detected', 'Passive voice usage'],

        emotionalTone: 'professional',
        callToActions: ['Contact us today', 'Book now'],
        questions: Math.floor(Math.random() * 3) + 1,
        statistics: Math.floor(Math.random() * 2) + 1,
        stories: Math.floor(Math.random() * 2),

        valuePropositions: ['Expert service', 'Premium quality'],
        urgencyTriggers: ['Limited time'],
        socialProof: ['Trusted by 1000+ clients'],
        objections: [],

        suggestions: [
          {
            id: 'suggestion-1',
            type: 'seo',
            priority: 'high',
            title: 'Add target keyword to heading',
            description: 'Include your primary keyword in an H2 heading for better SEO',
            originalText: '## About Our Services',
            suggestedText: `## ${primaryKeyword} Services`,
            reason: 'Search engines give more weight to keywords in headings',
            expectedImpact: '+15% SEO score',
            confidence: 92,
            category: 'SEO Optimization',
            applied: false
          },
          {
            id: 'suggestion-2',
            type: 'engagement',
            priority: 'medium',
            title: 'Add more emotional language',
            description: 'Include emotional triggers to increase reader engagement',
            originalText: 'We offer quality services.',
            suggestedText: 'Transform your beauty experience with our luxurious, life-changing services.',
            reason: 'Emotional language increases connection and engagement',
            expectedImpact: '+25% engagement',
            confidence: 78,
            category: 'Engagement',
            applied: false
          },
          {
            id: 'suggestion-3',
            type: 'conversion',
            priority: 'high',
            title: 'Add urgency trigger',
            description: 'Include time-sensitive elements to encourage immediate action',
            originalText: 'Contact us for more information.',
            suggestedText: 'Limited spots available this week! Contact us now to secure your appointment.',
            reason: 'Urgency triggers increase conversion rates',
            expectedImpact: '+20% conversions',
            confidence: 85,
            category: 'Conversion',
            applied: false
          }
        ]
      };

      mockAnalysis.overallScore = Math.round(
        (mockAnalysis.seoScore + mockAnalysis.readabilityScore +
         mockAnalysis.engagementScore + mockAnalysis.conversionScore +
         mockAnalysis.accessibilityScore) / 5
      );

      setAnalysis(mockAnalysis);
      toast({
        title: 'Analysis Complete',
        description: 'AI analysis finished with actionable recommendations',
      });
    } catch (error) {
      toast({
        title: 'Analysis Failed',
        description: 'Unable to analyze content. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsAnalyzing(false);
    }
  }, [content, selectedContentType, targetAudience, primaryKeyword, secondaryKeywords, selectedTone, goals, toast]);

  const applySuggestion = useCallback((suggestionId: string) => {
    if (!analysis) return;

    const suggestion = analysis.suggestions.find(s => s.id === suggestionId);
    if (!suggestion) return;

    setContent(prev => prev.replace(suggestion.originalText, suggestion.suggestedText));
    setAppliedSuggestions(prev => new Set(prev).add(suggestionId));

    setAnalysis(prev => ({
      ...prev!,
      suggestions: prev!.suggestions.map(s =>
        s.id === suggestionId ? { ...s, applied: true } : s
      )
    }));

    toast({
      title: 'Suggestion Applied',
      description: `"${suggestion.title}" has been applied to your content.`,
    });
  }, [analysis, toast]);

  const generateFromTemplate = useCallback(async (template: AIContentTemplate) => {
    setIsGenerating(true);

    try {
      // Simulate AI generation
      await new Promise(resolve => setTimeout(resolve, 2000));

      // In a real implementation, this would call an AI service
      // For now, we'll just use the template as-is
      setContent(template.template);
      setSelectedTemplate(template);

      toast({
        title: 'Content Generated',
        description: `Content generated using "${template.name}" template`,
      });
    } catch (error) {
      toast({
        title: 'Generation Failed',
        description: 'Unable to generate content. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  }, [toast]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-amber-600';
    return 'text-red-600';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 80) return CheckCircle;
    if (score >= 60) return AlertCircle;
    return AlertCircle;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="w-6 h-6 text-blue-500" />
            AI Content Optimizer
          </h2>
          <p className="text-muted-foreground">
            Advanced AI-powered content analysis and optimization
          </p>
        </div>
        <Button
          onClick={analyzeContent}
          disabled={isAnalyzing || !content.trim()}
          className="gap-2"
        >
          <Sparkles className="w-4 h-4" />
          {isAnalyzing ? 'Analyzing...' : 'Analyze Content'}
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="optimize">Optimize</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="analysis">Analysis</TabsTrigger>
          <TabsTrigger value="suggestions">Suggestions</TabsTrigger>
        </TabsList>

        <TabsContent value="optimize" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Content Input */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Content Input
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="Paste your content here for AI analysis and optimization..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={20}
                  className="resize-none"
                />

                {/* Content Settings */}
                <div className="space-y-3 pt-4 border-t">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-medium mb-1 block" htmlFor="content-type">Content Type</label>
                      <Select value={selectedContentType} onValueChange={setSelectedContentType}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="blog">Blog Post</SelectItem>
                          <SelectItem value="service">Service Page</SelectItem>
                          <SelectItem value="page">Landing Page</SelectItem>
                          <SelectItem value="product">Product Description</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-1 block" htmlFor="tone">Tone</label>
                      <Select value={selectedTone} onValueChange={setSelectedTone}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="professional">Professional</SelectItem>
                          <SelectItem value="casual">Casual</SelectItem>
                          <SelectItem value="friendly">Friendly</SelectItem>
                          <SelectItem value="authoritative">Authoritative</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-1 block" htmlFor="target-audience">Target Audience</label>
                    <Input
                      placeholder="e.g., Women 25-45 interested in beauty services"
                      value={targetAudience}
                      onChange={(e) => setTargetAudience(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-1 block" htmlFor="primary-keyword">Primary Keyword</label>
                    <Input
                      placeholder="e.g., lash extensions warsaw"
                      value={primaryKeyword}
                      onChange={(e) => setPrimaryKeyword(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-1 block" htmlFor="secondary-keywords">Secondary Keywords</label>
                    <Input
                      placeholder="e.g., brow lamination, beauty salon, permanent makeup"
                      value={secondaryKeywords}
                      onChange={(e) => setSecondaryKeywords(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-1 block" htmlFor="goals">Goals</label>
                    <Input
                      placeholder="e.g., Increase bookings, Build trust, Educate customers"
                      value={goals}
                      onChange={(e) => setGoals(e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Analysis Results */}
            {analysis && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Analysis Results
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Overall Score */}
                  <div className="text-center py-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
                    <div className="text-4xl font-bold text-blue-600 mb-2">
                      {analysis.overallScore}/100
                    </div>
                    <p className="text-sm text-muted-foreground">Overall Content Score</p>
                  </div>

                  {/* Individual Scores */}
                  <div className="space-y-3">
                    <h4 className="font-medium">Performance Metrics</h4>
                    {[
                      { label: 'SEO', score: analysis.seoScore, icon: Search },
                      { label: 'Readability', score: analysis.readabilityScore, icon: Type },
                      { label: 'Engagement', score: analysis.engagementScore, icon: Users },
                      { label: 'Conversion', score: analysis.conversionScore, icon: Target },
                      { label: 'Accessibility', score: analysis.accessibilityScore, icon: Award }
                    ].map(({ label, score, icon: Icon }) => (
                      <div key={label} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4" />
                          <span className="text-sm font-medium">{label}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Progress value={score} className="w-20 h-2" />
                          <span className={`text-sm font-medium ${getScoreColor(score)}`}>
                            {score}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Quick Stats */}
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                    <div className="text-center">
                      <div className="text-2xl font-bold">{analysis.readingTime}</div>
                      <div className="text-xs text-muted-foreground">Min Read</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{analysis.content.split(' ').length}</div>
                      <div className="text-xs text-muted-foreground">Words</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{analysis.headingStructure.h1Count + analysis.headingStructure.h2Count + analysis.headingStructure.h3Count}</div>
                      <div className="text-xs text-muted-foreground">Headings</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{analysis.callToActions.length}</div>
                      <div className="text-xs text-muted-foreground">CTAs</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5" />
                AI Content Templates
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                {templates.map(template => (
                  <Card key={template.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{template.name}</CardTitle>
                          <p className="text-sm text-muted-foreground mt-1">
                            {template.description}
                          </p>
                        </div>
                        <Badge variant="secondary">{template.contentType}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Category</span>
                        <Badge variant="outline">{template.category}</Badge>
                      </div>

                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <div className="text-lg font-bold text-green-600">
                            {template.performance.avgConversionRate}%
                          </div>
                          <div className="text-xs text-muted-foreground">Avg Conversion</div>
                        </div>
                        <div>
                          <div className="text-lg font-bold text-blue-600">
                            {template.performance.avgEngagement}%
                          </div>
                          <div className="text-xs text-muted-foreground">Avg Engagement</div>
                        </div>
                        <div>
                          <div className="text-lg font-bold text-purple-600">
                            {template.performance.usageCount}
                          </div>
                          <div className="text-xs text-muted-foreground">Times Used</div>
                        </div>
                      </div>

                      <Button
                        onClick={() => generateFromTemplate(template)}
                        disabled={isGenerating}
                        className="w-full"
                      >
                        {isGenerating && selectedTemplate?.id === template.id ? (
                          <>
                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4 mr-2" />
                            Use This Template
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analysis" className="space-y-6">
          {analysis ? (
            <div className="grid lg:grid-cols-3 gap-6">
              {/* SEO Analysis */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Search className="w-5 h-5" />
                    SEO Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Keyword Density</h4>
                    <div className="space-y-2">
                      {Object.entries(analysis.keywordDensity).map(([keyword, density]) => (
                        <div key={keyword} className="flex justify-between items-center">
                          <span className="text-sm">{keyword}</span>
                          <Badge variant={density > 3 ? 'destructive' : density < 0.5 ? 'secondary' : 'default'}>
                            {density.toFixed(2)}%
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="font-medium mb-2">Meta Information</h4>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Title:</span>
                        <p className="font-mono text-xs bg-muted p-2 rounded mt-1">
                          {analysis.metaTitle}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Description:</span>
                        <p className="font-mono text-xs bg-muted p-2 rounded mt-1">
                          {analysis.metaDescription}
                        </p>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="font-medium mb-2">Content Structure</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>H1 Headings:</span>
                        <span>{analysis.headingStructure.h1Count}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>H2 Headings:</span>
                        <span>{analysis.headingStructure.h2Count}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>H3 Headings:</span>
                        <span>{analysis.headingStructure.h3Count}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Readability Analysis */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Type className="w-5 h-5" />
                    Readability Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold">{analysis.averageSentenceLength}</div>
                      <div className="text-xs text-muted-foreground">Avg Sentence Length</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{analysis.averageWordsPerParagraph}</div>
                      <div className="text-xs text-muted-foreground">Words per Paragraph</div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="font-medium mb-2">Content Elements</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Questions:</span>
                        <Badge variant="outline">{analysis.questions}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Statistics:</span>
                        <Badge variant="outline">{analysis.statistics}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Stories:</span>
                        <Badge variant="outline">{analysis.stories}</Badge>
                      </div>
                    </div>
                  </div>

                  {analysis.difficultWords.length > 0 && (
                    <>
                      <Separator />
                      <div>
                        <h4 className="font-medium mb-2">Complex Words</h4>
                        <div className="flex flex-wrap gap-2">
                          {analysis.difficultWords.map(word => (
                            <Badge key={word} variant="secondary">{word}</Badge>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  {analysis.clarityIssues.length > 0 && (
                    <>
                      <Separator />
                      <div>
                        <h4 className="font-medium mb-2">Clarity Issues</h4>
                        <div className="space-y-1">
                          {analysis.clarityIssues.map((issue, index) => (
                            <div key={index} className="flex items-center gap-2 text-sm text-amber-600">
                              <AlertCircle className="w-3 h-3" />
                              {issue}
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Conversion Analysis */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    Conversion Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Value Propositions</h4>
                    <div className="space-y-1">
                      {analysis.valuePropositions.map((prop, index) => (
                        <div key={index} className="text-sm bg-green-50 p-2 rounded">
                          ✓ {prop}
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="font-medium mb-2">Call-to-Actions</h4>
                    <div className="space-y-1">
                      {analysis.callToActions.map((cta, index) => (
                        <div key={index} className="text-sm bg-blue-50 p-2 rounded">
                          🎯 {cta}
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="font-medium mb-2">Social Proof</h4>
                    <div className="space-y-1">
                      {analysis.socialProof.map((proof, index) => (
                        <div key={index} className="text-sm bg-purple-50 p-2 rounded">
                          ⭐ {proof}
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="font-medium mb-2">Urgency Triggers</h4>
                    <div className="space-y-1">
                      {analysis.urgencyTriggers.map((trigger, index) => (
                        <div key={index} className="text-sm bg-red-50 p-2 rounded">
                          ⚡ {trigger}
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <BarChart3 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Analysis Available</h3>
                <p className="text-muted-foreground">
                  Analyze your content first to see detailed breakdown
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="suggestions" className="space-y-6">
          {analysis && analysis.suggestions.length > 0 ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">
                  AI Optimization Suggestions ({analysis.suggestions.length})
                </h3>
                <Button
                  variant="outline"
                  onClick={() => {
                    analysis.suggestions.forEach(suggestion => {
                      if (!suggestion.applied) {
                        applySuggestion(suggestion.id);
                      }
                    });
                  }}
                >
                  Apply All
                </Button>
              </div>

              {analysis.suggestions.map(suggestion => (
                <Card key={suggestion.id} className={`border-l-4 ${
                  suggestion.priority === 'high' ? 'border-l-red-500' :
                  suggestion.priority === 'medium' ? 'border-l-amber-500' :
                  'border-l-green-500'
                }`}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold">{suggestion.title}</h4>
                          <Badge variant={
                            suggestion.priority === 'high' ? 'destructive' :
                            suggestion.priority === 'medium' ? 'default' : 'secondary'
                          }>
                            {suggestion.priority} priority
                          </Badge>
                          <Badge variant="outline">{suggestion.category}</Badge>
                          {suggestion.applied && (
                            <Badge className="bg-green-100 text-green-700">
                              Applied
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                          {suggestion.description}
                        </p>
                        <div className="space-y-2">
                          <div>
                            <span className="text-sm font-medium">Why:</span>
                            <p className="text-sm text-muted-foreground">{suggestion.reason}</p>
                          </div>
                          <div>
                            <span className="text-sm font-medium">Expected Impact:</span>
                            <p className="text-sm text-green-600 font-medium">{suggestion.expectedImpact}</p>
                          </div>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-center mb-2">
                          <div className={`text-lg font-bold ${getScoreColor(suggestion.confidence)}`}>
                            {suggestion.confidence}%
                          </div>
                          <div className="text-xs text-muted-foreground">Confidence</div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <span className="text-sm font-medium text-red-600">Current:</span>
                        <div className="bg-red-50 border border-red-200 rounded p-3 mt-1">
                          <p className="text-sm font-mono">{suggestion.originalText}</p>
                        </div>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-green-600">Suggested:</span>
                        <div className="bg-green-50 border border-green-200 rounded p-3 mt-1">
                          <p className="text-sm font-mono">{suggestion.suggestedText}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 mt-4">
                      <Button
                        onClick={() => applySuggestion(suggestion.id)}
                        disabled={suggestion.applied}
                        size="sm"
                      >
                        {suggestion.applied ? 'Applied' : 'Apply Suggestion'}
                      </Button>
                      <Button variant="outline" size="sm">
                        <Copy className="w-4 h-4 mr-2" />
                        Copy Suggestion
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Lightbulb className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Suggestions Available</h3>
                <p className="text-muted-foreground">
                  Analyze your content to receive AI-powered optimization suggestions
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AIContentOptimizer;