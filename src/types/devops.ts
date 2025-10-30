export interface DevOpsSystem {
  id: string;
  name: string;
  type: 'application' | 'infrastructure' | 'service' | 'database';
  environment: 'development' | 'staging' | 'production';
  status: 'healthy' | 'warning' | 'critical' | 'offline';
  metrics: SystemMetrics;
  dependencies: string[];
  owner: string;
  lastUpdated: string;
}

export interface SystemMetrics {
  cpu: number;
  memory: number;
  disk: number;
  network: number;
  uptime: number;
  responseTime: number;
  errorRate: number;
  throughput: number;
}

export interface Deployment {
  id: string;
  environment: 'development' | 'staging' | 'production';
  version: string;
  status: 'pending' | 'running' | 'success' | 'failed' | 'rolling_back';
  progress: number;
  startTime: string;
  endTime?: string;
  duration?: number;
  commit: string;
  author: string;
  changes: number;
  testsPassed: number;
  testsTotal: number;
  performanceScore: number;
  securityScore: number;
  rollbackEnabled: boolean;
  rollbackVersion?: string;
  notifications: DeploymentNotification[];
  artifacts: DeploymentArtifact[];
  environmentVariables: Record<string, string>;
}

export interface DeploymentNotification {
  channel: string;
  recipients: string[];
  message: string;
  timestamp: string;
  status: 'pending' | 'sent' | 'failed';
}

export interface DeploymentArtifact {
  name: string;
  type: 'build' | 'test' | 'security' | 'performance';
  url: string;
  size: number;
  checksum: string;
}

export interface SecurityAlert {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: string;
  description: string;
  source: string;
  timestamp: string;
  status: 'open' | 'investigating' | 'acknowledged' | 'resolved' | 'false_positive';
  assignedTo?: string;
  impact: string;
  remediation: string;
  tags: string[];
  references: string[];
  timeline: SecurityAlertEvent[];
  affectedSystems: string[];
  mitigation?: SecurityMitigation;
}

export interface SecurityAlertEvent {
  timestamp: string;
  action: string;
  user?: string;
  details: string;
}

export interface SecurityMitigation {
  type: 'automatic' | 'manual';
  action: string;
  timestamp: string;
  user?: string;
  result: 'success' | 'failed' | 'partial';
}

export interface AutomationWorkflow {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'paused' | 'disabled' | 'error';
  schedule: string;
  lastRun: string;
  nextRun: string;
  successRate: number;
  duration: number;
  triggers: string[];
  actions: string[];
  dependencies: string[];
  notifications: string[];
  logs: WorkflowLog[];
  metrics: WorkflowMetrics;
  config: WorkflowConfig;
}

export interface WorkflowLog {
  id: string;
  timestamp: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  step?: string;
  message: string;
  details?: any;
  duration?: number;
  status: 'started' | 'completed' | 'failed' | 'skipped';
}

export interface WorkflowMetrics {
  totalRuns: number;
  successfulRuns: number;
  failedRuns: number;
  averageDuration: number;
  lastSuccess: string;
  lastFailure: string;
}

export interface WorkflowConfig {
  timeout: number;
  retryPolicy: RetryPolicy;
  concurrency: number;
  resources: ResourceLimits;
  environment: Record<string, string>;
  secrets: string[];
}

export interface RetryPolicy {
  maxAttempts: number;
  backoffType: 'linear' | 'exponential' | 'fixed';
  initialDelay: number;
  maxDelay: number;
  multiplier?: number;
}

export interface ResourceLimits {
  memory: number;
  cpu: number;
  disk: number;
  network: number;
}

export interface PerformanceMetrics {
  timestamp: string;
  responseTime: number;
  throughput: number;
  errorRate: number;
  availability: number;
  coreWebVitals: CoreWebVitals;
  userMetrics: UserMetrics;
  businessMetrics: BusinessMetrics;
  systemMetrics: SystemMetrics;
  customMetrics: Record<string, number>;
}

