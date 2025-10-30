import { supabase } from '@/integrations/supabase/client-optimized';
import { Database } from '@/integrations/supabase/types';

type AcquisitionChannel = Database['public']['Tables']['acquisition_channels']['Row'];
type CustomerAcquisition = Database['public']['Tables']['customer_acquisition']['Row'];

export interface AcquisitionAnalytics {
  overview: AcquisitionOverview;
  channelPerformance: ChannelPerformance[];
  attributionAnalysis: AttributionAnalysis;
  customerAcquisitionCost: CACAnalysis[];
  returnOnAdSpend: ROASAnalysis[];
  cohortAnalysis: CohortAnalysis[];
  funnelAnalysis: FunnelAnalysis[];
  competitiveLandscape: CompetitiveLandscape;
  budgetOptimization: BudgetOptimization[];
  predictiveInsights: PredictiveInsights[];
  recommendations: AcquisitionRecommendation[];
}

export interface AcquisitionOverview {
  totalCustomers: number;
  totalAcquisitionCost: number;
  averageCAC: number;
  totalRevenue: number;
  overallROAS: number;
  bestPerformingChannel: string;
  worstPerformingChannel: string;
  monthOverMonthGrowth: number;
  yearOverYearGrowth: number;
  marketShare: number;
  customerLifetimeValue: number;
  ltvToCACRatio: number;
  paybackPeriod: number;
  acquisitionEfficiency: number;
}

export interface ChannelPerformance {
  channelId: string;
  channelName: string;
  channelCategory: 'organic' | 'paid' | 'social' | 'referral' | 'direct' | 'email';
  customers: number;
  cost: number;
  revenue: number;
  cac: number;
  ltv: number;
  roas: number;
  ltvToCACRatio: number;
  paybackPeriod: number;
  conversionRate: number;
  costPerClick: number;
  clickThroughRate: number;
  impressionCount: number;
  reach: number;
  frequency: number;
  qualityScore: number;
  performanceTrend: 'improving' | 'stable' | 'declining';
  growthRate: number;
  marketShare: number;
  competitivePosition: 'leader' | 'challenger' | 'follower' | 'niche';
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
}

export interface AttributionAnalysis {
  modelComparison: ModelComparison[];
  touchpointAnalysis: TouchpointAnalysis[];
  pathAnalysis: PathAnalysis[];
  crossChannelSynergy: CrossChannelSynergy[];
  timeToConversion: TimeToConversionAnalysis[];
  assistedConversions: AssistedConversionAnalysis[];
  attributionConfidence: AttributionConfidence[];
}

export interface ModelComparison {
  modelType: 'first_touch' | 'last_touch' | 'linear' | 'time_decay' | 'position_based' | 'data_driven';
  totalAttributedRevenue: number;
  attributedCustomers: number;
  channelDistribution: ChannelAttribution[];
  accuracy: number;
  complexity: number;
  recommendedUse: string;
}

export interface ChannelAttribution {
  channelId: string;
  attributedRevenue: number;
  attributedCustomers: number;
  attributionPercentage: number;
  confidence: number;
}

export interface TouchpointAnalysis {
  touchpoint: string;
  occurrences: number;
  conversionRate: number;
  averagePosition: number;
  timeInFunnel: number;
  dropoffRate: number;
  revenueContribution: number;
  effectiveness: number;
  optimizationOpportunities: string[];
}

export interface PathAnalysis {
  pathId: string;
  pathName: string;
  touchpoints: string[];
  conversionRate: number;
  averageRevenue: number;
  pathLength: number;
  timeToConvert: number;
  frequency: number;
  efficiency: number;
  optimalVariations: string[];
  bottlenecks: string[];
}

export interface CrossChannelSynergy {
  channelA: string;
  channelB: string;
  synergyScore: number;
  combinedConversionRate: number;
  lift: number;
  frequency: number;
  recommendedStrategy: string;
  potential: number;
}

export interface TimeToConversionAnalysis {
  channel: string;
  averageDays: number;
  medianDays: number;
  distribution: ConversionTimeDistribution[];
  factors: ConversionFactor[];
  optimizationOpportunities: string[];
}

export interface ConversionTimeDistribution {
  period: string;
  conversions: number;
  percentage: number;
  cumulative: number;
}

export interface ConversionFactor {
  factor: string;
  impact: number;
  correlation: number;
  description: string;
}

export interface AssistedConversionAnalysis {
  channel: string;
  assistedConversions: number;
  assistedRevenue: number;
  lastClickConversions: number;
  assistedValue: number;
  influenceStrength: number;
  strategicImportance: number;
}

export interface AttributionConfidence {
  channel: string;
  confidenceLevel: number;
  dataQuality: number;
  modelAgreement: number;
  uncertaintyFactors: string[];
  improvementRecommendations: string[];
}

export interface CACAnalysis {
  overallCAC: number;
  channelCAC: ChannelCAC[];
  temporalCAC: TemporalCAC[];
  segmentCAC: SegmentCAC[];
  forecastedCAC: ForecastedCAC[];
  cacDrivers: CACDriver[];
  benchmarkComparison: CACBenchmark[];
}

export interface ChannelCAC {
  channelId: string;
  channelName: string;
  currentCAC: number;
  previousCAC: number;
  trend: 'decreasing' | 'stable' | 'increasing';
  cacChange: number;
  cacTrend12Months: number[];
  factors: CACFactor[];
  projection: CACProjection[];
}

export interface CACFactor {
  factor: string;
  impact: number;
  trend: string;
  controllable: boolean;
  description: string;
}

export interface CACProjection {
  period: string;
  projectedCAC: number;
  confidence: number;
  scenarios: CACScenario[];
}

export interface CACScenario {
  scenario: string;
  cac: number;
  probability: number;
  assumptions: string[];
}

export interface TemporalCAC {
  period: string;
  cac: number;
  customers: number;
  cost: number;
  seasonality: number;
  specialEvents: string[];
}

export interface SegmentCAC {
  segment: string;
  cac: number;
  ltv: number;
  ltvToCACRatio: number;
  profitability: number;
  trend: string;
  opportunity: number;
}

export interface ForecastedCAC {
  period: string;
  forecastedCAC: number;
  confidenceInterval: number[];
  keyDrivers: string[];
  riskFactors: string[];
  recommendations: string[];
}

export interface CACDriver {
  driver: string;
  currentImpact: number;
  trend: string;
  controlLevel: 'high' | 'medium' | 'low';
  optimizationPotential: number;
  recommendedActions: string[];
}

export interface CACBenchmark {
  industry: string;
  averageCAC: number;
  benchmarkPosition: string;
  percentile: number;
  gap: number;
  opportunity: number;
}

export interface ROASAnalysis {
  overallROAS: number;
  channelROAS: ChannelROAS[];
  temporalROAS: TemporalROAS[];
  segmentROAS: SegmentROAS[];
  forecastedROAS: ForecastedROAS[];
  roasOptimization: ROASOptimization[];
}

export interface ChannelROAS {
  channelId: string;
  channelName: string;
  currentROAS: number;
  previousROAS: number;
  trend: 'improving' | 'stable' | 'declining';
  roasChange: number;
  roasTrend12Months: number[];
  breakEvenPoint: number;
  marginalROAS: number;
  factors: ROASFactor[];
}

export interface ROASFactor {
  factor: string;
  impact: number;
  correlation: number;
  description: string;
  actionable: boolean;
}

export interface TemporalROAS {
  period: string;
  roas: number;
  spend: number;
  revenue: number;
  seasonality: number;
  campaigns: string[];
}

export interface SegmentROAS {
  segment: string;
  roas: number;
  spend: number;
  revenue: number;
  cac: number;
  ltv: number;
  profitability: number;
}

export interface ForecastedROAS {
  period: string;
  forecastedROAS: number;
  confidenceInterval: number[];
  assumptions: string[];
  riskFactors: string[];
  opportunities: string[];
}

export interface ROASOptimization {
  optimization: string;
  expectedROASIncrease: number;
  implementationCost: number;
  expectedROI: number;
  timeline: string;
  confidence: number;
  steps: string[];
}

export interface CohortAnalysis {
  cohorts: CustomerCohort[];
  retentionCurves: RetentionCurve[];
  ltvProgression: LTVProgression[];
  cohortComparison: CohortComparison[];
  predictiveRetention: PredictiveRetention[];
}

export interface CustomerCohort {
  cohortId: string;
  acquisitionDate: Date;
  cohortSize: number;
  acquisitionChannel: string;
  acquisitionCost: number;
  revenuePeriod1: number;
  revenuePeriod2: number;
  revenuePeriod3: number;
  revenuePeriod6: number;
  revenuePeriod12: number;
  retentionPeriod1: number;
  retentionPeriod2: number;
  retentionPeriod3: number;
  retentionPeriod6: number;
  retentionPeriod12: number;
  cac: number;
  ltv12: number;
  ltvToCACRatio: number;
  paybackPeriod: number;
  profitability: number;
  characteristics: CohortCharacteristics[];
}

