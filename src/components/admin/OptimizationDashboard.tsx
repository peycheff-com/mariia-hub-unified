/**
 * Optimization Dashboard - Admin Interface
 *
 * Comprehensive admin dashboard for managing and monitoring all optimization systems
 * Provides real-time insights, controls, and analytics for continuous improvement
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
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
  ResponsiveContainer
} from 'recharts';

// Mock data and imports for optimization systems
import PerformanceMonitoringSystem from '@/lib/optimization/performance-monitoring';
import IssueDetectionFramework from '@/lib/optimization/issue-detection';
import ConversionOptimizationEngine from '@/lib/optimization/conversion-optimization';
import ABTestingPlatform from '@/lib/optimization/ab-testing';
import SEOMonitoringSystem from '@/lib/optimization/seo-monitoring';
import ContentPerformanceIntelligence from '@/lib/optimization/content-intelligence';
import FeedbackIntelligenceSystem from '@/lib/optimization/feedback-intelligence';
import ContinuousImprovementEngine from '@/lib/optimization/continuous-improvement';

interface OptimizationOverview {
  totalSystems: number;
  activeSystems: number;
  criticalIssues: number;
  improvementsImplemented: number;
  averageROI: number;
  systemHealth: 'excellent' | 'good' | 'warning' | 'critical';
}

interface SystemStatus {
  name: string;
  status: 'active' | 'inactive' | 'error' | 'maintenance';
  lastUpdate: string;
  performance: number;
  issues: number;
  uptime: number;
}

interface MetricCard {
  title: string;
  value: string | number;
  change: number;
  changeType: 'increase' | 'decrease';
  icon: string;
  description: string;
}

interface OptimizationAlert {
  id: string;
  type: 'critical' | 'warning' | 'info' | 'success';
  title: string;
  description: string;
  timestamp: string;
  system: string;
  actionable: boolean;
}

const OptimizationDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [systemStatuses, setSystemStatuses] = useState<SystemStatus[]>([]);
  const [optimizationOverview, setOptimizationOverview] = useState<OptimizationOverview | null>(null);
  const [alerts, setAlerts] = useState<OptimizationAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState('7d');

  // Initialize optimization systems on component mount
  useEffect(() => {
    initializeOptimizationSystems();
    loadDashboardData();

    // Set up real-time updates
    const interval = setInterval(() => {
      loadDashboardData();
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [selectedTimeRange]);

  const initializeOptimizationSystems = async () => {
    try {
      // Initialize all optimization systems
      await Promise.all([
        PerformanceMonitoringSystem.getInstance().startMonitoring(),
        IssueDetectionFramework.getInstance().startDetection(),
        ConversionOptimizationEngine.getInstance().startOptimization(),
        ABTestingPlatform.getInstance().startPlatform(),
        SEOMonitoringSystem.getInstance().startMonitoring(),
        ContentPerformanceIntelligence.getInstance().startContentAnalysis(),
        FeedbackIntelligenceSystem.getInstance().startFeedbackProcessing(),
        ContinuousImprovementEngine.getInstance().startContinuousLearning()
      ]);

      console.log('All optimization systems initialized successfully');
    } catch (error) {
      console.error('Failed to initialize optimization systems:', error);
    }
  };

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Load system statuses
      const statuses = await loadSystemStatuses();
      setSystemStatuses(statuses);

      // Load optimization overview
      const overview = await loadOptimizationOverview();
      setOptimizationOverview(overview);

      // Load recent alerts
      const recentAlerts = await loadRecentAlerts();
      setAlerts(recentAlerts);

    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSystemStatuses = async (): Promise<SystemStatus[]> => {
    // Mock system statuses - in real implementation, fetch from each system
    return [
      {
        name: 'Performance Monitoring',
        status: 'active',
        lastUpdate: new Date().toISOString(),
        performance: 95,
        issues: 0,
        uptime: 99.9
      },
      {
        name: 'Issue Detection',
        status: 'active',
        lastUpdate: new Date().toISOString(),
        performance: 88,
        issues: 2,
        uptime: 99.7
      },
      {
        name: 'Conversion Optimization',
        status: 'active',
        lastUpdate: new Date().toISOString(),
        performance: 92,
        issues: 0,
        uptime: 99.8
      },
      {
        name: 'A/B Testing',
        status: 'active',
        lastUpdate: new Date().toISOString(),
        performance: 90,
        issues: 1,
        uptime: 99.5
      },
      {
        name: 'SEO Monitoring',
        status: 'active',
        lastUpdate: new Date().toISOString(),
        performance: 87,
        issues: 3,
        uptime: 99.6
      },
      {
        name: 'Content Intelligence',
        status: 'active',
        lastUpdate: new Date().toISOString(),
        performance: 93,
        issues: 0,
        uptime: 99.9
      },
      {
        name: 'Feedback Analysis',
        status: 'active',
        lastUpdate: new Date().toISOString(),
        performance: 91,
        issues: 1,
        uptime: 99.4
      },
      {
        name: 'ML Improvement Engine',
        status: 'active',
        lastUpdate: new Date().toISOString(),
        performance: 89,
        issues: 2,
        uptime: 99.3
      }
    ];
  };

  const loadOptimizationOverview = async (): Promise<OptimizationOverview> => {
    // Mock overview data - in real implementation, aggregate from all systems
    return {
      totalSystems: 8,
      activeSystems: 8,
      criticalIssues: 9,
      improvementsImplemented: 47,
      averageROI: 167,
      systemHealth: 'good'
    };
  };

  const loadRecentAlerts = async (): Promise<OptimizationAlert[]> => {
    // Mock alerts - in real implementation, fetch from system logs
    return [
      {
        id: '1',
        type: 'warning',
        title: 'SEO Ranking Drop Detected',
        description: 'Keyword "beauty salon warsaw" dropped from position 3 to 8',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        system: 'SEO Monitoring',
        actionable: true
      },
      {
        id: '2',
        type: 'success',
        title: 'A/B Test Completed Successfully',
        description: 'Mobile CTA variant B showed 22% improvement in conversion rate',
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        system: 'A/B Testing',
        actionable: false
      },
      {
        id: '3',
        type: 'critical',
        title: 'Performance Regression Detected',
        description: 'Page load time increased by 45% for mobile users',
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        system: 'Performance Monitoring',
        actionable: true
      },
      {
        id: '4',
        type: 'info',
        title: 'New Learning Pattern Identified',
        description: 'Evening bookings show 35% higher conversion rates',
        timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
        system: 'ML Improvement Engine',
        actionable: true
      }
    ];
  };

  const getMetricCards = (): MetricCard[] => {
    return [
      {
        title: 'Active Systems',
        value: optimizationOverview?.activeSystems || 0,
        change: 0,
        changeType: 'increase',
        icon: '¡',
        description: 'Systems currently running'
      },
      {
        title: 'Critical Issues',
        value: optimizationOverview?.criticalIssues || 0,
        change: -2,
        changeType: 'decrease',
        icon: ' ',
        description: 'Issues requiring immediate attention'
      },
      {
        title: 'Improvements Implemented',
        value: optimizationOverview?.improvementsImplemented || 0,
        change: 5,
        changeType: 'increase',
        icon: '',
        description: 'Total optimizations deployed'
      },
      {
        title: 'Average ROI',
        value: `${optimizationOverview?.averageROI || 0}%`,
        change: 12,
        changeType: 'increase',
        icon: '=°',
        description: 'Return on investment for optimizations'
      }
    ];
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'inactive': return 'bg-gray-500';
      case 'error': return 'bg-red-500';
      case 'maintenance': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getHealthColor = (health: string): string => {
    switch (health) {
      case 'excellent': return 'text-green-600';
      case 'good': return 'text-blue-600';
      case 'warning': return 'text-yellow-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getAlertIcon = (type: string): string => {
    switch (type) {
      case 'critical': return '=¨';
      case 'warning': return ' ';
      case 'info': return '9';
      case 'success': return '';
      default: return '=â';
    }
  };

  const getAlertColor = (type: string): string => {
    switch (type) {
      case 'critical': return 'border-red-200 bg-red-50';
      case 'warning': return 'border-yellow-200 bg-yellow-50';
      case 'info': return 'border-blue-200 bg-blue-50';
      case 'success': return 'border-green-200 bg-green-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  // Mock chart data
  const performanceData = [
    { name: 'Mon', performance: 95, issues: 2 },
    { name: 'Tue', performance: 93, issues: 3 },
    { name: 'Wed', performance: 96, issues: 1 },
    { name: 'Thu', performance: 94, issues: 2 },
    { name: 'Fri', performance: 97, issues: 1 },
    { name: 'Sat', performance: 95, issues: 2 },
    { name: 'Sun', performance: 96, issues: 1 }
  ];

  const roiData = [
    { month: 'Jan', roi: 120 },
    { month: 'Feb', roi: 135 },
    { month: 'Mar', roi: 142 },
    { month: 'Apr', roi: 158 },
    { month: 'May', roi: 167 },
    { month: 'Jun', roi: 175 }
  ];

  const systemDistribution = [
    { name: 'Active', value: optimizationOverview?.activeSystems || 0, color: '#10b981' },
    { name: 'Inactive', value: (optimizationOverview?.totalSystems || 0) - (optimizationOverview?.activeSystems || 0), color: '#6b7280' }
  ];

  const conversionFunnelData = [
    { stage: 'Visitors', value: 10000, conversion: 100 },
    { stage: 'Engaged', value: 3500, conversion: 35 },
    { stage: 'Bookings', value: 875, conversion: 25 },
    { stage: 'Completed', value: 700, conversion: 80 }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Optimization Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Optimization Dashboard</h1>
          <p className="text-gray-600">Comprehensive monitoring and management of optimization systems</p>
        </div>
        <div className="flex items-center space-x-4">
          <Badge variant="outline" className={getHealthColor(optimizationOverview?.systemHealth || 'good')}>
            System Health: {optimizationOverview?.systemHealth || 'Good'}
          </Badge>
          <select
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </select>
          <Button onClick={() => loadDashboardData()}>Refresh</Button>
        </div>
      </div>

      {/* Alerts Section */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.slice(0, 3).map((alert) => (
            <Alert key={alert.id} className={getAlertColor(alert.type)}>
              <div className="flex items-start space-x-3">
                <span className="text-lg">{getAlertIcon(alert.type)}</span>
                <div className="flex-1">
                  <AlertTitle className="text-sm font-medium">{alert.title}</AlertTitle>
                  <AlertDescription className="text-sm">
                    {alert.description} - {new Date(alert.timestamp).toLocaleTimeString()}
                  </AlertDescription>
                </div>
                {alert.actionable && (
                  <Button size="sm" variant="outline">Take Action</Button>
                )}
              </div>
            </Alert>
          ))}
        </div>
      )}

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="optimizations">Optimizations</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
          <TabsTrigger value="systems">Systems</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Metric Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {getMetricCards().map((metric, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">{metric.title}</p>
                      <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
                      <div className="flex items-center mt-1">
                        <span className={`text-sm font-medium ${
                          metric.changeType === 'increase' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {metric.changeType === 'increase' ? '‘' : '“'} {Math.abs(metric.change)}%
                        </span>
                        <span className="text-sm text-gray-500 ml-2">{metric.description}</span>
                      </div>
                    </div>
                    <div className="text-3xl">{metric.icon}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>System Performance Trend</CardTitle>
                <CardDescription>Daily performance metrics and issue count</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Line yAxisId="left" type="monotone" dataKey="performance" stroke="#3b82f6" name="Performance %" />
                    <Line yAxisId="right" type="monotone" dataKey="issues" stroke="#ef4444" name="Issues" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>ROI Trend</CardTitle>
                <CardDescription>Monthly return on investment from optimizations</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={roiData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="roi" stroke="#10b981" fill="#10b981" fillOpacity={0.6} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Conversion Funnel */}
          <Card>
            <CardHeader>
              <CardTitle>Conversion Funnel</CardTitle>
              <CardDescription>User journey through booking process</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={conversionFunnelData} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="stage" type="category" />
                  <Tooltip />
                  <Bar dataKey="value" fill="#8b5cf6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {systemStatuses.map((system, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{system.name}</CardTitle>
                    <div className={`w-3 h-3 rounded-full ${getStatusColor(system.status)}`}></div>
                  </div>
                  <CardDescription>
                    Last updated: {new Date(system.lastUpdate).toLocaleString()}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Performance</span>
                      <span>{system.performance}%</span>
                    </div>
                    <Progress value={system.performance} className="w-full" />
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Issues</p>
                      <p className="font-semibold">{system.issues}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Uptime</p>
                      <p className="font-semibold">{system.uptime}%</p>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline">View Details</Button>
                    <Button size="sm" variant="outline">Configure</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Optimizations Tab */}
        <TabsContent value="optimizations" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Active Experiments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Mobile CTA Optimization</span>
                    <Badge variant="outline">Running</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Price Display Test</span>
                    <Badge variant="outline">Running</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Landing Page Layout</span>
                    <Badge variant="secondary">Completed</Badge>
                  </div>
                </div>
                <Button className="w-full mt-4">View All Experiments</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Improvements</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="border-l-4 border-green-500 pl-4">
                    <p className="font-medium">Page Speed Optimization</p>
                    <p className="text-sm text-gray-600">+35% load time improvement</p>
                  </div>
                  <div className="border-l-4 border-blue-500 pl-4">
                    <p className="font-medium">Mobile Booking Flow</p>
                    <p className="text-sm text-gray-600">+22% conversion increase</p>
                  </div>
                  <div className="border-l-4 border-purple-500 pl-4">
                    <p className="font-medium">SEO Meta Tags</p>
                    <p className="text-sm text-gray-600">+15% organic traffic</p>
                  </div>
                </div>
                <Button className="w-full mt-4">View All Improvements</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>System Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={systemDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {systemDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-4 space-y-2">
                  {systemDistribution.map((item, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <div className="flex items-center">
                        <div className={`w-3 h-3 rounded-full mr-2`} style={{ backgroundColor: item.color }}></div>
                        {item.name}
                      </div>
                      <span>{item.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Insights Tab */}
        <TabsContent value="insights" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>ML Insights</CardTitle>
                <CardDescription>Machine learning generated insights</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">Mobile Conversion Gap</h4>
                      <Badge>89% Confidence</Badge>
                    </div>
                    <p className="text-sm text-gray-600">
                      Mobile users show 25% lower conversion rates compared to desktop users.
                    </p>
                    <div className="mt-2">
                      <span className="text-xs text-green-600">Potential ROI: 180%</span>
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">Seasonal Demand Pattern</h4>
                      <Badge>84% Confidence</Badge>
                    </div>
                    <p className="text-sm text-gray-600">
                      Summer months project 45% increase in beauty treatment bookings.
                    </p>
                    <div className="mt-2">
                      <span className="text-xs text-green-600">Potential ROI: 200%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Learning Patterns</CardTitle>
                <CardDescription>Identified patterns and trends</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Customer Retention Pattern</h4>
                    <p className="text-sm text-gray-600 mb-2">
                      Customers with 3+ visits have 90% retention rate
                    </p>
                    <div className="flex items-center space-x-2">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-green-600 h-2 rounded-full" style={{ width: '91%' }}></div>
                      </div>
                      <span className="text-xs">91% Strength</span>
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Mobile Adoption Trend</h4>
                    <p className="text-sm text-gray-600 mb-2">
                      15% monthly increase in mobile booking adoption
                    </p>
                    <div className="flex items-center space-x-2">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-blue-600 h-2 rounded-full" style={{ width: '92%' }}></div>
                      </div>
                      <span className="text-xs">92% Strength</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Systems Tab */}
        <TabsContent value="systems" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {systemStatuses.map((system, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{system.name}</CardTitle>
                    <div className={`w-3 h-3 rounded-full ${getStatusColor(system.status)}`}></div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Status</p>
                      <p className="font-semibold capitalize">{system.status}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Performance</p>
                      <p className="font-semibold">{system.performance}%</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Issues</p>
                      <p className="font-semibold">{system.issues}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Uptime</p>
                      <p className="font-semibold">{system.uptime}%</p>
                    </div>
                  </div>

                  <div className="pt-2 border-t">
                    <p className="text-xs text-gray-500 mb-2">
                      Last updated: {new Date(system.lastUpdate).toLocaleString()}
                    </p>
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline" className="flex-1">Configure</Button>
                      <Button size="sm" variant="outline" className="flex-1">Logs</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Available Reports</CardTitle>
                <CardDescription>Generate comprehensive optimization reports</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button variant="outline" className="w-full justify-start">
                    =Ê Performance Summary Report
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    = SEO Analysis Report
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    >ê A/B Testing Results
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    =¬ Customer Feedback Report
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    > ML Insights Report
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    =È ROI Analysis Report
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>System Metrics</CardTitle>
                <CardDescription>Real-time system performance indicators</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>CPU Usage</span>
                      <span>32%</span>
                    </div>
                    <Progress value={32} />
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Memory Usage</span>
                      <span>67%</span>
                    </div>
                    <Progress value={67} />
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Database Load</span>
                      <span>45%</span>
                    </div>
                    <Progress value={45} />
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>API Response Time</span>
                      <span>120ms</span>
                    </div>
                    <Progress value={20} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default OptimizationDashboard;