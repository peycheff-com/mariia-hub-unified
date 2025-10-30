/**
 * Performance Optimization Recommendations and Reporting System
 * Automated analysis, recommendations, and performance coaching for luxury platform
 */

interface PerformanceRecommendation {
  id: string;
  category: 'bundle' | 'image' | 'api' | 'caching' | 'rendering' | 'network' | 'mobile' | 'third-party';
  priority: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  impact: {
    performance: number; // Expected performance improvement (0-100)
   用户体验: number; // User experience improvement (0-100)
    business: number; // Business impact (0-100)
  };
  effort: {
    implementation: number; // Implementation effort (1-10)
    complexity: number; // Technical complexity (1-10)
    maintenance: number; // Maintenance overhead (1-10)
  };
  steps: RecommendationStep[];
  codeExamples?: CodeExample[];
  resources?: Resource[];
  tags: string[];
  applicableTo: string[]; // Page types, components, etc.
  conditions?: RecommendationCondition[];
}

interface RecommendationStep {
  title: string;
  description: string;
  action: string;
  expectedOutcome: string;
  timeEstimate: string;
  dependencies?: string[];
}

interface CodeExample {
  title: string;
  language: string;
  code: string;
  explanation: string;
  before?: string;
  after?: string;
}

interface Resource {
  title: string;
  url: string;
  type: 'documentation' | 'tool' | 'library' | 'article' | 'video';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

interface RecommendationCondition {
  metric: string;
  operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
  value: number;
  context?: string;
}

interface PerformanceReport {
  id: string;
  timestamp: string;
  url?: string;
  sessionId: string;
  overallScore: number;
  metrics: PerformanceMetrics;
  recommendations: PerformanceRecommendation[];
  actionableItems: ActionableItem[];
  implementationPlan: ImplementationPlan;
  businessImpact: BusinessImpact;
  nextSteps: NextStep[];
}

interface PerformanceMetrics {
  coreWebVitals: {
    lcp: number;
    fid: number;
    cls: number;
    fcp: number;
    ttfb: number;
  };
  bundleAnalysis: {
    totalSize: number;
    chunkCount: number;
    largestChunk: number;
    unusedCode: number;
  };
  networkMetrics: {
    totalRequests: number;
    totalSize: number;
    cachedResources: number;
    slowResources: number;
  };
  renderPerformance: {
    firstPaint: number;
    speedIndex: number;
    timeToInteractive: number;
    totalBlockingTime: number;
  };
}

interface ActionableItem {
  id: string;
  recommendationId: string;
  title: string;
  description: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  estimatedTime: string;
  dependencies: string[];
  status: 'pending' | 'in-progress' | 'completed' | 'blocked';
  assignedTo?: string;
  dueDate?: string;
}

interface ImplementationPlan {
  phases: ImplementationPhase[];
  timeline: string;
  resources: string[];
  risks: Risk[];
}

interface ImplementationPhase {
  name: string;
  duration: string;
  items: string[];
  dependencies: string[];
  expectedImpact: string;
}

interface Risk {
  description: string;
  probability: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  mitigation: string;
}

interface BusinessImpact {
  conversions: {
    potential: number;
    confidence: number;
  };
  userExperience: {
    satisfaction: number;
    retention: number;
  };
  technicalDebt: {
    reduction: number;
    maintenance: number;
  };
  revenue: {
    potential: number;
    timeframe: string;
  };
}

interface NextStep {
  action: string;
  description: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  estimatedTime: string;
  assignee?: string;
}

const RECOMMENDATION_TEMPLATES: PerformanceRecommendation[] = [
  // Bundle Optimization Recommendations
  {
    id: 'bundle-code-splitting',
    category: 'bundle',
    priority: 'high',
    title: 'Implement Advanced Code Splitting',
    description: 'Split large bundles into smaller, focused chunks to reduce initial load time and improve caching efficiency',
    impact: {
      performance: 85,
      用户体验: 80,
      business: 70
    },
    effort: {
      implementation: 6,
      complexity: 5,
      maintenance: 3
    },
    steps: [
      {
        title: 'Analyze current bundle structure',
        description: 'Use webpack-bundle-analyzer to identify large bundles and shared dependencies',
        action: 'Run npm run build:analyze and review bundle composition',
        expectedOutcome: 'Clear understanding of bundle size distribution',
        timeEstimate: '2 hours'
      },
      {
        title: 'Implement route-based splitting',
        description: 'Lazy load routes using React.lazy() and Suspense',
        action: 'Convert route components to lazy-loaded modules',
        expectedOutcome: '30-50% reduction in initial bundle size',
        timeEstimate: '4-6 hours'
      },
      {
        title: 'Add component-level splitting',
        description: 'Identify and lazy load heavy components (charts, admin panels)',
        action: 'Wrap heavy components in React.lazy() with loading states',
        expectedOutcome: 'Faster initial page loads',
        timeEstimate: '6-8 hours'
      }
    ],
    codeExamples: [
      {
        title: 'Route-based Code Splitting',
        language: 'typescript',
        code: `// Before
import BeautyPage from './pages/BeautyPage';
import FitnessPage from './pages/FitnessPage';

// After
const BeautyPage = lazy(() => import('./pages/BeautyPage'));
const FitnessPage = lazy(() => import('./pages/FitnessPage'));

// In router
<Suspense fallback={<Loading />}>
  <Route path="/beauty" component={BeautyPage} />
  <Route path="/fitness" component={FitnessPage} />
</Suspense>`,
        explanation: 'Lazy loading routes reduces initial bundle size and loads code only when needed'
      }
    ],
    resources: [
      {
        title: 'React Code Splitting Guide',
        url: 'https://reactjs.org/docs/code-splitting.html',
        type: 'documentation',
        difficulty: 'intermediate'
      }
    ],
    tags: ['bundle', 'lazy-loading', 'performance'],
    applicableTo: ['all-pages', 'admin-panel', 'booking-flow']
  },
  {
    id: 'image-optimization',
    category: 'image',
    priority: 'critical',
    title: 'Optimize Images for Luxury Platform',
    description: 'Implement modern image formats, responsive images, and compression to significantly reduce page load time',
    impact: {
      performance: 90,
      用户体验: 85,
      business: 80
    },
    effort: {
      implementation: 4,
      complexity: 3,
      maintenance: 2
    },
    steps: [
      {
        title: 'Convert to modern formats',
        description: 'Convert JPG/PNG images to WebP/AVIF for better compression',
        action: 'Use image optimization tools or build process to convert images',
        expectedOutcome: '30-50% reduction in image file sizes',
        timeEstimate: '3-4 hours'
      },
      {
        title: 'Implement responsive images',
        description: 'Create multiple image sizes and use srcset for different screen sizes',
        action: 'Add srcset and sizes attributes to img elements',
        expectedOutcome: 'Faster loading on mobile devices',
        timeEstimate: '4-6 hours'
      },
      {
        title: 'Add lazy loading',
        description: 'Lazy load images that are below the fold',
        action: 'Add loading="lazy" attribute or use Intersection Observer',
        expectedOutcome: 'Immediate initial page load',
        timeEstimate: '2-3 hours'
      }
    ],
    codeExamples: [
      {
        title: 'Responsive Image with WebP',
        language: 'html',
        code: `<picture>
  <source
    srcset="/images/hero.webp 800w, /images/hero-large.webp 1200w"
    sizes="(max-width: 768px) 100vw, 50vw"
    type="image/webp"
  />
  <source
    srcset="/images/hero.jpg 800w, /images/hero-large.jpg 1200w"
    sizes="(max-width: 768px) 100vw, 50vw"
    type="image/jpeg"
  />
  <img
    src="/images/hero.jpg"
    alt="Luxury beauty treatment"
    loading="lazy"
    width="1200"
    height="600"
  />
</picture>`,
        explanation: 'Picture element with WebP fallback to JPEG, responsive sizing, and lazy loading'
      }
    ],
    resources: [
      {
        title: 'WebP Image Guide',
        url: 'https://web.dev/serve-images-webp/',
        type: 'documentation',
        difficulty: 'beginner'
      }
    ],
    tags: ['images', 'responsive', 'webp', 'lazy-loading'],
    applicableTo: ['hero-sections', 'galleries', 'product-images']
  },
  {
    id: 'api-optimization',
    category: 'api',
    priority: 'high',
    title: 'Optimize API Performance',
    description: 'Improve API response times through caching, query optimization, and request batching',
    impact: {
      performance: 80,
      用户体验: 85,
      business: 75
    },
    effort: {
      implementation: 7,
      complexity: 6,
      maintenance: 4
    },
    steps: [
      {
        title: 'Implement response caching',
        description: 'Add Redis or Supabase Edge Functions caching for frequently accessed data',
        action: 'Set up caching layer for services, availability, and static content',
        expectedOutcome: '50-80% reduction in API response time',
        timeEstimate: '6-8 hours'
      },
      {
        title: 'Optimize database queries',
        description: 'Add indexes, optimize joins, and reduce N+1 queries',
        action: 'Analyze slow queries and add appropriate database indexes',
        expectedOutcome: '40-60% faster database operations',
        timeEstimate: '4-6 hours'
      },
      {
        title: 'Implement request batching',
        description: 'Combine multiple API calls into single requests where possible',
        action: 'Create batch endpoints for related data fetching',
        expectedOutcome: 'Reduced HTTP overhead and faster page loads',
        timeEstimate: '8-10 hours'
      }
    ],
    codeExamples: [
      {
        title: 'React Query with Caching',
        language: 'typescript',
        code: `// Configure React Query for optimal caching
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      retry: 3,
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
  },
});

// Use query for services with caching
const { data: services } = useQuery({
  queryKey: ['services', category],
  queryFn: () => fetchServices(category),
  staleTime: 10 * 60 * 1000, // 10 minutes for service data
});`,
        explanation: 'React Query configuration with appropriate caching for different data types'
      }
    ],
    tags: ['api', 'caching', 'react-query', 'database'],
    applicableTo: ['booking-flow', 'admin-dashboard', 'service-listing']
  },
  {
    id: 'rendering-optimization',
    category: 'rendering',
    priority: 'high',
    title: 'Optimize Rendering Performance',
    description: 'Reduce render blocking, minimize layout thrashing, and optimize animations for 60fps performance',
    impact: {
      performance: 85,
      用户体验: 90,
      business: 70
    },
    effort: {
      implementation: 5,
      complexity: 4,
      maintenance: 3
    },
    steps: [
      {
        title: 'Optimize Critical Rendering Path',
        description: 'Inline critical CSS and defer non-critical stylesheets',
        action: 'Identify and inline above-the-fold CSS, load other styles asynchronously',
        expectedOutcome: 'Faster first paint and reduced render blocking',
        timeEstimate: '3-4 hours'
      },
      {
        title: 'Implement CSS containment',
        description: 'Use CSS contain property to limit browser reflow scope',
        action: 'Add contain property to layout-independent components',
        expectedOutcome: 'Faster layout calculations and smoother interactions',
        timeEstimate: '2-3 hours'
      },
      {
        title: 'Optimize animations',
        description: 'Use CSS transforms and will-change for smooth 60fps animations',
        action: 'Replace layout-affecting properties with transform/opacity',
        expectedOutcome: 'Smooth animations without layout thrashing',
        timeEstimate: '4-6 hours'
      }
    ],
    codeExamples: [
      {
        title: 'Optimized Animation',
        language: 'css',
        code: `/* Before - causes layout thrashing */
.hero-animation {
  animation: slideIn 0.5s ease-out;
}

@keyframes slideIn {
  from {
    transform: translateX(-100%);
    left: 0; /* Triggers layout */
  }
  to {
    transform: translateX(0);
    left: 100px; /* Triggers layout */
  }
}

/* After - optimized for 60fps */
.hero-animation {
  will-change: transform;
  contain: layout style paint;
  animation: slideInOptimized 0.5s ease-out;
  transform: translateX(0); /* Initial state */
}

@keyframes slideInOptimized {
  from {
    transform: translateX(-100%);
  }
  to {
    transform: translateX(0);
  }
}`,
        explanation: 'Animation optimization using transform, will-change, and CSS containment'
      }
    ],
    tags: ['rendering', 'animations', 'css', 'performance'],
    applicableTo: ['hero-animations', 'page-transitions', 'interactive-elements']
  },
  {
    id: 'caching-strategy',
    category: 'caching',
    priority: 'high',
    title: 'Implement Comprehensive Caching Strategy',
    description: 'Multi-layer caching approach including browser cache, CDN, service worker, and application-level caching',
    impact: {
      performance: 90,
      用户体验: 80,
      business: 85
    },
    effort: {
      implementation: 6,
      complexity: 5,
      maintenance: 4
    },
    steps: [
      {
        title: 'Configure Service Worker Caching',
        description: 'Implement cache-first strategy for static assets and stale-while-revalidate for API calls',
        action: 'Set up Workbox or custom service worker with appropriate caching strategies',
        expectedOutcome: 'Instant loading for repeat visits and offline functionality',
        timeEstimate: '8-10 hours'
      },
      {
        title: 'Optimize HTTP Cache Headers',
        description: 'Set appropriate cache-control headers for different resource types',
        action: 'Configure server or CDN to send optimal cache headers',
        expectedOutcome: 'Efficient browser caching and reduced server load',
        timeEstimate: '3-4 hours'
      },
      {
        title: 'Implement Application-level Caching',
        description: 'Add memory caching for computed values and frequently accessed data',
        action: 'Use React Query, localStorage, or IndexedDB for client-side caching',
        expectedOutcome: 'Faster UI interactions and reduced API calls',
        timeEstimate: '4-6 hours'
      }
    ],
    codeExamples: [
      {
        title: 'Service Worker Caching Strategy',
        language: 'javascript',
        code: `// Service worker with different caching strategies
const CACHE_NAME = 'mariia-hub-v1';
const STATIC_ASSETS = [
  '/',
  '/styles/main.css',
  '/scripts/main.js',
  '/images/logo.webp'
];

// Cache-first for static assets
self.addEventListener('fetch', event => {
  if (STATIC_ASSETS.some(asset => event.request.url.includes(asset))) {
    event.respondWith(
      caches.match(event.request)
        .then(response => response || fetch(event.request))
    );
  }
});

// Stale-while-revalidate for API calls
if (event.request.url.includes('/api/')) {
  event.respondWith(
    caches.open(CACHE_NAME)
      .then(cache => cache.match(event.request))
      .then(response => {
        const fetchPromise = fetch(event.request).then(response => {
          cache.put(event.request, response.clone());
          return response;
        });
        return response || fetchPromise;
      })
  );
}`,
        explanation: 'Service worker implementing cache-first for assets and stale-while-revalidate for APIs'
      }
    ],
    tags: ['caching', 'service-worker', 'pwa', 'performance'],
    applicableTo: ['static-assets', 'api-responses', 'offline-functionality']
  }
];

class PerformanceRecommendationsEngine {
  private recommendations: Map<string, PerformanceRecommendation> = new Map();
  private reports: PerformanceReport[] = [];
  private isInitialized = false;

