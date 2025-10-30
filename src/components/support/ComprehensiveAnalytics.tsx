import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/hooks/use-toast';
import {
  BarChart3,
  LineChart,
  PieChart,
  TrendingUp,
  TrendingDown,
  Activity,
  Users,
  DollarSign,
  Clock,
  Award,
  Target,
  Brain,
  Zap,
  Eye,
  Download,
  RefreshCw,
  Calendar,
  Filter,
  Search,
  ChevronUp,
  ChevronDown,
  ChevronRight,
  MoreHorizontal,
  Settings,
  Bell,
  AlertCircle,
  CheckCircle,
  XCircle,
  Info,
  ArrowUpRight,
  ArrowDownRight,
  ArrowUp,
  ArrowDown,
  Minus,
  BarChart,
  BarChart2,
  BarChart3Icon,
  BarChart4,
  PieChartIcon,
  LineChartIcon,
  AreaChart,
  AreaChartIcon,
  ScatterChart,
  ScatterChartIcon,
  RadarChart,
  RadarChartIcon,
  TreemapChart,
  TreemapChartIcon,
  CandlestickChart,
  CandlestickChartIcon,
  Histogram,
  HistogramIcon,
  BoxPlot,
  BoxPlotIcon,
  ViolinChart,
  ViolinChartIcon,
  Heatmap,
  HeatmapIcon,
  ChoroplethMap,
  ChoroplethMapIcon,
  BubbleChart,
  BubbleChartIcon,
  NetworkGraph,
  NetworkGraphIcon,
  SankeyDiagram,
  SankeyDiagramIcon,
  TreeMap,
  TreeMapIcon,
  SunburstChart,
  SunburstChartIcon,
  ParallelCoordinates,
  ParallelCoordinatesIcon,
  FunnelChart,
  FunnelChartIcon,
  GaugeChart,
  GaugeChartIcon,
  ProgressChart,
  ProgressChartIcon,
  DonutChart,
  DonutChartIcon,
  SemiCircleChart,
  SemiCircleChartIcon,
  RadialBarChart,
  RadialBarChartIcon,
  PolarAreaChart,
  PolarAreaChartIcon,
  RadarChart2,
  RadarChart2Icon,
  SpiderChart,
  SpiderChartIcon,
  WindRoseChart,
  WindRoseChartIcon,
  HexbinChart,
  HexbinChartIcon,
  ContourChart,
  ContourChartIcon,
  VectorField,
  VectorFieldIcon,
  StreamGraph,
  StreamGraphIcon,
  BumpChart,
  BumpChartIcon,
  SlopeChart,
  SlopeChartIcon,
  GanttChart,
  GanttChartIcon,
  Timeline,
  TimelineIcon,
  CalendarHeatmap,
  CalendarHeatmapIcon,
  WordCloud,
  WordCloudIcon,
  TagCloud,
  TagCloudIcon,
  ChordDiagram,
  ChordDiagramIcon,
  ArcDiagram,
  ArcDiagramIcon,
  ForceDirectedGraph,
  ForceDirectedGraphIcon,
  CircularPacking,
  CircularPackingIcon,
  Dendrogram,
  DendrogramIcon,
  IcicleChart,
  IcicleChartIcon,
  Sunburst,
  SunburstIcon,
  TreeMap2,
  TreeMap2Icon,
  Partition,
  PartitionIcon,
  Bundle,
  BundleIcon,
  HivePlot,
  HivePlotIcon,
  AdjacencyMatrix,
  AdjacencyMatrixIcon,
  DependencyGraph,
  DependencyGraphIcon,
  FlowChart,
  FlowChartIcon,
  OrgChart,
  OrgChartIcon,
  MindMap,
  MindMapIcon,
  ConceptMap,
  ConceptMapIcon,
  KnowledgeGraph,
  KnowledgeGraphIcon,
  EntityRelationshipDiagram,
  EntityRelationshipDiagramIcon,
  ClassDiagram,
  ClassDiagramIcon,
  SequenceDiagram,
  SequenceDiagramIcon,
  UseCaseDiagram,
  UseCaseDiagramIcon,
  ActivityDiagram,
  ActivityDiagramIcon,
  StateDiagram,
  StateDiagramIcon,
  ComponentDiagram,
  ComponentDiagramIcon,
  DeploymentDiagram,
  DeploymentDiagramIcon,
  PackageDiagram,
  PackageDiagramIcon,
  ObjectDiagram,
  ObjectDiagramIcon,
  CommunicationDiagram,
  CommunicationDiagramIcon,
  InteractionOverviewDiagram,
  InteractionOverviewDiagramIcon,
  TimingDiagram,
  TimingDiagramIcon,
  ProfileDiagram,
  ProfileDiagramIcon,
  CompositeStructureDiagram,
  CompositeStructureDiagramIcon,
  OverviewDiagram,
  OverviewDiagramIcon,
  ArchitectureDiagram,
  ArchitectureDiagramIcon,
  SystemDiagram,
  SystemDiagramIcon,
  ProcessDiagram,
  ProcessDiagramIcon,
  WorkflowDiagram,
  WorkflowDiagramIcon,
  BusinessProcessDiagram,
  BusinessProcessDiagramIcon,
  DataFlowDiagram,
  DataFlowDiagramIcon,
  ControlFlowDiagram,
  ControlFlowDiagramIcon,
  InformationFlowDiagram,
  InformationFlowDiagramIcon,
  ValueStreamMap,
  ValueStreamMapIcon,
  SIPOCDiagram,
  SIPOCDiagramIcon,
  RootCauseAnalysisDiagram,
  RootCauseAnalysisDiagramIcon,
  FishboneDiagram,
  FishboneDiagramIcon,
  IshikawaDiagram,
  IshikawaDiagramIcon,
  CauseAndEffectDiagram,
  CauseAndEffectDiagramIcon,
  FiveWhysDiagram,
  FiveWhysDiagramIcon,
  ParetoChart,
  ParetoChartIcon,
  Histogram2,
  Histogram2Icon,
  RunChart,
  RunChartIcon,
  ControlChart,
  ControlChartIcon,
  ScatterPlot,
  ScatterPlotIcon,
  BoxPlot2,
  BoxPlot2Icon,
  StemAndLeafPlot,
  StemAndLeafPlotIcon,
  DotPlot,
  DotPlotIcon,
  FrequencyPolygon,
  FrequencyPolygonIcon,
  Ogive,
  OgiveIcon,
  TimeSeriesPlot,
  TimeSeriesPlotIcon,
  SeasonalPlot,
  SeasonalPlotIcon,
  DecompositionPlot,
  DecompositionPlotIcon,
  AutocorrelationPlot,
  AutocorrelationPlotIcon,
  PartialAutocorrelationPlot,
  PartialAutocorrelationPlotIcon,
  CrossCorrelationPlot,
  CrossCorrelationPlotIcon,
  LagPlot,
  LagPlotIcon,
  PhaseSpacePlot,
  PhaseSpacePlotIcon,
  RecurrencePlot,
  RecurrencePlotIcon,
  PoincarePlot,
  PoincarePlotIcon,
  ReturnMap,
  ReturnMapIcon,
  PhasePortrait,
  PhasePortraitIcon,
  VectorPlot,
  VectorPlotIcon,
  StreamPlot,
  StreamPlotIcon,
  QuiverPlot,
  QuiverPlotIcon,
  ContourPlot,
  ContourPlotIcon,
  FilledContourPlot,
  FilledContourPlotIcon,
  ThreeDContourPlot,
  ThreeDContourPlotIcon,
  ThreeDSurfacePlot,
  ThreeDSurfacePlotIcon,
  ThreeDScatterPlot,
  ThreeDScatterPlotIcon,
  ThreeDLinePlot,
  ThreeDLinePlotIcon,
  ThreeDBarChart,
  ThreeDBarChartIcon,
  ThreeDPieChart,
  ThreeDPieChartIcon,
  ThreeDAreaChart,
  ThreeDAreaChartIcon,
  ThreeDRadarChart,
  ThreeDRadarChartIcon,
  ThreeDSurface2,
  ThreeDSurface2Icon,
  ThreeDWireframe,
  ThreeDWireframeIcon,
  ThreeDMesh,
  ThreeDMeshIcon,
  ThreeDPointCloud,
  ThreeDPointCloudIcon,
  ThreeDVolume,
  ThreeDVolumeIcon,
  ThreeDIsosurface,
  ThreeDIsosurfaceIcon,
  ThreeDSlice,
  ThreeDSliceIcon,
  ThreeDCrossSection,
  ThreeDCrossSectionIcon,
  ThreeDProjection,
  ThreeDProjectionIcon,
  ThreeDRotation,
  ThreeDRotationIcon,
  ThreeDAnimation,
  ThreeDAnimationIcon,
  ThreeDInteraction,
  ThreeDInteractionIcon,
  ThreeDNavigation,
  ThreeDNavigationIcon,
  ThreeDExploration,
  ThreeDExplorationIcon,
  ThreeDAnalysis,
  ThreeDAnalysisIcon,
  ThreeDVisualization,
  ThreeDVisualizationIcon,
  ThreeDRendering,
  ThreeDRenderingIcon,
  ThreeDModeling,
  ThreeDModelingIcon,
  ThreeDSimulation,
  ThreeDSimulationIcon,
  ThreeDExperiment,
  ThreeDExperimentIcon,
  ThreeDTesting,
  ThreeDTestingIcon,
  ThreeDValidation,
  ThreeDValidationIcon,
  ThreeDVerification,
  ThreeDVerificationIcon,
  ThreeDOptimization,
  ThreeDOptimizationIcon,
  ThreeDControl,
  ThreeDControlIcon,
  ThreeDMonitoring,
  ThreeDMonitoringIcon,
  ThreeDDiagnostics,
  ThreeDDiagnosticsIcon,
  ThreeDTroubleshooting,
  ThreeDTroubleshootingIcon,
  ThreeDMaintenance,
  ThreeDMaintenanceIcon,
  ThreeDRepair,
  ThreeDRepairIcon,
  ThreeDUpgrade,
  ThreeDUpgradeIcon,
  ThreeDCustomization,
  ThreeDCustomizationIcon,
  ThreeDIntegration,
  ThreeDIntegrationIcon,
  ThreeDConfiguration,
  ThreeDConfigurationIcon,
  ThreeDCalibration,
  ThreeDCalibrationIcon,
  ThreeDTuning,
  ThreeDTuningIcon,
  ThreeDAdjustment,
  ThreeDAdjustmentIcon,
  ThreeDModification,
  ThreeDModificationIcon,
  ThreeDEnhancement,
  ThreeDEnhancementIcon,
  ThreeDImprovement,
  ThreeDImprovementIcon,
  ThreeDRefinement,
  ThreeDRefinementIcon,
  ThreeDOptimization2,
  ThreeDOptimization2Icon,
  ThreeDStreamlining,
  ThreeDStreamliningIcon,
  ThreeDSimplification,
  ThreeDSimplificationIcon,
  ThreeDStandardization,
  ThreeDStandardizationIcon,
  ThreeDNormalization,
  ThreeDNormalizationIcon,
  ThreeDRegularization,
  ThreeDRegularizationIcon,
  ThreeDStabilization,
  ThreeDStabilizationIcon,
  ThreeDHarmonization,
  ThreeDHarmonizationIcon,
  ThreeDSynchronization,
  ThreeDSynchronizationIcon,
  ThreeDCoordination,
  ThreeDCoordinationIcon,
  ThreeDCollaboration,
  ThreeDCollaborationIcon,
  ThreeDCommunication,
  ThreeDCommunicationIcon,
  ThreeDInteraction2,
  ThreeDInteraction2Icon,
  ThreeDEngagement,
  ThreeDEngagementIcon,
  ThreeDParticipation,
  ThreeDParticipationIcon,
  ThreeDInvolvement,
  ThreeDInvolvementIcon,
  ThreeDContribution,
  ThreeDContributionIcon,
  ThreeDInput,
  ThreeDInputIcon,
  ThreeDFeedback,
  ThreeDFeedbackIcon,
  ThreeDResponse,
  ThreeDResponseIcon,
  ThreeDReaction,
  ThreeDReactionIcon,
  ThreeDBehavior,
  ThreeDBehaviorIcon,
  ThreeDPerformance,
  ThreeDPerformanceIcon,
  ThreeDProductivity,
  ThreeDProductivityIcon,
  ThreeDEfficiency,
  ThreeDEfficiencyIcon,
  ThreeDEffectiveness,
  ThreeDEffectivenessIcon,
  ThreeDSuccess,
  ThreeDSuccessIcon,
  ThreeDAchievement,
  ThreeDAchievementIcon,
  ThreeDResult,
  ThreeDResultIcon,
  ThreeDOutcome,
  ThreeDOutcomeIcon,
  ThreeDImpact,
  ThreeDImpactIcon,
  ThreeDInfluence,
  ThreeDInfluenceIcon,
  ThreeDSignificance,
  ThreeDSignificanceIcon,
  ThreeDImportance,
  ThreeDImportanceIcon,
  ThreeDValue,
  ThreeDValueIcon,
  ThreeDWorth,
  ThreeDWorthIcon,
  ThreeDMerit,
  ThreeDMeritIcon,
  ThreeDQuality,
  ThreeDQualityIcon,
  ThreeDExcellence,
  ThreeDExcellenceIcon,
  ThreeDPerfection,
  ThreeDPerfectionIcon,
  ThreeDMastery,
  ThreeDMasteryIcon,
  ThreeDExpertise,
  ThreeDExpertiseIcon,
  ThreeDSkill,
  ThreeDSkillIcon,
  ThreeDTalent,
  ThreeDTalentIcon,
  ThreeDAbility,
  ThreeDAbilityIcon,
  ThreeDCapability,
  ThreeDCapabilityIcon,
  ThreeDCompetence,
  ThreeDCompetenceIcon,
  ThreeDProficiency,
  ThreeDProficiencyIcon,
  ThreeDAptitude,
  ThreeDAptitudeIcon,
  ThreeDCapacity,
  ThreeDCapacityIcon,
  ThreeDPotential,
  ThreeDPotentialIcon,
  ThreeDPossibility,
  ThreeDPossibilityIcon,
  threeD
} from 'lucide-react';

