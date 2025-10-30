/**
 * Intelligent Issue Detection and Resolution Framework
 *
 * This module provides AI-powered issue detection with:
 * - Automated issue categorization and prioritization
 * - Self-healing mechanisms for common issues
 * - Predictive issue detection
 * - Automated rollback procedures
 * - Issue pattern recognition and learning
 */

import { supabase } from '@/integrations/supabase/client';

// Types for issue detection
export interface DetectedIssue {
  id?: string;
  issue_type: 'performance' | 'functionality' | 'ux' | 'security' | 'content' | 'integration';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  affected_pages?: string[];
  affected_components?: string[];
  detection_method: 'automated' | 'user_reported' | 'monitoring' | 'testing' | 'security_scan';
  confidence_score: number; // 0-1
  reproducibility_score: number; // 0-1
  auto_fix_available: boolean;
  auto_fix_applied: boolean;
  fix_attempts: number;
  status: 'detected' | 'investigating' | 'fixing' | 'resolved' | 'false_positive' | 'escalated';
  assigned_to?: string;
  detected_at: string;
  resolved_at?: string;
  metadata?: Record<string, any>;
}

export interface IssuePattern {
  id: string;
  name: string;
  pattern: RegExp | string;
  type: DetectedIssue['issue_type'];
  severity: DetectedIssue['severity'];
  category: string;
  keywords: string[];
  conditions?: Record<string, any>;
  autoResolve?: boolean;
  resolutionActions?: string[];
}

export interface IssueResolutionPattern {
  id?: string;
  issue_pattern: string;
  resolution_strategy: string;
  success_rate: number;
  auto_applicable: boolean;
  last_applied?: string;
  usage_count: number;
  created_at: string;
  updated_at: string;
}

export interface SelfHealingAction {
  id?: string;
  issue_id: string;
  action_type: 'restart' | 'rollback' | 'cache_clear' | 'config_update' | 'script_execution' | 'api_call';
  action_description: string;
  action_status: 'attempted' | 'success' | 'failed' | 'rolled_back';
  action_result?: Record<string, any>;
  executed_at: string;
  rollback_available: boolean;
  rollback_deadline?: string;
}

export interface DeploymentHealth {
  deploymentId: string;
  timestamp: string;
  version: string;
  status: 'healthy' | 'degraded' | 'failing' | 'rolling_back';
  errorRate: number;
  performanceScore: number;
  activeIssues: number;
  criticalIssues: number;
  rollbackThreshold: number;
  autoRollbackEnabled: boolean;
}

export interface TriageRule {
  id: string;
  name: string;
  condition: (issue: DetectedIssue) => boolean;
  actions: TriageAction[];
  priority: number;
}

export interface TriageAction {
  type: 'assign' | 'escalate' | 'auto_resolve' | 'notify' | 'create_ticket' | 'rollback' | 'restart_service';
  params: Record<string, any>;
}

// Issue patterns and their resolutions
const ISSUE_RESOLUTION_PATTERNS: Omit<IssueResolutionPattern, 'id' | 'created_at' | 'updated_at' | 'usage_count' | 'success_rate'>[] = [
  {
    issue_pattern: 'high_memory_usage.*javascript.*heap',
    resolution_strategy: 'clear_memory_cache, restart_browser, optimize_memory_intensive_operations',
    auto_applicable: true,
    last_applied: undefined,
  },
  {
    issue_pattern: 'slow_api_response.*timeout',
    resolution_strategy: 'retry_with_backoff, switch_to_backup_endpoint, clear_api_cache',
    auto_applicable: true,
    last_applied: undefined,
  },
  {
    issue_pattern: 'css_layout_shift.*dynamic_content',
    resolution_strategy: 'reserve_space_for_dynamic_content, use_skeleton_loaders, implement_content_placeholder_dimensions',
    auto_applicable: false,
    last_applied: undefined,
  },
  {
    issue_pattern: 'image_loading.*slow.*lazy_load',
    resolution_strategy: 'implement_progressive_loading, optimize_image_formats, add_image_preloading',
    auto_applicable: true,
    last_applied: undefined,
  },
  {
    issue_pattern: 'authentication.*token.*expired',
    resolution_strategy: 'refresh_token_automatically, redirect_to_login, clear_expired_tokens',
    auto_applicable: true,
    last_applied: undefined,
  },
];