  constructor() {
    this.initializeRecommendations();
  }

  private initializeRecommendations() {
    RECOMMENDATION_TEMPLATES.forEach(rec => {
      this.recommendations.set(rec.id, rec);
    });

    // Load custom recommendations
    this.loadCustomRecommendations();
  }

  private loadCustomRecommendations() {
    try {
      const customRecs = localStorage.getItem('custom-performance-recommendations');
      if (customRecs) {
        const recommendations = JSON.parse(customRecs);
        recommendations.forEach((rec: PerformanceRecommendation) => {
          this.recommendations.set(rec.id, rec);
        });
      }
    } catch (error) {
      console.warn('Failed to load custom recommendations:', error);
    }
  }

  public initialize() {
    if (this.isInitialized) return;
    this.isInitialized = true;

    console.log('🧠 Initializing Performance Recommendations Engine...');

    // Register with performance monitoring systems
    this.registerWithMonitoringSystems();

    // Set up periodic analysis
    this.setupPeriodicAnalysis();

    console.log('✅ Performance recommendations engine initialized');
  }

  private registerWithMonitoringSystems() {
    // Listen to performance metrics from APM and RUM systems
    window.addEventListener('performance-data', (event: any) => {
      this.analyzePerformanceData(event.detail);
    });
  }

