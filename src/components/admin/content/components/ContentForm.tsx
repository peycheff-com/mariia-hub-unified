import React from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2, Wand2, Globe, Zap } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';

import { ContentItem, PromotionSettings } from './types';

interface ContentFormProps {
  content: ContentItem;
  selectedLanguage: string;
  onContentChange: (content: ContentItem) => void;
  onLanguageChange: (language: string) => void;
  onGenerateContent: () => void;
  isGenerating: boolean;
  supportedLanguages: string[];
}

export function ContentForm({
  content,
  selectedLanguage,
  onContentChange,
  onLanguageChange,
  onGenerateContent,
  isGenerating,
  supportedLanguages,
}: ContentFormProps) {
  const { t } = useTranslation();

  const handleInputChange = (field: keyof ContentItem, value: any) => {
    onContentChange({ ...content, [field]: value });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            {t('admin.ai.contentManager.contentSettings')}
          </CardTitle>
          <CardDescription>
            {t('admin.ai.contentManager.contentSettingsDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="content-type">{t('admin.ai.contentManager.contentType')}</Label>
              <Select
                value={content.type}
                onValueChange={(value) => handleInputChange('type', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('admin.ai.contentManager.selectType')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="blog">{t('admin.ai.contentManager.blogPost')}</SelectItem>
                  <SelectItem value="service">{t('admin.ai.contentManager.serviceDescription')}</SelectItem>
                  <SelectItem value="social">{t('admin.ai.contentManager.socialMedia')}</SelectItem>
                  <SelectItem value="newsletter">{t('admin.ai.contentManager.newsletter')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="language">{t('admin.ai.contentManager.language')}</Label>
              <Select value={selectedLanguage} onValueChange={onLanguageChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {supportedLanguages.map((lang) => (
                    <SelectItem key={lang} value={lang}>
                      {t(`common.languages.${lang}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">{t('admin.ai.contentManager.title')}</Label>
            <Input
              id="title"
              value={content.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder={t('admin.ai.contentManager.titlePlaceholder')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">{t('admin.ai.contentManager.content')}</Label>
            <Textarea
              id="content"
              value={content.content}
              onChange={(e) => handleInputChange('content', e.target.value)}
              placeholder={t('admin.ai.contentManager.contentPlaceholder')}
              rows={8}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="excerpt">{t('admin.ai.contentManager.excerpt')}</Label>
            <Textarea
              id="excerpt"
              value={content.excerpt}
              onChange={(e) => handleInputChange('excerpt', e.target.value)}
              placeholder={t('admin.ai.contentManager.excerptPlaceholder')}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">{t('admin.ai.contentManager.tags')}</Label>
            <Input
              id="tags"
              value={content.tags?.join(', ')}
              onChange={(e) => handleInputChange('tags', e.target.value.split(',').map(tag => tag.trim()))}
              placeholder={t('admin.ai.contentManager.tagsPlaceholder')}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">{t('admin.ai.contentManager.aiGeneration')}</h4>
              <p className="text-sm text-muted-foreground">
                {t('admin.ai.contentManager.aiGenerationDesc')}
              </p>
            </div>
            <Button
              onClick={onGenerateContent}
              disabled={isGenerating}
              className="flex items-center gap-2"
            >
              {isGenerating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Wand2 className="h-4 w-4" />
              )}
              {t('admin.ai.contentManager.generate')}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            {t('admin.ai.contentManager.promotionSettings')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>{t('admin.ai.contentManager.priorityLevel')}</Label>
            <Slider
              value={[content.promotionSettings?.priorityLevel || 5]}
              onValueChange={([value]) =>
                handleInputChange('promotionSettings', {
                  ...content.promotionSettings,
                  priorityLevel: value,
                } as PromotionSettings)
              }
              max={10}
              min={1}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{t('common.low')}</span>
              <span>{content.promotionSettings?.priorityLevel || 5}</span>
              <span>{t('common.high')}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('admin.ai.contentManager.targetAudience')}</Label>
              <Select
                value={content.promotionSettings?.targetAudience}
                onValueChange={(value) =>
                  handleInputChange('promotionSettings', {
                    ...content.promotionSettings,
                    targetAudience: value,
                  } as PromotionSettings)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('admin.ai.contentManager.selectAudience')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('admin.ai.contentManager.allAudiences')}</SelectItem>
                  <SelectItem value="new">{t('admin.ai.contentManager.newClients')}</SelectItem>
                  <SelectItem value="existing">{t('admin.ai.contentManager.existingClients')}</SelectItem>
                  <SelectItem value="vip">{t('admin.ai.contentManager.vipClients')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t('admin.ai.contentManager.promotionChannels')}</Label>
              <div className="flex flex-wrap gap-2">
                {['email', 'social', 'sms', 'push'].map((channel) => (
                  <Badge
                    key={channel}
                    variant={
                      content.promotionSettings?.channels?.includes(channel)
                        ? 'default'
                        : 'outline'
                    }
                    className="cursor-pointer"
                    onClick={() => {
                      const channels = content.promotionSettings?.channels || [];
                      const newChannels = channels.includes(channel)
                        ? channels.filter(c => c !== channel)
                        : [...channels, channel];
                      handleInputChange('promotionSettings', {
                        ...content.promotionSettings,
                        channels: newChannels,
                      } as PromotionSettings);
                    }}
                  >
                    {t(`admin.ai.contentManager.channels.${channel}`)}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}