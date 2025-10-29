import { supabase } from '@/integrations/supabase/client';

import { HealthScore, DependencyHealth } from './types';
import { dependencyMonitor } from './dependency-monitor';
import { healthChecker } from './health-checker';

interface ComponentWeight {
  component: string;
  weight: number;
  critical: boolean;
}

interface HealthScoreConfig {
  weights: ComponentWeight[];
  thresholds: {
    healthy: number;
    degraded: number;
  };
  trendWindow: number; // minutes
}

export class HealthScorer {
  private supabase = createClient();
  private config: HealthScoreConfig;
  private scoreHistory: HealthScore[] = [];

  constructor() {
    this.config = {
      weights: [
        { component: 'database', weight: 30, critical: true },
        { component: 'supabase', weight: 25, critical: true },
        { component: 'stripe', weight: 20, critical: true },
        { component: 'memory', weight: 10, critical: false },
        { component: 'cache', weight: 5, critical: false },
        { component: 'booksy', weight: 5, critical: false },
        { component: 'cdn', weight: 5, critical: false }
      ],
      thresholds: {
        healthy: 90,
        degraded: 70
      },
      trendWindow: 15 // 15 minutes
    };
  }

  async calculateOverallHealthScore(): Promise<HealthScore> {
    const [healthResult, dependencies] = await Promise.all([
      healthChecker.runHealthChecks(),
      dependencyMonitor.checkAllDependencies()
    ]);

    const components: Record<string, number> = {};
    let weightedSum = 0;
    let totalWeight = 0;

    // Score internal health checks
    healthResult.checks.forEach(check => {
      const score = this.getCheckScore(check);
      const weight = this.getComponentWeight(check.name);

      components[check.name] = score;
      weightedSum += score * weight;
      totalWeight += weight;
    });

    // Score dependencies
    dependencies.forEach(dep => {
      const score = this.getDependencyScore(dep);
      const weight = this.getComponentWeight(`dep_${dep.name}`);

      components[`dep_${dep.name}`] = score;
      weightedSum += score * weight;
      totalWeight += weight;
    });

    // Calculate overall score
    const overall = totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;

    // Determine trend
    const trend = this.calculateTrend(overall);

    const healthScore: HealthScore = {
      overall,
      components,
      timestamp: new Date().toISOString(),
      trend
    };

    // Store score for trend calculation
    this.addToHistory(healthScore);

    // Persist to database
    await this.storeHealthScore(healthScore);

    return healthScore;
  }

  private getCheckScore(check: any): number {
    if (check.status === 'pass') {
      return 100;
    } else if (check.status === 'warn') {
      // Consider duration for warnings
      if (check.duration > 5000) {
        return 60;
      } else if (check.duration > 2000) {
        return 75;
      } else {
        return 85;
      }
    } else {
      return 0;
    }
  }

  private getDependencyScore(dep: DependencyHealth): number {
    if (dep.status === 'healthy') {
      // Factor in response time
      if (dep.responseTime && dep.responseTime < 100) {
        return 100;
      } else if (dep.responseTime && dep.responseTime < 500) {
        return 90;
      } else if (dep.responseTime && dep.responseTime < 1000) {
        return 80;
      } else {
        return 70;
      }
    } else if (dep.status === 'degraded') {
      return 40;
    } else {
      return 0;
    }
  }

  private getComponentWeight(component: string): number {
    const weightConfig = this.config.weights.find(w => w.component === component);
    return weightConfig ? weightConfig.weight : 1;
  }

  private calculateTrend(currentScore: number): 'improving' | 'stable' | 'degrading' {
    if (this.scoreHistory.length < 3) {
      return 'stable';
    }

    // Get recent scores within trend window
    const cutoff = new Date(Date.now() - this.config.trendWindow * 60 * 1000);
    const recentScores = this.scoreHistory
      .filter(score => new Date(score.timestamp) > cutoff)
      .map(score => score.overall);

    if (recentScores.length < 2) {
      return 'stable';
    }

    // Calculate trend
    const firstHalf = recentScores.slice(0, Math.floor(recentScores.length / 2));
    const secondHalf = recentScores.slice(Math.floor(recentScores.length / 2));

    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

    const change = secondAvg - firstAvg;

    if (change > 5) {
      return 'improving';
    } else if (change < -5) {
      return 'degrading';
    } else {
      return 'stable';
    }
  }

