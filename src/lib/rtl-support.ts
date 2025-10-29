// RTL (Right-to-Left) support preparation for future languages
// This file contains utilities and configurations for supporting RTL languages

export interface RTLLanguageConfig {
  code: string;
  name: string;
  direction: 'rtl' | 'ltr';
  fontFamily?: string;
  textAlign: 'right' | 'left';
  // Additional RTL-specific configurations
  mirrorIcons?: boolean;
  flipAnimations?: boolean;
  customCSS?: string;
}

// RTL languages that might be supported in the future
export const futureRTLLanguages: RTLLanguageConfig[] = [
  {
    code: 'ar',
    name: 'Arabic',
    direction: 'rtl',
    fontFamily: '"Noto Sans Arabic", "Arial Unicode MS", sans-serif',
    textAlign: 'right',
    mirrorIcons: true,
    flipAnimations: true,
  },
  {
    code: 'he',
    name: 'Hebrew',
    direction: 'rtl',
    fontFamily: '"Noto Sans Hebrew", "Arial Unicode MS", sans-serif',
    textAlign: 'right',
    mirrorIcons: true,
    flipAnimations: true,
  },
  {
    code: 'fa',
    name: 'Persian (Farsi)',
    direction: 'rtl',
    fontFamily: '"Noto Sans Arabic", "Arial Unicode MS", sans-serif',
    textAlign: 'right',
    mirrorIcons: true,
    flipAnimations: true,
  },
  {
    code: 'ur',
    name: 'Urdu',
    direction: 'rtl',
    fontFamily: '"Noto Nastaliq Urdu", "Arial Unicode MS", sans-serif',
    textAlign: 'right',
    mirrorIcons: true,
    flipAnimations: true,
  },
];

// Current LTR languages
export const currentLanguages: RTLLanguageConfig[] = [
  {
    code: 'en',
    name: 'English',
    direction: 'ltr',
    fontFamily: '"Inter", "Segoe UI", sans-serif',
    textAlign: 'left',
  },
  {
    code: 'pl',
    name: 'Polish',
    direction: 'ltr',
    fontFamily: '"Inter", "Segoe UI", sans-serif',
    textAlign: 'left',
  },
  {
    code: 'ua',
    name: 'Ukrainian',
    direction: 'ltr',
    fontFamily: '"Inter", "Segoe UI", sans-serif',
    textAlign: 'left',
  },
  {
    code: 'ru',
    name: 'Russian',
    direction: 'ltr',
    fontFamily: '"Inter", "Segoe UI", sans-serif',
    textAlign: 'left',
  },
];

// Combined language configurations
export const allLanguageConfigs = [...currentLanguages, ...futureRTLLanguages];

// RTL utility functions
export class RTLSupport {
  /**
   * Check if a language is RTL
   */
  static isRTLLanguage(languageCode: string): boolean {
    const config = allLanguageConfigs.find(lang => lang.code === languageCode);
    return config?.direction === 'rtl' || false;
  }

  /**
   * Get language configuration
   */
  static getLanguageConfig(languageCode: string): RTLLanguageConfig | null {
    return allLanguageConfigs.find(lang => lang.code === languageCode) || null;
  }

  /**
   * Apply RTL/LTR styles to document
   */
  static applyDirectionStyles(languageCode: string): void {
    const config = this.getLanguageConfig(languageCode);
    if (!config) return;

    const html = document.documentElement;
    const body = document.body;

    // Set direction and language attributes
    html.setAttribute('dir', config.direction);
    html.setAttribute('lang', languageCode);
    html.setAttribute('xml:lang', languageCode);

    // Apply direction classes
    html.classList.toggle('rtl', config.direction === 'rtl');
    html.classList.toggle('ltr', config.direction === 'ltr');
    body.classList.toggle('rtl', config.direction === 'rtl');
    body.classList.toggle('ltr', config.direction === 'ltr');

    // Apply custom font family if specified
    if (config.fontFamily) {
      html.style.setProperty('--font-family', config.fontFamily);
    }

    // Apply custom CSS if provided
    if (config.customCSS) {
      let styleElement = document.getElementById('rtl-custom-styles') as HTMLStyleElement;
      if (!styleElement) {
        styleElement = document.createElement('style');
        styleElement.id = 'rtl-custom-styles';
        document.head.appendChild(styleElement);
      }
      styleElement.textContent = config.customCSS;
    }
  }

  /**
   * Get text alignment for a language
   */
  static getTextAlign(languageCode: string): 'left' | 'right' {
    const config = this.getLanguageConfig(languageCode);
    return config?.textAlign || 'left';
  }

  /**
   * Get font family for a language
   */
  static getFontFamily(languageCode: string): string {
    const config = this.getLanguageConfig(languageCode);
    return config?.fontFamily || '"Inter", "Segoe UI", sans-serif';
  }

  /**
   * Check if icons should be mirrored for a language
   */
  static shouldMirrorIcons(languageCode: string): boolean {
    const config = this.getLanguageConfig(languageCode);
    return config?.mirrorIcons || false;
  }

  /**
   * Check if animations should be flipped for a language
   */
  static shouldFlipAnimations(languageCode: string): boolean {
    const config = this.getLanguageConfig(languageCode);
    return config?.flipAnimations || false;
  }

