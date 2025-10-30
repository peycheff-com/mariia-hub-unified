import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient } from '@tanstack/react-query'

import { createSupabaseMock } from '@/test/mocks/services.mock'

import AnalyticsDashboard from '../AnalyticsDashboard'

// Mock the dependencies
vi.mock('@/integrations/supabase/client', () => ({
  supabase: createSupabaseMock(),
}))

vi.mock('@/hooks/use-toast aria-live="polite" aria-atomic="true"', () => ({
  useToast: () => ({
    toast aria-live="polite" aria-atomic="true": vi.fn(),
  }),
}))

vi.mock('recharts', () => ({
  BarChart: ({ children }: any) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => <div data-testid="bar" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
}))

describe('AnalyticsDashboard', () => {
  let mockSupabase: any

  beforeEach(() => {
    vi.clearAllMocks()
    mockSupabase = createSupabaseMock()

    // Setup mock data
    const mockBookings = [
      {
        id: '1',
        amount_paid: 100.00,
        booking_date: '2024-01-15T10:00:00Z',
        status: 'confirmed'
      },
      {
        id: '2',
        amount_paid: 150.50,
        booking_date: '2024-01-16T14:00:00Z',
        status: 'pending'
      },
      {
        id: '3',
        amount_paid: 200.00,
        booking_date: '2024-02-15T11:00:00Z',
        status: 'confirmed'
      }
    ]

    // Mock the bookings table queries
    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      then: vi.fn().mockImplementation((resolve) => {
        resolve({
          data: mockBookings,
          error: null,
          count: mockBookings.length
        })
        return mockSupabase.from()
      })
    })

    // Mock the count queries
    const mockTable = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      then: vi.fn().mockResolvedValue({ data: [], count: 5, error: null })
    }

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'profiles') {
        return {
          select: vi.fn().mockReturnThis(),
          then: vi.fn().mockResolvedValue({ data: [], count: 25, error: null })
        }
      }
      return mockTable
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders loading state initially', () => {
    // Override mock to simulate loading
    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      then: vi.fn().mockImplementation(() => new Promise(() => {})) // Never resolves
    })

    render(<AnalyticsDashboard />)

    expect(screen.getByText('Loading analytics...')).toBeInTheDocument()
  })

  it('renders analytics dashboard with all key metrics', async () => {
    render(<AnalyticsDashboard />)

    await waitFor(() => {
      expect(screen.getByText('Analytics Dashboard')).toBeInTheDocument()
    })

    // Check for all metric cards
    expect(screen.getByText('Total Bookings')).toBeInTheDocument()
    expect(screen.getByText('Total Revenue')).toBeInTheDocument()
    expect(screen.getByText('Total Users')).toBeInTheDocument()
    expect(screen.getByText('Pending Bookings')).toBeInTheDocument()

    // Check for TrendingUp icon
    const trendingUpIcon = document.querySelector('[class*="lucide-trending-up"]')
    expect(trendingUpIcon).toBeInTheDocument()
  })

  it('displays correct booking statistics', async () => {
    render(<AnalyticsDashboard />)

    await waitFor(() => {
      expect(screen.getByText('3')).toBeInTheDocument() // Total bookings
    })

    const revenueElement = screen.getByText(/PLN/)
    expect(revenueElement).toBeInTheDocument()
    expect(revenueElement.textContent).toContain('450.50') // 100 + 150.50 + 200
  })

  it('displays user statistics correctly', async () => {
    render(<AnalyticsDashboard />)

    await waitFor(() => {
      expect(screen.getByText('25')).toBeInTheDocument() // Total users
    })
  })

  it('displays pending bookings count', async () => {
    render(<AnalyticsDashboard />)

    await waitFor(() => {
      expect(screen.getByText('5')).toBeInTheDocument() // Pending bookings
    })
  })

  it('renders monthly bookings chart', async () => {
    render(<AnalyticsDashboard />)

    await waitFor(() => {
      expect(screen.getByText('Monthly Bookings')).toBeInTheDocument()
    })

    // Check for chart components
    expect(screen.getByTestId('responsive-container')).toBeInTheDocument()
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument()
    expect(screen.getByTestId('bar')).toBeInTheDocument()
    expect(screen.getByTestId('x-axis')).toBeInTheDocument()
    expect(screen.getByTestId('y-axis')).toBeInTheDocument()
  })

  it('displays "No booking data yet" when no data available', async () => {
    // Override mock to return empty data
    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      then: vi.fn().mockResolvedValue({
        data: [],
        error: null,
        count: 0
      })
    })

    render(<AnalyticsDashboard />)

    await waitFor(() => {
      expect(screen.getByText('No booking data yet')).toBeInTheDocument()
    })
  })

  it('handles API errors gracefully', async () => {
    const toast aria-live="polite" aria-atomic="true"Mock = vi.fn()
    vi.mock('@/hooks/use-toast aria-live="polite" aria-atomic="true"', () => ({
      useToast: () => ({
        toast aria-live="polite" aria-atomic="true": toast aria-live="polite" aria-atomic="true"Mock,
      }),
    }))

    // Override mock to simulate error
    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      then: vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Database error' }
      })
    })

    render(<AnalyticsDashboard />)

    await waitFor(() => {
      expect(toast aria-live="polite" aria-atomic="true"Mock).toHaveBeenCalledWith({
        title: "Error",
        description: "Could not load analytics data",
        variant: "destructive",
      })
    })
  })

  it('shows correct number of metric cards', async () => {
    render(<AnalyticsDashboard />)

    await waitFor(() => {
      // Should have 4 metric cards in the grid
      const metricCards = document.querySelectorAll('[class*="grid-cols-4"]')
      expect(metricCards.length).toBeGreaterThan(0)
    })
  })

  it('has proper accessibility attributes', async () => {
    render(<AnalyticsDashboard />)

    await waitFor(() => {
      const dashboardTitle = screen.getByRole('heading', { name: /analytics dashboard/i })
      expect(dashboardTitle).toBeInTheDocument()
      expect(dashboardTitle.tagName).toBe('H2')
    })

    // Check for semantic HTML structure
    const cards = document.querySelectorAll('[class*="card"]')
    expect(cards.length).toBeGreaterThan(0)
  })

  it('displays currency formatting correctly', async () => {
    render(<AnalyticsDashboard />)

    await waitFor(() => {
      const revenueElements = screen.getAllByText(/PLN/)
      expect(revenueElements.length).toBeGreaterThan(0)
      const revenueElement = revenueElements.find(el =>
        el.textContent?.includes('450.50')
      )
      expect(revenueElement).toBeInTheDocument()
    })
  })

  it('processes monthly data correctly for chart', async () => {
    // Test with bookings from different months
    const multiMonthBookings = [
      {
        id: '1',
        amount_paid: 100,
        booking_date: '2024-01-15T10:00:00Z',
        status: 'confirmed'
      },
      {
        id: '2',
        amount_paid: 150,
        booking_date: '2024-01-20T14:00:00Z',
        status: 'confirmed'
      },
      {
        id: '3',
        amount_paid: 200,
        booking_date: '2024-02-15T11:00:00Z',
        status: 'confirmed'
      }
    ]

    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      then: vi.fn().mockResolvedValue({
        data: multiMonthBookings,
        error: null,
        count: 3
      })
    })

    render(<AnalyticsDashboard />)

    await waitFor(() => {
      // Chart should be rendered with data
      expect(screen.getByTestId('bar-chart')).toBeInTheDocument()
    })
  })

  it('handles empty revenue calculations', async () => {
    // Test with bookings that have no amount_paid
    const noRevenueBookings = [
      {
        id: '1',
        amount_paid: null,
        booking_date: '2024-01-15T10:00:00Z',
        status: 'confirmed'
      },
      {
        id: '2',
        amount_paid: 0,
        booking_date: '2024-01-16T14:00:00Z',
        status: 'pending'
      }
    ]

    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      then: vi.fn().mockResolvedValue({
        data: noRevenueBookings,
        error: null,
        count: 2
      })
    })

    render(<AnalyticsDashboard />)

    await waitFor(() => {
      const revenueElement = screen.getByText(/0\.00 PLN/)
      expect(revenueElement).toBeInTheDocument()
    })
  })

  it('has proper responsive design classes', async () => {
    render(<AnalyticsDashboard />)

    await waitFor(() => {
      // Check for responsive grid classes
      const gridContainer = document.querySelector('.grid.grid-cols-1.md\\:grid-cols-2.lg\\:grid-cols-4')
      expect(gridContainer).toBeInTheDocument()
    })
  })

  it('loads analytics data on component mount', async () => {
    const mockSelect = vi.fn().mockReturnThis()
    const mockThen = vi.fn().mockResolvedValue({
      data: [{ id: '1', amount_paid: 100, booking_date: '2024-01-15T10:00:00Z' }],
      error: null,
      count: 1
    })

    mockSupabase.from.mockReturnValue({
      select: mockSelect,
      then: mockThen
    })

    render(<AnalyticsDashboard />)

    await waitFor(() => {
      expect(mockSelect).toHaveBeenCalled()
      expect(mockThen).toHaveBeenCalled()
    })
  })
})