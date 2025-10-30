import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

// Check if we're in CI environment
const isCI = process.env.CI === 'true';
const isTestShard = process.env.VITEST_SHARD !== undefined;
const shardIndex = isTestShard ? parseInt(process.env.VITEST_SHARD || '0') : 0;
const shardCount = isTestShard ? parseInt(process.env.VITEST_SHARD_COUNT || '1') : 1;

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: [
      "./src/test/setup-enhanced.ts",
    ],
    globals: true,
    include: ['src/**/*.{test,spec}.{js,ts,tsx}'],
    exclude: [
      'node_modules',
      'dist',
      'build',
      '**/*.d.ts',
      '**/*.config.*',
      'src/test/setup*.ts',
      'src/mocks/**',
    ],
    // Enhanced test execution
    testTimeout: 30000, // Increased to handle complex integration tests
    hookTimeout: 30000, // Increased to handle complex setup
    maxWorkers: isCI ? Math.min(4, shardCount) : 4,
    watch: false,
    // Add retry configuration for flaky tests
    retry: isCI ? 1 : 2,
    // Add sequence configuration for test ordering
    sequence: {
      shuffle: false,
      concurrent: true,
    },
    // Test sharding for CI parallelization
    ...(isTestShard && {
      shard: {
        index: shardIndex,
        count: shardCount,
      },
    }),
    // Coverage configuration updated for 90% target
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'src/test/',
        'src/mocks/',
        '**/*.d.ts',
        '**/*.config.*',
        'src/vite-env.d.ts',
        'src/main.tsx',
        'src/vite-env.d.ts',
        '**/*.stories.{ts,tsx}',
        '**/*.mock.{ts,tsx}',
      ],
      thresholds: {
        global: {
          branches: 95,
          functions: 95,
          lines: 95,
          statements: 95,
        },
      },
      clean: true,
      cleanOnRerun: true,
      all: true,
      // Only run coverage on the final shard
      ...(isTestShard && shardIndex === shardCount - 1 && { enabled: true }),
      ...(!isTestShard && { enabled: true }),
    },
    // Add reporter configuration
    reporters: isCI ? ['json', 'junit'] : ['verbose', 'json', 'html'],
    outputFile: {
      json: isTestShard ? `./test-results/results-${shardIndex}.json` : './test-results/results.json',
      junit: isTestShard ? `./test-results/junit-${shardIndex}.xml` : './test-results/junit.xml',
      html: !isTestShard ? './test-results/index.html' : undefined,
    },
    // Performance optimizations
    isolate: isCI,
    pool: isCI ? 'threads' : 'forks',
    singleThread: false,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@/components": path.resolve(__dirname, "./src/components"),
      "@/pages": path.resolve(__dirname, "./src/pages"),
      "@/hooks": path.resolve(__dirname, "./src/hooks"),
      "@/utils": path.resolve(__dirname, "./src/utils"),
      "@/types": path.resolve(__dirname, "./src/types"),
      "@/services": path.resolve(__dirname, "./src/services"),
      "@/stores": path.resolve(__dirname, "./src/stores"),
      "@/contexts": path.resolve(__dirname, "./src/contexts"),
      "@/lib": path.resolve(__dirname, "./src/lib"),
      "@/assets": path.resolve(__dirname, "./public/assets"),
    },
  },
  define: {
    // Enable test mode
    __TEST__: JSON.stringify(true),
  },
});