export interface CoreWebVitals {
  lcp: number; // Largest Contentful Paint
  fid: number; // First Input Delay
  cls: number; // Cumulative Layout Shift
  fcp: number; // First Contentful Paint
  ttfb: number; // Time to First Byte
  si: number; // Speed Index
  tti: number; // Time to Interactive
}

export interface UserMetrics {
  activeUsers: number;
  newUsers: number;
  returningUsers: number;
  sessionDuration: number;
  bounceRate: number;
  pageViews: number;
  uniquePageViews: number;
  conversionRate: number;
  userSatisfaction: number;
  netPromoterScore: number;
}

export interface BusinessMetrics {
  revenue: number;
  orders: number;
  bookings: number;
  averageOrderValue: number;
  customerLifetimeValue: number;
  customerAcquisitionCost: number;
  churnRate: number;
  customerSatisfaction: number;
  supportTickets: number;
  supportResponseTime: number;
}

export interface BackupStatus {
  id: string;
  type: 'database' | 'files' | 'configuration' | 'full' | 'incremental' | 'differential';
  environment: 'development' | 'staging' | 'production';
  status: 'running' | 'completed' | 'failed' | 'scheduled' | 'cancelled';
  size: number;
  compressedSize: number;
  duration: number;
  location: string;
  retention: string;
  lastBackup: string;
  nextBackup: string;
  verification: 'passed' | 'failed' | 'pending' | 'skipped';
  encryption: boolean;
  checksum: string;
  includes: string[];
  excludes: string[];
  tags: Record<string, string>;
}

export interface ComplianceReport {
  id: string;
  framework: string;
  version: string;
  status: 'compliant' | 'non_compliant' | 'partial' | 'pending' | 'not_applicable';
  score: number;
  lastAssessment: string;
  nextAssessment: string;
  assessor: string;
  requirements: ComplianceRequirement[];
  controls: ComplianceControl[];
  exceptions: ComplianceException[];
  remediation: RemediationItem[];
  evidence: Evidence[];
  scope: string[];
  reportUrl?: string;
  executiveSummary: string;
}

export interface ComplianceRequirement {
  id: string;
  name: string;
  description: string;
  category: string;
  mandatory: boolean;
  status: 'compliant' | 'non_compliant' | 'not_applicable' | 'pending';
  controls: string[];
  evidence: string[];
  lastVerified: string;
  nextReview: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  impact: string;
}

export interface ComplianceControl {
  id: string;
  name: string;
  description: string;
  type: 'technical' | 'administrative' | 'physical';
  category: string;
  implementation: string;
  validation: string;
  evidence: Evidence[];
  status: 'implemented' | 'partial' | 'planned' | 'not_implemented';
  effectiveness: 'high' | 'medium' | 'low';
  lastTested: string;
  nextTest: string;
  owner: string;
}

export interface ComplianceException {
  id: string;
  requirement: string;
  reason: string;
  justification: string;
  risk: string;
  mitigation: string;
  approvedBy: string;
  approvedDate: string;
  expiryDate?: string;
  status: 'active' | 'expired' | 'revoked';
}

export interface RemediationItem {
  id: string;
  requirement: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  effort: 'low' | 'medium' | 'high';
  owner: string;
  dueDate: string;
  status: 'pending' | 'in_progress' | 'completed' | 'blocked';
  dependencies: string[];
  estimatedCost?: number;
  actualCost?: number;
}

export interface Evidence {
  id: string;
  type: 'document' | 'screenshot' | 'log' | 'test_result' | 'configuration' | 'certificate';
  name: string;
  description: string;
  url?: string;
  location: string;
  collectedDate: string;
  collectedBy: string;
  verified: boolean;
  verifiedBy?: string;
  verifiedDate?: string;
  tags: string[];
}

export interface CostAnalysis {
  period: string;
  currency: string;
  totalCost: number;
  previousPeriodCost?: number;
  variance?: number;
  variancePercentage?: number;
  services: ServiceCost[];
  resources: ResourceCost[];
  forecasts: CostForecast[];
  savings: CostSaving[];
  recommendations: CostRecommendation[];
  budget: BudgetInfo;
  breakdown: CostBreakdown;
}

