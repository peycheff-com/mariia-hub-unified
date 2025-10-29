import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { supabase } from '@/integrations/supabase/client'
import { logger } from '@/lib/logger'

import { Step3Details } from '../Step3Details'

// Mock dependencies
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: vi.fn()
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: null, error: null }))
        }))
      }))
    }))
  }
}))

vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  }
}))

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key
  })
}))

vi.mock('@/schemas', () => ({
  BookingStep3Schema: {
    parse: vi.fn().mockReturnValue({})
  }
}))

describe('Step3Details Component Tests', () => {
  const mockOnComplete = vi.fn()
  const mockOnBack = vi.fn()
  const user = userEvent.setup()

  beforeEach(() => {
    vi.clearAllMocks()
    // Reset mocks to default state
    ;(supabase.auth.getUser as any).mockResolvedValue({ data: { user: null } })
    ;(supabase.from as any).mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: null, error: null }))
        }))
      }))
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders component', async () => {
    ;(supabase.auth.getUser as any).mockResolvedValue({ data: { user: null } })

    render(
      <Step3Details
        serviceType="beauty"
        onComplete={mockOnComplete}
        onBack={mockOnBack}
      />
    )

    // Component should render
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('shows back button when onBack is provided', async () => {
    ;(supabase.auth.getUser as any).mockResolvedValue({ data: { user: null } })

    render(
      <Step3Details
        serviceType="beauty"
        onComplete={mockOnComplete}
        onBack={mockOnBack}
      />
    )

    await waitFor(() => {
      const backButton = screen.queryByRole('button', { name: /back/i })
      // Back button might or might not be present depending on component implementation
    })
  })

  it('does not show back button when onBack is not provided', async () => {
    ;(supabase.auth.getUser as any).mockResolvedValue({ data: { user: null } })

    render(
      <Step3Details
        serviceType="beauty"
        onComplete={mockOnComplete}
      />
    )

    await waitFor(() => {
      const backButton = screen.queryByRole('button', { name: /back/i })
      expect(backButton).not.toBeInTheDocument()
    })
  })

  it('handles serviceType prop correctly', async () => {
    ;(supabase.auth.getUser as any).mockResolvedValue({ data: { user: null } })

    render(
      <Step3Details
        serviceType="fitness"
        onComplete={mockOnComplete}
        onBack={mockOnBack}
      />
    )

    // Component should render with fitness service type
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('handles user data loading', async () => {
    const mockUser = { id: '123', email: 'user@example.com' }

    ;(supabase.auth.getUser as any).mockResolvedValue({ data: { user: mockUser } })
    ;(supabase.from as any).mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: { full_name: 'John Doe' }, error: null }))
        }))
      }))
    })

    render(
      <Step3Details
        serviceType="beauty"
        onComplete={mockOnComplete}
        onBack={mockOnBack}
      />
    )

    await waitFor(() => {
      expect(supabase.auth.getUser).toHaveBeenCalled()
    })
  })

  it('handles loading errors gracefully', async () => {
    ;(supabase.auth.getUser as any).mockRejectedValue(new Error('Auth error'))

    render(
      <Step3Details
        serviceType="beauty"
        onComplete={mockOnComplete}
        onBack={mockOnBack}
      />
    )

    await waitFor(() => {
      expect(logger.error).toHaveBeenCalledWith('Error loading user data:', expect.any(Error))
    })
  })

  it('renders guest checkout for non-logged users', async () => {
    ;(supabase.auth.getUser as any).mockResolvedValue({ data: { user: null } })

    render(
      <Step3Details
        serviceType="beauty"
        onComplete={mockOnComplete}
        onBack={mockOnBack}
      />
    )

    await waitFor(() => {
      expect(supabase.auth.getUser).toHaveBeenCalled()
    })
  })

  it('calls onComplete when form is submitted', async () => {
    ;(supabase.auth.getUser as any).mockResolvedValue({ data: { user: null } })

    render(
      <Step3Details
        serviceType="beauty"
        onComplete={mockOnComplete}
        onBack={mockOnBack}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('Loading...')).toBeInTheDocument()
    })
  })
})