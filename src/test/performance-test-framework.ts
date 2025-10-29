import { PerformanceEntry, PerformanceObserver } from 'perf_hooks';

import { render, RenderOptions } from '@testing-library/react';
import { act } from 'react';

// Mock Performance API for testing environment
global.PerformanceObserver = class MockPerformanceObserver {
  private callback: PerformanceObserverCallback;
  private entries: PerformanceEntry[] = [];

  constructor(callback: PerformanceObserverCallback) {
    this.callback = callback;
  }

  observe(options: PerformanceObserverInit) {
    // Mock performance observation
    if (options.entryTypes?.includes('measure')) {
      // Simulate performance entries
      setTimeout(() => {
        this.entries = this.createMockEntries();
        this.callback(this.entries, this);
      }, 0);
    }
  }

  disconnect() {
    // Cleanup
    this.entries = [];
  }

  private createMockEntries(): PerformanceEntry[] {
    return [
      {
        name: 'render',
        entryType: 'measure',
        startTime: 0,
        duration: 50, // Mock 50ms render time
        detail: {}
      } as PerformanceEntry,
      {
        name: 'layout',
        entryType: 'measure',
        startTime: 50,
        duration: 20, // Mock 20ms layout time
        detail: {}
      } as PerformanceEntry
    ];
  }
} as any;

global.performance = {
  ...global.performance,
  mark: vi.fn(),
  measure: vi.fn(),
  getEntriesByName: vi.fn(() => []),
  getEntriesByType: vi.fn(() => []),
  now: vi.fn(() => Date.now())
} as any;

export interface PerformanceMetrics {
  renderTime: number;
  layoutTime: number;
  paintTime: number;
  memoryUsage: number;
  componentCount: number;
  reRenderCount: number;
}

export interface PerformanceThresholds {
  maxRenderTime: number;
  maxLayoutTime: number;
  maxPaintTime: number;
  maxMemoryUsage: number;
  maxReRenderCount: number;
}

export interface PerformanceTestOptions {
  component: React.ReactElement;
  renderOptions?: RenderOptions;
  thresholds?: Partial<PerformanceThresholds>;
  interactions?: (() => Promise<void>)[];
  iterations?: number;
}

export class PerformanceTestFramework {
  private static defaultThresholds: PerformanceThresholds = {
    maxRenderTime: 16, // 60fps = 16.67ms per frame
    maxLayoutTime: 10,
    maxPaintTime: 8,
    maxMemoryUsage: 50 * 1024 * 1024, // 50MB
    maxReRenderCount: 3
  };

  static async measureComponentPerformance(options: PerformanceTestOptions): Promise<{
    metrics: PerformanceMetrics;
    thresholds: PerformanceThresholds;
    passed: boolean;
    details: string[];
  }> {
    const {
      component,
      renderOptions = {},
      thresholds: customThresholds = {},
      interactions = [],
      iterations = 1
    } = options;

    const thresholds = { ...this.defaultThresholds, ...customThresholds };
    const results: PerformanceMetrics[] = [];
    const details: string[] = [];

    for (let i = 0; i < iterations; i++) {
      const metrics = await this.measureSingleRender(component, renderOptions, interactions);
      results.push(metrics);

      // Check individual iteration against thresholds
      this.checkThresholds(metrics, thresholds, details);
    }

    // Calculate average metrics
    const averageMetrics = this.calculateAverageMetrics(results);

    // Final threshold check
    const passed = this.checkThresholds(averageMetrics, thresholds, details);

    return {
      metrics: averageMetrics,
      thresholds,
      passed,
      details
    };
  }

