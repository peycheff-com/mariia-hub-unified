// Global test setup file
// This file is imported by both vitest.config.ts and individual test files

import { vi, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';

import { setupAllMocks } from '@/test/mocks/services.mock';

// ==================== GLOBAL MOCKS ====================

// Mock browser APIs that might not be available in test environment
global.ResizeObserver = class ResizeObserver {
  constructor(cb: any) {}
  observe() {}
  unobserve() {}
  disconnect() {}
};

global.IntersectionObserver = class IntersectionObserver {
  constructor(cb: any) {}
  observe() {}
  unobserve() {}
  disconnect() {}
};

global.MutationObserver = class MutationObserver {
  constructor(cb: any) {}
  observe() {}
  disconnect() {}
};

global.RequestIdleCallback = class RequestIdleCallback {
  static schedule(cb: any) {
    return setTimeout(cb, 0);
  }
};

// Mock fetch
global.fetch = vi.fn();

// Mock WebSocket
global.WebSocket = class WebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  readyState = WebSocket.OPEN;
  url = '';

  constructor(url: string) {
    this.url = url;
    setTimeout(() => {
      this.onopen?.(new Event('open'));
    }, 0);
  }

  onopen: ((event: Event) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;

  send() {}
  close() {}
  addEventListener() {}
  removeEventListener() {}
};

// Mock LocalStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock SessionStorage
const sessionStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
};
Object.defineProperty(window, 'sessionStorage', { value: sessionStorageMock });

// Mock URL.createObjectURL
Object.defineProperty(URL, 'createObjectURL', {
  value: vi.fn(() => 'mock-url'),
});

Object.defineProperty(URL, 'revokeObjectURL', {
  value: vi.fn(),
});

// Mock navigator
Object.defineProperty(window, 'navigator', {
  value: {
    ...window.navigator,
    serviceWorker: {
      register: vi.fn().mockResolvedValue({}),
      ready: Promise.resolve({
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }),
    },
    clipboard: {
      writeText: vi.fn().mockResolvedValue(undefined),
      readText: vi.fn().mockResolvedValue(''),
    },
    share: vi.fn().mockResolvedValue(undefined),
    permissions: {
      query: vi.fn().mockResolvedValue({ state: 'granted' }),
    },
    geolocation: {
      getCurrentPosition: vi.fn().mockImplementation((success) => {
        success({
          coords: { latitude: 52.2297, longitude: 21.0122 },
        });
      }),
    },
    online: true,
    language: 'en-US',
    languages: ['en-US', 'en'],
    userAgent: 'Mozilla/5.0 (Test Environment)',
  },
  writable: true,
});

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock getComputedStyle
Object.defineProperty(window, 'getComputedStyle', {
  value: vi.fn(() => ({
    getPropertyValue: () => '',
    zIndex: '0',
    display: 'block',
    visibility: 'visible',
    opacity: '1',
    transform: 'none',
  })),
});

// Mock scrollTo
Object.defineProperty(window, 'scrollTo', {
  value: vi.fn(),
});

// Mock alert, confirm, prompt
global.alert = vi.fn();
global.confirm = vi.fn(() => true);
global.prompt = vi.fn(() => 'test input');

// Mock crypto
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: vi.fn(() => 'test-uuid-' + Math.random().toString(36).substr(2, 9)),
    getRandomValues: vi.fn().mockImplementation((arr) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256);
      }
      return arr;
    }),
    subtle: {
      encrypt: vi.fn().mockResolvedValue(new ArrayBuffer(0)),
      decrypt: vi.fn().mockResolvedValue(new ArrayBuffer(0)),
      sign: vi.fn().mockResolvedValue(new ArrayBuffer(0)),
      verify: vi.fn().mockResolvedValue(true),
    },
  },
});

// Mock indexedDB for offline manager tests
const indexedDBMock = {
  open: vi.fn().mockImplementation(() => {
    const request = {
      result: {
        createObjectStore: vi.fn(),
        transaction: vi.fn(() => ({
          objectStore: vi.fn(() => ({
            get: vi.fn(),
            add: vi.fn(),
            put: vi.fn(),
            delete: vi.fn(),
            getAll: vi.fn(),
          })),
        })),
      },
      onerror: null as ((event: any) => void) | null,
      onsuccess: null as ((event: any) => void) | null,
      onupgradeneeded: null as ((event: any) => void) | null,
    };
    setTimeout(() => {
      if (request.onsuccess) {
        request.onsuccess({ target: request } as any);
      }
    }, 0);
    return request;
  }),
};

