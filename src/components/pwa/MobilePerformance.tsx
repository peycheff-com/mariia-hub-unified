import React, { useState, useEffect, useCallback } from 'react';
import {
  Zap,
  Wifi,
  WifiOff,
  Download,
  Upload,
  Database,
  HardDrive,
  Activity,
  Gauge,
  Smartphone,
  Monitor,
  Settings,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Info,
  BarChart3,
  TrendingUp,
  Clock,
  Image,
  FileText,
  Package,
  Shield,
  Rocket,
  Cpu,
  MemoryStick,
  Globe
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';

interface MobilePerformanceProps {
  className?: string;
}

interface PerformanceMetrics {
  loadTime: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  firstInputDelay: number;
  cumulativeLayoutShift: number;
  timeToInteractive: number;
  memoryUsage: number;
  networkSpeed: {
    downlink: number;
    rtt: number;
    effectiveType: string;
  };
  cacheHitRate: number;
  bundleSize: number;
  imageOptimization: number;
}

interface CacheStrategy {
  name: string;
  description: string;
  ttl: number;
  maxSize: number;
  currentUsage: number;
  enabled: boolean;
}

interface NetworkOptimization {
  compressionEnabled: boolean;
  imageOptimization: boolean;
  lazyLoading: boolean;
  codeSplitting: boolean;
  prefetching: boolean;
  adaptiveLoading: boolean;
}

interface ResourceTiming {
  name: string;
  duration: number;
  size: number;
  cached: boolean;
}

export function MobilePerformance({ className = '' }: MobilePerformanceProps) {
  const { t } = useTranslation();
  const { toast } = useToast();

  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [networkOptimization, setNetworkOptimization] = useState<NetworkOptimization>({
    compressionEnabled: true,
    imageOptimization: true,
    lazyLoading: true,
    codeSplitting: true,
    prefetching: true,
    adaptiveLoading: false,
  });

  const [cacheStrategies, setCacheStrategies] = useState<CacheStrategy[]>([
    {
      name: 'Static Assets',
      description: 'CSS, JS, fonts',
      ttl: 7 * 24 * 60 * 60 * 1000, // 7 days
      maxSize: 150,
      currentUsage: 0,
      enabled: true,
    },
    {
      name: 'Images',
      description: 'Photos and graphics',
      ttl: 30 * 24 * 60 * 60 * 1000, // 30 days
      maxSize: 300,
      currentUsage: 0,
      enabled: true,
    },
    {
      name: 'API Responses',
      description: 'Service data and bookings',
      ttl: 5 * 60 * 1000, // 5 minutes
      maxSize: 150,
      currentUsage: 0,
      enabled: true,
    },
    {
      name: 'Dynamic Content',
      description: 'User-generated content',
      ttl: 24 * 60 * 60 * 1000, // 24 hours
      maxSize: 250,
      currentUsage: 0,
      enabled: true,
    },
  ]);

  const [resourceTimings, setResourceTimings] = useState<ResourceTiming[]>([]);
  const [networkStatus, setNetworkStatus] = useState<'online' | 'offline' | 'slow'>('online');
  const [adaptiveQuality, setAdaptiveQuality] = useState<'auto' | 'high' | 'medium' | 'low'>('auto');
  const [backgroundSyncEnabled, setBackgroundSyncEnabled] = useState(true);

  useEffect(() => {
    analyzePerformance();
    monitorNetworkStatus();
    loadPerformanceSettings();

    // Set up performance observer
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        analyzeResourceTimings(entries);
      });

      observer.observe({ entryTypes: ['resource', 'navigation', 'paint'] });

      return () => observer.disconnect();
    }
  }, []);

  const loadPerformanceSettings = () => {
    try {
      const stored = localStorage.getItem('performance-settings');
      if (stored) {
        const settings = JSON.parse(stored);
        setNetworkOptimization(settings.networkOptimization);
        setAdaptiveQuality(settings.adaptiveQuality || 'auto');
        setBackgroundSyncEnabled(settings.backgroundSyncEnabled ?? true);
      }
    } catch (error) {
      console.error('Failed to load performance settings:', error);
    }
  };

  const savePerformanceSettings = () => {
    try {
      const settings = {
        networkOptimization,
        adaptiveQuality,
        backgroundSyncEnabled,
      };
      localStorage.setItem('performance-settings', JSON.stringify(settings));
    } catch (error) {
      console.error('Failed to save performance settings:', error);
    }
  };

  const monitorNetworkStatus = () => {
    const updateNetworkStatus = () => {
      if (!navigator.onLine) {
        setNetworkStatus('offline');
      } else {
        const connection = (navigator as any).connection ||
                          (navigator as any).mozConnection ||
                          (navigator as any).webkitConnection;

        if (connection) {
          const effectiveType = connection.effectiveType;
          if (effectiveType === 'slow-2g' || effectiveType === '2g') {
            setNetworkStatus('slow');
          } else {
            setNetworkStatus('online');
          }
        } else {
          setNetworkStatus('online');
        }
      }
    };

    updateNetworkStatus();

    window.addEventListener('online', updateNetworkStatus);
    window.addEventListener('offline', updateNetworkStatus);

    if ((navigator as any).connection) {
      (navigator as any).connection.addEventListener('change', updateNetworkStatus);
    }

    return () => {
      window.removeEventListener('online', updateNetworkStatus);
      window.removeEventListener('offline', updateNetworkStatus);
      if ((navigator as any).connection) {
        (navigator as any).connection.removeEventListener('change', updateNetworkStatus);
      }
    };
  };

  const analyzePerformance = useCallback(async () => {
    setIsAnalyzing(true);

    try {
      const performanceData = await collectPerformanceMetrics();
      setMetrics(performanceData);

      // Update cache usage
      await updateCacheUsage();

      toast({
        title: t('mobilePerformance.analysisComplete'),
        description: t('mobilePerformance.analysisCompleteDesc'),
      });
    } catch (error) {
      console.error('Performance analysis failed:', error);
      toast({
        title: t('mobilePerformance.analysisFailed'),
        description: t('mobilePerformance.analysisFailedDesc'),
        variant: 'destructive',
      });
    } finally {
      setIsAnalyzing(false);
    }
  }, [toast, t]);

  const collectPerformanceMetrics = async (): Promise<PerformanceMetrics> => {
    return new Promise((resolve) => {
      // Simulate performance analysis
      setTimeout(() => {
        const navigationEntries = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        const paintEntries = performance.getEntriesByType('paint');

        const loadTime = navigationEntries.loadEventEnd - navigationEntries.fetchStart;
        const firstContentfulPaint = paintEntries.find(entry => entry.name === 'first-contentful-paint')?.startTime || 0;
        const domInteractive = navigationEntries.domInteractive - navigationEntries.fetchStart;

        // Get network information
        const connection = (navigator as any).connection || {};
        const networkSpeed = {
          downlink: connection.downlink || 10,
          rtt: connection.rtt || 100,
          effectiveType: connection.effectiveType || '4g',
        };

        // Simulate other metrics
        const metrics: PerformanceMetrics = {
          loadTime,
          firstContentfulPaint,
          largestContentfulPaint: firstContentfulPaint + 800,
          firstInputDelay: 50,
          cumulativeLayoutShift: 0.1,
          timeToInteractive: domInteractive,
          memoryUsage: (performance as any).memory?.usedJSHeapSize || 0,
          networkSpeed,
          cacheHitRate: Math.random() * 100,
          bundleSize: 2.1, // MB
          imageOptimization: 85, // %
        };

        resolve(metrics);
      }, 1500);
    });
  };

  const updateCacheUsage = async () => {
    if ('caches' in window) {
      try {
        const cacheNames = await caches.keys();
        const updatedStrategies = await Promise.all(
          cacheStrategies.map(async (strategy) => {
            let totalSize = 0;
            let itemCount = 0;

            for (const cacheName of cacheNames) {
              const cache = await caches.open(cacheName);
              const keys = await cache.keys();
              itemCount += keys.length;

              for (const request of keys) {
                const response = await cache.match(request);
                if (response) {
                  const blob = await response.blob();
                  totalSize += blob.size;
                }
              }
            }

            return {
              ...strategy,
              currentUsage: Math.round((totalSize / 1024 / 1024) * 100) / 100, // MB
            };
          })
        );

        setCacheStrategies(updatedStrategies);
      } catch (error) {
        console.error('Failed to update cache usage:', error);
      }
    }
  };

  const analyzeResourceTimings = (entries: PerformanceEntry[]) => {
    const timings: ResourceTiming[] = entries
      .filter(entry => 'transferSize' in entry)
      .map(entry => ({
        name: entry.name.split('/').pop() || entry.name,
        duration: entry.duration,
        size: (entry as any).transferSize || 0,
        cached: (entry as any).transferSize === 0 && (entry as any).decodedBodySize > 0,
      }))
      .slice(0, 20); // Keep only first 20

    setResourceTimings(prev => [...timings.slice(0, 20), ...prev.slice(0, 30 - timings.length)]);
  };

  const clearCache = async (cacheName: string) => {
    if ('caches' in window) {
      try {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(name => caches.delete(name))
        );

        await updateCacheUsage();

        toast({
          title: t('mobilePerformance.cacheCleared'),
          description: t('mobilePerformance.cacheClearedDesc'),
        });
      } catch (error) {
        console.error('Failed to clear cache:', error);
        toast({
          title: t('mobilePerformance.cacheClearFailed'),
          description: t('mobilePerformance.cacheClearFailedDesc'),
          variant: 'destructive',
        });
      }
    }
  };

  const optimizeForNetwork = useCallback(() => {
    const connection = (navigator as any).connection;
    if (!connection) return;

    const effectiveType = connection.effectiveType;
    let newQuality = adaptiveQuality;

    if (effectiveType === 'slow-2g' || effectiveType === '2g') {
      newQuality = 'low';
    } else if (effectiveType === '3g') {
      newQuality = 'medium';
    } else if (effectiveType === '4g') {
      newQuality = adaptiveQuality === 'auto' ? 'high' : adaptiveQuality;
    }

    if (newQuality !== adaptiveQuality) {
      setAdaptiveQuality(newQuality);
      applyQualitySettings(newQuality);
    }
  }, [adaptiveQuality]);

  const applyQualitySettings = (quality: string) => {
    // Apply quality settings to the application
    document.documentElement.setAttribute('data-quality', quality);

    // Notify service worker about quality change
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(registration => {
        registration.active?.postMessage({
          type: 'QUALITY_CHANGE',
          payload: { quality },
        });
      });
    }
  };

  const getPerformanceGrade = (metrics: PerformanceMetrics) => {
    let score = 0;
    let factors = 0;

    // Load time (under 3 seconds is good)
    if (metrics.loadTime < 3000) score += 20;
    factors++;

    // First Contentful Paint (under 1.5 seconds is good)
    if (metrics.firstContentfulPaint < 1500) score += 20;
    factors++;

    // Largest Contentful Paint (under 2.5 seconds is good)
    if (metrics.largestContentfulPaint < 2500) score += 20;
    factors++;

    // First Input Delay (under 100ms is good)
    if (metrics.firstInputDelay < 100) score += 20;
    factors++;

    // Cumulative Layout Shift (under 0.1 is good)
    if (metrics.cumulativeLayoutShift < 0.1) score += 20;
    factors++;

    const finalScore = score / factors;

    if (finalScore >= 90) return { grade: 'A', color: 'text-green-600' };
    if (finalScore >= 80) return { grade: 'B', color: 'text-blue-600' };
    if (finalScore >= 70) return { grade: 'C', color: 'text-yellow-600' };
    if (finalScore >= 60) return { grade: 'D', color: 'text-orange-600' };
    return { grade: 'F', color: 'text-red-600' };
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (ms: number): string => {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  useEffect(() => {
    optimizeForNetwork();
  }, [optimizeForNetwork]);

  useEffect(() => {
    savePerformanceSettings();
  }, [networkOptimization, adaptiveQuality, backgroundSyncEnabled]);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Performance Score */}
      {metrics && (
        <Card className="border-l-4 border-l-primary">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Gauge className="h-6 w-6 text-primary" />
                <div>
                  <CardTitle className="text-lg">{t('mobilePerformance.performanceScore')}</CardTitle>
                  <CardDescription>
                    {t('mobilePerformance.lastAnalysis')}: {new Date().toLocaleTimeString()}
                  </CardDescription>
                </div>
              </div>
              <div className="text-right">
                <div className={`text-3xl font-bold ${getPerformanceGrade(metrics).color}`}>
                  {getPerformanceGrade(metrics).grade}
                </div>
                <Button
                  onClick={analyzePerformance}
                  disabled={isAnalyzing}
                  size="sm"
                  variant="outline"
                >
                  {isAnalyzing ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      {t('mobilePerformance.analyzing')}
                    </>
                  ) : (
                    <>
                      <Activity className="h-4 w-4 mr-2" />
                      {t('mobilePerformance.analyze')}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>
      )}

      {/* Network Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {networkStatus === 'online' ? (
              <Wifi className="h-5 w-5 text-green-600" />
            ) : networkStatus === 'slow' ? (
              <Wifi className="h-5 w-5 text-yellow-600" />
            ) : (
              <WifiOff className="h-5 w-5 text-red-600" />
            )}
            {t('mobilePerformance.networkStatus')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-3 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Download className="h-4 w-4 text-blue-600" />
                <span className="font-medium">{t('mobilePerformance.connection')}</span>
              </div>
              <div className="text-2xl font-bold capitalize">
                {metrics?.networkSpeed.effectiveType || '4g'}
              </div>
              <div className="text-sm text-muted-foreground">
                {metrics?.networkSpeed.downlink} Mbps
              </div>
            </div>

            <div className="p-3 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4 text-orange-600" />
                <span className="font-medium">{t('mobilePerformance.latency')}</span>
              </div>
              <div className="text-2xl font-bold">
                {metrics?.networkSpeed.rtt || 100}ms
              </div>
              <div className="text-sm text-muted-foreground">
                {t('mobilePerformance.roundTrip')}
              </div>
            </div>

            <div className="p-3 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                {networkStatus === 'online' ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                )}
                <span className="font-medium">{t('mobilePerformance.status')}</span>
              </div>
              <div className="text-2xl font-bold capitalize">
                {networkStatus}
              </div>
              <div className="text-sm text-muted-foreground">
                {t('mobilePerformance.connectionStatus')}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      {metrics && (
        <Card>
          <CardHeader>
            <CardTitle>{t('mobilePerformance.metrics')}</CardTitle>
            <CardDescription>
              {t('mobilePerformance.metricsDesc')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">{t('mobilePerformance.loadTime')}</span>
                  <span className="text-sm">{formatDuration(metrics.loadTime)}</span>
                </div>
                <Progress
                  value={Math.min((metrics.loadTime / 3000) * 100, 100)}
                  className="h-2"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">{t('mobilePerformance.firstContentfulPaint')}</span>
                  <span className="text-sm">{formatDuration(metrics.firstContentfulPaint)}</span>
                </div>
                <Progress
                  value={Math.min((metrics.firstContentfulPaint / 1500) * 100, 100)}
                  className="h-2"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">{t('mobilePerformance.largestContentfulPaint')}</span>
                  <span className="text-sm">{formatDuration(metrics.largestContentfulPaint)}</span>
                </div>
                <Progress
                  value={Math.min((metrics.largestContentfulPaint / 2500) * 100, 100)}
                  className="h-2"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">{t('mobilePerformance.firstInputDelay')}</span>
                  <span className="text-sm">{metrics.firstInputDelay}ms</span>
                </div>
                <Progress
                  value={Math.min((metrics.firstInputDelay / 100) * 100, 100)}
                  className="h-2"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">{t('mobilePerformance.cumulativeLayoutShift')}</span>
                  <span className="text-sm">{metrics.cumulativeLayoutShift.toFixed(3)}</span>
                </div>
                <Progress
                  value={Math.min((metrics.cumulativeLayoutShift / 0.1) * 100, 100)}
                  className="h-2"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">{t('mobilePerformance.timeToInteractive')}</span>
                  <span className="text-sm">{formatDuration(metrics.timeToInteractive)}</span>
                </div>
                <Progress
                  value={Math.min((metrics.timeToInteractive / 5000) * 100, 100)}
                  className="h-2"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Performance Settings */}
      <Card>
        <CardHeader>
          <CardTitle>{t('mobilePerformance.settings')}</CardTitle>
          <CardDescription>
            {t('mobilePerformance.settingsDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="optimization" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="optimization">{t('mobilePerformance.optimization')}</TabsTrigger>
              <TabsTrigger value="caching">{t('mobilePerformance.caching')}</TabsTrigger>
              <TabsTrigger value="quality">{t('mobilePerformance.quality')}</TabsTrigger>
            </TabsList>

            <TabsContent value="optimization" className="space-y-4">
              <div className="space-y-4">
                {[
                  { key: 'compressionEnabled', label: t('mobilePerformance.compression'), icon: Database },
                  { key: 'imageOptimization', label: t('mobilePerformance.imageOptimization'), icon: Image },
                  { key: 'lazyLoading', label: t('mobilePerformance.lazyLoading'), icon: Clock },
                  { key: 'codeSplitting', label: t('mobilePerformance.codeSplitting'), icon: Package },
                  { key: 'prefetching', label: t('mobilePerformance.prefetching'), icon: Download },
                  { key: 'adaptiveLoading', label: t('mobilePerformance.adaptiveLoading'), icon: Shield },
                ].map(({ key, label, icon: Icon }) => (
                  <div key={key} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="font-medium">{label}</div>
                        <div className="text-sm text-muted-foreground">
                          {t(`mobilePerformance.${key}Desc`)}
                        </div>
                      </div>
                    </div>
                    <Switch
                      checked={networkOptimization[key as keyof NetworkOptimization] as boolean}
                      onCheckedChange={(checked) =>
                        setNetworkOptimization(prev => ({ ...prev, [key]: checked }))
                      }
                    />
                  </div>
                ))}

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <RefreshCw className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">{t('mobilePerformance.backgroundSync')}</div>
                      <div className="text-sm text-muted-foreground">
                        {t('mobilePerformance.backgroundSyncDesc')}
                      </div>
                    </div>
                  </div>
                  <Switch
                    checked={backgroundSyncEnabled}
                    onCheckedChange={setBackgroundSyncEnabled}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="caching" className="space-y-4">
              <div className="space-y-4">
                {cacheStrategies.map((strategy) => (
                  <div key={strategy.name} className="p-4 border rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{strategy.name}</h4>
                        <p className="text-sm text-muted-foreground">{strategy.description}</p>
                      </div>
                      <Switch
                        checked={strategy.enabled}
                        onCheckedChange={(enabled) =>
                          setCacheStrategies(prev =>
                            prev.map(s => s.name === strategy.name ? { ...s, enabled } : s)
                          )
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>{t('mobilePerformance.usage')}</span>
                        <span>{strategy.currentUsage} MB / {strategy.maxSize} MB</span>
                      </div>
                      <Progress
                        value={(strategy.currentUsage / strategy.maxSize) * 100}
                        className="h-2"
                      />
                    </div>

                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{t('mobilePerformance.ttl')}: {Math.round(strategy.ttl / 1000 / 60)} min</span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => clearCache(strategy.name)}
                      >
                        {t('mobilePerformance.clearCache')}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="quality" className="space-y-4">
              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-3">{t('mobilePerformance.adaptiveQuality')}</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    {t('mobilePerformance.adaptiveQualityDesc')}
                  </p>
                  <Select value={adaptiveQuality} onValueChange={(value: any) => setAdaptiveQuality(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">{t('mobilePerformance.auto')}</SelectItem>
                      <SelectItem value="high">{t('mobilePerformance.high')}</SelectItem>
                      <SelectItem value="medium">{t('mobilePerformance.medium')}</SelectItem>
                      <SelectItem value="low">{t('mobilePerformance.low')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Image className="h-4 w-4 text-blue-600" alt="" />
                      <span className="font-medium">{t('mobilePerformance.imageQuality')}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {adaptiveQuality === 'high' && t('mobilePerformance.highQuality')}
                      {adaptiveQuality === 'medium' && t('mobilePerformance.mediumQuality')}
                      {adaptiveQuality === 'low' && t('mobilePerformance.lowQuality')}
                      {adaptiveQuality === 'auto' && t('mobilePerformance.autoQuality')}
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Package className="h-4 w-4 text-green-600" />
                      <span className="font-medium">{t('mobilePerformance.bundleSize')}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {metrics?.bundleSize || 2.1} MB
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Resource Timings */}
      {resourceTimings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              {t('mobilePerformance.resourceTiming')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {resourceTimings.map((timing, index) => (
                <div key={index} className="flex items-center justify-between p-2 border rounded">
                  <div className="flex items-center gap-2">
                    {timing.cached ? (
                      <Database className="h-4 w-4 text-green-600" />
                    ) : (
                      <Download className="h-4 w-4 text-blue-600" />
                    )}
                    <span className="text-sm font-medium truncate max-w-48">
                      {timing.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span>{formatDuration(timing.duration)}</span>
                    <span>{formatFileSize(timing.size)}</span>
                    {timing.cached && (
                      <Badge variant="secondary" className="text-xs">
                        {t('mobilePerformance.cached')}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Performance Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            {t('mobilePerformance.optimizationTips')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <Info className="h-4 w-4 text-blue-600 mt-0.5" />
              <div>
                <div className="font-medium text-blue-900">{t('mobilePerformance.tip1Title')}</div>
                <div className="text-sm text-blue-700">{t('mobilePerformance.tip1Desc')}</div>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
              <div>
                <div className="font-medium text-green-900">{t('mobilePerformance.tip2Title')}</div>
                <div className="text-sm text-green-700">{t('mobilePerformance.tip2Desc')}</div>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5" />
              <div>
                <div className="font-medium text-orange-900">{t('mobilePerformance.tip3Title')}</div>
                <div className="text-sm text-orange-700">{t('mobilePerformance.tip3Desc')}</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}