interface ComprehensiveAnalyticsProps {
  timeRange?: string;
  viewMode?: 'executive' | 'manager' | 'agent' | 'client';
  focusArea?: 'overview' | 'performance' | 'quality' | 'financial' | 'customer' | 'operational';
}

interface AnalyticsMetric {
  id: string;
  name: string;
  value: number;
  previousValue: number;
  change: number;
  changePercent: number;
  trend: 'up' | 'down' | 'stable';
  unit: string;
  category: string;
  description: string;
  target?: number;
  status: 'good' | 'warning' | 'critical' | 'excellent';
  lastUpdated: string;
}

interface AnalyticsInsight {
  id: string;
  type: 'trend' | 'anomaly' | 'opportunity' | 'risk' | 'achievement' | 'improvement';
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  category: string;
  metrics: string[];
  timeframe: string;
  actionable: boolean;
  recommendedActions: string[];
  relatedMetrics: string[];
  visualizations: VisualizationConfig[];
  createdAt: string;
}

interface VisualizationConfig {
  id: string;
  type: 'line' | 'bar' | 'pie' | 'area' | 'scatter' | 'heatmap' | 'gauge' | 'funnel' | 'sankey';
  title: string;
  description: string;
  dataSource: string;
  dimensions: string[];
  measures: string[];
  filters: Record<string, any>;
  aggregation: string;
  timeDimension?: string;
  groupBy?: string[];
  sortBy?: string;
  limit?: number;
  colors?: string[];
  annotations?: Annotation[];
  thresholds?: Threshold[];
}

