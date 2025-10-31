#!/usr/bin/env node

/**
 * Test Helper Scripts for Enhanced Developer Experience
 *
 * This script provides utility functions to improve testing productivity:
 * - Generate test files from templates
 * - Clean test artifacts and caches
 * - Generate test coverage reports
 * - Run focused test commands
 * - Analyze test health and suggest improvements
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ANSI color codes for better terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function error(message) {
  log(`❌ Error: ${message}`, 'red');
}

function success(message) {
  log(`✅ ${message}`, 'green');
}

function info(message) {
  log(`ℹ️  ${message}`, 'blue');
}

function warning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

// Test file templates
const templates = {
  component: `import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/test/utils';
import { COMPONENT_NAME } from '../COMPONENT_NAME';

describe('COMPONENT_NAME', () => {
  it('renders without crashing', () => {
    render(<COMPONENT_NAME />);
    // TODO: Add meaningful assertions
  });

  it('handles required props correctly', () => {
    // TODO: Test component behavior with required props
    const props = {};
    render(<COMPONENT_NAME {...props} />);
  });

  it('displays loading state when provided', () => {
    // TODO: Test loading state
    render(<COMPONENT_NAME loading={true} />);
  });

  it('handles user interactions correctly', async () => {
    // TODO: Test user interactions
    const { user } = render(<COMPONENT_NAME />);

    // Example interaction test:
    // const button = screen.getByRole('button', { name: /action/i });
    // await user.click(button);
    // expect(screen.getByText('Action completed')).toBeInTheDocument();
  });

  it('is accessible', async () => {
    // TODO: Add accessibility testing
    const { container } = render(<COMPONENT_NAME />);
    // await testAccessibility(container);
  });
});
`,

  service: `import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SERVICE_NAME } from '../SERVICE_NAME';

describe('SERVICE_NAME', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('create', () => {
    it('should create successfully with valid data', async () => {
      const mockData = {
        // TODO: Define valid test data
      };

      // TODO: Mock API responses
      const result = await SERVICE_NAME.create(mockData);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('should handle validation errors', async () => {
      const invalidData = {
        // TODO: Define invalid test data
      };

      const result = await SERVICE_NAME.create(invalidData);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('update', () => {
    it('should update existing entity successfully', async () => {
      const mockUpdate = {
        id: 'test-id',
        // TODO: Define update data
      };

      const result = await SERVICE_NAME.update(mockUpdate);

      expect(result.success).toBe(true);
      expect(result.data?.id).toBe('test-id');
    });
  });

  describe('delete', () => {
    it('should delete entity successfully', async () => {
      const id = 'test-id';

      const result = await SERVICE_NAME.delete(id);

      expect(result.success).toBe(true);
    });
  });

  describe('error handling', () => {
    it('should handle network errors gracefully', async () => {
      // TODO: Mock network failure
      const result = await SERVICE_NAME.somethingThatFails();

      expect(result.success).toBe(false);
      expect(result.error).toContain('network');
    });

    it('should handle API error responses', async () => {
      // TODO: Mock API error response
      const result = await SERVICE_NAME.somethingThatFails();

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});
`,

  hook: `import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HOOK_NAME } from '../HOOK_NAME';

describe('HOOK_NAME', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return initial state correctly', () => {
    const { result } = renderHook(() => HOOK_NAME());

    expect(result.current).toBeDefined();
    // TODO: Add specific initial state assertions
  });

  it('should handle state updates correctly', async () => {
    const { result } = renderHook(() => HOOK_NAME());

    // TODO: Test state update logic
    // await act(async () => {
    //   result.current.someUpdateFunction('new value');
    // });

    // expect(result.current.someState).toBe('expected value');
  });

  it('should handle cleanup correctly', () => {
    const { unmount } = renderHook(() => HOOK_NAME());

    // TODO: Test cleanup logic if any
    unmount();
  });

  it('should handle errors gracefully', () => {
    // TODO: Test error handling
    const { result } = renderHook(() => HOOK_NAME());

    // Test error states
  });
});
`,
};

/**
 * Generate a new test file from a template
 */
