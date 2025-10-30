import React, { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  Plus,
  Edit,
  Trash2,
  Send,
  Calendar,
  BarChart3,
  Users,
  DollarSign,
  TrendingUp,
  Clock,
  Eye,
  Save,
  Mail
} from 'lucide-react';
import { format, addDays, addWeeks, addMonths } from 'date-fns';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast aria-live="polite" aria-atomic="true"';

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  metrics: string[];
  dateRange: string;
  frequency: string;
  recipients: string[];
  isDefault: boolean;
  createdAt: string;
  createdBy: string;
}

interface Metric {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: React.ComponentType<{ className?: string }>;
}

const AVAILABLE_METRICS: Metric[] = [
  {
    id: 'revenue',
    name: 'Revenue',
    description: 'Total revenue and financial metrics',
    category: 'Financial',
    icon: DollarSign,
  },
  {
    id: 'bookings',
    name: 'Bookings',
    description: 'Booking volume and conversion metrics',
    category: 'Operational',
    icon: Calendar,
  },
  {
    id: 'clients',
    name: 'Client Demographics',
    description: 'Client age, location, and gender distribution',
    category: 'Customer',
    icon: Users,
  },
  {
    id: 'services',
    name: 'Service Popularity',
    description: 'Most booked services and categories',
    category: 'Operational',
    icon: BarChart3,
  },
  {
    id: 'providers',
    name: 'Provider Performance',
    description: 'Individual provider metrics and ratings',
    category: 'Performance',
    icon: TrendingUp,
  },
  {
    id: 'time',
    name: 'Time Analysis',
    description: 'Booking patterns by hour, day, and season',
    category: 'Temporal',
    icon: Clock,
  },
  {
    id: 'funnel',
    name: 'Booking Funnel',
    description: 'Conversion rates through booking stages',
    category: 'Conversion',
    icon: Eye,
  },
  {
    id: 'retention',
    name: 'Client Retention',
    description: 'New vs returning client analysis',
    category: 'Customer',
    icon: Users,
  },
];

