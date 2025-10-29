import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Search,
  Zap,
  AlertTriangle,
  CheckCircle,
  Clock,
  Target,
  Eye,
  Lightbulb,
  FileText,
  Globe,
  TrendingUp,
  Settings,
  Play,
  Pause,
  RefreshCw
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { translationAutomation ,
  UntranslatedContent,
  TranslationConsistencyIssue
} from '@/lib/translations/TranslationAutomation';

import { TranslationEditor } from './TranslationEditor';

export const AutomationDashboard: React.FC = () => {
  const { t } = useTranslation();
  const [isScanning, setIsScanning] = useState(false);
  const [untranslatedContent, setUntranslatedContent] = useState<UntranslatedContent[]>([]);
  const [consistencyIssues, setConsistencyIssues] = useState<TranslationConsistencyIssue[]>([]);
  const [selectedContent, setSelectedContent] = useState<UntranslatedContent | null>(null);
  const [autoSuggestions, setAutoSuggestions] = useState<{ [key: string]: string[] }>({});
  const [showEditor, setShowEditor] = useState(false);
  const [scanStats, setScanStats] = useState({
    totalScanned: 0,
    untranslatedFound: 0,
    issuesFound: 0,
    suggestionsGenerated: 0,
    lastScan: null as Date | null
  });

  useEffect(() => {
    loadRecentData();
  }, []);

  const loadRecentData = async () => {
    // Load any previously scanned data
    setScanStats({
      totalScanned: 0,
      untranslatedFound: 0,
      issuesFound: 0,
      suggestionsGenerated: 0,
      lastScan: null
    });
  };

  const handleScanContent = async () => {
    setIsScanning(true);
    try {
      // Scan for untranslated content
      const untranslated = await translationAutomation.scanForUntranslatedContent();
      setUntranslatedContent(untranslated);

      // Check for consistency issues
      const issues = await translationAutomation.checkTranslationConsistency();
      setConsistencyIssues(issues);

      // Generate auto-suggestions
      const suggestions = await translationAutomation.autoSuggestTranslations(untranslated);
      setAutoSuggestions(suggestions);

      // Update stats
      setScanStats({
        totalScanned: untranslated.length + issues.length * 10, // Estimate
        untranslatedFound: untranslated.length,
        issuesFound: issues.length,
        suggestionsGenerated: Object.values(suggestions).reduce((acc, arr) => acc + arr.length, 0),
        lastScan: new Date()
      });
    } catch (error) {
      console.error('Error during scan:', error);
    }
    setIsScanning(false);
  };

  const handleGenerateSuggestions = async () => {
    if (untranslatedContent.length === 0) return;

    try {
      const suggestions = await translationAutomation.autoSuggestTranslations(untranslatedContent, true);
      setAutoSuggestions(suggestions);

      setScanStats(prev => ({
        ...prev,
        suggestionsGenerated: Object.values(suggestions).reduce((acc, arr) => acc + arr.length, 0)
      }));
    } catch (error) {
      console.error('Error generating suggestions:', error);
    }
  };

  const handleCreateTranslationTasks = async () => {
    if (untranslatedContent.length === 0) return;

    try {
      // This would create a project and add tasks
      // const projectId = await translationWorkflow.createProject(...);
      // const tasksCreated = await translationAutomation.createTasksFromUntranslatedContent(projectId, untranslatedContent);

      console.log('Would create translation tasks for', untranslatedContent.length, 'items');
    } catch (error) {
      console.error('Error creating translation tasks:', error);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const openEditor = (content: UntranslatedContent) => {
    setSelectedContent(content);
    setShowEditor(true);
  };

  const untranslatedByPriority = untranslatedContent.reduce((acc, item) => {
    acc[item.priority] = (acc[item.priority] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const issuesBySeverity = consistencyIssues.reduce((acc, issue) => {
    acc[issue.severity] = (acc[issue.severity] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Translation Automation</h1>
          <p className="text-muted-foreground">
            Detect untranslated content and maintain translation consistency
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleGenerateSuggestions}
            disabled={untranslatedContent.length === 0}
          >
            <Lightbulb className="h-4 w-4 mr-1" />
            Generate Suggestions
          </Button>
          <Button
            onClick={handleScanContent}
            disabled={isScanning}
          >
            {isScanning ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
            ) : (
              <Search className="h-4 w-4 mr-1" />
            )}
            {isScanning ? 'Scanning...' : 'Scan Content'}
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Scanned
            </CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{scanStats.totalScanned}</div>
            {scanStats.lastScan && (
              <p className="text-xs text-muted-foreground mt-1">
                Last scan: {scanStats.lastScan.toLocaleTimeString()}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Untranslated Content
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{scanStats.untranslatedFound}</div>
            <div className="mt-2 space-y-1">
              {Object.entries(untranslatedByPriority).map(([priority, count]) => (
                <div key={priority} className="flex justify-between text-xs">
                  <span>{priority}</span>
                  <span>{count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Consistency Issues
            </CardTitle>
            <Eye className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{scanStats.issuesFound}</div>
            <div className="mt-2 space-y-1">
              {Object.entries(issuesBySeverity).map(([severity, count]) => (
                <div key={severity} className="flex justify-between text-xs">
                  <span>{severity}</span>
                  <span>{count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Suggestions Generated
            </CardTitle>
            <Lightbulb className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{scanStats.suggestionsGenerated}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Auto-suggested translations
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="untranslated" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="untranslated">
            <AlertTriangle className="h-4 w-4 mr-1" />
            Untranslated Content
            {untranslatedContent.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {untranslatedContent.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="consistency">
            <Eye className="h-4 w-4 mr-1" />
            Consistency Issues
            {consistencyIssues.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {consistencyIssues.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="automation">
            <Zap className="h-4 w-4 mr-1" />
            Automation Rules
          </TabsTrigger>
        </TabsList>

        {/* Untranslated Content */}
        <TabsContent value="untranslated" className="space-y-4">
          {untranslatedContent.length > 0 ? (
            <>
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Found {untranslatedContent.length} items needing translation
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCreateTranslationTasks}
                >
                  <Target className="h-4 w-4 mr-1" />
                  Create Translation Tasks
                </Button>
              </div>

              <ScrollArea className="h-[600px]">
                <div className="space-y-3">
                  {untranslatedContent.map((item) => (
                    <Card key={item.id} className="border-l-4 border-l-orange-400">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge className={getPriorityColor(item.priority)}>
                                {item.priority}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {item.type}
                              </Badge>
                              <Badge variant="secondary" className="text-xs">
                                {item.targetLangs.join(', ')}
                              </Badge>
                            </div>

                            <p className="font-medium mb-1">{item.sourceText}</p>
                            <p className="text-sm text-muted-foreground mb-2">
                              Context: {item.context}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Location: {item.location}
                            </p>

                            {/* TM Matches */}
                            {item.tmMatches && item.tmMatches.length > 0 && (
                              <div className="mt-3 p-2 bg-blue-50 rounded border border-blue-200">
                                <p className="text-xs font-medium text-blue-800 mb-1">
                                  TM Matches:
                                </p>
                                {item.tmMatches.map((match, idx) => (
                                  <div key={idx} className="text-xs text-blue-700">
                                    {match.text} ({Math.round(match.score * 100)}% match)
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Auto Suggestions */}
                            {autoSuggestions[item.id] && autoSuggestions[item.id].length > 0 && (
                              <div className="mt-3 p-2 bg-green-50 rounded border border-green-200">
                                <p className="text-xs font-medium text-green-800 mb-1">
                                  Suggestions:
                                </p>
                                {autoSuggestions[item.id].map((suggestion, idx) => (
                                  <div key={idx} className="text-xs text-green-700">
                                    • {suggestion}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          <div className="flex gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEditor(item)}
                            >
                              <FileText className="h-3 w-3 mr-1" />
                              Translate
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">No untranslated content found</h3>
              <p className="text-sm mb-4">Run a scan to detect content that needs translation</p>
              <Button onClick={handleScanContent} disabled={isScanning}>
                <Search className="h-4 w-4 mr-1" />
                Start Scan
              </Button>
            </div>
          )}
        </TabsContent>

        {/* Consistency Issues */}
        <TabsContent value="consistency" className="space-y-4">
          {consistencyIssues.length > 0 ? (
            <ScrollArea className="h-[600px]">
              <div className="space-y-3">
                {consistencyIssues.map((issue) => (
                  <Card key={issue.id} className="border-l-4 border-l-red-400">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={getSeverityColor(issue.severity)}>
                          {issue.severity}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {issue.type}
                        </Badge>
                      </div>

                      <p className="font-medium mb-2">{issue.description}</p>
                      <p className="text-sm text-muted-foreground mb-2">
                        Source: "{issue.sourceText}"
                      </p>

                      <div className="mb-3">
                        <p className="text-xs font-medium mb-1">Conflicting translations:</p>
                        {issue.conflictingTranslations.map((conflict, idx) => (
                          <div key={idx} className="text-xs text-muted-foreground ml-2">
                            • "{conflict.text}" ({conflict.location})
                          </div>
                        ))}
                      </div>

                      {issue.suggestion && (
                        <div className="p-2 bg-yellow-50 rounded border border-yellow-200">
                          <p className="text-xs font-medium text-yellow-800 mb-1">
                            Suggestion:
                          </p>
                          <p className="text-xs text-yellow-700">{issue.suggestion}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Eye className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">No consistency issues found</h3>
              <p className="text-sm">Your translations are consistent!</p>
            </div>
          )}
        </TabsContent>

        {/* Automation Rules */}
        <TabsContent value="automation" className="space-y-4">
          <div className="text-center py-12 text-muted-foreground">
            <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">Automation Rules</h3>
            <p className="text-sm max-w-md mx-auto mb-4">
              Configure automation rules to automatically categorize, approve, and assign translations
            </p>
            <Button variant="outline">
              <Settings className="h-4 w-4 mr-1" />
              Configure Rules
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      {/* Translation Editor Dialog */}
      {selectedContent && (
        <TranslationEditor
          sourceText={selectedContent.sourceText}
          onTranslationSelect={(translation) => {
            console.log('Translation selected:', translation);
          }}
          sourceLang={selectedContent.sourceLang}
          targetLang={selectedContent.targetLangs[0]}
          context={selectedContent.context}
          category={selectedContent.type}
          onSaveToTM={(translation, metadata) => {
            console.log('Saved to TM:', translation, metadata);
            setShowEditor(false);
            // Refresh content
            handleScanContent();
          }}
        />
      )}
    </div>
  );
};