  /**
   * Generate CSS for RTL support
   */
  static generateRTLCSS(languageCode: string): string {
    if (!this.isRTLLanguage(languageCode)) return '';

    return `
      /* RTL Styles for ${languageCode} */

      /* Text alignment */
      .rtl {
        text-align: right;
        direction: rtl;
      }

      /* Margins and padding */
      .rtl .ml-4 { margin-left: 0; margin-right: 1rem; }
      .rtl .mr-4 { margin-right: 0; margin-left: 1rem; }
      .rtl .ml-6 { margin-left: 0; margin-right: 1.5rem; }
      .rtl .mr-6 { margin-right: 0; margin-left: 1.5rem; }
      .rtl .pl-4 { padding-left: 0; padding-right: 1rem; }
      .rtl .pr-4 { padding-right: 0; padding-left: 1rem; }
      .rtl .pl-6 { padding-left: 0; padding-right: 1.5rem; }
      .rtl .pr-6 { padding-right: 0; padding-left: 1.5rem; }

      /* Flexbox */
      .rtl .flex-row { flex-direction: row-reverse; }
      .rtl .justify-start { justify-content: flex-end; }
      .rtl .justify-end { justify-content: flex-start; }

      /* Text alignment utilities */
      .rtl .text-left { text-align: right; }
      .rtl .text-right { text-align: left; }

      /* Border radius for RTL-specific corners */
      .rtl .rounded-l { border-radius: 0 0.375rem 0.375rem 0; }
      .rtl .rounded-r { border-radius: 0.375rem 0 0 0.375rem; }

      /* Icon flipping */
      .rtl .icon-flip {
        transform: scaleX(-1);
      }

      /* Navigation and layout specific RTL adjustments */
      .rtl .nav-item {
        float: right;
        margin-left: 1rem;
        margin-right: 0;
      }

      .rtl .sidebar {
        right: 0;
        left: auto;
      }

      .rtl .content-area {
        margin-right: 250px;
        margin-left: 0;
      }

      /* Form elements */
      .rtl input[type="text"],
      .rtl input[type="email"],
      .rtl input[type="tel"],
      .rtl textarea {
        text-align: right;
      }

      .rtl .form-label {
        float: right;
        text-align: right;
      }

      /* Tables */
      .rtl table th,
      .rtl table td {
        text-align: right;
      }

      /* Lists */
      .rtl ul,
      .rtl ol {
        padding-right: 1.5rem;
        padding-left: 0;
      }

      .rtl li {
        text-align: right;
      }

      /* Specific component adjustments */
      .rtl .dropdown-menu {
        right: 0;
        left: auto;
      }

      .rtl .modal {
        text-align: right;
      }

      .rtl .card {
        text-align: right;
      }

      /* Animations for RTL */
      @keyframes slideInRightRTL {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }

      @keyframes slideInLeftRTL {
        from {
          transform: translateX(-100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }

      .rtl .slide-in-right {
        animation: slideInRightRTL 0.3s ease-out;
      }

      .rtl .slide-in-left {
        animation: slideInLeftRTL 0.3s ease-out;
      }
    `;
  }

  /**
   * Inject RTL CSS into the document
   */
  static injectRTLCSS(languageCode: string): void {
    const css = this.generateRTLCSS(languageCode);
    if (!css) return;

    let styleElement = document.getElementById('rtl-styles') as HTMLStyleElement;
    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = 'rtl-styles';
      styleElement.type = 'text/css';
      document.head.appendChild(styleElement);
    }
    styleElement.textContent = css;
  }

  /**
   * Remove RTL CSS from document
   */
  static removeRTLCSS(): void {
    const styleElement = document.getElementById('rtl-styles');
    if (styleElement) {
      styleElement.remove();
    }
  }

  /**
   * Setup complete RTL support for a language
   */
  static setupRTLSupport(languageCode: string): void {
    if (this.isRTLLanguage(languageCode)) {
      this.applyDirectionStyles(languageCode);
      this.injectRTLCSS(languageCode);
    } else {
      this.applyDirectionStyles(languageCode);
      this.removeRTLCSS();
    }
  }
}

// React hook for RTL support
export function useRTLSupport(languageCode: string) {
  const isRTL = RTLSupport.isRTLLanguage(languageCode);
  const config = RTLSupport.getLanguageConfig(languageCode);

  return {
    isRTL,
    config,
    textAlign: RTLSupport.getTextAlign(languageCode),
    fontFamily: RTLSupport.getFontFamily(languageCode),
    shouldMirrorIcons: RTLSupport.shouldMirrorIcons(languageCode),
    shouldFlipAnimations: RTLSupport.shouldFlipAnimations(languageCode),
    setupRTLSupport: () => RTLSupport.setupRTLSupport(languageCode),
  };
}

// CSS-in-JS utilities for RTL support
export const rtlUtils = {
  // Margin utilities
  margin: (languageCode: string) => ({
    left: RTLSupport.isRTLLanguage(languageCode) ? 'marginRight' : 'marginLeft',
    right: RTLSupport.isRTLLanguage(languageCode) ? 'marginLeft' : 'marginRight',
  }),

  // Padding utilities
  padding: (languageCode: string) => ({
    left: RTLSupport.isRTLLanguage(languageCode) ? 'paddingRight' : 'paddingLeft',
    right: RTLSupport.isRTLLanguage(languageCode) ? 'paddingLeft' : 'paddingRight',
  }),

  // Text alignment
  textAlign: (languageCode: string) => RTLSupport.getTextAlign(languageCode),

  // Flex direction
  flexDirection: (languageCode: string) => RTLSupport.isRTLLanguage(languageCode) ? 'row-reverse' : 'row',
};

// Export default for convenience
export default RTLSupport;