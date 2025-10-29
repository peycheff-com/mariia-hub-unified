// Experiment Service for A/B Testing and Analytics
// Handles experiment management, statistical analysis, and reporting

import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";

import type {
  ExperimentStats,
  VariantStats,
  ConfidenceInterval,
  ExperimentMetrics,
  ExperimentAssignment,
  ExperimentEvent,
  CohortAnalysis,
  ExperimentFormData,
  ExperimentConfig
} from "@/types/featureFlags";

class ExperimentService {
  private static instance: ExperimentService;

  static getInstance(): ExperimentService {
    if (!ExperimentService.instance) {
      ExperimentService.instance = new ExperimentService();
    }
    return ExperimentService.instance;
  }

  // Experiment Management
  async createExperiment(config: ExperimentFormData): Promise<void> {
    try {
      // Validate experiment configuration
      this.validateExperimentConfig(config);

      const experimentFlag = {
        flag_key: config.experiment_key,
        description: config.description,
        is_active: true,
        rollout_percentage: config.traffic_allocation,
        target_segments: config.target_segments,
        environments: ["production"],
        metadata: {
          isExperiment: true,
          variants: config.variants.reduce((acc, variant) => ({
            ...acc,
            [variant.key]: variant.config || {}
          }), {}),
          weights: config.variants.reduce((acc, variant) => ({
            ...acc,
            [variant.key]: variant.weight
          }), {}),
          successMetrics: config.success_metrics,
          durationDays: config.duration_days,
          startDate: new Date().toISOString(),
          requiredSampleSize: this.calculateRequiredSampleSize(config),
          confidenceLevel: 0.95
        }
      };

      const { error } = await supabase
        .from("feature_flags")
        .insert([experimentFlag]);

      if (error) throw error;

      logger.info(`Experiment created: ${config.experiment_key}`);

    } catch (error) {
      logger.error("Error creating experiment:", error);
      throw error;
    }
  }

  async startExperiment(experimentKey: string): Promise<void> {
    try {
      const { error } = await supabase
        .from("feature_flags")
        .update({
          is_active: true,
          metadata: JSON.stringify({
            startedAt: new Date().toISOString(),
            status: 'running'
          })
        })
        .eq("flag_key", experimentKey);

      if (error) throw error;

      logger.info(`Experiment started: ${experimentKey}`);

    } catch (error) {
      logger.error("Error starting experiment:", error);
      throw error;
    }
  }

  async pauseExperiment(experimentKey: string): Promise<void> {
    try {
      // First, fetch current metadata
      const { data: currentFlag, error: fetchError } = await supabase
        .from("feature_flags")
        .select("metadata")
        .eq("flag_key", experimentKey)
        .single();

      if (fetchError) throw fetchError;

      // Update with new metadata merged
      const { error } = await supabase
        .from("feature_flags")
        .update({
          is_active: false,
          metadata: {
            ...currentFlag.metadata,
            pausedAt: new Date().toISOString(),
            status: 'paused'
          }
        })
        .eq("flag_key", experimentKey);

      if (error) throw error;

      logger.info(`Experiment paused: ${experimentKey}`);

    } catch (error) {
      logger.error("Error pausing experiment:", error);
      throw error;
    }
  }

  async stopExperiment(experimentKey: string, winnerVariant?: string): Promise<void> {
    try {
      // First, fetch current metadata
      const { data: currentFlag, error: fetchError } = await supabase
        .from("feature_flags")
        .select("metadata")
        .eq("flag_key", experimentKey)
        .single();

      if (fetchError) throw fetchError;

      const updateData: any = {
        is_active: false,
        metadata: {
          ...currentFlag.metadata,
          stoppedAt: new Date().toISOString(),
          status: 'completed',
          winnerVariant
        }
      };

      if (winnerVariant) {
        // Optionally rollout the winning variant to 100%
        updateData.rollout_percentage = 100;
        updateData.metadata = {
          ...updateData.metadata,
          rolloutWinner: winnerVariant,
          rolloutComplete: true
        };
      }

      const { error } = await supabase
        .from("feature_flags")
        .update(updateData)
        .eq("flag_key", experimentKey);

      if (error) throw error;

      logger.info(`Experiment stopped: ${experimentKey}${winnerVariant ? `, winner: ${winnerVariant}` : ''}`);

    } catch (error) {
      logger.error("Error stopping experiment:", error);
      throw error;
    }
  }