  private setupPeriodicAnalysis() {
    // Run analysis every 5 minutes
    setInterval(() => {
      this.runPerformanceAnalysis();
    }, 5 * 60 * 1000);

    // Run initial analysis
    this.runPerformanceAnalysis();
  }

  public async generateReport(url?: string): Promise<PerformanceReport> {
    console.log('📊 Generating performance recommendations report...');

    const metrics = await this.collectPerformanceMetrics(url);
    const applicableRecommendations = this.getApplicableRecommendations(metrics);
    const actionableItems = this.generateActionableItems(applicableRecommendations);
    const implementationPlan = this.createImplementationPlan(actionableItems);
    const businessImpact = this.calculateBusinessImpact(metrics, actionableItems);
    const nextSteps = this.generateNextSteps(actionableItems);

    const report: PerformanceReport = {
      id: this.generateReportId(),
      timestamp: new Date().toISOString(),
      url,
      sessionId: this.getSessionId(),
      overallScore: this.calculateOverallScore(metrics),
      metrics,
      recommendations: applicableRecommendations,
      actionableItems,
      implementationPlan,
      businessImpact,
      nextSteps
    };

    this.reports.push(report);
    await this.saveReport(report);

    return report;
  }

  private async collectPerformanceMetrics(url?: string): Promise<PerformanceMetrics> {
    // Get metrics from performance monitoring systems
    const coreWebVitals = await this.getCoreWebVitals();
    const bundleAnalysis = await this.getBundleAnalysis();
    const networkMetrics = await this.getNetworkMetrics();
    const renderPerformance = await this.getRenderPerformance();

    return {
      coreWebVitals,
      bundleAnalysis,
      networkMetrics,
      renderPerformance
    };
  }

