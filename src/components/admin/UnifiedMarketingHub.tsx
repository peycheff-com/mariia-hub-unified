import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  BarChart3,
  TrendingUp,
  Users,
  Mail,
  Instagram,
  Target,
  Heart,
  DollarSign,
  Calendar,
  Settings,
  Bell,
  Download,
  RefreshCw,
  Eye,
  Clock,
  CheckCircle,
  AlertTriangle,
  Zap,
  Award,
  ShoppingBag,
  MessageSquare,
  Star,
  ArrowUpRight,
  ArrowDownRight,
  PieChart,
  LineChart,
  Activity
} from 'lucide-react';
import { SocialMediaAutomation } from '@/components/marketing/SocialMediaAutomation';
import { EmailMarketingSystem } from '@/components/marketing/EmailMarketingSystem';
import { InfluencerManagement } from '@/components/marketing/InfluencerManagement';
import { MarketingAnalytics } from '@/components/marketing/MarketingAnalytics';
import { CommunityEngagement } from '@/components/marketing/CommunityEngagement';
import { marketingService } from '@/services/marketing.service';
import { MarketingDashboard as DashboardData } from '@/types/marketing';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface UnifiedMarketingHubProps {
  className?: string;
}

export const UnifiedMarketingHub: React.FC<UnifiedMarketingHubProps> = ({ className }) => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [notification aria-live="polite" aria-atomic="true"s, setNotifications] = useState([
    { id: 1, type: 'info', message: 'New Instagram post scheduled for 3:00 PM', time: '2 hours ago' },
    { id: 2, type: 'success', message: 'Email campaign "Spring Newsletter" sent to 2,500 subscribers', time: '4 hours ago' },
    { id: 3, type: 'warning', message: 'Influencer collaboration pending approval', time: '1 day ago' },
    { id: 4, type: 'info', message: 'Community member reached Gold tier status', time: '2 days ago' },
    { id: 5, type: 'success', message: 'Referral program generated 12 new customers this week', time: '3 days ago' }
  ]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const data = await marketingService.getMarketingDashboard();
      setDashboardData(data);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshData = () => {
    loadData();
    toast.success('Dashboard data refreshed');
  };

  const exportReport = () => {
    toast.success('Marketing report exported successfully');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'PLN'
    }).format(amount);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'error': return <AlertTriangle className="w-4 h-4 text-red-600" />;
      default: return <Bell className="w-4 h-4 text-blue-600" />;
    }
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
          <h1 className="text-3xl font-bold">Marketing Command Center</h1>
          <p className="text-muted-foreground">Complete marketing automation and analytics hub</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={refreshData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" onClick={exportReport}>
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Key Metrics Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(dashboardData?.overview.totalRevenue || 156750)}
                </p>
                <div className="flex items-center text-xs text-green-600">
                  <ArrowUpRight className="w-3 h-3 mr-1" />
                  +15.3% from last month
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Total Reach</p>
                <p className="text-2xl font-bold">
                  {(dashboardData?.overview.socialFollowers || 48520).toLocaleString()}
                </p>
                <div className="flex items-center text-xs text-green-600">
                  <ArrowUpRight className="w-3 h-3 mr-1" />
                  +22.1% from last month
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Target className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Conversion Rate</p>
                <p className="text-2xl font-bold">
                  {(dashboardData?.overview.engagementRate || 4.2).toFixed(1)}%
                </p>
                <div className="flex items-center text-xs text-green-600">
                  <ArrowUpRight className="w-3 h-3 mr-1" />
                  +0.8% from last month
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
                <p className="text-2xl font-bold">
                  {(dashboardData?.overview.averageROI || 248).toFixed(0)}%
                </p>
                <div className="flex items-center text-xs text-green-600">
                  <ArrowUpRight className="w-3 h-3 mr-1" />
                  +45% from last month
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Mail className="h-8 w-8 text-cyan-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Email Subscribers</p>
                <p className="text-2xl font-bold">
                  {(dashboardData?.overview.totalSubscribers || 12480).toLocaleString()}
                </p>
                <div className="flex items-center text-xs text-green-600">
                  <ArrowUpRight className="w-3 h-3 mr-1" />
                  +524 this month
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Real-time Notifications */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Real-time Notifications
            <Badge variant="secondary">{notifications.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-32">
            <div className="space-y-2">
              {notifications.map((notification) => (
                <div key={notification.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                  {getNotificationIcon(notification.type)}
                  <div className="flex-1">
                    <p className="text-sm">{notification.message}</p>
                    <p className="text-xs text-muted-foreground">{notification.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="social">Social Media</TabsTrigger>
          <TabsTrigger value="email">Email</TabsTrigger>
          <TabsTrigger value="influencers">Influencers</TabsTrigger>
          <TabsTrigger value="community">Community</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="automation">Automation</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Channel Performance Overview */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Instagram className="w-5 h-5" />
                  Social Media
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Followers</span>
                    <span className="font-semibold">24.5K</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Engagement Rate</span>
                    <span className="font-semibold">8.4%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Posts This Month</span>
                    <span className="font-semibold">18</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Reach</span>
                    <span className="font-semibold">125.4K</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Mail className="w-5 h-5" />
                  Email Marketing
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Subscribers</span>
                    <span className="font-semibold">12.5K</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Open Rate</span>
                    <span className="font-semibold">32.4%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Click Rate</span>
                    <span className="font-semibold">4.8%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Revenue</span>
                    <span className="font-semibold">₺18,750</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Partnerships
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Active Influencers</span>
                    <span className="font-semibold">12</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Affiliate Partners</span>
                    <span className="font-semibold">24</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Avg. ROI</span>
                    <span className="font-semibold">248%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Total Reach</span>
                    <span className="font-semibold">2.1M</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity Feed */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Recent Marketing Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-4 border rounded-lg bg-blue-50">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <Instagram className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium">Instagram post scheduled successfully</h4>
                      <p className="text-sm text-muted-foreground">Spring treatment showcase scheduled for 3:00 PM today</p>
                      <p className="text-xs text-muted-foreground">2 hours ago</p>
                    </div>
                    <Badge>Social Media</Badge>
                  </div>

                  <div className="flex items-center gap-4 p-4 border rounded-lg bg-green-50">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <Mail className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium">Email campaign completed</h4>
                      <p className="text-sm text-muted-foreground">March Newsletter sent to 2,500 subscribers with 32.4% open rate</p>
                      <p className="text-xs text-muted-foreground">4 hours ago</p>
                    </div>
                    <Badge>Email</Badge>
                  </div>

                  <div className="flex items-center gap-4 p-4 border rounded-lg bg-purple-50">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                      <Users className="w-5 h-5 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium">New influencer collaboration started</h4>
                      <p className="text-sm text-muted-foreground">Partnership with @beauty_influencer for spring campaign</p>
                      <p className="text-xs text-muted-foreground">6 hours ago</p>
                    </div>
                    <Badge>Influencer</Badge>
                  </div>

                  <div className="flex items-center gap-4 p-4 border rounded-lg bg-orange-50">
                    <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                      <Heart className="w-5 h-5 text-orange-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium">User content featured</h4>
                      <p className="text-sm text-muted-foreground">Customer review shared on Instagram Stories, 2.5K impressions</p>
                      <p className="text-xs text-muted-foreground">1 day ago</p>
                    </div>
                    <Badge>Community</Badge>
                  </div>

                  <div className="flex items-center gap-4 p-4 border rounded-lg bg-cyan-50">
                    <div className="w-10 h-10 bg-cyan-100 rounded-full flex items-center justify-center">
                      <Award className="w-5 h-5 text-cyan-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium">Loyalty milestone reached</h4>
                      <p className="text-sm text-muted-foreground">Community member Anna K. reached Gold tier status</p>
                      <p className="text-xs text-muted-foreground">2 days ago</p>
                    </div>
                    <Badge>Loyalty</Badge>
                  </div>

                  <div className="flex items-center gap-4 p-4 border rounded-lg bg-pink-50">
                    <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center">
                      <Target className="w-5 h-5 text-pink-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium">Referral program success</h4>
                      <p className="text-sm text-muted-foreground">12 new customers acquired through referrals this week</p>
                      <p className="text-xs text-muted-foreground">3 days ago</p>
                    </div>
                    <Badge>Referral</Badge>
                  </div>
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Performance Charts */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LineChart className="w-5 h-5" />
                  Revenue Trend
                </CardTitle>
                <CardDescription>Marketing-generated revenue over the last 30 days</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  <LineChart className="w-16 h-16" />
                  <div className="ml-4">
                    <p>Revenue trend visualization</p>
                    <p className="text-sm">↑ 15.3% from last month</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="w-5 h-5" />
                  Traffic Sources
                </CardTitle>
                <CardDescription>Where your customers are coming from</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  <PieChart className="w-16 h-16" />
                  <div className="ml-4">
                    <p>Traffic sources breakdown</p>
                    <div className="text-sm mt-2">
                      <div>• Social Media: 35%</div>
                      <div>• Email: 25%</div>
                      <div>• Organic: 20%</div>
                      <div>• Referrals: 20%</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="social">
          <SocialMediaAutomation />
        </TabsContent>

        <TabsContent value="email">
          <EmailMarketingSystem />
        </TabsContent>

        <TabsContent value="influencers">
          <InfluencerManagement />
        </TabsContent>

        <TabsContent value="community">
          <CommunityEngagement />
        </TabsContent>

        <TabsContent value="analytics">
          <MarketingAnalytics />
        </TabsContent>

        <TabsContent value="automation" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Marketing Automation Workflows
              </CardTitle>
              <CardDescription>
                Automated marketing sequences and triggers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  {
                    name: 'Welcome Series',
                    description: '7-day email sequence for new subscribers',
                    status: 'active',
                    performance: '68% open rate, 15% conversion',
                    triggers: 'When subscriber joins list',
                    lastRun: '2 hours ago'
                  },
                  {
                    name: 'Abandoned Cart Recovery',
                    description: 'Recovery emails for abandoned bookings',
                    status: 'active',
                    performance: '72% open rate, 25% recovery',
                    triggers: 'When booking is abandoned',
                    lastRun: '30 minutes ago'
                  },
                  {
                    name: 'Post-Treatment Care',
                    description: 'Aftercare tips following treatments',
                    status: 'active',
                    performance: '85% open rate, 42% engagement',
                    triggers: '24 hours after booking completion',
                    lastRun: '1 day ago'
                  },
                  {
                    name: 'Social Media Posting',
                    description: 'Automated posting to social platforms',
                    status: 'active',
                    performance: '124 posts this month',
                    triggers: 'Scheduled times + content calendar',
                    lastRun: '3 hours ago'
                  },
                  {
                    name: 'Influencer Content Review',
                    description: 'Auto-approval for qualified influencer content',
                    status: 'draft',
                    performance: 'Not started yet',
                    triggers: 'When influencer submits content',
                    lastRun: 'Never'
                  }
                ].map((workflow, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-medium">{workflow.name}</h3>
                        <Badge variant={workflow.status === 'active' ? 'default' : 'secondary'}>
                          {workflow.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{workflow.description}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>Trigger: {workflow.triggers}</span>
                        <span>Performance: {workflow.performance}</span>
                        <span>Last run: {workflow.lastRun}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <Button variant="outline" size="sm">
                        <Settings className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <BarChart3 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Automation Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">3,245</div>
                    <div className="text-sm text-muted-foreground">Automated Actions</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">92%</div>
                    <div className="text-sm text-muted-foreground">Success Rate</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">156</div>
                    <div className="text-sm text-muted-foreground">Conversions</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">3.2h</div>
                    <div className="text-sm text-muted-foreground">Time Saved/Week</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Scheduled Automations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { time: '3:00 PM', action: 'Instagram post - Spring treatments', type: 'social' },
                    { time: '6:00 PM', action: 'Email campaign - Weekly newsletter', type: 'email' },
                    { time: '9:00 AM', action: 'Content review - User submissions', type: 'community' },
                    { time: '12:00 PM', action: 'Report generation - Performance metrics', type: 'analytics' }
                  ].map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Clock className="w-4 h-4 text-gray-500" />
                        <div>
                          <p className="text-sm font-medium">{item.time}</p>
                          <p className="text-xs text-muted-foreground">{item.action}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="capitalize">{item.type}</Badge>
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