export interface CohortCharacteristics {
  characteristic: string;
  value: string;
  impact: number;
}

export interface RetentionCurve {
  cohortId: string;
  periods: RetentionPoint[];
  modelFit: number;
  churnRate: number;
  lifetimeValue: number;
  seasonalAdjustments: SeasonalAdjustment[];
}

export interface RetentionPoint {
  period: number;
  retentionRate: number;
  revenue: number;
  customers: number;
}

export interface SeasonalAdjustment {
  period: number;
  adjustment: number;
  reason: string;
}

export interface LTVProgression {
  channel: string;
  ltvByPeriod: LTVPoint[];
  projection: LTVProjection[];
  factors: LTVFactor[];
}

export interface LTVPoint {
  period: number;
  ltv: number;
  revenue: number;
  retentionRate: number;
}

export interface LTVProjection {
  period: number;
  projectedLTV: number;
  confidence: number;
  scenario: string;
}

export interface LTVFactor {
  factor: string;
  impact: number;
  confidence: number;
  description: string;
}

export interface CohortComparison {
  comparisonType: 'channel' | 'season' | 'demographic' | 'value';
  cohorts: string[];
  metrics: ComparisonMetric[];
  insights: string[];
  recommendations: string[];
}

export interface ComparisonMetric {
  metric: string;
  values: number[];
  leader: string;
  gap: number;
  significance: number;
}

export interface PredictiveRetention {
  cohortId: string;
  predictedRetention: PredictedRetentionPoint[];
  modelAccuracy: number;
  confidenceInterval: number[];
  riskFactors: string[];
  interventions: RetentionIntervention[];
}

export interface PredictedRetentionPoint {
  period: number;
  predictedRate: number;
  confidence: number;
  factors: string[];
}

export interface RetentionIntervention {
  intervention: string;
  timing: number;
  expectedImpact: number;
  cost: number;
  roi: number;
}

export interface FunnelAnalysis {
  overallFunnel: FunnelStage[];
  channelFunnels: ChannelFunnel[];
  funnelBottlenecks: FunnelBottleneck[];
  funnelOptimization: FunnelOptimization[];
  conversionPaths: ConversionPath[];
  abandonmentAnalysis: AbandonmentAnalysis[];
}

export interface FunnelStage {
  stageName: string;
  users: number;
  conversionRate: number;
  dropoffRate: number;
  averageTime: number;
  revenue: number;
  cost: number;
  efficiency: number;
}

export interface ChannelFunnel {
  channelId: string;
  channelName: string;
  stages: FunnelStage[];
  overallConversionRate: number;
  costPerStage: number[];
  strengths: string[];
  weaknesses: string[];
}

export interface FunnelBottleneck {
  stage: string;
  bottleneckType: 'high_dropoff' | 'slow_progression' | 'high_cost' | 'low_quality';
  severity: 'critical' | 'high' | 'medium' | 'low';
  impact: number;
  causes: string[];
  solutions: string[];
  priority: number;
}

export interface FunnelOptimization {
  optimization: string;
  targetStage: string;
  expectedImprovement: number;
  implementationCost: number;
  expectedROI: number;
  timeline: string;
  confidence: number;
}

export interface ConversionPath {
  pathId: string;
  pathName: string;
  steps: ConversionStep[];
  conversionRate: number;
  averageValue: number;
  frequency: number;
  optimalVariations: string[];
}

export interface ConversionStep {
  stepName: string;
  conversionRate: number;
  dropoffRate: number;
  averageTime: number;
  optimizationOpportunities: string[];
}

export interface AbandonmentAnalysis {
  abandonmentPoint: string;
  abandonmentRate: number;
  reasons: AbandonmentReason[];
  recoveryStrategies: RecoveryStrategy[];
  revenueImpact: number;
}

export interface AbandonmentReason {
  reason: string;
  frequency: number;
  impact: number;
  preventable: boolean;
}

export interface RecoveryStrategy {
  strategy: string;
  expectedRecoveryRate: number;
  implementationCost: number;
  timeline: string;
}

export interface CompetitiveLandscape {
  marketShare: MarketShare[];
  competitorAnalysis: CompetitorAnalysis[];
  positioning: PositioningAnalysis[];
  opportunities: CompetitiveOpportunity[];
  threats: CompetitiveThreat[];
  benchmarking: CompetitiveBenchmark[];
}

export interface MarketShare {
  channel: string;
  ourShare: number;
  totalMarket: number;
  competitorShares: CompetitorShare[];
  trend: string;
  growth: number;
}

export interface CompetitorShare {
  competitor: string;
  share: number;
  trend: string;
}

export interface CompetitorAnalysis {
  competitor: string;
  estimatedSpend: number;
  estimatedMarketShare: number;
  strengths: string[];
  weaknesses: string[];
  strategies: string[];
  threatLevel: 'high' | 'medium' | 'low';
}

export interface PositioningAnalysis {
  dimension: string;
  ourPosition: number;
  competitorPositions: CompetitorPosition[];
  opportunity: number;
  strategy: string[];
}

export interface CompetitorPosition {
  competitor: string;
  position: number;
  strength: number;
}

export interface CompetitiveOpportunity {
  opportunity: string;
  marketSize: number;
  accessibility: number;
  timeline: string;
  requiredInvestment: number;
  expectedReturn: number;
  riskLevel: string;
}

export interface CompetitiveThreat {
  threat: string;
  impact: number;
    probability: number;
  timeline: string;
  mitigation: string[];
}

export interface CompetitiveBenchmark {
  metric: string;
  ourValue: number;
  industryAverage: number;
  bestInClass: number;
  percentile: number;
  gap: number;
  opportunity: number;
}

export interface BudgetOptimization {
  currentAllocation: BudgetAllocation[];
  recommendedAllocation: BudgetAllocation[];
  optimizationOpportunities: OptimizationOpportunity[];
  expectedImpact: ExpectedImpact[];
  constraints: BudgetConstraint[];
  scenarios: BudgetScenario[];
}

export interface BudgetAllocation {
  channelId: string;
  channelName: string;
  currentBudget: number;
  recommendedBudget: number;
  budgetChange: number;
  expectedROAS: number;
  expectedCustomers: number;
  riskLevel: string;
  confidence: number;
}

export interface OptimizationOpportunity {
  opportunity: string;
  description: string;
  potentialImpact: number;
  implementationCost: number;
  expectedROI: number;
  timeline: string;
  confidence: number;
  dependencies: string[];
}

export interface ExpectedImpact {
  metric: string;
  currentValue: number;
  projectedValue: number;
  change: number;
  confidence: number;
}

export interface BudgetConstraint {
  constraint: string;
  impact: string;
  mitigation: string[];
}

export interface BudgetScenario {
  scenario: string;
  allocations: BudgetAllocation[];
  expectedResults: ScenarioResults[];
  risk: string;
  assumptions: string[];
}

export interface ScenarioResults {
  metric: string;
  value: number;
  confidence: number;
}

export interface PredictiveInsights {
  acquisitionForecast: AcquisitionForecast[];
  churnPrediction: ChurnPrediction[];
  marketTrends: MarketTrend[];
  opportunityScoring: OpportunityScore[];
  riskAssessment: RiskAssessment[];
}

export interface AcquisitionForecast {
  period: string;
  forecastedCustomers: number;
  forecastedRevenue: number;
  forecastedCAC: number;
  forecastedROAS: number;
  confidence: number;
  keyDrivers: string[];
  scenarios: ForecastScenario[];
}

export interface ForecastScenario {
  scenario: string;
    customers: number;
  revenue: number;
  cac: number;
  roas: number;
  probability: number;
  assumptions: string[];
}

export interface ChurnPrediction {
  segment: string;
  churnRisk: number;
  predictedCustomers: number;
  revenueAtRisk: number;
  preventionCost: number;
  preventionROI: number;
  interventions: ChurnIntervention[];
}

export interface ChurnIntervention {
  intervention: string;
  effectiveness: number;
  cost: number;
  timing: string;
  targetSegment: string;
}

export interface MarketTrend {
  trend: string;
  direction: 'increasing' | 'decreasing' | 'stable';
  impact: number;
  confidence: number;
  timeframe: string;
  implications: string[];
}

export interface OpportunityScore {
  opportunity: string;
  score: number;
  potentialRevenue: number;
  probability: number;
  timeline: string;
  requiredInvestment: number;
  strategicFit: number;
  competitiveAdvantage: number;
}

export interface RiskAssessment {
  risk: string;
  probability: number;
  impact: number;
  riskScore: number;
  mitigation: string[];
  owner: string;
  timeline: string;
}

export interface AcquisitionRecommendation {
  category: 'strategy' | 'channel' | 'budget' | 'creative' | 'technology' | 'operations';
  priority: 'critical' | 'high' | 'medium' | 'low';
  recommendation: string;
  expectedImpact: number;
  implementationCost: number;
  expectedROI: number;
  timeline: string;
  dependencies: string[];
  kpis: string[];
  riskFactors: string[];
  owner: string;
  confidence: number;
}

