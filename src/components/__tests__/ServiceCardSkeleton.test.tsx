import { render, screen } from '@testing-library/react';

import ServiceCardSkeleton from '../ServiceCardSkeleton';

describe('ServiceCardSkeleton', () => {
  it('renders skeleton loading structure correctly', () => {
    render(<ServiceCardSkeleton />);

    // Main container
    const skeletonCard = screen.getByRole('generic', { name: '' }).querySelector('.h-full.p-6');
    expect(skeletonCard).toBeInTheDocument();
    expect(skeletonCard).toHaveClass('border-2', 'border-border', 'rounded-2xl', 'min-h-[180px]');
  });

  it('displays placeholder elements in correct layout', () => {
    render(<ServiceCardSkeleton />);

    // Avatar/Icon placeholder
    const avatarSkeleton = screen.getByRole('generic').querySelector('.w-10.h-10.rounded-full');
    expect(avatarSkeleton).toBeInTheDocument();

    // Content lines
    const titleSkeleton = screen.getByRole('generic').querySelector('.h-6.w-3\\/4');
    expect(titleSkeleton).toBeInTheDocument();

    const descriptionLine1 = screen.getByRole('generic').querySelector('.h-4.w-full');
    expect(descriptionLine1).toBeInTheDocument();

    const descriptionLine2 = screen.getByRole('generic').querySelector('.h-4.w-5\\/6');
    expect(descriptionLine2).toBeInTheDocument();

    // Footer elements
    const footerSkeletons = screen.getByRole('generic').querySelectorAll('.pt-4 .h-4');
    expect(footerSkeletons).toHaveLength(2);

    const priceSkeleton = screen.getByRole('generic').querySelector('.pt-4 .w-20');
    expect(priceSkeleton).toBeInTheDocument();

    const actionSkeleton = screen.getByRole('generic').querySelector('.pt-4 .w-24');
    expect(actionSkeleton).toBeInTheDocument();
  });

  it('has proper accessibility attributes', () => {
    render(<ServiceCardSkeleton />);

    // Check that skeleton elements have proper structure
    const skeletonElements = document.querySelectorAll('[class*="animate-pulse"], [class*="bg-muted"]');

    // Skeleton loading elements should be present
    expect(skeletonElements.length).toBeGreaterThan(0);

    // Main container should not be interactive
    const container = document.querySelector('.h-full.p-6');
    expect(container).not.toHaveAttribute('role');
  });

  it('maintains consistent spacing and layout', () => {
    const { container } = render(<ServiceCardSkeleton />);

    // Check that main container exists
    const mainContainer = container.firstChild;
    expect(mainContainer).toBeInTheDocument();

    // Check spacing structure
    const spaceY4Containers = container.querySelectorAll('.space-y-4');
    expect(spaceY4Containers).toHaveLength(1);

    const spaceY2Containers = container.querySelectorAll('.space-y-2');
    expect(spaceY2Containers).toHaveLength(1);

    // Border separator
    const borderTop = container.querySelector('.pt-4.border-t');
    expect(borderTop).toBeInTheDocument();
  });

  it('renders without errors when no props provided', () => {
    expect(() => {
      render(<ServiceCardSkeleton />);
    }).not.toThrow();
  });

  it('is accessible for keyboard navigation', () => {
    render(<ServiceCardSkeleton />);

    // Skeleton shouldn't be focusable (it's just a loading state)
    const focusableElements = screen.getAllByRole('button', { hidden: true });
    expect(focusableElements.length).toBe(0);
  });

  it('has proper CSS classes for responsive design', () => {
    render(<ServiceCardSkeleton />);

    const container = screen.getByRole('generic').querySelector('.h-full');
    expect(container).toHaveClass('h-full');
  });
});