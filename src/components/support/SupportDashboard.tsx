import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SupportService } from '@/services/support.service';
import type { SupportDashboardData, SupportTicketWithDetails } from '@/types/supabase';
import {
  MessageCircle,
  Clock,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Users,
  BarChart3,
  Calendar,
  Search,
  Filter,
  Eye,
  Edit,
  UserCheck,
  Phone,
  Mail,
  Globe
} from 'lucide-react';

const SupportDashboard: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<SupportDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicketWithDetails | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const data = await SupportService.getSupportMetrics();
      setDashboardData(data);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-500 text-black';
      case 'low': return 'bg-green-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-blue-500 text-white';
      case 'in_progress': return 'bg-purple-500 text-white';
      case 'waiting_on_customer': return 'bg-yellow-500 text-black';
      case 'resolved': return 'bg-green-500 text-white';
      case 'closed': return 'bg-gray-500 text-white';
      case 'escalated': return 'bg-red-600 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getSLAStatusColor = (slaStatus: string) => {
    switch (slaStatus) {
      case 'on_track': return 'text-green-600';
      case 'at_risk': return 'text-yellow-600';
      case 'breached': return 'text-red-600';
      case 'exceeded': return 'text-red-800';
      default: return 'text-gray-600';
    }
  };

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="text-center text-gray-500 py-12">
        Unable to load support dashboard data
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 bg-gradient-to-br from-amber-50/50 to-orange-50/30 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold text-amber-900">Support Dashboard</h1>
          <p className="text-amber-700 mt-2">Luxury Customer Support Management</p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={loadDashboardData}
            variant="outline"
            className="border-amber-300 text-amber-700 hover:bg-amber-100"
          >
            Refresh
          </Button>
          <Button className="bg-amber-600 hover:bg-amber-700 text-white">
            New Ticket
          </Button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-amber-200 shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-amber-700 flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              Total Tickets
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-900">
              {dashboardData.metrics.totalTickets}
            </div>
            <p className="text-sm text-amber-600 mt-1">
              {dashboardData.metrics.openTickets} open, {dashboardData.metrics.inProgressTickets} in progress
            </p>
          </CardContent>
        </Card>

        <Card className="border-amber-200 shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-amber-700 flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Resolved Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {dashboardData.metrics.resolvedToday}
            </div>
            <p className="text-sm text-amber-600 mt-1">Successfully closed</p>
          </CardContent>
        </Card>

        <Card className="border-amber-200 shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-amber-700 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Avg Response Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-900">
              {formatTime(dashboardData.metrics.avgResponseTime)}
            </div>
            <p className="text-sm text-amber-600 mt-1">First response</p>
          </CardContent>
        </Card>

        <Card className="border-amber-200 shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-amber-700 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Customer Satisfaction
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-900">
              {dashboardData.metrics.customerSatisfactionAvg.toFixed(1)}
            </div>
            <p className="text-sm text-amber-600 mt-1">Out of 5.0</p>
          </CardContent>
        </Card>

        <Card className="border-amber-200 shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-amber-700 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Overdue Tickets
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">
              {dashboardData.metrics.overdueTickets}
            </div>
            <p className="text-sm text-amber-600 mt-1">SLA breached</p>
          </CardContent>
        </Card>

        <Card className="border-amber-200 shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-amber-700 flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              SLA Compliance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-900">
              {dashboardData.metrics.slaComplianceRate.toFixed(1)}%
            </div>
            <p className="text-sm text-amber-600 mt-1">On track</p>
          </CardContent>
        </Card>

        <Card className="border-amber-200 shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-amber-700 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Active Agents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-900">
              {dashboardData.teamPerformance.filter(a => a.is_active).length}
            </div>
            <p className="text-sm text-amber-600 mt-1">Available now</p>
          </CardContent>
        </Card>

        <Card className="border-amber-200 shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-amber-700 flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Channel Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {Object.entries(dashboardData.channelBreakdown).map(([channel, count]) => (
                <div key={channel} className="flex justify-between text-sm">
                  <span className="capitalize text-amber-700">{channel}</span>
                  <span className="font-medium text-amber-900">{count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="tickets" className="space-y-6">
        <TabsList className="bg-amber-100 border-amber-200">
          <TabsTrigger value="tickets" className="data-[state=active]:bg-amber-200">
            Active Tickets
          </TabsTrigger>
          <TabsTrigger value="team" className="data-[state=active]:bg-amber-200">
            Team Performance
          </TabsTrigger>
          <TabsTrigger value="analytics" className="data-[state=active]:bg-amber-200">
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tickets" className="space-y-6">
          {/* Filters */}
          <Card className="border-amber-200">
            <CardContent className="pt-6">
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-64">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-amber-600" />
                    <Input
                      placeholder="Search tickets..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 border-amber-200 focus:border-amber-400"
                    />
                  </div>
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-48 border-amber-200">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="waiting_on_customer">Waiting on Customer</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="escalated">Escalated</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger className="w-48 border-amber-200">
                    <SelectValue placeholder="Filter by priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priorities</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Tickets List */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card className="border-amber-200">
                <CardHeader>
                  <CardTitle className="text-amber-900 flex items-center gap-2">
                    <MessageCircle className="h-5 w-5" />
                    Recent Tickets
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {dashboardData.recentTickets
                      .filter(ticket => {
                        const matchesSearch = !searchTerm ||
                          ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          ticket.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          ticket.description.toLowerCase().includes(searchTerm.toLowerCase());

                        const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
                        const matchesPriority = priorityFilter === 'all' || ticket.priority === priorityFilter;

                        return matchesSearch && matchesStatus && matchesPriority;
                      })
                      .map((ticket) => (
                        <div
                          key={ticket.id}
                          onClick={() => setSelectedTicket(ticket)}
                          className="p-4 border border-amber-200 rounded-lg hover:bg-amber-50 cursor-pointer transition-colors"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold text-amber-900">{ticket.subject}</h3>
                                <Badge className={getPriorityColor(ticket.priority)}>
                                  {ticket.priority}
                                </Badge>
                                <Badge className={getStatusColor(ticket.status)}>
                                  {ticket.status.replace('_', ' ')}
                                </Badge>
                              </div>
                              <p className="text-sm text-amber-700 mb-1">
                                {ticket.client_name} • {ticket.client_email}
                              </p>
                              <p className="text-sm text-gray-600 line-clamp-2">
                                {ticket.description}
                              </p>
                            </div>
                            <div className="text-right text-sm text-amber-600 ml-4">
                              <div>{new Date(ticket.created_at).toLocaleDateString()}</div>
                              <div>{new Date(ticket.created_at).toLocaleTimeString()}</div>
                              {ticket.assigned_agent && (
                                <div className="text-xs text-green-600 mt-1">
                                  {ticket.assigned_agent.full_name || 'Assigned'}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-4 text-xs">
                            <div className="flex items-center gap-1">
                              <Globe className="h-3 w-3" />
                              <span>{ticket.channel}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              <span>{ticket.category}</span>
                            </div>
                            {ticket.sla_resolution_deadline && (
                              <div className={`flex items-center gap-1 ${getSLAStatusColor(ticket.sla_status)}`}>
                                <Clock className="h-3 w-3" />
                                <span>
                                  SLA: {new Date(ticket.sla_resolution_deadline).toLocaleDateString()}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Ticket Details Panel */}
            <div>
              {selectedTicket ? (
                <Card className="border-amber-200">
                  <CardHeader>
                    <CardTitle className="text-amber-900 flex items-center gap-2">
                      <Eye className="h-5 w-5" />
                      Ticket Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h3 className="font-semibold text-amber-900 mb-2">{selectedTicket.subject}</h3>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={getPriorityColor(selectedTicket.priority)}>
                          {selectedTicket.priority}
                        </Badge>
                        <Badge className={getStatusColor(selectedTicket.status)}>
                          {selectedTicket.status.replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="font-medium text-amber-700">Customer:</span>
                        <div className="text-amber-900">
                          {selectedTicket.client_name}
                          <br />
                          {selectedTicket.client_email}
                          {selectedTicket.client_phone && (
                            <span className="block">{selectedTicket.client_phone}</span>
                          )}
                        </div>
                      </div>

                      <div>
                        <span className="font-medium text-amber-700">Category:</span>
                        <span className="ml-2 text-amber-900">{selectedTicket.category}</span>
                      </div>

                      <div>
                        <span className="font-medium text-amber-700">Channel:</span>
                        <span className="ml-2 text-amber-900">{selectedTicket.channel}</span>
                      </div>

                      {selectedTicket.assigned_agent && (
                        <div>
                          <span className="font-medium text-amber-700">Assigned Agent:</span>
                          <span className="ml-2 text-amber-900">
                            {selectedTicket.assigned_agent.full_name || 'Agent'}
                          </span>
                        </div>
                      )}

                      <div>
                        <span className="font-medium text-amber-700">Description:</span>
                        <p className="mt-1 text-amber-900">{selectedTicket.description}</p>
                      </div>

                      {selectedTicket.sla_resolution_deadline && (
                        <div>
                          <span className="font-medium text-amber-700">SLA Deadline:</span>
                          <div className={`mt-1 ${getSLAStatusColor(selectedTicket.sla_status)}`}>
                            {new Date(selectedTicket.sla_resolution_deadline).toLocaleString()}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 pt-4">
                      <Button size="sm" className="bg-amber-600 hover:bg-amber-700">
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button size="sm" variant="outline" className="border-amber-300">
                        <UserCheck className="h-4 w-4 mr-1" />
                        Assign
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="border-amber-200">
                  <CardContent className="pt-6 text-center text-amber-600">
                    Select a ticket to view details
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="team">
          <Card className="border-amber-200">
            <CardHeader>
              <CardTitle className="text-amber-900 flex items-center gap-2">
                <Users className="h-5 w-5" />
                Team Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {dashboardData.teamPerformance.map((agent) => (
                  <Card key={agent.id} className="border-amber-100">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                          <UserCheck className="h-6 w-6 text-amber-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-amber-900">
                            {agent.user?.user_metadata?.full_name || 'Agent'}
                          </h3>
                          <p className="text-sm text-amber-600 capitalize">{agent.agent_level}</p>
                        </div>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-amber-700">Tickets Resolved:</span>
                          <span className="font-medium text-amber-900">{agent.tickets_resolved}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-amber-700">Satisfaction:</span>
                          <span className="font-medium text-amber-900">
                            {agent.customer_satisfaction_avg?.toFixed(1) || 'N/A'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-amber-700">Avg Response:</span>
                          <span className="font-medium text-amber-900">
                            {agent.avg_response_time ? formatTime(agent.avg_response_time) : 'N/A'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-amber-700">Status:</span>
                          <Badge
                            variant={agent.is_active ? 'default' : 'secondary'}
                            className={agent.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}
                          >
                            {agent.is_on_break ? 'On Break' : (agent.is_active ? 'Available' : 'Offline')}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-amber-200">
              <CardHeader>
                <CardTitle className="text-amber-900">Priority Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(dashboardData.priorityBreakdown).map(([priority, count]) => (
                    <div key={priority} className="flex items-center justify-between">
                      <span className="capitalize text-amber-700">{priority}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-amber-100 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${getPriorityColor(priority)}`}
                            style={{
                              width: `${(count / dashboardData.metrics.totalTickets) * 100}%`
                            }}
                          />
                        </div>
                        <span className="font-medium text-amber-900 w-8 text-right">{count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-amber-200">
              <CardHeader>
                <CardTitle className="text-amber-900">Category Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(dashboardData.categoryBreakdown).map(([category, count]) => (
                    <div key={category} className="flex items-center justify-between">
                      <span className="text-amber-700 capitalize">{category.replace('_', ' ')}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-amber-100 rounded-full h-2">
                          <div
                            className="h-2 rounded-full bg-amber-500"
                            style={{
                              width: `${(count / dashboardData.metrics.totalTickets) * 100}%`
                            }}
                          />
                        </div>
                        <span className="font-medium text-amber-900 w-8 text-right">{count}</span>
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

export default SupportDashboard;