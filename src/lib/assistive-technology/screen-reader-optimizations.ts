/**
 * Advanced Screen Reader Optimizations
 *
 * Comprehensive screen reader optimizations including custom announcements,
 * context-aware descriptions, efficient navigation structures, and progress indicators.
 */

import { create } from 'zustand';
import {persist} from 'zustand/middleware';

// Types for screen reader optimizations
export interface ScreenReaderConfig {
  enabled: boolean;
  verbosity: 'minimal' | 'standard' | 'detailed' | 'comprehensive';
  announcePageChanges: boolean;
  announceFormErrors: boolean;
  announceLoadingStates: boolean;
  announceProgress: boolean;
  customLabels: Map<string, string>;
  navigationMode: 'simple' | 'detailed' | 'contextual';
  languageDetection: boolean;
  readingSpeed: 'slow' | 'normal' | 'fast';
  punctuation: 'none' | 'some' | 'all';
}

export interface ScreenReaderAnnouncement {
  id: string;
  text: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  politeness: 'polite' | 'assertive' | 'off';
  context: string;
  timestamp: Date;
  timeout?: number;
}

export interface NavigationRegion {
  id: string;
  element: HTMLElement;
  label: string;
  level: number;
  isLandmark: boolean;
  isSearchable: boolean;
  isNavigable: boolean;
  children: NavigationRegion[];
}

export interface ReadingOrder {
  elements: HTMLElement[];
  order: number[];
  context: string;
  lastUpdated: Date;
}

export interface ProgressIndicator {
  id: string;
  element: HTMLElement;
  type: 'linear' | 'circular' | 'step' | 'percentage';
  currentValue: number;
  maxValue: number;
  label: string;
  announceInterval: number;
}

interface ScreenReaderOptimizationsStore {
  // Configuration
  config: ScreenReaderConfig;

  // State
  isActive: boolean;
  currentRegion: string | null;
  readingPosition: number;
  announcements: ScreenReaderAnnouncement[];
  navigationRegions: Map<string, NavigationRegion>;
  readingOrders: Map<string, ReadingOrder>;
  progressIndicators: Map<string, ProgressIndicator>;
  liveRegions: Map<string, HTMLElement>;
  focusHistory: HTMLElement[];

  // Actions
  initialize: () => void;
  updateConfiguration: (config: Partial<ScreenReaderConfig>) => void;
  enable: () => void;
  disable: () => void;
  announce: (text: string, priority?: ScreenReaderAnnouncement['priority'], politeness?: ScreenReaderAnnouncement['politeness']) => void;
  announceError: (message: string, element?: HTMLElement) => void;
  announceSuccess: (message: string, element?: HTMLElement) => void;
  announceLoading: (message: string, element?: HTMLElement) => void;
  announceProgress: (progress: number, total: number, label: string) => void;
  createLiveRegion: (politeness: 'polite' | 'assertive' | 'off') => HTMLElement;
  updateReadingOrder: (context: string, elements: HTMLElement[]) => void;
  navigateToRegion: (regionId: string) => void;
  setCustomLabel: (element: HTMLElement, label: string) => void;
  removeCustomLabel: (element: HTMLElement) => void;
  addNavigationRegion: (region: NavigationRegion) => void;
  removeNavigationRegion: (regionId: string) => void;
  createProgressIndicator: (config: Omit<ProgressIndicator, 'id'>) => void;
  updateProgress: (indicatorId: string, value: number) => void;
  generateContextualDescription: (element: HTMLElement) => string;
  optimizeFormAccessibility: (form: HTMLFormElement) => void;
  optimizeTableAccessibility: (table: HTMLTableElement) => void;
  optimizeListAccessibility: (list: HTMLUListElement | HTMLOListElement) => void;
  createLandmarkNavigation: () => void;
  detectReadingMode: () => 'reading' | 'navigation' | 'interaction';
  enhanceKeyboardNavigation: () => void;
  reset: () => void;
}

