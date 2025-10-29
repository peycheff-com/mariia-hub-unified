import { render, unmount as testingUnmount } from '@testing-library/react';

import { Progress } from '../progress';

describe('Progress', () => {
  it('renders without errors', () => {
    expect(() => {
      render(<Progress value={50} />);
    }).not.toThrow();
  });

  it('renders with default styles', () => {
    const { container } = render(<Progress value={50} />);

    const progressElement = container.firstChild;
    expect(progressElement).toBeInTheDocument();
    expect(progressElement).toHaveClass('relative', 'h-4', 'w-full', 'overflow-hidden', 'rounded-full');
  });

  it('applies custom className', () => {
    const { container } = render(<Progress value={50} className="custom-progress" />);

    const progressElement = container.firstChild;
    expect(progressElement).toHaveClass('custom-progress');
  });

  it('handles different values', () => {
    const testValues = [0, 25, 50, 75, 100];

    testValues.forEach(value => {
      const { container, unmount } = render(<Progress value={value} />);

      const progressElement = container.firstChild;
      expect(progressElement).toBeInTheDocument();

      testingUnmount();
    });
  });

  it('handles undefined and null values gracefully', () => {
    const testValues = [undefined, null];

    testValues.forEach(value => {
      const { container, unmount } = render(<Progress value={value} />);

      const progressElement = container.firstChild;
      expect(progressElement).toBeInTheDocument();

      testingUnmount();
    });
  });

  it('renders indicator element', () => {
    const { container } = render(<Progress value={50} />);

    const progressElement = container.firstChild as HTMLElement;
    const indicator = progressElement.querySelector('[data-state="indeterminate"]');

    expect(indicator).toBeInTheDocument();
    expect(indicator).toHaveClass('h-full', 'w-full', 'flex-1', 'bg-primary', 'transition-all');
  });

  it('applies correct transform based on value', () => {
    const testCases = [
      { value: 0, expectedTransform: 'translateX(-100%)' },
      { value: 50, expectedTransform: 'translateX(-50%)' },
      { value: 100, expectedTransform: 'translateX(0%)' },
    ];

    testCases.forEach(({ value, expectedTransform }) => {
      const { container, unmount } = render(<Progress value={value} />);

      const indicator = container.querySelector('[data-state="indeterminate"]');
      const style = indicator?.getAttribute('style');

      expect(style).toContain(expectedTransform);

      testingUnmount();
    });
  });

  it('supports additional props', () => {
    const { container } = render(<Progress value={50} data-testid="custom-progress" id="progress-1" />);

    const progressElement = container.firstChild as HTMLElement;
    expect(progressElement).toHaveAttribute('data-testid', 'custom-progress');
    expect(progressElement).toHaveAttribute('id', 'progress-1');
  });

  it('forwards ref correctly', () => {
    const ref = { current: null };

    render(<Progress value={50} ref={ref} />);

    expect(ref.current).toBeInstanceOf(HTMLElement);
  });
});