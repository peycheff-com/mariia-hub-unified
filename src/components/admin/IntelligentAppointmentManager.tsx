import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  Users,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Brain,
  Zap,
  Eye,
  Settings,
  Bell,
  Target,
  Activity,
  Lightbulb,
  UserCheck,
  MessageSquare,
  CreditCard,
  Star,
  BarChart3,
  Timer,
  Filter,
  RefreshCw,
  ChevronRight,
  CalendarDays,
  UserPlus,
  DollarSign,
  TrendingUp as TrendingUpIcon,
  TrendingDown,
  XCircle,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Bot,
  TargetIcon as TargetIcon,
  Clock as ClockIcon,
} from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import {
  schedulingAI,
  SchedulingAnalytics,
  SchedulingPrediction,
  NoShowPrediction,
  SmartReminderConfig,
  SchedulingRecommendation,
  BookingPattern,
  ServicePattern
} from '@/services/schedulingAI';
import { supabase } from '@/integrations/supabase/client';

// Enhanced Interfaces for Intelligent Appointment Management
interface IntelligentSchedule {
  date: string;
  timeSlots: TimeSlotWithAI[];
  overallDemand: 'low' | 'medium' | 'high';
  aiOptimizations: OptimizationSuggestion[];
  predictedRevenue: number;
  utilizationRate: number;
}

interface TimeSlotWithAI {
  time: string;
  available: boolean;
  score: number; // AI confidence score
  predictedDemand: 'low' | 'medium' | 'high';
  noShowRisk: number;
  optimalPricing?: number;
  recommendedFor: string[]; // Customer segments
  aiInsights: string[];
}

interface OptimizationSuggestion {
  type: 'pricing' | 'capacity' | 'staffing' | 'promotion' | 'timing';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  description: string;
  expectedImpact: {
    revenue: number;
    efficiency: number;
    satisfaction: number;
  };
  implementation: {
    complexity: 'low' | 'medium' | 'high';
    timeRequired: string;
    resources: string[];
  };
  automationLevel: 'manual' | 'semi-automated' | 'fully-automated';
}

interface CustomerInsight {
  customerId: string;
  name: string;
  bookingPattern: BookingPattern;
  nextBestAppointment: {
    service: string;
    timeSlot: string;
    probability: number;
    reasoning: string;
  };
  churnRisk: number;
  ltv: number;
  preferences: {
    services: string[];
    timeSlots: string[];
    communicationChannels: string[];
  };
  lastInteraction: string;
  engagementScore: number;
}

interface StaffOptimization {
  staffId: string;
  name: string;
  efficiency: number;
  specialties: string[];
  currentLoad: number;
  optimalLoad: number;
  recommendedSchedule: {
    date: string;
    hours: number[];
    reasoning: string;
  }[];
  burnoutRisk: number;
}

interface PredictiveWorkflow {
  id: string;
  name: string;
  trigger: 'booking_created' | 'customer_inactive' | 'seasonal_demand' | 'capacity_alert';
  conditions: {
    type: string;
    operator: 'equals' | 'greater_than' | 'less_than' | 'between';
    value: any;
  }[];
  actions: {
    type: 'send_reminder' | 'adjust_pricing' | 'notify_staff' | 'create_promotion';
    parameters: Record<string, any>;
  }[];
  enabled: boolean;
  successRate: number;
}

const IntelligentAppointmentManager: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'schedule' | 'insights' | 'customers' | 'staff' | 'automation' | 'predictions'>('schedule');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedService, setSelectedService] = useState<string>('');
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
  const [aiOptimizationsEnabled, setAiOptimizationsEnabled] = useState(true);
  const [predictiveInsights, setPredictiveInsights] = useState(true);
  const [automationLevel, setAutomationLevel] = useState<'manual' | 'semi' | 'full'>('semi');

  // Data states
  const [schedules, setSchedules] = useState<IntelligentSchedule[]>([]);
  const [customerInsights, setCustomerInsights] = useState<CustomerInsight[]>([]);
  const [staffOptimizations, setStaffOptimizations] = useState<StaffOptimization[]>([]);
  const [predictiveWorkflows, setPredictiveWorkflows] = useState<PredictiveWorkflow[]>([]);
  const [schedulingAnalytics, setSchedulingAnalytics] = useState<SchedulingAnalytics | null>(null);
  const [optimizations, setOptimizations] = useState<OptimizationSuggestion[]>([]);
  const [upcomingPredictions, setUpcomingPredictions] = useState<SchedulingPrediction[]>([]);

  // Filters
  const [filterService, setFilterService] = useState('all');
  const [filterDemand, setFilterDemand] = useState<'all' | 'low' | 'medium' | 'high'>('all');

  // Real-time metrics
  const todayMetrics = useMemo(() => {
    const todaySchedules = schedules.filter(schedule =>
      new Date(schedule.date).toDateString() === new Date().toDateString()
    );

    return {
      totalSlots: todaySchedules.reduce((acc, s) => acc + s.timeSlots.length, 0),
      availableSlots: todaySchedules.reduce((acc, s) => acc + s.timeSlots.filter(t => t.available).length, 0),
      averageScore: todaySchedules.reduce((acc, s) => acc + s.utilizationRate, 0) / (todaySchedules.length || 1),
      predictedRevenue: todaySchedules.reduce((acc, s) => acc + s.predictedRevenue, 0),
      highRiskSlots: todaySchedules.reduce((acc, s) =>
        acc + s.timeSlots.filter(t => t.noShowRisk > 0.6).length, 0
      )
    };
  }, [schedules]);

  const efficiencyScore = useMemo(() => {
    if (!schedulingAnalytics) return 0;

    const {
      fillRate,
      noShowRate,
      cancellationRate
    } = schedulingAnalytics;

    const weightedScore = (
      fillRate * 0.4 +
      (100 - noShowRate) * 0.3 +
      (100 - cancellationRate) * 0.3
    );

    return Math.round(weightedScore);
  }, [schedulingAnalytics]);

  // Load data
  useEffect(() => {
    loadSchedulingData();
    loadCustomerInsights();
    loadStaffOptimizations();
    loadPredictiveWorkflows();
    loadSchedulingAnalytics();

    // Set up real-time updates
    const interval = setInterval(() => {
      if (aiOptimizationsEnabled) {
        loadSchedulingData();
      }
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [aiOptimizationsEnabled, selectedDate, selectedService]);

  const loadSchedulingData = useCallback(async () => {
    try {
      setLoading(true);

      if (selectedService) {
        // Get AI predictions for selected service and date range
        const startDate = selectedDate.toISOString();
        const endDate = new Date(selectedDate.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();

        const predictions = await schedulingAI.predictOptimalScheduling(
          selectedService,
          startDate,
          endDate
        );

        const intelligentSchedules: IntelligentSchedule[] = predictions.map(prediction => ({
          date: prediction.date,
          timeSlots: prediction.timeSlots.map(slot => ({
            time: slot.time,
            available: true, // Would be determined by actual availability
            score: slot.score,
            predictedDemand: slot.predictedDemand,
            noShowRisk: Math.random() * 0.8, // Simulated - would come from AI
            optimalPricing: slot.revenuePotential > 0.8 ? 350 : 280,
            recommendedFor: slot.predictedDemand === 'high' ? ['premium', 'loyal'] : ['new', 'casual'],
            aiInsights: [
              slot.predictedDemand === 'high' ? 'High demand expected' : 'Low demand expected',
              slot.reasoning
            ]
          })),
          overallDemand: prediction.overallDemand,
          aiOptimizations: prediction.recommendations.map(rec => ({
            type: rec.type,
            priority: rec.priority,
            description: rec.description,
            expectedImpact: rec.expectedImpact,
            implementation: {
              complexity: rec.expectedImpact.efficiency > 80 ? 'low' : 'medium',
              timeRequired: rec.type === 'pricing' ? '5 min' : '1 hour',
              resources: rec.type === 'staffing' ? ['manager'] : ['system']
            },
            automationLevel: rec.expectedImpact.efficiency > 90 ? 'fully-automated' : 'semi-automated'
          })),
          predictedRevenue: prediction.timeSlots.reduce((acc, slot) => acc + slot.revenuePotential * 100, 0),
          utilizationRate: prediction.confidence
        }));

        setSchedules(intelligentSchedules);
        setUpcomingPredictions(predictions);
      } else {
        // Load general availability data
        setSchedules([]);
      }
    } catch (error) {
      console.error('Error loading scheduling data:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedDate, selectedService]);

  const loadCustomerInsights = useCallback(async () => {
    try {
      // Fetch high-value customers with AI insights
      const { data: customers } = await supabase
        .from('profiles')
        .select('*')
        .gte('total_bookings', 5)
        .order('total_revenue', { ascending: false })
        .limit(10);

      if (customers) {
        const insights: CustomerInsight[] = customers.map(customer => ({
          customerId: customer.id,
          name: customer.full_name || 'Unknown',
          bookingPattern: {
            customerId: customer.id,
            preferredDays: [1, 2, 4, 5], // Would come from AI analysis
            preferredTimes: [10, 14, 16],
            bookingFrequency: customer.total_bookings || 0,
            averageAdvanceBooking: 7,
            seasonalPreferences: [1, 2, 3],
            cancellationHistory: {
              total: customer.cancellations || 0,
              reasons: ['schedule_conflict', 'emergency'],
              patterns: [24, 48]
            },
            noShowHistory: {
              total: customer.no_shows || 0,
              riskFactors: ['new_client', 'high_value', 'evening_booking']
            },
            packageBookings: customer.has_packages || false,
            loyaltyPoints: customer.loyalty_points || 0,
            timeSinceLastBooking: customer.last_booking_date ?
              Math.floor((Date.now() - new Date(customer.last_booking_date).getTime()) / (1000 * 60 * 60 * 24)) : 999
          },
          nextBestAppointment: {
            service: 'Premium Facial Treatment',
            timeSlot: '14:00',
            probability: 85,
            reasoning: 'Based on past bookings and availability'
          },
          churnRisk: 15,
          ltv: customer.total_revenue || 0,
          preferences: {
            services: ['facial', 'massage', 'pmu'],
            timeSlots: ['morning', 'afternoon'],
            communicationChannels: ['email', 'whatsapp']
          },
          lastInteraction: customer.last_booking_date || new Date().toISOString(),
          engagementScore: 78
        }));

        setCustomerInsights(insights);
      }
    } catch (error) {
      console.error('Error loading customer insights:', error);
    }
  }, []);

  const loadStaffOptimizations = useCallback(async () => {
    try {
      // Simulate staff optimization data
      const optimizations: StaffOptimization[] = [
        {
          staffId: 'staff-1',
          name: 'Anna Smith',
          efficiency: 92,
          specialties: ['Facial Treatments', 'PMU', 'Massage'],
          currentLoad: 75,
          optimalLoad: 85,
          recommendedSchedule: [
            {
              date: new Date().toISOString(),
              hours: [9, 10, 11, 14, 15, 16],
              reasoning: 'Peak efficiency hours with high demand'
            }
          ],
          burnoutRisk: 12
        }
      ];

      setStaffOptimizations(optimizations);
    } catch (error) {
      console.error('Error loading staff optimizations:', error);
    }
  }, []);

  const loadPredictiveWorkflows = useCallback(async () => {
    try {
      const workflows: PredictiveWorkflow[] = [
        {
          id: 'high-demand-optimization',
          name: 'High Demand Optimization',
          trigger: 'seasonal_demand',
          conditions: [
            { type: 'demand_level', operator: 'greater_than', value: 0.8 }
          ],
          actions: [
            { type: 'adjust_pricing', parameters: { adjustment: 0.15 } },
            { type: 'notify_staff', parameters: { message: 'High demand expected' } }
          ],
          enabled: true,
          successRate: 89
        },
        {
          id: 'customer-retention',
          name: 'Customer Retention Automation',
          trigger: 'customer_inactive',
          conditions: [
            { type: 'days_since_last_booking', operator: 'greater_than', value: 30 }
          ],
          actions: [
            { type: 'send_reminder', parameters: { template: 're-engagement' } },
            { type: 'create_promotion', parameters: { discount: 10 } }
          ],
          enabled: true,
          successRate: 76
        }
      ];

      setPredictiveWorkflows(workflows);
    } catch (error) {
      console.error('Error loading predictive workflows:', error);
    }
  }, []);

  const loadSchedulingAnalytics = useCallback(async () => {
    try {
      const analytics = await schedulingAI.getSchedulingAnalytics('month');
      setSchedulingAnalytics(analytics);
    } catch (error) {
      console.error('Error loading scheduling analytics:', error);
    }
  }, []);

  const implementOptimization = async (optimization: OptimizationSuggestion) => {
    try {
      // Implement the AI suggestion based on type
      switch (optimization.type) {
        case 'pricing':
          // Implement dynamic pricing
          await updatePricing(optimization);
          break;
        case 'capacity':
          // Adjust capacity allocations
          await adjustCapacity(optimization);
          break;
        case 'staffing':
          // Optimize staff scheduling
          await optimizeStaffing(optimization);
          break;
        case 'promotion':
          // Create targeted promotion
          await createPromotion(optimization);
          break;
      }

      // Refresh data
      await loadSchedulingData();
    } catch (error) {
      console.error('Error implementing optimization:', error);
    }
  };

  const updatePricing = async (optimization: OptimizationSuggestion) => {
    // Implementation logic for pricing optimization
    console.log('Implementing pricing optimization:', optimization);
  };

  const adjustCapacity = async (optimization: OptimizationSuggestion) => {
    // Implementation logic for capacity adjustment
    console.log('Implementing capacity adjustment:', optimization);
  };

  const optimizeStaffing = async (optimization: OptimizationSuggestion) => {
    // Implementation logic for staffing optimization
    console.log('Implementing staffing optimization:', optimization);
  };

  const createPromotion = async (optimization: OptimizationSuggestion) => {
    // Implementation logic for promotion creation
    console.log('Implementing promotion:', optimization);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Intelligent Appointment Management</h2>
          <p className="text-muted-foreground">AI-powered scheduling with predictive analytics and automated optimizations</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Switch
              checked={aiOptimizationsEnabled}
              onCheckedChange={setAiOptimizationsEnabled}
            />
            <Label>AI Optimizations</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={predictiveInsights}
              onCheckedChange={setPredictiveInsights}
            />
            <Label>Predictive Insights</Label>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadSchedulingData()}
            disabled={refreshing}
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", refreshing && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Real-time Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Utilization</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(todayMetrics.averageScore)}%</div>
            <p className="text-xs text-muted-foreground">
              {todayMetrics.availableSlots}/{todayMetrics.totalSlots} slots available
            </p>
            <Progress value={todayMetrics.averageScore} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Predicted Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">PLN {todayMetrics.predictedRevenue.toLocaleString()}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              +15% from yesterday
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">No-Show Risk</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayMetrics.highRiskSlots}</div>
            <p className="text-xs text-muted-foreground">
              High-risk time slots identified
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Efficiency Score</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{efficiencyScore}%</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TargetIcon className="h-3 w-3 mr-1 text-green-500" />
              AI Optimized
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="schedule" className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4" />
            Smart Schedule
          </TabsTrigger>
          <TabsTrigger value="insights" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            AI Insights
          </TabsTrigger>
          <TabsTrigger value="customers" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Customer Intelligence
          </TabsTrigger>
          <TabsTrigger value="staff" className="flex items-center gap-2">
            <UserCheck className="h-4 w-4" />
            Staff Optimization
          </TabsTrigger>
          <TabsTrigger value="automation" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Automation
          </TabsTrigger>
          <TabsTrigger value="predictions" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Predictions
          </TabsTrigger>
        </TabsList>

        {/* Smart Schedule Tab */}
        <TabsContent value="schedule" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Schedule Controls */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Schedule Controls
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Service</Label>
                  <Select value={selectedService} onValueChange={setSelectedService}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select service" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="luxury-facial">Luxury Facial</SelectItem>
                      <SelectItem value="pmu-brows">PMU Eyebrows</SelectItem>
                      <SelectItem value="personal-training">Personal Training</SelectItem>
                      <SelectItem value="group-fitness">Group Fitness</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Date Range</Label>
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                    className="rounded-md border"
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="ai-optimizations"
                      checked={aiOptimizationsEnabled}
                      onCheckedChange={setAiOptimizationsEnabled}
                    />
                    <Label htmlFor="ai-optimizations">Enable AI Optimizations</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="predictive-insights"
                      checked={predictiveInsights}
                      onCheckedChange={setPredictiveInsights}
                    />
                    <Label htmlFor="predictive-insights">Show Predictive Insights</Label>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Filter by Demand</Label>
                  <Select value={filterDemand} onValueChange={(value: any) => setFilterDemand(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Demand Levels</SelectItem>
                      <SelectItem value="high">High Demand Only</SelectItem>
                      <SelectItem value="medium">Medium Demand</SelectItem>
                      <SelectItem value="low">Low Demand</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* AI-Optimized Schedule */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>AI-Optimized Schedule</CardTitle>
                <CardDescription>
                  Smart scheduling powered by predictive analytics and machine learning
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px]">
                  <div className="space-y-4">
                    {schedules.map((schedule, dateIndex) => (
                      <Card key={dateIndex} className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h3 className="font-semibold">
                              {new Date(schedule.date).toLocaleDateString('en-US', {
                                weekday: 'long',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </h3>
                            <div className="flex items-center gap-2">
                              <Badge variant={
                                schedule.overallDemand === 'high' ? 'destructive' :
                                schedule.overallDemand === 'medium' ? 'default' : 'secondary'
                              }>
                                {schedule.overallDemand} demand
                              </Badge>
                              <Badge variant="outline">
                                {Math.round(schedule.utilizationRate)}% utilization
                              </Badge>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-muted-foreground">Predicted Revenue</div>
                            <div className="text-lg font-bold text-green-600">
                              PLN {schedule.predictedRevenue.toLocaleString()}
                            </div>
                          </div>
                        </div>

                        {/* Time Slots with AI Insights */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {schedule.timeSlots
                            .filter(slot =>
                              filterDemand === 'all' ||
                              (filterDemand === 'high' && slot.predictedDemand === 'high') ||
                              (filterDemand === 'medium' && slot.predictedDemand === 'medium') ||
                              (filterDemand === 'low' && slot.predictedDemand === 'low')
                            )
                            .map((slot, slotIndex) => (
                            <Card
                              key={slotIndex}
                              className={cn(
                                "p-3 cursor-pointer transition-all hover:shadow-md",
                                !slot.available && "opacity-50 cursor-not-allowed",
                                slot.score > 0.8 && "border-green-500 bg-green-50",
                                slot.noShowRisk > 0.6 && "border-red-500 bg-red-50"
                              )}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-medium">{slot.time}</span>
                                <div className="flex items-center gap-1">
                                  {slot.score > 0.8 && <Star className="h-3 w-3 text-yellow-500" />}
                                  {slot.noShowRisk > 0.6 && <AlertTriangle className="h-3 w-3 text-red-500" />}
                                </div>
                              </div>

                              <div className="space-y-1 text-xs">
                                <div className="flex justify-between">
                                  <span>AI Score:</span>
                                  <span className="font-medium">{Math.round(slot.score * 100)}%</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Demand:</span>
                                  <Badge variant="outline" className="text-xs">
                                    {slot.predictedDemand}
                                  </Badge>
                                </div>
                                {slot.optimalPricing && (
                                  <div className="flex justify-between">
                                    <span>Optimal Price:</span>
                                    <span className="font-medium">PLN {slot.optimalPricing}</span>
                                  </div>
                                )}
                                <div className="flex justify-between">
                                  <span>No-Show Risk:</span>
                                  <span className={cn(
                                    "font-medium",
                                    slot.noShowRisk > 0.6 ? "text-red-600" :
                                    slot.noShowRisk > 0.3 ? "text-yellow-600" : "text-green-600"
                                  )}>
                                    {Math.round(slot.noShowRisk * 100)}%
                                  </span>
                                </div>
                              </div>

                              {/* AI Insights */}
                              {slot.aiInsights.length > 0 && (
                                <div className="mt-2 pt-2 border-t">
                                  <div className="flex items-center gap-1 mb-1">
                                    <Brain className="h-3 w-3 text-blue-500" />
                                    <span className="text-xs font-medium">AI Insights</span>
                                  </div>
                                  <ul className="space-y-1">
                                    {slot.aiInsights.map((insight, i) => (
                                      <li key={i} className="text-xs text-muted-foreground">
                                        • {insight}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </Card>
                          ))}
                        </div>

                        {/* AI Optimizations */}
                        {schedule.aiOptimizations.length > 0 && (
                          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <Lightbulb className="h-4 w-4 text-blue-600" />
                              <span className="text-sm font-medium">AI Optimizations</span>
                            </div>
                            <div className="space-y-2">
                              {schedule.aiOptimizations.slice(0, 2).map((optimization, optIndex) => (
                                <div key={optIndex} className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <Badge variant={
                                        optimization.priority === 'urgent' ? 'destructive' :
                                        optimization.priority === 'high' ? 'default' : 'secondary'
                                      }>
                                        {optimization.priority}
                                      </Badge>
                                      <span className="text-sm font-medium">{optimization.type}</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground">{optimization.description}</p>
                                    <div className="flex items-center gap-3 mt-1 text-xs">
                                      <span>Impact: {optimization.expectedImpact.revenue}%</span>
                                      <span>Complexity: {optimization.implementation.complexity}</span>
                                    </div>
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => implementOptimization(optimization)}
                                  >
                                    Apply
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* AI Insights Tab */}
        <TabsContent value="insights" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-4 w-4" />
                  AI-Generated Optimizations
                </CardTitle>
                <CardDescription>
                  Personalized recommendations based on business data and patterns
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {upcomingPredictions.slice(0, 5).map((prediction, index) => (
                    <Card key={index} className="p-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline">{prediction.date}</Badge>
                            <Badge variant={prediction.overallDemand === 'high' ? 'destructive' : 'default'}>
                              {prediction.overallDemand} demand
                            </Badge>
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm">Confidence: {Math.round(prediction.confidence * 100)}%</p>
                            <div className="text-xs text-muted-foreground">
                              <strong>Factors:</strong> {prediction.factors.join(', ')}
                            </div>
                          </div>
                        </div>
                        <Button size="sm" variant="outline">
                          View Details
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance Analytics</CardTitle>
                <CardDescription>
                  AI-powered analysis of scheduling performance
                </CardDescription>
              </CardHeader>
              <CardContent>
                {schedulingAnalytics && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-2xl font-bold">{schedulingAnalytics.fillRate}%</div>
                        <div className="text-sm text-muted-foreground">Fill Rate</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold">{schedulingAnalytics.noShowRate}%</div>
                        <div className="text-sm text-muted-foreground">No-Show Rate</div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm font-medium">Revenue Optimization</div>
                      <div className="flex items-center gap-2">
                        <Progress value={85} className="flex-1" />
                        <span className="text-sm">+{schedulingAnalytics.revenueOptimization?.improvement || 0}%</span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Customer Intelligence Tab */}
        <TabsContent value="customers" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Customer Intelligence</CardTitle>
              <CardDescription>
                AI-driven insights for customer retention and personalization
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {customerInsights.map((customer, index) => (
                  <Card key={index} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold">{customer.name}</h4>
                          <Badge variant={
                            customer.churnRisk > 20 ? 'destructive' :
                            customer.churnRisk > 10 ? 'default' : 'secondary'
                          }>
                            {customer.churnRisk}% churn risk
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">LTV:</span>
                            <div className="font-medium">PLN {customer.ltv.toLocaleString()}</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Engagement:</span>
                            <div className="font-medium">{customer.engagementScore}%</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Bookings:</span>
                            <div className="font-medium">{customer.bookingPattern.bookingFrequency}/mo</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Last Visit:</span>
                            <div className="font-medium">
                              {customer.bookingPattern.timeSinceLastBooking === 999 ? 'Never' :
                               `${customer.bookingPattern.timeSinceLastBooking} days ago`}
                            </div>
                          </div>
                        </div>

                        <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950/20 rounded">
                          <div className="flex items-center gap-2 mb-1">
                            <Lightbulb className="h-3 w-3 text-blue-600" />
                            <span className="text-sm font-medium">Next Best Appointment</span>
                          </div>
                          <div className="text-sm">
                            <strong>{customer.nextBestAppointment.service}</strong> at {customer.nextBestAppointment.timeSlot}
                            <div className="text-xs text-muted-foreground mt-1">
                              {customer.nextBestAppointment.reasoning}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          <MessageSquare className="h-3 w-3 mr-1" />
                          Contact
                        </Button>
                        <Button size="sm">
                          <CalendarIcon className="h-3 w-3 mr-1" />
                          Schedule
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Staff Optimization Tab */}
        <TabsContent value="staff" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Staff Optimization</CardTitle>
              <CardDescription>
                AI-powered scheduling and workload optimization for your team
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {staffOptimizations.map((staff, index) => (
                  <Card key={index} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold">{staff.name}</h4>
                          <Badge variant={
                            staff.burnoutRisk > 30 ? 'destructive' :
                            staff.burnoutRisk > 15 ? 'default' : 'secondary'
                          }>
                            {staff.burnoutRisk}% burnout risk
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Efficiency:</span>
                            <div className="font-medium">{staff.efficiency}%</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Current Load:</span>
                            <div className="font-medium">{staff.currentLoad}%</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Optimal Load:</span>
                            <div className="font-medium">{staff.optimalLoad}%</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Specialties:</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {staff.specialties.map((specialty, sidx) => (
                                <Badge key={sidx} variant="outline" className="text-xs">
                                  {specialty}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="mt-3">
                          <div className="text-sm font-medium mb-2">Recommended Schedule</div>
                          <div className="text-xs text-muted-foreground">
                            {staff.recommendedSchedule[0].reasoning}
                          </div>
                        </div>
                      </div>
                      <Button size="sm" variant="outline">
                        <Settings className="h-3 w-3 mr-1" />
                        Optimize
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Automation Tab */}
        <TabsContent value="automation" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Predictive Automation Workflows</CardTitle>
              <CardDescription>
                AI-powered automation for scheduling and customer management
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {predictiveWorkflows.map((workflow, index) => (
                  <Card key={index} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold">{workflow.name}</h4>
                          <div className="flex items-center gap-1">
                            <Switch
                              checked={workflow.enabled}
                              className="scale-75"
                            />
                            <Badge variant={workflow.successRate > 80 ? 'default' : 'secondary'}>
                              {workflow.successRate}% success
                            </Badge>
                          </div>
                        </div>

                        <div className="space-y-2 text-sm">
                          <div>
                            <span className="text-muted-foreground">Trigger:</span>
                            <span className="ml-1">{workflow.trigger}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Actions:</span>
                            <div className="mt-1 space-y-1">
                              {workflow.actions.map((action, aidx) => (
                                <div key={aidx} className="flex items-center gap-2 text-xs">
                                  <ChevronRight className="h-3 w-3" />
                                  <span>{action.type}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                      <Button size="sm" variant="outline">
                        <Settings className="h-3 w-3 mr-1" />
                        Configure
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Predictions Tab */}
        <TabsContent value="predictions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Future Predictions</CardTitle>
              <CardDescription>
                AI-powered forecasts for demand, revenue, and resource needs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {upcomingPredictions.slice(0, 10).map((prediction, index) => (
                  <Card key={index} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold">
                            {new Date(prediction.date).toLocaleDateString()}
                          </h4>
                          <Badge variant={
                            prediction.overallDemand === 'high' ? 'destructive' :
                            prediction.overallDemand === 'medium' ? 'default' : 'secondary'
                          }>
                            {prediction.overallDemand} demand
                          </Badge>
                          <Badge variant="outline">
                            {Math.round(prediction.confidence * 100)}% confidence
                          </Badge>
                        </div>

                        <div className="space-y-2 text-sm">
                          <div>
                            <span className="text-muted-foreground">Key Factors:</span>
                            <div className="mt-1 space-y-1">
                              {prediction.factors.map((factor, fidx) => (
                                <div key={fidx} className="flex items-center gap-2 text-xs">
                                  <Target className="h-3 w-3" />
                                  <span>{factor}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {prediction.recommendations.length > 0 && (
                            <div>
                              <span className="text-muted-foreground">Top Recommendations:</span>
                              <div className="mt-1 space-y-1">
                                {prediction.recommendations.slice(0, 3).map((rec, ridx) => (
                                  <div key={ridx} className="p-2 bg-muted/50 rounded text-xs">
                                    <div className="flex items-center gap-2 mb-1">
                                      <Badge variant={rec.priority === 'urgent' ? 'destructive' : 'secondary'} className="text-xs">
                                        {rec.priority}
                                      </Badge>
                                      <span className="font-medium">{rec.type}</span>
                                    </div>
                                    <p>{rec.description}</p>
                                    <div className="flex items-center gap-3 mt-1">
                                      <span>Impact: {rec.expectedImpact.revenue}%</span>
                                      <span>Effort: {rec.expectedImpact.efficiency}%</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      <Button size="sm" variant="outline">
                        <Eye className="h-3 w-3 mr-1" />
                        Analyze
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default IntelligentAppointmentManager;