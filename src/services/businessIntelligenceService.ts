import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

// Advanced analytics and business intelligence service
export interface BIMetrics {
  revenue: {
    total: number;
    growth: number;
    forecast: number;
    byService: Record<string, number>;
    byLocation: Record<string, number>;
    byTimePeriod: Record<string, number>;
  };
  bookings: {
    total: number;
    completed: number;
    cancelled: number;
    completionRate: number;
    averageValue: number;
    byService: Record<string, number>;
    byTimeSlot: Record<string, number>;
  };
  customers: {
    total: number;
    new: number;
    returning: number;
    churnRate: number;
    lifetimeValue: number;
    byLocation: Record<string, number>;
    satisfactionScore: number;
  };
  performance: {
    occupancyRate: number;
    conversionRate: number;
    utilization: number;
    efficiency: number;
    satisfaction: number;
  };
}

export interface CustomerJourney {
  stage: string;
  users: number;
  conversionRate: number;
  dropOffRate: number;
  avgTimeSpent: number;
  actions: string[];
}

export interface PredictiveInsight {
  id: string;
  type: 'opportunity' | 'risk' | 'trend' | 'recommendation';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  confidence: number;
  actionable: boolean;
  suggestedActions: string[];
  kpi: string;
  currentValue: number;
  projectedValue: number;
  timeframe: string;
  category: string;
}

export interface MarketIntelligence {
  competitorData: Array<{
    name: string;
    marketShare: number;
    avgPrice: number;
    services: number;
    rating: number;
    strengths: string[];
    weaknesses: string[];
  }>;
  marketTrends: Array<{
    trend: string;
    growth: number;
    relevance: number;
    timeframe: string;
    category: string;
  }>;
  demandForecast: Array<{
    month: string;
    expectedDemand: number;
    confidence: number;
    factors: string[];
    services: Array<{
      name: string;
      demand: number;
      confidence: number;
    }>;
  }>;
  pricingAnalysis: {
    optimalPrice: number;
    priceElasticity: number;
    competitorPrices: Array<{
      competitor: string;
      price: number;
      position: 'premium' | 'mid' | 'budget';
    }>;
  };
}

export interface ExpansionRecommendation {
  cityId: string;
  cityName: string;
  country: string;
  priority: 'high' | 'medium' | 'low';
  investmentRequired: number;
  expectedROI: number;
  timeToProfit: number;
  riskLevel: 'low' | 'medium' | 'high';
  marketSize: number;
  competitiveAdvantage: string;
  actionPlan: string[];
  demographics: {
    population: number;
    incomeLevel: string;
    ageDistribution: Record<string, number>;
  };
}

export interface BIReportConfig {
  name: string;
  description: string;
  metrics: string[];
  dimensions: string[];
  filters: Array<{
    field: string;
    operator: string;
    value: any;
  }>;
  visualizations: Array<{
    type: string;
    config: Record<string, any>;
  }>;
  schedule?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    recipients: string[];
  };
}

export interface BusinessIntelligenceService {
  // Core analytics
  getMetrics(dateRange: { from: Date; to: Date }): Promise<BIMetrics>;
  getCustomerJourney(): Promise<CustomerJourney[]>;
  getServicePerformance(dateRange: { from: Date; to: Date }): Promise<any[]>;

  // Predictive analytics
  getPredictiveInsights(dateRange: { from: Date; to: Date }): Promise<PredictiveInsight[]>;
  generateDemandForecast(months: number): Promise<any[]>;
  analyzeCustomerChurn(): Promise<any>;

  // Market intelligence
  getMarketIntelligence(): Promise<MarketIntelligence>;
  analyzeCompetitors(): Promise<any>;
  getPricingRecommendations(serviceId: string): Promise<any>;

  // Expansion analysis
  getExpansionRecommendations(): Promise<ExpansionRecommendation[]>;
  analyzeMarketPotential(cityId: string): Promise<any>;
  calculateROI(cityId: string, investment: number): Promise<any>;

