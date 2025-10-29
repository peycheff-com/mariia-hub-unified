// Feature Flag Audit Service
// Comprehensive audit trail, rollback capabilities, and change tracking

import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";

import type {
  FeatureFlag,
  FeatureFlagAuditLog,
  FeatureFlagFormData,
  FlagUpdateEvent
} from "@/types/featureFlags";

interface AuditConfig {
  enabled: boolean;
  retentionDays: number;
  includeMetadata: boolean;
  trackUserActions: boolean;
  autoBackup: boolean;
}

interface RollbackPoint {
  id: string;
  timestamp: string;
  description: string;
  flagSnapshot: Record<string, FeatureFlag>;
  changes: Array<{
    flag_key: string;
    action: string;
    oldValue?: any;
    newValue?: any;
  }>;
  created_by: string;
}

interface ChangeImpact {
  flag_key: string;
  affected_users: number;
  risk_level: 'low' | 'medium' | 'high';
  estimated_impact: string;
  recommendations: string[];
}

export class FeatureFlagAuditService {
  private static instance: FeatureFlagAuditService;
  private rollbackPoints: Map<string, RollbackPoint> = new Map();

  private readonly auditConfig: AuditConfig = {
    enabled: true,
    retentionDays: 90,
    includeMetadata: true,
    trackUserActions: true,
    autoBackup: true,
  };

  static getInstance(): FeatureFlagAuditService {
    if (!FeatureFlagAuditService.instance) {
      FeatureFlagAuditService.instance = new FeatureFlagAuditService();
    }
    return FeatureFlagAuditService.instance;
  }

  private constructor() {
    this.loadRollbackPoints();
    this.startRetentionCleanup();
  }

  // Audit Trail Management
  async logChange(
    flagKey: string,
    action: string,
    userId: string,
    oldValue?: any,
    newValue?: any,
    reason?: string
  ): Promise<void> {
    if (!this.auditConfig.enabled) return;

    try {
      const auditLog: Partial<FeatureFlagAuditLog> = {
        flag_key: flagKey,
        action: action as any,
        old_values: this.auditConfig.includeMetadata ? oldValue : null,
        new_values: this.auditConfig.includeMetadata ? newValue : null,
        changed_by: userId,
        reason: reason || this.getDefaultReason(action),
      };

      const { error } = await supabase
        .from('feature_flag_audit_log')
        .insert([auditLog]);

      if (error) throw error;

      logger.info(`Audit log entry created: ${action} on ${flagKey} by ${userId}`);

      // Create rollback point for significant changes
      if (this.shouldCreateRollbackPoint(action, oldValue, newValue)) {
        await this.createRollbackPoint(flagKey, action, userId, oldValue, newValue);
      }

    } catch (error) {
      logger.error('Failed to create audit log entry:', error);
    }
  }

