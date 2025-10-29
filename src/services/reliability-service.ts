import { dependencyMonitor } from '@/lib/reliability/dependency-monitor';
import { alertingSystem } from '@/lib/reliability/alerting';
import { sloMonitor } from '@/lib/reliability/slo-monitor';
import { automatedRecovery } from '@/lib/reliability/automated-recovery';
import { healthChecker } from '@/lib/reliability/health-checker';
import { healthScorer } from '@/lib/reliability/health-scorer';
import { auditLogger } from '@/lib/reliability/audit-logger';

export class ReliabilityService {
  private initialized = false;
  private intervals: NodeJS.Timeout[] = [];

  async initialize() {
    if (this.initialized) {
      console.log('Reliability service already initialized');
      return;
    }

    console.log('Initializing Reliability Service...');

    try {
      // Start dependency monitoring
      console.log('Starting dependency monitoring...');
      dependencyMonitor.startMonitoring();

      // Start SLO monitoring
      console.log('Starting SLO monitoring...');
      sloMonitor.startMonitoring();

      // Start alerting evaluation
      console.log('Starting alerting system...');
      alertingSystem.startEvaluation();

      // Run initial health checks
      console.log('Running initial health checks...');
      const health = await healthChecker.runHealthChecks();
      const dependencies = await dependencyMonitor.checkAllDependencies();
      const score = await healthScorer.calculateOverallHealthScore();

      console.log(`Initial health status: ${health.status} (Score: ${score.overall}%)`);
      console.log(`Dependencies: ${dependencies.filter(d => d.status === 'healthy').length}/${dependencies.length} healthy`);

      // Set up continuous monitoring
      this.setupContinuousMonitoring();

      // Graceful shutdown handlers
      this.setupShutdownHandlers();

      this.initialized = true;
      console.log('Reliability Service initialized successfully');

    } catch (error) {
      console.error('Failed to initialize Reliability Service:', error);
      throw error;
    }
  }

  private setupContinuousMonitoring() {
    // Health check interval (every minute)
    const healthInterval = setInterval(async () => {
      try {
        const [health, dependencies, score] = await Promise.all([
          healthChecker.runHealthChecks(),
          dependencyMonitor.checkAllDependencies(),
          healthScorer.calculateOverallHealthScore()
        ]);

        // Evaluate alert rules
        await alertingSystem.evaluateRules({
          healthCheck: health,
          healthScore: score,
          timestamp: new Date().toISOString()
        });

        // Log system health event
        auditLogger.logSystemEvent(
          'health_check',
          'system',
          health.status === 'healthy' ? 'success' : 'failure',
          {
            score: score.overall,
            status: health.status,
            dependencies: {
              total: dependencies.length,
              healthy: dependencies.filter(d => d.status === 'healthy').length
            }
          }
        );

      } catch (error) {
        console.error('Health monitoring error:', error);
      }
    }, 60000); // 1 minute

    this.intervals.push(healthInterval);

    // Automated recovery interval (every 5 minutes)
    const recoveryInterval = setInterval(async () => {
      try {
        const attempts = await automatedRecovery.runRecovery();
        if (attempts.length > 0) {
          console.log(`Automated recovery executed: ${attempts.length} attempts`);
        }
      } catch (error) {
        console.error('Automated recovery error:', error);
      }
    }, 5 * 60000); // 5 minutes

    this.intervals.push(recoveryInterval);

    // Audit log cleanup interval (daily)
    const cleanupInterval = setInterval(async () => {
      try {
        await auditLogger.cleanup(365); // Keep 1 year
      } catch (error) {
        console.error('Audit cleanup error:', error);
      }
    }, 24 * 60 * 60 * 1000); // 24 hours

    this.intervals.push(cleanupInterval);

    // SLO calculation is handled by sloMonitor.startMonitoring()
  }

