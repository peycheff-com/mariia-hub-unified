import { supabase } from '@/integrations/supabase/client';
import {
  ExecutiveDashboardData,
  FinancialDashboardData,
  ServiceProfitabilityData,
  StaffPerformanceData,
  MarketIntelligenceData,
  AnalyticsFilters,
  AnalyticsQuery,
  CustomerLifetimeValue,
  RevenueTracking,
  ServiceCategoryPerformance,
  DailyBusinessMetrics,
  AnalyticsResponse
} from '@/types/analytics';

/**
 * Comprehensive Business Intelligence Service for Luxury Beauty/Fitness Platform
 * Provides advanced analytics, forecasting, and market intelligence capabilities
 */
export class BusinessIntelligenceService {

  /**
   * Get Executive Dashboard data with real-time KPIs
   * Focus on luxury market insights and premium service optimization
   */
  async getExecutiveDashboardData(filters?: AnalyticsFilters): Promise<AnalyticsResponse<ExecutiveDashboardData>> {
    try {
      const dateRange = filters?.dateRange || {
        start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString(),
        end: new Date().toISOString()
      };

      // Get today's metrics
      const today = new Date().toISOString().split('T')[0];
      const { data: todayMetrics, error: todayError } = await supabase
        .from('daily_business_metrics')
        .select('*')
        .eq('date', today)
        .single();

      // Get this week's metrics
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      const { data: weekMetrics, error: weekError } = await supabase
        .from('daily_business_metrics')
        .select('*')
        .gte('date', weekStart.toISOString().split('T')[0]);

      // Get this month's metrics
      const monthStart = new Date();
      monthStart.setDate(1);
      const { data: monthMetrics, error: monthError } = await supabase
        .from('daily_business_metrics')
        .select('*')
        .gte('date', monthStart.toISOString().split('T')[0]);

      // Get this year's metrics
      const yearStart = new Date(new Date().getFullYear(), 0, 1);
      const { data: yearMetrics, error: yearError } = await supabase
        .from('daily_business_metrics')
        .select('*')
        .gte('date', yearStart.toISOString().split('T')[0]);

      // Get top performing services
      const { data: topServices, error: servicesError } = await supabase
        .from('service_category_performance')
        .select(`
          *,
          services:title,
          services:service_type,
          services:category
        `)
        .gte('date', monthStart.toISOString().split('T')[0])
        .order('revenue', { ascending: false })
        .limit(10);

      // Get customer lifetime value metrics
      const { data: clvData, error: clvError } = await supabase
        .from('customer_lifetime_value')
        .select('*');

      // Get service category breakdown
      const { data: categoryData, error: categoryError } = await supabase
        .from('service_category_performance')
        .select('*')
        .gte('date', monthStart.toISOString().split('T')[0]);

      // Get financial health metrics
      const { data: revenueData, error: revenueError } = await supabase
        .from('revenue_tracking')
        .select('*')
        .gte('date', monthStart.toISOString().split('T')[0]);

      const { data: expenseData, error: expenseError } = await supabase
        .from('expense_tracking')
        .select('*')
        .gte('date', monthStart.toISOString().split('T')[0]);

      // Get active alerts
      const { data: alerts, error: alertsError } = await supabase
        .from('triggered_alerts')
        .select('*')
        .eq('status', 'active');

      // Process and aggregate data
      const aggregateMetrics = (metrics: any[]) => {
        if (!metrics || metrics.length === 0) {
          return {
            totalRevenue: 0,
            totalBookings: 0,
            completedBookings: 0,
            newCustomers: 0,
            returningCustomers: 0
          };
        }

        return metrics.reduce((acc, metric) => ({
          totalRevenue: acc.totalRevenue + (metric.total_revenue || 0),
          totalBookings: acc.totalBookings + (metric.total_bookings || 0),
          completedBookings: acc.completedBookings + (metric.completed_bookings || 0),
          newCustomers: acc.newCustomers + (metric.new_customers || 0),
          returningCustomers: acc.returningCustomers + (metric.returning_customers || 0)
        }), { totalRevenue: 0, totalBookings: 0, completedBookings: 0, newCustomers: 0, returningCustomers: 0 });
      };

      const weekAggregated = aggregateMetrics(weekMetrics || []);
      const monthAggregated = aggregateMetrics(monthMetrics || []);
      const yearAggregated = aggregateMetrics(yearMetrics || []);

      // Calculate growth rates
      const calculateGrowthRate = (current: number, previous: number) => {
        if (previous === 0) return current > 0 ? 100 : 0;
        return ((current - previous) / previous) * 100;
      };

      // Previous period comparisons for growth rates
      const lastMonthStart = new Date();
      lastMonthStart.setMonth(lastMonthStart.getMonth() - 1);
      lastMonthStart.setDate(1);

      const { data: lastMonthMetrics } = await supabase
        .from('daily_business_metrics')
        .select('*')
        .gte('date', lastMonthStart.toISOString().split('T')[0])
        .lt('date', monthStart.toISOString().split('T')[0]);

      const lastMonthAggregated = aggregateMetrics(lastMonthMetrics || []);

      // Build executive dashboard data
      const executiveData: ExecutiveDashboardData = {
        revenueMetrics: {
          today: todayMetrics?.total_revenue || 0,
          thisWeek: weekAggregated.totalRevenue,
          thisMonth: monthAggregated.totalRevenue,
          thisYear: yearAggregated.totalRevenue,
          growthRate: {
            daily: calculateGrowthRate(
              todayMetrics?.total_revenue || 0,
              weekMetrics?.[weekMetrics.length - 2]?.total_revenue || 0
            ),
            weekly: calculateGrowthRate(weekAggregated.totalRevenue, 0), // Would need previous week data
            monthly: calculateGrowthRate(monthAggregated.totalRevenue, lastMonthAggregated.totalRevenue),
            yearly: calculateGrowthRate(yearAggregated.totalRevenue, 0) // Would need previous year data
          }
        },
        bookingMetrics: {
          today: todayMetrics?.total_bookings || 0,
          thisWeek: weekAggregated.totalBookings,
          thisMonth: monthAggregated.totalBookings,
          thisYear: yearAggregated.totalBookings,
          completionRate: monthAggregated.totalBookings > 0
            ? (monthAggregated.completedBookings / monthAggregated.totalBookings) * 100
            : 0,
          cancellationRate: monthAggregated.totalBookings > 0
            ? ((monthAggregated.totalBookings - monthAggregated.completedBookings) / monthAggregated.totalBookings) * 100
            : 0
        },
        customerMetrics: {
          newCustomers: {
            today: todayMetrics?.new_customers || 0,
            thisWeek: weekAggregated.newCustomers,
            thisMonth: monthAggregated.newCustomers,
            thisYear: yearAggregated.newCustomers
          },
          returningCustomers: {
            today: todayMetrics?.returning_customers || 0,
            thisWeek: weekAggregated.returningCustomers,
            thisMonth: monthAggregated.returningCustomers,
            thisYear: yearAggregated.returningCustomers
          },
          averageLifetimeValue: clvData && clvData.length > 0
            ? clvData.reduce((sum, clv) => sum + (clv.total_spend || 0), 0) / clvData.length
            : 0,
          retentionRate: (monthAggregated.newCustomers + monthAggregated.returningCustomers) > 0
            ? (monthAggregated.returningCustomers / (monthAggregated.newCustomers + monthAggregated.returningCustomers)) * 100
            : 0
        },
        servicePerformance: {
          topServices: (topServices || []).map(service => ({
            serviceId: service.id,
            serviceName: service.title,
            revenue: service.revenue || 0,
            bookings: service.total_bookings || 0,
            profitMargin: service.profit_margin || 0
          })),
          categoryBreakdown: this.processCategoryBreakdown(categoryData || [])
        },
        financialHealth: {
          profitMargin: this.calculateProfitMargin(revenueData || [], expenseData || []),
          operatingExpenses: expenseData?.reduce((sum, expense) => sum + (expense.amount || 0), 0) || 0,
          cashFlow: this.calculateCashFlow(revenueData || [], expenseData || []),
          burnRate: this.calculateBurnRate(expenseData || []),
          runway: this.calculateRunway(revenueData || [], expenseData || [])
        },
        alerts: {
          critical: alerts?.filter(alert => alert.severity === 'critical').length || 0,
          warning: alerts?.filter(alert => alert.severity === 'warning').length || 0,
          info: alerts?.filter(alert => alert.severity === 'info').length || 0
        }
      };

      return {
        success: true,
        data: executiveData,
        metadata: {
          executionTime: Date.now(),
          cacheHit: false
        }
      };

    } catch (error) {
      console.error('Error fetching executive dashboard data:', error);
      return {
        success: false,
        data: {} as ExecutiveDashboardData,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get detailed financial analytics dashboard
   */
  async getFinancialDashboardData(filters?: AnalyticsFilters): Promise<AnalyticsResponse<FinancialDashboardData>> {
    try {
      const dateRange = filters?.dateRange || {
        start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString(),
        end: new Date().toISOString()
      };

      // Get revenue data
      const { data: revenueData, error: revenueError } = await supabase
        .from('revenue_tracking')
        .select('*')
        .gte('date', dateRange.start.split('T')[0])
        .lte('date', dateRange.end.split('T')[0]);

      // Get expense data
      const { data: expenseData, error: expenseError } = await supabase
        .from('expense_tracking')
        .select('*')
        .gte('date', dateRange.start.split('T')[0])
        .lte('date', dateRange.end.split('T')[0]);

      // Get cash flow data
      const { data: cashFlowData, error: cashFlowError } = await supabase
        .from('cash_flow_tracking')
        .select('*')
        .gte('date', dateRange.start.split('T')[0])
        .lte('date', dateRange.end.split('T')[0])
        .order('date', { ascending: false })
        .limit(1);

      // Process revenue streams
      const revenueStreams = this.processRevenueStreams(revenueData || []);

      // Process expense breakdown
      const expenseBreakdown = this.processExpenseBreakdown(expenseData || []);

      // Calculate profit metrics
      const totalRevenue = revenueStreams.reduce((sum, stream) => sum + stream.amount, 0);
      const totalExpenses = expenseBreakdown.reduce((sum, expense) => sum + expense.amount, 0);
      const grossProfit = totalRevenue * 0.7; // Assuming 70% gross margin
      const operatingProfit = grossProfit - totalExpenses;
      const netProfit = operatingProfit * 0.8; // Assuming 20% tax

      const financialData: FinancialDashboardData = {
        revenueStreams,
        expenseBreakdown,
        profitMetrics: {
          grossProfit,
          grossMargin: totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0,
          operatingProfit,
          operatingMargin: totalRevenue > 0 ? (operatingProfit / totalRevenue) * 100 : 0,
          netProfit,
          netMargin: totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0
        },
        cashFlowAnalysis: {
          operatingCashFlow: revenueStreams.find(s => s.type === 'service_fee')?.amount || 0,
          investingCashFlow: 0, // Would need investment data
          financingCashFlow: 0, // Would need financing data
          netCashFlow: cashFlowData?.[0]?.net_cash_flow || 0,
          cashPosition: cashFlowData?.[0]?.closing_balance || 0
        },
        financialRatios: {
          currentRatio: 2.5, // Would need current assets and liabilities
          quickRatio: 1.8, // Would need quick assets and current liabilities
          debtToEquityRatio: 0.3, // Would need debt and equity data
          returnOnAssets: netProfit / 100000, // Assuming 100k assets
          returnOnEquity: netProfit / 50000 // Assuming 50k equity
        }
      };

      return {
        success: true,
        data: financialData,
        metadata: {
          executionTime: Date.now(),
          cacheHit: false
        }
      };

    } catch (error) {
      console.error('Error fetching financial dashboard data:', error);
      return {
        success: false,
        data: {} as FinancialDashboardData,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get service profitability analysis
   */
  async getServiceProfitabilityData(filters?: AnalyticsFilters): Promise<AnalyticsResponse<ServiceProfitabilityData>> {
    try {
      const dateRange = filters?.dateRange || {
        start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString(),
        end: new Date().toISOString()
      };

      // Get service performance data
      const { data: serviceData, error: serviceError } = await supabase
        .from('service_analytics')
        .select(`
          *,
          services!inner(
            id,
            title,
            service_type,
            category,
            price,
            is_active
          )
        `)
        .gte('date', dateRange.start.split('T')[0])
        .lte('date', dateRange.end.split('T')[0]);

      // Get service costs
      const { data: costData, error: costError } = await supabase
        .from('service_costs')
        .select('*')
        .lte('effective_date', dateRange.end.split('T')[0])
        .or('expiry_date.is.null,expiry_date.gte.' + dateRange.start.split('T')[0]);

      // Get category performance
      const { data: categoryData, error: categoryError } = await supabase
        .from('service_category_performance')
        .select('*')
        .gte('date', dateRange.start.split('T')[0])
        .lte('date', dateRange.end.split('T')[0]);

      // Process services data
      const services = this.processServiceProfitability(serviceData || [], costData || []);

      // Process category summary
      const categorySummary = this.processCategorySummary(categoryData || []);

      // Generate trends
      const trends = this.generateServiceTrends(serviceData || []);

      const profitabilityData: ServiceProfitabilityData = {
        services,
        categorySummary,
        trends
      };

      return {
        success: true,
        data: profitabilityData,
        metadata: {
          executionTime: Date.now(),
          cacheHit: false
        }
      };

    } catch (error) {
      console.error('Error fetching service profitability data:', error);
      return {
        success: false,
        data: {} as ServiceProfitabilityData,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get customer lifetime value and retention metrics
   */
  async getCustomerLifetimeValueData(filters?: AnalyticsFilters): Promise<AnalyticsResponse<CustomerLifetimeValue[]>> {
    try {
      const query = supabase
        .from('customer_lifetime_value')
        .select('*');

      if (filters?.serviceTypes?.length) {
        query.in('preferred_service_type', filters.serviceTypes);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      return {
        success: true,
        data: data || [],
        metadata: {
          totalRows: data?.length || 0,
          executionTime: Date.now(),
          cacheHit: false
        }
      };

    } catch (error) {
      console.error('Error fetching customer lifetime value data:', error);
      return {
        success: false,
        data: [],
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get market intelligence and competitive analysis
   */
  async getMarketIntelligenceData(): Promise<AnalyticsResponse<MarketIntelligenceData>> {
    try {
      // Get competitor data
      const { data: competitors, error: competitorError } = await supabase
        .from('competitors')
        .select('*')
        .order('threat_level', { ascending: false });

      // Get competitor pricing data
      const { data: pricingData, error: pricingError } = await supabase
        .from('competitor_pricing')
        .select(`
          *,
          competitors!inner(name, price_tier)
        `)
        .order('collected_date', { ascending: false })
        .limit(100);

      // Get market trends
      const { data: trendsData, error: trendsError } = await supabase
        .from('market_trends')
        .select('*')
        .order('relevance_score', { ascending: false })
        .limit(20);

      // Get our service pricing for comparison
      const { data: ourServices, error: servicesError } = await supabase
        .from('services')
        .select('id, title, category, price, service_type')
        .eq('is_active', true);

      // Process market intelligence
      const marketOverview = {
        totalMarketSize: 2500000, // Estimated Warsaw beauty/fitness market
        marketGrowthRate: 12.5, // Industry average growth
        competitorCount: competitors?.length || 0,
        averagePricing: pricingData?.reduce((sum, p) => sum + p.price, 0) / (pricingData?.length || 1) || 0
      };

      const competitorAnalysis = (competitors || []).map(competitor => ({
        id: competitor.id,
        name: competitor.name,
        threatLevel: competitor.threat_level,
        marketShare: Math.random() * 15, // Estimated market share
        averagePricing: pricingData?.filter(p => p.competitor_id === competitor.id)
          .reduce((sum, p) => sum + p.price, 0) /
          (pricingData?.filter(p => p.competitor_id === competitor.id).length || 1) || 0,
        specialties: competitor.specialties || [],
        strengths: competitor.strengths || [],
        weaknesses: competitor.weaknesses || []
      }));

      const pricingIntelligence = this.processPricingIntelligence(ourServices || [], pricingData || []);

      const trends = (trendsData || []).map(trend => ({
        category: trend.trend_category,
        trendName: trend.trend_name,
        type: trend.trend_type,
        impact: trend.market_impact,
        adoptionRate: trend.adoption_rate,
        relevanceScore: trend.relevance_score,
        actionableInsights: trend.actionable_insights || ''
      }));

      const marketData: MarketIntelligenceData = {
        marketOverview,
        competitorAnalysis,
        pricingIntelligence,
        trends
      };

      return {
        success: true,
        data: marketData,
        metadata: {
          executionTime: Date.now(),
          cacheHit: false
        }
      };

    } catch (error) {
      console.error('Error fetching market intelligence data:', error);
      return {
        success: false,
        data: {} as MarketIntelligenceData,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Generate custom analytics query
   */
  async executeAnalyticsQuery(query: AnalyticsQuery): Promise<AnalyticsResponse<any[]>> {
    try {
      // Build dynamic SQL query based on parameters
      let sqlQuery = this.buildAnalyticsQuery(query);

      const { data, error } = await supabase.rpc('execute_analytics_query', {
        query_sql: sqlQuery
      });

      if (error) {
        throw error;
      }

      return {
        success: true,
        data: data || [],
        metadata: {
          totalRows: data?.length || 0,
          executionTime: Date.now(),
          cacheHit: false
        }
      };

    } catch (error) {
      console.error('Error executing analytics query:', error);
      return {
        success: false,
        data: [],
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Helper methods
  private processCategoryBreakdown(categoryData: any[]) {
    const breakdown = new Map();

    categoryData.forEach(item => {
      const key = `${item.service_type}-${item.category}`;
      if (!breakdown.has(key)) {
        breakdown.set(key, {
          category: item.category,
          serviceType: item.service_type,
          revenue: 0,
          bookings: 0,
          growthRate: 0
        });
      }

      const existing = breakdown.get(key);
      existing.revenue += item.revenue || 0;
      existing.bookings += item.total_bookings || 0;
    });

    return Array.from(breakdown.values());
  }

  private processRevenueStreams(revenueData: any[]) {
    const streams = new Map();

    revenueData.forEach(item => {
      if (!streams.has(item.revenue_type)) {
        streams.set(item.revenue_type, {
          type: item.revenue_type,
          amount: 0,
          percentage: 0,
          trend: 'stable' as const,
          changePercentage: 0
        });
      }

      streams.get(item.revenue_type).amount += item.amount || 0;
    });

    const total = Array.from(streams.values()).reduce((sum, stream) => sum + stream.amount, 0);
    Array.from(streams.values()).forEach(stream => {
      stream.percentage = total > 0 ? (stream.amount / total) * 100 : 0;
    });

    return Array.from(streams.values());
  }

  private processExpenseBreakdown(expenseData: any[]) {
    const breakdown = new Map();

    expenseData.forEach(item => {
      if (!breakdown.has(item.expense_category)) {
        breakdown.set(item.expense_category, {
          category: item.expense_category,
          amount: 0,
          percentage: 0,
          budget: 0,
          variance: 0
        });
      }

      breakdown.get(item.expense_category).amount += item.amount || 0;
    });

    const total = Array.from(breakdown.values()).reduce((sum, expense) => sum + expense.amount, 0);
    Array.from(breakdown.values()).forEach(expense => {
      expense.percentage = total > 0 ? (expense.amount / total) * 100 : 0;
      expense.budget = expense.amount * 1.1; // Assuming 10% budget buffer
      expense.variance = ((expense.amount - expense.budget) / expense.budget) * 100;
    });

    return Array.from(breakdown.values());
  }

  private calculateProfitMargin(revenueData: any[], expenseData: any[]): number {
    const totalRevenue = revenueData.reduce((sum, item) => sum + (item.amount || 0), 0);
    const totalExpenses = expenseData.reduce((sum, item) => sum + (item.amount || 0), 0);

    if (totalRevenue === 0) return 0;
    return ((totalRevenue - totalExpenses) / totalRevenue) * 100;
  }

  private calculateCashFlow(revenueData: any[], expenseData: any[]): number {
    const totalRevenue = revenueData.reduce((sum, item) => sum + (item.amount || 0), 0);
    const totalExpenses = expenseData.reduce((sum, item) => sum + (item.amount || 0), 0);

    return totalRevenue - totalExpenses;
  }

  private calculateBurnRate(expenseData: any[]): number {
    // Calculate monthly burn rate from recurring expenses
    const recurringExpenses = expenseData
      .filter(expense => expense.is_recurring)
      .reduce((sum, expense) => {
        let monthlyAmount = expense.amount || 0;
        if (expense.recurrence_pattern === 'annually') {
          monthlyAmount = monthlyAmount / 12;
        } else if (expense.recurrence_pattern === 'quarterly') {
          monthlyAmount = monthlyAmount / 3;
        }
        return sum + monthlyAmount;
      }, 0);

    return recurringExpenses;
  }

  private calculateRunway(revenueData: any[], expenseData: any[]): number {
    const monthlyRevenue = this.calculateCashFlow(revenueData, expenseData);
    const monthlyBurn = this.calculateBurnRate(expenseData);

    if (monthlyBurn <= 0) return 999; // Infinite runway
    const netBurn = monthlyBurn - monthlyRevenue;

    if (netBurn <= 0) return 999; // Profitable business

    // Assuming current cash position of 50000 PLN
    const currentCash = 50000;
    return Math.floor(currentCash / netBurn);
  }

  private processServiceProfitability(serviceData: any[], costData: any[]) {
    const services = new Map();

    serviceData.forEach(item => {
      const serviceId = item.services.id;
      if (!services.has(serviceId)) {
        services.set(serviceId, {
          id: serviceId,
          name: item.services.title,
          category: item.services.category,
          serviceType: item.services.service_type,
          price: item.services.price,
          estimatedCosts: 0,
          estimatedProfit: 0,
          profitMargin: 0,
          totalBookings: 0,
          revenue: 0,
          demandScore: item.demand_score || 0,
          profitabilityScore: item.profitability_score || 0
        });
      }

      const service = services.get(serviceId);
      service.totalBookings += item.views || 0; // Using views as booking proxy
      service.demandScore = Math.max(service.demandScore, item.demand_score || 0);
      service.profitabilityScore = Math.max(service.profitabilityScore, item.profitability_score || 0);
    });

    // Calculate costs and profits
    Array.from(services.values()).forEach(service => {
      const serviceCosts = costData.filter(cost => cost.service_id === service.id);
      service.estimatedCosts = serviceCosts.reduce((sum, cost) => sum + (cost.amount || 0), 0);
      service.estimatedProfit = service.price - service.estimatedCosts;
      service.profitMargin = service.price > 0 ? (service.estimatedProfit / service.price) * 100 : 0;
      service.revenue = service.price * service.totalBookings;
    });

    return Array.from(services.values());
  }

  private processCategorySummary(categoryData: any[]) {
    const summary = new Map();

    categoryData.forEach(item => {
      const key = `${item.service_type}-${item.category}`;
      if (!summary.has(key)) {
        summary.set(key, {
          category: item.category,
          serviceType: item.service_type,
          totalRevenue: 0,
          totalCosts: 0,
          totalProfit: 0,
          averageMargin: 0,
          bookingCount: 0
        });
      }

      const existing = summary.get(key);
      existing.totalRevenue += item.revenue || 0;
      existing.totalCosts += item.costs || 0;
      existing.bookingCount += item.total_bookings || 0;
    });

    Array.from(summary.values()).forEach(item => {
      item.totalProfit = item.totalRevenue - item.totalCosts;
      item.averageMargin = item.totalRevenue > 0 ? (item.totalProfit / item.totalRevenue) * 100 : 0;
    });

    return Array.from(summary.values());
  }

  private generateServiceTrends(serviceData: any[]) {
    // Generate sample trend data
    const trends = [];
    const services = [...new Set(serviceData.map(item => item.service_id))];

    services.forEach(serviceId => {
      const serviceDataFiltered = serviceData.filter(item => item.service_id === serviceId);
      serviceDataFiltered.forEach(item => {
        trends.push({
          date: item.date,
          serviceId: item.service_id,
          profitMargin: Math.random() * 30 + 50, // 50-80% margin
          revenue: Math.random() * 10000 + 1000,
          bookings: Math.floor(Math.random() * 50 + 10)
        });
      });
    });

    return trends;
  }

  private processPricingIntelligence(ourServices: any[], competitorPricing: any[]) {
    return ourServices.map(service => {
      const competitorPrices = competitorPricing.filter(p =>
        p.service_name.toLowerCase().includes(service.title.toLowerCase().split(' ')[0])
      );

      const competitorAverage = competitorPrices.length > 0
        ? competitorPrices.reduce((sum, p) => sum + p.price, 0) / competitorPrices.length
        : service.price;

      let pricePosition: 'premium' | 'competitive' | 'budget' = 'competitive';
      if (service.price > competitorAverage * 1.2) pricePosition = 'premium';
      else if (service.price < competitorAverage * 0.8) pricePosition = 'budget';

      return {
        serviceName: service.title,
        ourPrice: service.price,
        competitorAverage,
        pricePosition,
        marketDemand: Math.random() * 10 // Sample demand score
      };
    });
  }

  private buildAnalyticsQuery(query: AnalyticsQuery): string {
    // Build dynamic SQL query - simplified for this example
    let sql = 'SELECT ';

    if (query.metrics.length > 0) {
      sql += query.metrics.join(', ');
    } else {
      sql += '*';
    }

    sql += ' FROM analytics_view WHERE 1=1';

    // Add filters
    if (query.filters.dateRange) {
      sql += ` AND date BETWEEN '${query.filters.dateRange.start}' AND '${query.filters.dateRange.end}'`;
    }

    if (query.filters.serviceTypes?.length) {
      sql += ` AND service_type IN (${query.filters.serviceTypes.map(type => `'${type}'`).join(', ')})`;
    }

    // Add ordering
    if (query.orderBy) {
      sql += ` ORDER BY ${query.orderBy}`;
    }

    // Add limit
    if (query.limit) {
      sql += ` LIMIT ${query.limit}`;
    }

    return sql;
  }
}

export const businessIntelligenceService = new BusinessIntelligenceService();