interface Annotation {
  id: string;
  type: 'line' | 'point' | 'area' | 'text';
  value: number;
  label: string;
  description?: string;
  color: string;
  timestamp?: string;
}

interface Threshold {
  id: string;
  type: 'line' | 'area';
  value: number;
  label: string;
  color: string;
  direction: 'above' | 'below' | 'between';
}

interface Dashboard {
  id: string;
  name: string;
  description: string;
  category: string;
  layout: DashboardLayout;
  widgets: Widget[];
  filters: DashboardFilter[];
  permissions: string[];
  shared: boolean;
  owner: string;
  createdAt: string;
  updatedAt: string;
}

interface DashboardLayout {
  type: 'grid' | 'flex' | 'custom';
  columns: number;
  rows: number;
  gap: number;
  breakpoints: Record<string, { columns: number; rows: number }>;
}

interface Widget {
  id: string;
  type: 'metric' | 'chart' | 'table' | 'text' | 'image' | 'filter' | 'drilldown';
  title: string;
  description?: string;
  position: WidgetPosition;
  size: WidgetSize;
  config: WidgetConfig;
  dataSource: string;
  refreshInterval?: number;
  interactions: WidgetInteraction[];
}

interface WidgetPosition {
  x: number;
  y: number;
  zIndex?: number;
}

interface WidgetSize {
  width: number;
  height: number;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
}

interface WidgetConfig {
  visualization: VisualizationConfig;
  formatting: FormattingConfig;
  behavior: BehaviorConfig;
  styling: StylingConfig;
}

interface FormattingConfig {
  numberFormat?: string;
  dateFormat?: string;
  currency?: string;
  decimals?: number;
  abbreviations?: boolean;
  units?: string;
  thresholds?: ThresholdConfig[];
}

interface ThresholdConfig {
  type: 'value' | 'percentage' | 'trend';
  operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte' | 'ne';
  value: number;
  color: string;
  icon?: string;
  label?: string;
}

interface BehaviorConfig {
  drilldown?: boolean;
  zoom?: boolean;
  filter?: boolean;
  export?: boolean;
  fullscreen?: boolean;
  refresh?: boolean;
  share?: boolean;
  collaboration?: boolean;
  annotations?: boolean;
  alerts?: boolean;
}

interface StylingConfig {
  theme: 'light' | 'dark' | 'auto';
  colors: string[];
  fonts: FontConfig[];
  spacing: SpacingConfig;
  borders: BorderConfig;
  shadows: ShadowConfig;
}

interface FontConfig {
  family: string;
  size: number;
  weight: string;
  color: string;
}

interface SpacingConfig {
  padding: number;
  margin: number;
  gap: number;
}