  private static async measureSingleRender(
    component: React.ReactElement,
    renderOptions: RenderOptions,
    interactions: (() => Promise<void>)[]
  ): Promise<PerformanceMetrics> {
    // Clear any existing measurements
    if (typeof document !== 'undefined') {
      document.body.innerHTML = '';
    }

    const startTime = performance.now();
    const renderStartTime = performance.now();

    // Render component
    const { unmount, container } = render(component, renderOptions);

    const renderEndTime = performance.now();
    const renderTime = renderEndTime - renderStartTime;

    // Wait for layout to complete
    await new Promise(resolve => {
      requestAnimationFrame(() => {
        requestAnimationFrame(resolve);
      });
    });

    const layoutTime = performance.now() - renderEndTime;

    // Measure memory usage
    const memoryUsage = this.measureMemoryUsage();

    // Count components (simplified)
    const componentCount = this.countComponents(container);

    // Run interactions and measure re-renders
    let reRenderCount = 0;
    for (const interaction of interactions) {
      const interactionStart = performance.now();
      await act(async () => {
        await interaction();
      });
      reRenderCount++;
    }

    const totalTime = performance.now() - startTime;

    // Cleanup
    unmount();

    return {
      renderTime,
      layoutTime,
      paintTime: 0, // Not easily measurable in testing environment
      memoryUsage,
      componentCount,
      reRenderCount
    };
  }

  private static measureMemoryUsage(): number {
    if (typeof window !== 'undefined' && (window as any).performance?.memory) {
      const memory = (window as any).performance.memory;
      return memory.usedJSHeapSize || 0;
    }
    return 0; // Not available in testing environment
  }

  private static countComponents(container: HTMLElement): number {
    if (!container) return 0;

    // Count React component markers
    const dataReactAttrs = container.querySelectorAll('[data-reactroot], [data-reactid]');
    return dataReactAttrs.length;
  }

  private static calculateAverageMetrics(results: PerformanceMetrics[]): PerformanceMetrics {
    const sum = results.reduce((acc, metrics) => ({
      renderTime: acc.renderTime + metrics.renderTime,
      layoutTime: acc.layoutTime + metrics.layoutTime,
      paintTime: acc.paintTime + metrics.paintTime,
      memoryUsage: acc.memoryUsage + metrics.memoryUsage,
      componentCount: acc.componentCount + metrics.componentCount,
      reRenderCount: acc.reRenderCount + metrics.reRenderCount
    }), {
      renderTime: 0,
      layoutTime: 0,
      paintTime: 0,
      memoryUsage: 0,
      componentCount: 0,
      reRenderCount: 0
    });

    const count = results.length;
    return {
      renderTime: sum.renderTime / count,
      layoutTime: sum.layoutTime / count,
      paintTime: sum.paintTime / count,
      memoryUsage: sum.memoryUsage / count,
      componentCount: sum.componentCount / count,
      reRenderCount: sum.reRenderCount / count
    };
  }

  private static checkThresholds(
    metrics: PerformanceMetrics,
    thresholds: PerformanceThresholds,
    details: string[]
  ): boolean {
    let passed = true;

    if (metrics.renderTime > thresholds.maxRenderTime) {
      passed = false;
      details.push(`Render time ${metrics.renderTime.toFixed(2)}ms exceeds threshold of ${thresholds.maxRenderTime}ms`);
    }

    if (metrics.layoutTime > thresholds.maxLayoutTime) {
      passed = false;
      details.push(`Layout time ${metrics.layoutTime.toFixed(2)}ms exceeds threshold of ${thresholds.maxLayoutTime}ms`);
    }

    if (metrics.paintTime > thresholds.maxPaintTime) {
      passed = false;
      details.push(`Paint time ${metrics.paintTime.toFixed(2)}ms exceeds threshold of ${thresholds.maxPaintTime}ms`);
    }

    if (metrics.memoryUsage > thresholds.maxMemoryUsage) {
      passed = false;
      details.push(`Memory usage ${(metrics.memoryUsage / 1024 / 1024).toFixed(2)}MB exceeds threshold of ${(thresholds.maxMemoryUsage / 1024 / 1024).toFixed(2)}MB`);
    }

    if (metrics.reRenderCount > thresholds.maxReRenderCount) {
      passed = false;
      details.push(`Re-render count ${metrics.reRenderCount} exceeds threshold of ${thresholds.maxReRenderCount}`);
    }

    return passed;
  }

