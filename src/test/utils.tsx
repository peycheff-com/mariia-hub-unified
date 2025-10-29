import { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';

import i18n from './i18n-test';

// Create a test query client
const createTestQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
};

// Test providers wrapper
interface AllTheProvidersProps {
  children: React.ReactNode;
  queryClient?: QueryClient;
}

const AllTheProviders = ({ children, queryClient }: AllTheProvidersProps) => {
  const testQueryClient = queryClient || createTestQueryClient();

  return (
    <QueryClientProvider client={testQueryClient}>
      <I18nextProvider i18n={i18n}>
        <BrowserRouter>
          {children}
        </BrowserRouter>
      </I18nextProvider>
    </QueryClientProvider>
  );
};

// Custom render function with providers
const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'> & { queryClient?: QueryClient }
) => {
  const { queryClient, ...renderOptions } = options || {};

  return render(ui, {
    wrapper: ({ children }) => (
      <AllTheProviders queryClient={queryClient}>
        {children}
      </AllTheProviders>
    ),
    ...renderOptions,
  });
};

// Re-export everything from testing-library
export * from '@testing-library/react';
export { customRender as render };
export { createTestQueryClient };