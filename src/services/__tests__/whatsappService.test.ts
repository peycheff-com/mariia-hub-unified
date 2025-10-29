import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

import { getWhatsAppService, WhatsAppService } from '../whatsappService'

// Create mocks with vi.hoisted to properly handle variable hoisting
const { mockWhatsAppAPI, mockSupabase } = vi.hoisted(() => {
  const mockWhatsAppAPI = {
    sendTemplateMessage: vi.fn(),
    sendTextMessage: vi.fn()
  }

  const mockSupabase = {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: null, error: null }))
        })),
        gte: vi.fn(() => ({
          lte: vi.fn(() => ({
            order: vi.fn(() => Promise.resolve({ data: [], error: null }))
          }))
        }))
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: null, error: null }))
        })),
        then: vi.fn((resolve) => resolve(Promise.resolve({ data: null, error: null })))
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ data: null, error: null })),
        then: vi.fn((resolve) => resolve(Promise.resolve({ data: null, error: null })))
      })),
      then: vi.fn((resolve) => resolve(Promise.resolve({ data: null, error: null })))
    }))
  }

  return { mockWhatsAppAPI, mockSupabase }
})

// Mock WhatsApp Business API using hoisted variables
vi.mock('@/lib/whatsapp-business', () => ({
  getWhatsAppBusinessAPI: vi.fn(() => mockWhatsAppAPI),
  WhatsAppBusinessAPI: vi.fn()
}))

// Mock Supabase client using hoisted variables
vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabase
}))


