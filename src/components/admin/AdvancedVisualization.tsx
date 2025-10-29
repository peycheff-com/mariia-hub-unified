import React, { useState, useMemo, useCallback } from 'react';
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
  ComposedChart,
  Treemap,
  Sankey,
  FunnelChart,
  Funnel,
  LabelList,
  ReferenceLine,
  Brush,
  Zoom
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Target,
  Zap,
  BarChart3,
  PieChart as PieChartIcon,
  Download,
  Settings,
  Maximize2,
  Grid,
  Layers,
  Filter,
  Calendar,
  MapPin,
  Users,
  Eye,
  MousePointer
} from 'lucide-react';
import { format, subDays } from 'date-fns';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

// Advanced visualization types
interface HeatmapData {
  x: string;
  y: string;
  value: number;
  category?: string;
}

interface NetworkData {
  nodes: Array<{
    id: string;
    name: string;
    group: string;
    value: number;
    x?: number;
    y?: number;
  }>;
  links: Array<{
    source: string;
    target: string;
    value: number;
  }>;
}

interface SankeyData {
  nodes: Array<{
    name: string;
  }>;
  links: Array<{
    source: number;
    target: number;
    value: number;
  }>;
}

interface ChartConfig {
  type: 'line' | 'area' | 'bar' | 'scatter' | 'radar' | 'treemap' | 'heatmap' | 'sankey' | 'funnel';
  title: string;
  dataSource: string;
  metrics: string[];
  dimensions: string[];
  interactive: boolean;
  animations: boolean;
  realTime: boolean;
}

