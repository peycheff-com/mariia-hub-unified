import React, { useState } from 'react';
import { AlertCircle, Loader2, Languages, Copy, CheckCircle, ArrowLeftRight } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAITranslation } from '@/hooks/useAIContent';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface TranslationHistory {
  id: string;
  sourceText: string;
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
  timestamp: Date;
  confidence: number;
}

interface AITranslationToolProps {
  initialText?: string;
  onTranslationComplete?: (translation: any) => void;
}

export function AITranslationTool({ initialText = '', onTranslationComplete }: AITranslationToolProps) {
  const [sourceText, setSourceText] = useState(initialText);
  const [sourceLanguage, setSourceLanguage] = useState<'en' | 'pl' | 'auto'>('auto');
  const [targetLanguage, setTargetLanguage] = useState<'en' | 'pl'>('pl');
  const [context, setContext] = useState('');
  const [translationHistory, setTranslationHistory] = useState<TranslationHistory[]>([]);
  const [copiedText, setCopiedText] = useState<string>('');

  const { translate, isTranslating, error, data } = useAITranslation();

  const handleTranslate = async () => {
    if (!sourceText.trim()) return;

    try {
      const result = await translate(
        sourceText,
        targetLanguage,
        sourceLanguage === 'auto' ? undefined : sourceLanguage
      );

      // Add to history
      const historyItem: TranslationHistory = {
        id: Date.now().toString(),
        sourceText,
        translatedText: result.translatedText,
        sourceLanguage: sourceLanguage === 'auto' ? (result.sourceLanguage || 'detected') : sourceLanguage,
        targetLanguage,
        timestamp: new Date(),
        confidence: result.confidence,
      };

      setTranslationHistory(prev => [historyItem, ...prev.slice(0, 9)]); // Keep last 10
      onTranslationComplete?.(result);
    } catch (error) {
      console.error('Translation failed:', error);
    }
  };

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedText(id);
      setTimeout(() => setCopiedText(''), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const swapLanguages = () => {
    if (sourceLanguage === 'auto') return;

    setSourceLanguage(targetLanguage as 'en' | 'pl');
    setTargetLanguage(sourceLanguage as 'en' | 'pl');
    setSourceText(data?.translatedText || '');
  };

  const clearHistory = () => {
    setTranslationHistory([]);
  };

  const getLanguageName = (code: string) => {
    const languages: Record<string, string> = {
      'en': 'English',
      'pl': 'Polish',
      'auto': 'Auto-detect',
      'detected': 'Detected'
    };
    return languages[code] || code;
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'text-green-600';
    if (confidence >= 0.7) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Languages className="h-5 w-5" />
            AI Translation Tool
          </CardTitle>
          <CardDescription>
            Translate content between English and Polish with AI-powered accuracy
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {/* Language Selection */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Source Language</Label>
                <Select value={sourceLanguage} onValueChange={(value: any) => setSourceLanguage(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">Auto-detect</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="pl">Polish</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end justify-center">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={swapLanguages}
                  disabled={sourceLanguage === 'auto'}
                  title="Swap languages"
                >
                  <ArrowLeftRight className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-2">
                <Label>Target Language</Label>
                <Select value={targetLanguage} onValueChange={(value: any) => setTargetLanguage(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="pl">Polish</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Context Input */}
            <div className="space-y-2">
              <Label htmlFor="context">Context (Optional)</Label>
              <Textarea
                id="context"
                placeholder="Provide context for better translation accuracy..."
                value={context}
                onChange={(e) => setContext(e.target.value)}
                rows={2}
                className="resize-none"
              />
            </div>

            {/* Source Text */}
            <div className="space-y-2">
              <Label htmlFor="sourceText">Source Text</Label>
              <Textarea
                id="sourceText"
                placeholder="Enter text to translate..."
                value={sourceText}
                onChange={(e) => setSourceText(e.target.value)}
                rows={6}
                className="resize-none"
              />
              <div className="flex justify-between items-center text-sm text-muted-foreground">
                <span>{sourceText.length} characters</span>
                <span>{sourceText.split(/\s+/).filter(w => w).length} words</span>
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {error.message || 'Translation failed. Please try again.'}
                </AlertDescription>
              </Alert>
            )}

            {/* Translate Button */}
            <Button
              onClick={handleTranslate}
              disabled={!sourceText.trim() || isTranslating}
              className="w-full"
              size="lg"
            >
              {isTranslating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Translating...
                </>
              ) : (
                <>
                  <Languages className="mr-2 h-4 w-4" />
                  Translate
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Translation Results */}
      {data && (
        <Card>
          <CardHeader>
            <CardTitle>Translation Result</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="translation" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="translation">Translation</TabsTrigger>
                <TabsTrigger value="alternatives">Alternatives</TabsTrigger>
                <TabsTrigger value="details">Details</TabsTrigger>
              </TabsList>

              <TabsContent value="translation" className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Translated Text</Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(data.translatedText, 'translation')}
                    >
                      {copiedText === 'translation' ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <Textarea
                    value={data.translatedText}
                    readOnly
                    rows={6}
                    className="font-mono text-sm"
                  />
                </div>
              </TabsContent>

              <TabsContent value="alternatives" className="space-y-4">
                {data.alternatives && data.alternatives.length > 0 ? (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Alternative Translations</Label>
                    <div className="space-y-2">
                      {data.alternatives.map((alt: string, index: number) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                          <span className="text-sm">{alt}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(alt, `alt-${index}`)}
                          >
                            {copiedText === `alt-${index}` ? (
                              <CheckCircle className="h-4 w-4" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No alternative translations available</p>
                )}
              </TabsContent>

              <TabsContent value="details" className="space-y-4">
                <div className="grid gap-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Confidence Score</Label>
                    <div className="flex items-center gap-2">
                      <Progress value={data.confidence * 100} className="w-20" />
                      <span className={`text-sm font-medium ${getConfidenceColor(data.confidence)}`}>
                        {Math.round(data.confidence * 100)}%
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Source Language</Label>
                    <Badge variant="secondary">
                      {getLanguageName(sourceLanguage === 'auto' ? 'detected' : sourceLanguage)}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Target Language</Label>
                    <Badge variant="secondary">
                      {getLanguageName(targetLanguage)}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <Label className="text-xs text-muted-foreground">Source Characters</Label>
                      <p className="font-medium">{sourceText.length}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Translated Characters</Label>
                      <p className="font-medium">{data.translatedText.length}</p>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Translation History */}
      {translationHistory.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Translation History</CardTitle>
              <Button variant="outline" size="sm" onClick={clearHistory}>
                Clear History
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {translationHistory.map((item) => (
                <div key={item.id} className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>
                      {getLanguageName(item.sourceLanguage)} → {getLanguageName(item.targetLanguage)}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className={getConfidenceColor(item.confidence)}>
                        {Math.round(item.confidence * 100)}% confidence
                      </span>
                      <span>{item.timestamp.toLocaleTimeString()}</span>
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <div className="text-sm">
                      <span className="font-medium">Source: </span>
                      <span className="text-muted-foreground">
                        {item.sourceText.length > 100
                          ? `${item.sourceText.substring(0, 100)}...`
                          : item.sourceText
                        }
                      </span>
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">Translation: </span>
                      <span>{item.translatedText.length > 100
                        ? `${item.translatedText.substring(0, 100)}...`
                        : item.translatedText
                      }</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="ml-2"
                        onClick={() => copyToClipboard(item.translatedText, `history-${item.id}`)}
                      >
                        {copiedText === `history-${item.id}` ? (
                          <CheckCircle className="h-3 w-3" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}