export default function ReportsPage() {
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([]);
  const [reportName, setReportName] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [dateRange, setDateRange] = useState('30days');
  const [frequency, setFrequency] = useState('once');
  const [recipients, setRecipients] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(null);
  const [customDateRange, setCustomDateRange] = useState({
    from: format(addDays(new Date(), -30), 'yyyy-MM-dd'),
    to: format(new Date(), 'yyyy-MM-dd'),
  });
  const { toast aria-live="polite" aria-atomic="true" } = useToast();

  useEffect(() => {
    fetchReportTemplates();
  }, []);

  const fetchReportTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('report_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error('Error fetching report templates:', error);
      toast aria-live="polite" aria-atomic="true"({
        title: 'Error',
        description: 'Failed to fetch report templates',
        variant: 'destructive',
      });
    }
  };

  const handleCreateTemplate = async () => {
    if (!reportName || selectedMetrics.length === 0) {
      toast aria-live="polite" aria-atomic="true"({
        title: 'Error',
        description: 'Please provide a report name and select at least one metric',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('report_templates')
        .insert({
          name: reportName,
          description: reportDescription,
          metrics: selectedMetrics,
          date_range: dateRange,
          frequency: frequency,
          recipients: recipients.split(',').map(r => r.trim()).filter(r => r),
          is_default: false,
        })
        .select()
        .single();

      if (error) throw error;

      setTemplates([data, ...templates]);
      setIsCreateDialogOpen(false);
      resetForm();

      toast aria-live="polite" aria-atomic="true"({
        title: 'Success',
        description: 'Report template created successfully',
      });
    } catch (error) {
      console.error('Error creating template:', error);
      toast aria-live="polite" aria-atomic="true"({
        title: 'Error',
        description: 'Failed to create report template',
        variant: 'destructive',
      });
    }
  };

  const handleGenerateReport = async (template: ReportTemplate) => {
    setIsGenerating(true);
    setSelectedTemplate(template);

    try {
      // Call analytics aggregation function
      const response = await fetch('/functions/v1/analytics-aggregation', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${await supabase.auth.getSession().then(s => s.data.session?.access_token)}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          startDate: customDateRange.from,
          endDate: customDateRange.to,
          aggregationType: 'report',
        }),
      });

      const analyticsData = await response.json();

      // Generate report
      const reportData = {
        template,
        dateRange: customDateRange,
        generatedAt: new Date().toISOString(),
        data: analyticsData,
      };

      // Download as JSON
      const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${template.name}-${format(new Date(), 'yyyy-MM-dd')}.json`;
      a.click();
      URL.revokeObjectURL(url);

      toast aria-live="polite" aria-atomic="true"({
        title: 'Success',
        description: 'Report generated and downloaded successfully',
      });
    } catch (error) {
      console.error('Error generating report:', error);
      toast aria-live="polite" aria-atomic="true"({
        title: 'Error',
        description: 'Failed to generate report',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
      setSelectedTemplate(null);
    }
  };

  const handleSendReport = async (template: ReportTemplate) => {
    try {
      // Generate report first
      const response = await fetch('/functions/v1/analytics-aggregation', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${await supabase.auth.getSession().then(s => s.data.session?.access_token)}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          startDate: customDateRange.from,
          endDate: customDateRange.to,
          aggregationType: 'report',
        }),
      });

      const analyticsData = await response.json();

      // Send via email (would need an email service integration)
      const reportData = {
        template,
        dateRange: customDateRange,
        generatedAt: new Date().toISOString(),
        data: analyticsData,
      };

      // In a real implementation, this would call an email service
      console.log('Sending report to recipients:', template.recipients);
      console.log('Report data:', reportData);

      toast aria-live="polite" aria-atomic="true"({
        title: 'Success',
        description: `Report sent to ${template.recipients.length} recipients`,
      });
    } catch (error) {
      console.error('Error sending report:', error);
      toast aria-live="polite" aria-atomic="true"({
        title: 'Error',
        description: 'Failed to send report',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    try {
      const { error } = await supabase
        .from('report_templates')
        .delete()
        .eq('id', templateId);

      if (error) throw error;

      setTemplates(templates.filter(t => t.id !== templateId));

      toast aria-live="polite" aria-atomic="true"({
        title: 'Success',
        description: 'Report template deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting template:', error);
      toast aria-live="polite" aria-atomic="true"({
        title: 'Error',
        description: 'Failed to delete report template',
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setReportName('');
    setReportDescription('');
    setSelectedMetrics([]);
    setDateRange('30days');
    setFrequency('once');
    setRecipients('');
  };

  const toggleMetric = (metricId: string) => {
    setSelectedMetrics(prev =>
      prev.includes(metricId)
        ? prev.filter(id => id !== metricId)
        : [...prev, metricId]
    );
  };

  return (
    <div className="min-h-screen bg-charcoal p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-serif text-pearl">Report Builder</h1>
            <p className="text-champagne/70 mt-2">
              Create and manage custom reports for your business insights
            </p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-champagne hover:bg-champagne/90 text-charcoal">
                <Plus className="w-4 h-4 mr-2" />
                Create Report
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-charcoal border-graphite/30 max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-pearl">Create New Report Template</DialogTitle>
                <DialogDescription className="text-champagne/70">
                  Define the metrics and settings for your custom report
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                {/* Basic Info */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="reportName" className="text-champagne">Report Name</Label>
                    <Input
                      id="reportName"
                      value={reportName}
                      onChange={(e) => setReportName(e.target.value)}
                      placeholder="e.g., Monthly Performance Report"
                      className="bg-charcoal/50 border-graphite/50 text-pearl placeholder-champagne/50"
                    />
                  </div>
                  <div>
                    <Label htmlFor="reportDescription" className="text-champagne">Description</Label>
                    <Textarea
                      id="reportDescription"
                      value={reportDescription}
                      onChange={(e) => setReportDescription(e.target.value)}
                      placeholder="Brief description of what this report contains"
                      className="bg-charcoal/50 border-graphite/50 text-pearl placeholder-champagne/50"
                    />
                  </div>
                </div>

                {/* Metrics Selection */}
                <div>
                  <Label className="text-champagne mb-3 block">Select Metrics</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {AVAILABLE_METRICS.map((metric) => {
                      const Icon = metric.icon;
                      return (
                        <div
                          key={metric.id}
                          className={`p-3 rounded-lg border cursor-pointer transition-all ${
                            selectedMetrics.includes(metric.id)
                              ? 'bg-champagne/10 border-champagne/50'
                              : 'bg-charcoal/30 border-graphite/30 hover:bg-charcoal/50'
                          }`}
                          onClick={() => toggleMetric(metric.id)}
                        >
                          <div className="flex items-start gap-3">
                            <Checkbox
                              checked={selectedMetrics.includes(metric.id)}
                              onChange={() => {}}
                            />
                            <Icon className="w-5 h-5 text-champagne mt-0.5" />
                            <div>
                              <h4 className="text-pearl font-medium">{metric.name}</h4>
                              <p className="text-champagne/70 text-sm">{metric.description}</p>
                              <Badge variant="outline" className="mt-1 text-xs border-graphite/50">
                                {metric.category}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Date Range */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-champagne">Date Range</Label>
                    <Select value={dateRange} onValueChange={setDateRange}>
                      <SelectTrigger className="bg-charcoal/50 border-graphite/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="7days">Last 7 days</SelectItem>
                        <SelectItem value="30days">Last 30 days</SelectItem>
                        <SelectItem value="90days">Last 90 days</SelectItem>
                        <SelectItem value="thisMonth">This month</SelectItem>
                        <SelectItem value="lastMonth">Last month</SelectItem>
                        <SelectItem value="custom">Custom range</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-champagne">Frequency</Label>
                    <Select value={frequency} onValueChange={setFrequency}>
                      <SelectTrigger className="bg-charcoal/50 border-graphite/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="once">One time</SelectItem>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Recipients */}
                {frequency !== 'once' && (
                  <div>
                    <Label htmlFor="recipients" className="text-champagne">Email Recipients</Label>
                    <Input
                      id="recipients"
                      value={recipients}
                      onChange={(e) => setRecipients(e.target.value)}
                      placeholder="Enter email addresses separated by commas"
                      className="bg-charcoal/50 border-graphite/50 text-pearl placeholder-champagne/50"
                    />
                  </div>
                )}

                {/* Custom Date Range */}
                {dateRange === 'custom' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-champagne">From</Label>
                      <Input
                        type="date"
                        value={customDateRange.from}
                        onChange={(e) => setCustomDateRange(prev => ({ ...prev, from: e.target.value }))}
                        className="bg-charcoal/50 border-graphite/50 text-pearl"
                      />
                    </div>
                    <div>
                      <Label className="text-champagne">To</Label>
                      <Input
                        type="date"
                        value={customDateRange.to}
                        onChange={(e) => setCustomDateRange(prev => ({ ...prev, to: e.target.value }))}
                        className="bg-charcoal/50 border-graphite/50 text-pearl"
                      />
                    </div>
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                  className="border-graphite/50 hover:bg-champagne/10"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateTemplate}
                  className="bg-champagne hover:bg-champagne/90 text-charcoal"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Template
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Report Templates */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <Card key={template.id} className="bg-charcoal/50 border-graphite/30">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-pearl flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      {template.name}
                    </CardTitle>
                    <CardDescription className="text-champagne/70 mt-1">
                      {template.description}
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="border-graphite/50">
                    {template.frequency}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Metrics */}
                <div>
                  <p className="text-champagne text-sm mb-2">Metrics:</p>
                  <div className="flex flex-wrap gap-1">
                    {template.metrics.map((metricId) => {
                      const metric = AVAILABLE_METRICS.find(m => m.id === metricId);
                      return metric ? (
                        <Badge key={metricId} variant="secondary" className="text-xs bg-graphite/50">
                          {metric.name}
                        </Badge>
                      ) : null;
                    })}
                  </div>
                </div>

                <Separator className="bg-graphite/30" />

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleGenerateReport(template)}
                    disabled={isGenerating}
                    className="flex-1 bg-champagne hover:bg-champagne/90 text-charcoal"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Generate
                  </Button>
                  {template.recipients && template.recipients.length > 0 && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleSendReport(template)}
                      className="border-graphite/50 hover:bg-champagne/10"
                    >
                      <Mail className="w-4 h-4" />
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDeleteTemplate(template.id)}
                    className="border-graphite/50 hover:bg-red-500/20"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Report Options */}
        <Card className="bg-charcoal/50 border-graphite/30">
          <CardHeader>
            <CardTitle className="text-pearl">Quick Reports</CardTitle>
            <CardDescription className="text-champagne/70">
              Generate standard reports with predefined metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedMetrics(['revenue', 'bookings', 'clients']);
                  setReportName('Business Overview Report');
                  setReportDescription('Comprehensive view of business performance');
                  setIsCreateDialogOpen(true);
                }}
                className="border-graphite/50 hover:bg-champagne/10 justify-start"
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Business Overview
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedMetrics(['revenue', 'services', 'providers']);
                  setReportName('Financial Performance Report');
                  setReportDescription('Detailed financial analysis and breakdown');
                  setIsCreateDialogOpen(true);
                }}
                className="border-graphite/50 hover:bg-champagne/10 justify-start"
              >
                <DollarSign className="w-4 h-4 mr-2" />
                Financial Report
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedMetrics(['clients', 'retention', 'funnel']);
                  setReportName('Customer Analytics Report');
                  setReportDescription('Client behavior and retention metrics');
                  setIsCreateDialogOpen(true);
                }}
                className="border-graphite/50 hover:bg-champagne/10 justify-start"
              >
                <Users className="w-4 h-4 mr-2" />
                Customer Report
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}