  // Analytics and Reporting
  async getExperimentResults(experimentKey: string): Promise<ExperimentStats> {
    try {
      // Get experiment assignments
      const { data: assignments, error: assignmentsError } = await supabase
        .from("experiment_assignments")
        .select("*")
        .eq("experiment_key", experimentKey);

      if (assignmentsError) throw assignmentsError;

      // Get experiment configuration
      const { data: flag, error: flagError } = await supabase
        .from("feature_flags")
        .select("*")
        .eq("flag_key", experimentKey)
        .single();

      if (flagError) throw flagError;

      // Calculate variant statistics
      const variants = this.calculateVariantStats(assignments || []);

      // Calculate overall statistics
      const totalUsers = assignments?.length || 0;
      const totalConversions = assignments?.filter(a => a.converted).length || 0;
      const overallConversionRate = totalUsers > 0 ? (totalConversions / totalUsers) * 100 : 0;

      // Calculate statistical significance
      const statisticalSignificance = this.calculateStatisticalSignificance(variants);

      // Determine winner
      const winnerVariant = this.determineWinner(variants, statisticalSignificance);

      // Calculate confidence interval
      const confidenceInterval = this.calculateConfidenceInterval(variants, winnerVariant);

      // Calculate days running
      const startDate = flag.metadata?.startDate || flag.created_at;
      const daysRunning = Math.floor((Date.now() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24));

      return {
        experiment_key: experimentKey,
        total_users: totalUsers,
        variants,
        conversion_rate: overallConversionRate,
        statistical_significance: statisticalSignificance,
        winner_variant: winnerVariant,
        confidence_interval: confidenceInterval,
        start_date: startDate,
        days_running,
      };

    } catch (error) {
      logger.error("Error getting experiment results:", error);
      throw error;
    }
  }

  async getExperimentMetrics(experimentKey: string): Promise<ExperimentMetrics> {
    try {
      const stats = await this.getExperimentResults(experimentKey);
      const { data: flag } = await supabase
        .from("feature_flags")
        .select("metadata, created_at, updated_at")
        .eq("flag_key", experimentKey)
        .single();

      const metadata = flag?.metadata || {};
      const isRunning = flag?.is_active && metadata.status !== 'paused';
      const isCompleted = metadata.status === 'completed';

      // Calculate sample size progress
      const requiredSampleSize = metadata.requiredSampleSize || 1000;
      const achievedSampleSize = stats.total_users;
      const sampleSizeProgress = (achievedSampleSize / requiredSampleSize) * 100;

      // Estimate completion date based on current enrollment rate
      let expectedCompletionDate: string | undefined;
      if (isRunning && achievedSampleSize > 0 && achievedSampleSize < requiredSampleSize) {
        const startDate = new Date(metadata.startDate || flag.created_at);
        const enrollmentRate = achievedSampleSize / stats.days_running;
        const remainingDays = (requiredSampleSize - achievedSampleSize) / enrollmentRate;
        expectedCompletionDate = new Date(
          startDate.getTime() + (remainingDays * 24 * 60 * 60 * 1000)
        ).toISOString();
      }

      return {
        experiment_key: experimentKey,
        status: isCompleted ? 'completed' : isRunning ? 'running' : metadata.status || 'draft',
        start_date: metadata.startDate || flag.created_at,
        end_date: metadata.stoppedAt,
        total_participants: achievedSampleSize,
        total_conversions: stats.variants.reduce((sum, v) => sum + v.conversions, 0),
        overall_conversion_rate: stats.conversion_rate,
        statistical_power: stats.statistical_significance,
        min_sample_size: requiredSampleSize,
        achieved_sample_size: achievedSampleSize,
        expected_completion_date: expectedCompletionDate
      };

    } catch (error) {
      logger.error("Error getting experiment metrics:", error);
      throw error;
    }
  }

  async getCohortAnalysis(experimentKey: string, cohortSize: number = 100): Promise<CohortAnalysis[]> {
    try {
      // This would typically involve more complex cohort analysis
      // For now, providing a simplified implementation
      const { data: assignments } = await supabase
        .from("experiment_assignments")
        .select("*")
        .eq("experiment_key", experimentKey)
        .order("assigned_at", { ascending: true })
        .limit(cohortSize);

      if (!assignments || assignments.length === 0) {
        return [];
      }

      // Group by cohorts (time-based)
      const cohorts = this.groupIntoCohorts(assignments, 7); // 7-day cohorts

      // Analyze each cohort
      const analyses: CohortAnalysis[] = [];
      for (const [cohortName, cohortAssignments] of Object.entries(cohorts)) {
        const analysis = this.analyzeCohort(experimentKey, cohortName, cohortAssignments);
        analyses.push(analysis);
      }

      return analyses;

    } catch (error) {
      logger.error("Error getting cohort analysis:", error);
      throw error;
    }
  }