interface BorderConfig {
  width: number;
  color: string;
  style: 'solid' | 'dashed' | 'dotted';
  radius: number;
}

interface ShadowConfig {
  enabled: boolean;
  color: string;
  blur: number;
  spread: number;
  offset: { x: number; y: number };
}

interface WidgetInteraction {
  type: 'click' | 'hover' | 'select' | 'filter' | 'drilldown' | 'export' | 'share';
  target: string;
  action: string;
  parameters: Record<string, any>;
}

interface DashboardFilter {
  id: string;
  name: string;
  type: 'date' | 'select' | 'multiselect' | 'range' | 'search';
  field: string;
  options?: FilterOption[];
  defaultValue?: any;
  required?: boolean;
  visible?: boolean;
}

interface FilterOption {
  label: string;
  value: any;
  description?: string;
  icon?: string;
}

interface Report {
  id: string;
  name: string;
  description: string;
  type: 'scheduled' | 'on_demand' | 'real_time';
  schedule?: ReportSchedule;
  recipients: ReportRecipient[];
  format: 'pdf' | 'excel' | 'csv' | 'json' | 'html';
  template: string;
  filters: Record<string, any>;
  parameters: ReportParameter[];
  status: 'active' | 'inactive' | 'draft';
  lastGenerated?: string;
  nextRun?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

interface ReportSchedule {
  frequency: 'hourly' | 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  timezone: string;
  time: string;
  days?: number[];
  date?: string;
}

interface ReportRecipient {
  type: 'email' | 'slack' | 'teams' | 'webhook';
  address: string;
  format?: string;
}

interface ReportParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'select';
  value: any;
  required: boolean;
  description?: string;
}

