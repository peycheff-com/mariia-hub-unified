import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Globe,
  Languages,
  Edit,
  Copy,
  Check,
  ChevronDown,
  Eye,
  EyeOff
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTranslationMemory } from '@/lib/translations/TranslationMemory';
import { getPluralForm, getPluralCategory } from '@/lib/translations/PluralizationRules';

interface LocalizedContent {
  language: string;
  content: string;
  isOriginal?: boolean;
  quality?: number;
  lastModified?: Date;
  author?: string;
  approved?: boolean;
}

interface MixedLanguageContentProps {
  contentKey: string;
  fallbackContent?: string;
  category?: string;
  defaultLanguage?: string;
  showLanguageToggle?: boolean;
  allowEditing?: boolean;
  onContentChange?: (language: string, content: string) => void;
  translationMode?: 'manual' | 'ai' | 'hybrid';
}

export const MixedLanguageContent: React.FC<MixedLanguageContentProps> = ({
  contentKey,
  fallbackContent = '',
  category = 'general',
  defaultLanguage,
  showLanguageToggle = true,
  allowEditing = false,
  onContentChange,
  translationMode = 'hybrid'
}) => {
  const { i18n, t } = useTranslation();
  const { findSimilar, addEntry, stats } = useTranslationMemory();

  const [availableLanguages, setAvailableLanguages] = useState<LocalizedContent[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState(defaultLanguage || i18n.language);
  const [isEditing, setIsEditing] = useState(false);
  const [editingContent, setEditingContent] = useState('');
  const [showOriginal, setShowOriginal] = useState(false);
  const [similarTranslations, setSimilarTranslations] = useState<any[]>([]);
  const [isTranslating, setIsTranslating] = useState(false);

  // Load available languages and translations
  useEffect(() => {
    loadTranslations();
  }, [contentKey, category]);

  const loadTranslations = async () => {
    // This would load from your CMS/database
    const mockTranslations: LocalizedContent[] = [
      {
        language: i18n.language,
        content: t(contentKey, fallbackContent),
        isOriginal: i18n.language === 'en',
        quality: 1.0,
        lastModified: new Date(),
        approved: true
      },
      // Mock additional languages - in reality, these would come from your backend
      {
        language: 'en',
        content: 'Original English content would be here',
        isOriginal: true,
        quality: 1.0,
        lastModified: new Date(),
        approved: true
      },
      {
        language: 'pl',
        content: 'Polish translation would be here',
        quality: 0.95,
        lastModified: new Date(),
        approved: true
      },
      {
        language: 'ua',
        content: 'Ukrainian translation would be here',
        quality: 0.90,
        lastModified: new Date(),
        approved: false
      }
    ];

    setAvailableLanguages(mockTranslations);

    // Find similar translations from memory
    const similar = findSimilar(
      mockTranslations[0]?.content || '',
      5
    );
    setSimilarTranslations(similar);
  };

  const handleLanguageSwitch = (language: string) => {
    setSelectedLanguage(language);
    setShowOriginal(false);
    setIsEditing(false);

    // Store preference
    localStorage.setItem('content-language', language);
  };

  const handleEdit = () => {
    const currentContent = availableLanguages.find(l => l.language === selectedLanguage);
    setEditingContent(currentContent?.content || '');
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!onContentChange) return;

    onContentChange(selectedLanguage, editingContent);
    setIsEditing(false);

    // Add to translation memory
    await addEntry(
      editingContent,
      selectedLanguage,
      'en', // Assume source is English
      selectedLanguage,
      {
        category: category.toLowerCase(),
        approved: false,
        quality: 0.9
      }
    );

    // Update local state
    setAvailableLanguages(prev =>
      prev.map(l =>
        l.language === selectedLanguage
          ? { ...l, content: editingContent, lastModified: new Date() }
          : l
      )
    );
  };

  const handleTranslate = async (targetLanguage: string) => {
    setIsTranslating(true);
    try {
      // Call your translation service
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: availableLanguages[0]?.content || '',
          sourceLang: 'en',
          targetLang: targetLanguage,
          context: category
        })
      });

      if (response.ok) {
        const { translatedText, confidence } = await response.json();

        // Update the language content
        setAvailableLanguages(prev => {
          const existing = prev.find(l => l.language === targetLanguage);
          if (existing) {
            return prev.map(l =>
              l.language === targetLanguage
                ? { ...l, content: translatedText, quality: confidence, lastModified: new Date() }
                : l
            );
          } else {
            return [...prev, {
              language: targetLanguage,
              content: translatedText,
              quality: confidence,
              lastModified: new Date(),
              approved: false
            }];
          }
        });

        // Add to translation memory
        await addEntry(
          availableLanguages[0]?.content || '',
          translatedText,
          'en',
          targetLanguage,
          {
            category: category.toLowerCase(),
            quality: confidence,
            approved: confidence > 0.9
          }
        );
      }
    } catch (error) {
      console.error('Translation failed:', error);
    } finally {
      setIsTranslating(false);
    }
  };

  const handleCopy = async (content: string) => {
    await navigator.clipboard.writeText(content);
    // Show success feedback
  };

  const getCurrentContent = () => {
    const content = availableLanguages.find(l => l.language === selectedLanguage);
    return showOriginal && content?.isOriginal ? content : content || availableLanguages[0];
  };

  const currentContent = getCurrentContent();
  const languageName = new Intl.DisplayNames([selectedLanguage], { type: 'language' }).of(selectedLanguage);

  const getQualityColor = (quality?: number) => {
    if (!quality) return 'secondary';
    if (quality >= 0.95) return 'default';
    if (quality >= 0.8) return 'secondary';
    return 'destructive';
  };

  const getQualityLabel = (quality?: number) => {
    if (!quality) return 'Unknown';
    if (quality >= 0.95) return 'Excellent';
    if (quality >= 0.85) return 'Good';
    if (quality >= 0.7) return 'Fair';
    return 'Poor';
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Languages className="w-5 h-5" />
            {contentKey}
          </CardTitle>

          {showLanguageToggle && (
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="gap-1">
                <Globe className="w-3 h-3" />
                {languageName}
              </Badge>

              {currentContent?.approved && (
                <Check className="w-4 h-4 text-green-600" />
              )}
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Language Toggle */}
        {showLanguageToggle && (
          <Tabs value={selectedLanguage} onValueChange={handleLanguageSwitch}>
            <TabsList className="grid w-full grid-cols-4">
              {availableLanguages.map((lang) => (
                <TabsTrigger
                  key={lang.language}
                  value={lang.language}
                  className="relative"
                  disabled={!lang.content}
                >
                  <div className="flex items-center gap-2">
                    <span>{lang.language.toUpperCase()}</span>
                    {!lang.approved && (
                      <EyeOff className="w-3 h-3" />
                    )}
                    {lang.quality && (
                      <div
                        className={`w-2 h-2 rounded-full ${
                          lang.quality >= 0.95 ? 'bg-green-500' :
                          lang.quality >= 0.8 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                      />
                    )}
                  </div>
                </TabsTrigger>
              ))}
            </TabsList>

            {availableLanguages.map((lang) => (
              <TabsContent key={lang.language} value={lang.language} className="space-y-3">
                {/* Content Display */}
                <div className="relative">
                  {isEditing && selectedLanguage === lang.language ? (
                    <textarea
                      value={editingContent}
                      onChange={(e) => setEditingContent(e.target.value)}
                      className="w-full min-h-[100px] p-3 border rounded-md"
                      autoFocus
                    />
                  ) : (
                    <div className="p-3 border rounded-md bg-muted/50">
                      <div className="whitespace-pre-wrap">{lang.content}</div>

                      {showOriginal && lang.isOriginal && (
                        <Badge variant="outline" className="mt-2">
                          Original Content
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* Quality Indicator */}
                  {lang.quality && (
                    <div className="absolute top-2 right-2">
                      <Badge
                        variant={getQualityColor(lang.quality)}
                        className="text-xs"
                      >
                        {getQualityLabel(lang.quality)}
                      </Badge>
                    </div>
                  )}
                </div>

                {/* Metadata */}
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-4">
                    <span>Last modified: {lang.lastModified?.toLocaleDateString()}</span>
                    {lang.author && <span>By: {lang.author}</span>}
                  </div>

                  <div className="flex items-center gap-2">
                    {allowEditing && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => selectedLanguage === lang.language ? handleEdit() : setSelectedLanguage(lang.language)}
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                    )}

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopy(lang.content)}
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        )}

        {/* Translation Controls */}
        {allowEditing && isEditing && (
          <div className="flex items-center gap-2">
            <Button onClick={handleSave} size="sm">
              <Check className="w-4 h-4 mr-2" />
              Save
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsEditing(false)}
              size="sm"
            >
              Cancel
            </Button>
          </div>
        )}

        {/* Similar Translations from Memory */}
        {similarTranslations.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Similar Translations</h4>
            <div className="space-y-1">
              {similarTranslations.map((match, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 border rounded cursor-pointer hover:bg-muted"
                  onClick={() => setEditingContent(match.text)}
                >
                  <span className="text-sm">{match.text}</span>
                  <Badge variant="secondary">
                    {Math.round((match.quality || 0) * 100)}% match
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Translation */}
        {translationMode !== 'manual' && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleTranslate(selectedLanguage)}
              disabled={isTranslating}
            >
              {isTranslating ? (
                <div className="w-4 h-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              ) : (
                <Languages className="w-4 h-4 mr-2" />
              )}
              {t('translate.translate', 'Translate')}
            </Button>
          </div>
        )}

        {/* Content Statistics */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span>Characters: {currentContent?.content.length || 0}</span>
          <span>Words: {currentContent?.content.split(/\s+/).filter(w => w).length || 0}</span>
          <span>Languages: {availableLanguages.length}</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default MixedLanguageContent;