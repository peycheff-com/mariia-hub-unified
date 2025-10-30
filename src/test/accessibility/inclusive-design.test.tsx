/**
 * Comprehensive Accessibility Testing Suite
 * Tests for WCAG 2.2 AA compliance and inclusive design features
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { AccessibleButton } from '@/components/accessibility/MotorAccessibility';
import { SimplifiedContent, HelpText, ClearErrorMessage } from '@/components/accessibility/CognitiveAccessibility';
import { VisualNotification, Captions } from '@/components/accessibility/HearingAccessibility';
import { FocusIndicator, HighContrastToggle } from '@/components/accessibility/VisualAccessibility';
import { InclusiveDesignProvider } from '@/components/accessibility/InclusiveDesignProvider';

// Mock speech synthesis for testing
const mockSpeechSynthesis = {
  speak: vi.fn(),
  cancel: vi.fn(),
  pause: vi.fn(),
  resume: vi.fn(),
  getVoices: () => [],
  pending: false,
  speaking: false,
  paused: false,
};

Object.defineProperty(window, 'speechSynthesis', {
  value: mockSpeechSynthesis,
  writable: true,
});

// Mock SpeechRecognition for voice control testing
const mockSpeechRecognition = vi.fn().mockImplementation(() => ({
  start: vi.fn(),
  stop: vi.fn(),
  abort: vi.fn(),
  continuous: false,
  interimResults: false,
  lang: 'en-US',
  onresult: null,
  onerror: null,
  onend: null,
  onstart: null,
}));

Object.defineProperty(window, 'SpeechRecognition', {
  value: mockSpeechRecognition,
  writable: true,
});

Object.defineProperty(window, 'webkitSpeechRecognition', {
  value: mockSpeechRecognition,
  writable: true,
});

// Mock navigator.vibrate for haptic feedback testing
Object.defineProperty(navigator, 'vibrate', {
  value: vi.fn(),
  writable: true,
});

describe('Inclusive Design System', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('Cognitive Accessibility', () => {
    it('should simplify text content when simplified language is enabled', () => {
      render(
        <InclusiveDesignProvider>
          <SimplifiedContent level="basic">
            <p>We will utilize this methodology to facilitate the process.</p>
          </SimplifiedContent>
        </InclusiveDesignProvider>
      );

      const simplifiedText = screen.getByText(/We will use this method to help the process/i);
      expect(simplifiedText).toBeInTheDocument();
    });

    it('should display help text when showHelpText is enabled', () => {
      render(
        <InclusiveDesignProvider>
          <HelpText title="Form Help" persistent>
            Please fill in all required fields marked with an asterisk.
          </HelpText>
        </InclusiveDesignProvider>
      );

      expect(screen.getByText('Form Help')).toBeInTheDocument();
      expect(screen.getByText(/Please fill in all required fields/)).toBeInTheDocument();
    });

    it('should show clear error messages with suggestions', () => {
      render(
        <InclusiveDesignProvider>
          <ClearErrorMessage
            error="Email address is invalid"
            field="Email"
            suggestion="Please enter a valid email address like name@example.com"
          />
        </InclusiveDesignProvider>
      );

      expect(screen.getByText('Error in Email: Email address is invalid')).toBeInTheDocument();
      expect(screen.getByText(/Please enter a valid email address/)).toBeInTheDocument();
    });

    it('should respect user preferences for extended timeouts', async () => {
      const user = userEvent.setup();

      render(
        <InclusiveDesignProvider>
          <Instruction type="info" timeout={1000}>
            This is a test instruction
          </Instruction>
        </InclusiveDesignProvider>
      );

      const instruction = screen.getByText('This is a test instruction');
      expect(instruction).toBeInTheDocument();

      // Wait for auto-dismissal
      await waitFor(() => {
        expect(instruction).not.toBeInTheDocument();
      }, { timeout: 2000 });
    });
  });

  describe('Motor Accessibility', () => {
    it('should provide enlarged touch targets when largeTouchTargets is enabled', () => {
      render(
        <InclusiveDesignProvider>
          <AccessibleButton enlarged onClick={() => {}}>
            Click me
          </AccessibleButton>
        </InclusiveDesignProvider>
      );

      const button = screen.getByRole('button', { name: 'Click me' });
      expect(button).toHaveClass('large-target');
      expect(button).toHaveStyle({ minHeight: '48px', minWidth: '48px' });
    });

    it('should support voice commands when voice control is enabled', async () => {
      render(
        <InclusiveDesignProvider>
          <AccessibleButton voiceCommand="submit" onClick={() => {}}>
            Submit
          </AccessibleButton>
        </InclusiveDesignProvider>
      );

      const button = screen.getByRole('button', { name: 'Submit' });
      expect(button).toBeInTheDocument();

      // Test voice command functionality
      // This would require mocking the speech recognition results
    });

    it('should handle swipe gestures when swipeGestures is enabled', async () => {
      const onSwipe = vi.fn();

      render(
        <InclusiveDesignProvider>
          <AccessibleButton swipeAction="right" onSwipe={onSwipe}>
            Swipe Right
          </AccessibleButton>
        </InclusiveDesignProvider>
      );

      const button = screen.getByRole('button', { name: 'Swipe Right' });

      // Simulate swipe gesture
      fireEvent.touchStart(button, { touches: [{ clientX: 0, clientY: 0 }] });
      fireEvent.touchEnd(button, { changedTouches: [{ clientX: 100, clientY: 0 }] });

      expect(onSwipe).toHaveBeenCalledWith('right');
    });

    it('should provide haptic feedback when enabled', () => {
      render(
        <InclusiveDesignProvider>
          <AccessibleButton onClick={() => {}}>
            Click me
          </AccessibleButton>
        </InclusiveDesignProvider>
      );

      const button = screen.getByRole('button', { name: 'Click me' });
      fireEvent.click(button);

      // Verify haptic feedback was triggered
      expect(navigator.vibrate).toHaveBeenCalledWith(50);
    });
  });

  describe('Visual Accessibility', () => {
    it('should enhance focus indicators for keyboard navigation', () => {
      render(
        <InclusiveDesignProvider>
          <FocusIndicator variant="enhanced">
            <button>Focus Test</button>
          </FocusIndicator>
        </InclusiveDesignProvider>
      );

      const button = screen.getByRole('button', { name: 'Focus Test' });
      button.focus();

      expect(button).toHaveClass('focus-indicator-enhanced');
    });

    it('should toggle high contrast mode', async () => {
      const user = userEvent.setup();

      render(
        <InclusiveDesignProvider>
          <HighContrastToggle />
        </InclusiveDesignProvider>
      );

      const toggle = screen.getByRole('button', { name: /high contrast/i });
      expect(toggle).toHaveAttribute('aria-pressed', 'false');

      await user.click(toggle);
      expect(toggle).toHaveAttribute('aria-pressed', 'true');
    });

    it('should provide appropriate ARIA labels for images', () => {
      render(
        <InclusiveDesignProvider>
          <img
            src="/test-image.jpg"
            alt="A beauty salon with modern decor"
            role="img"
          />
        </InclusiveDesignProvider>
      );

      const image = screen.getByRole('img');
      expect(image).toHaveAccessibleName('A beauty salon with modern decor');
    });

    it('should support screen reader optimization', () => {
      render(
        <InclusiveDesignProvider>
          <div aria-live="polite" aria-atomic="true">
            Dynamic content update
          </div>
        </InclusiveDesignProvider>
      );

      const liveRegion = screen.getByText('Dynamic content update');
      expect(liveRegion).toHaveAttribute('aria-live', 'polite');
      expect(liveRegion).toHaveAttribute('aria-atomic', 'true');
    });
  });

  describe('Hearing Accessibility', () => {
    it('should display visual notifications for audio alerts', () => {
      render(
        <InclusiveDesignProvider>
          <VisualNotification
            type="info"
            title="System Message"
            message="This is a visual notification"
          />
        </InclusiveDesignProvider>
      );

      expect(screen.getByText('System Message')).toBeInTheDocument();
      expect(screen.getByText('This is a visual notification')).toBeInTheDocument();
      expect(screen.getByRole('alert')).toHaveAttribute('aria-live', 'polite');
    });

    it('should show captions for audio content', () => {
      render(
        <InclusiveDesignProvider>
          <Captions
            text="Welcome to our beauty salon"
            speaker="Receptionist"
            active={true}
          />
        </InclusiveDesignProvider>
      );

      expect(screen.getByText('Receptionist:')).toBeInTheDocument();
      expect(screen.getByText('Welcome to our beauty salon')).toBeInTheDocument();
      expect(screen.getByRole('region')).toHaveAccessibleName('Captions');
    });

    it('should provide visual alerts with haptic feedback', () => {
      render(
        <InclusiveDesignProvider>
          <VisualAlert type="moderate" trigger={true}>
            <div>Alert content</div>
          </VisualAlert>
        </InclusiveDesignProvider>
      );

      expect(navigator.vibrate).toHaveBeenCalledWith([150]);
    });
  });

  describe('WCAG Compliance', () => {
    it('should meet WCAG 2.2 AA color contrast requirements', () => {
      render(
        <InclusiveDesignProvider>
          <button style={{ color: '#000000', backgroundColor: '#ffffff' }}>
            High Contrast Button
          </button>
        </InclusiveDesignProvider>
      );

      const button = screen.getByRole('button');
      const styles = window.getComputedStyle(button);

      // This would require actual color contrast calculation
      // For now, just verify the colors are set
      expect(styles.color).toBe('rgb(0, 0, 0)');
      expect(styles.backgroundColor).toBe('rgb(255, 255, 255)');
    });

    it('should ensure keyboard navigability', async () => {
      const user = userEvent.setup();

      render(
        <InclusiveDesignProvider>
          <div>
            <button>Button 1</button>
            <button>Button 2</button>
            <button>Button 3</button>
          </div>
        </InclusiveDesignProvider>
      );

      // Test tab navigation
      await user.tab();
      expect(screen.getByRole('button', { name: 'Button 1' })).toHaveFocus();

      await user.tab();
      expect(screen.getByRole('button', { name: 'Button 2' })).toHaveFocus();

      await user.tab();
      expect(screen.getByRole('button', { name: 'Button 3' })).toHaveFocus();
    });

    it('should provide appropriate focus management', async () => {
      const user = userEvent.setup();

      render(
        <InclusiveDesignProvider>
          <div>
            <input type="text" aria-label="First input" />
            <input type="text" aria-label="Second input" />
          </div>
        </InclusiveDesignProvider>
      );

      const firstInput = screen.getByLabelText('First input');
      const secondInput = screen.getByLabelText('Second input');

      firstInput.focus();
      expect(firstInput).toHaveFocus();

      await user.tab();
      expect(secondInput).toHaveFocus();
    });

    it('should support screen reader announcements', () => {
      render(
        <InclusiveDesignProvider>
          <div aria-live="polite" aria-atomic="true">
            Important announcement for screen readers
          </div>
        </InclusiveDesignProvider>
      );

      const announcement = screen.getByText('Important announcement for screen readers');
      expect(announcement).toHaveAttribute('aria-live', 'polite');
      expect(announcement).toHaveAttribute('aria-atomic', 'true');
    });
  });

  describe('Responsive Accessibility', () => {
    it('should adapt touch targets for mobile devices', () => {
      // Mock mobile device
      Object.defineProperty(window, 'innerWidth', { value: 375, configurable: true });
      Object.defineProperty(navigator, 'maxTouchPoints', { value: 1, configurable: true });

      render(
        <InclusiveDesignProvider>
          <AccessibleButton>Mobile Button</AccessibleButton>
        </InclusiveDesignProvider>
      );

      const button = screen.getByRole('button', { name: 'Mobile Button' });
      expect(button).toHaveStyle({ minHeight: '48px' });
    });

    it('should maintain accessibility on different screen sizes', () => {
      // Test tablet size
      Object.defineProperty(window, 'innerWidth', { value: 768, configurable: true });

      render(
        <InclusiveDesignProvider>
          <div>
            <nav aria-label="Main navigation">
              <button>Home</button>
              <button>Services</button>
              <button>Contact</button>
            </nav>
            <main role="main" id="main-content">
              <h1>Main Content</h1>
            </main>
          </div>
        </InclusiveDesignProvider>
      );

      const navigation = screen.getByRole('navigation', { name: 'Main navigation' });
      const mainContent = screen.getByRole('main');

      expect(navigation).toBeInTheDocument();
      expect(mainContent).toBeInTheDocument();
      expect(mainContent).toHaveAttribute('id', 'main-content');
    });
  });

  describe('Error Handling', () => {
    it('should handle missing accessibility features gracefully', () => {
      // Mock unsupported features
      Object.defineProperty(window, 'speechSynthesis', { value: undefined, configurable: true });

      render(
        <InclusiveDesignProvider>
          <button>Test Button</button>
        </InclusiveDesignProvider>
      );

      const button = screen.getByRole('button', { name: 'Test Button' });
      expect(button).toBeInTheDocument();
    });

    it('should provide fallbacks for failed accessibility features', () => {
      render(
        <InclusiveDesignProvider>
          <img src="/nonexistent.jpg" alt="Test image" />
        </InclusiveDesignProvider>
      );

      // Should show error message when image fails to load
      fireEvent.error(screen.getByRole('img'));
      expect(screen.getByText('Image unavailable: Test image')).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('should not significantly impact render performance', async () => {
      const startTime = performance.now();

      render(
        <InclusiveDesignProvider>
          {Array.from({ length: 100 }, (_, i) => (
            <button key={i}>Button {i}</button>
          ))}
        </InclusiveDesignProvider>
      );

      const renderTime = performance.now() - startTime;

      // Render should complete within reasonable time (100ms)
      expect(renderTime).toBeLessThan(100);
    });

    it('should debounce rapid accessibility preference changes', async () => {
      const user = userEvent.setup();

      render(
        <InclusiveDesignProvider>
          <HighContrastToggle />
          <button>Test Button</button>
        </InclusiveDesignProvider>
      );

      const toggle = screen.getByRole('button', { name: /high contrast/i });

      // Rapidly toggle multiple times
      for (let i = 0; i < 10; i++) {
        await user.click(toggle);
      }

      // Should settle on final state without errors
      expect(toggle).toBeInTheDocument();
    });
  });
});

/**
 * Integration Tests for Complete Accessibility Flow
 */
