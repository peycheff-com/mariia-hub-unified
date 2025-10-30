import { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart
} from "recharts";

import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Target,
  Calendar,
  Mail,
  Instagram,
  Facebook,
  Linkedin,
  AlertCircle,
  CheckCircle,
  Clock,
  Eye,
  MousePointer,
  ShoppingCart,
  Star
} from "lucide-react";

interface MarketingOverview {
  total_spend: number;
  total_revenue: number;
  total_conversions: number;
  total_impressions: number;
  total_engagements: number;
  average_ctr: number;
  average_cpa: number;
  total_roi: number;
  romi: number;
}

interface PlatformMetrics {
  [platform: string]: {
    impressions: number;
    engagements: number;
    engagement_rate: number;
    clicks: number;
    conversions: number;
    spend: number;
    roi: number;
  };
}

interface CampaignPerformance {
  campaign_id: string;
  campaign_name: string;
  status: string;
  spend: number;
  revenue: number;
  roi: number;
  conversions: number;
  kpis_met: number;
  total_kpis: number;
}

interface ContentInsight {
  id: string;
  title: string;
  platform: string;
  engagement_rate: number;
  conversions: number;
  roi: number;
}

interface EmailMetrics {
  total_sent: number;
  total_opened: number;
  total_clicked: number;
  open_rate: number;
  click_rate: number;
  unsubscribe_rate: number;
}

interface InfluencerCollab {
  id: string;
  name: string;
  platform: string;
  followers: number;
  engagement_rate: number;
  status: string;
  roi: number;
}

const COLORS = {
  primary: '#8B4513',
  secondary: '#F5DEB3',
  accent: '#D4AF37',
  success: '#22c55e',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#3b82f6',
  purple: '#a855f7',
  pink: '#ec4899'
};