export interface ServiceCost {
  name: string;
  category: string;
  cost: number;
  previousCost?: number;
  variance?: number;
  usage: ServiceUsage;
  trends: CostTrend[];
  alerts: CostAlert[];
}

export interface ServiceUsage {
  unit: string;
  amount: number;
  previousAmount?: number;
  utilization: number;
  quota?: number;
}

export interface CostTrend {
  period: string;
  cost: number;
  usage: number;
  rate: number;
}

export interface CostAlert {
  type: 'budget' | 'anomaly' | 'threshold' | 'trend';
  severity: 'info' | 'warning' | 'critical';
  message: string;
  threshold?: number;
  currentValue?: number;
  timestamp: string;
  acknowledged: boolean;
}

export interface ResourceCost {
  type: 'compute' | 'storage' | 'network' | 'database' | 'license' | 'support';
  name: string;
  cost: number;
  quantity: number;
  unit: string;
  rate: number;
  allocation: ResourceAllocation[];
}

export interface ResourceAllocation {
  service: string;
  percentage: number;
  cost: number;
}

export interface CostForecast {
  period: string;
  predicted: number;
  confidence: number;
  factors: string[];
  scenario: 'conservative' | 'moderate' | 'aggressive';
}

export interface CostSaving {
  type: 'optimization' | 'negotiation' | 'right_sizing' | 'automation';
  description: string;
  potential: number;
  realized?: number;
  status: 'potential' | 'in_progress' | 'realized' | 'failed';
  effort: 'low' | 'medium' | 'high';
  timeline: string;
  owner: string;
}

export interface CostRecommendation {
  id: string;
  title: string;
  description: string;
  impact: string;
  effort: 'low' | 'medium' | 'high';
  priority: 'low' | 'medium' | 'high';
  potentialSavings: number;
  timeline: string;
  category: string;
  dependencies: string[];
}

export interface BudgetInfo {
  allocated: number;
  spent: number;
  remaining: number;
  period: string;
  variance: number;
  variancePercentage: number;
  forecast: number;
  alerts: BudgetAlert[];
}

export interface BudgetAlert {
  type: 'threshold' | 'forecast' | 'trend';
  threshold: number;
  current: number;
  message: string;
  timestamp: string;
}

export interface CostBreakdown {
  byCategory: CategoryBreakdown[];
  byService: ServiceBreakdown[];
  byEnvironment: EnvironmentBreakdown[];
  byTime: TimeBreakdown[];
}

export interface CategoryBreakdown {
  category: string;
  cost: number;
  percentage: number;
  trend: 'up' | 'down' | 'stable';
}

export interface ServiceBreakdown {
  service: string;
  cost: number;
  percentage: number;
  trend: 'up' | 'down' | 'stable';
}

export interface EnvironmentBreakdown {
  environment: string;
  cost: number;
  percentage: number;
  trend: 'up' | 'down' | 'stable';
}

export interface TimeBreakdown {
  period: string;
  cost: number;
  change: number;
  changePercentage: number;
}

export interface MonitoringDashboard {
  id: string;
  name: string;
  description: string;
  category: string;
  widgets: Widget[];
  layout: Layout;
  refreshInterval: number;
  timeframe: string;
  filters: Filter[];
  permissions: Permission[];
  created: string;
  modified: string;
  owner: string;
  tags: string[];
}

export interface Widget {
  id: string;
  type: 'metric' | 'chart' | 'table' | 'status' | 'log' | 'alert' | 'text' | 'heatmap';
  title: string;
  description?: string;
  query: string;
  visualization: Visualization;
  config: WidgetConfig;
  position: Position;
  size: Size;
  refreshInterval?: number;
  dataSource: string;
  transformations: Transformation[];
  alerts: WidgetAlert[];
}

export interface Visualization {
  type: 'line' | 'bar' | 'pie' | 'gauge' | 'table' | 'heatmap' | 'scatter' | 'area' | 'histogram';
  options: Record<string, any>;
  colors: string[];
  legend: Legend;
  axes: Axis[];
}

