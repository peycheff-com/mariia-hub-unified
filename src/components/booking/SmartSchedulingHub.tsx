import React, { useState, useEffect } from 'react';
import {
  Clock,
  Calendar,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Lightbulb,
  Target,
  Bell,
  MessageSquare,
  ChevronRight,
  Info,
  Zap,
  Shield,
  DollarSign,
  Users,
  BarChart3,
  Settings
} from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  SchedulingPrediction,
  SchedulingRecommendation,
  NoShowPrediction,
  SmartReminderConfig,
  SchedulingAnalytics,
  BookingPattern,
  ServicePattern
, schedulingAI } from '@/services/schedulingAI';
import { predictNoShowRisk, trainNoShowModel } from '@/services/noShowPrediction';
import { generateSmartReminders, getReminderAnalytics } from '@/services/smartReminderSystem';
import { useToast } from '@/hooks/use-toast';

interface SmartSchedulingHubProps {
  serviceId?: string;
  bookingId?: string;
  customerId?: string;
  viewMode?: 'admin' | 'provider' | 'customer';
  className?: string;
}

export const SmartSchedulingHub: React.FC<SmartSchedulingHubProps> = ({
  serviceId,
  bookingId,
  customerId,
  viewMode = 'admin',
  className
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [predictions, setPredictions] = useState<SchedulingPrediction[]>([]);
  const [recommendations, setRecommendations] = useState<SchedulingRecommendation[]>([]);
  const [noShowRisk, setNoShowRisk] = useState<NoShowPrediction | null>(null);
  const [reminderConfig, setReminderConfig] = useState<SmartReminderConfig | null>(null);
  const [analytics, setAnalytics] = useState<SchedulingAnalytics | null>(null);
  const [bookingPattern, setBookingPattern] = useState<BookingPattern | null>(null);
  const [servicePattern, setServicePattern] = useState<ServicePattern | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'quarter'>('week');
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  const { toast } = useToast();

  useEffect(() => {
    loadAllData();
  }, [serviceId, bookingId, customerId, selectedDate, selectedPeriod]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const promises = [];

      if (serviceId) {
        promises.push(loadPredictions());
        promises.push(loadServicePattern());
      }

      if (bookingId) {
        promises.push(loadNoShowPrediction());
        promises.push(loadReminderConfig());
      }

      if (customerId) {
        promises.push(loadRecommendations());
        promises.push(loadBookingPattern());
      }

      promises.push(loadAnalytics());

      await Promise.all(promises);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load scheduling data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadPredictions = async () => {
    if (!serviceId) return;

    try {
      const endDate = new Date(selectedDate);
      endDate.setDate(endDate.getDate() + 7);

      const data = await schedulingAI.predictOptimalScheduling(
        serviceId,
        selectedDate,
        endDate.toISOString().split('T')[0]
      );
      setPredictions(data);
    } catch (error) {
      console.error('Error loading predictions:', error);
    }
  };

  const loadServicePattern = async () => {
    if (!serviceId) return;

    try {
      const data = await schedulingAI.analyzeServicePatterns(serviceId);
      setServicePattern(data);
    } catch (error) {
      console.error('Error loading service pattern:', error);
    }
  };

  const loadBookingPattern = async () => {
    if (!customerId) return;

    try {
      const data = await schedulingAI.analyzeBookingPatterns(customerId);
      setBookingPattern(data);
    } catch (error) {
      console.error('Error loading booking pattern:', error);
    }
  };

  const loadRecommendations = async () => {
    if (!customerId) return;

    try {
      const data = await schedulingAI.getPersonalizedRecommendations(customerId, serviceId ? [serviceId] : undefined);
      setRecommendations(data);
    } catch (error) {
      console.error('Error loading recommendations:', error);
    }
  };

  const loadNoShowPrediction = async () => {
    if (!bookingId) return;

    try {
      const data = await predictNoShowRisk(bookingId);
      setNoShowRisk(data);
    } catch (error) {
      console.error('Error loading no-show prediction:', error);
    }
  };

  const loadReminderConfig = async () => {
    if (!bookingId) return;

    try {
      const data = await generateSmartReminders(bookingId, noShowRisk!);
      setReminderConfig(data);
    } catch (error) {
      console.error('Error loading reminder config:', error);
    }
  };

  const loadAnalytics = async () => {
    try {
      const data = await schedulingAI.getSchedulingAnalytics(selectedPeriod);
      setAnalytics(data);
    } catch (error) {
      console.error('Error loading analytics:', error);
    }
  };

  const handleTrainModel = async () => {
    setLoading(true);
    try {
      await trainNoShowModel();
      toast({
        title: 'Success',
        description: 'No-show prediction model has been retrained',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to train model',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApplyRecommendation = async (rec: SchedulingRecommendation) => {
    try {
      // Apply recommendation based on type
      switch (rec.action.type) {
        case 'price_adjustment':
          // Implement price adjustment
          break;
        case 'promotion':
          // Create promotion
          break;
        case 'resource_allocation':
          // Adjust resources
          break;
        default:
          console.log('Unknown recommendation type:', rec.action.type);
      }

      toast({
        title: 'Applied',
        description: `${rec.title} has been applied`,
      });

      // Reload data
      loadAllData();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to apply recommendation',
        variant: 'destructive'
      });
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'high': return <Target className="h-4 w-4 text-orange-500" />;
      case 'medium': return <Lightbulb className="h-4 w-4 text-yellow-500" />;
      case 'low': return <Info className="h-4 w-4 text-blue-500" />;
      default: return <Info className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatTime = (time: string) => {
    return new Date(time).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Smart Scheduling Hub</h1>
          <p className="text-muted-foreground">
            AI-powered scheduling optimization and insights
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadAllData}>
            Refresh
          </Button>
          {viewMode === 'admin' && (
            <Button onClick={handleTrainModel} disabled={loading}>
              <Zap className="h-4 w-4 mr-2" />
              Retrain AI
            </Button>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="predictions" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Predictions
          </TabsTrigger>
          <TabsTrigger value="recommendations" className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4" />
            Insights
          </TabsTrigger>
          <TabsTrigger value="risk" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Risk Analysis
          </TabsTrigger>
          <TabsTrigger value="reminders" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Reminders
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Today's Bookings</p>
                    <p className="text-2xl font-bold">{analytics?.totalBookings || 0}</p>
                  </div>
                  <Calendar className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">No-Show Rate</p>
                    <p className="text-2xl font-bold text-red-600">
                      {Math.round((analytics?.noShowRate || 0) * 100)}%
                    </p>
                  </div>
                  <XCircle className="h-8 w-8 text-red-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Fill Rate</p>
                    <p className="text-2xl font-bold text-green-600">
                      {Math.round((analytics?.fillRate || 0) * 100)}%
                    </p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Avg Revenue</p>
                    <p className="text-2xl font-bold">
                      ${Math.round(analytics?.averageRevenuePerBooking || 0)}
                    </p>
                  </div>
                  <DollarSign className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Insights */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">AI Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recommendations.slice(0, 3).map((rec, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-3">
                        {getPriorityIcon(rec.priority)}
                        <div>
                          <p className="font-medium text-sm">{rec.title}</p>
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {rec.description}
                          </p>
                        </div>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => handleApplyRecommendation(rec)}>
                        Apply
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Upcoming Predictions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {predictions.slice(0, 3).map((prediction, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div>
                        <p className="font-medium text-sm">{formatDate(prediction.date)}</p>
                        <p className="text-xs text-muted-foreground">
                          {prediction.overallDemand} demand • {Math.round(prediction.confidence * 100)}% confidence
                        </p>
                      </div>
                      <Badge variant={prediction.overallDemand === 'high' ? 'destructive' : 'secondary'}>
                        {prediction.overallDemand}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Predictions Tab */}
        <TabsContent value="predictions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                AI Scheduling Predictions
              </CardTitle>
              <CardDescription>
                Optimal time slots based on historical patterns and demand prediction
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {predictions.map((prediction, index) => (
                  <Card key={index} className="border-l-4 border-l-blue-500">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">
                          {formatDate(prediction.date)}
                        </CardTitle>
                        <div className="flex items-center gap-2">
                          <Badge variant={
                            prediction.overallDemand === 'high' ? 'destructive' :
                            prediction.overallDemand === 'medium' ? 'default' : 'secondary'
                          }>
                            {prediction.overallDemand} demand
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {Math.round(prediction.confidence * 100)}% confidence
                          </span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {prediction.timeSlots.slice(0, 6).map((slot, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent transition-colors cursor-pointer"
                          >
                            <div>
                              <p className="font-medium">{slot.time}</p>
                              <p className="text-sm text-muted-foreground capitalize">
                                {slot.predictedDemand} demand
                              </p>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-medium">
                                {Math.round(slot.fillProbability * 100)}%
                              </div>
                              <Progress
                                value={slot.score * 100}
                                className="w-20 h-2 mt-1"
                              />
                            </div>
                          </div>
                        ))}
                      </div>

                      {prediction.factors.length > 0 && (
                        <div className="mt-4">
                          <p className="text-sm font-medium mb-2">Influencing factors:</p>
                          <div className="flex flex-wrap gap-2">
                            {prediction.factors.map((factor, idx) => (
                              <Badge key={idx} variant="outline">
                                {factor}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Recommendations Tab */}
        <TabsContent value="recommendations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                AI Recommendations
              </CardTitle>
              <CardDescription>
                Personalized insights to optimize scheduling and revenue
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recommendations.map((rec, index) => (
                  <Card key={index} className="border-l-4 border-l-purple-500">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {getPriorityIcon(rec.priority)}
                            <h3 className="font-semibold">{rec.title}</h3>
                            <Badge variant="outline" className="capitalize">
                              {rec.type.replace('_', ' ')}
                            </Badge>
                            <Badge variant="secondary">
                              {Math.round(rec.confidence * 100)}% confidence
                            </Badge>
                          </div>
                          <p className="text-muted-foreground mb-4">
                            {rec.description}
                          </p>

                          <div className="grid gap-3 md:grid-cols-3">
                            <div className="flex items-center gap-2">
                              <DollarSign className="h-4 w-4 text-green-500" />
                              <span className="text-sm">
                                +{rec.expectedImpact.revenue}% revenue
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <TrendingUp className="h-4 w-4 text-blue-500" />
                              <span className="text-sm">
                                +{rec.expectedImpact.efficiency}% efficiency
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-purple-500" />
                              <span className="text-sm">
                                +{rec.expectedImpact.satisfaction}% satisfaction
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="ml-4">
                          <Button onClick={() => handleApplyRecommendation(rec)}>
                            Apply <ChevronRight className="h-4 w-4 ml-1" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Risk Analysis Tab */}
        <TabsContent value="risk" className="space-y-4">
          {noShowRisk ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  No-Show Risk Analysis
                </CardTitle>
                <CardDescription>
                  AI-powered prediction and mitigation strategies
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Risk Score */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Risk Level</p>
                    <p className="text-2xl font-bold">
                      {Math.round(noShowRisk.riskScore * 100)}%
                    </p>
                  </div>
                  <Badge className={`text-lg px-4 py-2 ${getRiskColor(noShowRisk.riskLevel)}`}>
                    {noShowRisk.riskLevel.toUpperCase()}
                  </Badge>
                </div>

                <Progress value={noShowRisk.riskScore * 100} className="h-3" />

                {/* Risk Factors */}
                <div>
                  <h4 className="font-medium mb-3">Key Risk Factors</h4>
                  <div className="space-y-2">
                    {noShowRisk.factors.map((factor, index) => (
                      <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-orange-400" />
                          <span className="text-sm">{factor.factor}</span>
                        </div>
                        <Badge variant="secondary">
                          {Math.round(factor.weight * 100)}%
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Deposit Recommendation */}
                {noShowRisk.depositRecommendation.required && (
                  <Alert>
                    <DollarSign className="h-4 w-4" />
                    <AlertTitle>Deposit Required</AlertTitle>
                    <AlertDescription>
                      {noShowRisk.depositRecommendation.reasoning}
                      {noShowRisk.depositRecommendation.amount && (
                        <p className="mt-2 font-semibold">
                          Recommended deposit: {noShowRisk.depositRecommendation.amount}%
                        </p>
                      )}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Recommended Actions */}
                <div>
                  <h4 className="font-medium mb-3">Recommended Actions</h4>
                  <div className="grid gap-3 md:grid-cols-2">
                    {noShowRisk.recommendedActions.map((action, index) => (
                      <Card key={index}>
                        <CardContent className="pt-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">{action.action}</span>
                            <Badge variant="outline">
                              {Math.round(action.effectiveness * 100)}% effective
                            </Badge>
                          </div>
                          {action.cost && (
                            <p className="text-xs text-muted-foreground">
                              Cost: {action.cost}
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center text-muted-foreground">
                  <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No booking selected for risk analysis</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Reminders Tab */}
        <TabsContent value="reminders" className="space-y-4">
          {reminderConfig ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Smart Reminder Strategy
                </CardTitle>
                <CardDescription>
                  Optimized reminder schedule to maximize attendance
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Reminder Schedule */}
                <div>
                  <h4 className="font-medium mb-3">Reminder Schedule</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50 border border-blue-200">
                      <div className="flex items-center gap-3">
                        <MessageSquare className="h-4 w-4 text-blue-600" />
                        <div>
                          <p className="font-medium">First Reminder</p>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(reminderConfig.optimalTiming.firstReminder)}
                          </p>
                        </div>
                      </div>
                      <Badge>Confirmation</Badge>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg bg-orange-50 border border-orange-200">
                      <div className="flex items-center gap-3">
                        <Bell className="h-4 w-4 text-orange-600" />
                        <div>
                          <p className="font-medium">Final Reminder</p>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(reminderConfig.optimalTiming.finalReminder)}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline">Urgent</Badge>
                    </div>

                    {reminderConfig.optimalTiming.additionalReminders?.map((reminder, index) => (
                      <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-3">
                          <Clock className="h-4 w-4" />
                          <div>
                            <p className="font-medium">Additional Reminder</p>
                            <p className="text-sm text-muted-foreground">
                              {formatDate(reminder)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Communication Channels */}
                <div>
                  <h4 className="font-medium mb-3">Communication Channels</h4>
                  <div className="flex flex-wrap gap-2">
                    {reminderConfig.channels.map((channel, index) => (
                      <Badge key={index} variant="secondary" className="capitalize">
                        {channel}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Effectiveness Metrics */}
                <div>
                  <h4 className="font-medium mb-3">Predicted Effectiveness</h4>
                  <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                      <CardContent className="pt-4">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-green-600">
                            {Math.round(reminderConfig.effectiveness.predictedOpenRate * 100)}%
                          </p>
                          <p className="text-sm text-muted-foreground">Open Rate</p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="pt-4">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-blue-600">
                            {Math.round(reminderConfig.effectiveness.predictedConfirmationRate * 100)}%
                          </p>
                          <p className="text-sm text-muted-foreground">Confirmation Rate</p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="pt-4">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-purple-600">
                            -{Math.round(reminderConfig.effectiveness.reducedNoShowProbability * 100)}%
                          </p>
                          <p className="text-sm text-muted-foreground">No-Show Reduction</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center text-muted-foreground">
                  <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No booking selected for reminder configuration</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Scheduling Analytics</h3>
              <p className="text-sm text-muted-foreground">
                Performance metrics and insights
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant={selectedPeriod === 'week' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedPeriod('week')}
              >
                Week
              </Button>
              <Button
                variant={selectedPeriod === 'month' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedPeriod('month')}
              >
                Month
              </Button>
              <Button
                variant={selectedPeriod === 'quarter' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedPeriod('quarter')}
              >
                Quarter
              </Button>
            </div>
          </div>

          {analytics && (
            <>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Total Bookings</p>
                        <p className="text-2xl font-bold">{analytics.totalBookings}</p>
                      </div>
                      <Calendar className="h-8 w-8 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">No-Show Rate</p>
                        <p className="text-2xl font-bold text-red-600">
                          {Math.round(analytics.noShowRate * 100)}%
                        </p>
                      </div>
                      <XCircle className="h-8 w-8 text-red-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Fill Rate</p>
                        <p className="text-2xl font-bold text-green-600">
                          {Math.round(analytics.fillRate * 100)}%
                        </p>
                      </div>
                      <CheckCircle className="h-8 w-8 text-green-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Avg Revenue</p>
                        <p className="text-2xl font-bold">
                          ${analytics.averageRevenuePerBooking.toFixed(0)}
                        </p>
                      </div>
                      <DollarSign className="h-8 w-8 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Service Performance */}
              <Card>
                <CardHeader>
                  <CardTitle>Service Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analytics.servicePerformance.map((service, index) => (
                      <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                        <div>
                          <p className="font-medium">{service.serviceName}</p>
                          <p className="text-sm text-muted-foreground">
                            {service.bookings} bookings • ${service.revenue} revenue
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge variant={service.rating >= 4.5 ? 'default' : 'secondary'}>
                            {service.rating.toFixed(1)} ⭐
                          </Badge>
                          <p className="text-xs text-muted-foreground mt-1">
                            {Math.round(service.noShowRate * 100)}% no-show
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Prediction Accuracy */}
              <Card>
                <CardHeader>
                  <CardTitle>AI Model Accuracy</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600">
                        {Math.round(analytics.predictionsAccuracy.demand * 100)}%
                      </p>
                      <p className="text-sm text-muted-foreground">Demand Prediction</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">
                        {Math.round(analytics.predictionsAccuracy.noShow * 100)}%
                      </p>
                      <p className="text-sm text-muted-foreground">No-Show Prediction</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-purple-600">
                        {Math.round(analytics.predictionsAccuracy.cancellations * 100)}%
                      </p>
                      <p className="text-sm text-muted-foreground">Cancellation Prediction</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SmartSchedulingHub;