  static async measureComponentLifecycle(component: React.ReactElement): Promise<{
    mountTime: number;
    updateTimes: number[];
    unmountTime: number;
  }> {
    const mountStart = performance.now();

    const { unmount, rerender } = render(component);

    const mountEnd = performance.now();
    const mountTime = mountEnd - mountStart;

    const updateTimes: number[] = [];

    // Measure multiple updates
    for (let i = 0; i < 5; i++) {
      const updateStart = performance.now();

      await act(async () => {
        rerender(component);
      });

      const updateEnd = performance.now();
      updateTimes.push(updateEnd - updateStart);
    }

    const unmountStart = performance.now();
    unmount();
    const unmountEnd = performance.now();
    const unmountTime = unmountEnd - unmountStart;

    return {
      mountTime,
      updateTimes,
      unmountTime
    };
  }

  static async measureInteractionPerformance(
    component: React.ReactElement,
    interaction: (element: HTMLElement) => Promise<void>
  ): Promise<{
    interactionTime: number;
    reRenderTime: number;
    memoryDelta: number;
  }> {
    const { container, unmount } = render(component);

    const memoryBefore = this.measureMemoryUsage();

    const interactionStart = performance.now();
    await act(async () => {
      await interaction(container);
    });
    const interactionEnd = performance.now();

    const interactionTime = interactionEnd - interactionStart;

    // Wait for potential re-renders
    await new Promise(resolve => {
      requestAnimationFrame(() => {
        requestAnimationFrame(resolve);
      });
    });

    const memoryAfter = this.measureMemoryUsage();
    const memoryDelta = memoryAfter - memoryBefore;

    unmount();

    return {
      interactionTime,
      reRenderTime: 0, // Would need more complex setup to measure accurately
      memoryDelta
    };
  }

  static generatePerformanceReport(results: {
    metrics: PerformanceMetrics;
    thresholds: PerformanceThresholds;
    passed: boolean;
    details: string[];
  }): string {
    const { metrics, thresholds, passed, details } = results;

    let report = '\n=== Performance Test Report ===\n\n';
    report += `Status: ${passed ? '✅ PASSED' : '❌ FAILED'}\n\n`;

    report += 'Metrics:\n';
    report += `  Render Time: ${metrics.renderTime.toFixed(2)}ms (threshold: ${thresholds.maxRenderTime}ms)\n`;
    report += `  Layout Time: ${metrics.layoutTime.toFixed(2)}ms (threshold: ${thresholds.maxLayoutTime}ms)\n`;
    report += `  Paint Time: ${metrics.paintTime.toFixed(2)}ms (threshold: ${thresholds.maxPaintTime}ms)\n`;
    report += `  Memory Usage: ${(metrics.memoryUsage / 1024 / 1024).toFixed(2)}MB (threshold: ${(thresholds.maxMemoryUsage / 1024 / 1024).toFixed(2)}MB)\n`;
    report += `  Component Count: ${metrics.componentCount}\n`;
    report += `  Re-render Count: ${metrics.reRenderCount} (threshold: ${thresholds.maxReRenderCount})\n\n`;

    if (details.length > 0) {
      report += 'Issues:\n';
      details.forEach(detail => {
        report += `  ❌ ${detail}\n`;
      });
      report += '\n';
    }

    report += 'Recommendations:\n';
    if (metrics.renderTime > 16) {
      report += '  ⚠️  Consider optimizing render performance (memoization, code splitting)\n';
    }
    if (metrics.memoryUsage > 30 * 1024 * 1024) {
      report += '  ⚠️  High memory usage detected, check for memory leaks\n';
    }
    if (metrics.reRenderCount > 3) {
      report += '  ⚠️  Excessive re-renders, consider using React.memo or useMemo\n';
    }
    if (passed) {
      report += '  ✅ Component performance is within acceptable thresholds\n';
    }

    return report;
  }
}

