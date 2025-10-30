import {
  ApiResponse,
  ListParams
} from './common';

/**
 * Admin dashboard statistics
 */
export interface AdminDashboardStats {
  overview: OverviewStats;
  bookings: BookingStats;
  revenue: RevenueStats;
  users: UserStats;
  services: ServiceStats;
  system: SystemStats;
  polishMarket: PolishMarketStats;
}

/**
 * Overview statistics
 */
export interface OverviewStats {
  totalRevenue: number;
  totalBookings: number;
  totalUsers: number;
  totalServices: number;
  averageBookingValue: number;
  conversionRate: number;
  growthRate: number;
  periodComparison: PeriodComparison;
}

/**
 * Period comparison
 */
export interface PeriodComparison {
  revenue: {
    current: number;
    previous: number;
    change: number;
    changePercentage: number;
  };
  bookings: {
    current: number;
    previous: number;
    change: number;
    changePercentage: number;
  };
  users: {
    current: number;
    previous: number;
    change: number;
    changePercentage: number;
  };
}

/**
 * Booking statistics
 */
export interface BookingStats {
  totalBookings: number;
  bookingsByStatus: Record<string, number>;
  bookingsByCategory: Record<string, number>;
  bookingsByLocation: Record<string, number>;
  cancellationRate: number;
  noShowRate: number;
  rescheduleRate: number;
  popularServices: PopularService[];
  bookingTrends: BookingTrend[];
}

/**
 * Popular service
 */
export interface PopularService {
  serviceId: string;
  serviceName: string;
  bookingCount: number;
  revenue: number;
  growth: number;
}

/**
 * Booking trend
 */
export interface BookingTrend {
  date: string;
  bookings: number;
  revenue: number;
  averageValue: number;
}

/**
 * Revenue statistics
 */
export interface RevenueStats {
  totalRevenue: number;
  revenueByCurrency: Record<string, number>;
  revenueByPaymentMethod: Record<string, number>;
  revenueByCategory: Record<string, number>;
  revenueByLocation: Record<string, number>;
  revenueTrends: RevenueTrend[];
  averageTransactionValue: number;
  refundRate: number;
}

/**
 * Revenue trend
 */
export interface RevenueTrend {
  date: string;
  revenue: number;
  transactions: number;
  averageValue: number;
}

/**
 * User statistics
 */
export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  newUsers: number;
  usersByMembership: Record<string, number>;
  userRetentionRate: number;
  userGrowthRate: number;
  userDemographics: UserDemographics;
}

/**
 * User demographics
 */
export interface UserDemographics {
  byAge: Record<string, number>;
  byGender: Record<string, number>;
  byLocation: Record<string, number>;
  byLanguage: Record<string, number>;
}

/**
 * Service statistics
 */
export interface ServiceStats {
  totalServices: number;
  activeServices: number;
  servicesByCategory: Record<string, number>;
  averageServiceRating: number;
  mostRatedServices: MostRatedService[];
  servicePerformance: ServicePerformance[];
}

/**
 * Most rated service
 */
export interface MostRatedService {
  serviceId: string;
  serviceName: string;
  rating: number;
  reviewCount: number;
  bookingCount: number;
}

/**
 * Service performance
 */
export interface ServicePerformance {
  serviceId: string;
  serviceName: string;
  utilizationRate: number;
  revenue: number;
  bookingCount: number;
  cancellationRate: number;
}

/**
 * System statistics
 */
export interface SystemStats {
  uptime: number;
  responseTime: number;
  errorRate: number;
  activeConnections: number;
  apiUsage: ApiUsage;
  performanceMetrics: PerformanceMetrics;
}

/**
 * API usage
 */
export interface ApiUsage {
  totalRequests: number;
  requestsByEndpoint: Record<string, number>;
  requestsByMethod: Record<string, number>;
  requestsByStatus: Record<string, number>;
  averageResponseTime: number;
}

/**
 * Performance metrics
 */
export interface PerformanceMetrics {
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  networkLatency: number;
  databasePerformance: DatabasePerformance;
}

/**
 * Database performance
 */