  private addToHistory(score: HealthScore) {
    this.scoreHistory.push(score);

    // Keep only recent history (last 24 hours)
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    this.scoreHistory = this.scoreHistory.filter(
      s => new Date(s.timestamp) > cutoff
    );
  }

  private async storeHealthScore(score: HealthScore) {
    try {
      await this.supabase
        .from('health_scores')
        .insert({
          overall_score: score.overall,
          components: score.components,
          trend: score.trend,
          timestamp: score.timestamp
        });
    } catch (error) {
      console.error('Failed to store health score:', error);
    }
  }

  async getHistoricalScores(hours: number = 24): Promise<HealthScore[]> {
    try {
      const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

      const { data, error } = await this.supabase
        .from('health_scores')
        .select('*')
        .gte('timestamp', since)
        .order('timestamp', { ascending: true });

      if (error) throw error;

      return data?.map(row => ({
        overall: row.overall_score,
        components: row.components,
        timestamp: row.timestamp,
        trend: row.trend
      })) || [];
    } catch (error) {
      console.error('Failed to fetch historical scores:', error);
      return [];
    }
  }

  async getComponentScores(component: string, hours: number = 24): Promise<number[]> {
    const scores = await this.getHistoricalScores(hours);
    return scores.map(score => score.components[component] || 0);
  }

  getHealthStatus(score: number): 'healthy' | 'degraded' | 'unhealthy' {
    if (score >= this.config.thresholds.healthy) {
      return 'healthy';
    } else if (score >= this.config.thresholds.degraded) {
      return 'degraded';
    } else {
      return 'unhealthy';
    }
  }

  getCriticalComponents(): string[] {
    return this.config.weights
      .filter(w => w.critical)
      .map(w => w.component);
  }

  updateConfig(config: Partial<HealthScoreConfig>) {
    this.config = { ...this.config, ...config };
  }

  async generateHealthReport(): Promise<{
    current: HealthScore;
    summary: {
      overall: string;
      critical: Record<string, string>;
      recommendations: string[];
    };
    trend: {
      period: string;
      direction: string;
      change: number;
    };
  }> {
    const current = await this.calculateOverallHealthScore();
    const historical = await this.getHistoricalScores(24);

    // Generate summary
    const overallStatus = this.getHealthStatus(current.overall);
    const critical: Record<string, string> = {};

    this.getCriticalComponents().forEach(component => {
      const score = current.components[component] || 0;
      critical[component] = this.getHealthStatus(score);
    });

    // Generate recommendations
    const recommendations = this.generateRecommendations(current);

    // Calculate trend
    const trend = {
      period: '24 hours',
      direction: current.trend,
      change: historical.length > 0 ? current.overall - historical[0].overall : 0
    };

    return {
      current,
      summary: {
        overall: overallStatus,
        critical,
        recommendations
      },
      trend
    };
  }

  private generateRecommendations(score: HealthScore): string[] {
    const recommendations: string[] = [];

    // Check each component
    Object.entries(score.components).forEach(([component, componentScore]) => {
      if (componentScore < 50) {
        const isDep = component.startsWith('dep_');
        const name = isDep ? component.substring(4) : component;
        const type = isDep ? 'external service' : 'component';

        recommendations.push(`${name} ${type} is performing poorly (${componentScore}%)`);
      }
    });

    // Overall recommendations
    if (score.overall < 70) {
      recommendations.push('Overall system health is degraded. Consider immediate investigation.');
    }

    if (score.trend === 'degrading') {
      recommendations.push('System health is trending downward. Monitor closely.');
    }

    // Memory-specific recommendations
    const memoryScore = score.components['memory'];
    if (memoryScore && memoryScore < 80) {
      recommendations.push('Memory usage is high. Consider scaling or optimization.');
    }

    return recommendations;
  }
}

export const healthScorer = new HealthScorer();