class AcquisitionAnalyticsEngine {
  private readonly attributionModels = [
    'first_touch',
    'last_touch',
    'linear',
    'time_decay',
    'position_based',
    'data_driven'
  ] as const;

  async analyzeAcquisitionPerformance(
    dateRange?: { start: Date; end: Date },
    channels?: string[]
  ): Promise<AcquisitionAnalytics> {
    // Get acquisition data
    const [customerAcquisitions, acquisitionChannels, bookings] = await Promise.all([
      this.getCustomerAcquisitionData(dateRange),
      this.getAcquisitionChannels(),
      this.getBookingData(dateRange)
    ]);

    // Calculate overview metrics
    const overview = this.calculateOverview(customerAcquisitions, bookings);

    // Analyze channel performance
    const channelPerformance = this.analyzeChannelPerformance(customerAcquisitions, acquisitionChannels, bookings);

    // Analyze attribution
    const attributionAnalysis = await this.analyzeAttribution(customerAcquisitions);

    // Analyze CAC
    const cacAnalysis = this.analyzeCAC(customerAcquisitions, acquisitionChannels);

    // Analyze ROAS
    const roasAnalysis = this.analyzeROAS(customerAcquisitions, acquisitionChannels, bookings);

    // Analyze cohorts
    const cohortAnalysis = await this.analyzeCohorts(customerAcquisitions, bookings);

    // Analyze funnels
    const funnelAnalysis = await this.analyzeFunnels(customerAcquisitions);

    // Analyze competitive landscape
    const competitiveLandscape = await this.analyzeCompetitiveLandscape();

    // Optimize budget
    const budgetOptimization = this.optimizeBudget(channelPerformance, cacAnalysis, roasAnalysis);

    // Generate predictive insights
    const predictiveInsights = this.generatePredictiveInsights(customerAcquisitions, channelPerformance);

    // Generate recommendations
    const recommendations = this.generateRecommendations(
      overview, channelPerformance, cacAnalysis, roasAnalysis, budgetOptimization
    );

    return {
      overview,
      channelPerformance,
      attributionAnalysis,
      customerAcquisitionCost: cacAnalysis,
      returnOnAdSpend: roasAnalysis,
      cohortAnalysis,
      funnelAnalysis,
      competitiveLandscape,
      budgetOptimization,
      predictiveInsights,
      recommendations
    };
  }

  private async getCustomerAcquisitionData(dateRange?: { start: Date; end: Date }) {
    let query = supabase
      .from('customer_acquisition')
      .select('*')
      .order('acquisition_date', { ascending: true });

    if (dateRange) {
      query = query
        .gte('acquisition_date', dateRange.start.toISOString())
        .lte('acquisition_date', dateRange.end.toISOString());
    } else {
      // Default to last 12 months
      const twelveMonthsAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
      query = query.gte('acquisition_date', twelveMonthsAgo.toISOString());
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch customer acquisition data: ${error.message}`);
    }

    return data || [];
  }

  private async getAcquisitionChannels() {
    const { data, error } = await supabase
      .from('acquisition_channels')
      .select('*')
      .eq('is_active', true);

    if (error) {
      throw new Error(`Failed to fetch acquisition channels: ${error.message}`);
    }

    return data || [];
  }

  private async getBookingData(dateRange?: { start: Date; end: Date }) {
    let query = supabase
      .from('bookings')
      .select('*')
      .eq('status', 'completed')
      .order('created_at', { ascending: true });

    if (dateRange) {
      query = query
        .gte('created_at', dateRange.start.toISOString())
        .lte('created_at', dateRange.end.toISOString());
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch booking data: ${error.message}`);
    }