  // Reporting
  generateCustomReport(config: BIReportConfig): Promise<any>;
  scheduleReport(config: BIReportConfig): Promise<void>;
  exportReport(reportId: string, format: 'pdf' | 'excel' | 'json'): Promise<Blob>;

  // Real-time monitoring
  subscribeToMetrics(callback: (metrics: BIMetrics) => void): () => void;
  setAlerts(config: Array<{
    metric: string;
    condition: 'above' | 'below' | 'change';
    threshold: number;
    notification: string;
  }>): Promise<void>;
}

class BusinessIntelligenceServiceImpl implements BusinessIntelligenceService {
  private subscribers: Array<(metrics: BIMetrics) => void> = [];
  private alertConfigs: any[] = [];

  async getMetrics(dateRange: { from: Date; to: Date }): Promise<BIMetrics> {
    try {
      logger.info('Fetching BI metrics for date range:', dateRange);

      // Get bookings data
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('*')
        .gte('booking_date', dateRange.from.toISOString())
        .lte('booking_date', dateRange.to.toISOString());

      if (bookingsError) throw bookingsError;

      // Get services data
      const { data: services, error: servicesError } = await supabase
        .from('services')
        .select('*');

      if (servicesError) throw servicesError;

      // Get profiles data
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*');

      if (profilesError) throw profilesError;

      // Get previous period data for comparison
      const previousDays = Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24));
      const previousDateRange = {
        from: new Date(dateRange.from.getTime() - previousDays * 24 * 60 * 60 * 1000),
        to: dateRange.from
      };

      const { data: previousBookings } = await supabase
        .from('bookings')
        .select('amount_paid')
        .gte('booking_date', previousDateRange.from.toISOString())
        .lte('booking_date', previousDateRange.to.toISOString())
        .in('status', ['confirmed', 'completed']);

      // Calculate metrics
      const totalRevenue = bookings?.reduce((sum, b) => sum + (Number(b.amount_paid) || 0), 0) || 0;
      const previousRevenue = previousBookings?.reduce((sum, b) => sum + (Number(b.amount_paid) || 0), 0) || 0;
      const revenueGrowth = previousRevenue > 0 ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 : 0;

      const totalBookings = bookings?.length || 0;
      const completedBookings = bookings?.filter(b => b.status === 'completed').length || 0;
      const cancelledBookings = bookings?.filter(b => b.status === 'cancelled').length || 0;
      const completionRate = totalBookings > 0 ? (completedBookings / totalBookings) * 100 : 0;

      const averageBookingValue = totalBookings > 0 ? totalRevenue / totalBookings : 0;

      // Calculate revenue by service
      const revenueByService: Record<string, number> = {};
      bookings?.forEach(booking => {
        const serviceName = services?.find(s => s.id === booking.service_id)?.name || 'Unknown';
        revenueByService[serviceName] = (revenueByService[serviceName] || 0) + (Number(booking.amount_paid) || 0);
      });

      // Calculate revenue by location (simulate)
      const revenueByLocation: Record<string, number> = {
        'Warsaw': totalRevenue * 0.6,
        'Krakow': totalRevenue * 0.3,
        'Other': totalRevenue * 0.1
      };

      // Calculate revenue by time period
      const revenueByTimePeriod: Record<string, number> = {};
      bookings?.forEach(booking => {
        const hour = new Date(booking.booking_date).getHours();
        const period = hour < 12 ? 'Morning' : hour < 17 ? 'Afternoon' : 'Evening';
        revenueByTimePeriod[period] = (revenueByTimePeriod[period] || 0) + (Number(booking.amount_paid) || 0);
      });

      // Customer metrics
      const totalCustomers = profiles?.length || 0;
      const newCustomers = profiles?.filter(p => {
        const createdDate = new Date(p.created_at);
        return createdDate >= dateRange.from && createdDate <= dateRange.to;
      }).length || 0;

      const churnRate = 5.2; // Simulated calculation
      const lifetimeValue = 1250; // Simulated calculation

      // Performance metrics
      const occupancyRate = 78.5; // Simulated
      const conversionRate = 4.8; // Simulated
      const utilization = 82.3; // Simulated
      const efficiency = 87.1; // Simulated
      const satisfaction = 4.6; // Simulated