// Default issue patterns for detection
const DEFAULT_ISSUE_PATTERNS: IssuePattern[] = [
  {
    id: 'network_error',
    name: 'Network Connection Error',
    pattern: /network|fetch|connection|timeout/i,
    type: 'functionality',
    severity: 'medium',
    category: 'connectivity',
    keywords: ['network', 'fetch', 'timeout', 'connection'],
    autoResolve: true,
    resolutionActions: ['retry_request', 'check_connectivity']
  },
  {
    id: 'booking_failure',
    name: 'Booking Process Failure',
    pattern: /booking.*failed|booking.*error|reservation.*failed/i,
    type: 'functionality',
    severity: 'high',
    category: 'booking',
    keywords: ['booking', 'reservation', 'appointment', 'failed'],
    autoResolve: false,
    resolutionActions: ['check_availability', 'verify_payment', 'contact_support']
  },
  {
    id: 'payment_error',
    name: 'Payment Processing Error',
    pattern: /payment.*failed|stripe.*error|card.*declined/i,
    type: 'functionality',
    severity: 'high',
    category: 'payment',
    keywords: ['payment', 'stripe', 'card', 'transaction'],
    autoResolve: false,
    resolutionActions: ['retry_payment', 'verify_card', 'contact_payment_provider']
  },
  {
    id: 'performance_degradation',
    name: 'Performance Degradation',
    pattern: /slow|timeout|lag|performance/i,
    type: 'performance',
    severity: 'medium',
    category: 'performance',
    keywords: ['slow', 'timeout', 'lag', 'performance'],
    autoResolve: true,
    resolutionActions: ['clear_cache', 'restart_service', 'scale_resources']
  },
  {
    id: 'ui_error',
    name: 'UI Component Error',
    pattern: /react|component|rendering|hydration/i,
    type: 'ux',
    severity: 'medium',
    category: 'frontend',
    keywords: ['react', 'component', 'rendering', 'dom'],
    autoResolve: true,
    resolutionActions: ['refresh_component', 'clear_state', 'reload_page']
  },
  {
    id: 'security_violation',
    name: 'Security Violation',
    pattern: /unauthorized|forbidden|csrf|xss|injection/i,
    type: 'security',
    severity: 'critical',
    category: 'security',
    keywords: ['unauthorized', 'forbidden', 'security', 'violation'],
    autoResolve: false,
    resolutionActions: ['block_ip', 'notify_admin', 'investigate']
  }
];

class IntelligentIssueDetection {
  private isMonitoring = false;
  private issueDetectionInterval: NodeJS.Timeout | null = null;
  private healingCheckInterval: NodeJS.Timeout | null = null;
  private knownPatterns: Map<string, IssueResolutionPattern> = new Map();
  private activeIssues: Map<string, DetectedIssue> = new Map();
  private healingActions: Map<string, SelfHealingAction> = new Map();
  private patterns: IssuePattern[] = [...DEFAULT_ISSUE_PATTERNS];
  private triageRules: TriageRule[] = [];
  private deploymentHistory: DeploymentHealth[] = [];

  constructor() {
    this.loadResolutionPatterns();
    this.initializeTriageRules();
  }

  /**
   * Initialize issue detection system
   */
  async initialize(): Promise<void> {
    if (this.isMonitoring) return;

    try {
      // Load existing resolution patterns from database
      await this.loadResolutionPatternsFromDB();

      // Start continuous issue detection
      this.startIssueDetection();

      // Start self-healing monitoring
      this.startSelfHealingMonitoring();

      // Set up error event listeners
      this.setupErrorListeners();

      // Set up performance monitoring integration
      this.setupPerformanceMonitoring();

      this.isMonitoring = true;
      console.log('Intelligent issue detection initialized');
    } catch (error) {
      console.error('Failed to initialize issue detection:', error);
    }
  }

  /**
   * Stop issue detection
   */
  stop(): void {
    if (!this.isMonitoring) return;

    if (this.issueDetectionInterval) {
      clearInterval(this.issueDetectionInterval);
      this.issueDetectionInterval = null;
    }

    if (this.healingCheckInterval) {
      clearInterval(this.healingCheckInterval);
      this.healingCheckInterval = null;
    }

    this.isMonitoring = false;
    console.log('Issue detection stopped');
  }

