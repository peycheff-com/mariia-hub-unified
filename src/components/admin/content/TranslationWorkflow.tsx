import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Languages,
  Loader2,
  Copy,
  Check,
  RefreshCw,
  Save,
  CheckCircle,
  AlertCircle,
  Clock,
  Users,
  Eye,
  Edit3,
  ThumbsUp,
  ThumbsDown,
  RotateCw,
  Download,
  Upload,
  History,
  BookOpen,
  Brain,
  Globe
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { translationMemory } from '@/lib/translations/TranslationMemory';
import { getAIService } from '@/integrations/ai/service';
import {
  TranslationRequest,
  TranslationTask,
  Language
} from '@/types/content';
import { blogService } from '@/services/blog.service';
import { cn } from '@/lib/utils';

interface TranslationWorkflowProps {
  contentId?: string;
  sourceContent?: any;
  onTranslated?: (translatedContent: any, targetLanguage: Language) => void;
  className?: string;
}

interface TranslationMatch {
  text: string;
  score: number;
  entry: any;
}

export const TranslationWorkflow: React.FC<TranslationWorkflowProps> = ({
  contentId,
  sourceContent,
  onTranslated,
  className
}) => {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();

  // State
  const [sourceLanguage, setSourceLanguage] = useState<Language>(i18n.language as Language || 'en');
  const [targetLanguage, setTargetLanguage] = useState<Language>('pl');
  const [translationTasks, setTranslationTasks] = useState<TranslationTask[]>([]);
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationProgress, setTranslationProgress] = useState(0);
  const [translationMemoryMatches, setTranslationMemoryMatches] = useState<TranslationMatch[]>([]);
  const [showAIAssist, setShowAIAssist] = useState(false);
  const [useTranslationMemory, setUseTranslationMemory] = useState(true);
  const [useAI, setUseAI] = useState(true);
  const [preserveFormatting, setPreserveFormatting] = useState(true);
  const [context, setContext] = useState('');
  const [category, setCategory] = useState('');
  const [selectedMatches, setSelectedMatches] = useState<Set<string>>(new Set());

  // Translation form
  const [titleTranslation, setTitleTranslation] = useState('');
  const [contentTranslation, setContentTranslation] = useState('');
  const [metaTitleTranslation, setMetaTitleTranslation] = useState('');
  const [metaDescTranslation, setMetaDescTranslation] = useState('');

  // Initialize from source content
  useEffect(() => {
    if (sourceContent) {
      // Initialize with source content
    }
  }, [sourceContent]);

  // Search translation memory
  const searchTranslationMemory = useCallback(async (text: string) => {
    if (!useTranslationMemory || !text.trim()) return;

    try {
      const matches = await translationMemory.search(
        text,
        sourceLanguage,
        targetLanguage,
        { minScore: 0.7, maxResults: 10, category }
      );
      setTranslationMemoryMatches(matches);
    } catch (error) {
      console.error('Error searching translation memory:', error);
    }
  }, [sourceLanguage, targetLanguage, useTranslationMemory, category]);

  // Translate with AI
  const translateWithAI = useCallback(async (text: string) => {
    const aiService = getAIService({
      apiKey: import.meta.env.VITE_OPENAI_API_KEY || '',
      model: 'gpt-4-turbo-preview',
      maxTokens: 2000,
      temperature: 0.3
    });

    const result = await aiService.translateText({
      text,
      targetLanguage,
      sourceLanguage,
      context,
      maintainTone: true
    });

    return result.translatedText;
  }, [targetLanguage, sourceLanguage, context]);

  // Start translation process
  const startTranslation = useCallback(async () => {
    if (!sourceContent) {
      toast({
        title: t('admin.translation.noSourceContent'),
        description: t('admin.translation.noSourceContentDesc'),
        variant: 'destructive'
      });
      return;
    }

    setIsTranslating(true);
    setTranslationProgress(0);

    try {
      // Create translation task
      const task: TranslationTask = {
        id: crypto.randomUUID(),
        content_id: contentId || '',
        source_language: sourceLanguage,
        target_language: targetLanguage,
        status: 'in_progress',
        progress: 0,
        assigned_to: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        completed_at: null
      };

      setTranslationTasks(prev => [task, ...prev]);

      // Translate each field
      const translations: Record<string, string> = {};
      const fields = [
        { key: 'title', text: sourceContent.title },
        { key: 'content', text: sourceContent.content?.body || '' },
        { key: 'seo_title', text: sourceContent.seo_title },
        { key: 'meta_description', text: sourceContent.meta_description }
      ];

      for (let i = 0; i < fields.length; i++) {
        const field = fields[i];
        let translation = '';

        setTranslationProgress(((i + 1) / fields.length) * 100);

        // Try translation memory first
        if (useTranslationMemory) {
          const matches = await translationMemory.search(
            field.text,
            sourceLanguage,
            targetLanguage,
            { minScore: 0.9, maxResults: 1, category }
          );

          if (matches.length > 0 && matches[0].score > 0.9) {
            translation = matches[0].text;
            // Update usage count
            await translationMemory.updateUsage(matches[0].entry.id);
          }
        }

        // Use AI as fallback or if enabled
        if (!translation && useAI) {
          translation = await translateWithAI(field.text);
        }

        translations[field.key] = translation || field.text;

        // Add to translation memory if quality is good
        if (translation && translation !== field.text) {
          await translationMemory.add(
            field.text,
            translation,
            sourceLanguage,
            targetLanguage,
            {
              context,
              category,
              approved: false,
              quality_score: 0.8
            }
          );
        }
      }

      // Update form state
      setTitleTranslation(translations.title);
      setContentTranslation(translations.content);
      setMetaTitleTranslation(translations.seo_title);
      setMetaDescTranslation(translations.meta_description);

      // Update task status
      setTranslationTasks(prev =>
        prev.map(t =>
          t.id === task.id
            ? { ...t, status: 'completed', progress: 100, completed_at: new Date().toISOString() }
            : t
        )
      );

      toast({
        title: t('admin.translation.completed'),
        description: t('admin.translation.completedDesc')
      });

      onTranslated?.(
        {
          ...sourceContent,
          title: translations.title,
          content: { body: translations.content },
          seo_title: translations.seo_title,
          meta_description: translations.meta_description,
          language: targetLanguage,
          is_translation: true,
          source_language: sourceLanguage
        },
        targetLanguage
      );
    } catch (error) {
      console.error('Translation failed:', error);
      toast({
        title: t('admin.translation.failed'),
        description: t('admin.translation.failedDesc'),
        variant: 'destructive'
      });

      // Update task status
      setTranslationTasks(prev =>
        prev.map(t =>
          t.id === (prev[0]?.id || '')
            ? { ...t, status: 'failed', progress: 0 }
            : t
        )
      );
    } finally {
      setIsTranslating(false);
      setTranslationProgress(0);
    }
  }, [
    sourceContent,
    contentId,
    sourceLanguage,
    targetLanguage,
    useTranslationMemory,
    useAI,
    context,
    category,
    translateWithAI,
    onTranslated,
    toast,
    t
  ]);

  // Save translation
  const saveTranslation = useCallback(async () => {
    if (!sourceContent || !titleTranslation) {
      toast({
        title: t('admin.translation.incomplete'),
        description: t('admin.translation.incompleteDesc'),
        variant: 'destructive'
      });
      return;
    }

    try {
      const translatedContent = {
        ...sourceContent,
        title: titleTranslation,
        content: { body: contentTranslation },
        seo_title: metaTitleTranslation,
        meta_description: metaDescTranslation,
        language: targetLanguage,
        is_translation: true,
        source_language: sourceLanguage,
        translation_group_id: contentId,
        status: 'draft'
      };

      await blogService.saveBlogPost(translatedContent);

      toast({
        title: t('admin.translation.saved'),
        description: t('admin.translation.savedDesc')
      });
    } catch (error) {
      console.error('Error saving translation:', error);
      toast({
        title: t('admin.translation.saveFailed'),
        description: t('admin.translation.saveFailedDesc'),
        variant: 'destructive'
      });
    }
  }, [
    sourceContent,
    titleTranslation,
    contentTranslation,
    metaTitleTranslation,
    metaDescTranslation,
    targetLanguage,
    sourceLanguage,
    contentId,
    toast,
    t
  ]);

  // Apply translation memory match
  const applyTranslationMatch = useCallback((match: TranslationMatch, field: string) => {
    const setter = {
      title: setTitleTranslation,
      content: setContentTranslation,
      seo_title: setMetaTitleTranslation,
      meta_description: setMetaDescTranslation
    }[field];

    if (setter) {
      setter(match.text);
    }
  }, []);

  // Get language name
  const getLanguageName = (lang: Language) => {
    const languages: Record<Language, string> = {
      en: 'English',
      pl: 'Polski',
      ua: 'Українська',
      ru: 'Русский'
    };
    return languages[lang] || lang;
  };

  // Translation stats
  const getTranslationStats = useCallback(async () => {
    try {
      const stats = await translationMemory.getStats();
      return stats;
    } catch (error) {
      console.error('Error getting translation stats:', error);
      return null;
    }
  }, []);

  return (
    <div className={cn('w-full space-y-6', className)}>
      {/* Translation Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Languages className="h-5 w-5" />
            {t('admin.translation.title')}
          </CardTitle>
          <CardDescription>
            {t('admin.translation.description')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Source/Target Languages */}
            <div className="space-y-4">
              <div>
                <Label>{t('admin.translation.sourceLanguage')}</Label>
                <Select value={sourceLanguage} onValueChange={(value) => setSourceLanguage(value as Language)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="pl">Polski</SelectItem>
                    <SelectItem value="ua">Українська</SelectItem>
                    <SelectItem value="ru">Русский</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>{t('admin.translation.targetLanguage')}</Label>
                <Select value={targetLanguage} onValueChange={(value) => setTargetLanguage(value as Language)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="pl">Polski</SelectItem>
                    <SelectItem value="ua">Українська</SelectItem>
                    <SelectItem value="ru">Русский</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="use-translation-memory"
                    checked={useTranslationMemory}
                    onCheckedChange={setUseTranslationMemory}
                  />
                  <Label htmlFor="use-translation-memory">{t('admin.translation.useMemory')}</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="use-ai"
                    checked={useAI}
                    onCheckedChange={setUseAI}
                  />
                  <Label htmlFor="use-ai">{t('admin.translation.useAI')}</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="preserve-formatting"
                    checked={preserveFormatting}
                    onCheckedChange={setPreserveFormatting}
                  />
                  <Label htmlFor="preserve-formatting">{t('admin.translation.preserveFormatting')}</Label>
                </div>
              </div>
            </div>

            {/* Context and Options */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="category">{t('admin.translation.category')}</Label>
                <Input
                  id="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder={t('admin.translation.categoryPlaceholder')}
                />
              </div>

              <div>
                <Label htmlFor="context">{t('admin.translation.context')}</Label>
                <Textarea
                  id="context"
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  placeholder={t('admin.translation.contextPlaceholder')}
                  rows={3}
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={startTranslation} disabled={isTranslating || !sourceContent}>
                  {isTranslating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {t('admin.translation.translating')}
                    </>
                  ) : (
                    <>
                      <Languages className="h-4 w-4 mr-2" />
                      {t('admin.translation.startTranslation')}
                    </>
                  )}
                </Button>
                <Button variant="outline" onClick={saveTranslation} disabled={!titleTranslation}>
                  <Save className="h-4 w-4 mr-2" />
                  {t('admin.translation.save')}
                </Button>
              </div>
            </div>
          </div>

          {/* Progress */}
          {isTranslating && (
            <div className="mt-4">
              <div className="flex justify-between text-sm text-muted-foreground mb-2">
                <span>{t('admin.translation.translationProgress')}</span>
                <span>{translationProgress.toFixed(0)}%</span>
              </div>
              <Progress value={translationProgress} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Translation Workspace */}
      <Tabs defaultValue="editor" className="space-y-4">
        <TabsList>
          <TabsTrigger value="editor" className="flex items-center gap-2">
            <Edit3 className="h-4 w-4" />
            {t('admin.translation.editor')}
          </TabsTrigger>
          <TabsTrigger value="memory" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            {t('admin.translation.memory')}
          </TabsTrigger>
          <TabsTrigger value="tasks" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            {t('admin.translation.tasks')}
          </TabsTrigger>
        </TabsList>

        {/* Editor Tab */}
        <TabsContent value="editor" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Source Content */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  {t('admin.translation.sourceContent')}
                  <Badge variant="outline">
                    {getLanguageName(sourceLanguage)}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {sourceContent ? (
                  <>
                    <div>
                      <Label>{t('admin.translation.title')}</Label>
                      <div className="mt-1 p-3 bg-muted rounded-md text-sm">
                        {sourceContent.title}
                      </div>
                    </div>

                    <div>
                      <Label>{t('admin.translation.content')}</Label>
                      <ScrollArea className="h-64 mt-1">
                        <div className="p-3 bg-muted rounded-md text-sm whitespace-pre-wrap">
                          {sourceContent.content?.body}
                        </div>
                      </ScrollArea>
                    </div>

                    {(sourceContent.seo_title || sourceContent.meta_description) && (
                      <>
                        <Separator />
                        <div className="space-y-2">
                          {sourceContent.seo_title && (
                            <div>
                              <Label className="text-xs text-muted-foreground">{t('admin.translation.seoTitle')}</Label>
                              <div className="text-sm">{sourceContent.seo_title}</div>
                            </div>
                          )}
                          {sourceContent.meta_description && (
                            <div>
                              <Label className="text-xs text-muted-foreground">{t('admin.translation.metaDescription')}</Label>
                              <div className="text-sm">{sourceContent.meta_description}</div>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    <AlertCircle className="h-12 w-12 mx-auto mb-2" />
                    <p>{t('admin.translation.noSourceSelected')}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Translation Editor */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  {t('admin.translation.translation')}
                  <Badge variant="default">
                    {getLanguageName(targetLanguage)}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="translated-title">{t('admin.translation.title')}</Label>
                  <Textarea
                    id="translated-title"
                    value={titleTranslation}
                    onChange={(e) => setTitleTranslation(e.target.value)}
                    placeholder={t('admin.translation.titlePlaceholder')}
                    rows={2}
                  />
                </div>

                <div>
                  <Label htmlFor="translated-content">{t('admin.translation.content')}</Label>
                  <Textarea
                    id="translated-content"
                    value={contentTranslation}
                    onChange={(e) => setContentTranslation(e.target.value)}
                    placeholder={t('admin.translation.contentPlaceholder')}
                    rows={12}
                  />
                </div>

                <Separator />

                <div className="space-y-3">
                  <div>
                    <Label htmlFor="translated-seo-title" className="text-xs text-muted-foreground">
                      {t('admin.translation.seoTitle')}
                    </Label>
                    <Input
                      id="translated-seo-title"
                      value={metaTitleTranslation}
                      onChange={(e) => setMetaTitleTranslation(e.target.value)}
                      placeholder={t('admin.translation.seoTitlePlaceholder')}
                    />
                  </div>

                  <div>
                    <Label htmlFor="translated-meta-desc" className="text-xs text-muted-foreground">
                      {t('admin.translation.metaDescription')}
                    </Label>
                    <Textarea
                      id="translated-meta-desc"
                      value={metaDescTranslation}
                      onChange={(e) => setMetaDescTranslation(e.target.value)}
                      placeholder={t('admin.translation.metaDescriptionPlaceholder')}
                      rows={2}
                    />
                  </div>
                </div>

                {/* AI Assist */}
                {showAIAssist && (
                  <Alert>
                    <Brain className="h-4 w-4" />
                    <AlertTitle>{t('admin.translation.aiSuggestion')}</AlertTitle>
                    <AlertDescription>
                      {t('admin.translation.aiSuggestionDesc')}
                    </AlertDescription>
                  </Alert>
                )}

                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setShowAIAssist(!showAIAssist)}>
                    <Brain className="h-4 w-4 mr-2" />
                    {t('admin.translation.aiAssist')}
                  </Button>
                  <Button variant="outline">
                    <ThumbsUp className="h-4 w-4 mr-2" />
                    {t('admin.translation.approve')}
                  </Button>
                  <Button variant="outline">
                    <ThumbsDown className="h-4 w-4 mr-2" />
                    {t('admin.translation.reject')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Translation Memory Tab */}
        <TabsContent value="memory" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('admin.translation.memoryMatches')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {translationMemoryMatches.length > 0 ? (
                  translationMemoryMatches.map((match, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge variant={match.score > 0.9 ? 'default' : 'secondary'}>
                            {Math.round(match.score * 100)}% match
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {t('admin.translation.used')} {match.entry.usage_count}x
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => applyTranslationMatch(match, 'content')}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="grid md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">
                            {t('admin.translation.source')}
                          </div>
                          <div>{match.entry.source_text}</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">
                            {t('admin.translation.translation')}
                          </div>
                          <div className="font-medium">{match.text}</div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    <BookOpen className="h-12 w-12 mx-auto mb-2" />
                    <p>{t('admin.translation.noMatchesFound')}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tasks Tab */}
        <TabsContent value="tasks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('admin.translation.translationTasks')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {translationTasks.length > 0 ? (
                  translationTasks.map((task) => (
                    <div key={task.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <Badge variant={
                            task.status === 'completed' ? 'default' :
                            task.status === 'failed' ? 'destructive' :
                            task.status === 'in_progress' ? 'secondary' : 'outline'
                          }>
                            {t(`admin.translation.status.${task.status}`)}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {getLanguageName(task.source_language)} → {getLanguageName(task.target_language)}
                          </span>
                        </div>
                        {task.status === 'in_progress' && (
                          <Progress value={task.progress} className="w-24" />
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {t('admin.translation.created')}: {new Date(task.created_at).toLocaleString()}
                      </div>
                      {task.completed_at && (
                        <div className="text-sm text-muted-foreground">
                          {t('admin.translation.completed')}: {new Date(task.completed_at).toLocaleString()}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    <Clock className="h-12 w-12 mx-auto mb-2" />
                    <p>{t('admin.translation.noTranslationTasks')}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Import/Export */}
      <div className="flex justify-end gap-2">
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              {t('admin.translation.export')}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('admin.translation.exportTranslations')}</DialogTitle>
              <DialogDescription>
                {t('admin.translation.exportDesc')}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>{t('admin.translation.exportFormat')}</Label>
                <Select defaultValue="json">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="json">JSON</SelectItem>
                    <SelectItem value="csv">CSV</SelectItem>
                    <SelectItem value="xliff">XLIFF</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button>{t('admin.translation.download')}</Button>
                <Button variant="outline">{t('admin.translation.selectAll')}</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline">
              <Upload className="h-4 w-4 mr-2" />
              {t('admin.translation.import')}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('admin.translation.importTranslations')}</DialogTitle>
              <DialogDescription>
                {t('admin.translation.importDesc')}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>{t('admin.translation.importFile')}</Label>
                <Input type="file" accept=".json,.csv,.xliff" />
              </div>
              <div className="flex gap-2">
                <Button>{t('admin.translation.upload')}</Button>
                <Button variant="outline">{t('common.cancel')}</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Translation Stats Alert */}
      <Alert>
        <History className="h-4 w-4" />
        <AlertTitle>{t('admin.translation.translationMemory')}</AlertTitle>
        <AlertDescription>
          {t('admin.translation.memoryStats')}
        </AlertDescription>
      </Alert>
    </div>
  );
};