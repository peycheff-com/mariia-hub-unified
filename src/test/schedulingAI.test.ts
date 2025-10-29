import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { schedulingAI, SchedulingAIService } from '@/services/schedulingAI';
import { noShowModel, NoShowPredictionModel } from '@/services/noShowPrediction';
import { smartReminderSystem, SmartReminderSystem } from '@/services/smartReminderSystem';
import { supabase } from '@/integrations/supabase/client';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => ({
              limit: vi.fn(() => ({
                single: vi.fn(),
              })),
              gte: vi.fn(),
              lte: vi.fn(),
            })),
            lt: vi.fn(),
            in: vi.fn(),
            single: vi.fn(),
          })),
          gte: vi.fn(() => ({
            lte: vi.fn(() => ({
              order: vi.fn(() => ({
                limit: vi.fn(() => ({
                  single: vi.fn(),
                })),
              })),
            })),
          })),
        })),
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(),
          })),
        })),
        update: vi.fn(() => ({
          eq: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn(),
            })),
          })),
        })),
        delete: vi.fn(() => ({
          eq: vi.fn(),
        })),
      })),
    }),
  },
}));

// Mock AI Service
vi.mock('@/services/ai.service', () => ({
  getAIServiceManager: vi.fn(() => ({
    generateContent: vi.fn(),
  })),
}));