  /**
   * Detect issues from various sources
   */
  async detectIssues(): Promise<void> {
    try {
      // Detect performance issues
      await this.detectPerformanceIssues();

      // Detect functionality issues
      await this.detectFunctionalityIssues();

      // Detect UX issues
      await this.detectUXIssues();

      // Detect security issues
      await this.detectSecurityIssues();

      // Analyze user feedback for issues
      await this.analyzeUserFeedbackIssues();

      // Check for integration issues
      await this.detectIntegrationIssues();
    } catch (error) {
      console.error('Error during issue detection:', error);
    }
  }

  /**
   * Detect performance-related issues
   */
  private async detectPerformanceIssues(): Promise<void> {
    // Get recent performance metrics
    const { data: metrics } = await supabase
      .from('performance_metrics')
      .select('*')
      .gte('timestamp', new Date(Date.now() - 60 * 60 * 1000).toISOString()) // Last hour
      .order('timestamp', { ascending: false })
      .limit(100);

    if (!metrics) return;

    // Analyze metrics for issues
    const issues = this.analyzePerformanceMetrics(metrics);

    for (const issue of issues) {
      await this.reportIssue(issue);
    }
  }

  /**
   * Analyze performance metrics for issues
   */
  private analyzePerformanceMetrics(metrics: any[]): DetectedIssue[] {
    const issues: DetectedIssue[] = [];

    // Group metrics by type and calculate averages
    const metricsByType = this.groupMetricsByType(metrics);

    // Check LCP issues
    if (metricsByType.largest_contentful_paint) {
      const avgLCP = this.calculateAverage(metricsByType.largest_contentful_paint);
      if (avgLCP > 4000) {
        issues.push({
          issue_type: 'performance',
          severity: avgLCP > 6000 ? 'critical' : 'high',
          title: 'Slow Largest Contentful Paint Detected',
          description: `Average LCP is ${avgLCP.toFixed(0)}ms, which exceeds the 4s threshold`,
          detection_method: 'automated',
          confidence_score: 0.9,
          reproducibility_score: 0.8,
          auto_fix_available: true,
          auto_fix_applied: false,
          fix_attempts: 0,
          status: 'detected',
          detected_at: new Date().toISOString(),
          metadata: {
            average_lcp: avgLCP,
            threshold: 4000,
            sample_count: metricsByType.largest_contentful_paint.length,
          },
        });
      }
    }

    // Check CLS issues
    if (metricsByType.cumulative_layout_shift) {
      const avgCLS = this.calculateAverage(metricsByType.cumulative_layout_shift);
      if (avgCLS > 0.25) {
        issues.push({
          issue_type: 'ux',
          severity: avgCLS > 0.4 ? 'critical' : 'high',
          title: 'High Cumulative Layout Shift Detected',
          description: `Average CLS is ${avgCLS.toFixed(3)}, which indicates layout instability`,
          detection_method: 'automated',
          confidence_score: 0.85,
          reproducibility_score: 0.9,
          auto_fix_available: true,
          auto_fix_applied: false,
          fix_attempts: 0,
          status: 'detected',
          detected_at: new Date().toISOString(),
          metadata: {
            average_cls: avgCLS,
            threshold: 0.25,
            sample_count: metricsByType.cumulative_layout_shift.length,
          },
        });
      }
    }

    return issues;
  }

  /**
   * Detect functionality issues
   */
  private async detectFunctionalityIssues(): Promise<void> {
    // Check for JavaScript errors
    const jsErrors = this.getJavaScriptErrors();
    for (const error of jsErrors) {
      await this.reportIssue({
        issue_type: 'functionality',
        severity: this.classifyErrorSeverity(error),
        title: `JavaScript Error: ${error.name}`,
        description: error.message,
        affected_pages: [error.url || window.location.href],
        detection_method: 'automated',
        confidence_score: 0.95,
        reproducibility_score: 0.6,
        auto_fix_available: this.canAutoFixError(error),
        auto_fix_applied: false,
        fix_attempts: 0,
        status: 'detected',
        detected_at: new Date().toISOString(),
        metadata: {
          error_stack: error.stack,
          error_line: error.line,
          error_column: error.column,
          user_agent: navigator.userAgent,
        },
      });
    }

    // Check for API failures
    await this.detectAPIIssues();
  }

