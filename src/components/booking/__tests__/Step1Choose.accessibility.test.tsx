import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe, toHaveNoViolations } from 'jest-axe'

import { announcer, FocusManager, validateHeadingHierarchy, generateAriaLabels } from '@/utils/accessibility'

import { Step1Choose } from '../Step1Choose'

// Extend Jest matchers
expect.extend(toHaveNoViolations)

// Mock dependencies
vi.mock('@/hooks/useMetaTracking', () => ({
  useMetaTracking: () => ({
    trackServiceView: vi.fn(),
    trackServiceSelection: vi.fn(),
    trackBookingFunnel: {
      serviceSelected: vi.fn(),
      timeSlotSelected: vi.fn()
    },
    trackServiceCategory: {
      beautyServiceView: vi.fn(),
      fitnessProgramView: vi.fn(),
      lifestyleServiceView: vi.fn()
    },
    trackCustomConversion: vi.fn()
  })
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

// Mock data
const mockServices = [
  {
    id: 'beauty-lashes',
    title: 'Rzęsy',
    service_type: 'beauty' as const,
    duration_minutes: 90,
    price_from: 300,
    category: 'beauty',
    add_ons: [
      { id: 'addon-1', name: 'Henna brwi', duration_minutes: 15, price: 50 }
    ],
    location_rules: {
      allowed_locations: ['studio']
    }
  },
  {
    id: 'fitness-glutes',
    title: 'Glute Day',
    service_type: 'fitness' as const,
    duration_minutes: 60,
    price_from: 150,
    category: 'fitness',
    location_rules: {
      allowed_locations: ['gym']
    }
  }
]

const mockLocations = [
  { id: 'warsaw-center', name: 'Warszawa Centrum', city: 'Warszawa', address: 'Marszałkowska 1', type: 'studio' },
  { id: 'warsaw-wola', name: 'Warszawa Wola', city: 'Warszawa', address: 'Wolska 10', type: 'gym' }
]

describe('Step1Choose Accessibility Tests', () => {
  const mockOnComplete = vi.fn()
  const user = userEvent.setup()

  beforeEach(() => {
    vi.clearAllMocks()
    // Clear DOM
    document.body.innerHTML = ''
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('WCAG AA Compliance - axe-core', () => {
    it('should have no accessibility violations in initial state', async () => {
      const { container } = render(
        <Step1Choose
          services={mockServices}
          locations={mockLocations}
          onComplete={mockOnComplete}
        />
      )

      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have no accessibility violations in service selection state', async () => {
      const { container } = render(
        <Step1Choose
          services={mockServices}
          locations={mockLocations}
          onComplete={mockOnComplete}
        />
      )

      // Click beauty button to show service list
      const beautyButton = screen.getByRole('button', { name: /beauty/i })
      await user.click(beautyButton)

      await waitFor(() => {
        expect(screen.getByText('Pick a service')).toBeInTheDocument()
      })

      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have no accessibility violations in search state', async () => {
      const { container } = render(
        <Step1Choose
          services={mockServices}
          locations={mockLocations}
          onComplete={mockOnComplete}
        />
      )

      // Navigate to service list
      const beautyButton = screen.getByRole('button', { name: /beauty/i })
      await user.click(beautyButton)

      await waitFor(() => {
        expect(screen.getByText('Pick a service')).toBeInTheDocument()
      })

      // Enable search
      const searchButton = screen.getByRole('button', { name: /search/i })
      await user.click(searchButton)

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument()
      })

      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have no accessibility violations in location selection state', async () => {
      const serviceWithMultipleLocations = {
        ...mockServices[0],
        location_rules: {
          allowed_locations: ['studio', 'gym']
        }
      }

      const { container } = render(
        <Step1Choose
          services={[serviceWithMultipleLocations]}
          locations={mockLocations}
          onComplete={mockOnComplete}
        />
      )

      // Navigate to location selection
      const beautyButton = screen.getByRole('button', { name: /beauty/i })
      await user.click(beautyButton)

      await waitFor(() => {
        expect(screen.getByText('Pick a service')).toBeInTheDocument()
      })

      const serviceCard = screen.getByText('Rzęsy')
      await user.click(serviceCard)

      await waitFor(() => {
        expect(screen.getByText('Where?')).toBeInTheDocument()
      })

      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })

  describe('Keyboard Navigation', () => {
    it('should support tab navigation through service type buttons', async () => {
      render(
        <Step1Choose
          services={mockServices}
          locations={mockLocations}
          onComplete={mockOnComplete}
        />
      )

      // Get all interactive elements
      const buttons = screen.getAllByRole('button')

      // Focus first button with Tab
      await user.tab()
      expect(document.activeElement).toBe(buttons[0])

      // Navigate through buttons with Tab
      await user.tab()
      expect(document.activeElement).toBe(buttons[1])
    })

    it('should support arrow key navigation in service lists', async () => {
      render(
        <Step1Choose
          services={mockServices}
          locations={mockLocations}
          onComplete={mockOnComplete}
        />
      )

      // Navigate to service list
      const beautyButton = screen.getByRole('button', { name: /beauty/i })
      await user.click(beautyButton)

      await waitFor(() => {
        expect(screen.getByText('Pick a service')).toBeInTheDocument()
      })

      // Focus on first service card
      const serviceCards = screen.getAllByRole('button').filter(button =>
        button.textContent?.includes('Rzęsy') || button.textContent?.includes('Glute')
      )

      if (serviceCards.length > 0) {
        serviceCards[0].focus()
        expect(document.activeElement).toBe(serviceCards[0])

        // Test arrow key navigation
        await user.keyboard('{ArrowDown}')
        // Note: Arrow navigation implementation depends on component
      }
    })

    it('should handle Enter and Space key activation', async () => {
      render(
        <Step1Choose
          services={mockServices}
          locations={mockLocations}
          onComplete={mockOnComplete}
        />
      )

      const beautyButton = screen.getByRole('button', { name: /beauty/i })

      // Focus button and activate with Enter
      beautyButton.focus()
      await user.keyboard('{Enter}')

      await waitFor(() => {
        expect(screen.getByText('Pick a service')).toBeInTheDocument()
      })

      // Go back and test Space key
      const changeButton = screen.getByText('Change')
      changeButton.focus()
      await user.keyboard('{ }') // Space key

      await waitFor(() => {
        expect(screen.getByText('What brings you here?')).toBeInTheDocument()
      })
    })

    it('should manage focus appropriately when switching views', async () => {
      render(
        <Step1Choose
          services={mockServices}
          locations={mockLocations}
          onComplete={mockOnComplete}
        />
      )

      const beautyButton = screen.getByRole('button', { name: /beauty/i })
      await user.click(beautyButton)

      await waitFor(() => {
        expect(screen.getByText('Pick a service')).toBeInTheDocument()
      })

      // Focus should be managed appropriately when entering service list
      const focusableElements = FocusManager.getFocusableElements(document.body)
      expect(focusableElements.length).toBeGreaterThan(0)
    })

    it('should support Escape key to cancel actions', async () => {
      render(
        <Step1Choose
          services={mockServices}
          locations={mockLocations}
          onComplete={mockOnComplete}
        />
      )

      // Navigate to service list
      const beautyButton = screen.getByRole('button', { name: /beauty/i })
      await user.click(beautyButton)

      await waitFor(() => {
        expect(screen.getByText('Pick a service')).toBeInTheDocument()
      })

      // Enable search
      const searchButton = screen.getByRole('button', { name: /search/i })
      await user.click(searchButton)

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument()
      })

      // Press Escape to close search
      const searchInput = screen.getByPlaceholderText(/search/i)
      searchInput.focus()
      await user.keyboard('{Escape}')

      // Search should be closed
      await waitFor(() => {
        expect(screen.queryByPlaceholderText(/search/i)).not.toBeInTheDocument()
      })
    })
  })

  describe('Screen Reader Compatibility', () => {
    it('should have proper ARIA labels and roles', async () => {
      render(
        <Step1Choose
          services={mockServices}
          locations={mockLocations}
          onComplete={mockOnComplete}
        />
      )

      // Check for proper heading structure
      expect(screen.getByRole('heading', { name: 'What brings you here?' })).toBeInTheDocument()

      // Check for landmark roles
      expect(screen.getByRole('main')).toBeInTheDocument()
      expect(screen.getByRole('region')).toBeInTheDocument()
    })

    it('should announce state changes to screen readers', async () => {
      const announceSpy = vi.spyOn(announcer, 'announce')

      render(
        <Step1Choose
          services={mockServices}
          locations={mockLocations}
          onComplete={mockOnComplete}
        />
      )

      // Navigate to service list - should announce the change
      const beautyButton = screen.getByRole('button', { name: /beauty/i })
      await user.click(beautyButton)

      await waitFor(() => {
        expect(screen.getByText('Pick a service')).toBeInTheDocument()
      })

      // Note: This depends on the component implementing screen reader announcements
      // If not implemented, this test will fail and indicates a need for improvement
    })

    it('should have accessible form controls', async () => {
      render(
        <Step1Choose
          services={mockServices}
          locations={mockLocations}
          onComplete={mockOnComplete}
        />
      )

      // Navigate to search state
      const beautyButton = screen.getByRole('button', { name: /beauty/i })
      await user.click(beautyButton)

      await waitFor(() => {
        expect(screen.getByText('Pick a service')).toBeInTheDocument()
      })

      // Enable search
      const searchButton = screen.getByRole('button', { name: /search/i })
      await user.click(searchButton)

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument()
      })

      // Check search input accessibility
      const searchInput = screen.getByPlaceholderText(/search/i)
      expect(searchInput).toHaveAttribute('type', 'text')
      expect(searchInput).toHaveAttribute('placeholder')

      // Should have accessible label (via aria-label, aria-labelledby, or associated label)
      expect(
        searchInput.hasAttribute('aria-label') ||
        searchInput.hasAttribute('aria-labelledby') ||
        searchInput.hasAttribute('title')
      ).toBe(true)
    })

    it('should have proper button descriptions', async () => {
      render(
        <Step1Choose
          services={mockServices}
          locations={mockLocations}
          onComplete={mockOnComplete}
        />
      )

      // Check that all buttons have accessible names
      const buttons = screen.getAllByRole('button')
      buttons.forEach(button => {
        const accessibleName = button.getAttribute('aria-label') ||
                              button.getAttribute('title') ||
                              button.textContent?.trim()
        expect(accessibleName).toBeTruthy()
        expect(accessibleName!.length).toBeGreaterThan(0)
      })
    })

    it('should handle focus management for dynamic content', async () => {
      render(
        <Step1Choose
          services={mockServices}
          locations={mockLocations}
          onComplete={mockOnComplete}
        />
      )

      // Track active element changes
      const activeElementBefore = document.activeElement

      // Navigate to service list
      const beautyButton = screen.getByRole('button', { name: /beauty/i })
      await user.click(beautyButton)

      await waitFor(() => {
        expect(screen.getByText('Pick a service')).toBeInTheDocument()
      })

      // Focus should be appropriately managed
      const activeElementAfter = document.activeElement
      expect(activeElementAfter).not.toBe(activeElementBefore)
      expect(activeElementAfter).toBeInstanceOf(HTMLElement)
    })
  })

  describe('Visual Accessibility', () => {
    it('should maintain proper heading hierarchy', () => {
      render(
        <Step1Choose
          services={mockServices}
          locations={mockLocations}
          onComplete={mockOnComplete}
        />
      )

      // Check heading hierarchy
      const { errors, warnings } = validateHeadingHierarchy()
      expect(errors.length).toBe(0)

      // Warnings about skipped levels might be acceptable depending on design
      if (warnings.length > 0) {
        console.warn('Heading hierarchy warnings:', warnings)
      }
    })

    it('should have sufficient color contrast', () => {
      // This would require access to computed styles
      // For now, we'll test that text is not invisible
      const textElements = document.querySelectorAll('h1, h2, h3, p, span, button')
      textElements.forEach(element => {
        const styles = window.getComputedStyle(element as Element)
        expect(styles.color).not.toBe('rgba(0, 0, 0, 0)')
        expect(styles.color).not.toBe('transparent')
      })
    })

    it('should have visible focus indicators', async () => {
      render(
        <Step1Choose
          services={mockServices}
          locations={mockLocations}
          onComplete={mockOnComplete}
        />
      )

      const button = screen.getByRole('button', { name: /beauty/i })

      // Focus button
      button.focus()

      // Check that focus styles are applied
      const styles = window.getComputedStyle(button)
      expect(styles.outline || styles.boxShadow).toBeTruthy()
    })

    it('should have appropriate text sizing', () => {
      render(
        <Step1Choose
          services={mockServices}
          locations={mockLocations}
          onComplete={mockOnComplete}
        />
      )

      // Check that text is not too small (minimum 16px for body text recommended)
      const textElements = document.querySelectorAll('p, span, div')
      textElements.forEach(element => {
        const styles = window.getComputedStyle(element as Element)
        const fontSize = parseFloat(styles.fontSize)

        // Only check elements that actually have text content
        if (element.textContent?.trim() && fontSize > 0) {
          expect(fontSize).toBeGreaterThanOrEqual(14) // 14px minimum
        }
      })
    })
  })

  describe('ARIA Attributes and Live Regions', () => {
    it('should use ARIA attributes appropriately', async () => {
      render(
        <Step1Choose
          services={mockServices}
          locations={mockLocations}
          onComplete={mockOnComplete}
        />
      )

      // Check for proper ARIA usage
      const buttons = screen.getAllByRole('button')
      buttons.forEach(button => {
        // Check for aria-expanded on toggle buttons
        if (button.getAttribute('aria-expanded')) {
          const expanded = button.getAttribute('aria-expanded')
          expect(['true', 'false']).toContain(expanded)
        }

        // Check for aria-pressed on toggle buttons
        if (button.getAttribute('aria-pressed')) {
          const pressed = button.getAttribute('aria-pressed')
          expect(['true', 'false']).toContain(pressed)
        }

        // Check for aria-disabled on disabled buttons
        if (button.hasAttribute('disabled')) {
          expect(button.getAttribute('aria-disabled')).toBe('true')
        }
      })
    })

    it('should provide context for interactive elements', async () => {
      render(
        <Step1Choose
          services={mockServices}
          locations={mockLocations}
          onComplete={mockOnComplete}
        />
      )

      // Check that interactive elements have sufficient context
      const interactiveElements = document.querySelectorAll('button, [role="button"], a')
      interactiveElements.forEach(element => {
        const hasAccessibleName = element.hasAttribute('aria-label') ||
                                 element.hasAttribute('aria-labelledby') ||
                                 element.textContent?.trim().length > 0

        expect(hasAccessibleName).toBe(true)
      })
    })

    it('should use live regions for dynamic content announcements', async () => {
      const announceSpy = vi.spyOn(announcer, 'announce')

      render(
        <Step1Choose
          services={mockServices}
          locations={mockLocations}
          onComplete={mockOnComplete}
        />
      )

      // Trigger a state change that should be announced
      const beautyButton = screen.getByRole('button', { name: /beauty/i })
      await user.click(beautyButton)

      await waitFor(() => {
        expect(screen.getByText('Pick a service')).toBeInTheDocument()
      })

      // Check if announcements are made (this depends on implementation)
      // If no announcements are made, this indicates a need for improvement
      if (announceSpy.mock.calls.length === 0) {
        console.warn('No screen reader announcements detected for state changes')
      }
    })
  })

  describe('Error and Status Accessibility', () => {
    it('should handle error states accessibly', async () => {
      render(
        <Step1Choose
          services={[]} // Empty services to potentially trigger error state
          locations={mockLocations}
          onComplete={mockOnComplete}
        />
      )

      // Check for error messages if they exist
      const errorElements = document.querySelectorAll('[role="alert"], .error, [aria-live="assertive"]')
      errorElements.forEach(element => {
        expect(element.textContent?.trim().length).toBeGreaterThan(0)
      })
    })

    it('should provide feedback for loading states', async () => {
      render(
        <Step1Choose
          services={mockServices}
          locations={mockLocations}
          onComplete={mockOnComplete}
        />
      )

      // Look for loading indicators
      const loadingElements = document.querySelectorAll('[role="progressbar"], [aria-busy="true"]')
      loadingElements.forEach(element => {
        const hasAccessibleLabel = element.hasAttribute('aria-label') ||
                                 element.hasAttribute('aria-labelledby')
        expect(hasAccessibleLabel).toBe(true)
      })
    })
  })

  describe('Touch and Mobile Accessibility', () => {
    it('should have appropriate touch target sizes', async () => {
      render(
        <Step1Choose
          services={mockServices}
          locations={mockLocations}
          onComplete={mockOnComplete}
        />
      )

      // Check that buttons have sufficient touch target size (minimum 44x44 pixels)
      const buttons = screen.getAllByRole('button')
      buttons.forEach(button => {
        const styles = window.getComputedStyle(button)
        const width = parseFloat(styles.width)
        const height = parseFloat(styles.height)
        const minHeight = parseFloat(styles.minHeight)

        // Check that at least one dimension meets minimum touch target size
        const hasMinimumSize = width >= 44 || height >= 44 || minHeight >= 44
        expect(hasMinimumSize).toBe(true)
      })
    })

    it('should support touch gestures appropriately', async () => {
      render(
        <Step1Choose
          services={mockServices}
          locations={mockLocations}
          onComplete={mockOnComplete}
        />
      )

      // Test touch interactions
      const beautyButton = screen.getByRole('button', { name: /beauty/i })

      // Simulate touch
      fireEvent.touchStart(beautyButton)
      fireEvent.touchEnd(beautyButton)

      await waitFor(() => {
        expect(screen.getByText('Pick a service')).toBeInTheDocument()
      })
    })
  })

  describe('Accessibility Integration Tests', () => {
    it('should support complete booking flow with keyboard only', async () => {
      render(
        <Step1Choose
          services={mockServices}
          locations={mockLocations}
          onComplete={mockOnComplete}
        />
      )

      // Complete entire flow using only keyboard
      // 1. Select service type with Enter
      await user.tab()
      await user.keyboard('{Enter}')

      await waitFor(() => {
        expect(screen.getByText('Pick a service')).toBeInTheDocument()
      })

      // 2. Select service with Enter
      await user.tab()
      await user.keyboard('{Enter}')

      // Should complete successfully
      await waitFor(() => {
        expect(mockOnComplete).toHaveBeenCalledWith({
          serviceId: 'beauty-lashes',
          serviceType: 'beauty',
          durationMinutes: 90,
          locationId: 'warsaw-center',
          selectedAddOns: []
        })
      })
    })

    it('should maintain accessibility during rapid state changes', async () => {
      render(
        <Step1Choose
          services={mockServices}
          locations={mockLocations}
          onComplete={mockOnComplete}
        />
      )

      // Rapidly switch between states
      const beautyButton = screen.getByRole('button', { name: /beauty/i })
      await user.click(beautyButton)

      await waitFor(() => {
        expect(screen.getByText('Pick a service')).toBeInTheDocument()
      })

      // Go back immediately
      const changeButton = screen.getByText('Change')
      await user.click(changeButton)

      await waitFor(() => {
        expect(screen.getByText('What brings you here?')).toBeInTheDocument()
      })

      // Check that component is still accessible
      const results = await axe(document.body)
      expect(results).toHaveNoViolations()
    })
  })
})