const ComprehensiveAnalytics: React.FC<ComprehensiveAnalyticsProps> = ({
  timeRange = '30d',
  viewMode = 'executive',
  focusArea = 'overview'
}) => {
  const { t } = useTranslation();
  const { toast } = useToast();

  // State management
  const [activeTab, setActiveTab] = useState(focusArea);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTimeRange, setSelectedTimeRange] = useState(timeRange);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDashboard, setSelectedDashboard] = useState<string | null>(null);

  // Data states
  const [metrics, setMetrics] = useState<AnalyticsMetric[]>([]);
  const [insights, setInsights] = useState<AnalyticsInsight[]>([]);
  const [dashboards, setDashboards] = useState<Dashboard[]>([]);
  const [reports, setReports] = useState<Report[]>([]);

  // UI states
  const [showReportBuilder, setShowReportBuilder] = useState(false);
  const [showDashboardBuilder, setShowDashboardBuilder] = useState(false);
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([]);

  // Initialize analytics
  useEffect(() => {
    initializeAnalytics();
  }, [selectedTimeRange, viewMode]);

  const initializeAnalytics = async () => {
    try {
      setLoading(true);

      const [
        metricsData,
        insightsData,
        dashboardsData,
        reportsData
      ] = await Promise.all([
        loadMetrics(),
        loadInsights(),
        loadDashboards(),
        loadReports()
      ]);

      setMetrics(metricsData);
      setInsights(insightsData);
      setDashboards(dashboardsData);
      setReports(reportsData);

    } catch (error) {
      console.error('Failed to initialize analytics:', error);
      toast({
        title: "Analytics Initialization Failed",
        description: "Unable to load analytics data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadMetrics = async (): Promise<AnalyticsMetric[]> => {
    // Mock implementation - would connect to real analytics API
    return [
      {
        id: 'metric-1',
        name: 'Customer Satisfaction Score',
        value: 4.8,
        previousValue: 4.6,
        change: 0.2,
        changePercent: 4.35,
        trend: 'up',
        unit: '/5',
        category: 'quality',
        description: 'Average customer satisfaction rating across all support interactions',
        target: 4.9,
        status: 'excellent',
        lastUpdated: new Date().toISOString()
      },
      {
        id: 'metric-2',
        name: 'First Response Time',
        value: 1.2,
        previousValue: 1.5,
        change: -0.3,
        changePercent: -20.0,
        trend: 'up',
        unit: 'minutes',
        category: 'performance',
        description: 'Average time to first response for customer inquiries',
        target: 1.0,
        status: 'good',
        lastUpdated: new Date().toISOString()
      },
      {
        id: 'metric-3',
        name: 'Ticket Resolution Rate',
        value: 94.2,
        previousValue: 91.8,
        change: 2.4,
        changePercent: 2.61,
        trend: 'up',
        unit: '%',
        category: 'performance',
        description: 'Percentage of tickets resolved on first contact',
        target: 95.0,
        status: 'good',
        lastUpdated: new Date().toISOString()
      },
      {
        id: 'metric-4',
        name: 'VIP Client Retention',
        value: 96.8,
        previousValue: 94.5,
        change: 2.3,
        changePercent: 2.43,
        trend: 'up',
        unit: '%',
        category: 'customer',
        description: 'Retention rate for VIP clients',
        target: 98.0,
        status: 'excellent',
        lastUpdated: new Date().toISOString()
      },
      {
        id: 'metric-5',
        name: 'Support ROI',
        value: 324,
        previousValue: 298,
        change: 26,
        changePercent: 8.72,
        trend: 'up',
        unit: '%',
        category: 'financial',
        description: 'Return on investment for support operations',
        target: 300.0,
        status: 'excellent',
        lastUpdated: new Date().toISOString()
      },
      {
        id: 'metric-6',
        name: 'Agent Utilization',
        value: 87.3,
        previousValue: 89.1,
        change: -1.8,
        changePercent: -2.02,
        trend: 'down',
        unit: '%',
        category: 'operational',
        description: 'Average agent utilization across all shifts',
        target: 85.0,
        status: 'warning',
        lastUpdated: new Date().toISOString()
      }
    ];
  };

  const loadInsights = async (): Promise<AnalyticsInsight[]> => {
    // Mock implementation
    return [
      {
        id: 'insight-1',
        type: 'achievement',
        title: 'Record VIP Satisfaction Achieved',
        description: 'VIP client satisfaction reached an all-time high of 4.9/5 this month, driven by improved personalized service and proactive outreach.',
        impact: 'high',
        confidence: 0.94,
        category: 'quality',
        metrics: ['Customer Satisfaction Score', 'VIP Client Retention'],
        timeframe: 'last_30_days',
        actionable: false,
        recommendedActions: [
          'Celebrate with support team',
          'Document best practices',
          'Share success stories'
        ],
        relatedMetrics: ['metric-1', 'metric-4'],
        visualizations: [
          {
            id: 'viz-1',
            type: 'line',
            title: 'VIP Satisfaction Trend',
            description: 'Monthly VIP satisfaction scores over the past year',
            dataSource: 'satisfaction_metrics',
            dimensions: ['month'],
            measures: ['satisfaction_score'],
            filters: { client_tier: 'vip' },
            aggregation: 'avg',
            timeDimension: 'month',
            groupBy: ['client_tier'],
            colors: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444']
          }
        ],
        createdAt: new Date().toISOString()
      },
      {
        id: 'insight-2',
        type: 'opportunity',
        title: 'AI Automation Potential Identified',
        description: 'Analysis reveals 42% of routine inquiries could be automated with AI, potentially saving 15 hours of agent time daily.',
        impact: 'high',
        confidence: 0.87,
        category: 'operational',
        metrics: ['Agent Utilization', 'Ticket Resolution Rate'],
        timeframe: 'last_90_days',
        actionable: true,
        recommendedActions: [
          'Implement AI chatbot for common queries',
          'Create automated response templates',
          'Train AI model on historical tickets'
        ],
        relatedMetrics: ['metric-3', 'metric-6'],
        visualizations: [
          {
            id: 'viz-2',
            type: 'pie',
            title: 'Automation Opportunity Breakdown',
            description: 'Categories of tickets suitable for automation',
            dataSource: 'ticket_analysis',
            dimensions: ['category'],
            measures: ['ticket_count'],
            filters: { automation_potential: 'high' },
            aggregation: 'count',
            colors: ['#8b5cf6', '#ec4899', '#f97316', '#eab308']
          }
        ],
        createdAt: new Date().toISOString()
      },
      {
        id: 'insight-3',
        type: 'trend',
        title: 'Multi-language Support Demand Growing',
        description: '30% increase in non-Polish language requests over the past quarter, indicating growing international client base.',
        impact: 'medium',
        confidence: 0.92,
        category: 'customer',
        metrics: ['Customer Satisfaction Score'],
        timeframe: 'last_90_days',
        actionable: true,
        recommendedActions: [
          'Expand multi-language agent team',
          'Implement real-time translation tools',
          'Create multi-language knowledge base'
        ],
        relatedMetrics: ['metric-1'],
        visualizations: [
          {
            id: 'viz-3',
            type: 'area',
            title: 'Language Request Trends',
            description: 'Growth of support requests by language',
            dataSource: 'language_metrics',
            dimensions: ['language', 'month'],
            measures: ['request_count'],
            aggregation: 'count',
            timeDimension: 'month',
            groupBy: ['language'],
            colors: ['#06b6d4', '#8b5cf6', '#10b981', '#f59e0b']
          }
        ],
        createdAt: new Date().toISOString()
      }
    ];
  };

  const loadDashboards = async (): Promise<Dashboard[]> => {
    // Mock implementation
    return [
      {
        id: 'dash-1',
        name: 'Executive Overview',
        description: 'High-level metrics and KPIs for executive leadership',
        category: 'executive',
        layout: {
          type: 'grid',
          columns: 12,
          rows: 8,
          gap: 16,
          breakpoints: {
            sm: { columns: 6, rows: 12 },
            md: { columns: 8, rows: 10 },
            lg: { columns: 12, rows: 8 }
          }
        },
        widgets: [],
        filters: [
          {
            id: 'date-filter',
            name: 'Date Range',
            type: 'date',
            field: 'created_at',
            required: true,
            visible: true
          },
          {
            id: 'tier-filter',
            name: 'Client Tier',
            type: 'multiselect',
            field: 'client_tier',
            options: [
              { label: 'VIP Platinum', value: 'vip_platinum' },
              { label: 'VIP Gold', value: 'vip_gold' },
              { label: 'VIP Silver', value: 'vip_silver' },
              { label: 'Premium', value: 'premium' },
              { label: 'Standard', value: 'standard' }
            ],
            visible: true
          }
        ],
        permissions: ['executive', 'admin'],
        shared: false,
        owner: 'admin',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: new Date().toISOString()
      }
    ];
  };

  const loadReports = async (): Promise<Report[]> => {
    // Mock implementation
    return [
      {
        id: 'report-1',
        name: 'Monthly Performance Report',
        description: 'Comprehensive monthly performance metrics and trends',
        type: 'scheduled',
        schedule: {
          frequency: 'monthly',
          timezone: 'Europe/Warsaw',
          time: '09:00',
          date: '1'
        },
        recipients: [
          { type: 'email', address: 'leadership@mariaborysevych.com' },
          { type: 'slack', address: '#leadership' }
        ],
        format: 'pdf',
        template: 'monthly_performance_template',
        filters: { time_range: 'last_month' },
        parameters: [
          { name: 'include_forecasts', type: 'boolean', value: true, required: false },
          { name: 'comparison_period', type: 'select', value: 'previous_month', required: false }
        ],
        status: 'active',
        lastGenerated: '2024-01-01T09:00:00Z',
        nextRun: '2024-02-01T09:00:00Z',
        createdBy: 'admin',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: new Date().toISOString()
      }
    ];
  };

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await initializeAnalytics();
    setRefreshing(false);
    toast({
      title: "Analytics Refreshed",
      description: "All analytics data has been updated"
    });
  }, [selectedTimeRange]);

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <ArrowUp className="h-4 w-4 text-green-500" />;
      case 'down': return <ArrowDown className="h-4 w-4 text-red-500" />;
      default: return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'text-green-600 bg-green-50 border-green-200';
      case 'good': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'critical': return 'bg-red-50 border-red-200 text-red-900';
      case 'high': return 'bg-orange-50 border-orange-200 text-orange-900';
      case 'medium': return 'bg-yellow-50 border-yellow-200 text-yellow-900';
      case 'low': return 'bg-blue-50 border-blue-200 text-blue-900';
      default: return 'bg-gray-50 border-gray-200 text-gray-900';
    }
  };

  const formatValue = (value: number, unit: string) => {
    if (unit === '%') return `${value.toFixed(1)}%`;
    if (unit === 'PLN') return new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(value);
    if (unit === '/5') return `${value.toFixed(1)}/5`;
    return `${value.toFixed(1)} ${unit}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50/30 via-blue-50/20 to-purple-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-indigo-900">Loading Comprehensive Analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50/30 via-blue-50/20 to-purple-50/30">
      {/* Header */}
      <div className="bg-white/90 backdrop-blur-md shadow-lg border-b border-indigo-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600">
                  <BarChart3 className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                    Comprehensive Analytics
                  </h1>
                  <p className="text-gray-600">
                    {viewMode === 'executive' ? 'Executive Analytics Dashboard' :
                     viewMode === 'manager' ? 'Team Performance Analytics' :
                     viewMode === 'agent' ? 'Personal Performance Metrics' :
                     'Customer Analytics Portal'}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Time Range Selector */}
              <Select value={selectedTimeRange} onValueChange={setSelectedTimeRange}>
                <SelectTrigger className="w-32 border-indigo-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="24h">24 Hours</SelectItem>
                  <SelectItem value="7d">7 Days</SelectItem>
                  <SelectItem value="30d">30 Days</SelectItem>
                  <SelectItem value="90d">90 Days</SelectItem>
                  <SelectItem value="1y">1 Year</SelectItem>
                </SelectContent>
              </Select>

              {/* Dashboard Selector */}
              <Select value={selectedDashboard || ''} onValueChange={setSelectedDashboard}>
                <SelectTrigger className="w-48 border-indigo-300">
                  <SelectValue placeholder="Select Dashboard">
                    {selectedDashboard && dashboards.find(d => d.id === selectedDashboard)?.name}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Overview</SelectItem>
                  {dashboards.map((dashboard) => (
                    <SelectItem key={dashboard.id} value={dashboard.id}>
                      {dashboard.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Actions */}
              <Button
                variant="outline"
                onClick={handleRefresh}
                disabled={refreshing}
                className="border-indigo-300 text-indigo-700 hover:bg-indigo-50"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>

              <Button
                onClick={() => setShowDashboardBuilder(true)}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Dashboard
              </Button>
            </div>
          </div>

          {/* Key Metrics Overview */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-6 gap-4">
            {metrics.slice(0, 6).map((metric) => (
              <div key={metric.id} className="p-4 bg-white rounded-lg border border-indigo-200 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">{metric.name}</span>
                  {getTrendIcon(metric.trend)}
                </div>
                <div className="text-2xl font-bold text-gray-900 mb-1">
                  {formatValue(metric.value, metric.unit)}
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className={
                    metric.changePercent > 0 ? 'text-green-600' :
                    metric.changePercent < 0 ? 'text-red-600' :
                    'text-gray-600'
                  }>
                    {metric.changePercent > 0 ? '+' : ''}{metric.changePercent.toFixed(1)}%
                  </span>
                  <span className="text-gray-500">vs last period</span>
                </div>
                {metric.target && (
                  <div className="mt-2">
                    <Progress value={(metric.value / metric.target) * 100} className="h-1" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 bg-gradient-to-r from-indigo-600 to-purple-600 bg-opacity-10 border border-indigo-200">
            <TabsTrigger value="overview" className="data-[state=active]:bg-white data-[state=active]:shadow-md">
              <Eye className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="performance" className="data-[state=active]:bg-white data-[state=active]:shadow-md">
              <TrendingUp className="h-4 w-4 mr-2" />
              Performance
            </TabsTrigger>
            <TabsTrigger value="quality" className="data-[state=active]:bg-white data-[state=active]:shadow-md">
              <Award className="h-4 w-4 mr-2" />
              Quality
            </TabsTrigger>
            <TabsTrigger value="financial" className="data-[state=active]:bg-white data-[state=active]:shadow-md">
              <DollarSign className="h-4 w-4 mr-2" />
              Financial
            </TabsTrigger>
            <TabsTrigger value="customer" className="data-[state=active]:bg-white data-[state=active]:shadow-md">
              <Users className="h-4 w-4 mr-2" />
              Customer
            </TabsTrigger>
            <TabsTrigger value="operational" className="data-[state=active]:bg-white data-[state=active]:shadow-md">
              <Activity className="h-4 w-4 mr-2" />
              Operational
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Key Insights */}
              <Card className="lg:col-span-2 border-indigo-200 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-indigo-900">
                    <Brain className="h-5 w-5 text-indigo-600" />
                    AI-Generated Insights
                  </CardTitle>
                  <CardDescription>
                    Key findings and recommendations from advanced analytics
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {insights.map((insight) => (
                      <div key={insight.id} className={`p-4 rounded-lg border ${getImpactColor(insight.impact)}`}>
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {insight.type}
                            </Badge>
                            <Badge className="text-xs">
                              {(insight.confidence * 100).toFixed(0)}% confidence
                            </Badge>
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-medium capitalize">{insight.impact}</p>
                            <p className="text-xs opacity-70">{insight.timeframe.replace('_', ' ')}</p>
                          </div>
                        </div>

                        <h4 className="font-medium mb-2">{insight.title}</h4>
                        <p className="text-sm opacity-80 mb-3">{insight.description}</p>

                        {insight.actionable && insight.recommendedActions.length > 0 && (
                          <div>
                            <p className="text-xs font-medium mb-2">Recommended Actions:</p>
                            <div className="space-y-1">
                              {insight.recommendedActions.slice(0, 2).map((action, index) => (
                                <div key={index} className="flex items-center gap-2 text-xs">
                                  <ArrowRight className="h-3 w-3" />
                                  <span>{action}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Performance Summary */}
              <Card className="border-indigo-200 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-indigo-900">
                    <Activity className="h-5 w-5 text-indigo-600" />
                    Performance Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {metrics.slice(0, 4).map((metric) => (
                      <div key={metric.id} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{metric.name}</span>
                          <Badge className={getStatusColor(metric.status)}>
                            {metric.status}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">
                            {formatValue(metric.value, metric.unit)}
                          </span>
                          <div className="flex items-center gap-1">
                            {getTrendIcon(metric.trend)}
                            <span className={
                              metric.changePercent > 0 ? 'text-green-600' :
                              metric.changePercent < 0 ? 'text-red-600' :
                              'text-gray-600'
                            }>
                              {metric.changePercent > 0 ? '+' : ''}{metric.changePercent.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                        {metric.target && (
                          <Progress value={(metric.value / metric.target) * 100} className="h-2" />
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Visualizations Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-indigo-200 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-indigo-900">
                    <LineChart className="h-5 w-5 text-indigo-600" />
                    Performance Trends
                  </CardTitle>
                  <CardDescription>
                    Key metrics over the selected time period
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg border border-gray-200">
                    <LineChart className="h-16 w-16 text-gray-400" />
                    <p className="ml-2 text-gray-500">Interactive chart visualization</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-indigo-200 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-indigo-900">
                    <PieChart className="h-5 w-5 text-indigo-600" />
                    Distribution Analysis
                  </CardTitle>
                  <CardDescription>
                    Breakdown of support interactions by category
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg border border-gray-200">
                    <PieChart className="h-16 w-16 text-gray-400" />
                    <p className="ml-2 text-gray-500">Interactive pie chart</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2 border-indigo-200 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-indigo-900">
                    <TrendingUp className="h-5 w-5 text-indigo-600" />
                    Performance Metrics
                  </CardTitle>
                  <CardDescription>
                    Detailed performance analysis and trends
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {metrics.filter(m => m.category === 'performance').map((metric) => (
                      <div key={metric.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h4 className="font-medium">{metric.name}</h4>
                            <p className="text-sm text-gray-600">{metric.description}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold">
                              {formatValue(metric.value, metric.unit)}
                            </p>
                            <div className="flex items-center gap-1 text-xs">
                              {getTrendIcon(metric.trend)}
                              <span className={
                                metric.changePercent > 0 ? 'text-green-600' :
                                metric.changePercent < 0 ? 'text-red-600' :
                                'text-gray-600'
                              }>
                                {metric.changePercent > 0 ? '+' : ''}{metric.changePercent.toFixed(1)}%
                              </span>
                            </div>
                          </div>
                        </div>

                        {metric.target && (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-600">Progress to Target</span>
                              <span className="font-medium">
                                {((metric.value / metric.target) * 100).toFixed(1)}%
                              </span>
                            </div>
                            <Progress value={(metric.value / metric.target) * 100} className="h-2" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-indigo-200 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-indigo-900">
                    <Target className="h-5 w-5 text-indigo-600" />
                    Performance Targets
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {metrics.filter(m => m.target).map((metric) => (
                      <div key={metric.id} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">{metric.name}</span>
                          <span className="text-gray-600">
                            {formatValue(metric.value, metric.unit)} / {formatValue(metric.target, metric.unit)}
                          </span>
                        </div>
                        <Progress value={(metric.value / metric.target) * 100} className="h-2" />
                        <div className="flex items-center justify-between text-xs">
                          <span className={getStatusColor(metric.status)}>
                            {metric.status}
                          </span>
                          <span className="text-gray-500">
                            {metric.target > metric.value
                              ? `${(metric.target - metric.value).toFixed(1)} ${metric.unit} to go`
                              : `${(metric.value - metric.target).toFixed(1)} ${metric.unit} above target`}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Quality Tab */}
          <TabsContent value="quality" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-indigo-200 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-indigo-900">
                    <Award className="h-5 w-5 text-indigo-600" />
                    Quality Metrics
                  </CardTitle>
                  <CardDescription>
                    Customer satisfaction and service quality indicators
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {metrics.filter(m => m.category === 'quality').map((metric) => (
                      <div key={metric.id} className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-green-900">{metric.name}</h4>
                          <Badge className="bg-green-100 text-green-800">
                            {formatValue(metric.value, metric.unit)}
                          </Badge>
                        </div>
                        <p className="text-sm text-green-700 mb-3">{metric.description}</p>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-green-600">Target: {formatValue(metric.target || 0, metric.unit)}</span>
                          <div className="flex items-center gap-1">
                            {getTrendIcon(metric.trend)}
                            <span className="text-green-600">
                              {metric.changePercent > 0 ? '+' : ''}{metric.changePercent.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-indigo-200 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-indigo-900">
                    <Users className="h-5 w-5 text-indigo-600" />
                    Client Feedback Analysis
                  </CardTitle>
                  <CardDescription>
                    Sentiment analysis and feedback patterns
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Mock sentiment analysis */}
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <h4 className="font-medium text-blue-900 mb-2">Overall Sentiment</h4>
                      <div className="text-3xl font-bold text-blue-900 mb-2">Positive</div>
                      <p className="text-sm text-blue-700">78% of interactions show positive sentiment</p>
                      <Progress value={78} className="mt-3 h-2" />
                    </div>

                    <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                      <h4 className="font-medium text-purple-900 mb-2">Common Feedback Themes</h4>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-purple-700">Quick response times</span>
                          <Badge className="bg-green-100 text-green-800">92% positive</Badge>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-purple-700">Personalized service</span>
                          <Badge className="bg-green-100 text-green-800">88% positive</Badge>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-purple-700">Problem resolution</span>
                          <Badge className="bg-yellow-100 text-yellow-800">76% positive</Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Financial Tab */}
          <TabsContent value="financial" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2 border-indigo-200 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-indigo-900">
                    <DollarSign className="h-5 w-5 text-indigo-600" />
                    Financial Performance
                  </CardTitle>
                  <CardDescription>
                    Revenue, costs, and ROI analysis
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {metrics.filter(m => m.category === 'financial').map((metric) => (
                      <div key={metric.id} className="p-4 bg-gradient-to-r from-emerald-50 to-green-50 rounded-lg border border-emerald-200">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h4 className="font-medium text-emerald-900">{metric.name}</h4>
                            <p className="text-sm text-emerald-700">{metric.description}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-emerald-900">
                              {formatValue(metric.value, metric.unit)}
                            </p>
                            <div className="flex items-center gap-1 text-xs">
                              {getTrendIcon(metric.trend)}
                              <span className="text-emerald-600">
                                {metric.changePercent > 0 ? '+' : ''}{metric.changePercent.toFixed(1)}%
                              </span>
                            </div>
                          </div>
                        </div>

                        {metric.target && (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-emerald-700">Target Achievement</span>
                              <span className="font-medium text-emerald-900">
                                {((metric.value / metric.target) * 100).toFixed(1)}%
                              </span>
                            </div>
                            <Progress value={(metric.value / metric.target) * 100} className="h-2" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-indigo-200 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-indigo-900">
                    <TrendingUp className="h-5 w-5 text-indigo-600" />
                    ROI Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                      <h4 className="font-medium text-green-900 mb-2">Support ROI</h4>
                      <div className="text-2xl font-bold text-green-900 mb-2">324%</div>
                      <p className="text-sm text-green-700">Excellent return on investment</p>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Revenue Impact</span>
                        <span className="font-medium">+45%</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Cost Savings</span>
                        <span className="font-medium">+28%</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Efficiency Gains</span>
                        <span className="font-medium">+67%</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Customer Lifetime Value</span>
                        <span className="font-medium">+23%</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Customer Tab */}
          <TabsContent value="customer" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-indigo-200 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-indigo-900">
                    <Users className="h-5 w-5 text-indigo-600" />
                    Customer Metrics
                  </CardTitle>
                  <CardDescription>
                    Client satisfaction, retention, and engagement
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {metrics.filter(m => m.category === 'customer').map((metric) => (
                      <div key={metric.id} className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h4 className="font-medium text-blue-900">{metric.name}</h4>
                            <p className="text-sm text-blue-700">{metric.description}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-blue-900">
                              {formatValue(metric.value, metric.unit)}
                            </p>
                            <div className="flex items-center gap-1 text-xs">
                              {getTrendIcon(metric.trend)}
                              <span className="text-blue-600">
                                {metric.changePercent > 0 ? '+' : ''}{metric.changePercent.toFixed(1)}%
                              </span>
                            </div>
                          </div>
                        </div>

                        {metric.target && (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-blue-700">Progress to Target</span>
                              <span className="font-medium text-blue-900">
                                {((metric.value / metric.target) * 100).toFixed(1)}%
                              </span>
                            </div>
                            <Progress value={(metric.value / metric.target) * 100} className="h-2" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-indigo-200 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-indigo-900">
                    <Target className="h-5 w-5 text-indigo-600" />
                </CardTitle>
                  <CardDescription>
                    Client segment performance and trends
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Mock client segment analysis */}
                    <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                      <h4 className="font-medium text-purple-900 mb-2">VIP Client Performance</h4>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-purple-700">Satisfaction Score</span>
                          <Badge className="bg-green-100 text-green-800">4.9/5</Badge>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-purple-700">Retention Rate</span>
                          <Badge className="bg-green-100 text-green-800">96.8%</Badge>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-purple-700">Average Spend</span>
                          <Badge className="bg-blue-100 text-blue-800">15,000 PLN</Badge>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                      <h4 className="font-medium text-amber-900 mb-2">Premium Client Growth</h4>
                      <div className="text-2xl font-bold text-amber-900 mb-2">+23%</div>
                      <p className="text-sm text-amber-700">Growth in premium tier clients this quarter</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Operational Tab */}
          <TabsContent value="operational" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2 border-indigo-200 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-indigo-900">
                    <Activity className="h-5 w-5 text-indigo-600" />
                    Operational Efficiency
                  </CardTitle>
                  <CardDescription>
                    System performance and resource utilization
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {metrics.filter(m => m.category === 'operational').map((metric) => (
                      <div key={metric.id} className={`p-4 rounded-lg border ${
                        metric.status === 'warning' ? 'bg-yellow-50 border-yellow-200' :
                        'bg-gray-50 border-gray-200'
                      }`}>
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h4 className="font-medium">{metric.name}</h4>
                            <p className="text-sm text-gray-600">{metric.description}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold">
                              {formatValue(metric.value, metric.unit)}
                            </p>
                            <div className="flex items-center gap-1 text-xs">
                              {getTrendIcon(metric.trend)}
                              <span className={
                                metric.changePercent > 0 ? 'text-green-600' :
                                metric.changePercent < 0 ? 'text-red-600' :
                                'text-gray-600'
                              }>
                                {metric.changePercent > 0 ? '+' : ''}{metric.changePercent.toFixed(1)}%
                              </span>
                            </div>
                          </div>
                        </div>

                        {metric.status === 'warning' && (
                          <Alert>
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                              Agent utilization is below optimal range. Consider adjusting staffing levels.
                            </AlertDescription>
                          </Alert>
                        )}

                        {metric.target && (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-600">Target</span>
                              <span className="font-medium">{formatValue(metric.target, metric.unit)}</span>
                            </div>
                            <Progress value={(metric.value / metric.target) * 100} className="h-2" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-indigo-200 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-indigo-900">
                    <Clock className="h-5 w-5 text-indigo-600" />
                    Response Times
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                      <h4 className="font-medium text-green-900 mb-2">First Response</h4>
                      <div className="text-2xl font-bold text-green-900 mb-1">1.2 min</div>
                      <p className="text-sm text-green-700">Target: 2.0 min</p>
                      <div className="flex items-center gap-1 text-xs text-green-600 mt-2">
                        <ArrowDown className="h-3 w-3" />
                        <span>20% improvement</span>
                      </div>
                    </div>

                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <h4 className="font-medium text-blue-900 mb-2">Resolution Time</h4>
                      <div className="text-2xl font-bold text-blue-900 mb-1">12.5 min</div>
                      <p className="text-sm text-blue-700">Target: 15.0 min</p>
                      <div className="flex items-center gap-1 text-xs text-blue-600 mt-2">
                        <ArrowDown className="h-3 w-3" />
                        <span>8% improvement</span>
                      </div>
                    </div>

                    <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                      <h4 className="font-medium text-purple-900 mb-2">VIP Response</h4>
                      <div className="text-2xl font-bold text-purple-900 mb-1">0.8 min</div>
                      <p className="text-sm text-purple-700">Target: 1.0 min</p>
                      <div className="flex items-center gap-1 text-xs text-purple-600 mt-2">
                        <ArrowDown className="h-3 w-3" />
                        <span>15% improvement</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ComprehensiveAnalytics;