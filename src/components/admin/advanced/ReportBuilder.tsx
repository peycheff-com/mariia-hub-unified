import { useState, useEffect } from 'react';
import {
  BarChart3,
  LineChart,
  PieChart,
  TrendingUp,
  Download,
  Save,
  Play,
  Edit,
  Trash2,
  Plus,
  Settings,
  Calendar,
  Filter,
  FileText,
  Eye,
  Copy,
  Share2,
  Clock,
  Users,
  DollarSign,
  ShoppingCart,
  Activity
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ReportField {
  name: string;
  label: string;
  type: 'dimension' | 'metric';
  dataType: 'string' | 'number' | 'date' | 'boolean';
  table: string;
}

interface ReportConfig {
  name: string;
  description: string;
  fields: string[];
  filters: ReportFilter[];
  groupBy?: string[];
  orderBy?: { field: string; direction: 'asc' | 'desc' }[];
  limit?: number;
}

interface ReportFilter {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'in' | 'between';
  value: any;
}

interface CustomReport {
  id: string;
  name: string;
  description: string;
  query_config: ReportConfig;
  visualization_config: any;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

const ReportBuilder = () => {
  const [reports, setReports] = useState<CustomReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'reports' | 'builder' | 'templates'>('reports');
  const [editingReport, setEditingReport] = useState<CustomReport | null>(null);
  const [reportData, setReportData] = useState<any[]>([]);
  const [previewReport, setPreviewReport] = useState<CustomReport | null>(null);
  const { toast } = useToast();

  const [reportConfig, setReportConfig] = useState<ReportConfig>({
    name: '',
    description: '',
    fields: [],
    filters: [],
    groupBy: [],
    orderBy: [],
    limit: 100
  });

  const [visualizationConfig, setVisualizationConfig] = useState({
    type: 'table',
    chartType: 'bar',
    xAxis: '',
    yAxis: '',
    groupBy: ''
  });

  const AVAILABLE_FIELDS: ReportField[] = [
    // Bookings fields
    { name: 'bookings.id', label: 'Booking ID', type: 'dimension', dataType: 'string', table: 'bookings' },
    { name: 'bookings.status', label: 'Status', type: 'dimension', dataType: 'string', table: 'bookings' },
    { name: 'bookings.booking_date', label: 'Booking Date', type: 'dimension', dataType: 'date', table: 'bookings' },
    { name: 'bookings.amount_paid', label: 'Amount Paid', type: 'metric', dataType: 'number', table: 'bookings' },
    { name: 'bookings.currency', label: 'Currency', type: 'dimension', dataType: 'string', table: 'bookings' },
    { name: 'bookings.client_name', label: 'Client Name', type: 'dimension', dataType: 'string', table: 'bookings' },
    { name: 'bookings.client_email', label: 'Client Email', type: 'dimension', dataType: 'string', table: 'bookings' },

    // Services fields
    { name: 'services.title', label: 'Service Title', type: 'dimension', dataType: 'string', table: 'services' },
    { name: 'services.category', label: 'Service Category', type: 'dimension', dataType: 'string', table: 'services' },
    { name: 'services.price_from', label: 'Price From', type: 'metric', dataType: 'number', table: 'services' },
    { name: 'services.price_to', label: 'Price To', type: 'metric', dataType: 'number', table: 'services' },
    { name: 'services.duration_minutes', label: 'Duration (min)', type: 'metric', dataType: 'number', table: 'services' },
    { name: 'services.service_type', label: 'Service Type', type: 'dimension', dataType: 'string', table: 'services' },

    // Calculated metrics
    { name: 'COUNT(bookings.id)', label: 'Total Bookings', type: 'metric', dataType: 'number', table: 'calculated' },
    { name: 'SUM(bookings.amount_paid)', label: 'Total Revenue', type: 'metric', dataType: 'number', table: 'calculated' },
    { name: 'AVG(bookings.amount_paid)', label: 'Average Revenue', type: 'metric', dataType: 'number', table: 'calculated' },
    { name: 'DATE_TRUNC(bookings.booking_date, month)', label: 'Month', type: 'dimension', dataType: 'date', table: 'calculated' },
    { name: 'DATE_TRUNC(bookings.booking_date, week)', label: 'Week', type: 'dimension', dataType: 'date', table: 'calculated' }
  ];

  const REPORT_TEMPLATES = [
    {
      name: 'Monthly Revenue Report',
      description: 'Total revenue broken down by month',
      config: {
        fields: ['DATE_TRUNC(bookings.booking_date, month)', 'SUM(bookings.amount_paid)'],
        groupBy: ['DATE_TRUNC(bookings.booking_date, month)'],
        filters: [
          { field: 'bookings.status', operator: 'eq', value: 'confirmed' }
        ],
        orderBy: [{ field: 'DATE_TRUNC(bookings.booking_date, month)', direction: 'desc' }]
      }
    },
    {
      name: 'Service Performance',
      description: 'Most popular services and their revenue',
      config: {
        fields: ['services.title', 'COUNT(bookings.id)', 'SUM(bookings.amount_paid)'],
        groupBy: ['services.title'],
        filters: [],
        orderBy: [{ field: 'SUM(bookings.amount_paid)', direction: 'desc' }],
        limit: 10
      }
    },
    {
      name: 'Client Analytics',
      description: 'Client booking patterns and spending',
      config: {
        fields: ['bookings.client_name', 'COUNT(bookings.id)', 'SUM(bookings.amount_paid)', 'AVG(bookings.amount_paid)'],
        groupBy: ['bookings.client_name'],
        filters: [
          { field: 'bookings.status', operator: 'in', value: ['confirmed', 'completed'] }
        ],
        orderBy: [{ field: 'SUM(bookings.amount_paid)', direction: 'desc' }],
        limit: 20
      }
    }
  ];

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      const { data, error } = await supabase
        .from('custom_reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReports(data || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveReport = async () => {
    try {
      const saveData = {
        name: reportConfig.name,
        description: reportConfig.description,
        query_config: reportConfig,
        visualization_config: visualizationConfig,
        is_public: false
      };

      let result;
      if (editingReport) {
        result = await supabase
          .from('custom_reports')
          .update(saveData)
          .eq('id', editingReport.id);
      } else {
        result = await supabase
          .from('custom_reports')
          .insert(saveData);
      }

      if (result.error) throw result.error;

      toast({
        title: 'Success',
        description: `Report ${editingReport ? 'updated' : 'saved'} successfully`
      });

      setDialogOpen(false);
      resetForm();
      loadReports();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const handleRunReport = async () => {
    if (!reportConfig.fields.length) {
      toast({
        title: 'Error',
        description: 'Please select at least one field',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      // Simulate running the report query
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Mock data based on configuration
      const mockData = generateMockData(reportConfig);
      setReportData(mockData);
      setPreviewDialogOpen(true);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const generateMockData = (config: ReportConfig) => {
    // Generate realistic mock data based on the report configuration
    const data = [];
    const rows = Math.min(config.limit || 100, 20);

    for (let i = 0; i < rows; i++) {
      const row: any = {};

      config.fields.forEach(field => {
        if (field.includes('SUM(bookings.amount_paid)')) {
          row[field] = Math.floor(Math.random() * 10000) + 1000;
        } else if (field.includes('COUNT(bookings.id)')) {
          row[field] = Math.floor(Math.random() * 50) + 1;
        } else if (field.includes('AVG(bookings.amount_paid)')) {
          row[field] = Math.floor(Math.random() * 2000) + 500;
        } else if (field.includes('DATE_TRUNC')) {
          const date = new Date();
          date.setMonth(date.getMonth() - i);
          row[field] = date.toISOString().split('T')[0];
        } else if (field.includes('services.title')) {
          const services = ['Lip Blush', 'Microblading', 'Eyeliner Extensions', 'Fitness Training', 'Yoga Class'];
          row[field] = services[Math.floor(Math.random() * services.length)];
        } else if (field.includes('services.category')) {
          const categories = ['lips', 'eyebrows', 'eyeliner', 'fitness', 'wellness'];
          row[field] = categories[Math.floor(Math.random() * categories.length)];
        } else if (field.includes('bookings.client_name')) {
          const names = ['Anna Kowalska', 'Ewa Nowak', 'Maria Wiśniewska', 'Katarzyna Dąbrowska'];
          row[field] = names[Math.floor(Math.random() * names.length)];
        } else {
          row[field] = `Value ${i + 1}`;
        }
      });

      data.push(row);
    }

    return data;
  };

  const handleDeleteReport = async (reportId: string) => {
    if (!confirm('Are you sure you want to delete this report?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('custom_reports')
        .delete()
        .eq('id', reportId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Report deleted successfully'
      });

      loadReports();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const handleUseTemplate = (template: any) => {
    setReportConfig({
      ...template.config,
      name: template.name,
      description: template.description
    });
    setActiveTab('builder');
  };

  const resetForm = () => {
    setReportConfig({
      name: '',
      description: '',
      fields: [],
      filters: [],
      groupBy: [],
      orderBy: [],
      limit: 100
    });
    setVisualizationConfig({
      type: 'table',
      chartType: 'bar',
      xAxis: '',
      yAxis: '',
      groupBy: ''
    });
    setEditingReport(null);
  };

  const addFilter = () => {
    setReportConfig({
      ...reportConfig,
      filters: [...reportConfig.filters, { field: '', operator: 'eq', value: '' }]
    });
  };

  const updateFilter = (index: number, filter: ReportFilter) => {
    const newFilters = [...reportConfig.filters];
    newFilters[index] = filter;
    setReportConfig({ ...reportConfig, filters: newFilters });
  };

  const removeFilter = (index: number) => {
    setReportConfig({
      ...reportConfig,
      filters: reportConfig.filters.filter((_, i) => i !== index)
    });
  };

  if (loading && activeTab === 'reports') {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-champagne" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="glass-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-serif text-pearl flex items-center gap-3">
                <BarChart3 className="w-6 h-6 text-champagne" />
                Custom Report Builder
              </CardTitle>
              <p className="text-pearl/60 mt-2">
                Create custom reports with drag-and-drop interface
              </p>
            </div>
            <Button
              onClick={() => {
                resetForm();
                setDialogOpen(true);
              }}
              className="bg-champagne text-charcoal hover:bg-champagne/90"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Report
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList className="glass-card p-1">
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            My Reports ({reports.length})
          </TabsTrigger>
          <TabsTrigger value="builder" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Report Builder
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <Copy className="w-4 h-4" />
            Templates
          </TabsTrigger>
        </TabsList>

        <TabsContent value="reports" className="space-y-4">
          <div className="grid gap-4">
            {reports.map((report) => (
              <Card key={report.id} className="glass-card">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-medium text-pearl">{report.name}</h3>
                        {report.is_public && (
                          <Badge variant="outline" className="border-champagne/30 text-champagne">
                            Public
                          </Badge>
                        )}
                      </div>
                      <p className="text-pearl/60 mb-3">{report.description}</p>
                      <div className="flex items-center gap-4 text-sm text-pearl/40">
                        <span>{report.query_config.fields.length} fields</span>
                        <span>{report.query_config.filters.length} filters</span>
                        <span>Created {new Date(report.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setPreviewReport(report);
                          setPreviewDialogOpen(true);
                        }}
                        className="text-pearl hover:bg-pearl/10"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setEditingReport(report);
                          setReportConfig(report.query_config);
                          setVisualizationConfig(report.visualization_config);
                          setDialogOpen(true);
                        }}
                        className="text-pearl hover:bg-pearl/10"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteReport(report.id)}
                        className="text-red-400 hover:bg-red-400/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="builder" className="space-y-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-pearl">Configure Report</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-pearl/70">Report Name</Label>
                  <Input
                    value={reportConfig.name}
                    onChange={(e) => setReportConfig({ ...reportConfig, name: e.target.value })}
                    className="bg-cocoa/20 border-pearl/20 text-pearl"
                    placeholder="Enter report name"
                  />
                </div>
                <div>
                  <Label className="text-pearl/70">Description</Label>
                  <Input
                    value={reportConfig.description}
                    onChange={(e) => setReportConfig({ ...reportConfig, description: e.target.value })}
                    className="bg-cocoa/20 border-pearl/20 text-pearl"
                    placeholder="Brief description"
                  />
                </div>
              </div>

              <div>
                <Label className="text-pearl/70">Select Fields</Label>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {AVAILABLE_FIELDS.filter(f => f.type === 'dimension').map(field => (
                    <label key={field.name} className="flex items-center gap-2 p-2 rounded hover:bg-cocoa/20 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={reportConfig.fields.includes(field.name)}
                        onChange={(e) => {
                          const newFields = e.target.checked
                            ? [...reportConfig.fields, field.name]
                            : reportConfig.fields.filter(f => f !== field.name);
                          setReportConfig({ ...reportConfig, fields: newFields });
                        }}
                      />
                      <span className="text-sm text-pearl">{field.label}</span>
                    </label>
                  ))}
                </div>
                <div className="mt-2">
                  <p className="text-xs text-pearl/50 mb-2">Metrics:</p>
                  <div className="grid grid-cols-2 gap-2">
                    {AVAILABLE_FIELDS.filter(f => f.type === 'metric').map(field => (
                      <label key={field.name} className="flex items-center gap-2 p-2 rounded hover:bg-cocoa/20 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={reportConfig.fields.includes(field.name)}
                          onChange={(e) => {
                            const newFields = e.target.checked
                              ? [...reportConfig.fields, field.name]
                              : reportConfig.fields.filter(f => f !== field.name);
                            setReportConfig({ ...reportConfig, fields: newFields });
                          }}
                        />
                        <span className="text-sm text-pearl">{field.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-pearl/70">Filters</Label>
                  <Button size="sm" variant="outline" onClick={addFilter}>
                    <Plus className="w-4 h-4 mr-1" />
                    Add Filter
                  </Button>
                </div>
                <div className="space-y-2">
                  {reportConfig.filters.map((filter, index) => (
                    <div key={index} className="flex gap-2">
                      <Select
                        value={filter.field}
                        onValueChange={(value) => updateFilter(index, { ...filter, field: value })}
                      >
                        <SelectTrigger className="bg-cocoa/20 border-pearl/20 text-pearl">
                          <SelectValue placeholder="Field" />
                        </SelectTrigger>
                        <SelectContent>
                          {AVAILABLE_FIELDS.map(field => (
                            <SelectItem key={field.name} value={field.name}>
                              {field.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select
                        value={filter.operator}
                        onValueChange={(value: any) => updateFilter(index, { ...filter, operator: value })}
                      >
                        <SelectTrigger className="bg-cocoa/20 border-pearl/20 text-pearl w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="eq">Equals</SelectItem>
                          <SelectItem value="ne">Not equals</SelectItem>
                          <SelectItem value="gt">Greater than</SelectItem>
                          <SelectItem value="gte">Greater or equal</SelectItem>
                          <SelectItem value="lt">Less than</SelectItem>
                          <SelectItem value="lte">Less or equal</SelectItem>
                          <SelectItem value="like">Contains</SelectItem>
                          <SelectItem value="in">In list</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        value={filter.value}
                        onChange={(e) => updateFilter(index, { ...filter, value: e.target.value })}
                        className="bg-cocoa/20 border-pearl/20 text-pearl"
                        placeholder="Value"
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeFilter(index)}
                        className="text-red-400 hover:bg-red-400/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-pearl/70">Group By</Label>
                  <Select
                    value={reportConfig.groupBy?.[0] || ''}
                    onValueChange={(value) => setReportConfig({ ...reportConfig, groupBy: value ? [value] : [] })}
                  >
                    <SelectTrigger className="bg-cocoa/20 border-pearl/20 text-pearl">
                      <SelectValue placeholder="Select field to group by" />
                    </SelectTrigger>
                    <SelectContent>
                      {AVAILABLE_FIELDS.filter(f => f.type === 'dimension').map(field => (
                        <SelectItem key={field.name} value={field.name}>
                          {field.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-pearl/70">Limit Results</Label>
                  <Input
                    type="number"
                    value={reportConfig.limit}
                    onChange={(e) => setReportConfig({ ...reportConfig, limit: parseInt(e.target.value) || 100 })}
                    className="bg-cocoa/20 border-pearl/20 text-pearl"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  onClick={handleRunReport}
                  disabled={loading || !reportConfig.fields.length}
                  className="bg-champagne text-charcoal hover:bg-champagne/90"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Run Report
                </Button>
                <Button
                  onClick={handleSaveReport}
                  variant="outline"
                  className="border-pearl/20 text-pearl hover:bg-cocoa/50"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Report
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {REPORT_TEMPLATES.map((template, index) => (
              <Card key={index} className="glass-card cursor-pointer hover:bg-cocoa/10" onClick={() => handleUseTemplate(template)}>
                <CardContent className="p-6">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-champagne/20 rounded-lg">
                      <BarChart3 className="w-5 h-5 text-champagne" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-pearl mb-1">{template.name}</h3>
                      <p className="text-sm text-pearl/60 mb-2">{template.description}</p>
                      <div className="flex items-center gap-2 text-xs text-pearl/40">
                        <span>{template.config.fields.length} fields</span>
                        <span>•</span>
                        <span>{template.config.filters.length} filters</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Report Preview Dialog */}
      <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
        <DialogContent className="glass-card max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-serif text-pearl">
              {previewReport ? previewReport.name : 'Report Preview'}
            </DialogTitle>
          </DialogHeader>

          {(previewReport || reportData.length > 0) && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Badge variant="outline">
                    {reportData.length} records
                  </Badge>
                  <Badge variant="outline">
                    {visualizationConfig.type}
                  </Badge>
                </div>
                <Button
                  variant="outline"
                  className="border-pearl/20 text-pearl hover:bg-cocoa/50"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>

              {/* Table View */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-pearl/10">
                      {(previewReport ? previewReport.query_config.fields : reportConfig.fields).map((field: string) => (
                        <th key={field} className="text-left p-3 text-pearl/70 text-sm font-medium">
                          {AVAILABLE_FIELDS.find(f => f.name === field)?.label || field}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.slice(0, 10).map((row, index) => (
                      <tr key={index} className="border-b border-pearl/5">
                        {(previewReport ? previewReport.query_config.fields : reportConfig.fields).map((field: string) => (
                          <td key={field} className="p-3 text-pearl/80 text-sm">
                            {row[field] || '-'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {reportData.length > 10 && (
                <p className="text-sm text-pearl/40 text-center">
                  Showing 10 of {reportData.length} records
                </p>
              )}

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setPreviewDialogOpen(false)}
                  className="flex-1 border-pearl/20 text-pearl hover:bg-cocoa/50"
                >
                  Close
                </Button>
                {!previewReport && (
                  <Button
                    onClick={handleSaveReport}
                    className="flex-1 bg-champagne text-charcoal hover:bg-champagne/90"
                  >
                    Save Report
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ReportBuilder;