  async trackExperimentEvent(
    experimentKey: string,
    userId: string,
    eventType: string,
    value?: number,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      await supabase.from("experiment_events").insert({
        experiment_key: experimentKey,
        user_id: userId,
        event_type: eventType,
        event_value: value,
        metadata: metadata || {},
      });

    } catch (error) {
      logger.error("Error tracking experiment event:", error);
    }
  }

  async getExperimentEvents(experimentKey: string, limit: number = 100): Promise<ExperimentEvent[]> {
    try {
      const { data, error } = await supabase
        .from("experiment_events")
        .select("*")
        .eq("experiment_key", experimentKey)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;

      return data || [];

    } catch (error) {
      logger.error("Error getting experiment events:", error);
      throw error;
    }
  }

  // Statistical Analysis Methods
  private calculateVariantStats(assignments: ExperimentAssignment[]): VariantStats[] {
    const variantMap = new Map<string, ExperimentAssignment[]>();

    // Group assignments by variant
    assignments.forEach(assignment => {
      const variant = assignment.variant;
      if (!variantMap.has(variant)) {
        variantMap.set(variant, []);
      }
      variantMap.get(variant)!.push(assignment);
    });

    // Calculate statistics for each variant
    const stats: VariantStats[] = [];
    for (const [variant, variantAssignments] of variantMap) {
      const users = variantAssignments.length;
      const conversions = variantAssignments.filter(a => a.converted).length;
      const conversionRate = users > 0 ? (conversions / users) * 100 : 0;
      const revenue = variantAssignments.reduce((sum, a) => sum + (a.conversion_value || 0), 0);
      const averageOrderValue = conversions > 0 ? revenue / conversions : 0;

      stats.push({
        variant,
        users,
        conversions,
        conversion_rate: conversionRate,
        revenue: revenue || undefined,
        average_order_value: averageOrderValue || undefined,
      });
    }

    return stats;
  }

  private calculateStatisticalSignificance(variants: VariantStats[]): number | undefined {
    if (variants.length < 2) return undefined;

    // Simple chi-square test for conversion rates
    const control = variants[0];
    const variant = variants[1];

    const controlConversions = control.conversions;
    const controlNonConversions = control.users - control.conversions;
    const variantConversions = variant.conversions;
    const variantNonConversions = variant.users - variant.conversions;

    const totalConversions = controlConversions + variantConversions;
    const totalNonConversions = controlNonConversions + variantNonConversions;
    const totalUsers = control.users + variant.users;

    if (totalUsers < 100) return undefined; // Not enough data

    // Expected values
    const expectedControlConversions = (control.users * totalConversions) / totalUsers;
    const expectedVariantConversions = (variant.users * totalConversions) / totalUsers;

    // Chi-square statistic
    const chiSquare =
      Math.pow(controlConversions - expectedControlConversions, 2) / expectedControlConversions +
      Math.pow(variantConversions - expectedVariantConversions, 2) / expectedVariantConversions;

    // Convert to p-value (simplified)
    const degreesOfFreedom = 1;
    const pValue = 1 - this.chiSquareCDF(chiSquare, degreesOfFreedom);

    return 1 - pValue; // Return confidence level
  }

  private chiSquareCDF(x: number, df: number): number {
    // Simplified chi-square CDF calculation
    // In production, use a proper statistical library
    if (x <= 0) return 0;
    if (df === 1) {
      return 2 * this.normalCDF(Math.sqrt(x)) - 1;
    }
    // For higher degrees of freedom, use approximation
    return Math.min(0.999, x / (x + df));
  }

  private normalCDF(x: number): number {
    // Standard normal CDF approximation
    return 0.5 * (1 + this.erf(x / Math.sqrt(2)));
  }

  private erf(x: number): number {
    // Error function approximation
    const a1 =  0.254829592;
    const a2 = -0.284496736;
    const a3 =  1.421413741;
    const a4 = -1.453152027;
    const a5 =  1.061405429;
    const p  =  0.3275911;

    const sign = x >= 0 ? 1 : -1;
    x = Math.abs(x);

    const t = 1.0 / (1.0 + p * x);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

    return sign * y;
  }

  private determineWinner(variants: VariantStats[], statisticalSignificance?: number): string | undefined {
    if (!statisticalSignificance || statisticalSignificance < 0.95) {
      return undefined; // Not statistically significant
    }

    // Find variant with highest conversion rate
    const sortedVariants = [...variants].sort((a, b) => b.conversion_rate - a.conversion_rate);
    const winner = sortedVariants[0];
    const runnerUp = sortedVariants[1];

    // Check if winner is significantly better than runner up
    if (winner && runnerUp && winner.conversion_rate > runnerUp.conversion_rate) {
      return winner.variant;
    }

    return undefined;
  }

  private calculateConfidenceInterval(variants: VariantStats[], winnerVariant?: string): ConfidenceInterval | undefined {
    if (!winnerVariant) return undefined;

    const winner = variants.find(v => v.variant === winnerVariant);
    if (!winner || winner.users < 30) return undefined; // Not enough data

    const conversionRate = winner.conversion_rate / 100;
    const standardError = Math.sqrt((conversionRate * (1 - conversionRate)) / winner.users);
    const zScore = 1.96; // 95% confidence
    const marginOfError = zScore * standardError;

    return {
      lower_bound: Math.max(0, (conversionRate - marginOfError) * 100),
      upper_bound: Math.min(100, (conversionRate + marginOfError) * 100),
      confidence_level: 0.95,
    };
  }

  private calculateRequiredSampleSize(config: ExperimentFormData): number {
    // Calculate required sample size for statistical significance
    // Using standard formula for A/B test sample size

    const baselineRate = 0.1; // Assume 10% baseline conversion rate
    const minimumDetectableEffect = 0.05; // 5% absolute improvement
    const alpha = 0.05; // 5% significance level
    const power = 0.8; // 80% power

    // Simplified calculation - in production use proper statistical formulas
    const pooledRate = baselineRate + minimumDetectableEffect / 2;
    const variance = 2 * pooledRate * (1 - pooledRate);

    const zAlpha = 1.96; // For alpha = 0.05
    const zBeta = 0.84; // For power = 0.8

    const requiredSampleSizePerVariant =
      Math.ceil((2 * variance * Math.pow(zAlpha + zBeta, 2)) / Math.pow(minimumDetectableEffect, 2));

    return requiredSampleSizePerVariant * config.variants.length;
  }

  private validateExperimentConfig(config: ExperimentFormData): void {
    // Validate experiment key
    if (!config.experiment_key || !/^[a-z0-9_-]+$/.test(config.experiment_key)) {
      throw new Error("Invalid experiment key. Use lowercase letters, numbers, hyphens, and underscores only.");
    }

    // Validate variants
    if (!config.variants || config.variants.length < 2) {
      throw new Error("Experiments must have at least 2 variants.");
    }

    const totalWeight = config.variants.reduce((sum, variant) => sum + variant.weight, 0);
    if (Math.abs(totalWeight - 100) > 0.01) {
      throw new Error("Variant weights must sum to 100%.");
    }

    // Validate traffic allocation
    if (config.traffic_allocation < 1 || config.traffic_allocation > 100) {
      throw new Error("Traffic allocation must be between 1% and 100%.");
    }

    // Validate duration
    if (config.duration_days < 1 || config.duration_days > 365) {
      throw new Error("Duration must be between 1 and 365 days.");
    }
  }

  private groupIntoCohorts(assignments: ExperimentAssignment[], cohortDays: number): Record<string, ExperimentAssignment[]> {
    const cohorts: Record<string, ExperimentAssignment[]> = {};

    assignments.forEach(assignment => {
      const cohortDate = new Date(assignment.assigned_at);
      const cohortName = `Cohort ${format(cohortDate, 'MMM dd, yyyy')}`;

      if (!cohorts[cohortName]) {
        cohorts[cohortName] = [];
      }
      cohorts[cohortName].push(assignment);
    });

    return cohorts;
  }

  private analyzeCohort(experimentKey: string, cohortName: string, assignments: ExperimentAssignment[]): CohortAnalysis {
    const cohortSize = assignments.length;
    const conversions = assignments.filter(a => a.converted).length;
    const conversionRate = cohortSize > 0 ? (conversions / cohortSize) * 100 : 0;
    const revenue = assignments.reduce((sum, a) => sum + (a.conversion_value || 0), 0);
    const averageRevenue = cohortSize > 0 ? revenue / cohortSize : 0;

    // Simplified retention calculation (would need more data in production)
    const retentionRate = Math.min(95, conversionRate * 2); // Rough estimate

    // Compare to baseline (first cohort or overall average)
    const baselineRate = 10; // 10% baseline
    const comparedToBaseline = ((conversionRate - baselineRate) / baselineRate) * 100;

    return {
      cohort_name: cohortName,
      flag_key: experimentKey,
      cohort_size: cohortSize,
      conversion_rate: conversionRate,
      retention_rate: retentionRate,
      average_revenue: averageRevenue,
      compared_to_baseline: comparedToBaseline,
    };
  }
}

// Utility function for date formatting
function format(date: Date, formatStr: string): string {
  // Simple date formatting - in production use a proper library like date-fns
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const d = new Date(date);

  if (formatStr === 'MMM dd, yyyy') {
    return `${months[d.getMonth()]} ${d.getDate().toString().padStart(2, '0')}, ${d.getFullYear()}`;
  }

  return d.toISOString();
}

// Export singleton instance
export const experimentService = ExperimentService.getInstance();

// Export convenience functions
export const {
  createExperiment,
  startExperiment,
  pauseExperiment,
  stopExperiment,
  getExperimentResults,
  getExperimentMetrics,
  getCohortAnalysis,
  trackExperimentEvent,
  getExperimentEvents,
} = experimentService;