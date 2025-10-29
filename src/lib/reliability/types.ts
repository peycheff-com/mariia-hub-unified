export interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  duration: number;
  details: Record<string, any>;
  checks: HealthCheck[];
}

export interface HealthCheck {
  name: string;
  status: 'pass' | 'fail' | 'warn';
  duration: number;
  message?: string;
  details?: Record<string, any>;
}

export interface DependencyHealth {
  name: string;
  type: 'database' | 'api' | 'cache' | 'queue' | 'external';
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime?: number;
  error?: string;
  lastChecked: string;
}

export interface HealthScore {
  overall: number;
  components: Record<string, number>;
  timestamp: string;
  trend: 'improving' | 'stable' | 'degrading';
}

export interface AlertRule {
  id: string;
  name: string;
  condition: string;
  threshold: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  enabled: boolean;
  tags: string[];
}

export interface Alert {
  id: string;
  ruleId: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'acknowledged' | 'resolved';
  message: string;
  timestamp: string;
  acknowledgedBy?: string;
  resolvedAt?: string;
  enrichment: Record<string, any>;
}

export interface EscalationPolicy {
  id: string;
  name: string;
  rules: EscalationRule[];
}

export interface EscalationRule {
  delay: number; // minutes
  action: 'notify' | 'escalate' | 'suppress';
  target: string; // email, slack, etc.
  conditions: Record<string, any>;
}

export interface AuditEvent {
  id: string;
  timestamp: string;
  userId?: string;
  sessionId?: string;
  action: string;
  resource: string;
  outcome: 'success' | 'failure' | 'error';
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  context: Record<string, any>;
}

export interface SLO {
  id: string;
  name: string;
  description: string;
  service: string;
  indicator: string;
  objective: number; // percentage
  timeWindow: number; // days
  alertingBurnRate: number;
  errorBudgetPolicy: ErrorBudgetPolicy;
}

export interface ErrorBudgetPolicy {
  fastBurn: number; // alert if burn rate > 10x for 1 hour
  slowBurn: number; // alert if burn rate > 2x for 6 hours
  windowShort: number; // hours
  windowLong: number; // hours
}

export interface ErrorBudgetStatus {
  sloId: string;
  currentTime: string;
  errorBudget: number; // percentage remaining
  burnRate: number;
  status: 'healthy' | 'warning' | 'burning' | 'exhausted';
  events: ErrorBudgetEvent[];
}

export interface ErrorBudgetEvent {
  timestamp: string;
  type: 'burn' | 'consumption' | 'reset';
  amount: number;
  reason?: string;
}