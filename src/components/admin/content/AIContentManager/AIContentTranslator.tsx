import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Loader2,
  Globe,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  Copy,
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
  Progress,
} from '@/components/ui/progress';
import {
  ScrollArea,
} from '@/components/ui/scroll-area';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';

import { ContentItem, ContentTranslation, SupportedLanguage } from './types';
import { useContentTranslation } from './hooks/useContentTranslation';

interface AIContentTranslatorProps {
  content: ContentItem;
  onContentUpdate?: (content: ContentItem) => void;
}

const supportedLanguages: SupportedLanguage[] = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'pl', name: 'Polski', flag: '🇵🇱' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  { code: 'uk', name: 'Українська', flag: '🇺🇦' },
];

export const AIContentTranslator = React.memo<AIContentTranslatorProps>(({
  content,
  onContentUpdate
}) => {
  const { t } = useTranslation();
  const { translateContent, isTranslating, autoTranslate, isAutoTranslating } = useContentTranslation();
  const [selectedTargetLang, setSelectedTargetLang] = useState<string>('pl');

  const sourceLanguage = content.language;
  const availableTranslations = Object.keys(content.translations || {});
  const pendingTranslations = availableTranslations.filter(
    lang => content.translations?.[lang]?.status === 'draft'
  );
  const completedTranslations = availableTranslations.filter(
    lang => content.translations?.[lang]?.status === 'approved'
  );

  const handleTranslate = (targetLang: string) => {
    translateContent({
      content,
      targetLang,
      sourceLang: sourceLanguage,
    });
  };

  const handleAutoTranslate = () => {
    const targetLanguages = supportedLanguages
      .map(lang => lang.code)
      .filter(code => code !== sourceLanguage && !availableTranslations.includes(code));

    autoTranslate({
      content,
      targetLanguages,
      sourceLang: sourceLanguage,
    });
  };

  const getStatusIcon = (status: ContentTranslation['status']) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'draft':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      default:
        return <XCircle className="w-4 h-4 text-red-500" />;
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const translationProgress = (completedTranslations.length / (supportedLanguages.length - 1)) * 100;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="w-5 h-5" />
          {t('admin.ai.contentManager.contentTranslator')}
        </CardTitle>
        <CardDescription>
          Translate content to multiple languages with AI assistance
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Progress Overview */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Translation Progress</span>
              <span className="text-sm text-muted-foreground">
                {completedTranslations.length}/{supportedLanguages.length - 1} languages
              </span>
            </div>
            <Progress value={translationProgress} className="h-2" />
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2">
            <Select value={selectedTargetLang} onValueChange={setSelectedTargetLang}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select target language" />
              </SelectTrigger>
              <SelectContent>
                {supportedLanguages
                  .filter(lang => lang.code !== sourceLanguage)
                  .map((lang) => (
                    <SelectItem key={lang.code} value={lang.code}>
                      <span className="flex items-center gap-2">
                        <span>{lang.flag}</span>
                        <span>{lang.name}</span>
                      </span>
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <Button
              onClick={() => handleTranslate(selectedTargetLang)}
              disabled={isTranslating || availableTranslations.includes(selectedTargetLang)}
            >
              {isTranslating ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Globe className="w-4 h-4 mr-2" />
              )}
              Translate
            </Button>
            <Button
              variant="outline"
              onClick={handleAutoTranslate}
              disabled={isAutoTranslating}
            >
              {isAutoTranslating ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              Auto-translate All
            </Button>
          </div>

          {/* Translation Tabs */}
          <Tabs defaultValue="all" className="w-full">
            <TabsList>
              <TabsTrigger value="all">All Languages</TabsTrigger>
              <TabsTrigger value="pending">Pending ({pendingTranslations.length})</TabsTrigger>
              <TabsTrigger value="completed">Completed ({completedTranslations.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-4">
              <ScrollArea className="h-96">
                {supportedLanguages
                  .filter(lang => lang.code !== sourceLanguage)
                  .map((lang) => {
                    const translation = content.translations?.[lang.code];
                    const isAvailable = !!translation;
                    const status = translation?.status;

                    return (
                      <div key={lang.code} className="p-4 border rounded-lg space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{lang.flag} {lang.name}</span>
                            {isAvailable && (
                              <Badge variant={status === 'approved' ? 'default' : 'secondary'}>
                                {status}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {isAvailable && getStatusIcon(status)}
                            {!isAvailable && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleTranslate(lang.code)}
                                disabled={isTranslating}
                              >
                                <Globe className="w-3 h-3 mr-1" />
                                Translate
                              </Button>
                            )}
                          </div>
                        </div>

                        {isAvailable && translation && (
                          <div className="space-y-2">
                            <div>
                              <p className="text-sm font-medium">Title</p>
                              <p className="text-sm text-muted-foreground">{translation.title}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium">Content Preview</p>
                              <p className="text-sm text-muted-foreground line-clamp-3">
                                {translation.content.substring(0, 150)}...
                              </p>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => copyToClipboard(translation.content)}
                            >
                              <Copy className="w-3 h-3 mr-1" />
                              Copy Content
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                  })}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="pending" className="space-y-4">
              <ScrollArea className="h-96">
                {pendingTranslations.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Globe className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No pending translations</p>
                  </div>
                ) : (
                  pendingTranslations.map((langCode) => {
                    const lang = supportedLanguages.find(l => l.code === langCode);
                    const translation = content.translations?.[langCode];

                    return (
                      <div key={langCode} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{lang?.flag} {lang?.name}</span>
                            <Badge variant="secondary">{translation?.status}</Badge>
                          </div>
                          <Button size="sm" variant="outline">
                            Review & Edit
                          </Button>
                        </div>
                        <div className="space-y-2">
                          <p className="text-sm font-medium">Title: {translation?.title}</p>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {translation?.content.substring(0, 150)}...
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="completed" className="space-y-4">
              <ScrollArea className="h-96">
                {completedTranslations.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No completed translations</p>
                  </div>
                ) : (
                  completedTranslations.map((langCode) => {
                    const lang = supportedLanguages.find(l => l.code === langCode);
                    const translation = content.translations?.[langCode];

                    return (
                      <div key={langCode} className="p-4 border rounded-lg">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="font-medium">{lang?.flag} {lang?.name}</span>
                          <Badge variant="default">{translation?.status}</Badge>
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        </div>
                        <div className="space-y-2">
                          <p className="text-sm font-medium">Title: {translation?.title}</p>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {translation?.content.substring(0, 150)}...
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>
      </CardContent>
    </Card>
  );
});

AIContentTranslator.displayName = 'AIContentTranslator';