/**
 * Braille Display Compatibility and Support
 *
 * Comprehensive support for Braille displays with proper formatting,
 * navigation aids, and Braille-specific optimizations.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Types for Braille support
export interface BrailleConfiguration {
  enabled: boolean;
  language: string;
  grade: 1 | 2 | 3; // Uncontracted, Contracted, Computer Braille
  cellCount: number; // Number of Braille cells (typically 20, 40, or 80)
  displayType: 'portable' | 'desktop' | 'notetaker' | 'unknown';
  outputMode: 'text' | 'structured' | 'navigation';
  verbosity: 'minimal' | 'standard' | 'detailed';
  customSettings: {
    showMath: boolean;
    showEmojis: boolean;
    showFormatting: boolean;
    tableNavigation: boolean;
    formLabels: boolean;
  };
}

export interface BrailleElement {
  id: string;
  element: HTMLElement;
  brailleText: string;
  position: number;
  length: number;
  isInteractive: boolean;
  navigationHints: string[];
}

export interface BrailleTable {
  id: string;
  headers: string[];
  rows: string[][];
  caption?: string;
  summary?: string;
}

export interface BrailleAnnouncement {
  id: string;
  text: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
  context: string;
}

interface BrailleStore {
  // Configuration
  config: BrailleConfiguration;
  isConnected: boolean;
  activeDisplay: any | null;

  // Content
  brailleElements: Map<string, BrailleElement>;
  currentContent: string;
  cursorPosition: number;
  announcements: BrailleAnnouncement[];

  // Navigation
  navigationHistory: string[];
  bookmarks: Map<string, string>;

  // Actions
  initialize: () => Promise<boolean>;
  connect: (display?: any) => Promise<boolean>;
  disconnect: () => void;
  updateConfiguration: (config: Partial<BrailleConfiguration>) => void;
  processElement: (element: HTMLElement) => void;
  updateContent: (content: string) => void;
  sendToDisplay: (text: string) => void;
  announce: (text: string, priority?: BrailleAnnouncement['priority']) => void;
  navigateTo: (elementId: string) => void;
  addBookmark: (name: string, position: number) => void;
  jumpToBookmark: (name: string) => void;
  getTableStructure: (table: HTMLTableElement) => BrailleTable;
  formatForm: (form: HTMLFormElement) => string;
  formatTable: (table: HTMLTableElement) => string;
  reset: () => void;
}

// Braille character mapping (simplified - in production would use proper Unicode Braille patterns)
const BRAILLE_PATTERNS: Record<string, string> = {
  'a': '⠁', 'b': '⠃', 'c': '⠉', 'd': '⠙', 'e': '⠑',
  'f': '⠋', 'g': '⠛', 'h': '⠓', 'i': '⠊', 'j': '⠚',
  'k': '⠅', 'l': '⠇', 'm': '⠍', 'n': '⠝', 'o': '⠕',
  'p': '⠏', 'q': '⠟', 'r': '⠗', 's': '⠎', 't': '⠞',
  'u': '⠥', 'v': '⠧', 'w': '⠺', 'x': '⠭', 'y': '⠽',
  'z': '⠵',
  '0': '⠼⠚', '1': '⠼⠁', '2': '⠼⠃', '3': '⠼⠉', '4': '⠼⠙',
  '5': '⠼⠑', '6': '⠼⠋', '7': '⠼⠛', '8': '⠼⠓', '9': '⠼⠊',
  '.': '⠲', ',': '⠂', '?': '⠦', '!': '⠖', ':': '⠒',
  ';': '⠆', '-': '⠤', '(': '⠦', ')': '⠴', '[': '⠪',
  ']': '⠻', '{': '⠦⠠', '}': '⠠⠴', '"': '⠠⠦', "'": '⠄',
  ' ': ' '
};

export const useBrailleSupport = create<BrailleStore>()(
  persist(
    (set, get) => ({
      // Default configuration
      config: {
        enabled: false,
        language: 'pl',
        grade: 2,
        cellCount: 40,
        displayType: 'unknown',
        outputMode: 'structured',
        verbosity: 'standard',
        customSettings: {
          showMath: true,
          showEmojis: true,
          showFormatting: true,
          tableNavigation: true,
          formLabels: true
        }
      },

      isConnected: false,
      activeDisplay: null,

      brailleElements: new Map(),
      currentContent: '',
      cursorPosition: 0,
      announcements: [],
      navigationHistory: [],
      bookmarks: new Map(),

      // Initialize Braille support
      initialize: async () => {
        const store = get();

        try {
          // Check for Braille display support
          const hasBrailleSupport = await store.detectBrailleSupport();

          if (hasBrailleSupport) {
            set({ config: { ...store.config, enabled: true } });
            await store.connect();
          }

          // Set up content observers
          store.setupContentObservers();

          return hasBrailleSupport;
        } catch (error) {
          console.error('Failed to initialize Braille support:', error);
          return false;
        }
      },

      // Connect to Braille display
      connect: async (display?: any) => {
        const store = get();

        try {
          // In a real implementation, this would connect to actual Braille display APIs
          // For now, we simulate connection
          const mockDisplay = display || {
            type: 'simulated',
            cellCount: store.config.cellCount,
            isConnected: true
          };

          set({
            isConnected: true,
            activeDisplay: mockDisplay
          });

          store.announce('Braille display connected', 'high');
          return true;
        } catch (error) {
          console.error('Failed to connect to Braille display:', error);
          set({ isConnected: false });
          return false;
        }
      },

      // Disconnect from Braille display
      disconnect: () => {
        const store = get();

        set({
          isConnected: false,
          activeDisplay: null,
          currentContent: ''
        });

        store.announce('Braille display disconnected', 'medium');
      },

      // Update configuration
      updateConfiguration: (newConfig: Partial<BrailleConfiguration>) => {
        set(state => ({
          config: { ...state.config, ...newConfig }
        }));
      },

      // Process element for Braille output
      processElement: (element: HTMLElement) => {
        const store = get();
        const { config } = store;

        if (!config.enabled || !store.isConnected) return;

        let brailleText = '';
        let navigationHints: string[] = [];

        // Generate appropriate Braille text based on element type
        switch (element.tagName.toLowerCase()) {
          case 'h1':
          case 'h2':
          case 'h3':
          case 'h4':
          case 'h5':
          case 'h6':
            brailleText = `⠠⠓${element.textContent?.trim()}⠠⠱`;
            navigationHints = ['heading', `level ${element.tagName.substring(1)}`];
            break;

          case 'p':
            brailleText = store.convertToBraille(element.textContent || '');
            navigationHints = ['paragraph'];
            break;

          case 'a':
            const href = element.getAttribute('href');
            const linkText = element.textContent || '';
            brailleText = `⠠⠇${store.convertToBraille(linkText)}`;
            if (href) {
              brailleText += ` ⠠⠓${href}`;
            }
            navigationHints = ['link', href ? 'external' : 'internal'];
            break;

          case 'button':
            brailleText = `⠠⠃${store.convertToBraille(element.textContent || '')}`;
            navigationHints = ['button'];
            break;

          case 'input':
          case 'select':
          case 'textarea':
            const label = store.findLabel(element);
            const value = (element as HTMLInputElement).value || '';
            const type = element.getAttribute('type') || element.tagName.toLowerCase();

            brailleText = `⠠⠊${store.convertToBraille(label)}`;
            if (value) {
              brailleText += ` ⠠⠧${store.convertToBraille(value)}`;
            }
            brailleText += ` ⠠⠞${type}`;
            navigationHints = ['input', type, label ? 'labeled' : 'unlabeled'];
            break;

          case 'table':
            brailleText = store.formatTable(element as HTMLTableElement);
            navigationHints = ['table', 'data'];
            break;

          case 'form':
            brailleText = store.formatForm(element as HTMLFormElement);
            navigationHints = ['form'];
            break;

          case 'img':
            const alt = element.getAttribute('alt') || element.getAttribute('aria-label') || 'image';
            brailleText = `⠠⠊${store.convertToBraille(alt)}`;
            navigationHints = ['image', alt === 'image' ? 'no description' : 'described'];
            break;

          case 'ul':
          case 'ol':
            brailleText = store.formatList(element as HTMLUListElement | HTMLOListElement);
            navigationHints = ['list'];
            break;

          default:
            brailleText = store.convertToBraille(element.textContent || '');
            navigationHints = ['text'];
        }

        // Add interactive indicators
        if (element.matches('button, [role="button"], a, [role="link"], input, select, textarea')) {
          brailleText = `⠠⠭${brailleText}`;
        }

        // Create Braille element
        const brailleElement: BrailleElement = {
          id: store.generateElementId(element),
          element,
          brailleText,
          position: store.brailleElements.size,
          length: brailleText.length,
          isInteractive: element.matches('button, [role="button"], a, [role="link"], input, select, textarea, [tabindex]'),
          navigationHints
        };

        set(state => ({
          brailleElements: new Map(state.brailleElements).set(brailleElement.id, brailleElement)
        }));

        // Send to display
        store.sendToDisplay(brailleText);
      },

      // Update content on Braille display
      updateContent: (content: string) => {
        const store = get();

        if (!store.isConnected) return;

        const brailleContent = store.convertToBraille(content);
        set({ currentContent: brailleContent });
        store.sendToDisplay(brailleContent);
      },

      // Send text to Braille display
      sendToDisplay: (text: string) => {
        const store = get();
        const { activeDisplay, config } = store;

        if (!activeDisplay || !text) return;

        // Truncate text to display cell count
        const truncatedText = text.substring(0, config.cellCount);

        // In a real implementation, this would send to actual display
        console.log('Sending to Braille display:', truncatedText);

        // Simulate display update
        if (activeDisplay.updateDisplay) {
          activeDisplay.updateDisplay(truncatedText);
        }
      },

      // Make announcement to Braille display
      announce: (text: string, priority: BrailleAnnouncement['priority'] = 'medium') => {
        const store = get();

        const announcement: BrailleAnnouncement = {
          id: `announcement-${Date.now()}`,
          text: store.convertToBraille(text),
          priority,
          timestamp: new Date(),
          context: 'system'
        };

        set(state => ({
          announcements: [...state.announcements, announcement].slice(-10) // Keep last 10
        }));

        // Send high priority announcements immediately
        if (priority === 'high' || priority === 'critical') {
          store.sendToDisplay(text);
        }
      },

      // Navigate to specific element
      navigateTo: (elementId: string) => {
        const store = get();
        const { brailleElements } = store;

        const element = brailleElements.get(elementId);
        if (element) {
          set({ cursorPosition: element.position });
          store.sendToDisplay(element.brailleText);

          // Add to navigation history
          set(state => ({
            navigationHistory: [...state.navigationHistory, elementId].slice(-20)
          }));
        }
      },

      // Add bookmark
      addBookmark: (name: string, position: number) => {
        set(state => ({
          bookmarks: new Map(state.bookmarks).set(name, position.toString())
        }));
      },

      // Jump to bookmark
      jumpToBookmark: (name: string) => {
        const store = get();
        const position = store.bookmarks.get(name);

        if (position) {
          set({ cursorPosition: parseInt(position) });
          store.announce(`Jumped to bookmark: ${name}`, 'medium');
        }
      },

      // Get table structure for Braille
      getTableStructure: (table: HTMLTableElement): BrailleTable => {
        const headers: string[] = [];
        const rows: string[][] = [];

        // Get headers
        const headerCells = table.querySelectorAll('thead th, tr:first-child th, tr:first-child td');
        headerCells.forEach(cell => {
          headers.push(cell.textContent?.trim() || '');
        });

        // Get data rows
        const dataRows = table.querySelectorAll('tbody tr, tr');
        dataRows.forEach(row => {
          const rowData: string[] = [];
          const cells = row.querySelectorAll('td, th');
          cells.forEach(cell => {
            rowData.push(cell.textContent?.trim() || '');
          });
          if (rowData.length > 0) {
            rows.push(rowData);
          }
        });

        return {
          id: store.generateElementId(table),
          headers,
          rows,
          caption: table.querySelector('caption')?.textContent?.trim(),
          summary: table.getAttribute('summary')
        };
      },

      // Format table for Braille display
      formatTable: (table: HTMLTableElement): string => {
        const store = get();
        const tableStructure = store.getTableStructure(table);
        let brailleOutput = '';

        brailleOutput += '⠠⠠⠨⠨⠨⠨ TABLE ⠨⠨⠨⠨⠠⠱';

        // Add caption if present
        if (tableStructure.caption) {
          brailleOutput += `\n⠠⠉${store.convertToBraille(tableStructure.caption)}`;
        }

        // Add headers
        if (tableStructure.headers.length > 0) {
          brailleOutput += '\n⠠⠠⠸⠸ HEADERS ⠸⠸⠠⠱';
          const headerRow = tableStructure.headers.map(h => store.convertToBraille(h)).join(' ⠐ ');
          brailleOutput += `\n${headerRow}`;
        }

        // Add data rows
        brailleOutput += '\n⠠⠠⠸⠸ DATA ⠸⠸⠠⠱';
        tableStructure.rows.slice(0, 5).forEach((row, index) => { // Limit to first 5 rows
          const brailleRow = row.map(cell => store.convertToBraille(cell)).join(' ⠐ ');
          brailleOutput += `\n⠠⠗${index + 1} ${brailleRow}`;
        });

        if (tableStructure.rows.length > 5) {
          brailleOutput += `\n⠠⠑${tableStructure.rows.length - 5} more rows`;
        }

        return brailleOutput;
      },

      // Format form for Braille display
      formatForm: (form: HTMLFormElement): string => {
        const store = get();
        let brailleOutput = '';

        brailleOutput += '⠠⠠⠨⠨⠨⠨ FORM ⠨⠨⠨⠨⠠⠱';

        // Get form title
        const title = form.querySelector('legend, h1, h2, h3')?.textContent?.trim();
        if (title) {
          brailleOutput += `\n⠠⠋${store.convertToBraille(title)}`;
        }

        // Process form fields
        const formElements = form.querySelectorAll('input, select, textarea, button');
        formElements.forEach((element, index) => {
          const label = store.findLabel(element as HTMLElement);
          const value = (element as HTMLInputElement).value || '';
          const type = element.getAttribute('type') || element.tagName.toLowerCase();
          const required = element.hasAttribute('required');

          let fieldText = `\n⠠⠠⠸⠸ FIELD ${index + 1} ⠸⠸⠠⠱`;
          fieldText += `\n⠠⠇${store.convertToBraille(label)}`;

          if (value) {
            fieldText += `\n⠠⠧${store.convertToBraille(value)}`;
          }

          fieldText += `\n⠠⠞${type}`;

          if (required) {
            fieldText += ' ⠠⠗required';
          }

          brailleOutput += fieldText;
        });

        return brailleOutput;
      },

      // Reset all state
      reset: () => {
        set({
          brailleElements: new Map(),
          currentContent: '',
          cursorPosition: 0,
          announcements: [],
          navigationHistory: []
        });
      },

      // Internal methods
      detectBrailleSupport: async (): Promise<boolean> => {
        // Check for various Braille display APIs
        return new Promise((resolve) => {
          // Simulate detection - in reality would check for actual APIs
          const hasSupport = (
            'braille' in navigator ||
            (window as any).brailleDisplay ||
            (window as any).atk ||
            (window as any).screenReaderDetect
          );

          setTimeout(() => resolve(hasSupport || true), 100); // Default to true for demo
        });
      },

      setupContentObservers: () => {
        const store = get();

        // Observe DOM changes for dynamic content
        const observer = new MutationObserver((mutations) => {
          mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
              if (node.nodeType === Node.ELEMENT_NODE) {
                const element = node as HTMLElement;
                if (element.matches('h1, h2, h3, h4, h5, h6, p, a, button, input, select, textarea, table, img')) {
                  store.processElement(element);
                }
              }
            });
          });
        });

        observer.observe(document.body, {
          childList: true,
          subtree: true
        });

        // Store observer for cleanup
        (store as any).observer = observer;
      },

      convertToBraille: (text: string): string => {
        const store = get();
        const { config } = store;

        // Simple character-by-character conversion
        // In production, would use proper Braille translation libraries
        let brailleText = '';

        for (let i = 0; i < text.length; i++) {
          const char = text[i].toLowerCase();
          const brailleChar = BRAILLE_PATTERNS[char] || char;
          brailleText += brailleChar;
        }

        // Apply grade-specific transformations
        if (config.grade === 2) {
          brailleText = store.applyContractedBraille(brailleText);
        }

        return brailleText;
      },

      applyContractedBraille: (text: string): string => {
        // Simplified contracted Braille rules
        // In production, would use proper contraction dictionary
        const contractions: Record<string, string> = {
          'and': '⠯',
          'for': '⠿',
          'of': '⠷',
          'the': '⠮',
          'with': '⠾',
          'ch': '⠡',
          'sh': '⠱',
          'th': '⠹',
          'wh': '⠿',
          'ed': '⠫',
          'er': '⠻',
          'ou': '⠳',
          'ow': '⠮'
        };

        let result = text;
        Object.entries(contractions).forEach(([contraction, pattern]) => {
          result = result.replace(new RegExp(contraction, 'g'), pattern);
        });

        return result;
      },

      findLabel: (element: HTMLElement): string => {
        // Try multiple methods to find label
        const label = element.getAttribute('aria-label') ||
                     element.getAttribute('title') ||
                     element.getAttribute('placeholder') ||
                     element.closest('label')?.textContent?.trim() ||
                     document.querySelector(`label[for="${element.id}"]`)?.textContent?.trim() ||
                     '';

        return label || element.getAttribute('name') || element.tagName.toLowerCase();
      },

      formatList: (list: HTMLUListElement | HTMLOListElement): string => {
        const store = get();
        let brailleOutput = '';

        const isOrdered = list.tagName.toLowerCase() === 'ol';
        const items = list.querySelectorAll('li');

        brailleOutput += `⠠⠠⠨⠨⠨⠨ ${isOrdered ? 'ORDERED' : 'UNORDERED'} LIST (${items.length} items) ⠨⠨⠨⠨⠠⠱`;

        items.forEach((item, index) => {
          const prefix = isOrdered ? `${index + 1}.` : '•';
          brailleOutput += `\n${prefix} ${store.convertToBraille(item.textContent || '')}`;
        });

        return brailleOutput;
      },

      generateElementId: (element: HTMLElement): string => {
        return element.id || `braille-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      }
    }),
    {
      name: 'braille-support-store',
      partialize: (state) => ({
        config: state.config,
        bookmarks: Array.from(state.bookmarks.entries()),
      }),
    }
  )
);

// React hook for Braille support
export const useBrailleControls = () => {
  const store = useBrailleSupport();

  const initialize = async () => {
    return await store.initialize();
  };

  const connectDisplay = async (display?: any) => {
    return await store.connect(display);
  };

  const processCurrentPage = () => {
    const store = get();
    const mainContent = document.querySelector('main, #main-content, .main-content, body');

    if (mainContent) {
      const elements = mainContent.querySelectorAll('h1, h2, h3, h4, h5, h6, p, a, button, input, select, textarea, table, img');
      elements.forEach((element) => {
        store.processElement(element as HTMLElement);
      });
    }
  };

  const toggleBraille = () => {
    const store = get();

    if (store.isConnected) {
      store.disconnect();
    } else {
      store.connect();
    }
  };

  const setGrade = (grade: BrailleConfiguration['grade']) => {
    store.updateConfiguration({ grade });
  };

  const setVerbosity = (verbosity: BrailleConfiguration['verbosity']) => {
    store.updateConfiguration({ verbosity });
  };

  return {
    ...store,
    initialize,
    connectDisplay,
    processCurrentPage,
    toggleBraille,
    setGrade,
    setVerbosity,
  };
};

export default useBrailleSupport;