function generateTestFile(type, componentName, filePath) {
  try {
    const template = templates[type];
    if (!template) {
      error(`Template type '${type}' not found. Available types: ${Object.keys(templates).join(', ')}`);
      process.exit(1);
    }

    const fileName = path.basename(filePath, '.tsx');
    const PascalCaseName = fileName.replace(/^[a-z]/, char => char.toUpperCase()).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());

    let content = template
      .replace(/COMPONENT_NAME/g, PascalCaseName)
      .replace(/SERVICE_NAME/g, PascalCaseName)
      .replace(/HOOK_NAME/g, `use${PascalCaseName}`);

    // Handle file extension
    const ext = type === 'component' ? '.tsx' : '.ts';
    const testFilePath = filePath.replace(/\.[^.]+$/, ext);

    // Create directory if it doesn't exist
    const dir = path.dirname(testFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(testFilePath, content);
    success(`Generated ${type} test file: ${testFilePath}`);

    info(`\nTODO items to complete in ${testFilePath}:`);
    warning('- Replace placeholder TODO comments with actual test logic');
    warning('- Add specific test data and assertions');
    warning('- Update component/service imports if needed');
    warning('- Add edge cases and error scenarios');

  } catch (err) {
    error(`Failed to generate test file: ${err.message}`);
    process.exit(1);
  }
}

/**
 * Clean test artifacts and caches
 */
function cleanTestArtifacts() {
  info('Cleaning test artifacts and caches...');

  const pathsToClean = [
    'coverage/',
    'test-results/',
    'node_modules/.vite/',
    '.vitest/',
  ];

  const commandsToRun = [
    'npm run clean:test-caches 2>/dev/null || true',
    'rm -rf coverage/ test-results/ .vitest/ node_modules/.vite/ 2>/dev/null || true',
  ];

  try {
    commandsToRun.forEach(cmd => {
      try {
        execSync(cmd, { stdio: 'inherit' });
      } catch (err) {
        // Some commands might fail, that's okay for cleanup
      }
    });

    success('Test artifacts cleaned successfully');

    // Show what was cleaned
    pathsToClean.forEach(path => {
      if (fs.existsSync(path)) {
        info(`  - Removed: ${path}`);
      }
    });

  } catch (err) {
    error(`Failed to clean test artifacts: ${err.message}`);
    process.exit(1);
  }
}

/**
 * Analyze test coverage and provide suggestions
 */
function analyzeCoverage() {
  info('Analyzing test coverage...');

  try {
    // Run coverage report
    execSync('npm run test:coverage', { stdio: 'inherit' });

    // Read coverage report if it exists
    const coverageDir = 'coverage';
    const summaryFile = path.join(coverageDir, 'coverage-summary.json');

    if (fs.existsSync(summaryFile)) {
      const coverage = JSON.parse(fs.readFileSync(summaryFile, 'utf8'));

      log('\n📊 Coverage Analysis:', 'bright');

      Object.keys(coverage.total).forEach(metric => {
        const value = coverage.total[metric].pct;
        const color = value >= 80 ? 'green' : value >= 60 ? 'yellow' : 'red';
        log(`  ${metric}: ${value}%`, color);
      });

      // Provide suggestions based on coverage
      log('\n💡 Coverage Improvement Suggestions:', 'bright');

      if (coverage.total.statements.pct < 70) {
        warning('  - Consider adding unit tests for untested functions');
      }
      if (coverage.total.branches.pct < 70) {
        warning('  - Add tests for conditional logic and error paths');
      }
      if (coverage.total.functions.pct < 70) {
        warning('  - Test more function variants and edge cases');
      }
      if (coverage.total.lines.pct < 70) {
        warning('  - Review files with low line coverage');
      }

      // Find files with low coverage
      if (fs.existsSync(path.join(coverageDir, 'lcov-report/index.html'))) {
        log('\n🔍 Detailed coverage report available at:', 'bright');
        log(`  file://${path.resolve(coverageDir, 'lcov-report/index.html')}`, 'blue');
      }
    } else {
      warning('Coverage report not found. Make sure tests generate coverage data.');
    }

  } catch (err) {
    error(`Failed to analyze coverage: ${err.message}`);
    process.exit(1);
  }
}

/**
 * Run tests with specific patterns and configurations
 */
function runFocusedTests(pattern = '', options = {}) {
  const {
    coverage = false,
    watch = false,
    verbose = false,
    bail = false,
    reporter = 'default'
  } = options;

  let command = 'npx vitest run';

  if (watch) {
    command = 'npx vitest';
  }

  if (coverage) {
    command += ' --coverage';
  }

  if (verbose) {
    command += ' --reporter=verbose';
  } else if (reporter !== 'default') {
    command += ` --reporter=${reporter}`;
  }

  if (bail) {
    command += ' --bail';
  }

  if (pattern) {
    command += ` ${pattern}`;
  }

  info(`Running tests with command: ${command}`);

  try {
    execSync(command, { stdio: 'inherit' });
    success('Tests completed successfully');
  } catch (err) {
    error('Tests failed');
    process.exit(1);
  }
}

/**
 * Generate test health report
 */