export interface DatabasePerformance {
  queryTime: number;
  connectionCount: number;
  slowQueries: number;
  indexUsage: number;
}

/**
 * Polish market statistics
 */
export interface PolishMarketStats {
  polishUsers: number;
  polishRevenue: number;
  polishBusinesses: number;
  polishPaymentMethods: Record<string, number>;
  polishRegions: Record<string, number>;
  polishLanguageUsage: number;
  polishComplianceRate: number;
}

/**
 * Admin user
 */
export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
  permissions: AdminPermission[];
  lastLoginAt?: string;
  isActive: boolean;
  createdAt: string;
}

/**
 * Admin role
 */
export type AdminRole = 'super_admin' | 'admin' | 'manager' | 'analyst' | 'support';

/**
 * Admin permission
 */
export interface AdminPermission {
  resource: string;
  actions: string[];
  conditions?: Record<string, any>;
}

/**
 * System alert
 */
export interface SystemAlert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  source: string;
  createdAt: string;
  acknowledgedAt?: string;
  resolvedAt?: string;
  metadata?: Record<string, any>;
}

/**
 * Alert type
 */
export type AlertType =
  | 'system_error'
  | 'performance_issue'
  | 'security_alert'
  | 'payment_failure'
  | 'booking_anomaly'
  | 'user_activity'
  | 'api_usage'
  | 'compliance_issue';

/**
 * Alert severity
 */
export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';

/**
 * System log entry
 */
export interface SystemLogEntry {
  id: string;
  level: LogLevel;
  message: string;
  source: string;
  userId?: string;
  requestId?: string;
  metadata?: Record<string, any>;
  timestamp: string;
}

/**
 * Log level
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

/**
 * Health check result
 */
export interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  checks: HealthCheck[];
  responseTime: number;
  uptime: number;
}

/**
 * Health check
 */
export interface HealthCheck {
  name: string;
  status: 'pass' | 'fail' | 'warn';
  responseTime?: number;
  error?: string;
  details?: Record<string, any>;
}

/**
 * System maintenance
 */
export interface SystemMaintenance {
  id: string;
  title: string;
  description: string;
  scheduledStart: string;
  scheduledEnd: string;
  actualStart?: string;
  actualEnd?: string;
  status: MaintenanceStatus;
  affectedServices: string[];
  impact: MaintenanceImpact;
  notificationSent: boolean;
}

/**
 * Maintenance status
 */
export type MaintenanceStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';

/**
 * Maintenance impact
 */
export type MaintenanceImpact = 'low' | 'medium' | 'high' | 'critical';

/**
 * API key
 */