  private async getCoreWebVitals() {
    // This would get data from RUM system
    return {
      lcp: 2100,
      fid: 45,
      cls: 0.08,
      fcp: 1600,
      ttfb: 450
    };
  }

  private async getBundleAnalysis() {
    // This would analyze current bundles
    return {
      totalSize: 280000,
      chunkCount: 12,
      largestChunk: 85000,
      unusedCode: 15
    };
  }

  private async getNetworkMetrics() {
    // This would analyze network performance
    return {
      totalRequests: 45,
      totalSize: 850000,
      cachedResources: 30,
      slowResources: 3
    };
  }

  private async getRenderPerformance() {
    // This would analyze rendering performance
    return {
      firstPaint: 1200,
      speedIndex: 2800,
      timeToInteractive: 3000,
      totalBlockingTime: 120
    };
  }

  private getApplicableRecommendations(metrics: PerformanceMetrics): PerformanceRecommendation[] {
    const applicable: PerformanceRecommendation[] = [];

    this.recommendations.forEach(rec => {
      if (this.isRecommendationApplicable(rec, metrics)) {
        applicable.push(rec);
      }
    });

    // Sort by impact score (high to low)
    return applicable.sort((a, b) => {
      const scoreA = (a.impact.performance + a.impact.用户体验 + a.impact.business) / 3;
      const scoreB = (b.impact.performance + b.impact.用户体验 + b.impact.business) / 3;
      return scoreB - scoreA;
    });
  }

