/**
 * Screen Magnifier Optimization System
 *
 * Comprehensive optimization for screen magnifiers including
 * text reflow, high-resolution assets, and magnifier-friendly navigation.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Types for screen magnifier support
export interface MagnifierConfiguration {
  enabled: boolean;
  zoomLevel: number;
  followCursor: boolean;
  followFocus: boolean;
  showLens: boolean;
  lensSize: { width: number; height: number };
  smoothing: boolean;
  highContrast: boolean;
  largeText: boolean;
  enhancedCursors: boolean;
  colorInversion: boolean;
  customFilters: {
    brightness: number;
    contrast: number;
    saturation: number;
  };
  navigation: {
    showOverview: boolean;
    overviewPosition: 'corner' | 'side' | 'bottom';
    showRuler: boolean;
    showGrid: boolean;
  };
}

export interface MagnifierLens {
  x: number;
  y: number;
  width: number;
  height: number;
  zoomLevel: number;
  content: HTMLElement | null;
  isVisible: boolean;
}

export interface MagnifierRegion {
  id: string;
  element: HTMLElement;
  bounds: DOMRect;
  priority: 'low' | 'medium' | 'high';
  isMagnifiable: boolean;
  originalStyles: Record<string, string>;
  optimizedStyles: Record<string, string>;
}

export interface TextReflowSettings {
  enabled: boolean;
  maxWidth: number;
  lineHeight: number;
  fontSize: number;
  wordSpacing: number;
  letterSpacing: number;
}

interface MagnifierStore {
  // Configuration
  config: MagnifierConfiguration;
  textReflow: TextReflowSettings;

  // State
  isMagnifierActive: boolean;
  currentZoom: number;
  lens: MagnifierLens;
  activeRegion: string | null;
  magnifierRegions: Map<string, MagnifierRegion>;
  mousePosition: { x: number; y: number };
  focusedElement: HTMLElement | null;

  // Actions
  initialize: () => void;
  activateMagnifier: () => void;
  deactivateMagnifier: () => void;
  setZoomLevel: (level: number) => void;
  moveLens: (x: number, y: number) => void;
  focusElement: (element: HTMLElement) => void;
  updateConfiguration: (config: Partial<MagnifierConfiguration>) => void;
  addMagnifierRegion: (region: MagnifierRegion) => void;
  removeMagnifierRegion: (id: string) => void;
  enableTextReflow: () => void;
  disableTextReflow: () => void;
  updateTextReflow: (settings: Partial<TextReflowSettings>) => void;
  optimizeImages: () => void;
  restoreImages: () => void;
  showOverview: () => void;
  hideOverview: () => void;
  reset: () => void;
}

export const useScreenMagnifier = create<MagnifierStore>()(
  persist(
    (set, get) => ({
      // Default configuration
      config: {
        enabled: false,
        zoomLevel: 2,
        followCursor: true,
        followFocus: true,
        showLens: true,
        lensSize: { width: 200, height: 200 },
        smoothing: true,
        highContrast: false,
        largeText: false,
        enhancedCursors: false,
        colorInversion: false,
        customFilters: {
          brightness: 1,
          contrast: 1,
          saturation: 1
        },
        navigation: {
          showOverview: true,
          overviewPosition: 'corner',
          showRuler: false,
          showGrid: false
        }
      },

      textReflow: {
        enabled: false,
        maxWidth: 600,
        lineHeight: 1.6,
        fontSize: 16,
        wordSpacing: 0.1,
        letterSpacing: 0.05
      },

      // Initial state
      isMagnifierActive: false,
      currentZoom: 1,
      lens: {
        x: 0,
        y: 0,
        width: 200,
        height: 200,
        zoomLevel: 2,
        content: null,
        isVisible: false
      },
      activeRegion: null,
      magnifierRegions: new Map(),
      mousePosition: { x: 0, y: 0 },
      focusedElement: null,

      // Initialize magnifier system
      initialize: () => {
        const store = get();

        // Detect screen magnifier usage
        store.detectMagnifierUsage();

        // Set up event listeners
        store.setupEventListeners();

        // Initialize magnifiable regions
        store.initializeMagnifiableRegions();

        // Create magnifier lens
        store.createLens();

        // Create overview window
        if (store.config.navigation.showOverview) {
          store.createOverview();
        }
      },

      // Activate magnifier
      activateMagnifier: () => {
        const store = get();

        set({
          isMagnifierActive: true,
          currentZoom: store.config.zoomLevel
        });

        store.applyMagnifierStyles();
        store.optimizeImages();

        if (store.config.textReflow.enabled || store.currentZoom >= 3) {
          store.enableTextReflow();
        }

        // Announce to screen readers
        store.announceToScreenReader('Screen magnifier activated');
      },

      // Deactivate magnifier
      deactivateMagnifier: () => {
        const store = get();

        set({
          isMagnifierActive: false,
          currentZoom: 1,
          lens: { ...store.lens, isVisible: false }
        });

        store.removeMagnifierStyles();
        store.restoreImages();
        store.disableTextReflow();

        store.announceToScreenReader('Screen magnifier deactivated');
      },

      // Set zoom level
      setZoomLevel: (level: number) => {
        const store = get();

        const newZoom = Math.max(1, Math.min(10, level));
        set({
          currentZoom: newZoom,
          lens: { ...store.lens, zoomLevel: newZoom }
        });

        if (store.isMagnifierActive) {
          store.applyMagnifierStyles();

          // Enable text reflow at high zoom levels
          if (newZoom >= 3 && !store.textReflow.enabled) {
            store.enableTextReflow();
          } else if (newZoom < 3 && store.textReflow.enabled) {
            store.disableTextReflow();
          }
        }
      },

      // Move magnifier lens
      moveLens: (x: number, y: number) => {
        const store = get();
        const { lens, config } = store;

        if (!config.followCursor || !store.isMagnifierActive) return;

        const newX = Math.max(0, Math.min(x - lens.width / 2, window.innerWidth - lens.width));
        const newY = Math.max(0, Math.min(y - lens.height / 2, window.innerHeight - lens.height));

        set({
          lens: { ...lens, x: newX, y: newY },
          mousePosition: { x, y }
        });

        store.updateLensContent();
        store.updateOverview();
      },

      // Focus element with magnifier
      focusElement: (element: HTMLElement) => {
        const store = get();
        const { config } = store;

        if (!config.followFocus || !store.isMagnifierActive) return;

        const rect = element.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        store.moveLens(centerX, centerY);
        set({ focusedElement: element });

        // Add focus indicator
        store.addFocusIndicator(element);
      },

      // Update configuration
      updateConfiguration: (newConfig: Partial<MagnifierConfiguration>) => {
        const store = get();

        set(state => ({
          config: { ...state.config, ...newConfig }
        }));

        // Reapply magnifier if active
        if (store.isMagnifierActive) {
          store.deactivateMagnifier();
          store.activateMagnifier();
        }
      },

      // Add magnifier region
      addMagnifierRegion: (region: MagnifierRegion) => {
        set(state => ({
          magnifierRegions: new Map(state.magnifierRegions).set(region.id, region)
        }));
      },

      // Remove magnifier region
      removeMagnifierRegion: (id: string) => {
        const store = get();

        set(state => {
          const newRegions = new Map(state.magnifierRegions);
          newRegions.delete(id);
          return { magnifierRegions: newRegions };
        });

        // Restore original styles if needed
        const region = store.magnifierRegions.get(id);
        if (region && store.isMagnifierActive) {
          store.restoreRegionStyles(region);
        }
      },

      // Enable text reflow
      enableTextReflow: () => {
        const store = get();
        const { textReflow } = store;

        set({ textReflow: { ...textReflow, enabled: true } });
        store.applyTextReflow();
      },

      // Disable text reflow
      disableTextReflow: () => {
        const store = get();

        set({ textReflow: { ...store.textReflow, enabled: false } });
        store.removeTextReflow();
      },

      // Update text reflow settings
      updateTextReflow: (settings: Partial<TextReflowSettings>) => {
        const store = get();

        set(state => ({
          textReflow: { ...state.textReflow, ...settings }
        }));

        if (store.textReflow.enabled) {
          store.applyTextReflow();
        }
      },

      // Optimize images for magnification
      optimizeImages: () => {
        const images = document.querySelectorAll('img');

        images.forEach(img => {
          const element = img as HTMLImageElement;

          // Store original src
          if (!element.dataset.originalSrc) {
            element.dataset.originalSrc = element.src;
          }

          // Request higher resolution version
          if (element.dataset.highResSrc) {
            element.src = element.dataset.highResSrc;
          } else {
            // Generate high-res URL by adding size parameters
            const highResUrl = store.generateHighResUrl(element.src);
            element.dataset.highResSrc = highResUrl;
            element.src = highResUrl;
          }

          // Add loading optimization
          element.loading = 'eager';
          element.decoding = 'sync';
        });
      },

      // Restore original images
      restoreImages: () => {
        const images = document.querySelectorAll('img[data-original-src]');

        images.forEach(img => {
          const element = img as HTMLImageElement;
          if (element.dataset.originalSrc) {
            element.src = element.dataset.originalSrc;
          }
        });
      },

      // Show overview window
      showOverview: () => {
        const store = get();
        const overviewElement = document.getElementById('magnifier-overview');

        if (overviewElement) {
          overviewElement.style.display = 'block';
          store.updateOverview();
        }
      },

      // Hide overview window
      hideOverview: () => {
        const overviewElement = document.getElementById('magnifier-overview');

        if (overviewElement) {
          overviewElement.style.display = 'none';
        }
      },

      // Reset all settings
      reset: () => {
        const store = get();

        store.deactivateMagnifier();
        set({
          config: {
            ...store.config,
            zoomLevel: 2,
            highContrast: false,
            largeText: false,
            colorInversion: false
          },
          currentZoom: 1,
          magnifierRegions: new Map()
        });
      },

      // Internal methods
      detectMagnifierUsage: () => {
        // Detect common magnifier indicators
        const indicators = [
          () => window.innerWidth !== screen.width,
          () => window.devicePixelRatio > 1,
          () => navigator.userAgent.includes('magnifier'),
          () => document.documentElement.style.zoom !== ''
        ];

        const isUsingMagnifier = indicators.some(check => check());

        if (isUsingMagnifier) {
          set(state => ({
            config: { ...state.config, enabled: true }
          }));
        }
      },

      setupEventListeners: () => {
        const store = get();

        // Mouse movement
        document.addEventListener('mousemove', (e) => {
          store.moveLens(e.clientX, e.clientY);
        });

        // Focus events
        document.addEventListener('focusin', (e) => {
          store.focusElement(e.target as HTMLElement);
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
          // Ctrl + Plus: Increase zoom
          if (e.ctrlKey && e.key === '+') {
            e.preventDefault();
            store.setZoomLevel(store.currentZoom + 0.5);
          }
          // Ctrl + Minus: Decrease zoom
          else if (e.ctrlKey && e.key === '-') {
            e.preventDefault();
            store.setZoomLevel(store.currentZoom - 0.5);
          }
          // Ctrl + 0: Reset zoom
          else if (e.ctrlKey && e.key === '0') {
            e.preventDefault();
            store.setZoomLevel(1);
          }
          // Alt + M: Toggle magnifier
          else if (e.altKey && e.key === 'm') {
            e.preventDefault();
            if (store.isMagnifierActive) {
              store.deactivateMagnifier();
            } else {
              store.activateMagnifier();
            }
          }
        });

        // Window resize
        window.addEventListener('resize', () => {
          if (store.isMagnifierActive) {
            store.applyMagnifierStyles();
          }
        });
      },

      initializeMagnifiableRegions: () => {
        const store = get();

        // Automatically identify important regions
        const regions = [
          'main', 'article', 'section', 'nav', 'header', 'footer',
          '.main-content', '.content', '.article-content'
        ];

        regions.forEach(selector => {
          const elements = document.querySelectorAll(selector);
          elements.forEach((element, index) => {
            const region: MagnifierRegion = {
              id: `magnifier-${selector}-${index}`,
              element: element as HTMLElement,
              bounds: element.getBoundingClientRect(),
              priority: 'medium',
              isMagnifiable: true,
              originalStyles: {},
              optimizedStyles: {}
            };

            store.addMagnifierRegion(region);
          });
        });
      },

      createLens: () => {
        const store = get();
        const { config } = store;

        // Create lens element
        const lens = document.createElement('div');
        lens.id = 'magnifier-lens';
        lens.style.cssText = `
          position: fixed;
          width: ${config.lensSize.width}px;
          height: ${config.lensSize.height}px;
          border: 3px solid #333;
          border-radius: 50%;
          background: white;
          box-shadow: 0 4px 20px rgba(0,0,0,0.3);
          pointer-events: none;
          z-index: 10000;
          display: none;
          overflow: hidden;
        `;

        // Create lens content
        const lensContent = document.createElement('div');
        lensContent.id = 'magnifier-lens-content';
        lensContent.style.cssText = `
          width: 100%;
          height: 100%;
          transform-origin: center center;
          image-rendering: -webkit-optimize-contrast;
          image-rendering: crisp-edges;
        `;

        lens.appendChild(lensContent);
        document.body.appendChild(lens);

        set(state => ({
          lens: { ...state.lens, content: lensContent }
        }));
      },

      createOverview: () => {
        const store = get();
        const { config } = store;

        // Create overview window
        const overview = document.createElement('div');
        overview.id = 'magnifier-overview';

        let positionStyles = '';
        switch (config.navigation.overviewPosition) {
          case 'corner':
            positionStyles = 'top: 10px; right: 10px;';
            break;
          case 'side':
            positionStyles = 'top: 50%; right: 10px; transform: translateY(-50%);';
            break;
          case 'bottom':
            positionStyles = 'bottom: 10px; left: 50%; transform: translateX(-50%);';
            break;
        }

        overview.style.cssText = `
          position: fixed;
          ${positionStyles}
          width: 200px;
          height: 150px;
          border: 2px solid #333;
          background: white;
          box-shadow: 0 2px 10px rgba(0,0,0,0.2);
          z-index: 9999;
          display: none;
          overflow: hidden;
        `;

        // Create viewport indicator
        const viewport = document.createElement('div');
        viewport.id = 'magnifier-viewport';
        viewport.style.cssText = `
          position: absolute;
          border: 2px solid #ff0000;
          background: rgba(255,0,0,0.1);
          pointer-events: none;
        `;

        overview.appendChild(viewport);
        document.body.appendChild(overview);
      },

      applyMagnifierStyles: () => {
        const store = get();
        const { currentZoom, config } = store;

        const root = document.documentElement;
        root.style.setProperty('--magnifier-zoom', currentZoom.toString());

        if (config.highContrast) {
          root.classList.add('magnifier-high-contrast');
        }

        if (config.largeText) {
          root.classList.add('magnifier-large-text');
        }

        if (config.colorInversion) {
          root.classList.add('magnifier-invert-colors');
        }

        // Apply custom filters
        if (config.customFilters.brightness !== 1 ||
            config.customFilters.contrast !== 1 ||
            config.customFilters.saturation !== 1) {
          root.style.filter = `
            brightness(${config.customFilters.brightness})
            contrast(${config.customFilters.contrast})
            saturate(${config.customFilters.saturation})
          `;
        }

        // Show lens if configured
        if (config.showLens) {
          const lens = document.getElementById('magnifier-lens');
          if (lens) {
            lens.style.display = 'block';
            set(state => ({
              lens: { ...state.lens, isVisible: true }
            }));
          }
        }
      },

      removeMagnifierStyles: () => {
        const root = document.documentElement;
        root.classList.remove(
          'magnifier-high-contrast',
          'magnifier-large-text',
          'magnifier-invert-colors'
        );
        root.style.removeProperty('filter');
        root.style.removeProperty('--magnifier-zoom');

        // Hide lens
        const lens = document.getElementById('magnifier-lens');
        if (lens) {
          lens.style.display = 'none';
        }
      },

      updateLensContent: () => {
        const store = get();
        const { lens, currentZoom } = store;

        if (!lens.content || !lens.isVisible) return;

        // Capture content under lens
        const centerX = lens.x + lens.width / 2;
        const centerY = lens.y + lens.height / 2;
        const sourceSize = lens.width / currentZoom;

        // Use CSS transform for magnification
        lens.content.style.transform = `
          scale(${currentZoom})
          translate(${-centerX + lens.width / (2 * currentZoom)}px, ${-centerY + lens.height / (2 * currentZoom)}px)
        `;
      },

      updateOverview: () => {
        const store = get();
        const overview = document.getElementById('magnifier-overview');
        const viewport = document.getElementById('magnifier-viewport');

        if (!overview || !viewport) return;

        const scale = 200 / window.innerWidth;
        const viewportWidth = (window.innerWidth / store.currentZoom) * scale;
        const viewportHeight = (window.innerHeight / store.currentZoom) * scale;
        const viewportX = (store.mousePosition.x / store.currentZoom) * scale;
        const viewportY = (store.mousePosition.y / store.currentZoom) * scale;

        viewport.style.width = `${viewportWidth}px`;
        viewport.style.height = `${viewportHeight}px`;
        viewport.style.left = `${viewportX}px`;
        viewport.style.top = `${viewportY}px`;
      },

      applyTextReflow: () => {
        const store = get();
        const { textReflow } = store;

        const reflowStyles = `
          .magnifier-reflow {
            max-width: ${textReflow.maxWidth}px !important;
            line-height: ${textReflow.lineHeight} !important;
            font-size: ${textReflow.fontSize}px !important;
            word-spacing: ${textReflow.wordSpacing}em !important;
            letter-spacing: ${textReflow.letterSpacing}em !important;
            overflow-wrap: break-word !important;
            hyphens: auto !important;
          }
        `;

        // Add or update reflow styles
        let styleElement = document.getElementById('magnifier-reflow-styles');
        if (!styleElement) {
          styleElement = document.createElement('style');
          styleElement.id = 'magnifier-reflow-styles';
          document.head.appendChild(styleElement);
        }

        styleElement.textContent = reflowStyles;

        // Apply reflow class to text elements
        const textElements = document.querySelectorAll('p, li, dt, dd, .text-content');
        textElements.forEach(element => {
          element.classList.add('magnifier-reflow');
        });
      },

      removeTextReflow: () => {
        const textElements = document.querySelectorAll('.magnifier-reflow');
        textElements.forEach(element => {
          element.classList.remove('magnifier-reflow');
        });

        const styleElement = document.getElementById('magnifier-reflow-styles');
        if (styleElement) {
          styleElement.remove();
        }
      },

      generateHighResUrl: (originalUrl: string): string => {
        // Generate high-resolution URL by adding size parameters
        const url = new URL(originalUrl, window.location.origin);

        // Add size parameters for common image CDNs
        if (url.hostname.includes('cloudinary')) {
          url.searchParams.set('q', '100');
          url.searchParams.set('dpr', '3');
        } else if (url.hostname.includes('imgix')) {
          url.searchParams.set('auto', 'format');
          url.searchParams.set('q', '100');
          url.searchParams.set('dpr', '3');
        }

        return url.toString();
      },

      addFocusIndicator: (element: HTMLElement) => {
        // Remove existing indicators
        document.querySelectorAll('.magnifier-focus-indicator').forEach(el => el.remove());

        // Create new indicator
        const indicator = document.createElement('div');
        indicator.className = 'magnifier-focus-indicator';

        const rect = element.getBoundingClientRect();
        indicator.style.cssText = `
          position: absolute;
          left: ${rect.left - 2}px;
          top: ${rect.top - 2}px;
          width: ${rect.width + 4}px;
          height: ${rect.height + 4}px;
          border: 3px solid #ff0000;
          border-radius: 4px;
          pointer-events: none;
          z-index: 9998;
          animation: magnifier-focus-pulse 2s ease-in-out infinite;
        `;

        document.body.appendChild(indicator);

        // Remove after 3 seconds
        setTimeout(() => {
          indicator.remove();
        }, 3000);
      },

      announceToScreenReader: (message: string) => {
        const announcer = document.querySelector('[aria-live="polite"]') as HTMLElement;
        if (announcer) {
          announcer.textContent = message;
        }
      },

      restoreRegionStyles: (region: MagnifierRegion) => {
        Object.entries(region.originalStyles).forEach(([property, value]) => {
          region.element.style.setProperty(property, value);
        });
      }
    }),
    {
      name: 'screen-magnifier-store',
      partialize: (state) => ({
        config: state.config,
        textReflow: state.textReflow,
      }),
    }
  )
);

// Add CSS for magnifier features
const magnifierStyles = `
/* Magnifier Styles */
.magnifier-high-contrast {
  filter: contrast(1.5) !important;
}