const AdvancedVisualization: React.FC = () => {
  const [selectedChart, setSelectedChart] = useState<ChartConfig['type']>('line');
  const [interactionsEnabled, setInteractionsEnabled] = useState(true);
  const [animationsEnabled, setAnimationsEnabled] = useState(true);
  const [realTimeMode, setRealTimeMode] = useState(false);
  const [selectedTimeRange, setSelectedTimeRange] = useState([30]);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['all']);
  const [brushSelection, setBrushSelection] = useState<[number, number] | null>(null);

  // Color palettes for different visualizations
  const colorPalettes = {
    primary: ['#8B4513', '#F5DEB3', '#D2691E', '#DEB887', '#BC8F8F', '#F4A460'],
    secondary: ['#CD853F', '#DEB887', '#F5DEB3', '#FFE4B5', '#FFDEAD', '#FFE4C4'],
    gradient: {
      start: '#F5DEB3',
      middle: '#D2691E',
      end: '#8B4513'
    }
  };

  // Sample data for different chart types
  const timeSeriesData = useMemo(() => {
    return Array.from({ length: 90 }, (_, i) => ({
      date: format(subDays(new Date(), 89 - i), 'MMM dd'),
      revenue: Math.random() * 5000 + 3000 + Math.sin(i / 10) * 500,
      bookings: Math.floor(Math.random() * 30) + 15 + Math.cos(i / 8) * 5,
      customers: Math.floor(Math.random() * 50) + 25 + Math.sin(i / 12) * 10,
      satisfaction: 4.2 + Math.random() * 0.8,
      occupancy: 75 + Math.random() * 20
    }));
  }, []);

  const categoryData = useMemo(() => [
    { category: 'Beauty', revenue: 45000, bookings: 320, satisfaction: 4.6, growth: 12.5 },
    { category: 'Fitness', revenue: 32000, bookings: 280, satisfaction: 4.4, growth: 18.2 },
    { category: 'Lifestyle', revenue: 18000, bookings: 120, satisfaction: 4.2, growth: 8.7 }
  ], []);

  const heatmapData: HeatmapData[] = useMemo(() => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const hours = Array.from({ length: 24 }, (_, i) => `${i}:00`);

    return days.flatMap(day =>
      hours.map(hour => ({
        x: hour,
        y: day,
        value: Math.random() * 100,
        category: day === 'Sat' || day === 'Sun' ? 'weekend' : 'weekday'
      }))
    );
  }, []);

  const radarData = useMemo(() => [
    { subject: 'Revenue', A: 85, B: 70, fullMark: 100 },
    { subject: 'Bookings', A: 78, B: 85, fullMark: 100 },
    { subject: 'Satisfaction', A: 92, B: 88, fullMark: 100 },
    { subject: 'Occupancy', A: 75, B: 82, fullMark: 100 },
    { subject: 'Growth', A: 88, B: 75, fullMark: 100 },
    { subject: 'Efficiency', A: 82, B: 90, fullMark: 100 }
  ], []);

  const networkData: NetworkData = useMemo(() => ({
    nodes: [
      { id: 'main', name: 'Main Location', group: 'primary', value: 100 },
      { id: 'branch1', name: 'Branch 1', group: 'secondary', value: 75 },
      { id: 'branch2', name: 'Branch 2', group: 'secondary', value: 60 },
      { id: 'partner1', name: 'Partner A', group: 'partner', value: 40 },
      { id: 'partner2', name: 'Partner B', group: 'partner', value: 35 }
    ],
    links: [
      { source: 'main', target: 'branch1', value: 85 },
      { source: 'main', target: 'branch2', value: 70 },
      { source: 'main', target: 'partner1', value: 45 },
      { source: 'branch1', target: 'partner2', value: 30 }
    ]
  }), []);

  const sankeyData: SankeyData = useMemo(() => ({
    nodes: [
      { name: 'New Customers' },
      { name: 'Returning' },
      { name: 'Referrals' },
      { name: 'Beauty Services' },
      { name: 'Fitness Services' },
      { name: 'Lifestyle Services' },
      { name: 'Completed' },
      { name: 'Cancelled' }
    ],
    links: [
      { source: 0, target: 3, value: 45 },
      { source: 0, target: 4, value: 25 },
      { source: 0, target: 5, value: 15 },
      { source: 1, target: 3, value: 30 },
      { source: 1, target: 4, value: 35 },
      { source: 1, target: 5, value: 20 },
      { source: 2, target: 3, value: 20 },
      { source: 2, target: 4, value: 15 },
      { source: 2, target: 5, value: 10 },
      { source: 3, target: 6, value: 85 },
      { source: 4, target: 6, value: 90 },
      { source: 5, target: 6, value: 88 },
      { source: 3, target: 7, value: 15 },
      { source: 4, target: 7, value: 10 },
      { source: 5, target: 7, value: 12 }
    ]
  }), []);

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-charcoal border border-champagne/30 rounded-lg p-3 shadow-lg">
          <p className="text-pearl font-medium mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {typeof entry.value === 'number' ? entry.value.toFixed(2) : entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Heatmap cell component
  const HeatmapCell = ({ x, y, value, category }: HeatmapData) => {
    const intensity = value / 100;
    const color = category === 'weekend'
      ? `rgba(212, 165, 116, ${intensity})`
      : `rgba(139, 69, 19, ${intensity})`;

    return (
      <div
        className="border border-champagne/20 cursor-pointer hover:opacity-80 transition-opacity"
        style={{ backgroundColor: color }}
        title={`${x} - ${y}: ${value.toFixed(1)}%`}
      />
    );
  };

  // Interactive chart handlers
  const handleChartClick = useCallback((data: any) => {
    console.log('Chart clicked:', data);
  }, []);

  const handleZoom = useCallback((zoomState: any) => {
    console.log('Zoom changed:', zoomState);
  }, []);

  const renderVisualization = () => {
    switch (selectedChart) {
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart
              data={timeSeriesData}
              onClick={handleChartClick}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#424242" />
              <XAxis dataKey="date" stroke="#F5F1ED" />
              <YAxis stroke="#F5F1ED" />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              {interactionsEnabled && <Brush dataKey="date" height={30} stroke="#D4A574" />}
              {realTimeMode && <ReferenceLine x={timeSeriesData.length - 1} stroke="#D4A574" strokeDasharray="5 5" />}
              <Line
                type="monotone"
                dataKey="revenue"
                stroke={colorPalettes.primary[0]}
                strokeWidth={2}
                dot={false}
                animationDuration={animationsEnabled ? 1000 : 0}
              />
              <Line
                type="monotone"
                dataKey="bookings"
                stroke={colorPalettes.primary[1]}
                strokeWidth={2}
                dot={false}
                animationDuration={animationsEnabled ? 1000 : 0}
              />
            </LineChart>
          </ResponsiveContainer>
        );

      case 'area':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart
              data={timeSeriesData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#424242" />
              <XAxis dataKey="date" stroke="#F5F1ED" />
              <YAxis stroke="#F5F1ED" />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Area
                type="monotone"
                dataKey="revenue"
                stackId="1"
                stroke={colorPalettes.primary[0]}
                fill={colorPalettes.primary[0]}
                fillOpacity={0.6}
                animationDuration={animationsEnabled ? 1000 : 0}
              />
              <Area
                type="monotone"
                dataKey="bookings"
                stackId="1"
                stroke={colorPalettes.primary[1]}
                fill={colorPalettes.primary[1]}
                fillOpacity={0.6}
                animationDuration={animationsEnabled ? 1000 : 0}
              />
            </AreaChart>
          </ResponsiveContainer>
        );

      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart
              data={categoryData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#424242" />
              <XAxis dataKey="category" stroke="#F5F1ED" />
              <YAxis stroke="#F5F1ED" />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="revenue" fill={colorPalettes.primary[0]} animationDuration={animationsEnabled ? 1000 : 0} />
              <Bar dataKey="bookings" fill={colorPalettes.primary[1]} animationDuration={animationsEnabled ? 1000 : 0} />
            </BarChart>
          </ResponsiveContainer>
        );

      case 'scatter':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <ScatterChart
              data={timeSeriesData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#424242" />
              <XAxis type="number" dataKey="bookings" stroke="#F5F1ED" />
              <YAxis type="number" dataKey="revenue" stroke="#F5F1ED" />
              <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
              <Scatter
                name="Performance"
                data={timeSeriesData}
                fill={colorPalettes.primary[0]}
                animationDuration={animationsEnabled ? 1000 : 0}
              />
            </ScatterChart>
          </ResponsiveContainer>
        );

      case 'radar':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#424242" />
              <PolarAngleAxis dataKey="subject" stroke="#F5F1ED" />
              <PolarRadiusAxis angle={90} domain={[0, 100]} stroke="#F5F1ED" />
              <Radar
                name="Current Period"
                dataKey="A"
                stroke={colorPalettes.primary[0]}
                fill={colorPalettes.primary[0]}
                fillOpacity={0.6}
                animationDuration={animationsEnabled ? 1000 : 0}
              />
              <Radar
                name="Previous Period"
                dataKey="B"
                stroke={colorPalettes.primary[1]}
                fill={colorPalettes.primary[1]}
                fillOpacity={0.6}
                animationDuration={animationsEnabled ? 1000 : 0}
              />
              <Legend />
              <Tooltip content={<CustomTooltip />} />
            </RadarChart>
          </ResponsiveContainer>
        );

      case 'treemap':
        const treemapData = categoryData.map(cat => ({
          name: cat.category,
          size: cat.revenue,
          children: [
            { name: 'Revenue', size: cat.revenue },
            { name: 'Bookings', size: cat.bookings * 100 }
          ]
        }));

        return (
          <ResponsiveContainer width="100%" height={400}>
            <Treemap
              data={[{ name: 'root', children: treemapData }]}
              dataKey="size"
              aspectRatio={4 / 3}
              stroke="#424242"
              fill={colorPalettes.primary[0]}
              animationDuration={animationsEnabled ? 1000 : 0}
            />
          </ResponsiveContainer>
        );

      case 'heatmap':
        return (
          <div className="p-4">
            <div className="grid grid-cols-24 gap-0 border border-champagne/30">
              <div className="col-span-1" />
              {Array.from({ length: 24 }, (_, i) => (
                <div key={i} className="text-xs text-champagne/50 text-center p-1">
                  {i}
                </div>
              ))}
              {heatmapData.map((cell, index) => (
                <HeatmapCell key={index} {...cell} />
              ))}
            </div>
          </div>
        );

      case 'sankey':
        return (
          <div className="p-4">
            <div className="text-champagne/50 text-center py-12">
              <Activity className="w-16 h-16 mx-auto mb-4" />
              <p>Sankey diagram component requires additional library integration</p>
              <p className="text-sm mt-2">Ready for implementation with D3.js or similar</p>
            </div>
          </div>
        );

      case 'funnel':
        const funnelData = [
          { name: 'Visitors', value: 10000, fill: colorPalettes.primary[0] },
          { name: 'Sign-ups', value: 3500, fill: colorPalettes.primary[1] },
          { name: 'Bookings', value: 1200, fill: colorPalettes.primary[2] },
          { name: 'Payments', value: 1100, fill: colorPalettes.primary[3] },
          { name: 'Completed', value: 1050, fill: colorPalettes.primary[4] }
        ];

        return (
          <ResponsiveContainer width="100%" height={400}>
            <FunnelChart>
              <Tooltip content={<CustomTooltip />} />
              <Funnel
                dataKey="value"
                data={funnelData}
                isAnimationActive={animationsEnabled}
                animationDuration={1000}
              >
                <LabelList position="center" fill="#F5F1ED" stroke="none" />
              </Funnel>
            </FunnelChart>
          </ResponsiveContainer>
        );

      default:
        return (
          <div className="flex items-center justify-center h-96 text-champagne/50">
            Select a visualization type
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
              <Layers className="w-10 h-10 text-champagne" />
              Advanced Visualizations
            </h1>
            <p className="text-champagne/70 mt-2">
              Interactive data visualizations with real-time updates and advanced features
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" className="border-graphite/50 hover:bg-champagne/10">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button variant="outline" size="sm" className="border-graphite/50 hover:bg-champagne/10">
              <Settings className="w-4 h-4 mr-2" />
              Customize
            </Button>
          </div>
        </div>

        {/* Controls */}
        <Card className="bg-charcoal/50 border-graphite/30">
          <CardHeader>
            <CardTitle className="text-pearl">Visualization Controls</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Chart Type Selection */}
              <div>
                <Label className="text-champagne mb-2 block">Chart Type</Label>
                <Select value={selectedChart} onValueChange={(value: ChartConfig['type']) => setSelectedChart(value)}>
                  <SelectTrigger className="bg-charcoal border-graphite/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="line">Line Chart</SelectItem>
                    <SelectItem value="area">Area Chart</SelectItem>
                    <SelectItem value="bar">Bar Chart</SelectItem>
                    <SelectItem value="scatter">Scatter Plot</SelectItem>
                    <SelectItem value="radar">Radar Chart</SelectItem>
                    <SelectItem value="treemap">Treemap</SelectItem>
                    <SelectItem value="heatmap">Heatmap</SelectItem>
                    <SelectItem value="sankey">Sankey Diagram</SelectItem>
                    <SelectItem value="funnel">Funnel Chart</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Interaction Controls */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-champagne">Interactions</Label>
                  <Switch
                    checked={interactionsEnabled}
                    onCheckedChange={setInteractionsEnabled}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-champagne">Animations</Label>
                  <Switch
                    checked={animationsEnabled}
                    onCheckedChange={setAnimationsEnabled}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-champagne">Real-time</Label>
                  <Switch
                    checked={realTimeMode}
                    onCheckedChange={setRealTimeMode}
                  />
                </div>
              </div>

              {/* Time Range */}
              <div>
                <Label className="text-champagne mb-2 block">Time Range (Days)</Label>
                <Slider
                  value={selectedTimeRange}
                  onValueChange={setSelectedTimeRange}
                  max={365}
                  min={7}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-champagne/50 mt-1">
                  <span>7</span>
                  <span>{selectedTimeRange[0]}</span>
                  <span>365</span>
                </div>
              </div>

              {/* Zoom Control */}
              <div>
                <Label className="text-champagne mb-2 block">Zoom Level</Label>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setZoomLevel(Math.max(50, zoomLevel - 10))}
                    className="border-graphite/50"
                  >
                    -
                  </Button>
                  <span className="text-champagne min-w-[3rem] text-center">{zoomLevel}%</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setZoomLevel(Math.min(200, zoomLevel + 10))}
                    className="border-graphite/50"
                  >
                    +
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setZoomLevel(100)}
                    className="border-graphite/50"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Visualization */}
        <Card className="bg-charcoal/50 border-graphite/30">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-pearl capitalize">
                {selectedChart} Visualization
              </CardTitle>
              <div className="flex items-center gap-2">
                {realTimeMode && (
                  <Badge className="bg-green-500/20 text-green-500">
                    <Activity className="w-3 h-3 mr-1" />
                    Live
                  </Badge>
                )}
                {interactionsEnabled && (
                  <Badge className="bg-blue-500/20 text-blue-500">
                    <MousePointer className="w-3 h-3 mr-1" />
                    Interactive
                  </Badge>
                )}
                {animationsEnabled && (
                  <Badge className="bg-purple-500/20 text-purple-500">
                    <Zap className="w-3 h-3 mr-1" />
                    Animated
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div
              style={{
                transform: `scale(${zoomLevel / 100})`,
                transformOrigin: 'top left',
                transition: 'transform 0.3s ease'
              }}
            >
              {renderVisualization()}
            </div>
          </CardContent>
        </Card>

        {/* Additional Visualizations Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Performance Comparison */}
          <Card className="bg-charcoal/50 border-graphite/30">
            <CardHeader>
              <CardTitle className="text-pearl">Category Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={categoryData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#424242" />
                  <XAxis dataKey="category" stroke="#F5F1ED" />
                  <YAxis stroke="#F5F1ED" />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="growth" fill={colorPalettes.primary[0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Radar Comparison */}
          <Card className="bg-charcoal/50 border-graphite/30">
            <CardHeader>
              <CardTitle className="text-pearl">Performance Radar</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#424242" />
                  <PolarAngleAxis dataKey="subject" stroke="#F5F1ED" />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} stroke="#F5F1ED" />
                  <Radar
                    name="Current"
                    dataKey="A"
                    stroke={colorPalettes.primary[0]}
                    fill={colorPalettes.primary[0]}
                    fillOpacity={0.3}
                  />
                  <Tooltip content={<CustomTooltip />} />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Interactive Features Demo */}
        <Card className="bg-charcoal/50 border-graphite/30">
          <CardHeader>
            <CardTitle className="text-pearl">Interactive Features</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-6 bg-champagne/10 rounded-lg">
                <Filter className="w-12 h-12 mx-auto mb-3 text-champagne" />
                <h3 className="text-pearl font-medium mb-2">Dynamic Filtering</h3>
                <p className="text-champagne/70 text-sm">
                  Real-time data filtering with multiple criteria
                </p>
              </div>
              <div className="text-center p-6 bg-champagne/10 rounded-lg">
                <Calendar className="w-12 h-12 mx-auto mb-3 text-champagne" />
                <h3 className="text-pearl font-medium mb-2">Time Range Selection</h3>
                <p className="text-champagne/70 text-sm">
                  Flexible time range selection with brush controls
                </p>
              </div>
              <div className="text-center p-6 bg-champagne/10 rounded-lg">
                <MapPin className="w-12 h-12 mx-auto mb-3 text-champagne" />
                <h3 className="text-pearl font-medium mb-2">Geographic Analysis</h3>
                <p className="text-champagne/70 text-sm">
                  Location-based performance insights
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdvancedVisualization;