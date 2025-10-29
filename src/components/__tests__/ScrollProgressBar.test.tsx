import { render, screen, fireEvent } from '@testing-library/react';
import ScrollProgressBar from '../ScrollProgressBar';

// Mock window object properties that don't exist in test environment
Object.defineProperty(window, 'innerHeight', { value: 800, writable: true });
Object.defineProperty(window, 'scrollY', { value: 0, writable: true });
Object.defineProperty(document.documentElement, 'scrollHeight', { value: 2000, writable: true });

describe('ScrollProgressBar', () => {
  beforeEach(() => {
    // Reset window values before each test
    window.scrollY = 0;
    document.documentElement.scrollHeight = 2000;
    window.innerHeight = 800;
  });

  it('renders without errors', () => {
    render(<ScrollProgressBar />);

    const progressBar = document.querySelector('.fixed.top-0.left-0.right-0');
    expect(progressBar).toBeInTheDocument();
  });

  it('has correct initial styles', () => {
    render(<ScrollProgressBar />);

    const container = document.querySelector('.fixed.top-0');
    const indicator = container?.firstChild as HTMLElement;

    expect(container).toHaveClass(
      'fixed', 'top-0', 'left-0', 'right-0',
      'h-1', 'bg-transparent', 'z-50', 'pointer-events-none'
    );

    expect(indicator).toHaveClass(
      'h-full', 'bg-gradient-to-r', 'from-champagne',
      'via-rose-gold', 'to-bronze', 'transition-all',
      'duration-150', 'ease-out', 'shadow-lg'
    );
  });

  it('calculates initial scroll progress correctly', () => {
    render(<ScrollProgressBar />);

    const indicator = document.querySelector('.fixed .bg-gradient-to-r') as HTMLElement;

    // At scrollY = 0, documentHeight = 2000, windowHeight = 800
    // totalScrollable = 2000 - 800 = 1200
    // progress = (0 / 1200) * 100 = 0%
    expect(indicator).toHaveStyle({ width: '0%' });
  });

  it('updates progress when scroll changes', () => {
    render(<ScrollProgressBar />);

    const indicator = document.querySelector('.fixed .bg-gradient-to-r') as HTMLElement;

    // Initially should be 0%
    expect(indicator).toHaveStyle({ width: '0%' });

    // Simulate scrolling to 50% of total scrollable distance
    Object.defineProperty(window, 'scrollY', { value: 600, writable: true });

    // Trigger scroll event
    fireEvent.scroll(window, { target: window });

    // At scrollY = 600, progress = (600 / 1200) * 100 = 50%
    expect(indicator).toHaveStyle({ width: '50%' });
  });

  it('caps progress at 100%', () => {
    render(<ScrollProgressBar />);

    const indicator = document.querySelector('.fixed .bg-gradient-to-r') as HTMLElement;

    // Simulate scrolling beyond maximum
    Object.defineProperty(window, 'scrollY', { value: 1500, writable: true });

    // Trigger scroll event
    fireEvent.scroll(window, { target: window });

    // At scrollY = 1500, progress = (1500 / 1200) * 100 = 125%
    // Should be capped at 100%
    expect(indicator).toHaveStyle({ width: '100%' });
  });

  it('handles full page scroll', () => {
    render(<ScrollProgressBar />);

    const indicator = document.querySelector('.fixed .bg-gradient-to-r') as HTMLElement;

    // Scroll to bottom (maximum)
    Object.defineProperty(window, 'scrollY', { value: 1200, writable: true });

    // Trigger scroll event
    fireEvent.scroll(window, { target: window });

    // At scrollY = 1200, progress = (1200 / 1200) * 100 = 100%
    expect(indicator).toHaveStyle({ width: '100%' });
  });

  it('handles zero document height gracefully', () => {
    document.documentElement.scrollHeight = 0;

    render(<ScrollProgressBar />);

    const indicator = document.querySelector('.fixed .bg-gradient-to-r') as HTMLElement;

    // Should not crash and default to 0%
    expect(indicator).toHaveStyle({ width: '0%' });
  });

  it('handles edge cases with small documents', () => {
    // Document smaller than window
    document.documentElement.scrollHeight = 400;
    window.innerHeight = 800;

    render(<ScrollProgressBar />);

    const indicator = document.querySelector('.fixed .bg-gradient-to-r') as HTMLElement;

    // Should handle gracefully without division by zero or negative values
    expect(indicator).toBeInTheDocument();
    expect(indicator).toHaveStyle({ width: '0%' });
  });

  it('cleans up event listeners on unmount', () => {
    const { unmount } = render(<ScrollProgressBar />);

    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('scroll', expect.any(Function), { passive: true });

    removeEventListenerSpy.mockRestore();
  });

  it('adds event listeners correctly on mount', () => {
    const addEventListenerSpy = vi.spyOn(window, 'addEventListener');

    render(<ScrollProgressBar />);

    expect(addEventListenerSpy).toHaveBeenCalledWith('scroll', expect.any(Function), { passive: true });

    addEventListenerSpy.mockRestore();
  });

  it('has correct positioning and z-index', () => {
    render(<ScrollProgressBar />);

    const container = document.querySelector('.fixed.top-0');

    expect(container).toHaveClass('fixed', 'top-0', 'left-0', 'right-0');
    expect(container).toHaveClass('z-50');
  });

  it('is non-interactive', () => {
    render(<ScrollProgressBar />);

    const container = document.querySelector('.fixed.top-0');

    expect(container).toHaveClass('pointer-events-none');
  });

  it('has correct dimensions', () => {
    render(<ScrollProgressBar />);

    const container = document.querySelector('.fixed.top-0');
    const indicator = container?.firstChild;

    expect(container).toHaveClass('h-1');
    expect(indicator).toHaveClass('h-full');
  });

  it('applies gradient styles correctly', () => {
    render(<ScrollProgressBar />);

    const indicator = document.querySelector('.bg-gradient-to-r');

    expect(indicator).toHaveClass(
      'from-champagne', 'via-rose-gold', 'to-bronze'
    );
  });

  it('has smooth transition effects', () => {
    render(<ScrollProgressBar />);

    const indicator = document.querySelector('.bg-gradient-to-r');

    expect(indicator).toHaveClass('transition-all', 'duration-150', 'ease-out');
  });

  it('has shadow effect', () => {
    render(<ScrollProgressBar />);

    const indicator = document.querySelector('.bg-gradient-to-r');

    expect(indicator).toHaveClass('shadow-lg');
  });
});