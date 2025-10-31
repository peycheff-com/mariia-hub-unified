module.exports = {
  ci: {
    collect: {
      url: [
        'http://localhost:8080',
        'http://localhost:8080/beauty',
        'http://localhost:8080/fitness',
        'http://localhost:8080/booking',
        'http://localhost:8080/contact',
        'http://localhost:8080/about',
        'http://localhost:8080/admin/dashboard',
        'http://localhost:8080/blog'
      ],
      startServerCommand: 'npm run preview',
      startServerReadyPattern: 'Local:',
      startServerReadyTimeout: 60000,
      numberOfRuns: 3,
      settings: {
        chromeFlags: '--no-sandbox --headless --disable-gpu --disable-dev-shm-usage',
        preset: 'desktop',
        throttling: {
          rttMs: 40,
          throughputKbps: 10240,
          cpuSlowdownMultiplier: 1,
          requestLatencyMs: 0,
          downloadThroughputKbps: 0,
          uploadThroughputKbps: 0
        },
        budgets: [
          {
            path: '/*',
            resourceSizes: [
              { resourceType: 'script', budget: 300000 },
              { resourceType: 'total', budget: 1000000 },
              { resourceType: 'stylesheet', budget: 50000 },
              { resourceType: 'image', budget: 500000 },
              { resourceType: 'font', budget: 100000 }
            ],
            timingBudgets: [
              { metric: 'interactive', budget: 3000 },
              { metric: 'first-contentful-paint', budget: 1800 },
              { metric: 'largest-contentful-paint', budget: 2500 },
              { metric: 'speed-index', budget: 3400 }
            ]
          },
          {
            path: '/admin/*',
            resourceSizes: [
              { resourceType: 'script', budget: 400000 },
              { resourceType: 'total', budget: 1200000 }
            ],
            timingBudgets: [
              { metric: 'interactive', budget: 4000 },
              { metric: 'first-contentful-paint', budget: 2000 }
            ]
          },
          {
            path: '/booking',
            resourceSizes: [
              { resourceType: 'script', budget: 250000 },
              { resourceType: 'total', budget: 800000 }
            ],
            timingBudgets: [
              { metric: 'interactive', budget: 2500 },
              { metric: 'first-contentful-paint', budget: 1500 }
            ]
          }
        ]
      }
    },
    assert: {
      assertions: {
        // Performance category - luxury market standards
        'categories:performance': ['warn', { minScore: 0.92 }],
        'categories:accessibility': ['error', { minScore: 0.95 }],
        'categories:best-practices': ['warn', { minScore: 0.90 }],
        'categories:seo': ['warn', { minScore: 0.90 }],
        'categories:pwa': 'off',

        // Core Web Vitals - strict thresholds for luxury platform
        'largest-contentful-paint': ['warn', { maxNumericValue: 2500 }],
        'first-contentful-paint': ['warn', { maxNumericValue: 1800 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'total-blocking-time': ['warn', { maxNumericValue: 200 }],
        'speed-index': ['warn', { maxNumericValue: 3400 }],
        'interactive': ['warn', { maxNumericValue: 3000 }],

        // Resource budgets
        'performance-budget:script-size': ['warn', { maxNumericValue: 300000 }],
        'performance-budget:stylesheet-size': ['warn', { maxNumericValue: 50000 }],
        'performance-budget:total-byte-weight': ['warn', { maxNumericValue: 1000000 }],

        // Best practices for luxury platform
        'is-on-https': 'off', // Dev environment
        'redirects-http': 'off',
        'uses-http2': 'off',
        'uses-text-compression': ['warn', { minScore: 1 }],
        'uses-responsive-images': ['warn', { minScore: 0.9 }],
        'efficient-animated-content': ['warn', { minScore: 0.9 }],
        'preload-fonts': ['warn', { minScore: 0.8 }],
        'font-display': ['warn', { minScore: 0.8 }],

        // Security considerations
        'maskable-icon': 'off',
        'apple-touch-icon': 'off',
        'splash-icon': 'off',
        'theme-color': 'off'
      },
      preset: 'lighthouse:no-pwa'
    },
    upload: {
      target: 'temporary-public-storage',
      reportFilenamePattern: '%%PATHNAME%%-%%DATETIME%%-report.%%EXTENSION%%'
    },
    server: {
      port: 9009,
      storage: {
        storageMethod: 'sql',
        sqlDialect: 'sqlite',
        sqlDatabasePath: './.lighthouseci/lhci-results.db'
      }
    }
  },
  // Mobile testing configuration
  mobile: {
    collect: {
      url: [
        'http://localhost:8080',
        'http://localhost:8080/beauty',
        'http://localhost:8080/fitness',
        'http://localhost:8080/booking'
      ],
      numberOfRuns: 3,
      settings: {
        chromeFlags: '--no-sandbox --headless --disable-gpu --disable-dev-shm-usage',
        preset: 'mobile',
        throttling: {
          rttMs: 150,
          throughputKbps: 1500,
          cpuSlowdownMultiplier: 4,
          requestLatencyMs: 150,
          downloadThroughputKbps: 1500,
          uploadThroughputKbps: 750
        },
        screenEmulation: {
          mobile: true,
          width: 375,
          height: 667,
          deviceScaleFactor: 2,
          disabled: false
        },
        emulatedUserAgent: 'Mozilla/5.0 (Linux; Android 10; SM-G975F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36'
      }
    },
    assert: {
      assertions: {
        'categories:performance': ['warn', { minScore: 0.85 }],
        'largest-contentful-paint': ['warn', { maxNumericValue: 4000 }],
        'first-contentful-paint': ['warn', { maxNumericValue: 3000 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.15 }],
        'total-blocking-time': ['warn', { maxNumericValue: 300 }],
        'speed-index': ['warn', { maxNumericValue: 4300 }],
        'interactive': ['warn', { maxNumericValue: 5000 }]
      }
    }
  },
  // Slow 3G network testing
  slow3g: {
    collect: {
      url: [
        'http://localhost:8080',
        'http://localhost:8080/booking'
      ],
      numberOfRuns: 2,
      settings: {
        chromeFlags: '--no-sandbox --headless --disable-gpu --disable-dev-shm-usage',
        preset: 'desktop',
        throttling: {
          rttMs: 2000,
          throughputKbps: 500,
          cpuSlowdownMultiplier: 4,
          requestLatencyMs: 2000,
          downloadThroughputKbps: 500,
          uploadThroughputKbps: 500
        }
      }
    },
    assert: {
      assertions: {
        'categories:performance': ['warn', { minScore: 0.70 }],
        'largest-contentful-paint': ['warn', { maxNumericValue: 8000 }],
        'first-contentful-paint': ['warn', { maxNumericValue: 6000 }],
        'speed-index': ['warn', { maxNumericValue: 10000 }],
        'interactive': ['warn', { maxNumericValue: 12000 }]
      }
    }
  },
  wizard: {
    firstParty: [
      'mariaborysevych.com',
      'localhost'
    ],
    url: [],
    settings: {}
  }
};