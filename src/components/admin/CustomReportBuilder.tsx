import React, { useState, useCallback } from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Treemap,
  ComposedChart
} from 'recharts';
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult
} from 'react-beautiful-dnd';
import {
  BarChart3,
  LineChart as LineChartIcon,
  PieChart as PieChartIcon,
  TrendingUp,
  Users,
  Calendar,
  DollarSign,
  Download,
  Save,
  Play,
  Settings,
  Eye,
  Trash2,
  GripVertical,
  Plus,
  Filter,
  FileText,
  Image,
  Mail,
  Share
} from 'lucide-react';
import { format, subDays } from 'date-fns';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';

// Types for Report Builder
interface ReportMetric {
  id: string;
  name: string;
  type: 'revenue' | 'bookings' | 'customers' | 'performance' | 'engagement';
  aggregation: 'sum' | 'avg' | 'count' | 'min' | 'max';
  format: 'currency' | 'number' | 'percentage';
  description: string;
}

interface ReportDimension {
  id: string;
  name: string;
  type: 'time' | 'category' | 'location' | 'demographic';
  values: string[];
  description: string;
}

interface ReportFilter {
  id: string;
  field: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'in_range';
  value: any;
  label: string;
}

interface ReportVisualization {
  id: string;
  type: 'line' | 'bar' | 'pie' | 'scatter' | 'radar' | 'treemap' | 'area' | 'composed';
  title: string;
  x: string;
  y: string;
  category?: string;
  config: Record<string, any>;
}

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  metrics: string[];
  dimensions: string[];
  visualizations: ReportVisualization[];
  filters: ReportFilter[];
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