  private setupShutdownHandlers() {
    const shutdown = async (signal: string) => {
      console.log(`\nReceived ${signal}, shutting down Reliability Service...`);

      // Clear all intervals
      this.intervals.forEach(clearInterval);
      this.intervals = [];

      // Stop monitoring systems
      dependencyMonitor.stopMonitoring();
      sloMonitor.stopMonitoring();
      alertingSystem.stopEvaluation();

      // Flush audit logs
      auditLogger.destroy();

      console.log('Reliability Service shutdown complete');
      process.exit(0);
    };

    // Register shutdown handlers
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGUSR2', () => shutdown('SIGUSR2')); // nodemon restart
  }

  async runDiagnostic() {
    console.log('\n=== Reliability Diagnostic Report ===\n');

    try {
      // Health checks
      console.log('1. Health Checks:');
      const health = await healthChecker.runHealthChecks();
      console.log(`   Status: ${health.status}`);
      console.log(`   Duration: ${health.duration}ms`);
      health.checks.forEach(check => {
        console.log(`   - ${check.name}: ${check.status} (${check.duration}ms)`);
      });

      // Dependencies
      console.log('\n2. Dependencies:');
      const dependencies = await dependencyMonitor.checkAllDependencies();
      dependencies.forEach(dep => {
        console.log(`   - ${dep.name}: ${dep.status} ${dep.responseTime ? `(${dep.responseTime}ms)` : ''}`);
      });

      // Health score
      console.log('\n3. Health Score:');
      const score = await healthScorer.calculateOverallHealthScore();
      console.log(`   Overall: ${score.overall}%`);
      console.log(`   Trend: ${score.trend}`);
      console.log('   Components:');
      Object.entries(score.components).forEach(([name, value]) => {
        console.log(`     ${name}: ${value}%`);
      });

      // Active alerts
      console.log('\n4. Active Alerts:');
      const alerts = alertingSystem.getActiveAlerts();
      if (alerts.length === 0) {
        console.log('   No active alerts');
      } else {
        alerts.forEach(alert => {
          console.log(`   - ${alert.severity}: ${alert.message}`);
        });
      }

      // SLO status
      console.log('\n5. SLO Status:');
      const sloStatuses = await sloMonitor.getAllErrorBudgetStatuses();
      sloStatuses.forEach(status => {
        console.log(`   - ${status.sloId}: ${status.status} (${status.errorBudget.toFixed(2)}% remaining)`);
      });

      // Recovery stats
      console.log('\n6. Recovery Stats:');
      const recoveryStats = await automatedRecovery.getRecoveryStats(24);
      console.log(`   Attempts: ${recoveryStats.totalAttempts}`);
      console.log(`   Success Rate: ${recoveryStats.successRate.toFixed(1)}%`);

      console.log('\n=== End Diagnostic Report ===\n');

    } catch (error) {
      console.error('Diagnostic failed:', error);
    }
  }

  async getStatus() {
    const [health, dependencies, score, alerts, sloStatuses] = await Promise.all([
      healthChecker.runHealthChecks(),
      dependencyMonitor.checkAllDependencies(),
      healthScorer.calculateOverallHealthScore(),
      alertingSystem.getActiveAlerts(),
      sloMonitor.getAllErrorBudgetStatuses()
    ]);

    return {
      initialized: this.initialized,
      health: {
        status: health.status,
        score: score.overall,
        checks: health.checks.length
      },
      dependencies: {
        total: dependencies.length,
        healthy: dependencies.filter(d => d.status === 'healthy').length,
        unhealthy: dependencies.filter(d => d.status === 'unhealthy').length
      },
      alerts: {
        active: alerts.length,
        critical: alerts.filter(a => a.severity === 'critical').length
      },
      slos: {
        total: sloStatuses.length,
        burning: sloStatuses.filter(s => s.status === 'burning').length,
        exhausted: sloStatuses.filter(s => s.status === 'exhausted').length
      }
    };
  }

  isInitialized() {
    return this.initialized;
  }
}

// Singleton instance
export const reliabilityService = new ReliabilityService();

// Auto-initialize in production
if (import.meta.env.PROD) {
  reliabilityService.initialize().catch(console.error);
}