  private isRecommendationApplicable(rec: PerformanceRecommendation, metrics: PerformanceMetrics): boolean {
    // Check if recommendation conditions are met
    if (!rec.conditions) return true;

    return rec.conditions.every(condition => {
      const metricValue = this.getMetricValue(condition.metric, metrics);
      if (metricValue === undefined) return false;

      switch (condition.operator) {
        case 'gt': return metricValue > condition.value;
        case 'lt': return metricValue < condition.value;
        case 'gte': return metricValue >= condition.value;
        case 'lte': return metricValue <= condition.value;
        case 'eq': return metricValue === condition.value;
        default: return false;
      }
    });
  }

  private getMetricValue(metric: string, metrics: PerformanceMetrics): number | undefined {
    switch (metric) {
      case 'lcp': return metrics.coreWebVitals.lcp;
      case 'fid': return metrics.coreWebVitals.fid;
      case 'cls': return metrics.coreWebVitals.cls;
      case 'fcp': return metrics.coreWebVitals.fcp;
      case 'ttfb': return metrics.coreWebVitals.ttfb;
      case 'totalBundleSize': return metrics.bundleAnalysis.totalSize;
      case 'chunkCount': return metrics.bundleAnalysis.chunkCount;
      case 'unusedCode': return metrics.bundleAnalysis.unusedCode;
      case 'totalRequests': return metrics.networkMetrics.totalRequests;
      case 'totalSize': return metrics.networkMetrics.totalSize;
      case 'timeToInteractive': return metrics.renderPerformance.timeToInteractive;
      case 'totalBlockingTime': return metrics.renderPerformance.totalBlockingTime;
      default: return undefined;
    }
  }