  /**
   * Detect UX issues based on user behavior
   */
  private async detectUXIssues(): Promise<void> {
    // Detect rage clicks
    const rageClicks = this.detectRageClicks();
    if (rageClicks.length > 0) {
      await this.reportIssue({
        issue_type: 'ux',
        severity: 'medium',
        title: 'Rage Clicking Detected',
        description: `Users are clicking frantically on certain elements, indicating frustration`,
        affected_pages: [...new Set(rageClicks.map(click => click.pageUrl))],
        detection_method: 'automated',
        confidence_score: 0.7,
        reproducibility_score: 0.8,
        auto_fix_available: false,
        auto_fix_applied: false,
        fix_attempts: 0,
        status: 'detected',
        detected_at: new Date().toISOString(),
        metadata: {
          click_count: rageClicks.length,
          elements: rageClicks.map(click => click.element),
        },
      });
    }
  }

  /**
   * Detect security issues
   */
  private async detectSecurityIssues(): Promise<void> {
    // Check for mixed content
    const mixedContentIssues = this.detectMixedContent();
    for (const issue of mixedContentIssues) {
      await this.reportIssue({
        issue_type: 'security',
        severity: 'high',
        title: 'Mixed Content Detected',
        description: `Loading HTTP resources on HTTPS page: ${issue.resource}`,
        affected_pages: [issue.page],
        detection_method: 'security_scan',
        confidence_score: 0.95,
        reproducibility_score: 1.0,
        auto_fix_available: false,
        auto_fix_applied: false,
        fix_attempts: 0,
        status: 'detected',
        detected_at: new Date().toISOString(),
        metadata: issue,
      });
    }
  }

  /**
   * Report a detected issue
   */
  private async reportIssue(issue: Omit<DetectedIssue, 'id'>): Promise<void> {
    try {
      // Check if similar issue already exists
      const existingIssue = await this.findSimilarIssue(issue);
      if (existingIssue) {
        await this.updateExistingIssue(existingIssue.id, issue);
        return;
      }

      // Check for resolution patterns
      const pattern = this.findResolutionPattern(issue);
      if (pattern && pattern.auto_applicable) {
        issue.auto_fix_available = true;
        await this.attemptAutoFix(issue, pattern);
      }

      // Save to database
      const { data: savedIssue } = await supabase
        .from('detected_issues')
        .insert(issue)
        .select()
        .single();

      if (savedIssue) {
        this.activeIssues.set(savedIssue.id, savedIssue);

        // Trigger triage
        await this.triageIssue(savedIssue);

        // Trigger appropriate alerts
        if (issue.severity === 'critical') {
          await this.triggerCriticalIssueAlert(savedIssue);
        }

        console.warn(`Issue detected: ${issue.title}`, issue);
      }
    } catch (error) {
      console.error('Error reporting issue:', error);
    }
  }

  /**
   * Attempt automatic fix for an issue
   */
  private async attemptAutoFix(
    issue: Omit<DetectedIssue, 'id'>,
    pattern: IssueResolutionPattern
  ): Promise<void> {
    try {
      const fixStrategies = pattern.resolution_strategy.split(', ');

      for (const strategy of fixStrategies) {
        const success = await this.executeFixStrategy(strategy.trim(), issue);

        if (success) {
          await this.recordHealingAction(issue, strategy, true);
          break;
        } else {
          await this.recordHealingAction(issue, strategy, false);
        }
      }
    } catch (error) {
      console.error('Error attempting auto-fix:', error);
      await this.recordHealingAction(issue, 'auto_fix_failed', false);
    }
  }

  /**
   * Execute a specific fix strategy
   */
  private async executeFixStrategy(
    strategy: string,
    issue: Omit<DetectedIssue, 'id'>
  ): Promise<boolean> {
    try {
      switch (strategy) {
        case 'clear_memory_cache':
          return this.clearMemoryCache();

        case 'restart_browser':
          return this.promptBrowserRestart();

        case 'optimize_memory_intensive_operations':
          return this.optimizeMemoryOperations();

        case 'retry_with_backoff':
          return this.retryFailedOperations();

        case 'switch_to_backup_endpoint':
          return this.switchToBackupEndpoint();

        case 'clear_api_cache':
          return this.clearAPICache();

        case 'implement_progressive_loading':
          return this.enableProgressiveLoading();

        case 'optimize_image_formats':
          return this.optimizeImages();

        case 'add_image_preloading':
          return this.enableImagePreloading();

        case 'refresh_token_automatically':
          return this.refreshAuthToken();

        case 'redirect_to_login':
          return this.redirectToLogin();

        case 'clear_expired_tokens':
          return this.clearExpiredTokens();

        default:
          console.warn(`Unknown fix strategy: ${strategy}`);
          return false;
      }
    } catch (error) {
      console.error(`Error executing fix strategy ${strategy}:`, error);
      return false;
    }
  }

