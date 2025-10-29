import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Loader2,
  Sparkles,
  Plus,
  Lightbulb,
  Target,
  TrendingUp,
} from 'lucide-react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Button,
} from '@/components/ui/button';
import {
  Input,
} from '@/components/ui/input';
import {
  Label,
} from '@/components/ui/label';
import {
  Textarea,
} from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Badge,
} from '@/components/ui/badge';
import {
  Switch,
} from '@/components/ui/switch';
import {
  Slider,
} from '@/components/ui/slider';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';

import { ContentType, ContentGenerationOptions } from './types';
import { useContentGeneration } from './hooks/useContentGeneration';

interface AIContentGeneratorProps {
  onContentGenerated?: () => void;
}

export const AIContentGenerator = React.memo<AIContentGeneratorProps>(({ onContentGenerated }) => {
  const { t } = useTranslation();
  const { generateContent, isGenerating } = useContentGeneration();

  // Content creation states
  const [contentType, setContentType] = useState<ContentType>('blog-post');
  const [contentTitle, setContentTitle] = useState('');
  const [contentPrompt, setContentPrompt] = useState('');
  const [contentTone, setContentTone] = useState<'professional' | 'friendly' | 'casual' | 'luxury'>('luxury');
  const [contentLength, setContentLength] = useState([800]);
  const [targetKeywords, setTargetKeywords] = useState<string[]>([]);
  const [newKeyword, setNewKeyword] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [includeImages, setIncludeImages] = useState(true);
  const [generateSeo, setGenerateSeo] = useState(true);
  const [autoTranslate, setAutoTranslate] = useState(false);

  const handleGenerateContent = async () => {
    if (!contentPrompt.trim()) {
      return;
    }

    const options: ContentGenerationOptions = {
      tone: contentTone,
      length: contentLength[0],
      keywords: targetKeywords,
      category: selectedCategory,
      audience: targetAudience,
      includeImages,
      generateSeo,
    };

    generateContent({
      type: contentType,
      prompt: contentPrompt,
      language: 'en', // Default to English
      title: contentTitle,
      options,
    });
  };

  const handleAddKeyword = () => {
    if (newKeyword.trim() && !targetKeywords.includes(newKeyword.trim())) {
      setTargetKeywords([...targetKeywords, newKeyword.trim()]);
      setNewKeyword('');
    }
  };

  const handleRemoveKeyword = (keyword: string) => {
    setTargetKeywords(targetKeywords.filter(k => k !== keyword));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            {t('admin.ai.contentManager.aiContentGenerator')}
          </CardTitle>
          <CardDescription>{t('admin.ai.contentManager.aiContentGeneratorDesc')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>{t('admin.ai.contentManager.contentType')}</Label>
              <Select value={contentType} onValueChange={(value: ContentType) => setContentType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="blog-post">{t('admin.ai.contentManager.blogPost')}</SelectItem>
                  <SelectItem value="service-description">{t('admin.ai.contentManager.serviceDescription')}</SelectItem>
                  <SelectItem value="email">{t('admin.ai.contentManager.email')}</SelectItem>
                  <SelectItem value="social-media">{t('admin.ai.contentManager.socialMedia')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t('admin.ai.contentManager.category')}</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder={t('admin.ai.contentManager.selectCategory')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beauty">{t('common.beauty')}</SelectItem>
                  <SelectItem value="fitness">{t('common.fitness')}</SelectItem>
                  <SelectItem value="wellness">{t('common.wellness')}</SelectItem>
                  <SelectItem value="lifestyle">{t('common.lifestyle')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="content-prompt">{t('admin.ai.contentManager.contentPrompt')} *</Label>
            <Textarea
              id="content-prompt"
              value={contentPrompt}
              onChange={(e) => setContentPrompt(e.target.value)}
              placeholder={t('admin.ai.contentManager.contentPromptPlaceholder')}
              rows={4}
            />
          </div>

          <div>
            <Label htmlFor="content-title">{t('admin.ai.contentManager.title')}</Label>
            <Input
              id="content-title"
              value={contentTitle}
              onChange={(e) => setContentTitle(e.target.value)}
              placeholder={t('admin.ai.contentManager.titlePlaceholder')}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>{t('admin.ai.contentManager.tone')}</Label>
              <Select value={contentTone} onValueChange={(value: any) => setContentTone(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="professional">{t('admin.ai.contentManager.professional')}</SelectItem>
                  <SelectItem value="friendly">{t('admin.ai.contentManager.friendly')}</SelectItem>
                  <SelectItem value="casual">{t('admin.ai.contentManager.casual')}</SelectItem>
                  <SelectItem value="luxury">{t('admin.ai.contentManager.luxury')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t('admin.ai.contentManager.audience')}</Label>
              <Select value={targetAudience} onValueChange={setTargetAudience}>
                <SelectTrigger>
                  <SelectValue placeholder={t('admin.ai.contentManager.selectAudience')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new-clients">{t('admin.ai.contentManager.newClients')}</SelectItem>
                  <SelectItem value="existing-clients">{t('admin.ai.contentManager.existingClients')}</SelectItem>
                  <SelectItem value="prospects">{t('admin.ai.contentManager.prospects')}</SelectItem>
                  <SelectItem value="all">{t('admin.ai.contentManager.all')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>{t('admin.ai.contentManager.wordCount')}: {contentLength[0]}</Label>
            <Slider
              value={contentLength}
              onValueChange={setContentLength}
              max={3000}
              min={200}
              step={100}
              className="mt-2"
            />
          </div>

          <div>
            <Label>{t('admin.ai.contentManager.targetKeywords')}</Label>
            <div className="flex gap-2 mt-2">
              <Input
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
                placeholder={t('admin.ai.contentManager.addKeyword')}
                onKeyPress={(e) => e.key === 'Enter' && handleAddKeyword()}
              />
              <Button onClick={handleAddKeyword} size="sm">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {targetKeywords.map((keyword) => (
                <Badge key={keyword} variant="secondary" className="cursor-pointer" onClick={() => handleRemoveKeyword(keyword)}>
                  {keyword} ×
                </Badge>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="include-images">{t('admin.ai.contentManager.includeImages')}</Label>
              <Switch
                id="include-images"
                checked={includeImages}
                onCheckedChange={setIncludeImages}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="generate-seo">{t('admin.ai.contentManager.generateSeo')}</Label>
              <Switch
                id="generate-seo"
                checked={generateSeo}
                onCheckedChange={setGenerateSeo}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="auto-translate">{t('admin.ai.contentManager.autoTranslate')}</Label>
              <Switch
                id="auto-translate"
                checked={autoTranslate}
                onCheckedChange={setAutoTranslate}
              />
            </div>
          </div>

          <Button onClick={handleGenerateContent} disabled={isGenerating} className="w-full">
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {t('admin.ai.contentManager.generating')}
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                {t('admin.ai.contentManager.generateContent')}
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('admin.ai.contentManager.aiSuggestions')}</CardTitle>
          <CardDescription>{t('admin.ai.contentManager.aiSuggestionsDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Alert>
              <Lightbulb className="w-4 h-4" />
              <AlertTitle>{t('admin.ai.contentManager.trendingTopics')}</AlertTitle>
              <AlertDescription>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>{t('admin.ai.contentManager.trendingTopic1')}</li>
                  <li>{t('admin.ai.contentManager.trendingTopic2')}</li>
                  <li>{t('admin.ai.contentManager.trendingTopic3')}</li>
                </ul>
              </AlertDescription>
            </Alert>

            <Alert>
              <Target className="w-4 h-4" />
              <AlertTitle>{t('admin.ai.contentManager.seoOpportunities')}</AlertTitle>
              <AlertDescription>
                <p className="mt-2">{t('admin.ai.contentManager.seoOpportunityText')}</p>
              </AlertDescription>
            </Alert>

            <Alert>
              <TrendingUp className="w-4 h-4" />
              <AlertTitle>{t('admin.ai.contentManager.performanceTips')}</AlertTitle>
              <AlertDescription>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>{t('admin.ai.contentManager.performanceTip1')}</li>
                  <li>{t('admin.ai.contentManager.performanceTip2')}</li>
                  <li>{t('admin.ai.contentManager.performanceTip3')}</li>
                </ul>
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>
    </div>
  );
});

AIContentGenerator.displayName = 'AIContentGenerator';