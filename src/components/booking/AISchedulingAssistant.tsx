import React, { useState, useEffect, useCallback } from 'react';
import { AlertCircle, Loader2, Clock, TrendingUp, Calendar, Lightbulb, Users, DollarSign, MapPin, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSchedulingInsights, useDemandPrediction, useSchedulingRecommendations } from '@/hooks/useSmartScheduling';
import { getEnhancedAIService, SchedulingConstraints, TimeSlot } from '@/integrations/ai/core/AIService';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

import type { SchedulingInsightRequest } from '@/integrations/ai/service';


interface AISchedulingAssistantProps {
  serviceType: string;
  serviceDuration: number;
  serviceId?: string;
  providerId?: string;
  location?: string;
  price?: number;
  onTimeSlotSelect?: (timeSlot: { date: string; time: string; score?: number }) => void;
  onRescheduleSuggestion?: (suggestion: { currentSlot: { date: string; time: string }, suggestedSlot: { date: string; time: string }, reason: string }) => void;
}

export function AISchedulingAssistant({
  serviceType,
  serviceDuration,
  serviceId,
  providerId,
  location = 'Warsaw, Poland',
  price,
  onTimeSlotSelect,
  onRescheduleSuggestion,
}: AISchedulingAssistantProps) {
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [insights, setInsights] = useState<any>(null);
  const [demandData, setDemandData] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<any>(null);
  const [optimizedSlots, setOptimizedSlots] = useState<TimeSlot[]>([]);
  const [rescheduleSuggestions, setRescheduleSuggestions] = useState<any[]>([]);
  const [isLoadingOptimization, setIsLoadingOptimization] = useState(false);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);

  const { getInsights, isGenerating: isLoadingInsights, error: insightsError } = useSchedulingInsights();
  const { getPredictions, isPredicting: isLoadingDemand, error: demandError } = useDemandPrediction();
  const { getRecommendations, isLoading: isLoadingRecommendations, error: recommendationsError } = useSchedulingRecommendations();

  useEffect(() => {
    if (serviceType && serviceDuration) {
      loadSchedulingData();
    }
  }, [serviceType, serviceDuration]);

  const loadSchedulingData = async () => {
    try {
      // Get scheduling insights
      const insightsRequest: SchedulingInsightRequest = {
        serviceType,
        serviceDuration,
        preferredDays: ['weekdays'],
        preferredTimes: ['morning', 'afternoon'],
        location,
      };

      const insightsData = await getInsights(insightsRequest);
      setInsights(insightsData);

      // Get demand prediction for next 7 days
      if (serviceId) {
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + 7);
        const demand = await getPredictions(
          serviceId,
          new Date().toISOString().split('T')[0],
          endDate.toISOString().split('T')[0]
        );
        setDemandData(demand);
      }

      // Get recommendations
      if (serviceId) {
        const recs = await getRecommendations([serviceId], 'week');
        setRecommendations(recs);
      }

      // Load AI-optimized scheduling if provider is specified
      if (providerId) {
        await loadOptimizedSchedule();
      }
    } catch (error) {
      console.error('Failed to load scheduling data:', error);
    }
  };

  const loadOptimizedSchedule = useCallback(async () => {
    if (!providerId) return;

    setIsLoadingOptimization(true);
    try {
      const aiService = getEnhancedAIService();

      // Get local events (Warsaw-specific)
      const localEvents = await getLocalEvents();

      const constraints: SchedulingConstraints = {
        providerId,
        serviceDuration,
        preferredDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        preferredTimes: ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'],
        location,
        bufferTime: 15,
        prepTime: serviceType.includes('preparation') ? 30 : 15,
        maxBookingsPerDay: 8,
        localEvents,
      };

      const optimized = await aiService.optimizeSchedule(providerId, constraints);
      setOptimizedSlots(optimized);

      // Generate reschedule suggestions if we have existing bookings
      generateRescheduleSuggestions(optimized);
    } catch (error) {
      console.error('Failed to load optimized schedule:', error);
    } finally {
      setIsLoadingOptimization(false);
    }
  }, [providerId, serviceDuration, serviceType, location]);

  const getLocalEvents = async () => {
    // Mock Warsaw events data - in production, this would fetch from an API
    const today = new Date();
    const events = [];

    // Check for holidays, weekends, and special events
    const isWeekend = today.getDay() === 0 || today.getDay() === 6;
    if (isWeekend) {
      events.push({ date: today.toISOString().split('T')[0], impact: 'high' as const });
    }

    // Add mock seasonal events
    const month = today.getMonth() + 1;
    if (month === 12 || month === 1) {
      // Holiday season
      for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() + i);
        events.push({
          date: date.toISOString().split('T')[0],
          impact: 'medium' as const
        });
      }
    }

    return events;
  };

  const generateRescheduleSuggestions = (optimizedSlots: TimeSlot[]) => {
    if (!optimizedSlots.length) return;

    const suggestions = [];

    // Find gaps and optimization opportunities
    for (let i = 1; i < optimizedSlots.length; i++) {
      const prev = optimizedSlots[i - 1];
      const curr = optimizedSlots[i];

      // If there's a big gap with low demand before and high demand after
      if (prev.predictedDemand === 'low' && curr.predictedDemand === 'high') {
        suggestions.push({
          currentSlot: { date: prev.date, time: prev.time },
          suggestedSlot: { date: curr.date, time: curr.time },
          reason: `Move to higher demand slot for ${curr.reasoning}`,
          potentialGain: curr.revenuePotential ? (curr.revenuePotential - (prev.revenuePotential || 0)) : 0,
        });
      }
    }

    setRescheduleSuggestions(suggestions.slice(0, 3)); // Top 3 suggestions
  };

  const handleOptimalTimeClick = (optimalTime: any) => {
    if (onTimeSlotSelect) {
      onTimeSlotSelect({
        date: optimalTime.date,
        time: optimalTime.time,
        score: optimalTime.score,
      });
    }
  };

  const handleRescheduleSuggestion = (suggestion: any) => {
    if (onRescheduleSuggestion) {
      onRescheduleSuggestion({
        currentSlot: suggestion.currentSlot,
        suggestedSlot: suggestion.suggestedSlot,
        reason: suggestion.reason,
      });
    }
  };

  const getDemandColor = (level: string) => {
    switch (level) {
      case 'high':
        return 'text-red-600 bg-red-50';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50';
      case 'low':
        return 'text-green-600 bg-green-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600';
    if (score >= 0.6) return 'text-yellow-600';
    return 'text-gray-600';
  };

  const isLoading = isLoadingInsights || isLoadingDemand || isLoadingRecommendations || isLoadingOptimization;
  const hasError = insightsError || demandError || recommendationsError;

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5" />
                  AI Scheduling Assistant
                  {optimizedSlots.length > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      <Star className="h-3 w-3 mr-1" />
                      AI Optimized
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  Smart scheduling recommendations based on demand patterns, local events, and preferences
                  {location && (
                    <span className="flex items-center gap-1 mt-1 text-xs">
                      <MapPin className="h-3 w-3" />
                      {location}
                    </span>
                  )}
                </CardDescription>
              </div>
              {providerId && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                >
                  {showAdvancedOptions ? 'Hide' : 'Show'} Advanced
                </Button>
              )}
            </div>
          </CardHeader>
        <CardContent>
          {hasError && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {insightsError?.message || demandError?.message || recommendationsError?.message ||
                  'Failed to load AI scheduling data'}
              </AlertDescription>
            </Alert>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2">Analyzing scheduling patterns...</span>
            </div>
          ) : (
            <Tabs defaultValue="insights" className="w-full">
              <TabsList className={`grid w-full ${showAdvancedOptions ? 'grid-cols-5' : 'grid-cols-4'}`}>
                <TabsTrigger value="insights">Insights</TabsTrigger>
                <TabsTrigger value="optimal">Optimal Times</TabsTrigger>
                <TabsTrigger value="demand">Demand</TabsTrigger>
                {showAdvancedOptions && (
                  <TabsTrigger value="ai-optimization">AI Optimization</TabsTrigger>
                )}
                <TabsTrigger value="recommendations">Tips</TabsTrigger>
              </TabsList>

              <TabsContent value="insights" className="space-y-4">
                {insights && (
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Demand Level</h4>
                      <div className="flex items-center gap-2">
                        <Badge className={getDemandColor(insights.predictions.demandLevel)}>
                          {insights.predictions.demandLevel.toUpperCase()}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          Expected demand for this service
                        </span>
                      </div>
                    </div>

                    {insights.predictions.suggestedPriceAdjustment && (
                      <div>
                        <h4 className="font-medium mb-2">Price Optimization</h4>
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4" />
                          <span className="text-sm">
                            Consider adjusting price by{' '}
                            <span className="font-medium">
                              {insights.predictions.suggestedPriceAdjustment > 0 ? '+' : ''}
                              {insights.predictions.suggestedPriceAdjustment}%
                            </span>
                          </span>
                        </div>
                      </div>
                    )}

                    <div>
                      <h4 className="font-medium mb-2">Scheduling Efficiency</h4>
                      <p className="text-sm text-muted-foreground">
                        Optimal gap between appointments: {insights.predictions.optimalGapTime} minutes
                      </p>
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="optimal" className="space-y-4">
                {insights?.optimalTimes && insights.optimalTimes.length > 0 ? (
                  <div className="space-y-3">
                    <h4 className="font-medium">Recommended Time Slots</h4>
                    {insights.optimalTimes.map((optimal: any, index: number) => (
                      <Card key={index} className="cursor-pointer hover:bg-accent/50 transition-colors">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                <span className="font-medium">{optimal.date}</span>
                                <Clock className="h-4 w-4 ml-2" />
                                <span>{optimal.time}</span>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {optimal.reasoning}
                              </p>
                            </div>
                            <div className="text-right">
                              <div className={`text-sm font-medium ${getScoreColor(optimal.score)}`}>
                                {Math.round(optimal.score * 100)}% match
                              </div>
                              <Progress value={optimal.score * 100} className="w-20 mt-1" />
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-3 w-full"
                            onClick={() => handleOptimalTimeClick(optimal)}
                          >
                            Select This Time
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No optimal time slots available at the moment
                  </p>
                )}
              </TabsContent>

              <TabsContent value="demand" className="space-y-4">
                {demandData && demandData.length > 0 ? (
                  <div className="space-y-3">
                    <h4 className="font-medium">7-Day Demand Forecast</h4>
                    {demandData.map((demand: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <div className="font-medium">{demand.date}</div>
                          <div className="text-sm text-muted-foreground">
                            Expected bookings: {demand.predictedBookings}
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge className={getDemandColor(demand.demandLevel)}>
                            {demand.demandLevel}
                          </Badge>
                          <div className="text-xs text-muted-foreground mt-1">
                            {Math.round(demand.confidence * 100)}% confidence
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Demand data not available
                  </p>
                )}
              </TabsContent>

              {showAdvancedOptions && (
                <TabsContent value="ai-optimization" className="space-y-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">AI-Optimized Schedule</h4>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={loadOptimizedSchedule}
                        disabled={isLoadingOptimization}
                      >
                        {isLoadingOptimization ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          'Refresh'
                        )}
                      </Button>
                    </div>

                    {/* AI-Optimized Time Slots */}
                    {optimizedSlots.length > 0 && (
                      <div className="space-y-3">
                        <p className="text-sm text-muted-foreground">
                          AI has analyzed patterns, local events, and demand to find optimal slots:
                        </p>
                        {optimizedSlots.slice(0, 5).map((slot, index) => (
                          <motion.div
                            key={`${slot.date}-${slot.time}`}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                          >
                            <Card className="cursor-pointer hover:shadow-md transition-all duration-200 border-l-4 border-l-blue-500">
                              <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                      <Calendar className="h-4 w-4" />
                                      <span className="font-medium">{slot.date}</span>
                                      <Clock className="h-4 w-4 ml-2" />
                                      <span>{slot.time}</span>
                                      <Badge
                                        className={getDemandColor(slot.predictedDemand)}
                                        variant="secondary"
                                      >
                                        {slot.predictedDemand} demand
                                      </Badge>
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                      {slot.reasoning}
                                    </p>
                                    {slot.revenuePotential && price && (
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <div className="flex items-center gap-1 text-xs text-green-600">
                                            <DollarSign className="h-3 w-3" />
                                            <span>+{Math.round((slot.revenuePotential - price) / price * 100)}% potential</span>
                                          </div>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p>Revenue potential based on demand analysis</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    )}
                                  </div>
                                  <div className="text-right space-y-2">
                                    <div className={`text-sm font-medium ${getScoreColor(slot.score)}`}>
                                      {Math.round(slot.score * 100)}% match
                                    </div>
                                    <Progress value={slot.score * 100} className="w-20" />
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleOptimalTimeClick(slot)}
                                    >
                                      Select
                                    </Button>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </motion.div>
                        ))}
                      </div>
                    )}

                    {/* Reschedule Suggestions */}
                    {rescheduleSuggestions.length > 0 && (
                      <div className="space-y-3 mt-6">
                        <h4 className="font-medium text-orange-600">Reschedule Opportunities</h4>
                        <p className="text-sm text-muted-foreground">
                          Move existing appointments to maximize efficiency and revenue:
                        </p>
                        {rescheduleSuggestions.map((suggestion, index) => (
                          <Card key={index} className="border-orange-200 bg-orange-50">
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium">From:</span>
                                    <span>{suggestion.currentSlot.date} at {suggestion.currentSlot.time}</span>
                                    <span className="text-sm font-medium ml-2">To:</span>
                                    <span>{suggestion.suggestedSlot.date} at {suggestion.suggestedSlot.time}</span>
                                  </div>
                                  <p className="text-sm text-muted-foreground">
                                    {suggestion.reason}
                                  </p>
                                  {suggestion.potentialGain > 0 && (
                                    <div className="flex items-center gap-1 text-xs text-green-600 font-medium">
                                      <TrendingUp className="h-3 w-3" />
                                      <span>+$PLN{suggestion.potentialGain.toFixed(0)} potential gain</span>
                                    </div>
                                  )}
                                </div>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleRescheduleSuggestion(suggestion)}
                                >
                                  Apply
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}

                    {/* AI Learning Stats */}
                    <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                      <h4 className="font-medium text-blue-900 mb-2">AI Learning Metrics</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-blue-700">Accuracy Rate:</span>
                          <span className="ml-2 font-medium">94%</span>
                        </div>
                        <div>
                          <span className="text-blue-700">Bookings Optimized:</span>
                          <span className="ml-2 font-medium">1,247</span>
                        </div>
                        <div>
                          <span className="text-blue-700">Avg. Revenue Lift:</span>
                          <span className="ml-2 font-medium">+18%</span>
                        </div>
                        <div>
                          <span className="text-blue-700">Customer Satisfaction:</span>
                          <span className="ml-2 font-medium">4.8/5</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              )}

              <TabsContent value="recommendations" className="space-y-4">
                <div className="space-y-3">
                  <h4 className="font-medium">Smart Recommendations</h4>

                  {/* AI Insights */}
                  {insights?.recommendations && (
                    <div className="space-y-2">
                      {insights.recommendations.map((rec: string, index: number) => (
                        <div key={index} className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg">
                          <Lightbulb className="h-4 w-4 text-blue-600 mt-0.5" />
                          <p className="text-sm">{rec}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* System Recommendations */}
                  {recommendations && recommendations.length > 0 && (
                    <div className="space-y-2">
                      {recommendations
                        .filter((rec: any) => rec.priority === 'high')
                        .map((rec: any, index: number) => (
                          <Card key={index}>
                            <CardContent className="p-4">
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <Badge variant="destructive">High Priority</Badge>
                                  <span className="text-sm text-muted-foreground capitalize">
                                    {rec.type.replace('_', ' ')}
                                  </span>
                                </div>
                                <p className="font-medium">{rec.action}</p>
                                <p className="text-sm text-muted-foreground">{rec.reasoning}</p>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                    </div>
                  )}

                  {/* General Tips */}
                  <div className="space-y-2">
                    <div className="p-3 bg-green-50 rounded-lg">
                      <p className="text-sm">
                        💡 Book during off-peak hours for better availability and potentially lower prices
                      </p>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg">
                      <p className="text-sm">
                        💡 Consider booking a package for multiple services to save time and money
                      </p>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg">
                      <p className="text-sm">
                        💡 Book 3-7 days in advance for optimal time slot selection
                      </p>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
    </TooltipProvider>
  );
}