export interface Legend {
  show: boolean;
  position: 'top' | 'bottom' | 'left' | 'right';
  orientation: 'horizontal' | 'vertical';
}

export interface Axis {
  type: 'x' | 'y';
  label: string;
  scale: 'linear' | 'logarithmic' | 'time' | 'category';
  format?: string;
  min?: number;
  max?: number;
}

export interface WidgetConfig {
  unit?: string;
  format?: string;
  decimals?: number;
  thresholds?: Threshold[];
  colors?: Record<string, string>;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  pagination?: Pagination;
}

export interface Threshold {
  value: number;
  operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
  color: string;
  severity: 'info' | 'warning' | 'critical';
  label?: string;
}

export interface Pagination {
  enabled: boolean;
  pageSize: number;
  showControls: boolean;
}

export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface Transformation {
  type: 'filter' | 'aggregate' | 'calculate' | 'format' | 'sort';
  config: Record<string, any>;
}

export interface WidgetAlert {
  condition: string;
  severity: 'info' | 'warning' | 'critical';
  action: string;
  channels: string[];
}

export interface Layout {
  columns: number;
  rows: number;
  gap: number;
  responsive: boolean;
}

export interface Filter {
  name: string;
  type: 'text' | 'select' | 'date' | 'number';
  field: string;
  operator: string;
  value?: any;
  options?: FilterOption[];
}

export interface FilterOption {
  label: string;
  value: any;
}

export interface Permission {
  user?: string;
  role?: string;
  team?: string;
  access: 'read' | 'write' | 'admin';
}

export interface Incident {
  id: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'investigating' | 'identified' | 'monitoring' | 'resolved' | 'closed';
  impact: string;
  urgency: string;
  priority: number;
  assignee?: string;
  reporter: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  duration?: number;
  category: string;
  tags: string[];
  affectedSystems: string[];
  affectedUsers: number;
  symptoms: string[];
  timeline: IncidentEvent[];
  rootCause?: RootCause;
  resolution?: Resolution;
  postmortem?: Postmortem;
  relatedIncidents: string[];
  duplicates: string[];
  externalReferences: string[];
  sla: SLA;
}

export interface IncidentEvent {
  id: string;
  timestamp: string;
  type: 'created' | 'assigned' | 'updated' | 'comment' | 'action' | 'escalation';
  user: string;
  message: string;
  details?: any;
  attachments?: Attachment[];
}

export interface RootCause {
  description: string;
  category: string;
  contributingFactors: string[];
  evidence: Evidence[];
  confidence: 'low' | 'medium' | 'high';
}

export interface Resolution {
  description: string;
  actions: ResolutionAction[];
  verification: string;
  preventRecurrence: string;
  verifiedBy?: string;
  verifiedAt?: string;
}

export interface ResolutionAction {
  action: string;
  owner: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  completedAt?: string;
  evidence?: string;
}

export interface Postmortem {
  summary: string;
  timeline: string;
  impact: string;
  rootCause: string;
  lessonsLearned: string[];
  actionItems: ActionItem[];
  reviewed: boolean;
  reviewedBy?: string;
  reviewedAt?: string;
}

export interface ActionItem {
  description: string;
  owner: string;
  priority: 'low' | 'medium' | 'high';
  dueDate: string;
  status: 'pending' | 'in_progress' | 'completed';
  completedAt?: string;
}

export interface Attachment {
  name: string;
  type: string;
  size: number;
  url: string;
  uploadedBy: string;
  uploadedAt: string;
}

export interface SLA {
  responseTime: number;
  resolutionTime: number;
  breachThreshold: number;
  met: boolean;
  breachReason?: string;
}

export interface Runbook {
  id: string;
  name: string;
  description: string;
  category: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  owner: string;
  approvers: string[];
  version: string;
  lastReviewed: string;
  nextReview: string;
  status: 'draft' | 'active' | 'deprecated';
  tags: string[];
  prerequisites: string[];
  steps: RunbookStep[];
  verification: Verification[];
  rollback: RollbackPlan;
  relatedDocuments: string[];
  changelog: Changelog[];
}

