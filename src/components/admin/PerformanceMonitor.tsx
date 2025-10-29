import React, { useState, useEffect } from 'react';
import { Activity, AlertTriangle, CheckCircle, Clock, Zap, Database, Wifi } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { performanceMonitor, usePerformanceMonitor } from '@/utils/performance';
import { logger } from '@/services/logger.service';

interface PerformanceMetric {
  name: string;
  value: number;
  threshold: {
    good: number;
    needsImprovement: number;
  };
  unit: string;
  status: 'good' | 'warning' | 'poor';
}

interface PerformanceData {
  vitals: {
    lcp?: number;
    fid?: number;
    cls?: number;
    fcp?: number;
    ttfb?: number;
  };
  resources: {
    total: number;
    totalSize: number;
    slowCount: number;
  };
  memory?: {
    used: number;
    total: number;
    limit: number;
  };
  navigation: {
    domContentLoaded: number;
    loadComplete: number;
  };
}

export const PerformanceMonitor: React.FC = () => {
  const [data, setData] = useState<PerformanceData>({
    vitals: {},
    resources: { total: 0, totalSize: 0, slowCount: 0 },
    navigation: { domContentLoaded: 0, loadComplete: 0 },
  });
  const [isRealTime, setIsRealTime] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  const { getMetrics, logReport } = usePerformanceMonitor();

  const getStatus = (value: number, good: number, poor: number): 'good' | 'warning' | 'poor' => {
    if (value <= good) return 'good';
    if (value <= poor) return 'warning';
    return 'poor';
  };

  const getStatusColor = (status: 'good' | 'warning' | 'poor') => {
    switch (status) {
      case 'good': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'poor': return 'text-red-600';
    }
  };

  const getStatusBadge = (status: 'good' | 'warning' | 'poor') => {
    const variants = {
      good: 'default' as const,
      warning: 'secondary' as const,
      poor: 'destructive' as const,
    };
    return variants[status];
  };

  const fetchPerformanceData = () => {
    const report = performanceMonitor.getFullReport();

    const processedData: PerformanceData = {
      vitals: report.vitals,
      resources: {
        total: report.resources.length,
        totalSize: report.resources.reduce((sum, r) => sum + (r.transferSize || 0), 0),
        slowCount: report.resources.filter(r => (r.responseEnd - r.requestStart) > 2000).length,
      },
      memory: report.memory ? {
        used: report.memory.usedJSHeapSize,
        total: report.memory.totalJSHeapSize,
        limit: report.memory.jsHeapSizeLimit,
      } : undefined,
      navigation: {
        domContentLoaded: report.navigation.domContentLoadedEventEnd - report.navigation.navigationStart,
        loadComplete: report.navigation.loadEventEnd - report.navigation.navigationStart,
      },
    };

    setData(processedData);
    setLastUpdate(new Date());
  };

  useEffect(() => {
    fetchPerformanceData();

    let interval: NodeJS.Timeout;
    if (isRealTime) {
      interval = setInterval(fetchPerformanceData, 5000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRealTime]);

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatTime = (ms: number): string => {
    if (ms < 1000) return `${ms.toFixed(0)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const metrics: PerformanceMetric[] = [
    {
      name: 'Largest Contentful Paint (LCP)',
      value: data.vitals.lcp || 0,
      threshold: { good: 2500, needsImprovement: 4000 },
      unit: 'ms',
      status: getStatus(data.vitals.lcp || 0, 2500, 4000),
    },
    {
      name: 'First Input Delay (FID)',
      value: data.vitals.fid || 0,
      threshold: { good: 100, needsImprovement: 300 },
      unit: 'ms',
      status: getStatus(data.vitals.fid || 0, 100, 300),
    },
    {
      name: 'Cumulative Layout Shift (CLS)',
      value: data.vitals.cls || 0,
      threshold: { good: 0.1, needsImprovement: 0.25 },
      unit: '',
      status: getStatus(data.vitals.cls || 0, 0.1, 0.25),
    },
    {
      name: 'Time to First Byte (TTFB)',
      value: data.vitals.ttfb || 0,
      threshold: { good: 800, needsImprovement: 1800 },
      unit: 'ms',
      status: getStatus(data.vitals.ttfb || 0, 800, 1800),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-pearl">Performance Monitor</h2>
          <p className="text-body/60 text-sm mt-1">
            Real-time performance metrics and Core Web Vitals
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant={isRealTime ? 'default' : 'secondary'}>
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse" />
            {isRealTime ? 'Live' : 'Paused'}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsRealTime(!isRealTime)}
          >
            {isRealTime ? 'Pause' : 'Resume'}
          </Button>
          <Button size="sm" onClick={fetchPerformanceData}>
            Refresh
          </Button>
        </div>
      </div>

      {/* Core Web Vitals */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric) => (
          <Card key={metric.name} className="glass-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-body">{metric.name}</h3>
                <Badge variant={getStatusBadge(metric.status)}>
                  {metric.status === 'good' && <CheckCircle className="w-3 h-3 mr-1" />}
                  {metric.status === 'warning' && <AlertTriangle className="w-3 h-3 mr-1" />}
                  {metric.status === 'poor' && <AlertTriangle className="w-3 h-3 mr-1" />}
                  {metric.status}
                </Badge>
              </div>
              <div className="space-y-2">
                <div className="text-2xl font-bold text-pearl">
                  {metric.value.toFixed(metric.unit === '' ? 3 : 0)}
                  {metric.unit}
                </div>
                <div className="text-xs text-body/60">
                  Good: &lt;{metric.threshold.good}{metric.unit}
                </div>
                <Progress
                  value={Math.min((metric.value / metric.threshold.needsImprovement) * 100, 100)}
                  className={`h-2 ${
                    metric.status === 'good' ? 'bg-green-500' :
                    metric.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Resource and Memory Information */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Resources */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5 text-champagne" />
              Resources
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-body">Total Requests</span>
                <span className="font-medium text-pearl">{data.resources.total}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-body">Total Size</span>
                <span className="font-medium text-pearl">{formatBytes(data.resources.totalSize)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-body">Slow Resources</span>
                <span className={`font-medium ${
                  data.resources.slowCount > 0 ? 'text-red-600' : 'text-green-600'
                }`}>
                  {data.resources.slowCount}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Memory */}
        {data.memory && (
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-champagne" />
                Memory Usage
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-body">Used</span>
                    <span className="font-medium text-pearl">
                      {formatBytes(data.memory.used)}
                    </span>
                  </div>
                  <Progress
                    value={(data.memory.used / data.memory.limit) * 100}
                    className="h-2"
                  />
                </div>
                <div className="flex justify-between text-xs text-body/60">
                  <span>Available: {formatBytes(data.memory.total - data.memory.used)}</span>
                  <span>Limit: {formatBytes(data.memory.limit)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Navigation Timing */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-champagne" />
              Navigation Timing
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-body">DOM Content</span>
                <span className="font-medium text-pearl">
                  {formatTime(data.navigation.domContentLoaded)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-body">Load Complete</span>
                <span className="font-medium text-pearl">
                  {formatTime(data.navigation.loadComplete)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <Card className="glass-card">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-body/60">
                Last updated: {lastUpdate.toLocaleTimeString()}
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  logReport();
                  logger.info('Performance report logged to console');
                }}
              >
                <Wifi className="w-4 h-4 mr-2" />
                Log Report
              </Button>
              <Button
                onClick={() => {
                  logger.performance('performance_dashboard_viewed', Date.now() - performance.now());
                  window.open('https://pagespeed.web.dev/', '_blank');
                }}
              >
                <Zap className="w-4 h-4 mr-2" />
                PageSpeed Insights
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PerformanceMonitor;