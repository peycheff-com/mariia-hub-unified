import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Search,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Eye,
  Target,
  BarChart3,
  Zap,
  Globe,
  Lightbulb,
  Copy,
  Download,
  RefreshCw
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast aria-live="polite" aria-atomic="true"';
import {
  SEOAnalysis,
  ContentManagement,
  ContentSearchFilters
} from '@/types/content';
import { blogService } from '@/services/blog.service';
import { cn } from '@/lib/utils';

interface SEOOptimizerProps {
  contentId?: string;
  initialContent?: Partial<ContentManagement>;
  onOptimized?: (analysis: SEOAnalysis, suggestions: string[]) => void;
  className?: string;
}

interface SERPPreview {
  title: string;
  url: string;
  description: string;
  breadcrumbs: string[];
  richSnippet?: {
    rating: number;
    reviews: number;
    price?: string;
    availability?: string;
  };
}

export const SEOOptimizer: React.FC<SEOOptimizerProps> = ({
  contentId,
  initialContent,
  onOptimized,
  className
}) => {
  const { t } = useTranslation();
  const { toast aria-live="polite" aria-atomic="true" } = useToast();

  // State
  const [content, setContent] = useState<Partial<ContentManagement>>(
    initialContent || {}
  );
  const [seoAnalysis, setSeoAnalysis] = useState<SEOAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [keywordDensity, setKeywordDensity] = useState<Record<string, number>>({});
  const [competitorAnalysis, setCompetitorAnalysis] = useState<any[]>([]);
  const [serpPreview, setSerpPreview] = useState<SERPPreview | null>(null);
  const [activeTab, setActiveTab] = useState('analysis');

  // Form inputs
  const [targetKeyword, setTargetKeyword] = useState('');
  const [secondaryKeywords, setSecondaryKeywords] = useState<string[]>([]);
  const [secondaryKeywordInput, setSecondaryKeywordInput] = useState('');
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [urlSlug, setUrlSlug] = useState('');

  // Initialize from content prop
  useEffect(() => {
    if (initialContent) {
      setContent(initialContent);
      setMetaTitle(initialContent.seo_title || '');
      setMetaDescription(initialContent.meta_description || '');
      setUrlSlug(initialContent.slug || '');
      setTargetKeyword(initialContent.focus_keyword || '');
    }
  }, [initialContent]);

  // Calculate keyword density
  const calculateKeywordDensity = useCallback((text: string, keyword: string): number => {
    const words = text.toLowerCase().split(/\s+/);
    const keywordWords = keyword.toLowerCase().split(/\s+/);
    const totalWords = words.length;

    if (totalWords === 0) return 0;

    let matches = 0;
    for (let i = 0; i <= words.length - keywordWords.length; i++) {
      const slice = words.slice(i, i + keywordWords.length).join(' ');
      if (slice === keyword.toLowerCase()) {
        matches++;
        i += keywordWords.length - 1; // Skip overlapping matches
      }
    }

    return (matches / totalWords) * 100;
  }, []);

  // Analyze SEO
  const analyzeSEO = useCallback(async () => {
    setIsAnalyzing(true);

    try {
      // Simulate SEO analysis
      await new Promise(resolve => setTimeout(resolve, 2000));

      const contentText = content.content?.body || content.excerpt || '';
      const title = content.title || '';
      const description = metaDescription || content.excerpt || '';

      // Calculate scores
      let score = 0;
      const suggestions: string[] = [];
      const issues: any[] = [];

      // Title analysis
      let titleScore = 0;
      if (title.length >= 30 && title.length <= 60) {
        titleScore = 100;
      } else if (title.length > 0) {
        titleScore = 50;
        suggestions.push(t('admin.seo.suggestions.titleLength'));
      } else {
        issues.push({ type: 'error', message: t('admin.seo.errors.titleMissing'), field: 'title' });
      }

      // Check if target keyword is in title
      if (targetKeyword && title.toLowerCase().includes(targetKeyword.toLowerCase())) {
        titleScore = Math.min(100, titleScore + 20);
      } else if (targetKeyword) {
        suggestions.push(t('admin.seo.suggestions.keywordInTitle'));
      }

      // Meta description analysis
      let metaScore = 0;
      if (metaDescription.length >= 150 && metaDescription.length <= 160) {
        metaScore = 100;
      } else if (metaDescription.length > 0) {
        metaScore = 50;
        suggestions.push(t('admin.seo.suggestions.metaLength'));
      } else {
        issues.push({ type: 'error', message: t('admin.seo.errors.metaMissing'), field: 'meta_description' });
      }

      // Check if target keyword is in meta description
      if (targetKeyword && metaDescription.toLowerCase().includes(targetKeyword.toLowerCase())) {
        metaScore = Math.min(100, metaScore + 20);
      } else if (targetKeyword) {
        suggestions.push(t('admin.seo.suggestions.keywordInMeta'));
      }

      // Content analysis
      let contentScore = 0;
      const wordCount = contentText.split(/\s+/).length;

      if (wordCount >= 300) {
        contentScore = 50;
        if (wordCount >= 1000) {
          contentScore = 100;
        }
      } else {
        suggestions.push(t('admin.seo.suggestions.contentLength'));
      }

      // Calculate keyword density
      const density: Record<string, number> = {};
      if (targetKeyword) {
        density[targetKeyword] = calculateKeywordDensity(contentText, targetKeyword);
      }

      secondaryKeywords.forEach(keyword => {
        density[keyword] = calculateKeywordDensity(contentText, keyword);
      });

      setKeywordDensity(density);

      // Check keyword density (ideal: 1-3%)
      Object.entries(density).forEach(([keyword, value]) => {
        if (value > 3) {
          issues.push({
            type: 'warning',
            message: t('admin.seo.errors.keywordStuffing', { keyword, density: value.toFixed(1) }),
            field: 'content'
          });
        } else if (value < 0.5 && keyword === targetKeyword) {
          suggestions.push(t('admin.seo.suggestions.increaseKeywordDensity', { keyword }));
        }
      });

      // Readability score (simplified Flesch-Kincaid)
      const sentences = contentText.split(/[.!?]+/).filter(s => s.trim().length > 0);
      const avgWordsPerSentence = wordCount / sentences.length;
      const readabilityScore = Math.max(0, Math.min(100, 120 - (avgWordsPerSentence - 15) * 2));

      // Calculate total score
      score = (titleScore * 0.3 + metaScore * 0.3 + contentScore * 0.2 + readabilityScore * 0.2);

      // Generate SERP preview
      setSerpPreview({
        title: metaTitle || title,
        url: `mariaborysevych.com/${urlSlug || 'blog'}`,
        description: metaDescription || description.substring(0, 160),
        breadcrumbs: ['Home', 'Blog', content.category || 'Uncategorized'],
        richSnippet: {
          rating: 4.8,
          reviews: 127,
          price: content.type === 'service-description' ? 'From 299 PLN' : undefined
        }
      });

      // Simulate competitor analysis
      setCompetitorAnalysis([
        {
          url: 'competitor1.com',
          title: 'Similar Article Title',
          description: 'Competitor description...',
          wordCount: 1200,
          keywordDensity: 2.1,
          backlinks: 45
        },
        {
          url: 'competitor2.com',
          title: 'Another Related Article',
          description: 'Another competitor...',
          wordCount: 980,
          keywordDensity: 1.8,
          backlinks: 32
        }
      ]);

      const analysis: SEOAnalysis = {
        score: Math.round(score),
        title_score: titleScore,
        meta_description_score: metaScore,
        content_score: contentScore,
        keyword_density: density,
        readability_score: Math.round(readabilityScore),
        suggestions,
        issues,
        word_count: wordCount,
        reading_time: Math.ceil(wordCount / 250)
      };

      setSeoAnalysis(analysis);
      onOptimized?.(analysis, suggestions);

      toast aria-live="polite" aria-atomic="true"({
        title: t('admin.seo.analysisComplete'),
        description: t('admin.seo.analysisCompleteDesc')
      });
    } catch (error) {
      console.error('Error analyzing SEO:', error);
      toast aria-live="polite" aria-atomic="true"({
        title: t('admin.seo.analysisFailed'),
        description: t('admin.seo.analysisFailedDesc'),
        variant: 'destructive'
      });
    } finally {
      setIsAnalyzing(false);
    }
  }, [
    content,
    targetKeyword,
    secondaryKeywords,
    metaTitle,
    metaDescription,
    urlSlug,
    calculateKeywordDensity,
    onOptimized,
    toast aria-live="polite" aria-atomic="true",
    t
  ]);

  // Add secondary keyword
  const addSecondaryKeyword = useCallback(() => {
    if (secondaryKeywordInput.trim() && !secondaryKeywords.includes(secondaryKeywordInput.trim())) {
      setSecondaryKeywords(prev => [...prev, secondaryKeywordInput.trim()]);
      setSecondaryKeywordInput('');
    }
  }, [secondaryKeywordInput, secondaryKeywords]);

  // Generate meta tags
  const generateMetaTags = useCallback(() => {
    if (!content.title) return;

    // Generate SEO title
    const baseTitle = content.title;
    const generatedTitle = baseTitle.length > 60
      ? baseTitle.substring(0, 57) + '...'
      : baseTitle;

    setMetaTitle(generatedTitle);

    // Generate meta description
    const contentText = content.content?.body || content.excerpt || '';
    const generatedDesc = contentText.length > 160
      ? contentText.substring(0, 157) + '...'
      : contentText;

    setMetaDescription(generatedDesc);

    // Generate URL slug
    const generatedSlug = baseTitle
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();

    setUrlSlug(generatedSlug);

    toast aria-live="polite" aria-atomic="true"({
      title: t('admin.seo.metaGenerated'),
      description: t('admin.seo.metaGeneratedDesc')
    });
  }, [content, toast aria-live="polite" aria-atomic="true", t]);

  // Copy to clipboard
  const copyToClipboard = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast aria-live="polite" aria-atomic="true"({
        title: t('common.copied'),
        description: t('common.copiedToClipboard')
      });
    } catch (error) {
      console.error('Error copying:', error);
    }
  }, [toast aria-live="polite" aria-atomic="true", t]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return t('admin.seo.excellent');
    if (score >= 60) return t('admin.seo.good');
    if (score >= 40) return t('admin.seo.needsImprovement');
    return t('admin.seo.poor');
  };

  return (
    <div className={cn('w-full space-y-6', className)}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            {t('admin.seo.title')}
          </CardTitle>
          <CardDescription>
            {t('admin.seo.description')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Keywords Section */}
          <div className="space-y-4 mb-6">
            <div>
              <Label htmlFor="target-keyword">{t('admin.seo.targetKeyword')}</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="target-keyword"
                  value={targetKeyword}
                  onChange={(e) => setTargetKeyword(e.target.value)}
                  placeholder={t('admin.seo.targetKeywordPlaceholder')}
                />
                <Button variant="outline" onClick={generateMetaTags}>
                  <Lightbulb className="h-4 w-4 mr-2" />
                  {t('admin.seo.generateMeta')}
                </Button>
              </div>
            </div>

            <div>
              <Label>{t('admin.seo.secondaryKeywords')}</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  value={secondaryKeywordInput}
                  onChange={(e) => setSecondaryKeywordInput(e.target.value)}
                  placeholder={t('admin.seo.secondaryKeywordPlaceholder')}
                  onKeyPress={(e) => e.key === 'Enter' && addSecondaryKeyword()}
                />
                <Button variant="outline" onClick={addSecondaryKeyword}>
                  {t('common.add')}
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {secondaryKeywords.map((keyword, index) => (
                  <Badge key={index} variant="secondary" className="cursor-pointer">
                    {keyword}
                    <button
                      onClick={() => setSecondaryKeywords(prev => prev.filter((_, i) => i !== index))}
                      className="ml-2 text-xs"
                    >
                      ×
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {/* Meta Tags */}
          <div className="grid gap-4 mb-6">
            <div>
              <Label htmlFor="meta-title">{t('admin.seo.metaTitle')} ({metaTitle.length}/60)</Label>
              <Input
                id="meta-title"
                value={metaTitle}
                onChange={(e) => setMetaTitle(e.target.value)}
                placeholder={t('admin.seo.metaTitlePlaceholder')}
                className={cn(
                  metaTitle.length > 60 && 'border-red-500',
                  metaTitle.length >= 30 && metaTitle.length <= 60 && 'border-green-500'
                )}
              />
            </div>

            <div>
              <Label htmlFor="meta-description">
                {t('admin.seo.metaDescription')} ({metaDescription.length}/160)
              </Label>
              <Textarea
                id="meta-description"
                value={metaDescription}
                onChange={(e) => setMetaDescription(e.target.value)}
                placeholder={t('admin.seo.metaDescriptionPlaceholder')}
                rows={3}
                className={cn(
                  metaDescription.length > 160 && 'border-red-500',
                  metaDescription.length >= 150 && metaDescription.length <= 160 && 'border-green-500'
                )}
              />
            </div>

            <div>
              <Label htmlFor="url-slug">{t('admin.seo.urlSlug')}</Label>
              <Input
                id="url-slug"
                value={urlSlug}
                onChange={(e) => setUrlSlug(e.target.value)}
                placeholder={t('admin.seo.urlSlugPlaceholder')}
                prefix="/"
              />
            </div>
          </div>

          <Separator className="my-6" />

          {/* Action Buttons */}
          <div className="flex justify-between">
            <Button onClick={analyzeSEO} disabled={isAnalyzing}>
              {isAnalyzing ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  {t('admin.seo.analyzing')}
                </>
              ) : (
                <>
                  <BarChart3 className="h-4 w-4 mr-2" />
                  {t('admin.seo.analyzeSEO')}
                </>
              )}
            </Button>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => copyToClipboard(metaTitle)}>
                <Copy className="h-4 w-4 mr-2" />
                {t('admin.seo.copyMeta')}
              </Button>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                {t('admin.seo.exportReport')}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {seoAnalysis && (
        <>
          {/* Score Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                {t('admin.seo.seoScore')}
                <div className="flex items-center gap-2">
                  <span className={cn('text-3xl font-bold', getScoreColor(seoAnalysis.score))}>
                    {seoAnalysis.score}
                  </span>
                  <span className="text-sm text-muted-foreground">/100</span>
                  <Badge variant={seoAnalysis.score >= 80 ? 'default' : seoAnalysis.score >= 60 ? 'secondary' : 'destructive'}>
                    {getScoreLabel(seoAnalysis.score)}
                  </Badge>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{seoAnalysis.title_score}%</div>
                  <div className="text-sm text-muted-foreground">{t('admin.seo.titleScore')}</div>
                  <Progress value={seoAnalysis.title_score} className="mt-2" />
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{seoAnalysis.meta_description_score}%</div>
                  <div className="text-sm text-muted-foreground">{t('admin.seo.metaScore')}</div>
                  <Progress value={seoAnalysis.meta_description_score} className="mt-2" />
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{seoAnalysis.content_score}%</div>
                  <div className="text-sm text-muted-foreground">{t('admin.seo.contentScore')}</div>
                  <Progress value={seoAnalysis.content_score} className="mt-2" />
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{seoAnalysis.readability_score}%</div>
                  <div className="text-sm text-muted-foreground">{t('admin.seo.readability')}</div>
                  <Progress value={seoAnalysis.readability_score} className="mt-2" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Detailed Analysis */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="analysis">{t('admin.seo.analysis')}</TabsTrigger>
              <TabsTrigger value="serp">{t('admin.seo.serpPreview')}</TabsTrigger>
              <TabsTrigger value="keywords">{t('admin.seo.keywords')}</TabsTrigger>
              <TabsTrigger value="competitors">{t('admin.seo.competitors')}</TabsTrigger>
            </TabsList>

            {/* Analysis Tab */}
            <TabsContent value="analysis" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    {t('admin.seo.contentMetrics')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <div className="text-2xl font-bold">{seoAnalysis.word_count}</div>
                      <div className="text-sm text-muted-foreground">{t('admin.seo.words')}</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{seoAnalysis.reading_time}</div>
                      <div className="text-sm text-muted-foreground">{t('admin.seo.minRead')}</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{Object.keys(keywordDensity).length}</div>
                      <div className="text-sm text-muted-foreground">{t('admin.seo.trackedKeywords')}</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{seoAnalysis.issues.length}</div>
                      <div className="text-sm text-muted-foreground">{t('admin.seo.issues')}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Issues and Suggestions */}
              <div className="grid md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-red-600">
                      <AlertCircle className="h-5 w-5" />
                      {t('admin.seo.issues')} ({seoAnalysis.issues.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-64">
                      <div className="space-y-2">
                        {seoAnalysis.issues.map((issue, index) => (
                          <Alert key={index} variant={issue.type === 'error' ? 'destructive' : 'default'}>
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle className="text-sm">{issue.field}</AlertTitle>
                            <AlertDescription className="text-sm">
                              {issue.message}
                            </AlertDescription>
                          </Alert>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-blue-600">
                      <Lightbulb className="h-5 w-5" />
                      {t('admin.seo.suggestions')} ({seoAnalysis.suggestions.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-64">
                      <div className="space-y-2">
                        {seoAnalysis.suggestions.map((suggestion, index) => (
                          <div key={index} className="flex items-start gap-2 p-2 rounded-lg bg-muted">
                            <CheckCircle className="h-4 w-4 mt-0.5 text-green-600 flex-shrink-0" />
                            <span className="text-sm">{suggestion}</span>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* SERP Preview Tab */}
            <TabsContent value="serp">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    {t('admin.seo.serpPreview')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {serpPreview && (
                    <div className="space-y-4">
                      <div className="max-w-2xl mx-auto">
                        {/* Breadcrumbs */}
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                          {serpPreview.breadcrumbs.map((crumb, index) => (
                            <React.Fragment key={index}>
                              {index > 0 && <span>›</span>}
                              <span>{crumb}</span>
                            </React.Fragment>
                          ))}
                        </div>

                        {/* Title */}
                        <h3 className="text-xl text-blue-800 hover:underline cursor-pointer mb-1">
                          {serpPreview.title}
                        </h3>

                        {/* URL */}
                        <div className="text-sm text-green-800 mb-2">
                          {serpPreview.url}
                        </div>

                        {/* Description */}
                        <p className="text-sm text-gray-600 mb-3">
                          {serpPreview.description}
                        </p>

                        {/* Rich Snippet */}
                        {serpPreview.richSnippet && (
                          <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-1">
                              <div className="flex">
                                {[...Array(5)].map((_, i) => (
                                  <span key={i} className={i < Math.floor(serpPreview.richSnippet.rating) ? 'text-yellow-500' : 'text-gray-300'}>
                                    ★
                                  </span>
                                ))}
                              </div>
                              <span className="text-gray-600">
                                {serpPreview.richSnippet.rating} ({serpPreview.richSnippet.reviews} reviews)
                              </span>
                            </div>
                            {serpPreview.richSnippet.price && (
                              <span className="text-green-600 font-semibold">
                                {serpPreview.richSnippet.price}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      <Separator />

                      <div className="grid md:grid-cols-3 gap-4 text-center">
                        <div>
                          <div className="text-lg font-semibold">
                            {metaTitle.length}/60
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {t('admin.seo.titleLength')}
                          </div>
                        </div>
                        <div>
                          <div className="text-lg font-semibold">
                            {metaDescription.length}/160
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {t('admin.seo.descLength')}
                          </div>
                        </div>
                        <div>
                          <div className="text-lg font-semibold">
                            {urlSlug.length}/60
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {t('admin.seo.urlLength')}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Keywords Tab */}
            <TabsContent value="keywords">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    {t('admin.seo.keywordAnalysis')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(keywordDensity).map(([keyword, density]) => (
                      <div key={keyword} className="flex items-center justify-between p-3 rounded-lg border">
                        <div className="flex items-center gap-3">
                          <Badge variant={keyword === targetKeyword ? 'default' : 'secondary'}>
                            {keyword === targetKeyword ? t('admin.seo.primary') : t('admin.seo.secondary')}
                          </Badge>
                          <span className="font-medium">{keyword}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <div className={cn(
                              'font-semibold',
                              density > 3 ? 'text-red-600' : density >= 1 ? 'text-green-600' : 'text-yellow-600'
                            )}>
                              {density.toFixed(2)}%
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {t('admin.seo.density')}
                            </div>
                          </div>
                          <Progress
                            value={Math.min(density * 30, 100)}
                            className="w-24"
                          />
                        </div>
                      </div>
                    ))}

                    <Alert>
                      <Lightbulb className="h-4 w-4" />
                      <AlertTitle>{t('admin.seo.keywordDensityTip')}</AlertTitle>
                      <AlertDescription>
                        {t('admin.seo.keywordDensityTipDesc')}
                      </AlertDescription>
                    </Alert>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Competitors Tab */}
            <TabsContent value="competitors">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    {t('admin.seo.competitorAnalysis')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {competitorAnalysis.map((competitor, index) => (
                      <div key={index} className="p-4 rounded-lg border">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium text-blue-600 hover:underline cursor-pointer">
                            {competitor.url}
                          </h4>
                          <Badge variant="outline">
                            #{index + 1} {t('admin.seo.competitor')}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">{competitor.description}</p>
                        <div className="grid grid-cols-4 gap-4 text-sm">
                          <div>
                            <div className="font-semibold">{competitor.wordCount}</div>
                            <div className="text-muted-foreground">{t('admin.seo.words')}</div>
                          </div>
                          <div>
                            <div className="font-semibold">{competitor.keywordDensity}%</div>
                            <div className="text-muted-foreground">{t('admin.seo.keywordDensity')}</div>
                          </div>
                          <div>
                            <div className="font-semibold">{competitor.backlinks}</div>
                            <div className="text-muted-foreground">{t('admin.seo.backlinks')}</div>
                          </div>
                          <div>
                            <Button variant="outline" size="sm">
                              {t('admin.seo.analyze')}
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}

                    <Alert>
                      <TrendingUp className="h-4 w-4" />
                      <AlertTitle>{t('admin.seo.competitorInsight')}</AlertTitle>
                      <AlertDescription>
                        {t('admin.seo.competitorInsightDesc')}
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