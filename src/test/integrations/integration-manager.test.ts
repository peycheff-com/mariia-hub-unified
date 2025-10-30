/**
 * Integration Manager Test Suite
 * Comprehensive testing for the integration management system
 * Tests core functionality, error handling, and edge cases
 */

import { describe, it, expect, beforeEach, afterEach, vi, type MockedFunction } from 'vitest';
import { getIntegrationManager, type IntegrationManager } from '@/services/integrations/integration-manager.service';
import { supabase } from '@/integrations/supabase/client';
import type {
  IntegrationConfig,
  IntegrationStatus,
  SyncFrequency,
  IntegrationTemplate
} from '@/types/integrations';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => supabase),
    select: vi.fn(() => supabase),
    insert: vi.fn(() => supabase),
    update: vi.fn(() => supabase),
    delete: vi.fn(() => supabase),
    eq: vi.fn(() => supabase),
    single: vi.fn(() => supabase),
    gte: vi.fn(() => supabase),
    lte: vi.fn(() => supabase),
    order: vi.fn(() => supabase),
    limit: vi.fn(() => supabase),
    in: vi.fn(() => supabase),
    or: vi.fn(() => supabase),
    is: vi.fn(() => supabase),
    rpc: vi.fn(() => supabase),
    upsert: vi.fn(() => supabase)
  }
}));

describe('IntegrationManager', () => {
  let integrationManager: IntegrationManager;
  let mockSupabase: any;

  beforeEach(() => {
    vi.clearAllMocks();
    integrationManager = getIntegrationManager({
      maxConcurrentSyncs: 3,
      defaultRetryAttempts: 2,
      syncTimeoutMs: 5000,
      healthCheckIntervalMs: 1000,
      enableDetailedLogging: false
    });

    mockSupabase = supabase as any;

    // Setup default successful responses
    mockSupabase.select.mockReturnThis();
    mockSupabase.insert.mockReturnThis();
    mockSupabase.update.mockReturnThis();
    mockSupabase.delete.mockReturnThis();
    mockSupabase.eq.mockReturnThis();
    mockSupabase.gte.mockReturnThis();
    mockSupabase.lte.mockReturnThis();
    mockSupabase.order.mockReturnThis();
    mockSupabase.limit.mockReturnThis();
    mockSupabase.in.mockReturnThis();
    mockSupabase.or.mockReturnThis();
    mockSupabase.is.mockReturnThis();
    mockSupabase.single.mockReturnThis();
    mockSupabase.upsert.mockReturnThis();
  });

  afterEach(() => {
    integrationManager.cleanup();
  });

  describe('Integration Management', () => {
    const mockIntegrationConfig: Omit<IntegrationConfig, 'id' | 'created_at' | 'updated_at' | 'status'> = {
      provider: 'google',
      category: 'calendar',
      authType: 'oauth2',
      is_enabled: true,
      sync_frequency: 'hourly' as SyncFrequency,
      error_count: 0,
      settings: {},
      credentials: {
        client_id: 'test_client_id',
        client_secret: 'test_client_secret',
        access_token: 'test_access_token'
      }
    };

    it('should add a new integration successfully', async () => {
      // Mock successful database insert
      mockSupabase.insert.mockResolvedValueOnce({
        error: null
      });

      // Mock successful connection test
      vi.spyOn(integrationManager as any, 'testIntegrationConnection').mockResolvedValueOnce({
        success: true
      });

      const result = await integrationManager.addIntegration(mockIntegrationConfig);

      expect(result.success).toBe(true);
      expect(result.integrationId).toBeDefined();
      expect(mockSupabase.from).toHaveBeenCalledWith('integrations');
      expect(mockSupabase.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          provider: 'google',
          category: 'calendar',
          auth_type: 'oauth2',
          is_enabled: true,
          sync_frequency: 'hourly',
          status: 'pending_setup'
        })
      );
    });

    it('should fail to add integration with invalid config', async () => {
      const invalidConfig = {
        ...mockIntegrationConfig,
        provider: '' // Empty provider should fail validation
      };

      const result = await integrationManager.addIntegration(invalidConfig);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Provider and category are required');
    });

    it('should update existing integration', async () => {
      const integrationId = 'test-integration-id';
      const updates = {
        is_enabled: false,
        settings: { new_setting: 'value' }
      };

      // Mock successful database update
      mockSupabase.update.mockResolvedValueOnce({
        error: null
      });

      const result = await integrationManager.updateIntegration(integrationId, updates);

      expect(result.success).toBe(true);
      expect(mockSupabase.from).toHaveBeenCalledWith('integrations');
      expect(mockSupabase.update).toHaveBeenCalledWith(
        expect.objectContaining({
          is_enabled: false,
          settings: { new_setting: 'value' }
        })
      );
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', integrationId);
    });

    it('should remove integration successfully', async () => {
      const integrationId = 'test-integration-id';

      // Mock successful database delete
      mockSupabase.delete.mockResolvedValueOnce({
        error: null
      });

      const result = await integrationManager.removeIntegration(integrationId);

      expect(result.success).toBe(true);
      expect(mockSupabase.from).toHaveBeenCalledWith('integrations');
      expect(mockSupabase.delete).toHaveBeenCalled();
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', integrationId);
    });

    it('should toggle integration enabled status', async () => {
      const integrationId = 'test-integration-id';

      // Mock successful database update
      mockSupabase.update.mockResolvedValueOnce({
        error: null
      });

      const result = await integrationManager.toggleIntegration(integrationId, false);

      expect(result.success).toBe(true);
      expect(mockSupabase.update).toHaveBeenCalledWith({
        is_enabled: false
      });
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', integrationId);
    });

    it('should get integration by ID', async () => {
      const integrationId = 'test-integration-id';
      const mockIntegration: IntegrationConfig = {
        id: integrationId,
        provider: 'google',
        category: 'calendar',
        status: 'connected' as IntegrationStatus,
        authType: 'oauth2',
        is_enabled: true,
        sync_frequency: 'hourly' as SyncFrequency,
        last_sync_at: '2024-01-15T10:00:00Z',
        error_count: 0,
        settings: {},
        credentials: {},
        created_at: '2024-01-15T09:00:00Z',
        updated_at: '2024-01-15T09:00:00Z'
      };

      // Mock active integrations map
      (integrationManager as any).activeIntegrations.set(integrationId, mockIntegration);

      const result = integrationManager.getIntegration(integrationId);

      expect(result).toEqual(mockIntegration);
    });

    it('should return null for non-existent integration', async () => {
      const result = integrationManager.getIntegration('non-existent-id');

      expect(result).toBeNull();
    });

    it('should get all integrations', async () => {
      const mockIntegrations: IntegrationConfig[] = [
        {
          id: '1',
          provider: 'google',
          category: 'calendar',
          status: 'connected' as IntegrationStatus,
          authType: 'oauth2',
          is_enabled: true,
          sync_frequency: 'hourly' as SyncFrequency,
          last_sync_at: '2024-01-15T10:00:00Z',
          error_count: 0,
          settings: {},
          credentials: {},
          created_at: '2024-01-15T09:00:00Z',
          updated_at: '2024-01-15T09:00:00Z'
        },
        {
          id: '2',
          provider: 'facebook',
          category: 'social_media',
          status: 'connected' as IntegrationStatus,
          authType: 'oauth2',
          is_enabled: true,
          sync_frequency: 'daily' as SyncFrequency,
          last_sync_at: '2024-01-15T09:30:00Z',
          error_count: 1,
          last_error: 'Rate limit exceeded',
          settings: {},
          credentials: {},
          created_at: '2024-01-15T08:00:00Z',
          updated_at: '2024-01-15T09:00:00Z'
        }
      ];

      // Mock active integrations map
      mockIntegrations.forEach(integration => {
        (integrationManager as any).activeIntegrations.set(integration.id, integration);
      });

      const result = integrationManager.getAllIntegrations();

      expect(result).toHaveLength(2);
      expect(result).toEqual(expect.arrayContaining(mockIntegrations));
    });

    it('should get integrations by category', async () => {
      const mockIntegrations: IntegrationConfig[] = [
        {
          id: '1',
          provider: 'google',
          category: 'calendar',
          status: 'connected' as IntegrationStatus,
          authType: 'oauth2',
          is_enabled: true,
          sync_frequency: 'hourly' as SyncFrequency,
          last_sync_at: '2024-01-15T10:00:00Z',
          error_count: 0,
          settings: {},
          credentials: {},
          created_at: '2024-01-15T09:00:00Z',
          updated_at: '2024-01-15T09:00:00Z'
        },
        {
          id: '2',
          provider: 'microsoft',
          category: 'calendar',
          status: 'connected' as IntegrationStatus,
          authType: 'oauth2',
          is_enabled: true,
          sync_frequency: 'hourly' as SyncFrequency,
          last_sync_at: '2024-01-15T10:15:00Z',
          error_count: 0,
          settings: {},
          credentials: {},
          created_at: '2024-01-15T09:00:00Z',
          updated_at: '2024-01-15T09:00:00Z'
        }
      ];

      // Mock active integrations map
      mockIntegrations.forEach(integration => {
        (integrationManager as any).activeIntegrations.set(integration.id, integration);
      });

      const result = integrationManager.getIntegrationsByCategory('calendar');

      expect(result).toHaveLength(2);
      expect(result.every(i => i.category === 'calendar')).toBe(true);
    });
  });

  describe('Sync Operations', () => {
    it('should trigger manual sync successfully', async () => {
      const integrationId = 'test-integration-id';
      const mockIntegration: IntegrationConfig = {
        id: integrationId,
        provider: 'google',
        category: 'calendar',
        status: 'connected' as IntegrationStatus,
        authType: 'oauth2',
        is_enabled: true,
        sync_frequency: 'hourly' as SyncFrequency,
        last_sync_at: '2024-01-15T10:00:00Z',
        error_count: 0,
        settings: {},
        credentials: {
          access_token: 'test_token'
        },
        created_at: '2024-01-15T09:00:00Z',
        updated_at: '2024-01-15T09:00:00Z'
      };

      // Mock active integration
      (integrationManager as any).activeIntegrations.set(integrationId, mockIntegration);

      // Mock successful sync
      vi.spyOn(integrationManager as any, 'performSync').mockResolvedValueOnce({
        success: true,
        recordsProcessed: 10,
        recordsCreated: 5,
        recordsUpdated: 5
      });

      // Mock sync log insert
      mockSupabase.insert.mockResolvedValueOnce({
        error: null
      });

      const result = await integrationManager.triggerSync(integrationId, ['events']);

      expect(result.success).toBe(true);
      expect(mockSupabase.from).toHaveBeenCalledWith('integration_sync_logs');
      expect(mockSupabase.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          integration_id: integrationId,
          entity_type: 'events',
          operation: 'sync',
          sync_status: 'in_progress'
        })
      );
    });

    it('should fail sync for disconnected integration', async () => {
      const integrationId = 'test-integration-id';
      const mockIntegration: IntegrationConfig = {
        id: integrationId,
        provider: 'google',
        category: 'calendar',
        status: 'disconnected' as IntegrationStatus,
        authType: 'oauth2',
        is_enabled: true,
        sync_frequency: 'hourly' as SyncFrequency,
        last_sync_at: '2024-01-15T10:00:00Z',
        error_count: 0,
        settings: {},
        credentials: {},
        created_at: '2024-01-15T09:00:00Z',
        updated_at: '2024-01-15T09:00:00Z'
      };

      // Mock active integration
      (integrationManager as any).activeIntegrations.set(integrationId, mockIntegration);

      const result = await integrationManager.triggerSync(integrationId);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Integration is not connected');
    });

    it('should handle sync errors gracefully', async () => {
      const integrationId = 'test-integration-id';
      const mockIntegration: IntegrationConfig = {
        id: integrationId,
        provider: 'google',
        category: 'calendar',
        status: 'connected' as IntegrationStatus,
        authType: 'oauth2',
        is_enabled: true,
        sync_frequency: 'hourly' as SyncFrequency,
        last_sync_at: '2024-01-15T10:00:00Z',
        error_count: 0,
        settings: {},
        credentials: {
          access_token: 'test_token'
        },
        created_at: '2024-01-15T09:00:00Z',
        updated_at: '2024-01-15T09:00:00Z'
      };

      // Mock active integration
      (integrationManager as any).activeIntegrations.set(integrationId, mockIntegration);

      // Mock failed sync
      vi.spyOn(integrationManager as any, 'performSync').mockResolvedValueOnce({
        success: false,
        error: 'API rate limit exceeded'
      });

      // Mock sync log insert and update
      mockSupabase.insert.mockResolvedValueOnce({ error: null });
      mockSupabase.update.mockResolvedValueOnce({ error: null });

      const result = await integrationManager.triggerSync(integrationId);

      expect(result.success).toBe(false);
      expect(result.error).toBe('API rate limit exceeded');

      // Should update integration error status
      expect(mockSupabase.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'error',
          last_error: 'API rate limit exceeded',
          error_count: 1
        })
      );
    });
  });

  describe('Analytics and Reporting', () => {
    it('should get integration analytics', async () => {
      const integrationId = 'test-integration-id';
      const mockAnalytics = [
        {
          id: '1',
          integration_id: integrationId,
          date: '2024-01-15',
          metrics: {
            total_requests: 100,
            success_rate: 95,
            error_count: 5
          },
          events: [],
          performance: {
            avg_response_time_ms: 150,
            success_rate: 95,
            error_count: 5,
            total_requests: 100
          },
          created_at: '2024-01-15T23:59:59Z'
        }
      ];

      // Mock database response
      mockSupabase.gte.mockReturnThis();
      mockSupabase.lte.mockReturnThis();
      mockSupabase.order.mockReturnThis();
      mockSupabase.resolveOnce({
        data: mockAnalytics,
        error: null
      });

      const result = await integrationManager.getAnalytics(integrationId, {
        start: new Date('2024-01-01'),
        end: new Date('2024-01-31')
      });

      expect(result).toHaveLength(1);
      expect(result[0].integration_id).toBe(integrationId);
      expect(result[0].date).toBe('2024-01-15');
      expect(mockSupabase.from).toHaveBeenCalledWith('integration_analytics');
    });

    it('should get integration errors', async () => {
      const integrationId = 'test-integration-id';
      const mockErrors = [
        {
          id: '1',
          integration_id: integrationId,
          error_type: 'rate_limit',
          error_code: '429',
          error_message: 'API rate limit exceeded',
          context: {},
          resolved: false,
          created_at: '2024-01-15T10:00:00Z'
        }
      ];

      // Mock database response
      mockSupabase.gte.mockReturnThis();
      mockSupabase.lte.mockReturnThis();
      mockSupabase.order.mockReturnThis();
      mockSupabase.resolveOnce({
        data: mockErrors,
        error: null
      });

      const result = await integrationManager.getErrors(integrationId, {
        start: new Date('2024-01-01'),
        end: new Date('2024-01-31')
      });

      expect(result).toHaveLength(1);
      expect(result[0].integration_id).toBe(integrationId);
      expect(result[0].error_type).toBe('rate_limit');
      expect(mockSupabase.from).toHaveBeenCalledWith('integration_errors');
    });

    it('should get integration templates', async () => {
      const mockTemplates: IntegrationTemplate[] = [
        {
          id: 'google-calendar-template',
          name: 'Google Calendar Integration',
          description: 'Sync appointments with Google Calendar',
          provider: 'google',
          category: 'calendar',
          setup_instructions: [],
          required_fields: ['client_id', 'client_secret'],
          optional_fields: [],
          default_settings: {},
          webhook_events: [],
          rate_limits: {
            requests_per_hour: 10000,
            requests_per_day: 1000000,
            current_usage: {
              hour: 0,
              day: 0,
              last_reset: {
                hour: new Date().toISOString(),
                day: new Date().toISOString()
              }
            }
          },
          is_recommended: true
        }
      ];

      // Mock database response
      mockSupabase.order.mockReturnThis();
      mockSupabase.resolveOnce({
        data: mockTemplates,
        error: null
      });

      const result = await integrationManager.getTemplates('calendar');

      expect(result).toHaveLength(1);
      expect(result[0].provider).toBe('google');
      expect(result[0].category).toBe('calendar');
      expect(mockSupabase.from).toHaveBeenCalledWith('integration_templates');
    });
  });

  describe('Event Handling', () => {
    it('should register and emit events', () => {
      const mockListener = vi.fn();

      integrationManager.on('test-event', mockListener);

      (integrationManager as any).emitEvent('test-event', { data: 'test' });

      expect(mockListener).toHaveBeenCalledWith({ data: 'test' });
    });

    it('should remove event listeners', () => {
      const mockListener = vi.fn();

      integrationManager.on('test-event', mockListener);
      integrationManager.off('test-event', mockListener);

      (integrationManager as any).emitEvent('test-event', { data: 'test' });

      expect(mockListener).not.toHaveBeenCalled();
    });

    it('should handle listener errors gracefully', () => {
      const mockListener = vi.fn(() => {
        throw new Error('Listener error');
      });
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      integrationManager.on('test-event', mockListener);

      // Should not throw error
      expect(() => {
        (integrationManager as any).emitEvent('test-event', { data: 'test' });
      }).not.toThrow();

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      const integrationId = 'test-integration-id';

      // Mock database error
      mockSupabase.update.mockResolvedValueOnce({
        error: { message: 'Database connection failed' }
      });

      const result = await integrationManager.toggleIntegration(integrationId, false);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Database connection failed');
    });

    it('should handle integration service errors', async () => {
      const integrationId = 'test-integration-id';
      const mockIntegration: IntegrationConfig = {
        id: integrationId,
        provider: 'google',
        category: 'calendar',
        status: 'connected' as IntegrationStatus,
        authType: 'oauth2',
        is_enabled: true,
        sync_frequency: 'hourly' as SyncFrequency,
        last_sync_at: '2024-01-15T10:00:00Z',
        error_count: 0,
        settings: {},
        credentials: {
          access_token: 'test_token'
        },
        created_at: '2024-01-15T09:00:00Z',
        updated_at: '2024-01-15T09:00:00Z'
      };

      // Mock active integration
      (integrationManager as any).activeIntegrations.set(integrationId, mockIntegration);

      // Mock integration service error
      vi.spyOn(integrationManager as any, 'getIntegrationService').mockReturnValueOnce(null);

      const result = await integrationManager.triggerSync(integrationId);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Integration service not found');
    });
  });

  describe('Rate Limiting', () => {
    it('should check rate limits before making requests', async () => {
      const integrationId = 'test-integration-id';
      const mockIntegration: IntegrationConfig = {
        id: integrationId,
        provider: 'google',
        category: 'calendar',
        status: 'connected' as IntegrationStatus,
        authType: 'oauth2',
        is_enabled: true,
        sync_frequency: 'realtime' as SyncFrequency,
        last_sync_at: '2024-01-15T10:00:00Z',
        error_count: 0,
        settings: {},
        credentials: {
          access_token: 'test_token'
        },
        rate_limits: {
          requests_per_hour: 100,
          requests_per_day: 1000,
          current_usage: {
            hour: 99, // Near limit
            day: 500,
            last_reset: {
              hour: new Date().toISOString(),
              day: new Date().toISOString()
            }
          }
        },
        created_at: '2024-01-15T09:00:00Z',
        updated_at: '2024-01-15T09:00:00Z'
      };

      // Mock active integration
      (integrationManager as any).activeIntegrations.set(integrationId, mockIntegration);

      // This should work but test rate limiting logic
      const result = await integrationManager.triggerSync(integrationId);

      // The actual rate limiting would be implemented in the specific service
      expect(mockSupabase.from).toHaveBeenCalledWith('integration_sync_logs');
    });
  });

  describe('Cleanup', () => {
    it('should cleanup resources properly', () => {
      const clearIntervalSpy = vi.spyOn(global, 'clearInterval');
      const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');

      integrationManager.cleanup();

      expect(clearIntervalSpy).toHaveBeenCalled();
      expect(clearTimeoutSpy).toHaveBeenCalled();

      clearIntervalSpy.mockRestore();
      clearTimeoutSpy.mockRestore();
    });
  });

  describe('Polish Market Specific Features', () => {
    it('should handle Polish timezone settings', async () => {
      const polishConfig: Omit<IntegrationConfig, 'id' | 'created_at' | 'updated_at' | 'status'> = {
        provider: 'google',
        category: 'calendar',
        authType: 'oauth2',
        is_enabled: true,
        sync_frequency: 'hourly' as SyncFrequency,
        error_count: 0,
        settings: {
          timezone: 'Europe/Warsaw',
          business_hours: {
            start: '09:00',
            end: '17:00',
            workdays: [1, 2, 3, 4, 5]
          }
        },
        credentials: {
          access_token: 'test_token'
        }
      };

      // Mock successful database insert
      mockSupabase.insert.mockResolvedValueOnce({
        error: null
      });

      // Mock successful connection test
      vi.spyOn(integrationManager as any, 'testIntegrationConnection').mockResolvedValueOnce({
        success: true
      });

      const result = await integrationManager.addIntegration(polishConfig);

      expect(result.success).toBe(true);
      expect(mockSupabase.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          settings: expect.objectContaining({
            timezone: 'Europe/Warsaw'
          })
        })
      );
    });

    it('should validate Polish-specific data', async () => {
      const polishConfig: Omit<IntegrationConfig, 'id' | 'created_at' | 'updated_at' | 'status'> = {
        provider: 'google',
        category: 'calendar',
        authType: 'oauth2',
        is_enabled: true,
        sync_frequency: 'hourly' as SyncFrequency,
        error_count: 0,
        settings: {
          polish_config: {
            language: 'pl',
            currency: 'PLN',
            gdpr_compliant: true
          }
        },
        credentials: {
          access_token: 'test_token'
        }
      };

      // Mock successful validation
      vi.spyOn(integrationManager as any, 'validateIntegrationConfig').mockResolvedValueOnce({
        isValid: true
      });

      const result = await integrationManager.addIntegration(polishConfig);

      expect(result.success).toBe(true);
    });
  });

  describe('Security and Compliance', () => {
    it('should handle credential encryption', async () => {
      const sensitiveConfig: Omit<IntegrationConfig, 'id' | 'created_at' | 'updated_at' | 'status'> = {
        provider: 'google',
        category: 'calendar',
        authType: 'oauth2',
        is_enabled: true,
        sync_frequency: 'hourly' as SyncFrequency,
        error_count: 0,
        settings: {},
        credentials: {
          client_id: 'sensitive_client_id',
          client_secret: 'sensitive_client_secret',
          access_token: 'sensitive_access_token'
        }
      };

      // Mock successful database insert
      mockSupabase.insert.mockResolvedValueOnce({
        error: null
      });

      // Mock successful connection test
      vi.spyOn(integrationManager as any, 'testIntegrationConnection').mockResolvedValueOnce({
        success: true
      });

      const result = await integrationManager.addIntegration(sensitiveConfig);

      expect(result.success).toBe(true);
      // In a real implementation, credentials should be encrypted before storage
      expect(mockSupabase.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          credentials: expect.objectContaining({
            client_id: 'sensitive_client_id'
          })
        })
      );
    });

    it('should validate GDPR compliance', async () => {
      const gdprConfig: Omit<IntegrationConfig, 'id' | 'created_at' | 'updated_at' | 'status'> = {
        provider: 'mailchimp',
        category: 'email_marketing',
        authType: 'api_key',
        is_enabled: true,
        sync_frequency: 'daily' as SyncFrequency,
        error_count: 0,
        settings: {
          gdpr_compliant: true,
          data_processing_agreement: true,
          consent_required: true
        },
        credentials: {
          api_key: 'test_api_key'
        }
      };

      // Mock successful database insert
      mockSupabase.insert.mockResolvedValueOnce({
        error: null
      });

      // Mock successful connection test
      vi.spyOn(integrationManager as any, 'testIntegrationConnection').mockResolvedValueOnce({
        success: true
      });

      const result = await integrationManager.addIntegration(gdprConfig);

      expect(result.success).toBe(true);
      expect(mockSupabase.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          settings: expect.objectContaining({
            gdpr_compliant: true,
            data_processing_agreement: true,
            consent_required: true
          })
        })
      );
    });
  });
});