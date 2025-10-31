import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Target,
  Calendar,
  Download,
  Filter,
  RefreshCw,
  Eye,
  MousePointer,
  Share2,
  Heart,
  MessageSquare,
  Mail,
  Instagram,
  Facebook,
  Youtube,
  Twitter,
  PieChart,
  LineChart,
  Activity,
  Clock,
  AlertCircle,
  CheckCircle,
  ArrowUpRight,
  ArrowDownRight,
  Zap,
  Award,
  ShoppingCart
} from 'lucide-react';
import { marketingService } from '@/services/marketing.service';
import {
  MarketingDashboard,
  MarketingROI,
  MarketingKPI,
  CustomerTouchpoint,
  MarketingAnalytics,
  AnalyticsQuery
} from '@/types/marketing';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { toast } from 'sonner';

interface MarketingAnalyticsProps {
  className?: string;
}

export const MarketingAnalytics: React.FC<MarketingAnalyticsProps> = ({ className }) => {
  const [dashboardData, setDashboardData] = useState<MarketingDashboard | null>(null);
  const [campaignROI, setCampaignROI] = useState<MarketingROI[]>([]);
  const [selectedDateRange, setSelectedDateRange] = useState('30days');
  const [selectedPlatform, setSelectedPlatform] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadData();
  }, [selectedDateRange, selectedPlatform]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [dashboard, roi] = await Promise.all([
        marketingService.getMarketingDashboard(),
        loadCampaignROI()
      ]);

      setDashboardData(dashboard);
      setCampaignROI(roi);
    } catch (error) {
      console.error('Error loading analytics data:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setIsLoading(false);
    }
  };

  const loadCampaignROI = async (): Promise<MarketingROI[]> => {
    // Mock ROI data - in real implementation this would come from the service
    return [
      {
        campaignId: 'camp_1',
        campaignName: 'Spring Beauty Campaign',
        totalSpend: 5000,
        totalRevenue: 15000,
        roi: 200,
        cac: 50,
        ltv: 300,
        conversionRate: 3.2,
        attributionData: {
          organic: 35,
          paid: 40,
          social: 20,
          email: 3,
          referral: 2
        }
      },
      {
        campaignId: 'camp_2',
        campaignName: 'Influencer Collaboration Q2',
        totalSpend: 8000,
        totalRevenue: 24000,
        roi: 200,
        cac: 80,
        ltv: 400,
        conversionRate: 4.1,
        attributionData: {
          organic: 25,
          paid: 30,
          social: 40,
          email: 3,
          referral: 2
        }
      }
    ];
  };

  const getDateRange = (range: string) => {
    const now = new Date();
    switch (range) {
      case '7days':
        return { start: subDays(now, 7), end: now };
      case '30days':
        return { start: subDays(now, 30), end: now };
      case '90days':
        return { start: subDays(now, 90), end: now };
      case 'month':
        return { start: startOfMonth(now), end: endOfMonth(now) };
      default:
        return { start: subDays(now, 30), end: now };
    }
  };

  const exportReport = async (format: 'pdf' | 'excel') => {
    try {
      // Mock export functionality
      toast.success(`Report exported as ${format.toUpperCase()}`);
    } catch (error) {
      console.error('Error exporting report:', error);
      toast.error('Failed to export report');
    }
  };

  const refreshData = () => {
    loadData();
    toast.success('Analytics data refreshed');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'PLN'
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return <ArrowUpRight className="w-4 h-4 text-green-600" />;
      case 'down': return <ArrowDownRight className="w-4 h-4 text-red-600" />;
      default: return <div className="w-4 h-4" />;
    }
  };

  const getPlatformIcon = (platform: string) => {
    const icons: Record<string, React.ReactNode> = {
      instagram: <Instagram className="w-5 h-5" />,
      facebook: <Facebook className="w-5 h-5" />,
      youtube: <Youtube className="w-5 h-5" />,
      twitter: <Twitter className="w-5 h-5" />,
      email: <Mail className="w-5 h-5" />
    };
    return icons[platform] || <Activity className="w-5 h-5" />;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Marketing Analytics</h2>
          <p className="text-muted-foreground">Comprehensive insights into your marketing performance</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedDateRange} onValueChange={setSelectedDateRange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">Last 7 days</SelectItem>
              <SelectItem value="30days">Last 30 days</SelectItem>
              <SelectItem value="90days">Last 90 days</SelectItem>
              <SelectItem value="month">This month</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Platforms</SelectItem>
              <SelectItem value="instagram">Instagram</SelectItem>
              <SelectItem value="facebook">Facebook</SelectItem>
              <SelectItem value="email">Email</SelectItem>
              <SelectItem value="youtube">YouTube</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" onClick={refreshData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>

          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Export Report</DialogTitle>
                <DialogDescription>
                  Choose the format for your analytics report
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Button
                    variant="outline"
                    className="h-20 flex-col"
                    onClick={() => exportReport('pdf')}
                  >
                    <Download className="w-8 h-8 mb-2" />
                    PDF Report
                  </Button>
                  <Button
                    variant="outline"
                    className="h-20 flex-col"
                    onClick={() => exportReport('excel')}
                  >
                    <Download className="w-8 h-8 mb-2" />
                    Excel Data
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="social">Social Media</TabsTrigger>
          <TabsTrigger value="email">Email Marketing</TabsTrigger>
          <TabsTrigger value="attribution">Attribution</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Key Performance Indicators */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <DollarSign className="h-8 w-8 text-green-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                    <p className="text-2xl font-bold">
                      {formatCurrency(dashboardData?.overview.totalRevenue || 0)}
                    </p>
                    <div className="flex items-center text-xs text-green-600">
                      <ArrowUpRight className="w-3 h-3 mr-1" />
                      +15.3% from last period
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Target className="h-8 w-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Conversion Rate</p>
                    <p className="text-2xl font-bold">3.8%</p>
                    <div className="flex items-center text-xs text-green-600">
                      <ArrowUpRight className="w-3 h-3 mr-1" />
                      +0.8% from last period
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Users className="h-8 w-8 text-purple-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Total Reach</p>
                    <p className="text-2xl font-bold">125.4K</p>
                    <div className="flex items-center text-xs text-green-600">
                      <ArrowUpRight className="w-3 h-3 mr-1" />
                      +22.1% from last period
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <TrendingUp className="h-8 w-8 text-orange-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Average ROI</p>
                    <p className="text-2xl font-bold">248%</p>
                    <div className="flex items-center text-xs text-green-600">
                      <ArrowUpRight className="w-3 h-3 mr-1" />
                      +45% from last period
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Section */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Trend</CardTitle>
                <CardDescription>Marketing-generated revenue over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  <LineChart className="w-16 h-16" />
                  <p className="ml-4">Revenue trend chart will be displayed here</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Traffic Sources</CardTitle>
                <CardDescription>Where your customers are coming from</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  <PieChart className="w-16 h-16" />
                  <p className="ml-4">Traffic sources breakdown will be displayed here</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Campaign Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {campaignROI.slice(0, 5).map((campaign) => (
                  <div key={campaign.campaignId} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-medium">{campaign.campaignName}</h3>
                      <p className="text-sm text-muted-foreground">
                        {formatCurrency(campaign.totalSpend)} spend • {formatCurrency(campaign.totalRevenue)} revenue
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-green-600">{formatPercentage(campaign.roi)}</div>
                      <div className="text-sm text-muted-foreground">ROI</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="campaigns" className="space-y-6">
          <div className="grid gap-4">
            {campaignROI.map((campaign) => (
              <Card key={campaign.campaignId}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-lg">{campaign.campaignName}</h3>
                        <Badge variant={campaign.roi > 100 ? 'default' : 'secondary'}>
                          {campaign.roi > 100 ? 'Profitable' : 'Needs Optimization'}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Spend</p>
                          <p className="text-lg font-semibold">{formatCurrency(campaign.totalSpend)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Revenue</p>
                          <p className="text-lg font-semibold text-green-600">
                            {formatCurrency(campaign.totalRevenue)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">ROI</p>
                          <p className={`text-lg font-semibold ${campaign.roi > 100 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatPercentage(campaign.roi)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Conversion Rate</p>
                          <p className="text-lg font-semibold">{formatPercentage(campaign.conversionRate)}</p>
                        </div>
                      </div>

                      <div className="mt-4">
                        <p className="text-sm font-medium mb-2">Attribution Breakdown</p>
                        <div className="space-y-2">
                          {Object.entries(campaign.attributionData).map(([channel, percentage]) => (
                            <div key={channel} className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                {getPlatformIcon(channel)}
                                <span className="text-sm capitalize">{channel}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="w-24 bg-gray-200 rounded-full h-2">
                                  <div
                                    className="bg-blue-600 h-2 rounded-full"
                                    style={{ width: `${percentage}%` }}
                                  />
                                </div>
                                <span className="text-sm font-medium">{percentage}%</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="ml-4">
                      <Button variant="outline" size="sm">
                        <BarChart3 className="w-4 h-4 mr-2" />
                        Details
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="social" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Users className="h-8 w-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Total Followers</p>
                    <p className="text-2xl font-bold">45.2K</p>
                    <div className="flex items-center text-xs text-green-600">
                      <ArrowUpRight className="w-3 h-3 mr-1" />
                      +12.3% this month
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Heart className="h-8 w-8 text-red-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Engagement Rate</p>
                    <p className="text-2xl font-bold">6.8%</p>
                    <div className="flex items-center text-xs text-green-600">
                      <ArrowUpRight className="w-3 h-3 mr-1" />
                      +1.2% this month
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Share2 className="h-8 w-8 text-green-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Total Shares</p>
                    <p className="text-2xl font-bold">3,842</p>
                    <div className="flex items-center text-xs text-green-600">
                      <ArrowUpRight className="w-3 h-3 mr-1" />
                      +24.5% this month
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Eye className="h-8 w-8 text-purple-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Impressions</p>
                    <p className="text-2xl font-bold">1.2M</p>
                    <div className="flex items-center text-xs text-green-600">
                      <ArrowUpRight className="w-3 h-3 mr-1" />
                      +18.7% this month
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Platform Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { name: 'Instagram', followers: '24.5K', engagement: '8.2%', growth: '+15.3%' },
                    { name: 'Facebook', followers: '12.8K', engagement: '5.1%', growth: '+8.7%' },
                    { name: 'YouTube', followers: '5.2K', engagement: '4.3%', growth: '+22.1%' },
                    { name: 'TikTok', followers: '2.7K', engagement: '12.4%', growth: '+45.2%' }
                  ].map((platform) => (
                    <div key={platform.name} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {getPlatformIcon(platform.name.toLowerCase())}
                        <div>
                          <h4 className="font-medium">{platform.name}</h4>
                          <p className="text-sm text-muted-foreground">{platform.followers} followers</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{platform.engagement} engagement</div>
                        <div className="text-xs text-green-600">{platform.growth}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Performing Content</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { type: 'Instagram Reel', title: 'Skincare routine tutorial', engagement: '15.2K', reach: '45.3K' },
                    { type: 'Before/After Post', title: 'Client transformation', engagement: '12.8K', reach: '38.7K' },
                    { type: 'Tutorial Video', title: 'Contouring basics', engagement: '8.4K', reach: '28.2K' },
                    { type: 'Q&A Session', title: 'Ask the expert', engagement: '6.7K', reach: '22.1K' }
                  ].map((content, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <h4 className="font-medium text-sm">{content.title}</h4>
                        <p className="text-xs text-muted-foreground">{content.type}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">{content.engagement} engagement</div>
                        <div className="text-xs text-muted-foreground">{content.reach} reach</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="email" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Mail className="h-8 w-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Total Subscribers</p>
                    <p className="text-2xl font-bold">8,542</p>
                    <div className="flex items-center text-xs text-green-600">
                      <ArrowUpRight className="w-3 h-3 mr-1" />
                      +324 this month
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Eye className="h-8 w-8 text-green-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Open Rate</p>
                    <p className="text-2xl font-bold">32.4%</p>
                    <div className="flex items-center text-xs text-green-600">
                      <ArrowUpRight className="w-3 h-3 mr-1" />
                      +2.1% this month
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <MousePointer className="h-8 w-8 text-purple-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Click Rate</p>
                    <p className="text-2xl font-bold">4.8%</p>
                    <div className="flex items-center text-xs text-green-600">
                      <ArrowUpRight className="w-3 h-3 mr-1" />
                      +0.8% this month
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <ShoppingCart className="h-8 w-8 text-orange-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Conversion Rate</p>
                    <p className="text-2xl font-bold">2.1%</p>
                    <div className="flex items-center text-xs text-green-600">
                      <ArrowUpRight className="w-3 h-3 mr-1" />
                      +0.3% this month
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Email Campaign Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { name: 'March Newsletter', sent: '8,542', opened: '2,767', clicked: '410', converted: '58' },
                    { name: 'Spring Promotion', sent: '8,542', opened: '3,124', clicked: '624', converted: '95' },
                    { name: 'Welcome Series', sent: '324', opened: '276', clicked: '82', converted: '18' },
                    { name: 'Abandoned Cart', sent: '156', opened: '89', clicked: '34', converted: '12' }
                  ].map((campaign) => (
                    <div key={campaign.name} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{campaign.name}</h4>
                        <p className="text-sm text-muted-foreground">Sent to {campaign.sent} subscribers</p>
                      </div>
                      <div className="text-right text-sm">
                        <div>Open: {((parseInt(campaign.opened) / parseInt(campaign.sent)) * 100).toFixed(1)}%</div>
                        <div>Click: {((parseInt(campaign.clicked) / parseInt(campaign.sent)) * 100).toFixed(1)}%</div>
                        <div>Convert: {((parseInt(campaign.converted) / parseInt(campaign.sent)) * 100).toFixed(1)}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Subscriber Growth</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  <LineChart className="w-16 h-16" />
                  <p className="ml-4">Subscriber growth chart will be displayed here</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="attribution" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Customer Journey Attribution</CardTitle>
              <CardDescription>
                Understand how customers discover and interact with your brand
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[
                  { channel: 'Organic Search', customers: 125, revenue: 37500, percentage: 35 },
                  { channel: 'Social Media', customers: 89, revenue: 26700, percentage: 25 },
                  { channel: 'Email Marketing', customers: 67, revenue: 20100, percentage: 19 },
                  { channel: 'Paid Ads', customers: 45, revenue: 13500, percentage: 13 },
                  { channel: 'Referrals', customers: 23, revenue: 6900, percentage: 6 },
                  { channel: 'Direct', customers: 12, revenue: 3600, percentage: 2 }
                ].map((channel) => (
                  <Card key={channel.channel}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium">{channel.channel}</h3>
                        <Badge variant="outline">{channel.percentage}%</Badge>
                      </div>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Customers:</span>
                          <span className="font-medium">{channel.customers}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Revenue:</span>
                          <span className="font-medium">{formatCurrency(channel.revenue)}</span>
                        </div>
                      </div>
                      <div className="mt-3">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${channel.percentage}%` }}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Touchpoint Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { touchpoint: 'First Visit', count: 1250, conversion: '45%' },
                    { touchpoint: 'Email Click', count: 890, conversion: '32%' },
                    { touchpoint: 'Social Engagement', count: 650, conversion: '28%' },
                    { touchpoint: 'Product View', count: 420, conversion: '15%' }
                  ].map((touchpoint) => (
                    <div key={touchpoint.touchpoint} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{touchpoint.touchpoint}</h4>
                        <p className="text-sm text-muted-foreground">{touchpoint.count} interactions</p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-semibold">{touchpoint.conversion}</div>
                        <div className="text-xs text-muted-foreground">conversion rate</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Customer Lifetime Value by Channel</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { channel: 'Email Marketing', ltv: 1250, customers: 67 },
                    { channel: 'Organic Search', ltv: 980, customers: 125 },
                    { channel: 'Referrals', ltv: 1450, customers: 23 },
                    { channel: 'Social Media', ltv: 750, customers: 89 }
                  ].map((data) => (
                    <div key={data.channel} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{data.channel}</h4>
                        <p className="text-sm text-muted-foreground">{data.customers} customers</p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-semibold">{formatCurrency(data.ltv)}</div>
                        <div className="text-xs text-muted-foreground">avg LTV</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};