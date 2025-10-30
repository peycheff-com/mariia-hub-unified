import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';

import { packageService } from '@/services/packageService';

import PackageList from '../PackageList';

// Mock packageService
vi.mock('@/services/packageService', () => ({
  packageService: {
    getServicePackages: vi.fn(),
  },
}));

// Mock currency context
vi.mock('@/contexts/CurrencyContext', () => ({
  useCurrency: () => ({
    formatPrice: (price: number) => `${price} PLN`,
    currency: 'PLN',
    setCurrency: vi.fn(),
  }),
}));

// Mock toast aria-live="polite" aria-atomic="true"
vi.mock('@/components/ui/use-toast aria-live="polite" aria-atomic="true"', () => ({
  useToast: () => ({
    toast aria-live="polite" aria-atomic="true": vi.fn(),
  }),
}));

const mockPackages = [
  {
    id: '1',
    name: 'Beauty Package',
    slug: 'beauty-package',
    description: 'A beauty package',
    service_id: 'beauty-svc',
    session_count: 5,
    original_price: 500,
    package_price: 400,
    savings_percentage: 20,
    validity_days: 365,
    is_active: true,
    is_featured: true,
    display_order: 0,
    service: {
      id: 'beauty-svc',
      title: 'Beauty Service',
      slug: 'beauty-service',
      service_type: 'beauty',
    },
  },
  {
    id: '2',
    name: 'Fitness Package',
    slug: 'fitness-package',
    description: 'A fitness package',
    service_id: 'fitness-svc',
    session_count: 10,
    original_price: 1000,
    package_price: 800,
    savings_percentage: 20,
    validity_days: 180,
    is_active: true,
    is_featured: false,
    display_order: 1,
    service: {
      id: 'fitness-svc',
      title: 'Fitness Service',
      slug: 'fitness-service',
      service_type: 'fitness',
    },
  },
];

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <I18nextProvider i18n={{ language: 'en' } as any}>
          {children}
        </I18nextProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('PackageList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders packages correctly', async () => {
    vi.mocked(packageService.getServicePackages).mockResolvedValue(mockPackages);

    render(<PackageList />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Beauty Package')).toBeInTheDocument();
      expect(screen.getByText('Fitness Package')).toBeInTheDocument();
      expect(screen.getByText('A beauty package')).toBeInTheDocument();
      expect(screen.getByText('A fitness package')).toBeInTheDocument();
    });
  });

  it('shows loading state', () => {
    vi.mocked(packageService.getServicePackages).mockReturnValue(new Promise(() => {}));

    render(<PackageList />, { wrapper: createWrapper() });

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('filters packages by category', async () => {
    vi.mocked(packageService.getServicePackages).mockResolvedValue(mockPackages);

    render(<PackageList />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('All Packages')).toBeInTheDocument();
    });

    // Click on Beauty category
    const beautyCategory = screen.getByText('Beauty');
    fireEvent.click(beautyCategory);

    await waitFor(() => {
      expect(packageService.getServicePackages).toHaveBeenCalledWith({
        category: 'beauty',
        limit: 100,
        offset: 0,
        sort_by: 'popularity',
        sort_order: 'desc',
      });
    });
  });

  it('searches packages', async () => {
    vi.mocked(packageService.getServicePackages).mockResolvedValue(mockPackages);

    render(<PackageList />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Search packages...')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Search packages...');
    fireEvent.change(searchInput, { target: { value: 'Beauty' } });

    await waitFor(() => {
      expect(screen.getByText('Beauty Package')).toBeInTheDocument();
      expect(screen.queryByText('Fitness Package')).not.toBeInTheDocument();
    });
  });

  it('sorts packages', async () => {
    vi.mocked(packageService.getServicePackages).mockResolvedValue(mockPackages);

    render(<PackageList />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Most Popular')).toBeInTheDocument();
    });

    // Change sort order
    const sortSelect = screen.getByText('Most Popular').closest('button');
    if (sortSelect) {
      fireEvent.click(sortSelect);
    }

    await waitFor(() => {
      expect(screen.getByText('Price: Low to High')).toBeInTheDocument();
    });

    const priceSortOption = screen.getByText('Price: Low to High');
    fireEvent.click(priceSortOption);

    await waitFor(() => {
      expect(packageService.getServicePackages).toHaveBeenCalledWith({
        limit: 100,
        offset: 0,
        sort_by: 'price',
        sort_order: 'asc',
      });
    });
  });

  it('switches between grid and list view', async () => {
    vi.mocked(packageService.getServicePackages).mockResolvedValue(mockPackages);

    render(<PackageList />, { wrapper: createWrapper() });

    await waitFor(() => {
      // Should start in grid view
      expect(screen.getByTestId('package-grid')).toBeInTheDocument();
    });

    // Click list view button
    const listViewButton = screen.getByLabelText('List view');
    fireEvent.click(listViewButton);

    await waitFor(() => {
      expect(screen.getByTestId('package-list')).toBeInTheDocument();
    });
  });

  it('shows no results when no packages match', async () => {
    vi.mocked(packageService.getServicePackages).mockResolvedValue([]);

    render(<PackageList />, { wrapper: createWrapper() });

    // Apply search that returns no results
    const searchInput = screen.getByPlaceholderText('Search packages...');
    fireEvent.change(searchInput, { target: { value: 'Nonexistent Package' } });

    await waitFor(() => {
      expect(screen.getByText('No packages found')).toBeInTheDocument();
      expect(screen.getByText('Try adjusting your search or filters')).toBeInTheDocument();
      expect(screen.getByText('Clear Filters')).toBeInTheDocument();
    });
  });

  it('displays correct statistics', async () => {
    vi.mocked(packageService.getServicePackages).mockResolvedValue(mockPackages);

    render(<PackageList />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('2 Available')).toBeInTheDocument();
      expect(screen.getByText('20% Max Savings')).toBeInTheDocument();
      expect(screen.getByText('1 Featured')).toBeInTheDocument();
    });
  });

  it('handles package purchase', async () => {
    vi.mocked(packageService.getServicePackages).mockResolvedValue(mockPackages);

    render(<PackageList />, { wrapper: createWrapper() });

    await waitFor(() => {
      const purchaseButton = screen.getAllByText('Purchase Package')[0];
      fireEvent.click(purchaseButton);
    });

    await waitFor(() => {
      expect(screen.getByText('Purchase Package')).toBeInTheDocument();
      expect(screen.getByText('Complete your package purchase below')).toBeInTheDocument();
    });
  });

  it('shows error state on API error', async () => {
    vi.mocked(packageService.getServicePackages).mockRejectedValue(new Error('API Error'));

    render(<PackageList />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Failed to load packages')).toBeInTheDocument();
      expect(screen.getByText('Retry')).toBeInTheDocument();
    });
  });
});