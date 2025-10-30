import React, { useState, useEffect, useCallback } from 'react';
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
  Lightbulb,
  AlertTriangle,
  ThumbsUp,
  ThumbsDown,
  Copy,
  Star,
  MessageSquare,
  History,
  Filter,
  Settings,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { translationMemory } from '@/lib/translations/TranslationMemory';
import {
  TranslationMatch,
  TranslationEntry,
  TranslationEditorProps,
  QualityIssue,
  TranslationQualityMetrics,
  ConcordanceResult
} from '@/types/translation';

interface TMSettings {
  minScore: number;
  maxResults: number;
  includeUnapproved: boolean;
  autoSelect: boolean;
  showQualityScores: boolean;
}

export const TranslationEditor: React.FC<TranslationEditorProps> = ({
  sourceText,
  onTranslationSelect,
  sourceLang = 'en',
  targetLang = 'pl',
  context,
  category,
  onSaveToTM
}) => {
  const { t, i18n } = useTranslation();
  const [matches, setMatches] = useState<TranslationMatch[]>([]);
  const [concordanceResults, setConcordanceResults] = useState<ConcordanceResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [customTranslation, setCustomTranslation] = useState('');
  const [savedToTM, setSavedToTM] = useState(false);
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<TranslationMatch | null>(null);
  const [qualityMetrics, setQualityMetrics] = useState<TranslationQualityMetrics | null>(null);
  const [checkingQuality, setCheckingQuality] = useState(false);
  const [tmSettings, setTmSettings] = useState<TMSettings>({
    minScore: 0.7,
    maxResults: 10,
    includeUnapproved: false,
    autoSelect: false,
    showQualityScores: true
  });
  const [showSettings, setShowSettings] = useState(false);
  const [expandedMatches, setExpandedMatches] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('memory');

  // Search TM when source text or settings change
  useEffect(() => {
    if (sourceText && sourceText.trim()) {
      searchTM();
    } else {
      setMatches([]);
      setConcordanceResults([]);
    }
  }, [sourceText, sourceLang, targetLang, tmSettings]);

  // Auto-select best match if enabled
  useEffect(() => {
    if (tmSettings.autoSelect && matches.length > 0) {
      const bestMatch = matches[0];
      if (bestMatch.score >= 0.95) {
        handleSelectTranslation(bestMatch);
      }
    }
  }, [matches, tmSettings.autoSelect]);

  const searchTM = useCallback(async () => {
    setLoading(true);
    try {
      const results = await translationMemory.search(
        sourceText,
        sourceLang,
        targetLang,
        {
          category,
          minScore: tmSettings.minScore,
          maxResults: tmSettings.maxResults,
          includeUnapproved: tmSettings.includeUnapproved
        }
      );
      setMatches(results);
    } catch (error) {
      console.error('Error searching TM:', error);
    }
    setLoading(false);
  }, [sourceText, sourceLang, targetLang, category, tmSettings]);

  const searchConcordance = useCallback(async (term: string) => {
    if (!term.trim()) return;

    try {
      const results = await translationMemory.concordanceSearch({
        term,
        source_lang: sourceLang,
        target_lang: targetLang,
        max_results: 15,
        include_source: true,
        include_target: true
      });
      setConcordanceResults(results);
    } catch (error) {
      console.error('Error in concordance search:', error);
    }
  }, [sourceLang, targetLang]);

  const checkTranslationQuality = useCallback(async (text: string) => {
    if (!text.trim()) return;

    setCheckingQuality(true);
    try {
      // Simulate quality checking - in real implementation, this would call a quality assessment service
      const metrics: TranslationQualityMetrics = {
        accuracy: Math.random() * 0.3 + 0.7,
        consistency: Math.random() * 0.3 + 0.7,
        completeness: Math.random() * 0.2 + 0.8,
        style: Math.random() * 0.4 + 0.6,
        terminology: Math.random() * 0.3 + 0.7,
        overall: 0,
        issues: generateMockQualityIssues(text)
      };

      metrics.overall = (metrics.accuracy + metrics.consistency + metrics.completeness + metrics.style + metrics.terminology) / 5;
      setQualityMetrics(metrics);
    } catch (error) {
      console.error('Error checking quality:', error);
    }
    setCheckingQuality(false);
  }, []);

  const generateMockQualityIssues = (text: string): QualityIssue[] => {
    const issues: QualityIssue[] = [];

    // Generate some mock issues based on text characteristics
    if (text.length < 10) {
      issues.push({
        type: 'length',
        severity: 'low',
        message: 'Translation seems quite short',
        suggestion: 'Consider if the meaning is fully conveyed'
      });
    }

    if (text.includes('{') && text.includes('}')) {
      // Check for variables
      const sourceVars = (sourceText.match(/\{[^}]+\}/g) || []).length;
      const targetVars = (text.match(/\{[^}]+\}/g) || []).length;

      if (sourceVars !== targetVars) {
        issues.push({
          type: 'variables',
          severity: 'high',
          message: 'Variable count mismatch',
          suggestion: 'Ensure all variables from source are present in translation'
        });
      }
    }

    return issues;
  };

  const handleSelectTranslation = (match: TranslationMatch) => {
    setSelectedMatch(match);
    onTranslationSelect(match.text);
    setCustomTranslation(match.text);
    checkTranslationQuality(match.text);

    // Update usage count
    translationMemory.updateUsage(match.entry.id);
  };

  const handleCustomTranslationChange = (text: string) => {
    setCustomTranslation(text);
    onTranslationSelect(text);

    // Debounced quality check
    const timeoutId = setTimeout(() => {
      checkTranslationQuality(text);
    }, 500);

    return () => clearTimeout(timeoutId);
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
          notes: 'Added via Translation Editor'
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

        if (onSaveToTM) {
          onSaveToTM(customTranslation, {
            context,
            category,
            notes: 'Added via Translation Editor'
          });
        }
      }
    } catch (error) {
      console.error('Error saving translation:', error);
    }
  };

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleRateTranslation = async (entryId: string, rating: number) => {
    try {
      await translationMemory.update(entryId, {
        quality_score: rating
      });
      // Refresh matches
      searchTM();
    } catch (error) {
      console.error('Error rating translation:', error);
    }
  };

  const toggleMatchExpansion = (matchId: string) => {
    const newExpanded = new Set(expandedMatches);
    if (newExpanded.has(matchId)) {
      newExpanded.delete(matchId);
    } else {
      newExpanded.add(matchId);
    }
    setExpandedMatches(newExpanded);
  };

  const getScoreColor = (score: number) => {
    if (score >= 0.95) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 0.85) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (score >= 0.7) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-gray-600 bg-gray-50 border-gray-200';
  };

  const getQualityColor = (score: number) => {
    if (score >= 0.9) return 'text-green-600';
    if (score >= 0.7) return 'text-yellow-600';
    return 'text-red-600';
  };

  const filteredMatches = matches.filter(match => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return match.text.toLowerCase().includes(searchLower) ||
           match.entry.source_text.toLowerCase().includes(searchLower) ||
           (match.entry.category && match.entry.category.toLowerCase().includes(searchLower));
  });

  return (
    <div className="space-y-4">
      {/* Settings Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm">
                <Globe className="h-4 w-4" />
                <span>{sourceLang.toUpperCase()} → {targetLang.toUpperCase()}</span>
              </div>
              {category && (
                <Badge variant="secondary" className="text-xs">
                  {category}
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSettings(!showSettings)}
              >
                <Settings className="h-4 w-4 mr-1" />
                Settings
                {showSettings ? <ChevronUp className="h-3 w-3 ml-1" /> : <ChevronDown className="h-3 w-3 ml-1" />}
              </Button>
            </div>
          </div>

          {showSettings && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
              <div>
                <label className="text-sm font-medium mb-2 block" htmlFor="min-score-tmsettings-minscore">
                  Min Score: {tmSettings.minScore}
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="1"
                  step="0.05"
                  value={tmSettings.minScore}
                  onChange={(e) => setTmSettings(prev => ({ ...prev, minScore: parseFloat(e.target.value) }))}
                  className="w-full"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block" htmlFor="max-results-tmsettings-maxresults">
                  Max Results: {tmSettings.maxResults}
                </label>
                <input
                  type="range"
                  min="5"
                  max="50"
                  step="5"
                  value={tmSettings.maxResults}
                  onChange={(e) => setTmSettings(prev => ({ ...prev, maxResults: parseInt(e.target.value) }))}
                  className="w-full"
                />
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={tmSettings.autoSelect}
                    onChange={(e) => setTmSettings(prev => ({ ...prev, autoSelect: e.target.checked }))}
                  />
                  Auto-select best match
                </label>

                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={tmSettings.includeUnapproved}
                    onChange={(e) => setTmSettings(prev => ({ ...prev, includeUnapproved: e.target.checked }))}
                  />
                  Include unapproved
                </label>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Source Text */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Source Text</CardTitle>
          {context && (
            <p className="text-sm text-muted-foreground">Context: {context}</p>
          )}
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-muted rounded-md">
            <p className="text-sm leading-relaxed">{sourceText}</p>
          </div>
        </CardContent>
      </Card>

      {/* Translation Editor */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Translation Editor</CardTitle>
            {qualityMetrics && (
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Quality:</span>
                <Badge className={getQualityColor(qualityMetrics.overall)}>
                  {Math.round(qualityMetrics.overall * 100)}%
                </Badge>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="memory" className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                TM Matches
                {matches.length > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {matches.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="custom" className="flex items-center gap-2">
                <Lightbulb className="h-4 w-4" />
                Custom
              </TabsTrigger>
              <TabsTrigger value="concordance" className="flex items-center gap-2">
                <Search className="h-4 w-4" />
                Concordance
              </TabsTrigger>
              <TabsTrigger value="quality" className="flex items-center gap-2">
                <ThumbsUp className="h-4 w-4" />
                Quality
              </TabsTrigger>
            </TabsList>

            {/* TM Matches */}
            <TabsContent value="memory" className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex-1 max-w-sm">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search matches..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={searchTM}
                  disabled={loading}
                >
                  <Search className="h-4 w-4 mr-1" />
                  Refresh
                </Button>
              </div>

              <ScrollArea className="h-96">
                {loading ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                  </div>
                ) : filteredMatches.length > 0 ? (
                  <div className="space-y-3">
                    {filteredMatches.map((match, index) => (
                      <div
                        key={match.entry.id}
                        className={`border rounded-lg transition-all ${
                          selectedMatch?.entry.id === match.entry.id
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:bg-muted/50'
                        }`}
                      >
                        <div className="p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                              <p className="text-sm font-medium mb-2">{match.text}</p>

                              <div className="flex items-center gap-2 mb-2">
                                <Badge
                                  variant="outline"
                                  className={`text-xs ${getScoreColor(match.score)}`}
                                >
                                  {Math.round(match.score * 100)}% match
                                </Badge>
                                {match.entry.approved && (
                                  <Badge variant="default" className="text-xs bg-green-100 text-green-800">
                                    <Check className="h-3 w-3 mr-1" />
                                    Approved
                                  </Badge>
                                )}
                                <span className="text-xs text-muted-foreground">
                                  Used {match.entry.usage_count}x
                                </span>
                                {match.entry.quality_score && (
                                  <Badge variant="secondary" className="text-xs">
                                    <Star className="h-3 w-3 mr-1" />
                                    {match.entry.quality_score.toFixed(1)}
                                  </Badge>
                                )}
                              </div>

                              {match.entry.category && (
                                <p className="text-xs text-muted-foreground mb-2">
                                  Category: {match.entry.category}
                                </p>
                              )}
                            </div>

                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleCopyToClipboard(match.text)}
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleMatchExpansion(match.entry.id)}
                              >
                                <ChevronDown className={`h-4 w-4 transform ${expandedMatches.has(match.entry.id) ? 'rotate-180' : ''}`} />
                              </Button>
                              <Button
                                variant={selectedMatch?.entry.id === match.entry.id ? "default" : "outline"}
                                size="sm"
                                onClick={() => handleSelectTranslation(match)}
                              >
                                {selectedMatch?.entry.id === match.entry.id ? (
                                  <Check className="h-4 w-4 mr-1" />
                                ) : null}
                                Use
                              </Button>
                            </div>
                          </div>

                          {expandedMatches.has(match.entry.id) && (
                            <div className="mt-3 pt-3 border-t">
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-medium">Source:</span>
                                  <p className="text-xs text-muted-foreground">{match.entry.source_text}</p>
                                </div>

                                {match.entry.context && (
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-medium">Context:</span>
                                    <p className="text-xs text-muted-foreground">{match.entry.context}</p>
                                  </div>
                                )}

                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-medium">Rate:</span>
                                  <div className="flex gap-1">
                                    {[1, 2, 3, 4, 5].map(star => (
                                      <Button
                                        key={star}
                                        variant="ghost"
                                        size="sm"
                                        className="p-1 h-6 w-6"
                                        onClick={() => handleRateTranslation(match.entry.id, star)}
                                      >
                                        <Star
                                          className={`h-3 w-3 ${star <= (match.entry.quality_score || 0) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                                        />
                                      </Button>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-sm">No translation matches found</p>
                    <p className="text-xs mt-2">Try adjusting the minimum score or create a custom translation</p>
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            {/* Custom Translation */}
            <TabsContent value="custom" className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block" htmlFor="your-translation">
                  Your Translation
                </label>
                <Textarea
                  value={customTranslation}
                  onChange={(e) => handleCustomTranslationChange(e.target.value)}
                  placeholder="Type your translation here..."
                  className="min-h-32"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => onTranslationSelect(customTranslation)}
                  disabled={!customTranslation.trim()}
                >
                  <Check className="h-4 w-4 mr-1" />
                  Use This Translation
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowSaveForm(!showSaveForm)}
                  disabled={!customTranslation.trim() || savedToTM}
                >
                  <Save className="h-4 w-4 mr-1" />
                  {savedToTM ? 'Saved to TM' : 'Save to TM'}
                </Button>
              </div>

              {showSaveForm && (
                <div className="p-4 border rounded-lg space-y-4">
                  <Input
                    placeholder="Category (optional)"
                    defaultValue={category}
                  />
                  <Textarea
                    placeholder="Notes (optional)"
                    className="min-h-20"
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleSaveCustomTranslation}>
                      <Save className="h-4 w-4 mr-1" />
                      Save to Translation Memory
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowSaveForm(false)}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {checkingQuality && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
                  Checking translation quality...
                </div>
              )}
            </TabsContent>

            {/* Concordance Search */}
            <TabsContent value="concordance" className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block" htmlFor="search-for-term-context">
                  Search for term context
                </label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter term to search..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        searchConcordance(searchTerm);
                      }
                    }}
                  />
                  <Button
                    onClick={() => searchConcordance(searchTerm)}
                    disabled={!searchTerm.trim()}
                  >
                    <Search className="h-4 w-4 mr-1" />
                    Search
                  </Button>
                </div>
              </div>

              <ScrollArea className="h-64">
                {concordanceResults.length > 0 ? (
                  <div className="space-y-2">
                    {concordanceResults.map((result, index) => (
                      <div key={index} className="p-3 border rounded-lg">
                        <p className="text-sm mb-2">{result.text}</p>
                        {result.context && (
                          <p className="text-xs text-muted-foreground">
                            Context: {result.context}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className="text-xs">
                            {Math.round(result.score * 100)}% match
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopyToClipboard(result.text)}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Enter a term to search for context examples</p>
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            {/* Quality Assessment */}
            <TabsContent value="quality" className="space-y-4">
              {qualityMetrics ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {[
                      { label: 'Accuracy', value: qualityMetrics.accuracy },
                      { label: 'Consistency', value: qualityMetrics.consistency },
                      { label: 'Completeness', value: qualityMetrics.completeness },
                      { label: 'Style', value: qualityMetrics.style },
                      { label: 'Terminology', value: qualityMetrics.terminology }
                    ].map((metric) => (
                      <div key={metric.label} className="text-center">
                        <div className="text-sm font-medium mb-2">{metric.label}</div>
                        <div className="text-2xl font-bold mb-2">
                          {Math.round(metric.value * 100)}%
                        </div>
                        <Progress value={metric.value * 100} className="h-2" />
                      </div>
                    ))}
                  </div>

                  {qualityMetrics.issues.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-3">Quality Issues</h4>
                      <div className="space-y-2">
                        {qualityMetrics.issues.map((issue, index) => (
                          <div
                            key={index}
                            className={`p-3 border rounded-lg ${
                              issue.severity === 'critical' ? 'border-red-200 bg-red-50' :
                              issue.severity === 'high' ? 'border-orange-200 bg-orange-50' :
                              issue.severity === 'medium' ? 'border-yellow-200 bg-yellow-50' :
                              'border-blue-200 bg-blue-50'
                            }`}
                          >
                            <div className="flex items-start gap-2">
                              <AlertTriangle className={`h-4 w-4 mt-0.5 ${
                                issue.severity === 'critical' ? 'text-red-600' :
                                issue.severity === 'high' ? 'text-orange-600' :
                                issue.severity === 'medium' ? 'text-yellow-600' :
                                'text-blue-600'
                              }`} />
                              <div className="flex-1">
                                <p className="text-sm font-medium">{issue.message}</p>
                                {issue.suggestion && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Suggestion: {issue.suggestion}
                                  </p>
                                )}
                              </div>
                              <Badge variant="outline" className="text-xs">
                                {issue.type}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <ThumbsUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-sm">Start translating to see quality assessment</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};