      const metrics: BIMetrics = {
        revenue: {
          total: totalRevenue,
          growth: revenueGrowth,
          forecast: totalRevenue * (1 + revenueGrowth / 100 * 1.2),
          byService: revenueByService,
          byLocation: revenueByLocation,
          byTimePeriod: revenueByTimePeriod
        },
        bookings: {
          total: totalBookings,
          completed: completedBookings,
          cancelled: cancelledBookings,
          completionRate,
          averageValue: averageBookingValue,
          byService: {},
          byTimeSlot: {}
        },
        customers: {
          total: totalCustomers,
          new: newCustomers,
          returning: totalCustomers - newCustomers,
          churnRate,
          lifetimeValue,
          byLocation: {},
          satisfactionScore: satisfaction
        },
        performance: {
          occupancyRate,
          conversionRate,
          utilization,
          efficiency,
          satisfaction
        }
      };

      // Notify subscribers
      this.subscribers.forEach(callback => callback(metrics));

      return metrics;
    } catch (error) {
      logger.error('Error fetching BI metrics:', error);
      throw error;
    }
  }

  async getCustomerJourney(): Promise<CustomerJourney[]> {
    try {
      // Simulated customer journey data
      // In a real implementation, this would come from analytics events
      const journey: CustomerJourney[] = [
        {
          stage: 'Awareness',
          users: 10000,
          conversionRate: 100,
          dropOffRate: 20,
          avgTimeSpent: 2.5,
          actions: ['Visited website', 'Searched services', 'Viewed ads']
        },
        {
          stage: 'Interest',
          users: 8000,
          conversionRate: 80,
          dropOffRate: 35,
          avgTimeSpent: 5.2,
          actions: ['Viewed service details', 'Read reviews', 'Checked pricing']
        },
        {
          stage: 'Consideration',
          users: 5200,
          conversionRate: 52,
          dropOffRate: 40,
          avgTimeSpent: 8.7,
          actions: ['Compared services', 'Viewed portfolio', 'Contacted support']
        },
        {
          stage: 'Booking',
          users: 3120,
          conversionRate: 31.2,
          dropOffRate: 25,
          avgTimeSpent: 12.3,
          actions: ['Started booking process', 'Selected time slot', 'Entered details']
        },
        {
          stage: 'Payment',
          users: 2340,
          conversionRate: 23.4,
          dropOffRate: 15,
          avgTimeSpent: 4.8,
          actions: ['Entered payment info', 'Applied discounts', 'Confirmed booking']
        },
        {
          stage: 'Completion',
          users: 1989,
          conversionRate: 19.9,
          dropOffRate: 5,
          avgTimeSpent: 45.2,
          actions: ['Attended appointment', 'Received service', 'Left review']
        }
      ];

      return journey;
    } catch (error) {
      logger.error('Error fetching customer journey:', error);
      throw error;
    }
  }

  async getServicePerformance(dateRange: { from: Date; to: Date }): Promise<any[]> {
    try {
      const { data: services, error } = await supabase
        .from('services')
        .select('*');

      if (error) throw error;

      // Simulated performance data
      return services?.map(service => ({
        serviceId: service.id,
        serviceName: service.name,
        category: service.category || 'general',
        revenue: Math.random() * 10000 + 2000,
        bookings: Math.floor(Math.random() * 100) + 20,
        avgRating: 4.2 + Math.random() * 0.8,
        popularity: Math.random() * 100,
        profitability: (Math.random() - 0.3) * 50,
        demand: ['high', 'medium', 'low'][Math.floor(Math.random() * 3)],
        seasonality: Math.random() * 2 - 1,
        satisfaction: 4.3 + Math.random() * 0.7,
        completionRate: 90 + Math.random() * 10
      })) || [];
    } catch (error) {
      logger.error('Error fetching service performance:', error);
      throw error;
    }
  }

  async getPredictiveInsights(dateRange: { from: Date; to: Date }): Promise<PredictiveInsight[]> {
    try {
      // Simulated AI-powered insights
      const insights: PredictiveInsight[] = [
        {
          id: '1',
          type: 'opportunity',
          title: 'Increased Demand for PMU Services',
          description: 'Analysis shows 25% increase in demand for permanent makeup services next month',
          impact: 'high',
          confidence: 87,
          actionable: true,
          suggestedActions: [
            'Increase PMU service availability',
            'Run targeted marketing campaign',
            'Train additional staff'
          ],
          kpi: 'Revenue',
          currentValue: 15000,
          projectedValue: 18750,
          timeframe: 'next month',
          category: 'Demand Forecasting'
        },
        {
          id: '2',
          type: 'risk',
          title: 'High Customer Churn Risk',
          description: '15% of at-risk customers show signs of decreased engagement',
          impact: 'medium',
          confidence: 72,
          actionable: true,
          suggestedActions: [
            'Launch retention campaign',
            'Offer loyalty discounts',
            'Improve customer service response time'
          ],
          kpi: 'Churn Rate',
          currentValue: 5.2,
          projectedValue: 7.8,
          timeframe: 'quarter',
          category: 'Customer Retention'
        },
        {
          id: '3',
          type: 'trend',
          title: 'Weekend Booking Surge',
          description: 'Analysis shows increasing trend for weekend bookings, especially Sundays',
          impact: 'medium',
          confidence: 94,
          actionable: true,
          suggestedActions: [
            'Adjust weekend pricing',
            'Increase weekend staff availability',
            'Create weekend-specific packages'
          ],
          kpi: 'Occupancy Rate',
          currentValue: 78.5,
          projectedValue: 85.2,
          timeframe: 'immediate',
          category: 'Booking Patterns'
        }
      ];

      return insights;
    } catch (error) {
      logger.error('Error fetching predictive insights:', error);
      throw error;
    }
  }

  async generateDemandForecast(months: number): Promise<any[]> {
    try {
      const forecast = [];
      const currentDate = new Date();

      for (let i = 0; i < months; i++) {
        const forecastDate = new Date(currentDate);
        forecastDate.setMonth(currentDate.getMonth() + i);

        // Simulate demand calculation with seasonal patterns
        const baseDemand = 100;
        const seasonalFactor = 1 + Math.sin((i % 12) * Math.PI / 6) * 0.3;
        const growthFactor = 1 + (i * 0.02);
        const randomFactor = 0.9 + Math.random() * 0.2;

        const expectedDemand = Math.round(baseDemand * seasonalFactor * growthFactor * randomFactor);

        forecast.push({
          month: forecastDate.toLocaleDateString('en', { month: 'short', year: 'numeric' }),
          expectedDemand,
          confidence: Math.max(60, 95 - (i * 2)), // Decreasing confidence over time
          factors: [
            'Seasonal patterns',
            'Growth trends',
            'Market conditions'
          ],
          services: [
            { name: 'Beauty', demand: expectedDemand * 0.5, confidence: 85 },
            { name: 'Fitness', demand: expectedDemand * 0.3, confidence: 80 },
            { name: 'Lifestyle', demand: expectedDemand * 0.2, confidence: 75 }
          ]
        });
      }

      return forecast;
    } catch (error) {
      logger.error('Error generating demand forecast:', error);
      throw error;
    }
  }

  async analyzeCustomerChurn(): Promise<any> {
    try {
      // Simulated churn analysis
      return {
        overallChurnRate: 5.2,
        churnByCohort: {
          '0-30 days': 2.1,
          '31-90 days': 8.3,
          '91-180 days': 12.7,
          '180+ days': 4.2
        },
        churnReasons: {
          'Price': 25,
          'Service Quality': 15,
          'Convenience': 30,
          'Competition': 20,
          'Other': 10
        },
        atRiskCustomers: 45,
        retentionOpportunities: [
          'Implement loyalty program',
          'Price optimization',
          'Service quality improvements',
          'Convenience enhancements'
        ]
      };
    } catch (error) {
      logger.error('Error analyzing customer churn:', error);
      throw error;
    }
  }

  async getMarketIntelligence(): Promise<MarketIntelligence> {
    try {
      // Simulated market intelligence data
      return {
        competitorData: [
          {
            name: 'Beauty Studio Pro',
            marketShare: 25,
            avgPrice: 450,
            services: 12,
            rating: 4.5,
            strengths: ['Premium positioning', 'Experienced staff', 'Central location'],
            weaknesses: ['High prices', 'Limited capacity', 'Weak online presence']
          },
          {
            name: 'Lux Beauty Bar',
            marketShare: 18,
            avgPrice: 380,
            services: 8,
            rating: 4.3,
            strengths: ['Competitive pricing', 'Good ambiance', 'Loyal clientele'],
            weaknesses: ['Limited services', 'Smaller space', 'Inconsistent quality']
          }
        ],
        marketTrends: [
          {
            trend: 'Natural Look PMU',
            growth: 35,
            relevance: 92,
            timeframe: '6 months',
            category: 'Beauty'
          },
          {
            trend: 'Minimalist Eyebrows',
            growth: 28,
            relevance: 85,
            timeframe: '3 months',
            category: 'Beauty'
          }
        ],
        demandForecast: [
          {
            month: 'Jan',
            expectedDemand: 120,
            confidence: 85,
            factors: ['New Year resolutions', 'Holiday recovery'],
            services: [
              { name: 'Beauty', demand: 60, confidence: 90 },
              { name: 'Fitness', demand: 40, confidence: 80 }
            ]
          }
        ],
        pricingAnalysis: {
          optimalPrice: 420,
          priceElasticity: -1.2,
          competitorPrices: [
            { competitor: 'Beauty Studio Pro', price: 450, position: 'premium' },
            { competitor: 'Lux Beauty Bar', price: 380, position: 'mid' }
          ]
        }
      };
    } catch (error) {
      logger.error('Error fetching market intelligence:', error);
      throw error;
    }
  }

  async analyzeCompetitors(): Promise<any> {
    try {
      // Simulated competitor analysis
      return {
        totalCompetitors: 12,
        directCompetitors: 8,
        indirectCompetitors: 4,
        marketConcentration: 0.65, // HHI index
        competitiveIntensity: 'high',
        threatOfNewEntrants: 'medium',
        barriersToEntry: ['Capital requirements', 'Regulations', 'Brand recognition'],
        recommendation: 'Focus on differentiation and premium positioning'
      };
    } catch (error) {
      logger.error('Error analyzing competitors:', error);
      throw error;
    }
  }

  async getPricingRecommendations(serviceId: string): Promise<any> {
    try {
      // Simulated pricing analysis
      return {
        currentPrice: 380,
        recommendedPrice: 420,
        priceRange: { min: 350, max: 480 },
        elasticity: -1.2,
        competitorAnalysis: {
          averagePrice: 395,
          premiumPosition: 0.15,
          budgetCompetitors: 3,
          premiumCompetitors: 5
        },
        optimization: {
          volumeChange: -8,
          revenueChange: 12,
          profitChange: 18,
          confidence: 75
        }
      };
    } catch (error) {
      logger.error('Error getting pricing recommendations:', error);
      throw error;
    }
  }

  async getExpansionRecommendations(): Promise<ExpansionRecommendation[]> {
    try {
      // Simulated expansion recommendations
      return [
        {
          cityId: 'berlin',
          cityName: 'Berlin',
          country: 'Germany',
          priority: 'high',
          investmentRequired: 250000,
          expectedROI: 185,
          timeToProfit: 18,
          riskLevel: 'medium',
          marketSize: 1200000,
          competitiveAdvantage: 'Premium positioning and international appeal',
          actionPlan: [
            'Market research and regulatory compliance',
            'Secure premium location',
            'Hire local staff',
            'Launch marketing campaign'
          ],
          demographics: {
            population: 3660000,
            incomeLevel: 'high',
            ageDistribution: { '18-35': 40, '36-55': 35, '55+': 25 }
          }
        }
      ];
    } catch (error) {
      logger.error('Error getting expansion recommendations:', error);
      throw error;
    }
  }

  async analyzeMarketPotential(cityId: string): Promise<any> {
    try {
      // Simulated market potential analysis
      return {
        marketSize: 850000,
        addressableMarket: 340000,
        growthRate: 12.5,
        competitionLevel: 'medium',
        barriersToEntry: ['Regulations', 'Real estate costs', 'Talent availability'],
        opportunities: ['Underserved premium segment', 'Tourist market', 'Corporate clients'],
        risks: ['Economic uncertainty', 'Seasonal demand', 'Competition'],
        recommendation: 'High potential with moderate barriers. Proceed with detailed feasibility study.'
      };
    } catch (error) {
      logger.error('Error analyzing market potential:', error);
      throw error;
    }
  }

  async calculateROI(cityId: string, investment: number): Promise<any> {
    try {
      // Simulated ROI calculation
      const monthlyRevenue = 25000;
      const monthlyCosts = 15000;
      const monthlyProfit = monthlyRevenue - monthlyCosts;
      const annualProfit = monthlyProfit * 12;
      const roi = (annualProfit / investment) * 100;
      const paybackPeriod = investment / monthlyProfit;

      return {
        investment,
        monthlyRevenue,
        monthlyCosts,
        monthlyProfit,
        annualProfit,
        roi: roi.toFixed(2),
        paybackPeriod: paybackPeriod.toFixed(1),
        npv: this.calculateNPV(annualProfit, investment, 5),
        irr: this.calculateIRR([ -investment, ...Array(60).fill(monthlyProfit) ]),
        sensitivity: this.performSensitivityAnalysis(monthlyProfit, investment)
      };
    } catch (error) {
      logger.error('Error calculating ROI:', error);
      throw error;
    }
  }

  private calculateNPV(cashFlow: number, initialInvestment: number, years: number, discountRate: number = 0.1): number {
    let npv = -initialInvestment;
    for (let year = 1; year <= years; year++) {
      npv += cashFlow / Math.pow(1 + discountRate, year);
    }
    return npv;
  }

  private calculateIRR(cashFlows: number[]): number {
    // Simplified IRR calculation
    let rate = 0.1;
    const maxIterations = 100;
    const tolerance = 0.0001;

    for (let i = 0; i < maxIterations; i++) {
      let npv = 0;
      for (let j = 0; j < cashFlows.length; j++) {
        npv += cashFlows[j] / Math.pow(1 + rate, j);
      }

      if (Math.abs(npv) < tolerance) {
        break;
      }

      rate += npv > 0 ? 0.01 : -0.01;
    }

    return rate * 100;
  }

  private performSensitivityAnalysis(monthlyProfit: number, investment: number): any {
    const scenarios = {
      pessimistic: { revenue: monthlyProfit * 0.8, costs: monthlyProfit * 1.2 },
      realistic: { revenue: monthlyProfit, costs: monthlyProfit * 1 },
      optimistic: { revenue: monthlyProfit * 1.2, costs: monthlyProfit * 0.9 }
    };

    return Object.entries(scenarios).map(([scenario, values]) => ({
      scenario,
      profit: values.revenue - values.costs,
      roi: (((values.revenue - values.costs) * 12) / investment) * 100
    }));
  }

  async generateCustomReport(config: BIReportConfig): Promise<any> {
    try {
      logger.info('Generating custom report with config:', config);

      // Generate report based on configuration
      const report = {
        id: Date.now().toString(),
        name: config.name,
        description: config.description,
        generatedAt: new Date().toISOString(),
        data: await this.fetchReportData(config),
        visualizations: config.visualizations,
        metrics: await this.calculateReportMetrics(config)
      };

      return report;
    } catch (error) {
      logger.error('Error generating custom report:', error);
      throw error;
    }
  }

  private async fetchReportData(config: BIReportConfig): Promise<any[]> {
    // Simulated data fetching based on report configuration
    // In a real implementation, this would query the database based on metrics, dimensions, and filters
    return [];
  }

  private async calculateReportMetrics(config: BIReportConfig): Promise<any> {
    // Calculate metrics based on report configuration
    return {};
  }

  async scheduleReport(config: BIReportConfig): Promise<void> {
    try {
      logger.info('Scheduling report:', config);

      // In a real implementation, this would set up a job scheduler
      // For now, we'll just log the schedule
      if (config.schedule) {
        logger.info(`Report ${config.name} scheduled for ${config.schedule.frequency} delivery to ${config.schedule.recipients.join(', ')}`);
      }
    } catch (error) {
      logger.error('Error scheduling report:', error);
      throw error;
    }
  }

  async exportReport(reportId: string, format: 'pdf' | 'excel' | 'json'): Promise<Blob> {
    try {
      logger.info(`Exporting report ${reportId} in ${format} format`);

      // Simulated report export
      const reportData = {
        id: reportId,
        exportedAt: new Date().toISOString(),
        format: format,
        data: 'Sample report data'
      };

      const jsonString = JSON.stringify(reportData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });

      return blob;
    } catch (error) {
      logger.error('Error exporting report:', error);
      throw error;
    }
  }

  subscribeToMetrics(callback: (metrics: BIMetrics) => void): () => void {
    this.subscribers.push(callback);

    // Return unsubscribe function
    return () => {
      const index = this.subscribers.indexOf(callback);
      if (index > -1) {
        this.subscribers.splice(index, 1);
      }
    };
  }

  async setAlerts(config: Array<{
    metric: string;
    condition: 'above' | 'below' | 'change';
    threshold: number;
    notification: string;
  }>): Promise<void> {
    try {
      this.alertConfigs = config;
      logger.info('Alerts configured:', config);

      // In a real implementation, this would set up monitoring and alerting
    } catch (error) {
      logger.error('Error setting alerts:', error);
      throw error;
    }
  }

  // Advanced analytics methods
  async getRealTimeMetrics(): Promise<BIMetrics> {
    try {
      // Get current date range for today
      const today = new Date();
      const dateRange = {
        from: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
        to: today
      };

      return await this.getMetrics(dateRange);
    } catch (error) {
      logger.error('Error getting real-time metrics:', error);
      throw error;
    }
  }

  async getSegmentAnalysis(): Promise<any> {
    try {
      // Simulated customer segmentation analysis
      return {
        segments: [
          {
            name: 'High-Value Clients',
            size: 15,
            characteristics: ['High spending', 'Frequent bookings', 'Premium services'],
            averageValue: 850,
            satisfaction: 4.8
          },
          {
            name: 'Regular Clients',
            size: 45,
            characteristics: ['Moderate spending', 'Regular bookings', 'Various services'],
            averageValue: 320,
            satisfaction: 4.4
          },
          {
            name: 'Occasional Clients',
            size: 30,
            characteristics: ['Low spending', 'Infrequent bookings', 'Price sensitive'],
            averageValue: 180,
            satisfaction: 4.1
          },
          {
            name: 'New Clients',
            size: 10,
            characteristics: ['First-time bookings', 'Experimenting with services'],
            averageValue: 250,
            satisfaction: 4.6
          }
        ],
        recommendations: [
          'Focus retention efforts on Regular Clients to convert to High-Value',
          'Develop loyalty programs for Occasional Clients',
          'Provide exceptional onboarding for New Clients'
        ]
      };
    } catch (error) {
      logger.error('Error performing segment analysis:', error);
      throw error;
    }
  }

  async getLifetimeValueAnalysis(): Promise<any> {
    try {
      // Simulated LTV analysis
      return {
        overallLTV: 1250,
        ltvBySegment: {
          'High-Value': 3200,
          'Regular': 980,
          'Occasional': 420,
          'New': 0
        },
        ltvByService: {
          'Beauty': 1450,
          'Fitness': 1100,
          'Lifestyle': 980
        },
        ltvTrend: [
          { month: 'Jan', ltv: 1100 },
          { month: 'Feb', ltv: 1150 },
          { month: 'Mar', ltv: 1200 },
          { month: 'Apr', ltv: 1250 }
        ],
        retentionRate: 78.5,
        churnRate: 5.2
      };
    } catch (error) {
      logger.error('Error analyzing LTV:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const businessIntelligenceService = new BusinessIntelligenceServiceImpl();
export default businessIntelligenceService;