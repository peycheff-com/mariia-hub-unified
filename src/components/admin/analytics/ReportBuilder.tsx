import React, { useState, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  Announcements,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import {
  restrictToParentElement,
  restrictToVerticalAxis,
} from '@dnd-kit/modifiers';
import {
  BarChart3,
  LineChart,
  PieChart,
  Table as TableIcon,
  TrendingUp,
  DollarSign,
  Users,
  Calendar,
  ShoppingCart,
  Activity,
  Download,
  Save,
  Play,
  Pause,
  RefreshCw,
  Settings,
  Plus,
  Trash2,
  Edit3,
  Copy,
  Eye,
  Filter,
  Calendar as CalendarIcon,
  Clock,
  ArrowUp,
  ArrowDown,
  Minus,
  GripVertical,
  MoreHorizontal,
  ChevronRight,
  ChevronDown,
  FolderOpen,
  FileText,
  Database,
  Calculator,
  Layers,
  Map,
  Target,
  Zap,
  Mail,
  Phone,
  MessageSquare,
  Star,
  Award,
  Package,
  Repeat,
  Timer,
  Hash,
  Percent,
  Building,
  Globe,
  Navigation,
  Image as ImageIcon,
  Type,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  Underline,
  Palette,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Button,
} from '@/components/ui/button';
import {
  Input,
} from '@/components/ui/input';
import {
  Label,
} from '@/components/ui/label';
import {
  Textarea,
} from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Badge,
} from '@/components/ui/badge';
import {
  Separator,
} from '@/components/ui/separator';
import {
  Switch,
} from '@/components/ui/switch';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ScrollArea,
} from '@/components/ui/scroll-area';

// Icons

import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

// Types
interface ReportMetric {
  id: string;
  name: string;
  type: 'revenue' | 'bookings' | 'customers' | 'services' | 'engagement' | 'conversion';
  aggregation: 'sum' | 'avg' | 'count' | 'min' | 'max';
  format: 'number' | 'currency' | 'percentage' | 'duration';
  icon: React.ReactNode;
  description: string;
}

interface ReportDimension {
  id: string;
  name: string;
  type: 'time' | 'category' | 'location' | 'demographic';
  values: string[];
}

interface ReportFilter {
  id: string;
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'between';
  value: any;
  label: string;
}

interface ReportWidget {
  id: string;
  type: 'kpi' | 'chart' | 'table' | 'text';
  title: string;
  metric?: string;
  dimensions?: string[];
  chartType?: 'line' | 'bar' | 'pie' | 'area';
  filters?: ReportFilter[];
  position: { x: number; y: number; w: number; h: number };
  config: any;
}

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  isPublic: boolean;
  widgets: ReportWidget[];
  filters: ReportFilter[];
  schedule?: {
    enabled: boolean;
    frequency: 'daily' | 'weekly' | 'monthly';
    recipients: string[];
    format: 'pdf' | 'csv' | 'excel';
  };
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

interface ReportBuilderProps {
  className?: string;
}

const availableMetrics: ReportMetric[] = [
  {
    id: 'revenue',
    name: 'Revenue',
    type: 'revenue',
    aggregation: 'sum',
    format: 'currency',
    icon: <DollarSign className="w-4 h-4" />,
    description: 'Total revenue generated',
  },
  {
    id: 'bookings',
    name: 'Total Bookings',
    type: 'bookings',
    aggregation: 'count',
    format: 'number',
    icon: <Calendar className="w-4 h-4" />,
    description: 'Number of bookings made',
  },
  {
    id: 'customers',
    name: 'New Customers',
    type: 'customers',
    aggregation: 'count',
    format: 'number',
    icon: <Users className="w-4 h-4" />,
    description: 'Number of new customers',
  },
  {
    id: 'avgOrderValue',
    name: 'Average Order Value',
    type: 'revenue',
    aggregation: 'avg',
    format: 'currency',
    icon: <ShoppingCart className="w-4 h-4" />,
    description: 'Average revenue per booking',
  },
  {
    id: 'conversionRate',
    name: 'Conversion Rate',
    type: 'conversion',
    aggregation: 'avg',
    format: 'percentage',
    icon: <Target className="w-4 h-4" />,
    description: 'Percentage of visitors who book',
  },
];

