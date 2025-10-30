import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Search,
  Save,
  Check,
  X,
  Clock,
  Target,
  BookOpen,
  Globe,
  Lightbulb
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { translationMemory , TranslationMatch } from '@/lib/translations/TranslationMemory';

interface TranslationAssistantProps {
  sourceText: string;
  onTranslationSelect: (translation: string) => void;
  sourceLang?: string;
  targetLang?: string;
  context?: string;
  category?: string;
}

export const TranslationAssistant: React.FC<TranslationAssistantProps> = ({
  sourceText,
  onTranslationSelect,
  sourceLang = 'en',
  targetLang = 'pl',
  context,
  category
}) => {
  const { t, i18n } = useTranslation();
  const [matches, setMatches] = useState<TranslationMatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [customTranslation, setCustomTranslation] = useState('');
  const [savedToTM, setSavedToTM] = useState(false);
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<TranslationMatch | null>(null);

  useEffect(() => {
    if (sourceText && sourceText.trim()) {
      searchTM();
    } else {
      setMatches([]);
    }
  }, [sourceText, sourceLang, targetLang]);

  const searchTM = async () => {
    setLoading(true);
    try {
      const results = await translationMemory.search(
        sourceText,
        sourceLang,
        targetLang,
        {
          category,
          minScore: 0.5,
          maxResults: 10
        }
      );
      setMatches(results);
    } catch (error) {
      console.error('Error searching TM:', error);
    }
    setLoading(false);
  };

  const handleSelectTranslation = (match: TranslationMatch) => {
    setSelectedMatch(match);
    onTranslationSelect(match.text);
    setCustomTranslation(match.text);

    // Update usage count
    translationMemory.updateUsage(match.entry.id);
  };

  const handleSaveCustomTranslation = async () => {
    if (!customTranslation.trim()) return;

    try {
      const entry = await translationMemory.add(
        sourceText,
        customTranslation,
        sourceLang,
        targetLang,
        {
          context,
          category,
          approved: false,
          created_by: 'translator'
        }
      );

      if (entry) {
        setSavedToTM(true);
        setShowSaveForm(false);

        // Add to matches list
        const newMatch: TranslationMatch = {
          text: customTranslation,
          score: 1.0,
          entry
        };
        setMatches([newMatch, ...matches]);
      }
    } catch (error) {
      console.error('Error saving translation:', error);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 0.9) return 'text-green-600 bg-green-50';
    if (score >= 0.7) return 'text-yellow-600 bg-yellow-50';
    return 'text-gray-600 bg-gray-50';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5" />
          {t('translation.title', 'Translation Assistant')}
        </CardTitle>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{sourceLang.toUpperCase()}</span>
          <Target className="h-4 w-4" />
          <span>{targetLang.toUpperCase()}</span>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Source Text */}
        <div>
          <label className="text-sm font-medium mb-2 block" htmlFor="t-translation-sourcetext-source-text">
            {t('translation.sourceText', 'Source Text')}
          </label>
          <div className="p-3 bg-muted rounded-md">
            <p className="text-sm">{sourceText}</p>
            {context && (
              <p className="text-xs text-muted-foreground mt-2">
                {t('translation.context', 'Context')}: {context}
              </p>
            )}
          </div>
        </div>

        <Tabs defaultValue="memory" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="memory" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              {t('translation.memory', 'Memory')}
            </TabsTrigger>
            <TabsTrigger value="custom" className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4" />
              {t('translation.custom', 'Custom')}
            </TabsTrigger>
            <TabsTrigger value="ai" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              {t('translation.ai', 'AI Suggest')}
            </TabsTrigger>
          </TabsList>

          {/* Translation Memory Matches */}
          <TabsContent value="memory" className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">
                {t('translation.foundMatches', 'Found Matches')}
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={searchTM}
                disabled={loading}
              >
                <Search className="h-4 w-4 mr-1" />
                {t('translation.refresh', 'Refresh')}
              </Button>
            </div>

            <ScrollArea className="h-64">
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                </div>
              ) : matches.length > 0 ? (
                <div className="space-y-2">
                  {matches.map((match, index) => (
                    <div
                      key={index}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedMatch?.entry.id === match.entry.id
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:bg-muted/50'
                      }`}
                      onClick={() => handleSelectTranslation(match)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className="text-sm">{match.text}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge
                              variant="secondary"
                              className={`text-xs ${getScoreColor(match.score)}`}
                            >
                              {Math.round(match.score * 100)}% match
                            </Badge>
                            {match.entry.approved && (
                              <Badge variant="outline" className="text-xs">
                                <Check className="h-3 w-3 mr-1" />
                                {t('translation.approved', 'Approved')}
                              </Badge>
                            )}
                            <span className="text-xs text-muted-foreground">
                              {t('translation.used', 'Used')} {match.entry.usage_count}x
                            </span>
                          </div>
                          {match.entry.category && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {t('translation.category', 'Category')}: {match.entry.category}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <BookOpen className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">
                    {t('translation.noMatches', 'No translations found in memory')}
                  </p>
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          {/* Custom Translation */}
          <TabsContent value="custom" className="space-y-3">
            <div>
              <label className="text-sm font-medium mb-2 block" htmlFor="t-translation-yourtranslation-your-translation">
                {t('translation.yourTranslation', 'Your Translation')}
              </label>
              <Textarea
                value={customTranslation}
                onChange={(e) => setCustomTranslation(e.target.value)}
                placeholder={t('translation.typeTranslation', 'Type your translation here...')}
                className="min-h-32"
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => onTranslationSelect(customTranslation)}
                disabled={!customTranslation.trim()}
              >
                <Check className="h-4 w-4 mr-1" />
                {t('translation.use', 'Use This')}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowSaveForm(!showSaveForm)}
                disabled={!customTranslation.trim() || savedToTM}
              >
                <Save className="h-4 w-4 mr-1" />
                {savedToTM
                  ? t('translation.saved', 'Saved')
                  : t('translation.saveToTM', 'Save to TM')}
              </Button>
            </div>

            {showSaveForm && (
              <div className="p-3 border rounded-lg space-y-2">
                <Input
                  placeholder={t('translation.category', 'Category (optional)')}
                  defaultValue={category}
                  onChange={(e) => setCategory(e.target.value)}
                />
                <Textarea
                  placeholder={t('translation.notes', 'Notes (optional)')}
                  className="min-h-20"
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleSaveCustomTranslation}>
                    <Save className="h-4 w-4 mr-1" />
                    {t('translation.save', 'Save')}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowSaveForm(false)}
                  >
                    <X className="h-4 w-4 mr-1" />
                    {t('translation.cancel', 'Cancel')}
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>

          {/* AI Translation */}
          <TabsContent value="ai" className="space-y-3">
            <div className="text-center py-8 text-muted-foreground">
              <Target className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm mb-4">
                {t('translation.aiComing', 'AI translation suggestions coming soon')}
              </p>
              <Button variant="outline" disabled>
                <Clock className="h-4 w-4 mr-1" />
                {t('translation.enableAI', 'Enable AI Translation')}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};