  private generateActionableItems(recommendations: PerformanceRecommendation[]): ActionableItem[] {
    const items: ActionableItem[] = [];

    recommendations.forEach(rec => {
      rec.steps.forEach((step, index) => {
        items.push({
          id: `${rec.id}-${index}`,
          recommendationId: rec.id,
          title: step.title,
          description: step.description,
          priority: rec.priority,
          estimatedTime: step.timeEstimate,
          dependencies: step.dependencies || [],
          status: 'pending'
        });
      });
    });

    // Sort by priority and estimated time
    return items.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;

      // If same priority, sort by estimated time (shorter first)
      const timeA = parseInt(a.estimatedTime) || 0;
      const timeB = parseInt(b.estimatedTime) || 0;
      return timeA - timeB;
    });
  }

  private createImplementationPlan(items: ActionableItem[]): ImplementationPlan {
    const phases: ImplementationPhase[] = [
      {
        name: 'Quick Wins',
        duration: '1-2 weeks',
        items: items.filter(item =>
          item.priority === 'critical' &&
          (item.estimatedTime.includes('1') || item.estimatedTime.includes('2'))
        ).map(item => item.id),
        dependencies: [],
        expectedImpact: 'Immediate performance improvements and user experience enhancements'
      },
      {
        name: 'Core Optimizations',
        duration: '3-4 weeks',
        items: items.filter(item =>
          item.priority === 'high' ||
          (item.priority === 'critical' && item.estimatedTime.includes('3'))
        ).map(item => item.id),
        dependencies: ['Quick Wins'],
        expectedImpact: 'Significant performance score improvements (10-20 points)'
      },
      {
        name: 'Advanced Optimizations',
        duration: '5-8 weeks',
        items: items.filter(item =>
          item.priority === 'medium' ||
          (item.priority === 'high' && parseInt(item.estimatedTime) > 3)
        ).map(item => item.id),
        dependencies: ['Core Optimizations'],
        expectedImpact: 'Long-term performance stability and scalability'
      }
    ];

    return {
      phases,
      timeline: '8-10 weeks total',
      resources: ['Frontend Developer', 'Performance Engineer', 'DevOps Engineer'],
      risks: [
        {
          description: 'Performance regressions during implementation',
          probability: 'medium',
          impact: 'medium',
          mitigation: 'Implement comprehensive testing and gradual rollout'
        },
        {
          description: 'Third-party service dependencies affecting performance',
          probability: 'low',
          impact: 'high',
          mitigation: 'Monitor third-party performance and have fallback strategies'
        }
      ]
    };
  }

  private calculateBusinessImpact(metrics: PerformanceMetrics, items: ActionableItem[]): BusinessImpact {
    const performanceScore = this.calculateOverallScore(metrics);

    // Estimate conversion improvements based on performance score
    const conversionImprovement = performanceScore > 90 ? 8 :
                                performanceScore > 80 ? 5 :
                                performanceScore > 70 ? 3 : 1;

    return {
      conversions: {
        potential: conversionImprovement,
        confidence: 0.75
      },
      userExperience: {
        satisfaction: Math.min(performanceScore, 100),
        retention: Math.min(performanceScore * 0.8, 100)
      },
      technicalDebt: {
        reduction: items.filter(item => item.priority === 'critical').length * 15,
        maintenance: items.length * 5
      },
      revenue: {
        potential: conversionImprovement * 2.5, // Estimated revenue multiplier
        timeframe: '3-6 months'
      }
    };
  }

  private generateNextSteps(items: ActionableItem[]): NextStep[] {
    const criticalItems = items.filter(item => item.priority === 'critical').slice(0, 3);

    return criticalItems.map(item => ({
      action: `Implement ${item.title}`,
      description: item.description,
      priority: item.priority,
      estimatedTime: item.estimatedTime,
      assignee: 'Performance Team'
    }));
  }

  private calculateOverallScore(metrics: PerformanceMetrics): number {
    // Convert Core Web Vitals to scores
    const lcpScore = Math.max(0, 100 - (metrics.coreWebVitals.lcp - 1000) / 40);
    const fidScore = Math.max(0, 100 - metrics.coreWebVitals.fid / 5);
    const clsScore = Math.max(0, 100 - metrics.coreWebVitals.cls * 1000);
    const fcpScore = Math.max(0, 100 - (metrics.coreWebVitals.fcp - 800) / 30);

    // Bundle analysis score
    const bundleScore = Math.max(0, 100 - metrics.bundleAnalysis.totalSize / 5000);

    // Network performance score
    const networkScore = Math.max(0, 100 - metrics.networkMetrics.totalSize / 20000);

    // Overall average
    return Math.round((lcpScore + fidScore + clsScore + fcpScore + bundleScore + networkScore) / 6);
  }

  private generateReportId(): string {
    return `perf_report_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  }

  private getSessionId(): string {
    let sessionId = sessionStorage.getItem('performance_session_id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
      sessionStorage.setItem('performance_session_id', sessionId);
    }
    return sessionId;
  }

  private async saveReport(report: PerformanceReport) {
    try {
      await fetch('/api/performance/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(report)
      });
    } catch (error) {
      console.warn('Failed to save performance report:', error);
      // Store locally for retry
      this.storeReportLocally(report);
    }
  }

  private storeReportLocally(report: PerformanceReport) {
    try {
      const reports = JSON.parse(localStorage.getItem('performance_reports') || '[]');
      reports.push(report);

      // Keep only last 10 reports
      if (reports.length > 10) {
        reports.splice(0, reports.length - 10);
      }

      localStorage.setItem('performance_reports', JSON.stringify(reports));
    } catch (error) {
      console.warn('Failed to store report locally:', error);
    }
  }

  private async analyzePerformanceData(data: any) {
    // Analyze incoming performance data and trigger recommendations if needed
    const metrics = await this.collectPerformanceMetrics();
    const applicableRecs = this.getApplicableRecommendations(metrics);

    if (applicableRecs.length > 0) {
      // Send notification about new recommendations
      this.sendRecommendationNotification(applicableRecs);
    }
  }

  private async runPerformanceAnalysis() {
    // Periodic performance analysis
    const report = await this.generateReport();

    // Check if critical issues exist
    const criticalItems = report.actionableItems.filter(item => item.priority === 'critical');
    if (criticalItems.length > 0) {
      this.sendCriticalAlert(criticalItems);
    }
  }

  private sendRecommendationNotification(recommendations: PerformanceRecommendation[]) {
    // Dispatch event for UI components to handle
    window.dispatchEvent(new CustomEvent('performance-recommendations', {
      detail: { recommendations, timestamp: Date.now() }
    }));
  }

  private sendCriticalAlert(items: ActionableItem[]) {
    // Dispatch critical alert event
    window.dispatchEvent(new CustomEvent('performance-critical-alert', {
      detail: {
        items,
        message: `${items.length} critical performance issues require attention`,
        timestamp: Date.now()
      }
    }));
  }

  // Public API methods
  public getRecommendations(): PerformanceRecommendation[] {
    return Array.from(this.recommendations.values());
  }

  public getRecommendation(id: string): PerformanceRecommendation | undefined {
    return this.recommendations.get(id);
  }

  public addRecommendation(rec: PerformanceRecommendation): void {
    this.recommendations.set(rec.id, rec);
    this.saveCustomRecommendations();
  }

  public getReports(): PerformanceReport[] {
    return this.reports;
  }

  public getLatestReport(): PerformanceReport | undefined {
    return this.reports[this.reports.length - 1];
  }

  private saveCustomRecommendations() {
    try {
      const customRecs = Array.from(this.recommendations.values())
        .filter(rec => !RECOMMENDATION_TEMPLATES.some(template => template.id === rec.id));

      localStorage.setItem('custom-performance-recommendations', JSON.stringify(customRecs));
    } catch (error) {
      console.warn('Failed to save custom recommendations:', error);
    }
  }

  public destroy() {
    this.isInitialized = false;
  }
}

// Global instance
let recommendationsInstance: PerformanceRecommendationsEngine | null = null;

export const initializePerformanceRecommendations = () => {
  if (!recommendationsInstance && typeof window !== 'undefined') {
    recommendationsInstance = new PerformanceRecommendationsEngine();
    recommendationsInstance.initialize();
  }
  return recommendationsInstance;
};

export const getPerformanceRecommendations = () => recommendationsInstance;

export { PerformanceRecommendationsEngine };
export default PerformanceRecommendationsEngine;