const ReportBuilder: React.FC = () => {
  const [activeTab, setActiveTab] = useState('build');
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([]);
  const [selectedDimensions, setSelectedDimensions] = useState<string[]>([]);
  const [filters, setFilters] = useState<ReportFilter[]>([]);
  const [visualizations, setVisualizations] = useState<ReportVisualization[]>([]);
  const [reportData, setReportData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [reportName, setReportName] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [dateRange, setDateRange] = useState({
    from: subDays(new Date(), 30),
    to: new Date()
  });
  const { toast } = useToast();

  // Available metrics and dimensions
  const availableMetrics: ReportMetric[] = [
    {
      id: 'revenue',
      name: 'Revenue',
      type: 'revenue',
      aggregation: 'sum',
      format: 'currency',
      description: 'Total revenue from bookings'
    },
    {
      id: 'bookings_count',
      name: 'Number of Bookings',
      type: 'bookings',
      aggregation: 'count',
      format: 'number',
      description: 'Total count of bookings'
    },
    {
      id: 'avg_booking_value',
      name: 'Average Booking Value',
      type: 'revenue',
      aggregation: 'avg',
      format: 'currency',
      description: 'Average revenue per booking'
    },
    {
      id: 'new_customers',
      name: 'New Customers',
      type: 'customers',
      aggregation: 'count',
      format: 'number',
      description: 'Count of new customer accounts'
    },
    {
      id: 'conversion_rate',
      name: 'Conversion Rate',
      type: 'performance',
      aggregation: 'avg',
      format: 'percentage',
      description: 'Booking conversion rate'
    },
    {
      id: 'occupancy_rate',
      name: 'Occupancy Rate',
      type: 'performance',
      aggregation: 'avg',
      format: 'percentage',
      description: 'Time slot occupancy percentage'
    },
    {
      id: 'customer_satisfaction',
      name: 'Customer Satisfaction',
      type: 'engagement',
      aggregation: 'avg',
      format: 'number',
      description: 'Average customer rating'
    }
  ];

  const availableDimensions: ReportDimension[] = [
    {
      id: 'time_month',
      name: 'Month',
      type: 'time',
      values: [],
      description: 'Group by month'
    },
    {
      id: 'time_week',
      name: 'Week',
      type: 'time',
      values: [],
      description: 'Group by week'
    },
    {
      id: 'time_day',
      name: 'Day',
      type: 'time',
      values: [],
      description: 'Group by day'
    },
    {
      id: 'service_category',
      name: 'Service Category',
      type: 'category',
      values: ['beauty', 'fitness', 'lifestyle'],
      description: 'Group by service category'
    },
    {
      id: 'location',
      name: 'Location',
      type: 'location',
      values: ['Warsaw', 'Krakow', 'Gdansk'],
      description: 'Group by location'
    },
    {
      id: 'customer_type',
      name: 'Customer Type',
      type: 'demographic',
      values: ['new', 'returning', 'vip'],
      description: 'Group by customer segment'
    }
  ];

  // Report templates
  const reportTemplates: ReportTemplate[] = [
    {
      id: 'revenue_overview',
      name: 'Revenue Overview',
      description: 'Monthly revenue breakdown with forecasting',
      metrics: ['revenue', 'bookings_count', 'avg_booking_value'],
      dimensions: ['time_month'],
      visualizations: [
        {
          id: 'rev_trend',
          type: 'line',
          title: 'Revenue Trend',
          x: 'time_month',
          y: 'revenue',
          config: {}
        }
      ],
      filters: [],
      isDefault: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'service_performance',
      name: 'Service Performance',
      description: 'Performance metrics by service category',
      metrics: ['revenue', 'bookings_count', 'conversion_rate'],
      dimensions: ['service_category'],
      visualizations: [
        {
          id: 'perf_bar',
          type: 'bar',
          title: 'Performance by Category',
          x: 'service_category',
          y: 'revenue',
          config: {}
        }
      ],
      filters: [],
      isDefault: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  const COLORS = ['#8B4513', '#F5DEB3', '#D2691E', '#DEB887', '#BC8F8F', '#F4A460'];

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(selectedMetrics);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setSelectedMetrics(items);
  };

  const addMetric = (metricId: string) => {
    if (!selectedMetrics.includes(metricId)) {
      setSelectedMetrics([...selectedMetrics, metricId]);
    }
  };

  const removeMetric = (metricId: string) => {
    setSelectedMetrics(selectedMetrics.filter(id => id !== metricId));
  };

  const addDimension = (dimensionId: string) => {
    if (!selectedDimensions.includes(dimensionId)) {
      setSelectedDimensions([...selectedDimensions, dimensionId]);
    }
  };

  const removeDimension = (dimensionId: string) => {
    setSelectedDimensions(selectedDimensions.filter(id => id !== dimensionId));
  };

  const addFilter = () => {
    const newFilter: ReportFilter = {
      id: Date.now().toString(),
      field: 'time_month',
      operator: 'in_range',
      value: '',
      label: 'Time Range'
    };
    setFilters([...filters, newFilter]);
  };

  const removeFilter = (filterId: string) => {
    setFilters(filters.filter(f => f.id !== filterId));
  };

  const updateFilter = (filterId: string, updates: Partial<ReportFilter>) => {
    setFilters(filters.map(f =>
      f.id === filterId ? { ...f, ...updates } : f
    ));
  };

  const addVisualization = (type: ReportVisualization['type']) => {
    const newViz: ReportVisualization = {
      id: Date.now().toString(),
      type,
      title: `${type.charAt(0).toUpperCase() + type.slice(1)} Chart`,
      x: selectedDimensions[0] || 'time_month',
      y: selectedMetrics[0] || 'revenue',
      category: selectedDimensions[1],
      config: {}
    };
    setVisualizations([...visualizations, newViz]);
  };

  const removeVisualization = (vizId: string) => {
    setVisualizations(visualizations.filter(v => v.id !== vizId));
  };

  const generateReport = async () => {
    setLoading(true);
    try {
      // Simulate report data generation
      const mockData = Array.from({ length: 30 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (29 - i));

        return {
          date: format(date, 'yyyy-MM-dd'),
          time_month: format(date, 'MMM yyyy'),
          time_week: `Week ${Math.ceil((date.getDate() + new Date(date.getFullYear(), date.getMonth(), 1).getDay()) / 7)}`,
          time_day: format(date, 'MMM dd'),
          service_category: ['beauty', 'fitness', 'lifestyle'][Math.floor(Math.random() * 3)],
          location: ['Warsaw', 'Krakow', 'Gdansk'][Math.floor(Math.random() * 3)],
          customer_type: ['new', 'returning', 'vip'][Math.floor(Math.random() * 3)],
          revenue: Math.random() * 5000 + 1000,
          bookings_count: Math.floor(Math.random() * 20) + 5,
          avg_booking_value: Math.random() * 200 + 100,
          new_customers: Math.floor(Math.random() * 10) + 1,
          conversion_rate: Math.random() * 10 + 2,
          occupancy_rate: Math.random() * 40 + 60,
          customer_satisfaction: Math.random() * 1.5 + 3.5
        };
      });

      setReportData(mockData);
      setActiveTab('preview');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to generate report',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const saveReport = async () => {
    if (!reportName.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a report name',
        variant: 'destructive'
      });
      return;
    }

    const report: ReportTemplate = {
      id: Date.now().toString(),
      name: reportName,
      description: reportDescription,
      metrics: selectedMetrics,
      dimensions: selectedDimensions,
      visualizations,
      filters,
      isDefault: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // In a real implementation, save to backend
    console.log('Saving report:', report);

    toast({
      title: 'Success',
      description: 'Report saved successfully'
    });
  };

  const exportReport = (format: 'json' | 'csv' | 'pdf') => {
    const exportData = {
      name: reportName,
      description: reportDescription,
      metrics: selectedMetrics,
      dimensions: selectedDimensions,
      filters,
      visualizations,
      data: reportData,
      generatedAt: new Date().toISOString()
    };

    switch (format) {
      case 'json':
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        downloadFile(blob, `${reportName.replace(/\s+/g, '_')}_${format(new Date(), 'yyyy-MM-dd')}.json`);
        break;
      case 'csv':
        // Generate CSV
        const csv = generateCSV(reportData);
        const csvBlob = new Blob([csv], { type: 'text/csv' });
        downloadFile(csvBlob, `${reportName.replace(/\s+/g, '_')}_${format(new Date(), 'yyyy-MM-dd')}.csv`);
        break;
      case 'pdf':
        toast({
          title: 'Coming Soon',
          description: 'PDF export will be available soon'
        });
        break;
    }
  };

  const downloadFile = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const generateCSV = (data: any[]): string => {
    if (data.length === 0) return '';

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => row[header]).join(','))
    ].join('\n');

    return csvContent;
  };

  const renderChart = (visualization: ReportVisualization) => {
    const { type, x, y, category, title } = visualization;

    switch (type) {
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={reportData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#424242" />
              <XAxis dataKey={x} stroke="#F5F1ED" />
              <YAxis stroke="#F5F1ED" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1A1412",
                  border: "1px solid #424242",
                  borderRadius: "8px",
                }}
              />
              <Legend />
              <Line type="monotone" dataKey={y} stroke="#D4A574" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        );

      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={reportData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#424242" />
              <XAxis dataKey={x} stroke="#F5F1ED" />
              <YAxis stroke="#F5F1ED" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1A1412",
                  border: "1px solid #424242",
                  borderRadius: "8px",
                }}
              />
              <Legend />
              <Bar dataKey={y} fill="#D4A574" />
            </BarChart>
          </ResponsiveContainer>
        );

      case 'pie':
        const pieData = reportData.reduce((acc: any[], item) => {
          const existing = acc.find(a => a.name === item[x]);
          if (existing) {
            existing.value += Number(item[y]) || 0;
          } else {
            acc.push({ name: item[x], value: Number(item[y]) || 0 });
          }
          return acc;
        }, []);

        return (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        );

      case 'area':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={reportData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#424242" />
              <XAxis dataKey={x} stroke="#F5F1ED" />
              <YAxis stroke="#F5F1ED" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1A1412",
                  border: "1px solid #424242",
                  borderRadius: "8px",
                }}
              />
              <Area type="monotone" dataKey={y} stroke="#D4A574" fill="#F5DEB3" />
            </AreaChart>
          </ResponsiveContainer>
        );

      default:
        return (
          <div className="flex items-center justify-center h-64 text-champagne/50">
            Chart type "{type}" not implemented
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-charcoal p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-serif text-pearl flex items-center gap-3">
              <FileText className="w-10 h-10 text-champagne" />
              Custom Report Builder
            </h1>
            <p className="text-champagne/70 mt-2">
              Build custom reports with drag-and-drop interface and advanced visualizations
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={saveReport}
              variant="outline"
              className="border-graphite/50 hover:bg-champagne/10"
              disabled={!reportName.trim()}
            >
              <Save className="w-4 h-4 mr-2" />
              Save Report
            </Button>
            <Button
              onClick={generateReport}
              className="bg-champagne text-charcoal hover:bg-champagne/90"
              disabled={selectedMetrics.length === 0 || loading}
            >
              <Play className="w-4 h-4 mr-2" />
              {loading ? 'Generating...' : 'Generate Report'}
            </Button>
          </div>
        </div>

        {/* Report Configuration */}
        <Card className="bg-charcoal/50 border-graphite/30">
          <CardHeader>
            <CardTitle className="text-pearl">Report Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="reportName" className="text-champagne">Report Name</Label>
                <Input
                  id="reportName"
                  value={reportName}
                  onChange={(e) => setReportName(e.target.value)}
                  placeholder="Enter report name"
                  className="bg-charcoal border-graphite/50"
                />
              </div>
              <div>
                <Label htmlFor="reportDescription" className="text-champagne">Description</Label>
                <Input
                  id="reportDescription"
                  value={reportDescription}
                  onChange={(e) => setReportDescription(e.target.value)}
                  placeholder="Enter report description"
                  className="bg-charcoal border-graphite/50"
                />
              </div>
            </div>
            <div>
              <Label className="text-champagne">Date Range</Label>
              <DatePickerWithRange
                value={dateRange}
                onChange={setDateRange}
                className="bg-charcoal border-graphite/50"
              />
            </div>
          </CardContent>
        </Card>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-charcoal/50 border-graphite/30">
            <TabsTrigger value="build" className="data-[state=active]:bg-champagne/20">
              <Plus className="w-4 h-4 mr-2" />
              Build
            </TabsTrigger>
            <TabsTrigger value="preview" className="data-[state=active]:bg-champagne/20" disabled={reportData.length === 0}>
              <Eye className="w-4 h-4 mr-2" />
              Preview
            </TabsTrigger>
            <TabsTrigger value="templates" className="data-[state=active]:bg-champagne/20">
              <FileText className="w-4 h-4 mr-2" />
              Templates
            </TabsTrigger>
            <TabsTrigger value="export" className="data-[state=active]:bg-champagne/20" disabled={reportData.length === 0}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </TabsTrigger>
          </TabsList>

          {/* Build Tab */}
          <TabsContent value="build" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Metrics Selection */}
              <Card className="bg-charcoal/50 border-graphite/30">
                <CardHeader>
                  <CardTitle className="text-pearl">Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Available Metrics */}
                    <div>
                      <Label className="text-champagne/70 text-sm">Available Metrics</Label>
                      <div className="grid grid-cols-1 gap-2 mt-2">
                        {availableMetrics.map((metric) => (
                          <div
                            key={metric.id}
                            className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                              selectedMetrics.includes(metric.id)
                                ? 'bg-champagne/20 border-champagne/50'
                                : 'bg-charcoal/30 border-graphite/30 hover:border-champagne/30'
                            }`}
                            onClick={() => addMetric(metric.id)}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-pearl font-medium">{metric.name}</p>
                                <p className="text-champagne/50 text-xs">{metric.description}</p>
                              </div>
                              <Badge className="bg-champagne/20 text-champagne text-xs">
                                {metric.type}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Selected Metrics */}
                    {selectedMetrics.length > 0 && (
                      <div>
                        <Label className="text-champagne/70 text-sm">Selected Metrics</Label>
                        <DragDropContext onDragEnd={handleDragEnd}>
                          <Droppable droppableId="metrics">
                            {(provided) => (
                              <div
                                {...provided.droppableProps}
                                ref={provided.innerRef}
                                className="space-y-2 mt-2"
                              >
                                {selectedMetrics.map((metricId, index) => {
                                  const metric = availableMetrics.find(m => m.id === metricId);
                                  if (!metric) return null;

                                  return (
                                    <Draggable key={metricId} draggableId={metricId} index={index}>
                                      {(provided, snapshot) => (
                                        <div
                                          ref={provided.innerRef}
                                          {...provided.draggableProps}
                                          className={`p-3 bg-champagne/10 rounded-lg flex items-center justify-between ${
                                            snapshot.isDragging ? 'opacity-50' : ''
                                          }`}
                                        >
                                          <div className="flex items-center gap-3">
                                            <div {...provided.dragHandleProps}>
                                              <GripVertical className="w-4 h-4 text-champagne/50" />
                                            </div>
                                            <span className="text-pearl">{metric.name}</span>
                                          </div>
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => removeMetric(metricId)}
                                            className="text-red-400 hover:text-red-300"
                                          >
                                            <Trash2 className="w-4 h-4" />
                                          </Button>
                                        </div>
                                      )}
                                    </Draggable>
                                  );
                                })}
                                {provided.placeholder}
                              </div>
                            )}
                          </Droppable>
                        </DragDropContext>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Dimensions Selection */}
              <Card className="bg-charcoal/50 border-graphite/30">
                <CardHeader>
                  <CardTitle className="text-pearl">Dimensions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Available Dimensions */}
                    <div>
                      <Label className="text-champagne/70 text-sm">Available Dimensions</Label>
                      <div className="grid grid-cols-1 gap-2 mt-2">
                        {availableDimensions.map((dimension) => (
                          <div
                            key={dimension.id}
                            className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                              selectedDimensions.includes(dimension.id)
                                ? 'bg-champagne/20 border-champagne/50'
                                : 'bg-charcoal/30 border-graphite/30 hover:border-champagne/30'
                            }`}
                            onClick={() => addDimension(dimension.id)}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-pearl font-medium">{dimension.name}</p>
                                <p className="text-champagne/50 text-xs">{dimension.description}</p>
                              </div>
                              <Badge className="bg-champagne/20 text-champagne text-xs">
                                {dimension.type}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Selected Dimensions */}
                    {selectedDimensions.length > 0 && (
                      <div>
                        <Label className="text-champagne/70 text-sm">Selected Dimensions</Label>
                        <div className="space-y-2 mt-2">
                          {selectedDimensions.map((dimensionId) => {
                            const dimension = availableDimensions.find(d => d.id === dimensionId);
                            if (!dimension) return null;

                            return (
                              <div
                                key={dimensionId}
                                className="p-3 bg-champagne/10 rounded-lg flex items-center justify-between"
                              >
                                <span className="text-pearl">{dimension.name}</span>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => removeDimension(dimensionId)}
                                  className="text-red-400 hover:text-red-300"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filters */}
            <Card className="bg-charcoal/50 border-graphite/30">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-pearl">Filters</CardTitle>
                  <Button size="sm" onClick={addFilter} className="bg-champagne text-charcoal">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Filter
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {filters.length === 0 ? (
                  <p className="text-champagne/50 text-center py-8">No filters added</p>
                ) : (
                  <div className="space-y-4">
                    {filters.map((filter) => (
                      <div key={filter.id} className="flex items-center gap-4 p-4 bg-champagne/10 rounded-lg">
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                          <Select
                            value={filter.field}
                            onValueChange={(value) => updateFilter(filter.id, { field: value })}
                          >
                            <SelectTrigger className="bg-charcoal border-graphite/50">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="time_month">Time Period</SelectItem>
                              <SelectItem value="service_category">Service Category</SelectItem>
                              <SelectItem value="location">Location</SelectItem>
                              <SelectItem value="customer_type">Customer Type</SelectItem>
                            </SelectContent>
                          </Select>
                          <Select
                            value={filter.operator}
                            onValueChange={(value: any) => updateFilter(filter.id, { operator: value })}
                          >
                            <SelectTrigger className="bg-charcoal border-graphite/50">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="equals">Equals</SelectItem>
                              <SelectItem value="not_equals">Not Equals</SelectItem>
                              <SelectItem value="greater_than">Greater Than</SelectItem>
                              <SelectItem value="less_than">Less Than</SelectItem>
                              <SelectItem value="contains">Contains</SelectItem>
                              <SelectItem value="in_range">In Range</SelectItem>
                            </SelectContent>
                          </Select>
                          <Input
                            value={filter.value}
                            onChange={(e) => updateFilter(filter.id, { value: e.target.value })}
                            placeholder="Filter value"
                            className="bg-charcoal border-graphite/50"
                          />
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeFilter(filter.id)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Visualizations */}
            <Card className="bg-charcoal/50 border-graphite/30">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-pearl">Visualizations</CardTitle>
                  <div className="flex gap-2">
                    {['line', 'bar', 'pie', 'area'].map((type) => (
                      <Button
                        key={type}
                        size="sm"
                        variant="outline"
                        onClick={() => addVisualization(type as ReportVisualization['type'])}
                        className="border-graphite/50 hover:bg-champagne/10"
                        disabled={selectedMetrics.length === 0}
                      >
                        {type === 'line' && <LineChartIcon className="w-4 h-4 mr-2" />}
                        {type === 'bar' && <BarChart3 className="w-4 h-4 mr-2" />}
                        {type === 'pie' && <PieChartIcon className="w-4 h-4 mr-2" />}
                        {type === 'area' && <TrendingUp className="w-4 h-4 mr-2" />}
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {visualizations.length === 0 ? (
                  <p className="text-champagne/50 text-center py-8">Add visualizations to display your data</p>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {visualizations.map((viz) => (
                      <Card key={viz.id} className="bg-charcoal/30 border-graphite/20">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-pearl text-lg">{viz.title}</CardTitle>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => removeVisualization(viz.id)}
                              className="text-red-400 hover:text-red-300"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent>
                          {renderChart(viz)}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Preview Tab */}
          <TabsContent value="preview" className="space-y-6">
            {reportData.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {visualizations.map((viz) => (
                  <Card key={viz.id} className="bg-charcoal/50 border-graphite/30">
                    <CardHeader>
                      <CardTitle className="text-pearl">{viz.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {renderChart(viz)}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="bg-charcoal/50 border-graphite/30">
                <CardContent className="text-center py-12">
                  <Eye className="w-16 h-16 mx-auto mb-4 text-champagne/50" />
                  <h3 className="text-xl font-serif text-pearl mb-2">No Data to Preview</h3>
                  <p className="text-champagne/70 mb-6">
                    Generate a report to see the preview
                  </p>
                  <Button onClick={() => setActiveTab('build')} className="bg-champagne text-charcoal">
                    Go to Build
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Templates Tab */}
          <TabsContent value="templates" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {reportTemplates.map((template) => (
                <Card key={template.id} className="bg-charcoal/50 border-graphite/30 cursor-pointer hover:border-champagne/50 transition-colors">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-pearl">{template.name}</CardTitle>
                      {template.isDefault && (
                        <Badge className="bg-champagne/20 text-champagne">Default</Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-champagne/70 text-sm mb-4">{template.description}</p>
                    <div className="flex items-center justify-between text-xs text-champagne/50">
                      <span>{template.metrics.length} metrics</span>
                      <span>{template.dimensions.length} dimensions</span>
                      <span>{template.visualizations.length} charts</span>
                    </div>
                    <Button
                      size="sm"
                      className="w-full mt-4 bg-champagne text-charcoal hover:bg-champagne/90"
                      onClick={() => {
                        setReportName(template.name);
                        setReportDescription(template.description);
                        setSelectedMetrics(template.metrics);
                        setSelectedDimensions(template.dimensions);
                        setVisualizations(template.visualizations);
                        setFilters(template.filters);
                        setActiveTab('build');
                      }}
                    >
                      Use Template
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Export Tab */}
          <TabsContent value="export" className="space-y-6">
            <Card className="bg-charcoal/50 border-graphite/30">
              <CardHeader>
                <CardTitle className="text-pearl">Export Options</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Button
                    variant="outline"
                    className="border-graphite/50 hover:bg-champagne/10 h-24 flex-col"
                    onClick={() => exportReport('json')}
                  >
                    <FileText className="w-8 h-8 mb-2" />
                    <span>Export as JSON</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="border-graphite/50 hover:bg-champagne/10 h-24 flex-col"
                    onClick={() => exportReport('csv')}
                  >
                    <Download className="w-8 h-8 mb-2" />
                    <span>Export as CSV</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="border-graphite/50 hover:bg-champagne/10 h-24 flex-col"
                    onClick={() => exportReport('pdf')}
                  >
                    <Image className="w-8 h-8 mb-2" alt="" />
                    <span>Export as PDF (Coming Soon)</span>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Share Options */}
            <Card className="bg-charcoal/50 border-graphite/30">
              <CardHeader>
                <CardTitle className="text-pearl">Share Report</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Button
                    variant="outline"
                    className="border-graphite/50 hover:bg-champagne/10"
                    onClick={() => {
                      // Generate shareable link
                      const shareUrl = `${window.location.origin}/reports/shared/${Date.now()}`;
                      navigator.clipboard.writeText(shareUrl);
                      toast({
                        title: 'Link Copied',
                        description: 'Shareable link copied to clipboard'
                      });
                    }}
                  >
                    <Share className="w-4 h-4 mr-2" />
                    Generate Share Link
                  </Button>
                  <Button
                    variant="outline"
                    className="border-graphite/50 hover:bg-champagne/10"
                    onClick={() => {
                      // Email report
                      toast({
                        title: 'Coming Soon',
                        description: 'Email sharing will be available soon'
                      });
                    }}
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Send via Email
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ReportBuilder;