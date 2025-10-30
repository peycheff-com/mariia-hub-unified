import { vi } from 'vitest'
import type { Database } from '@/integrations/supabase/types'

// Enhanced Supabase mock for comprehensive testing
export const createMockSupabaseClient = () => {
  const mockData = {
    kb_articles: [
      {
        id: '1',
        title: 'Test Article',
        content: 'Test content',
        category: 'test',
        tags: ['test'],
        is_published: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    ],
    faq_items: [
      {
        id: '1',
        question: 'Test Question',
        answer: 'Test Answer',
        category_id: '1',
        is_published: true,
        order_index: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    ],
    faq_categories: [
      {
        id: '1',
        name: 'Test Category',
        description: 'Test description',
        is_active: true,
        order_index: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    ],
    services: [
      {
        id: '1',
        title: 'Test Service',
        description: 'Test description',
        service_type: 'beauty',
        duration_minutes: 60,
        price_from: 100,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    ],
    availability_slots: [
      {
        id: '1',
        start_time: new Date().toISOString(),
        end_time: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        is_available: true,
        service_id: '1',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    ],
    bookings: [
      {
        id: '1',
        service_id: '1',
        client_email: 'test@example.com',
        start_time: new Date().toISOString(),
        end_time: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        status: 'confirmed',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    ],
    profiles: [
      {
        id: '1',
        email: 'test@example.com',
        full_name: 'Test User',
        role: 'client',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    ],
    booking_drafts: [
      {
        id: '1',
        service_id: '1',
        client_email: 'test@example.com',
        draft_data: {},
        session_id: 'test-session',
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    ],
    holds: [
      {
        id: '1',
        availability_slot_id: '1',
        session_id: 'test-session',
        expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
        created_at: new Date().toISOString(),
      }
    ]
  }

  // Mock query builder with chainable methods
  const createQueryBuilder = (tableName: keyof Database['public']['Tables'], data: any[] = []) => {
    let queryData = [...data]
    let selectQuery = '*'
    let shouldSingle = false
    let shouldMaybeSingle = false

    const queryBuilder = {
      select: vi.fn((query: string = '*') => {
        selectQuery = query
        return queryBuilder
      }),

      eq: vi.fn((column: string, value: any) => {
        queryData = queryData.filter(item => item[column] === value)
        return queryBuilder
      }),

      neq: vi.fn((column: string, value: any) => {
        queryData = queryData.filter(item => item[column] !== value)
        return queryBuilder
      }),

      gt: vi.fn((column: string, value: any) => {
        queryData = queryData.filter(item => item[column] > value)
        return queryBuilder
      }),

      gte: vi.fn((column: string, value: any) => {
        queryData = queryData.filter(item => item[column] >= value)
        return queryBuilder
      }),

      lt: vi.fn((column: string, value: any) => {
        queryData = queryData.filter(item => item[column] < value)
        return queryBuilder
      }),

      lte: vi.fn((column: string, value: any) => {
        queryData = queryData.filter(item => item[column] <= value)
        return queryBuilder
      }),

      like: vi.fn((column: string, pattern: string) => {
        const regex = new RegExp(pattern.replace(/%/g, '.*'), 'i')
        queryData = queryData.filter(item => regex.test(item[column]))
        return queryBuilder
      }),

      ilike: vi.fn((column: string, pattern: string) => {
        const regex = new RegExp(pattern.replace(/%/g, '.*'), 'i')
        queryData = queryData.filter(item => regex.test(item[column]))
        return queryBuilder
      }),

      in: vi.fn((column: string, values: any[]) => {
        queryData = queryData.filter(item => values.includes(item[column]))
        return queryBuilder
      }),

      contains: vi.fn((column: string, value: any) => {
        queryData = queryData.filter(item => {
          if (Array.isArray(item[column])) {
            return item[column].includes(value)
          }
          if (typeof item[column] === 'object') {
            return JSON.stringify(item[column]).includes(JSON.stringify(value))
          }
          return item[column] === value
        })
        return queryBuilder
      }),

      textSearch: vi.fn((column: string, query: string) => {
        queryData = queryData.filter(item => {
          const searchText = `${item[column]} ${item.title || ''} ${item.content || ''}`.toLowerCase()
          return searchText.includes(query.toLowerCase())
        })
        return queryBuilder
      }),

      or: vi.fn((filters: string) => {
        // Simple OR implementation for common patterns
        const orConditions = filters.split(',')
        queryData = queryData.filter(item => {
          return orConditions.some(condition => {
            // Parse simple conditions like "column.eq.value"
            const match = condition.match(/(\w+)\.eq\.([^)]+)/)
            if (match) {
              const [, column, value] = match
              return item[column] === value.replace(/['"]/g, '')
            }
            return true
          })
        })
        return queryBuilder
      }),

      order: vi.fn((column: string, options?: { ascending?: boolean }) => {
        queryData.sort((a, b) => {
          const aVal = a[column]
          const bVal = b[column]
          if (options?.ascending) {
            return aVal > bVal ? 1 : -1
          } else {
            return aVal < bVal ? 1 : -1
          }
        })
        return queryBuilder
      }),

      limit: vi.fn((limit: number) => {
        queryData = queryData.slice(0, limit)
        return queryBuilder
      }),

      range: vi.fn((from: number, to: number) => {
        queryData = queryData.slice(from, to + 1)
        return queryBuilder
      }),

      single: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockReturnThis(),

      then: vi.fn((resolve) => {
        if (shouldSingle && queryData.length === 0) {
          return resolve({ data: null, error: new Error('No rows found') })
        }
        if (shouldMaybeSingle && queryData.length === 0) {
          return resolve({ data: null, error: null })
        }
        if (shouldSingle && queryData.length > 1) {
          return resolve({ data: null, error: new Error('Multiple rows found') })
        }
        return resolve({
          data: shouldSingle || shouldMaybeSingle ? queryData[0] : queryData,
          error: null
        })
      })
    }

    // Add chainable properties
    Object.defineProperty(queryBuilder, 'data', {
      get: () => shouldSingle || shouldMaybeSingle ? queryData[0] : queryData
    })

    Object.defineProperty(queryBuilder, 'error', {
      get: () => null
    })

    return queryBuilder
  }

  const mockSupabase = {
    from: vi.fn((tableName: keyof Database['public']['Tables']) => {
      return createQueryBuilder(tableName, mockData[tableName] || [])
    }),

    rpc: vi.fn((functionName: string, params?: any) => {
      return Promise.resolve({
        data: [],
        error: null
      })
    }),

    storage: {
      from: vi.fn(() => ({
        upload: vi.fn(),
        update: vi.fn(),
        remove: vi.fn(),
        getPublicUrl: vi.fn(() => ({
          data: { publicUrl: 'https://example.com/file.jpg' },
          error: null
        }))
      }))
    },

    auth: {
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } }
      }))
    },

    functions: {
      invoke: vi.fn()
    }
  }

  return mockSupabase
}

// Mock Stripe
export const createMockStripe = () => ({
  paymentIntents: {
    create: vi.fn(() => Promise.resolve({
      id: 'pi_test_123',
      client_secret: 'pi_test_123_secret_test',
      status: 'requires_payment_method'
    })),
    confirm: vi.fn(() => Promise.resolve({
      id: 'pi_test_123',
      status: 'succeeded'
    })),
    retrieve: vi.fn(() => Promise.resolve({
      id: 'pi_test_123',
      status: 'succeeded',
      amount: 10000
    }))
  },
  webhooks: {
    constructEvent: vi.fn()
  },
  accounts: {
    create: vi.fn(),
    retrieve: vi.fn()
  }
})

// Mock Booksy API
export const createMockBooksyAPI = () => ({
  getAvailability: vi.fn(() => Promise.resolve({
    slots: [
      {
        id: 'slot1',
        start: '2024-01-01T10:00:00Z',
        end: '2024-01-01T11:00:00Z',
        available: true
      }
    ]
  })),
  createBooking: vi.fn(() => Promise.resolve({
    id: 'booking1',
    status: 'confirmed'
  })),
  cancelBooking: vi.fn(() => Promise.resolve({
    id: 'booking1',
    status: 'cancelled'
  }))
})

// Mock Email Service
export const createMockEmailService = () => ({
  sendBookingConfirmation: vi.fn(() => Promise.resolve({ success: true })),
  sendPasswordReset: vi.fn(() => Promise.resolve({ success: true })),
  sendMarketingEmail: vi.fn(() => Promise.resolve({ success: true }))
})

// Mock Meta API
export const createMockMetaAPI = () => ({
  trackCustomEvent: vi.fn(),
  trackConversion: vi.fn(),
  getPageView: vi.fn(),
  track: vi.fn()
})

// Mock Google Analytics
export const createMockGA = () => ({
  gtag: vi.fn(),
  event: vi.fn(),
  pageview: vi.fn(),
  config: vi.fn()
})

// Global mock setup function
export const setupGlobalMocks = () => {
  const mockSupabase = createMockSupabaseClient()
  const mockStripe = createMockStripe()
  const mockBooksy = createMockBooksyAPI()
  const mockEmail = createMockEmailService()
  const mockMeta = createMockMetaAPI()
  const mockGA = createMockGA()

  // Reset all mocks before each test
  beforeEach(() => {
    vi.clearAllMocks()
  })

  return {
    supabase: mockSupabase,
    stripe: mockStripe,
    booksy: mockBooksy,
    email: mockEmail,
    meta: mockMeta,
    ga: mockGA
  }
}