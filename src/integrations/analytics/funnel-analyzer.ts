import { supabase } from '@/integrations/supabase/client';
import type { ServiceCategory } from './booking-tracker';

// Funnel Metrics Interface
export interface FunnelMetrics {
  funnel_name: string;
  total_sessions: number;
  completion_rate: number;
  step_metrics: Array<{
    step_number: number;
    step_name: string;
    sessions_reached: number;
    sessions_completed: number;
    completion_rate: number;
    average_time_seconds: number;
    drop_off_rate: number;
    common_errors: Array<{
      error_code: string;
      count: number;
      percentage: number;
    }>;
  }>;
  drop_off_analysis: {
    most_common_step: number;
    drop_off_reasons: Array<{
      reason: string;
      count: number;
      percentage: number;
      step: number;
    }>;
  };
  conversion_breakdown: {
    by_service_category: Record<ServiceCategory, {
      sessions: number;
      completions: number;
      conversion_rate: number;
      average_time_seconds: number;
      average_value: number;
    }>;
    by_device_type: Record<string, {
      sessions: number;
      completions: number;
      conversion_rate: number;
      average_time_seconds: number;
    }>;
    by_language: Record<string, {
      sessions: number;
      completions: number;
      conversion_rate: number;
    }>;
  };
  time_analysis: {
    average_total_time_seconds: number;
    fastest_completion_seconds: number;
    slowest_completion_seconds: number;
    time_by_step: Record<number, number>;
    peak_performance_hours: Array<{
      hour: number;
      conversion_rate: number;
      sessions: number;
    }>;
  };
  value_metrics: {
    total_revenue: number;
    average_booking_value: number;
    revenue_by_category: Record<ServiceCategory, number>;
    revenue_by_time_of_day: Record<string, number>;
    abandoned_value: number;
  };
}

// Booking Funnel Step Configuration
const BOOKING_FUNNEL_CONFIG = {
  name: 'Main Booking Funnel',
  steps: [
    { number: 1, name: 'Choose Service', required: true },
    { number: 2, name: 'Select Time', required: true },
    { number: 3, name: 'Enter Details', required: true },
    { number: 4, name: 'Complete Payment', required: true },
  ],
} as const;

export class FunnelAnalyzer {
  private static instance: FunnelAnalyzer;

  static getInstance(): FunnelAnalyzer {
    if (!FunnelAnalyzer.instance) {
      FunnelAnalyzer.instance = new FunnelAnalyzer();
    }
    return FunnelAnalyzer.instance;
  }

  // Analyze booking funnel performance
  async analyzeBookingFunnel(
    startDate: string,
    endDate: string,
    filters?: {
      service_category?: ServiceCategory;
      device_type?: string;
      language?: string;
    }
  ): Promise<FunnelMetrics> {
    try {
      // Fetch all relevant booking events
      const bookingEvents = await this.fetchBookingEvents(startDate, endDate, filters);

      // Fetch completed bookings for revenue analysis
      const completedBookings = await this.fetchCompletedBookings(startDate, endDate, filters);

      // Calculate funnel metrics
      const stepMetrics = this.calculateStepMetrics(bookingEvents);
      const completionRate = this.calculateOverallCompletionRate(bookingEvents);
      const dropOffAnalysis = this.analyzeDropOffs(bookingEvents);
      const conversionBreakdown = this.analyzeConversionBreakdown(bookingEvents);
      const timeAnalysis = this.analyzeTimeMetrics(bookingEvents);
      const valueMetrics = this.calculateValueMetrics(completedBookings, bookingEvents);

      return {
        funnel_name: BOOKING_FUNNEL_CONFIG.name,
        total_sessions: this.getTotalUniqueSessions(bookingEvents),
        completion_rate: completionRate,
        step_metrics: stepMetrics,
        drop_off_analysis: dropOffAnalysis,
        conversion_breakdown: conversionBreakdown,
        time_analysis: timeAnalysis,
        value_metrics: valueMetrics,
      };
    } catch (error) {
      console.error('Failed to analyze booking funnel:', error);
      throw error;
    }
  }

