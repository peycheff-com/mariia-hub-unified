import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { enhancedEmailService, sendEmail, sendTemplateEmail } from '../enhanced-email-service'

// Create mocks with vi.hoisted to properly handle variable hoisting
const { mockSupabase, mockApiGateway, mockCredentialManager } = vi.hoisted(() => {
  const mockSupabase = {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        gte: vi.fn(() => ({
          lte: vi.fn(() => ({
            order: vi.fn(() => Promise.resolve({ data: [], error: null }))
          }))
        }))
      })),
      insert: vi.fn(() => Promise.resolve({ data: null, error: null })),
      upsert: vi.fn(() => Promise.resolve({ data: null, error: null }))
    }))
  }

  const mockApiGateway = {
    request: vi.fn()
  }

  const mockCredentialManager = {
    getCredentials: vi.fn()
  }

  return { mockSupabase, mockApiGateway, mockCredentialManager }
})

// Mock external dependencies
vi.mock('./secure-api-gateway', () => ({
  apiGateway: mockApiGateway
}))

vi.mock('@/lib/secure-credentials', () => ({
  credentialManager: mockCredentialManager
}))

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => mockSupabase)
}))

describe('EnhancedEmailService', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Mock successful API gateway responses
    mockApiGateway.request.mockResolvedValue({
      success: true,
      data: { id: 'test-email-id' }
    })

    // Mock credential manager to return no SendGrid credentials
    mockCredentialManager.getCredentials.mockResolvedValue(null)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('sendEmail', () => {
    it('should send email successfully via Resend', async () => {
      const emailData = {
        to: 'test@example.com',
        subject: 'Test Subject',
        html: '<p>Test HTML content</p>',
        text: 'Test text content'
      }

      const result = await sendEmail(emailData)

      expect(result.status).toBe('sent')
      expect(result.messageId).toBe('test-email-id')
      expect(result.provider).toBe('resend')
      expect(mockApiGateway.request).toHaveBeenCalledWith('resend', '/emails', {
        method: 'POST',
        body: expect.objectContaining({
          to: ['test@example.com'],
          subject: 'Test Subject',
          html: '<p>Test HTML content</p>',
          text: 'Test text content'
        })
      })
    })

    it('should handle multiple recipients', async () => {
      const emailData = {
        to: ['test1@example.com', 'test2@example.com'],
        subject: 'Test Subject',
        html: '<p>Test content</p>'
      }

      const result = await sendEmail(emailData)

      expect(result.status).toBe('sent')
      expect(mockApiGateway.request).toHaveBeenCalledWith('resend', '/emails', {
        method: 'POST',
        body: expect.objectContaining({
          to: ['test1@example.com', 'test2@example.com']
        })
      })
    })

    it('should handle CC and BCC recipients', async () => {
      const emailData = {
        to: 'test@example.com',
        cc: 'cc@example.com',
        bcc: ['bcc1@example.com', 'bcc2@example.com'],
        subject: 'Test Subject',
        html: '<p>Test content</p>'
      }

      const result = await sendEmail(emailData)

      expect(result.status).toBe('sent')
      expect(mockApiGateway.request).toHaveBeenCalledWith('resend', '/emails', {
        method: 'POST',
        body: expect.objectContaining({
          to: ['test@example.com'],
          cc: ['cc@example.com'],
          bcc: ['bcc1@example.com', 'bcc2@example.com']
        })
      })
    })

    it('should queue email when rate limited', async () => {
      // Mock rate limit exceeded
      mockApiGateway.request.mockRejectedValueOnce(new Error('Rate limit exceeded'))

      const emailData = {
        to: 'test@example.com',
        subject: 'Test Subject',
        html: '<p>Test content</p>'
      }

      const result = await sendEmail(emailData)

      expect(result.status).toBe('queued')
      expect(result.messageId).toBeDefined()
      expect(result.provider).toBe('queue')
    })

    it('should handle API failure gracefully', async () => {
      mockApiGateway.request.mockResolvedValue({
        success: false,
        error: 'API Error'
      })

      const emailData = {
        to: 'test@example.com',
        subject: 'Test Subject',
        html: '<p>Test content</p>'
      }

      await expect(sendEmail(emailData)).rejects.toThrow('API Error')
    })
  })

  describe('sendTemplateEmail', () => {
    it('should send template email successfully', async () => {
      // Mock template in database
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                id: 'welcome-template',
                name: 'Welcome Email',
                subject: 'Welcome {{name}}!',
                html: '<h1>Welcome {{name}}!</h1><p>Thank you for joining.</p>',
                text: 'Welcome {{name}}! Thank you for joining.',
                variables: ['name']
              },
              error: null
            })
          })
        })
      })

      const result = await sendTemplateEmail(
        'welcome-template',
        'test@example.com',
        { name: 'John Doe' }
      )

      expect(result.status).toBe('sent')
      expect(mockApiGateway.request).toHaveBeenCalledWith('resend', '/emails', {
        method: 'POST',
        body: expect.objectContaining({
          subject: 'Welcome John Doe!',
          html: '<h1>Welcome John Doe!</h1><p>Thank you for joining.</p>',
          text: 'Welcome John Doe! Thank you for joining.'
        })
      })
    })

    it('should throw error when template not found', async () => {
      // Mock template not found
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Template not found' }
            })
          })
        })
      })

      await expect(
        sendTemplateEmail('non-existent-template', 'test@example.com', {})
      ).rejects.toThrow('Template not found: non-existent-template')
    })

    it('should handle template rendering with missing variables', async () => {
      // Mock template in database
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                id: 'test-template',
                name: 'Test Template',
                subject: 'Hello {{name}}!',
                html: '<p>Hello {{name}}, your order {{orderId}} is ready.</p>',
                variables: ['name', 'orderId']
              },
              error: null
            })
          })
        })
      })

      const result = await sendTemplateEmail(
        'test-template',
        'test@example.com',
        { name: 'John' } // Missing orderId
      )

      expect(result.status).toBe('sent')
      expect(mockApiGateway.request).toHaveBeenCalledWith('resend', '/emails', {
        method: 'POST',
        body: expect.objectContaining({
          subject: 'Hello John!',
          html: '<p>Hello John, your order {{orderId}} is ready.</p>'
        })
      })
    })
  })

  describe('delivery status', () => {
    it('should get delivery status', async () => {
      // Mock delivery data in database
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                id: 'test-email-id',
                message_id: 'test-email-id',
                status: 'delivered',
                provider: 'resend',
                provider_message_id: 'resend-id-123',
                last_update: new Date().toISOString(),
                error_message: null
              },
              error: null
            })
          })
        })
      })

      // Mock events
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: [
                {
                  timestamp: new Date().toISOString(),
                  event: 'delivered',
                  provider: 'resend',
                  data: { reason: 'delivered' }
                }
              ],
              error: null
            })
          })
        })
      })

      const status = await enhancedEmailService.getDeliveryStatus('test-email-id')

      expect(status).toEqual({
        id: 'test-email-id',
        messageId: 'test-email-id',
        status: 'delivered',
        provider: 'resend',
        providerMessageId: 'resend-id-123',
        lastUpdate: expect.any(Date),
        errorMessage: null,
        events: [
          {
            timestamp: expect.any(Date),
            event: 'delivered',
            provider: 'resend',
            data: { reason: 'delivered' }
          }
        ]
      })
    })

    it('should return null for non-existent email', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'No rows found' }
            })
          })
        })
      })

      const status = await enhancedEmailService.getDeliveryStatus('non-existent-id')

      expect(status).toBeNull()
    })
  })

  describe('analytics', () => {
    it('should get email analytics', async () => {
      const mockDeliveryData = [
        {
          status: 'delivered',
          provider: 'resend',
          created_at: new Date().toISOString()
        },
        {
          status: 'bounced',
          provider: 'resend',
          created_at: new Date().toISOString()
        },
        {
          status: 'delivered',
          provider: 'sendgrid',
          created_at: new Date().toISOString()
        }
      ]

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          gte: vi.fn().mockReturnValue({
            lte: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({
                data: mockDeliveryData,
                error: null
              })
            })
          })
        })
      })

      const analytics = await enhancedEmailService.getAnalytics()

      expect(analytics).toEqual({
        totalSent: 3,
        totalDelivered: 2,
        totalBounced: 1,
        totalComplained: 0,
        deliveryRate: 66.66666666666666,
        bounceRate: 33.33333333333333,
        complaintRate: 0,
        providerBreakdown: {
          resend: { sent: 2, delivered: 1, bounced: 1 },
          sendgrid: { sent: 1, delivered: 1, bounced: 0 }
        }
      })
    })

    it('should handle analytics with no data', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          gte: vi.fn().mockReturnValue({
            lte: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({
                data: [],
                error: null
              })
            })
          })
        })
      })

      const analytics = await enhancedEmailService.getAnalytics()

      expect(analytics).toEqual({
        totalSent: 0,
        totalDelivered: 0,
        totalBounced: 0,
        totalComplained: 0,
        deliveryRate: 0,
        bounceRate: 0,
        complaintRate: 0,
        providerBreakdown: {}
      })
    })
  })

  describe('webhook handling', () => {
    it('should handle Resend webhook', async () => {
      const webhookEvent = {
        type: 'delivered',
        data: {
          id: 'resend-id-123',
          created_at: new Date().toISOString()
        }
      }

      // Should not throw error
      await expect(
        enhancedEmailService.handleWebhook('resend', webhookEvent)
      ).resolves.not.toThrow()
    })

    it('should handle unknown provider gracefully', async () => {
      const webhookEvent = {
        type: 'delivered',
        data: { id: 'test-id' }
      }

      // Should not throw error, just log
      await expect(
        enhancedEmailService.handleWebhook('unknown-provider', webhookEvent)
      ).resolves.not.toThrow()
    })
  })
})