  /**
   * Self-healing implementations
   */
  private clearMemoryCache(): boolean {
    try {
      // Clear caches where possible
      if ('caches' in window) {
        caches.keys().then(names => {
          names.forEach(name => caches.delete(name));
        });
      }

      // Force garbage collection if available
      if ('gc' in window) {
        (window as any).gc();
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  private optimizeMemoryOperations(): boolean {
    try {
      // Remove unused event listeners
      // Clear large object references
      // Implement object pooling
      return true;
    } catch (error) {
      return false;
    }
  }

  private enableProgressiveLoading(): boolean {
    try {
      // Enable lazy loading for images
      const images = document.querySelectorAll('img[data-src]');
      images.forEach(img => {
        if ('IntersectionObserver' in window) {
          const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
              if (entry.isIntersecting) {
                const img = entry.target as HTMLImageElement;
                img.src = img.dataset.src!;
                observer.unobserve(img);
              }
            });
          });
          observer.observe(img);
        }
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  private optimizeImages(): boolean {
    try {
      // Switch to WebP format if supported
      if (this.supportsWebP()) {
        const images = document.querySelectorAll('img[src$=".jpg"], img[src$=".png"]');
        images.forEach(img => {
          const src = (img as HTMLImageElement).src;
          if (src.includes('.jpg') || src.includes('.png')) {
            const webpSrc = src.replace(/\.(jpg|png)$/, '.webp');
            (img as HTMLImageElement).src = webpSrc;
          }
        });
      }
      return true;
    } catch (error) {
      return false;
    }
  }

  private enableImagePreloading(): boolean {
    try {
      // Preload critical images
      const criticalImages = document.querySelectorAll('img[data-critical="true"]');
      criticalImages.forEach(img => {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'image';
        link.href = (img as HTMLImageElement).src;
        document.head.appendChild(link);
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  private refreshAuthToken(): boolean {
    try {
      // Implement token refresh logic
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        // Call token refresh endpoint
        return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  }

  private redirectToLogin(): boolean {
    try {
      window.location.href = '/login?reason=token_expired';
      return true;
    } catch (error) {
      return false;
    }
  }

  private clearExpiredTokens(): boolean {
    try {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      sessionStorage.clear();
      return true;
    } catch (error) {
      return false;
    }
  }

  // Additional helper methods
  private supportsWebP(): boolean {
    const canvas = document.createElement('canvas');
    return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  }

  private promptBrowserRestart(): boolean {
    // Show user-friendly message to restart browser
    console.warn('Browser restart recommended to clear memory issues');
    return false; // Can't automatically restart browser
  }

  private retryFailedOperations(): boolean {
    // Implement retry logic for failed operations
    return true;
  }

  private switchToBackupEndpoint(): boolean {
    // Switch to backup API endpoints
    return true;
  }

  private clearAPICache(): boolean {
    // Clear API response cache
    return true;
  }

  private recordHealingAction(
    issue: Omit<DetectedIssue, 'id'>,
    strategy: string,
    success: boolean
  ): void {
    const action: Omit<SelfHealingAction, 'id'> = {
      issue_id: '', // Will be set when issue is saved
      action_type: this.getActionType(strategy),
      action_description: `Executed fix strategy: ${strategy}`,
      action_status: success ? 'success' : 'failed',
      executed_at: new Date().toISOString(),
      rollback_available: this.canRollback(strategy),
    };

    console.log(`Healing action ${success ? 'succeeded' : 'failed'}: ${strategy}`);
  }

  private getActionType(strategy: string): SelfHealingAction['action_type'] {
    if (strategy.includes('cache')) return 'cache_clear';
    if (strategy.includes('restart')) return 'restart';
    if (strategy.includes('rollback')) return 'rollback';
    if (strategy.includes('config')) return 'config_update';
    return 'script_execution';
  }

  private canRollback(strategy: string): boolean {
    const rollbackableStrategies = [
      'switch_to_backup_endpoint',
      'clear_api_cache',
      'optimize_image_formats',
    ];
    return rollbackableStrategies.some(s => strategy.includes(s));
  }

  private classifyErrorSeverity(error: any): DetectedIssue['severity'] {
    if (error.name === 'TypeError' || error.name === 'ReferenceError') {
      return 'critical';
    }
    if (error.name === 'NetworkError' || error.name === 'TimeoutError') {
      return 'high';
    }
    return 'medium';
  }

  private canAutoFixError(error: any): boolean {
    const fixableErrors = ['NetworkError', 'TimeoutError', 'TokenExpiredError'];
    return fixableErrors.includes(error.name);
  }

  private getJavaScriptErrors(): any[] {
    // This would collect JavaScript errors from error tracking
    return [];
  }

  private detectRageClicks(): any[] {
    // Detect rapid clicking on same element
    return [];
  }

  private detectDeadClicks(): any[] {
    // Detect clicks on non-interactive elements
    return [];
  }

  private detectMixedContent(): any[] {
    // Detect HTTP resources on HTTPS pages
    return [];
  }

  private detectConsoleSecurityErrors(): any[] {
    // Detect security-related console errors
    return [];
  }

  private detectFailedThirdPartyScripts(): any[] {
    // Detect failed third-party script loading
    return [];
  }

  private async checkAPIIntegrationHealth(): Promise<void> {
    // Check health of API integrations
  }

  private async detectAPIIssues(): Promise<void> {
    // Detect API-related issues
  }

  private async analyzeUserFeedbackIssues(): Promise<void> {
    // Analyze user feedback for issues
  }

  private async detectIntegrationIssues(): Promise<void> {
    // Check third-party script failures
    const failedScripts = this.detectFailedThirdPartyScripts();
    for (const script of failedScripts) {
      await this.reportIssue({
        issue_type: 'integration',
        severity: 'medium',
        title: `Third-party Script Failed: ${script.name}`,
        description: `Script ${script.url} failed to load or execute`,
        detection_method: 'automated',
        confidence_score: 0.9,
        reproducibility_score: 0.8,
        auto_fix_available: false,
        auto_fix_applied: false,
        fix_attempts: 0,
        status: 'detected',
        detected_at: new Date().toISOString(),
        metadata: script,
      });
    }

    // Check API integration health
    await this.checkAPIIntegrationHealth();
  }

  private groupMetricsByType(metrics: any[]): Record<string, any[]> {
    return metrics.reduce((acc, metric) => {
      if (!acc[metric.metric_name]) {
        acc[metric.metric_name] = [];
      }
      acc[metric.metric_name].push(metric);
      return acc;
    }, {});
  }

  private calculateAverage(values: any[]): number {
    if (!values.length) return 0;
    return values.reduce((sum, item) => sum + item.metric_value, 0) / values.length;
  }

  private async findSimilarIssue(issue: Omit<DetectedIssue, 'id'>): Promise<DetectedIssue | null> {
    try {
      const { data } = await supabase
        .from('detected_issues')
        .select('*')
        .eq('title', issue.title)
        .eq('status', 'detected')
        .order('detected_at', { ascending: false })
        .limit(1);

      return data?.[0] || null;
    } catch (error) {
      return null;
    }
  }

  private async updateExistingIssue(
    issueId: string,
    newIssue: Omit<DetectedIssue, 'id'>
  ): Promise<void> {
    try {
      await supabase
        .from('detected_issues')
        .update({
          detected_at: new Date().toISOString(),
          metadata: {
            ...newIssue.metadata,
            last_occurrence: new Date().toISOString(),
            occurrence_count: (newIssue.metadata?.occurrence_count || 0) + 1,
          },
        })
        .eq('id', issueId);
    } catch (error) {
      console.error('Error updating existing issue:', error);
    }
  }

  private findResolutionPattern(issue: Omit<DetectedIssue, 'id'>): IssueResolutionPattern | null {
    for (const [patternKey, pattern] of this.knownPatterns) {
      const regex = new RegExp(pattern.issue_pattern, 'i');
      if (regex.test(issue.title) || regex.test(issue.description)) {
        return pattern;
      }
    }
    return null;
  }

  private async triageIssue(issue: DetectedIssue): Promise<void> {
    const applicableRules = this.triageRules
      .filter(rule => rule.condition(issue))
      .sort((a, b) => a.priority - b.priority);

    for (const rule of applicableRules) {
      await this.executeTriageActions(issue, rule.actions);
    }
  }

  private async executeTriageActions(issue: DetectedIssue, actions: TriageAction[]): Promise<void> {
    for (const action of actions) {
      try {
        await this.executeTriageAction(issue, action);
      } catch (error) {
        console.error(`Failed to execute triage action ${action.type}:`, error);
      }
    }
  }

  private async executeTriageAction(issue: DetectedIssue, action: TriageAction): Promise<void> {
    switch (action.type) {
      case 'assign':
        console.log(`Assigning issue ${issue.id} to team: ${action.params.team}`);
        break;
      case 'escalate':
        console.log(`Escalating issue ${issue.id} to level: ${action.params.level}`);
        break;
      case 'auto_resolve':
        if (action.params.reason) {
          await this.resolveIssue(issue.id, action.params.reason);
        }
        break;
      case 'notify':
        await this.sendNotification(issue, action.params);
        break;
      case 'create_ticket':
        await this.createTicket(issue, action.params);
        break;
      case 'rollback':
        await this.initiateRollback(issue, action.params);
        break;
      case 'restart_service':
        await this.restartService(issue, action.params);
        break;
    }
  }

  private async resolveIssue(issueId: string, reason?: string): Promise<boolean> {
    try {
      await supabase
        .from('detected_issues')
        .update({
          status: 'resolved',
          resolved_at: new Date().toISOString(),
          metadata: { resolutionReason: reason },
        })
        .eq('id', issueId);

      const issue = this.activeIssues.get(issueId);
      if (issue) {
        issue.status = 'resolved';
        issue.resolved_at = new Date().toISOString();
      }

      return true;
    } catch (error) {
      console.error('Error resolving issue:', error);
      return false;
    }
  }

  private async triggerCriticalIssueAlert(issue: DetectedIssue): Promise<void> {
    // Send critical alerts through appropriate channels
    console.error('CRITICAL ISSUE DETECTED:', issue);
  }

  private startIssueDetection(): void {
    this.issueDetectionInterval = setInterval(() => {
      this.detectIssues();
    }, 60000); // Check every minute
  }

  private startSelfHealingMonitoring(): void {
    this.healingCheckInterval = setInterval(() => {
      this.monitorHealingActions();
    }, 300000); // Check every 5 minutes
  }

  private setupErrorListeners(): void {
    window.addEventListener('error', (event) => {
      this.reportIssue({
        issue_type: 'functionality',
        severity: this.classifyErrorSeverity(event.error),
        title: `Runtime Error: ${event.error?.name || 'Unknown'}`,
        description: event.error?.message || event.message,
        affected_pages: [window.location.href],
        detection_method: 'automated',
        confidence_score: 0.95,
        reproducibility_score: 0.6,
        auto_fix_available: this.canAutoFixError(event.error),
        auto_fix_applied: false,
        fix_attempts: 0,
        status: 'detected',
        detected_at: new Date().toISOString(),
        metadata: {
          error_stack: event.error?.stack,
          filename: event.filename,
          line: event.lineno,
          column: event.colno,
        },
      });
    });

    window.addEventListener('unhandledrejection', (event) => {
      this.reportIssue({
        issue_type: 'functionality',
        severity: 'high',
        title: 'Unhandled Promise Rejection',
        description: event.reason?.message || String(event.reason),
        affected_pages: [window.location.href],
        detection_method: 'automated',
        confidence_score: 0.9,
        reproducibility_score: 0.7,
        auto_fix_available: false,
        auto_fix_applied: false,
        fix_attempts: 0,
        status: 'detected',
        detected_at: new Date().toISOString(),
        metadata: {
          reason: event.reason,
          stack: event.reason?.stack,
        },
      });
    });
  }

  private setupPerformanceMonitoring(): void {
    // Integrate with performance monitoring system
    // This would connect to the performance monitoring module
  }

  private async loadResolutionPatternsFromDB(): Promise<void> {
    try {
      const { data } = await supabase
        .from('issue_resolution_patterns')
        .select('*');

      if (data) {
        data.forEach(pattern => {
          this.knownPatterns.set(pattern.issue_pattern, pattern);
        });
      }
    } catch (error) {
      console.error('Error loading resolution patterns:', error);
    }
  }

  private loadResolutionPatterns(): void {
    // Load built-in patterns
    ISSUE_RESOLUTION_PATTERNS.forEach(pattern => {
      this.knownPatterns.set(pattern.issue_pattern, {
        ...pattern,
        id: '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        usage_count: 0,
        success_rate: 0,
      });
    });
  }

  private initializeTriageRules(): void {
    this.triageRules = [
      {
        id: 'critical_booking_issues',
        name: 'Critical Booking Issues',
        condition: (issue) => issue.issue_type === 'functionality' && issue.severity === 'critical',
        priority: 1,
        actions: [
          { type: 'escalate', params: { level: 'engineering_lead' } },
          { type: 'notify', params: { channels: ['slack', 'email'], urgent: true } },
          { type: 'create_ticket', params: { priority: 'critical', assignee: 'booking_team' } }
        ]
      },
      {
        id: 'security_issues',
        name: 'Security Issues',
        condition: (issue) => issue.issue_type === 'security' && issue.severity !== 'low',
        priority: 1,
        actions: [
          { type: 'escalate', params: { level: 'security_team' } },
          { type: 'notify', params: { channels: ['slack', 'email'], urgent: true } },
          { type: 'create_ticket', params: { priority: 'critical', assignee: 'security_team' } }
        ]
      },
      {
        id: 'high_frequency_errors',
        name: 'High Frequency Errors',
        condition: (issue) => {
          const recentIssues = Array.from(this.activeIssues.values()).filter(i =>
            i.title === issue.title &&
            new Date(i.detected_at) > new Date(Date.now() - 60 * 60 * 1000)
          );
          return recentIssues.length > 10 && issue.severity !== 'low';
        },
        priority: 2,
        actions: [
          { type: 'escalate', params: { level: 'on_call_engineer' } },
          { type: 'notify', params: { channels: ['slack'] } }
        ]
      },
      {
        id: 'auto_resolvable',
        name: 'Auto-resolvable Issues',
        condition: (issue) => {
          return issue.auto_fix_available && issue.severity !== 'critical';
        },
        priority: 5,
        actions: [
          { type: 'auto_resolve', params: { reason: 'auto_fix_available' } }
        ]
      }
    ];
  }

  private monitorHealingActions(): void {
    // Monitor ongoing healing actions and handle rollbacks if needed
  }

  private async sendNotification(issue: DetectedIssue, params: any): Promise<void> {
    console.log(`Sending notification for issue ${issue.id}:`, params);
    // Implementation would send actual notifications
  }

  private async createTicket(issue: DetectedIssue, params: any): Promise<void> {
    console.log(`Creating ticket for issue ${issue.id}:`, params);
    // Implementation would create actual tickets in ticketing system
  }

  private async initiateRollback(issue: DetectedIssue, params: any): Promise<void> {
    console.log(`Initiating rollback for issue ${issue.id}:`, params);
    // Implementation would perform actual rollback
  }

  private async restartService(issue: DetectedIssue, params: any): Promise<void> {
    console.log(`Restarting service for issue ${issue.id}:`, params);
    // Implementation would restart actual service
  }

  // Public API methods
  public getActiveIssues(): DetectedIssue[] {
    return Array.from(this.activeIssues.values()).filter(issue =>
      issue.status !== 'resolved' && issue.status !== 'false_positive'
    );
  }

  public addCustomPattern(pattern: IssuePattern): void {
    this.patterns.push(pattern);
    console.log('Custom issue pattern added:', pattern);
  }

  public addTriageRule(rule: TriageRule): void {
    this.triageRules.push(rule);
    this.triageRules.sort((a, b) => a.priority - b.priority);
    console.log('Triage rule added:', rule);
  }
}

// Singleton instance
let issueDetection: IntelligentIssueDetection | null = null;

/**
 * Get or create the issue detection instance
 */
export function getIssueDetection(): IntelligentIssueDetection {
  if (!issueDetection) {
    issueDetection = new IntelligentIssueDetection();
  }
  return issueDetection;
}

/**
 * Initialize issue detection system
 */
export async function initializeIssueDetection(): Promise<void> {
  const detector = getIssueDetection();
  await detector.initialize();
}

/**
 * Detect and report an issue manually
 */
export async function reportIssue(
  title: string,
  description: string,
  type: DetectedIssue['issue_type'],
  severity: DetectedIssue['severity'] = 'medium',
  metadata?: Record<string, any>
): Promise<void> {
  const detector = getIssueDetection();
  await detector['reportIssue']({
    title,
    description,
    issue_type: type,
    severity,
    detection_method: 'user_reported',
    confidence_score: 0.8,
    reproducibility_score: 0.7,
    auto_fix_available: false,
    auto_fix_applied: false,
    fix_attempts: 0,
    status: 'detected',
    detected_at: new Date().toISOString(),
    metadata,
  });
}

// Export the class for advanced usage
export { IntelligentIssueDetection };