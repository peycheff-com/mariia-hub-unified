import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { CurrencyProvider } from '@/contexts/CurrencyContext';
import { ServicePackage } from '@/services/packageService';

import PackageCard from '../PackageCard';

// Mock currency context
const mockCurrencyValue = {
  formatPrice: (price: number) => `${price} zł`,
  currency: 'PLN',
  setCurrency: vi.fn(),
};

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <CurrencyProvider value={mockCurrencyValue}>
        <I18nextProvider i18n={{ language: 'en' } as any}>
          {children}
        </I18nextProvider>
      </CurrencyProvider>
    </QueryClientProvider>
  );
};

describe('PackageCard', () => {
  const mockPackage: ServicePackage = {
    id: '1',
    name: 'Test Package',
    slug: 'test-package',
    description: 'A test package description',
    service_id: 'service-1',
    session_count: 5,
    original_price: 500,
    package_price: 400,
    savings_amount: 100,
    savings_percentage: 20,
    validity_days: 365,
    is_active: true,
    is_featured: false,
    display_order: 0,
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
    service: {
      id: 'service-1',
      title: 'Test Service',
      slug: 'test-service',
      service_type: 'beauty',
      duration_minutes: 60,
      image_url: 'https://example.com/image.jpg',
    },
  };

  it('renders package information correctly', () => {
    render(<PackageCard package={mockPackage} />, { wrapper: createWrapper() });

    expect(screen.getByText('Test Package')).toBeInTheDocument();
    expect(screen.getByText('A test package description')).toBeInTheDocument();
    expect(screen.getByText('400 zł')).toBeInTheDocument();
    expect(screen.getByText('500 zł')).toBeInTheDocument();
    expect(screen.getByText('20% Save')).toBeInTheDocument(); // Icon + text
    expect(screen.getByText('(100 zł)')).toBeInTheDocument();
    expect(screen.getByText('1 year(s)')).toBeInTheDocument(); // 365 days = 1 year
    expect(screen.getByText('5 sessions')).toBeInTheDocument();
  });

  it('displays beauty badge for beauty service', () => {
    render(<PackageCard package={mockPackage} />, { wrapper: createWrapper() });

    expect(screen.getByText('Beauty')).toBeInTheDocument();
  });

  it('displays fitness badge for fitness service', async () => {
    const fitnessPackage = {
      ...mockPackage,
      service: {
        ...mockPackage.service!,
        service_type: 'fitness' as const,
      },
    };

    render(<PackageCard package={fitnessPackage} />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Fitness')).toBeInTheDocument();
    });
  });

  it('shows featured badge for featured packages', () => {
    const featuredPackage = {
      ...mockPackage,
      is_featured: true,
    };

    render(<PackageCard package={featuredPackage} />, { wrapper: createWrapper() });

    expect(screen.getByText('Featured')).toBeInTheDocument();
  });

  it('shows custom badge text', () => {
    const badgedPackage = {
      ...mockPackage,
      badge_text: 'Best Value',
    };

    render(<PackageCard package={badgedPackage} />, { wrapper: createWrapper() });

    expect(screen.getByText('Best Value')).toBeInTheDocument();
  });

  it('displays expiring soon badge', () => {
    const expiringPackage = {
      ...mockPackage,
      valid_until: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days from now
    };

    render(<PackageCard package={expiringPackage} />, { wrapper: createWrapper() });

    expect(screen.getByText('Expiring Soon')).toBeInTheDocument();
  });

  it('displays expired badge and disables purchase', () => {
    const expiredPackage = {
      ...mockPackage,
      valid_until: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days ago
    };

    render(<PackageCard package={expiredPackage} />, { wrapper: createWrapper() });

    expect(screen.getByText('Expired')).toBeInTheDocument();
    expect(screen.getByText('Expired').closest('button')).toBeDisabled();
  });

  it('calls onPurchase when purchase button is clicked', async () => {
    const onPurchase = vi.fn();
    render(<PackageCard package={mockPackage} onPurchase={onPurchase} />, { wrapper: createWrapper() });

    const purchaseButton = screen.getByText('Purchase Package');
    fireEvent.click(purchaseButton);

    await waitFor(() => {
      expect(onPurchase).toHaveBeenCalledWith(mockPackage);
    });
  });

  it('calls onInfo when info button is clicked', async () => {
    const onInfo = vi.fn();
    render(<PackageCard package={mockPackage} onInfo={onInfo} />, { wrapper: createWrapper() });

    const infoButton = screen.getByText('Info');
    fireEvent.click(infoButton);

    await waitFor(() => {
      expect(onInfo).toHaveBeenCalledWith(mockPackage);
    });
  });

  it('displays benefits correctly', () => {
    const packageWithBenefits = {
      ...mockPackage,
      benefits: ['Benefit 1', 'Benefit 2', 'Benefit 3'],
    };

    render(<PackageCard package={packageWithBenefits} />, { wrapper: createWrapper() });

    expect(screen.getByText('Benefit 1')).toBeInTheDocument();
    expect(screen.getByText('Benefit 2')).toBeInTheDocument();
    expect(screen.getByText('Benefit 3')).toBeInTheDocument();
  });

  it('truncates benefits when more than 3', () => {
    const packageWithManyBenefits = {
      ...mockPackage,
      benefits: ['Benefit 1', 'Benefit 2', 'Benefit 3', 'Benefit 4', 'Benefit 5'],
    };

    render(<PackageCard package={packageWithManyBenefits} />, { wrapper: createWrapper() });

    expect(screen.getByText('Benefit 1')).toBeInTheDocument();
    expect(screen.getByText('Benefit 2')).toBeInTheDocument();
    expect(screen.getByText('Benefit 3')).toBeInTheDocument();
    expect(screen.getByText('2 more benefits')).toBeInTheDocument();
    expect(screen.queryByText('Benefit 4')).not.toBeInTheDocument();
  });

  it('renders compact variant correctly', () => {
    render(<PackageCard package={mockPackage} variant="compact" />, { wrapper: createWrapper() });

    expect(screen.getByText('Test Package')).toBeInTheDocument();
    expect(screen.getByText('400 zł')).toBeInTheDocument();
    expect(screen.getByText('20% Save')).toBeInTheDocument(); // Icon + text
    expect(screen.getByText('1 year(s)')).toBeInTheDocument(); // 365 days = 1 year
    expect(screen.getByText('5 sessions')).toBeInTheDocument();
    // Should not show full description in compact mode
    expect(screen.queryByText('A test package description')).not.toBeInTheDocument();
  });

  it('does not show savings when there are none', () => {
    const packageWithoutSavings = {
      ...mockPackage,
      original_price: null,
      savings_amount: 0,
      savings_percentage: 0,
    };

    render(<PackageCard package={packageWithoutSavings} />, { wrapper: createWrapper() });

    expect(screen.queryByText('Save')).not.toBeInTheDocument();
    expect(screen.queryByText('%')).not.toBeInTheDocument();
  });

  it('shows progress bar when showProgress is true', () => {
    render(<PackageCard package={mockPackage} showProgress currentProgress={2} />, { wrapper: createWrapper() });

    expect(screen.getByText('Progress')).toBeInTheDocument();
    expect(screen.getByText('40%')).toBeInTheDocument();
  });
});