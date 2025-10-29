import React, { useState, useEffect } from 'react';
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
  BarChart3
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { translationMemory } from '@/lib/translations/TranslationMemory';
import { translationWorkflow } from '@/lib/translations/TranslationWorkflow';

interface TranslationStats {
  total: number;
  approved: number;
  pending: number;
  byLanguage: Record<string, number>;
  byCategory: Record<string, number>;
}

export const TranslationManager: React.FC = () => {
  const { t } = useTranslation();
  const [stats, setStats] = useState<TranslationStats | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'approved' | 'pending'>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [translations, setTranslations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
    loadTranslations();
  }, []);

  const loadStats = async () => {
    try {
      const data = await translationMemory.getStats();
      setStats(data);
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

  const handleExport = async (format: 'json' | 'csv' | 'xliff') => {
    try {
      const data = await translationMemory.export();
      let content: string;
      let filename: string;
      let mimeType: string;

      switch (format) {
        case 'json':
          content = JSON.stringify(data, null, 2);
          filename = `translations-${new Date().toISOString().split('T')[0]}.json`;
          mimeType = 'application/json';
          break;

        case 'csv':
          const headers = ['source_text', 'target_text', 'source_lang', 'target_lang', 'category', 'approved'];
          const rows = data.map(t => [
            t.source_text,
            t.target_text,
            t.source_lang,
            t.target_lang,
            t.category || '',
            t.approved ? 'Yes' : 'No'
          ]);
          content = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
          filename = `translations-${new Date().toISOString().split('T')[0]}.csv`;
          mimeType = 'text/csv';
          break;

        default:
          return;
      }

      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting translations:', error);
    }
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

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('translation.total', 'Total Translations')}
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
              {t('translation.approved', 'Approved')}
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
              {t('translation.pending', 'Pending Review')}
            </CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats?.pending || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {t('translation.needsReview', 'Needs review')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('translation.languages', 'Language Pairs')}
            </CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Object.keys(stats?.byLanguage || {}).length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {t('translation.activePairs', 'Active pairs')}
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
              {t('translation.memory', 'Translation Memory')}
            </CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport('json')}
              >
                <Download className="h-4 w-4 mr-1" />
                JSON
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport('csv')}
              >
                <Download className="h-4 w-4 mr-1" />
                CSV
              </Button>
              <Button variant="outline" size="sm">
                <Upload className="h-4 w-4 mr-1" />
                {t('translation.import', 'Import')}
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <Tabs defaultValue="list" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="list">
                {t('translation.translations', 'Translations')}
              </TabsTrigger>
              <TabsTrigger value="analytics">
                <BarChart3 className="h-4 w-4 mr-1" />
                {t('translation.analytics', 'Analytics')}
              </TabsTrigger>
              <TabsTrigger value="workflow">
                <Users className="h-4 w-4 mr-1" />
                {t('translation.workflow', 'Workflow')}
              </TabsTrigger>
            </TabsList>

            {/* Translations List */}
            <TabsContent value="list" className="space-y-4">
              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder={t('translation.search', 'Search translations...')}
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
                  <option value="all">{t('translation.allStatus', 'All Status')}</option>
                  <option value="approved">{t('translation.approved', 'Approved')}</option>
                  <option value="pending">{t('translation.pending', 'Pending')}</option>
                </select>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="px-3 py-2 border rounded-md"
                >
                  <option value="all">{t('translation.allCategories', 'All Categories')}</option>
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
                      <TableHead>{t('translation.source', 'Source')}</TableHead>
                      <TableHead>{t('translation.target', 'Target')}</TableHead>
                      <TableHead>{t('translation.languages', 'Languages')}</TableHead>
                      <TableHead>{t('translation.category', 'Category')}</TableHead>
                      <TableHead>{t('translation.status', 'Status')}</TableHead>
                      <TableHead>{t('translation.usage', 'Usage')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
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
                                {t('translation.approved', 'Approved')}
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-yellow-600">
                                <AlertCircle className="h-3 w-3 mr-1" />
                                {t('translation.pending', 'Pending')}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-muted-foreground">
                              {translation.usage_count || 0}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          {t('translation.noResults', 'No translations found')}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </TabsContent>

            {/* Analytics */}
            <TabsContent value="analytics" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      {t('translation.byLanguage', 'By Language Pair')}
                    </CardTitle>
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
                    <CardTitle className="text-lg">
                      {t('translation.byCategory', 'By Category')}
                    </CardTitle>
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
              </div>
            </TabsContent>

            {/* Workflow */}
            <TabsContent value="workflow" className="space-y-4">
              <div className="text-center py-12 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">
                  {t('translation.workflow.title', 'Translation Workflow')}
                </h3>
                <p className="text-sm max-w-md mx-auto">
                  {t('translation.workflow.description', 'Manage translation projects, assign tasks, and track progress')}
                </p>
                <Button className="mt-4">
                  {t('translation.workflow.setup', 'Setup Workflow')}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};