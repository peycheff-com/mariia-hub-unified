export interface ComplianceCheck {
  ruleId: string;
  ruleName: string;
  category: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  status: 'pass' | 'fail' | 'warning' | 'error';
  message: string;
  timestamp: string;
  details: Record<string, any>;
}

export interface ComplianceReport {
  id: string;
  timestamp: string;
  duration: number;
  totalChecks: number;
  passedChecks: number;
  failedChecks: number;
  warningChecks: number;
  errorChecks: number;
  overallScore: number;
  results: ComplianceCheck[];
  summary: string;
}

export interface ComplianceRule {
  id: string;
  name: string;
  category: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  checkFunction: () => Promise<CheckResult>;
  frequency: 'hourly' | 'daily' | 'weekly' | 'monthly';
  enabled: boolean;
}

export interface CheckResult {
  status: 'pass' | 'fail' | 'warning';
  message: string;
  details: Record<string, any>;
}

export interface ComplianceAlert {
  id: string;
  type: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  timestamp: string;
  category: string;
  assignedTo?: string;
  status: 'open' | 'in_progress' | 'resolved';
}