const availableDimensions: ReportDimension[] = [
  {
    id: 'date',
    name: 'Date',
    type: 'time',
    values: ['today', 'yesterday', 'last7days', 'last30days', 'last90days', 'thisMonth', 'lastMonth', 'thisYear'],
  },
  {
    id: 'service',
    name: 'Service',
    type: 'category',
    values: ['Lip Enhancement', 'Brow Lamination', 'Personal Training', 'HIIT', 'Yoga', 'Massage'],
  },
  {
    id: 'location',
    name: 'Location',
    type: 'location',
    values: ['Warsaw', 'Kraków', 'Wrocław', 'Gdańsk', 'Poznań'],
  },
  {
    id: 'source',
    name: 'Traffic Source',
    type: 'category',
    values: ['Organic', 'Direct', 'Social', 'Email', 'Referral', 'Paid'],
  },
];

export function ReportBuilder({ className }: ReportBuilderProps) {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('build');
  const [reportName, setReportName] = useState('Untitled Report');
  const [reportDescription, setReportDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('custom');
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState('');
  const [selectedDimension, setSelectedDimension] = useState('');
  const [widgets, setWidgets] = useState<ReportWidget[]>([]);
  const [filters, setFilters] = useState<ReportFilter[]>([]);
  const [draggedWidget, setDraggedWidget] = useState<ReportWidget | null>(null);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [schedule, setSchedule] = useState({
    enabled: false,
    frequency: 'weekly' as 'daily' | 'weekly' | 'monthly',
    recipients: [] as string[],
    format: 'pdf' as 'pdf' | 'csv' | 'excel',
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Fetch report templates
  const { data: templates } = useQuery({
    queryKey: ['report-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('report_templates')
        .select('*')
        .order('updatedAt', { ascending: false });

      if (error) throw error;
      return data as ReportTemplate[];
    },
  });

  // Save report template
  const saveTemplateMutation = useMutation({
    mutationFn: async (template: Partial<ReportTemplate>) => {
      const { data, error } = await supabase
        .from('report_templates')
        .insert({
          ...template,
          widgets,
          filters,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: 'current-user-id',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success(t('admin.reports.templateSaved'));
      queryClient.invalidateQueries({ queryKey: ['report-templates'] });
    },
    onError: () => {
      toast.error(t('admin.reports.saveError'));
    },
  });

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const widget = widgets.find(w => w.id === active.id);
    if (widget) {
      setDraggedWidget(widget);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setWidgets((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);

        return arrayMove(items, oldIndex, newIndex);
      });
    }

    setDraggedWidget(null);
  };

  const addWidget = (type: ReportWidget['type']) => {
    const newWidget: ReportWidget = {
      id: Math.random().toString(36).substring(2),
      type,
      title: `${type.charAt(0).toUpperCase() + type.slice(1)} Widget`,
      metric: type !== 'text' ? selectedMetric || 'revenue' : undefined,
      dimensions: type !== 'text' && selectedDimension ? [selectedDimension] : [],
      chartType: type === 'chart' ? 'bar' : undefined,
      position: { x: 0, y: widgets.length * 200, w: 4, h: 4 },
      config: {},
    };

    setWidgets([...widgets, newWidget]);
  };

  const removeWidget = (id: string) => {
    setWidgets(widgets.filter(w => w.id !== id));
  };

  const updateWidget = (id: string, updates: Partial<ReportWidget>) => {
    setWidgets(widgets.map(w => w.id === id ? { ...w, ...updates } : w));
  };

  const addFilter = () => {
    if (!selectedMetric) return;

    const newFilter: ReportFilter = {
      id: Math.random().toString(36).substring(2),
      field: selectedMetric,
      operator: 'equals',
      value: '',
      label: `${selectedMetric} filter`,
    };

    setFilters([...filters, newFilter]);
  };

  const removeFilter = (id: string) => {
    setFilters(filters.filter(f => f.id !== id));
  };

  const updateFilter = (id: string, updates: Partial<ReportFilter>) => {
    setFilters(filters.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  const loadTemplate = (template: ReportTemplate) => {
    setReportName(template.name);
    setReportDescription(template.description);
    setWidgets(template.widgets);
    setFilters(template.filters || []);
    if (template.schedule) {
      setSchedule(template.schedule);
    }
    setShowTemplateDialog(false);
    toast.success(t('admin.reports.templateLoaded'));
  };

  const saveReport = () => {
    saveTemplateMutation.mutate({
      name: reportName,
      description: reportDescription,
      category: selectedCategory,
      isPublic: false,
      schedule: schedule.enabled ? schedule : undefined,
    });
  };

  const exportReport = (format: 'pdf' | 'csv' | 'excel') => {
    toast.info(t('admin.reports.exporting', { format }));
    // Implementation would go here
  };

  const renderWidgetPreview = (widget: ReportWidget) => {
    switch (widget.type) {
      case 'kpi':
        return (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-3xl font-bold">€24,523</p>
              <p className="text-sm text-muted-foreground">Total Revenue</p>
              <div className="flex items-center justify-center gap-1 mt-2 text-green-600">
                <ArrowUp className="w-4 h-4" />
                <span className="text-sm">+12.5%</span>
              </div>
            </div>
          </div>
        );

      case 'chart':
        return (
          <div className="flex items-center justify-center h-full">
            <div className="w-full h-32 bg-muted rounded flex items-center justify-center">
              {widget.chartType === 'bar' && <BarChart3 className="w-12 h-12 text-muted-foreground" />}
              {widget.chartType === 'line' && <LineChart className="w-12 h-12 text-muted-foreground" />}
              {widget.chartType === 'pie' && <PieChart className="w-12 h-12 text-muted-foreground" />}
              <p className="text-sm text-muted-foreground ml-2">Chart Preview</p>
            </div>
          </div>
        );

      case 'table':
        return (
          <div className="p-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Service</TableHead>
                  <TableHead>Bookings</TableHead>
                  <TableHead>Revenue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>Lip Enhancement</TableCell>
                  <TableCell>45</TableCell>
                  <TableCell>€13,500</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Personal Training</TableCell>
                  <TableCell>32</TableCell>
                  <TableCell>€8,000</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        );

      case 'text':
        return (
          <div className="p-4">
            <h3 className="font-semibold mb-2">Text Widget</h3>
            <p className="text-sm text-muted-foreground">
              Add your custom text, notes, or insights here. This widget supports rich text formatting.
            </p>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <Input
            value={reportName}
            onChange={(e) => setReportName(e.target.value)}
            className="text-2xl font-bold border-none p-0 h-auto focus-visible:ring-0"
            placeholder="Untitled Report"
          />
          <Textarea
            value={reportDescription}
            onChange={(e) => setReportDescription(e.target.value)}
            placeholder="Add a description..."
            className="border-none p-0 h-auto resize-none focus-visible:ring-0"
            rows={1}
          />
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant={isPreviewMode ? "default" : "outline"}
            onClick={() => setIsPreviewMode(!isPreviewMode)}
          >
            <Eye className="w-4 h-4 mr-2" />
            {isPreviewMode ? t('admin.reports.edit') : t('admin.reports.preview')}
          </Button>
          <Button variant="outline" onClick={() => setShowTemplateDialog(true)}>
            <FolderOpen className="w-4 h-4 mr-2" />
            {t('admin.reports.templates')}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                {t('admin.reports.export')}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => exportReport('pdf')}>
                Export as PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportReport('csv')}>
                Export as CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportReport('excel')}>
                Export as Excel
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button onClick={() => setShowScheduleDialog(true)}>
            <Clock className="w-4 h-4 mr-2" />
            {t('admin.reports.schedule')}
          </Button>
          <Button onClick={saveReport}>
            <Save className="w-4 h-4 mr-2" />
            {t('admin.reports.save')}
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="build">{t('admin.reports.build')}</TabsTrigger>
          <TabsTrigger value="data">{t('admin.reports.data')}</TabsTrigger>
          <TabsTrigger value="filters">{t('admin.reports.filters')}</TabsTrigger>
          <TabsTrigger value="schedule">{t('admin.reports.schedule')}</TabsTrigger>
        </TabsList>

        {/* Build Tab */}
        <TabsContent value="build" className="space-y-6">
          <div className="grid grid-cols-12 gap-6">
            {/* Widget Panel */}
            <div className="col-span-3">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">{t('admin.reports.addWidget')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => addWidget('kpi')}
                  >
                    <TrendingUp className="w-4 h-4 mr-2" />
                    {t('admin.reports.kpiWidget')}
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => addWidget('chart')}
                  >
                    <BarChart3 className="w-4 h-4 mr-2" />
                    {t('admin.reports.chartWidget')}
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => addWidget('table')}
                  >
                    <TableIcon className="w-4 h-4 mr-2" />
                    {t('admin.reports.tableWidget')}
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => addWidget('text')}
                  >
                    <Type className="w-4 h-4 mr-2" />
                    {t('admin.reports.textWidget')}
                  </Button>
                </CardContent>
              </Card>

              {/* Metrics */}
              <Card className="mt-4">
                <CardHeader>
                  <CardTitle className="text-sm">{t('admin.reports.metrics')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <Select value={selectedMetric} onValueChange={setSelectedMetric}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('admin.reports.selectMetric')} />
                    </SelectTrigger>
                    <SelectContent>
                      {availableMetrics.map((metric) => (
                        <SelectItem key={metric.id} value={metric.id}>
                          <div className="flex items-center gap-2">
                            {metric.icon}
                            <div>
                              <p className="font-medium">{metric.name}</p>
                              <p className="text-xs text-muted-foreground">{metric.description}</p>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>

              {/* Dimensions */}
              <Card className="mt-4">
                <CardHeader>
                  <CardTitle className="text-sm">{t('admin.reports.dimensions')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <Select value={selectedDimension} onValueChange={setSelectedDimension}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('admin.reports.selectDimension')} />
                    </SelectTrigger>
                    <SelectContent>
                      {availableDimensions.map((dimension) => (
                        <SelectItem key={dimension.id} value={dimension.id}>
                          {dimension.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>
            </div>

            {/* Canvas */}
            <div className="col-span-9">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">{t('admin.reports.canvas')}</CardTitle>
                    <Badge variant="outline">
                      {widgets.length} {t('admin.reports.widgets')}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                  >
                    <div className="min-h-[600px] space-y-4">
                      {widgets.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-96 text-muted-foreground">
                          <Plus className="w-12 h-12 mb-4" />
                          <p>{t('admin.reports.addFirstWidget')}</p>
                        </div>
                      ) : (
                        <SortableContext items={widgets.map(w => w.id)} strategy={verticalListSortingStrategy}>
                          {widgets.map((widget) => (
                            <Card key={widget.id} className="relative group">
                              <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <GripVertical className="w-4 h-4 text-muted-foreground cursor-move" />
                                    <Input
                                      value={widget.title}
                                      onChange={(e) => updateWidget(widget.id, { title: e.target.value })}
                                      className="border-none p-0 h-auto font-semibold"
                                    />
                                  </div>
                                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button variant="ghost" size="sm" onClick={() => removeWidget(widget.id)}>
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </div>
                              </CardHeader>
                              <CardContent className="h-48">
                                {renderWidgetPreview(widget)}
                              </CardContent>
                            </Card>
                          ))}
                        </SortableContext>
                      )}
                    </div>
                    <DragOverlay>
                      {draggedWidget ? (
                        <Card className="rotate-3 opacity-90">
                          <CardHeader>{draggedWidget.title}</CardHeader>
                          <CardContent className="h-48">
                            {renderWidgetPreview(draggedWidget)}
                          </CardContent>
                        </Card>
                      ) : null}
                    </DragOverlay>
                  </DndContext>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Data Tab */}
        <TabsContent value="data" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('admin.reports.dataSources')}</CardTitle>
              <CardDescription>{t('admin.reports.dataSourcesDesc')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-3 mb-3">
                    <Database className="w-5 h-5" />
                    <h3 className="font-semibold">Bookings</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    All booking data including revenue, dates, and customer information
                  </p>
                  <Badge variant="outline">Connected</Badge>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-3 mb-3">
                    <Users className="w-5 h-5" />
                    <h3 className="font-semibold">Customers</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Customer profiles, demographics, and booking history
                  </p>
                  <Badge variant="outline">Connected</Badge>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-3 mb-3">
                    <Package className="w-5 h-5" />
                    <h3 className="font-semibold">Services</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Service catalog, pricing, and performance metrics
                  </p>
                  <Badge variant="outline">Connected</Badge>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-3 mb-3">
                    <Calendar className="w-5 h-5" />
                    <h3 className="font-semibold">Availability</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Provider schedules and time slot availability
                  </p>
                  <Badge variant="outline">Connected</Badge>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-3 mb-3">
                    <MessageSquare className="w-5 h-5" />
                    <h3 className="font-semibold">Reviews</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Customer reviews and ratings for services
                  </p>
                  <Badge variant="outline">Connected</Badge>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-3 mb-3">
                    <Activity className="w-5 h-5" />
                    <h3 className="font-semibold">Analytics</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Website traffic, user behavior, and conversion data
                  </p>
                  <Badge variant="outline">Connected</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Filters Tab */}
        <TabsContent value="filters" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{t('admin.reports.filters')}</CardTitle>
                <Button onClick={addFilter} disabled={!selectedMetric}>
                  <Plus className="w-4 h-4 mr-2" />
                  {t('admin.reports.addFilter')}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {filters.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Filter className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>{t('admin.reports.noFilters')}</p>
                  <p className="text-sm mt-1">{t('admin.reports.addFilterToStart')}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filters.map((filter) => (
                    <div key={filter.id} className="flex items-center gap-4 p-4 border rounded-lg">
                      <div className="flex-1 grid grid-cols-4 gap-4">
                        <Select value={filter.field} onValueChange={(value) => updateFilter(filter.id, { field: value })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {availableMetrics.map((metric) => (
                              <SelectItem key={metric.id} value={metric.id}>
                                {metric.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <Select value={filter.operator} onValueChange={(value: any) => updateFilter(filter.id, { operator: value })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="equals">Equals</SelectItem>
                            <SelectItem value="not_equals">Not Equals</SelectItem>
                            <SelectItem value="contains">Contains</SelectItem>
                            <SelectItem value="greater_than">Greater Than</SelectItem>
                            <SelectItem value="less_than">Less Than</SelectItem>
                            <SelectItem value="between">Between</SelectItem>
                          </SelectContent>
                        </Select>

                        <Input
                          value={filter.value || ''}
                          onChange={(e) => updateFilter(filter.id, { value: e.target.value })}
                          placeholder="Value"
                        />

                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm" onClick={() => removeFilter(filter.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Schedule Tab */}
        <TabsContent value="schedule" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('admin.reports.automateReports')}</CardTitle>
              <CardDescription>{t('admin.reports.automateReportsDesc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-medium">{t('admin.reports.enableSchedule')}</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    {t('admin.reports.enableScheduleDesc')}
                  </p>
                </div>
                <Switch
                  checked={schedule.enabled}
                  onCheckedChange={(checked) => setSchedule({ ...schedule, enabled: checked })}
                />
              </div>

              {schedule.enabled && (
                <>
                  <Separator />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label>{t('admin.reports.frequency')}</Label>
                      <Select
                        value={schedule.frequency}
                        onValueChange={(value: any) => setSchedule({ ...schedule, frequency: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">{t('admin.reports.daily')}</SelectItem>
                          <SelectItem value="weekly">{t('admin.reports.weekly')}</SelectItem>
                          <SelectItem value="monthly">{t('admin.reports.monthly')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>{t('admin.reports.format')}</Label>
                      <Select
                        value={schedule.format}
                        onValueChange={(value: any) => setSchedule({ ...schedule, format: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pdf">PDF</SelectItem>
                          <SelectItem value="csv">CSV</SelectItem>
                          <SelectItem value="excel">Excel</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label>{t('admin.reports.recipients')}</Label>
                    <Input
                      type="email"
                      placeholder="Enter email addresses separated by commas"
                      value={schedule.recipients.join(', ')}
                      onChange={(e) => setSchedule({ ...schedule, recipients: e.target.value.split(',').map(r => r.trim()) })}
                      className="mt-2"
                    />
                  </div>

                  <div className="flex justify-end">
                    <Button onClick={() => {
                      // Save schedule
                      toast.success(t('admin.reports.scheduleSaved'));
                    }}>
                      {t('admin.reports.saveSchedule')}
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Template Dialog */}
      <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('admin.reports.reportTemplates')}</DialogTitle>
            <DialogDescription>
              {t('admin.reports.reportTemplatesDesc')}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {templates?.map((template) => (
              <Card key={template.id} className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => loadTemplate(template)}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                      <CardDescription className="mt-1">{template.description}</CardDescription>
                    </div>
                    <Badge variant="outline">{template.category}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>{template.widgets.length} {t('admin.reports.widgets')}</span>
                    <span>{format(new Date(template.updatedAt), 'dd MMM yyyy')}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}