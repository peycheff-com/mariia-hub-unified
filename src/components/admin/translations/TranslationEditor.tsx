import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Save,
  Globe,
  CheckCircle,
  Clock,
  AlertCircle,
  Search,
  Filter,
  Download,
  Upload,
  Eye,
  Edit3,
  Copy,
  RefreshCw,
  Languages,
  FileText,
  Settings,
  TrendingUp,
  BarChart3
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Text } from '@/components/ui/text';
import { Separator } from '@/components/ui/separator';

import { translationService, TranslationKey, TranslationValue, TranslationStats } from '@/lib/translations/TranslationService';
import { translationMemory, TranslationSuggestion } from '@/lib/translations/TranslationMemory';

interface TranslationEditorProps {
  initialLanguage?: string;
  initialNamespace?: string;
}

export const TranslationEditor: React.FC<TranslationEditorProps> = ({
  initialLanguage = 'pl',
  initialNamespace = 'common'
}) => {
  const { t, i18n } = useTranslation();

  // State management
  const [selectedLanguage, setSelectedLanguage] = useState(initialLanguage);
  const [selectedNamespace, setSelectedNamespace] = useState(initialNamespace);
  const [translationKeys, setTranslationKeys] = useState<TranslationKey[]>([]);
  const [translationValues, setTranslationValues] = useState<TranslationValue[]>([]);
  const [stats, setStats] = useState<TranslationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Search and filter
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  // Editing state
  const [editingKey, setEditingKey] = useState<TranslationKey | null>(null);
  const [editingValue, setEditingValue] = useState<TranslationValue | null>(null);
  const [suggestions, setSuggestions] = useState<TranslationSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // View modes
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Load initial data
  useEffect(() => {
    loadData();
    loadStats();
  }, [selectedLanguage, selectedNamespace, filterStatus, filterCategory]);

  // Real-time updates
  useEffect(() => {
    const subscription = translationService.subscribeToTranslationUpdates((event, data) => {
      console.log('Translation update:', event, data);
      loadData();
      loadStats();
    });

    return () => {
      translationService.unsubscribeFromTranslationUpdates();
    };
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const filters: any = {
        namespace: selectedNamespace,
        search: searchTerm,
      };

      if (filterCategory !== 'all') {
        filters.category = filterCategory;
      }

      // Load translation keys
      const { data: keys } = await translationService.getTranslationKeys(filters);

      // Load translation values for selected language
      const { data: values } = await translationService.getTranslationValues(selectedLanguage, {
        ...filters,
        status: filterStatus !== 'all' ? filterStatus : undefined
      });

      setTranslationKeys(keys || []);
      setTranslationValues(values || []);
    } catch (error) {
      console.error('Error loading translations:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const statsData = await translationService.getTranslationStats();
      setStats(statsData);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleSaveTranslation = async () => {
    if (!editingValue) return;

    setSaving(true);
    try {
      await translationService.upsertTranslationValue(editingValue);
      setEditingValue(null);
      await loadData();
    } catch (error) {
      console.error('Error saving translation:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleGetSuggestions = async (sourceText: string) => {
    try {
      const suggestionsData = await translationMemory.getTranslationSuggestions(
        sourceText,
        'en',
        selectedLanguage
      );
      setSuggestions(suggestionsData);
      setShowSuggestions(true);
    } catch (error) {
      console.error('Error getting suggestions:', error);
    }
  };

  const handleImportTranslations = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const result = await translationService.importTranslations(selectedLanguage, file, {
        overwriteExisting: false,
        markForReview: true,
        createMissingKeys: true
      });

      if (result.errors.length > 0) {
        console.error('Import errors:', result.errors);
      } else {
        await loadData();
        await loadStats();
      }
    } catch (error) {
      console.error('Error importing translations:', error);
    }
  };

  const handleExportTranslations = async () => {
    try {
      const blob = await translationService.exportTranslations(selectedLanguage, 'json');
      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `translations_${selectedLanguage}_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error exporting translations:', error);
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-800',
      pending_review: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status: string) => {
    const icons = {
      draft: Clock,
      pending_review: AlertCircle,
      approved: CheckCircle,
      rejected: AlertCircle
    };
    return icons[status as keyof typeof icons] || Clock;
  };

  if (loading && translationKeys.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-6 h-6 animate-spin mr-2" />
        <span>Loading translations...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with stats */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Translation Editor</h1>
          <p className="text-muted-foreground">
            Manage translations for {selectedLanguage.toUpperCase()} - {selectedNamespace}
          </p>
        </div>

        {stats && (
          <div className="flex gap-4">
            <Card className="p-4">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4" />
                <span className="text-sm font-medium">
                  {stats.completionPercentage[selectedLanguage] || 0}% Complete
                </span>
              </div>
              <Progress
                value={stats.completionPercentage[selectedLanguage] || 0}
                className="w-32 mt-2"
              />
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span className="text-sm font-medium">
                  {stats.pendingReviews} Pending
                </span>
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* Controls */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4 items-center">
            {/* Language selector */}
            <div className="flex items-center gap-2">
              <Label>Language:</Label>
              <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">🇬🇧 English</SelectItem>
                  <SelectItem value="pl">🇵🇱 Polish</SelectItem>
                  <SelectItem value="ua">🇺🇦 Ukrainian</SelectItem>
                  <SelectItem value="ru">🇷🇺 Russian</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Namespace selector */}
            <div className="flex items-center gap-2">
              <Label>Namespace:</Label>
              <Select value={selectedNamespace} onValueChange={setSelectedNamespace}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="common">Common</SelectItem>
                  <SelectItem value="nav">Navigation</SelectItem>
                  <SelectItem value="booking">Booking</SelectItem>
                  <SelectItem value="beauty">Beauty</SelectItem>
                  <SelectItem value="fitness">Fitness</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="legal">Legal</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Search */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search translations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2">
              <Label>Status:</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="pending_review">Pending Review</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleExportTranslations}>
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>

              <div className="relative">
                <input
                  type="file"
                  accept=".json,.xliff,.csv"
                  onChange={handleImportTranslations}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <Button variant="outline">
                  <Upload className="w-4 h-4 mr-2" />
                  Import
                </Button>
              </div>

              <Button variant="outline" onClick={() => setShowAdvanced(!showAdvanced)}>
                <Settings className="w-4 h-4 mr-2" />
                Advanced
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Translation list */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Translations</span>
                <div className="flex gap-2">
                  <Button
                    variant={viewMode === 'table' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('table')}
                  >
                    <FileText className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'cards' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('cards')}
                  >
                    <BarChart3 className="w-4 h-4" />
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                {viewMode === 'table' ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Key</TableHead>
                        <TableHead>Source</TableHead>
                        <TableHead>Translation</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {translationKeys.map((key) => {
                        const value = translationValues.find(v => v.key_id === key.id);
                        return (
                          <TableRow key={key.id}>
                            <TableCell className="font-mono text-sm">
                              {key.key_name}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {/* Get English source */}
                              {t(key.key_name)}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <span className="text-sm">{value?.value || '-'}</span>
                                {value?.quality_score && (
                                  <Badge variant="outline" className="text-xs">
                                    {Math.round(value.quality_score * 100)}%
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              {value && (
                                <Badge className={getStatusColor(value.status)}>
                                  <getStatusIcon(value.status) className="w-3 h-3 mr-1" />
                                  {value.status.replace('_', ' ')}
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setEditingValue({
                                    ...value!,
                                    key_id: key.id,
                                    language_code: selectedLanguage
                                  })}
                                >
                                  <Edit3 className="w-4 h-4" />
                                </Button>
                                {value && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleGetSuggestions(t(key.key_name))}
                                  >
                                    <Languages className="w-4 h-4" />
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="grid gap-4">
                    {translationKeys.map((key) => {
                      const value = translationValues.find(v => v.key_id === key.id);
                      return (
                        <Card key={key.id} className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-mono text-sm font-medium">{key.key_name}</h4>
                              <p className="text-sm text-muted-foreground mt-1">
                                {t(key.key_name)}
                              </p>
                              <p className="text-sm mt-2">{value?.value || 'Not translated'}</p>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              {value && (
                                <Badge className={getStatusColor(value.status)}>
                                  {value.status.replace('_', ' ')}
                                </Badge>
                              )}
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setEditingValue({
                                    ...value!,
                                    key_id: key.id,
                                    language_code: selectedLanguage
                                  })}
                                >
                                  <Edit3 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Editing panel */}
        <div className="space-y-4">
          {/* Translation suggestions */}
          {showSuggestions && suggestions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Languages className="w-4 h-4" />
                  Translation Suggestions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {suggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      className="p-2 border rounded cursor-pointer hover:bg-muted"
                      onClick={() => {
                        if (editingValue) {
                          setEditingValue({
                            ...editingValue,
                            value: suggestion.text
                          });
                        }
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm">{suggestion.text}</span>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {suggestion.source}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {Math.round(suggestion.confidence * 100)}%
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Current translation editor */}
          {editingValue && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Edit Translation</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingValue(null)}
                  >
                    ×
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Key</Label>
                  <Input
                    value={editingValue.key_id}
                    disabled
                    className="font-mono text-sm"
                  />
                </div>

                <div>
                  <Label>Source (English)</Label>
                  <Textarea
                    value={t(editingValue.key_id)}
                    disabled
                    className="text-sm"
                  />
                </div>

                <div>
                  <Label>Translation ({selectedLanguage.toUpperCase()})</Label>
                  <Textarea
                    value={editingValue.value}
                    onChange={(e) => setEditingValue({
                      ...editingValue,
                      value: e.target.value
                    })}
                    placeholder="Enter translation..."
                    className="text-sm"
                  />
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-muted-foreground">
                      {editingValue.value.length} characters
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleGetSuggestions(t(editingValue.key_id))}
                    >
                      <Languages className="w-4 h-4 mr-1" />
                      Get Suggestions
                    </Button>
                  </div>
                </div>

                <div>
                  <Label>Status</Label>
                  <Select
                    value={editingValue.status}
                    onValueChange={(value: any) => setEditingValue({
                      ...editingValue,
                      status: value
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="pending_review">Pending Review</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Translator Notes</Label>
                  <Textarea
                    value={editingValue.translator_notes || ''}
                    onChange={(e) => setEditingValue({
                      ...editingValue,
                      translator_notes: e.target.value
                    })}
                    placeholder="Add notes for reviewers..."
                    className="text-sm"
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button onClick={handleSaveTranslation} disabled={saving}>
                    <Save className="w-4 h-4 mr-2" />
                    {saving ? 'Saving...' : 'Save'}
                  </Button>
                  <Button variant="outline" onClick={() => setEditingValue(null)}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default TranslationEditor;