export interface ApiKey {
  id: string;
  name: string;
  key: string;
  permissions: string[];
  scopes: string[];
  isActive: boolean;
  expiresAt?: string;
  lastUsedAt?: string;
  usageCount: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Feature flag
 */
export interface FeatureFlag {
  key: string;
  name: string;
  description: string;
  enabled: boolean;
  conditions: FeatureFlagCondition[];
  rolloutPercentage?: number;
  environments: string[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Feature flag condition
 */
export interface FeatureFlagCondition {
  field: string;
  operator: string;
  value: any;
}

/**
 * System configuration
 */
export interface SystemConfiguration {
  key: string;
  value: any;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description?: string;
  category: string;
  editable: boolean;
  requiresRestart: boolean;
  environment: string;
  updatedBy: string;
  updatedAt: string;
}

/**
 * System backup
 */
export interface SystemBackup {
  id: string;
  name: string;
  type: BackupType;
  size: number;
  status: BackupStatus;
  createdAt: string;
  completedAt?: string;
  expiresAt?: string;
  createdBy: string;
  metadata?: Record<string, any>;
}

/**
 * Backup type
 */
export type BackupType = 'database' | 'files' | 'configuration' | 'full';

/**
 * Backup status
 */
export type BackupStatus = 'pending' | 'in_progress' | 'completed' | 'failed' | 'expired';

/**
 * Admin API interface
 */
export interface AdminApi {
  /**
   * Get dashboard statistics
   */
  getDashboardStats(params?: DashboardStatsParams): Promise<ApiResponse<AdminDashboardStats>>;

  /**
   * Get system health
   */
  getSystemHealth(): Promise<ApiResponse<HealthCheckResult>>;

  /**
   * Get system alerts
   */
  getSystemAlerts(params?: ListAlertsParams): Promise<ApiResponse<SystemAlert[]>>;

  /**
   * Acknowledge alert
   */
  acknowledgeAlert(alertId: string): Promise<ApiResponse<SystemAlert>>;

  /**
   * Resolve alert
   */
  resolveAlert(alertId: string, resolution?: string): Promise<ApiResponse<SystemAlert>>;

  /**
   * Get system logs
   */
  getSystemLogs(params?: ListLogsParams): Promise<ApiResponse<SystemLogEntry[]>>;

  /**
   * Get admin users
   */
  getAdminUsers(params?: ListParams): Promise<ApiResponse<AdminUser[]>>;

  /**
   * Create admin user
   */
  createAdminUser(user: CreateAdminUserRequest): Promise<ApiResponse<AdminUser>>;

  /**
   * Update admin user
   */
  updateAdminUser(userId: string, user: UpdateAdminUserRequest): Promise<ApiResponse<AdminUser>>;

  /**
   * Delete admin user
   */
  deleteAdminUser(userId: string): Promise<ApiResponse<void>>;

  /**
   * Get API keys
   */
  getApiKeys(params?: ListParams): Promise<ApiResponse<ApiKey[]>>;

  /**
   * Create API key
   */
  createApiKey(key: CreateApiKeyRequest): Promise<ApiResponse<ApiKey>>;

  /**
   * Update API key
   */
  updateApiKey(keyId: string, key: UpdateApiKeyRequest): Promise<ApiResponse<ApiKey>>;

  /**
   * Delete API key
   */
  deleteApiKey(keyId: string): Promise<ApiResponse<void>>;

  /**
   * Get feature flags
   */
  getFeatureFlags(params?: ListParams): Promise<ApiResponse<FeatureFlag[]>>;

  /**
   * Create feature flag
   */
  createFeatureFlag(flag: CreateFeatureFlagRequest): Promise<ApiResponse<FeatureFlag>>;

  /**
   * Update feature flag
   */
  updateFeatureFlag(flagId: string, flag: UpdateFeatureFlagRequest): Promise<ApiResponse<FeatureFlag>>;

  /**
   * Delete feature flag
   */
  deleteFeatureFlag(flagId: string): Promise<ApiResponse<void>>;

  /**
   * Get system configuration
   */
  getSystemConfiguration(category?: string): Promise<ApiResponse<SystemConfiguration[]>>;

  /**
   * Update system configuration
   */
  updateSystemConfiguration(configId: string, config: UpdateConfigurationRequest): Promise<ApiResponse<SystemConfiguration>>;

  /**
   * Get system backups
   */
  getSystemBackups(params?: ListBackupsParams): Promise<ApiResponse<SystemBackup[]>>;

  /**
   * Create system backup
   */
  createSystemBackup(backup: CreateBackupRequest): Promise<ApiResponse<SystemBackup>>;

  /**
   * Restore system backup
   */
  restoreSystemBackup(backupId: string): Promise<ApiResponse<void>>;

  /**
   * Get maintenance schedule
   */
  getMaintenanceSchedule(): Promise<ApiResponse<SystemMaintenance[]>>;

  /**
   * Schedule maintenance
   */
  scheduleMaintenance(maintenance: ScheduleMaintenanceRequest): Promise<ApiResponse<SystemMaintenance>>;

  /**
   * Cancel maintenance
   */
  cancelMaintenance(maintenanceId: string): Promise<ApiResponse<SystemMaintenance>>;

  /**
   * Get analytics data
   */
  getAnalytics(params?: AnalyticsParams): Promise<ApiResponse<any>>;

  /**
   * Export data
   */
  exportData(request: ExportDataRequest): Promise<ApiResponse<Blob>>;

  /**
   * Import data
   */
  importData(file: File, options: ImportDataOptions): Promise<ApiResponse<ImportResult>>;
}

/**
 * Dashboard statistics parameters
 */
export interface DashboardStatsParams {
  dateFrom?: string;
  dateTo?: string;
  period?: 'day' | 'week' | 'month' | 'quarter' | 'year';
  currency?: string;
  location?: string;
  includePolishMarket?: boolean;
}

/**
 * List alerts parameters
 */
export interface ListAlertsParams extends ListParams {
  type?: AlertType;
  severity?: AlertSeverity;
  status?: 'active' | 'acknowledged' | 'resolved';
  dateFrom?: string;
  dateTo?: string;
}

/**
 * List logs parameters
 */
export interface ListLogsParams extends ListParams {
  level?: LogLevel;
  source?: string;
  userId?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

/**
 * Create admin user request
 */
export interface CreateAdminUserRequest {
  email: string;
  name: string;
  role: AdminRole;
  permissions: AdminPermission[];
  isActive?: boolean;
}

/**
 * Update admin user request
 */
export interface UpdateAdminUserRequest {
  name?: string;
  role?: AdminRole;
  permissions?: AdminPermission[];
  isActive?: boolean;
}

/**
 * Create API key request
 */
export interface CreateApiKeyRequest {
  name: string;
  permissions: string[];
  scopes: string[];
  expiresAt?: string;
}

/**
 * Update API key request
 */
export interface UpdateApiKeyRequest {
  name?: string;
  permissions?: string[];
  scopes?: string[];
  isActive?: boolean;
  expiresAt?: string;
}

/**
 * Create feature flag request
 */
export interface CreateFeatureFlagRequest {
  key: string;
  name: string;
  description: string;
  enabled?: boolean;
  conditions?: FeatureFlagCondition[];
  rolloutPercentage?: number;
  environments?: string[];
  tags?: string[];
}

/**
 * Update feature flag request
 */
export interface UpdateFeatureFlagRequest {
  name?: string;
  description?: string;
  enabled?: boolean;
  conditions?: FeatureFlagCondition[];
  rolloutPercentage?: number;
  environments?: string[];
  tags?: string[];
}

/**
 * Update configuration request
 */
export interface UpdateConfigurationRequest {
  value: any;
  description?: string;
}

/**
 * List backups parameters
 */
export interface ListBackupsParams extends ListParams {
  type?: BackupType;
  status?: BackupStatus;
  dateFrom?: string;
  dateTo?: string;
}

/**
 * Create backup request
 */
export interface CreateBackupRequest {
  name: string;
  type: BackupType;
  description?: string;
  expiresAt?: string;
}

/**
 * Schedule maintenance request
 */
export interface ScheduleMaintenanceRequest {
  title: string;
  description: string;
  scheduledStart: string;
  scheduledEnd: string;
  affectedServices: string[];
  impact: MaintenanceImpact;
  sendNotification?: boolean;
}

/**
 * Analytics parameters
 */
export interface AnalyticsParams {
  type: 'bookings' | 'revenue' | 'users' | 'services' | 'performance';
  dateFrom: string;
  dateTo: string;
  groupBy?: string;
  filters?: Record<string, any>;
}

/**
 * Export data request
 */
export interface ExportDataRequest {
  type: 'users' | 'bookings' | 'services' | 'payments' | 'analytics';
  format: 'csv' | 'excel' | 'json';
  dateFrom?: string;
  dateTo?: string;
  filters?: Record<string, any>;
}

/**
 * Import data options
 */
export interface ImportDataOptions {
  type: 'users' | 'services' | 'bookings';
  format: 'csv' | 'excel' | 'json';
  updateExisting?: boolean;
  validateOnly?: boolean;
  dryRun?: boolean;
}

/**
 * Import result
 */
export interface ImportResult {
  totalRows: number;
  importedRows: number;
  updatedRows: number;
  failedRows: number;
  errors: ImportError[];
  warnings: ImportWarning[];
}

/**
 * Import error
 */
export interface ImportError {
  row: number;
  field: string;
  message: string;
  value?: any;
}

/**
 * Import warning
 */
export interface ImportWarning {
  row: number;
  field: string;
  message: string;
  value?: any;
}