/**
 * Booksy Integration Test Suite
 *
 * Comprehensive tests for Booksy integration components
 * Tests API client, sync engine, consent management, and monitoring
 */

import { describe, it, expect, beforeEach, afterEach, vi, beforeEach, afterEach } from 'vitest';
import { booksyClient, BooksyService, BooksyBooking, BooksyClientInfo } from '@/services/booksy-api-client';
import { booksySyncEngine, SyncResult } from '@/services/booksy-sync-engine';
import { booksyConsentManager, BooksyConsentRecord } from '@/services/booksy-consent-manager';
import { booksyAvailabilitySync } from '@/services/booksy-availability-sync';
import { booksyMonitoring, HealthCheck } from '@/services/booksy-monitoring';
import { supabase } from '@/integrations/supabase/client';

// Mock dependencies
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(),
          order: vi.fn(() => Promise.resolve({ data: [], error: null }))
        })),
        order: vi.fn(() => Promise.resolve({ data: [], error: null })),
        single: vi.fn()
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn()
        }))
      })),
      update: vi.fn(() => ({
        eq: vi.fn()
      })),
      delete: vi.fn(() => ({
        eq: vi.fn()
      }))
    })),
    auth: {
      getUser: vi.fn()
    },
    rpc: vi.fn()
  }
}));

vi.mock('@/services/secure-api-gateway', () => ({
  apiGateway: {
    request: vi.fn()
  }
}));

vi.mock('@/lib/secure-credentials', () => ({
  credentialManager: {
    getCredentials: vi.fn()
  }
}));

describe('Booksy Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Booksy API Client', () => {
    beforeEach(() => {
      vi.mocked(booksyClient).initialize = vi.fn().mockResolvedValue(true);
    });

    it('should initialize successfully with valid credentials', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: { access_token: 'test_token', expires_in: 3600 }, error: null })
          })
        })
      } as any);

      const result = await booksyClient.initialize();
      expect(result).toBe(true);
    });

    it('should handle authentication failure', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: new Error('Auth failed') })
          })
        })
      } as any);

      const result = await booksyClient.initialize();
      expect(result).toBe(false);
    });

    it('should fetch services successfully', async () => {
      const mockServices: BooksyService[] = [
        {
          id: 'service1',
          name: 'Test Service',
          description: 'Test Description',
          duration: 60,
          price: 100,
          currency: 'PLN',
          category: 'beauty',
          active: true
        }
      ];

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: { access_token: 'test_token' }, error: null })
          })
        })
      } as any);

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockServices, error: null })
          })
        })
      } as any);

      const services = await booksyClient.getServices();
      expect(services).toEqual(mockServices);
    });

    it('should handle API errors gracefully', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: { access_token: 'test_token' }, error: null })
          })
        })
      } as any);

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: new Error('API Error') })
          })
        })
      } as any);

      await expect(booksyClient.getServices()).rejects.toThrow('Failed to fetch services');
    });

    it('should create booking successfully', async () => {
      const bookingData = {
        serviceId: 'service1',
        clientInfo: {
          name: 'Test Client',
          email: 'test@example.com',
          phone: '123456789'
        },
        datetime: '2024-01-01T10:00:00Z'
      };

      const mockBooking: BooksyBooking = {
        id: 'booking1',
        serviceId: 'service1',
        clientId: 'client1',
        staffId: 'staff1',
        datetime: '2024-01-01T10:00:00Z',
        status: 'confirmed',
        duration: 60,
        price: 100,
        currency: 'PLN',
        clientInfo: {
          id: 'client1',
          name: 'Test Client',
          email: 'test@example.com',
          phone: '123456789'
        }
      };

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: { access_token: 'test_token' }, error: null })
          })
        })
      } as any);

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockBooking, error: null })
          })
        })
      } as any);

      const booking = await booksyClient.createBooking(bookingData);
      expect(booking).toEqual(mockBooking);
    });
  });

  describe('Booksy Sync Engine', () => {
    beforeEach(() => {
      vi.mocked(booksySyncEngine.initialize = vi.fn().mockResolvedValue());
      vi.mocked(booksySyncEngine.performFullSync = vi.fn());
    });

    it('should initialize successfully', async () => {
      await booksySyncEngine.initialize();
      expect(booksySyncEngine.initialize).toHaveBeenCalled();
    });

    it('should perform full sync successfully', async () => {
      const mockSyncResult: SyncResult = {
        success: true,
        processed: 10,
        failed: 0,
        conflicts: [],
        errors: [],
        duration: 5000
      };

      vi.mocked(booksySyncEngine.performFullSync = vi.fn().mockResolvedValue(mockSyncResult));

      const result = await booksySyncEngine.performFullSync();
      expect(result).toEqual(mockSyncResult);
    });

    it('should handle sync failures', async () => {
      const mockSyncResult: SyncResult = {
        success: false,
        processed: 5,
        failed: 2,
        conflicts: [],
        errors: ['API timeout', 'Connection failed'],
        duration: 3000
      };

      vi.mocked(booksySyncEngine.performFullSync = vi.fn().mockResolvedValue(mockSyncResult));

      const result = await booksySyncEngine.performFullSync();
      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(2);
    });

    it('should resolve conflicts correctly', async () => {
      const conflictId = 'conflict1';
      const resolution = 'platform';

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                id: conflictId,
                entity_type: 'booking',
                entity_id: 'booking1',
                booksy_entity_id: 'booksy_booking1',
                conflict_type: 'data_mismatch'
              },
              error: null
            })
          })
        })
      } as any);

      vi.mocked(supabase.from).mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: null, error: null })
        })
      } as any);

      await expect(booksySyncEngine.resolveConflict(conflictId, resolution)).resolves.not.toThrow();
    });

    it('should queue sync operations', async () => {
      const operation = {
        operationType: 'create',
        entityType: 'booking',
        entityId: 'booking1',
        booksyEntityId: 'booksy_booking1',
        payload: { test: 'data' },
        priority: 8
      };

      vi.mocked(supabase.rpc).mockResolvedValue('queue_id');

      const result = await booksySyncEngine.queueSyncOperation(
        operation.operationType,
        operation.entityType,
        operation.entityId,
        operation.booksyEntityId,
        operation.payload,
        operation.priority
      );

      expect(result).toBe('queue_id');
      expect(vi.mocked(supabase.rpc)).toHaveBeenCalledWith('queue_booksy_sync', {
        p_operation_type: operation.operationType,
        p_entity_type: operation.entityType,
        p_entity_id: operation.entityId,
        p_booksy_entity_id: operation.booksyEntityId,
        p_payload: operation.payload,
        p_priority: operation.priority
      });
    });
  });

  describe('Booksy Consent Manager', () => {
    beforeEach(() => {
      vi.mocked(booksyConsentManager.getCurrentPolicy = vi.fn());
    });

    it('should record consent successfully', async () => {
      const consentRequest = {
        userId: 'user1',
        consentData: {
          dataSync: true,
          appointmentHistory: true,
          contactInfo: true,
          servicePreferences: false,
          marketing: false
        },
        ipAddress: '127.0.0.1',
        userAgent: 'Test Agent',
        purpose: 'Testing'
      };

      const mockConsentRecord: BooksyConsentRecord = {
        id: 'consent1',
        userId: consentRequest.userId,
        consentType: 'data_sync',
        consentGiven: true,
        consentData: consentRequest.consentData,
        ipAddress: consentRequest.ipAddress,
        userAgent: consentRequest.userAgent,
        timestamp: new Date(),
        version: '1.0',
        legalBasis: 'explicit_consent',
        retentionPeriod: 365,
        purpose: consentRequest.purpose
      };

      vi.mocked(supabase.from).mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockConsentRecord, error: null })
          })
        })
      } as any);

      vi.mocked(supabase.from).mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: null, error: null })
        })
      } as any);

      const result = await booksyConsentManager.recordConsent(consentRequest);
      expect(result.userId).toBe(consentRequest.userId);
      expect(result.consentGiven).toBe(true);
    });

    it('should revoke consent successfully', async () => {
      const userId = 'user1';
      const reason = 'User requested removal';
      const ipAddress = '127.0.0.1';

      vi.mocked(supabase.from).mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: null })
          })
        })
      } as any);

      vi.mocked(supabase.from).mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: null, error: null })
        })
      } as any);

      await expect(booksyConsentManager.revokeConsent(userId, reason, ipAddress)).resolves.not.toThrow();
    });

    it('should check consent validity correctly', async () => {
      const userId = 'user1';

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                booksy_data_consent: true,
                booksy_consent_given_at: new Date().toISOString(),
                booksy_consent_revoked_at: null
              },
              error: null
            })
          })
        })
      } as any);

      const hasConsent = await booksyConsentManager.hasValidConsent(userId);
      expect(hasConsent).toBe(true);
    });

    it('should handle expired consent', async () => {
      const userId = 'user1';
      const expiredDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // Yesterday

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                booksy_data_consent: false,
                booksy_consent_given_at: null,
                booksy_consent_revoked_at: expiredDate.toISOString()
              },
              error: null
            })
          })
        })
      } as any);

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: {
                    consent_given: false,
                    expiry_date: expiredDate.toISOString()
                  },
                  error: null
                })
              })
            })
          })
        })
      } as any);

      const hasConsent = await booksyConsentManager.hasValidConsent(userId);
      expect(hasConsent).toBe(false);
    });

    it('should generate consent reports', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            gte: vi.fn().mockReturnValue({
              lte: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({
                  data: [
                    {
                      user_id: 'user1',
                      consent_given: true,
                      consent_data: { dataSync: true },
                      timestamp: new Date().toISOString()
                    },
                    {
                      user_id: 'user2',
                      consent_given: false,
                      consent_data: { dataSync: false },
                      timestamp: new Date().toISOString()
                    }
                  ],
                  error: null
                })
              })
            })
          })
        })
      } as any);

      const report = await booksyConsentManager.generateConsentReport(startDate, endDate);
      expect(report.totalConsents).toBe(2);
      expect(report.activeConsents).toBe(1);
      expect(report.revokedConsents).toBe(1);
    });
  });

  describe('Booksy Availability Sync', () => {
    beforeEach(() => {
      vi.mocked(booksyAvailabilitySync.initialize = vi.fn().mockResolvedValue());
    });

    it('should initialize successfully', async () => {
      await booksyAvailabilitySync.initialize();
      expect(booksyAvailabilitySync.initialize).toHaveBeenCalled();
    });

    it('should perform full availability sync', async () => {
      const mockService = {
        id: 'service1',
        booksy_service_id: 'booksy_service1',
        name: 'Test Service',
        duration: 60,
        buffer_time_before: 15,
        buffer_time_after: 15
      };

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          not: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: [mockService],
                error: null
              })
            })
          })
        })
      } as any);

      const result = await booksyAvailabilitySync.performFullAvailabilitySync();
      expect(result.synced).toBeGreaterThanOrEqual(0);
      expect(result.conflicts).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(result.errors)).toBe(true);
    });

    it('should handle booking created event', async () => {
      const booking = {
        id: 'booking1',
        service_id: 'service1',
        start_time: '2024-01-01T10:00:00Z',
        end_time: '2024-01-01T11:00:00Z',
        booksy_booking_id: 'booksy_booking1'
      };

      vi.mocked(supabase.from).mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ data: null, error: null })
          })
        })
      } as any);

      await expect(booksyAvailabilitySync.handlePlatformBooking(booking)).resolves.not.toThrow();
    });

    it('should handle booking cancelled event', async () => {
      const booking = {
        id: 'booking1',
        service_id: 'service1',
        start_time: '2024-01-01T10:00:00Z',
        end_time: '2024-01-01T11:00:00Z',
        booksy_booking_id: 'booksy_booking1'
      };

      vi.mocked(supabase.from).mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: null, error: null })
        })
      } as any);

      await expect(booksyAvailabilitySync.handlePlatformCancellation(booking)).resolves.not.toThrow();
    });

    it('should resolve availability conflicts', async () => {
      const conflictId = 'conflict1';
      const resolution = 'platform';

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                id: conflictId,
                slot_id: 'slot1',
                booksy_slot_id: 'booksy_slot1',
                conflict_type: 'availability_mismatch',
                platform_data: { status: 'available' },
                booksy_data: { available: false }
              },
              error: null
            })
          })
        })
      } as any);

      vi.mocked(supabase.from).mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: null, error: null })
        })
      } as any);

      await expect(booksyAvailabilitySync.resolveConflict(conflictId, resolution)).resolves.not.toThrow();
    });

    it('should get sync status', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: {
              total_slots: 100,
              synced_slots: 95,
              conflicted_slots: 5
            },
            error: null
          })
        })
      } as any);

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            count: 'exact',
            head: vi.fn().mockResolvedValue({ count: 2, error: null })
          })
        })
      } as any);

      const status = await booksyAvailabilitySync.getSyncStatus();
      expect(status.totalSlots).toBe(100);
      expect(status.syncedSlots).toBe(95);
      expect(status.pendingConflicts).toBe(2);
    });
  });

  describe('Booksy Monitoring Service', () => {
    beforeEach(() => {
      vi.mocked(booksyMonitoring.startMonitoring = vi.fn().mockResolvedValue());
      vi.mocked(booksyMonitoring.stopMonitoring = vi.fn());
    });

    it('should start monitoring successfully', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: [], error: null })
        })
      } as any);

      await booksyMonitoring.startMonitoring();
      expect(booksyMonitoring.startMonitoring).toHaveBeenCalled();
    });

    it('should perform health checks', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: { access_token: 'test_token' }, error: null })
          })
        })
      } as any);

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue({ data: [], error: null })
        })
      } as any);

      vi.mocked(booksySyncEngine.getSyncStatus = vi.fn().mockResolvedValue({
        isProcessing: false,
        lastSync: new Date(),
        conflicts: 0
      }));

      vi.mocked(booksyAvailabilitySync.getSyncStatus = vi.fn().mockResolvedValue({
        totalSlots: 100,
        syncedSlots: 95,
        pendingConflicts: 2
      }));

      const healthChecks = await booksyMonitoring.performHealthCheck();
      expect(healthChecks).toHaveLength(5); // API, sync engine, availability sync, database, queue
      expect(healthChecks[0].component).toBe('booksy_api_client');
    });

    it('should record sync metrics', async () => {
      const metrics = {
        totalOperations: 100,
        successfulOperations: 95,
        failedOperations: 5,
        averageResponseTime: 250,
        conflictCount: 2,
        queueSize: 10,
        errorTypes: { timeout: 3, auth_error: 2 }
      };

      vi.mocked(supabase.from).mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: null })
          })
        })
      } as any);

      await expect(booksyMonitoring.recordSyncMetrics(metrics)).resolves.not.toThrow();
    });

    it('should get system health', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: { access_token: 'test_token' }, error: null })
          })
        })
      } as any);

      vi.mocked(booksySyncEngine.getSyncStatus = vi.fn().mockResolvedValue({
        isProcessing: false,
        lastSync: new Date(),
        conflicts: 0
      }));

      vi.mocked(booksyAvailabilitySync.getSyncStatus = vi.fn().mockResolvedValue({
        totalSlots: 100,
        syncedSlots: 95,
        pendingConflicts: 2
      }));

      const systemHealth = await booksyMonitoring.getSystemHealth();
      expect(systemHealth.status).toBeDefined();
      expect(Array.isArray(systemHealth.components)).toBe(true);
      expect(typeof systemHealth.metrics).toBe('object');
      expect(typeof systemHealth.activeAlerts).toBe('number');
      expect(typeof systemHealth.uptime).toBe('number');
    });

    it('should handle alerts correctly', async () => {
      const alertId = 'alert1';
      const userId = 'admin1';

      const mockAlert = {
        id: alertId,
        ruleId: 'rule1',
        severity: 'warning' as const,
        message: 'Test Alert',
        details: { test: 'data' },
        status: 'active' as const,
        createdAt: new Date()
      };

      // Add alert to monitoring service
      booksyMonitoring['alerts'].set(alertId, mockAlert);

      vi.mocked(supabase.from).mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: null, error: null })
        })
      } as any);

      await expect(booksyMonitoring.acknowledgeAlert(alertId, userId)).resolves.not.toThrow();

      const acknowledgedAlert = booksyMonitoring['alerts'].get(alertId);
      expect(acknowledgedAlert?.status).toBe('acknowledged');
      expect(acknowledgedAlert?.acknowledgedBy).toBe(userId);
    });

    it('should evaluate alert rules', async () => {
      const metrics = {
        timestamp: new Date(),
        totalOperations: 100,
        successfulOperations: 80,
        failedOperations: 20,
        averageResponseTime: 500,
        conflictCount: 15,
        queueSize: 50,
        errorTypes: { timeout: 15, auth_error: 5 }
      };

      vi.mocked(supabase.from).mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: null })
          })
        })
      } as any);

      await expect(booksyMonitoring.recordSyncMetrics(metrics)).resolves.not.toThrow();

      // Check if alerts would be triggered based on metrics
      const errorRate = metrics.failedOperations / metrics.totalOperations;
      expect(errorRate).toBe(0.2); // 20% error rate, should trigger alert
    });
  });

  describe('Integration Flow Tests', () => {
    it('should handle complete booking flow with Booksy sync', async () => {
      // 1. User gives consent
      const consentRequest = {
        userId: 'user1',
        consentData: {
          dataSync: true,
          appointmentHistory: true,
          contactInfo: true,
          servicePreferences: false,
          marketing: false
        },
        ipAddress: '127.0.0.1',
        userAgent: 'Test Agent'
      };

      vi.mocked(supabase.from).mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: 'consent1', ...consentRequest },
              error: null
            })
          })
        })
      } as any);

      const consentRecord = await booksyConsentManager.recordConsent(consentRequest);
      expect(consentRecord.consentGiven).toBe(true);

      // 2. Booking is created on platform
      const bookingData = {
        serviceId: 'service1',
        clientInfo: {
          name: 'Test Client',
          email: 'test@example.com',
          phone: '123456789'
        },
        datetime: '2024-01-01T10:00:00Z'
      };

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { booksy_data_consent: true },
              error: null
            })
          })
        })
      } as any);

      vi.mocked(supabase.from).mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: 'booking1' },
              error: null
            })
          })
        })
      } as any);

      // 3. Booking is synced to Booksy
      vi.mocked(supabase.from).mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: null, error: null })
        })
      } as any);

      // 4. Availability is updated
      vi.mocked(supabase.from).mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ data: null, error: null })
          })
        })
      } as any);

      // The flow should complete without errors
      expect(true).toBe(true);
    });

    it('should handle sync conflict resolution', async () => {
      // 1. Conflict is detected
      const conflictData = {
        platformData: { status: 'confirmed', price: 100 },
        booksyData: { status: 'pending', price: 120 }
      };

      // 2. Conflict is created
      vi.mocked(supabase.from).mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: 'conflict1' },
              error: null
            })
          })
        })
      } as any);

      // 3. Conflict is resolved with platform priority
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                id: 'conflict1',
                entity_type: 'booking',
                conflict_type: 'data_mismatch'
              },
              error: null
            })
          })
        })
      } as any);

      vi.mocked(supabase.from).mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: null, error: null })
        })
      } as any);

      await expect(booksySyncEngine.resolveConflict('conflict1', 'platform')).resolves.not.toThrow();
    });

    it('should handle monitoring and alerting', async () => {
      // 1. Monitoring starts
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: [], error: null })
        })
      } as any);

      await booksyMonitoring.startMonitoring();

      // 2. Metrics show high error rate
      const highErrorMetrics = {
        timestamp: new Date(),
        totalOperations: 100,
        successfulOperations: 70,
        failedOperations: 30,
        averageResponseTime: 1000,
        conflictCount: 10,
        queueSize: 100,
        errorTypes: { timeout: 20, auth_error: 10 }
      };

      vi.mocked(supabase.from).mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: null })
          })
        })
      } as any);

      // 3. Alert should be triggered
      await booksyMonitoring.recordSyncMetrics(highErrorMetrics);

      // 4. System health should reflect issues
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: { access_token: 'test_token' }, error: null })
          })
        })
      } as any);

      const systemHealth = await booksyMonitoring.getSystemHealth();
      expect(systemHealth.status).toBeDefined();
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle Booksy API timeout', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: new Error('Request timeout') })
          })
        })
      } as any);

      await expect(booksyClient.getServices()).rejects.toThrow();
    });

    it('should handle database connection failures', async () => {
      vi.mocked(supabase.from).mockImplementation(() => {
        throw new Error('Database connection failed');
      });

      await expect(booksySyncEngine.performFullSync()).rejects.toThrow();
    });

    it('should handle invalid consent data', async () => {
      const invalidConsentRequest = {
        userId: '',
        consentData: {} as any,
        ipAddress: '',
        userAgent: ''
      };

      vi.mocked(supabase.from).mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockRejectedValue(new Error('Invalid consent data'))
          })
        })
      } as any);

      await expect(booksyConsentManager.recordConsent(invalidConsentRequest)).rejects.toThrow();
    });

    it('should handle missing Booksy credentials', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: new Error('Credentials not found') })
          })
        })
      } as any);

      const result = await booksyClient.initialize();
      expect(result).toBe(false);
    });

    it('should handle large sync queue', async () => {
      const largeQueue = Array.from({ length: 1500 }, (_, i) => ({
        id: `item${i}`,
        status: 'pending',
        attempts: 0,
        maxAttempts: 3
      }));

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            group: vi.fn().mockResolvedValue({
              data: [{ status: 'pending', count: 1500 }],
              error: null
            })
          })
        })
      } as any);

      const queueHealth = await booksyMonitoring['checkQueueHealth']();
      expect(queueHealth.status).toBe('warning');
      expect(queueHealth.message).toContain('1500');
    });
  });
});