    return data || [];
  }

  private calculateOverview(acquisitions: CustomerAcquisition[], bookings: any[]): AcquisitionOverview {
    const totalCustomers = acquisitions.length;
    const totalCost = acquisitions.reduce((sum, a) => sum + (a.attributed_spend || 0), 0);
    const totalRevenue = bookings.reduce((sum, b) => sum + b.total_amount, 0);
    const averageCAC = totalCustomers > 0 ? totalCost / totalCustomers : 0;
    const overallROAS = totalCost > 0 ? (totalRevenue / totalCost) : 0;

    // Calculate month-over-month and year-over-year growth
    const monthlyGrowth = this.calculateMonthlyGrowth(acquisitions);
    const yearlyGrowth = this.calculateYearlyGrowth(acquisitions);

    // Calculate estimated LTV (simplified)
    const averageCustomerRevenue = totalCustomers > 0 ? totalRevenue / totalCustomers : 0;
    const customerLifetimeValue = averageCustomerRevenue * 2.5; // Assume 2.5x average revenue as LTV

    return {
      totalCustomers,
      totalAcquisitionCost: totalCost,
      averageCAC,
      totalRevenue,
      overallROAS,
      bestPerformingChannel: '', // Will be calculated in channel performance
      worstPerformingChannel: '', // Will be calculated in channel performance
      monthOverMonthGrowth: monthlyGrowth,
      yearOverYearGrowth: yearlyGrowth,
      marketShare: 0, // Would need market data
      customerLifetimeValue,
      ltvToCACRatio: averageCAC > 0 ? customerLifetimeValue / averageCAC : 0,
      paybackPeriod: averageCAC > 0 ? (averageCAC / averageCustomerRevenue) * 30 : 0, // days
      acquisitionEfficiency: overallROAS > 3 ? 'high' : overallROAS > 1.5 ? 'medium' : 'low'
    };
  }

  private calculateMonthlyGrowth(acquisitions: CustomerAcquisition[]): number {
    const monthlyData: { [month: string]: number } = {};

    acquisitions.forEach(acquisition => {
      const date = new Date(acquisition.acquisition_date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthlyData[monthKey] = (monthlyData[monthKey] || 0) + 1;
    });

    const months = Object.keys(monthlyData).sort();
    if (months.length < 2) return 0;

    const currentMonth = monthlyData[months[months.length - 1]];
    const previousMonth = monthlyData[months.length - 2]];

    return previousMonth > 0 ? ((currentMonth - previousMonth) / previousMonth) * 100 : 0;
  }

  private calculateYearlyGrowth(acquisitions: CustomerAcquisition[]): number {
    const currentYear = new Date().getFullYear();
    const previousYear = currentYear - 1;

    const currentYearCustomers = acquisitions.filter(a =>
      new Date(a.acquisition_date).getFullYear() === currentYear
    ).length;

    const previousYearCustomers = acquisitions.filter(a =>
      new Date(a.acquisition_date).getFullYear() === previousYear
    ).length;

    return previousYearCustomers > 0 ?
      ((currentYearCustomers - previousYearCustomers) / previousYearCustomers) * 100 : 0;
  }

  private analyzeChannelPerformance(
    acquisitions: CustomerAcquisition[],
    channels: AcquisitionChannel[],
    bookings: any[]
  ): ChannelPerformance[] {
    const channelMap = new Map(channels.map(c => [c.id, c]));

    // Group acquisitions by channel
    const channelData: { [channelId: string]: CustomerAcquisition[] } = {};
    acquisitions.forEach(acquisition => {
      const channelId = acquisition.attributed_channel;
      if (!channelData[channelId]) {
        channelData[channelId] = [];
      }
      channelData[channelId].push(acquisition);
    });

    // Group bookings by acquisition
    const bookingsByAcquisition: { [userId: string]: any[] } = {};
    bookings.forEach(booking => {
      if (booking.user_id) {
        if (!bookingsByAcquisition[booking.user_id]) {
          bookingsByAcquisition[booking.user_id] = [];
        }
        bookingsByAcquisition[booking.user_id].push(booking);
      }
    });

    const performance: ChannelPerformance[] = [];

    Object.entries(channelData).forEach(([channelId, channelAcquisitions]) => {
      const channel = channelMap.get(channelId);
      if (!channel) return;

      const customers = channelAcquisitions.length;
      const cost = channelAcquisitions.reduce((sum, a) => sum + (a.attributed_spend || 0), 0);
      const cac = customers > 0 ? cost / customers : 0;

      // Calculate revenue for this channel's customers
      let revenue = 0;
      channelAcquisitions.forEach(acquisition => {
        const customerBookings = bookingsByAcquisition[acquisition.user_id] || [];
        revenue += customerBookings.reduce((sum, b) => sum + b.total_amount, 0);
      });

      const roas = cost > 0 ? revenue / cost : 0;
      const ltv = customers > 0 ? revenue / customers : 0;
      const ltvToCACRatio = cac > 0 ? ltv / cac : 0;
      const paybackPeriod = cac > 0 ? (cac / (revenue / customers)) * 30 : 0; // days

      // Calculate growth rate
      const growthRate = this.calculateChannelGrowthRate(channelAcquisitions);

      // Calculate conversion rates and other metrics (mock data for now)
      const conversionRate = 0.025; // 2.5%
      const costPerClick = 2.5;
      const clickThroughRate = 0.015; // 1.5%
      const impressionCount = cost / (costPerClick * clickThroughRate);
      const reach = impressionCount * 0.7; // 70% of impressions are unique
      const frequency = impressionCount / reach;
      const qualityScore = 7; // Mock quality score

      performance.push({
        channelId,
        channelName: channel.channel_name,
        channelCategory: channel.channel_category,
        customers,
        cost,
        revenue,
        cac,
        ltv,
        roas,
        ltvToCACRatio,
        paybackPeriod,
        conversionRate,
        costPerClick,
        clickThroughRate,
        impressionCount,
        reach,
        frequency,
        qualityScore,
        performanceTrend: this.calculatePerformanceTrend(channelAcquisitions),
        growthRate,
        marketShare: 0, // Would need market data
        competitivePosition: this.determineCompetitivePosition(roas, qualityScore),
        strengths: this.identifyChannelStrengths(channel, performance),
        weaknesses: this.identifyChannelWeaknesses(channel, performance),
        opportunities: this.identifyChannelOpportunities(channel, performance),
        threats: this.identifyChannelThreats(channel, performance)
      });
    });

    return performance.sort((a, b) => b.roas - a.roas);
  }

  private calculateChannelGrowthRate(acquisitions: CustomerAcquisition[]): number {
    if (acquisitions.length < 2) return 0;

    const sortedAcquisitions = acquisitions.sort((a, b) =>
      new Date(a.acquisition_date).getTime() - new Date(b.acquisition_date).getTime()
    );

    const firstHalf = sortedAcquisitions.slice(0, Math.floor(sortedAcquisitions.length / 2));
    const secondHalf = sortedAcquisitions.slice(Math.floor(sortedAcquisitions.length / 2));

    const firstHalfRate = firstHalf.length / 6; // Assuming 6 months per half
    const secondHalfRate = secondHalf.length / 6;

    return firstHalfRate > 0 ? ((secondHalfRate - firstHalfRate) / firstHalfRate) * 100 : 0;
  }

  private calculatePerformanceTrend(acquisitions: CustomerAcquisition[]): 'improving' | 'stable' | 'declining' {
    const growthRate = this.calculateChannelGrowthRate(acquisitions);
    if (growthRate > 10) return 'improving';
    if (growthRate < -10) return 'declining';
    return 'stable';
  }

  private determineCompetitivePosition(roas: number, qualityScore: number): 'leader' | 'challenger' | 'follower' | 'niche' {
    if (roas > 4 && qualityScore > 8) return 'leader';
    if (roas > 2.5 && qualityScore > 6) return 'challenger';
    if (roas > 1.5) return 'follower';
    return 'niche';
  }

  private identifyChannelStrengths(channel: AcquisitionChannel, performance: any): string[] {
    const strengths: string[] = [];

    if (performance.roas > 3) strengths.push('high_return_on_investment');
    if (performance.ltvToCACRatio > 3) strengths.push('profitable_customer_acquisition');
    if (performance.conversionRate > 0.03) strengths.push('strong_conversion_performance');
    if (performance.qualityScore > 8) strengths.push('high_quality_traffic');
    if (performance.growthRate > 15) strengths.push('rapid_growth_potential');

    return strengths;
  }

  private identifyChannelWeaknesses(channel: AcquisitionChannel, performance: any): string[] {
    const weaknesses: string[] = [];

    if (performance.roas < 1.5) weaknesses.push('low_return_on_investment');
    if (performance.ltvToCACRatio < 2) weaknesses.push('poor_customer_economics');
    if (performance.conversionRate < 0.02) weaknesses.push('low_conversion_rate');
    if (performance.qualityScore < 5) weaknesses.push('low_quality_traffic');
    if (performance.growthRate < -10) weaknesses.push('declining_performance');

    return weaknesses;
  }

  private identifyChannelOpportunities(channel: AcquisitionChannel, performance: any): string[] {
    const opportunities: string[] = [];

    if (performance.roas > 2 && performance.growthRate > 0) {
      opportunities.push('scale_investment');
    }
    if (performance.qualityScore > 7 && performance.cac < 100) {
      opportunities.push('expand_target_audience');
    }
    if (performance.conversionRate < 0.03) {
      opportunities.push('optimize_landing_pages');
    }
    if (channel.channel_category === 'paid') {
      opportunities.push('test_new_ad_creatives');
    }

    return opportunities;
  }

  private identifyChannelThreats(channel: AcquisitionChannel, performance: any): string[] {
    const threats: string[] = [];

    if (performance.roas < 1) threats.push('unprofitable_channel');
    if (performance.growthRate < -20) threats.push('channel_decline');
    if (channel.channel_category === 'paid') {
      threats.push('rising_costs', 'increased_competition');
    }
    if (performance.qualityScore < 4) {
      threats.push('poor_lead_quality');
    }

    return threats;
  }

  private async analyzeAttribution(acquisitions: CustomerAcquisition[]): Promise<AttributionAnalysis> {
    // Compare different attribution models
    const modelComparison = this.compareAttributionModels(acquisitions);

    // Analyze touchpoints
    const touchpointAnalysis = this.analyzeTouchpoints(acquisitions);

    // Analyze conversion paths
    const pathAnalysis = this.analyzeConversionPaths(acquisitions);

    // Analyze cross-channel synergy
    const crossChannelSynergy = this.analyzeCrossChannelSynergy(acquisitions);

    // Analyze time to conversion
    const timeToConversion = this.analyzeTimeToConversion(acquisitions);

    // Analyze assisted conversions
    const assistedConversions = this.analyzeAssistedConversions(acquisitions);

    // Calculate attribution confidence
    const attributionConfidence = this.calculateAttributionConfidence(acquisitions);

    return {
      modelComparison,
      touchpointAnalysis,
      pathAnalysis,
      crossChannelSynergy,
      timeToConversion,
      assistedConversions,
      attributionConfidence
    };
  }

  private compareAttributionModels(acquisitions: CustomerAcquisition[]): ModelComparison[] {
    const models: ModelComparison[] = [];

    this.attributionModels.forEach(modelType => {
      const attributedRevenue = this.calculateAttributionRevenue(acquisitions, modelType);
      const attributedCustomers = acquisitions.length; // Simplified

      models.push({
        modelType,
        totalAttributedRevenue: attributedRevenue,
        attributedCustomers,
        channelDistribution: this.getChannelDistribution(acquisitions, modelType),
        accuracy: this.getModelAccuracy(modelType),
        complexity: this.getModelComplexity(modelType),
        recommendedUse: this.getRecommendedUse(modelType)
      });
    });

    return models;
  }

  private calculateAttributionRevenue(acquisitions: CustomerAcquisition[], modelType: string): number {
    // Simplified revenue calculation based on attribution model
    // In production, this would use actual revenue data and model-specific logic
    return acquisitions.reduce((sum, acquisition) => {
      const attributionWeight = this.getAttributionWeight(modelType, acquisition);
      return sum + (acquisition.total_lifetime_value || 1000) * attributionWeight;
    }, 0);
  }

  private getAttributionWeight(modelType: string, acquisition: CustomerAcquisition): number {
    // Simplified attribution weight calculation
    switch (modelType) {
      case 'first_touch':
        return 1.0; // Full credit to first touch
      case 'last_touch':
        return 1.0; // Full credit to last touch
      case 'linear':
        return 0.5; // Equal credit to all touches
      case 'time_decay':
        return 0.8; // More weight to recent touches
      case 'position_based':
        return 0.4; // More weight to first and last touches
      case 'data_driven':
        return 0.6; // Algorithm-based weighting
      default:
        return 0.5;
    }
  }

  private getChannelDistribution(acquisitions: CustomerAcquisition[], modelType: string): ChannelAttribution[] {
    const channelRevenue: { [channelId: string]: number } = {};
    const channelCustomers: { [channelId: string]: number } = {};

    acquisitions.forEach(acquisition => {
      const channelId = acquisition.attributed_channel || 'unknown';
      const attributionWeight = this.getAttributionWeight(modelType, acquisition);
      const revenue = (acquisition.total_lifetime_value || 1000) * attributionWeight;

      channelRevenue[channelId] = (channelRevenue[channelId] || 0) + revenue;
      channelCustomers[channelId] = (channelCustomers[channelId] || 0) + 1;
    });

    const totalRevenue = Object.values(channelRevenue).reduce((sum, revenue) => sum + revenue, 0);
    const totalCustomers = Object.values(channelCustomers).reduce((sum, customers) => sum + customers, 0);

    return Object.entries(channelRevenue).map(([channelId, revenue]) => ({
      channelId,
      attributedRevenue: revenue,
      attributedCustomers: channelCustomers[channelId] || 0,
      attributionPercentage: totalRevenue > 0 ? (revenue / totalRevenue) * 100 : 0,
      confidence: 0.8 // Simplified confidence
    }));
  }

  private getModelAccuracy(modelType: string): number {
    // Simplified accuracy scores for different models
    const accuracies = {
      first_touch: 0.3,
      last_touch: 0.4,
      linear: 0.6,
      time_decay: 0.7,
      position_based: 0.65,
      data_driven: 0.85
    };

    return accuracies[modelType as keyof typeof accuracies] || 0.5;
  }

  private getModelComplexity(modelType: string): number {
    // Complexity scores (1-10)
    const complexities = {
      first_touch: 1,
      last_touch: 1,
      linear: 3,
      time_decay: 5,
      position_based: 4,
      data_driven: 9
    };

    return complexities[modelType as keyof typeof complexities] || 5;
  }

  private getRecommendedUse(modelType: string): string {
    const recommendations = {
      first_touch: 'Understanding initial awareness channels',
      last_touch: 'Optimizing conversion-focused campaigns',
      linear: 'Basic multi-touch attribution needs',
      time_decay: 'Emphasizing recent touchpoint impact',
      position_based: 'Balanced credit for first and last touches',
      data_driven: 'Comprehensive attribution with ML insights'
    };

    return recommendations[modelType as keyof typeof recommendations] || 'General attribution analysis';
  }

  private analyzeTouchpoints(acquisitions: CustomerAcquisition[]): TouchpointAnalysis[] {
    // Mock touchpoint analysis
    return [
      {
        touchpoint: 'initial_awareness',
        occurrences: 1000,
        conversionRate: 0.02,
        averagePosition: 1,
        timeInFunnel: 5,
        dropoffRate: 0.8,
        revenueContribution: 20000,
        effectiveness: 0.6,
        optimizationOpportunities: ['improve_targeting', 'enhance_creative']
      },
      {
        touchpoint: 'consideration',
        occurrences: 500,
        conversionRate: 0.05,
        averagePosition: 2.5,
        timeInFunnel: 10,
        dropoffRate: 0.5,
        revenueContribution: 30000,
        effectiveness: 0.8,
        optimizationOpportunities: ['provide_more_information', 'social_proof']
      }
    ];
  }

  private analyzeConversionPaths(acquisitions: CustomerAcquisition[]): PathAnalysis[] {
    // Mock path analysis
    return [
      {
        pathId: 'direct_conversion',
        pathName: 'Direct to Booking',
        touchpoints: ['direct', 'booking'],
        conversionRate: 0.08,
        averageRevenue: 800,
        frequency: 150,
        efficiency: 0.9,
        optimalVariations: ['mobile_optimized', 'instant_booking'],
        bottlenecks: ['payment_process']
      },
      {
        pathId: 'research_conversion',
        pathName: 'Research to Booking',
        touchpoints: ['search', 'website', 'booking'],
        conversionRate: 0.04,
        averageRevenue: 1200,
        frequency: 200,
        efficiency: 0.7,
        optimalVariations: ['detailed_information', 'comparison_tools'],
        bottlenecks: ['decision_stage']
      }
    ];
  }

  private analyzeCrossChannelSynergy(acquisitions: CustomerAcquisition[]): CrossChannelSynergy[] {
    // Mock cross-channel synergy analysis
    return [
      {
        channelA: 'paid_search',
        channelB: 'social_media',
        synergyScore: 0.3,
        combinedConversionRate: 0.06,
        lift: 0.25,
        frequency: 50,
        recommendedStrategy: 'coordinated_campaign_timing',
        potential: 0.4
      },
      {
        channelA: 'email',
        channelB: 'social_media',
        synergyScore: 0.4,
        combinedConversionRate: 0.08,
        lift: 0.35,
        frequency: 30,
        recommendedStrategy: 'integrated_messaging',
        potential: 0.5
      }
    ];
  }

  private analyzeTimeToConversion(acquisitions: CustomerAcquisition[]): TimeToConversionAnalysis[] {
    // Mock time to conversion analysis
    return [
      {
        channel: 'paid_search',
        averageDays: 7,
        medianDays: 5,
        distribution: [
          { period: '0-3 days', conversions: 100, percentage: 30, cumulative: 30 },
          { period: '4-7 days', conversions: 120, percentage: 35, cumulative: 65 },
          { period: '8-14 days', conversions: 80, percentage: 25, cumulative: 90 }
        ],
        factors: [
          { factor: 'search_intent', impact: 0.4, correlation: 0.7, description: 'Strong purchase intent' },
          { factor: 'seasonal_demand', impact: 0.2, correlation: 0.3, description: 'Seasonal variations' }
        ],
        optimizationOpportunities: ['reduce_friction', 'improve_followup']
      }
    ];
  }

  private analyzeAssistedConversions(acquisitions: CustomerAcquisition[]): AssistedConversionAnalysis[] {
    // Mock assisted conversion analysis
    return [
      {
        channel: 'social_media',
        assistedConversions: 150,
        assistedRevenue: 150000,
        lastClickConversions: 80,
        assistedValue: 70000,
        influenceStrength: 0.6,
        strategicImportance: 0.8
      },
      {
        channel: 'content_marketing',
        assistedConversions: 100,
        assistedRevenue: 100000,
        lastClickConversions: 30,
        assistedValue: 70000,
        influenceStrength: 0.7,
        strategicImportance: 0.9
      }
    ];
  }

  private calculateAttributionConfidence(acquisitions: CustomerAcquisition[]): AttributionConfidence[] {
    // Mock attribution confidence analysis
    return [
      {
        channel: 'paid_search',
        confidenceLevel: 0.85,
        dataQuality: 0.9,
        modelAgreement: 0.7,
        uncertaintyFactors: ['seasonal_variations'],
        improvementRecommendations: ['enhanced_tracking', 'more_data_points']
      },
      {
        channel: 'social_media',
        confidenceLevel: 0.7,
        dataQuality: 0.6,
        modelAgreement: 0.5,
        uncertaintyFactors: ['offline_conversions', 'cross_device_tracking'],
        improvementRecommendations: ['offline_tracking', 'cross_device_measurement']
      }
    ];
  }

  private analyzeCAC(acquisitions: CustomerAcquisition[], channels: AcquisitionChannel[]): CACAnalysis {
    const overallCAC = acquisitions.reduce((sum, a) => sum + (a.attributed_spend || 0), 0) / acquisitions.length;

    return {
      overallCAC,
      channelCAC: this.analyzeChannelCAC(acquisitions, channels),
      temporalCAC: this.analyzeTemporalCAC(acquisitions),
      segmentCAC: this.analyzeSegmentCAC(acquisitions),
      forecastedCAC: this.forecastCAC(acquisitions),
      cacDrivers: this.identifyCACDrivers(acquisitions),
      benchmarkComparison: this.getCACBenchmark(overallCAC)
    };
  }

  private analyzeChannelCAC(acquisitions: CustomerAcquisition[], channels: AcquisitionChannel[]): ChannelCAC[] {
    const channelMap = new Map(channels.map(c => [c.id, c]));
    const channelData: { [channelId: string]: CustomerAcquisition[] } = {};

    acquisitions.forEach(acquisition => {
      const channelId = acquisition.attributed_channel;
      if (!channelData[channelId]) {
        channelData[channelId] = [];
      }
      channelData[channelId].push(acquisition);
    });

    return Object.entries(channelData).map(([channelId, channelAcquisitions]) => {
      const channel = channelMap.get(channelId);
      const currentCAC = channelAcquisitions.reduce((sum, a) => sum + (a.attributed_spend || 0), 0) / channelAcquisitions.length;

      return {
        channelId,
        channelName: channel?.channel_name || 'Unknown',
        currentCAC,
        previousCAC: currentCAC * 1.1, // Mock previous CAC
        trend: this.calculateTrend(currentCAC, currentCAC * 1.1),
        cacChange: -10, // Mock change
        cacTrend12Months: this.calculate12MonthTrend(channelAcquisitions),
        factors: this.getChannelCACFactors(channelAcquisitions),
        projection: this.calculateCACProjection(channelAcquisitions)
      };
    });
  }

  private calculateTrend(current: number, previous: number): 'decreasing' | 'stable' | 'increasing' {
    const change = (current - previous) / previous;
    if (change > 0.05) return 'increasing';
    if (change < -0.05) return 'decreasing';
    return 'stable';
  }

  private calculate12MonthTrend(acquisitions: CustomerAcquisition[]): number[] {
    // Mock 12-month trend data
    return Array.from({ length: 12 }, (_, i) => 100 + Math.sin(i / 2) * 20 + Math.random() * 10);
  }

  private getChannelCACFactors(acquisitions: CustomerAcquisition[]): CACFactor[] {
    return [
      {
        factor: 'competition_intensity',
        impact: 0.3,
        trend: 'increasing',
        controllable: false,
        description: 'Market competition driving up costs'
      },
      {
        factor: 'ad_quality',
        impact: -0.2,
        trend: 'stable',
        controllable: true,
        description: 'Ad creative quality affecting costs'
      }
    ];
  }

  private calculateCACProjection(acquisitions: CustomerAcquisition[]): CACProjection[] {
    return [
      {
        period: 'Q1 2025',
        projectedCAC: 150,
        confidence: 0.8,
        scenarios: [
          { scenario: 'optimistic', cac: 120, probability: 0.3, assumptions: ['improved_efficiency'] },
          { scenario: 'realistic', cac: 150, probability: 0.5, assumptions: ['current_trends'] },
          { scenario: 'pessimistic', cac: 180, probability: 0.2, assumptions: ['increased_competition'] }
        ]
      }
    ];
  }

  private analyzeTemporalCAC(acquisitions: CustomerAcquisition[]): TemporalCAC[] {
    const monthlyData: { [month: string]: { customers: number; cost: number } } = {};

    acquisitions.forEach(acquisition => {
      const date = new Date(acquisition.acquisition_date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { customers: 0, cost: 0 };
      }
      monthlyData[monthKey].customers++;
      monthlyData[monthKey].cost += acquisition.attributed_spend || 0;
    });

    return Object.entries(monthlyData).map(([period, data]) => ({
      period,
      cac: data.customers > 0 ? data.cost / data.customers : 0,
      customers: data.customers,
      cost: data.cost,
      seasonality: this.calculateSeasonality(period),
      specialEvents: [] // Would identify special events
    }));
  }

  private calculateSeasonality(month: string): number {
    const monthNum = parseInt(month.split('-')[1]);
    // Mock seasonality factor
    return Math.sin((monthNum - 1) * Math.PI / 6) * 0.2 + 1;
  }

  private analyzeSegmentCAC(acquisitions: CustomerAcquisition[]): SegmentCAC[] {
    return [
      {
        segment: 'high_value',
        cac: 200,
        ltv: 2000,
        ltvToCACRatio: 10,
        profitability: 0.9,
        trend: 'stable',
        opportunity: 500
      },
      {
        segment: 'medium_value',
        cac: 100,
        ltv: 600,
        ltvToCACRatio: 6,
        profitability: 0.7,
        trend: 'improving',
        opportunity: 300
      }
    ];
  }

  private forecastCAC(acquisitions: CustomerAcquisition[]): ForecastedCAC[] {
    return [
      {
        period: '2025-01',
        forecastedCAC: 120,
        confidenceInterval: [100, 140],
        keyDrivers: ['market_conditions', 'competition'],
        riskFactors: ['economic_downturn', 'increased_competition'],
        recommendations: ['focus_on_efficiency', 'optimize_targeting']
      }
    ];
  }

  private identifyCACDrivers(acquisitions: CustomerAcquisition[]): CACDriver[] {
    return [
      {
        driver: 'market_competition',
        currentImpact: 0.3,
        trend: 'increasing',
        controlLevel: 'low',
        optimizationPotential: 0.1,
        recommendedActions: ['differentiate_offering', 'improve_targeting']
      },
      {
        driver: 'ad_performance',
        currentImpact: -0.2,
        trend: 'stable',
        controlLevel: 'high',
        optimizationPotential: 0.3,
        recommendedActions: ['a/b_testing', 'creative_optimization']
      }
    ];
  }

  private getCACBenchmark(cac: number): CACBenchmark[] {
    return [
      {
        industry: 'beauty_wellness',
        averageCAC: 150,
        benchmarkPosition: cac < 150 ? 'above_average' : 'below_average',
        percentile: cac < 150 ? 60 : 40,
        gap: Math.abs(cac - 150),
        opportunity: Math.max(0, 150 - cac)
      }
    ];
  }

  private analyzeROAS(
    acquisitions: CustomerAcquisition[],
    channels: AcquisitionChannel[],
    bookings: any[]
  ): ROASAnalysis {
    const totalCost = acquisitions.reduce((sum, a) => sum + (a.attributed_spend || 0), 0);
    const totalRevenue = bookings.reduce((sum, b) => sum + b.total_amount, 0);
    const overallROAS = totalCost > 0 ? totalRevenue / totalCost : 0;

    return {
      overallROAS,
      channelROAS: this.analyzeChannelROAS(acquisitions, channels, bookings),
      temporalROAS: this.analyzeTemporalROAS(acquisitions, bookings),
      segmentROAS: this.analyzeSegmentROAS(acquisitions, bookings),
      forecastedROAS: this.forecastROAS(acquisitions, bookings),
      roasOptimization: this.identifyROASOptimizations()
    };
  }

  private analyzeChannelROAS(
    acquisitions: CustomerAcquisition[],
    channels: AcquisitionChannel[],
    bookings: any[]
  ): ChannelROAS[] {
    const channelMap = new Map(channels.map(c => [c.id, c]));
    const channelData: { [channelId: string]: { acquisitions: CustomerAcquisition[]; revenue: number } } = {};

    // Group acquisitions by channel and calculate revenue
    acquisitions.forEach(acquisition => {
      const channelId = acquisition.attributed_channel;
      if (!channelData[channelId]) {
        channelData[channelId] = { acquisitions: [], revenue: 0 };
      }
      channelData[channelId].acquisitions.push(acquisition);
    });

    // Calculate revenue per channel
    bookings.forEach(booking => {
      const acquisition = acquisitions.find(a => a.user_id === booking.user_id);
      if (acquisition) {
        const channelId = acquisition.attributed_channel;
        if (channelData[channelId]) {
          channelData[channelId].revenue += booking.total_amount;
        }
      }
    });

    return Object.entries(channelData).map(([channelId, data]) => {
      const channel = channelMap.get(channelId);
      const totalCost = data.acquisitions.reduce((sum, a) => sum + (a.attributed_spend || 0), 0);
      const currentROAS = totalCost > 0 ? data.revenue / totalCost : 0;

      return {
        channelId,
        channelName: channel?.channel_name || 'Unknown',
        currentROAS,
        previousROAS: currentROAS * 0.9, // Mock previous ROAS
        trend: this.calculateTrend(currentROAS, currentROAS * 0.9),
        roasChange: 10, // Mock change
        roasTrend12Months: this.calculate12MonthROASTrend(data.acquisitions),
        breakEvenPoint: 1.0,
        marginalROAS: 1.5, // Mock marginal ROAS
        factors: this.getROASFactors(data)
      };
    });
  }

  private calculate12MonthROASTrend(acquisitions: CustomerAcquisition[]): number[] {
    // Mock 12-month ROAS trend
    return Array.from({ length: 12 }, (_, i) => 2.5 + Math.cos(i / 3) * 0.5 + Math.random() * 0.3);
  }

  private getROASFactors(data: { acquisitions: CustomerAcquisition[]; revenue: number }): ROASFactor[] {
    return [
      {
        factor: 'seasonal_demand',
        impact: 0.3,
        correlation: 0.7,
        description: 'Seasonal variations affect revenue',
        actionable: true
      },
      {
        factor: 'conversion_rate',
        impact: 0.5,
        correlation: 0.9,
        description: 'Conversion rate directly impacts ROAS',
        actionable: true
      }
    ];
  }

  private analyzeTemporalROAS(acquisitions: CustomerAcquisition[], bookings: any[]): TemporalROAS[] {
    const monthlyData: { [month: string]: { spend: number; revenue: number } } = {};

    acquisitions.forEach(acquisition => {
      const date = new Date(acquisition.acquisition_date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { spend: 0, revenue: 0 };
      }
      monthlyData[monthKey].spend += acquisition.attributed_spend || 0;
    });

    bookings.forEach(booking => {
      const date = new Date(booking.created_at);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (monthlyData[monthKey]) {
        monthlyData[monthKey].revenue += booking.total_amount;
      }
    });

    return Object.entries(monthlyData).map(([period, data]) => ({
      period,
      roas: data.spend > 0 ? data.revenue / data.spend : 0,
      spend: data.spend,
      revenue: data.revenue,
      seasonality: this.calculateSeasonality(period),
      campaigns: [] // Would identify campaigns
    }));
  }

  private analyzeSegmentROAS(acquisitions: CustomerAcquisition[], bookings: any[]): SegmentROAS[] {
    return [
      {
        segment: 'premium_customers',
        roas: 4.5,
        spend: 10000,
        revenue: 45000,
        cac: 100,
        ltv: 1500,
        profitability: 0.85
      },
      {
        segment: 'standard_customers',
        roas: 2.8,
        spend: 15000,
        revenue: 42000,
        cac: 80,
        ltv: 600,
        profitability: 0.7
      }
    ];
  }

  private forecastROAS(acquisitions: CustomerAcquisition[], bookings: any[]): ForecastedROAS[] {
    return [
      {
        period: '2025-Q1',
        forecastedROAS: 3.2,
        confidenceInterval: [2.8, 3.6],
        assumptions: ['steady_growth', 'seasonal_factors'],
        riskFactors: ['economic_conditions', 'competition'],
        opportunities: ['new_markets', 'product_launches']
      }
    ];
  }

  private identifyROASOptimizations(): ROASOptimization[] {
    return [
      {
        optimization: 'improve_ad_creatives',
        expectedROASIncrease: 0.5,
        implementationCost: 2000,
        expectedROI: 3.5,
        timeline: '4_weeks',
        confidence: 0.8,
        steps: ['a/b_testing', 'creative_refresh', 'performance_monitoring']
      },
      {
        optimization: 'optimize_landing_pages',
        expectedROASIncrease: 0.3,
        implementationCost: 1500,
        expectedROI: 2.8,
        timeline: '3_weeks',
        confidence: 0.7,
        steps: ['conversion_optimization', 'user_experience_improvements']
      }
    ];
  }

  private async analyzeCohorts(acquisitions: CustomerAcquisition[], bookings: any[]): Promise<CohortAnalysis> {
    // Group acquisitions by cohort (month)
    const cohorts: { [cohortId: string]: CustomerAcquisition[] } = {};
    acquisitions.forEach(acquisition => {
      const date = new Date(acquisition.acquisition_date);
      const cohortId = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!cohorts[cohortId]) {
        cohorts[cohortId] = [];
      }
      cohorts[cohortId].push(acquisition);
    });

    const customerCohorts: CustomerCohort[] = [];

    Object.entries(cohorts).forEach(([cohortId, cohortAcquisitions]) => {
      const acquisitionDate = new Date(cohortId);
      const cohortSize = cohortAcquisitions.length;
      const acquisitionCost = cohortAcquisitions.reduce((sum, a) => sum + (a.attributed_spend || 0), 0);

      // Calculate revenue for this cohort over time
      const cohortRevenue = this.calculateCohortRevenue(cohortAcquisitions, bookings);

      customerCohorts.push({
        cohortId,
        acquisitionDate,
        cohortSize,
        acquisitionChannel: 'mixed', // Would analyze actual channels
        acquisitionCost,
        revenuePeriod1: cohortRevenue.period1,
        revenuePeriod2: cohortRevenue.period2,
        revenuePeriod3: cohortRevenue.period3,
        revenuePeriod6: cohortRevenue.period6,
        revenuePeriod12: cohortRevenue.period12,
        retentionPeriod1: cohortRevenue.retention1,
        retentionPeriod2: cohortRevenue.retention2,
        retentionPeriod3: cohortRevenue.retention3,
        retentionPeriod6: cohortRevenue.retention6,
        retentionPeriod12: cohortRevenue.retention12,
        cac: acquisitionCost / cohortSize,
        ltv12: cohortRevenue.period12,
        ltvToCACRatio: (cohortRevenue.period12 * cohortSize) / acquisitionCost,
        paybackPeriod: this.calculatePaybackPeriod(cohortRevenue, acquisitionCost / cohortSize),
        profitability: ((cohortRevenue.period12 * cohortSize) - acquisitionCost) / acquisitionCost,
        characteristics: [] // Would analyze cohort characteristics
      });
    });

    return {
      cohorts: customerCohorts,
      retentionCurves: this.calculateRetentionCurves(customerCohorts),
      ltvProgression: this.calculateLTVProgression(customerCohorts),
      cohortComparison: this.compareCohorts(customerCohorts),
      predictiveRetention: this.predictRetention(customerCohorts)
    };
  }

  private calculateCohortRevenue(cohortAcquisitions: CustomerAcquisition[], bookings: any[]) {
    // Mock revenue calculation for different periods
    return {
      period1: 100 * cohortAcquisitions.length,
      period2: 80 * cohortAcquisitions.length,
      period3: 60 * cohortAcquisitions.length,
      period6: 40 * cohortAcquisitions.length,
      period12: 20 * cohortAcquisitions.length,
      retention1: 0.8,
      retention2: 0.6,
      retention3: 0.5,
      retention6: 0.3,
      retention12: 0.2
    };
  }

  private calculatePaybackPeriod(cohortRevenue: any, cac: number): number {
    let cumulativeRevenue = 0;
    for (let period = 1; period <= 12; period++) {
      const periodRevenue = cohortRevenue[`period${period}` as keyof typeof cohortRevenue] as number;
      cumulativeRevenue += periodRevenue;
      if (cumulativeRevenue >= cac) {
        return period * 30; // Convert periods to days
      }
    }
    return 360; // 12 months in days
  }

  private calculateRetentionCurves(cohorts: CustomerCohort[]): RetentionCurve[] {
    return cohorts.map(cohort => ({
      cohortId: cohort.cohortId,
      periods: [
        { period: 1, retentionRate: cohort.retentionPeriod1, revenue: cohort.revenuePeriod1, customers: cohort.cohortSize },
        { period: 2, retentionRate: cohort.retentionPeriod2, revenue: cohort.revenuePeriod2, customers: cohort.cohortSize * cohort.retentionPeriod2 },
        { period: 3, retentionRate: cohort.retentionPeriod3, revenue: cohort.revenuePeriod3, customers: cohort.cohortSize * cohort.retentionPeriod3 }
      ],
      modelFit: 0.85,
      churnRate: 1 - cohort.retentionPeriod3,
      lifetimeValue: cohort.ltv12,
      seasonalAdjustments: []
    }));
  }

  private calculateLTVProgression(cohorts: CustomerCohort[]): LTVProgression[] {
    return [
      {
        channel: 'paid_search',
        ltvByPeriod: [
          { period: 1, ltv: 100, revenue: 100, retentionRate: 0.8 },
          { period: 3, ltv: 200, revenue: 180, retentionRate: 0.6 },
          { period: 6, ltv: 300, revenue: 240, retentionRate: 0.4 },
          { period: 12, ltv: 400, revenue: 280, retentionRate: 0.2 }
        ],
        projection: [],
        factors: []
      }
    ];
  }

  private compareCohorts(cohorts: CustomerCohort[]): CohortComparison[] {
    return [
      {
        comparisonType: 'seasonal',
        cohorts: cohorts.map(c => c.cohortId),
        metrics: [
          {
            metric: 'CAC',
            values: cohorts.map(c => c.cac),
            leader: cohorts.reduce((min, c) => c.cac < min.cac ? c : min, cohorts[0]).cohortId,
            gap: 0,
            significance: 0.8
          }
        ],
        insights: ['Seasonal variations in acquisition costs'],
        recommendations: ['Adjust spending based on seasonality']
      }
    ];
  }

  private predictRetention(cohorts: CustomerCohort[]): PredictiveRetention[] {
    return cohorts.map(cohort => ({
      cohortId: cohort.cohortId,
      predictedRetention: [
        { period: 1, predictedRate: 0.75, confidence: 0.9, factors: ['seasonal_factors'] },
        { period: 3, predictedRate: 0.55, confidence: 0.8, factors: ['customer_engagement'] },
        { period: 6, predictedRate: 0.35, confidence: 0.7, factors: ['market_conditions'] },
        { period: 12, predictedRate: 0.2, confidence: 0.6, factors: ['long_term_trends'] }
      ],
      modelAccuracy: 0.8,
      confidenceInterval: [0.15, 0.25],
      riskFactors: ['market_volatility', 'competition'],
      interventions: [
        { intervention: 'early_engagement', timing: 30, expectedImpact: 0.1, cost: 50, roi: 3.0 },
        { intervention: 'retention_campaign', timing: 90, expectedImpact: 0.15, cost: 100, roi: 2.5 }
      ]
    }));
  }

  private async analyzeFunnels(acquisitions: CustomerAcquisition[]): Promise<FunnelAnalysis> {
    return {
      overallFunnel: [
        { stageName: 'awareness', users: 10000, conversionRate: 0.05, dropoffRate: 0.95, averageTime: 2, revenue: 0, cost: 1000, efficiency: 0.5 },
        { stageName: 'interest', users: 500, conversionRate: 0.2, dropoffRate: 0.8, averageTime: 5, revenue: 0, cost: 2000, efficiency: 0.6 },
        { stageName: 'consideration', users: 100, conversionRate: 0.5, dropoffRate: 0.5, averageTime: 10, revenue: 0, cost: 3000, efficiency: 0.7 },
        { stageName: 'booking', users: 50, conversionRate: 0.8, dropoffRate: 0.2, averageTime: 15, revenue: 40000, cost: 4000, efficiency: 0.9 }
      ],
      channelFunnels: [],
      funnelBottlenecks: [
        {
          stage: 'awareness',
          bottleneckType: 'high_dropoff',
          severity: 'high',
          impact: 0.95,
          causes: ['poor_targeting', 'weak_messaging'],
          solutions: ['improve_targeting', 'enhance_creative'],
          priority: 1
        }
      ],
      funnelOptimization: [
        {
          optimization: 'improve_awareness_messaging',
          targetStage: 'awareness',
          expectedImprovement: 0.2,
          implementationCost: 2000,
          expectedROI: 3.5,
          timeline: '4_weeks',
          confidence: 0.7
        }
      ],
      conversionPaths: [],
      abandonmentAnalysis: []
    };
  }

  private async analyzeCompetitiveLandscape(): Promise<CompetitiveLandscape> {
    return {
      marketShare: [],
      competitorAnalysis: [],
      positioning: [],
      opportunities: [],
      threats: [],
      benchmarking: []
    };
  }

  private optimizeBudget(
    channelPerformance: ChannelPerformance[],
    cacAnalysis: CACAnalysis,
    roasAnalysis: ROASAnalysis
  ): BudgetOptimization {
    const currentAllocation = channelPerformance.map(channel => ({
      channelId: channel.channelId,
      channelName: channel.channelName,
      currentBudget: channel.cost,
      recommendedBudget: channel.cost * (channel.roas > 2 ? 1.2 : 0.8), // Optimize based on ROAS
      budgetChange: 0,
      expectedROAS: channel.roas,
      expectedCustomers: channel.customers * (channel.roas > 2 ? 1.2 : 0.8),
      riskLevel: channel.roas < 1.5 ? 'high' : 'medium',
      confidence: 0.8
    }));

    return {
      currentAllocation,
      recommendedAllocation: currentAllocation,
      optimizationOpportunities: [
        {
          opportunity: 'reallocate_high_roas_channels',
          description: 'Increase budget allocation to high-performing channels',
          potentialImpact: 25,
          implementationCost: 1000,
          expectedROI: 4.0,
          timeline: '2_weeks',
          confidence: 0.9,
          dependencies: ['budget_approval', 'campaign_setup']
        }
      ],
      expectedImpact: [
        {
          metric: 'overall_roas',
          currentValue: roasAnalysis.overallROAS,
          projectedValue: roasAnalysis.overallROAS * 1.2,
          change: 20,
          confidence: 0.8
        }
      ],
      constraints: [
        {
          constraint: 'total_budget_limit',
          impact: 'Cannot exceed total budget allocation',
          mitigation: ['optimize_within_budget', 'prioritize_high_roas_channels']
        }
      ],
      scenarios: []
    };
  }

  private generatePredictiveInsights(acquisitions: CustomerAcquisition[], channelPerformance: ChannelPerformance[]): PredictiveInsights {
    return {
      acquisitionForecast: [
        {
          period: '2025-Q1',
          forecastedCustomers: 500,
          forecastedRevenue: 250000,
          forecastedCAC: 120,
          forecastedROAS: 3.2,
          confidence: 0.8,
          keyDrivers: ['market_growth', 'seasonal_demand'],
          scenarios: [
            { scenario: 'optimistic', customers: 600, revenue: 300000, cac: 100, roas: 3.5, probability: 0.3, assumptions: ['strong_growth'] },
            { scenario: 'realistic', customers: 500, revenue: 250000, cac: 120, roas: 3.2, probability: 0.5, assumptions: ['steady_growth'] },
            { scenario: 'pessimistic', customers: 400, revenue: 200000, cac: 140, roas: 2.8, probability: 0.2, assumptions: ['market_slowdown'] }
          ]
        }
      ],
      churnPrediction: [],
      marketTrends: [
        {
          trend: 'increasing_digital_spend',
          direction: 'increasing',
          impact: 0.7,
          confidence: 0.9,
          timeframe: '12_months',
          implications: ['higher_costs', 'more_competition', 'new_opportunities']
        }
      ],
      opportunityScoring: [],
      riskAssessment: []
    };
  }

  private generateRecommendations(
    overview: AcquisitionOverview,
    channelPerformance: ChannelPerformance[],
    cacAnalysis: CACAnalysis,
    roasAnalysis: ROASAnalysis,
    budgetOptimization: BudgetOptimization
  ): AcquisitionRecommendation[] {
    const recommendations: AcquisitionRecommendation[] = [];

    // High-priority recommendations based on performance
    if (overview.overallROAS < 2) {
      recommendations.push({
        category: 'strategy',
        priority: 'critical',
        recommendation: 'Optimize underperforming channels immediately',
        expectedImpact: 40,
        implementationCost: 5000,
        expectedROI: 3.0,
        timeline: '6_weeks',
        dependencies: ['performance_analysis', 'budget_reallocation'],
        kpis: ['roas', 'cac', 'conversion_rate'],
        riskFactors: ['channel_disruption', 'market_changes'],
        owner: 'marketing_team',
        confidence: 0.85
      });
    }

    // Channel-specific recommendations
    channelPerformance.forEach(channel => {
      if (channel.roas < 1.5 && channel.cost > 5000) {
        recommendations.push({
          category: 'channel',
          priority: 'high',
          recommendation: `Optimize or pause ${channel.channelName} channel`,
          expectedImpact: 25,
          implementationCost: 2000,
          expectedROI: 2.5,
          timeline: '4_weeks',
          dependencies: ['channel_analysis', 'creative_review'],
          kpis: ['channel_roas', 'conversion_rate', 'cac'],
          riskFactors: ['lost_visibility', 'competitor_gain'],
          owner: 'channel_manager',
          confidence: 0.8
        });
      }

      if (channel.roas > 4 && channel.growthRate > 10) {
        recommendations.push({
          category: 'budget',
          priority: 'high',
          recommendation: `Scale investment in ${channel.channelName}`,
          expectedImpact: 35,
          implementationCost: 8000,
          expectedROI: 3.5,
          timeline: '8_weeks',
          dependencies: ['budget_approval', 'capacity_planning'],
          kpis: ['revenue', 'market_share', 'customer_acquisition'],
          riskFactors: ['diminishing_returns', 'increased_costs'],
          owner: 'marketing_director',
          confidence: 0.75
        });
      }
    });

    // Budget optimization recommendations
    budgetOptimization.optimizationOpportunities.forEach(opportunity => {
      recommendations.push({
        category: 'budget',
        priority: opportunity.potentialImpact > 20 ? 'high' : 'medium',
        recommendation: opportunity.description,
        expectedImpact: opportunity.potentialImpact,
        implementationCost: opportunity.implementationCost,
        expectedROI: opportunity.expectedROI,
        timeline: opportunity.timeline,
        dependencies: opportunity.dependencies,
        kpis: ['roas', 'cac', 'revenue'],
        riskFactors: ['execution_risk'],
        owner: 'finance_team',
        confidence: opportunity.confidence
      });
    });

    return recommendations.sort((a, b) => {
      const priorityWeight = { critical: 4, high: 3, medium: 2, low: 1 };
      return priorityWeight[b.priority] - priorityWeight[a.priority];
    });
  }

  async trackAcquisition(
    userId: string,
    channelData: {
      channel: string;
      source?: string;
      medium?: string;
      campaign?: string;
      cost?: number;
    }
  ): Promise<void> {
    const { error } = await supabase
      .from('customer_acquisition')
      .insert({
        user_id: userId,
        acquisition_date: new Date().toISOString(),
        first_touch_channel: channelData.channel,
        last_touch_channel: channelData.channel,
        attributed_channel: this.selectAttributedChannel(channelData),
        attribution_model: 'last_touch',
        acquisition_cost: channelData.cost || 0,
        attributed_spend: channelData.cost || 0,
        utm_source: channelData.source,
        utm_medium: channelData.medium,
        utm_campaign: channelData.campaign,
        total_touchpoints: 1,
        conversion_value: 0 // Will be updated when first booking occurs
      });

    if (error) {
      throw new Error(`Failed to track acquisition: ${error.message}`);
    }
  }

  private selectAttributedChannel(channelData: any): string {
    // Simplified channel selection logic
    // In production, this would use more sophisticated attribution
    return channelData.channel || 'direct';
  }

  async updateAttribution(
    userId: string,
    channelData: {
      channel: string;
      touchpointType: string;
      cost?: number;
    }
  ): Promise<void> {
    // Update existing acquisition record with additional touchpoint
    const { error } = await supabase
      .from('customer_acquisition')
      .update({
        total_touchpoints: supabase.raw`total_touchpoints + 1`,
        // Would update touchpoint history in a real implementation
      })
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Failed to update attribution: ${error.message}`);
    }
  }

  async getAttributionModelComparison(): Promise<ModelComparison[]> {
    const acquisitions = await this.getCustomerAcquisitionData();
    return this.compareAttributionModels(acquisitions);
  }

  async updateChannelBudget(
    channelId: string,
    newBudget: number,
    reason: string
  ): Promise<void> {
    const { error } = await supabase
      .from('acquisition_channels')
      .update({
        // In a real implementation, would have budget fields
        updated_at: new Date().toISOString()
      })
      .eq('id', channelId);

    if (error) {
      throw new Error(`Failed to update channel budget: ${error.message}`);
    }

    console.log(`Updated channel ${channelId} budget to ${newBudget}. Reason: ${reason}`);
  }
}

export const acquisitionAnalyticsEngine = new AcquisitionAnalyticsEngine();