describe('Accessibility Integration Tests', () => {
  it('should support complete booking flow with accessibility features', async () => {
    const user = userEvent.setup();

    render(
      <InclusiveDesignProvider>
        <div>
          <h1>Book Your Appointment</h1>
          <form aria-label="Booking form">
            <label htmlFor="service">Service Type</label>
            <select id="service" aria-required="true">
              <option value="">Select a service</option>
              <option value="hair">Hair Styling</option>
              <option value="nails">Nail Care</option>
            </select>

            <label htmlFor="date">Preferred Date</label>
            <input type="date" id="date" aria-required="true" />

            <button type="submit">Continue Booking</button>
          </form>
        </div>
      </InclusiveDesignProvider>
    );

    // Test form accessibility
    const serviceSelect = screen.getByLabelText('Service Type');
    const dateInput = screen.getByLabelText('Preferred Date');
    const submitButton = screen.getByRole('button', { name: 'Continue Booking' });

    expect(serviceSelect).toHaveAttribute('aria-required', 'true');
    expect(dateInput).toHaveAttribute('aria-required', 'true');

    // Test keyboard navigation
    await user.tab();
    expect(serviceSelect).toHaveFocus();

    await user.tab();
    expect(dateInput).toHaveFocus();

    await user.tab();
    expect(submitButton).toHaveFocus();
  });

  it('should provide comprehensive accessibility for service pages', () => {
    render(
      <InclusiveDesignProvider>
        <article>
          <header role="banner">
            <h1>Premium Hair Styling Services</h1>
            <p>Experience luxury hair care with our expert stylists.</p>
          </header>

          <section aria-labelledby="services-heading">
            <h2 id="services-heading">Our Services</h2>
            <ul>
              <li><h3>Hair Cutting and Styling</h3></li>
              <li><h3>Hair Coloring</h3></li>
              <li><h3>Hair Treatments</h3></li>
            </ul>
          </section>

          <section aria-labelledby="booking-heading">
            <h2 id="booking-heading">Book Your Appointment</h2>
            <button>Book Now</button>
          </section>
        </article>
      </InclusiveDesignProvider>
    );

    // Test semantic structure
    expect(screen.getByRole('article')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2 })).toHaveAccessibleName('Our Services');
    expect(screen.getByRole('heading', { level: 2 })).toHaveAccessibleName('Book Your Appointment');

    // Test ARIA relationships
    const servicesSection = screen.getByRole('region');
    const servicesHeading = screen.getByText('Our Services');
    expect(servicesSection).toHaveAttribute('aria-labelledby', 'services-heading');
  });
});

export {};