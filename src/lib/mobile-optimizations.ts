// Mobile performance optimizations for luxury booking platform

// Touch interaction optimization
export const touchOptimizations = {
  // Prevent double-tap zoom on buttons
  preventDoubleTapZoom: () => {
    let lastTouchEnd = 0;

    document.addEventListener('touchend', (event) => {
      const now = Date.now();

      if (now - lastTouchEnd <= 300) {
        event.preventDefault();
      }

      lastTouchEnd = now;
    }, false);
  },

  // Optimize touch targets for mobile
  optimizeTouchTargets: () => {
    const style = document.createElement('style');
    style.textContent = `
      @media (pointer: coarse) {
        button, [role="button"], a {
          min-height: 44px;
          min-width: 44px;
        }

        input, select, textarea {
          min-height: 44px;
        }

        .clickable {
          min-height: 44px;
          min-width: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
      }
    `;
    document.head.appendChild(style);
  },

  // Disable hover effects on touch devices
  disableHoverOnTouch: () => {
    if ('ontouchstart' in window) {
      const style = document.createElement('style');
      style.textContent = `
        * {
          -webkit-tap-highlight-color: transparent;
        }

        @media (hover: none) {
          .hover-effect:hover {
            transform: none !important;
            box-shadow: none !important;
          }
        }
      `;
      document.head.appendChild(style);
    }
  },
};

// Mobile-specific image optimization
export const mobileImageOptimization = {
  // Create responsive image sources
  createResponsiveSources: (imagePath: string, alt: string, className?: string) => {
    const img = document.createElement('img');
    img.alt = alt;
    img.className = className || '';

    // Create picture element for responsive images
    const picture = document.createElement('picture');

    // Add mobile-optimized source
    const mobileSource = document.createElement('source');
    mobileSource.media = '(max-width: 768px)';
    mobileSource.srcset = imagePath.replace(/\.(jpg|png|webp)$/, '-mobile.$1');

    // Add tablet source
    const tabletSource = document.createElement('source');
    tabletSource.media = '(max-width: 1024px)';
    tabletSource.srcset = imagePath.replace(/\.(jpg|png|webp)$/, '-tablet.$1');

    // Add desktop source
    const desktopSource = document.createElement('source');
    desktopSource.media = '(min-width: 1025px)';
    desktopSource.srcset = imagePath;

    picture.appendChild(mobileSource);
    picture.appendChild(tabletSource);
    picture.appendChild(desktopSource);
    picture.appendChild(img);

    return picture;
  },

  // Lazy load images with Intersection Observer
  lazyLoadImages: () => {
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          if (img.dataset.src) {
            img.src = img.dataset.src;
            img.classList.remove('lazy');
            imageObserver.unobserve(img);
          }
        }
      });
    }, {
      rootMargin: '50px 0px',
      threshold: 0.01,
    });

    document.querySelectorAll('img[data-src]').forEach((img) => {
      imageObserver.observe(img);
    });
  },
};

// Mobile performance monitoring
export const mobilePerformanceMonitoring = {
  // Monitor Core Web Vitals on mobile
  monitorCoreWebVitals: () => {
    if ('PerformanceObserver' in window) {
      // Largest Contentful Paint (LCP)
      new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        const lastEntry = entries[entries.length - 1];
        console.log('LCP:', lastEntry.renderTime || lastEntry.loadTime);
      }).observe({ entryTypes: ['largest-contentful-paint'] });

      // First Input Delay (FID)
      new PerformanceObserver((entryList) => {
        entryList.getEntries().forEach((entry) => {
          console.log('FID:', entry.processingStart - entry.startTime);
        });
      }).observe({ entryTypes: ['first-input'] });

      // Cumulative Layout Shift (CLS)
      let clsValue = 0;
      new PerformanceObserver((entryList) => {
        entryList.getEntries().forEach((entry) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        });
        console.log('CLS:', clsValue);
      }).observe({ entryTypes: ['layout-shift'] });
    }
  },

  // Monitor memory usage on mobile
  monitorMemoryUsage: () => {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      console.log('Memory usage:', {
        used: Math.round(memory.usedJSHeapSize / 1048576) + ' MB',
        total: Math.round(memory.totalJSHeapSize / 1048576) + ' MB',
        limit: Math.round(memory.jsHeapSizeLimit / 1048576) + ' MB',
      });
    }
  },

  // Monitor connection quality
  monitorConnectionQuality: () => {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      console.log('Connection:', {
        effectiveType: connection.effectiveType,
        downlink: connection.downlink + ' Mbps',
        rtt: connection.rtt + ' ms',
      });

      // Optimize based on connection quality
      if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
        document.body.classList.add('slow-connection');
      }
    }
  },
};