function generateHealthReport() {
  info('Generating test health report...');

  try {
    // Count test files
    const testFiles = [];
    function findTestFiles(dir) {
      const files = fs.readdirSync(dir);
      files.forEach(file => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          findTestFiles(fullPath);
        } else if ((file.endsWith('.test.ts') || file.endsWith('.test.tsx') ||
                    file.endsWith('.spec.ts') || file.endsWith('.spec.tsx'))) {
          testFiles.push(fullPath);
        }
      });
    }

    findTestFiles('src');

    log('\n📋 Test Health Report:', 'bright');
    log(`  Total test files: ${testFiles.length}`, 'blue');

    // Count TODO comments in tests
    let todoCount = 0;
    let pendingTestCount = 0;

    testFiles.forEach(file => {
      const content = fs.readFileSync(file, 'utf8');
      todoCount += (content.match(/TODO/gi) || []).length;
      pendingTestCount += (content.match(/it\.skip|test\.skip/g) || []).length;
    });

    if (todoCount > 0) {
      warning(`  TODO comments in tests: ${todoCount}`);
    }

    if (pendingTestCount > 0) {
      warning(`  Skipped/pending tests: ${pendingTestCount}`);
    }

    if (todoCount === 0 && pendingTestCount === 0) {
      success('  No TODOs or skipped tests found!');
    }

    // Check for common issues
    log('\n🔍 Health Check:', 'bright');

    let issues = [];

    testFiles.forEach(file => {
      const content = fs.readFileSync(file, 'utf8');

      // Check for common anti-patterns
      if (content.includes('setTimeout(')) {
        issues.push(`${file}: Uses setTimeout (prefer waitFor)`);
      }
      if (content.includes('console.log(')) {
        issues.push(`${file}: Contains console.log (remove in production)`);
      }
      if (content.includes('fireEvent.click') && !content.includes('userEvent')) {
        issues.push(`${file}: Uses fireEvent (prefer userEvent)`);
      }
    });

    if (issues.length > 0) {
      warning('  Issues found:');
      issues.forEach(issue => warning(`    - ${issue}`));
    } else {
      success('  No common issues detected');
    }

  } catch (err) {
    error(`Failed to generate health report: ${err.message}`);
    process.exit(1);
  }
}

/**
 * Show help information
 */
function showHelp() {
  log('\n🧪 Test Helper CLI', 'bright');
  log('\nUsage: node scripts/test-helpers.js <command> [options]\n');

  log('Commands:', 'bright');
  log('  generate <type> <path>    Generate a new test file from template');
  log('    Types: component, service, hook');
  log('    Example: node scripts/test-helpers.js generate component src/components/NewComponent.tsx\n');

  log('  clean                    Clean test artifacts and caches\n');

  log('  coverage                 Run tests with coverage and analysis\n');

  log('  health                   Generate test health report\n');

  log('  run [pattern] [options] Run focused tests');
  log('    Options:');
  log('      --coverage           Include coverage report');
  log('      --watch             Run in watch mode');
  log('      --verbose           Verbose output');
  log('      --bail              Stop on first failure');
  log('      --reporter <type>   Specify reporter (default, verbose, json)\n');

  log('Examples:', 'bright');
  log('  node scripts/test-helpers.js generate component src/components/BookingForm.tsx');
  log('  node scripts/test-helpers.js clean');
  log('  node scripts/test-helpers.js coverage');
  log('  node scripts/test-helpers.js run "booking" --coverage --verbose');
  log('  node scripts/test-helpers.js health\n');
}

// Main CLI logic
function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command || command === 'help' || command === '--help' || command === '-h') {
    showHelp();
    return;
  }

  switch (command) {
    case 'generate':
      if (args.length < 3) {
        error('Usage: generate <type> <path>');
        process.exit(1);
      }
      generateTestFile(args[1], args[2]);
      break;

    case 'clean':
      cleanTestArtifacts();
      break;

    case 'coverage':
      analyzeCoverage();
      break;

    case 'health':
      generateHealthReport();
      break;

    case 'run':
      const pattern = args[1] || '';
      const options = {};

      // Parse options
      args.forEach(arg => {
        if (arg === '--coverage') options.coverage = true;
        if (arg === '--watch') options.watch = true;
        if (arg === '--verbose') options.verbose = true;
        if (arg === '--bail') options.bail = true;
        if (arg.startsWith('--reporter=')) options.reporter = arg.split('=')[1];
      });

      runFocusedTests(pattern, options);
      break;

    default:
      error(`Unknown command: ${command}`);
      showHelp();
      process.exit(1);
  }
}

// Run the CLI
if (require.main === module) {
  main();
}

module.exports = {
  generateTestFile,
  cleanTestArtifacts,
  analyzeCoverage,
  runFocusedTests,
  generateHealthReport,
};