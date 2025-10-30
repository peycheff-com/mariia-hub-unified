import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Download,
  Upload,
  Search,
  Filter,
  Globe,
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  Users,
  BarChart3,
  Settings,
  Plus,
  Edit,
  Trash2,
  Eye,
  ThumbsUp,
  ThumbsDown,
  Star,
  MessageSquare,
  History,
  TrendingUp,
  Target,
  BookOpen,
  Zap,
  FileUp
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { translationMemory } from '@/lib/translations/TranslationMemory';
import { translationWorkflow } from '@/lib/translations/TranslationWorkflow';
import {
  TranslationEntry,
  TranslationStats,
  TMExportOptions,
  TMImportResult,
  TranslationMemoryStats,
  TMXImportOptions
} from '@/types/translation';

import { TranslationEditor } from './TranslationEditor';
import { AutomationDashboard } from './AutomationDashboard';
import { GlossaryManager } from './GlossaryManager';

interface TMManagerProps {
  className?: string;
}

export const TMManager: React.FC<TMManagerProps> = ({ className }) => {
  const { t } = useTranslation();
  const [stats, setStats] = useState<TranslationMemoryStats | null>(null);
  const [detailedStats, setDetailedStats] = useState<TranslationMemoryStats | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'approved' | 'pending'>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [translations, setTranslations] = useState<TranslationEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [selectedTranslation, setSelectedTranslation] = useState<TranslationEntry | null>(null);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importFormat, setImportFormat] = useState<'json' | 'csv' | 'xliff' | 'tmx'>('json');
  const [importResult, setImportResult] = useState<TMImportResult | null>(null);
  const [importing, setImporting] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [editorSource, setEditorSource] = useState('');

  useEffect(() => {
    loadStats();
    loadTranslations();
  }, []);

  const loadStats = async () => {
    try {
      const data = await translationMemory.getDetailedStats();
      setDetailedStats(data);

      // Simplified stats for display
      const basicStats: TranslationStats = {
        total: data.totalEntries,
        approved: data.approvedEntries,
        pending: data.pendingEntries,
        byLanguage: data.languagePairs,
        byCategory: data.categories
      };
      setStats(basicStats);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadTranslations = async () => {
    setLoading(true);
    try {
      const data = await translationMemory.export();
      setTranslations(data);
    } catch (error) {
      console.error('Error loading translations:', error);
    }
    setLoading(false);
  };

  const handleExport = async (format: 'json' | 'csv' | 'xliff' | 'tmx') => {
    try {
      const options: TMExportOptions = {
        format,
        includeUnapproved: filterStatus !== 'approved',
        category: filterCategory !== 'all' ? filterCategory : undefined
      };

      const result = await translationMemory.export(options);

      // Create download link
      const blob = new Blob([result.data], {
        type: format === 'json' ? 'application/json' : 'text/plain'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = result.filename;
      a.click();
      URL.revokeObjectURL(url);

      setShowExportDialog(false);
    } catch (error) {
      console.error('Error exporting translations:', error);
    }
  };

  const handleImport = async () => {
    if (!importFile) return;

    setImporting(true);
    try {
      const content = await importFile.text();

      const options: TMXImportOptions = {
        sourceLanguage: 'en', // Should be configurable
        targetLanguage: 'pl', // Should be configurable
        approveOnImport: false,
        skipExisting: true
      };

      const result = await translationMemory.import(content, importFormat, options);
      setImportResult(result);

      // Refresh data
      await loadStats();
      await loadTranslations();

      // Reset form
      setImportFile(null);
      setShowImportDialog(false);
    } catch (error) {
      console.error('Error importing translations:', error);
      setImportResult({
        success: 0,
        failed: 0,
        duplicates: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      });
    }
    setImporting(false);
  };

  const handleApprove = async (id: string) => {
    try {
      await translationMemory.approve(id);
      await loadTranslations();
      await loadStats();
    } catch (error) {
      console.error('Error approving translation:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this translation?')) return;

    try {
      // Note: This would need a delete method in TranslationMemory
      // await translationMemory.delete(id);
      await loadTranslations();
      await loadStats();
    } catch (error) {
      console.error('Error deleting translation:', error);
    }
  };

  const handleEditTranslation = (entry: TranslationEntry) => {
    setSelectedTranslation(entry);
    setEditorSource(entry.source_text);
    setShowEditor(true);
  };

  const filteredTranslations = translations.filter(t => {
    const matchesSearch = !searchTerm ||
      t.source_text.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.target_text.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filterStatus === 'all' ||
      (filterStatus === 'approved' && t.approved) ||
      (filterStatus === 'pending' && !t.approved);

    const matchesCategory = filterCategory === 'all' || t.category === filterCategory;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  const categories = Array.from(new Set(translations.map(t => t.category).filter(Boolean)));

  const openEditor = () => {
    setEditorSource('');
    setSelectedTranslation(null);
    setShowEditor(true);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Translations
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total || 0}</div>
            <Progress
              value={stats ? (stats.approved / stats.total) * 100 : 0}
              className="mt-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Approved
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats?.approved || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats ? Math.round((stats.approved / stats.total) * 100) : 0}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Review
            </CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats?.pending || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Needs review
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Language Pairs
            </CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Object.keys(stats?.byLanguage || {}).length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Active pairs
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Translation Memory Management
            </CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowImportDialog(true)}
              >
                <Upload className="h-4 w-4 mr-1" />
                Import
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowExportDialog(true)}
              >
                <Download className="h-4 w-4 mr-1" />
                Export
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSettingsDialog(true)}
              >
                <Settings className="h-4 w-4 mr-1" />
                Settings
              </Button>
              <Button size="sm" onClick={openEditor}>
                <Plus className="h-4 w-4 mr-1" />
                Add Translation
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <Tabs defaultValue="translations" className="w-full">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="translations">
                <FileText className="h-4 w-4 mr-1" />
                Translations
              </TabsTrigger>
              <TabsTrigger value="glossary">
                <BookOpen className="h-4 w-4 mr-1" />
                Glossary
              </TabsTrigger>
              <TabsTrigger value="automation">
                <Zap className="h-4 w-4 mr-1" />
                Automation
              </TabsTrigger>
              <TabsTrigger value="analytics">
                <BarChart3 className="h-4 w-4 mr-1" />
                Analytics
              </TabsTrigger>
              <TabsTrigger value="workflow">
                <Users className="h-4 w-4 mr-1" />
                Workflow
              </TabsTrigger>
              <TabsTrigger value="tools">
                <Settings className="h-4 w-4 mr-1" />
                Tools
              </TabsTrigger>
            </TabsList>

            {/* Translations List */}
            <TabsContent value="translations" className="space-y-4">
              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search translations..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as any)}
                  className="px-3 py-2 border rounded-md"
                >
                  <option value="all">All Status</option>
                  <option value="approved">Approved</option>
                  <option value="pending">Pending</option>
                </select>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="px-3 py-2 border rounded-md"
                >
                  <option value="all">All Categories</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Table */}
              <ScrollArea className="h-[600px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Source</TableHead>
                      <TableHead>Target</TableHead>
                      <TableHead>Languages</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Quality</TableHead>
                      <TableHead>Usage</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
                        </TableCell>
                      </TableRow>
                    ) : filteredTranslations.length > 0 ? (
                      filteredTranslations.map((translation) => (
                        <TableRow key={translation.id}>
                          <TableCell className="max-w-xs">
                            <p className="truncate text-sm">{translation.source_text}</p>
                          </TableCell>
                          <TableCell className="max-w-xs">
                            <p className="truncate text-sm">{translation.target_text}</p>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {translation.source_lang} → {translation.target_lang}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {translation.category && (
                              <Badge variant="secondary" className="text-xs">
                                {translation.category}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {translation.approved ? (
                              <Badge variant="default" className="bg-green-100 text-green-800">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Approved
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-yellow-600">
                                <AlertCircle className="h-3 w-3 mr-1" />
                                Pending
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {translation.quality_score && (
                              <div className="flex items-center gap-1">
                                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                <span className="text-xs">{translation.quality_score.toFixed(1)}</span>
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-muted-foreground">
                              {translation.usage_count || 0}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditTranslation(translation)}
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              {!translation.approved && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleApprove(translation.id)}
                                >
                                  <ThumbsUp className="h-3 w-3" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(translation.id)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                          No translations found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </TabsContent>

            {/* Glossary */}
            <TabsContent value="glossary" className="space-y-4">
              <GlossaryManager />
            </TabsContent>

            {/* Automation */}
            <TabsContent value="automation" className="space-y-4">
              <AutomationDashboard />
            </TabsContent>

            {/* Analytics */}
            <TabsContent value="analytics" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">By Language Pair</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {Object.entries(stats?.byLanguage || {}).map(([pair, count]) => (
                        <div key={pair} className="flex items-center justify-between">
                          <Badge variant="outline">{pair}</Badge>
                          <span className="font-medium">{count}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">By Category</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {Object.entries(stats?.byCategory || {}).map(([category, count]) => (
                        <div key={category} className="flex items-center justify-between">
                          <Badge variant="secondary">{category}</Badge>
                          <span className="font-medium">{count}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {detailedStats && (
                  <>
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Quality Distribution</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Excellent (4.5+)</span>
                            <Badge className="bg-green-100 text-green-800">
                              {detailedStats.qualityDistribution.excellent}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Good (3.5-4.5)</span>
                            <Badge className="bg-blue-100 text-blue-800">
                              {detailedStats.qualityDistribution.good}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Fair (2.5-3.5)</span>
                            <Badge className="bg-yellow-100 text-yellow-800">
                              {detailedStats.qualityDistribution.fair}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Poor (&lt;2.5)</span>
                            <Badge className="bg-red-100 text-red-800">
                              {detailedStats.qualityDistribution.poor}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Top Used Translations</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {detailedStats.topUsedEntries.slice(0, 5).map((entry) => (
                            <div key={entry.id} className="p-2 border rounded">
                              <p className="text-sm font-medium truncate">{entry.target_text}</p>
                              <p className="text-xs text-muted-foreground">
                                Used {entry.usage_count} times
                              </p>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </>
                )}
              </div>
            </TabsContent>

            {/* Workflow */}
            <TabsContent value="workflow" className="space-y-4">
              <div className="text-center py-12 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">
                  Translation Workflow Management
                </h3>
                <p className="text-sm max-w-md mx-auto mb-4">
                  Manage translation projects, assign tasks, and track progress
                </p>
                <Button className="mt-4">
                  <Target className="h-4 w-4 mr-1" />
                  Open Workflow Manager
                </Button>
              </div>
            </TabsContent>

            {/* Tools */}
            <TabsContent value="tools" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={openEditor}>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3">
                      <BookOpen className="h-8 w-8 text-blue-600" />
                      <div>
                        <h3 className="font-medium">Translation Editor</h3>
                        <p className="text-sm text-muted-foreground">
                          Advanced editor with TM suggestions
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3">
                      <FileUp className="h-8 w-8 text-green-600" />
                      <div>
                        <h3 className="font-medium">Bulk Import</h3>
                        <p className="text-sm text-muted-foreground">
                          Import translations from files
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3">
                      <TrendingUp className="h-8 w-8 text-purple-600" />
                      <div>
                        <h3 className="font-medium">Quality Analysis</h3>
                        <p className="text-sm text-muted-foreground">
                          Analyze translation quality
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3">
                      <MessageSquare className="h-8 w-8 text-orange-600" />
                      <div>
                        <h3 className="font-medium">Concordance Search</h3>
                        <p className="text-sm text-muted-foreground">
                          Find translation examples
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Import Dialog */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Import Translations</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block" htmlFor="format">Format</label>
              <select
                value={importFormat}
                onChange={(e) => setImportFormat(e.target.value as any)}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="json">JSON</option>
                <option value="csv">CSV</option>
                <option value="xliff">XLIFF</option>
                <option value="tmx">TMX</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block" htmlFor="file">File</label>
              <input
                type="file"
                accept={`.${importFormat}`}
                onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>

            {importResult && (
              <div className="p-3 border rounded-lg">
                <h4 className="font-medium mb-2">Import Results</h4>
                <div className="text-sm space-y-1">
                  <p>✅ Successfully imported: {importResult.success}</p>
                  <p>⚠️ Failed: {importResult.failed}</p>
                  <p>🔄 Duplicates skipped: {importResult.duplicates}</p>
                  {importResult.errors.length > 0 && (
                    <div className="text-red-600 text-xs">
                      {importResult.errors.map((error, i) => (
                        <p key={i}>• {error}</p>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-4">
              <Button
                onClick={handleImport}
                disabled={!importFile || importing}
                className="flex-1"
              >
                {importing ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                ) : null}
                Import
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowImportDialog(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Export Dialog */}
      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Export Translations</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block" htmlFor="format">Format</label>
              <div className="grid grid-cols-2 gap-2">
                {(['json', 'csv', 'xliff', 'tmx'] as const).map((format) => (
                  <Button
                    key={format}
                    variant="outline"
                    onClick={() => handleExport(format)}
                    className="justify-start"
                  >
                    <Download className="h-4 w-4 mr-1" />
                    {format.toUpperCase()}
                  </Button>
                ))}
              </div>
            </div>

            <div className="text-xs text-muted-foreground">
              <p>• JSON: Full data with all metadata</p>
              <p>• CSV: Spreadsheet-compatible format</p>
              <p>• XLIFF: Translation industry standard</p>
              <p>• TMX: Translation Memory eXchange format</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Translation Editor Dialog */}
      <Dialog open={showEditor} onOpenChange={setShowEditor}>
        <DialogContent className="sm:max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedTranslation ? 'Edit Translation' : 'Add New Translation'}
            </DialogTitle>
          </DialogHeader>
          <TranslationEditor
            sourceText={editorSource}
            onTranslationSelect={(translation) => {
              console.log('Translation selected:', translation);
            }}
            sourceLang={selectedTranslation?.source_lang || 'en'}
            targetLang={selectedTranslation?.target_lang || 'pl'}
            context={selectedTranslation?.context}
            category={selectedTranslation?.category}
            onSaveToTM={(translation, metadata) => {
              console.log('Saved to TM:', translation, metadata);
              setShowEditor(false);
              loadTranslations();
              loadStats();
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};