describe('WhatsAppService', () => {
  let service: ReturnType<typeof getWhatsAppService>

  beforeEach(() => {
    vi.clearAllMocks()

    // Create a fresh service instance for each test to avoid rate limit issues
    service = new WhatsAppService({
      rateLimitPerHour: 1000, // Very high limit for tests
      enableAutoReply: true,
      businessHours: {
        start: '09:00',
        end: '21:00',
        timezone: 'Europe/Warsaw'
      }
    })

    // Mock rate limit check to always return true for tests
    vi.spyOn(service as any, 'checkRateLimit').mockResolvedValue(true)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('sendTemplateMessage', () => {
    it('should send a template message successfully', async () => {
      mockWhatsAppAPI.sendTemplateMessage.mockResolvedValue({
        messages: [{ id: 'test-message-id' }]
      })

      const result = await service.sendTemplateMessage(
        '+48500123456',
        'booking_confirmation',
        'en',
        [{
          type: 'body',
          parameters: [{ type: 'text', text: 'Test Customer' }]
        }]
      )

      expect(result.success).toBe(true)
      expect(result.messageId).toBe('test-message-id')
      expect(mockWhatsAppAPI.sendTemplateMessage).toHaveBeenCalledWith(
        '+48500123456',
        'booking_confirmation',
        'en',
        [{
          type: 'body',
          parameters: [{ type: 'text', text: 'Test Customer' }]
        }]
      )
    })

    it('should handle rate limiting by queueing message', async () => {
      // Simulate rate limit exceeded
      mockWhatsAppAPI.sendTemplateMessage.mockRejectedValue(new Error('Rate limit exceeded'))

      const result = await service.sendTemplateMessage(
        '+48500123456',
        'booking_confirmation',
        'en'
      )

      expect(result.success).toBe(true) // Should be queued
      expect(result.messageId).toBeDefined()
      expect(result.messageId?.startsWith('msg_')).toBe(true)
    })

    it('should schedule message outside business hours', async () => {
      // Mock current time as 22:00 (after business hours)
      vi.spyOn(Date, 'now').mockImplementation(() => {
        const date = new Date('2024-01-01T22:00:00')
        return date.getTime()
      })

      const result = await service.sendTemplateMessage(
        '+48500123456',
        'booking_confirmation',
        'en',
        undefined,
        'normal' // Not urgent
      )

      expect(result.success).toBe(true)
      // Message should be queued for next business day
    })
  })

  describe('sendTextMessage', () => {
    it('should send a text message successfully', async () => {
      mockWhatsAppAPI.sendTextMessage.mockResolvedValue({
        messages: [{ id: 'test-text-id' }]
      })

      const result = await service.sendTextMessage(
        '+48500123456',
        'Hello, this is a test message'
      )

      expect(result.success).toBe(true)
      expect(result.messageId).toBe('test-text-id')
      expect(mockWhatsAppAPI.sendTextMessage).toHaveBeenCalledWith(
        '+48500123456',
        'Hello, this is a test message',
        undefined
      )
    })
  })

  describe('sendBookingConfirmation', () => {
    it('should send booking confirmation with correct parameters', async () => {
      mockWhatsAppAPI.sendTemplateMessage.mockResolvedValue({
        messages: [{ id: 'booking-confirm-id' }]
      })

      const result = await service.sendBookingConfirmation(
        '+48500123456',
        {
          customerName: 'Anna Kowalska',
          serviceName: 'Rzęsy + Brwi',
          date: '2024-02-15',
          time: '14:30',
          location: 'Salon Główny'
        }
      )

      expect(result.success).toBe(true)
      expect(mockWhatsAppAPI.sendTemplateMessage).toHaveBeenCalledWith(
        '+48500123456',
        'booking_confirmation',
        'en',
        [
          {
            type: 'body',
            parameters: [
              { type: 'text', text: 'Anna Kowalska' },
              { type: 'text', text: 'Rzęsy + Brwi' },
              { type: 'text', text: '2024-02-15' },
              { type: 'text', text: '14:30' },
              { type: 'text', text: 'Salon Główny' }
            ]
          }
        ],
        'high'
      )
    })
  })

  describe('sendAppointmentReminder', () => {
    it('should send appointment reminder', async () => {
      mockWhatsAppAPI.sendTemplateMessage.mockResolvedValue({
        messages: [{ id: 'reminder-id' }]
      })

      const result = await service.sendAppointmentReminder(
        '+48500123456',
        {
          customerName: 'Anna Kowalska',
          serviceName: 'Rzęsy',
          time: '14:30',
          date: '2024-02-15'
        }
      )

      expect(result.success).toBe(true)
      expect(mockWhatsAppAPI.sendTemplateMessage).toHaveBeenCalledWith(
        '+48500123456',
        'appointment_reminder',
        'en',
        [
          {
            type: 'body',
            parameters: [
              { type: 'text', text: 'Anna Kowalska' },
              { type: 'text', text: 'Rzęsy' },
              { type: 'text', text: '14:30' },
              { type: 'text', text: '2024-02-15' }
            ]
          }
        ],
        'high'
      )
    })
  })

  describe('sendPaymentConfirmation', () => {
    it('should send payment confirmation', async () => {
      mockWhatsAppAPI.sendTemplateMessage.mockResolvedValue({
        messages: [{ id: 'payment-id' }]
      })

      const result = await service.sendPaymentConfirmation(
        '+48500123456',
        {
          customerName: 'Anna Kowalska',
          amount: '300 PLN',
          serviceName: 'Rzęsy + Brwi',
          paymentId: 'PAY-123456'
        }
      )

      expect(result.success).toBe(true)
      expect(mockWhatsAppAPI.sendTemplateMessage).toHaveBeenCalledWith(
        '+48500123456',
        'payment_confirmation',
        'en',
        [
          {
            type: 'body',
            parameters: [
              { type: 'text', text: 'Anna Kowalska' },
              { type: 'text', text: '300 PLN' },
              { type: 'text', text: 'Rzęsy + Brwi' },
              { type: 'text', text: 'PAY-123456' }
            ]
          }
        ],
        'normal'
      )
    })
  })

  describe('sendPromotionalMessage', () => {
    it('should send promotional message with button', async () => {
      mockWhatsAppAPI.sendTemplateMessage.mockResolvedValue({
        messages: [{ id: 'promo-id' }]
      })

      const result = await service.sendPromotionalMessage(
        '+48500123456',
        {
          title: 'Special Offer!',
          description: 'Get 20% off on your next treatment',
          discount: '20%',
          validUntil: '2024-03-01',
          bookingUrl: 'https://mariia.studio/book'
        }
      )

      expect(result.success).toBe(true)
      expect(mockWhatsAppAPI.sendTemplateMessage).toHaveBeenCalledWith(
        '+48500123456',
        'promotional_message',
        'en',
        [
          {
            type: 'header',
            parameters: [{ type: 'text', text: 'Special Offer!' }]
          },
          {
            type: 'body',
            parameters: [
              { type: 'text', text: 'Get 20% off on your next treatment' },
              { type: 'text', text: '20%' },
              { type: 'text', text: '2024-03-01' }
            ]
          },
          {
            type: 'buttons',
            parameters: [
              {
                type: 'text',
                text: 'Book Now',
                url: 'https://mariia.studio/book'
              }
            ]
          }
        ],
        'low'
      )
    })
  })

  describe('handleIncomingMessage', () => {
    it('should store incoming message and trigger auto-reply', async () => {
      const mockMessage = {
        from: '+48500123456',
        id: 'incoming-id',
        timestamp: '1705036200',
        text: { body: 'Cześć, ile kosztuje laminacja brwi?' },
        type: 'text'
      }

      const mockContact = {
        wa_id: '48500123456',
        profile: { name: 'Anna Kowalska' }
      }

      // Mock setTimeout for auto-reply
      vi.useFakeTimers()

      await service.handleIncomingMessage(
        mockMessage.from,
        mockMessage,
        mockContact
      )

      // Fast-forward time to trigger auto-reply
      vi.advanceTimersByTime(2000)

      vi.useRealTimers()
    })
  })

  describe('handleOptOut', () => {
    it('should update opt-out status and send confirmation', async () => {
      mockWhatsAppAPI.sendTextMessage.mockResolvedValue({
        messages: [{ id: 'optout-id' }]
      })

      await service.handleOptOut('whatsapp:+48500123456')

      // Verify confirmation message was sent
      expect(mockWhatsAppAPI.sendTextMessage).toHaveBeenCalledWith(
        'whatsapp:+48500123456',
        'You have been opted out from WhatsApp messages. Reply START to opt back in.',
        { priority: 'normal' }
      )
    })
  })

  describe('handleOptIn', () => {
    it('should update opt-in status and send welcome message', async () => {
      mockWhatsAppAPI.sendTextMessage.mockResolvedValue({
        messages: [{ id: 'optin-id' }]
      })

      await service.handleOptIn('whatsapp:+48500123456')

      expect(mockWhatsAppAPI.sendTextMessage).toHaveBeenCalledWith(
        'whatsapp:+48500123456',
        'Welcome back! You will now receive WhatsApp messages for your appointments and updates.',
        { priority: 'normal' }
      )
    })
  })

  describe('createQuickReply', () => {
    it('should create a new quick reply', async () => {
      // Mock supabase insert
      const mockInsert = vi.fn().mockResolvedValue({ error: null })
      const mockFrom = vi.fn().mockReturnValue({ insert: mockInsert })
      mockSupabase.from = mockFrom

      const result = await service.createQuickReply({
        keywords: ['cena', 'cennik', 'price'],
        response: 'Nasze ceny zaczynają się od 150 zł. Szczegółowy cennik na stronie.',
        category: 'pricing'
      })

      expect(result.success).toBe(true)
      expect(mockFrom).toHaveBeenCalledWith('whatsapp_quick_replies')
      expect(mockInsert).toHaveBeenCalledWith({
        keywords: ['cena', 'cennik', 'price'],
        response: 'Nasze ceny zaczynają się od 150 zł. Szczegółowy cennik na stronie.',
        category: 'pricing',
        is_active: true
      })
    })
  })

  describe('getAnalytics', () => {
    it('should return analytics data', async () => {
      const mockLogs = [
        { type: 'template', status: 'sent', template_name: 'booking_confirmation', created_at: '2024-01-15T10:00:00Z' },
        { type: 'text', status: 'sent', created_at: '2024-01-15T11:00:00Z' },
        { type: 'template', status: 'failed', template_name: 'booking_confirmation', created_at: '2024-01-15T12:00:00Z' }
      ]

      const mockSelect = vi.fn().mockReturnValue({
        gte: vi.fn().mockReturnValue({
          lte: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: mockLogs, error: null })
          })
        })
      })

      mockSupabase.from = vi.fn().mockReturnValue({ select: mockSelect })

      const analytics = await service.getAnalytics()

      expect(analytics.totalSent).toBe(2)
      expect(analytics.totalFailed).toBe(1)
      expect(analytics.byType.template).toBe(2)
      expect(analytics.byType.text).toBe(1)
    })
  })

  describe('Business Hours', () => {
    it('should send messages immediately during business hours', async () => {
      // Mock time as 14:00 on a weekday (business hours)
      vi.spyOn(Date, 'now').mockImplementation(() => {
        const date = new Date('2024-01-15T14:00:00')
        return date.getTime()
      })

      mockWhatsAppAPI.sendTextMessage.mockResolvedValue({
        messages: [{ id: 'business-hours-test' }]
      })

      const result = await service.sendTextMessage('+48500123456', 'Test message')

      expect(result.success).toBe(true)
      expect(mockWhatsAppAPI.sendTextMessage).toHaveBeenCalled()
    })

    it('should queue non-urgent messages outside business hours', async () => {
      // Mock time as 22:00 (after business hours)
      vi.spyOn(Date, 'now').mockImplementation(() => {
        const date = new Date('2024-01-15T22:00:00')
        return date.getTime()
      })

      const result = await service.sendTextMessage('+48500123456', 'Test message', {
        priority: 'normal'
      })

      expect(result.success).toBe(true)
      expect(result.messageId).toBeDefined()
      expect(result.messageId?.startsWith('msg_')).toBe(true)
    })
  })
})

