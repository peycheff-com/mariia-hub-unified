/**
 * Integration Dashboard Component
 * Comprehensive admin interface for managing third-party integrations
 * Provides setup, monitoring, and control of all business ecosystem integrations
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import {
  Calendar,
  MessageSquare,
  Mail,
  BarChart3,
  Users,
  Phone,
  Star,
  Globe,
  Settings,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Plus,
  ExternalLink,
  Activity,
  Clock,
  TrendingUp,
  Shield
} from 'lucide-react';

interface Integration {
  id: string;
  provider: string;
  category: string;
  status: 'connected' | 'disconnected' | 'error' | 'pending_setup';
  is_enabled: boolean;
  last_sync_at: string;
  next_sync_at: string;
  error_count: number;
  last_error?: string;
  sync_frequency: string;
  settings: Record<string, any>;
  health_status?: 'healthy' | 'degraded' | 'unhealthy';
  health_details?: any;
}

interface IntegrationAnalytics {
  total_integrations: number;
  connected_integrations: number;
  healthy_integrations: number;
  degraded_integrations: number;
  unhealthy_integrations: number;
  last_sync_avg: string;
  error_rate: number;
}

interface CategoryConfig {
  name: string;
  icon: React.ComponentType<any>;
  color: string;
  description: string;
}

const categories: Record<string, CategoryConfig> = {
  calendar: {
    name: 'Calendar & Scheduling',
    icon: Calendar,
    color: 'bg-blue-500',
    description: 'Google Calendar, Microsoft 365'
  },
  social_media: {
    name: 'Social Media',
    icon: Globe,
    color: 'bg-purple-500',
    description: 'Facebook, Instagram, TikTok, LinkedIn'
  },
  email_marketing: {
    name: 'Email Marketing',
    icon: Mail,
    color: 'bg-green-500',
    description: 'Mailchimp, SendGrid'
  },
  messaging: {
    name: 'SMS & Messaging',
    icon: Phone,
    color: 'bg-orange-500',
    description: 'Twilio, WhatsApp'
  },
  reviews: {
    name: 'Review Platforms',
    icon: Star,
    color: 'bg-yellow-500',
    description: 'Google Reviews, Trustpilot, Yelp'
  },
  analytics: {
    name: 'Analytics',
    icon: BarChart3,
    color: 'bg-red-500',
    description: 'Google Analytics, Mixpanel, Hotjar'
  },
  crm: {
    name: 'CRM',
    icon: Users,
    color: 'bg-indigo-500',
    description: 'HubSpot, Salesforce'
  },
  communication: {
    name: 'Communication',
    icon: MessageSquare,
    color: 'bg-teal-500',
    description: 'Slack, Microsoft Teams, Discord'
  }
};

const IntegrationDashboard: React.FC = () => {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [analytics, setAnalytics] = useState<IntegrationAnalytics | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadIntegrations();
    loadAnalytics();
  }, []);

  const loadIntegrations = async () => {
    try {
      setLoading(true);
      // Mock data - replace with actual API call
      const mockIntegrations: Integration[] = [
        {
          id: '1',
          provider: 'google',
          category: 'calendar',
          status: 'connected',
          is_enabled: true,
          last_sync_at: '2024-01-15T10:30:00Z',
          next_sync_at: '2024-01-15T11:30:00Z',
          error_count: 0,
          sync_frequency: 'hourly',
          settings: {},
          health_status: 'healthy'
        },
        {
          id: '2',
          provider: 'microsoft',
          category: 'calendar',
          status: 'connected',
          is_enabled: true,
          last_sync_at: '2024-01-15T10:25:00Z',
          next_sync_at: '2024-01-15T11:25:00Z',
          error_count: 0,
          sync_frequency: 'hourly',
          settings: {},
          health_status: 'healthy'
        },
        {
          id: '3',
          provider: 'facebook',
          category: 'social_media',
          status: 'connected',
          is_enabled: true,
          last_sync_at: '2024-01-15T10:20:00Z',
          next_sync_at: '2024-01-15T11:20:00Z',
          error_count: 1,
          last_error: 'Rate limit exceeded',
          sync_frequency: 'every_30_minutes',
          settings: {},
          health_status: 'degraded'
        },
        {
          id: '4',
          provider: 'mailchimp',
          category: 'email_marketing',
          status: 'pending_setup',
          is_enabled: false,
          last_sync_at: '',
          next_sync_at: '',
          error_count: 0,
          sync_frequency: 'daily',
          settings: {},
          health_status: 'unhealthy'
        }
      ];
      setIntegrations(mockIntegrations);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load integrations');
    } finally {
      setLoading(false);
    }
  };

  const loadAnalytics = async () => {
    try {
      // Mock analytics data - replace with actual API call
      const mockAnalytics: IntegrationAnalytics = {
        total_integrations: 4,
        connected_integrations: 2,
        healthy_integrations: 2,
        degraded_integrations: 1,
        unhealthy_integrations: 1,
        last_sync_avg: '5 minutes ago',
        error_rate: 2.5
      };
      setAnalytics(mockAnalytics);
    } catch (err) {
      console.error('Failed to load analytics:', err);
    }
  };

  const handleToggleIntegration = async (integrationId: string, enabled: boolean) => {
    try {
      // Update integration status
      setIntegrations(prev =>
        prev.map(integration =>
          integration.id === integrationId
            ? { ...integration, is_enabled: enabled }
            : integration
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update integration');
    }
  };

  const handleTriggerSync = async (integrationId: string) => {
    try {
      // Trigger sync for specific integration
      setIntegrations(prev =>
        prev.map(integration =>
          integration.id === integrationId
            ? { ...integration, last_sync_at: new Date().toISOString() }
            : integration
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to trigger sync');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'pending_setup':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      connected: 'default',
      error: 'destructive',
      pending_setup: 'secondary',
      disconnected: 'outline'
    };

    return (
      <Badge variant={variants[status] || 'outline'}>
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  const getHealthBadge = (health?: string) => {
    if (!health) return null;

    const colors: Record<string, string> = {
      healthy: 'bg-green-100 text-green-800',
      degraded: 'bg-yellow-100 text-yellow-800',
      unhealthy: 'bg-red-100 text-red-800'
    };

    return (
      <Badge className={colors[health]}>
        {health}
      </Badge>
    );
  };

  const filteredIntegrations = selectedCategory === 'all'
    ? integrations
    : integrations.filter(integration => integration.category === selectedCategory);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Integration Dashboard</h1>
          <p className="text-muted-foreground">
            Manage third-party service integrations for your beauty and fitness business
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Integration
        </Button>
      </div>

      {/* Analytics Overview */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Integrations</CardTitle>
              <Globe className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.total_integrations}</div>
              <p className="text-xs text-muted-foreground">
                {analytics.connected_integrations} connected
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Healthy Systems</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {analytics.healthy_integrations}
              </div>
              <p className="text-xs text-muted-foreground">
                {analytics.degraded_integrations} degraded
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.error_rate}%</div>
              <p className="text-xs text-muted-foreground">
                Last sync: {analytics.last_sync_avg}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sync Performance</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">95%</div>
              <p className="text-xs text-muted-foreground">
                Success rate
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Category Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(categories).map(([key, category]) => {
              const categoryIntegrations = integrations.filter(i => i.category === key);
              const Icon = category.icon;
              const connectedCount = categoryIntegrations.filter(i => i.status === 'connected').length;

              return (
                <Card key={key} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className={`p-2 rounded-lg ${category.color}`}>
                        <Icon className="h-4 w-4 text-white" />
                      </div>
                      <Badge variant="outline">
                        {connectedCount}/{categoryIntegrations.length}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <h3 className="font-semibold">{category.name}</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      {category.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Latest integration syncs and status changes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {integrations
                  .filter(i => i.last_sync_at)
                  .sort((a, b) => new Date(b.last_sync_at).getTime() - new Date(a.last_sync_at).getTime())
                  .slice(0, 5)
                  .map(integration => (
                    <div key={integration.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(integration.status)}
                        <div>
                          <p className="font-medium capitalize">
                            {integration.provider}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {categories[integration.category]?.name}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm">
                          {new Date(integration.last_sync_at).toLocaleString()}
                        </p>
                        {integration.last_error && (
                          <p className="text-xs text-red-500">
                            {integration.last_error}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations" className="space-y-6">
          {/* Category Filter */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedCategory === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory('all')}
            >
              All ({integrations.length})
            </Button>
            {Object.entries(categories).map(([key, category]) => {
              const count = integrations.filter(i => i.category === key).length;
              return (
                <Button
                  key={key}
                  variant={selectedCategory === key ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(key)}
                >
                  {category.name} ({count})
                </Button>
              );
            })}
          </div>

          {/* Integration List */}
          <div className="grid gap-4">
            {filteredIntegrations.map(integration => {
              const category = categories[integration.category];
              const CategoryIcon = category?.icon || Settings;

              return (
                <Card key={integration.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className={`p-2 rounded-lg ${category?.color || 'bg-gray-500'}`}>
                          <CategoryIcon className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <h3 className="font-semibold capitalize">
                              {integration.provider}
                            </h3>
                            {getStatusBadge(integration.status)}
                            {getHealthBadge(integration.health_status)}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {category?.name}
                          </p>
                          <div className="flex items-center space-x-4 mt-2 text-xs text-muted-foreground">
                            <span>Last sync: {integration.last_sync_at
                              ? new Date(integration.last_sync_at).toLocaleString()
                              : 'Never'
                            }</span>
                            {integration.next_sync_at && (
                              <span>Next: {new Date(integration.next_sync_at).toLocaleString()}</span>
                            )}
                            <span>Frequency: {integration.sync_frequency}</span>
                          </div>
                          {integration.last_error && (
                            <p className="text-xs text-red-500 mt-1">
                              {integration.last_error}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={integration.is_enabled}
                          onCheckedChange={(enabled) =>
                            handleToggleIntegration(integration.id, enabled)
                          }
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleTriggerSync(integration.id)}
                          disabled={integration.status !== 'connected'}
                        >
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Sync
                        </Button>
                        <Button variant="outline" size="sm">
                          <Settings className="h-4 w-4 mr-2" />
                          Configure
                        </Button>
                        <Button variant="outline" size="sm">
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Sync Progress */}
                    {integration.is_enabled && integration.status === 'connected' && (
                      <div className="mt-4">
                        <div className="flex items-center justify-between text-sm mb-2">
                          <span>Sync Progress</span>
                          <span>100%</span>
                        </div>
                        <Progress value={100} className="h-2" />
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}

            {filteredIntegrations.length === 0 && (
              <Card>
                <CardContent className="p-12 text-center">
                  <Globe className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No integrations found</h3>
                  <p className="text-muted-foreground mb-4">
                    Get started by adding your first integration
                  </p>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Integration
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Sync Performance</CardTitle>
                <CardDescription>
                  Integration sync success rates over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  <BarChart3 className="h-8 w-8 mr-2" />
                  Chart placeholder - sync performance metrics
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Error Analysis</CardTitle>
                <CardDescription>
                  Common errors and their frequency
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  <Activity className="h-8 w-8 mr-2" />
                  Chart placeholder - error analysis
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Global Integration Settings</CardTitle>
              <CardDescription>
                Configure default behavior for all integrations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Automatic Sync</h4>
                  <p className="text-sm text-muted-foreground">
                    Enable automatic synchronization for all integrations
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Error Notifications</h4>
                  <p className="text-sm text-muted-foreground">
                    Send notification aria-live="polite" aria-atomic="true"s when integrations encounter errors
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Retry Failed Syncs</h4>
                  <p className="text-sm text-muted-foreground">
                    Automatically retry failed synchronization attempts
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Polish Market Settings</CardTitle>
              <CardDescription>
                Configure Polish market specific settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">GDPR Compliance</h4>
                  <p className="text-sm text-muted-foreground">
                    Ensure all integrations comply with GDPR requirements
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Polish Language Support</h4>
                  <p className="text-sm text-muted-foreground">
                    Use Polish language for all communications where possible
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Polish Business Hours</h4>
                  <p className="text-sm text-muted-foreground">
                    Respect Polish business hours and holidays for automated tasks
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default IntegrationDashboard;