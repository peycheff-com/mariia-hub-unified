import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { bookingService } from '@/services/booking.service'

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
    rpc: vi.fn(),
  }
}))

import { supabase } from '@/integrations/supabase/client'

// Mock data
const mockServices = [
  {
    id: 'service-1',
    title: 'Test Service',
    description: 'Test Description',
    service_type: 'beauty',
    duration_minutes: 60,
    price_from: 100,
    price_to: 200,
    is_active: true,
    category: 'test',
    tags: ['test'],
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  }
]

const mockTimeSlots = [
  {
    id: 'slot-1',
    start_time: '2024-01-15T10:00:00Z',
    end_time: '2024-01-15T11:00:00Z',
    is_available: true,
    service_id: 'service-1',
    price: 150,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  }
]

const mockBooking = {
  id: 'booking-1',
  service_id: 'service-1',
  client_email: 'test@example.com',
  start_time: '2024-01-15T10:00:00Z',
  end_time: '2024-01-15T11:00:00Z',
  status: 'confirmed',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z'
}

describe('BookingService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('getServices', () => {
    it('fetches services successfully', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({
          data: mockServices,
          error: null,
          count: 1
        })
      }
      ;(supabase.from as any).mockReturnValue(mockQuery)

      const result = await bookingService.getServices({
        service_type: 'beauty',
        limit: 10,
        offset: 0
      })

      expect(supabase.from).toHaveBeenCalledWith('services')
      expect(mockQuery.select).toHaveBeenCalledWith('*')
      expect(mockQuery.eq).toHaveBeenCalledWith('service_type', 'beauty')
      expect(mockQuery.order).toHaveBeenCalledWith('created_at', { ascending: false })
      expect(mockQuery.range).toHaveBeenCalledWith(0, 9)
      expect(result).toEqual({ services: mockServices, total: 1 })
    })

    it('handles search functionality', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({
          data: mockServices,
          error: null,
          count: 1
        })
      }
      ;(supabase.from as any).mockReturnValue(mockQuery)

      await bookingService.getServices({
        search: 'test',
        limit: 10,
        offset: 0
      })

      expect(mockQuery.or).toHaveBeenCalledWith(
        expect.stringContaining('title.ilike')
      )
    })

    it('handles errors gracefully', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({
          data: null,
          error: new Error('Database error'),
          count: null
        })
      }
      ;(supabase.from as any).mockReturnValue(mockQuery)

      await expect(bookingService.getServices()).rejects.toThrow('Database error')
    })
  })

  describe('getTimeSlots', () => {
    it('fetches available time slots for a service', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gt: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({
          data: mockTimeSlots,
          error: null,
          count: 1
        })
      }
      ;(supabase.from as any).mockReturnValue(mockQuery)

      const result = await bookingService.getTimeSlots('service-1', {
        limit: 10,
        offset: 0
      })

      expect(supabase.from).toHaveBeenCalledWith('availability_slots')
      expect(mockQuery.select).toHaveBeenCalledWith('*')
      expect(mockQuery.eq).toHaveBeenCalledWith('service_id', 'service-1')
      expect(mockQuery.eq).toHaveBeenCalledWith('is_available', true)
      expect(mockQuery.gt).toHaveBeenCalledWith('start_time', expect.any(String))
      expect(result).toEqual({ slots: mockTimeSlots, total: 1 })
    })

    it('fetches time slots for specific date range', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lt: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({
          data: mockTimeSlots,
          error: null,
          count: 1
        })
      }
      ;(supabase.from as any).mockReturnValue(mockQuery)

      const startDate = '2024-01-15T00:00:00Z'
      const endDate = '2024-01-15T23:59:59Z'

      await bookingService.getTimeSlots('service-1', {
        start_date: startDate,
        end_date: endDate,
        limit: 10,
        offset: 0
      })

      expect(mockQuery.gte).toHaveBeenCalledWith('start_time', startDate)
      expect(mockQuery.lt).toHaveBeenCalledWith('start_time', endDate)
    })

    it('handles unavailable time slots', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({
          data: [],
          error: null,
          count: 0
        })
      }
      ;(supabase.from as any).mockReturnValue(mockQuery)

      const result = await bookingService.getTimeSlots('service-1')

      expect(result).toEqual({ slots: [], total: 0 })
    })
  })

  describe('holdTimeSlot', () => {
    it('creates a hold for a time slot', async () => {
      const mockRpc = vi.fn().mockResolvedValue({
        data: { id: 'hold-1', expires_at: '2024-01-15T10:05:00Z' },
        error: null
      })
      supabase.rpc = mockRpc

      const result = await bookingService.holdTimeSlot('slot-1', 'session-123')

      expect(mockRpc).toHaveBeenCalledWith('hold_time_slot', {
        p_slot_id: 'slot-1',
        p_session_id: 'session-123'
      })
      expect(result).toEqual({ hold: { id: 'hold-1', expires_at: '2024-01-15T10:05:00Z' } })
    })

    it('handles hold creation failure', async () => {
      const mockRpc = vi.fn().mockResolvedValue({
        data: null,
        error: new Error('Slot already held')
      })
      supabase.rpc = mockRpc

      await expect(bookingService.holdTimeSlot('slot-1', 'session-123')).rejects.toThrow('Slot already held')
    })

    it('handles expired holds', async () => {
      const mockRpc = vi.fn().mockResolvedValue({
        data: null,
        error: { code: 'PGRST116', message: 'Hold expired' }
      })
      supabase.rpc = mockRpc

      await expect(bookingService.holdTimeSlot('slot-1', 'session-123')).rejects.toThrow()
    })
  })

  describe('releaseTimeSlot', () => {
    it('releases a hold for a time slot', async () => {
      const mockRpc = vi.fn().mockResolvedValue({
        data: { success: true },
        error: null
      })
      supabase.rpc = mockRpc

      await bookingService.releaseTimeSlot('slot-1', 'session-123')

      expect(mockRpc).toHaveBeenCalledWith('release_time_slot', {
        p_slot_id: 'slot-1',
        p_session_id: 'session-123'
      })
    })

    it('handles release failure gracefully', async () => {
      const mockRpc = vi.fn().mockResolvedValue({
        data: null,
        error: new Error('Hold not found')
      })
      supabase.rpc = mockRpc

      // Should not throw error for release failures
      await expect(bookingService.releaseTimeSlot('slot-1', 'session-123')).resolves.toBeUndefined()
    })
  })

  describe('createBooking', () => {
    it('creates a booking successfully', async () => {
      const mockQuery = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockBooking,
          error: null
        })
      }
      ;(supabase.from as any).mockReturnValue(mockQuery)

      const bookingData = {
        service_id: 'service-1',
        client_email: 'test@example.com',
        start_time: '2024-01-15T10:00:00Z',
        end_time: '2024-01-15T11:00:00Z',
        session_id: 'session-123'
      }

      const result = await bookingService.createBooking(bookingData, 'session-123')

      expect(supabase.from).toHaveBeenCalledWith('bookings')
      expect(mockQuery.insert).toHaveBeenCalledWith(bookingData)
      expect(mockQuery.select).toHaveBeenCalledWith('*')
      expect(mockQuery.single).toHaveBeenCalled()
      expect(result).toEqual({ booking: mockBooking })
    })

    it('handles booking creation failure', async () => {
      const mockQuery = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: new Error('Booking creation failed')
        })
      }
      ;(supabase.from as any).mockReturnValue(mockQuery)

      const bookingData = {
        service_id: 'service-1',
        client_email: 'test@example.com',
        start_time: '2024-01-15T10:00:00Z',
        end_time: '2024-01-15T11:00:00Z',
        session_id: 'session-123'
      }

      await expect(bookingService.createBooking(bookingData, 'session-123')).rejects.toThrow('Booking creation failed')
    })

    it('validates booking data before creation', async () => {
      const invalidBookingData = {
        service_id: '',
        client_email: 'invalid-email',
        start_time: 'invalid-date',
        end_time: 'invalid-date',
        session_id: ''
      }

      await expect(bookingService.createBooking(invalidBookingData, 'session-123')).rejects.toThrow()
    })
  })

  describe('getBooking', () => {
    it('fetches a booking by ID', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockBooking,
          error: null
        })
      }
      ;(supabase.from as any).mockReturnValue(mockQuery)

      const result = await bookingService.getBooking('booking-1')

      expect(supabase.from).toHaveBeenCalledWith('bookings')
      expect(mockQuery.select).toHaveBeenCalledWith('*')
      expect(mockQuery.eq).toHaveBeenCalledWith('id', 'booking-1')
      expect(mockQuery.single).toHaveBeenCalled()
      expect(result).toEqual(mockBooking)
    })

    it('handles booking not found', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: new Error('Booking not found')
        })
      }
      ;(supabase.from as any).mockReturnValue(mockQuery)

      await expect(bookingService.getBooking('booking-1')).rejects.toThrow('Booking not found')
    })
  })

  describe('updateBooking', () => {
    it('updates a booking successfully', async () => {
      const updatedBooking = { ...mockBooking, status: 'cancelled' }
      const mockQuery = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: updatedBooking,
          error: null
        })
      }
      ;(supabase.from as any).mockReturnValue(mockQuery)

      const updateData = { status: 'cancelled' }
      const result = await bookingService.updateBooking('booking-1', updateData)

      expect(supabase.from).toHaveBeenCalledWith('bookings')
      expect(mockQuery.update).toHaveBeenCalledWith({
        ...updateData,
        updated_at: expect.any(String)
      })
      expect(mockQuery.eq).toHaveBeenCalledWith('id', 'booking-1')
      expect(result).toEqual(updatedBooking)
    })

    it('handles update failure', async () => {
      const mockQuery = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: new Error('Update failed')
        })
      }
      ;(supabase.from as any).mockReturnValue(mockQuery)

      await expect(bookingService.updateBooking('booking-1', { status: 'cancelled' })).rejects.toThrow('Update failed')
    })
  })

  describe('cancelBooking', () => {
    it('cancels a booking successfully', async () => {
      const mockQuery = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { ...mockBooking, status: 'cancelled' },
          error: null
        })
      }
      ;(supabase.from as any).mockReturnValue(mockQuery)

      const result = await bookingService.cancelBooking('booking-1', 'Client requested cancellation')

      expect(supabase.from).toHaveBeenCalledWith('bookings')
      expect(mockQuery.update).toHaveBeenCalledWith({
        status: 'cancelled',
        cancellation_reason: 'Client requested cancellation',
        cancelled_at: expect.any(String),
        updated_at: expect.any(String)
      })
      expect(result.status).toBe('cancelled')
    })

    it('handles cancellation of already cancelled booking', async () => {
      const mockQuery = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: new Error('Booking already cancelled')
        })
      }
      ;(supabase.from as any).mockReturnValue(mockQuery)

      await expect(bookingService.cancelBooking('booking-1')).rejects.toThrow('Booking already cancelled')
    })
  })

  describe('getUserBookings', () => {
    it('fetches bookings for a user', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({
          data: [mockBooking],
          error: null,
          count: 1
        })
      }
      ;(supabase.from as any).mockReturnValue(mockQuery)

      const result = await bookingService.getUserBookings('user@example.com', {
        limit: 10,
        offset: 0
      })

      expect(supabase.from).toHaveBeenCalledWith('bookings')
      expect(mockQuery.select).toHaveBeenCalledWith('*')
      expect(mockQuery.eq).toHaveBeenCalledWith('client_email', 'user@example.com')
      expect(mockQuery.order).toHaveBeenCalledWith('created_at', { ascending: false })
      expect(result).toEqual({ bookings: [mockBooking], total: 1 })
    })

    it('filters bookings by status', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({
          data: [mockBooking],
          error: null,
          count: 1
        })
      }
      ;(supabase.from as any).mockReturnValue(mockQuery)

      await bookingService.getUserBookings('user@example.com', {
        status: 'confirmed',
        limit: 10,
        offset: 0
      })

      expect(mockQuery.eq).toHaveBeenCalledWith('client_email', 'user@example.com')
      expect(mockQuery.eq).toHaveBeenCalledWith('status', 'confirmed')
    })
  })

  describe('validateBookingData', () => {
    it('validates correct booking data', () => {
      const validData = {
        service_id: 'service-1',
        client_email: 'test@example.com',
        start_time: '2024-01-15T10:00:00Z',
        end_time: '2024-01-15T11:00:00Z',
        session_id: 'session-123'
      }

      expect(() => bookingService.validateBookingData(validData)).not.toThrow()
    })

    it('throws error for missing service_id', () => {
      const invalidData = {
        service_id: '',
        client_email: 'test@example.com',
        start_time: '2024-01-15T10:00:00Z',
        end_time: '2024-01-15T11:00:00Z',
        session_id: 'session-123'
      }

      expect(() => bookingService.validateBookingData(invalidData)).toThrow('service_id is required')
    })

    it('throws error for invalid email', () => {
      const invalidData = {
        service_id: 'service-1',
        client_email: 'invalid-email',
        start_time: '2024-01-15T10:00:00Z',
        end_time: '2024-01-15T11:00:00Z',
        session_id: 'session-123'
      }

      expect(() => bookingService.validateBookingData(invalidData)).toThrow('Invalid email format')
    })

    it('throws error for invalid date format', () => {
      const invalidData = {
        service_id: 'service-1',
        client_email: 'test@example.com',
        start_time: 'invalid-date',
        end_time: '2024-01-15T11:00:00Z',
        session_id: 'session-123'
      }

      expect(() => bookingService.validateBookingData(invalidData)).toThrow('Invalid date format')
    })

    it('throws error when end_time is before start_time', () => {
      const invalidData = {
        service_id: 'service-1',
        client_email: 'test@example.com',
        start_time: '2024-01-15T11:00:00Z',
        end_time: '2024-01-15T10:00:00Z',
        session_id: 'session-123'
      }

      expect(() => bookingService.validateBookingData(invalidData)).toThrow('end_time must be after start_time')
    })
  })

  describe('Error Handling and Edge Cases', () => {
    it('handles network timeouts', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockRejectedValue(new Error('Network timeout'))
      }
      ;(supabase.from as any).mockReturnValue(mockQuery)

      await expect(bookingService.getServices()).rejects.toThrow('Network timeout')
    })

    it('handles database connection errors', async () => {
      ;(supabase.from as any).mockImplementation(() => {
        throw new Error('Database connection failed')
      })

      await expect(bookingService.getServices()).rejects.toThrow('Database connection failed')
    })

    it('handles malformed data from database', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({
          data: [null, undefined, {}],
          error: null,
          count: 3
        })
      }
      ;(supabase.from as any).mockReturnValue(mockQuery)

      const result = await bookingService.getServices()

      expect(result.services).toEqual([null, undefined, {}])
      expect(result.total).toBe(3)
    })

    it('handles concurrent hold requests', async () => {
      const mockRpc = vi.fn()
        .mockResolvedValueOnce({
          data: { id: 'hold-1', expires_at: '2024-01-15T10:05:00Z' },
          error: null
        })
        .mockResolvedValueOnce({
          data: null,
          error: new Error('Slot already held')
        })
      supabase.rpc = mockRpc

      // First hold should succeed
      const firstResult = await bookingService.holdTimeSlot('slot-1', 'session-1')
      expect(firstResult.hold).toBeDefined()

      // Second hold should fail
      await expect(bookingService.holdTimeSlot('slot-1', 'session-2')).rejects.toThrow('Slot already held')
    })
  })
})