.magnifier-high-contrast * {
  background: white !important;
  color: black !important;
  border-color: black !important;
}

.magnifier-large-text {
  font-size: 120% !important;
}

.magnifier-large-text * {
  font-size: inherit !important;
}

.magnifier-invert-colors {
  filter: invert(100%) !important;
}

.magnifier-focus-indicator {
  box-shadow: 0 0 10px rgba(255, 0, 0, 0.5);
}

@keyframes magnifier-focus-pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.7; transform: scale(1.05); }
}

/* Magnifier Controls */
.magnifier-controls {
  position: fixed;
  top: 10px;
  left: 10px;
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid #ccc;
  border-radius: 8px;
  padding: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  z-index: 10001;
}

.magnifier-controls h3 {
  margin: 0 0 10px 0;
  font-size: 14px;
  font-weight: bold;
}

.magnifier-controls button {
  margin: 2px;
  padding: 4px 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  font-size: 12px;
}

.magnifier-controls button:hover {
  background: #f0f0f0;
}

.magnifier-controls button.active {
  background: #007bff;
  color: white;
}

.zoom-indicator {
  font-weight: bold;
  color: #007bff;
}

.magnifier-grid {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 9997;
  background-image:
    repeating-linear-gradient(0deg, rgba(0,0,0,0.1) 0px, transparent 1px, transparent 19px, rgba(0,0,0,0.1) 20px),
    repeating-linear-gradient(90deg, rgba(0,0,0,0.1) 0px, transparent 1px, transparent 19px, rgba(0,0,0,0.1) 20px);
}

