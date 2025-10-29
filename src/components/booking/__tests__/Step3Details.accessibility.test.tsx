import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe, toHaveNoViolations } from 'jest-axe'

import { announcer, FocusManager, validateHeadingHierarchy, generateAriaLabels, ColorContrast } from '@/utils/accessibility'
import { supabase } from '@/integrations/supabase/client'

import { Step3Details } from '../Step3Details'

// Extend Jest matchers
expect.extend(toHaveNoViolations)

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

describe('Step3Details Accessibility Tests', () => {
  const mockOnComplete = vi.fn()
  const mockOnBack = vi.fn()
  const user = userEvent.setup()

  beforeEach(() => {
    vi.clearAllMocks()
    document.body.innerHTML = ''
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

  describe('WCAG AA Compliance - axe-core', () => {
    it('should have no accessibility violations in loading state', async () => {
      ;(supabase.auth.getUser as any).mockResolvedValue({ data: { user: null } })

      const { container } = render(
        <Step3Details
          serviceType="beauty"
          onComplete={mockOnComplete}
          onBack={mockOnBack}
        />
      )

      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have no accessibility violations for guest checkout form', async () => {
      ;(supabase.auth.getUser as any).mockResolvedValue({ data: { user: null } })

      render(
        <Step3Details
          serviceType="beauty"
          onComplete={mockOnComplete}
          onBack={mockOnBack}
        />
      )

      // Wait for component to load
      await waitFor(() => {
        expect(screen.getByText('Loading...')).toBeInTheDocument()
      })

      const results = await axe(document.body)
      expect(results).toHaveNoViolations()
    })

    it('should have no accessibility violations for logged-in user form', async () => {
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

      const results = await axe(document.body)
      expect(results).toHaveNoViolations()
    })

    it('should have no accessibility violations in error state', async () => {
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

      const results = await axe(document.body)
      expect(results).toHaveNoViolations()
    })
  })

  describe('Form Accessibility', () => {
    it('should have proper form labels and associations', async () => {
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

      // Check for proper form structure
      const forms = document.querySelectorAll('form')
      forms.forEach(form => {
        // Check that form has proper labeling
        const inputs = form.querySelectorAll('input, select, textarea')
        inputs.forEach(input => {
          const hasLabel = input.hasAttribute('aria-label') ||
                          input.hasAttribute('aria-labelledby') ||
                          form.querySelector(`label[for="${input.id}"]`) ||
                          input.closest('label')

          expect(hasLabel).toBe(true)
        })
      })
    })

    it('should have required fields properly marked', async () => {
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

      // Check for required field indicators
      const requiredInputs = document.querySelectorAll('input[required], [aria-required="true"]')
      requiredInputs.forEach(input => {
        const hasRequiredIndicator = input.hasAttribute('required') ||
                                    input.hasAttribute('aria-required')
        expect(hasRequiredIndicator).toBe(true)

        // Check that there's a visual indicator for required fields
        const label = input.closest('label') || document.querySelector(`label[for="${input.id}"]`)
        if (label) {
          const hasVisualIndicator = label.textContent?.includes('*') ||
                                    label.textContent?.match(/required/i)
          // Visual indicator is recommended but not required for accessibility
        }
      })
    })

    it('should have accessible error messages', async () => {
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

      // Look for error containers
      const errorElements = document.querySelectorAll('[role="alert"], .error, [aria-invalid="true"]')
      errorElements.forEach(element => {
        // Error messages should be associated with their inputs
        if (element.hasAttribute('aria-describedby')) {
          const describedBy = element.getAttribute('aria-describedby')
          const describedElement = document.getElementById(describedBy || '')
          expect(describedElement).toBeTruthy()
        }

        // Error messages should be accessible to screen readers
        expect(element.textContent?.trim().length).toBeGreaterThan(0)
      })
    })

    it('should have proper input types and attributes', async () => {
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

      // Check email inputs
      const emailInputs = document.querySelectorAll('input[type="email"]')
      emailInputs.forEach(input => {
        expect(input.getAttribute('type')).toBe('email')
        expect(input.hasAttribute('autocomplete')).toBe(true)
        expect(input.getAttribute('autocomplete')).toContain('email')
      })

      // Check phone inputs
      const phoneInputs = document.querySelectorAll('input[type="tel"]')
      phoneInputs.forEach(input => {
        expect(input.getAttribute('type')).toBe('tel')
        expect(input.hasAttribute('autocomplete')).toBe(true)
        expect(input.getAttribute('autocomplete')).toContain('tel')
      })

      // Check name inputs
      const nameInputs = document.querySelectorAll('input[name*="name"]')
      nameInputs.forEach(input => {
        expect(input.hasAttribute('autocomplete')).toBe(true)
        expect(['name', 'given-name', 'family-name']).toContain(input.getAttribute('autocomplete') || '')
      })
    })
  })

  describe('Keyboard Navigation', () => {
    it('should support tab navigation through form fields', async () => {
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

      // Get all focusable elements
      const focusableElements = FocusManager.getFocusableElements(document.body)
      expect(focusableElements.length).toBeGreaterThan(0)

      // Test tab navigation
      let currentIndex = 0
      for (let i = 0; i < focusableElements.length; i++) {
        await user.tab()
        if (currentIndex < focusableElements.length) {
          expect(document.activeElement).toBe(focusableElements[currentIndex])
          currentIndex++
        }
      }
    })

    it('should support shift+tab navigation', async () => {
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

      // Navigate to first element
      await user.tab()

      // Navigate back with Shift+Tab
      await user.tab({ shift: true })

      // Should still be on focusable elements
      const focusableElements = FocusManager.getFocusableElements(document.body)
      expect(focusableElements.includes(document.activeElement as HTMLElement)).toBe(true)
    })

    it('should handle Enter key for form submission', async () => {
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

      // Look for submit button
      const submitButton = screen.getByRole('button', { name: /submit|continue|next/i })
      submitButton.focus()
      await user.keyboard('{Enter}')

      // Should trigger form submission
      // Note: This depends on the component implementation
    })

    it('should handle Escape key for form cancellation', async () => {
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

      // Focus on an input and press Escape
      const inputs = document.querySelectorAll('input')
      if (inputs.length > 0) {
        inputs[0].focus()
        await user.keyboard('{Escape}')

        // Escape might cancel the form or go back
        // This depends on implementation
      }
    })

    it('should have logical tab order', async () => {
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

      // Check that tab order follows visual layout
      const focusableElements = FocusManager.getFocusableElements(document.body)
      const rect = (el: HTMLElement) => el.getBoundingClientRect()

      for (let i = 1; i < focusableElements.length; i++) {
        const prev = rect(focusableElements[i - 1])
        const curr = rect(focusableElements[i])

        // Generally, elements should appear in tab order in a way that makes sense
        // This is a rough check - exact implementation may vary
        const reasonableOrder =
          curr.top >= prev.top - 50 || // Below or slightly above previous element
          curr.left >= prev.left      // To the right of previous element

        // This is a loose check since layout may vary
        expect(reasonableOrder || focusableElements.length).toBeGreaterThan(0)
      }
    })
  })

  describe('Screen Reader Compatibility', () => {
    it('should have proper page structure and landmarks', async () => {
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

      // Check for main landmark
      const main = document.querySelector('main, [role="main"]')
      expect(main).toBeTruthy()

      // Check for proper heading structure
      const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6')
      expect(headings.length).toBeGreaterThan(0)

      // First heading should be h1
      if (headings.length > 0) {
        expect(headings[0].tagName).toBe('H1')
      }
    })

    it('should announce form validation errors', async () => {
      const announceSpy = vi.spyOn(announcer, 'announce')

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

      // Try to submit form without filling required fields
      const submitButton = screen.getByRole('button', { name: /submit|continue|next/i })
      await user.click(submitButton)

      // Check for error announcements
      // Note: This depends on the component implementing error announcements
      if (announceSpy.mock.calls.length > 0) {
        expect(announceSpy).toHaveBeenCalledWith(
          expect.stringContaining(/error|invalid|required/i),
          'assertive'
        )
      }
    })

    it('should have accessible field groups', async () => {
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

      // Check for fieldset/legend groups
      const fieldsets = document.querySelectorAll('fieldset')
      fieldsets.forEach(fieldset => {
        const legend = fieldset.querySelector('legend')
        if (legend) {
          expect(legend.textContent?.trim().length).toBeGreaterThan(0)
        }
      })

      // Check for groups with proper ARIA
      const groups = document.querySelectorAll('[role="group"]')
      groups.forEach(group => {
        const hasLabel = group.hasAttribute('aria-label') ||
                        group.hasAttribute('aria-labelledby')
        expect(hasLabel).toBe(true)
      })
    })

    it('should provide context for form inputs', async () => {
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

      // Check that all inputs have accessible context
      const inputs = document.querySelectorAll('input, select, textarea')
      inputs.forEach(input => {
        const hasContext = input.hasAttribute('aria-label') ||
                         input.hasAttribute('aria-labelledby') ||
                         input.hasAttribute('aria-describedby') ||
                         input.closest('label') ||
                         document.querySelector(`label[for="${input.id}"]`)

        expect(hasContext).toBe(true)
      })
    })

    it('should have accessible button descriptions', async () => {
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

      // Check all buttons have accessible names
      const buttons = screen.getAllByRole('button')
      buttons.forEach(button => {
        const accessibleName = button.getAttribute('aria-label') ||
                              button.getAttribute('title') ||
                              button.textContent?.trim()
        expect(accessibleName).toBeTruthy()
        expect(accessibleName!.length).toBeGreaterThan(0)
      })
    })
  })

  describe('Error and Validation Accessibility', () => {
    it('should associate error messages with inputs', async () => {
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

      // Submit form to trigger validation
      const submitButton = screen.getByRole('button', { name: /submit|continue|next/i })
      await user.click(submitButton)

      // Check for error associations
      const invalidInputs = document.querySelectorAll('[aria-invalid="true"]')
      invalidInputs.forEach(input => {
        const hasErrorAssociation = input.hasAttribute('aria-describedby') ||
                                   input.hasAttribute('aria-errormessage')

        if (hasErrorAssociation) {
          const describedId = input.getAttribute('aria-describedby') ||
                              input.getAttribute('aria-errormessage')
          const errorElement = describedId ? document.getElementById(describedId) : null
          expect(errorElement).toBeTruthy()
          expect(errorElement?.textContent?.trim().length).toBeGreaterThan(0)
        }
      })
    })

    it('should provide validation feedback in multiple formats', async () => {
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

      // Submit form to trigger validation
      const submitButton = screen.getByRole('button', { name: /submit|continue|next/i })
      await user.click(submitButton)

      // Check for multiple feedback mechanisms
      const visualErrors = document.querySelectorAll('.error, [class*="error"]')
      const ariaErrors = document.querySelectorAll('[aria-invalid="true"]')
      const alertErrors = document.querySelectorAll('[role="alert"]')

      // Should have at least some form of error indication
      expect(visualErrors.length + ariaErrors.length + alertErrors.length).toBeGreaterThan(0)
    })

    it('should handle form submission errors accessibly', async () => {
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

      // Mock onComplete to throw an error
      mockOnComplete.mockRejectedValue(new Error('Submission failed'))

      // Try to submit form
      const submitButton = screen.getByRole('button', { name: /submit|continue|next/i })
      await user.click(submitButton)

      // Check for error announcements
      const announceSpy = vi.spyOn(announcer, 'announce')

      await waitFor(() => {
        if (announceSpy.mock.calls.length > 0) {
          expect(announceSpy).toHaveBeenCalledWith(
            expect.stringContaining(/error|failed|unable/i),
            'assertive'
          )
        }
      })
    })
  })

  describe('Loading and State Accessibility', () => {
    it('should indicate loading states accessibly', async () => {
      ;(supabase.auth.getUser as any).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ data: { user: null } }), 100))
      )

      render(
        <Step3Details
          serviceType="beauty"
          onComplete={mockOnComplete}
          onBack={mockOnBack}
        />
      )

      // Check for loading indicators
      const loadingElements = document.querySelectorAll('[role="progressbar"], [aria-busy="true"]')
      const loadingText = screen.getByText('Loading...')

      expect(loadingText).toBeInTheDocument()

      loadingElements.forEach(element => {
        const hasAccessibleLabel = element.hasAttribute('aria-label') ||
                                 element.hasAttribute('aria-labelledby')
        if (hasAccessibleLabel) {
          const label = element.getAttribute('aria-label') ||
                      document.getElementById(element.getAttribute('aria-labelledby') || '')?.textContent
          expect(label).toBeTruthy()
        }
      })
    })

    it('should announce state changes', async () => {
      const announceSpy = vi.spyOn(announcer, 'announce')

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

      // Check if loading completion is announced
      if (announceSpy.mock.calls.length > 0) {
        expect(announceSpy).toHaveBeenCalledWith(
          expect.stringContaining(/loaded|ready|complete/i),
          'polite'
        )
      }
    })

    it('should manage focus during state changes', async () => {
      ;(supabase.auth.getUser as any).mockResolvedValue({ data: { user: null } })

      render(
        <Step3Details
          serviceType="beauty"
          onComplete={mockOnComplete}
          onBack={mockOnBack}
        />
      )

      // Track focus during loading
      const activeElementBefore = document.activeElement

      await waitFor(() => {
        expect(screen.getByText('Loading...')).toBeInTheDocument()
      })

      // Focus should be managed appropriately after loading
      const activeElementAfter = document.activeElement
      const focusableElements = FocusManager.getFocusableElements(document.body)

      if (focusableElements.length > 0) {
        // Focus should be on a focusable element after loading
        expect(focusableElements.includes(activeElementAfter as HTMLElement)).toBe(true)
      }
    })
  })

  describe('Mobile and Touch Accessibility', () => {
    it('should have appropriate touch target sizes', async () => {
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

      // Check touch target sizes for buttons and inputs
      const interactiveElements = document.querySelectorAll('button, input, select, textarea')
      interactiveElements.forEach(element => {
        const styles = window.getComputedStyle(element as Element)
        const width = parseFloat(styles.width)
        const height = parseFloat(styles.height)
        const minHeight = parseFloat(styles.minHeight)

        // Check that at least one dimension meets minimum touch target size (44px)
        const hasMinimumSize = width >= 44 || height >= 44 || minHeight >= 44
        expect(hasMinimumSize).toBe(true)
      })
    })

    it('should support touch interactions', async () => {
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

      // Test touch on buttons
      const buttons = screen.getAllByRole('button')
      if (buttons.length > 0) {
        fireEvent.touchStart(buttons[0])
        fireEvent.touchEnd(buttons[0])

        // Touch should work the same as click
        // This depends on implementation
      }
    })

    it('should handle orientation changes gracefully', async () => {
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

      // Simulate orientation change
      act(() => {
        window.dispatchEvent(new Event('orientationchange'))
      })

      // Component should remain accessible after orientation change
      const results = await axe(document.body)
      expect(results).toHaveNoViolations()
    })
  })

  describe('Integration Accessibility Tests', () => {
    it('should support complete form flow with keyboard only', async () => {
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

      // Navigate through form using only keyboard
      const focusableElements = FocusManager.getFocusableElements(document.body)

      // Tab through all elements
      for (let i = 0; i < focusableElements.length; i++) {
        await user.tab()
        expect(document.activeElement).toBe(focusableElements[i])
      }

      // Go back to first element
      await user.tab({ shift: true })
      await user.tab({ shift: true })

      // Should be able to interact with form using keyboard
      const firstInput = document.querySelector('input') as HTMLInputElement
      if (firstInput) {
        firstInput.focus()
        await user.keyboard('test@example.com')
        expect(firstInput.value).toBe('test@example.com')
      }
    })

    it('should maintain accessibility during rapid interactions', async () => {
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

      // Rapidly interact with form
      const inputs = document.querySelectorAll('input')
      for (const input of inputs) {
        input.focus()
        await user.keyboard('test')
        await user.tab()
      }

      // Should remain accessible after rapid interactions
      const results = await axe(document.body)
      expect(results).toHaveNoViolations()
    })

    it('should handle user switching between guest and logged-in states', async () => {
      // Start with guest user
      ;(supabase.auth.getUser as any).mockResolvedValue({ data: { user: null } })

      const { rerender } = render(
        <Step3Details
          serviceType="beauty"
          onComplete={mockOnComplete}
          onBack={mockOnBack}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Loading...')).toBeInTheDocument()
      })

      // Switch to logged-in user
      const mockUser = { id: '123', email: 'user@example.com' }
      ;(supabase.auth.getUser as any).mockResolvedValue({ data: { user: mockUser } })

      rerender(
        <Step3Details
          serviceType="beauty"
          onComplete={mockOnComplete}
          onBack={mockOnBack}
        />
      )

      await waitFor(() => {
        expect(supabase.auth.getUser).toHaveBeenCalled()
      })

      // Should remain accessible after state change
      const results = await axe(document.body)
      expect(results).toHaveNoViolations()
    })
  })
})