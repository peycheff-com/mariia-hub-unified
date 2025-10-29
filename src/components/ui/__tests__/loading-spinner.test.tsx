import { render, screen } from '@testing-library/react';

import { LoadingSpinner } from '../loading-spinner';

describe('LoadingSpinner', () => {
  it('renders with default props', () => {
    render(<LoadingSpinner />);

    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveClass('w-6', 'h-6'); // md size
    expect(spinner).toHaveClass('border-2', 'border-gray-300', 'border-t-primary');
    expect(spinner).toHaveClass('rounded-full');
  });

  it('renders with small size', () => {
    render(<LoadingSpinner size="sm" />);

    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toHaveClass('w-4', 'h-4');
    expect(spinner).not.toHaveClass('w-6', 'h-6', 'w-8', 'h-8');
  });

  it('renders with large size', () => {
    render(<LoadingSpinner size="lg" />);

    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toHaveClass('w-8', 'h-8');
    expect(spinner).not.toHaveClass('w-4', 'h-4', 'w-6', 'h-6');
  });

  it('applies custom className', () => {
    render(<LoadingSpinner className="custom-test-class" />);

    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toHaveClass('custom-test-class');
    expect(spinner).toHaveClass('w-6', 'h-6'); // Should also keep default classes
  });

  it('has proper accessibility attributes', () => {
    render(<LoadingSpinner />);

    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();

    // Loading spinners should have proper accessibility (can be enhanced later)
    expect(spinner).toBeVisible();
  });

  it('renders without errors when no props provided', () => {
    expect(() => {
      render(<LoadingSpinner />);
    }).not.toThrow();
  });

  it('renders as a div element', () => {
    render(<LoadingSpinner />);

    const spinner = document.querySelector('.animate-spin');
    expect(spinner?.tagName.toLowerCase()).toBe('div');
  });

  it('has animation classes', () => {
    render(<LoadingSpinner />);

    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toHaveClass('animate-spin');
  });

  it('maintains consistent border styling across sizes', () => {
    const { rerender } = render(<LoadingSpinner size="sm" />);

    const checkBorderStyles = () => {
      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toHaveClass('border-2', 'border-gray-300', 'border-t-primary');
      expect(spinner).toHaveClass('rounded-full');
    };

    // Small size
    checkBorderStyles();

    // Medium size (rerender)
    rerender(<LoadingSpinner size="md" />);
    checkBorderStyles();

    // Large size (rerender)
    rerender(<LoadingSpinner size="lg" />);
    checkBorderStyles();
  });

  it('combines classes correctly', () => {
    render(<LoadingSpinner size="lg" className="mt-4 mb-2" />);

    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toHaveClass(
      'animate-spin',
      'rounded-full',
      'border-2',
      'border-gray-300',
      'border-t-primary',
      'w-8', // lg size
      'h-8', // lg size
      'mt-4', // custom class
      'mb-2'  // custom class
    );
  });

  it('is properly visible for loading indication', () => {
    render(<LoadingSpinner />);

    const spinner = document.querySelector('.animate-spin');
    // Loading indicators should be visible to users
    expect(spinner).toBeVisible();
    expect(spinner).toHaveClass('animate-spin');
  });
});