import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useLuxuryExperience } from '@/contexts/LuxuryExperienceContext';
import { useTranslation } from 'react-i18next';
import {
  Crown,
  Diamond,
  Star,
  Heart,
  Gift,
  Sparkles,
  Award,
  Shield,
  Zap,
  Users,
  Calendar,
  MapPin,
  Clock,
  Phone,
  Video,
  MessageCircle,
  Mail,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Target,
  Trophy,
  Gem,
  Champagne,
  Music,
  Flower2,
  Car,
  Plane,
  Hotel,
  Restaurant,
  Spa,
  ShoppingBag,
  CreditCard,
  HeadphonesIcon,
  UserCheck,
  Bell,
  Settings,
  FileText,
  TrendingDown,
  BarChart3,
  PieChart,
  Activity,
  DollarSign,
  Percent,
  ArrowUp,
  ArrowDown,
  MoreVertical,
  Download,
  Filter,
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  ChevronRight,
  ChevronLeft,
  RefreshCw
} from 'lucide-react';

interface VIPExcellenceProgramProps {
  onAction?: (action: string, data?: any) => void;
}

interface VIPClientMetrics {
  client: {
    id: string;
    name: string;
    tier: string;
    totalSpent: number;
    bookingCount: number;
    satisfactionScore: number;
    retentionRate: number;
    lastInteraction: string;
    nextAppointment: string;
  };
  performance: {
    avgResponseTime: number;
    resolutionRate: number;
    satisfactionScore: number;
    upsellConversion: number;
    retentionRate: number;
    roi: number;
  };
  trends: {
    spendingTrend: 'up' | 'down' | 'stable';
    bookingTrend: 'up' | 'down' | 'stable';
    satisfactionTrend: 'up' | 'down' | 'stable';
  };
}

interface WhiteGloveService {
  id: string;
  clientId: string;
  serviceType: 'concierge' | 'personal_shopper' | 'travel_planning' | 'event_planning' | 'wellness';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  assignedAgent: string;
  requestDate: string;
  estimatedCompletion: string;
  priority: 'standard' | 'high' | 'urgent';
  description: string;
  progress: number;
  clientFeedback?: {
    rating: number;
    comment: string;
    date: string;
  };
}

interface VIPEvent {
  id: string;
  title: string;
  type: 'exclusive' | 'workshop' | 'networking' | 'wellness' | 'celebration';
  date: string;
  location: string;
  attendees: number;
  maxAttendees: number;
  description: string;
  isVirtual: boolean;
  registrationDeadline: string;
  specialInstructions?: string;
  clientRegistered: boolean;
}

const VIPExcellenceProgram: React.FC<VIPExcellenceProgramProps> = ({ onAction }) => {
  const {
    clientProfile,
    currentTier,
    hasDedicatedAgent,
    getDedicatedAgent,
    requestWhiteGloveService,
    calculateTierProgress,
    enableLuxuryFeatures,
    getTierBenefits
  } = useLuxuryExperience();

  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedMetrics, setSelectedMetrics] = useState<VIPClientMetrics | null>(null);
  const [whiteGloveServices, setWhiteGloveServices] = useState<WhiteGloveService[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<VIPEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Mock data for demonstration
  const mockMetrics: VIPClientMetrics = {
    client: {
      id: 'vip_001',
      name: 'Anna Kowalska',
      tier: 'vip_platinum',
      totalSpent: 45000,
      bookingCount: 87,
      satisfactionScore: 4.9,
      retentionRate: 98,
      lastInteraction: '2024-01-15T14:30:00Z',
      nextAppointment: '2024-01-20T10:00:00Z'
    },
    performance: {
      avgResponseTime: 0.8, // hours
      resolutionRate: 99.2,
      satisfactionScore: 4.9,
      upsellConversion: 85,
      retentionRate: 98,
      roi: 325
    },
    trends: {
      spendingTrend: 'up',
      bookingTrend: 'stable',
      satisfactionTrend: 'up'
    }
  };

  const mockWhiteGloveServices: WhiteGloveService[] = [
    {
      id: 'wgs_001',
      clientId: 'vip_001',
      serviceType: 'concierge',
      status: 'in_progress',
      assignedAgent: 'Maria Nowak',
      requestDate: '2024-01-15T09:00:00Z',
      estimatedCompletion: '2024-01-17T18:00:00Z',
      priority: 'high',
      description: 'Personal shopping assistance for special event outfit',
      progress: 65
    },
    {
      id: 'wgs_002',
      clientId: 'vip_001',
      serviceType: 'wellness',
      status: 'pending',
      assignedAgent: 'Dr. Anna Wiśniewska',
      requestDate: '2024-01-14T15:30:00Z',
      estimatedCompletion: '2024-01-21T12:00:00Z',
      priority: 'standard',
      description: 'Personalized wellness consultation and treatment plan',
      progress: 10
    }
  ];

  const mockEvents: VIPEvent[] = [
    {
      id: 'event_001',
      title: 'VIP Beauty & Wellness Retreat',
      type: 'exclusive',
      date: '2024-02-15T09:00:00Z',
      location: 'Luxury Spa Resort, Zakopane',
      attendees: 12,
      maxAttendees: 20,
      description: 'Exclusive weekend retreat featuring top beauty experts and wellness practitioners',
      isVirtual: false,
      registrationDeadline: '2024-02-01T23:59:59Z',
      specialInstructions: 'Luxury accommodation and transportation provided',
      clientRegistered: true
    },
    {
      id: 'event_002',
      title: 'Polish Fashion Week VIP Access',
      type: 'exclusive',
      date: '2024-03-20T18:00:00Z',
      location: 'Warsaw Fashion Center',
      attendees: 8,
      maxAttendees: 15,
      description: 'Front row access to exclusive fashion shows and designer meet & greet',
      isVirtual: false,
      registrationDeadline: '2024-03-10T23:59:59Z',
      clientRegistered: false
    }
  ];

  useEffect(() => {
    // Simulate loading VIP data
    setTimeout(() => {
      setSelectedMetrics(mockMetrics);
      setWhiteGloveServices(mockWhiteGloveServices);
      setUpcomingEvents(mockEvents);
      setIsLoading(false);
    }, 1000);
  }, []);

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'vip_platinum': return 'from-purple-600 to-pink-600';
      case 'vip_gold': return 'from-yellow-600 to-amber-600';
      case 'vip_silver': return 'from-gray-400 to-gray-600';
      default: return 'from-gray-600 to-gray-800';
    }
  };

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'vip_platinum': return <Diamond className="h-6 w-6 text-purple-500" />;
      case 'vip_gold': return <Crown className="h-6 w-6 text-yellow-500" />;
      case 'vip_silver': return <Star className="h-6 w-6 text-gray-400" />;
      default: return <Shield className="h-6 w-6 text-gray-600" />;
    }
  };

  const getServiceTypeIcon = (type: string) => {
    switch (type) {
      case 'concierge': return <Users className="h-5 w-5" />;
      case 'personal_shopper': return <ShoppingBag className="h-5 w-5" />;
      case 'travel_planning': return <Plane className="h-5 w-5" />;
      case 'event_planning': return <Calendar className="h-5 w-5" />;
      case 'wellness': return <Spa className="h-5 w-5" />;
      default: return <Sparkles className="h-5 w-5" />;
    }
  };

  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case 'exclusive': return <Gem className="h-5 w-5" />;
      case 'workshop': return <Award className="h-5 w-5" />;
      case 'networking': return <Users className="h-5 w-5" />;
      case 'wellness': return <Spa className="h-5 w-5" />;
      case 'celebration': return <Champagne className="h-5 w-5" />;
      default: return <Calendar className="h-5 w-5" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <ArrowUp className="h-4 w-4 text-green-500" />;
      case 'down': return <ArrowDown className="h-4 w-4 text-red-500" />;
      default: return <TrendingUp className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'PLN',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const handleRequestWhiteGloveService = async (serviceType: string) => {
    const success = await requestWhiteGloveService();
    if (success && onAction) {
      onAction('whiteGloveRequested', { serviceType });
    }
  };

  const handleRegisterForEvent = (eventId: string) => {
    if (onAction) {
      onAction('eventRegistration', { eventId });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  const isVIP = ['vip_platinum', 'vip_gold', 'vip_silver'].includes(currentTier);

  return (
    <div className="space-y-6 p-6">
      {/* VIP Excellence Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6 rounded-lg shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">VIP Excellence Program</h1>
            <p className="text-purple-100">World-class luxury service and exclusive privileges</p>
          </div>
          <div className="flex items-center gap-3">
            {getTierIcon(currentTier)}
            <div>
              <div className="text-2xl font-bold">{currentTier.replace('_', ' ').toUpperCase()}</div>
              <div className="text-sm text-purple-100">Member Since 2022</div>
            </div>
          </div>
        </div>
      </div>

      {/* VIP Metrics Dashboard */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="whiteGlove">White Glove</TabsTrigger>
          <TabsTrigger value="events">Exclusive Events</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="benefits">Benefits</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Client Profile Card */}
            <Card className="lg:col-span-2 border-purple-200 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-purple-900">
                  <UserCheck className="h-5 w-5 text-purple-600" />
                  VIP Client Profile
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedMetrics && (
                  <div className="space-y-6">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-16 w-16 border-2 border-purple-300">
                        <AvatarImage src="/api/placeholder/64/64" />
                        <AvatarFallback className="bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-xl">
                          {selectedMetrics.client.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-purple-900">{selectedMetrics.client.name}</h3>
                        <div className="flex items-center gap-2">
                          {getTierIcon(selectedMetrics.client.tier)}
                          <span className="font-medium text-purple-700">
                            {selectedMetrics.client.tier.replace('_', ' ').toUpperCase()}
                          </span>
                        </div>
                        {hasDedicatedAgent() && (
                          <div className="flex items-center gap-2 text-sm text-purple-600 mt-1">
                            <HeadphonesIcon className="h-4 w-4" />
                            <span>Dedicated Agent: {getDedicatedAgent()}</span>
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-purple-900">
                          {formatCurrency(selectedMetrics.client.totalSpent)}
                        </div>
                        <div className="text-sm text-purple-600">Lifetime Value</div>
                      </div>
                    </div>

                    {/* Key Metrics */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-3 bg-purple-50 rounded-lg">
                        <div className="text-2xl font-bold text-purple-900">{selectedMetrics.client.bookingCount}</div>
                        <div className="text-sm text-purple-600">Total Bookings</div>
                      </div>
                      <div className="text-center p-3 bg-purple-50 rounded-lg">
                        <div className="text-2xl font-bold text-purple-900">{selectedMetrics.client.satisfactionScore}</div>
                        <div className="text-sm text-purple-600">Satisfaction Score</div>
                      </div>
                      <div className="text-center p-3 bg-purple-50 rounded-lg">
                        <div className="text-2xl font-bold text-purple-900">{selectedMetrics.client.retentionRate}%</div>
                        <div className="text-sm text-purple-600">Retention Rate</div>
                      </div>
                      <div className="text-center p-3 bg-purple-50 rounded-lg">
                        <div className="text-2xl font-bold text-purple-900">{selectedMetrics.performance.roi}%</div>
                        <div className="text-sm text-purple-600">Support ROI</div>
                      </div>
                    </div>

                    {/* Trends */}
                    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                      <div className="flex items-center gap-4">
                        <span className="font-medium text-purple-900">Performance Trends</span>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-purple-600" />
                          {getTrendIcon(selectedMetrics.trends.spendingTrend)}
                          <span className="text-sm text-purple-900">Spending</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-purple-600" />
                          {getTrendIcon(selectedMetrics.trends.bookingTrend)}
                          <span className="text-sm text-purple-900">Bookings</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Heart className="h-4 w-4 text-purple-600" />
                          {getTrendIcon(selectedMetrics.trends.satisfactionTrend)}
                          <span className="text-sm text-purple-900">Satisfaction</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="border-purple-200 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-purple-900">
                  <Zap className="h-5 w-5 text-purple-600" />
                  VIP Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  onClick={() => handleRequestWhiteGloveService('concierge')}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Request White Glove Service
                </Button>

                {hasDedicatedAgent() && (
                  <Button
                    variant="outline"
                    className="w-full border-purple-300 text-purple-700 hover:bg-purple-50"
                  >
                    <HeadphonesIcon className="h-4 w-4 mr-2" />
                    Contact Dedicated Agent
                  </Button>
                )}

                <Button
                  variant="outline"
                  className="w-full border-purple-300 text-purple-700 hover:bg-purple-50"
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Schedule Priority Appointment
                </Button>

                <Button
                  variant="outline"
                  className="w-full border-purple-300 text-purple-700 hover:bg-purple-50"
                >
                  <Gift className="h-4 w-4 mr-2" />
                  View Exclusive Offers
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Service Standards */}
          <Card className="border-purple-200 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-purple-900">
                <Shield className="h-5 w-5 text-purple-600" />
                VIP Service Standards
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-900 mb-2">0.5hr</div>
                  <div className="text-sm text-purple-600">Email Response Time</div>
                  <Progress value={95} className="mt-2 h-2" />
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-900 mb-2">1min</div>
                  <div className="text-sm text-purple-600">Phone Response Time</div>
                  <Progress value={98} className="mt-2 h-2" />
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-900 mb-2">24/7</div>
                  <div className="text-sm text-purple-600">Support Availability</div>
                  <Progress value={100} className="mt-2 h-2" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* White Glove Services Tab */}
        <TabsContent value="whiteGlove" className="space-y-6">
          <Card className="border-purple-200 shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-purple-900">
                  <Sparkles className="h-5 w-5 text-purple-600" />
                  White Glove Services
                </CardTitle>
                <Button
                  onClick={() => handleRequestWhiteGloveService('concierge')}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Request Service
                </Button>
              </div>
              <CardDescription>
                Premium concierge services tailored to your needs
              </CardDescription>
            </CardHeader>
            <CardContent>
              {whiteGloveServices.length > 0 ? (
                <div className="space-y-4">
                  {whiteGloveServices.map((service) => (
                    <div key={service.id} className="border border-purple-200 rounded-lg p-4 bg-purple-50">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          {getServiceTypeIcon(service.serviceType)}
                          <div>
                            <h4 className="font-medium text-purple-900 capitalize">
                              {service.serviceType.replace('_', ' ')} Service
                            </h4>
                            <p className="text-sm text-purple-600">{service.description}</p>
                          </div>
                        </div>
                        <Badge className={getStatusColor(service.status)}>
                          {service.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-purple-600">Agent:</span>
                          <span className="ml-2 font-medium text-purple-900">{service.assignedAgent}</span>
                        </div>
                        <div>
                          <span className="text-purple-600">Est. Completion:</span>
                          <span className="ml-2 font-medium text-purple-900">
                            {new Date(service.estimatedCompletion).toLocaleDateString()}
                          </span>
                        </div>
                        <div>
                          <span className="text-purple-600">Priority:</span>
                          <span className="ml-2 font-medium text-purple-900 capitalize">{service.priority}</span>
                        </div>
                      </div>
                      {service.progress > 0 && (
                        <div className="mt-3">
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span className="text-purple-600">Progress</span>
                            <span className="font-medium text-purple-900">{service.progress}%</span>
                          </div>
                          <Progress value={service.progress} className="h-2" />
                        </div>
                      )}
                      {service.clientFeedback && (
                        <div className="mt-3 p-3 bg-white rounded border border-purple-200">
                          <div className="flex items-center gap-2 mb-2">
                            <Star className="h-4 w-4 text-yellow-500 fill-current" />
                            <span className="font-medium text-purple-900">Client Feedback</span>
                            <span className="text-sm text-purple-600">
                              ({service.clientFeedback.rating}/5.0)
                            </span>
                          </div>
                          <p className="text-sm text-purple-700">{service.clientFeedback.comment}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Sparkles className="h-12 w-12 text-purple-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-purple-900 mb-2">No White Glove Services Active</h3>
                  <p className="text-purple-600 mb-4">Request premium concierge services to get started</p>
                  <Button
                    onClick={() => handleRequestWhiteGloveService('concierge')}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Request Your First Service
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Exclusive Events Tab */}
        <TabsContent value="events" className="space-y-6">
          <Card className="border-purple-200 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-purple-900">
                <Gem className="h-5 w-5 text-purple-600" />
                Exclusive VIP Events
              </CardTitle>
              <CardDescription>
                Premium events and experiences reserved for our VIP clients
              </CardDescription>
            </CardHeader>
            <CardContent>
              {upcomingEvents.length > 0 ? (
                <div className="space-y-4">
                  {upcomingEvents.map((event) => (
                    <div key={event.id} className="border border-purple-200 rounded-lg p-4 bg-gradient-to-r from-purple-50 to-pink-50">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          {getEventTypeIcon(event.type)}
                          <div>
                            <h4 className="font-medium text-purple-900">{event.title}</h4>
                            <p className="text-sm text-purple-600">{event.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className="bg-purple-100 text-purple-800 capitalize">
                            {event.type}
                          </Badge>
                          {event.clientRegistered && (
                            <Badge className="bg-green-100 text-green-800">
                              Registered
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-purple-600" />
                          <span className="text-purple-900">
                            {new Date(event.date).toLocaleDateString('pl-PL', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-purple-600" />
                          <span className="text-purple-900">{event.location}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-purple-600" />
                          <span className="text-purple-900">
                            {event.attendees}/{event.maxAttendees} attendees
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {event.isVirtual ? (
                            <Video className="h-4 w-4 text-purple-600" />
                          ) : (
                            <MapPin className="h-4 w-4 text-purple-600" />
                          )}
                          <span className="text-purple-900">
                            {event.isVirtual ? 'Virtual Event' : 'In-Person'}
                          </span>
                        </div>
                      </div>
                      {event.specialInstructions && (
                        <div className="mt-3 p-3 bg-white rounded border border-purple-200">
                          <p className="text-sm text-purple-700">
                            <strong>Special Instructions:</strong> {event.specialInstructions}
                          </p>
                        </div>
                      )}
                      <div className="mt-4 flex items-center justify-between">
                        <div className="text-sm text-purple-600">
                          Registration deadline: {new Date(event.registrationDeadline).toLocaleDateString('pl-PL')}
                        </div>
                        <Button
                          onClick={() => handleRegisterForEvent(event.id)}
                          disabled={event.clientRegistered}
                          variant={event.clientRegistered ? "secondary" : "default"}
                          className={event.clientRegistered ? "" : "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"}
                        >
                          {event.clientRegistered ? (
                            <>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Registered
                            </>
                          ) : (
                            <>
                              <Plus className="h-4 w-4 mr-2" />
                              Register Now
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-purple-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-purple-900 mb-2">No Upcoming Events</h3>
                  <p className="text-purple-600">Check back soon for exclusive VIP events</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          {selectedMetrics && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Performance Metrics */}
              <Card className="border-purple-200 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-purple-900">
                    <BarChart3 className="h-5 w-5 text-purple-600" />
                    Performance Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                      <span className="text-sm font-medium text-purple-900">Response Time</span>
                      <div className="text-right">
                        <div className="font-bold text-purple-900">{selectedMetrics.performance.avgResponseTime}h</div>
                        <div className="text-xs text-purple-600">Average</div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                      <span className="text-sm font-medium text-purple-900">Resolution Rate</span>
                      <div className="text-right">
                        <div className="font-bold text-purple-900">{selectedMetrics.performance.resolutionRate}%</div>
                        <div className="text-xs text-purple-600">Success rate</div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                      <span className="text-sm font-medium text-purple-900">Satisfaction Score</span>
                      <div className="text-right">
                        <div className="font-bold text-purple-900">{selectedMetrics.performance.satisfactionScore}/5.0</div>
                        <div className="text-xs text-purple-600">Average rating</div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                      <span className="text-sm font-medium text-purple-900">Support ROI</span>
                      <div className="text-right">
                        <div className="font-bold text-purple-900">{selectedMetrics.performance.roi}%</div>
                        <div className="text-xs text-purple-600">Return on investment</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Service Quality */}
              <Card className="border-purple-200 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-purple-900">
                    <Trophy className="h-5 w-5 text-purple-600" />
                    Service Quality Indicators
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-purple-900">Personalization</span>
                        <span className="text-sm text-purple-900">95%</span>
                      </div>
                      <Progress value={95} className="h-2" />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-purple-900">Proactive Service</span>
                        <span className="text-sm text-purple-900">88%</span>
                      </div>
                      <Progress value={88} className="h-2" />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-purple-900">White Glove Usage</span>
                        <span className="text-sm text-purple-900">72%</span>
                      </div>
                      <Progress value={72} className="h-2" />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-purple-900">Client Retention</span>
                        <span className="text-sm text-purple-900">{selectedMetrics.performance.retentionRate}%</span>
                      </div>
                      <Progress value={selectedMetrics.performance.retentionRate} className="h-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Benefits Tab */}
        <TabsContent value="benefits" className="space-y-6">
          <Card className="border-purple-200 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-purple-900">
                <Gift className="h-5 w-5 text-purple-600" />
                Your {currentTier.replace('_', ' ').toUpperCase()} Benefits
              </CardTitle>
              <CardDescription>
                Exclusive privileges and premium services available to you
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {getTierBenefits(currentTier).map((benefit, index) => (
                  <div key={index} className="flex items-start gap-3 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                    <CheckCircle className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-purple-900">{benefit}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default VIPExcellenceProgram;