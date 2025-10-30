/**
 * Main CRM Hub Page
 * Central dashboard for all CRM functionality with luxury interface design
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

import ClientProfileManager from '@/components/admin/crm/ClientProfileManager';
import LoyaltyProgramManager from '@/components/admin/crm/LoyaltyProgramManager';
import CRMAnalyticsDashboard from '@/components/admin/crm/CRMAnalyticsDashboard';

import {
  Users,
  Crown,
  TrendingUp,
  Search,
  Filter,
  Plus,
  Calendar,
  Award,
  Heart,
  MessageSquare,
  Target,
  Settings,
  Bell,
  Download,
  Eye,
  Edit,
  Star,
  Clock,
  AlertCircle,
  CheckCircle,
  Zap,
  Gift,
  Diamond,
  Gem,
  UserPlus,
  BarChart3,
  PieChart,
  Activity,
  Phone,
  Mail,
  MapPin
} from 'lucide-react';

import { crmService } from '@/services/crm.service';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';

interface Client {
  id: string;
  user_id: string;
  preferred_name?: string;
  user?: {
    email: string;
    full_name: string;
    avatar_url?: string;
    phone?: string;
  };
  loyalty?: {
    current_tier: string;
    current_points: number;
    lifetime_points: number;
    total_bookings: number;
    total_revenue: number;
  };
  relationship_strength: string;
  relationship_score: number;
  is_vip: boolean;
  last_booking_date?: string;
  next_appointment?: string;
  churn_risk?: number;
  satisfaction_score?: number;
}

const CRMHub: React.FC = () => {
  const navigate = useNavigate();
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTier, setFilterTier] = useState<string>('all');
  const [filterSegment, setFilterSegment] = useState<string>('all');
  const [showClientDialog, setShowClientDialog] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // Metrics state
  const [metrics, setMetrics] = useState({
    total_clients: 0,
    vip_clients: 0,
    active_clients: 0,
    new_clients_month: 0,
    total_revenue: 0,
    average_satisfaction: 0,
    churn_risk_clients: 0,
    loyalty_points_issued: 0
  });

  useEffect(() => {
    loadClients();
    loadMetrics();
  }, []);

  const loadClients = async () => {
    try {
      setLoading(true);
      const clientData = await crmService.getClientProfiles({
        limit: 50
      });

      setClients(clientData.profiles || []);
    } catch (error) {
      console.error('Error loading clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMetrics = async () => {
    try {
      const metricsData = await crmService.getClientsSummaryMetrics();
      if (metricsData) {
        setMetrics({
          total_clients: metricsData.total_clients || 0,
          vip_clients: metricsData.vip_clients || 0,
          active_clients: metricsData.active_clients || 0,
          new_clients_month: 0, // Would need historical data
          total_revenue: metricsData.total_revenue || 0,
          average_satisfaction: metricsData.average_satisfaction_score || 0,
          churn_risk_clients: metricsData.churn_risk_clients || 0,
          loyalty_points_issued: 0 // Would need additional data
        });
      }
    } catch (error) {
      console.error('Error loading metrics:', error);
    }
  };

  const filteredClients = clients.filter(client => {
    const matchesSearch = searchTerm === '' ||
      client.user?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.preferred_name?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesTier = filterTier === 'all' || client.loyalty?.current_tier === filterTier;
    const matchesSegment = filterSegment === 'all'; // Would need segment data

    return matchesSearch && matchesTier && matchesSegment;
  });

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'platinum': return <Diamond className="w-4 h-4" />;
      case 'gold': return <Crown className="w-4 h-4" />;
      case 'silver': return <Award className="w-4 h-4" />;
      case 'bronze': return <Gem className="w-4 h-4" />;
      default: return <Gem className="w-4 h-4" />;
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'platinum': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'gold': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'silver': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'bronze': return 'bg-amber-100 text-amber-800 border-amber-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRelationshipStrengthColor = (strength: string) => {
    switch (strength) {
      case 'very_strong': return 'bg-green-500';
      case 'strong': return 'bg-green-400';
      case 'moderate': return 'bg-yellow-500';
      case 'weak': return 'bg-orange-500';
      case 'very_weak': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'PLN'
    }).format(amount);
  };

  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat('pl-PL').format(num);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-slate-900">CRM Hub</h1>
              <Badge variant="secondary" className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                Luxury Client Management
              </Badge>
            </div>

            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm">
                <Bell className="w-4 h-4 mr-2" />
                Notifications
              </Button>
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Client
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Metrics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Total Clients</p>
                  <p className="text-3xl font-bold mt-1">{formatNumber(metrics.total_clients)}</p>
                  <p className="text-blue-100 text-sm mt-2">+{formatNumber(metrics.new_clients_month)} this month</p>
                </div>
                <div className="bg-white/20 p-3 rounded-lg">
                  <Users className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm">VIP Clients</p>
                  <p className="text-3xl font-bold mt-1">{formatNumber(metrics.vip_clients)}</p>
                  <p className="text-purple-100 text-sm mt-2">
                    {metrics.total_clients > 0 ? ((metrics.vip_clients / metrics.total_clients) * 100).toFixed(1) : 0}% of total
                  </p>
                </div>
                <div className="bg-white/20 p-3 rounded-lg">
                  <Crown className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm">Total Revenue</p>
                  <p className="text-3xl font-bold mt-1">{formatCurrency(metrics.total_revenue)}</p>
                  <p className="text-green-100 text-sm mt-2">All time</p>
                </div>
                <div className="bg-white/20 p-3 rounded-lg">
                  <TrendingUp className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm">Avg Satisfaction</p>
                  <p className="text-3xl font-bold mt-1">{metrics.average_satisfaction.toFixed(1)}</p>
                  <p className="text-orange-100 text-sm mt-2">Out of 5.0</p>
                </div>
                <div className="bg-white/20 p-3 rounded-lg">
                  <Star className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main CRM Interface */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview" className="flex items-center">
              <BarChart3 className="w-4 h-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="clients" className="flex items-center">
              <Users className="w-4 h-4 mr-2" />
              Clients
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center">
              <PieChart className="w-4 h-4 mr-2" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="loyalty" className="flex items-center">
              <Award className="w-4 h-4 mr-2" />
              Loyalty
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Recent Activity */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Activity className="w-5 h-5 mr-2" />
                    Recent Client Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {filteredClients.slice(0, 5).map((client) => (
                      <div key={client.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 transition-colors">
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium">
                              {client.user?.full_name?.split(' ').map(n => n[0]).join('') || 'U'}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium">
                              {client.preferred_name || client.user?.full_name}
                            </p>
                            <p className="text-sm text-slate-500">{client.user?.email}</p>
                            <div className="flex items-center space-x-2 mt-1">
                              <Badge variant="outline" className={getTierColor(client.loyalty?.current_tier || 'bronze')}>
                                {getTierIcon(client.loyalty?.current_tier || 'bronze')}
                                <span className="ml-1 capitalize">{client.loyalty?.current_tier}</span>
                              </Badge>
                              {client.is_vip && (
                                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                                  VIP
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <p className="font-medium">{formatNumber(client.loyalty?.total_bookings || 0)} bookings</p>
                          <p className="text-sm text-slate-500">{formatCurrency(client.loyalty?.total_revenue || 0)}</p>
                          <Button
                            size="sm"
                            variant="outline"
                            className="mt-2"
                            onClick={() => {
                              setSelectedClient(client);
                              setShowClientDialog(true);
                            }}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Zap className="w-5 h-5 mr-2" />
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Button className="w-full justify-start" variant="outline">
                      <UserPlus className="w-4 h-4 mr-2" />
                      Add New Client
                    </Button>
                    <Button className="w-full justify-start" variant="outline">
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Send Campaign
                    </Button>
                    <Button className="w-full justify-start" variant="outline">
                      <Gift className="w-4 h-4 mr-2" />
                      Award Points
                    </Button>
                    <Button className="w-full justify-start" variant="outline">
                      <Target className="w-4 h-4 mr-2" />
                      Generate Reports
                    </Button>
                    <Button className="w-full justify-start" variant="outline">
                      <Download className="w-4 h-4 mr-2" />
                      Export Data
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Client Retention</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-green-600">94.2%</p>
                    <p className="text-sm text-slate-500 mt-2">Current month retention rate</p>
                    <div className="w-full bg-green-100 rounded-full h-2 mt-4">
                      <div className="bg-green-600 h-2 rounded-full" style={{ width: '94.2%' }}></div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Average Order Value</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-blue-600">₺485</p>
                    <p className="text-sm text-slate-500 mt-2">Per client booking</p>
                    <div className="flex items-center justify-center mt-2">
                      <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
                      <span className="text-sm text-green-600">+12% vs last month</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Churn Risk Alert</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-orange-600">{metrics.churn_risk_clients}</p>
                    <p className="text-sm text-slate-500 mt-2">Clients at risk</p>
                    <Button size="sm" variant="outline" className="mt-4">
                      <AlertCircle className="w-4 h-4 mr-2" />
                      Take Action
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Clients Tab */}
          <TabsContent value="clients" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Client Management</CardTitle>
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      <Search className="w-4 h-4 text-slate-500" />
                      <Input
                        placeholder="Search clients..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-64"
                      />
                    </div>
                    <Select value={filterTier} onValueChange={setFilterTier}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Filter by tier" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Tiers</SelectItem>
                        <SelectItem value="bronze">Bronze</SelectItem>
                        <SelectItem value="silver">Silver</SelectItem>
                        <SelectItem value="gold">Gold</SelectItem>
                        <SelectItem value="platinum">Platinum</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Client
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredClients.map((client) => (
                    <div key={client.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 transition-colors">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-slate-200 rounded-full flex items-center justify-center">
                          <span className="text-lg font-medium">
                            {client.user?.full_name?.split(' ').map(n => n[0]).join('') || 'U'}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">
                            {client.preferred_name || client.user?.full_name}
                            {client.is_vip && <Crown className="w-4 h-4 ml-2 text-yellow-500 inline" />}
                          </p>
                          <p className="text-sm text-slate-500">{client.user?.email}</p>
                          {client.user?.phone && (
                            <p className="text-sm text-slate-500 flex items-center mt-1">
                              <Phone className="w-3 h-3 mr-1" />
                              {client.user.phone}
                            </p>
                          )}
                          <div className="flex items-center space-x-2 mt-2">
                            <Badge variant="outline" className={getTierColor(client.loyalty?.current_tier || 'bronze')}>
                              {getTierIcon(client.loyalty?.current_tier || 'bronze')}
                              <span className="ml-1 capitalize">{client.loyalty?.current_tier}</span>
                            </Badge>
                            <div className="flex items-center space-x-1">
                              <div className={`w-2 h-2 rounded-full ${getRelationshipStrengthColor(client.relationship_strength)}`}></div>
                              <span className="text-xs text-slate-500">
                                {client.relationship_score}/100
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-6">
                        <div className="text-right">
                          <p className="text-sm text-slate-500">Bookings</p>
                          <p className="font-medium">{formatNumber(client.loyalty?.total_bookings || 0)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-slate-500">Revenue</p>
                          <p className="font-medium">{formatCurrency(client.loyalty?.total_revenue || 0)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-slate-500">Points</p>
                          <p className="font-medium">{formatNumber(client.loyalty?.current_points || 0)}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedClient(client);
                              setShowClientDialog(true);
                            }}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                          <Button size="sm" variant="outline">
                            <Edit className="w-4 h-4 mr-1" />
                            Edit
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {filteredClients.length === 0 && (
                  <div className="text-center py-12 text-slate-500">
                    <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No clients found</p>
                    <p className="text-sm">Try adjusting your search or filters</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <CRMAnalyticsDashboard viewMode="full" />
          </TabsContent>

          {/* Loyalty Tab */}
          <TabsContent value="loyalty" className="space-y-6">
            {selectedClient ? (
              <LoyaltyProgramManager clientId={selectedClient.id} viewMode="full" />
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <Award className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">Select a Client</h3>
                  <p className="text-slate-500 mb-4">
                    Choose a client from the Clients tab to view their loyalty program details
                  </p>
                  <Button onClick={() => setActiveTab('clients')}>
                    Go to Clients
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Client Profile Dialog */}
        <Dialog open={showClientDialog} onOpenChange={setShowClientDialog}>
          <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Client Profile</DialogTitle>
              <DialogDescription>
                Comprehensive view of client information, history, and preferences
              </DialogDescription>
            </DialogHeader>

            {selectedClient && (
              <ClientProfileManager
                userId={selectedClient.user_id}
                onSave={() => {
                  loadClients();
                  setShowClientDialog(false);
                }}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default CRMHub;