export interface RunbookStep {
  id: string;
  name: string;
  description: string;
  type: 'manual' | 'automated' | 'verification';
  order: number;
  dependencies: string[];
  commands: Command[];
  expectedResults: string[];
  failureHandling: FailureHandling;
  estimatedTime: number;
  owner?: string;
  automated: boolean;
  verification: boolean;
}

export interface Command {
  command: string;
  description: string;
  type: 'shell' | 'api' | 'database' | 'file';
  timeout: number;
  retries: number;
  expectedOutput?: string;
  expectedExitCode: number;
}

export interface FailureHandling {
  strategy: 'retry' | 'abort' | 'continue' | 'escalate';
  maxRetries: number;
  retryDelay: number;
  escalation: string[];
}

export interface Verification {
  name: string;
  description: string;
  type: 'automated' | 'manual';
  checks: VerificationCheck[];
  successCriteria: string[];
  owner: string;
  timeout: number;
}

export interface VerificationCheck {
  description: string;
  command?: string;
  expected: string;
  actual?: string;
  passed: boolean;
  message?: string;
}

export interface RollbackPlan {
  enabled: boolean;
  automatic: boolean;
  triggers: string[];
  steps: RollbackStep[];
  verification: Verification[];
  estimatedTime: number;
}

export interface RollbackStep {
  name: string;
  description: string;
  order: number;
  commands: Command[];
  verification: boolean;
}

export interface Changelog {
  version: string;
  date: string;
  author: string;
  changes: string[];
  reviewed: boolean;
  reviewedBy?: string;
}

export interface KnowledgeBase {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  author: string;
  createdAt: string;
  updatedAt: string;
  version: number;
  status: 'draft' | 'published' | 'archived';
  views: number;
  helpful: number;
  notHelpful: number;
  relatedArticles: string[];
  attachments: Attachment[];
  metadata: KnowledgeBaseMetadata;
}

export interface KnowledgeBaseMetadata {
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  timeToRead: number;
  prerequisites: string[];
  relatedSystems: string[];
  relatedIncidents: string[];
  relatedRunbooks: string[];
}

export interface DevOpsTeam {
  id: string;
  name: string;
  description: string;
  type: 'development' | 'operations' | 'security' | 'support' | 'management';
  members: TeamMember[];
  lead: string;
  responsibilities: string[];
  onCallSchedule: OnCallSchedule[];
  escalationPolicy: EscalationPolicy;
  permissions: TeamPermission[];
  created: string;
  modified: string;
  status: 'active' | 'inactive';
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  skills: string[];
  level: 'junior' | 'intermediate' | 'senior' | 'lead' | 'principal';
  availability: Availability;
  onCall: boolean;
  contact: ContactInfo;
  joinedAt: string;
}

export interface Availability {
  timezone: string;
  workingHours: WorkingHours[];
  vacation: Vacation[];
  onCallPreferences: OnCallPreferences;
}