const MarketingDashboard = () => {
  const [dateRange, setDateRange] = useState('30d');
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<MarketingOverview | null>(null);
  const [platformMetrics, setPlatformMetrics] = useState<PlatformMetrics>({});
  const [campaignPerformance, setCampaignPerformance] = useState<CampaignPerformance[]>([]);
  const [topContent, setTopContent] = useState<ContentInsight[]>([]);
  const [emailMetrics, setEmailMetrics] = useState<EmailMetrics | null>(null);
  const [influencerCollabs, setInfluencerCollabs] = useState<InfluencerCollab[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, [dateRange]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Simulate API calls - in production, these would be actual service calls
      await Promise.all([
        loadOverview(),
        loadPlatformMetrics(),
        loadCampaignPerformance(),
        loadTopContent(),
        loadEmailMetrics(),
        loadInfluencerCollabs(),
        loadAlerts()
      ]);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadOverview = async () => {
    // Simulated data
    setOverview({
      total_spend: 12500,
      total_revenue: 37500,
      total_conversions: 150,
      total_impressions: 2500000,
      total_engagements: 125000,
      average_ctr: 3.2,
      average_cpa: 83.33,
      total_roi: 200,
      romi: 3.0
    });
  };

  const loadPlatformMetrics = async () => {
    // Simulated platform data
    setPlatformMetrics({
      instagram: {
        impressions: 1200000,
        engagements: 72000,
        engagement_rate: 6.0,
        clicks: 3840,
        conversions: 75,
        spend: 6000,
        roi: 187.5
      },
      facebook: {
        impressions: 800000,
        engagements: 32000,
        engagement_rate: 4.0,
        clicks: 2400,
        conversions: 45,
        spend: 3500,
        roi: 171.4
      },
      linkedin: {
        impressions: 300000,
        engagements: 15000,
        engagement_rate: 5.0,
        clicks: 1200,
        conversions: 20,
        spend: 2000,
        roi: 150.0
      },
      tiktok: {
        impressions: 200000,
        engagements: 6000,
        engagement_rate: 3.0,
        clicks: 360,
        conversions: 10,
        spend: 1000,
        roi: 200.0
      }
    });
  };

  const loadCampaignPerformance = async () => {
    // Simulated campaign data
    setCampaignPerformance([
      {
        campaign_id: '1',
        campaign_name: 'Wiosenna Promocja Beauty',
        status: 'active',
        spend: 4500,
        revenue: 15750,
        roi: 250,
        conversions: 63,
        kpis_met: 4,
        total_kpis: 5
      },
      {
        campaign_id: '2',
        campaign_name: 'Nowe Usługi Fitness',
        status: 'completed',
        spend: 3000,
        revenue: 9000,
        roi: 200,
        conversions: 36,
        kpis_met: 3,
        total_kpis: 4
      },
      {
        campaign_id: '3',
        campaign_name: 'Influencer Q2 2024',
        status: 'active',
        spend: 5000,
        revenue: 12750,
        roi: 155,
        conversions: 51,
        kpis_met: 2,
        total_kpis: 4
      }
    ]);
  };

  const loadTopContent = async () => {
    // Simulated content data
    setTopContent([
      {
        id: '1',
        title: 'Transformacja przed i po',
        platform: 'instagram',
        engagement_rate: 8.5,
        conversions: 25,
        roi: 320
      },
      {
        id: '2',
        title: 'Porady pielęgnacyjne',
        platform: 'tiktok',
        engagement_rate: 12.2,
        conversions: 18,
        roi: 280
      },
      {
        id: '3',
        title: 'Nowe zabiegi w ofercie',
        platform: 'facebook',
        engagement_rate: 5.8,
        conversions: 32,
        roi: 195
      }
    ]);
  };

  const loadEmailMetrics = async () => {
    // Simulated email data
    setEmailMetrics({
      total_sent: 5000,
      total_opened: 1750,
      total_clicked: 262,
      open_rate: 35.0,
      click_rate: 5.24,
      unsubscribe_rate: 1.2
    });
  };

  const loadInfluencerCollabs = async () => {
    // Simulated influencer data
    setInfluencerCollabs([
      {
        id: '1',
        name: 'Anna Kowalska',
        platform: 'instagram',
        followers: 125000,
        engagement_rate: 4.2,
        status: 'active',
        roi: 185
      },
      {
        id: '2',
        name: 'Beauty Expert PL',
        platform: 'tiktok',
        followers: 85000,
        engagement_rate: 6.8,
        status: 'negotiating',
        roi: 0
      },
      {
        id: '3',
        name: 'Warsaw Fitness',
        platform: 'instagram',
        followers: 65000,
        engagement_rate: 3.5,
        status: 'completed',
        roi: 165
      }
    ]);
  };

  const loadAlerts = async () => {
    // Simulated alerts
    setAlerts([
      {
        id: '1',
        type: 'warning',
        title: 'Niski CTR na Facebook',
        description: 'Click-through rate spadł o 15% w ostatnim tygodniu',
        impact: 'medium'
      },
      {
        id: '2',
        type: 'opportunity',
        title: 'TikTok rośnie w siłę',
        description: 'Engagement rate na TikTok wzrósł o 32%',
        impact: 'high'
      },
      {
        id: '3',
        type: 'critical',
        title: 'Budżet blisko wyczerpania',
        description: 'Wykorzystano 85% miesięcznego budżetu',
        impact: 'high'
      }
    ]);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'PLN'
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const getStatusColor = (status: string) => {
    const colors = {
      active: COLORS.success,
      completed: COLORS.info,
      paused: COLORS.warning,
      cancelled: COLORS.danger,
      negotiating: COLORS.purple
    };
    return colors[status as keyof typeof colors] || COLORS.info;
  };

  const getAlertIcon = (type: string) => {
    const icons = {
      critical: <AlertCircle className="w-4 h-4" />,
      warning: <AlertCircle className="w-4 h-4" />,
      opportunity: <TrendingUp className="w-4 h-4" />
    };
    return icons[type as keyof typeof icons] || <AlertCircle className="w-4 h-4" />;
  };

  const getAlertColor = (type: string) => {
    const colors = {
      critical: COLORS.danger,
      warning: COLORS.warning,
      opportunity: COLORS.success
    };
    return colors[type as keyof typeof colors] || COLORS.info;
  };

  const platformData = Object.entries(platformMetrics).map(([platform, metrics]) => ({
    platform,
    ...metrics
  }));

  const roiData = campaignPerformance.map(campaign => ({
    name: campaign.campaign_name.length > 20
      ? campaign.campaign_name.substring(0, 20) + '...'
      : campaign.campaign_name,
    roi: campaign.roi,
    spend: campaign.spend,
    revenue: campaign.revenue
  }));

  const engagementData = topContent.map(content => ({
    name: content.title.length > 15
      ? content.title.substring(0, 15) + '...'
      : content.title,
    engagement_rate: content.engagement_rate,
    conversions: content.conversions
  }));

  const emailFunnelData = emailMetrics ? [
    { name: 'Wysłane', value: emailMetrics.total_sent, color: COLORS.info },
    { name: 'Otwarte', value: emailMetrics.total_opened, color: COLORS.success },
    { name: 'Kliknięte', value: emailMetrics.total_clicked, color: COLORS.accent }
  ] : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-pearl">Loading marketing dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-pearl">Marketing Dashboard</h1>
          <p className="text-pearl/70 mt-1">Comprehensive marketing analytics and automation</p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="bg-charcoal border-pearl/30 text-pearl w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-charcoal border-pearl/30">
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button className="bg-champagne text-charcoal hover:bg-champagne/90">
            <Calendar className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Performance Alerts */}
      {alerts.length > 0 && (
        <div className="grid gap-4">
          <h3 className="text-lg font-semibold text-pearl">Performance Alerts</h3>
          <div className="grid md:grid-cols-3 gap-4">
            {alerts.map((alert) => (
              <Card key={alert.id} className="bg-charcoal border-graphite/30">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-full ${getAlertColor(alert.type)} bg-opacity-20`}>
                      <div className={getAlertColor(alert.type)}>
                        {getAlertIcon(alert.type)}
                      </div>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-pearl">{alert.title}</h4>
                      <p className="text-sm text-pearl/70 mt-1">{alert.description}</p>
                      <Badge
                        variant="outline"
                        className={`mt-2 ${
                          alert.impact === 'high' ? 'border-red-500 text-red-500' :
                          alert.impact === 'medium' ? 'border-yellow-500 text-yellow-500' :
                          'border-blue-500 text-blue-500'
                        }`}
                      >
                        {alert.impact} impact
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-charcoal border-graphite/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-pearl/70">Total Revenue</p>
                <p className="text-2xl font-bold text-pearl">{formatCurrency(overview?.total_revenue || 0)}</p>
                <div className="flex items-center mt-2 text-green-500">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  <span className="text-sm">+{overview?.total_roi || 0}% ROI</span>
                </div>
              </div>
              <div className="p-3 bg-green-500/20 rounded-full">
                <DollarSign className="w-6 h-6 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-charcoal border-graphite/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-pearl/70">Conversions</p>
                <p className="text-2xl font-bold text-pearl">{overview?.total_conversions || 0}</p>
                <div className="flex items-center mt-2 text-pearl/70">
                  <Target className="w-4 h-4 mr-1" />
                  <span className="text-sm">CPA: {formatCurrency(overview?.average_cpa || 0)}</span>
                </div>
              </div>
              <div className="p-3 bg-blue-500/20 rounded-full">
                <ShoppingCart className="w-6 h-6 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-charcoal border-graphite/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-pearl/70">Engagement Rate</p>
                <p className="text-2xl font-bold text-pearl">{overview?.average_ctr || 0}%</p>
                <div className="flex items-center mt-2 text-pearl/70">
                  <Eye className="w-4 h-4 mr-1" />
                  <span className="text-sm">{formatNumber(overview?.total_engagements || 0)}</span>
                </div>
              </div>
              <div className="p-3 bg-purple-500/20 rounded-full">
                <Users className="w-6 h-6 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-charcoal border-graphite/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-pearl/70">ROMI</p>
                <p className="text-2xl font-bold text-pearl">{overview?.romi || 0}x</p>
                <div className="flex items-center mt-2 text-pearl/70">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  <span className="text-sm">{formatCurrency(overview?.total_spend || 0)} spend</span>
                </div>
              </div>
              <div className="p-3 bg-accent/20 rounded-full">
                <Star className="w-6 h-6 text-accent" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="platforms" className="space-y-4">
        <TabsList className="bg-charcoal border-graphite/30">
          <TabsTrigger value="platforms">Platforms</TabsTrigger>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="email">Email</TabsTrigger>
          <TabsTrigger value="influencers">Influencers</TabsTrigger>
        </TabsList>

        {/* Platforms Tab */}
        <TabsContent value="platforms" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            <Card className="bg-charcoal border-graphite/30">
              <CardHeader>
                <CardTitle className="text-pearl">Platform Performance</CardTitle>
                <CardDescription className="text-pearl/70">
                  Engagement and conversion metrics by platform
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={platformData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="platform" stroke="#9CA3AF" />
                    <YAxis stroke="#9CA3AF" />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}
                      labelStyle={{ color: '#F3F4F6' }}
                    />
                    <Legend />
                    <Bar dataKey="engagement_rate" fill={COLORS.accent} name="Engagement Rate %" />
                    <Bar dataKey="roi" fill={COLORS.success} name="ROI %" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="bg-charcoal border-graphite/30">
              <CardHeader>
                <CardTitle className="text-pearl">Platform Reach</CardTitle>
                <CardDescription className="text-pearl/70">
                  Impressions and spend by platform
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={platformData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="platform" stroke="#9CA3AF" />
                    <YAxis stroke="#9CA3AF" />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}
                      labelStyle={{ color: '#F3F4F6' }}
                    />
                    <Legend />
                    <Area type="monotone" dataKey="impressions" stackId="1" stroke={COLORS.info} fill={COLORS.info} fillOpacity={0.6} />
                    <Area type="monotone" dataKey="engagements" stackId="1" stroke={COLORS.accent} fill={COLORS.accent} fillOpacity={0.6} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Platform Details */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(platformMetrics).map(([platform, metrics]) => (
              <Card key={platform} className="bg-charcoal border-graphite/30">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-pearl capitalize">{platform}</h3>
                    {platform === 'instagram' && <Instagram className="w-5 h-5 text-pink-500" />}
                    {platform === 'facebook' && <Facebook className="w-5 h-5 text-blue-500" />}
                    {platform === 'linkedin' && <Linkedin className="w-5 h-5 text-blue-600" />}
                    {platform === 'tiktok' && <div className="w-5 h-5 bg-black rounded" />}
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-pearl/70">Reach</span>
                      <span className="text-pearl font-medium">{formatNumber(metrics.impressions)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-pearl/70">Engagement</span>
                      <span className="text-pearl font-medium">{metrics.engagement_rate}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-pearl/70">Conversions</span>
                      <span className="text-pearl font-medium">{metrics.conversions}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-pearl/70">ROI</span>
                      <span className={`font-medium ${metrics.roi > 150 ? 'text-green-500' : 'text-yellow-500'}`}>
                        {metrics.roi}%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Campaigns Tab */}
        <TabsContent value="campaigns" className="space-y-6">
          <Card className="bg-charcoal border-graphite/30">
            <CardHeader>
              <CardTitle className="text-pearl">Campaign ROI</CardTitle>
              <CardDescription className="text-pearl/70">
                Return on investment by campaign
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={roiData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="name" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}
                    labelStyle={{ color: '#F3F4F6' }}
                  />
                  <Legend />
                  <Bar dataKey="roi" fill={COLORS.success} name="ROI %" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid gap-4">
            <h3 className="text-lg font-semibold text-pearl">Active Campaigns</h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {campaignPerformance.map((campaign) => (
                <Card key={campaign.campaign_id} className="bg-charcoal border-graphite/30">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <Badge
                        variant="outline"
                        className={`border-${getStatusColor(campaign.status)} bg-${getStatusColor(campaign.status)}/20 text-${getStatusColor(campaign.status)}`}
                      >
                        {campaign.status}
                      </Badge>
                      <div className={`text-lg font-bold ${
                        campaign.roi > 200 ? 'text-green-500' :
                        campaign.roi > 150 ? 'text-yellow-500' : 'text-red-500'
                      }`}>
                        {campaign.roi}%
                      </div>
                    </div>
                    <h4 className="font-medium text-pearl mb-2">{campaign.campaign_name}</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-pearl/70">Spend</span>
                        <span className="text-pearl">{formatCurrency(campaign.spend)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-pearl/70">Revenue</span>
                        <span className="text-pearl">{formatCurrency(campaign.revenue)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-pearl/70">Conversions</span>
                        <span className="text-pearl">{campaign.conversions}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-pearl/70">KPIs Met</span>
                        <span className="text-pearl">{campaign.kpis_met}/{campaign.total_kpis}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Content Tab */}
        <TabsContent value="content" className="space-y-6">
          <Card className="bg-charcoal border-graphite/30">
            <CardHeader>
              <CardTitle className="text-pearl">Top Performing Content</CardTitle>
              <CardDescription className="text-pearl/70">
                Engagement and conversion rates for best content
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={engagementData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="name" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}
                    labelStyle={{ color: '#F3F4F6' }}
                  />
                  <Legend />
                  <Bar dataKey="engagement_rate" fill={COLORS.accent} name="Engagement Rate %" />
                  <Bar dataKey="conversions" fill={COLORS.success} name="Conversions" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid gap-4">
            <h3 className="text-lg font-semibold text-pearl">Content Details</h3>
            <div className="space-y-4">
              {topContent.map((content) => (
                <Card key={content.id} className="bg-charcoal border-graphite/30">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-pearl">{content.title}</h4>
                        <div className="flex items-center gap-4 mt-2 text-sm">
                          <span className="text-pearl/70 capitalize">{content.platform}</span>
                          <span className="text-pearl/70">Engagement: {content.engagement_rate}%</span>
                          <span className="text-pearl/70">Conversions: {content.conversions}</span>
                        </div>
                      </div>
                      <div className={`text-lg font-bold ${
                        content.roi > 200 ? 'text-green-500' : 'text-yellow-500'
                      }`}>
                        {content.roi}% ROI
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Email Tab */}
        <TabsContent value="email" className="space-y-6">
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card className="bg-charcoal border-graphite/30">
                <CardHeader>
                  <CardTitle className="text-pearl">Email Funnel</CardTitle>
                  <CardDescription className="text-pearl/70">
                    Email campaign performance metrics
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={emailFunnelData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {emailFunnelData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4">
              <Card className="bg-charcoal border-graphite/30">
                <CardHeader>
                  <CardTitle className="text-pearl">Email Metrics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-pearl/70">Open Rate</span>
                    <span className="text-pearl font-medium">{emailMetrics?.open_rate || 0}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-pearl/70">Click Rate</span>
                    <span className="text-pearl font-medium">{emailMetrics?.click_rate || 0}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-pearl/70">Unsubscribe</span>
                    <span className="text-pearl font-medium text-red-500">{emailMetrics?.unsubscribe_rate || 0}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-pearl/70">Total Sent</span>
                    <span className="text-pearl font-medium">{emailMetrics?.total_sent || 0}</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-charcoal border-graphite/30">
                <CardHeader>
                  <CardTitle className="text-pearl">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button className="w-full bg-champagne text-charcoal hover:bg-champagne/90">
                    <Mail className="w-4 h-4 mr-2" />
                    Create Campaign
                  </Button>
                  <Button variant="outline" className="w-full border-pearl/30 text-pearl hover:bg-pearl/10">
                    View Templates
                  </Button>
                  <Button variant="outline" className="w-full border-pearl/30 text-pearl hover:bg-pearl/10">
                    Manage Lists
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Influencers Tab */}
        <TabsContent value="influencers" className="space-y-6">
          <div className="grid gap-4">
            <h3 className="text-lg font-semibold text-pearl">Influencer Collaborations</h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {influencerCollabs.map((collab) => (
                <Card key={collab.id} className="bg-charcoal border-graphite/30">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <Badge
                        variant="outline"
                        className={`border-${getStatusColor(collab.status)} bg-${getStatusColor(collab.status)}/20 text-${getStatusColor(collab.status)}`}
                      >
                        {collab.status}
                      </Badge>
                      <div className={`text-lg font-bold ${
                        collab.roi > 150 ? 'text-green-500' : 'text-yellow-500'
                      }`}>
                        {collab.roi > 0 ? `${collab.roi}%` : 'N/A'}
                      </div>
                    </div>
                    <h4 className="font-medium text-pearl mb-2">{collab.name}</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-pearl/70 capitalize">{collab.platform}</span>
                        <span className="text-pearl">{formatNumber(collab.followers)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-pearl/70">Engagement</span>
                        <span className="text-pearl">{collab.engagement_rate}%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MarketingDashboard;