  private async fetchBookingEvents(
    startDate: string,
    endDate: string,
    filters?: {
      service_category?: ServiceCategory;
      device_type?: string;
      language?: string;
    }
  ): Promise<any[]> {
    let query = supabase
      .from('booking_analytics_events')
      .select('*')
      .gte('timestamp', startDate)
      .lte('timestamp', endDate)
      .order('timestamp', { ascending: true });

    if (filters?.service_category) {
      query = query.eq('service_category', filters.service_category);
    }
    if (filters?.device_type) {
      query = query.eq('device_type', filters.device_type);
    }
    if (filters?.language) {
      // Language might be stored in additional_data or as a separate field
      query = query.contains('additional_data', { language: filters.language });
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  private async fetchCompletedBookings(
    startDate: string,
    endDate: string,
    filters?: {
      service_category?: ServiceCategory;
      device_type?: string;
      language?: string;
    }
  ): Promise<any[]> {
    let query = supabase
      .from('booking_journeys')
      .select('*')
      .eq('is_completed', true)
      .gte('created_at', startDate)
      .lte('created_at', endDate);

    if (filters?.service_category) {
      query = query.eq('service_category', filters.service_category);
    }
    if (filters?.device_type) {
      query = query.eq('device_type', filters.device_type);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  private calculateStepMetrics(events: any[]): FunnelMetrics['step_metrics'] {
    const stepMetrics: FunnelMetrics['step_metrics'] = [];

    BOOKING_FUNNEL_CONFIG.steps.forEach(stepConfig => {
      const stepEvents = events.filter(e => e.step === stepConfig.number);
      const sessionIds = new Set(stepEvents.map(e => e.session_id));
      const successfulEvents = stepEvents.filter(e => e.success);
      const successfulSessionIds = new Set(successfulEvents.map(e => e.session_id));

      // Calculate average time spent on this step
      const stepTimes = stepEvents
        .filter(e => e.time_spent_seconds)
        .map(e => e.time_spent_seconds);
      const averageTime = stepTimes.length > 0
        ? stepTimes.reduce((sum, time) => sum + time, 0) / stepTimes.length
        : 0;

      // Analyze common errors for this step
      const errorEvents = stepEvents.filter(e => !e.success && e.error_code);
      const errorCounts = errorEvents.reduce((acc, event) => {
        acc[event.error_code] = (acc[event.error_code] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const commonErrors = Object.entries(errorCounts)
        .map(([error_code, count]) => ({
          error_code,
          count,
          percentage: (count / stepEvents.length) * 100,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      stepMetrics.push({
        step_number: stepConfig.number,
        step_name: stepConfig.name,
        sessions_reached: sessionIds.size,
        sessions_completed: successfulSessionIds.size,
        completion_rate: sessionIds.size > 0 ? (successfulSessionIds.size / sessionIds.size) * 100 : 0,
        average_time_seconds: Math.round(averageTime),
        drop_off_rate: sessionIds.size > 0 ? ((sessionIds.size - successfulSessionIds.size) / sessionIds.size) * 100 : 0,
        common_errors: commonErrors,
      });
    });

    return stepMetrics;
  }

  private calculateOverallCompletionRate(events: any[]): number {
    const sessionIds = new Set(events.map(e => e.session_id));
    const finalStepEvents = events.filter(e => e.step === 4 && e.success);
    const completedSessionIds = new Set(finalStepEvents.map(e => e.session_id));

    return sessionIds.size > 0 ? (completedSessionIds.size / sessionIds.size) * 100 : 0;
  }

  private analyzeDropOffs(events: any[]): FunnelMetrics['drop_off_analysis'] {
    // Get abandonment data
    const abandonmentData = events.filter(e => !e.success || e.error_code === 'abandoned');

    // Find most common drop-off step
    const dropOffSteps = abandonmentData.reduce((acc, event) => {
      acc[event.step] = (acc[event.step] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    const mostCommonStep = Object.entries(dropOffSteps)
      .sort(([, a], [, b]) => b - a)[0]?.[0] || 0;

    // Analyze drop-off reasons
    const dropOffReasons = abandonmentData.reduce((acc, event) => {
      const reason = event.additional_data?.abandonment_reason ||
                     event.error_code ||
                     'Unknown';
      acc[reason] = (acc[reason] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const reasonsList = Object.entries(dropOffReasons)
      .map(([reason, count]) => ({
        reason,
        count,
        percentage: (count / abandonmentData.length) * 100,
        step: this.getStepForReason(reason, abandonmentData),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      most_common_step: parseInt(mostCommonStep.toString()),
      drop_off_reasons: reasonsList,
    };
  }

  private getStepForReason(reason: string, events: any[]): number {
    const matchingEvent = events.find(e =>
      e.additional_data?.abandonment_reason === reason || e.error_code === reason
    );
    return matchingEvent?.step || 0;
  }

  private analyzeConversionBreakdown(events: any[]): FunnelMetrics['conversion_breakdown'] {
    const sessions = new Set(events.map(e => e.session_id));
    const finalStepEvents = events.filter(e => e.step === 4 && e.success);
    const completedSessions = new Set(finalStepEvents.map(e => e.session_id));

    // By service category
    const categoryBreakdown = this.calculateCategoryBreakdown(events, sessions, completedSessions);

    // By device type
    const deviceBreakdown = this.calculateDeviceBreakdown(events, sessions, completedSessions);

    // By language
    const languageBreakdown = this.calculateLanguageBreakdown(events, sessions, completedSessions);

    return {
      by_service_category: categoryBreakdown,
      by_device_type: deviceBreakdown,
      by_language: languageBreakdown,
    };
  }

  private calculateCategoryBreakdown(
    events: any[],
    allSessions: Set<string>,
    completedSessions: Set<string>
  ): Record<ServiceCategory, any> {
    const categories: ServiceCategory[] = ['beauty', 'fitness', 'lifestyle'];
    const breakdown: Record<string, any> = {};

    categories.forEach(category => {
      const categoryEvents = events.filter(e => e.service_category === category);
      const categorySessionIds = new Set(categoryEvents.map(e => e.session_id));
      const categoryCompleted = categoryEvents.filter(e => e.step === 4 && e.success);
      const categoryCompletedSessionIds = new Set(categoryCompleted.map(e => e.session_id));

      const stepTimes = categoryEvents
        .filter(e => e.time_spent_seconds)
        .map(e => e.time_spent_seconds);
      const averageTime = stepTimes.length > 0
        ? stepTimes.reduce((sum, time) => sum + time, 0) / stepTimes.length
        : 0;

      const values = categoryCompleted
        .filter(e => e.service_price)
        .map(e => e.service_price);
      const averageValue = values.length > 0
        ? values.reduce((sum, value) => sum + value, 0) / values.length
        : 0;

      breakdown[category] = {
        sessions: categorySessionIds.size,
        completions: categoryCompletedSessionIds.size,
        conversion_rate: categorySessionIds.size > 0
          ? (categoryCompletedSessionIds.size / categorySessionIds.size) * 100
          : 0,
        average_time_seconds: Math.round(averageTime),
        average_value: averageValue,
      };
    });

    return breakdown;
  }

  private calculateDeviceBreakdown(
    events: any[],
    allSessions: Set<string>,
    completedSessions: Set<string>
  ): Record<string, any> {
    const deviceTypes = ['mobile', 'tablet', 'desktop'];
    const breakdown: Record<string, any> = {};

    deviceTypes.forEach(deviceType => {
      const deviceEvents = events.filter(e => e.device_type === deviceType);
      const deviceSessionIds = new Set(deviceEvents.map(e => e.session_id));
      const deviceCompleted = deviceEvents.filter(e => e.step === 4 && e.success);
      const deviceCompletedSessionIds = new Set(deviceCompleted.map(e => e.session_id));

      const stepTimes = deviceEvents
        .filter(e => e.time_spent_seconds)
        .map(e => e.time_spent_seconds);
      const averageTime = stepTimes.length > 0
        ? stepTimes.reduce((sum, time) => sum + time, 0) / stepTimes.length
        : 0;

      breakdown[deviceType] = {
        sessions: deviceSessionIds.size,
        completions: deviceCompletedSessionIds.size,
        conversion_rate: deviceSessionIds.size > 0
          ? (deviceCompletedSessionIds.size / deviceSessionIds.size) * 100
          : 0,
        average_time_seconds: Math.round(averageTime),
      };
    });

    return breakdown;
  }

  private calculateLanguageBreakdown(
    events: any[],
    allSessions: Set<string>,
    completedSessions: Set<string>
  ): Record<string, any> {
    const languages = ['en', 'pl', 'ua', 'ru'];
    const breakdown: Record<string, any> = {};

    languages.forEach(language => {
      const languageEvents = events.filter(e =>
        e.additional_data?.language === language
      );
      const languageSessionIds = new Set(languageEvents.map(e => e.session_id));
      const languageCompleted = languageEvents.filter(e => e.step === 4 && e.success);
      const languageCompletedSessionIds = new Set(languageCompleted.map(e => e.session_id));

      breakdown[language] = {
        sessions: languageSessionIds.size,
        completions: languageCompletedSessionIds.size,
        conversion_rate: languageSessionIds.size > 0
          ? (languageCompletedSessionIds.size / languageSessionIds.size) * 100
          : 0,
      };
    });

    return breakdown;
  }

  private analyzeTimeMetrics(events: any[]): FunnelMetrics['time_analysis'] {
    // Group events by session to calculate total times
    const sessionTimes = this.calculateSessionTotalTimes(events);

    const totalTimes = Object.values(sessionTimes);
    const averageTotalTime = totalTimes.length > 0
      ? totalTimes.reduce((sum, time) => sum + time, 0) / totalTimes.length
      : 0;
    const fastestTime = totalTimes.length > 0 ? Math.min(...totalTimes) : 0;
    const slowestTime = totalTimes.length > 0 ? Math.max(...totalTimes) : 0;

    // Time by step
    const timeByStep = this.calculateTimeByStep(events);

    // Peak performance hours
    const peakHours = this.calculatePeakPerformanceHours(events);

    return {
      average_total_time_seconds: Math.round(averageTotalTime),
      fastest_completion_seconds: Math.round(fastestTime),
      slowest_completion_seconds: Math.round(slowestTime),
      time_by_step: timeByStep,
      peak_performance_hours: peakHours,
    };
  }

  private calculateSessionTotalTimes(events: any[]): Record<string, number> {
    const sessionTimes: Record<string, number> = {};

    // Group events by session and sum their times
    events.forEach(event => {
      if (event.time_spent_seconds) {
        sessionTimes[event.session_id] = (sessionTimes[event.session_id] || 0) + event.time_spent_seconds;
      }
    });

    return sessionTimes;
  }

  private calculateTimeByStep(events: any[]): Record<number, number> {
    const stepTimes: Record<number, number[]> = {};

    BOOKING_FUNNEL_CONFIG.steps.forEach(step => {
      const stepEvents = events.filter(e => e.step === step.number && e.time_spent_seconds);
      stepTimes[step.number] = stepEvents.map(e => e.time_spent_seconds);
    });

    const averageTimeByStep: Record<number, number> = {};
    Object.entries(stepTimes).forEach(([step, times]) => {
      averageTimeByStep[parseInt(step)] = times.length > 0
        ? Math.round(times.reduce((sum, time) => sum + time, 0) / times.length)
        : 0;
    });

    return averageTimeByStep;
  }

  private calculatePeakPerformanceHours(events: any[]): Array<{hour: number; conversion_rate: number; sessions: number}> {
    const hourlyData: Record<number, {sessions: Set<string>; conversions: Set<string>}> = {};

    // Initialize all hours
    for (let hour = 0; hour < 24; hour++) {
      hourlyData[hour] = { sessions: new Set(), conversions: new Set() };
    }

    // Process events
    events.forEach(event => {
      const hour = new Date(event.timestamp).getHours();
      hourlyData[hour].sessions.add(event.session_id);

      if (event.step === 4 && event.success) {
        hourlyData[hour].conversions.add(event.session_id);
      }
    });

    // Calculate conversion rates and return sorted results
    return Object.entries(hourlyData)
      .map(([hour, data]) => ({
        hour: parseInt(hour),
        conversion_rate: data.sessions.size > 0
          ? (data.conversions.size / data.sessions.size) * 100
          : 0,
        sessions: data.sessions.size,
      }))
      .filter(item => item.sessions >= 5) // Only include hours with sufficient data
      .sort((a, b) => b.conversion_rate - a.conversion_rate)
      .slice(0, 6); // Top 6 performing hours
  }

  private calculateValueMetrics(completedBookings: any[], allEvents: any[]): FunnelMetrics['value_metrics'] {
    // Calculate total and average revenue
    const bookingValues = completedBookings.map(booking => {
      if (booking.service_selected?.price) {
        return booking.service_selected.price;
      }
      // Try to extract from events if not in booking journey
      const matchingEvent = allEvents.find(e =>
        e.session_id === booking.session_id &&
        e.step === 4 &&
        e.service_price
      );
      return matchingEvent?.service_price || 0;
    });

    const totalRevenue = bookingValues.reduce((sum, value) => sum + value, 0);
    const averageValue = bookingValues.length > 0 ? totalRevenue / bookingValues.length : 0;

    // Revenue by category
    const revenueByCategory = this.calculateRevenueByCategory(completedBookings, allEvents);

    // Revenue by time of day
    const revenueByTimeOfDay = this.calculateRevenueByTimeOfDay(completedBookings);

    // Abandoned value (value of bookings that were started but not completed)
    const abandonedValue = this.calculateAbandonedValue(allEvents);

    return {
      total_revenue: totalRevenue,
      average_booking_value: averageValue,
      revenue_by_category: revenueByCategory,
      revenue_by_time_of_day: revenueByTimeOfDay,
      abandoned_value: abandonedValue,
    };
  }

  private calculateRevenueByCategory(completedBookings: any[], allEvents: any[]): Record<ServiceCategory, number> {
    const categories: ServiceCategory[] = ['beauty', 'fitness', 'lifestyle'];
    const revenueByCategory: Record<string, number> = {};

    categories.forEach(category => {
      const categoryBookings = completedBookings.filter(b => b.service_category === category);
      const categoryRevenue = categoryBookings.reduce((sum, booking) => {
        return sum + (booking.service_selected?.price || 0);
      }, 0);
      revenueByCategory[category] = categoryRevenue;
    });

    return revenueByCategory;
  }

  private calculateRevenueByTimeOfDay(completedBookings: any[]): Record<string, number> {
    const timeSlots = {
      'Morning (6-12)': 0,
      'Afternoon (12-18)': 0,
      'Evening (18-22)': 0,
      'Night (22-6)': 0,
    };

    completedBookings.forEach(booking => {
      const hour = new Date(booking.created_at).getHours();
      let slot: string;

      if (hour >= 6 && hour < 12) slot = 'Morning (6-12)';
      else if (hour >= 12 && hour < 18) slot = 'Afternoon (12-18)';
      else if (hour >= 18 && hour < 22) slot = 'Evening (18-22)';
      else slot = 'Night (22-6)';

      timeSlots[slot] += booking.service_selected?.price || 0;
    });

    return timeSlots;
  }

  private calculateAbandonedValue(allEvents: any[]): number {
    // Find sessions that started but didn't complete step 4
    const allSessionIds = new Set(allEvents.map(e => e.session_id));
    const completedSessionIds = new Set(
      allEvents.filter(e => e.step === 4 && e.success).map(e => e.session_id)
    );
    const abandonedSessionIds = [...allSessionIds].filter(id => !completedSessionIds.has(id));

    let abandonedValue = 0;
    abandonedSessionIds.forEach(sessionId => {
      const sessionEvents = allEvents.filter(e => e.session_id === sessionId);
      const servicePrice = sessionEvents.find(e => e.service_price)?.service_price;
      if (servicePrice) {
        abandonedValue += servicePrice;
      }
    });

    return abandonedValue;
  }

  private getTotalUniqueSessions(events: any[]): number {
    return new Set(events.map(e => e.session_id)).size;
  }

  // Generate insights and recommendations
  async generateFunnelInsights(
    startDate: string,
    endDate: string,
    filters?: {
      service_category?: ServiceCategory;
      device_type?: string;
      language?: string;
    }
  ): Promise<{
    insights: string[];
    recommendations: string[];
    key_metrics: {
      completion_rate: number;
      average_time_seconds: number;
      conversion_rate: number;
      total_revenue: number;
    };
  }> {
    const metrics = await this.analyzeBookingFunnel(startDate, endDate, filters);

    const insights = [
      `Overall funnel completion rate: ${metrics.completion_rate.toFixed(1)}%`,
      `Average booking time: ${Math.round(metrics.time_analysis.average_total_time_seconds / 60)} minutes`,
      `Most common drop-off point: Step ${metrics.drop_off_analysis.most_common_step} (${BOOKING_FUNNEL_CONFIG.steps.find(s => s.number === metrics.drop_off_analysis.most_common_step)?.name})`,
      `Total revenue: ${metrics.value_metrics.total_revenue.toFixed(2)} PLN`,
      `Best performing device: ${Object.entries(metrics.conversion_breakdown.by_device_type).sort(([, a], [, b]) => b.conversion_rate - a.conversion_rate)[0]?.[0]}`,
      `Peak conversion hour: ${metrics.time_analysis.peak_performance_hours[0]?.hour}:00`,
    ];

    const recommendations = this.generateRecommendations(metrics);

    return {
      insights,
      recommendations,
      key_metrics: {
        completion_rate: metrics.completion_rate,
        average_time_seconds: metrics.time_analysis.average_total_time_seconds,
        conversion_rate: metrics.step_metrics[0]?.completion_rate || 0,
        total_revenue: metrics.value_metrics.total_revenue,
      },
    };
  }

  private generateRecommendations(metrics: FunnelMetrics): string[] {
    const recommendations: string[] = [];

    // Based on completion rate
    if (metrics.completion_rate < 50) {
      recommendations.push('Focus on improving overall funnel completion rate - currently below 50%');
    }

    // Based on drop-off analysis
    if (metrics.drop_off_analysis.most_common_step === 2) {
      recommendations.push('Optimize time slot selection process - most users drop off at step 2');
    } else if (metrics.drop_off_analysis.most_common_step === 4) {
      recommendations.push('Review payment process and reduce friction in checkout');
    }

    // Based on time analysis
    if (metrics.time_analysis.average_total_time_seconds > 600) { // 10 minutes
      recommendations.push('Streamline booking process - average completion time exceeds 10 minutes');
    }

    // Based on device performance
    const devicePerformance = Object.entries(metrics.conversion_breakdown.by_device_type);
    const worstDevice = devicePerformance.sort(([, a], [, b]) => a.conversion_rate - b.conversion_rate)[0];
    if (worstDevice && worstDevice[1].conversion_rate < 30) {
      recommendations.push(`Optimize booking experience for ${worstDevice[0]} users - low conversion rate detected`);
    }

    // Based on revenue insights
    if (metrics.value_metrics.abandoned_value > metrics.value_metrics.total_revenue * 0.5) {
      recommendations.push('Implement abandoned booking recovery system - significant revenue lost');
    }

    // Based on error analysis
    const commonErrors = metrics.step_metrics.flatMap(step => step.common_errors.slice(0, 2));
    if (commonErrors.length > 0) {
      recommendations.push(`Address common booking errors: ${commonErrors.slice(0, 3).map(e => e.error_code).join(', ')}`);
    }

    return recommendations;
  }
}

// Export singleton instance
export const funnelAnalyzer = FunnelAnalyzer.getInstance();