Object.defineProperty(global, 'indexedDB', {
  value: indexedDBMock,
  writable: true,
});

// Mock performance (if not already mocked)
if (!window.performance.mark) {
  Object.defineProperty(window, 'performance', {
    value: {
      ...window.performance,
      mark: vi.fn(),
      measure: vi.fn(),
      getEntriesByName: vi.fn().mockReturnValue([]),
      getEntriesByType: vi.fn().mockReturnValue([]),
      now: vi.fn(() => Date.now()),
      timing: {
        navigationStart: Date.now(),
      },
    },
    writable: true,
  });
}

// Mock requestAnimationFrame
global.requestAnimationFrame = vi.fn().mockImplementation((cb) => {
  return setTimeout(cb, 16);
});

global.cancelAnimationFrame = vi.fn().mockImplementation((id) => {
  clearTimeout(id);
});

// Mock requestIdleCallback
global.requestIdleCallback = vi.fn().mockImplementation((cb) => {
  return setTimeout(cb, 0);
});

global.cancelIdleCallback = vi.fn().mockImplementation((id) => {
  clearTimeout(id);
});

// ==================== ENVIRONMENT SETUP ====================

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.VITE_SUPABASE_URL = 'https://test.supabase.co';
process.env.VITE_SUPABASE_ANON_KEY = 'test-anon-key';
process.env.VITE_STRIPE_PUBLISHABLE_KEY = 'pk_test_123';
process.env.VITE_APP_URL = 'http://localhost:8080';

// Suppress console warnings in tests unless debugging
const originalError = console.error;
const originalWarn = console.warn;

beforeAll(() => {
  // Only show critical errors during tests
  console.error = (...args: any[]) => {
    const message = args[0];
    if (typeof message === 'string') {
      // Allow specific error messages that are important for debugging
      if (
        message.includes('Warning:') &&
        !message.includes('ReactDOM.render is deprecated') &&
        !message.includes('componentWillReceiveProps') &&
        !message.includes('act()')
      ) {
        return;
      }
    }
    originalError.call(console, ...args);
  };

  console.warn = (...args: any[]) => {
    const message = args[0];
    if (typeof message === 'string') {
      // Filter out common warnings that don't affect test results
      if (
        message.includes('componentWillReceiveProps') ||
        message.includes('componentWillMount') ||
        message.includes('componentWillUpdate') ||
        message.includes('UNSAFE_')
      ) {
        return;
      }
    }
    originalWarn.call(console, ...args);
  };

  // Setup all service mocks
  setupAllMocks();
});

afterAll(() => {
  // Restore original console methods
  console.error = originalError;
  console.warn = originalWarn;
});

// ==================== TEST CLEANUP ====================

beforeEach(() => {
  // Clear all mocks before each test
  vi.clearAllMocks();

  // Reset localStorage and sessionStorage
  localStorageMock.clear();
  sessionStorageMock.clear();

  // Reset fetch mock
  (global.fetch as any).mockClear();
});

afterEach(() => {
  // Clean up any timers
  vi.clearAllTimers();

  // Reset body styles
  document.body.style.cssText = '';

  // Clean up any remaining DOM elements
  document.body.innerHTML = '';
});

// ==================== CUSTOM TEST UTILITIES ====================

// Helper to wait for async operations
export const waitForAsync = () => new Promise(resolve => setTimeout(resolve, 0));

// Helper to advance timers
export const advanceTimersByTime = (ms: number) => vi.advanceTimersByTime(ms);

// Helper to flush promises
export const flushPromises = () => new Promise(resolve => setImmediate(resolve));

// Export global test utilities
global.testUtils = {
  waitForAsync,
  flushPromises,
  advanceTimersByTime,
};

// Type declarations for global test utils
declare global {
  var testUtils: {
    waitForAsync: () => Promise<void>;
    flushPromises: () => Promise<void>;
    advanceTimersByTime: (ms: number) => void;
  };
}