.magnifier-ruler {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 20px;
  background: rgba(255, 255, 0, 0.3);
  pointer-events: none;
  z-index: 9997;
  border-bottom: 1px solid rgba(0, 0, 0, 0.3);
}
`;

// Inject styles into document
const styleSheet = document.createElement('style');
styleSheet.textContent = magnifierStyles;
document.head.appendChild(styleSheet);

// React hook for screen magnifier
export const useMagnifierControls = () => {
  const store = useScreenMagnifier();

  const initialize = () => {
    store.initialize();
  };

  const toggleMagnifier = () => {
    if (store.isMagnifierActive) {
      store.deactivateMagnifier();
    } else {
      store.activateMagnifier();
    }
  };

  const zoomIn = () => {
    store.setZoomLevel(store.currentZoom + 0.5);
  };

  const zoomOut = () => {
    store.setZoomLevel(store.currentZoom - 0.5);
  };

  const toggleHighContrast = () => {
    store.updateConfiguration({
      highContrast: !store.config.highContrast
    });
  };

  const toggleLargeText = () => {
    store.updateConfiguration({
      largeText: !store.config.largeText
    });
  };

  const toggleColorInversion = () => {
    store.updateConfiguration({
      colorInversion: !store.config.colorInversion
    });
  };

  const updateLensSize = (width: number, height: number) => {
    store.updateConfiguration({
      lensSize: { width, height }
    });
  };

  return {
    ...store,
    initialize,
    toggleMagnifier,
    zoomIn,
    zoomOut,
    toggleHighContrast,
    toggleLargeText,
    toggleColorInversion,
    updateLensSize,
  };
};

export default useScreenMagnifier;