export interface WorkingHours {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

export interface Vacation {
  startDate: string;
  endDate: string;
  reason: string;
  approved: boolean;
}

export interface OnCallPreferences {
  preferredDays: number[];
  maxConsecutiveDays: number;
  blackoutDates: string[];
  specialRequests: string[];
}

export interface ContactInfo {
  phone: string;
  slack: string;
  teams?: string;
  emergencyContact?: string;
}

export interface OnCallSchedule {
  id: string;
  name: string;
  rotation: Rotation;
  schedule: ScheduleEntry[];
  overrides: ScheduleOverride[];
  notifications: Notification[];
  handoffProcedures: string[];
}

export interface Rotation {
  type: 'daily' | 'weekly' | 'monthly';
  interval: number;
  members: string[];
  order: string[];
}

export interface ScheduleEntry {
  member: string;
  startDate: string;
  endDate: string;
  backup?: string;
}

export interface ScheduleOverride {
  member: string;
  originalStart: string;
  originalEnd: string;
  newStart: string;
  newEnd: string;
  reason: string;
}

export interface Notification {
  type: 'handoff' | 'escalation' | 'alert';
  channels: string[];
  message: string;
  timing: string;
}

export interface EscalationPolicy {
  name: string;
  rules: EscalationRule[];
  timeout: number;
  maxEscalations: number;
}

export interface EscalationRule {
  level: number;
  delay: number;
  targets: string[];
  channels: string[];
  message: string;
}

export interface TeamPermission {
  resource: string;
  actions: string[];
  conditions: PermissionCondition[];
}

export interface PermissionCondition {
  field: string;
  operator: string;
  value: any;
}

// API Response Types
export interface DevOpsResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  errors?: string[];
  pagination?: Pagination;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Event Types
export interface DevOpsEvent {
  id: string;
  type: string;
  source: string;
  timestamp: string;
  data: any;
  metadata: EventMetadata;
}

export interface EventMetadata {
  version: string;
  correlationId?: string;
  userId?: string;
  sessionId?: string;
  tags: Record<string, string>;
}

// Configuration Types
export interface DevOpsConfig {
  environment: string;
  version: string;
  features: FeatureFlags;
  integrations: IntegrationConfig[];
  monitoring: MonitoringConfig;
  security: SecurityConfig;
  notifications: NotificationConfig;
}

export interface FeatureFlags {
  [key: string]: boolean | string | number;
}

export interface IntegrationConfig {
  name: string;
  type: string;
  enabled: boolean;
  config: Record<string, any>;
  credentials?: Record<string, string>;
  healthCheck?: HealthCheckConfig;
}

export interface MonitoringConfig {
  enabled: boolean;
  metrics: MetricConfig[];
  logging: LoggingConfig;
  tracing: TracingConfig;
  alerting: AlertingConfig;
}

export interface MetricConfig {
  name: string;
  enabled: boolean;
  interval: number;
  retention: string;
  aggregation: string;
}

export interface LoggingConfig {
  level: string;
  format: string;
  outputs: LogOutput[];
  retention: string;
}

export interface LogOutput {
  type: string;
  config: Record<string, any>;
}

export interface TracingConfig {
  enabled: boolean;
  sampling: number;
  serviceName: string;
  exporter: string;
}

export interface AlertingConfig {
  enabled: boolean;
  rules: AlertRule[];
  channels: AlertChannel[];
}

export interface AlertRule {
  name: string;
  condition: string;
  severity: string;
  channels: string[];
  cooldown: number;
}

export interface AlertChannel {
  name: string;
  type: string;
  config: Record<string, any>;
}

export interface SecurityConfig {
  authentication: AuthenticationConfig;
  authorization: AuthorizationConfig;
  encryption: EncryptionConfig;
  audit: AuditConfig;
}

export interface AuthenticationConfig {
  enabled: boolean;
  method: string;
  providers: AuthProvider[];
}

export interface AuthProvider {
  name: string;
  type: string;
  config: Record<string, any>;
}

export interface AuthorizationConfig {
  enabled: boolean;
  method: string;
  policies: AuthPolicy[];
}

export interface AuthPolicy {
  name: string;
  rules: string[];
  effect: string;
}

export interface EncryptionConfig {
  enabled: boolean;
  algorithm: string;
  keyRotation: number;
}

export interface AuditConfig {
  enabled: boolean;
  events: string[];
  retention: string;
  format: string;
}

export interface NotificationConfig {
  channels: NotificationChannelConfig[];
  templates: NotificationTemplate[];
  throttling: ThrottlingConfig;
}

export interface NotificationChannelConfig {
  name: string;
  type: string;
  enabled: boolean;
  config: Record<string, any>;
}

export interface NotificationTemplate {
  name: string;
  type: string;
  subject: string;
  body: string;
  variables: string[];
}

export interface ThrottlingConfig {
  enabled: boolean;
  rate: number;
  window: number;
  burst: number;
}