export const useScreenReaderOptimizations = create<ScreenReaderOptimizationsStore>()(
  persist(
    (set, get) => ({
      // Default configuration
      config: {
        enabled: true,
        verbosity: 'standard',
        announcePageChanges: true,
        announceFormErrors: true,
        announceLoadingStates: true,
        announceProgress: true,
        customLabels: new Map(),
        navigationMode: 'contextual',
        languageDetection: true,
        readingSpeed: 'normal',
        punctuation: 'some'
      },

      // Initial state
      isActive: false,
      currentRegion: null,
      readingPosition: 0,
      announcements: [],
      navigationRegions: new Map(),
      readingOrders: new Map(),
      progressIndicators: new Map(),
      liveRegions: new Map(),
      focusHistory: [],

      // Initialize screen reader optimizations
      initialize: () => {
        const store = get();

        // Detect screen reader
        const hasScreenReader = store.detectScreenReader();

        if (hasScreenReader) {
          store.enable();
        }

        // Set up observers for dynamic content
        store.setupContentObservers();

        // Initialize landmark navigation
        store.createLandmarkNavigation();

        // Set up keyboard navigation enhancements
        store.enhanceKeyboardNavigation();

        // Initialize live regions
        store.initializeLiveRegions();

        // Set up form validation announcements
        store.setupFormValidation();

        // Set up loading state announcements
        store.setupLoadingStateAnnouncements();

        // Optimize existing content
        store.optimizeExistingContent();
      },

      // Update configuration
      updateConfiguration: (newConfig: Partial<ScreenReaderConfig>) => {
        set(state => ({
          config: { ...state.config, ...newConfig }
        }));

        // Re-initialize if needed
        const store = get();
        if (store.isActive) {
          store.createLandmarkNavigation();
          store.enhanceKeyboardNavigation();
        }
      },

      // Enable optimizations
      enable: () => {
        set({ isActive: true });

        // Announce activation
        get().announce('Screen reader optimizations enabled', 'medium', 'polite');

        // Create initial landmark structure
        get().createLandmarkNavigation();
      },

      // Disable optimizations
      disable: () => {
        set({ isActive: false });

        // Clean up additional ARIA attributes
        get().cleanup();
      },

      // Make announcement
      announce: (text: string, priority: ScreenReaderAnnouncement['priority'] = 'medium', politeness: ScreenReaderAnnouncement['politeness'] = 'polite') => {
        const store = get();
        const { config } = store;

        if (!store.isActive) return;

        const announcement: ScreenReaderAnnouncement = {
          id: `announcement-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          text,
          priority,
          politeness,
          context: store.getCurrentContext(),
          timestamp: new Date()
        };

        // Add to announcements history
        set(state => ({
          announcements: [...state.announcements, announcement].slice(-20) // Keep last 20
        }));

        // Send to appropriate live region
        store.sendToLiveRegion(announcement);

        // Log for debugging
        console.log('Screen Reader Announcement:', text);
      },

      // Announce error
      announceError: (message: string, element?: HTMLElement) => {
        const store = get();
        const text = element ? `Error in ${store.getElementDescription(element)}: ${message}` : `Error: ${message}`;
        store.announce(text, 'high', 'assertive');
      },

      // Announce success
      announceSuccess: (message: string, element?: HTMLElement) => {
        const store = get();
        const text = element ? `Success in ${store.getElementDescription(element)}: ${message}` : `Success: ${message}`;
        store.announce(text, 'medium', 'polite');
      },

      // Announce loading state
      announceLoading: (message: string, element?: HTMLElement) => {
        const store = get();
        if (!store.config.announceLoadingStates) return;

        const text = element ? `Loading ${store.getElementDescription(element)}: ${message}` : `Loading: ${message}`;
        store.announce(text, 'low', 'polite');
      },

      // Announce progress
      announceProgress: (progress: number, total: number, label: string) => {
        const store = get();
        if (!store.config.announceProgress) return;

        const percentage = Math.round((progress / total) * 100);
        const text = `${label}: ${progress} of ${total} complete, ${percentage} percent`;
        store.announce(text, 'low', 'polite');
      },

      // Create live region
      createLiveRegion: (politeness: 'polite' | 'assertive' | 'off'): HTMLElement => {
        const store = get();
        const region = document.createElement('div');
        region.setAttribute('aria-live', politeness);
        region.setAttribute('aria-atomic', 'true');
        region.className = 'sr-only live-region';
        region.style.cssText = `
          position: absolute;
          left: -10000px;
          width: 1px;
          height: 1px;
          overflow: hidden;
        `;

        document.body.appendChild(region);

        const regionId = `live-region-${Date.now()}`;
        set(state => ({
          liveRegions: new Map(state.liveRegions).set(regionId, region)
        }));

        return region;
      },

      // Update reading order
      updateReadingOrder: (context: string, elements: HTMLElement[]) => {
        const store = get();

        const readingOrder: ReadingOrder = {
          elements,
          order: elements.map((_, index) => index),
          context,
          lastUpdated: new Date()
        };

        set(state => ({
          readingOrders: new Map(state.readingOrders).set(context, readingOrder)
        }));

        // Add reading order attributes
        elements.forEach((element, index) => {
          element.setAttribute('data-reading-order', index.toString());
        });
      },

      // Navigate to region
      navigateToRegion: (regionId: string) => {
        const store = get();
        const region = store.navigationRegions.get(regionId);

        if (region) {
          region.element.focus();
          set({ currentRegion: regionId });
          store.announce(`Navigated to ${region.label}`, 'medium', 'polite');
        }
      },

      // Set custom label
      setCustomLabel: (element: HTMLElement, label: string) => {
        set(state => ({
          config: {
            ...state.config,
            customLabels: new Map(state.config.customLabels).set(store.generateElementId(element), label)
          }
        }));

        // Update element
        if (!element.getAttribute('aria-label')) {
          element.setAttribute('aria-label', label);
        }
      },

      // Remove custom label
      removeCustomLabel: (element: HTMLElement) => {
        const store = get();
        const elementId = store.generateElementId(element);

        set(state => {
          const newLabels = new Map(state.config.customLabels);
          newLabels.delete(elementId);
          return {
            config: { ...state.config, customLabels: newLabels }
          };
        });

        // Remove from element if it was added by us
        if (element.hasAttribute('data-custom-label')) {
          element.removeAttribute('aria-label');
          element.removeAttribute('data-custom-label');
        }
      },

      // Add navigation region
      addNavigationRegion: (region: NavigationRegion) => {
        set(state => ({
          navigationRegions: new Map(state.navigationRegions).set(region.id, region)
        }));

        // Enhance element with navigation attributes
        store.enhanceNavigationRegion(region);
      },

      // Remove navigation region
      removeNavigationRegion: (regionId: string) => {
        set(state => {
          const newRegions = new Map(state.navigationRegions);
          const region = newRegions.get(regionId);

          if (region) {
            store.cleanupNavigationRegion(region);
          }

          newRegions.delete(regionId);
          return { navigationRegions: newRegions };
        });
      },

      // Create progress indicator
      createProgressIndicator: (config: Omit<ProgressIndicator, 'id'>) => {
        const store = get();
        const indicator: ProgressIndicator = {
          ...config,
          id: `progress-${Date.now()}`
        };

        set(state => ({
          progressIndicators: new Map(state.progressIndicators).set(indicator.id, indicator)
        }));

        // Enhance element with progress attributes
        store.enhanceProgressIndicator(indicator);
      },

      // Update progress
      updateProgress: (indicatorId: string, value: number) => {
        const store = get();
        const indicator = store.progressIndicators.get(indicatorId);

        if (indicator) {
          const updatedIndicator = { ...indicator, currentValue: value };

          set(state => ({
            progressIndicators: new Map(state.progressIndicators).set(indicatorId, updatedIndicator)
          }));

          // Announce progress at intervals
          if (value % indicator.announceInterval === 0 || value === indicator.maxValue) {
            store.announceProgress(value, indicator.maxValue, indicator.label);
          }

          // Update element attributes
          store.updateProgressElement(updatedIndicator);
        }
      },

      // Generate contextual description
      generateContextualDescription: (element: HTMLElement): string => {
        const store = get();

        // Get base description
        let description = store.getElementDescription(element);

        // Add context based on verbosity level
        if (store.config.verbosity === 'detailed' || store.config.verbosity === 'comprehensive') {
          description = store.addContextualDetails(element, description);
        }

        // Add position information
        const position = store.getElementPosition(element);
        if (position) {
          description += `. Position: ${position}`;
        }

        return description;
      },

      // Optimize form accessibility
      optimizeFormAccessibility: (form: HTMLFormElement) => {
        const store = get();

        // Ensure form has proper labeling
        if (!form.getAttribute('aria-label') && !form.querySelector('legend')) {
          const title = form.querySelector('h1, h2, h3, h4, h5, h6')?.textContent?.trim();
          if (title) {
            form.setAttribute('aria-label', title);
          }
        }

        // Optimize form fields
        const formElements = form.querySelectorAll('input, select, textarea, button');
        formElements.forEach(element => {
          store.optimizeFormField(element as HTMLElement);
        });

        // Add form submission announcements
        form.addEventListener('submit', (e) => {
          store.announce('Form submitted. Processing your request.', 'medium', 'polite');
        });
      },

      // Optimize table accessibility
      optimizeTableAccessibility: (table: HTMLTableElement) => {
        const store = get();

        // Ensure table has caption
        if (!table.querySelector('caption')) {
          const caption = document.createElement('caption');
          caption.textContent = store.generateTableCaption(table);
          table.insertBefore(caption, table.firstChild);
        }

        // Optimize headers
        const headers = table.querySelectorAll('th');
        headers.forEach(header => {
          if (!header.getAttribute('scope')) {
            const scope = header.parentElement?.parentElement?.tagName === 'THEAD' ? 'col' : 'row';
            header.setAttribute('scope', scope);
          }
        });

        // Add table description
        const description = store.generateTableDescription(table);
        if (description) {
          table.setAttribute('aria-label', description);
        }
      },

      // Optimize list accessibility
      optimizeListAccessibility: (list: HTMLUListElement | HTMLOListElement) => {
        const store = get();

        // Add list label if missing
        if (!list.getAttribute('aria-label') && !list.previousElementSibling?.textContent?.trim()) {
          const itemCount = list.querySelectorAll('li').length;
          const listType = list.tagName.toLowerCase() === 'ul' ? 'unordered' : 'ordered';
          list.setAttribute('aria-label', `${listType} list with ${itemCount} items`);
        }

        // Optimize list items
        const items = list.querySelectorAll('li');
        items.forEach((item, index) => {
          const position = index + 1;
          item.setAttribute('aria-setsize', items.length.toString());
          item.setAttribute('aria-posinset', position.toString());
        });
      },

      // Create landmark navigation
      createLandmarkNavigation: () => {
        const store = get();

        // Find landmark elements
        const landmarks = document.querySelectorAll('main, header, footer, nav, aside, section, [role="banner"], [role="navigation"], [role="main"], [role="contentinfo"], [role="search"], [role="complementary"]');

        landmarks.forEach((element, index) => {
          const region: NavigationRegion = {
            id: `landmark-${index}`,
            element: element as HTMLElement,
            label: store.generateLandmarkLabel(element as HTMLElement),
            level: store.getLandmarkLevel(element as HTMLElement),
            isLandmark: true,
            isSearchable: true,
            isNavigable: true,
            children: []
          };

          store.addNavigationRegion(region);
        });

        // Create landmark navigation menu
        store.createLandmarkNavigationMenu();
      },

      // Detect reading mode
      detectReadingMode: (): 'reading' | 'navigation' | 'interaction' => {
        const activeElement = document.activeElement;

        if (activeElement?.matches('input, textarea, select, [contenteditable="true"]')) {
          return 'interaction';
        } else if (activeElement?.matches('a, button, [role="button"], [role="link"]')) {
          return 'navigation';
        } else {
          return 'reading';
        }
      },

      // Enhance keyboard navigation
      enhanceKeyboardNavigation: () => {
        const store = get();

        // Add skip links
        store.createSkipLinks();

        // Add quick navigation keys
        document.addEventListener('keydown', (e) => {
          // Alt + L: Landmark navigation
          if (e.altKey && e.key === 'l') {
            e.preventDefault();
            store.showLandmarkNavigation();
          }
          // Alt + H: Headings navigation
          else if (e.altKey && e.key === 'h') {
            e.preventDefault();
            store.showHeadingsNavigation();
          }
          // Alt + F: Forms navigation
          else if (e.altKey && e.key === 'f') {
            e.preventDefault();
            store.showFormsNavigation();
          }
          // Alt + I: Links navigation
          else if (e.altKey && e.key === 'i') {
            e.preventDefault();
            store.showLinksNavigation();
          }
        });

        // Enhance tab navigation
        store.enhanceTabNavigation();
      },

      // Reset all state
      reset: () => {
        const store = get();

        store.disable();
        set({
          currentRegion: null,
          readingPosition: 0,
          announcements: [],
          navigationRegions: new Map(),
          readingOrders: new Map(),
          progressIndicators: new Map(),
          focusHistory: []
        });
      },

      // Internal methods
      detectScreenReader: (): boolean => {
        // Detect common screen readers
        return (
          // JAWS
          !!(window as any).jaws ||
          // NVDA
          !!(window as any).nvda ||
          // VoiceOver (Safari)
          !!(window as any).voiceOver ||
          // General detection methods
          navigator.userAgent.includes('reader') ||
          window.speechSynthesis?.getVoices().some(voice => voice.name.includes('screen reader')) ||
          // ARIA usage detection
          document.querySelector('[aria-live]') !== null
        );
      },

      setupContentObservers: () => {
        const store = get();

        // Observe DOM changes for dynamic content
        const observer = new MutationObserver((mutations) => {
          mutations.forEach((mutation) => {
            if (mutation.type === 'childList') {
              mutation.addedNodes.forEach((node) => {
                if (node.nodeType === Node.ELEMENT_NODE) {
                  const element = node as HTMLElement;

                  // Optimize new content
                  if (element.matches('form')) {
                    store.optimizeFormAccessibility(element as HTMLFormElement);
                  } else if (element.matches('table')) {
                    store.optimizeTableAccessibility(element as HTMLTableElement);
                  } else if (element.matches('ul, ol')) {
                    store.optimizeListAccessibility(element as HTMLUListElement | HTMLOListElement);
                  }

                  // Announce important changes
                  if (store.config.announcePageChanges && store.isImportantContent(element)) {
                    store.announce(`New content added: ${store.getElementDescription(element)}`, 'medium', 'polite');
                  }
                }
              });
            }
          });
        });

        observer.observe(document.body, {
          childList: true,
          subtree: true,
          attributes: true,
          attributeFilter: ['aria-expanded', 'aria-hidden', 'disabled']
        });

        (get() as any).contentObserver = observer;
      },

      initializeLiveRegions: () => {
        const store = get();

        // Create standard live regions
        store.createLiveRegion('polite');
        store.createLiveRegion('assertive');
        store.createLiveRegion('off');
      },

      setupFormValidation: () => {
        const store = get();

        if (!store.config.announceFormErrors) return;

        // Observe form validation
        document.addEventListener('invalid', (e) => {
          const element = e.target as HTMLElement;
          const message = element.validationMessage || 'Invalid input';
          store.announceError(message, element);
        }, true);

        // Observe custom validation
        const observer = new MutationObserver((mutations) => {
          mutations.forEach((mutation) => {
            if (mutation.type === 'attributes' && mutation.attributeName === 'aria-invalid') {
              const element = mutation.target as HTMLElement;
              if (element.getAttribute('aria-invalid') === 'true') {
                const message = element.getAttribute('aria-errormessage') || 'This field has an error';
                store.announceError(message, element);
              }
            }
          });
        });

        observer.observe(document.body, {
          attributes: true,
          attributeFilter: ['aria-invalid'],
          subtree: true
        });

        (get() as any).formValidationObserver = observer;
      },

      setupLoadingStateAnnouncements: () => {
        const store = get();

        if (!store.config.announceLoadingStates) return;

        // Observe loading states
        const observer = new MutationObserver((mutations) => {
          mutations.forEach((mutation) => {
            if (mutation.type === 'attributes' && mutation.attributeName === 'aria-busy') {
              const element = mutation.target as HTMLElement;
              const isBusy = element.getAttribute('aria-busy') === 'true';

              if (isBusy) {
                store.announceLoading(`${store.getElementDescription(element)} is loading`, element);
              } else {
                store.announceSuccess(`${store.getElementDescription(element)} has finished loading`, element);
              }
            }
          });
        });

        observer.observe(document.body, {
          attributes: true,
          attributeFilter: ['aria-busy'],
          subtree: true
        });

        (get() as any).loadingObserver = observer;
      },

      optimizeExistingContent: () => {
        const store = get();

        // Optimize forms
        document.querySelectorAll('form').forEach(form => {
          store.optimizeFormAccessibility(form as HTMLFormElement);
        });

        // Optimize tables
        document.querySelectorAll('table').forEach(table => {
          store.optimizeTableAccessibility(table as HTMLTableElement);
        });

        // Optimize lists
        document.querySelectorAll('ul, ol').forEach(list => {
          store.optimizeListAccessibility(list as HTMLUListElement | HTMLOListElement);
        });

        // Add missing ARIA labels
        store.addMissingARIALabels();
      },

      sendToLiveRegion: (announcement: ScreenReaderAnnouncement) => {
        const store = get();
        const liveRegion = store.getLiveRegion(announcement.politeness);

        if (liveRegion) {
          liveRegion.textContent = announcement.text;

          // Clear after timeout if specified
          if (announcement.timeout) {
            setTimeout(() => {
              if (liveRegion.textContent === announcement.text) {
                liveRegion.textContent = '';
              }
            }, announcement.timeout);
          }
        }
      },

      getLiveRegion: (politeness: 'polite' | 'assertive' | 'off'): HTMLElement | null => {
        const store = get();
        const regions = Array.from(store.liveRegions.values());

        return regions.find(region =>
          region.getAttribute('aria-live') === politeness
        ) || null;
      },

      getCurrentContext: (): string => {
        const activeElement = document.activeElement;

        if (activeElement) {
          return activeElement.closest('main, nav, header, footer, section')?.tagName.toLowerCase() || 'page';
        }

        return 'page';
      },

      generateElementId: (element: HTMLElement): string => {
        return element.id || `sr-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      },

      getElementDescription: (element: HTMLElement): string => {
        // Try multiple methods to get element description
        const label = element.getAttribute('aria-label') ||
                     element.getAttribute('title') ||
                     element.getAttribute('alt') ||
                     element.getAttribute('placeholder') ||
                     element.textContent?.trim() ||
                     element.tagName.toLowerCase();

        return label || 'element';
      },

      getElementPosition: (element: HTMLElement): string => {
        const rect = element.getBoundingClientRect();
        const centerY = rect.top + rect.height / 2;
        const viewportHeight = window.innerHeight;

        if (centerY < viewportHeight * 0.3) return 'top';
        if (centerY > viewportHeight * 0.7) return 'bottom';
        return 'middle';
      },

      addContextualDetails: (element: HTMLElement, baseDescription: string): string => {
        const store = get();
        let description = baseDescription;

        // Add state information
        if (element.matches('[disabled]')) {
          description += ' (disabled)';
        }
        if (element.matches('[aria-expanded="true"]')) {
          description += ' (expanded)';
        } else if (element.matches('[aria-expanded="false"]')) {
          description += ' (collapsed)';
        }
        if (element.matches('[aria-pressed="true"]')) {
          description += ' (pressed)';
        }
        if (element.matches('[aria-selected="true"]')) {
          description += ' (selected)';
        }

        // Add interaction hints
        if (element.matches('a[href]')) {
          description += ' (link)';
        }
        if (element.matches('button, [role="button"]')) {
          description += ' (button)';
        }
        if (element.matches('input, select, textarea')) {
          const type = element.getAttribute('type') || element.tagName.toLowerCase();
          description += ` (${type} field)`;
        }

        return description;
      },

      optimizeFormField: (element: HTMLElement) => {
        const store = get();

        // Ensure proper labeling
        if (!element.getAttribute('aria-label') && !element.getAttribute('aria-labelledby')) {
          const label = store.findAssociatedLabel(element);
          if (label) {
            element.setAttribute('aria-labelledby', label.id || store.generateElementId(label));
          }
        }

        // Add required indicator
        if (element.hasAttribute('required') && !element.getAttribute('aria-required')) {
          element.setAttribute('aria-required', 'true');
        }

        // Add invalid indicator
        if (element.matches(':invalid') && !element.getAttribute('aria-invalid')) {
          element.setAttribute('aria-invalid', 'true');
        }
      },

      findAssociatedLabel: (element: HTMLElement): HTMLLabelElement | null => {
        // Check for explicit label association
        if (element.id) {
          const label = document.querySelector(`label[for="${element.id}"]`);
          if (label) return label as HTMLLabelElement;
        }

        // Check for implicit label association
        const parentLabel = element.closest('label');
        if (parentLabel) return parentLabel as HTMLLabelElement;

        return null;
      },

      generateTableCaption: (table: HTMLTableElement): string => {
        // Try to find appropriate caption
        const precedingHeading = table.previousElementSibling?.textContent?.trim();
        if (precedingHeading) return precedingHeading;

        return 'Data table';
      },

      generateTableDescription: (table: HTMLTableElement): string => {
        const rows = table.querySelectorAll('tr').length;
        const cols = table.querySelectorAll('tr:first-child td, tr:first-child th').length;

        return `Table with ${rows} rows and ${cols} columns`;
      },

      generateLandmarkLabel: (element: HTMLElement): string => {
        const tagName = element.tagName.toLowerCase();
        const role = element.getAttribute('role');

        // Check for explicit label
        const label = element.getAttribute('aria-label') ||
                     element.getAttribute('title') ||
                     element.querySelector('h1, h2, h3, h4, h5, h6')?.textContent?.trim();

        if (label) return label;

        // Generate based on role or tag
        if (role === 'banner' || tagName === 'header') return 'Header';
        if (role === 'navigation' || tagName === 'nav') return 'Navigation';
        if (role === 'main' || tagName === 'main') return 'Main content';
        if (role === 'contentinfo' || tagName === 'footer') return 'Footer';
        if (role === 'search') return 'Search';
        if (role === 'complementary' || tagName === 'aside') return 'Sidebar';
        if (tagName === 'section') return 'Section';

        return 'Content area';
      },

      getLandmarkLevel: (element: HTMLElement): number => {
        // Calculate nesting level
        let level = 0;
        let parent = element.parentElement;

        while (parent && parent !== document.body) {
          if (parent.matches('main, section, [role="main"], [role="region"]')) {
            level++;
          }
          parent = parent.parentElement;
        }

        return level;
      },

      enhanceNavigationRegion: (region: NavigationRegion) => {
        const element = region.element;

        // Add navigation attributes
        if (!element.getAttribute('role')) {
          element.setAttribute('role', 'region');
        }

        if (!element.getAttribute('aria-label')) {
          element.setAttribute('aria-label', region.label);
        }

        element.setAttribute('tabindex', '-1');
        element.setAttribute('data-navigation-region', region.id);
      },

      cleanupNavigationRegion: (region: NavigationRegion) => {
        const element = region.element;

        // Remove navigation attributes if they were added by us
        if (element.hasAttribute('data-navigation-region')) {
          element.removeAttribute('role');
          element.removeAttribute('aria-label');
          element.removeAttribute('tabindex');
          element.removeAttribute('data-navigation-region');
        }
      },

      enhanceProgressIndicator: (indicator: ProgressIndicator) => {
        const element = indicator.element;

        // Add progress attributes
        element.setAttribute('role', 'progressbar');
        element.setAttribute('aria-label', indicator.label);
        element.setAttribute('aria-valuenow', indicator.currentValue.toString());
        element.setAttribute('aria-valuemin', '0');
        element.setAttribute('aria-valuemax', indicator.maxValue.toString());
        element.setAttribute('data-progress-id', indicator.id);
      },

      updateProgressElement: (indicator: ProgressIndicator) => {
        const element = indicator.element;

        element.setAttribute('aria-valuenow', indicator.currentValue.toString());

        // Update visual representation if needed
        const valueElement = element.querySelector('[data-progress-value]');
        if (valueElement) {
          valueElement.textContent = `${Math.round((indicator.currentValue / indicator.maxValue) * 100)}%`;
        }
      },

      createLandmarkNavigationMenu: () => {
        const store = get();
        const regions = Array.from(store.navigationRegions.values());

        if (regions.length === 0) return;

        // Create navigation menu
        const nav = document.createElement('nav');
        nav.setAttribute('aria-label', 'Landmark navigation');
        nav.id = 'landmark-navigation';
        nav.style.cssText = `
          position: fixed;
          top: 10px;
          left: 10px;
          background: white;
          border: 1px solid #ccc;
          border-radius: 4px;
          padding: 10px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          z-index: 10000;
          display: none;
        `;

        const list = document.createElement('ul');
        list.style.cssText = 'margin: 0; padding: 0; list-style: none;';

        regions.forEach(region => {
          const item = document.createElement('li');
          item.style.cssText = 'margin: 2px 0;';

          const link = document.createElement('button');
          link.textContent = region.label;
          link.style.cssText = `
            background: none;
            border: 1px solid transparent;
            padding: 4px 8px;
            text-align: left;
            width: 100%;
            cursor: pointer;
          `;

          link.addEventListener('click', () => {
            store.navigateToRegion(region.id);
            nav.style.display = 'none';
          });

          link.addEventListener('mouseenter', () => {
            link.style.borderColor = '#007bff';
          });

          link.addEventListener('mouseleave', () => {
            link.style.borderColor = 'transparent';
          });

          item.appendChild(link);
          list.appendChild(item);
        });

        nav.appendChild(list);
        document.body.appendChild(nav);

        // Store reference
        (get() as any).landmarkNavMenu = nav;
      },

      showLandmarkNavigation: () => {
        const nav = (get() as any).landmarkNavMenu;
        if (nav) {
          nav.style.display = 'block';
          const firstButton = nav.querySelector('button');
          if (firstButton) {
            (firstButton as HTMLElement).focus();
          }
        }
      },

      showHeadingsNavigation: () => {
        const store = get();
        const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');

        if (headings.length === 0) {
          store.announce('No headings found on this page', 'medium', 'polite');
          return;
        }

        // Create headings navigation
        const nav = document.createElement('nav');
        nav.setAttribute('aria-label', 'Headings navigation');
        nav.style.cssText = `
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: white;
          border: 1px solid #ccc;
          border-radius: 8px;
          padding: 20px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.2);
          z-index: 10000;
          max-height: 80vh;
          overflow-y: auto;
        `;

        const title = document.createElement('h3');
        title.textContent = 'Page Headings';
        title.style.cssText = 'margin: 0 0 15px 0; font-size: 18px;';

        const list = document.createElement('ul');
        list.style.cssText = 'margin: 0; padding: 0; list-style: none;';

        headings.forEach((heading, index) => {
          const item = document.createElement('li');
          item.style.cssText = 'margin: 4px 0;';

          const level = parseInt(heading.tagName.substring(1));
          const indent = (level - 1) * 15;

          const link = document.createElement('button');
          link.textContent = `${'  '.repeat(level - 1)}${heading.textContent?.trim()}`;
          link.style.cssText = `
            background: none;
            border: 1px solid transparent;
            padding: 4px 8px;
            text-align: left;
            width: 100%;
            cursor: pointer;
            margin-left: ${indent}px;
            font-size: ${16 - level * 0.5}px;
          `;

          link.addEventListener('click', () => {
            (heading as HTMLElement).focus();
            heading.scrollIntoView({ behavior: 'smooth' });
            nav.remove();
          });

          item.appendChild(link);
          list.appendChild(item);
        });

        nav.appendChild(title);
        nav.appendChild(list);

        // Add close button
        const closeBtn = document.createElement('button');
        closeBtn.textContent = 'Close';
        closeBtn.style.cssText = `
          margin-top: 15px;
          padding: 8px 16px;
          background: #007bff;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        `;

        closeBtn.addEventListener('click', () => {
          nav.remove();
        });

        nav.appendChild(closeBtn);
        document.body.appendChild(nav);

        // Focus first heading link
        const firstLink = list.querySelector('button');
        if (firstLink) {
          (firstLink as HTMLElement).focus();
        }
      },

      showFormsNavigation: () => {
        const store = get();
        const forms = document.querySelectorAll('form');

        if (forms.length === 0) {
          store.announce('No forms found on this page', 'medium', 'polite');
          return;
        }

        store.announce(`Found ${forms.length} form${forms.length > 1 ? 's' : ''} on this page`, 'medium', 'polite');

        // Focus first form
        (forms[0] as HTMLElement).focus();
      },

      showLinksNavigation: () => {
        const store = get();
        const links = document.querySelectorAll('a[href]');

        if (links.length === 0) {
          store.announce('No links found on this page', 'medium', 'polite');
          return;
        }

        store.announce(`Found ${links.length} link${links.length > 1 ? 's' : ''} on this page`, 'medium', 'polite');

        // Focus first link
        (links[0] as HTMLElement).focus();
      },

      createSkipLinks: () => {
        const store = get();

        // Create main skip link
        const skipLink = document.createElement('a');
        skipLink.href = '#main-content';
        skipLink.textContent = 'Skip to main content';
        skipLink.className = 'skip-link';
        skipLink.style.cssText = `
          position: absolute;
          top: -40px;
          left: 6px;
          background: #007bff;
          color: white;
          padding: 8px;
          text-decoration: none;
          z-index: 10000;
          border-radius: 0 0 4px 4px;
        `;

        skipLink.addEventListener('focus', () => {
          skipLink.style.top = '0';
        });

        skipLink.addEventListener('blur', () => {
          skipLink.style.top = '-40px';
        });

        document.body.insertBefore(skipLink, document.body.firstChild);

        // Ensure main content exists
        if (!document.getElementById('main-content')) {
          const main = document.querySelector('main') || document.getElementById('main');
          if (main) {
            main.id = 'main-content';
          }
        }
      },

      enhanceTabNavigation: () => {
        const store = get();

        // Track focus history
        document.addEventListener('focusin', (e) => {
          const element = e.target as HTMLElement;
          set(state => ({
            focusHistory: [...state.focusHistory.slice(-9), element] // Keep last 10
          }));

          // Announce context changes
          if (store.config.announcePageChanges) {
            const context = store.generateContextualDescription(element);
            store.announce(context, 'low', 'polite');
          }
        }, true);
      },

      addMissingARIALabels: () => {
        const store = get();

        // Add labels to icon buttons
        document.querySelectorAll('button:not([aria-label]):not([title])').forEach(button => {
          const icon = button.querySelector('i, svg, [class*="icon"]');
          if (icon && !button.textContent?.trim()) {
            const className = icon.className || icon.getAttribute('data-icon');
            if (className) {
              const label = store.generateIconLabel(className);
              button.setAttribute('aria-label', label);
              button.setAttribute('data-custom-label', 'true');
            }
          }
        });

        // Add labels to decorative images that should have alt text
        document.querySelectorAll('img:not([alt]):not([role="presentation"])').forEach(img => {
          const src = (img as HTMLImageElement).src;
          const filename = src.split('/').pop()?.split('.')[0];
          if (filename) {
            const label = store.generateImageLabel(filename);
            img.setAttribute('alt', label);
            img.setAttribute('data-custom-label', 'true');
          }
        });
      },

      generateIconLabel: (className: string): string => {
        // Generate labels based on common icon class names
        const iconMap: Record<string, string> = {
          'close': 'Close',
          'menu': 'Menu',
          'search': 'Search',
          'cart': 'Shopping cart',
          'user': 'User account',
          'settings': 'Settings',
          'home': 'Home',
          'back': 'Go back',
          'next': 'Next',
          'previous': 'Previous',
          'edit': 'Edit',
          'delete': 'Delete',
          'save': 'Save',
          'cancel': 'Cancel',
          'confirm': 'Confirm',
          'add': 'Add',
          'remove': 'Remove'
        };

        const lowerClass = className.toLowerCase();
        for (const [key, value] of Object.entries(iconMap)) {
          if (lowerClass.includes(key)) {
            return value;
          }
        }

        return 'Button';
      },

      generateImageLabel: (filename: string): string => {
        // Generate labels based on filename
        const cleanName = filename.replace(/[-_]/g, ' ');
        return `Image: ${cleanName}`;
      },

      isImportantContent: (element: HTMLElement): boolean => {
        // Check if element contains important content
        return element.matches('main, section, article, [role="main"], [role="region"]') ||
               element.matches('h1, h2, h3, h4, h5, h6') ||
               element.matches('[aria-live="assertive"], [aria-live="polite"]') ||
               element.textContent?.length > 50;
      },

      cleanup: () => {
        const store = get();

        // Remove live regions
        store.liveRegions.forEach(region => region.remove());

        // Remove skip links
        document.querySelectorAll('.skip-link').forEach(link => link.remove());

        // Remove custom ARIA attributes
        document.querySelectorAll('[data-custom-label="true"]').forEach(element => {
          const el = element as HTMLElement;
          el.removeAttribute('data-custom-label');
          if (el.getAttribute('aria-label') && !el.hasAttribute('data-original-label')) {
            el.removeAttribute('aria-label');
          }
        });

        // Remove navigation regions
        store.navigationRegions.forEach(region => {
          store.cleanupNavigationRegion(region);
        });
      }
    }),
    {
      name: 'screen-reader-optimizations-store',
      partialize: (state) => ({
        config: state.config,
        announcements: state.announcements.slice(-10),
      }),
    }
  )
);

// React hook for screen reader optimizations
export const useScreenReaderControls = () => {
  const store = useScreenReaderOptimizations();

  const initialize = () => {
    store.initialize();
  };

  const toggleOptimizations = () => {
    if (store.isActive) {
      store.disable();
    } else {
      store.enable();
    }
  };

  const setVerbosity = (level: ScreenReaderConfig['verbosity']) => {
    store.updateConfiguration({ verbosity: level });
  };

  const addCustomLabel = (element: HTMLElement, label: string) => {
    store.setCustomLabel(element, label);
  };

  const createProgressTracker = (element: HTMLElement, label: string, max: number) => {
    store.createProgressIndicator({
      element,
      type: 'linear',
      currentValue: 0,
      maxValue: max,
      label,
      announceInterval: Math.ceil(max / 10) // Announce every 10%
    });
  };

  const announcePageChange = (pageTitle: string) => {
    store.announce(`Page changed to: ${pageTitle}`, 'high', 'assertive');
  };

  return {
    ...store,
    initialize,
    toggleOptimizations,
    setVerbosity,
    addCustomLabel,
    createProgressTracker,
    announcePageChange,
  };
};

export default useScreenReaderOptimizations;