  async getAuditHistory(
    flagKey?: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<FeatureFlagAuditLog[]> {
    try {
      let query = supabase
        .from('feature_flag_audit_log')
        .select('*')
        .order('changed_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (flagKey) {
        query = query.eq('flag_key', flagKey);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];

    } catch (error) {
      logger.error('Error fetching audit history:', error);
      throw error;
    }
  }

  async getAuditStatistics(days: number = 30): Promise<{
    total_changes: number;
    changes_by_user: Record<string, number>;
    changes_by_action: Record<string, number>;
    most_changed_flags: Array<{ flag_key: string; change_count: number }>;
    risk_assessment: {
      high_risk_changes: number;
      medium_risk_changes: number;
      low_risk_changes: number;
    };
  }> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from('feature_flag_audit_log')
        .select('*')
        .gte('changed_at', startDate.toISOString());

      if (error) throw error;

      const logs = data || [];

      // Calculate statistics
      const changesByUser: Record<string, number> = {};
      const changesByAction: Record<string, number> = {};
      const flagChangeCount: Record<string, number> = {};
      let highRisk = 0, mediumRisk = 0, lowRisk = 0;

      logs.forEach(log => {
        // Count by user
        changesByUser[log.changed_by || 'unknown'] = (changesByUser[log.changed_by || 'unknown'] || 0) + 1;

        // Count by action
        changesByAction[log.action] = (changesByAction[log.action] || 0) + 1;

        // Count by flag
        flagChangeCount[log.flag_key] = (flagChangeCount[log.flag_key] || 0) + 1;

        // Risk assessment
        const riskLevel = this.assessChangeRisk(log.action, log.old_values, log.new_values);
        switch (riskLevel) {
          case 'high': highRisk++; break;
          case 'medium': mediumRisk++; break;
          case 'low': lowRisk++; break;
        }
      });

      // Sort most changed flags
      const mostChangedFlags = Object.entries(flagChangeCount)
        .map(([flag_key, change_count]) => ({ flag_key, change_count }))
        .sort((a, b) => b.change_count - a.change_count)
        .slice(0, 10);

      return {
        total_changes: logs.length,
        changes_by_user: changesByUser,
        changes_by_action: changesByAction,
        most_changed_flags,
        risk_assessment: {
          high_risk_changes: highRisk,
          medium_risk_changes: mediumRisk,
          low_risk_changes: lowRisk,
        },
      };

    } catch (error) {
      logger.error('Error calculating audit statistics:', error);
      throw error;
    }
  }

  // Rollback Management
  async createRollbackPoint(
    flagKey: string,
    action: string,
    userId: string,
    oldValue?: any,
    newValue?: any
  ): Promise<string> {
    try {
      // Get current state of all flags
      const { data: currentFlags, error } = await supabase
        .from('feature_flags')
        .select('*');

      if (error) throw error;

      const flagSnapshot: Record<string, FeatureFlag> = {};
      currentFlags?.forEach(flag => {
        flagSnapshot[flag.flag_key] = flag;
      });

      const rollbackPoint: RollbackPoint = {
        id: this.generateRollbackId(),
        timestamp: new Date().toISOString(),
        description: `${action} on ${flagKey}`,
        flagSnapshot,
        changes: [{
          flag_key: flagKey,
          action,
          oldValue,
          newValue,
        }],
        created_by: userId,
      };

      // Store rollback point in database
      const { error: insertError } = await supabase
        .from('feature_flag_rollback_points')
        .insert([{
          id: rollbackPoint.id,
          description: rollbackPoint.description,
          flag_snapshot: rollbackPoint.flagSnapshot,
          changes: rollbackPoint.changes,
          created_by: userId,
        }]);

      if (insertError) throw insertError;

      // Cache rollback point
      this.rollbackPoints.set(rollbackPoint.id, rollbackPoint);

      logger.info(`Rollback point created: ${rollbackPoint.id}`);

      return rollbackPoint.id;

    } catch (error) {
      logger.error('Error creating rollback point:', error);
      throw error;
    }
  }

  async rollbackToSnapshot(rollbackId: string, userId: string): Promise<void> {
    try {
      // Get rollback point
      const { data: rollbackPoint, error } = await supabase
        .from('feature_flag_rollback_points')
        .select('*')
        .eq('id', rollbackId)
        .single();

      if (error) throw error;
      if (!rollbackPoint) throw new Error('Rollback point not found');

      const snapshot = rollbackPoint.flag_snapshot as Record<string, FeatureFlag>;

      // Start transaction to rollback all flags
      const rollbackPromises = Object.entries(snapshot).map(async ([flagKey, flag]) => {
        try {
          const { error: updateError } = await supabase
            .from('feature_flags')
            .update({
              is_active: flag.is_active,
              rollout_percentage: flag.rollout_percentage,
              target_segments: flag.target_segments,
              environments: flag.environments,
              start_date: flag.start_date,
              end_date: flag.end_date,
              metadata: flag.metadata,
              updated_at: new Date().toISOString(),
            })
            .eq('flag_key', flagKey);

          if (updateError) throw updateError;

          // Log the rollback action
          await this.logChange(
            flagKey,
            'rollback',
            userId,
            undefined,
            flag,
            `Rollback to snapshot ${rollbackId}`
          );

        } catch (error) {
          logger.error(`Failed to rollback flag ${flagKey}:`, error);
          throw error;
        }
      });

      await Promise.all(rollbackPromises);

      logger.info(`Successfully rolled back to snapshot: ${rollbackId}`);

    } catch (error) {
      logger.error('Error during rollback:', error);
      throw error;
    }
  }

  async rollbackSingleFlag(
    flagKey: string,
    userId: string,
    targetState?: FeatureFlag
  ): Promise<void> {
    try {
      // If no target state provided, find the last state before the most recent change
      if (!targetState) {
        targetState = await this.getPreviousFlagState(flagKey);
      }

      if (!targetState) {
        throw new Error('No previous state found for rollback');
      }

      // Update the flag
      const { error } = await supabase
        .from('feature_flags')
        .update({
          is_active: targetState.is_active,
          rollout_percentage: targetState.rollout_percentage,
          target_segments: targetState.target_segments,
          environments: targetState.environments,
          start_date: targetState.start_date,
          end_date: targetState.end_date,
          metadata: targetState.metadata,
          updated_at: new Date().toISOString(),
        })
        .eq('flag_key', flagKey);

      if (error) throw error;

      // Log the rollback
      await this.logChange(
        flagKey,
        'rollback',
        userId,
        undefined,
        targetState,
        'Single flag rollback'
      );

      logger.info(`Successfully rolled back flag: ${flagKey}`);

    } catch (error) {
      logger.error('Error during single flag rollback:', error);
      throw error;
    }
  }

  async getRollbackPoints(limit: number = 20): Promise<RollbackPoint[]> {
    try {
      const { data, error } = await supabase
        .from('feature_flag_rollback_points')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return data?.map(point => ({
        id: point.id,
        timestamp: point.created_at,
        description: point.description,
        flagSnapshot: point.flag_snapshot,
        changes: point.changes,
        created_by: point.created_by,
      })) || [];

    } catch (error) {
      logger.error('Error fetching rollback points:', error);
      throw error;
    }
  }

  // Change Impact Analysis
  async analyzeChangeImpact(
    flagKey: string,
    proposedChange: Partial<FeatureFlagFormData>,
    userId: string
  ): Promise<ChangeImpact> {
    try {
      // Get current flag state
      const { data: currentFlag, error } = await supabase
        .from('feature_flags')
        .select('*')
        .eq('flag_key', flagKey)
        .single();

      if (error && error.code !== 'PGRST116') { // Not found error
        throw error;
      }

      // Estimate affected users
      const affectedUsers = await this.estimateAffectedUsers(flagKey, proposedChange, currentFlag);

      // Assess risk level
      const riskLevel = this.assessChangeRisk(
        currentFlag ? 'updated' : 'created',
        currentFlag,
        proposedChange
      );

      // Generate impact description
      const estimatedImpact = this.generateImpactDescription(
        flagKey,
        proposedChange,
        currentFlag,
        affectedUsers
      );

      // Generate recommendations
      const recommendations = this.generateRecommendations(
        riskLevel,
        proposedChange,
        currentFlag
      );

      return {
        flag_key: flagKey,
        affected_users: affectedUsers,
        risk_level: riskLevel,
        estimated_impact: estimatedImpact,
        recommendations,
      };

    } catch (error) {
      logger.error('Error analyzing change impact:', error);
      throw error;
    }
  }

  // Private helper methods
  private shouldCreateRollbackPoint(action: string, oldValue?: any, newValue?: any): boolean {
    const highRiskActions = ['deleted', 'activated', 'deactivated'];
    const significantRolloutChange = (
      oldValue?.rollout_percentage !== newValue?.rollout_percentage &&
      Math.abs((oldValue?.rollout_percentage || 0) - (newValue?.rollout_percentage || 0)) > 25
    );

    return highRiskActions.includes(action) || significantRolloutChange;
  }

  private getDefaultReason(action: string): string {
    const reasons: Record<string, string> = {
      created: 'New feature flag created',
      updated: 'Feature flag configuration updated',
      activated: 'Feature flag activated',
      deactivated: 'Feature flag deactivated',
      deleted: 'Feature flag deleted',
      rollback: 'Feature flag rolled back',
    };

    return reasons[action] || 'Feature flag changed';
  }

  private assessChangeRisk(action: string, oldValue?: any, newValue?: any): 'low' | 'medium' | 'high' {
    // High risk actions
    if (['deleted', 'activated'].includes(action)) return 'high';

    // Check for significant rollout changes
    if (oldValue?.rollout_percentage !== newValue?.rollout_percentage) {
      const oldPercentage = oldValue?.rollout_percentage || 0;
      const newPercentage = newValue?.rollout_percentage || 0;
      const change = Math.abs(newPercentage - oldPercentage);

      if (change > 50) return 'high';
      if (change > 25) return 'medium';
    }

    // Check for environment changes
    if (JSON.stringify(oldValue?.environments) !== JSON.stringify(newValue?.environments)) {
      return 'medium';
    }

    // Check for metadata changes that might affect logic
    if (JSON.stringify(oldValue?.metadata) !== JSON.stringify(newValue?.metadata)) {
      return 'medium';
    }

    return 'low';
  }

  private generateRollbackId(): string {
    return `rollback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private loadRollbackPoints(): void {
    // Load recent rollback points into memory for quick access
    this.getRollbackPoints(10).then(points => {
      points.forEach(point => {
        this.rollbackPoints.set(point.id, point);
      });
    }).catch(error => {
      logger.warn('Failed to load rollback points:', error);
    });
  }

  private startRetentionCleanup(): void {
    // Clean up old audit logs and rollback points
    setInterval(async () => {
      try {
        await this.cleanupOldRecords();
      } catch (error) {
        logger.error('Error during retention cleanup:', error);
      }
    }, 24 * 60 * 60 * 1000); // Daily
  }

  private async cleanupOldRecords(): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.auditConfig.retentionDays);

    // Clean up old audit logs
    const { error: auditError } = await supabase
      .from('feature_flag_audit_log')
      .delete()
      .lt('changed_at', cutoffDate.toISOString());

    if (auditError) {
      logger.error('Error cleaning up old audit logs:', auditError);
    }

    // Clean up old rollback points (keep only last 30 days)
    const rollbackCutoffDate = new Date();
    rollbackCutoffDate.setDate(rollbackCutoffDate.getDate() - 30);

    const { error: rollbackError } = await supabase
      .from('feature_flag_rollback_points')
      .delete()
      .lt('created_at', rollbackCutoffDate.toISOString());

    if (rollbackError) {
      logger.error('Error cleaning up old rollback points:', rollbackError);
    }

    logger.info('Retention cleanup completed');
  }

  private async estimateAffectedUsers(
    flagKey: string,
    proposedChange: Partial<FeatureFlagFormData>,
    currentFlag?: FeatureFlag | null
  ): Promise<number> {
    try {
      // Get total active users (simplified estimation)
      const { count } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      const totalUsers = count || 0;

      // Estimate based on rollout percentage
      const rolloutPercentage = proposedChange.rollout_percentage ?? currentFlag?.rollout_percentage ?? 0;
      return Math.floor((totalUsers * rolloutPercentage) / 100);

    } catch (error) {
      logger.error('Error estimating affected users:', error);
      return 0;
    }
  }

  private generateImpactDescription(
    flagKey: string,
    proposedChange: Partial<FeatureFlagFormData>,
    currentFlag: FeatureFlag | null | undefined,
    affectedUsers: number
  ): string {
    const action = currentFlag ? 'updated' : 'created';
    const rolloutChange = currentFlag && proposedChange.rollout_percentage !== undefined
      ? ` from ${currentFlag.rollout_percentage}% to ${proposedChange.rollout_percentage}%`
      : ` at ${proposedChange.rollout_percentage || 0}%`;

    return `Flag "${flagKey}" will be ${action}${rolloutChange}, affecting approximately ${affectedUsers.toLocaleString()} users.`;
  }

  private generateRecommendations(
    riskLevel: 'low' | 'medium' | 'high',
    proposedChange: Partial<FeatureFlagFormData>,
    currentFlag?: FeatureFlag | null
  ): string[] {
    const recommendations: string[] = [];

    if (riskLevel === 'high') {
      recommendations.push('Consider creating a rollback point before applying this change');
      recommendations.push('Monitor the change closely for the first few hours');
    }

    if (proposedChange.rollout_percentage && proposedChange.rollout_percentage > 50) {
      recommendations.push('Consider a gradual rollout starting with a smaller percentage');
    }

    if (!currentFlag) {
      recommendations.push('Test the flag in a staging environment first');
    }

    if (proposedChange.is_active && (!currentFlag || !currentFlag.is_active)) {
      recommendations.push('Ensure proper monitoring and alerting are in place');
    }

    return recommendations;
  }

  private async getPreviousFlagState(flagKey: string): Promise<FeatureFlag | null> {
    try {
      // Get the most recent audit log entry for this flag
      const { data, error } = await supabase
        .from('feature_flag_audit_log')
        .select('*')
        .eq('flag_key', flagKey)
        .order('changed_at', { ascending: false })
        .limit(1);

      if (error) throw error;
      if (!data || data.length === 0) return null;

      // Return the old values from the most recent change
      return data[0].old_values as FeatureFlag;

    } catch (error) {
      logger.error('Error getting previous flag state:', error);
      return null;
    }
  }
}

// Export singleton instance
export const featureFlagAuditService = FeatureFlagAuditService.getInstance();

// Export convenience functions
export const {
  logChange,
  getAuditHistory,
  getAuditStatistics,
  createRollbackPoint,
  rollbackToSnapshot,
  rollbackSingleFlag,
  getRollbackPoints,
  analyzeChangeImpact,
} = featureFlagAuditService;