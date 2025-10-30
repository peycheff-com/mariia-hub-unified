/**
 * Integration Manager Service
 * Central orchestration service for all third-party integrations
 * Manages authentication, synchronization, error handling, and monitoring
 */

import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';
import type {
  IntegrationConfig,
  IntegrationStatus,
  IntegrationSyncLog,
  IntegrationAnalytics,
  IntegrationError,
  IntegrationHealth,
  IntegrationTemplate,
  PolishMarketConfig,
  SyncFrequency
} from '@/types/integrations';

export interface IntegrationManagerConfig {
  maxConcurrentSyncs: number;
  defaultRetryAttempts: number;
  syncTimeoutMs: number;
  healthCheckIntervalMs: number;
  enableDetailedLogging: boolean;
}

export class IntegrationManager {
  private config: IntegrationManagerConfig;
  private activeIntegrations: Map<string, IntegrationConfig> = new Map();
  private syncQueue: Map<string, NodeJS.Timeout> = new Map();
  private healthCheckInterval?: NodeJS.Timeout;
  private eventListeners: Map<string, Array<(data: any) => void>> = new Map();

  constructor(config: Partial<IntegrationManagerConfig> = {}) {
    this.config = {
      maxConcurrentSyncs: 5,
      defaultRetryAttempts: 3,
      syncTimeoutMs: 300000, // 5 minutes
      healthCheckIntervalMs: 300000, // 5 minutes
      enableDetailedLogging: true,
      ...config
    };

    this.initialize();
  }

  /**
   * Initialize the integration manager
   */
  private async initialize(): Promise<void> {
    try {
      await this.loadActiveIntegrations();
      this.setupHealthCheckMonitoring();
      this.setupEventListeners();

      if (this.config.enableDetailedLogging) {
        console.log('Integration Manager initialized successfully');
      }
    } catch (error) {
      console.error('Failed to initialize Integration Manager:', error);
    }
  }

  /**
   * Load all active integrations from database
   */
  private async loadActiveIntegrations(): Promise<void> {
    try {
      const { data: integrations, error } = await supabase
        .from('integrations')
        .select('*')
        .eq('is_enabled', true)
        .eq('status', 'connected');

      if (error) throw error;

      integrations?.forEach(integration => {
        this.activeIntegrations.set(integration.id, integration);
        this.scheduleSync(integration);
      });

      console.log(`Loaded ${integrations?.length || 0} active integrations`);
    } catch (error) {
      console.error('Failed to load active integrations:', error);
    }
  }

  /**
   * Add new integration
   */
  public async addIntegration(
    config: Omit<IntegrationConfig, 'id' | 'created_at' | 'updated_at' | 'status'>
  ): Promise<{ success: boolean; integrationId?: string; error?: string }> {
    try {
      const integrationId = uuidv4();
      const now = new Date().toISOString();

      const integrationConfig: IntegrationConfig = {
        ...config,
        id: integrationId,
        status: 'pending_setup',
        created_at: now,
        updated_at: now
      };

      // Validate configuration
      const validation = await this.validateIntegrationConfig(integrationConfig);
      if (!validation.isValid) {
        return { success: false, error: validation.error };
      }

      // Save to database
      const { error } = await supabase
        .from('integrations')
        .insert({
          id: integrationId,
          provider: config.provider,
          category: config.category,
          status: 'pending_setup',
          auth_type: config.authType,
          is_enabled: config.is_enabled,
          sync_frequency: config.sync_frequency,
          settings: config.settings,
          credentials: config.credentials,
          webhook_config: config.webhook_config,
          rate_limits: config.rate_limits,
          created_at: now,
          updated_at: now
        });

      if (error) throw error;

      // Test connection if credentials are provided
      if (Object.keys(config.credentials).length > 0) {
        const connectionTest = await this.testIntegrationConnection(integrationConfig);
        if (connectionTest.success) {
          integrationConfig.status = 'connected';
          await supabase
            .from('integrations')
            .update({ status: 'connected' })
            .eq('id', integrationId);
        } else {
          return { success: false, error: connectionTest.error };
        }
      }

      this.activeIntegrations.set(integrationId, integrationConfig);
      this.emitEvent('integration:added', { integration: integrationConfig });

      return { success: true, integrationId };
    } catch (error) {
      console.error('Failed to add integration:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Update integration configuration
   */
  public async updateIntegration(
    integrationId: string,
    updates: Partial<IntegrationConfig>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const existing = this.activeIntegrations.get(integrationId);
      if (!existing) {
        return { success: false, error: 'Integration not found' };
      }

      const updatedConfig = { ...existing, ...updates, updated_at: new Date().toISOString() };

      // Validate updated configuration
      const validation = await this.validateIntegrationConfig(updatedConfig);
      if (!validation.isValid) {
        return { success: false, error: validation.error };
      }

      // Update in database
      const { error } = await supabase
        .from('integrations')
        .update({
          settings: updates.settings,
          credentials: updates.credentials,
          webhook_config: updates.webhook_config,
          rate_limits: updates.rate_limits,
          sync_frequency: updates.sync_frequency,
          is_enabled: updates.is_enabled,
          updated_at: new Date().toISOString()
        })
        .eq('id', integrationId);

      if (error) throw error;

      // Test connection if credentials were updated
      if (updates.credentials) {
        const connectionTest = await this.testIntegrationConnection(updatedConfig);
        if (connectionTest.success) {
          updatedConfig.status = 'connected';
          await supabase
            .from('integrations')
            .update({ status: 'connected' })
            .eq('id', integrationId);
        } else {
          updatedConfig.status = 'error';
          updatedConfig.last_error = connectionTest.error;
          await supabase
            .from('integrations')
            .update({
              status: 'error',
              last_error: connectionTest.error,
              error_count: existing.error_count + 1
            })
            .eq('id', integrationId);
        }
      }

      this.activeIntegrations.set(integrationId, updatedConfig);
      this.emitEvent('integration:updated', { integration: updatedConfig });

      return { success: true };
    } catch (error) {
      console.error('Failed to update integration:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Remove integration
   */
  public async removeIntegration(
    integrationId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Cancel any scheduled syncs
      const syncTimeout = this.syncQueue.get(integrationId);
      if (syncTimeout) {
        clearTimeout(syncTimeout);
        this.syncQueue.delete(integrationId);
      }

      // Remove from database
      const { error } = await supabase
        .from('integrations')
        .delete()
        .eq('id', integrationId);

      if (error) throw error;

      // Remove from active integrations
      this.activeIntegrations.delete(integrationId);
      this.emitEvent('integration:removed', { integrationId });

      return { success: true };
    } catch (error) {
      console.error('Failed to remove integration:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get integration by ID
   */
  public getIntegration(integrationId: string): IntegrationConfig | null {
    return this.activeIntegrations.get(integrationId) || null;
  }

  /**
   * Get all integrations
   */
  public getAllIntegrations(): IntegrationConfig[] {
    return Array.from(this.activeIntegrations.values());
  }

  /**
   * Get integrations by category
   */
  public getIntegrationsByCategory(category: string): IntegrationConfig[] {
    return this.getAllIntegrations().filter(integration => integration.category === category);
  }

  /**
   * Get integrations by provider
   */
  public getIntegrationsByProvider(provider: string): IntegrationConfig[] {
    return this.getAllIntegrations().filter(integration => integration.provider === provider);
  }

  /**
   * Enable/disable integration
   */
  public async toggleIntegration(
    integrationId: string,
    enabled: boolean
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const integration = this.activeIntegrations.get(integrationId);
      if (!integration) {
        return { success: false, error: 'Integration not found' };
      }

      const { error } = await supabase
        .from('integrations')
        .update({ is_enabled: enabled })
        .eq('id', integrationId);

      if (error) throw error;

      integration.is_enabled = enabled;

      if (enabled && integration.status === 'connected') {
        this.scheduleSync(integration);
      } else {
        // Cancel scheduled sync
        const syncTimeout = this.syncQueue.get(integrationId);
        if (syncTimeout) {
          clearTimeout(syncTimeout);
          this.syncQueue.delete(integrationId);
        }
      }

      this.emitEvent('integration:toggled', { integrationId, enabled });

      return { success: true };
    } catch (error) {
      console.error('Failed to toggle integration:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Trigger manual sync for integration
   */
  public async triggerSync(
    integrationId: string,
    entityTypes?: string[]
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const integration = this.activeIntegrations.get(integrationId);
      if (!integration) {
        return { success: false, error: 'Integration not found' };
      }

      if (integration.status !== 'connected') {
        return { success: false, error: 'Integration is not connected' };
      }

      this.emitEvent('sync:triggered', { integrationId, entityTypes });

      // Perform sync immediately
      const syncResult = await this.performSync(integration, entityTypes);

      return { success: syncResult.success, error: syncResult.error };
    } catch (error) {
      console.error('Failed to trigger sync:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Schedule periodic sync for integration
   */
  private scheduleSync(integration: IntegrationConfig): void {
    if (!integration.is_enabled || integration.status !== 'connected') {
      return;
    }

    // Cancel existing sync
    const existingTimeout = this.syncQueue.get(integration.id);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    const intervalMs = this.getSyncIntervalMs(integration.sync_frequency);
    const nextSync = new Date(Date.now() + intervalMs);

    // Update next_sync_at
    supabase
      .from('integrations')
      .update({ next_sync_at: nextSync.toISOString() })
      .eq('id', integration.id);

    const timeout = setTimeout(async () => {
      await this.performSync(integration);
      // Schedule next sync
      this.scheduleSync(integration);
    }, intervalMs);

    this.syncQueue.set(integration.id, timeout);
  }

  /**
   * Convert sync frequency to milliseconds
   */
  private getSyncIntervalMs(frequency: SyncFrequency): number {
    switch (frequency) {
      case 'realtime': return 60000; // 1 minute minimum
      case 'every_5_minutes': return 5 * 60 * 1000;
      case 'every_15_minutes': return 15 * 60 * 1000;
      case 'every_30_minutes': return 30 * 60 * 1000;
      case 'hourly': return 60 * 60 * 1000;
      case 'daily': return 24 * 60 * 60 * 1000;
      case 'weekly': return 7 * 24 * 60 * 60 * 1000;
      default: return 60 * 60 * 1000; // Default to hourly
    }
  }

  /**
   * Perform sync for integration
   */
  private async performSync(
    integration: IntegrationConfig,
    entityTypes?: string[]
  ): Promise<{ success: boolean; error?: string }> {
    const syncLogId = uuidv4();
    const startTime = Date.now();

    try {
      // Update sync status
      await supabase
        .from('integrations')
        .update({
          last_sync_at: new Date().toISOString(),
          status: 'connected' // Reset from error status if any
        })
        .eq('id', integration.id);

      // Create sync log
      await supabase
        .from('integration_sync_logs')
        .insert({
          id: syncLogId,
          integration_id: integration.id,
          entity_type: entityTypes?.join(',') || 'all',
          operation: 'sync',
          sync_status: 'in_progress',
          started_at: new Date().toISOString()
        });

      // Get integration service
      const integrationService = this.getIntegrationService(integration.provider);
      if (!integrationService) {
        throw new Error(`Integration service not found for provider: ${integration.provider}`);
      }

      // Perform the actual sync
      const syncResult = await integrationService.syncData(
        integration,
        entityTypes
      );

      const duration = Date.now() - startTime;

      if (syncResult.success) {
        // Update sync log as completed
        await supabase
          .from('integration_sync_logs')
          .update({
            sync_status: 'completed',
            completed_at: new Date().toISOString(),
            duration_ms: duration
          })
          .eq('id', syncLogId);

        // Reset error count on successful sync
        await supabase
          .from('integrations')
          .update({ error_count: 0 })
          .eq('id', integration.id);

        this.emitEvent('sync:completed', {
          integrationId: integration.id,
          duration,
          recordsProcessed: syncResult.recordsProcessed
        });

        return { success: true };
      } else {
        throw new Error(syncResult.error || 'Sync failed');
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      // Update sync log as failed
      await supabase
        .from('integration_sync_logs')
        .update({
          sync_status: 'failed',
          error_message: errorMessage,
          completed_at: new Date().toISOString(),
          duration_ms: duration
        })
        .eq('id', syncLogId);

      // Update integration error status
      const newErrorCount = (integration.error_count || 0) + 1;
      await supabase
        .from('integrations')
        .update({
          status: newErrorCount >= 3 ? 'error' : 'connected',
          error_count: newErrorCount,
          last_error: errorMessage
        })
        .eq('id', integration.id);

      this.emitEvent('sync:failed', {
        integrationId: integration.id,
        error: errorMessage,
        duration
      });

      return { success: false, error: errorMessage };
    }
  }

  /**
   * Get integration service for provider
   */
  private getIntegrationService(provider: string): any {
    // This will be implemented when we create individual integration services
    const serviceMap: Record<string, any> = {
      'google': null, // Will be GoogleIntegrationService
      'microsoft': null, // Will be MicrosoftIntegrationService
      'facebook': null, // Will be FacebookIntegrationService
      'instagram': null, // Will be InstagramIntegrationService
      'mailchimp': null, // Will be MailchimpIntegrationService
      'sendgrid': null, // Will be SendGridIntegrationService
      'twilio': null, // Will be TwilioIntegrationService
      'whatsapp': null, // Will be WhatsAppIntegrationService (existing)
      'google_analytics': null, // Will be GoogleAnalyticsIntegrationService
      'mixpanel': null, // Will be MixpanelIntegrationService
      'hubspot': null, // Will be HubSpotIntegrationService
      'salesforce': null, // Will be SalesforceIntegrationService
      'slack': null, // Will be SlackIntegrationService
      'microsoft_teams': null, // Will be MicrosoftTeamsIntegrationService
    };

    return serviceMap[provider];
  }

  /**
   * Test integration connection
   */
  private async testIntegrationConnection(
    config: IntegrationConfig
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const integrationService = this.getIntegrationService(config.provider);
      if (!integrationService) {
        return { success: false, error: 'Integration service not found' };
      }

      return await integrationService.testConnection(config);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Connection test failed'
      };
    }
  }

  /**
   * Validate integration configuration
   */
  private async validateIntegrationConfig(
    config: IntegrationConfig
  ): Promise<{ isValid: boolean; error?: string }> {
    try {
      // Basic validation
      if (!config.provider || !config.category) {
        return { isValid: false, error: 'Provider and category are required' };
      }

      if (!config.authType) {
        return { isValid: false, error: 'Auth type is required' };
      }

      // Provider-specific validation
      const providerValidation = await this.validateProviderConfig(config);
      if (!providerValidation.isValid) {
        return providerValidation;
      }

      return { isValid: true };
    } catch (error) {
      return {
        isValid: false,
        error: error instanceof Error ? error.message : 'Validation failed'
      };
    }
  }

  /**
   * Validate provider-specific configuration
   */
  private async validateProviderConfig(
    config: IntegrationConfig
  ): Promise<{ isValid: boolean; error?: string }> {
    // This will be expanded as we add individual integration services
    switch (config.provider) {
      case 'google':
        return this.validateGoogleConfig(config);
      case 'microsoft':
        return this.validateMicrosoftConfig(config);
      case 'facebook':
      case 'instagram':
        return this.validateMetaConfig(config);
      case 'mailchimp':
        return this.validateMailchimpConfig(config);
      case 'sendgrid':
        return this.validateSendGridConfig(config);
      case 'twilio':
        return this.validateTwilioConfig(config);
      case 'google_analytics':
        return this.validateGoogleAnalyticsConfig(config);
      case 'hubspot':
        return this.validateHubSpotConfig(config);
      case 'salesforce':
        return this.validateSalesforceConfig(config);
      default:
        return { isValid: true };
    }
  }

  // Placeholder validation methods - will be implemented with specific services
  private async validateGoogleConfig(config: IntegrationConfig): Promise<{ isValid: boolean; error?: string }> {
    return { isValid: true };
  }

  private async validateMicrosoftConfig(config: IntegrationConfig): Promise<{ isValid: boolean; error?: string }> {
    return { isValid: true };
  }

  private async validateMetaConfig(config: IntegrationConfig): Promise<{ isValid: boolean; error?: string }> {
    return { isValid: true };
  }

  private async validateMailchimpConfig(config: IntegrationConfig): Promise<{ isValid: boolean; error?: string }> {
    return { isValid: true };
  }

  private async validateSendGridConfig(config: IntegrationConfig): Promise<{ isValid: boolean; error?: string }> {
    return { isValid: true };
  }

  private async validateTwilioConfig(config: IntegrationConfig): Promise<{ isValid: boolean; error?: string }> {
    return { isValid: true };
  }

  private async validateGoogleAnalyticsConfig(config: IntegrationConfig): Promise<{ isValid: boolean; error?: string }> {
    return { isValid: true };
  }

  private async validateHubSpotConfig(config: IntegrationConfig): Promise<{ isValid: boolean; error?: string }> {
    return { isValid: true };
  }

  private async validateSalesforceConfig(config: IntegrationConfig): Promise<{ isValid: boolean; error?: string }> {
    return { isValid: true };
  }

  /**
   * Setup health check monitoring
   */
  private setupHealthCheckMonitoring(): void {
    this.healthCheckInterval = setInterval(async () => {
      await this.performHealthChecks();
    }, this.config.healthCheckIntervalMs);
  }

  /**
   * Perform health checks for all integrations
   */
  private async performHealthChecks(): Promise<void> {
    const healthChecks = this.getAllIntegrations().map(async (integration) => {
      try {
        const health = await this.checkIntegrationHealth(integration);
        await this.saveHealthCheck(integration.id, health);

        if (health.status !== 'healthy') {
          this.emitEvent('integration:health_issue', {
            integrationId: integration.id,
            health
          });
        }
      } catch (error) {
        console.error(`Health check failed for integration ${integration.id}:`, error);
      }
    });

    await Promise.allSettled(healthChecks);
  }

  /**
   * Check individual integration health
   */
  private async checkIntegrationHealth(
    integration: IntegrationConfig
  ): Promise<IntegrationHealth> {
    const startTime = Date.now();

    try {
      const integrationService = this.getIntegrationService(integration.provider);
      if (!integrationService) {
        return {
          integration_id: integration.id,
          status: 'unhealthy',
          last_check: new Date().toISOString(),
          response_time_ms: Date.now() - startTime,
          success_rate: 0,
          error_rate: 100,
          issues: [{
            type: 'error',
            message: 'Integration service not found',
            detected_at: new Date().toISOString()
          }]
        };
      }

      const healthCheck = await integrationService.healthCheck?.(integration);

      return {
        integration_id: integration.id,
        status: healthCheck?.status || 'healthy',
        last_check: new Date().toISOString(),
        response_time_ms: Date.now() - startTime,
        success_rate: healthCheck?.success_rate || 100,
        error_rate: healthCheck?.error_rate || 0,
        last_successful_sync: integration.last_sync_at,
        issues: healthCheck?.issues || []
      };
    } catch (error) {
      return {
        integration_id: integration.id,
        status: 'unhealthy',
        last_check: new Date().toISOString(),
        response_time_ms: Date.now() - startTime,
        success_rate: 0,
        error_rate: 100,
        issues: [{
          type: 'error',
          message: error instanceof Error ? error.message : 'Health check failed',
          detected_at: new Date().toISOString()
        }]
      };
    }
  }

  /**
   * Save health check results
   */
  private async saveHealthCheck(
    integrationId: string,
    health: IntegrationHealth
  ): Promise<void> {
    try {
      await supabase
        .from('integration_health_checks')
        .upsert({
          integration_id: integrationId,
          status: health.status,
          response_time_ms: health.response_time_ms,
          success_rate: health.success_rate,
          error_rate: health.error_rate,
          last_successful_sync: health.last_successful_sync,
          issues: health.issues,
          last_check: health.last_check
        });
    } catch (error) {
      console.error('Failed to save health check:', error);
    }
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    // Listen for integration-related events
    // This will connect to the existing cross-platform sync service
  }

  /**
   * Emit event to listeners
   */
  private emitEvent(eventType: string, data: any): void {
    const listeners = this.eventListeners.get(eventType) || [];
    listeners.forEach(listener => {
      try {
        listener(data);
      } catch (error) {
        console.error(`Error in event listener for ${eventType}:`, error);
      }
    });
  }

  /**
   * Register event listener
   */
  public on(eventType: string, listener: (data: any) => void): void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, []);
    }
    this.eventListeners.get(eventType)!.push(listener);
  }

  /**
   * Remove event listener
   */
  public off(eventType: string, listener: (data: any) => void): void {
    const listeners = this.eventListeners.get(eventType);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * Get integration analytics
   */
  public async getAnalytics(
    integrationId: string,
    dateRange?: { start: Date; end: Date }
  ): Promise<IntegrationAnalytics[]> {
    try {
      const query = supabase
        .from('integration_analytics')
        .select('*')
        .eq('integration_id', integrationId)
        .gte('date', dateRange?.start.toISOString() || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .lte('date', dateRange?.end.toISOString() || new Date().toISOString())
        .order('date', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Failed to get integration analytics:', error);
      return [];
    }
  }

  /**
   * Get integration errors
   */
  public async getErrors(
    integrationId?: string,
    dateRange?: { start: Date; end: Date }
  ): Promise<IntegrationError[]> {
    try {
      let query = supabase
        .from('integration_errors')
        .select('*')
        .gte('created_at', dateRange?.start.toISOString() || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .lte('created_at', dateRange?.end.toISOString() || new Date().toISOString())
        .order('created_at', { ascending: false });

      if (integrationId) {
        query = query.eq('integration_id', integrationId);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Failed to get integration errors:', error);
      return [];
    }
  }

  /**
   * Get integration templates
   */
  public async getTemplates(
    category?: string,
    provider?: string
  ): Promise<IntegrationTemplate[]> {
    try {
      let query = supabase
        .from('integration_templates')
        .select('*')
        .order('is_recommended', { ascending: false })
        .order('name', { ascending: true });

      if (category) {
        query = query.eq('category', category);
      }

      if (provider) {
        query = query.eq('provider', provider);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Failed to get integration templates:', error);
      return [];
    }
  }

  /**
   * Cleanup resources
   */
  public cleanup(): void {
    // Clear sync queue
    this.syncQueue.forEach(timeout => clearTimeout(timeout));
    this.syncQueue.clear();

    // Clear health check interval
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    // Clear event listeners
    this.eventListeners.clear();

    console.log('Integration Manager cleaned up');
  }
}

// Export singleton instance
let integrationManager: IntegrationManager | null = null;

export function getIntegrationManager(
  config?: Partial<IntegrationManagerConfig>
): IntegrationManager {
  if (!integrationManager) {
    integrationManager = new IntegrationManager(config);
  }
  return integrationManager;
}

export default IntegrationManager;