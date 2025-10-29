import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Search,
  Plus,
  Edit,
  Trash2,
  BookOpen,
  Globe,
  FileText,
  Download,
  Upload,
  Filter,
  CheckCircle,
  Clock,
  AlertTriangle,
  Star,
  MessageSquare,
  Languages,
  Settings
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { TranslationGlossary } from '@/types/translation';

export const GlossaryManager: React.FC = () => {
  const { t } = useTranslation();
  const [terms, setTerms] = useState<TranslationGlossary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDomain, setFilterDomain] = useState<string>('all');
  const [filterLanguage, setFilterLanguage] = useState<string>('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingTerm, setEditingTerm] = useState<TranslationGlossary | null>(null);
  const [formData, setFormData] = useState({
    source_term: '',
    target_term: '',
    source_lang: 'en',
    target_lang: 'pl',
    domain: '',
    definition: '',
    notes: '',
    approved: false
  });

  useEffect(() => {
    loadTerms();
  }, []);

  const loadTerms = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('translation_glossary')
        .select('*')
        .order('source_term', { ascending: true });

      if (error) throw error;
      setTerms(data || []);
    } catch (error) {
      console.error('Error loading glossary terms:', error);
    }
    setLoading(false);
  };

  const handleSaveTerm = async () => {
    try {
      if (editingTerm) {
        // Update existing term
        const { error } = await supabase
          .from('translation_glossary')
          .update({
            ...formData,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingTerm.id);

        if (error) throw error;
      } else {
        // Create new term
        const { error } = await supabase
          .from('translation_glossary')
          .insert({
            ...formData,
            created_by: 'current_user', // Should get actual user ID
            approved: false
          });

        if (error) throw error;
      }

      // Reset form and reload
      setFormData({
        source_term: '',
        target_term: '',
        source_lang: 'en',
        target_lang: 'pl',
        domain: '',
        definition: '',
        notes: '',
        approved: false
      });
      setEditingTerm(null);
      setShowAddDialog(false);
      loadTerms();
    } catch (error) {
      console.error('Error saving term:', error);
    }
  };

  const handleEditTerm = (term: TranslationGlossary) => {
    setEditingTerm(term);
    setFormData({
      source_term: term.source_term,
      target_term: term.target_term,
      source_lang: term.source_lang,
      target_lang: term.target_lang,
      domain: term.domain || '',
      definition: term.definition || '',
      notes: term.notes || '',
      approved: term.approved
    });
    setShowAddDialog(true);
  };

  const handleDeleteTerm = async (id: string) => {
    if (!confirm('Are you sure you want to delete this term?')) return;

    try {
      const { error } = await supabase
        .from('translation_glossary')
        .delete()
        .eq('id', id);

      if (error) throw error;
      loadTerms();
    } catch (error) {
      console.error('Error deleting term:', error);
    }
  };

  const handleApproveTerm = async (id: string) => {
    try {
      const { error } = await supabase
        .from('translation_glossary')
        .update({
          approved: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
      loadTerms();
    } catch (error) {
      console.error('Error approving term:', error);
    }
  };

  const handleExportGlossary = async (format: 'csv' | 'json' | 'tbx') => {
    try {
      let content: string;
      let filename: string;
      let mimeType: string;

      switch (format) {
        case 'json':
          content = JSON.stringify(terms, null, 2);
          filename = `glossary-${new Date().toISOString().split('T')[0]}.json`;
          mimeType = 'application/json';
          break;

        case 'csv':
          const headers = ['source_term', 'target_term', 'source_lang', 'target_lang', 'domain', 'definition', 'approved'];
          const rows = terms.map(term => [
            term.source_term,
            term.target_term,
            term.source_lang,
            term.target_lang,
            term.domain || '',
            term.definition || '',
            term.approved ? 'Yes' : 'No'
          ]);
          content = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
          filename = `glossary-${new Date().toISOString().split('T')[0]}.csv`;
          mimeType = 'text/csv';
          break;

        case 'tbx':
          content = generateTBX(terms);
          filename = `glossary-${new Date().toISOString().split('T')[0]}.tbx`;
          mimeType = 'application/xml';
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
      console.error('Error exporting glossary:', error);
    }
  };

  const generateTBX = (terms: TranslationGlossary[]): string => {
    const now = new Date().toISOString();
    return `<?xml version="1.0" encoding="UTF-8"?>
<tbx version="TBX-Basic">
  <header>
    <title>Mariia Hub Translation Glossary</title>
    <description>Company-specific terminology</description>
    <creationTool>Mariia Hub</creationTool>
    <creationDate>${now}</creationDate>
  </header>
  <body>
    <textEntry id="glossary">
      ${terms.map(term => `
      <termEntry id="${term.id}">
        <langSet xml:lang="${term.source_lang}">
          <tig>
            <term>${escapeXML(term.source_term)}</term>
            ${term.definition ? `<descripGrp><descrip type="definition">${escapeXML(term.definition)}</descrip></descripGrp>` : ''}
            ${term.domain ? `<descripGrp><descrip type="domain">${escapeXML(term.domain)}</descrip></descripGrp>` : ''}
          </tig>
        </langSet>
        <langSet xml:lang="${term.target_lang}">
          <tig>
            <term>${escapeXML(term.target_term)}</term>
            ${term.notes ? `<note>${escapeXML(term.notes)}</note>` : ''}
            <descripGrp><descrip type="approved">${term.approved}</descrip></descripGrp>
          </tig>
        </langSet>
      </termEntry>`).join('')}
    </textEntry>
  </body>
</tbx>`;
  };

  const escapeXML = (text: string): string => {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  };

  const filteredTerms = terms.filter(term => {
    const matchesSearch = !searchTerm ||
      term.source_term.toLowerCase().includes(searchTerm.toLowerCase()) ||
      term.target_term.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (term.definition && term.definition.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesDomain = filterDomain === 'all' || term.domain === filterDomain;
    const matchesLanguage = filterLanguage === 'all' ||
      term.source_lang === filterLanguage ||
      term.target_lang === filterLanguage;

    return matchesSearch && matchesDomain && matchesLanguage;
  });

  const domains = Array.from(new Set(terms.map(t => t.domain).filter(Boolean)));
  const languages = Array.from(new Set([
    ...terms.map(t => t.source_lang),
    ...terms.map(t => t.target_lang)
  ]));

  const openAddDialog = () => {
    setEditingTerm(null);
    setFormData({
      source_term: '',
      target_term: '',
      source_lang: 'en',
      target_lang: 'pl',
      domain: '',
      definition: '',
      notes: '',
      approved: false
    });
    setShowAddDialog(true);
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Terms
            </CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{terms.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Approved Terms
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {terms.filter(t => t.approved).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Terms
            </CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {terms.filter(t => !t.approved).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Domains
            </CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{domains.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Translation Glossary
            </CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExportGlossary('csv')}
              >
                <Download className="h-4 w-4 mr-1" />
                Export
              </Button>
              <Button size="sm" onClick={openAddDialog}>
                <Plus className="h-4 w-4 mr-1" />
                Add Term
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <Tabs defaultValue="terms" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="terms">Terms</TabsTrigger>
              <TabsTrigger value="domains">Domains</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            {/* Terms List */}
            <TabsContent value="terms" className="space-y-4">
              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search terms..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <select
                  value={filterDomain}
                  onChange={(e) => setFilterDomain(e.target.value)}
                  className="px-3 py-2 border rounded-md"
                >
                  <option value="all">All Domains</option>
                  {domains.map(domain => (
                    <option key={domain} value={domain}>{domain}</option>
                  ))}
                </select>
                <select
                  value={filterLanguage}
                  onChange={(e) => setFilterLanguage(e.target.value)}
                  className="px-3 py-2 border rounded-md"
                >
                  <option value="all">All Languages</option>
                  {languages.map(lang => (
                    <option key={lang} value={lang}>{lang.toUpperCase()}</option>
                  ))}
                </select>
              </div>

              {/* Table */}
              <ScrollArea className="h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Source Term</TableHead>
                      <TableHead>Target Term</TableHead>
                      <TableHead>Languages</TableHead>
                      <TableHead>Domain</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Definition</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
                        </TableCell>
                      </TableRow>
                    ) : filteredTerms.length > 0 ? (
                      filteredTerms.map((term) => (
                        <TableRow key={term.id}>
                          <TableCell className="font-medium">
                            {term.source_term}
                          </TableCell>
                          <TableCell>
                            {term.target_term}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {term.source_lang} → {term.target_lang}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {term.domain && (
                              <Badge variant="secondary" className="text-xs">
                                {term.domain}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {term.approved ? (
                              <Badge variant="default" className="bg-green-100 text-green-800">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Approved
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-yellow-600">
                                <Clock className="h-3 w-3 mr-1" />
                                Pending
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="max-w-xs">
                            <p className="text-sm text-muted-foreground truncate">
                              {term.definition}
                            </p>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditTerm(term)}
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              {!term.approved && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleApproveTerm(term.id)}
                                >
                                  <CheckCircle className="h-3 w-3" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteTerm(term.id)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          No glossary terms found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </TabsContent>

            {/* Domains */}
            <TabsContent value="domains" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {domains.map((domain) => {
                  const domainTerms = terms.filter(t => t.domain === domain);
                  return (
                    <Card key={domain}>
                      <CardHeader>
                        <CardTitle className="text-lg">{domain}</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {domainTerms.length} terms
                        </p>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {domainTerms.slice(0, 5).map((term) => (
                            <div key={term.id} className="flex justify-between items-center">
                              <span className="text-sm">{term.source_term}</span>
                              <span className="text-sm text-muted-foreground">{term.target_term}</span>
                            </div>
                          ))}
                          {domainTerms.length > 5 && (
                            <p className="text-xs text-muted-foreground">
                              +{domainTerms.length - 5} more terms
                            </p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>

            {/* Settings */}
            <TabsContent value="settings" className="space-y-4">
              <div className="text-center py-12 text-muted-foreground">
                <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">
                  Glossary Settings
                </h3>
                <p className="text-sm max-w-md mx-auto">
                  Configure glossary preferences, import settings, and validation rules
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Add/Edit Term Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingTerm ? 'Edit Term' : 'Add New Term'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Source Term</label>
                <Input
                  value={formData.source_term}
                  onChange={(e) => setFormData(prev => ({ ...prev, source_term: e.target.value }))}
                  placeholder="Enter source term"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Target Term</label>
                <Input
                  value={formData.target_term}
                  onChange={(e) => setFormData(prev => ({ ...prev, target_term: e.target.value }))}
                  placeholder="Enter target term"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Source Language</label>
                <select
                  value={formData.source_lang}
                  onChange={(e) => setFormData(prev => ({ ...prev, source_lang: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="en">English</option>
                  <option value="pl">Polish</option>
                  <option value="ua">Ukrainian</option>
                  <option value="ru">Russian</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Target Language</label>
                <select
                  value={formData.target_lang}
                  onChange={(e) => setFormData(prev => ({ ...prev, target_lang: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="en">English</option>
                  <option value="pl">Polish</option>
                  <option value="ua">Ukrainian</option>
                  <option value="ru">Russian</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Domain</label>
              <Input
                value={formData.domain}
                onChange={(e) => setFormData(prev => ({ ...prev, domain: e.target.value }))}
                placeholder="e.g., Beauty, Fitness, Medical"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Definition</label>
              <Textarea
                value={formData.definition}
                onChange={(e) => setFormData(prev => ({ ...prev, definition: e.target.value }))}
                placeholder="Term definition or context"
                className="min-h-20"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Notes</label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Additional notes"
                className="min-h-16"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="approved"
                checked={formData.approved}
                onChange={(e) => setFormData(prev => ({ ...prev, approved: e.target.checked }))}
              />
              <label htmlFor="approved" className="text-sm">
                Approve this term
              </label>
            </div>

            <div className="flex gap-2 pt-4">
              <Button onClick={handleSaveTerm} className="flex-1">
                {editingTerm ? 'Update' : 'Add'} Term
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowAddDialog(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};