// Vitest integration helper
export function createPerformanceTest(
  testName: string,
  options: PerformanceTestOptions
) {
  return {
    [testName]: async () => {
      const results = await PerformanceTestFramework.measureComponentPerformance(options);

      console.log(PerformanceTestFramework.generatePerformanceReport(results));

      // Fail test if performance thresholds are exceeded
      if (!results.passed) {
        throw new Error(`Performance test failed:\n${results.details.join('\n')}`);
      }
    }
  };
}

// Helper for testing specific component patterns
export function createBookingPerformanceTest(component: React.ReactElement) {
  return createPerformanceTest('Booking Component Performance', {
    component,
    thresholds: {
      maxRenderTime: 50, // Booking components are more complex
      maxLayoutTime: 20,
      maxMemoryUsage: 60 * 1024 * 1024, // 60MB
      maxReRenderCount: 5
    },
    interactions: [
      // Simulate user selecting a service
      async (container) => {
        const serviceCard = container.querySelector('[data-testid="service-card"]');
        if (serviceCard) {
          await (serviceCard as HTMLElement).click();
        }
      },
      // Simulate user selecting a date
      async (container) => {
        const dateButton = container.querySelector('[data-testid="date-button"]');
        if (dateButton) {
          await (dateButton as HTMLElement).click();
        }
      },
      // Simulate user filling form
      async (container) => {
        const emailInput = container.querySelector('input[type="email"]');
        if (emailInput) {
          await (emailInput as HTMLInputElement).focus();
          (emailInput as HTMLInputElement).value = 'test@example.com';
          await (emailInput as HTMLInputElement).blur();
        }
      }
    ]
  });
}

export function createAdminPerformanceTest(component: React.ReactElement) {
  return createPerformanceTest('Admin Component Performance', {
    component,
    thresholds: {
      maxRenderTime: 100, // Admin components can be more complex
      maxLayoutTime: 50,
      maxMemoryUsage: 100 * 1024 * 1024, // 100MB
      maxReRenderCount: 10
    },
    interactions: [
      // Simulate admin interactions
      async (container) => {
        const table = container.querySelector('[data-testid="data-table"]');
        if (table) {
          // Simulate sorting
          const sortButton = container.querySelector('[data-testid="sort-button"]');
          if (sortButton) {
            await (sortButton as HTMLElement).click();
          }
        }
      }
    ]
  });
}

// Global performance monitoring for test suites
export class PerformanceMonitor {
  private static measurements: Map<string, number[]> = new Map();

  static startMeasurement(name: string): void {
    if (!this.measurements.has(name)) {
      this.measurements.set(name, []);
    }
    performance.mark(`${name}-start`);
  }

  static endMeasurement(name: string): number {
    performance.mark(`${name}-end`);
    performance.measure(name, `${name}-start`, `${name}-end`);

    const entries = performance.getEntriesByName(name, 'measure');
    if (entries.length > 0) {
      const duration = entries[entries.length - 1].duration;
      this.measurements.get(name)?.push(duration);
      return duration;
    }
    return 0;
  }

  static getMeasurements(name: string): number[] {
    return this.measurements.get(name) || [];
  }

  static getAverageMeasurement(name: string): number {
    const measurements = this.getMeasurements(name);
    if (measurements.length === 0) return 0;
    return measurements.reduce((sum, val) => sum + val, 0) / measurements.length;
  }

  static reset(): void {
    this.measurements.clear();
    performance.clearMarks();
    performance.clearMeasures();
  }

  static generateReport(): string {
    let report = '\n=== Performance Monitor Report ===\n\n';

    for (const [name, measurements] of this.measurements) {
      const avg = this.getAverageMeasurement(name);
      const max = Math.max(...measurements);
      const min = Math.min(...measurements);

      report += `${name}:\n`;
      report += `  Measurements: ${measurements.length}\n`;
      report += `  Average: ${avg.toFixed(2)}ms\n`;
      report += `  Min: ${min.toFixed(2)}ms\n`;
      report += `  Max: ${max.toFixed(2)}ms\n\n`;
    }

    return report;
  }
}