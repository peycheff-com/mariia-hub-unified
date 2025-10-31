/** @type {import('jest').Config} */
module.exports = {
  displayName: 'Accessibility Tests',
  testMatch: [
    '<rootDir>/src/**/__tests__/*.{js,jsx,ts,tsx}',
    '<rootDir>/tests/a11y/**/*.{js,jsx,ts,tsx}'
  ],
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
    '!src/test/**/*',
    '!src/mocks/**/*'
  ],
  setupFilesAfterEnv: [
    '<rootDir>/src/test/setup-a11y.js'
  ],
  testEnvironment: 'jsdom',
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/lib/$1',
    '^@/components/(.*)$': '<rootDir>/src/components/ui/$1'
  },
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', {
      presets: [
        ['@babel/preset-env', {
          targets: { node: 'current' }
        }],
        ['@babel/preset-react', {
          runtime: 'automatic'
        }]
      ],
      plugins: [
        ['@babel/plugin-transform-runtime', {
          corejs: 3,
          regenerator: true
        }]
      ]
    }]
  },
  testTimeout: 10000,
  maxWorkers: 4,
  coverageReporters: [
    'text',
    'text-summary',
    'lcov',
    'json',
    'html',
    'clover'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  // Coverage collection for accessibility features
  collectCoverageOnlyFrom: [
    'src/components/**/*.tsx',
    'src/pages/**/*.tsx',
    'src/hooks/**/*.ts'
  ],
  // Custom reporters for accessibility violations
  reporters: [
    'default',
    [
      './node_modules/jest-a11y-reporter',
      {
        resultsDir: 'test-results/accessibility',
        includePassedTests: false,
        disableRunners: ['axe']
      }
    ]
  ]
};