// Test integration functions
describe('WhatsApp Integration Functions', () => {
  let integrationService: WhatsAppService

  beforeEach(() => {
    vi.clearAllMocks()
    integrationService = new WhatsAppService({
      rateLimitPerHour: 1000,
      enableAutoReply: true,
      businessHours: {
        start: '09:00',
        end: '21:00',
        timezone: 'Europe/Warsaw'
      }
    })

    // Mock rate limit check to always return true for tests
    vi.spyOn(integrationService as any, 'checkRateLimit').mockResolvedValue(true)
  })

  it('sendWhatsAppBookingConfirmation should call service correctly', async () => {
    // Import the actual functions
    const { sendWhatsAppBookingConfirmation, getWhatsAppService } = await import('../whatsappService')

    // Mock getWhatsAppService to return our test service
    vi.mocked(getWhatsAppService).mockReturnValue(integrationService)

    // Mock the service method
    const mockSendBookingConfirmation = vi.fn().mockResolvedValue({
      success: true,
      messageId: 'test-confirmation-id'
    })
    integrationService.sendBookingConfirmation = mockSendBookingConfirmation

    const result = await sendWhatsAppBookingConfirmation('+48500123456', {
      customerName: 'Test',
      serviceName: 'Service',
      date: '2024-02-15',
      time: '14:30'
    })

    expect(result.success).toBe(true)
    expect(mockSendBookingConfirmation).toHaveBeenCalledWith('+48500123456', {
      customerName: 'Test',
      serviceName: 'Service',
      date: '2024-02-15',
      time: '14:30'
    })
  })
})