describe('SchedulingAI Service', () => {
  let service: SchedulingAIService;

  beforeEach(() => {
    service = SchedulingAIService.getInstance();
    vi.clearAllMocks();
  });

  afterEach(() => {
    service.clearCache();
  });

  describe('analyzeBookingPatterns', () => {
    it('should analyze customer booking patterns correctly', async () => {
      const mockBookings = [
        {
          id: '1',
          client_id: 'customer-1',
          service_id: 'service-1',
          start_time: '2024-01-15T10:00:00Z',
          created_at: '2024-01-10T00:00:00Z',
          status: 'completed',
          services: {
            name: 'Facial Treatment',
            category: 'beauty',
            duration_minutes: 60,
            price_from: 100,
          },
        },
        {
          id: '2',
          client_id: 'customer-1',
          service_id: 'service-1',
          start_time: '2024-01-08T14:00:00Z',
          created_at: '2024-01-05T00:00:00Z',
          status: 'completed',
          services: {
            name: 'Facial Treatment',
            category: 'beauty',
            duration_minutes: 60,
            price_from: 100,
          },
        },
      ];

      const mockPattern = {
        customerId: 'customer-1',
        serviceId: 'service-1',
        preferredDays: [1, 5], // Monday, Friday
        preferredTimes: [10, 14],
        bookingFrequency: 2,
        averageAdvanceBooking: 5,
        seasonalPreferences: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
        cancellationHistory: {
          total: 0,
          reasons: [],
          patterns: [],
        },
        noShowHistory: {
          total: 0,
          riskFactors: [],
        },
        packageBookings: false,
        loyaltyPoints: 200,
        timeSinceLastBooking: 7,
      };

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'bookings') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  order: vi.fn(() => ({
                    limit: vi.fn(() => ({
                      single: vi.fn().mockResolvedValue({
                        data: mockBookings,
                        error: null,
                      }),
                    })),
                  })),
                })),
              })),
            })),
          } as any;
        }
        return {} as any;
      });

      const { getAIServiceManager } = await import('@/services/ai.service');
      vi.mocked(getAIServiceManager().generateContent).mockResolvedValue({
        content: JSON.stringify(mockPattern),
      });

      const result = await service.analyzeBookingPatterns('customer-1');

      expect(result).toEqual(mockPattern);
      expect(getAIServiceManager().generateContent).toHaveBeenCalled();
    });

    it('should cache booking patterns for 1 hour', async () => {
      const customerId = 'customer-1';
      const firstCall = service.analyzeBookingPatterns(customerId);
      const secondCall = service.analyzeBookingPatterns(customerId);

      // Both calls should return the same promise (cached)
      expect(firstCall).toBe(secondCall);
    });
  });

  describe('analyzeServicePatterns', () => {
    it('should analyze service booking patterns correctly', async () => {
      const mockService = {
        id: 'service-1',
        name: 'Facial Treatment',
        category: 'beauty',
        duration_minutes: 60,
        price_from: 100,
      };

      const mockServicePattern = {
        serviceId: 'service-1',
        serviceName: 'Facial Treatment',
        category: 'beauty',
        duration: 60,
        price: 100,
        peakDemand: {
          days: [1, 5],
          times: [10, 14],
          months: [5, 6, 7],
        },
        seasonalTrends: [
          { month: 1, demandMultiplier: 0.8 },
          { month: 6, demandMultiplier: 1.5 },
        ],
        bookingFrequency: 15,
        averageRating: 4.8,
        cancellationRate: 0.05,
        noShowRate: 0.03,
        popularAddons: ['lip enhancement'],
        packageDeals: ['facial package'],
      };

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'services') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn().mockResolvedValue({
                  data: mockService,
                  error: null,
                }),
              })),
            })),
          } as any;
        } else if (table === 'bookings') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                gte: vi.fn(() => ({
                  limit: vi.fn().mockResolvedValue({
                    data: [],
                    error: null,
                  }),
                })),
              })),
            })),
          } as any;
        }
        return {} as any;
      });

      const { getAIServiceManager } = await import('@/services/ai.service');
      vi.mocked(getAIServiceManager().generateContent).mockResolvedValue({
        content: JSON.stringify(mockServicePattern),
      });

      const result = await service.analyzeServicePatterns('service-1');

      expect(result).toEqual(mockServicePattern);
    });
  });

  describe('predictOptimalScheduling', () => {
    it('should predict optimal scheduling for date range', async () => {
      const servicePattern = {
        serviceId: 'service-1',
        serviceName: 'Facial Treatment',
        category: 'beauty',
        duration: 60,
        price: 100,
        peakDemand: {
          days: [1, 5],
          times: [10, 14],
          months: [5, 6, 7],
        },
      };

      vi.spyOn(service, 'analyzeServicePatterns').mockResolvedValue(servicePattern as any);

      const { getAIServiceManager } = await import('@/services/ai.service');
      vi.mocked(getAIServiceManager().generateContent).mockResolvedValue({
        content: JSON.stringify([{
          date: '2024-01-15',
          timeSlots: [
            {
              time: '10:00',
              score: 0.9,
              predictedDemand: 'high',
              fillProbability: 0.95,
              revenuePotential: 100,
              reasoning: 'Peak time on Monday',
            },
            {
              time: '14:00',
              score: 0.8,
              predictedDemand: 'medium',
              fillProbability: 0.85,
              revenuePotential: 90,
              reasoning: 'Good afternoon slot',
            },
          ],
          overallDemand: 'high',
          confidence: 0.88,
          factors: ['Monday', 'Peak hours', 'Seasonal demand'],
          recommendations: [
            {
              type: 'optimal_time',
              priority: 'high',
              title: 'Schedule more Monday appointments',
              description: 'High demand on Mondays',
              action: { type: 'add_slots', parameters: { day: 'Monday' } },
              expectedImpact: { revenue: 15, efficiency: 10, satisfaction: 5 },
              confidence: 0.9,
              validUntil: '2024-01-31',
            },
          ],
        }]),
      });

      const result = await service.predictOptimalScheduling(
        'service-1',
        '2024-01-15',
        '2024-01-21'
      );

      expect(result).toHaveLength(1);
      expect(result[0].date).toBe('2024-01-15');
      expect(result[0].timeSlots).toHaveLength(2);
      expect(result[0].overallDemand).toBe('high');
    });
  });

  describe('predictNoShowRisk', () => {
    it('should predict no-show risk for booking', async () => {
      const mockBooking = {
        id: 'booking-1',
        client_id: 'customer-1',
        service_id: 'service-1',
        start_time: '2024-01-20T10:00:00Z',
        services: {
          name: 'Facial Treatment',
          price_from: 100,
        },
      };

      const customerPattern = {
        noShowHistory: { total: 1, riskFactors: ['new_customer'] },
        bookingFrequency: 1,
        averageAdvanceBooking: 2,
      };

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'bookings') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn().mockResolvedValue({
                  data: mockBooking,
                  error: null,
                }),
              })),
            })),
          } as any;
        }
        return {} as any;
      });

      vi.spyOn(service, 'analyzeBookingPatterns').mockResolvedValue(customerPattern as any);

      const { getAIServiceManager } = await import('@/services/ai.service');
      vi.mocked(getAIServiceManager().generateContent).mockResolvedValue({
        content: JSON.stringify({
          probability: 0.25,
          confidence: 0.85,
          reasoning: 'Low risk due to previous attendance',
        }),
      });

      const result = await service.predictNoShowProbability('booking-1');

      expect(result).toBe(0.25);
    });
  });

  describe('getPersonalizedRecommendations', () => {
    it('should get personalized recommendations for customer', async () => {
      const customerPattern = {
        preferredDays: [1, 5],
        preferredTimes: [10, 14],
        bookingFrequency: 2,
        timeSinceLastBooking: 7,
      };

      const servicePatterns = [
        {
          serviceId: 'service-2',
          serviceName: 'Massage Therapy',
          category: 'beauty',
          price: 150,
          averageRating: 4.9,
        },
      ];

      vi.spyOn(service, 'analyzeBookingPatterns').mockResolvedValue(customerPattern as any);

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'user_favorites') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn().mockResolvedValue({
                data: [],
                error: null,
              }),
            })),
          } as any;
        } else if (table === 'services') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                not: vi.fn(() => ({
                  in: vi.fn(() => ({
                    limit: vi.fn().mockResolvedValue({
                      data: [{ id: 'service-2' }],
                      error: null,
                    }),
                  })),
                })),
              })),
            })),
          } as any;
        }
        return {} as any;
      });

      const { getAIServiceManager } = await import('@/services/ai.service');
      vi.mocked(getAIServiceManager().generateContent).mockResolvedValue({
        content: JSON.stringify([
          {
            serviceId: 'service-2',
            serviceName: 'Massage Therapy',
            score: 0.92,
            reasoning: 'Based on your preference for beauty services',
            category: 'beauty',
            price: 150,
            confidence: 0.88,
          },
        ]),
      });

      const result = await service.getPersonalizedRecommendations('customer-1', ['service-2']);

      expect(result).toHaveLength(1);
      expect(result[0].serviceName).toBe('Massage Therapy');
      expect(result[0].score).toBe(0.92);
    });
  });

  describe('getSchedulingAnalytics', () => {
    it('should get scheduling analytics for period', async () => {
      const mockAnalytics = {
        period: 'month',
        totalBookings: 150,
        noShowRate: 0.05,
        cancellationRate: 0.08,
        averageRevenuePerBooking: 120,
        fillRate: 0.92,
        customerSatisfaction: 4.7,
        predictionsAccuracy: {
          demand: 0.87,
          noShow: 0.82,
          cancellations: 0.79,
        },
        revenueOptimization: {
          actual: 18000,
          predicted: 19500,
          improvement: 8.3,
        },
        timeSlotUtilization: [],
        servicePerformance: [],
      };

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn(() => ({
          gte: vi.fn(() => ({
            lte: vi.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          })),
        })),
      } as any);

      const { getAIServiceManager } = await import('@/services/ai.service');
      vi.mocked(getAIServiceManager().generateContent).mockResolvedValue({
        content: JSON.stringify(mockAnalytics),
      });

      const result = await service.getSchedulingAnalytics('month');

      expect(result.period).toBe('month');
      expect(result.totalBookings).toBe(150);
      expect(result.noShowRate).toBe(0.05);
    });
  });
});

describe('NoShowPredictionModel', () => {
  let model: NoShowPredictionModel;

  beforeEach(() => {
    model = NoShowPredictionModel.getInstance();
    vi.clearAllMocks();
  });

  describe('extractFeatures', () => {
    it('should extract features from booking data', async () => {
      const mockBooking = {
        id: 'booking-1',
        client_id: 'customer-1',
        service_id: 'service-1',
        start_time: '2024-01-20T10:00:00Z',
        created_at: '2024-01-15T00:00:00Z',
        services: {
          name: 'Facial Treatment',
          category: 'beauty',
          duration_minutes: 60,
          price_from: 100,
        },
      };

      const mockCustomerBookings = [
        {
          status: 'completed',
          created_at: '2024-01-01T00:00:00Z',
        },
        {
          status: 'no_show',
          created_at: '2024-01-05T00:00:00Z',
        },
      ];

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'bookings') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn().mockResolvedValue({
                  data: mockBooking,
                  error: null,
                }),
              })),
            })),
          } as any;
        }
        return {} as any;
      });

      // Mock the nested call for customer history
      const originalMock = vi.mocked(supabase.from);
      originalMock.mockImplementationOnce(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            lt: vi.fn().mockResolvedValue({
              data: mockCustomerBookings,
              error: null,
            }),
          })),
        })),
      } as any));

      const features = await (model as any).extractFeatures('booking-1');

      expect(features).toHaveProperty('historical_no_show_rate');
      expect(features).toHaveProperty('booking_advance_days');
      expect(features).toHaveProperty('service_price');
      expect(features).toHaveProperty('time_of_day');
      expect(features).toHaveProperty('day_of_week');
    });
  });

  describe('predictNoShowProbability', () => {
    it('should predict no-show probability', async () => {
      vi.spyOn(model as any, 'extractFeatures').mockResolvedValue({
        historical_no_show_rate: 0.1,
        booking_advance_days: 5,
        service_price: 0.1,
        time_of_day: 0.42,
        day_of_week: 0.14,
      });

      const { getAIServiceManager } = await import('@/services/ai.service');
      vi.mocked(getAIServiceManager().generateContent).mockResolvedValue({
        content: JSON.stringify({
          probability: 0.15,
          confidence: 0.85,
          reasoning: 'Low risk based on history',
        }),
      });

      const result = await model.predictNoShowProbability('booking-1');

      expect(result).toBe(0.15);
    });

    it('should return 0.5 on error', async () => {
      vi.spyOn(model as any, 'extractFeatures').mockRejectedValue(new Error('Test error'));

      const result = await model.predictNoShowProbability('booking-1');

      expect(result).toBe(0.5);
    });
  });

  describe('generateDetailedPrediction', () => {
    it('should generate detailed no-show prediction', async () => {
      vi.spyOn(model, 'predictNoShowProbability').mockResolvedValue(0.25);
      vi.spyOn(model as any, 'extractFeatures').mockResolvedValue({
        historical_no_show_rate: 0.1,
        service_price: 0.1,
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: { client_id: 'customer-1' },
              error: null,
            }),
          })),
        })),
      } as any);

      const { getAIServiceManager } = await import('@/services/ai.service');
      vi.mocked(getAIServiceManager().generateContent).mockResolvedValue({
        content: JSON.stringify([
          {
            action: 'Send confirmation reminders',
            effectiveness: 0.7,
            cost: 'low',
          },
        ]),
      });

      const result = await model.generateDetailedPrediction('booking-1');

      expect(result.bookingId).toBe('booking-1');
      expect(result.riskScore).toBe(0.25);
      expect(result.riskLevel).toBe('medium');
      expect(result.factors).toBeDefined();
      expect(result.recommendedActions).toBeDefined();
    });
  });

  describe('trainModel', () => {
    it('should train the model with historical data', async () => {
      const mockTrainingData = Array.from({ length: 100 }, (_, i) => ({
        id: `booking-${i}`,
        client_id: `customer-${i % 10}`,
        status: i % 10 === 0 ? 'no-show' : 'completed',
        created_at: '2024-01-01T00:00:00Z',
      }));

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn(() => ({
          lt: vi.fn().mockResolvedValue({
            data: mockTrainingData,
            error: null,
          }),
        })),
      } as any);

      vi.mocked(supabase.from).mockReturnValueOnce({
        insert: vi.fn(() => ({
          select: vi.fn(),
        })),
      } as any);

      const { getAIServiceManager } = await import('@/services/ai.service');
      vi.mocked(getAIServiceManager().generateContent).mockResolvedValue({
        content: JSON.stringify({
          metrics: { accuracy: 0.85 },
          weights: { historical_no_show_rate: 0.3 },
        }),
      });

      await model.trainModel();

      expect(getAIServiceManager().generateContent).toHaveBeenCalled();
      expect(model.getModelStatus().isTrained).toBe(true);
    });
  });
});

describe('SmartReminderSystem', () => {
  let system: SmartReminderSystem;

  beforeEach(() => {
    system = SmartReminderSystem.getInstance();
    vi.clearAllMocks();
  });

  describe('generateReminderSchedule', () => {
    it('should generate reminder schedule based on risk level', async () => {
      const noShowRisk = {
        bookingId: 'booking-1',
        customerId: 'customer-1',
        riskScore: 0.75,
        riskLevel: 'high',
        factors: [],
        recommendedActions: [],
        depositRecommendation: {
          required: true,
          amount: 25,
          reasoning: 'High risk',
        },
        reminderStrategy: {
          frequency: 'frequent',
          channels: ['email', 'sms'],
          timing: ['48h', '24h', '12h', '2h'],
          message: 'emphasizing_importance',
        },
      };

      const mockBooking = {
        id: 'booking-1',
        client_id: 'customer-1',
        start_time: '2024-01-20T10:00:00Z',
        services: {
          name: 'Facial Treatment',
          duration_minutes: 60,
        },
      };

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: mockBooking,
              error: null,
            }),
          })),
        })),
      } as any);

      const schedule = await system.generateReminderSchedule('booking-1', noShowRisk);

      expect(schedule.bookingId).toBe('booking-1');
      expect(schedule.customerId).toBe('customer-1');
      expect(schedule.reminders.length).toBeGreaterThan(0);
      expect(schedule.optimizationScore).toBeGreaterThan(0);
    });

    it('should adjust reminder strategy for critical risk', async () => {
      const noShowRisk = {
        bookingId: 'booking-1',
        customerId: 'customer-1',
        riskScore: 0.95,
        riskLevel: 'critical',
        factors: [],
        recommendedActions: [],
        depositRecommendation: {
          required: true,
          amount: 50,
          reasoning: 'Critical risk',
        },
        reminderStrategy: {
          frequency: 'aggressive',
          channels: ['email', 'sms', 'whatsapp', 'push'],
          timing: ['72h', '48h', '24h', '12h', '2h'],
          message: 'urgent_with_personal_touch',
        },
      };

      const mockBooking = {
        id: 'booking-1',
        client_id: 'customer-1',
        start_time: '2024-01-20T10:00:00Z',
        services: {
          name: 'Facial Treatment',
          duration_minutes: 60,
        },
      };

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: mockBooking,
              error: null,
            }),
          })),
        })),
      } as any);

      const schedule = await system.generateReminderSchedule('booking-1', noShowRisk);

      // Should have more reminders for critical risk
      expect(schedule.reminders.length).toBeGreaterThanOrEqual(5);

      // Should include all channels
      const channels = schedule.reminders.map(r => r.channel);
      expect(channels).toContain('email');
      expect(channels).toContain('sms');
      expect(channels).toContain('whatsapp');
      expect(channels).toContain('push');
    });
  });

  describe('calculateOptimalTiming', () => {
    it('should calculate optimal timing considering quiet hours', async () => {
      const appointmentTime = new Date('2024-01-20T10:00:00Z');
      const template = {
        id: 'reminder_24h',
        timing: {
          defaultOffset: 24,
          minOffset: 18,
          maxOffset: 30,
        },
      } as any;

      const customerPreferences = {
        quietHours: { start: '22:00', end: '08:00' },
      };

      const noShowRisk = { riskLevel: 'medium' } as any;

      const optimalTime = await (system as any).calculateOptimalTiming(
        appointmentTime,
        template,
        noShowRisk,
        customerPreferences
      );

      const reminderTime = new Date(optimalTime);
      const hour = reminderTime.getHours();

      // Should not be in quiet hours
      expect(hour).toBeGreaterThanOrEqual(8);
      expect(hour).toBeLessThan(22);
    });
  });

  describe('selectOptimalChannels', () => {
    it('should select channels based on risk level', async () => {
      const availableChannels = ['email', 'sms', 'whatsapp'];
      const noShowRisk = {
        riskLevel: 'critical',
        factors: [],
      } as any;

      const channels = await (system as any).selectOptimalChannels(
        availableChannels,
        noShowRisk
      );

      // Critical risk should include all available channels
      expect(channels).toContain('email');
      expect(channels).toContain('sms');
      expect(channels).toContain('whatsapp');
    });

    it('should respect customer preferences', async () => {
      const availableChannels = ['email', 'sms', 'whatsapp'];
      const customerPreferences = {
        preferredChannels: ['email', 'sms'],
      };
      const noShowRisk = { riskLevel: 'medium' } as any;

      const channels = await (system as any).selectOptimalChannels(
        availableChannels,
        noShowRisk,
        customerPreferences
      );

      // Should only include preferred channels
      expect(channels).toEqual(['email', 'sms']);
    });
  });

  describe('personalizeContent', () => {
    it('should personalize reminder content', async () => {
      const template = {
        templates: {
          email: {
            subject: 'Your appointment is confirmed!',
            body: 'Hi {{firstName}},\n\nYour appointment for {{serviceName}} is confirmed for {{appointmentTime}}.',
          },
        },
        personalization: {
          firstName: true,
          serviceName: true,
          appointmentTime: true,
          location: true,
          preparationNotes: false,
        },
      } as any;

      const booking = {
        client_id: 'customer-1',
        start_time: '2024-01-20T10:00:00Z',
        services: {
          name: 'Facial Treatment',
          category: 'beauty',
        },
      };

      const noShowRisk = {
        riskLevel: 'low',
      } as any;

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: {
                first_name: 'John',
                last_name: 'Doe',
                email: 'john@example.com',
                phone: '+1234567890',
              },
              error: null,
            }),
          })),
        })),
      } as any);

      const content = await (system as any).personalizeContent(
        template,
        'email',
        booking,
        noShowRisk
      );

      expect(content.body).toContain('Hi John');
      expect(content.body).toContain('Facial Treatment');
      expect(content.body).toContain('10:00');
    });
  });
});

describe('Integration Tests', () => {
  it('should work together: prediction -> reminders -> execution', async () => {
    // Setup
    const bookingId = 'booking-1';
    const customerId = 'customer-1';
    const serviceId = 'service-1';

    // Mock data
    const mockBooking = {
      id: bookingId,
      client_id: customerId,
      service_id: serviceId,
      start_time: '2024-01-20T10:00:00Z',
      services: {
        name: 'Facial Treatment',
        duration_minutes: 60,
      },
    };

    const mockCustomer = {
      first_name: 'John',
      last_name: 'Doe',
    };

    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === 'bookings') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({
                data: mockBooking,
                error: null,
              }),
            })),
          })),
        } as any;
      } else if (table === 'profiles') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({
                data: mockCustomer,
                error: null,
              }),
            })),
          })),
        } as any;
      }
      return {} as any;
    });

    // Step 1: Predict no-show risk
    const noShowRisk = await noShowModel.generateDetailedPrediction(bookingId);
    expect(noShowRisk.riskLevel).toBeDefined();

    // Step 2: Generate smart reminders
    const reminderSchedule = await smartReminderSystem.generateReminderSchedule(
      bookingId,
      noShowRisk
    );
    expect(reminderSchedule.reminders.length).toBeGreaterThan(0);

    // Step 3: Execute reminders
    vi.mocked(supabase.from).mockReturnValueOnce({
      insert: vi.fn().mockResolvedValue({}),
    } as any);

    await smartReminderSystem.executeReminderSchedule(reminderSchedule);

    // Verify all steps completed successfully
    expect(noShowRisk.bookingId).toBe(bookingId);
    expect(reminderSchedule.bookingId).toBe(bookingId);
  });
});