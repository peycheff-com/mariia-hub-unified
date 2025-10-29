/**
 * Standardized mock helpers for service tests
 * Provides consistent Supabase mocking patterns across all service tests
 */

import { vi } from 'vitest';

// Create a standardized mock Supabase client
export function createMockSupabase() {
  const mockSupabase = {
    from: vi.fn(() => mockSupabase),
    select: vi.fn(() => mockSupabase),
    insert: vi.fn(() => mockSupabase),
    update: vi.fn(() => mockSupabase),
    delete: vi.fn(() => mockSupabase),
    eq: vi.fn(() => mockSupabase),
    in: vi.fn(() => mockSupabase),
    gte: vi.fn(() => mockSupabase),
    lte: vi.fn(() => mockSupabase),
    or: vi.fn(() => mockSupabase),
    contains: vi.fn(() => mockSupabase),
    order: vi.fn(() => mockSupabase),
    range: vi.fn(() => mockSupabase),
    limit: vi.fn(() => mockSupabase),
    single: vi.fn(() => Promise.resolve({ data: null, error: null })),
    maybeSingle: vi.fn(() => Promise.resolve({ data: null, error: null })),
    rpc: vi.fn(() => Promise.resolve({ data: null, error: null })),
    // Add sql mock for database operations
    sql: vi.fn((template: any, ...values: any[]) => {
      return { template, values };
    }),
    auth: {
      getUser: vi.fn(() => Promise.resolve({ data: { user: null }, error: null }))
    }
  };

  return mockSupabase;
}

// Setup standardized mocks for common modules
export function setupServiceTestMocks() {
  // Mock Supabase client
  const mockSupabase = createMockSupabase();

  vi.mock('@/integrations/supabase/client', () => ({
    supabase: mockSupabase
  }));

  // Mock logger
  vi.mock('@/lib/logger', () => ({
    logger: {
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn(),
    }
  }));

  return { mockSupabase };
}

// Helper to create mock response for queries
export function createMockResponse(data: any = null, error: any = null) {
  return Promise.resolve({ data, error });
}

// Helper to create mock single response
export function createMockSingleResponse(data: any = null, error: any = null) {
  return Promise.resolve({ data, error });
}

// Helper to reset all mocks
export function resetAllMocks() {
  vi.clearAllMocks();
}

// Helper to mock a successful query chain
export function mockSuccessfulQuery(mockSupabase: any, tableName: string, data: any) {
  const mockChain = {
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          or: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              range: vi.fn().mockResolvedValue({ data, error: null })
            })
          }),
          order: vi.fn().mockResolvedValue({ data, error: null }),
          single: vi.fn().mockResolvedValue({ data, error: null })
        }),
        order: vi.fn().mockResolvedValue({ data, error: null }),
        single: vi.fn().mockResolvedValue({ data, error: null })
      }),
      order: vi.fn().mockResolvedValue({ data, error: null }),
      single: vi.fn().mockResolvedValue({ data, error: null })
    }),
    insert: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data, error: null })
      })
    }),
    update: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data, error: null })
        })
      })
    }),
    delete: vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null })
    })
  };

  mockSupabase.from.mockReturnValue(mockChain);
  return mockChain;
}

// Helper to mock RPC calls
export function mockRpcCall(mockSupabase: any, functionName: string, data: any, error: any = null) {
  mockSupabase.rpc.mockImplementation((fnName: string, params?: any) => {
    if (fnName === functionName) {
      return Promise.resolve({ data, error });
    }
    return Promise.resolve({ data: null, error: { message: `Unknown function: ${fnName}` } });
  });
}

// Helper to mock a specific service query
export function mockServiceQuery(mockSupabase: any, serviceId: string, serviceData: any, error: any = null) {
  // Store the original from implementation
  const originalFrom = mockSupabase.from;

  mockSupabase.from.mockImplementation((table: string) => {
    if (table === 'services') {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: serviceData, error })
            })
          })
        })
      };
    }
    // Fall back to original implementation for other tables
    return originalFrom(table);
  });
}

// Helper to mock a specific query with dynamic table handling
export function mockSpecificQuery(mockSupabase: any, tableName: string, queryResult: any, error: any = null) {
  mockSupabase.from.mockImplementation((table: string) => {
    if (table === tableName) {
      return createMockQueryChain(queryResult, error);
    }
    return createMockQueryChain();
  });
}

// Helper to create a mock query chain that returns specific data
export function createMockQueryChain(data: any = null, error: any = null) {
  const mockEq = vi.fn().mockReturnValue({
    select: vi.fn().mockReturnValue({
      single: vi.fn().mockResolvedValue({ data, error }),
      order: vi.fn().mockResolvedValue({ data, error })
    }),
    single: vi.fn().mockResolvedValue({ data, error }),
    order: vi.fn().mockResolvedValue({ data, error })
  });

  return {
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          contains: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data, error }),
            order: vi.fn().mockResolvedValue({ data, error })
          }),
          single: vi.fn().mockResolvedValue({ data, error }),
          order: vi.fn().mockResolvedValue({ data, error })
        }),
        single: vi.fn().mockResolvedValue({ data, error }),
        order: vi.fn().mockResolvedValue({ data, error })
      }),
      contains: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data, error }),
        order: vi.fn().mockResolvedValue({ data, error })
      }),
      order: vi.fn().mockResolvedValue({ data, error }),
      single: vi.fn().mockResolvedValue({ data, error })
    }),
    insert: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data, error })
      })
    }),
    update: vi.fn().mockReturnValue({
      eq: mockEq
    }),
    delete: vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error })
    })
  };
}

// Export types for better TypeScript support
export type MockSupabase = ReturnType<typeof createMockSupabase>;