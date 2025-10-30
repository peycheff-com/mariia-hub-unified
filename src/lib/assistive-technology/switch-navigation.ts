/**
 * Switch Navigation and Alternative Input Methods
 *
 * Comprehensive support for switch navigation, scanning interfaces,
 * alternative input methods, and assistive technology integration.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Types for switch navigation
export interface SwitchConfiguration {
  scanSpeed: number; // milliseconds
  scanPattern: 'row' | 'column' | 'grid' | 'circular' | 'element';
  dwellTime: number; // milliseconds for dwell clicking
  scanGroups: SwitchGroup[];
  customColors: {
    highlight: string;
    selection: string;
    dwellProgress: string;
  };
  sounds: {
    scan: boolean;
    select: boolean;
    error: boolean;
  };
  haptic: boolean;
}

export interface SwitchGroup {
  id: string;
  name: string;
  elements: HTMLElement[];
  enabled: boolean;
  priority: number;
}

export interface ScanElement {
  element: HTMLElement;
  index: number;
  group: SwitchGroup;
  isHighlighted: boolean;
  isAccessible: boolean;
  label: string;
}

export interface AlternativeInputMethod {
  type: 'switch' | 'head-pointer' | 'eye-tracking' | 'sip-puff' | 'gesture' | 'custom';
  isEnabled: boolean;
  configuration: Record<string, any>;
  calibration?: {
    completed: boolean;
    accuracy: number;
    lastCalibrated: Date;
  };
}

export interface DwellState {
  isActive: boolean;
  target: HTMLElement | null;
  progress: number;
  startTime: number | null;
  threshold: number;
}

interface SwitchNavigationStore {
  // Configuration
  config: SwitchConfiguration;
  alternativeInputs: Map<string, AlternativeInputMethod>;

  // State
  isScanning: boolean;
  currentIndex: number;
  currentGroup: number;
  highlightedElement: HTMLElement | null;
  dwellState: DwellState;
  scanTimer: number | null;
  dwellTimer: number | null;

  // Elements
  scanElements: Map<string, ScanElement>;
  focusableElements: HTMLElement[];

  // Actions
  initialize: () => void;
  startScanning: () => void;
  stopScanning: () => void;
  pauseScanning: () => void;
  resumeScanning: () => void;
  selectCurrent: () => void;
  nextElement: () => void;
  previousElement: () => void;
  nextGroup: () => void;
  previousGroup: () => void;
  updateConfiguration: (config: Partial<SwitchConfiguration>) => void;
  registerAlternativeInput: (method: AlternativeInputMethod) => void;
  unregisterAlternativeInput: (type: string) => void;
  calibrateInput: (type: string) => Promise<boolean>;
  startDwell: (target: HTMLElement) => void;
  stopDwell: () => void;
  reset: () => void;
}

export const useSwitchNavigation = create<SwitchNavigationStore>()(
  persist(
    (set, get) => ({
      // Default configuration
      config: {
        scanSpeed: 800,
        scanPattern: 'element',
        dwellTime: 1200,
        scanGroups: [],
        customColors: {
          highlight: '#f59e0b',
          selection: '#dc2626',
          dwellProgress: '#10b981'
        },
        sounds: {
          scan: true,
          select: true,
          error: true
        },
        haptic: true
      },

      alternativeInputs: new Map(),

      // Initial state
      isScanning: false,
      currentIndex: -1,
      currentGroup: 0,
      highlightedElement: null,
      dwellState: {
        isActive: false,
        target: null,
        progress: 0,
        startTime: null,
        threshold: 1200
      },
      scanTimer: null,
      dwellTimer: null,

      scanElements: new Map(),
      focusableElements: [],

      // Initialize switch navigation
      initialize: () => {
        const store = get();

        // Set up keyboard shortcuts
        document.addEventListener('keydown', store.handleKeyDown);
        document.addEventListener('keyup', store.handleKeyUp);

        // Detect available alternative input methods
        store.detectAlternativeInputs();

        // Initialize scan groups
        store.initializeScanGroups();

        // Set up focusable element tracking
        store.updateFocusableElements();

        // Listen for DOM changes
        const observer = new MutationObserver(() => {
          store.updateFocusableElements();
          store.updateScanElements();
        });

        observer.observe(document.body, {
          childList: true,
          subtree: true,
          attributes: true,
          attributeFilter: ['disabled', 'hidden', 'aria-hidden']
        });

        // Store observer for cleanup
        (store as any).observer = observer;
      },

      // Start scanning process
      startScanning: () => {
        const store = get();

        if (store.isScanning) return;

        store.updateFocusableElements();
        store.updateScanElements();

        if (store.scanElements.size === 0) {
          store.playSound('error');
          return;
        }

        set({ isScanning: true, currentIndex: -1 });

        // Start scanning cycle
        store.scanNext();
      },

      // Stop scanning
      stopScanning: () => {
        const store = get();

        set({ isScanning: false });

        if (store.scanTimer) {
          clearTimeout(store.scanTimer);
          set({ scanTimer: null });
        }

        store.clearHighlight();
      },

      // Pause scanning
      pauseScanning: () => {
        const store = get();

        if (store.scanTimer) {
          clearTimeout(store.scanTimer);
          set({ scanTimer: null });
        }

        set({ isScanning: false });
      },

      // Resume scanning
      resumeScanning: () => {
        const store = get();

        if (!store.isScanning) {
          set({ isScanning: true });
          store.scanNext();
        }
      },

      // Select current highlighted element
      selectCurrent: () => {
        const store = get();
        const { highlightedElement } = store;

        if (highlightedElement) {
          store.playSound('select');
          store.activateElement(highlightedElement);
        } else {
          store.playSound('error');
        }
      },

      // Move to next element
      nextElement: () => {
        const store = get();
        const { currentIndex, scanElements } = store;

        const nextIndex = (currentIndex + 1) % scanElements.size;
        set({ currentIndex: nextIndex });

        store.highlightElement(nextIndex);
      },

      // Move to previous element
      previousElement: () => {
        const store = get();
        const { currentIndex, scanElements } = store;

        const prevIndex = currentIndex <= 0 ? scanElements.size - 1 : currentIndex - 1;
        set({ currentIndex: prevIndex });

        store.highlightElement(prevIndex);
      },

      // Move to next group
      nextGroup: () => {
        const store = get();
        const { currentGroup, config } = store;

        const nextGroup = (currentGroup + 1) % config.scanGroups.length;
        set({ currentGroup: nextGroup, currentIndex: -1 });

        store.updateScanElements();
      },

      // Move to previous group
      previousGroup: () => {
        const store = get();
        const { currentGroup, config } = store;

        const prevGroup = currentGroup <= 0 ? config.scanGroups.length - 1 : currentGroup - 1;
        set({ currentGroup: prevGroup, currentIndex: -1 });

        store.updateScanElements();
      },

      // Update configuration
      updateConfiguration: (newConfig: Partial<SwitchConfiguration>) => {
        set(state => ({
          config: { ...state.config, ...newConfig }
        }));
      },

      // Register alternative input method
      registerAlternativeInput: (method: AlternativeInputMethod) => {
        const store = get();
        const newInputs = new Map(store.alternativeInputs);
        newInputs.set(method.type, method);
        set({ alternativeInputs: newInputs });
      },

      // Unregister alternative input method
      unregisterAlternativeInput: (type: string) => {
        const store = get();
        const newInputs = new Map(store.alternativeInputs);
        newInputs.delete(type);
        set({ alternativeInputs: newInputs });
      },

      // Calibrate alternative input
      calibrateInput: async (type: string): Promise<boolean> => {
        const store = get();
        const input = store.alternativeInputs.get(type);

        if (!input) return false;

        // Start calibration process
        set(state => ({
          alternativeInputs: new Map(state.alternativeInputs).set(type, {
            ...input,
            calibration: {
              ...input.calibration,
              completed: false,
              accuracy: 0,
              lastCalibrated: new Date()
            }
          })
        }));

        // Perform calibration based on input type
        try {
          let accuracy = 0;

          switch (type) {
            case 'eye-tracking':
              accuracy = await store.calibrateEyeTracking();
              break;
            case 'head-pointer':
              accuracy = await store.calibrateHeadPointer();
              break;
            case 'sip-puff':
              accuracy = await store.calibrateSipPuff();
              break;
            default:
              accuracy = 0.8; // Default accuracy
          }

          set(state => ({
            alternativeInputs: new Map(state.alternativeInputs).set(type, {
              ...state.alternativeInputs.get(type)!,
              calibration: {
                completed: true,
                accuracy,
                lastCalibrated: new Date()
              }
            })
          }));

          return accuracy > 0.6;
        } catch (error) {
          console.error('Calibration failed:', error);
          return false;
        }
      },

      // Start dwell clicking
      startDwell: (target: HTMLElement) => {
        const store = get();

        set({
          dwellState: {
            isActive: true,
            target,
            progress: 0,
            startTime: Date.now(),
            threshold: store.config.dwellTime
          }
        });

        // Start dwell timer
        const dwellTimer = window.setInterval(() => {
          const { dwellState } = get();

          if (!dwellState.isActive || !dwellState.startTime) {
            clearInterval(dwellTimer);
            return;
          }

          const elapsed = Date.now() - dwellState.startTime;
          const progress = Math.min(elapsed / dwellState.threshold, 1);

          set(state => ({
            dwellState: {
              ...state.dwellState,
              progress
            }
          }));

          // Show dwell progress indicator
          store.updateDwellIndicator(target, progress);

          // Check if dwell threshold reached
          if (progress >= 1) {
            clearInterval(dwellTimer);
            store.activateElement(target);
            store.stopDwell();
          }
        }, 16); // 60fps update

        set({ dwellTimer });
      },

      // Stop dwell clicking
      stopDwell: () => {
        const store = get();
        const { dwellState, dwellTimer } = store;

        if (dwellTimer) {
          clearInterval(dwellTimer);
          set({ dwellTimer: null });
        }

        if (dwellState.target) {
          store.updateDwellIndicator(dwellState.target, 0);
        }

        set({
          dwellState: {
            isActive: false,
            target: null,
            progress: 0,
            startTime: null,
            threshold: store.config.dwellTime
          }
        });
      },

      // Reset all state
      reset: () => {
        const store = get();

        store.stopScanning();
        store.stopDwell();

        set({
          currentIndex: -1,
          currentGroup: 0,
          highlightedElement: null,
          scanElements: new Map(),
          focusableElements: []
        });
      },

      // Internal methods
      handleKeyDown: (event: KeyboardEvent) => {
        const store = get();
        const { isScanning } = store;

        // Space or Enter - select current element
        if (event.key === ' ' || event.key === 'Enter') {
          event.preventDefault();
          if (isScanning) {
            store.selectCurrent();
          }
        }
        // Arrow keys - manual navigation
        else if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
          event.preventDefault();
          if (!isScanning) {
            store.nextElement();
          }
        } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
          event.preventDefault();
          if (!isScanning) {
            store.previousElement();
          }
        }
        // Tab - start/stop scanning
        else if (event.key === 'Tab' && event.shiftKey) {
          event.preventDefault();
          if (isScanning) {
            store.pauseScanning();
          } else {
            store.startScanning();
          }
        }
      },

      handleKeyUp: (event: KeyboardEvent) => {
        // Handle any key release events if needed
      },

      detectAlternativeInputs: () => {
        const store = get();

        // Detect eye tracking support
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
          // Assume eye tracking capability (in real implementation, would check for specific APIs)
          store.registerAlternativeInput({
            type: 'eye-tracking',
            isEnabled: false,
            configuration: { sensitivity: 0.8, smoothing: 0.6 }
          });
        }

        // Detect touch/gesture support
        if ('ontouchstart' in window) {
          store.registerAlternativeInput({
            type: 'gesture',
            isEnabled: false,
            configuration: { gestureTypes: ['swipe', 'tap', 'hold'] }
          });
        }

        // Detect gamepad support for switch interfaces
        if ('getGamepads' in navigator) {
          store.registerAlternativeInput({
            type: 'switch',
            isEnabled: false,
            configuration: { buttonMapping: {}, sensitivity: 0.5 }
          });
        }
      },

      initializeScanGroups: () => {
        const store = get();
        const defaultGroups: SwitchGroup[] = [
          {
            id: 'navigation',
            name: 'Navigation',
            elements: [],
            enabled: true,
            priority: 1
          },
          {
            id: 'main-content',
            name: 'Main Content',
            elements: [],
            enabled: true,
            priority: 2
          },
          {
            id: 'forms',
            name: 'Forms',
            elements: [],
            enabled: true,
            priority: 3
          },
          {
            id: 'actions',
            name: 'Actions',
            elements: [],
            enabled: true,
            priority: 4
          }
        ];

        set(state => ({
          config: {
            ...state.config,
            scanGroups: defaultGroups
          }
        }));
      },

      updateFocusableElements: () => {
        const focusableSelectors = [
          'button:not([disabled])',
          '[href]',
          'input:not([disabled])',
          'select:not([disabled])',
          'textarea:not([disabled])',
          '[tabindex]:not([tabindex="-1"])',
          '[role="button"]:not([aria-disabled="true"])',
          '[role="link"]',
          '[role="menuitem"]',
          '[role="option"]',
          '[role="tab"]'
        ];

        const elements = Array.from(document.querySelectorAll(focusableSelectors.join(', '))) as HTMLElement[];

        // Filter out hidden and inaccessible elements
        const accessibleElements = elements.filter(el => {
          const style = window.getComputedStyle(el);
          const rect = el.getBoundingClientRect();

          return (
            el.offsetParent !== null &&
            style.visibility !== 'hidden' &&
            style.display !== 'none' &&
            rect.width > 0 &&
            rect.height > 0 &&
            !el.getAttribute('aria-hidden')
          );
        });

        set({ focusableElements: accessibleElements });
      },

      updateScanElements: () => {
        const store = get();
        const { focusableElements, config, currentGroup } = store;
        const scanElements = new Map<string, ScanElement>();

        focusableElements.forEach((element, index) => {
          const group = store.getElementGroup(element);

          if (group && group.enabled) {
            const scanElement: ScanElement = {
              element,
              index,
              group,
              isHighlighted: false,
              isAccessible: true,
              label: store.getElementLabel(element)
            };

            scanElements.set(`${group.id}-${index}`, scanElement);
          }
        });

        set({ scanElements });
      },

      getElementGroup: (element: HTMLElement): SwitchGroup | null => {
        const store = get();
        const { config } = store;

        // Determine group based on element attributes and position
        let groupId = 'main-content';

        if (element.matches('nav a, [role="navigation"] *, button[aria-label*="menu"]')) {
          groupId = 'navigation';
        } else if (element.matches('input, select, textarea, label')) {
          groupId = 'forms';
        } else if (element.matches('button[type="submit"], .btn-primary, [role="button"][aria-label*="save"]')) {
          groupId = 'actions';
        }

        return config.scanGroups.find(g => g.id === groupId) || null;
      },

      getElementLabel: (element: HTMLElement): string => {
        // Try multiple methods to get an accessible label
        const label =
          element.getAttribute('aria-label') ||
          element.getAttribute('title') ||
          element.textContent?.trim() ||
          element.getAttribute('alt') ||
          element.getAttribute('placeholder') ||
          element.tagName.toLowerCase();

        return label || 'unlabeled element';
      },

      scanNext: () => {
        const store = get();
        const { isScanning, config, scanElements, currentIndex } = store;

        if (!isScanning || scanElements.size === 0) return;

        const nextIndex = (currentIndex + 1) % scanElements.size;
        set({ currentIndex: nextIndex });

        store.highlightElement(nextIndex);
        store.playSound('scan');

        // Schedule next scan
        const scanTimer = window.setTimeout(() => {
          store.scanNext();
        }, config.scanSpeed);

        set({ scanTimer });
      },

      highlightElement: (index: number) => {
        const store = get();
        const { scanElements, highlightedElement } = store;

        // Clear previous highlight
        if (highlightedElement) {
          store.clearHighlight();
        }

        // Find and highlight new element
        const elementArray = Array.from(scanElements.values());
        const targetElement = elementArray[index];

        if (targetElement && targetElement.isAccessible) {
          store.applyHighlight(targetElement.element);
          set({ highlightedElement: targetElement.element });
        }
      },

      applyHighlight: (element: HTMLElement) => {
        const store = get();
        const { config } = store;

        // Add highlight styling
        element.style.setProperty('--switch-highlight-color', config.customColors.highlight);
        element.classList.add('switch-highlighted');

        // Announce to screen readers
        const label = store.getElementLabel(element);
        const announcer = document.querySelector('[aria-live="polite"]') as HTMLElement;
        if (announcer) {
          announcer.textContent = `Highlighted: ${label}`;
        }
      },

      clearHighlight: () => {
        const { highlightedElement } = get();

        if (highlightedElement) {
          highlightedElement.classList.remove('switch-highlighted');
          highlightedElement.style.removeProperty('--switch-highlight-color');
          set({ highlightedElement: null });
        }
      },

      activateElement: (element: HTMLElement) => {
        // Trigger appropriate action based on element type
        if (element.tagName === 'A' || element.getAttribute('role') === 'link') {
          (element as HTMLAnchorElement).click();
        } else if (element.tagName === 'BUTTON' || element.getAttribute('role') === 'button') {
          element.click();
        } else if (element.matches('input, select, textarea')) {
          element.focus();
        } else {
          element.click();
        }
      },

      updateDwellIndicator: (target: HTMLElement, progress: number) => {
        // Update or create dwell progress indicator
        let indicator = target.querySelector('.dwell-indicator') as HTMLElement;

        if (!indicator && progress > 0) {
          indicator = document.createElement('div');
          indicator.className = 'dwell-indicator';
          target.style.position = 'relative';
          target.appendChild(indicator);
        }

        if (indicator) {
          if (progress === 0) {
            indicator.remove();
          } else {
            indicator.style.width = `${progress * 100}%`;
            indicator.style.height = '3px';
            indicator.style.backgroundColor = 'var(--switch-dwell-color, #10b981)';
            indicator.style.position = 'absolute';
            indicator.style.bottom = '0';
            indicator.style.left = '0';
            indicator.style.transition = 'none';
          }
        }
      },

      playSound: (type: 'scan' | 'select' | 'error') => {
        const store = get();
        const { config } = store;

        if (!config.sounds[type]) return;

        // Create simple beep sounds using Web Audio API
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        // Set sound parameters based on type
        switch (type) {
          case 'scan':
            oscillator.frequency.value = 800;
            gainNode.gain.value = 0.1;
            break;
          case 'select':
            oscillator.frequency.value = 1200;
            gainNode.gain.value = 0.2;
            break;
          case 'error':
            oscillator.frequency.value = 300;
            gainNode.gain.value = 0.3;
            break;
        }

        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.1);
      },

      calibrateEyeTracking: async (): Promise<number> => {
        // Simulate eye tracking calibration
        // In real implementation, would integrate with eye tracking API
        return new Promise((resolve) => {
          setTimeout(() => resolve(0.85), 2000);
        });
      },

      calibrateHeadPointer: async (): Promise<number> => {
        // Simulate head pointer calibration
        return new Promise((resolve) => {
          setTimeout(() => resolve(0.78), 1500);
        });
      },

      calibrateSipPuff: async (): Promise<number> => {
        // Simulate sip/puff calibration
        return new Promise((resolve) => {
          setTimeout(() => resolve(0.82), 1000);
        });
      }
    }),
    {
      name: 'switch-navigation-store',
      partialize: (state) => ({
        config: state.config,
        alternativeInputs: Array.from(state.alternativeInputs.entries()),
      }),
    }
  )
);

// Add CSS for switch navigation
const switchNavigationStyles = `
/* Switch Navigation Styles */
.switch-highlighted {
  outline: 3px solid var(--switch-highlight-color, #f59e0b) !important;
  outline-offset: 2px !important;
  position: relative !important;
  z-index: 1000 !important;
}

.switch-highlighted::before {
  content: '';
  position: absolute;
  inset: -4px;
  border: 2px solid var(--switch-highlight-color, #f59e0b);
  border-radius: 4px;
  pointer-events: none;
  animation: switch-pulse 1s ease-in-out infinite;
}

@keyframes switch-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

.dwell-indicator {
  z-index: 1001;
  pointer-events: none;
}

/* Scan Group Indicators */
.scan-group-indicator {
  position: fixed;
  top: 10px;
  right: 10px;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 14px;
  z-index: 1002;
}

/* Switch Control Panel */
.switch-control-panel {
  position: fixed;
  bottom: 20px;
  left: 20px;
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  z-index: 1003;
}

.switch-control-panel button {
  margin: 4px;
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  background: #f9fafb;
  cursor: pointer;
}

.switch-control-panel button:hover {
  background: #f3f4f6;
}

.switch-control-panel button.active {
  background: #10b981;
  color: white;
  border-color: #10b981;
}
`;

// Inject styles into document
const styleSheet = document.createElement('style');
styleSheet.textContent = switchNavigationStyles;
document.head.appendChild(styleSheet);

// React hook for switch navigation
export const useSwitchNavigationControls = () => {
  const store = useSwitchNavigation();

  const initialize = () => {
    store.initialize();
  };

  const toggleScanning = () => {
    if (store.isScanning) {
      store.stopScanning();
    } else {
      store.startScanning();
    }
  };

  const updateScanSpeed = (speed: number) => {
    store.updateConfiguration({ scanSpeed: speed });
  };

  const updateDwellTime = (time: number) => {
    store.updateConfiguration({ dwellTime: time });
  };

  const toggleSounds = (soundType: keyof SwitchConfiguration['sounds']) => {
    store.updateConfiguration({
      sounds: {
        ...store.config.sounds,
        [soundType]: !store.config.sounds[soundType]
      }
    });
  };

  return {
    ...store,
    initialize,
    toggleScanning,
    updateScanSpeed,
    updateDwellTime,
    toggleSounds,
  };
};

export default useSwitchNavigation;