// Mobile-specific UI optimizations
export const mobileUIOptimizations = {
  // Optimize scrolling performance
  optimizeScrolling: () => {
    const style = document.createElement('style');
    style.textContent = `
      body {
        -webkit-overflow-scrolling: touch;
        overscroll-behavior-y: contain;
      }

      .scroll-container {
        scroll-behavior: smooth;
        -webkit-overflow-scrolling: touch;
      }

      @media (max-width: 768px) {
        .no-scroll-mobile {
          overflow: hidden;
        }
      }
    `;
    document.head.appendChild(style);
  },

  // Optimize form interactions for mobile
  optimizeFormInteractions: () => {
    const style = document.createElement('style');
    style.textContent = `
      @media (max-width: 768px) {
        input, textarea, select {
          font-size: 16px !important; /* Prevent zoom on iOS */
          -webkit-appearance: none;
          border-radius: 0;
        }

        .form-group {
          margin-bottom: 1.5rem;
        }

        .mobile-button {
          min-height: 48px;
          font-size: 16px;
          padding: 12px 24px;
        }
      }
    `;
    document.head.appendChild(style);
  },

  // Add safe area insets for iOS devices
  addSafeAreaInsets: () => {
    const style = document.createElement('style');
    style.textContent = `
      @supports (padding: max(0px)) {
        .safe-area-top {
          padding-top: max(env(safe-area-inset-top), 20px);
        }

        .safe-area-bottom {
          padding-bottom: max(env(safe-area-inset-bottom), 20px);
        }

        .safe-area-left {
          padding-left: max(env(safe-area-inset-left), 20px);
        }

        .safe-area-right {
          padding-right: max(env(safe-area-inset-right), 20px);
        }
      }
    `;
    document.head.appendChild(style);
  },
};

// Progressive loading for mobile
export const progressiveLoading = {
  // Load critical resources first
  loadCriticalResources: async () => {
    const criticalResources = [
      // Add critical CSS files
      '/assets/css/critical.css',
      // Add critical fonts
      '/assets/fonts/luxury-font.woff2',
    ];

    await Promise.all(
      criticalResources.map(resource => {
        return new Promise((resolve, reject) => {
          const link = document.createElement('link');
          link.rel = 'preload';
          link.href = resource;
          link.as = resource.endsWith('.css') ? 'style' : 'font';
          link.crossOrigin = 'anonymous';
          link.onload = resolve;
          link.onerror = reject;
          document.head.appendChild(link);
        });
      })
    );
  },

  // Load non-critical resources after page load
  loadNonCriticalResources: () => {
    setTimeout(() => {
      const nonCriticalResources = [
        // Add non-critical JS files
        '/assets/js/non-critical.js',
        // Add analytics
        '/assets/js/analytics.js',
      ];

      nonCriticalResources.forEach(resource => {
        const script = document.createElement('script');
        script.src = resource;
        script.async = true;
        document.body.appendChild(script);
      });
    }, 2000); // Wait 2 seconds after page load
  },
};

// Initialize all mobile optimizations
export const initializeMobileOptimizations = () => {
  // Only apply on mobile devices
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
                  window.innerWidth <= 768;

  if (!isMobile) return;

  console.log('🚀 Initializing mobile optimizations...');

  // Apply touch optimizations
  touchOptimizations.preventDoubleTapZoom();
  touchOptimizations.optimizeTouchTargets();
  touchOptimizations.disableHoverOnTouch();

  // Apply UI optimizations
  mobileUIOptimizations.optimizeScrolling();
  mobileUIOptimizations.optimizeFormInteractions();
  mobileUIOptimizations.addSafeAreaInsets();

  // Initialize image optimizations
  mobileImageOptimization.lazyLoadImages();

  // Start performance monitoring
  mobilePerformanceMonitoring.monitorCoreWebVitals();
  mobilePerformanceMonitoring.monitorMemoryUsage();
  mobilePerformanceMonitoring.monitorConnectionQuality();

  // Initialize progressive loading
  progressiveLoading.loadCriticalResources().then(() => {
    progressiveLoading.loadNonCriticalResources();
  });

  console.log('✅ Mobile optimizations initialized');
};

// Export utility for manual initialization
export default {
  touch: touchOptimizations,
  images: mobileImageOptimization,
  performance: mobilePerformanceMonitoring,
  ui: mobileUIOptimizations,
  progressive: progressiveLoading,
  initialize: initializeMobileOptimizations,
};